const AppError = require("../utils/AppError");

const allowRoles =
  (...roles) =>
  (req, _res, next) => {
    const allowed = roles.map((role) => String(role).toLowerCase());
    const currentRole = String(req.auth?.role || req.user?.role || "").toLowerCase();
    if (!req.user || !allowed.includes(currentRole)) {
      return next(new AppError("Forbidden. Insufficient role permissions.", 403));
    }
    return next();
  };

module.exports = { allowRoles };
