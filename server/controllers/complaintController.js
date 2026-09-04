const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/constants");
const { pushNotification } = require("../utils/notificationService");
const {
  normalizeWorkflowPriority,
  normalizeWorkflowStatus,
  getPriorityQueryAliases,
  getStatusQueryAliases,
  } = require("../services/complaintWorkflowService");
const { classifyComplaint, getDepartmentForCategory } = require("../services/complaintClassificationService");
const { calculateSlaDeadline, getSlaStatus } = require("../services/slaService");
const { findSimilarComplaints } = require("../services/duplicateDetectionService");
const { addTimelineEvent, getComplaintTimeline } = require("../services/complaintTimelineService");

const normalizeAttachments = (files = []) =>
  files.map((file) => ({
    fileName: file.originalname,
    fileUrl: `/uploads/complaints/${file.filename}`,
    mimeType: file.mimetype,
    size: file.size,
  }));

const isAdmin = (user) => user.role === ROLES.ADMIN;
const isStaff = (user) => user.role === ROLES.STAFF;
const isStudent = (user) => user.role === ROLES.STUDENT;

const buildAccessQuery = (user) => {
  if (isAdmin(user)) return {};
  if (isStaff(user)) return { assignedTo: user._id };
  return { createdBy: user._id };
};

const emitComplaintUpdate = (io, complaint) => {
  if (!io) return;
  io.to(`user:${String(complaint.createdBy)}`).emit("complaint:updated", complaint);
  if (complaint.assignedTo) {
    io.to(`user:${String(complaint.assignedTo)}`).emit("complaint:updated", complaint);
  }
};

const withComplaintPopulate = (query) =>
  query
    .populate("createdBy", "name email role department")
    .populate("assignedTo", "name email role")
    .populate({
      path: "comments",
      populate: { path: "userId", select: "name role" },
    });

const addSlaStatus = (complaint) => {
  if (complaint) complaint.slaStatus = getSlaStatus(complaint);
  return complaint;
};

const escapeRegex = (value) => String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const buildSlaFilter = (slaStatus) => {
  const now = new Date();
  const active = { $in: [...getStatusQueryAliases("OPEN"), ...getStatusQueryAliases("ASSIGNED"), ...getStatusQueryAliases("IN_PROGRESS")] };
  if (slaStatus === "RESOLVED") return { status: { $in: [...getStatusQueryAliases("RESOLVED"), ...getStatusQueryAliases("CLOSED")] } };
  if (slaStatus === "BREACHED") return { status: active, slaDeadline: { $lte: now } };
  const dueSoon = ["HIGH", "MEDIUM", "LOW"].map((priority) => {
    const hours = priority === "HIGH" ? 4 : priority === "LOW" ? 72 : 24;
    const windowEnd = new Date(now.getTime() + Math.max(60 * 60 * 1000, hours * 60 * 60 * 1000 * 0.2));
    return { priority: { $in: getPriorityQueryAliases(priority) }, status: active, slaDeadline: { $gt: now, $lte: windowEnd } };
  });
  if (slaStatus === "DUE_SOON") return { $or: dueSoon };
  const onTrack = ["HIGH", "MEDIUM", "LOW"].map((priority) => {
    const hours = priority === "HIGH" ? 4 : priority === "LOW" ? 72 : 24;
    const dueSoonEnd = new Date(now.getTime() + Math.max(60 * 60 * 1000, hours * 60 * 60 * 1000 * 0.2));
    return { priority: { $in: getPriorityQueryAliases(priority) }, status: active, slaDeadline: { $gt: dueSoonEnd } };
  });
  return { $or: [...onTrack, { status: active, slaDeadline: null }] };
};

