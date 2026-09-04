import { useEffect, useState } from "react"
import { Paperclip } from "lucide-react"
import Input from "../ui/Input"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { classifyComplaintRequest, findDuplicateComplaintsRequest } from "../../services/complaintService"
import { Link } from "react-router-dom"
import { CAMPUS_LOCATIONS, CATEGORIES, DEPARTMENTS, PRIORITIES, PRIORITY_LABELS } from "../../utils/constants"

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"])

const initialState = {
  title: "",
  category: "",
  department: "",
  building: "",
  floor: "",
  location: "",
  description: "",
  priority: "",
  attachments: [],
}

const ComplaintForm = ({ onSubmit, loading = false, compact = false }) => {
  const [form, setForm] = useState(initialState)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})
  const [classification, setClassification] = useState(null)
  const [classificationLoading, setClassificationLoading] = useState(false)
  const [imagePreviews, setImagePreviews] = useState({})
  const [duplicateMatches, setDuplicateMatches] = useState([])
  const [duplicateLoading, setDuplicateLoading] = useState(false)
  const [duplicateAcknowledged, setDuplicateAcknowledged] = useState(false)

  useEffect(() => {
    const previews = {}
    form.attachments.forEach((file, index) => {
      if (file.type.startsWith("image/")) previews[index] = URL.createObjectURL(file)
    })
    setImagePreviews(previews)
    return () => Object.values(previews).forEach((preview) => URL.revokeObjectURL(preview))
  }, [form.attachments])

  useEffect(() => {
    if (!form.title.trim() && !form.description.trim() && !form.location.trim()) {
      setClassification(null)
      return undefined
    }
    const timer = window.setTimeout(async () => {
      setClassificationLoading(true)
      try {
        setClassification(await classifyComplaintRequest({ title: form.title, description: form.description, location: form.location }))
      } catch {
        setClassification(null)
      } finally {
        setClassificationLoading(false)
      }
    }, 450)
    return () => window.clearTimeout(timer)
  }, [form.title, form.description, form.location])

  useEffect(() => {
    const payload = {
      title: form.title.trim(),
      description: form.description.trim(),
      category: form.category,
      location: [form.building, form.floor, form.location].filter(Boolean).join(" / "),
    }
    if (payload.title.length < 5 && payload.description.length < 10 && payload.location.length < 2) {
      setDuplicateMatches([])
      return undefined
    }
    const timer = window.setTimeout(async () => {
      setDuplicateLoading(true)
      try {
        setDuplicateMatches(await findDuplicateComplaintsRequest(payload))
      } catch {
        setDuplicateMatches([])
      } finally {
        setDuplicateLoading(false)
      }
    }, 650)
    return () => window.clearTimeout(timer)
  }, [form.title, form.description, form.category, form.building, form.floor, form.location])

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: "" }))
    setError("")
    setDuplicateAcknowledged(false)
  }

  const handleAttachmentChange = (event) => {
    const files = Array.from(event.target.files || [])
    updateField("attachments", files)
    if (files.length > MAX_FILES) {
      setFieldErrors((prev) => ({ ...prev, attachments: `Maximum ${MAX_FILES} files allowed.` }))
    } else if (files.some((file) => file.size > MAX_FILE_SIZE)) {
      setFieldErrors((prev) => ({ ...prev, attachments: "Each file must be 5MB or smaller." }))
    } else if (files.some((file) => !ALLOWED_TYPES.has(file.type))) {
      setFieldErrors((prev) => ({ ...prev, attachments: "Only PNG, JPG, WEBP and PDF files are allowed." }))
    }
    event.target.value = ""
  }

  const removeAttachment = (index) => {
    updateField("attachments", form.attachments.filter((_file, fileIndex) => fileIndex !== index))
  }

  const validate = () => {
    const errors = {}
    const title = form.title.trim()
    const location = form.location.trim()
    const description = form.description.trim()

    if (!title) {
      errors.title = "Title is required."
    } else if (title.length < 5) {
      errors.title = "Title must be at least 5 characters."
    } else if (title.length > 150) {
      errors.title = "Title cannot exceed 150 characters."
    }

    if (!location) {
      errors.location = "Location is required."
    } else if (location.length < 2) {
      errors.location = "Location must be at least 2 characters."
    } else if (location.length > 160) {
      errors.location = "Location cannot exceed 160 characters."
    }

    if (!description) {
      errors.description = "Description is required."
    } else if (description.length < 10) {
      errors.description = "Description must be at least 10 characters."
    } else if (description.length > 2000) {
      errors.description = "Description cannot exceed 2000 characters."
    }

    if (form.attachments.length > MAX_FILES) {
      errors.attachments = `Maximum ${MAX_FILES} files allowed.`
    } else if (form.attachments.some((file) => file.size > MAX_FILE_SIZE)) {
      errors.attachments = "Each file must be 5MB or smaller."
    } else if (form.attachments.some((file) => !ALLOWED_TYPES.has(file.type))) {
      errors.attachments = "Only PNG, JPG, WEBP and PDF files are allowed."
    }

    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length > 0) {
      setError("Please fix the highlighted fields.")
      return
    }

    if (duplicateMatches.length > 0 && !duplicateAcknowledged) {
      setError("Review the similar complaint warning before submitting.")
      return
    }

    setError("")
    const submitted = await onSubmit({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
    })
    if (submitted === false) return
    setForm(initialState)
    setFieldErrors({})
    setClassification(null)
  }

  return (
    <Card className={`${compact ? "p-5" : ""}`}>
      <h3 className="mb-4 font-heading text-2xl font-semibold text-brand-text">Submit Complaint</h3>

      <form className="space-y-4" onSubmit={handleSubmit}>
        <Input
          label="Title"
          placeholder="Brief complaint title"
          value={form.title}
          onChange={(event) => updateField("title", event.target.value)}
          error={fieldErrors.title}
          minLength={5}
          maxLength={150}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Category</span>
          <select
            value={form.category}
            onChange={(event) => updateField("category", event.target.value)}
            className={`w-full rounded-xl border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100 ${
              fieldErrors.category ? "border-red-300" : "border-brand-border"
            }`}
          >
            <option value="">Auto-detect category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {fieldErrors.category ? <p className="text-xs font-medium text-red-500">{fieldErrors.category}</p> : null}
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Building / Block</span>
          <select
            value={form.building}
            onChange={(event) => updateField("building", event.target.value)}
            className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select building or campus area</option>
            {Object.keys(CAMPUS_LOCATIONS).map((building) => <option key={building} value={building}>{building}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Floor</span>
          <select
            value={form.floor}
            onChange={(event) => updateField("floor", event.target.value)}
            disabled={!form.building}
            className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm disabled:bg-slate-100 focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Select floor or area</option>
            {(CAMPUS_LOCATIONS[form.building] || []).map((floor) => <option key={floor} value={floor}>{floor}</option>)}
          </select>
        </label>
        <Input
          label="Room / Area"
          placeholder="e.g. Room 204, north entrance, or washroom"
          value={form.location}
          onChange={(event) => updateField("location", event.target.value)}
          error={fieldErrors.location}
          minLength={2}
          maxLength={100}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Department</span>
          <select
            value={form.department}
            onChange={(event) => updateField("department", event.target.value)}
            className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Auto-detect department</option>
            {DEPARTMENTS.map((department) => <option key={department} value={department}>{department}</option>)}
          </select>
        </label>
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Priority</span>
          <select
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
            className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            <option value="">Auto-detect priority</option>
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>
        {classification ? (
          <div className="rounded-xl border border-blue-100 bg-blue-50 px-4 py-3 text-sm text-blue-900">
            <p className="font-semibold">Smart suggestion {classificationLoading ? "updating..." : `(${classification.confidence}% confidence)`}</p>
            <p>Category: {classification.suggestedCategory} | Department: {classification.suggestedDepartment} | Priority: {PRIORITY_LABELS[classification.suggestedPriority]}</p>
            <p className="mt-1 text-xs text-blue-700">Leave fields on auto-detect or choose your own values to override.</p>
          </div>
        ) : classificationLoading ? <p className="text-xs text-brand-muted">Analyzing complaint...</p> : null}
        {duplicateMatches.length ? (
          <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-950">
            <p className="font-semibold">Similar complaint found</p>
            <div className="mt-2 space-y-2">
              {duplicateMatches.map((match) => (
                <div key={match.id} className="flex flex-wrap items-center gap-2 rounded-lg bg-white/70 px-3 py-2">
                  <span className="font-semibold">{match.ticketId}</span>
                  <span className="flex-1">{match.title}</span>
                  <span className="font-semibold">Similarity: {match.similarity}%</span>
                  <Link to={`/app/complaints/${match.id}`} target="_blank" rel="noreferrer" className="font-semibold text-brand-primary hover:underline">View Existing Complaint</Link>
                </div>
              ))}
            </div>
            <button type="button" onClick={() => setDuplicateAcknowledged(true)} className="mt-3 rounded-lg border border-amber-300 px-3 py-1.5 text-xs font-semibold hover:bg-amber-100">
              {duplicateAcknowledged ? "Submission allowed" : "Submit Anyway"}
            </button>
          </div>
        ) : duplicateLoading ? <p className="text-xs text-brand-muted">Checking for similar complaints...</p> : null}
        <Input
          label="Description"
          textarea
          rows={compact ? 5 : 6}
          placeholder="Describe your issue..."
          value={form.description}
          onChange={(event) => updateField("description", event.target.value)}
          error={fieldErrors.description}
          minLength={10}
          maxLength={2000}
        />

        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-brand-border bg-slate-50 px-3 py-2 text-sm font-semibold text-brand-text transition hover:bg-slate-100">
          <Paperclip size={14} />
          Attach File
          <input
            hidden
            type="file"
            multiple
            accept=".png,.jpg,.jpeg,.webp,.pdf"
            onChange={handleAttachmentChange}
          />
        </label>
        {form.attachments.length ? (
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {form.attachments.map((file, index) => (
              <div key={`${file.name}-${file.lastModified}-${index}`} className="flex items-center gap-3 rounded-xl border border-brand-border bg-slate-50 p-2">
                {imagePreviews[index] ? (
                  <img src={imagePreviews[index]} alt={`Preview of ${file.name}`} className="h-14 w-14 rounded-lg object-cover" />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-white text-xs font-semibold text-brand-muted">PDF</div>
                )}
                <p className="min-w-0 flex-1 truncate text-xs font-semibold text-brand-text">{file.name}</p>
                <button type="button" onClick={() => removeAttachment(index)} className="text-xs font-semibold text-red-600 hover:underline">
                  Remove
                </button>
              </div>
            ))}
          </div>
        ) : null}
        {fieldErrors.attachments ? <p className="text-xs font-medium text-red-500">{fieldErrors.attachments}</p> : null}

        {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

        <Button type="submit" loading={loading} className="w-full rounded-xl py-3 text-base">
          Submit Complaint
        </Button>
      </form>
    </Card>
  )
}

export default ComplaintForm
