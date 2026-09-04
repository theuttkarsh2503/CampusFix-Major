export const ROLES = {
  STUDENT: "student",
  STAFF: "staff",
  ADMIN: "admin",
}

export const ROLE_LABELS = {
  [ROLES.STUDENT]: "Student",
  [ROLES.STAFF]: "Staff",
  [ROLES.ADMIN]: "Admin",
}

export const DASHBOARD_REDIRECTS = {
  [ROLES.STUDENT]: "/student-dashboard",
  [ROLES.STAFF]: "/staff-dashboard",
  [ROLES.ADMIN]: "/admin-dashboard",
}

export const getDashboardRedirect = (role = "") => DASHBOARD_REDIRECTS[String(role || "").toLowerCase()] || DASHBOARD_REDIRECTS[ROLES.STUDENT]

export const CATEGORIES = [
  "Infrastructure",
  "HVAC",
  "Electrical",
  "Cleanliness",
  "IT & Technical",
  "Hostel Issues",
  "Security & Safety",
  "Water Supply",
  "Other",
]

export const STATUSES = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]

export const STATUS_LABELS = {
  OPEN: "Open",
  ASSIGNED: "Assigned",
  IN_PROGRESS: "In Progress",
  RESOLVED: "Resolved",
  CLOSED: "Closed",
}

export const PRIORITIES = ["LOW", "MEDIUM", "HIGH"]

export const PRIORITY_LABELS = {
  LOW: "Low",
  MEDIUM: "Medium",
  HIGH: "High",
}

export const DEPARTMENTS = [
  "Electrical Maintenance",
  "Plumbing Maintenance",
  "HVAC/Maintenance",
  "Civil Maintenance",
  "IT Support",
  "Housekeeping",
  "Security",
  "Maintenance",
  "Admin Review",
]

export const CAMPUS_LOCATIONS = {
  "Block A": ["Ground Floor", "First Floor", "Second Floor"],
  "Block B": ["Ground Floor", "First Floor", "Second Floor"],
  "Block C": ["Ground Floor", "First Floor", "Second Floor"],
  Library: ["Ground Floor", "First Floor", "Second Floor"],
  Hostel: ["Ground Floor", "First Floor", "Second Floor"],
  Cafeteria: ["Main Area", "Kitchen", "Dining Area"],
  "Sports Complex": ["Ground Floor", "Indoor Court", "Outdoor Area"],
}

export const STUDENT_NAV = [
  { label: "Dashboard", to: "/app/dashboard" },
  { label: "Submit Complaint", to: "/app/submit" },
  { label: "My Complaints", to: "/app/complaints" },
  { label: "Notifications", to: "/app/notifications" },
  { label: "Profile", to: "/app/profile" },
]

export const STAFF_NAV = [
  { label: "Staff Dashboard", to: "/staff/dashboard" },
  { label: "Assigned Complaints", to: "/staff/assigned" },
  { label: "Notifications", to: "/staff/notifications" },
  { label: "Profile", to: "/staff/profile" },
]

export const ADMIN_NAV = [
  { label: "Admin Dashboard", to: "/admin/dashboard" },
  { label: "Complaint Management", to: "/admin/complaints" },
  { label: "User Management", to: "/admin/users" },
  { label: "Analytics", to: "/admin/analytics" },
  { label: "Notifications", to: "/admin/notifications" },
]
