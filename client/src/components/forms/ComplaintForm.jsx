import { useState } from "react"
import { Paperclip } from "lucide-react"
import Input from "../ui/Input"
import Button from "../ui/Button"
import Card from "../ui/Card"
import { CATEGORIES, PRIORITIES, PRIORITY_LABELS } from "../../utils/constants"

const MAX_FILES = 3
const MAX_FILE_SIZE = 5 * 1024 * 1024
const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/jpg", "image/webp", "application/pdf"])

const initialState = {
  title: "",
  category: "",
  location: "",
  description: "",
  priority: "MEDIUM",
  attachments: [],
}

const ComplaintForm = ({ onSubmit, loading = false, compact = false }) => {
  const [form, setForm] = useState(initialState)
  const [error, setError] = useState("")
  const [fieldErrors, setFieldErrors] = useState({})

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: "" }))
    setError("")
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

    if (!form.category) {
      errors.category = "Category is required."
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

    setError("")
    await onSubmit({
      ...form,
      title: form.title.trim(),
      location: form.location.trim(),
      description: form.description.trim(),
    })
    setForm(initialState)
    setFieldErrors({})
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
            <option value="">Select Category</option>
            {CATEGORIES.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
          </select>
          {fieldErrors.category ? <p className="text-xs font-medium text-red-500">{fieldErrors.category}</p> : null}
        </label>
        <Input
          label="Location"
          placeholder="e.g. Block A, Lab 2"
          value={form.location}
          onChange={(event) => updateField("location", event.target.value)}
          error={fieldErrors.location}
          minLength={2}
          maxLength={160}
        />
        <label className="block space-y-1.5">
          <span className="text-sm font-semibold text-brand-text">Priority</span>
          <select
            value={form.priority}
            onChange={(event) => updateField("priority", event.target.value)}
            className="w-full rounded-xl border border-brand-border px-3 py-2.5 text-sm focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100"
          >
            {PRIORITIES.map((priority) => (
              <option key={priority} value={priority}>
                {PRIORITY_LABELS[priority]}
              </option>
            ))}
          </select>
        </label>
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
            onChange={(event) => updateField("attachments", Array.from(event.target.files || []))}
          />
        </label>
        {form.attachments.length ? (
          <p className="text-xs text-brand-muted">{form.attachments.length} file(s) selected.</p>
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
