import { createContext, useCallback, useContext, useMemo, useState } from "react"
import { createComplaintRequest, getComplaintsRequest } from "../services/complaintService"
import { extractErrorMessage } from "../services/api"

const ComplaintContext = createContext(null)

export const ComplaintProvider = ({ children }) => {
  const [complaints, setComplaints] = useState([])
  const [meta, setMeta] = useState(null)
  const [loading, setLoading] = useState(false)

  const fetchComplaints = useCallback(async (params = {}) => {
    setLoading(true)
    try {
      const response = await getComplaintsRequest(params)
      setComplaints(response.data)
      setMeta(response.meta)
      return response
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    } finally {
      setLoading(false)
    }
  }, [])

  const createComplaint = async (payload) => {
    try {
      const created = await createComplaintRequest(payload)
      setComplaints((prev) => [created, ...prev])
      return created
    } catch (error) {
      throw new Error(extractErrorMessage(error))
    }
  }

  const value = useMemo(
    () => ({
      complaints,
      meta,
      loading,
      fetchComplaints,
      createComplaint,
    }),
    [complaints, loading, meta, fetchComplaints],
  )

  return <ComplaintContext.Provider value={value}>{children}</ComplaintContext.Provider>
}

export const useComplaint = () => {
  const context = useContext(ComplaintContext)
  if (!context) {
    throw new Error("useComplaint must be used inside ComplaintProvider")
  }
  return context
}
