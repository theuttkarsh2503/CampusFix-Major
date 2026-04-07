import clsx from "clsx"

const variantClasses = {
  primary:
    "bg-gradient-to-r from-brand-softFrom to-brand-softTo text-white shadow-soft hover:brightness-105 focus:ring-blue-300",
  secondary: "bg-white text-brand-text border border-brand-border hover:bg-slate-50 focus:ring-slate-300",
  ghost: "bg-transparent text-brand-primary hover:bg-blue-50 focus:ring-blue-300",
}

const Button = ({
  children,
  className,
  variant = "primary",
  type = "button",
  loading = false,
  disabled = false,
  ...props
}) => (
  <button
    type={type}
    className={clsx(
      "inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-semibold transition-all duration-200 focus:outline-none focus:ring-2 disabled:cursor-not-allowed disabled:opacity-60",
      variantClasses[variant],
      className,
    )}
    disabled={disabled || loading}
    {...props}
  >
    {loading ? (
      <span className="h-4 w-4 animate-spin rounded-full border-2 border-white/50 border-t-white" />
    ) : (
      children
    )}
  </button>
)

export default Button
