import Card from "../ui/Card"
import StatusBadge from "../ui/StatusBadge"
import { formatDate, normalizeStatus } from "../../utils/format"
import { CATEGORIES, STATUS_LABELS } from "../../utils/constants"
import { Link } from "react-router-dom"

const NEXT_STATUS_BY_CURRENT = {
  ASSIGNED: ["IN_PROGRESS"],
  IN_PROGRESS: ["RESOLVED"],
}

const getActionLabel = (status) => {
  if (status === "IN_PROGRESS") return "Accept Complaint"
  if (status === "RESOLVED") return "Mark Resolved"
  return `Mark ${STATUS_LABELS[status] || status}`
}

const StaffAssignedTable = ({
  complaints,
  loading,
  page,
  totalPages,
  search,
  statusFilter,
  categoryFilter,
  onSearch,
  onStatusFilter,
  onCategoryFilter,
  onPageChange,
  onStatusUpdate,
}) => (
  <Card className="overflow-hidden p-0">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
      <h2 className="font-heading text-lg font-semibold text-brand-text">Assigned Tickets</h2>
      <div className="flex flex-wrap gap-2">
        <input
          value={search}
          onChange={(event) => onSearch(event.target.value)}
          placeholder="Search ID or title..."
          className="rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        />
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value)}
          className="rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        >
          <option value="">All Statuses</option>
          <option value="ASSIGNED">Assigned</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
        <select
          value={categoryFilter}
          onChange={(event) => onCategoryFilter(event.target.value)}
          className="rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        >
          <option value="">All Categories</option>
          {CATEGORIES.map((category) => (
            <option key={category} value={category}>
              {category}
            </option>
          ))}
        </select>
      </div>
    </div>

    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-brand-muted">
          <tr>
            <th className="px-5 py-3 font-semibold">ID</th>
            <th className="px-5 py-3 font-semibold">Title</th>
            <th className="px-5 py-3 font-semibold">Category</th>
            <th className="px-5 py-3 font-semibold">Status</th>
            <th className="px-5 py-3 font-semibold">Created By</th>
            <th className="px-5 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {!loading && complaints?.length ? (
            complaints.map((item) => (
              <tr key={item._id} className="border-t border-brand-border/70 align-top">
                <td className="px-5 py-3 font-semibold text-brand-text">
                  <Link to={`/staff/complaints/${item._id}`} className="text-brand-primary hover:underline">
                    {item.ticketId}
                  </Link>
                </td>
                <td className="px-5 py-3 text-brand-text">{item.title}</td>
                <td className="px-5 py-3 text-brand-muted">{item.category}</td>
                <td className="px-5 py-3">
                  <div className="space-y-2">
                    <StatusBadge status={item.status} />
                    {(NEXT_STATUS_BY_CURRENT[normalizeStatus(item.status)] || []).map((status) => (
                      <button
                        key={status}
                        type="button"
                        onClick={() => onStatusUpdate(item._id, status)}
                        className="rounded-lg border border-brand-border bg-white px-2 py-1 text-xs font-semibold text-brand-primary hover:bg-blue-50"
                      >
                        {getActionLabel(status)}
                      </button>
                    ))}
                  </div>
                </td>
                <td className="px-5 py-3 text-brand-muted">{item.createdBy?.name || "-"}</td>
                <td className="px-5 py-3 text-brand-muted">{formatDate(item.createdAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-5 py-10 text-center text-brand-muted">
                {loading ? "Loading tickets..." : "No assigned tickets found."}
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>

    <div className="flex items-center justify-between border-t border-brand-border px-5 py-3 text-sm">
      <p className="text-brand-muted">
        Page {page} of {totalPages || 1}
      </p>
      <div className="space-x-2">
        <button
          onClick={() => onPageChange(page - 1)}
          disabled={page <= 1}
          className="rounded-lg border border-brand-border px-3 py-1.5 font-semibold text-brand-text disabled:opacity-40"
        >
          Prev
        </button>
        <button
          onClick={() => onPageChange(page + 1)}
          disabled={page >= totalPages}
          className="rounded-lg border border-brand-border px-3 py-1.5 font-semibold text-brand-text disabled:opacity-40"
        >
          Next
        </button>
      </div>
    </div>
  </Card>
)

export default StaffAssignedTable
