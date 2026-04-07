import { useState } from "react"
import { motion } from "framer-motion"
import { Navigate, useNavigate } from "react-router-dom"
import SignupForm from "../components/forms/SignupForm"
import CampusLogo from "../components/ui/CampusLogo"
import { registerRequest } from "../services/authService"
import { extractErrorMessage } from "../services/api"
import { useAuth } from "../context/AuthContext"
import { ROLES } from "../utils/constants"

const SignupPage = () => {
  const MotionDiv = motion.div
  const navigate = useNavigate()
  const { user } = useAuth()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleSignup = async (payload) => {
    setError("")
    setLoading(true)
    try {
      await registerRequest(payload)
      navigate("/login", {
        replace: true,
        state: {
          registered: true,
          email: payload.email,
        },
      })
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }

  if (user) {
    if (user.role === ROLES.ADMIN) {
      return <Navigate to="/admin/dashboard" replace />
    }
    if (user.role === ROLES.STAFF) {
      return <Navigate to="/staff/dashboard" replace />
    }
    return <Navigate to="/app/dashboard" replace />
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
        <SignupForm onSubmit={handleSignup} loading={loading} error={error} />
      </MotionDiv>
    </div>
  )
}

export default SignupPage
