const User = require("../models/User");
const Complaint = require("../models/Complaint");
const mongoose = require("mongoose");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/constants");
const {
  buildStatusBreakdown,
  getStatusQueryAliases,
  getPriorityQueryAliases,
} = require("../services/complaintWorkflowService");
const { analyzePredictiveMaintenance } = require("../services/predictiveMaintenanceService");

const asList = (value) => String(value || "").split(",").map((item) => item.trim()).filter(Boolean);

const buildAnalyticsMatch = (query = {}) => {
  const match = {};
  const startDate = query.from || query.startDate;
  const endDate = query.to || query.endDate;
  if (startDate || endDate) {
    match.createdAt = {};
    if (startDate && !Number.isNaN(new Date(startDate).getTime())) match.createdAt.$gte = new Date(startDate);
    if (endDate && !Number.isNaN(new Date(endDate).getTime())) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      match.createdAt.$lte = end;
    }
    if (!Object.keys(match.createdAt).length) delete match.createdAt;
  }

  const categories = asList(query.category);
  const departments = asList(query.department);
  const priorities = asList(query.priority);
  const statuses = asList(query.status);
  if (categories.length) match.category = { $in: categories };
  if (departments.length) match.department = { $in: departments };
  if (priorities.length) match.priority = { $in: priorities.flatMap(getPriorityQueryAliases) };
  if (statuses.length) match.status = { $in: statuses.flatMap(getStatusQueryAliases) };
  if (query.staff && mongoose.isValidObjectId(query.staff)) match.assignedTo = new mongoose.Types.ObjectId(query.staff);
  return match;
};

