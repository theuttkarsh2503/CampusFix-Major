const { sendError } = require("../utils/apiResponse");
const logger = require("../utils/logger");

const errorHandler = (err, _req, res, _next) => {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    logger.error(err.stack || err.message);
  }

  return sendError(res, {
    statusCode,
    message: err.message || "Internal server error",
    errors: err.errors || null,
  });
};

module.exports = errorHandler;
