const Notification = require("../models/Notification");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");

const getNotifications = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const [notifications, total, unread] = await Promise.all([
    Notification.find({ userId: req.user._id })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    Notification.countDocuments({ userId: req.user._id }),
    Notification.countDocuments({ userId: req.user._id, isRead: false }),
  ]);

  return sendSuccess(res, {
    message: "Notifications fetched.",
    data: notifications,
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
      unread,
    },
  });
});

const markNotificationsRead = asyncHandler(async (req, res) => {
  const { ids, markAll } = req.body;

  const query = { userId: req.user._id };
  if (!markAll) {
    if (!Array.isArray(ids) || ids.length === 0) {
      return sendSuccess(res, { message: "No notifications selected." });
    }
    query._id = { $in: ids };
  }

  await Notification.updateMany(query, { $set: { isRead: true } });

  return sendSuccess(res, {
    message: "Notifications marked as read.",
  });
});

module.exports = {
  getNotifications,
  markNotificationsRead,
};
