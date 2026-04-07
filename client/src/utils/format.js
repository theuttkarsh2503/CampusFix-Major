import { STATUS_LABELS } from "./constants"

const LEGACY_STATUS_MAP = {
  PENDING: "OPEN",
  OVERDUE: "OPEN",
}

export const formatDate = (dateValue) => {
  if (!dateValue) return "-"
  return new Date(dateValue).toLocaleDateString(undefined, {
    year: "numeric",
    month: "short",
    day: "2-digit",
  })
}

export const formatDateTime = (dateValue) => {
  if (!dateValue) return "-"
  return new Date(dateValue).toLocaleString()
}

export const normalizeStatus = (status = "") => {
  const normalized = String(status).trim().replace(/\s+/g, "_").toUpperCase()
  return LEGACY_STATUS_MAP[normalized] || normalized
}

export const formatStatus = (status = "") => STATUS_LABELS[normalizeStatus(status)] || toTitleCase(status.replace(/_/g, " "))

export const getStatusClasses = (status) => {
  switch (normalizeStatus(status)) {
    case "OPEN":
      return "bg-slate-200 text-slate-700"
    case "ASSIGNED":
      return "bg-purple-100 text-purple-700"
    case "IN_PROGRESS":
      return "bg-blue-100 text-blue-700"
    case "RESOLVED":
      return "bg-emerald-100 text-emerald-700"
    case "CLOSED":
      return "bg-slate-700 text-slate-100"
    default:
      return "bg-slate-100 text-slate-700"
  }
}

export const toTitleCase = (value = "") =>
  value
    .split(" ")
    .filter(Boolean)
    .map((chunk) => chunk.charAt(0).toUpperCase() + chunk.slice(1).toLowerCase())
    .join(" ")
