'use client'

import React, { useEffect, useState } from 'react'
import { Sun, Moon } from 'lucide-react'

/**
 * Light/dark theme toggle. Reads/writes localStorage 'gc-theme' and toggles
 * the `.dark` class on <html>. The initial class is set by an inline script
 * in the layout <head> (no-flash), so here we just sync UI state on mount.
 */
export function ThemeToggle() {
  const [dark, setDark] = useState(false)

  useEffect(() => {
    setDark(document.documentElement.classList.contains('dark'))
  }, [])

  function toggle() {
    const next = !dark
    setDark(next)
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem('gc-theme', next ? 'dark' : 'light')
    } catch {
      /* ignore */
    }
  }

  return (
    <button
      type="button"
      onClick={toggle}
      title={dark ? 'Passer en clair' : 'Passer en sombre'}
      className="flex items-center gap-2.5 px-3 h-9 rounded-lg text-[12.5px] font-medium text-muted hover:bg-surface2 hover:text-ink transition-colors"
    >
      <span className="relative w-[15px] h-[15px]">
        <Sun
          size={15}
          className={[
            'absolute inset-0 transition-all duration-300',
            dark ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100 text-gold-500',
          ].join(' ')}
        />
        <Moon
          size={15}
          className={[
            'absolute inset-0 transition-all duration-300',
            dark ? 'opacity-100 rotate-0 scale-100 text-blue-300' : 'opacity-0 -rotate-90 scale-0',
          ].join(' ')}
        />
      </span>
      {dark ? 'Mode sombre' : 'Mode clair'}
    </button>
  )
}
