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

const getComplaints = asyncHandler(async (req, res) => {
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
  if (priority) {
    const normalizedPriority = normalizeWorkflowPriority(priority);
    filters.priority = { $in: getPriorityQueryAliases(normalizedPriority) };
  }
  if (assignedTo && mongoose.Types.ObjectId.isValid(assignedTo)) {
    filters.assignedTo = assignedTo;
  }
  if (Object.keys(filters).length) {
    conditions.push(filters);
  }

  if (search) {
    conditions.push({
      $or: [{ title: { $regex: search, $options: "i" } }, { ticketId: { $regex: search, $options: "i" } }],
    });
  }

  const finalQuery = conditions.length ? { $and: conditions } : {};
  const skip = (Number(page) - 1) * Number(limit);
  const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

  const [rows, total] = await Promise.all([
    withComplaintPopulate(Complaint.find(finalQuery)).sort(sort).skip(skip).limit(Number(limit)),
    Complaint.countDocuments(finalQuery),
  ]);

  return sendSuccess(res, {
    message: "Complaints fetched.",
    data: rows,
    meta: {
      page: Number(page),
      limit: Number(limit),
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

  return sendSuccess(res, {
    message: "Complaint fetched.",
    data: complaint,
  });
});

const createComplaint = asyncHandler(async (req, res) => {
  if (!isStudent(req.user)) {
    throw new AppError("Only students can submit complaints.", 403);
  }

  const created = await Complaint.create({
    title: req.body.title,
    description: req.body.description,
    category: req.body.category,
    location: req.body.location,
    priority: normalizeWorkflowPriority(req.body.priority || "MEDIUM"),
    status: "OPEN",
    createdBy: req.user._id,
    attachments: normalizeAttachments(req.files),
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
  if (priority) complaint.priority = normalizeWorkflowPriority(priority);
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

  complaint.status = nextStatus;
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
};
