import axios from "axios"

const API_BASE_URL = import.meta.env.VITE_API_URL || "http://localhost:5000/api"

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
})

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("campusfix_token") || sessionStorage.getItem("campusfix_token_session")
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

export const extractValidationErrors = (error) => {
  const errors = error?.response?.data?.errors
  if (!Array.isArray(errors)) {
    return []
  }
  return errors.map((item) => item?.msg).filter(Boolean)
}

export const getSocketBaseUrl = () => {
  if (API_BASE_URL.startsWith("/")) {
    return window.location.origin
  }
  try {
    const parsed = new URL(API_BASE_URL)
    return `${parsed.protocol}//${parsed.host}`
  } catch {
    return "http://localhost:5000"
  }
}

export const extractErrorMessage = (error) => {
  const responseMessage = error?.response?.data?.message
  const validationMessages = extractValidationErrors(error)
  if (responseMessage && validationMessages.length > 0) {
    return `${responseMessage} ${validationMessages[0]}`
  }
  return responseMessage || error?.message || "Something went wrong."
}

export default api
