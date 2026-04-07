const mongoose = require("mongoose");
const generateTicketId = require("../utils/ticketId");
const {
  COMPLAINT_CATEGORIES,
  COMPLAINT_PRIORITIES,
  COMPLAINT_STATUSES,
} = require("../utils/constants");
const {
  normalizeWorkflowPriority,
  normalizeWorkflowStatus,
} = require("../services/complaintWorkflowService");

const LEGACY_CATEGORY_MAP = {
  maintenance: "Infrastructure",
  facilities: "Infrastructure",
  safety: "Security & Safety",
  security: "Security & Safety",
  "it & technical": "IT & Technical",
  it: "IT & Technical",
  hostel: "Hostel Issues",
  "hostel issues": "Hostel Issues",
  electrical: "Electrical",
  cleanliness: "Cleanliness",
  infrastructure: "Infrastructure",
  "water supply": "Water Supply",
  water: "Water Supply",
  other: "Other",
};

const normalizeKey = (value) => String(value || "").trim().toLowerCase().replace(/\s+/g, " ");

const normalizeCategory = (value) => {
  if (!value) return value;

  const text = String(value).trim();
  if (COMPLAINT_CATEGORIES.includes(text)) return text;

  const key = normalizeKey(text);
  const mapped = LEGACY_CATEGORY_MAP[key];
  if (mapped) return mapped;

  const caseInsensitiveMatch = COMPLAINT_CATEGORIES.find((item) => item.toLowerCase() === key);
  return caseInsensitiveMatch || text;
};

const attachmentSchema = new mongoose.Schema(
  {
    fileName: { type: String, required: true },
    fileUrl: { type: String, required: true },
    mimeType: { type: String, required: true },
    size: { type: Number, required: true },
  },
  { _id: false },
);

const complaintSchema = new mongoose.Schema(
  {
    ticketId: { type: String, unique: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 150 },
    category: {
      type: String,
      required: true,
      enum: COMPLAINT_CATEGORIES,
    },
    location: { type: String, required: true, trim: true, maxlength: 160 },
    description: { type: String, required: true, trim: true, maxlength: 2000 },
    status: {
      type: String,
      enum: COMPLAINT_STATUSES,
      default: "OPEN",
      index: true,
    },
    assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
    attachments: { type: [attachmentSchema], default: [] },
    comments: {
      type: [{ type: mongoose.Schema.Types.ObjectId, ref: "Comment" }],
      default: [],
    },
    priority: { type: String, enum: COMPLAINT_PRIORITIES, default: "MEDIUM" },
    resolutionNotes: { type: String, trim: true, maxlength: 2000, default: "" },
    isEscalated: { type: Boolean, default: false },
    escalatedReason: { type: String, trim: true, maxlength: 500, default: "" },
    resolvedAt: { type: Date, default: null },
    closedAt: { type: Date, default: null },
  },
  { timestamps: true },
);

complaintSchema.index({ title: "text", ticketId: "text" });
complaintSchema.index({ category: 1, createdAt: -1 });

complaintSchema.pre("validate", async function assignTicketId() {
  if (this.category) {
    this.category = normalizeCategory(this.category);
  }
  if (this.status) {
    this.status = normalizeWorkflowStatus(this.status);
  }
  if (this.priority) {
    this.priority = normalizeWorkflowPriority(this.priority);
  }

  if (!this.ticketId) {
    this.ticketId = generateTicketId();
  }
});

complaintSchema.pre("save", function setLifecycleDates() {
  if (this.isModified("status")) {
    if (this.status === "RESOLVED") {
      this.resolvedAt = new Date();
      this.closedAt = null;
    } else if (this.status === "CLOSED") {
      if (!this.resolvedAt) {
        this.resolvedAt = new Date();
      }
      this.closedAt = new Date();
    } else {
      this.resolvedAt = null;
      this.closedAt = null;
    }
  }
});

module.exports = mongoose.model("Complaint", complaintSchema);
