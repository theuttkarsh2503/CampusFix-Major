const addTimelineEvent = (complaint, event) => {
  complaint.timeline = complaint.timeline || [];
  complaint.timeline.push({
    eventType: event.eventType,
    title: event.title,
    description: event.description || "",
    timestamp: event.timestamp || new Date(),
    actorId: event.actorId || null,
    actorName: event.actorName || "System",
  });
};

const getLegacyTimeline = (complaint) => {
  const timeline = [
    { eventType: "CREATED", title: "Complaint Created", timestamp: complaint.createdAt, actorName: "Student" },
  ];
  if (complaint.assignedTo) {
    timeline.push({ eventType: "ASSIGNED", title: "Complaint Assigned", timestamp: complaint.updatedAt || complaint.createdAt, actorName: "Admin" });
  }
  if (complaint.status === "IN_PROGRESS" || complaint.status === "RESOLVED" || complaint.status === "CLOSED") {
    timeline.push({ eventType: "IN_PROGRESS", title: "Staff Started Work", timestamp: complaint.updatedAt || complaint.createdAt, actorName: "Staff" });
  }
  if (complaint.resolvedAt) timeline.push({ eventType: "RESOLVED", title: "Marked Resolved", timestamp: complaint.resolvedAt, actorName: "Staff" });
  if (complaint.submittedAt) timeline.push({ eventType: "FEEDBACK", title: "Student Confirmed Resolution", timestamp: complaint.submittedAt, actorName: "Student" });
  if (complaint.closedAt) timeline.push({ eventType: "CLOSED", title: "Complaint Closed", timestamp: complaint.closedAt, actorName: "Admin" });
  // Legacy records do not contain assignment/progress timestamps; preserve workflow order.
  return timeline;
};

const getComplaintTimeline = (complaint) => complaint.timeline?.length ? complaint.timeline : getLegacyTimeline(complaint);

module.exports = { addTimelineEvent, getComplaintTimeline };
