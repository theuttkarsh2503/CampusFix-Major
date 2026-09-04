const SLA_HOURS = {
  HIGH: Number(process.env.SLA_HIGH_HOURS) || 4,
  MEDIUM: Number(process.env.SLA_MEDIUM_HOURS) || 24,
  LOW: Number(process.env.SLA_LOW_HOURS) || 72,
};

const getSlaHours = (priority = "MEDIUM") => SLA_HOURS[String(priority).toUpperCase()] || SLA_HOURS.MEDIUM;

const calculateSlaDeadline = (createdAt = new Date(), priority = "MEDIUM") =>
  new Date(new Date(createdAt).getTime() + getSlaHours(priority) * 60 * 60 * 1000);

const getSlaStatus = ({ priority = "MEDIUM", status, slaDeadline, now = new Date() } = {}) => {
  if (["RESOLVED", "CLOSED"].includes(String(status).toUpperCase())) return "RESOLVED";
  if (!slaDeadline) return "ON_TRACK";

  const remainingMs = new Date(slaDeadline).getTime() - new Date(now).getTime();
  if (remainingMs <= 0) return "BREACHED";

  const dueSoonWindow = Math.max(60 * 60 * 1000, getSlaHours(priority) * 60 * 60 * 1000 * 0.2);
  return remainingMs <= dueSoonWindow ? "DUE_SOON" : "ON_TRACK";
};

module.exports = { SLA_HOURS, getSlaHours, calculateSlaDeadline, getSlaStatus };
