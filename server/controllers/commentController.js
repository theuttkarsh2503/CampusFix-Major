const Comment = require("../models/Comment");
const Complaint = require("../models/Complaint");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/constants");
const { pushNotification } = require("../utils/notificationService");

const canAccessComplaint = (complaint, user) => {
  if (user.role === ROLES.ADMIN) return true;
  if (user.role === ROLES.STUDENT) return complaint.createdBy.toString() === user._id.toString();
  if (user.role === ROLES.STAFF) return complaint.assignedTo?.toString() === user._id.toString();
  return false;
};

const addComment = asyncHandler(async (req, res) => {
  const { complaintId, message } = req.body;
  const complaint = await Complaint.findById(complaintId);

  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }
  if (!canAccessComplaint(complaint, req.user)) {
    throw new AppError("Forbidden.", 403);
  }

  const comment = await Comment.create({
    complaintId: complaint._id,
    userId: req.user._id,
    message,
  });

  complaint.comments.push(comment._id);
  await complaint.save();

  const io = req.app.get("io");
  const recipients = [String(complaint.createdBy)];
  if (complaint.assignedTo) recipients.push(String(complaint.assignedTo));
  const uniqueRecipients = [...new Set(recipients)].filter((id) => id !== String(req.user._id));

  await Promise.all(
    uniqueRecipients.map((userId) =>
      pushNotification({
        io,
        userId,
        message: `New comment on complaint ${complaint.ticketId}.`,
        meta: { complaintId: complaint._id, type: "comment" },
      }),
    ),
  );

  const populated = await Comment.findById(comment._id).populate("userId", "name role");
  if (io) {
    io.to(`complaint:${String(complaint._id)}`).emit("comment:new", populated);
    uniqueRecipients.forEach((userId) => {
      io.to(`user:${userId}`).emit("comment:new", populated);
    });
  }

  return sendSuccess(res, {
    statusCode: 201,
    message: "Comment added successfully.",
    data: populated,
  });
});

const getComments = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.complaintId);
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }
  if (!canAccessComplaint(complaint, req.user)) {
    throw new AppError("Forbidden.", 403);
  }

  const comments = await Comment.find({ complaintId: complaint._id })
    .populate("userId", "name role")
    .sort({ createdAt: 1 });

  return sendSuccess(res, {
    message: "Comments fetched.",
    data: comments,
  });
});

module.exports = { addComment, getComments };
