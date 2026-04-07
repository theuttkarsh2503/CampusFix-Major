import { useCallback, useEffect, useState } from "react"
import Card from "../components/ui/Card"
import Input from "../components/ui/Input"
import Button from "../components/ui/Button"
import Loader from "../components/ui/Loader"
import { createStaffRequest, getUsersRequest, updateUserRoleRequest } from "../services/adminService"
import { useAuth } from "../context/AuthContext"
import { ROLE_LABELS, ROLES } from "../utils/constants"

const AdminUserManagementPage = () => {
  const { extractErrorMessage } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [message, setMessage] = useState("")
  const [staffForm, setStaffForm] = useState({
    name: "",
    email: "",
    password: "",
    department: "",
  })

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true)
      const response = await getUsersRequest({ page: 1, limit: 100 })
      setUsers(response.data || [])
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [extractErrorMessage])

  useEffect(() => {
    loadUsers()
  }, [loadUsers])

  const createStaff = async () => {
    try {
      setError("")
      setMessage("")
      await createStaffRequest(staffForm)
      setMessage("Staff account created.")
      setStaffForm({ name: "", email: "", password: "", department: "" })
      await loadUsers()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  const updateRole = async (id, role) => {
    try {
      setError("")
      await updateUserRoleRequest(id, role)
      await loadUsers()
    } catch (err) {
      setError(extractErrorMessage(err))
    }
  }

  if (loading) return <Loader />

  return (
    <div className="space-y-6">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}
      {message ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </div>
      ) : null}

      <Card className="space-y-3">
        <h2 className="font-heading text-xl font-semibold text-brand-text">Create Staff Account</h2>
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
          <Input
            label="Name"
            value={staffForm.name}
            onChange={(event) => setStaffForm((prev) => ({ ...prev, name: event.target.value }))}
          />
          <Input
            label="Email"
            value={staffForm.email}
            onChange={(event) => setStaffForm((prev) => ({ ...prev, email: event.target.value }))}
          />
          <Input
            label="Password"
            type="password"
            value={staffForm.password}
            onChange={(event) => setStaffForm((prev) => ({ ...prev, password: event.target.value }))}
          />
          <Input
            label="Department"
            value={staffForm.department}
            onChange={(event) => setStaffForm((prev) => ({ ...prev, department: event.target.value }))}
          />
        </div>
        <Button onClick={createStaff}>Create Staff</Button>
      </Card>

      <Card className="overflow-hidden p-0">
        <div className="border-b border-brand-border px-5 py-4">
          <h3 className="font-heading text-lg font-semibold text-brand-text">All Users</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="min-w-full text-sm">
            <thead className="bg-slate-50 text-left text-brand-muted">
              <tr>
                <th className="px-5 py-3 font-semibold">Name</th>
                <th className="px-5 py-3 font-semibold">Email</th>
                <th className="px-5 py-3 font-semibold">Department</th>
                <th className="px-5 py-3 font-semibold">Role</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-t border-brand-border/70">
                  <td className="px-5 py-3 text-brand-text">{user.name}</td>
                  <td className="px-5 py-3 text-brand-muted">{user.email}</td>
                  <td className="px-5 py-3 text-brand-muted">{user.department || "-"}</td>
                  <td className="px-5 py-3">
                    <select
                      value={user.role}
                      onChange={(event) => updateRole(user.id, event.target.value)}
                      className="rounded-lg border border-brand-border px-2 py-1 text-xs"
                    >
                      {[ROLES.STUDENT, ROLES.STAFF, ROLES.ADMIN].map((role) => (
                        <option key={role} value={role}>
                          {ROLE_LABELS[role]}
                        </option>
                      ))}
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  )
}

export default AdminUserManagementPage
