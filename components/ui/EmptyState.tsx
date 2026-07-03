import React from 'react'
import { Button } from './Button'

interface EmptyStateProps {
  icon: React.ReactNode
  title: string
  description: string
  action?: {
    label: string
    onClick: () => void
  }
}

export function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-8 text-center">
      <div className="w-12 h-12 rounded-full bg-surface2 flex items-center justify-center text-faint mb-4">
        {icon}
      </div>
      <h3 className="text-[14px] font-semibold text-ink mb-1.5">{title}</h3>
      <p className="text-[12px] text-muted max-w-xs leading-relaxed mb-5">{description}</p>
      {action && (
        <Button variant="primary" size="sm" onClick={action.onClick}>
          {action.label}
        </Button>
      )}
    </div>
  )
}
