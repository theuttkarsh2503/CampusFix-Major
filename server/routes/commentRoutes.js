const express = require("express");
const { body, param } = require("express-validator");
const { addComment, getComments } = require("../controllers/commentController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.post(
  "/",
  protect,
  [
    body("complaintId").isMongoId(),
    body("message").trim().isLength({ min: 1, max: 1000 }),
  ],
  validateRequest,
  addComment,
);

router.get("/:complaintId", protect, [param("complaintId").isMongoId()], validateRequest, getComments);

module.exports = router;
