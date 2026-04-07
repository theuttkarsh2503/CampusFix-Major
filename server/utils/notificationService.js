const Notification = require("../models/Notification");

const buildPayload = (notification) => ({
  id: notification._id,
  userId: notification.userId,
  message: notification.message,
  isRead: notification.isRead,
  meta: notification.meta,
  createdAt: notification.createdAt,
});

const pushNotification = async ({ io, userId, message, meta = {} }) => {
  const created = await Notification.create({ userId, message, meta });
  if (io) {
    io.to(`user:${String(userId)}`).emit("notification:new", buildPayload(created));
  }
  return created;
};

module.exports = { pushNotification, buildPayload };
