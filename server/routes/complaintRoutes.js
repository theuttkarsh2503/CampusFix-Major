const express = require("express");
const { body, query, param } = require("express-validator");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
} = require("../controllers/complaintController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const upload = require("../middleware/uploadMiddleware");
const {
  loadComplaintById,
  validateAssignTransition,
  validateStatusTransition,
} = require("../middleware/statusTransitionMiddleware");
const {
  ROLES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} = require("../utils/constants");
const {
  normalizeWorkflowPriority,
  normalizeWorkflowStatus,
} = require("../services/complaintWorkflowService");

const router = express.Router();

router
  .route("/")
  .post(
    protect,
    allowRoles(ROLES.STUDENT),
    upload.array("attachments", 3),
    [
      body("title").trim().isLength({ min: 5, max: 150 }),
      body("description").trim().isLength({ min: 10, max: 2000 }),
      body("category").isIn(COMPLAINT_CATEGORIES),
      body("location").trim().isLength({ min: 2, max: 160 }),
      body("priority").optional().customSanitizer(normalizeWorkflowPriority).isIn(COMPLAINT_PRIORITIES),
    ],
    validateRequest,
    createComplaint,
  )
  .get(
    protect,
    [
      query("page").optional().isInt({ min: 1 }),
      query("limit").optional().isInt({ min: 1, max: 100 }),
      query("status").optional().customSanitizer(normalizeWorkflowStatus).isIn(COMPLAINT_STATUSES),
      query("category").optional().isIn(COMPLAINT_CATEGORIES),
      query("priority").optional().customSanitizer(normalizeWorkflowPriority).isIn(COMPLAINT_PRIORITIES),
      query("sortBy").optional().isIn(["createdAt", "updatedAt", "priority", "title", "status"]),
      query("sortOrder").optional().isIn(["asc", "desc"]),
      query("search").optional().isString(),
      query("assignedTo").optional().isMongoId(),
    ],
    validateRequest,
    getComplaints,
  );

router.get("/:id", protect, [param("id").isMongoId()], validateRequest, getComplaintById);

router.put(
  "/:id/status",
  protect,
  upload.array("attachments", 3),
  [
    param("id").isMongoId(),
    body("status").customSanitizer(normalizeWorkflowStatus).isIn(COMPLAINT_STATUSES),
    body("resolutionNotes").optional().trim().isLength({ max: 2000 }),
  ],
  validateRequest,
  loadComplaintById,
  validateStatusTransition,
  updateComplaintStatus,
);

router.put(
  "/:id/assign",
  protect,
  allowRoles(ROLES.ADMIN),
  [
    param("id").isMongoId(),
    body("staffId").isMongoId(),
    body("priority").optional().customSanitizer(normalizeWorkflowPriority).isIn(COMPLAINT_PRIORITIES),
    body("escalate").optional().isBoolean(),
    body("escalatedReason").optional().isString(),
  ],
  validateRequest,
  loadComplaintById,
  validateAssignTransition,
  assignComplaint,
);

router.delete("/:id", protect, allowRoles(ROLES.ADMIN), [param("id").isMongoId()], validateRequest, deleteComplaint);

module.exports = router;
