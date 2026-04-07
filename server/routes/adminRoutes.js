const express = require("express");
const { body, param, query } = require("express-validator");
const {
  getAdminDashboard,
  createStaffAccount,
  getUsers,
  updateUserRole,
} = require("../controllers/adminController");
const { protect } = require("../middleware/authMiddleware");
const { allowRoles } = require("../middleware/roleMiddleware");
const validateRequest = require("../middleware/validateRequest");
const { ROLES } = require("../utils/constants");

const router = express.Router();

router.use(protect);
router.use(allowRoles(ROLES.ADMIN));

router.get("/dashboard", getAdminDashboard);

router.post(
  "/staff",
  [
    body("name").trim().isLength({ min: 2, max: 80 }),
    body("email").isEmail(),
    body("password").isLength({ min: 8 }).matches(/\d/),
    body("department").optional().trim().isLength({ max: 80 }),
  ],
  validateRequest,
  createStaffAccount,
);

router.get(
  "/users",
  [
    query("page").optional().isInt({ min: 1 }),
    query("limit").optional().isInt({ min: 1, max: 100 }),
    query("role").optional().customSanitizer((value) => String(value).toLowerCase()).isIn(Object.values(ROLES)),
    query("q").optional().isString(),
  ],
  validateRequest,
  getUsers,
);

router.put(
  "/users/:id/role",
  [
    param("id").isMongoId(),
    body("role").customSanitizer((value) => String(value).toLowerCase()).isIn(Object.values(ROLES)),
  ],
  validateRequest,
  updateUserRole,
);

module.exports = router;
