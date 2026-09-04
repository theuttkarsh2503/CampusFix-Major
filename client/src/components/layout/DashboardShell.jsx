import { NavLink, Outlet } from "react-router-dom"
import { motion } from "framer-motion"
import Sidebar from "./Sidebar"
import TopNavbar from "./TopNavbar"
import { useAuth } from "../../context/AuthContext"

const DashboardShell = ({ navItems }) => {
  const MotionMain = motion.main
  const { user, logout } = useAuth()

  return (
    <div className="flex min-h-screen overflow-x-hidden bg-brand-bg p-3 sm:p-4 md:p-6">
      <div className="hidden lg:block">
        <Sidebar navItems={navItems} onLogout={logout} />
      </div>

      <div className="flex-1 lg:pl-6">
        <TopNavbar user={user} onLogout={logout} />
        <nav className="mb-4 grid grid-cols-2 gap-2 lg:hidden" aria-label="Mobile navigation">
          {navItems.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              className={({ isActive }) =>
                `whitespace-nowrap rounded-xl border px-3 py-2 text-sm font-semibold ${
                  isActive
                    ? "border-brand-primary bg-blue-50 text-brand-primary"
                    : "border-brand-border bg-white text-brand-muted"
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
        </nav>
        <MotionMain
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="space-y-6"
        >
          <Outlet />
        </MotionMain>
      </div>
    </div>
  )
}

export default DashboardShell