const buildComplaintQuery = async (req) => {
  const {
    page = 1,
    limit = 10,
    status,
    category,
    priority,
    search,
    sortBy = "createdAt",
    sortOrder = "desc",
    assignedTo,
    department,
    dateFrom,
    dateTo,
    slaStatus,
  } = req.query;

  const conditions = [];
  const roleQuery = buildAccessQuery(req.user);
  if (Object.keys(roleQuery).length) {
    conditions.push(roleQuery);
  }

  const filters = {};
  if (status) {
    const normalizedStatus = normalizeWorkflowStatus(status);
    filters.status = { $in: getStatusQueryAliases(normalizedStatus) };
  }
  if (category) filters.category = category;
  if (department) filters.department = department;
  if (priority) {
    const normalizedPriority = normalizeWorkflowPriority(priority);
    filters.priority = { $in: getPriorityQueryAliases(normalizedPriority) };
  }
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    filters.assignedTo = assignedTo;
  }
  if (dateFrom || dateTo) {
    filters.createdAt = {};
    if (dateFrom) filters.createdAt.$gte = new Date(dateFrom);
    if (dateTo) {
      const end = new Date(dateTo);
      end.setHours(23, 59, 59, 999);
      filters.createdAt.$lte = end;
    }
  }
  if (Object.keys(filters).length) {
    conditions.push(filters);
  }

  if (search) {
    const pattern = escapeRegex(String(search).slice(0, 100));
    const matchingUsers = await User.find({
      $or: [
        { name: { $regex: pattern, $options: "i" } },
        { email: { $regex: pattern, $options: "i" } },
        { department: { $regex: pattern, $options: "i" } },
      ],
    }).select("_id").limit(100).lean();
    const userIds = matchingUsers.map((user) => user._id);
    conditions.push({
      $or: [
        { title: { $regex: pattern, $options: "i" } },
        { description: { $regex: pattern, $options: "i" } },
        { ticketId: { $regex: pattern, $options: "i" } },
        { location: { $regex: pattern, $options: "i" } },
        { department: { $regex: pattern, $options: "i" } },
        ...(userIds.length ? [{ createdBy: { $in: userIds } }, { assignedTo: { $in: userIds } }] : []),
      ],
    });
  }
  if (["ON_TRACK", "DUE_SOON", "BREACHED", "RESOLVED"].includes(slaStatus)) conditions.push(buildSlaFilter(slaStatus));

  const finalQuery = conditions.length ? { $and: conditions } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  return { finalQuery, sort, skip, page: Number(page), limit: Number(limit) };
};

