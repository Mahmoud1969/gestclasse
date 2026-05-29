import type { Note } from './types'

export function moyenneTrimestre(note: Note): number | null {
  if (note.devoir_controle === null && note.devoir_synthese === null) return null
  const dc = note.devoir_controle ?? 0
  const ds = note.devoir_synthese ?? 0
  return (dc * 1 + ds * 2) / 3
}

export function moyenneAnnuelle(
  t1: number | null,
  t2: number | null,
  t3: number | null
): number | null {
  const valid = [t1, t2, t3].filter((m): m is number => m !== null)
  if (valid.length === 0) return null
  return valid.reduce((a, b) => a + b, 0) / valid.length
}

export function progression(
  t1: number | null,
  t2: number | null,
  t3: number | null
): 'up' | 'stable' | 'down' {
  const valid = [t1, t2, t3].filter((m): m is number => m !== null)
  if (valid.length < 2) return 'stable'
  const last = valid[valid.length - 1]
  const prev = valid[valid.length - 2]
  if (last > prev + 0.5) return 'up'
  if (last < prev - 0.5) return 'down'
  return 'stable'
}

type MentionVariant = 'success' | 'info' | 'teal' | 'warning' | 'danger' | 'neutral'

export function getMention(moyenne: number | null): {
  label: string
  variant: MentionVariant
} {
  if (moyenne === null) return { label: '—', variant: 'neutral' }
  if (moyenne >= 16) return { label: 'Excellent', variant: 'success' }
  if (moyenne >= 14) return { label: 'Bien', variant: 'info' }
  if (moyenne >= 12) return { label: 'Assez Bien', variant: 'teal' }
  if (moyenne >= 10) return { label: 'Passable', variant: 'warning' }
  return { label: 'Insuffisant', variant: 'danger' }
}

export function formatNote(value: number | null): string {
  if (value === null) return '—'
  return value.toFixed(2)
}

export function median(values: number[]): number | null {
  if (values.length === 0) return null
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  if (sorted.length % 2 === 0) {
    return (sorted[mid - 1] + sorted[mid]) / 2
  }
  return sorted[mid]
}

export function standardDeviation(values: number[]): number | null {
  if (values.length === 0) return null
  const mean = values.reduce((a, b) => a + b, 0) / values.length
  const variance = values.reduce((acc, v) => acc + Math.pow(v - mean, 2), 0) / values.length
  return Math.sqrt(variance)
}
