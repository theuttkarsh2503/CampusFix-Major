import { useCallback, useEffect, useState } from "react"
import StaffAssignedTable from "../components/dashboard/StaffAssignedTable"
import { useAuth } from "../context/AuthContext"
import useDebounce from "../hooks/useDebounce"
import { getComplaintsRequest, updateComplaintStatusRequest } from "../services/complaintService"

const StaffAssignedTicketsPage = () => {
  const { user, extractErrorMessage } = useAuth()
  const [complaints, setComplaints] = useState([])
  const [meta, setMeta] = useState({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("")
  const [categoryFilter, setCategoryFilter] = useState("")
  const [page, setPage] = useState(1)

  const debouncedSearch = useDebounce(search, 400)

  const loadAssignedTickets = useCallback(async () => {
    if (!user?.id) return

    setLoading(true)
    try {
      const response = await getComplaintsRequest({
        page,
        limit: 10,
        assignedTo: user.id,
        ...(statusFilter ? { status: statusFilter } : {}),
        ...(categoryFilter ? { category: categoryFilter } : {}),
        ...(debouncedSearch ? { search: debouncedSearch } : {}),
      })
      setComplaints(response.data || [])
      setMeta(response.meta || {})
      setError("")
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [user?.id, page, statusFilter, categoryFilter, debouncedSearch, extractErrorMessage])

  useEffect(() => {
    loadAssignedTickets()
  }, [loadAssignedTickets])

  const handleStatusUpdate = async (complaintId, status) => {
    try {
      await updateComplaintStatusRequest(complaintId, { status })
      await loadAssignedTickets()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <StaffAssignedTable
        complaints={complaints}
        loading={loading}
        page={page}
        totalPages={meta.totalPages || 1}
        search={search}
        statusFilter={statusFilter}
        categoryFilter={categoryFilter}
        onSearch={(value) => {
          setPage(1)
          setSearch(value)
        }}
        onStatusFilter={(value) => {
          setPage(1)
          setStatusFilter(value)
        }}
        onCategoryFilter={(value) => {
          setPage(1)
          setCategoryFilter(value)
        }}
        onPageChange={(nextPage) => setPage(Math.max(1, Math.min(nextPage, meta.totalPages || 1)))}
        onStatusUpdate={handleStatusUpdate}
      />
    </div>
  )
}

export default StaffAssignedTicketsPage
