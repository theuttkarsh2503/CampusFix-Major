import { useCallback, useEffect, useState } from "react"
import CategoryPieChart from "../components/charts/CategoryPieChart"
import MonthlyBarChart from "../components/charts/MonthlyBarChart"
import Card from "../components/ui/Card"
import Loader from "../components/ui/Loader"
import { getAdminDashboardRequest } from "../services/adminService"
import { useAuth } from "../context/AuthContext"
import StatsCard from "../components/dashboard/StatsCard"
import { TimerReset, CircleDot, UserCheck, CheckCircle2 } from "lucide-react"

const AdminAnalyticsPage = () => {
  const { extractErrorMessage } = useAuth()
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const load = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const response = await getAdminDashboardRequest()
      setData(response)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [extractErrorMessage])

  useEffect(() => {
    load()
  }, [load])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard
          title="Avg Resolution Time"
          value={`${Number(data?.averageResolutionHours || 0).toFixed(1)}h`}
          icon={<TimerReset size={20} />}
          accent="text-brand-primary"
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
          accent="text-purple-600"
        />
        <StatsCard
          title="Closed"
          value={data?.summaryCards?.closedComplaints || 0}
          icon={<CheckCircle2 size={20} />}
          accent="text-emerald-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <CategoryPieChart data={data?.categoryBreakdown || []} />
        <MonthlyBarChart data={data?.monthlyComplaints || []} />
      </div>

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
                </tr>
              ))}
              {!(data?.staffPerformance || []).length ? (
                <tr>
                  <td colSpan={5} className="px-5 py-8 text-center text-brand-muted">
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
