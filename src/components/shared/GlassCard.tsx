import type { ReactNode } from 'react'

interface GlassCardProps {
  children: ReactNode
  className?: string
  dark?: boolean
}

export default function GlassCard({ children, className = '', dark = false }: GlassCardProps) {
  return (
    <div className={`${dark ? 'glass-card-dark' : 'glass-card'} ${className}`}>
      {children}
    </div>
  )
}
