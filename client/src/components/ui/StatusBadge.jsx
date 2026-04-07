import clsx from "clsx"
import { formatStatus, getStatusClasses } from "../../utils/format"

const StatusBadge = ({ status, className }) => (
  <span
    className={clsx(
      "inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold tracking-wide",
      getStatusClasses(status),
      className,
    )}
  >
    {formatStatus(status)}
  </span>
)

export default StatusBadge
