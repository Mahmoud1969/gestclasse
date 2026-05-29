'use client'

import React from 'react'

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
  error?: string
  helper?: string
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  function Input({ label, error, helper, className = '', id, ...props }, ref) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-')
  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label htmlFor={inputId} className="text-[12px] font-medium text-gray-700 leading-none">
          {label}
        </label>
      )}
      <input
        {...props}
        ref={ref}
        id={inputId}
        className={[
          'h-8 px-2.5 text-[13px] text-gray-900 bg-white border rounded transition-colors',
          'placeholder:text-gray-400',
          error
            ? 'border-red-400 focus:border-red-500 focus:ring-1 focus:ring-red-500'
            : 'border-gray-300 focus:border-blue-500 focus:ring-1 focus:ring-blue-500',
          'outline-none',
          className,
        ].join(' ')}
      />
      {error && <p className="text-[11px] text-red-600 leading-none">{error}</p>}
      {helper && !error && <p className="text-[11px] text-gray-500 leading-none">{helper}</p>}
    </div>
  )
})
