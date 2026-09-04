import { useState } from "react"
import ComplaintForm from "../components/forms/ComplaintForm"
import { useComplaint } from "../context/ComplaintContext"
import { useAuth } from "../context/AuthContext"

const SubmitComplaintPage = () => {
  const { createComplaint } = useComplaint()
  const { extractErrorMessage } = useAuth()
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState("")
  const [error, setError] = useState("")

  const handleSubmit = async (payload) => {
    setLoading(true)
    setError("")
    setMessage("")
    try {
      await createComplaint(payload)
      setMessage("Your complaint has been submitted.")
      return true
    } catch (err) {
      setError(extractErrorMessage(err))
      return false
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="mx-auto max-w-4xl space-y-4">
      {message ? (
        <p className="rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-semibold text-emerald-700">
          {message}
        </p>
      ) : null}
      {error ? (
        <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-600">{error}</p>
      ) : null}
      <ComplaintForm onSubmit={handleSubmit} loading={loading} />
    </div>
  )
}

export default SubmitComplaintPage
