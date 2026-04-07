const formatMessage = (level, message) => {
  const time = new Date().toISOString();
  return `[${time}] ${level.toUpperCase()}: ${message}`;
};

const logger = {
  info: (message) => console.log(formatMessage("info", message)),
  warn: (message) => console.warn(formatMessage("warn", message)),
  error: (message) => console.error(formatMessage("error", message)),
};

module.exports = logger;
