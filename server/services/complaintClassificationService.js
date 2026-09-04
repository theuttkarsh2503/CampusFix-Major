const { COMPLAINT_CATEGORIES, COMPLAINT_PRIORITIES } = require("../utils/constants");

const DEPARTMENT_ROUTING = {
  Electrical: "Electrical Maintenance",
  "Water Supply": "Plumbing Maintenance",
  Plumbing: "Plumbing Maintenance",
  HVAC: "HVAC/Maintenance",
  "IT & Technical": "IT Support",
  IT: "IT Support",
  Infrastructure: "Civil Maintenance",
  Civil: "Civil Maintenance",
  Cleanliness: "Housekeeping",
  Cleaning: "Housekeeping",
  Furniture: "Maintenance",
  "Hostel Issues": "Admin Review",
  "Security & Safety": "Security",
  Other: "Admin Review",
};

const getDepartmentForCategory = (category = "") => DEPARTMENT_ROUTING[String(category).trim()] || "Admin Review";

// Keep classification rules data-driven so this service can later be replaced by an ML adapter.
const CLASSIFICATION_RULES = [
  { category: "HVAC", department: "HVAC/Maintenance", keywords: ["ac", "air conditioner", "air conditioning", "cooling", "heater", "heating", "hvac", "ventilation"] },
  { category: "Electrical", department: "Electrical Maintenance", keywords: ["electric", "electrical", "power", "socket", "switch", "wiring", "light", "bulb", "fan"] },
  { category: "Water Supply", department: "Plumbing Maintenance", keywords: ["water", "leak", "leakage", "tap", "faucet", "pipe", "drain", "toilet"] },
  { category: "IT & Technical", department: "IT Support", keywords: ["wifi", "wi-fi", "internet", "network", "computer", "printer", "software", "portal", "login"] },
  { category: "Cleanliness", department: "Housekeeping", keywords: ["clean", "cleaning", "dirty", "garbage", "trash", "waste", "sanitation", "smell"] },
  { category: "Hostel Issues", department: "Hostel Administration", keywords: ["hostel", "room", "bed", "warden", "accommodation", "dorm"] },
  { category: "Security & Safety", department: "Security", keywords: ["security", "unsafe", "theft", "cctv", "emergency", "accident", "fire", "danger"] },
  { category: "Infrastructure", department: "Civil Maintenance", keywords: ["building", "ceiling", "floor", "door", "window", "wall", "road", "furniture", "classroom"] },
];

const PRIORITY_RULES = [
  { priority: "HIGH", keywords: ["fire", "smoke", "danger", "unsafe", "emergency", "accident", "flood", "no power", "security breach"] },
  { priority: "LOW", keywords: ["suggestion", "minor", "cosmetic", "whenever", "non urgent", "non-urgent"] },
];

const normalizeText = (...values) => values.filter(Boolean).join(" ").toLowerCase().replace(/[^a-z0-9\s-]/g, " ");

const scoreRule = (text, keywords) => keywords.reduce((score, keyword) => {
  const normalizedKeyword = keyword.toLowerCase();
  return score + (text.includes(normalizedKeyword) ? (normalizedKeyword.includes(" ") || normalizedKeyword.includes("-") ? 3 : 2) : 0);
}, 0);

const classifyComplaint = ({ title = "", description = "", location = "" } = {}) => {
  const text = normalizeText(title, description, location);
  const ranked = CLASSIFICATION_RULES
    .map((rule) => ({ ...rule, score: scoreRule(text, rule.keywords) }))
    .sort((a, b) => b.score - a.score);
  const best = ranked[0];
  const second = ranked[1];
  const categoryScore = best?.score || 0;
  const category = categoryScore ? best.category : "Other";
  const department = categoryScore ? getDepartmentForCategory(category) : getDepartmentForCategory("Other");
  const confidence = categoryScore
    ? Math.min(98, Math.max(60, 72 + categoryScore * 6 + (categoryScore > (second?.score || 0) ? 8 : 0)))
    : 35;

  const priorityRanked = PRIORITY_RULES
    .map((rule) => ({ ...rule, score: scoreRule(text, rule.keywords) }))
    .sort((a, b) => b.score - a.score);
  const priorityMatch = priorityRanked[0];
  const suggestedPriority = priorityMatch?.score ? priorityMatch.priority : "MEDIUM";
  const priorityConfidence = priorityMatch?.score ? Math.min(98, 78 + priorityMatch.score * 7) : 65;

  return {
    suggestedCategory: COMPLAINT_CATEGORIES.includes(category) ? category : "Other",
    suggestedDepartment: department,
    suggestedPriority: COMPLAINT_PRIORITIES.includes(suggestedPriority) ? suggestedPriority : "MEDIUM",
    suggestedPriorityConfidence: priorityConfidence,
    confidence,
    method: "weighted-keywords",
  };
};

module.exports = { classifyComplaint, getDepartmentForCategory, DEPARTMENT_ROUTING, CLASSIFICATION_RULES, PRIORITY_RULES };
