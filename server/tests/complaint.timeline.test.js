const test = require("node:test");
const assert = require("node:assert/strict");
const { addTimelineEvent, getComplaintTimeline } = require("../services/complaintTimelineService");

test("appends timeline events without changing complaint status", () => {
  const complaint = { status: "IN_PROGRESS", timeline: [] };
  addTimelineEvent(complaint, { eventType: "IN_PROGRESS", title: "Staff Started Work", actorName: "Staff" });

  assert.equal(complaint.status, "IN_PROGRESS");
  assert.equal(complaint.timeline.length, 1);
  assert.equal(complaint.timeline[0].title, "Staff Started Work");
  assert.ok(complaint.timeline[0].timestamp instanceof Date);
});

test("builds a readable timeline for legacy complaints", () => {
  const complaint = {
    status: "CLOSED",
    createdAt: new Date("2026-09-04T10:05:00Z"),
    updatedAt: new Date("2026-09-04T12:35:00Z"),
    resolvedAt: new Date("2026-09-04T12:10:00Z"),
    closedAt: new Date("2026-09-04T12:35:00Z"),
    assignedTo: "staff-id",
    submittedAt: new Date("2026-09-04T12:30:00Z"),
  };

  const timeline = getComplaintTimeline(complaint);
  assert.deepEqual(timeline.map((event) => event.eventType), ["CREATED", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "FEEDBACK", "CLOSED"]);
});
