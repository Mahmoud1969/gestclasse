'use client'

import React from 'react'

interface NumberInputProps {
  value: number | null
  onChange: (val: number | null) => void
  min?: number
  max?: number
  step?: number
  placeholder?: string
  className?: string
}

export function NumberInput({
  value,
  onChange,
  min = 0,
  max = 20,
  step = 0.25,
  placeholder = '—',
  className = '',
}: NumberInputProps) {
  const bgClass =
    value === null
      ? 'bg-white'
      : value >= 10
      ? 'bg-green-50'
      : 'bg-red-50'

  const textClass =
    value === null
      ? 'text-gray-400'
      : value >= 10
      ? 'text-green-800'
      : 'text-red-800'

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const raw = e.target.value
    if (raw === '' || raw === null) {
      onChange(null)
      return
    }
    const num = parseFloat(raw)
    if (isNaN(num)) {
      onChange(null)
      return
    }
    const clamped = Math.min(max, Math.max(min, num))
    const rounded = Math.round(clamped / step) * step
    onChange(Math.round(rounded * 100) / 100)
  }

  return (
    <input
      type="number"
      min={min}
      max={max}
      step={step}
      value={value === null ? '' : value}
      onChange={handleChange}
      placeholder={placeholder}
      className={[
        'w-full h-8 px-2 text-center text-[12px] font-mono border border-transparent rounded transition-colors',
        'focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400',
        'hover:border-gray-300',
        bgClass,
        textClass,
        className,
      ].join(' ')}
    />
  )
}
