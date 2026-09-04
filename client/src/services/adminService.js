import api from "./api"

export const getAdminDashboardRequest = async (params = {}) => {
  const response = await api.get("/admin/dashboard", { params })
  return response.data.data
}

export const getPredictiveMaintenanceRequest = async (params = {}) => {
  const response = await api.get("/admin/predictive-maintenance", { params })
  return response.data.data
}

export const getUsersRequest = async (params = {}) => {
  const response = await api.get("/admin/users", { params })
  return response.data
}

export const createStaffRequest = async (payload) => {
  const response = await api.post("/admin/staff", payload)
  return response.data.data
}

export const updateUserRoleRequest = async (id, role) => {
  const response = await api.put(`/admin/users/${id}/role`, { role })
  return response.data.data
}
