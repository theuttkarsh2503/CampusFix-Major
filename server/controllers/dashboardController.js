const Complaint = require("../models/Complaint");
const User = require("../models/User");
const asyncHandler = require("../middleware/asyncHandler");
const { sendSuccess } = require("../utils/apiResponse");
const { ROLES } = require("../utils/constants");
const { buildStatusBreakdown } = require("../services/complaintWorkflowService");

const buildRoleMatch = (user) => {
  if (user.role === ROLES.ADMIN) return {};
  if (user.role === ROLES.STAFF) return { assignedTo: user._id };
  return { createdBy: user._id };
};

const getStats = asyncHandler(async (req, res) => {
  const roleMatch = buildRoleMatch(req.user);
  const now = new Date();
  const firstMonth = new Date(now.getFullYear(), now.getMonth() - 11, 1);

  const [total, statuses, categories, monthly, recent, assignableUsers] = await Promise.all([
    Complaint.countDocuments(roleMatch),
    Complaint.aggregate([{ $match: roleMatch }, { $group: { _id: "$status", count: { $sum: 1 } } }]),
    Complaint.aggregate([
      { $match: roleMatch },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]),
    Complaint.aggregate([
      {
        $match: {
          ...roleMatch,
          createdAt: { $gte: firstMonth },
        },
      },
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
    Complaint.find(roleMatch)
      .populate("assignedTo", "name")
      .sort({ createdAt: -1 })
      .limit(6)
      .select("ticketId title category status priority createdAt assignedTo"),
    req.user.role === ROLES.ADMIN
      ? User.find({ role: { $in: [ROLES.STAFF, "Staff"] } }).sort({ name: 1 }).select("name email role")
      : [],
  ]);

  const statusBreakdown = buildStatusBreakdown(statuses);

  const categoryBreakdown = categories.map((row) => ({ name: row._id, value: row.count }));
  const monthlyComplaints = monthly.map((row) => ({
    month: `${String(row._id.month).padStart(2, "0")}/${row._id.year}`,
    count: row.count,
  }));

  return sendSuccess(res, {
    message: "Dashboard stats fetched.",
    data: {
      totalComplaints: total,
      statusBreakdown,
      categoryBreakdown,
      monthlyComplaints,
      recentComplaints: recent,
      summaryCards: {
        totalComplaints: total,
        openComplaints: statusBreakdown.OPEN,
        assignedComplaints: statusBreakdown.ASSIGNED,
        inProgress: statusBreakdown.IN_PROGRESS,
        resolvedComplaints: statusBreakdown.RESOLVED,
        closedComplaints: statusBreakdown.CLOSED,
      },
      assignableUsers,
    },
  });
});

module.exports = { getStats };
