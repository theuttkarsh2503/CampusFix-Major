import { ShieldCheck } from "lucide-react"

const CampusLogo = ({ compact = false }) => (
  <div className="flex items-center gap-2 text-brand-text">
    <div className="rounded-full bg-gradient-to-r from-brand-softFrom to-brand-softTo p-1.5 text-white shadow-soft">
      <ShieldCheck size={compact ? 14 : 18} />
    </div>
    <p className={`${compact ? "text-base" : "text-2xl"} font-heading font-bold`}>
      CampusFix <span className="text-brand-primary font-medium">Lite</span>
    </p>
  </div>
)

export default CampusLogo
