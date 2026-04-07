import api from "./api"

export const getNotificationsRequest = async (params = {}) => {
  const response = await api.get("/notifications", { params })
  return response.data
}

export const markNotificationsReadRequest = async (payload = { markAll: true }) => {
  const response = await api.put("/notifications/read", payload)
  return response.data
}
