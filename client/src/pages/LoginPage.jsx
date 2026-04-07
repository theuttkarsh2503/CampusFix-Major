import { useState } from "react"
import { motion } from "framer-motion"
import { Navigate, useLocation, useNavigate } from "react-router-dom"
import LoginForm from "../components/forms/LoginForm"
import CampusLogo from "../components/ui/CampusLogo"
import { useAuth } from "../context/AuthContext"
import { getDashboardRedirect } from "../utils/constants"

const LoginPage = () => {
  const MotionDiv = motion.div
  const navigate = useNavigate()
  const location = useLocation()
  const { user, login, extractErrorMessage } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleLogin = async (form) => {
    setError("")
    setLoading(true)
    try {
      const authenticatedUser = await login(form)
      navigate(getDashboardRedirect(authenticatedUser.role), { replace: true })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    return <Navigate to={getDashboardRedirect(user.role)} replace />
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-brand-bg p-6">
      <div className="absolute inset-0 panel-grid-bg opacity-60" />
      <div className="absolute -left-24 top-8 h-72 w-72 rounded-full bg-blue-300/30 blur-3xl" />
      <div className="absolute -right-20 bottom-4 h-72 w-72 rounded-full bg-sky-200/40 blur-3xl" />

      <MotionDiv
        initial={{ opacity: 0, y: 24 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35 }}
        className="relative w-full max-w-md rounded-3xl border border-white/30 bg-white/45 p-8 shadow-2xl backdrop-blur-xl"
      >
        <div className="mb-6 flex justify-center">
          <CampusLogo />
        </div>
        {location.state?.registered ? (
          <p className="mb-4 rounded-xl border border-emerald-200 bg-emerald-50 px-3 py-2 text-sm font-semibold text-emerald-700">
            Account created for {location.state?.email}. Please login.
          </p>
        ) : null}
        <LoginForm onSubmit={handleLogin} loading={loading} error={error} />
      </MotionDiv>
    </div>
  )
}

export default LoginPage
