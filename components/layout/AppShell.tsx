'use client'

import React from 'react'
import { Sidebar } from './Sidebar'
import { ToastContainer } from '@/components/ui/Toast'

export function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen bg-surface overflow-hidden">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0 overflow-y-auto bg-canvas">
        {children}
      </main>
      <ToastContainer />
    </div>
  )
}
