import { lazy, Suspense } from "react"
import { Navigate, Route, Routes } from "react-router-dom"
import DashboardShell from "./components/layout/DashboardShell"
import Loader from "./components/ui/Loader"
import ProtectedRoute from "./components/ui/ProtectedRoute"
import { useAuth } from "./context/AuthContext"
import { ADMIN_NAV, ROLES, STAFF_NAV, STUDENT_NAV, getDashboardRedirect } from "./utils/constants"

const AdminAnalyticsPage = lazy(() => import("./pages/AdminAnalyticsPage"))
const AdminComplaintManagementPage = lazy(() => import("./pages/AdminComplaintManagementPage"))
const AdminDashboardPage = lazy(() => import("./pages/AdminDashboardPage"))
const AdminUserManagementPage = lazy(() => import("./pages/AdminUserManagementPage"))
const ComplaintDetailPage = lazy(() => import("./pages/ComplaintDetailPage"))
const LoginPage = lazy(() => import("./pages/LoginPage"))
const MyTicketsPage = lazy(() => import("./pages/MyTicketsPage"))
const NotFoundPage = lazy(() => import("./pages/NotFoundPage"))
const NotificationsPage = lazy(() => import("./pages/NotificationsPage"))
const ProfilePage = lazy(() => import("./pages/ProfilePage"))
const StaffAssignedTicketsPage = lazy(() => import("./pages/StaffAssignedTicketsPage"))
const StaffDashboardPage = lazy(() => import("./pages/StaffDashboardPage"))
const SignupPage = lazy(() => import("./pages/SignupPage"))
const StudentDashboardPage = lazy(() => import("./pages/StudentDashboardPage"))
const SubmitComplaintPage = lazy(() => import("./pages/SubmitComplaintPage"))

const HomeRedirect = () => {
  const { user } = useAuth()

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return <Navigate to={getDashboardRedirect(user.role)} replace />
}

const App = () => (
  <Suspense fallback={<Loader fullPage />}>
    <Routes>
      <Route path="/" element={<HomeRedirect />} />
      <Route path="/login" element={<LoginPage />} />
      <Route path="/signup" element={<SignupPage />} />

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STUDENT]} />}>
        <Route path="/student-dashboard" element={<Navigate to="/app/dashboard" replace />} />
        <Route path="/app" element={<DashboardShell navItems={STUDENT_NAV} />}>
          <Route path="dashboard" element={<StudentDashboardPage />} />
          <Route path="submit" element={<SubmitComplaintPage />} />
          <Route path="tickets" element={<Navigate to="/app/complaints" replace />} />
          <Route path="complaints" element={<MyTicketsPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.STAFF]} />}>
        <Route path="/staff-dashboard" element={<Navigate to="/staff/dashboard" replace />} />
        <Route path="/staff" element={<DashboardShell navItems={STAFF_NAV} />}>
          <Route path="dashboard" element={<StaffDashboardPage />} />
          <Route path="assigned" element={<StaffAssignedTicketsPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
          <Route path="profile" element={<ProfilePage />} />
        </Route>
      </Route>

      <Route element={<ProtectedRoute allowedRoles={[ROLES.ADMIN]} />}>
        <Route path="/admin-dashboard" element={<Navigate to="/admin/dashboard" replace />} />
        <Route path="/admin" element={<DashboardShell navItems={ADMIN_NAV} />}>
          <Route path="dashboard" element={<AdminDashboardPage />} />
          <Route path="complaints" element={<AdminComplaintManagementPage />} />
          <Route path="complaints/:id" element={<ComplaintDetailPage />} />
          <Route path="users" element={<AdminUserManagementPage />} />
          <Route path="analytics" element={<AdminAnalyticsPage />} />
          <Route path="notifications" element={<NotificationsPage />} />
        </Route>
      </Route>

      <Route path="*" element={<NotFoundPage />} />
    </Routes>
  </Suspense>
)

export default App
