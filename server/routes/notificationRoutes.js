const express = require("express");
const { body, query } = require("express-validator");
const { getNotifications, markNotificationsRead } = require("../controllers/notificationController");
const { protect } = require("../middleware/authMiddleware");
const validateRequest = require("../middleware/validateRequest");

const router = express.Router();

router.get(
  "/",
  protect,
  [query("page").optional().isInt({ min: 1 }), query("limit").optional().isInt({ min: 1, max: 100 })],
  validateRequest,
  getNotifications,
);

router.put(
  "/read",
  protect,
  [body("markAll").optional().isBoolean(), body("ids").optional().isArray()],
  validateRequest,
  markNotificationsRead,
);

module.exports = router;
