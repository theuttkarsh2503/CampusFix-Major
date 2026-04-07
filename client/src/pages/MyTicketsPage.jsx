import { useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Card from "../components/ui/Card"
import StatusBadge from "../components/ui/StatusBadge"
import Loader from "../components/ui/Loader"
import { useComplaint } from "../context/ComplaintContext"
import { formatDate } from "../utils/format"
import { STATUSES, STATUS_LABELS } from "../utils/constants"

const MyTicketsPage = () => {
  const { complaints, meta, loading, fetchComplaints } = useComplaint()
  const [status, setStatus] = useState("")
  const [page, setPage] = useState(1)

  useEffect(() => {
    fetchComplaints({
      page,
      limit: 10,
      ...(status ? { status } : {}),
    })
  }, [status, page, fetchComplaints])

  if (loading) {
    return <Loader />
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="flex items-center justify-between border-b border-brand-border px-6 py-4">
        <h2 className="font-heading text-xl font-semibold text-brand-text">My Complaints</h2>
        <select
          value={status}
          onChange={(event) => {
            setPage(1)
            setStatus(event.target.value)
          }}
          className="rounded-lg border border-brand-border px-3 py-2 text-sm"
        >
          <option value="">All Statuses</option>
          {STATUSES.map((value) => (
            <option key={value} value={value}>
              {STATUS_LABELS[value]}
            </option>
          ))}
        </select>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-brand-muted">
            <tr>
              <th className="px-6 py-3">Ticket ID</th>
              <th className="px-6 py-3">Title</th>
              <th className="px-6 py-3">Category</th>
              <th className="px-6 py-3">Status</th>
              <th className="px-6 py-3">Created</th>
            </tr>
          </thead>
          <tbody>
            {complaints?.length ? (
              complaints.map((item) => (
                <tr key={item._id} className="border-t border-brand-border/70">
                  <td className="px-6 py-3 font-semibold">
                    <Link to={`/app/complaints/${item._id}`} className="text-brand-primary hover:underline">
                      {item.ticketId}
                    </Link>
                  </td>
                  <td className="px-6 py-3">{item.title}</td>
                  <td className="px-6 py-3 text-brand-muted">{item.category}</td>
                  <td className="px-6 py-3">
                    <StatusBadge status={item.status} />
                  </td>
                  <td className="px-6 py-3 text-brand-muted">{formatDate(item.createdAt)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-brand-muted">
                  No tickets found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-brand-border px-6 py-3">
        <p className="text-sm text-brand-muted">
          Page {meta?.page || 1} of {meta?.totalPages || 1}
        </p>
        <div className="space-x-2">
          <button
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => setPage((prev) => Math.max(1, prev - 1))}
            disabled={page <= 1}
          >
            Prev
          </button>
          <button
            className="rounded-lg border border-brand-border px-3 py-1.5 text-sm disabled:opacity-50"
            onClick={() => setPage((prev) => prev + 1)}
            disabled={page >= (meta?.totalPages || 1)}
          >
            Next
          </button>
        </div>
      </div>
    </Card>
  )
}

export default MyTicketsPage
