const express = require("express");
const { getStats } = require("../controllers/dashboardController");
const { protect } = require("../middleware/authMiddleware");

const router = express.Router();

/**
 * @swagger
 * /dashboard/stats:
 *   get:
 *     tags: [Dashboard]
 *     summary: Fetch dashboard analytics and summary cards
 */
router.get("/stats", protect, getStats);

module.exports = router;
