import api from "./api"

export const getDashboardStatsRequest = async () => {
  const response = await api.get("/dashboard/stats")
  return response.data.data
}
