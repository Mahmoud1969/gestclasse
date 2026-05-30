import { NextResponse } from 'next/server'
import { put, list } from '@vercel/blob'
import type { Annee, Classe, Eleve, Note, Absence } from '@/lib/types'

// Disable any caching at the route level — every request must hit the blob.
export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

const BLOB_KEY = 'gestclasse-state.json'

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
    await put(BLOB_KEY, JSON.stringify(body), {
      access: 'public',
      contentType: 'application/json',
      allowOverwrite: true,
      addRandomSuffix: false,
      cacheControlMaxAge: 0,
    })
    return NextResponse.json({ ok: true })
  } catch (err) {
    console.error('PUT /api/data failed', err)
    return NextResponse.json({ error: 'Save failed' }, { status: 500 })
  }
}
