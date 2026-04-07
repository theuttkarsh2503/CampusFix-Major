import { useState } from "react"
import { Link } from "react-router-dom"
import Input from "../ui/Input"
import Button from "../ui/Button"

const LoginForm = ({ onSubmit, loading, error }) => {
  const [form, setForm] = useState({
    email: "",
    password: "",
    rememberMe: false,
  })
  const [fieldErrors, setFieldErrors] = useState({})

  const handleChange = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }))
    setFieldErrors((prev) => ({ ...prev, [key]: "" }))
  }

  const validate = () => {
    const errors = {}
    if (!form.email.trim()) errors.email = "Email is required."
    if (!form.password.trim()) errors.password = "Password is required."
    return errors
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const errors = validate()
    setFieldErrors(errors)
    if (Object.keys(errors).length) return

    await onSubmit(form)
  }

  return (
    <form className="space-y-4" onSubmit={handleSubmit}>
      <Input
        label="Email"
        placeholder="your.email@campus.edu"
        value={form.email}
        onChange={(event) => handleChange("email", event.target.value)}
        error={fieldErrors.email}
      />
      <Input
        label="Password"
        type="password"
        placeholder="Enter password"
        value={form.password}
        onChange={(event) => handleChange("password", event.target.value)}
        error={fieldErrors.password}
      />

      <label className="flex items-center gap-2 text-sm text-brand-muted">
        <input
          type="checkbox"
          checked={form.rememberMe}
          onChange={(event) => handleChange("rememberMe", event.target.checked)}
          className="h-4 w-4 rounded border-brand-border accent-brand-primary"
        />
        Remember Me
      </label>

      {error ? <p className="text-sm font-medium text-red-500">{error}</p> : null}

      <Button type="submit" loading={loading} className="w-full rounded-xl py-3 text-base">
        Login
      </Button>

      <button type="button" className="w-full text-sm font-semibold text-brand-primary hover:underline">
        Forgot Password?
      </button>

      <p className="text-center text-sm text-brand-muted">
        New user?{" "}
        <Link to="/signup" className="font-semibold text-brand-primary hover:underline">
          Create account
        </Link>
      </p>
    </form>
  )
}

export default LoginForm
