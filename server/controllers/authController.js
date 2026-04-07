const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const { sendSuccess } = require("../utils/apiResponse");
const asyncHandler = require("../middleware/asyncHandler");
const { ROLES } = require("../utils/constants");

const signToken = (user) =>
  jwt.sign(
    {
      userId: user._id,
      role: String(user.role || ROLES.STUDENT).toLowerCase(),
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_EXPIRES_IN || "7d",
    },
  );

const register = asyncHandler(async (req, res) => {
  const { name, email, password, role, department } = req.body;

  const existing = await User.findOne({ email: email.toLowerCase() });
  if (existing) {
    throw new AppError("Email already in use.", 409);
  }

  const normalizedRole = String(role || ROLES.STUDENT).toLowerCase();
  let requestedRole = ROLES.STUDENT;
  if (normalizedRole === ROLES.ADMIN && process.env.ALLOW_ADMIN_SELF_REGISTER === "true") {
    requestedRole = ROLES.ADMIN;
  } else if (normalizedRole === ROLES.STAFF && process.env.ALLOW_STAFF_SELF_REGISTER === "true") {
    requestedRole = ROLES.STAFF;
  }

  const user = await User.create({
    name,
    email: email.toLowerCase(),
    password,
    role: requestedRole,
    department,
  });

  const token = signToken(user);

  return sendSuccess(res, {
    statusCode: 201,
    message: "User registered successfully.",
    data: {
      token,
      user: user.toSafeObject(),
    },
  });
});

const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;
  const normalizedEmail = String(email || "").toLowerCase().trim();
  const user = await User.findOne({ email: normalizedEmail }).select("+password");

  if (!user) {
    throw new AppError("Invalid email or password.", 401);
  }

  const isMatch = await user.comparePassword(password);
  if (!isMatch) {
    throw new AppError("Invalid email or password.", 401);
  }

  const token = signToken(user);

  return sendSuccess(res, {
    message: "Login successful.",
    data: {
      token,
      user: user.toSafeObject(),
    },
  });
});

const profile = asyncHandler(async (req, res) =>
  sendSuccess(res, {
    message: "Profile fetched.",
    data: req.user.toSafeObject(),
  }),
);

const listUsers = asyncHandler(async (req, res) => {
  const { role, q = "", page = 1, limit = 20 } = req.query;
  const skip = (Number(page) - 1) * Number(limit);

  const query = {};
  if (role) {
    query.role = String(role).toLowerCase();
  }
  if (q) {
    query.$or = [{ name: { $regex: q, $options: "i" } }, { email: { $regex: q, $options: "i" } }];
  }

  const [users, total] = await Promise.all([
    User.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(Number(limit)),
    User.countDocuments(query),
  ]);

  return sendSuccess(res, {
    message: "Users fetched.",
    data: users.map((u) => u.toSafeObject()),
    meta: {
      page: Number(page),
      limit: Number(limit),
      total,
      totalPages: Math.ceil(total / Number(limit)),
    },
  });
});

module.exports = { register, login, profile, listUsers };
