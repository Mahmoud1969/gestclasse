'use client'

import React from 'react'
import { Loader2 } from 'lucide-react'

type Variant = 'primary' | 'secondary' | 'ghost' | 'danger'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  type?: 'button' | 'submit' | 'reset'
  variant?: Variant
  size?: Size
  loading?: boolean
  icon?: React.ReactNode
}

const variantClasses: Record<Variant, string> = {
  primary:
    'bg-blue-600 text-white hover:bg-blue-700 border border-blue-600 hover:border-blue-700 active:bg-blue-800',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 active:bg-gray-100',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent active:bg-gray-200',
  danger:
    'bg-red-600 text-white hover:bg-red-700 border border-red-600 hover:border-red-700 active:bg-red-800',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-7 px-2.5 text-[12px] gap-1.5',
  md: 'h-8 px-3 text-[13px] gap-2',
  lg: 'h-9 px-4 text-[14px] gap-2',
}

export function Button({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  children,
  disabled,
  className = '',
  type = 'button',
  ...props
}: ButtonProps) {
  return (
    <button
      {...props}
      type={type}
      disabled={disabled || loading}
      className={[
        'inline-flex items-center justify-center font-medium rounded transition-colors duration-100 select-none whitespace-nowrap',
        variantClasses[variant],
        sizeClasses[size],
        (disabled || loading) ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer',
        className,
      ].join(' ')}
    >
      {loading ? (
        <Loader2 size={13} className="animate-spin shrink-0" />
      ) : icon ? (
        <span className="shrink-0">{icon}</span>
      ) : null}
      {children}
    </button>
  )
}
