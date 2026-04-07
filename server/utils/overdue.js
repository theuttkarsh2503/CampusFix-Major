const Complaint = require("../models/Complaint");
const logger = require("./logger");

const PENDING_HOURS = 48;
const IN_PROGRESS_HOURS = 72;

const markOverdueComplaints = async () => {
  const now = new Date();
  const pendingThreshold = new Date(now.getTime() - PENDING_HOURS * 60 * 60 * 1000);
  const inProgressThreshold = new Date(now.getTime() - IN_PROGRESS_HOURS * 60 * 60 * 1000);

  const pendingResult = await Complaint.updateMany(
    {
      status: "Pending",
      createdAt: { $lte: pendingThreshold },
    },
    { $set: { status: "Overdue" } },
  );

  const inProgressResult = await Complaint.updateMany(
    {
      status: "In Progress",
      updatedAt: { $lte: inProgressThreshold },
    },
    { $set: { status: "Overdue" } },
  );

  const updatedCount = pendingResult.modifiedCount + inProgressResult.modifiedCount;
  if (updatedCount > 0) {
    logger.info(`Overdue sync updated ${updatedCount} complaints.`);
  }
};

module.exports = { markOverdueComplaints };
