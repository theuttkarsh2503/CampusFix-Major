import { useCallback, useEffect, useState } from "react"
import CategoryPieChart from "../components/charts/CategoryPieChart"
import MonthlyBarChart from "../components/charts/MonthlyBarChart"
import AdvancedAnalyticsCharts from "../components/charts/AdvancedAnalyticsCharts"
import PredictiveMaintenancePanel from "../components/analytics/PredictiveMaintenancePanel"
import Card from "../components/ui/Card"
import Loader from "../components/ui/Loader"
import { getAdminDashboardRequest, getPredictiveMaintenanceRequest, getUsersRequest } from "../services/adminService"
import { useAuth } from "../context/AuthContext"
import StatsCard from "../components/dashboard/StatsCard"
import { TimerReset, CircleDot, UserCheck, CheckCircle2, ClipboardList, Clock3, ShieldAlert, Wrench, ListChecks } from "lucide-react"

const AdminAnalyticsPage = () => {
  const { extractErrorMessage } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [staff, setStaff] = useState([])
  const [filters, setFilters] = useState({ from: "", to: "", category: "", department: "", priority: "", status: "", staff: "" })
  const [appliedFilters, setAppliedFilters] = useState({})
  const [predictiveData, setPredictiveData] = useState(null)

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const [response, predictiveResponse] = await Promise.all([
        getAdminDashboardRequest(appliedFilters),
        getPredictiveMaintenanceRequest({ months: 6 }),
      ])
      setData(response)
      setPredictiveData(predictiveResponse)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [appliedFilters, extractErrorMessage])

  useEffect(() => {
    load()
  }, [load])

  useEffect(() => {
    getUsersRequest({ role: "staff", limit: 100 }).then((response) => setStaff(response.data || [])).catch(() => setStaff([]))
  }, [])

  const applyFilters = (event) => {
    event.preventDefault()
    setAppliedFilters(Object.fromEntries(Object.entries(filters).filter(([, value]) => value)))
  }

  const clearFilters = () => {
    const empty = { from: "", to: "", category: "", department: "", priority: "", status: "", staff: "" }
    setFilters(empty)
    setAppliedFilters({})
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <Card>
        <form className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-4" onSubmit={applyFilters}>
          <label className="text-sm font-semibold text-brand-text">From<input className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" type="date" value={filters.from} onChange={(event) => setFilters({ ...filters, from: event.target.value })} /></label>
          <label className="text-sm font-semibold text-brand-text">To<input className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" type="date" value={filters.to} onChange={(event) => setFilters({ ...filters, to: event.target.value })} /></label>
          <label className="text-sm font-semibold text-brand-text">Category<select className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" value={filters.category} onChange={(event) => setFilters({ ...filters, category: event.target.value })}><option value="">All categories</option>{["Infrastructure", "HVAC", "Electrical", "Cleanliness", "IT & Technical", "Hostel Issues", "Security & Safety", "Water Supply", "Other"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-semibold text-brand-text">Department<select className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" value={filters.department} onChange={(event) => setFilters({ ...filters, department: event.target.value })}><option value="">All departments</option>{["Electrical Maintenance", "Plumbing Maintenance", "HVAC/Maintenance", "Civil Maintenance", "IT Support", "Housekeeping", "Security", "Maintenance", "Admin Review"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-semibold text-brand-text">Priority<select className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" value={filters.priority} onChange={(event) => setFilters({ ...filters, priority: event.target.value })}><option value="">All priorities</option>{["LOW", "MEDIUM", "HIGH"].map((item) => <option key={item}>{item}</option>)}</select></label>
          <label className="text-sm font-semibold text-brand-text">Status<select className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" value={filters.status} onChange={(event) => setFilters({ ...filters, status: event.target.value })}><option value="">All statuses</option>{["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"].map((item) => <option key={item}>{item.replace("_", " ")}</option>)}</select></label>
          <label className="text-sm font-semibold text-brand-text">Staff<select className="mt-1 w-full rounded-lg border border-brand-border px-3 py-2 font-normal" value={filters.staff} onChange={(event) => setFilters({ ...filters, staff: event.target.value })}><option value="">All staff</option>{staff.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select></label>
          <div className="flex items-end gap-2"><button className="rounded-lg bg-brand-primary px-4 py-2 text-sm font-semibold text-white" type="submit">Apply Filters</button><button className="rounded-lg border border-brand-border px-4 py-2 text-sm font-semibold text-brand-text" type="button" onClick={clearFilters}>Clear</button></div>
        </form>
      </Card>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Total Complaints" value={data?.summaryCards?.totalComplaints || 0} icon={<ClipboardList size={20} />} accent="text-brand-primary" />
        <StatsCard
          title="In Progress"
          value={data?.summaryCards?.inProgress || 0}
          icon={<Wrench size={20} />}
          accent="text-amber-600"
        />
        <StatsCard
          title="Open"
          value={data?.summaryCards?.openComplaints || 0}
          icon={<CircleDot size={20} />}
          accent="text-slate-600"
        />
        <StatsCard
          title="Assigned"
          value={data?.summaryCards?.assignedComplaints || 0}
          icon={<UserCheck size={20} />}
          accent="text-indigo-600"
        />
        <StatsCard
          title="Resolved"
          value={data?.summaryCards?.resolvedComplaints || 0}
          icon={<CheckCircle2 size={20} />}
          accent="text-emerald-600"
        />
        <StatsCard title="Closed" value={data?.summaryCards?.closedComplaints || 0} icon={<ListChecks size={20} />} accent="text-emerald-700" />
        <StatsCard title="SLA Breached" value={data?.summaryCards?.slaBreached || 0} icon={<ShieldAlert size={20} />} accent="text-red-600" />
        <StatsCard title="Avg Resolution Time" value={`${Number(data?.averageResolutionHours || 0).toFixed(1)}h`} icon={<TimerReset size={20} />} accent="text-brand-primary" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryPieChart data={data?.categoryBreakdown || []} />
        <MonthlyBarChart data={data?.monthlyComplaints || []} />
      </div>

      <AdvancedAnalyticsCharts data={data} />

      <PredictiveMaintenancePanel data={predictiveData} />

      <Card className="overflow-hidden p-0">
        <div className="border-b border-brand-border px-5 py-4">
          <h3 className="font-heading text-lg font-semibold text-brand-text">Staff Performance</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-brand-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Staff</th>
                <th className="px-5 py-3 font-semibold">Assigned</th>
                <th className="px-5 py-3 font-semibold">Resolved</th>
                <th className="px-5 py-3 font-semibold">In Progress</th>
                <th className="px-5 py-3 font-semibold">Completion</th>
                <th className="px-5 py-3 font-semibold">Rating</th>
              </tr>
            </thead>
            <tbody>
              {(data?.staffPerformance || []).map((row) => (
                <tr key={String(row.staffId)} className="border-t border-brand-border/70">
                  <td className="px-5 py-3 text-brand-text">{row.staffName}</td>
                  <td className="px-5 py-3 text-brand-muted">{row.totalAssigned}</td>
                  <td className="px-5 py-3 text-brand-muted">{row.resolvedCount}</td>
                  <td className="px-5 py-3 text-brand-muted">{row.inProgressCount}</td>
                  <td className="px-5 py-3 text-brand-muted">{Number(row.completionRate || 0).toFixed(1)}%</td>
                  <td className="px-5 py-3 text-brand-muted">{row.ratingCount ? `${Number(row.averageRating || 0).toFixed(1)} / 5 (${row.ratingCount})` : "No ratings"}</td>
                </tr>
              ))}
              {!(data?.staffPerformance || []).length ? (
                <tr>
                  <td colSpan={6} className="px-5 py-8 text-center text-brand-muted">
                    No staff performance data yet.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminAnalyticsPage
