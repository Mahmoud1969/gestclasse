import React from 'react'

interface ToolbarProps {
  title: React.ReactNode
  actions?: React.ReactNode
  className?: string
}

export function Toolbar({ title, actions, className = '' }: ToolbarProps) {
  return (
    <div
      className={[
        'sticky top-0 z-20 flex items-center justify-between h-14 px-6',
        'bg-surface/80 backdrop-blur-md border-b border-line/70 shrink-0 no-print',
        className,
      ].join(' ')}
    >
      <div className="flex items-center gap-3 min-w-0">
        {typeof title === 'string' ? (
          <h1 className="text-[16px] font-semibold text-ink tracking-tight truncate font-display">{title}</h1>
        ) : (
          title
        )}
      </div>
      {actions && (
        <div className="flex items-center gap-2 ml-4 shrink-0">{actions}</div>
      )}
    </div>
  )
}
