import Card from "../ui/Card"

const StatsCard = ({ title, value, icon, accent = "text-brand-primary" }) => (
  <Card className="p-4">
    <div className="flex items-start justify-between gap-3">
      <div>
        <p className="text-xs font-semibold uppercase tracking-wider text-brand-muted">{title}</p>
        <p className="mt-1 text-3xl font-heading font-bold text-brand-text">{value}</p>
      </div>
      <div className={`rounded-xl bg-slate-50 p-3 ${accent}`}>{icon}</div>
    </div>
  </Card>
)

export default StatsCard
