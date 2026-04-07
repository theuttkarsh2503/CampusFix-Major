import api from "./api"

export const loginRequest = async (payload) => {
  const response = await api.post("/auth/login", payload)
  return response.data.data
}

export const registerRequest = async (payload) => {
  const response = await api.post("/auth/register", payload)
  return response.data.data
}

export const profileRequest = async () => {
  const response = await api.get("/auth/profile")
  return response.data.data
}

export const usersRequest = async (params) => {
  const response = await api.get("/auth/users", { params })
  return response.data
}
