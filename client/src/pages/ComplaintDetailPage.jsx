import { useCallback, useEffect, useMemo, useState } from "react"
import { Link, useParams } from "react-router-dom"
import { io } from "socket.io-client"
import Card from "../components/ui/Card"
import Button from "../components/ui/Button"
import Input from "../components/ui/Input"
import StatusBadge from "../components/ui/StatusBadge"
import Loader from "../components/ui/Loader"
import { useAuth } from "../context/AuthContext"
import { getComplaintByIdRequest, updateComplaintStatusRequest } from "../services/complaintService"
import { addCommentRequest, getCommentsRequest } from "../services/commentService"
import { getSocketBaseUrl } from "../services/api"
import { formatDateTime, normalizeStatus } from "../utils/format"
import { PRIORITY_LABELS, ROLES, STATUS_LABELS } from "../utils/constants"

const WORKFLOW_STEPS = ["OPEN", "ASSIGNED", "IN_PROGRESS", "RESOLVED", "CLOSED"]

const statusActionsByRole = (role, currentStatus) => {
  const normalized = normalizeStatus(currentStatus)

  if (role === ROLES.STAFF) {
    if (normalized === "ASSIGNED") return ["IN_PROGRESS"]
    if (normalized === "IN_PROGRESS") return ["RESOLVED"]
    return []
  }

  if (role === ROLES.ADMIN) {
    if (normalized === "RESOLVED") return ["CLOSED"]
    return []
  }

  return []
}

const getStatusActionLabel = (nextStatus) => {
  if (nextStatus === "IN_PROGRESS") return "Accept & Start Work"
  if (nextStatus === "RESOLVED") return "Mark as Resolved"
  if (nextStatus === "CLOSED") return "Close Complaint"
  return `Mark as ${STATUS_LABELS[nextStatus] || nextStatus}`
}

