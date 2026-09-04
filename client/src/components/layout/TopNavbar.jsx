import { Bell, ChevronDown } from "lucide-react"
import { useState } from "react"
import { Link, useLocation } from "react-router-dom"
import { useNotifications } from "../../context/NotificationContext"
import { ROLE_LABELS } from "../../utils/constants"

const TopNavbar = ({ user, onLogout }) => {
  const [open, setOpen] = useState(false)
  const { unreadCount } = useNotifications()
  const location = useLocation()

  const notificationPath = user?.role === "admin" ? "/admin/notifications" : user?.role === "staff" ? "/staff/notifications" : "/app/notifications"

  return (
    <header className="mb-4 flex items-center justify-between gap-3 rounded-2xl border border-brand-border bg-white/90 px-3 py-3 shadow-lg backdrop-blur sm:mb-6 sm:px-6 sm:py-4">
      <h1 className="min-w-0 truncate font-heading text-base font-bold text-brand-text sm:text-xl">Welcome, {user?.name || "User"}!</h1>

      <div className="relative flex shrink-0 items-center gap-2 sm:gap-4">
        <Link
          to={notificationPath}
          className={`relative rounded-full border border-brand-border p-2.5 text-brand-primary transition hover:bg-blue-50 ${
            location.pathname.includes("/notifications") ? "bg-blue-50" : ""
          }`}
        >
          <Bell size={18} />
          {unreadCount > 0 ? (
            <span className="absolute -right-1 -top-1 inline-flex min-h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-[10px] font-bold text-white">
              {unreadCount > 99 ? "99+" : unreadCount}
            </span>
          ) : null}
        </Link>
        <button
          onClick={() => setOpen((prev) => !prev)}
          className="flex items-center gap-2 rounded-full border border-brand-border bg-white px-2 py-1 pr-3 shadow-sm transition hover:bg-slate-50"
        >
          <img
            src={`https://api.dicebear.com/9.x/bottts-neutral/svg?seed=${encodeURIComponent(user?.name || "user")}`}
            alt="profile"
            className="h-8 w-8 rounded-full"
          />
          <ChevronDown size={16} className="text-brand-muted" />
        </button>

        {open ? (
          <div className="absolute right-0 top-14 z-20 w-52 rounded-xl border border-brand-border bg-white p-2 shadow-xl">
            <div className="border-b border-brand-border px-3 py-2">
              <p className="text-sm font-semibold text-brand-text">{user?.name}</p>
              <p className="text-xs text-brand-muted">{ROLE_LABELS[user?.role] || user?.role}</p>
            </div>
            <button
              onClick={onLogout}
              className="mt-2 w-full rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-500 transition hover:bg-red-50"
            >
              Sign out
            </button>
          </div>
        ) : null}
      </div>
    </header>
  )
}

export default TopNavbar
