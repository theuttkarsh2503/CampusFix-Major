const jwt = require("jsonwebtoken");
const User = require("../models/User");
const AppError = require("../utils/AppError");
const asyncHandler = require("./asyncHandler");

const protect = asyncHandler(async (req, _res, next) => {
  const authHeader = req.headers.authorization || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.split(" ")[1] : null;

  if (!token) {
    throw new AppError("Unauthorized. Token missing.", 401);
  }

  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  const userId = decoded.userId || decoded.id;

  if (!userId) {
    throw new AppError("Unauthorized. Invalid token payload.", 401);
  }

  const user = await User.findById(userId);

  if (!user) {
    throw new AppError("Unauthorized. User not found.", 401);
  }

  req.auth = {
    userId: String(userId),
    role: String(decoded.role || user.role || "").toLowerCase(),
  };

  user.role = String(user.role || "").toLowerCase();
  req.user = user;
  next();
});

module.exports = { protect };
