const Complaint = require("../models/Complaint");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");
const { ROLES } = require("../utils/constants");
const {
  canTransitionStatus,
  normalizeWorkflowStatus,
  isClosedStatus,
} = require("../services/complaintWorkflowService");

const loadComplaintById = asyncHandler(async (req, _res, next) => {
  const complaint = await Complaint.findById(req.params.id);
  if (!complaint) {
    throw new AppError("Complaint not found.", 404);
  }

  complaint.status = normalizeWorkflowStatus(complaint.status);
  req.complaint = complaint;
  next();
});

const validateAssignTransition = asyncHandler(async (req, _res, next) => {
  const currentStatus = normalizeWorkflowStatus(req.complaint?.status);
  if (isClosedStatus(currentStatus)) {
    throw new AppError("Closed complaints cannot be reassigned.", 400);
  }
  if (!canTransitionStatus(currentStatus, "ASSIGNED")) {
    throw new AppError(`Invalid status transition: ${currentStatus} -> ASSIGNED`, 400);
  }

  next();
});

const validateStatusTransition = asyncHandler(async (req, _res, next) => {
  const complaint = req.complaint;
  const currentStatus = normalizeWorkflowStatus(complaint?.status);
  const nextStatus = normalizeWorkflowStatus(req.body.status);

  if (!nextStatus) {
    throw new AppError("Status is required.", 400);
  }

  if (isClosedStatus(currentStatus)) {
    throw new AppError("Closed complaints cannot be edited.", 400);
  }

  if (req.user.role === ROLES.STAFF) {
    if (!complaint.assignedTo || complaint.assignedTo.toString() !== req.user._id.toString()) {
      throw new AppError("Only assigned staff can update this complaint.", 403);
    }
    if (!["IN_PROGRESS", "RESOLVED"].includes(nextStatus)) {
      throw new AppError("Staff can only move complaints to IN_PROGRESS or RESOLVED.", 400);
    }
  } else if (req.user.role === ROLES.ADMIN) {
    if (nextStatus !== "CLOSED") {
      throw new AppError("Admin can only mark a complaint as CLOSED.", 400);
    }
  } else {
    throw new AppError("Students are not allowed to change complaint status.", 403);
  }

  if (!canTransitionStatus(currentStatus, nextStatus)) {
    throw new AppError(`Invalid status transition: ${currentStatus} -> ${nextStatus}`, 400);
  }

  req.body.status = nextStatus;
  next();
});

module.exports = {
  loadComplaintById,
  validateAssignTransition,
  validateStatusTransition,
};

