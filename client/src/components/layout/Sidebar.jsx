import { NavLink } from "react-router-dom"
import { LayoutDashboard, Send, Ticket, UserCircle2, Shield, LogOut, Bell, Users, BarChart3 } from "lucide-react"
import CampusLogo from "../ui/CampusLogo"

const iconMap = {
  Dashboard: LayoutDashboard,
  "Staff Dashboard": LayoutDashboard,
  "Submit Complaint": Send,
  "My Complaints": Ticket,
  "Assigned Tickets": Ticket,
  "Assigned Complaints": Ticket,
  Notifications: Bell,
  "User Management": Users,
  Analytics: BarChart3,
  "Complaint Management": Ticket,
  Profile: UserCircle2,
  "Admin Dashboard": Shield,
}

const Sidebar = ({ navItems, onLogout }) => (
  <aside className="flex h-screen w-72 flex-col rounded-r-3xl bg-gradient-to-b from-[#1C4DA4] via-[#2563EB] to-[#4B8CF7] p-5 text-white shadow-xl">
    <div className="rounded-2xl bg-white/10 p-3 backdrop-blur-sm">
      <CampusLogo compact />
    </div>

    <nav className="mt-6 flex-1 space-y-2">
      {navItems.map((item) => {
        const Icon = iconMap[item.label] || LayoutDashboard
        return (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all duration-200 ${
                isActive ? "bg-white/20 shadow-lg" : "hover:bg-white/15"
              }`
            }
          >
            <Icon size={16} />
            {item.label}
          </NavLink>
        )
      })}
    </nav>

    <button
      onClick={onLogout}
      className="mt-3 flex items-center gap-3 rounded-xl border border-white/20 px-3 py-2 text-sm font-semibold transition-all duration-200 hover:bg-white/10"
    >
      <LogOut size={16} />
      Logout
    </button>
  </aside>
)

export default Sidebar
