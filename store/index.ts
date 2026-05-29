'use client'

import { create } from 'zustand'
import { persist } from 'zustand/middleware'
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
  // School years
  annees: Annee[]
  anneeActive: string // label of the active year, e.g. "2024–2025"

  // Core data
  classes: Classe[]
  eleves: Eleve[]
  notes: Note[]
  absences: Absence[]
  toasts: ToastItem[]

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

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      annees: [{ id: 'annee-default', label: '2024–2025' }],
      anneeActive: '2024–2025',
      classes: [],
      eleves: [],
      notes: [],
      absences: [],
      toasts: [],

      addAnnee: (label) =>
        set((s) => ({
          annees: [...s.annees, { id: uid(), label }],
          anneeActive: label,
        })),
      setAnneeActive: (label) => set({ anneeActive: label }),

      addClass: (data) =>
        set((s) => ({ classes: [...s.classes, { ...data, id: uid() }] })),
      updateClass: (id, data) =>
        set((s) => ({
          classes: s.classes.map((c) => (c.id === id ? { ...c, ...data } : c)),
        })),
      deleteClass: (id) =>
        set((s) => ({
          classes: s.classes.filter((c) => c.id !== id),
          eleves: s.eleves.filter((e) => e.classeId !== id),
          notes: s.notes.filter((n) => n.classeId !== id),
          absences: s.absences.filter((a) => a.classeId !== id),
        })),

      addEleve: (data) =>
        set((s) => ({ eleves: [...s.eleves, { ...data, id: uid() }] })),
      updateEleve: (id, data) =>
        set((s) => ({
          eleves: s.eleves.map((e) => (e.id === id ? { ...e, ...data } : e)),
        })),
      deleteEleve: (id) =>
        set((s) => ({
          eleves: s.eleves.filter((e) => e.id !== id),
          notes: s.notes.filter((n) => n.eleveId !== id),
          absences: s.absences.filter((a) => a.eleveId !== id),
        })),

      upsertNote: (data) =>
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
        }),
      getNoteForEleve: (eleveId, trimestre) =>
        get().notes.find((n) => n.eleveId === eleveId && n.trimestre === trimestre),

      addAbsence: (data) =>
        set((s) => ({ absences: [...s.absences, { ...data, id: uid() }] })),
      updateAbsence: (id, data) =>
        set((s) => ({
          absences: s.absences.map((a) => (a.id === id ? { ...a, ...data } : a)),
        })),
      deleteAbsence: (id) =>
        set((s) => ({ absences: s.absences.filter((a) => a.id !== id) })),

      addToast: (message, type = 'success') => {
        const id = uid()
        set((s) => ({ toasts: [...s.toasts, { id, message, type }] }))
        setTimeout(() => {
          set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) }))
        }, 3000)
      },
      removeToast: (id) =>
        set((s) => ({ toasts: s.toasts.filter((t) => t.id !== id) })),
    }),
    {
      name: 'gestclasse-v2',
      version: 1,
      // Safe merge: always guarantee annees and anneeActive have valid values
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState>
        // Filter out corrupt eleves (missing required fields)
        const cleanEleves = Array.isArray(p.eleves)
          ? p.eleves.filter((e) => e.nom && e.prenom && e.dateNaissance && e.classeId)
          : []
        return {
          ...current,
          ...p,
          eleves: cleanEleves,
          annees: Array.isArray(p.annees) && p.annees.length > 0
            ? p.annees
            : current.annees,
          anneeActive: typeof p.anneeActive === 'string' && p.anneeActive.length > 0
            ? p.anneeActive
            : current.anneeActive,
          // Never persist transient UI state
          toasts: [],
        }
      },
    }
  )
)
