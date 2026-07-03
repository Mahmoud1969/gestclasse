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
    'bg-gradient-to-b from-blue-500 to-blue-600 text-white border border-blue-700/40 shadow-sm hover:shadow-md hover:brightness-[1.06] active:brightness-95',
  secondary:
    'bg-white text-gray-700 hover:bg-gray-50 border border-gray-300 shadow-[0_1px_1px_rgba(16,24,40,0.03)] active:bg-gray-100',
  ghost:
    'bg-transparent text-gray-600 hover:bg-gray-100 border border-transparent active:bg-gray-200',
  danger:
    'bg-gradient-to-b from-red-500 to-red-600 text-white border border-red-700/40 shadow-sm hover:shadow-md hover:brightness-[1.06] active:brightness-95',
}

const sizeClasses: Record<Size, string> = {
  sm: 'h-8 px-3 text-[12px] gap-1.5',
  md: 'h-9 px-3.5 text-[13px] gap-2',
  lg: 'h-10 px-4 text-[14px] gap-2',
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
        'inline-flex items-center justify-center font-medium rounded-lg transition-all duration-150 select-none whitespace-nowrap',
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
