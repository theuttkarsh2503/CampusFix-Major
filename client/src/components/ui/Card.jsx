import clsx from "clsx"

const Card = ({ children, className }) => (
  <div className={clsx("rounded-2xl border border-brand-border bg-white p-4 shadow-lg sm:p-6", className)}>{children}</div>
)

export default Card
