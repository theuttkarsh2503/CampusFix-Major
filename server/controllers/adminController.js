const User = require("../models/User");
const Complaint = require("../models/Complaint");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/constants");
const {
  buildStatusBreakdown,
  getStatusQueryAliases,
} = require("../services/complaintWorkflowService");

const getAdminDashboard = asyncHandler(async (_req, res) => {
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);
  const resolvedAndClosed = [...getStatusQueryAliases("RESOLVED"), ...getStatusQueryAliases("CLOSED")];

  const [total, statusRows, categoryRows, monthlyRows, staffPerformanceRows, resolutionTimeRows] = await Promise.all([
    Complaint.countDocuments(),
    Complaint.aggregate([{ $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([{ $group: { _id: "$category", count: { $sum: 1 } } }, { $sort: { count: -1 } }]),
    Complaint.aggregate([
      { $match: { createdAt: { $gte: firstMonth } } },
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
      { $match: { assignedTo: { $ne: null } } },
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
      {
        $match: {
          status: { $in: resolvedAndClosed },
          resolvedAt: { $ne: null },
        },
      },
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
  ]);

  const statusBreakdown = buildStatusBreakdown(statusRows);

  const categoryBreakdown = categoryRows.map((row) => ({ name: row._id, value: row.count }));
  const monthlyComplaints = monthlyRows.map((row) => ({
    month: `${String(row._id.month).padStart(2, "0")}/${row._id.year}`,
    count: row.count,
  }));
  const averageResolutionHours = Number(resolutionTimeRows[0]?.averageResolutionHours || 0);

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
      },
      statusBreakdown,
      categoryBreakdown,
      monthlyComplaints,
      staffPerformance: staffPerformanceRows,
      averageResolutionHours: Number.isFinite(averageResolutionHours) ? averageResolutionHours : 0,
    },
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
  createStaffAccount,
  getUsers,
  updateUserRole,
};
