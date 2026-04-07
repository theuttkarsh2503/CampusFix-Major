import { useCallback, useEffect, useState } from "react"
import { CheckCircle2, ClipboardList, LoaderCircle, Clock4 } from "lucide-react"
import { motion } from "framer-motion"
import StatsCard from "../components/dashboard/StatsCard"
import RecentComplaintsTable from "../components/dashboard/RecentComplaintsTable"
import ComplaintForm from "../components/forms/ComplaintForm"
import Loader from "../components/ui/Loader"
import { getDashboardStatsRequest } from "../services/dashboardService"
import { useComplaint } from "../context/ComplaintContext"
import { useAuth } from "../context/AuthContext"

const StudentDashboardPage = () => {
  const MotionDiv = motion.div
  const { createComplaint } = useComplaint()
  const { extractErrorMessage } = useAuth()
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const loadDashboard = useCallback(async () => {
    try {
      setLoading(true)
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

  const handleComplaintSubmit = async (payload) => {
    setSubmitting(true)
    setError("")
    setSuccess("")
    try {
      await createComplaint(payload)
      setSuccess("Complaint submitted successfully.")
      await loadDashboard()
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}
      {success ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {success}
        </div>
      ) : null}

      <MotionDiv
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-5"
      >
        <StatsCard title="Total Tickets" value={stats?.totalComplaints || 0} icon={<ClipboardList size={20} />} />
        <StatsCard
          title="Open"
          value={stats?.statusBreakdown?.OPEN || 0}
          icon={<Clock4 size={20} />}
          accent="text-slate-600"
        />
        <StatsCard
          title="Assigned"
          value={stats?.statusBreakdown?.ASSIGNED || 0}
          icon={<Clock4 size={20} />}
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
          value={stats?.statusBreakdown?.RESOLVED || 0}
          icon={<CheckCircle2 size={20} />}
          accent="text-brand-success"
        />
      </MotionDiv>

      <div className="grid grid-cols-1 gap-6 2xl:grid-cols-[2fr_1fr]">
        <RecentComplaintsTable complaints={stats?.recentComplaints || []} detailBasePath="/app/complaints" />
        <ComplaintForm onSubmit={handleComplaintSubmit} loading={submitting} compact />
      </div>
    </div>
  )
}

export default StudentDashboardPage
