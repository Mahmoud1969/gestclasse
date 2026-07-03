'use client'

import React from 'react'

interface Tab {
  value: string
  label: string
}

interface TabsProps {
  tabs: Tab[]
  active: string
  onChange: (val: string) => void
  className?: string
}

export function Tabs({ tabs, active, onChange, className = '' }: TabsProps) {
  return (
    <div className={['flex border-b border-line', className].join(' ')}>
      {tabs.map((tab) => (
        <button
          key={tab.value}
          onClick={() => onChange(tab.value)}
          className={[
            'px-4 h-9 text-[13px] font-medium transition-colors relative',
            'hover:text-ink',
            active === tab.value
              ? 'text-blue-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-blue-600'
              : 'text-muted',
          ].join(' ')}
        >
          {tab.label}
        </button>
      ))}
    </div>
  )
}
