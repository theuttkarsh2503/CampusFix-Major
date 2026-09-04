const express = require("express");
const { body, query, param } = require("express-validator");
const {
  createComplaint,
  getComplaints,
  getComplaintById,
  updateComplaintStatus,
  assignComplaint,
  deleteComplaint,
  updateComplaintDepartment,
  updateComplaintPriority,
  escalateComplaint,
  findDuplicateComplaints,
  submitComplaintFeedback,
  exportComplaints,
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
const { classifyComplaint } = require("../services/complaintClassificationService");

const router = express.Router();

router.post(
  "/classify",
  protect,
  allowRoles(ROLES.STUDENT),
  [
    body("title").optional().isString().isLength({ max: 150 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("location").optional().isString().isLength({ max: 160 }),
  ],
  validateRequest,
  (req, res) => res.json({ success: true, message: "Complaint classified.", data: classifyComplaint(req.body) }),
);

router.post(
  "/duplicates",
  protect,
  allowRoles(ROLES.STUDENT),
  [
    body("title").optional().isString().isLength({ max: 150 }),
    body("description").optional().isString().isLength({ max: 2000 }),
    body("category").optional().isString().isLength({ max: 80 }),
    body("location").optional().isString().isLength({ max: 160 }),
  ],
  validateRequest,
  findDuplicateComplaints,
);

router
  .route("/")
  .post(
    protect,
    allowRoles(ROLES.STUDENT),
    upload.array("attachments", 3),
    [
      body("title").trim().isLength({ min: 5, max: 150 }),
      body("description").trim().isLength({ min: 10, max: 2000 }),
      body("category").optional().isIn(COMPLAINT_CATEGORIES),
      body("location").trim().isLength({ min: 2, max: 160 }),
      body("building").optional().trim().isLength({ max: 80 }),
      body("floor").optional().trim().isLength({ max: 80 }),
      body("area").optional().trim().isLength({ max: 100 }),
      body("department").optional().trim().isLength({ max: 80 }),
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
      query("search").optional().isString().isLength({ max: 100 }),
      query("assignedTo").optional().isMongoId(),
      query("department").optional().isString().isLength({ max: 80 }),
      query("dateFrom").optional().isISO8601(),
      query("dateTo").optional().isISO8601(),
      query("slaStatus").optional().isIn(["ON_TRACK", "DUE_SOON", "BREACHED", "RESOLVED"]),
    ],
    validateRequest,
    getComplaints,
  );

router.get(
  "/export/csv",
  protect,
  allowRoles(ROLES.ADMIN),
  [
    query("status").optional().customSanitizer(normalizeWorkflowStatus).isIn(COMPLAINT_STATUSES),
    query("category").optional().isIn(COMPLAINT_CATEGORIES),
    query("priority").optional().customSanitizer(normalizeWorkflowPriority).isIn(COMPLAINT_PRIORITIES),
    query("search").optional().isString().isLength({ max: 100 }),
    query("assignedTo").optional().isMongoId(),
    query("department").optional().isString().isLength({ max: 80 }),
    query("dateFrom").optional().isISO8601(),
    query("dateTo").optional().isISO8601(),
    query("slaStatus").optional().isIn(["ON_TRACK", "DUE_SOON", "BREACHED", "RESOLVED"]),
  ],
  validateRequest,
  exportComplaints,
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

router.put(
  "/:id/department",
  protect,
  allowRoles(ROLES.ADMIN),
  [param("id").isMongoId(), body("department").trim().isLength({ min: 2, max: 80 })],
  validateRequest,
  updateComplaintDepartment,
);

router.put(
  "/:id/priority",
  protect,
  allowRoles(ROLES.ADMIN),
  [param("id").isMongoId(), body("priority").customSanitizer(normalizeWorkflowPriority).isIn(COMPLAINT_PRIORITIES)],
  validateRequest,
  updateComplaintPriority,
);

router.post(
  "/:id/escalate",
  protect,
  [param("id").isMongoId(), body("reason").optional().trim().isLength({ max: 500 })],
  validateRequest,
  escalateComplaint,
);

router.post(
  "/:id/feedback",
  protect,
  allowRoles(ROLES.STUDENT),
  [
    param("id").isMongoId(),
    body("rating").isInt({ min: 1, max: 5 }),
    body("feedback").optional().trim().isLength({ max: 2000 }),
    body("resolvedSuccessfully").isBoolean(),
  ],
  validateRequest,
  submitComplaintFeedback,
);

router.delete("/:id", protect, allowRoles(ROLES.ADMIN), [param("id").isMongoId()], validateRequest, deleteComplaint);

module.exports = router;
