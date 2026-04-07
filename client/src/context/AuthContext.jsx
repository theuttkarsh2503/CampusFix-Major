import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { extractErrorMessage } from "../services/api"
import { loginRequest, profileRequest } from "../services/authService"

const TOKEN_KEY = "campusfix_token"
const TOKEN_SESSION_KEY = "campusfix_token_session"

const AuthContext = createContext(null)
const normalizeUserRole = (user) => ({ ...user, role: String(user?.role || "").toLowerCase() })

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  const loadProfile = useCallback(async () => {
    try {
      const data = await profileRequest()
      setUser(normalizeUserRole(data))
    } catch {
      localStorage.removeItem(TOKEN_KEY)
      sessionStorage.removeItem(TOKEN_SESSION_KEY)
      setUser(null)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const token = localStorage.getItem(TOKEN_KEY) || sessionStorage.getItem(TOKEN_SESSION_KEY)
    if (!token) {
      setLoading(false)
      return
    }
    loadProfile()
  }, [loadProfile])

  const login = async ({ email, password, rememberMe }) => {
    const data = await loginRequest({ email, password })
    if (rememberMe) {
      localStorage.setItem(TOKEN_KEY, data.token)
      sessionStorage.removeItem(TOKEN_SESSION_KEY)
    } else {
      sessionStorage.setItem(TOKEN_SESSION_KEY, data.token)
      localStorage.removeItem(TOKEN_KEY)
    }

    const normalizedUser = normalizeUserRole(data.user)
    setUser(normalizedUser)
    return normalizedUser
  }

  const logout = () => {
    localStorage.removeItem(TOKEN_KEY)
    sessionStorage.removeItem(TOKEN_SESSION_KEY)
    setUser(null)
  }

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      isAuthenticated: Boolean(user),
      extractErrorMessage,
    }),
    [user, loading],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export const useAuth = () => {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used inside AuthProvider")
  }
  return context
}