const ComplaintDetailPage = () => {
  const { id } = useParams()
  const { user, extractErrorMessage } = useAuth()
  const [complaint, setComplaint] = useState(null)
  const [comments, setComments] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")
  const [commentText, setCommentText] = useState("")
  const [resolutionNotes, setResolutionNotes] = useState("")
  const [updatingStatus, setUpdatingStatus] = useState(false)
  const [postingComment, setPostingComment] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError("")
      const [complaintData, commentData] = await Promise.all([
        getComplaintByIdRequest(id),
        getCommentsRequest(id),
      ])
      setComplaint(complaintData)
      setComments(commentData)
      setResolutionNotes(complaintData?.resolutionNotes || "")
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setLoading(false)
    }
  }, [id, extractErrorMessage])

  useEffect(() => {
    loadData()
  }, [loadData])

  useEffect(() => {
    if (!user?.id || !id) return undefined

    const socket = io(getSocketBaseUrl(), {
      transports: ["websocket"],
      withCredentials: true,
    })

    socket.on("connect", () => {
      socket.emit("auth:register", { userId: user.id })
      socket.emit("complaint:join", { complaintId: id })
    })

    socket.on("complaint:updated", (updatedComplaint) => {
      if (String(updatedComplaint?._id) === String(id)) {
        setComplaint(updatedComplaint)
      }
    })

    socket.on("comment:new", (incomingComment) => {
      if (String(incomingComment?.complaintId) !== String(id)) return
      setComments((prev) => {
        if (prev.some((item) => item._id === incomingComment._id)) return prev
        return [...prev, incomingComment]
      })
    })

    return () => {
      socket.disconnect()
    }
  }, [user?.id, id])

  const availableStatusActions = useMemo(
    () => statusActionsByRole(user?.role, complaint?.status),
    [user?.role, complaint?.status],
  )
  const currentStepIndex = useMemo(
    () => WORKFLOW_STEPS.indexOf(normalizeStatus(complaint?.status)),
    [complaint?.status],
  )

  const onUpdateStatus = async (nextStatus) => {
    try {
      setUpdatingStatus(true)
      const updated = await updateComplaintStatusRequest(id, {
        status: nextStatus,
        resolutionNotes,
      })
      setComplaint(updated)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setUpdatingStatus(false)
    }
  }

  const onAddComment = async () => {
    if (!commentText.trim()) return
    try {
      setPostingComment(true)
      await addCommentRequest({ complaintId: id, message: commentText.trim() })
      setCommentText("")
      const latest = await getCommentsRequest(id)
      setComments(latest)
    } catch (err) {
      setError(extractErrorMessage(err))
    } finally {
      setPostingComment(false)
    }
  }

  if (loading) return <Loader />

  if (!complaint) {
    return (
      <Card>
        <p className="text-sm text-brand-muted">Complaint not found.</p>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      {error ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</div>
      ) : null}

      <Card className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="font-heading text-2xl font-semibold text-brand-text">{complaint.title}</h2>
            <p className="text-sm text-brand-muted">{complaint.ticketId}</p>
          </div>
          <StatusBadge status={complaint.status} />
        </div>

        <div className="grid grid-cols-1 gap-3 rounded-xl border border-brand-border bg-slate-50 p-4 md:grid-cols-5">
          {WORKFLOW_STEPS.map((step, index) => {
            const isCompleted = currentStepIndex >= index
            const isCurrent = currentStepIndex === index
            return (
              <div key={step} className="flex items-center gap-2">
                <span
                  className={`h-2.5 w-2.5 rounded-full ${
                    isCurrent ? "bg-brand-primary" : isCompleted ? "bg-emerald-500" : "bg-slate-300"
                  }`}
                />
                <p className={`text-xs font-semibold ${isCurrent ? "text-brand-primary" : "text-brand-muted"}`}>
                  {STATUS_LABELS[step]}
                </p>
              </div>
            )
          })}
        </div>

        <div className="grid grid-cols-1 gap-3 text-sm md:grid-cols-2">
          <p>
            <span className="font-semibold text-brand-text">Category:</span> {complaint.category}
          </p>
          <p>
            <span className="font-semibold text-brand-text">Location:</span> {complaint.location}
          </p>
          <p>
            <span className="font-semibold text-brand-text">Priority:</span> {PRIORITY_LABELS[complaint.priority] || complaint.priority}
          </p>
          <p>
            <span className="font-semibold text-brand-text">Assigned Staff:</span> {complaint.assignedTo?.name || "Not assigned"}
          </p>
          <p>
            <span className="font-semibold text-brand-text">Created:</span> {formatDateTime(complaint.createdAt)}
          </p>
        </div>

        <p className="rounded-xl bg-slate-50 px-4 py-3 text-sm text-brand-text">{complaint.description}</p>

        {complaint.resolutionNotes ? (
          <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm text-emerald-800">
            <span className="font-semibold">Resolution Notes:</span> {complaint.resolutionNotes}
          </p>
        ) : null}

        {complaint.attachments?.length ? (
          <div>
            <h3 className="mb-2 text-sm font-semibold text-brand-text">Attachments</h3>
            <div className="flex flex-wrap gap-2">
              {complaint.attachments.map((item, index) => (
                <a
                  key={`${item.fileUrl}-${index}`}
                  href={`${getSocketBaseUrl()}${item.fileUrl}`}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded-lg border border-brand-border px-3 py-1.5 text-xs font-semibold text-brand-primary hover:bg-blue-50"
                >
                  {item.fileName}
                </a>
              ))}
            </div>
          </div>
        ) : null}

        {availableStatusActions.length > 0 ? (
          <div className="space-y-3 rounded-xl border border-brand-border bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-brand-text">Status Actions</h3>
            <Input
              label="Resolution Notes"
              textarea
              rows={4}
              value={resolutionNotes}
              onChange={(event) => setResolutionNotes(event.target.value)}
              placeholder="Add notes about progress/fix..."
            />
            <div className="flex flex-wrap gap-2">
              {availableStatusActions.map((nextStatus) => (
                <Button key={nextStatus} onClick={() => onUpdateStatus(nextStatus)} loading={updatingStatus}>
                  {getStatusActionLabel(nextStatus)}
                </Button>
              ))}
            </div>
          </div>
        ) : null}
      </Card>

      <Card className="space-y-3">
        <h3 className="font-heading text-xl font-semibold text-brand-text">Comments</h3>
        <div className="space-y-2">
          {comments.length ? (
            comments.map((item) => (
              <div key={item._id} className="rounded-xl border border-brand-border bg-white px-3 py-2">
                <p className="text-sm font-semibold text-brand-text">
                  {item.userId?.name || "User"}
                  <span className="ml-2 text-xs font-medium text-brand-muted">({item.userId?.role})</span>
                </p>
                <p className="text-sm text-brand-text">{item.message}</p>
                <p className="text-xs text-brand-muted">{formatDateTime(item.createdAt)}</p>
              </div>
            ))
          ) : (
            <p className="text-sm text-brand-muted">No comments yet.</p>
          )}
        </div>
        <Input
          textarea
          rows={3}
          value={commentText}
          onChange={(event) => setCommentText(event.target.value)}
          placeholder="Type your comment..."
        />
        <div className="flex gap-2">
          <Button onClick={onAddComment} loading={postingComment}>
            Add Comment
          </Button>
          <Link to={user.role === ROLES.ADMIN ? "/admin/complaints" : user.role === ROLES.STAFF ? "/staff/assigned" : "/app/complaints"}>
            <Button variant="secondary">Back</Button>
          </Link>
        </div>
      </Card>
    </div>
  )
}

export default ComplaintDetailPage
