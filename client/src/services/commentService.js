import api from "./api"

export const addCommentRequest = async (payload) => {
  const response = await api.post("/comments", payload)
  return response.data.data
}

export const getCommentsRequest = async (complaintId) => {
  const response = await api.get(`/comments/${complaintId}`)
  return response.data.data
}
