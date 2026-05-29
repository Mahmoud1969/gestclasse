'use client'

import React, { useState, useRef, useEffect } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  GraduationCap,
  LayoutDashboard,
  Users,
  BookOpen,
  ClipboardList,
  ChevronDown,
  Check,
  Plus,
} from 'lucide-react'
import { useStore } from '@/store'

const navItems = [
  { href: '/dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
  { href: '/classes', label: 'Classes', icon: Users },
  { href: '/notes', label: 'Notes', icon: BookOpen },
  { href: '/absences', label: 'Absences', icon: ClipboardList },
]

/** Compute the next school year label from the last existing one.
 *  "2024–2025" → "2025–2026"
 */
function nextYearLabel(last: string): string {
  const match = last.match(/(\d{4})[–\-](\d{4})/)
  if (!match) {
    const year = new Date().getFullYear()
    return `${year}–${year + 1}`
  }
  const start = parseInt(match[1]) + 1
  return `${start}–${start + 1}`
}

function YearSwitcher() {
  const annees = useStore((s) => s.annees)
  const anneeActive = useStore((s) => s.anneeActive)
  const addAnnee = useStore((s) => s.addAnnee)
  const setAnneeActive = useStore((s) => s.setAnneeActive)

  const [open, setOpen] = useState(false)
  const [adding, setAdding] = useState(false)
  const [newLabel, setNewLabel] = useState('')
  const dropdownRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)

  // Close on outside click
  useEffect(() => {
    function onMouseDown(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false)
        setAdding(false)
      }
    }
    if (open) document.addEventListener('mousedown', onMouseDown)
    return () => document.removeEventListener('mousedown', onMouseDown)
  }, [open])

  // Focus input when adding mode opens
  useEffect(() => {
    if (adding && inputRef.current) {
      inputRef.current.focus()
    }
  }, [adding])

  function handleStartAdding() {
    const last = annees[annees.length - 1]?.label ?? `${new Date().getFullYear()}–${new Date().getFullYear() + 1}`
    setNewLabel(nextYearLabel(last))
    setAdding(true)
  }

  function handleConfirmAdd() {
    const label = newLabel.trim()
    if (!label) return
    // Avoid duplicates
    if (annees.some((a) => a.label === label)) {
      setAnneeActive(label)
      setAdding(false)
      setOpen(false)
      return
    }
    addAnnee(label)
    setAdding(false)
    setOpen(false)
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter') handleConfirmAdd()
    if (e.key === 'Escape') { setAdding(false); setNewLabel('') }
  }

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        type="button"
        onClick={() => { setOpen((o) => !o); setAdding(false) }}
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded hover:bg-gray-100 transition-colors group"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[10px] font-medium text-gray-400 uppercase tracking-wide leading-none mb-0.5">
            Année scolaire
          </span>
          <span className="text-[12px] font-semibold text-gray-700 truncate leading-tight">
            {anneeActive}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={[
            'text-gray-400 shrink-0 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-white border border-gray-200 rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Year list */}
          <div className="py-1 max-h-48 overflow-y-auto">
            {annees.map((annee) => (
              <button
                key={annee.id}
                type="button"
                onClick={() => { setAnneeActive(annee.label); setOpen(false) }}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-gray-50 transition-colors"
              >
                <span className={annee.label === anneeActive ? 'font-semibold text-blue-700' : 'text-gray-700'}>
                  {annee.label}
                </span>
                {annee.label === anneeActive && (
                  <Check size={12} className="text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-gray-100" />

          {/* Add new year */}
          {adding ? (
            <div className="px-3 py-2 flex items-center gap-1.5">
              <input
                ref={inputRef}
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ex: 2025–2026"
                className="flex-1 h-6 text-[12px] px-2 border border-blue-400 rounded focus:outline-none"
              />
              <button
                type="button"
                onClick={handleConfirmAdd}
                className="h-6 px-2 text-[11px] font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors shrink-0"
              >
                OK
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={handleStartAdding}
              className="w-full flex items-center gap-2 px-3 py-1.5 text-[12px] text-blue-600 hover:bg-blue-50 transition-colors"
            >
              <Plus size={12} />
              Nouvelle année
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export function Sidebar() {
  const pathname = usePathname()

  function isActive(href: string) {
    if (href === '/classes') {
      return pathname.startsWith('/classes')
    }
    return pathname === href || pathname.startsWith(href + '/')
  }

  return (
    <aside className="sidebar-nav w-[220px] shrink-0 h-screen sticky top-0 bg-white border-r border-gray-200 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-12 border-b border-gray-200 shrink-0">
        <div className="w-7 h-7 rounded-md bg-blue-600 flex items-center justify-center">
          <GraduationCap size={15} className="text-white" />
        </div>
        <span className="text-[14px] font-bold text-gray-900 tracking-tight">GestClasse</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-3 overflow-y-auto">
        <div className="px-2 space-y-0.5">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'flex items-center gap-2.5 px-3 h-8 rounded text-[13px] font-medium transition-colors',
                  active
                    ? 'bg-blue-50 text-blue-700 border-l-[3px] border-l-blue-600 pl-[9px]'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900 border-l-[3px] border-l-transparent pl-[9px]',
                ].join(' ')}
              >
                <item.icon size={15} className={active ? 'text-blue-600' : 'text-gray-400'} />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer — year switcher */}
      <div className="px-2 py-2 border-t border-gray-200 shrink-0">
        <YearSwitcher />
      </div>
    </aside>
  )
}
