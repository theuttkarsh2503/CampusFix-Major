import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, ClipboardList, LoaderCircle, TriangleAlert } from "lucide-react"
import StatsCard from "../components/dashboard/StatsCard"
import RecentComplaintsTable from "../components/dashboard/RecentComplaintsTable"
import Card from "../components/ui/Card"
import Loader from "../components/ui/Loader"
import { getDashboardStatsRequest } from "../services/dashboardService"
import { useAuth } from "../context/AuthContext"

const StaffDashboardPage = () => {
  const { extractErrorMessage } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const data = await getDashboardStatsRequest()
      setStats(data)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [extractErrorMessage])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <StatsCard title="Visible Tickets" value={stats?.totalComplaints || 0} icon={<ClipboardList size={20} />} />
        <StatsCard
          title="Assigned"
          value={stats?.statusBreakdown?.ASSIGNED || 0}
          icon={<TriangleAlert size={20} />}
          accent="text-purple-600"
        />
        <StatsCard
          title="In Progress"
          value={stats?.statusBreakdown?.IN_PROGRESS || 0}
          icon={<LoaderCircle size={20} />}
          accent="text-brand-primary"
        />
        <StatsCard
          title="Resolved"
          value={(stats?.statusBreakdown?.RESOLVED || 0) + (stats?.statusBreakdown?.CLOSED || 0)}
          icon={<CheckCircle2 size={20} />}
          accent="text-brand-success"
        />
      </div>

      <Card className="p-4">
        <p className="text-sm font-semibold text-brand-text">
          Staff actions:
          <span className="ml-2 font-medium text-brand-muted">
            Open Assigned Complaints to accept and resolve tickets.
          </span>
        </p>
      </Card>

      <RecentComplaintsTable complaints={stats?.recentComplaints || []} detailBasePath="/staff/complaints" />
    </div>
  )
}

export default StaffDashboardPage
