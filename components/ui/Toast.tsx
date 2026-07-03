'use client'

import React from 'react'
import { CheckCircle2, XCircle, Info, X } from 'lucide-react'
import { useStore } from '@/store'

const icons = {
  success: <CheckCircle2 size={15} className="text-green-600 shrink-0" />,
  error: <XCircle size={15} className="text-red-600 shrink-0" />,
  info: <Info size={15} className="text-blue-600 shrink-0" />,
}

const borderColors = {
  success: 'border-l-green-500',
  error: 'border-l-red-500',
  info: 'border-l-blue-500',
}

export function ToastContainer() {
  const toasts = useStore((s) => s.toasts)
  const removeToast = useStore((s) => s.removeToast)

  if (toasts.length === 0) return null

  return (
    <div className="fixed bottom-5 right-5 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map((toast) => (
        <div
          key={toast.id}
          className={[
            'flex items-center gap-2.5 px-3.5 py-2.5 bg-surface border border-l-4 rounded-lg shadow-lg',
            'min-w-[260px] max-w-[360px] pointer-events-auto animate-toast-in',
            borderColors[toast.type],
          ].join(' ')}
        >
          {icons[toast.type]}
          <span className="flex-1 text-[12px] text-ink font-medium leading-snug">
            {toast.message}
          </span>
          <button
            onClick={() => removeToast(toast.id)}
            className="p-0.5 rounded hover:bg-surface2 text-faint hover:text-muted transition-colors"
          >
            <X size={12} />
          </button>
        </div>
      ))}
    </div>
  )
}
