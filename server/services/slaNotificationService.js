const cron = require("node-cron");
const Complaint = require("../models/Complaint");
const Notification = require("../models/Notification");
const User = require("../models/User");
const { ROLES } = require("../utils/constants");
const { pushNotification } = require("../utils/notificationService");

const notifyBreachedComplaints = async (io) => {
  const now = new Date();
  const complaints = await Complaint.find({
    slaDeadline: { $lte: now },
    status: { $nin: ["RESOLVED", "CLOSED"] },
    slaStatus: { $ne: "BREACHED" },
  }).select("_id ticketId createdBy assignedTo slaStatus");
  if (!complaints.length) return;

  const admins = await User.find({ role: { $in: [ROLES.ADMIN, "Admin"] } }).select("_id");
  for (const complaint of complaints) {
    complaint.slaStatus = "BREACHED";
    await complaint.save();

    const recipients = new Set([String(complaint.createdBy)]);
    if (complaint.assignedTo) recipients.add(String(complaint.assignedTo));
    admins.forEach((admin) => recipients.add(String(admin._id)));

    const existing = await Notification.exists({ "meta.complaintId": complaint._id, "meta.type": "sla_breach" });
    if (existing) continue;
    await Promise.all([...recipients].map((userId) => pushNotification({
      io,
      userId,
      message: `Complaint ${complaint.ticketId} has breached its SLA.`,
      meta: { complaintId: complaint._id, type: "sla_breach" },
    })));
  }
};

const startSlaNotificationMonitor = (io) => {
  const task = cron.schedule("* * * * *", () => notifyBreachedComplaints(io).catch(() => {}));
  notifyBreachedComplaints(io).catch(() => {});
  return task;
};

module.exports = { notifyBreachedComplaints, startSlaNotificationMonitor };
