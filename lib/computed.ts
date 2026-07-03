import type { Note } from './types'

export function moyenneTrimestre(note: Note): number | null {
  const { devoir_controle: dc, devoir_synthese: ds } = note

  // Absent Justifié on devoir de contrôle → the synthèse note IS the average.
  // No zero is applied for the missing test.
  if (dc === 'AJ') {
    return ds ?? null
  }

  // Nothing entered yet → no average
  if (dc === null && ds === null) return null

  // Standard weighted average: contrôle counts 1, synthèse counts 2
  return ((dc ?? 0) * 1 + (ds ?? 0) * 2) / 3
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

/**
 * Ranks students by average (highest = rank 1). Students with no average
 * (null) are unranked (null). Ties share the same rank (competition
 * ranking: 1, 2, 2, 4). Returns a Map of eleveId → rank.
 */
export function computeRanks(
  entries: { id: string; moyenne: number | null }[]
): Map<string, number | null> {
  const ranks = new Map<string, number | null>()
  const ranked = entries
    .filter((e): e is { id: string; moyenne: number } => e.moyenne !== null)
    .sort((a, b) => b.moyenne - a.moyenne)

  let lastMoy: number | null = null
  let lastRank = 0
  ranked.forEach((e, i) => {
    if (lastMoy !== null && Math.abs(e.moyenne - lastMoy) < 1e-9) {
      // tie → same rank as previous
      ranks.set(e.id, lastRank)
    } else {
      lastRank = i + 1
      lastMoy = e.moyenne
      ranks.set(e.id, lastRank)
    }
  })

  // Everyone without an average is unranked
  entries.forEach((e) => {
    if (!ranks.has(e.id)) ranks.set(e.id, null)
  })
  return ranks
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
