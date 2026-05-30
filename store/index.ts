'use client'

import { create } from 'zustand'
import type { Annee, Classe, Eleve, Note, Absence } from '@/lib/types'

function uid(): string {
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export interface ToastItem {
  id: string
  message: string
  type: 'success' | 'error' | 'info'
}

interface AppState {
  // Sync state
  _hydrated: boolean
  _syncing: boolean
  _lastSyncError: string | null

  // School years
  annees: Annee[]
  anneeActive: string

  // Core data
  classes: Classe[]
  eleves: Eleve[]
  notes: Note[]
  absences: Absence[]
  toasts: ToastItem[]

  // Sync actions
  hydrate: () => Promise<void>
  refresh: () => Promise<void>

  // Year actions
  addAnnee: (label: string) => void
  setAnneeActive: (label: string) => void

  // Classes
  addClass: (data: Omit<Classe, 'id'>) => void
  updateClass: (id: string, data: Partial<Omit<Classe, 'id'>>) => void
  deleteClass: (id: string) => void

  // Eleves
  addEleve: (data: Omit<Eleve, 'id'>) => void
  updateEleve: (id: string, data: Partial<Omit<Eleve, 'id'>>) => void
  deleteEleve: (id: string) => void

  // Notes
  upsertNote: (data: Omit<Note, 'id'> & { id?: string }) => void
  getNoteForEleve: (eleveId: string, trimestre: 1 | 2 | 3) => Note | undefined

  // Absences
  addAbsence: (data: Omit<Absence, 'id'>) => void
  updateAbsence: (id: string, data: Partial<Omit<Absence, 'id'>>) => void
  deleteAbsence: (id: string) => void

  // Toasts
  addToast: (message: string, type?: ToastItem['type']) => void
  removeToast: (id: string) => void
}

// Fields that need to be persisted to the cloud (everything except UI/sync state)
const PERSISTED_KEYS = [
  'annees',
  'anneeActive',
  'classes',
  'eleves',
  'notes',
  'absences',
] as const

let saveTimer: ReturnType<typeof setTimeout> | null = null

/**
 * Schedules a save to the backend. Multiple rapid mutations are coalesced
 * into a single PUT request 300 ms after the last change — keeps the API
 * cheap and avoids race conditions on rapid edits.
 */
function scheduleSave() {
  if (typeof window === 'undefined') return
  if (saveTimer) clearTimeout(saveTimer)
  saveTimer = setTimeout(async () => {
    const s = useStore.getState()
    if (!s._hydrated) return // never overwrite the cloud with our empty initial state
    useStore.setState({ _syncing: true, _lastSyncError: null })
    try {
      const body = PERSISTED_KEYS.reduce((acc, k) => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        ;(acc as any)[k] = (s as any)[k]
        return acc
      }, {} as Record<string, unknown>)
      const res = await fetch('/api/data', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
        cache: 'no-store',
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      useStore.setState({ _syncing: false })
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err)
      useStore.setState({ _syncing: false, _lastSyncError: msg })
    }
  }, 300)
}

export const useStore = create<AppState>()((set, get) => ({
  _hydrated: false,
  _syncing: false,
  _lastSyncError: null,

  annees: [{ id: 'annee-default', label: '2024–2025' }],
  anneeActive: '2024–2025',
  classes: [],
  eleves: [],
  notes: [],
  absences: [],
  toasts: [],

  hydrate: async () => {
    if (get()._hydrated) return
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      if (res.ok) {
        const data = await res.json()
        set({
          annees: data.annees ?? get().annees,
          anneeActive: data.anneeActive ?? get().anneeActive,
          classes: data.classes ?? [],
          eleves: data.eleves ?? [],
          notes: data.notes ?? [],
          absences: data.absences ?? [],
          _hydrated: true,
        })
      } else {
        set({ _hydrated: true })
      }
    } catch (err) {
      console.error('hydrate failed', err)
      set({ _hydrated: true, _lastSyncError: String(err) })
    }
  },

  refresh: async () => {
    try {
      const res = await fetch('/api/data', { cache: 'no-store' })
      if (!res.ok) return
      const data = await res.json()
      set({
        annees: data.annees ?? get().annees,
        anneeActive: data.anneeActive ?? get().anneeActive,
        classes: data.classes ?? [],
        eleves: data.eleves ?? [],
        notes: data.notes ?? [],
        absences: data.absences ?? [],
      })
    } catch {
      /* silent — we just keep what we have */
    }
  },

  addAnnee: (label) => {
    set((s) => ({ annees: [...s.annees, { id: uid(), label }], anneeActive: label }))
    scheduleSave()
  },
  setAnneeActive: (label) => {
    set({ anneeActive: label })
    scheduleSave()
  },

  addClass: (data) => {
    set((s) => ({ classes: [...s.classes, { ...data, id: uid() }] }))
    scheduleSave()
  },
  updateClass: (id, data) => {
    set((s) => ({ classes: s.classes.map((c) => (c.id === id ? { ...c, ...data } : c)) }))
    scheduleSave()
  },
  deleteClass: (id) => {
    set((s) => ({
      classes: s.classes.filter((c) => c.id !== id),
      eleves: s.eleves.filter((e) => e.classeId !== id),
      notes: s.notes.filter((n) => n.classeId !== id),
      absences: s.absences.filter((a) => a.classeId !== id),
    }))
    scheduleSave()
  },

  addEleve: (data) => {
    set((s) => ({ eleves: [...s.eleves, { ...data, id: uid() }] }))
    scheduleSave()
  },
  updateEleve: (id, data) => {
    set((s) => ({ eleves: s.eleves.map((e) => (e.id === id ? { ...e, ...data } : e)) }))
    scheduleSave()
  },
  deleteEleve: (id) => {
    set((s) => ({
      eleves: s.eleves.filter((e) => e.id !== id),
      notes: s.notes.filter((n) => n.eleveId !== id),
      absences: s.absences.filter((a) => a.eleveId !== id),
    }))
    scheduleSave()
  },

  upsertNote: (data) => {
    set((s) => {
      const existing = s.notes.find(
        (n) => n.eleveId === data.eleveId && n.trimestre === data.trimestre
      )
      if (existing) {
        return {
          notes: s.notes.map((n) =>
            n.id === existing.id ? { ...n, ...data, id: existing.id } : n
          ),
        }
      }
      return { notes: [...s.notes, { ...data, id: data.id ?? uid() }] }
    })
    scheduleSave()
  },
  getNoteForEleve: (eleveId, trimestre) =>
    get().notes.find((n) => n.eleveId === eleveId && n.trimestre === trimestre),

  addAbsence: (data) => {
    set((s) => ({ absences: [...s.absences, { ...data, id: uid() }] }))
    scheduleSave()
  },
  updateAbsence: (id, data) => {
    set((s) => ({ absences: s.absences.map((a) => (a.id === id ? { ...a, ...data } : a)) }))
    scheduleSave()
  },
  deleteAbsence: (id) => {
    set((s) => ({ absences: s.absences.filter((a) => a.id !== id) }))
    scheduleSave()
  },

  addToast: (message, type = 'success') => {
    const id = uid()
    set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
    setTimeout(() => {
      set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
    }, 3000)
  },
  removeToast: (id) => set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
}))
