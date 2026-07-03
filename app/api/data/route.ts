import { NextResponse } from 'next/server'
import { put, list, del } from '@vercel/blob'
import type { Annee, Classe, Eleve, Note, Absence } from '@/lib/types'

// Disable any caching at the route level — every request must hit the blob.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BLOB_KEY = 'gestclasse-state.json'
const BACKUP_PREFIX = 'backups/gestclasse-'
const MAX_BACKUPS = 20

export interface AppData {
  annees: Annee[]
  anneeActive: string
  classes: Classe[]
  eleves: Eleve[]
  notes: Note[]
  absences: Absence[]
}

const EMPTY_STATE: AppData = {
  annees: [{ id: 'annee-default', label: '2024–2025' }],
  anneeActive: '2024–2025',
  classes: [],
  eleves: [],
  notes: [],
  absences: [],
}

/**
 * GET /api/data
 * Returns the entire app state. If nothing is stored yet, returns the
 * empty default state so the UI never sees an undefined response.
 */
export async function GET() {
  try {
    const { blobs } = await list({ prefix: BLOB_KEY, limit: 1 })
    const found = blobs.find((b) => b.pathname === BLOB_KEY)
    if (!found) {
      return NextResponse.json(EMPTY_STATE)
    }
    const res = await fetch(found.url, { cache: 'no-store' })
    if (!res.ok) {
      return NextResponse.json(EMPTY_STATE)
    }
    const data = (await res.json()) as AppData
    return NextResponse.json(data)
  } catch (err) {
    console.error('GET /api/data failed', err)
    return NextResponse.json(EMPTY_STATE)
  }
}

/**
 * PUT /api/data
 * Replaces the entire app state with the request body. The body must
 * have the AppData shape.
 */
export async function PUT(req: Request) {
  try {
    const body = (await req.json()) as AppData
    // Minimal shape validation — refuse anything that doesn't look right
    if (
      !body ||
      !Array.isArray(body.annees) ||
      !Array.isArray(body.classes) ||
      !Array.isArray(body.eleves) ||
      !Array.isArray(body.notes) ||
      !Array.isArray(body.absences) ||
      typeof body.anneeActive !== 'string'
    ) {
      return NextResponse.json({ error: 'Invalid shape' }, { status: 400 })
    }
    const payload = JSON.stringify(body)
    await put(BLOB_KEY, payload, {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    })

    // Fire-and-forget timestamped backup so a bad overwrite is recoverable.
    // We await it but never let a backup failure fail the main save.
    try {
      const stamp = new Date().toISOString().replace(/[:.]/g, '-')
      await put(`${BACKUP_PREFIX}${stamp}.json`, payload, {
        access: 'public',
        contentType: 'application/json',
        addRandomSuffix: false,
        cacheControlMaxAge: 0,
      })
      await pruneBackups()
    } catch (backupErr) {
      console.error('Backup step failed (main save OK)', backupErr)
    }

    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/data failed', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}

/** Keep only the most recent MAX_BACKUPS timestamped backups. */
async function pruneBackups() {
  const { blobs } = await list({ prefix: BACKUP_PREFIX, limit: 1000 })
  if (blobs.length <= MAX_BACKUPS) return
  // Pathnames sort chronologically because the timestamp is ISO-ordered.
  const sorted = [...blobs].sort((a, b) => a.pathname.localeCompare(b.pathname))
  const toDelete = sorted.slice(0, sorted.length - MAX_BACKUPS)
  await Promise.all(toDelete.map((b) => del(b.url).catch(() => {})))
}
