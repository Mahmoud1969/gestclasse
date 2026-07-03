'use client'

import React from 'react'
import { ChevronDown } from 'lucide-react'

interface SelectOption {
  value: string
  label: string
}

interface SelectProps {
  options: SelectOption[]
  value: string
  onChange: (val: string) => void
  label?: string
  placeholder?: string
  className?: string
  disabled?: boolean
}

export function Select({
  options,
  value,
  onChange,
  label,
  placeholder,
  className = '',
  disabled = false,
}: SelectProps) {
  return (
    <div className={['flex flex-col gap-1', className].join(' ')}>
      {label && (
        <label className="text-[12px] font-medium text-ink leading-none">{label}</label>
      )}
      <div className="relative">
        <select
          value={value}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          className={[
            'h-8 w-full pl-2.5 pr-7 text-[13px] text-ink bg-surface border border-line-strong rounded',
            'appearance-none cursor-pointer',
            'focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
            'hover:border-line-strong transition-colors',
            disabled ? 'opacity-50 cursor-not-allowed' : '',
          ].join(' ')}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={13}
          className="absolute right-2 top-1/2 -translate-y-1/2 text-muted pointer-events-none"
        />
      </div>
    </div>
  )
}
