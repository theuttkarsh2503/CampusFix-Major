const test = require("node:test");
const assert = require("node:assert/strict");
const { classifyComplaint, getDepartmentForCategory } = require("../services/complaintClassificationService");

test("classifies an AC complaint as HVAC maintenance", () => {
  const result = classifyComplaint({
    title: "AC not cooling",
    description: "The AC in Block B room 204 is not cooling.",
    location: "Block B room 204",
  });

  assert.equal(result.suggestedCategory, "HVAC");
  assert.equal(result.suggestedDepartment, "HVAC/Maintenance");
  assert.equal(result.suggestedPriority, "MEDIUM");
  assert.equal(result.suggestedPriorityConfidence, 65);
  assert.equal(result.confidence, 98);
  assert.equal(result.method, "weighted-keywords");
});

test("routes categories to maintainable department names", () => {
  assert.equal(getDepartmentForCategory("Electrical"), "Electrical Maintenance");
  assert.equal(getDepartmentForCategory("Water Supply"), "Plumbing Maintenance");
  assert.equal(getDepartmentForCategory("IT & Technical"), "IT Support");
  assert.equal(getDepartmentForCategory("Furniture"), "Maintenance");
  assert.equal(getDepartmentForCategory("Other"), "Admin Review");
});

test("raises priority for safety-critical keywords", () => {
  const result = classifyComplaint({
    title: "Smoke near the staircase",
    description: "There is a fire hazard and the area is unsafe.",
  });

  assert.equal(result.suggestedCategory, "Security & Safety");
  assert.equal(result.suggestedPriority, "HIGH");
  assert.equal(result.suggestedPriorityConfidence, 98);
});

test("uses safe defaults when no rule matches", () => {
  const result = classifyComplaint({ title: "General request", description: "Please advise." });

  assert.equal(result.suggestedCategory, "Other");
  assert.equal(result.suggestedDepartment, "Admin Review");
  assert.equal(result.suggestedPriority, "MEDIUM");
  assert.equal(result.confidence, 35);
});
