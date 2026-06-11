import { cn } from '@/lib/utils/cn'
import { forwardRef, type InputHTMLAttributes } from 'react'

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  icon?: React.ReactNode
}

const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, icon, id, ...props }, ref) => {
    return (
      <div className="flex flex-col gap-1">
        {label && (
          <label htmlFor={id} className="text-sm font-semibold text-fg-muted font-body">
            {label}
          </label>
        )}
        <div className="relative">
          {icon && (
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-fg-subtle">{icon}</span>
          )}
          <input
            ref={ref}
            id={id}
            className={cn(
              'w-full rounded-lg border border-border bg-bg-elevated px-3 py-2 text-sm text-fg placeholder:text-fg-subtle focus:outline-none focus:border-gold focus:ring-1 focus:ring-gold transition-colors duration-200 disabled:opacity-50',
              icon && 'pl-9',
              error && 'border-ruby focus:border-ruby focus:ring-ruby',
              className
            )}
            {...props}
          />
        </div>
        {error && <p className="text-xs text-ruby">{error}</p>}
      </div>
    )
  }
)

Input.displayName = 'Input'
export { Input }
