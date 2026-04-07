import { Search } from "lucide-react"
import Card from "../ui/Card"
import StatusBadge from "../ui/StatusBadge"
import { STATUSES, STATUS_LABELS } from "../../utils/constants"
import { formatDate } from "../../utils/format"

const ManageTicketsTable = ({
  complaints,
  assignableUsers,
  page,
  totalPages,
  search,
  statusFilter,
  onSearch,
  onStatusFilter,
  onStatusUpdate,
  onAssigneeUpdate,
  onPageChange,
}) => (
  <Card className="overflow-hidden p-0">
    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-brand-border px-5 py-4">
      <h2 className="font-heading text-lg font-semibold text-brand-text">Manage Tickets</h2>
      <div className="flex flex-wrap gap-2">
        <div className="relative">
          <Search size={15} className="pointer-events-none absolute left-3 top-3 text-brand-muted" />
          <input
            value={search}
            onChange={(event) => onSearch(event.target.value)}
            placeholder="Search ticket or title..."
            className="rounded-xl border border-brand-border py-2 pl-9 pr-3 text-sm focus:border-brand-primary focus:outline-none"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(event) => onStatusFilter(event.target.value)}
          className="rounded-xl border border-brand-border px-3 py-2 text-sm focus:border-brand-primary focus:outline-none"
        >
          <option value="">All</option>
          {STATUSES.map((status) => (
            <option key={status} value={status}>
              {STATUS_LABELS[status] || status}
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
            <th className="px-5 py-3 font-semibold">Assigned To</th>
            <th className="px-5 py-3 font-semibold">Created</th>
          </tr>
        </thead>
        <tbody>
          {complaints?.length ? (
            complaints.map((complaint) => (
              <tr key={complaint._id} className="border-t border-brand-border/70 align-top">
                <td className="px-5 py-3 font-semibold text-brand-text">{complaint.ticketId}</td>
                <td className="px-5 py-3 text-brand-text">{complaint.title}</td>
                <td className="px-5 py-3 text-brand-muted">{complaint.category}</td>
                <td className="px-5 py-3">
                  <div className="space-y-2">
                    <StatusBadge status={complaint.status} />
                    <select
                      value={complaint.status}
                      onChange={(event) => onStatusUpdate(complaint._id, event.target.value)}
                      className="block rounded-lg border border-brand-border px-2 py-1 text-xs focus:border-brand-primary focus:outline-none"
                    >
                      {STATUSES.map((status) => (
                        <option key={status} value={status}>
                          {STATUS_LABELS[status] || status}
                        </option>
                      ))}
                    </select>
                  </div>
                </td>
                <td className="px-5 py-3">
                  <select
                    value={complaint.assignedTo?._id || ""}
                    onChange={(event) => onAssigneeUpdate(complaint._id, event.target.value)}
                    className="rounded-lg border border-brand-border px-2 py-1 text-xs focus:border-brand-primary focus:outline-none"
                  >
                    <option value="">Unassigned</option>
                    {assignableUsers?.map((user) => (
                      <option key={user.id || user._id} value={user.id || user._id}>
                        {user.name}
                      </option>
                    ))}
                  </select>
                </td>
                <td className="px-5 py-3 text-brand-muted">{formatDate(complaint.createdAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td colSpan={6} className="px-5 py-9 text-center text-brand-muted">
                No tickets found.
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

export default ManageTicketsTable
