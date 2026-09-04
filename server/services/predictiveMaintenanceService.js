const monthKey = (date) => {
  const value = new Date(date);
  return `${value.getUTCFullYear()}-${String(value.getUTCMonth() + 1).padStart(2, "0")}`;
};

const monthLabel = (key) => {
  const [year, month] = key.split("-");
  return new Date(Date.UTC(Number(year), Number(month) - 1, 1)).toLocaleDateString("en", { month: "short" });
};

const getMonthKeys = (now, months) => {
  const current = new Date(now);
  return Array.from({ length: months }, (_, index) => monthKey(new Date(Date.UTC(current.getUTCFullYear(), current.getUTCMonth() - months + index + 1, 1))));
};

const analyzeDimension = (complaints, field, monthKeys) => {
  const groups = new Map();
  complaints.forEach((complaint) => {
    const value = String(complaint[field] || "").trim() || "Unspecified";
    if (!groups.has(value)) groups.set(value, new Map());
    const counts = groups.get(value);
    const key = monthKey(complaint.createdAt);
    counts.set(key, (counts.get(key) || 0) + 1);
  });

  return [...groups.entries()].map(([name, counts]) => {
    const monthlyCounts = monthKeys.map((key) => counts.get(key) || 0);
    const first = monthlyCounts[0];
    const latest = monthlyCounts[monthlyCounts.length - 1];
    const total = monthlyCounts.reduce((sum, count) => sum + count, 0);
    const trendPercent = first ? Math.round(((latest - first) / first) * 100) : latest ? 100 : 0;
    return {
      name,
      monthlyCounts: monthKeys.map((key, index) => ({ month: monthLabel(key), count: monthlyCounts[index] })),
      total,
      trend: latest > first && latest >= 2 ? "INCREASING" : latest < first ? "DECREASING" : "STABLE",
      trendPercent,
    };
  }).filter((item) => item.total >= 2).sort((a, b) => b.total - a.total);
};

const analyzePredictiveMaintenance = (complaints = [], options = {}) => {
  const months = Math.min(12, Math.max(3, Number(options.months) || 6));
  const now = options.now ? new Date(options.now) : new Date();
  const monthKeys = getMonthKeys(now, months);
  const categories = analyzeDimension(complaints, "category", monthKeys);
  const departments = analyzeDimension(complaints, "department", monthKeys);
  const locations = analyzeDimension(complaints, "location", monthKeys);
  const increasing = [
    ...categories.map((item) => ({ ...item, dimension: "category" })),
    ...departments.map((item) => ({ ...item, dimension: "department" })),
    ...locations.map((item) => ({ ...item, dimension: "location" })),
  ].filter((item) => item.trend === "INCREASING").sort((a, b) => b.trendPercent - a.trendPercent || b.total - a.total).slice(0, 10);

  const recommendations = increasing.map((item) => ({
    type: item.dimension,
    name: item.name,
    severity: item.trendPercent >= 100 || item.total >= 5 ? "HIGH" : "MEDIUM",
    monthlyCounts: item.monthlyCounts,
    message: `${item.name} complaints are increasing (${item.monthlyCounts.map((month) => month.count).join(" -> ")}).`,
    recommendation: item.dimension === "department" ? `Review workload and schedule preventive work for ${item.name}.` : `Schedule a preventive inspection for ${item.name}.`,
  }));

  return {
    generatedAt: now,
    lookbackMonths: months,
    methodology: "Monthly complaint frequency and trend analysis",
    disclaimer: "These are statistical maintenance recommendations, not guaranteed predictions.",
    recurringCategories: categories.slice(0, 10),
    recurringLocations: locations.slice(0, 10),
    increasingWorkload: departments.filter((item) => item.trend === "INCREASING").slice(0, 10),
    increasingTrends: increasing,
    recommendations,
  };
};

module.exports = { analyzePredictiveMaintenance };