const getAdminDashboard = asyncHandler(async (req, res) => {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const resolvedAndClosed = [...getStatusQueryAliases("RESOLVED"), ...getStatusQueryAliases("CLOSED")];
  const match = buildAnalyticsMatch(req.query);
  const activeStatuses = [...getStatusQueryAliases("OPEN"), ...getStatusQueryAliases("ASSIGNED"), ...getStatusQueryAliases("IN_PROGRESS")];
  const scopedMatch = (extra) => ({ $and: [match, extra] });

  const [statusRows, categoryRows, departmentRows, monthlyRows, staffPerformanceRows, resolutionTimeRows, resolutionTimeSeriesRows, priorityRows, locationRows, slaRows, satisfactionRows] = await Promise.all([
    Complaint.aggregate([{ $match: match }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: { $ifNull: ["$department", "Unassigned"] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([
      { $match: scopedMatch({ createdAt: { $gte: match.createdAt?.$gte || firstMonth } }) },
      {
        $group: {
          _id: {
            year: { $year: "$createdAt" },
            month: { $month: "$createdAt" },
          },
          count: { $sum: 1 },
        },
      },
      { $sort: { "_id.year": 1, "_id.month": 1 } },
    ]),
    Complaint.aggregate([
      { $match: scopedMatch({ assignedTo: { $ne: null } }) },
      {
        $group: {
          _id: "$assignedTo",
          totalAssigned: { $sum: 1 },
          resolvedCount: {
            $sum: {
              $cond: [{ $in: ["$status", resolvedAndClosed] }, 1, 0],
            },
          },
          inProgressCount: {
            $sum: {
              $cond: [{ $in: ["$status", [...getStatusQueryAliases("ASSIGNED"), ...getStatusQueryAliases("IN_PROGRESS")]] }, 1, 0],
            },
          },
          averageRating: { $avg: "$rating" },
          ratingCount: { $sum: { $cond: [{ $ne: ["$rating", null] }, 1, 0] } },
        },
      },
      {
        $lookup: {
          from: "users",
          localField: "_id",
          foreignField: "_id",
          as: "staff",
        },
      },
      { $unwind: "$staff" },
      {
        $project: {
          _id: 0,
          staffId: "$staff._id",
          staffName: "$staff.name",
          totalAssigned: 1,
          resolvedCount: 1,
          inProgressCount: 1,
          averageRating: 1,
          ratingCount: 1,
          completionRate: {
            $multiply: [
              {
                $cond: [{ $eq: ["$totalAssigned", 0] }, 0, { $divide: ["$resolvedCount", "$totalAssigned"] }],
              },
              100,
            ],
          },
        },
      },
      { $sort: { completionRate: -1, totalAssigned: -1 } },
    ]),
    Complaint.aggregate([
      { $match: scopedMatch({ status: { $in: resolvedAndClosed }, resolvedAt: { $ne: null } }) },
      {
        $project: {
          resolutionHours: {
            $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60],
          },
        },
      },
      {
        $group: {
          _id: null,
          averageResolutionHours: { $avg: "$resolutionHours" },
        },
      },
    ]),
    Complaint.aggregate([
      { $match: scopedMatch({ status: { $in: resolvedAndClosed }, resolvedAt: { $ne: null } }) },
      {
        $project: {
          month: { $dateToString: { format: "%Y-%m", date: "$resolvedAt" } },
          resolutionHours: { $divide: [{ $subtract: ["$resolvedAt", "$createdAt"] }, 1000 * 60 * 60] },
        },
      },
      { $group: { _id: "$month", averageResolutionHours: { $avg: "$resolutionHours" } } },
      { $sort: { _id: 1 } },
    ]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: "$priority", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([{ $match: match }, { $group: { _id: { $ifNull: ["$building", "$location"] }, count: { $sum: 1 } } }, { $sort: { count: -1 } }, { $limit: 10 }]),
    Complaint.aggregate([
      { $match: scopedMatch({ status: { $in: activeStatuses } }) },
      { $group: { _id: null, count: { $sum: 1 }, breached: { $sum: { $cond: [{ $lt: ["$slaDeadline", now] }, 1, 0] } } } },
    ]),
    Complaint.aggregate([
      { $match: scopedMatch({ rating: { $ne: null } }) },
      { $group: { _id: "$resolvedSuccessfully", count: { $sum: 1 }, averageRating: { $avg: "$rating" } } },
    ]),
  ]);

  const categoryBreakdown = categoryRows.map((row) => ({ name: row._id, value: row.count }));
  const departmentBreakdown = departmentRows.map((row) => ({ name: row._id, value: row.count }));
  const monthlyComplaints = monthlyRows.map((row) => ({
    month: `${String(row._id.month).padStart(2, "0")}/${row._id.year}`,
    count: row.count,
  }));
  const averageResolutionHours = Number(resolutionTimeRows[0]?.averageResolutionHours || 0);
  const statusBreakdown = buildStatusBreakdown(statusRows);
  const total = statusRows.reduce((sum, row) => sum + Number(row.count || 0), 0);
  const slaBreached = Number(slaRows[0]?.breached || 0);

  return sendSuccess(res, {
    message: "Admin dashboard fetched.",
    data: {
      totalComplaints: total,
      summaryCards: {
        totalComplaints: total,
        openComplaints: statusBreakdown.OPEN,
        assignedComplaints: statusBreakdown.ASSIGNED,
        inProgress: statusBreakdown.IN_PROGRESS,
        resolvedComplaints: statusBreakdown.RESOLVED,
        closedComplaints: statusBreakdown.CLOSED,
        slaBreached,
        averageResolutionHours: Number.isFinite(averageResolutionHours) ? averageResolutionHours : 0,
      },
      statusBreakdown,
      categoryBreakdown,
      monthlyComplaints,
      staffPerformance: staffPerformanceRows,
      averageResolutionHours: Number.isFinite(averageResolutionHours) ? averageResolutionHours : 0,
      resolutionTimeSeries: resolutionTimeSeriesRows.map((row) => ({ month: row._id, averageHours: Number(row.averageResolutionHours || 0) })),
      departmentBreakdown,
      priorityBreakdown: priorityRows.map((row) => ({ name: row._id || "Unknown", value: row.count })),
      locationBreakdown: locationRows.map((row) => ({ name: row._id || "Unknown", value: row.count })),
      slaBreakdown: [
        { name: "On Track", value: Math.max(0, Number(slaRows[0]?.count || 0) - slaBreached) },
        { name: "Breached", value: slaBreached },
      ],
      satisfactionBreakdown: satisfactionRows.map((row) => ({ name: row._id === true ? "Resolved" : "Not Resolved", value: row.count, averageRating: row.averageRating })),
    },
  });
});

const getPredictiveMaintenance = asyncHandler(async (req, res) => {
  const months = Math.min(12, Math.max(3, Number(req.query.months) || 6));
  const since = new Date();
  since.setMonth(since.getMonth() - months + 1);
  const complaints = await Complaint.find({ createdAt: { $gte: since } })
    .select("category department building location area createdAt")
    .lean();

  return sendSuccess(res, {
    message: "Predictive maintenance recommendations generated.",
    data: analyzePredictiveMaintenance(complaints, { months }),
  });
});

const createStaffAccount = asyncHandler(async (req, res) => {
  const { name, email, password, department } = req.body;
  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use.", 409);
  }

  const staff = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: ROLES.STAFF,
    department,
  });

  return sendSuccess(res, {
    statusCode: 201,
    message: "Staff account created.",
    data: staff.toSafeObject(),
  });
});

const getUsers = asyncHandler(async (req, res) => {
  const { role, q = "", page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (role) {
    const normalizedRole = String(role).toLowerCase();
    query.role = { $in: [normalizedRole, normalizedRole.charAt(0).toUpperCase() + normalizedRole.slice(1)] };
  }
  if (q) {
    query.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  }

  const [users, total] = await Promise.all([
    User.find(query).sort({ createdAt: -1 }).skip(skip).limit(Number(limit)),
    User.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Users fetched.",
    data: users.map((user) => user.toSafeObject()),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

const updateUserRole = asyncHandler(async (req, res) => {
  const { role } = req.body;
  const normalizedRole = String(role || "").toLowerCase();
  if (!Object.values(ROLES).includes(normalizedRole)) {
    throw new AppError("Invalid role.", 400);
  }

  const user = await User.findById(req.params.id);
  if (!user) {
    throw new AppError("User not found.", 404);
  }

  user.role = normalizedRole;
  await user.save();

  return sendSuccess(res, {
    message: "User role updated.",
    data: user.toSafeObject(),
  });
});

module.exports = {
  getAdminDashboard,
  getPredictiveMaintenance,
  createStaffAccount,
  getUsers,
  updateUserRole,
};
