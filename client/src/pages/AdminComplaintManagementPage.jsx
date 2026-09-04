import { useCallback, useEffect, useState } from "react"
import { Link } from "react-router-dom"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import StatusBadge from "../components/ui/StatusBadge"
import Loader from "../components/ui/Loader"
import { CATEGORIES, DEPARTMENTS, PRIORITIES, PRIORITY_LABELS, STATUSES, STATUS_LABELS } from "../utils/constants"
import {
  assignComplaintRequest,
  deleteComplaintRequest,
  exportComplaintsCsvRequest,
  getComplaintsRequest,
  updateComplaintDepartmentRequest,
  updateComplaintPriorityRequest,
  updateComplaintStatusRequest,
} from "../services/complaintService"
import { getUsersRequest } from "../services/adminService"
import { useAuth } from "../context/AuthContext"
import { normalizeStatus } from "../utils/format"
import useDebounce from "../hooks/useDebounce"

const AdminComplaintManagementPage = () => {
  const { extractErrorMessage } = useAuth()
  const [rows, setRows] = useState([])
  const [meta, setMeta] = useState({})
  const [staffUsers, setStaffUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [page, setPage] = useState(1)
  const [deletingId, setDeletingId] = useState("")
  const [exporting, setExporting] = useState(false)
  const [filters, setFilters] = useState({
    search: "",
    status: "",
    category: "",
    priority: "",
    department: "",
    staff: "",
    dateFrom: "",
    dateTo: "",
    slaStatus: "",
  })
  const debouncedSearch = useDebounce(filters.search, 400)

  const updateFilter = (key, value) => {
    setPage(1)
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      const [complaintResponse, staffResponse] = await Promise.all([
        getComplaintsRequest({
          page,
          limit: 10,
          ...(debouncedSearch ? { search: debouncedSearch } : {}),
          ...(filters.status ? { status: filters.status } : {}),
          ...(filters.category ? { category: filters.category } : {}),
          ...(filters.priority ? { priority: filters.priority } : {}),
          ...(filters.department ? { department: filters.department } : {}),
          ...(filters.staff ? { assignedTo: filters.staff } : {}),
          ...(filters.dateFrom ? { dateFrom: filters.dateFrom } : {}),
          ...(filters.dateTo ? { dateTo: filters.dateTo } : {}),
          ...(filters.slaStatus ? { slaStatus: filters.slaStatus } : {}),
        }),
        getUsersRequest({ role: "staff", page: 1, limit: 100 }),
      ])
      setRows(complaintResponse.data || [])
      setMeta(complaintResponse.meta || {})
      setStaffUsers(staffResponse.data || [])
      setError("")
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [page, debouncedSearch, filters.status, filters.category, filters.priority, filters.department, filters.staff, filters.dateFrom, filters.dateTo, filters.slaStatus, extractErrorMessage])

  useEffect(() => {
    loadData()
  }, [loadData])

  const handleAssign = async (complaintId, staffId) => {
    if (!staffId) return
    try {
      await assignComplaintRequest(complaintId, { staffId })
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleAdminClose = async (complaintId) => {
    try {
      await updateComplaintStatusRequest(complaintId, { status: "CLOSED" })
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleDepartmentChange = async (complaintId, department) => {
    if (!department) return
    try {
      await updateComplaintDepartmentRequest(complaintId, department)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handlePriorityChange = async (complaintId, priority) => {
    try {
      await updateComplaintPriorityRequest(complaintId, priority)
      await loadData()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const handleDeleteComplaint = async (complaintId, ticketId) => {
    const confirmed = window.confirm(`Delete complaint ${ticketId}? This action cannot be undone.`)
    if (!confirmed) return

    try {
      setDeletingId(complaintId)
      await deleteComplaintRequest(complaintId)

      if (rows.length === 1 && page > 1) {
        setPage((prev) => prev - 1)
      } else {
        await loadData()
      }
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setDeletingId("")
    }
  }

  const handleExport = async () => {
    try {
      setExporting(true)
      const blob = await exportComplaintsCsvRequest(Object.fromEntries(Object.entries({
        search: debouncedSearch,
        status: filters.status,
        category: filters.category,
        priority: filters.priority,
        department: filters.department,
        assignedTo: filters.staff,
        dateFrom: filters.dateFrom,
        dateTo: filters.dateTo,
        slaStatus: filters.slaStatus,
      }).filter(([, value]) => value)))
      const url = URL.createObjectURL(blob)
      const link = document.createElement("a")
      link.href = url
      link.download = "campusfix-complaints.csv"
      link.click()
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setExporting(false)
    }
  }

  if (loading) {
    return <Loader />
  }

  return (
    <Card className="overflow-hidden p-0">
      <div className="space-y-4 border-b border-brand-border px-5 py-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="font-heading text-xl font-semibold text-brand-text">Complaint Management</h2>
          <button type="button" onClick={handleExport} disabled={exporting} className="rounded-xl bg-brand-primary px-4 py-2 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-60">
            {exporting ? "Exporting..." : "Export CSV"}
          </button>
        </div>
        {error ? (
          <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-2 text-sm font-semibold text-red-600">{error}</div>
        ) : null}
        <div className="grid grid-cols-1 gap-2 md:grid-cols-3 xl:grid-cols-5">
          <input
            value={filters.search}
            onChange={(event) => updateFilter("search", event.target.value)}
            placeholder="Search ID, student, staff, title, description..."
            className="rounded-xl border border-brand-border px-3 py-2 text-sm"
          />
          <select
            value={filters.status}
            onChange={(event) => updateFilter("status", event.target.value)}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm"
          >
            <option value="">All Statuses</option>
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {STATUS_LABELS[status]}
              </option>
            ))}
          </select>
          <select
            value={filters.category}
            onChange={(event) => updateFilter("category", event.target.value)}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          <select
            value={filters.priority}
            onChange={(event) => updateFilter("priority", event.target.value)}
            className="rounded-xl border border-brand-border px-3 py-2 text-sm"
          >
            <option value="">All Priorities</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
          <select value={filters.department} onChange={(event) => updateFilter("department", event.target.value)} className="rounded-xl border border-brand-border px-3 py-2 text-sm">
            <option value="">All Departments</option>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
          <select value={filters.staff} onChange={(event) => updateFilter("staff", event.target.value)} className="rounded-xl border border-brand-border px-3 py-2 text-sm">
            <option value="">All Staff</option>
            {staffUsers.map((staff) => <option key={staff.id} value={staff.id}>{staff.name}</option>)}
          </select>
          <select value={filters.slaStatus} onChange={(event) => updateFilter("slaStatus", event.target.value)} className="rounded-xl border border-brand-border px-3 py-2 text-sm">
            <option value="">All SLA States</option>
            <option value="ON_TRACK">On Track</option>
            <option value="DUE_SOON">Due Soon</option>
            <option value="BREACHED">Breached</option>
            <option value="RESOLVED">Resolved</option>
          </select>
          <input type="date" value={filters.dateFrom} onChange={(event) => updateFilter("dateFrom", event.target.value)} aria-label="From date" className="rounded-xl border border-brand-border px-3 py-2 text-sm" />
          <input type="date" value={filters.dateTo} onChange={(event) => updateFilter("dateTo", event.target.value)} aria-label="To date" className="rounded-xl border border-brand-border px-3 py-2 text-sm" />
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-slate-50 text-left text-brand-muted">
            <tr>
              <th className="px-5 py-3 font-semibold">ID</th>
              <th className="px-5 py-3 font-semibold">Title</th>
              <th className="px-5 py-3 font-semibold">Category</th>
              <th className="px-5 py-3 font-semibold">Department</th>
              <th className="px-5 py-3 font-semibold">Priority</th>
              <th className="px-5 py-3 font-semibold">SLA</th>
              <th className="px-5 py-3 font-semibold">Status</th>
              <th className="px-5 py-3 font-semibold">Assign</th>
              <th className="px-5 py-3 font-semibold">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rows.length ? (
              rows.map((row) => (
                <tr key={row._id} className="border-t border-brand-border/70">
                  <td className="px-5 py-3 font-semibold text-brand-text">{row.ticketId}</td>
                  <td className="px-5 py-3 text-brand-text">{row.title}</td>
                  <td className="px-5 py-3 text-brand-muted">{row.category}</td>
                  <td className="px-5 py-3">
                    <select
                      value={row.department || ""}
                      onChange={(event) => handleDepartmentChange(row._id, event.target.value)}
                      className="rounded-lg border border-brand-border px-2 py-1 text-xs"
                    >
                      <option value="">Select department...</option>
                      {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
                    </select>
                  </td>
                  <td className="px-5 py-3 text-brand-muted">
                    <select
                      value={row.priority}
                      onChange={(event) => handlePriorityChange(row._id, event.target.value)}
                      className="rounded-lg border border-brand-border px-2 py-1 text-xs"
                    >
                      {PRIORITIES.map((priority) => <option key={priority} value={priority}>{PRIORITY_LABELS[priority]}</option>)}
                    </select>
                    <p className="mt-1">Source: {row.prioritySource || "SYSTEM"}</p>
                    {row.classification?.suggestedPriority && row.classification.suggestedPriority !== row.priority ? (
                      <p className="text-xs text-blue-700">System suggests {PRIORITY_LABELS[row.classification.suggestedPriority] || row.classification.suggestedPriority} ({row.classification.suggestedPriorityConfidence || 65}%)</p>
                    ) : null}
                  </td>
                  <td className="px-5 py-3 text-xs font-semibold">
                    <span className={row.slaStatus === "BREACHED" ? "text-red-600" : row.slaStatus === "DUE_SOON" ? "text-amber-600" : row.slaStatus === "RESOLVED" ? "text-emerald-600" : "text-blue-600"}>
                      {row.slaStatus === "BREACHED" ? "SLA Breached" : row.slaStatus === "DUE_SOON" ? "Due Soon" : row.slaStatus === "RESOLVED" ? "Resolved" : "On Track"}
                    </span>
                  </td>
                  <td className="px-5 py-3">
                    <StatusBadge status={row.status} />
                  </td>
                  <td className="px-5 py-3">
                    <select
                      defaultValue=""
                      onChange={(event) => handleAssign(row._id, event.target.value)}
                      disabled={normalizeStatus(row.status) !== "OPEN"}
                      className="rounded-lg border border-brand-border px-2 py-1 text-xs"
                    >
                      <option value="">Assign staff...</option>
                      {staffUsers.map((staff) => (
                        <option key={staff.id} value={staff.id}>
                          {staff.name}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td className="px-5 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link to={`/admin/complaints/${row._id}`} className="text-xs font-semibold text-brand-primary hover:underline">
                        View
                      </Link>
                      {normalizeStatus(row.status) === "RESOLVED" ? (
                        <button
                          onClick={() => handleAdminClose(row._id)}
                          className="text-xs font-semibold text-emerald-600 hover:underline"
                        >
                          Close
                        </button>
                      ) : null}
                      <button
                        onClick={() => handleDeleteComplaint(row._id, row.ticketId)}
                        disabled={deletingId === row._id}
                        className="text-xs font-semibold text-red-600 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                      >
                        {deletingId === row._id ? "Deleting..." : "Delete"}
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={9} className="px-5 py-8 text-center text-brand-muted">
                  No complaints found.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between border-t border-brand-border px-5 py-3 text-sm">
        <p className="text-brand-muted">
          Page {page} of {meta.totalPages || 1}
        </p>
        <div className="space-x-2">
          <Button variant="secondary" onClick={() => setPage((prev) => Math.max(1, prev - 1))} disabled={page <= 1}>
            Prev
          </Button>
          <Button
            variant="secondary"
            onClick={() => setPage((prev) => Math.min(meta.totalPages || 1, prev + 1))}
            disabled={page >= (meta.totalPages || 1)}
          >
            Next
          </Button>
        </div>
      </div>
    </Card>
  )
}

export default AdminComplaintManagementPage
