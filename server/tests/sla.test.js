const test = require("node:test");
const assert = require("node:assert/strict");
const { getSlaHours, calculateSlaDeadline, getSlaStatus } = require("../services/slaService");

test("uses the default SLA duration by priority", () => {
  assert.equal(getSlaHours("HIGH"), 4);
  assert.equal(getSlaHours("MEDIUM"), 24);
  assert.equal(getSlaHours("LOW"), 72);
});

test("calculates and evaluates SLA deadlines", () => {
  const createdAt = new Date("2026-01-01T00:00:00.000Z");
  const deadline = calculateSlaDeadline(createdAt, "HIGH");

  assert.equal(deadline.toISOString(), "2026-01-01T04:00:00.000Z");
  assert.equal(getSlaStatus({ priority: "HIGH", status: "OPEN", slaDeadline: deadline, now: new Date("2026-01-01T02:00:00.000Z") }), "ON_TRACK");
  assert.equal(getSlaStatus({ priority: "HIGH", status: "OPEN", slaDeadline: deadline, now: new Date("2026-01-01T03:30:00.000Z") }), "DUE_SOON");
  assert.equal(getSlaStatus({ priority: "HIGH", status: "OPEN", slaDeadline: deadline, now: new Date("2026-01-01T04:01:00.000Z") }), "BREACHED");
  assert.equal(getSlaStatus({ priority: "HIGH", status: "RESOLVED", slaDeadline: deadline, now: new Date("2026-01-01T05:00:00.000Z") }), "RESOLVED");
});
