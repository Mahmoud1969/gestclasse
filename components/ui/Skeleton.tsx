import React from 'react'

interface SkeletonProps {
  className?: string
  rows?: number
}

export function Skeleton({ className = '', rows = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: rows }).map((_, i) => (
        <div
          key={i}
          className={['bg-surface2 rounded skeleton-pulse', className].join(' ')}
        />
      ))}
    </>
  )
}

export function TableSkeleton({ rows = 6, cols = 6 }: { rows?: number; cols?: number }) {
  return (
    <>
      {Array.from({ length: rows }).map((_, ri) => (
        <tr key={ri} className="border-b border-line">
          {Array.from({ length: cols }).map((_, ci) => (
            <td key={ci} className="px-3 py-2">
              <div className="h-3 bg-surface2 rounded skeleton-pulse" style={{ width: ci === 0 ? '2rem' : '80%' }} />
            </td>
          ))}
        </tr>
      ))}
    </>
  )
}
