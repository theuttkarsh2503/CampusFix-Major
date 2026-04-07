import { Link } from "react-router-dom"
import Button from "../components/ui/Button"

const NotFoundPage = () => (
  <div className="flex min-h-screen items-center justify-center p-6">
    <div className="w-full max-w-md rounded-2xl border border-brand-border bg-white p-8 text-center shadow-xl">
      <h1 className="font-heading text-4xl font-bold text-brand-text">404</h1>
      <p className="mt-2 text-brand-muted">The page you requested was not found.</p>
      <Link to="/login" className="mt-6 inline-block">
        <Button>Back to Login</Button>
      </Link>
    </div>
  </div>
)

export default NotFoundPage
