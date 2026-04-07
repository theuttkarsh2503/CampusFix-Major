const test = require("node:test");
const assert = require("node:assert/strict");
const {
  canTransitionStatus,
  normalizeWorkflowPriority,
  normalizeWorkflowStatus,
} = require("../services/complaintWorkflowService");

test("workflow only allows OPEN -> ASSIGNED -> IN_PROGRESS -> RESOLVED -> CLOSED", () => {
  assert.equal(canTransitionStatus("OPEN", "ASSIGNED"), true);
  assert.equal(canTransitionStatus("ASSIGNED", "IN_PROGRESS"), true);
  assert.equal(canTransitionStatus("IN_PROGRESS", "RESOLVED"), true);
  assert.equal(canTransitionStatus("RESOLVED", "CLOSED"), true);

  assert.equal(canTransitionStatus("OPEN", "RESOLVED"), false);
  assert.equal(canTransitionStatus("ASSIGNED", "CLOSED"), false);
  assert.equal(canTransitionStatus("CLOSED", "OPEN"), false);
});

test("normalizers map legacy values to enterprise workflow values", () => {
  assert.equal(normalizeWorkflowStatus("pending"), "OPEN");
  assert.equal(normalizeWorkflowStatus("In Progress"), "IN_PROGRESS");
  assert.equal(normalizeWorkflowPriority("medium"), "MEDIUM");
  assert.equal(normalizeWorkflowPriority("High"), "HIGH");
});

