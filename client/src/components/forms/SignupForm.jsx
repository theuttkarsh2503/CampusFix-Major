import { useState } from "react"
import { Link } from "react-router-dom"
import Input from "../ui/Input"
import Button from "../ui/Button"

const SignupForm = ({ onSubmit, loading, error }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    department: "",
    password: "",
    confirmPassword: "",
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const validate = () => {
    const errors = {}
    if (!form.name.trim()) errors.name = "Name is required."
    if (!form.email.trim()) errors.email = "Email is required."
    if (!form.password.trim()) errors.password = "Password is required."
    if (form.password.trim().length < 8) errors.password = "Password must be at least 8 characters."
    if (!/\d/.test(form.password)) errors.password = "Password must include at least one number."
    if (form.password !== form.confirmPassword) errors.confirmPassword = "Passwords do not match."
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    await onSubmit({
      name: form.name.trim(),
      email: form.email.trim(),
      department: form.department.trim(),
      role: "student",
      password: form.password,
    })
  }

  return (
    <form className="space-y-3.5" onSubmit={handleSubmit}>
      <Input
        label="Full Name"
        placeholder="John Doe"
        value={form.name}
        onChange={(event) => updateField("name", event.target.value)}
        error={fieldErrors.name}
      />
      <Input
        label="Email"
        placeholder="your.email@campus.edu"
        value={form.email}
        onChange={(event) => updateField("email", event.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="Department"
        placeholder="Computer Science (optional)"
        value={form.department}
        onChange={(event) => updateField("department", event.target.value)}
      />

      <p className="rounded-xl border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-semibold text-blue-700">
        Public registration creates a Student account.
      </p>

      <Input
        label="Password"
        type="password"
        placeholder="At least 8 chars with a number"
        value={form.password}
        onChange={(event) => updateField("password", event.target.value)}
        error={fieldErrors.password}
      />
      <Input
        label="Confirm Password"
        type="password"
        placeholder="Re-enter password"
        value={form.confirmPassword}
        onChange={(event) => updateField("confirmPassword", event.target.value)}
        error={fieldErrors.confirmPassword}
      />

      {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

      <Button type="submit" loading={loading} className="w-full rounded-xl py-3 text-base">
        Create Account
      </Button>

      <p className="text-center text-sm text-brand-muted">
        Already have an account?{" "}
        <Link to="/login" className="font-semibold text-brand-primary hover:underline">
          Login
        </Link>
      </p>
    </form>
  )
}

export default SignupForm
