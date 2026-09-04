const test = require("node:test");
const assert = require("node:assert/strict");
const { analyzePredictiveMaintenance } = require("../services/predictiveMaintenanceService");

test("identifies recurring and increasing maintenance trends", () => {
  const now = new Date("2026-04-15T12:00:00Z");
  const complaints = [
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-01-10" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-02-10" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-02-11" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-03-10" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-03-11" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-03-12" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-04-10" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-04-11" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-04-12" },
    { category: "HVAC", department: "HVAC/Maintenance", location: "Block B", createdAt: "2026-04-13" },
  ];

  const result = analyzePredictiveMaintenance(complaints, { now, months: 4 });
  assert.equal(result.recurringCategories[0].name, "HVAC");
  assert.equal(result.increasingWorkload[0].name, "HVAC/Maintenance");
  assert.ok(result.recommendations.some((item) => item.name === "Block B"));
  assert.match(result.disclaimer, /not guaranteed/i);
});
