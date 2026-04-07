const test = require("node:test");
const assert = require("node:assert/strict");
const mongoose = require("mongoose");
const Complaint = require("../models/Complaint");

const makeBasePayload = () => ({
  title: "Water leakage in hostel corridor",
  description: "There is a continuous leakage near room 204 causing slippery floor.",
  category: "Infrastructure",
  location: "Hostel Block B",
  createdBy: new mongoose.Types.ObjectId(),
});

test("normalizes legacy complaint values during validation", async () => {
  const complaint = new Complaint({
    ...makeBasePayload(),
    ticketId: "CFX-LEGACY1",
    category: "Maintenance",
    priority: "Medium",
    status: "In Progress",
  });

  await complaint.validate();

  assert.equal(complaint.category, "Infrastructure");
  assert.equal(complaint.priority, "MEDIUM");
  assert.equal(complaint.status, "IN_PROGRESS");
});

test("normalizes overdue legacy status to OPEN", async () => {
  const complaint = new Complaint({
    ...makeBasePayload(),
    ticketId: "CFX-LEGACY2",
    status: "Overdue",
  });

  await complaint.validate();

  assert.equal(complaint.status, "OPEN");
});

test("generates ticket id for new complaints", async () => {
  const complaint = new Complaint({
    ...makeBasePayload(),
    priority: "high",
    status: "open",
  });

  await complaint.validate();

  assert.match(complaint.ticketId, /^CFX-[A-Z0-9]{6}$/);
  assert.equal(complaint.priority, "HIGH");
  assert.equal(complaint.status, "OPEN");
});
