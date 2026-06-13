export default function SettingsLoading() {
  return (
    <div className="p-6 space-y-6 animate-pulse max-w-2xl">
      <div className="h-8 w-28 rounded-lg bg-muted" />
      <div className="space-y-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-16 rounded-xl bg-muted" />
        ))}
      </div>
    </div>
  )
}
