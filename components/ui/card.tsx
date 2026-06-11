import { cn } from '@/lib/utils/cn'

interface CardProps {
  className?: string
  children: React.ReactNode
  gold?: boolean
  hover?: boolean
}

export function Card({ className, children, gold, hover }: CardProps) {
  return (
    <div
      className={cn(
        'card-parchment p-4',
        gold && 'card-gold',
        hover && 'cursor-pointer hover:-translate-y-0.5',
        className
      )}
    >
      {children}
    </div>
  )
}

export function CardHeader({ className, children }: { className?: string; children: React.ReactNode }) {
  return <div className={cn('mb-3 flex items-center justify-between', className)}>{children}</div>
}

export function CardTitle({ className, children }: { className?: string; children: React.ReactNode }) {
  return (
    <h3 className={cn('font-quest text-base font-semibold text-fg', className)}>{children}</h3>
  )
}
