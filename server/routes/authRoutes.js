const express = require("express");
const { body, query } = require("express-validator");
const { register, login, profile, listUsers } = require("../controllers/authController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { ROLES } = require("../utils/constants");

const router = express.Router();

/**
 * @swagger
 * /auth/register:
 *   post:
 *     tags: [Auth]
 *     summary: Register a new user
 * /auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Login with email and password
 * /auth/profile:
 *   get:
 *     tags: [Auth]
 *     summary: Get current user profile
 */
router.post(
  "/register",
  [
    body("name").trim().isLength({ min: 2 }).withMessage("Name must be at least 2 characters."),
    body("email").isEmail().normalizeEmail().withMessage("Valid email required."),
    body("password")
      .isLength({ min: 8 })
      .withMessage("Password must be at least 8 characters.")
      .matches(/\d/)
      .withMessage("Password must include a number."),
    body("role").optional().customSanitizer((value) => String(value).toLowerCase()).isIn(Object.values(ROLES)),
    body("department").optional().trim().isLength({ max: 80 }),
  ],
  validateRequest,
  register,
);

router.post(
  "/login",
  [
    body("email").isEmail().normalizeEmail().withMessage("Valid email required."),
    body("password").notEmpty().withMessage("Password is required."),
  ],
  validateRequest,
  login,
);

router.get("/profile", protect, profile);

router.get(
  "/users",
  protect,
  allowRoles(ROLES.ADMIN),
  [
    query("role").optional().customSanitizer((value) => String(value).toLowerCase()).isIn(Object.values(ROLES)),
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("q").optional().isString(),
  ],
  validateRequest,
  listUsers,
);

module.exports = router;
