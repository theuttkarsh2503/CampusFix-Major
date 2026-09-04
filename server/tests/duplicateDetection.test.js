const test = require("node:test");
const assert = require("node:assert/strict");
const { calculateDuplicateSimilarity, findSimilarComplaints } = require("../services/duplicateDetectionService");

const candidate = {
  category: "Water Supply",
  location: "Block A washroom",
  title: "Water leakage in washroom",
  description: "There is continuous water leakage near the washroom entrance.",
};

test("scores complaints using category, location, title, and description", () => {
  const score = calculateDuplicateSimilarity(candidate, {
    ...candidate,
    title: "Water leak in washroom",
  });

  assert.ok(score >= 60);
});

test("returns only sufficiently similar complaints and sorts by score", () => {
  const matches = findSimilarComplaints(candidate, [
    { ticketId: "CFX-1024", ...candidate },
    { ticketId: "CFX-2048", category: "Electrical", location: "Block C", title: "Broken light", description: "The corridor bulb is broken." },
  ]);

  assert.equal(matches.length, 1);
  assert.equal(matches[0].complaint.ticketId, "CFX-1024");
});
