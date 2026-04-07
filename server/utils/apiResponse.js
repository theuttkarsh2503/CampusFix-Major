const sendSuccess = (res, { message = "Success", data = null, meta = null, statusCode = 200 }) =>
  res.status(statusCode).json({
    success: true,
    message,
    data,
    ...(meta ? { meta } : {}),
  });

const sendError = (res, { message = "Something went wrong", errors = null, statusCode = 500 }) =>
  res.status(statusCode).json({
    success: false,
    message,
    ...(errors ? { errors } : {}),
  });

module.exports = { sendSuccess, sendError };
