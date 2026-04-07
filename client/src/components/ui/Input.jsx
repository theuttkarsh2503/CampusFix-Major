const Input = ({ label, error, textarea = false, className = "", ...props }) => {
  const Component = textarea ? "textarea" : "input"

  return (
    <label className="block space-y-1.5">
      {label ? <span className="text-sm font-semibold text-brand-text">{label}</span> : null}
      <Component
        className={`w-full rounded-xl border border-brand-border bg-white px-3 py-2.5 text-sm text-brand-text placeholder:text-brand-muted focus:border-brand-primary focus:outline-none focus:ring-2 focus:ring-blue-100 ${className}`}
        {...props}
      />
      {error ? <p className="text-xs font-medium text-red-500">{error}</p> : null}
    </label>
  )
}

export default Input
