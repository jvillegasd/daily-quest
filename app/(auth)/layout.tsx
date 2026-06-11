export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-dvh flex flex-col items-center justify-center bg-bg px-4 py-12">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="text-5xl mb-3">⚔️</div>
          <h1 className="font-quest text-3xl font-bold text-gold">Daily Quest</h1>
          <p className="text-fg-muted mt-1 text-sm">Your household adventure awaits</p>
        </div>
        {children}
      </div>
    </div>
  )
}
