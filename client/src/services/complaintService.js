import api from "./api"

const toFormData = (payload = {}) => {
  const formData = new FormData()
  Object.entries(payload).forEach(([key, value]) => {
    if (key === "attachments" && Array.isArray(value)) {
      value.forEach((file) => formData.append("attachments", file))
      return
    }
    if (value !== undefined && value !== null && value !== "") {
      formData.append(key, value)
    }
  })
  return formData
}

export const getComplaintsRequest = async (params = {}) => {
  const response = await api.get("/complaints", { params })
  return response.data
}

export const getComplaintByIdRequest = async (id) => {
  const response = await api.get(`/complaints/${id}`)
  return response.data.data
}

export const createComplaintRequest = async (payload) => {
  const formData = toFormData(payload)
  const response = await api.post("/complaints", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data.data
}

export const exportComplaintsCsvRequest = async (params = {}) => {
  const response = await api.get("/complaints/export/csv", { params, responseType: "blob" })
  return response.data
}

export const classifyComplaintRequest = async (payload) => {
  const response = await api.post("/complaints/classify", payload)
  return response.data.data
}

export const findDuplicateComplaintsRequest = async (payload) => {
  const response = await api.post("/complaints/duplicates", payload)
  return response.data.data
}

export const assignComplaintRequest = async (id, payload) => {
  const response = await api.put(`/complaints/${id}/assign`, payload)
  return response.data.data
}

export const updateComplaintDepartmentRequest = async (id, department) => {
  const response = await api.put(`/complaints/${id}/department`, { department })
  return response.data.data
}

export const updateComplaintPriorityRequest = async (id, priority) => {
  const response = await api.put(`/complaints/${id}/priority`, { priority })
  return response.data.data
}

export const escalateComplaintRequest = async (id, reason = "") => {
  const response = await api.post(`/complaints/${id}/escalate`, { reason })
  return response.data.data
}

export const submitComplaintFeedbackRequest = async (id, payload) => {
  const response = await api.post(`/complaints/${id}/feedback`, payload)
  return response.data.data
}

export const updateComplaintStatusRequest = async (id, payload) => {
  const hasFiles = Array.isArray(payload.attachments) && payload.attachments.length > 0
  if (!hasFiles) {
    const response = await api.put(`/complaints/${id}/status`, payload)
    return response.data.data
  }

  const formData = toFormData(payload)
  const response = await api.put(`/complaints/${id}/status`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  })
  return response.data.data
}

export const deleteComplaintRequest = async (id) => {
  const response = await api.delete(`/complaints/${id}`)
  return response.data
}
