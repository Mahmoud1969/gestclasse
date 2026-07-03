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
  LogOut,
} from 'lucide-react'
import { useStore } from '@/store'
import { BUILD_ID } from '@/lib/build'
import { ThemeToggle } from './ThemeToggle'

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
        className="w-full flex items-center justify-between gap-1 px-2 py-1.5 rounded hover:bg-surface2 transition-colors group"
      >
        <div className="flex flex-col items-start min-w-0">
          <span className="text-[10px] font-medium text-faint uppercase tracking-wide leading-none mb-0.5">
            Année scolaire
          </span>
          <span className="text-[12px] font-semibold text-ink truncate leading-tight">
            {anneeActive}
          </span>
        </div>
        <ChevronDown
          size={13}
          className={[
            'text-faint shrink-0 transition-transform',
            open ? 'rotate-180' : '',
          ].join(' ')}
        />
      </button>

      {open && (
        <div className="absolute bottom-full left-0 right-0 mb-1 bg-surface border border-line rounded-lg shadow-lg z-50 overflow-hidden">
          {/* Year list */}
          <div className="py-1 max-h-48 overflow-y-auto">
            {annees.map((annee) => (
              <button
                key={annee.id}
                type="button"
                onClick={() => { setAnneeActive(annee.label); setOpen(false) }}
                className="w-full flex items-center justify-between gap-2 px-3 py-1.5 text-[12px] hover:bg-canvas transition-colors"
              >
                <span className={annee.label === anneeActive ? 'font-semibold text-blue-700' : 'text-ink'}>
                  {annee.label}
                </span>
                {annee.label === anneeActive && (
                  <Check size={12} className="text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>

          {/* Divider */}
          <div className="border-t border-line" />

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
    <aside className="sidebar-nav w-[232px] shrink-0 h-screen sticky top-0 bg-surface/95 backdrop-blur-sm border-r border-line/80 flex flex-col">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-4 h-14 border-b border-line/70 shrink-0">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-blue-500 to-blue-700 flex items-center justify-center shadow-sm ring-1 ring-blue-900/10">
          <GraduationCap size={17} className="text-white" />
        </div>
        <span className="text-[17px] font-semibold text-ink tracking-tight font-display">GestClasse</span>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 overflow-y-auto">
        <p className="px-4 mb-2 text-[10px] font-semibold text-faint uppercase tracking-[0.12em]">
          Menu
        </p>
        <div className="px-2.5 space-y-1">
          {navItems.map((item) => {
            const active = isActive(item.href)
            return (
              <Link
                key={item.href}
                href={item.href}
                className={[
                  'group relative flex items-center gap-3 px-3 h-9 rounded-lg text-[13px] font-medium transition-all duration-150',
                  active
                    ? 'bg-blue-50 text-blue-800 dark:bg-blue-500/15 dark:text-blue-200 shadow-[inset_0_0_0_1px_rgba(109,74,168,0.12)]'
                    : 'text-muted hover:bg-canvas hover:text-ink',
                ].join(' ')}
              >
                {/* Active accent bar */}
                <span
                  className={[
                    'absolute left-0 top-1/2 -translate-y-1/2 w-[3px] rounded-full bg-blue-600 transition-all duration-200',
                    active ? 'h-5 opacity-100' : 'h-0 opacity-0',
                  ].join(' ')}
                />
                <item.icon
                  size={16}
                  className={active ? 'text-blue-600 dark:text-blue-300' : 'text-faint group-hover:text-muted'}
                />
                {item.label}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer — year switcher + theme + logout + build badge */}
      <div className="px-2.5 py-3 border-t border-line/70 shrink-0 flex flex-col gap-1">
        <YearSwitcher />
        <ThemeToggle />
        <button
          type="button"
          onClick={async () => {
            await fetch('/api/auth/logout', { method: 'POST' })
            window.location.href = '/login'
          }}
          className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] font-medium text-muted hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-500/15 dark:hover:text-red-300 transition-colors"
        >
          <LogOut size={15} />
          Se déconnecter
        </button>
        <div className="px-3 pt-1 text-[9px] text-faint font-mono select-none tracking-wide" title="Identifiant du déploiement actuel">
          build {BUILD_ID}
        </div>
      </div>
    </aside>
  )
}
