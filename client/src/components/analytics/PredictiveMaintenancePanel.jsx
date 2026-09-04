import Card from "../ui/Card"

const TrendRow = ({ item }) => (
  <div className="rounded-xl border border-brand-border bg-white p-3">
    <div className="flex flex-wrap items-center justify-between gap-2">
      <p className="font-semibold text-brand-text">{item.name}</p>
      <span className={`rounded-full px-2 py-1 text-xs font-semibold ${item.severity === "HIGH" ? "bg-red-100 text-red-700" : "bg-amber-100 text-amber-700"}`}>
        {item.severity || item.trend}
      </span>
    </div>
    <div className="mt-2 flex flex-wrap gap-2 text-xs text-brand-muted">
      {item.monthlyCounts.map((month, index) => <span key={`${month.month}-${index}`} className="rounded bg-slate-50 px-2 py-1">{month.month}: {month.count}</span>)}
    </div>
    {item.recommendation ? <p className="mt-2 text-sm text-brand-muted">{item.recommendation}</p> : null}
  </div>
)

const PredictiveMaintenancePanel = ({ data }) => (
  <Card className="space-y-4">
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h3 className="font-heading text-xl font-semibold text-brand-text">Predictive Maintenance</h3>
        <p className="text-sm text-brand-muted">Historical trend analysis over the last {data?.lookbackMonths || 6} months</p>
      </div>
      <span className="rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-700">Recommendations only</span>
    </div>
    <p className="rounded-lg border border-blue-100 bg-blue-50 px-3 py-2 text-sm text-blue-900">{data?.disclaimer}</p>
    {data?.recommendations?.length ? (
      <div className="space-y-3">
        <h4 className="font-semibold text-brand-text">Maintenance risks</h4>
        {data.recommendations.map((item, index) => <TrendRow key={`${item.type}-${item.name}-${index}`} item={item} />)}
      </div>
    ) : <p className="rounded-xl bg-slate-50 px-4 py-5 text-sm text-brand-muted">No increasing maintenance trends detected in this period.</p>}
    <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
      <div>
        <h4 className="mb-2 font-semibold text-brand-text">Recurring categories</h4>
        <p className="text-sm text-brand-muted">{data?.recurringCategories?.length ? data.recurringCategories.map((item) => `${item.name} (${item.total})`).join(", ") : "No recurring categories yet."}</p>
      </div>
      <div>
        <h4 className="mb-2 font-semibold text-brand-text">Frequently affected areas</h4>
        <p className="text-sm text-brand-muted">{data?.recurringLocations?.length ? data.recurringLocations.map((item) => `${item.name} (${item.total})`).join(", ") : "No recurring areas yet."}</p>
      </div>
    </div>
  </Card>
)

export default PredictiveMaintenancePanel
