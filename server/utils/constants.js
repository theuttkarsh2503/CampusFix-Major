const ROLES = {
  STUDENT: "student",
  STAFF: "staff",
  ADMIN: "admin",
};

const COMPLAINT_CATEGORIES = [
  "Infrastructure",
  "Electrical",
  "Cleanliness",
  "IT & Technical",
  "Hostel Issues",
  "Security & Safety",
  "Water Supply",
  "Other",
];

const COMPLAINT_PRIORITIES = ["LOW", "MEDIUM", "HIGH"];

const COMPLAINT_STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"];

module.exports = {
  ROLES,
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
};
