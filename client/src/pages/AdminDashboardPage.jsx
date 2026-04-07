import { useCallback, useEffect, useState } from "react"
import { ClipboardList, CircleDot, UserCheck, LoaderCircle, CheckCheck } from "lucide-react"
import StatsCard from "../components/dashboard/StatsCard"
import RecentComplaintsTable from "../components/dashboard/RecentComplaintsTable"
import Loader from "../components/ui/Loader"
import { getAdminDashboardRequest } from "../services/adminService"
import { getComplaintsRequest } from "../services/complaintService"
import { useAuth } from "../context/AuthContext"

const AdminDashboardPage = () => {
  const { extractErrorMessage } = useAuth()
  const [stats, setStats] = useState(null)
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
      const [dashboardData, complaintData] = await Promise.all([
        getAdminDashboardRequest(),
        getComplaintsRequest({ page: 1, limit: 6, sortBy: "createdAt", sortOrder: "desc" }),
      ])
      setStats(dashboardData)
      setRecent(complaintData.data || [])
      setError("")
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [extractErrorMessage])

  useEffect(() => {
    loadDashboard()
  }, [loadDashboard])

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5">
        <StatsCard
          title="Total Complaints"
          value={stats?.summaryCards?.totalComplaints || 0}
          icon={<ClipboardList size={20} />}
        />
        <StatsCard
          title="Open Complaints"
          value={stats?.summaryCards?.openComplaints || 0}
          icon={<CircleDot size={20} />}
          accent="text-slate-600"
        />
        <StatsCard
          title="Assigned"
          value={stats?.summaryCards?.assignedComplaints || 0}
          icon={<UserCheck size={20} />}
          accent="text-purple-600"
        />
        <StatsCard
          title="In Progress"
          value={stats?.summaryCards?.inProgress || 0}
          icon={<LoaderCircle size={20} />}
          accent="text-brand-primary"
        />
        <StatsCard
          title="Resolved Complaints"
          value={(stats?.summaryCards?.resolvedComplaints || 0) + (stats?.summaryCards?.closedComplaints || 0)}
          icon={<CheckCheck size={20} />}
          accent="text-brand-success"
        />
      </div>

      <RecentComplaintsTable complaints={recent} detailBasePath="/admin/complaints" />
    </div>
  )
}

export default AdminDashboardPage
