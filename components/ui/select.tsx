import { cn } from '@/lib/utils/cn'
import { forwardRef, type SelectHTMLAttributes } from 'react'

interface SelectProps extends SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  error?: string
}

const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, id, children, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-fg-muted font-body">
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={id}
          className={cn(
            'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors duration-200 disabled:opacity-50',
            error && 'border-ruby',
            className
          )}
          {...props}
        >
          {children}
        </select>
        {error && <p className="text-xs text-ruby">{error}</p>}
      </div>
    )
  }
)

Select.displayName = 'Select'
export { Select }
