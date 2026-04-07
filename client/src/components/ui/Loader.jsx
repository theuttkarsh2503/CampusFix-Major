const Loader = ({ fullPage = false }) => (
  <div className={`${fullPage ? "min-h-screen" : "py-8"} flex items-center justify-center`}>
    <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-primary/40 border-t-brand-primary" />
  </div>
)

export default Loader