const getComplaints = asyncHandler(async (req, res) => {
  const { finalQuery, sort, skip, page, limit } = await buildComplaintQuery(req);
  const [rows, total] = await Promise.all([
    withComplaintPopulate(Complaint.find(finalQuery)).sort(sort).skip(skip).limit(limit),
    Complaint.countDocuments(finalQuery),
  ]);

  rows.forEach(addSlaStatus);

  return sendSuccess(res, {
    message: "Complaints fetched.",
    data: rows,
    meta: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await withComplaintPopulate(Complaint.findById(req.params.id));
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  const allowed =
    isAdmin(req.user) ||
    complaint.createdBy?._id?.toString() === req.user._id.toString() ||
    complaint.assignedTo?._id?.toString() === req.user._id.toString();

  if (!allowed) {
    throw new AppError("Forbidden.", 403);
  }

  addSlaStatus(complaint);
  complaint.timeline = getComplaintTimeline(complaint);

  return sendSuccess(res, {
    message: "Complaint fetched.",
    data: complaint,
  });
});

const createComplaint = asyncHandler(async (req, res) => {
  if (!isStudent(req.user)) {
    throw new AppError("Only students can submit complaints.", 403);
  }

  const classification = classifyComplaint(req.body);
  const category = req.body.category || classification.suggestedCategory;
  const hasUserPriority = Boolean(req.body.priority);
  const structuredLocation = [req.body.building, req.body.floor, req.body.area].filter(Boolean).join(" / ");
  const created = await Complaint.create({
    title: req.body.title,
    description: req.body.description,
    category,
    location: structuredLocation || req.body.location,
    building: req.body.building || "",
    floor: req.body.floor || "",
    area: req.body.area || req.body.location || "",
    department: req.body.department || getDepartmentForCategory(category),
    priority: normalizeWorkflowPriority(req.body.priority || classification.suggestedPriority),
    prioritySource: hasUserPriority ? "USER" : "SYSTEM",
    priorityConfidence: hasUserPriority ? 100 : classification.suggestedPriorityConfidence,
    classification,
    slaDeadline: calculateSlaDeadline(new Date(), req.body.priority || classification.suggestedPriority),
    status: "OPEN",
    createdBy: req.user._id,
    attachments: normalizeAttachments(req.files),
    timeline: [{ eventType: "CREATED", title: "Complaint Created", actorId: req.user._id, actorName: req.user.name }],
  });

  const io = req.app.get("io");
  const admins = await User.find({ role: { $in: [ROLES.ADMIN, "Admin"] } }).select("_id");
  await Promise.all(
    admins.map((admin) =>
      pushNotification({
        io,
        userId: admin._id,
        message: `New complaint ${created.ticketId} submitted by ${req.user.name}.`,
        meta: { complaintId: created._id, type: "new_complaint" },
      }),
    ),
  );

  return sendSuccess(res, {
    statusCode: 201,
    message: "Complaint submitted successfully.",
    data: created,
  });
});

const findDuplicateComplaints = asyncHandler(async (req, res) => {
  const recentSince = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
  const complaints = await Complaint.find({
    status: { $in: ["OPEN", "ASSIGNED", "IN_PROGRESS"] },
    createdAt: { $gte: recentSince },
  }).select("ticketId title category location description status createdAt");
  const matches = findSimilarComplaints(req.body, complaints).slice(0, 5).map(({ complaint, similarity }) => ({
    id: complaint._id,
    ticketId: complaint.ticketId,
    title: complaint.title,
    category: complaint.category,
    location: complaint.location,
    status: complaint.status,
    createdAt: complaint.createdAt,
    similarity,
  }));

  return sendSuccess(res, { message: "Duplicate check completed.", data: matches });
});

const submitComplaintFeedback = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found.", 404);
  if (complaint.createdBy.toString() !== req.user._id.toString()) {
    throw new AppError("Only the complaint creator can submit feedback.", 403);
  }
  if (complaint.status !== "CLOSED") {
    throw new AppError("Feedback can be submitted after the complaint is closed.", 400);
  }
  if (complaint.submittedAt) {
    throw new AppError("Feedback has already been submitted for this complaint.", 409);
  }

  complaint.rating = req.body.rating;
  complaint.feedback = req.body.feedback || "";
  complaint.resolvedSuccessfully = req.body.resolvedSuccessfully;
  complaint.submittedAt = new Date();
  addTimelineEvent(complaint, {
    eventType: "FEEDBACK",
    title: "Student Confirmed Resolution",
    actorId: req.user._id,
    actorName: req.user.name,
  });
  await complaint.save();

  const io = req.app.get("io");
  if (complaint.assignedTo) {
    await pushNotification({
      io,
      userId: complaint.assignedTo,
      message: `New feedback received for complaint ${complaint.ticketId}.`,
      meta: { complaintId: complaint._id, type: "feedback" },
    });
  }

  return sendSuccess(res, { message: "Feedback submitted successfully.", data: complaint });
});

const updateComplaintDepartment = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  complaint.department = req.body.department;
  addTimelineEvent(complaint, { eventType: "DEPARTMENT_CHANGED", title: "Department Updated", actorId: req.user._id, actorName: req.user.name });
  await complaint.save();
  const updated = await withComplaintPopulate(Complaint.findById(complaint._id));

  return sendSuccess(res, {
    message: "Complaint department updated.",
    data: updated,
  });
});

