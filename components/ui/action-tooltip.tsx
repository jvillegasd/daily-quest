'use client'

interface ActionTooltipProps {
  label: string
  children: React.ReactElement<{ 'aria-label'?: string; title?: string }>
}

export function ActionTooltip({ label, children }: ActionTooltipProps) {
  return (
    <span className="group relative inline-flex">
      {children}
      <span
        role="tooltip"
        className="pointer-events-none absolute bottom-full left-1/2 z-20 mb-1 -translate-x-1/2 whitespace-nowrap rounded-md bg-bg text-fg px-2 py-1 text-xs opacity-0 shadow-lg border border-border transition-opacity group-hover:opacity-100 group-focus-within:opacity-100"
      >
        {label}
      </span>
    </span>
  )
}
