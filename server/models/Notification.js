const mongoose = require("mongoose");

const notificationSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 500,
    },
    isRead: {
      type: Boolean,
      default: false,
      index: true,
    },
    meta: {
      complaintId: { type: mongoose.Schema.Types.ObjectId, ref: "Complaint", default: null },
      type: { type: String, default: "general" },
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Notification", notificationSchema);