const csvCell = (value) => {
  const text = String(value ?? "");
  const safeText = /^[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
};

const exportComplaints = asyncHandler(async (req, res) => {
  const { finalQuery, sort } = await buildComplaintQuery(req);
  const complaints = await withComplaintPopulate(Complaint.find(finalQuery).sort(sort).limit(50000));
  complaints.forEach(addSlaStatus);
  const headers = ["Complaint ID", "Title", "Description", "Student", "Category", "Department", "Priority", "Status", "SLA State", "Location", "Assigned Staff", "Created At", "Resolved At", "Closed At"];
  const rows = complaints.map((complaint) => [
    complaint.ticketId,
    complaint.title,
    complaint.description,
    complaint.createdBy?.name,
    complaint.category,
    complaint.department,
    complaint.priority,
    normalizeWorkflowStatus(complaint.status),
    complaint.slaStatus,
    complaint.location,
    complaint.assignedTo?.name,
    complaint.createdAt?.toISOString(),
    complaint.resolvedAt?.toISOString(),
    complaint.closedAt?.toISOString(),
  ].map(csvCell).join(","));
  const csv = [headers.map(csvCell).join(","), ...rows].join("\r\n");
  res.setHeader("Content-Type", "text/csv; charset=utf-8");
  res.setHeader("Content-Disposition", `attachment; filename="campusfix-complaints-${new Date().toISOString().slice(0, 10)}.csv"`);
  return res.send(`\ufeff${csv}`);
});

const updateComplaintPriority = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  complaint.priority = normalizeWorkflowPriority(req.body.priority);
  complaint.prioritySource = "ADMIN";
  complaint.priorityConfidence = 100;
  complaint.slaDeadline = calculateSlaDeadline(complaint.createdAt, complaint.priority);
  complaint.slaStatus = "ON_TRACK";
  addTimelineEvent(complaint, { eventType: "PRIORITY_CHANGED", title: "Priority Updated", actorId: req.user._id, actorName: req.user.name });
  await complaint.save();
  const updated = await withComplaintPopulate(Complaint.findById(complaint._id));

  return sendSuccess(res, {
    message: "Complaint priority updated.",
    data: updated,
  });
});

const escalateComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) throw new AppError("Complaint not found.", 404);

  const userRole = String(req.user.role || "").toLowerCase();
  const isAssignedStaff = userRole === ROLES.STAFF && complaint.assignedTo?.toString() === req.user._id.toString();
  if (userRole !== ROLES.ADMIN && !isAssignedStaff) {
    throw new AppError("Only assigned staff or admin can escalate this complaint.", 403);
  }

  complaint.escalationLevel = Math.max(complaint.escalationLevel || 0, userRole === ROLES.STAFF ? 1 : 2);
  complaint.isEscalated = true;
  if (req.body.reason !== undefined) complaint.escalatedReason = req.body.reason || "";
  addTimelineEvent(complaint, { eventType: "ESCALATED", title: "Complaint Escalated", description: req.body.reason || "", actorId: req.user._id, actorName: req.user.name });
  await complaint.save();

  const io = req.app.get("io");
  const admins = await User.find({ role: { $in: [ROLES.ADMIN, "Admin"] } }).select("_id");
  await Promise.all(admins.map((admin) => pushNotification({
    io,
    userId: admin._id,
    message: `Complaint ${complaint.ticketId} was escalated for review.`,
    meta: { complaintId: complaint._id, type: "escalation" },
  })));

  return sendSuccess(res, { message: "Complaint escalated successfully.", data: addSlaStatus(complaint) });
});

