import { Link } from "react-router-dom"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import { useAuth } from "../context/AuthContext"
import { useNotifications } from "../context/NotificationContext"
import { formatDateTime } from "../utils/format"

const NotificationsPage = () => {
  const { notifications, unreadCount, markAllRead, markRead, loading } = useNotifications()
  const { user } = useAuth()
  const complaintPath = user?.role === "admin" ? "/admin/complaints" : user?.role === "staff" ? "/staff/assigned" : "/app/complaints"

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <h2 className="font-heading text-2xl font-semibold text-brand-text">Notifications</h2>
        <div className="flex items-center gap-3">
          <p className="text-sm text-brand-muted">Unread: {unreadCount}</p>
          <Button variant="secondary" onClick={markAllRead} disabled={unreadCount === 0}>
            Mark all as read
          </Button>
        </div>
      </div>

      <div className="space-y-3">
        {loading ? <p className="text-sm text-brand-muted">Loading notifications...</p> : null}
        {!loading && notifications.length === 0 ? (
          <p className="text-sm text-brand-muted">No notifications yet.</p>
        ) : null}
        {notifications.map((item) => (
          <div
            key={item.id || item._id}
            className={`rounded-xl border px-4 py-3 ${
              item.isRead ? "border-brand-border bg-white" : "border-blue-200 bg-blue-50"
            }`}
          >
            <p className="text-sm font-semibold text-brand-text">{item.message}</p>
            <div className="mt-2 flex flex-wrap items-center gap-3 text-xs text-brand-muted">
              <span>{formatDateTime(item.createdAt)}</span>
              {!item.isRead ? <button type="button" onClick={() => markRead(item.id || item._id)} className="font-semibold text-brand-primary hover:underline">Mark as read</button> : null}
              {item.meta?.complaintId ? <Link to={`${complaintPath}/${item.meta.complaintId}`} className="font-semibold text-brand-primary hover:underline">View complaint</Link> : null}
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

export default NotificationsPage
