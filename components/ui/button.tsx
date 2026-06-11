'use client'

import { cn } from '@/lib/utils/cn'
import { type ButtonHTMLAttributes, forwardRef } from 'react'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'gold' | 'ghost' | 'danger' | 'outline' | 'emerald' | 'sapphire'
  size?: 'sm' | 'md' | 'lg'
  loading?: boolean
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'gold', size = 'md', loading, disabled, children, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-lg font-semibold font-body transition-all duration-200 select-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50 disabled:cursor-not-allowed active:scale-95',
          {
            'bg-gold text-bg hover:bg-gold-bright shadow-sm hover:shadow-gold border border-gold-dim':
              variant === 'gold',
            'bg-transparent text-fg-muted hover:text-fg hover:bg-border/50 border border-transparent hover:border-border':
              variant === 'ghost',
            'bg-ruby/10 text-ruby hover:bg-ruby/20 border border-ruby/30':
              variant === 'danger',
            'bg-transparent text-fg border border-border hover:border-gold hover:text-gold':
              variant === 'outline',
            'bg-emerald/10 text-emerald hover:bg-emerald/20 border border-emerald/30':
              variant === 'emerald',
            'bg-sapphire/10 text-sapphire hover:bg-sapphire/20 border border-sapphire/30':
              variant === 'sapphire',
          },
          {
            'h-7 px-3 text-xs': size === 'sm',
            'h-9 px-4 text-sm': size === 'md',
            'h-11 px-6 text-base': size === 'lg',
          },
          className
        )}
        {...props}
      >
        {loading ? (
          <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </button>
    )
  }
)

Button.displayName = 'Button'
export { Button }
