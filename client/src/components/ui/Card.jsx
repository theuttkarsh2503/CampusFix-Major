import clsx from "clsx"

const Card = ({ children, className }) => (
  <div className={clsx("rounded-2xl border border-brand-border bg-white p-6 shadow-lg", className)}>{children}</div>
)

export default Card