const assignComplaint = asyncHandler(async (req, res) => {
  if (!isAdmin(req.user)) {
    throw new AppError("Only admin can assign complaints.", 403);
  }

  const { staffId, priority, escalate, escalatedReason } = req.body;
  const complaint = req.complaint || (await Complaint.findById(req.params.id));
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  const staff = await User.findById(staffId);
  if (!staff || String(staff.role || "").toLowerCase() !== ROLES.STAFF) {
    throw new AppError("Invalid staff user.", 400);
  }

  complaint.assignedTo = staff._id;
  complaint.status = "ASSIGNED";
  addTimelineEvent(complaint, { eventType: "ASSIGNED", title: "Complaint Assigned", description: `Assigned to ${staff.name}.`, actorId: req.user._id, actorName: req.user.name });
  if (priority) {
    complaint.priority = normalizeWorkflowPriority(priority);
    complaint.prioritySource = "ADMIN";
    complaint.priorityConfidence = 100;
    complaint.slaDeadline = calculateSlaDeadline(complaint.createdAt, complaint.priority);
    complaint.slaStatus = "ON_TRACK";
  }
  if (typeof escalate === "boolean") complaint.isEscalated = escalate;
  if (escalatedReason !== undefined) complaint.escalatedReason = escalatedReason || "";
  await complaint.save();

  const io = req.app.get("io");
  await Promise.all([
    pushNotification({
      io,
      userId: staff._id,
      message: `Complaint ${complaint.ticketId} assigned to you.`,
      meta: { complaintId: complaint._id, type: "assigned" },
    }),
    pushNotification({
      io,
      userId: complaint.createdBy,
      message: `Your complaint ${complaint.ticketId} has been assigned to staff.`,
      meta: { complaintId: complaint._id, type: "status_change" },
    }),
  ]);

  const updated = await withComplaintPopulate(Complaint.findById(complaint._id));
  emitComplaintUpdate(io, updated);

  return sendSuccess(res, {
    message: "Complaint assigned successfully.",
    data: updated,
  });
});

const updateComplaintStatus = asyncHandler(async (req, res) => {
  const complaint = req.complaint || (await Complaint.findById(req.params.id));
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  const nextStatus = normalizeWorkflowStatus(req.body.status);
  const previousStatus = normalizeWorkflowStatus(complaint.status);

  complaint.status = nextStatus;
  if (previousStatus !== nextStatus) {
    const statusEvents = {
      IN_PROGRESS: { eventType: "IN_PROGRESS", title: "Staff Started Work" },
      RESOLVED: { eventType: "RESOLVED", title: "Marked Resolved" },
      CLOSED: { eventType: "CLOSED", title: "Complaint Closed" },
    };
    const event = statusEvents[nextStatus] || { eventType: nextStatus, title: `Status changed to ${nextStatus}` };
    addTimelineEvent(complaint, { ...event, actorId: req.user._id, actorName: req.user.name });
  }
  if (req.body.resolutionNotes !== undefined) {
    complaint.resolutionNotes = req.body.resolutionNotes || "";
  }
  if (req.files?.length) {
    complaint.attachments = [...complaint.attachments, ...normalizeAttachments(req.files)];
  }
  await complaint.save();

  const io = req.app.get("io");
  const recipients = new Set([String(complaint.createdBy)]);
  if (complaint.assignedTo) recipients.add(String(complaint.assignedTo));
  recipients.delete(String(req.user._id));

  const actorLabel = isAdmin(req.user) ? "Admin" : "Staff";
  await Promise.all(
    Array.from(recipients).map((recipientUserId) =>
      pushNotification({
        io,
        userId: recipientUserId,
        message: `${actorLabel} updated complaint ${complaint.ticketId} to ${nextStatus}.`,
        meta: { complaintId: complaint._id, type: "status_change" },
      }),
    ),
  );

  const updated = await withComplaintPopulate(Complaint.findById(complaint._id));
  emitComplaintUpdate(io, updated);

  return sendSuccess(res, {
    message: "Complaint status updated.",
    data: updated,
  });
});

const deleteComplaint = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  await complaint.deleteOne();
  return sendSuccess(res, {
    message: "Complaint deleted successfully.",
    data: { id: req.params.id },
  });
});

module.exports = {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
  updateComplaintDepartment,
  updateComplaintPriority,
  escalateComplaint,
  findDuplicateComplaints,
  submitComplaintFeedback,
  exportComplaints,
};
