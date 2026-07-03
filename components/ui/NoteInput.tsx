'use client'

import React, { useEffect, useState } from 'react'
import type { NoteValue } from '@/lib/types'

interface NoteInputProps {
  value: NoteValue
  onChange: (val: NoteValue) => void
  min?: number
  max?: number
  step?: number
  className?: string
  /** When true, allow "A-J" (Absent Justifié) as a value. Off by default
   *  so we can keep using this for devoir_synthese without the AJ option. */
  allowAJ?: boolean
  id?: string
  /** Called when the user presses Enter — used for fast keyboard entry. */
  onEnter?: () => void
}

/**
 * Note cell input that accepts a number OR — when allowAJ — the special
 * "A-J" marker (Absent Justifié). Typing "a", "aj", "a-j" (any case) sets
 * the value to 'AJ'. Typing a number sets the numeric value. Empty input
 * clears (null).
 */
export function NoteInput({
  value,
  onChange,
  min = 0,
  max = 20,
  step = 0.25,
  className = '',
  allowAJ = false,
  id,
  onEnter,
}: NoteInputProps) {
  // Local text so the user can edit freely without us reformatting mid-typing
  const [text, setText] = useState<string>(formatValue(value))

  // Sync local text when the controlled value changes externally
  useEffect(() => {
    setText(formatValue(value))
  }, [value])

  function formatValue(v: NoteValue): string {
    if (v === null) return ''
    if (v === 'AJ') return 'A-J'
    return String(v)
  }

  function handleBlur() {
    const raw = text.trim()
    if (raw === '') {
      onChange(null)
      setText('')
      return
    }
    // Accept any of: "a", "aj", "a-j", "A-J"… (only if allowAJ)
    if (allowAJ && /^a[-\s]?j?$/i.test(raw)) {
      onChange('AJ')
      setText('A-J')
      return
    }
    // Otherwise parse as a number
    const num = parseFloat(raw.replace(',', '.'))
    if (isNaN(num)) {
      // Revert to last valid value
      setText(formatValue(value))
      return
    }
    const clamped = Math.min(max, Math.max(min, num))
    const rounded = Math.round(clamped / step) * step
    const final = Math.round(rounded * 100) / 100
    onChange(final)
    setText(String(final))
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleBlur()
      if (onEnter) onEnter()
      else (e.target as HTMLInputElement).blur()
    }
  }

  // Visual treatment depends on the current value
  let bgClass = 'bg-surface'
  let textClass = 'text-faint'
  if (value === 'AJ') {
    bgClass = 'bg-amber-50'
    textClass = 'text-amber-800 font-semibold'
  } else if (typeof value === 'number') {
    if (value >= 10) {
      bgClass = 'bg-green-50'
      textClass = 'text-green-800'
    } else {
      bgClass = 'bg-red-50'
      textClass = 'text-red-800'
    }
  }

  return (
    <input
      id={id}
      type="text"
      inputMode="decimal"
      value={text}
      onChange={(e) => setText(e.target.value)}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      placeholder={allowAJ ? 'note ou A-J' : '—'}
      title={allowAJ ? 'Tape un nombre 0–20, ou "A-J" pour Absence Justifiée' : undefined}
      className={[
        'w-full h-8 px-2 text-center text-[12px] font-mono border border-transparent rounded transition-colors',
        'focus:outline-none focus:border-blue-400 focus:ring-1 focus:ring-blue-400',
        'hover:border-line-strong',
        bgClass,
        textClass,
        className,
      ].join(' ')}
    />
  )
}
