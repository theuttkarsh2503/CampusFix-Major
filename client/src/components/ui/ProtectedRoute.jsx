import { Navigate, Outlet } from "react-router-dom"
import Loader from "./Loader"
import { useAuth } from "../../context/AuthContext"
import { getDashboardRedirect } from "../../utils/constants"

const ProtectedRoute = ({ allowedRoles }) => {
  const { user, loading } = useAuth()

  if (loading) {
    return <Loader fullPage />
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  if (allowedRoles?.length && !allowedRoles.includes(user.role)) {
    return <Navigate to={getDashboardRedirect(user.role)} replace />
  }

  return <Outlet />
}

export default ProtectedRoute
