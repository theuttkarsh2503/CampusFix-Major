import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react"
import { io } from "socket.io-client"
import { useAuth } from "./AuthContext"
import { getNotificationsRequest, markNotificationsReadRequest } from "../services/notificationService"
import { getSocketBaseUrl } from "../services/api"

const NotificationContext = createContext(null)

export const NotificationProvider = ({ children }) => {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [meta, setMeta] = useState({ unread: 0 })
  const [loading, setLoading] = useState(false)
  const [socketConnected, setSocketConnected] = useState(false)

  const loadNotifications = useCallback(async () => {
    if (!user) return
    setLoading(true)
    try {
      const response = await getNotificationsRequest({ page: 1, limit: 20 })
      setNotifications(response.data || [])
      setMeta(response.meta || { unread: 0 })
    } catch {
      // Notification read failures should not block app rendering
    } finally {
      setLoading(false)
    }
  }, [user])

  useEffect(() => {
    loadNotifications()
  }, [loadNotifications])

  useEffect(() => {
    if (!user) {
      setNotifications([])
      setMeta({ unread: 0 })
    }
  }, [user])

  useEffect(() => {
    if (!user?.id) return undefined

    const socket = io(getSocketBaseUrl(), {
      transports: ["websocket"],
      withCredentials: true,
    })

    socket.on("connect", () => {
      setSocketConnected(true)
      socket.emit("auth:register", { userId: user.id })
    })

    socket.on("disconnect", () => {
      setSocketConnected(false)
    })

    socket.on("notification:new", (notification) => {
      setNotifications((prev) => [notification, ...prev])
      setMeta((prev) => ({ ...prev, unread: (prev.unread || 0) + 1 }))
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id])

  const markAllRead = useCallback(async () => {
    if (!user) return
    try {
      await markNotificationsReadRequest({ markAll: true })
      setNotifications((prev) => prev.map((item) => ({ ...item, isRead: true })))
      setMeta((prev) => ({ ...prev, unread: 0 }))
    } catch {
      // Keep UI stable even if marking read fails.
    }
  }, [user])

  const value = useMemo(
    () => ({
      notifications,
      unreadCount: meta.unread || 0,
      loading,
      socketConnected,
      refreshNotifications: loadNotifications,
      markAllRead,
    }),
    [notifications, meta.unread, loading, socketConnected, loadNotifications, markAllRead],
  )

  return <NotificationContext.Provider value={value}>{children}</NotificationContext.Provider>
}

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) {
    throw new Error("useNotifications must be used inside NotificationProvider")
  }
  return context
}
