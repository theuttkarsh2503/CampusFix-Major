import Card from "../ui/Card"
import StatusBadge from "../ui/StatusBadge"
import { formatDate } from "../../utils/format"
import { Link } from "react-router-dom"

const RecentComplaintsTable = ({ complaints, detailBasePath = null }) => (
  <Card className="overflow-hidden p-0">
    <div className="border-b border-brand-border px-6 py-4">
      <h2 className="font-heading text-lg font-semibold text-brand-text">Recent Complaints</h2>
    </div>
    <div className="overflow-x-auto">
      <table className="min-w-full text-sm">
        <thead className="bg-slate-50 text-left text-brand-muted">
          <tr>
            <th className="px-6 py-3 font-semibold">ID</th>
            <th className="px-6 py-3 font-semibold">Title</th>
            <th className="px-6 py-3 font-semibold">Category</th>
            <th className="px-6 py-3 font-semibold">Status</th>
            <th className="px-6 py-3 font-semibold">Date</th>
          </tr>
        </thead>
        <tbody>
          {complaints?.length ? (
            complaints.map((item) => (
              <tr key={item._id} className="border-t border-brand-border/70">
                <td className="px-6 py-3 font-semibold text-brand-text">
                  {detailBasePath ? (
                    <Link to={`${detailBasePath}/${item._id}`} className="text-brand-primary hover:underline">
                      {item.ticketId}
                    </Link>
                  ) : (
                    item.ticketId
                  )}
                </td>
                <td className="px-6 py-3 text-brand-text">{item.title}</td>
                <td className="px-6 py-3 text-brand-muted">{item.category}</td>
                <td className="px-6 py-3">
                  <StatusBadge status={item.status} />
                </td>
                <td className="px-6 py-3 text-brand-muted">{formatDate(item.createdAt)}</td>
              </tr>
            ))
          ) : (
            <tr>
              <td className="px-6 py-10 text-center text-brand-muted" colSpan={5}>
                No complaints found.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  </Card>
)

export default RecentComplaintsTable
