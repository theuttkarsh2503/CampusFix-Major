import Card from "../components/ui/Card"
import { useAuth } from "../context/AuthContext"
import { formatDate } from "../utils/format"
import { ROLE_LABELS } from "../utils/constants"

const ProfilePage = () => {
  const { user } = useAuth()

  return (
    <Card className="max-w-2xl">
      <h2 className="font-heading text-2xl font-semibold text-brand-text">Profile</h2>
      <dl className="mt-5 space-y-3">
        <div className="flex justify-between border-b border-brand-border pb-2">
          <dt className="text-sm font-semibold text-brand-muted">Name</dt>
          <dd className="text-sm font-semibold text-brand-text">{user?.name}</dd>
        </div>
        <div className="flex justify-between border-b border-brand-border pb-2">
          <dt className="text-sm font-semibold text-brand-muted">Email</dt>
          <dd className="text-sm font-semibold text-brand-text">{user?.email}</dd>
        </div>
        <div className="flex justify-between border-b border-brand-border pb-2">
          <dt className="text-sm font-semibold text-brand-muted">Role</dt>
          <dd className="text-sm font-semibold text-brand-text">{ROLE_LABELS[user?.role] || user?.role}</dd>
        </div>
        <div className="flex justify-between border-b border-brand-border pb-2">
          <dt className="text-sm font-semibold text-brand-muted">Department</dt>
          <dd className="text-sm font-semibold text-brand-text">{user?.department || "-"}</dd>
        </div>
        <div className="flex justify-between">
          <dt className="text-sm font-semibold text-brand-muted">Joined</dt>
          <dd className="text-sm font-semibold text-brand-text">{formatDate(user?.createdAt)}</dd>
        </div>
      </dl>
    </Card>
  )
}

export default ProfilePage
