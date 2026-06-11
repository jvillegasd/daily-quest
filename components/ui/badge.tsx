import { cn } from '@/lib/utils/cn'

type BadgeVariant = 'gold' | 'emerald' | 'amber' | 'ruby' | 'sapphire' | 'muted'

interface BadgeProps {
  variant?: BadgeVariant
  className?: string
  children: React.ReactNode
}

const variantStyles: Record<BadgeVariant, string> = {
  gold:     'bg-gold/20 text-gold border-gold/40',
  emerald:  'bg-emerald/10 text-emerald border-emerald/30',
  amber:    'bg-amber/10 text-amber border-amber/30',
  ruby:     'bg-ruby/10 text-ruby border-ruby/30',
  sapphire: 'bg-sapphire/10 text-sapphire border-sapphire/30',
  muted:    'bg-border/50 text-fg-muted border-border',
}

export function Badge({ variant = 'muted', className, children }: BadgeProps) {
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-semibold font-body',
        variantStyles[variant],
        className
      )}
    >
      {children}
    </span>
  )
}
