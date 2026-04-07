const { COMPLAINT_PRIORITIES, COMPLAINT_STATUSES } = require("../utils/constants");

const STATUS_TRANSITIONS = {
  OPEN: new Set(["ASSIGNED"]),
  ASSIGNED: new Set(["IN_PROGRESS"]),
  IN_PROGRESS: new Set(["RESOLVED"]),
  RESOLVED: new Set(["CLOSED"]),
  CLOSED: new Set(),
};

const LEGACY_STATUS_MAP = {
  open: "OPEN",
  pending: "OPEN",
  assigned: "ASSIGNED",
  in_progress: "IN_PROGRESS",
  "in progress": "IN_PROGRESS",
  resolved: "RESOLVED",
  closed: "CLOSED",
  overdue: "OPEN",
};

const LEGACY_PRIORITY_MAP = {
  low: "LOW",
  medium: "MEDIUM",
  high: "HIGH",
};

const STATUS_QUERY_ALIASES = {
  OPEN: ["OPEN", "open", "Open", "pending", "Pending", "PENDING"],
  ASSIGNED: ["ASSIGNED", "assigned", "Assigned"],
  IN_PROGRESS: ["IN_PROGRESS", "in_progress", "In Progress", "in progress", "IN PROGRESS"],
  RESOLVED: ["RESOLVED", "resolved", "Resolved"],
  CLOSED: ["CLOSED", "closed", "Closed"],
};

const PRIORITY_QUERY_ALIASES = {
  LOW: ["LOW", "low", "Low"],
  MEDIUM: ["MEDIUM", "medium", "Medium"],
  HIGH: ["HIGH", "high", "High"],
};

const toKey = (value = "") => String(value).trim().replace(/[-\s]+/g, "_");

const normalizeWorkflowStatus = (status) => {
  if (!status) return status;
  const raw = String(status).trim();
  const fromDirect = toKey(raw).toUpperCase();
  if (COMPLAINT_STATUSES.includes(fromDirect)) return fromDirect;

  const fromLegacy = LEGACY_STATUS_MAP[String(raw).trim().toLowerCase()];
  if (fromLegacy) return fromLegacy;

  const legacyByKey = LEGACY_STATUS_MAP[toKey(raw).toLowerCase().replace(/_/g, " ")];
  if (legacyByKey) return legacyByKey;

  return fromDirect;
};

const normalizeWorkflowPriority = (priority) => {
  if (!priority) return priority;
  const raw = String(priority).trim();
  const fromDirect = raw.toUpperCase();
  if (COMPLAINT_PRIORITIES.includes(fromDirect)) return fromDirect;

  const fromLegacy = LEGACY_PRIORITY_MAP[raw.toLowerCase()];
  if (fromLegacy) return fromLegacy;

  return fromDirect;
};

const canTransitionStatus = (currentStatus, nextStatus) => {
  const from = normalizeWorkflowStatus(currentStatus);
  const to = normalizeWorkflowStatus(nextStatus);
  if (!COMPLAINT_STATUSES.includes(from) || !COMPLAINT_STATUSES.includes(to)) return false;
  return STATUS_TRANSITIONS[from]?.has(to) || false;
};

const getNextStatuses = (status) => {
  const current = normalizeWorkflowStatus(status);
  if (!COMPLAINT_STATUSES.includes(current)) return [];
  return Array.from(STATUS_TRANSITIONS[current] || []);
};

const isClosedStatus = (status) => normalizeWorkflowStatus(status) === "CLOSED";

const getStatusQueryAliases = (status) => {
  const normalized = normalizeWorkflowStatus(status);
  return STATUS_QUERY_ALIASES[normalized] || [normalized];
};

const getPriorityQueryAliases = (priority) => {
  const normalized = normalizeWorkflowPriority(priority);
  return PRIORITY_QUERY_ALIASES[normalized] || [normalized];
};

const buildStatusBreakdown = (rows = []) => {
  const breakdown = {
    OPEN: 0,
    ASSIGNED: 0,
    IN_PROGRESS: 0,
    RESOLVED: 0,
    CLOSED: 0,
  };

  rows.forEach((row) => {
    const status = normalizeWorkflowStatus(row?._id);
    if (breakdown[status] !== undefined) {
      breakdown[status] += row.count || 0;
    }
  });

  return breakdown;
};

module.exports = {
  STATUS_TRANSITIONS,
  normalizeWorkflowStatus,
  normalizeWorkflowPriority,
  canTransitionStatus,
  getNextStatuses,
  isClosedStatus,
  getStatusQueryAliases,
  getPriorityQueryAliases,
  buildStatusBreakdown,
};

