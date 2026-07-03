import { NextResponse } from 'next/server'
import { createSessionToken, SESSION_COOKIE, SESSION_MAX_AGE_SECONDS } from '@/lib/auth'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function POST(req: Request) {
  try {
    const { password } = (await req.json()) as { password?: string }
    const expected = process.env.APP_PASSWORD

    // If no password is configured, deny (fail closed) so we never run open.
    if (!expected) {
      return NextResponse.json(
        { error: 'Application non configurée (APP_PASSWORD manquant).' },
        { status: 500 }
      )
    }

    if (!password || password !== expected) {
      return NextResponse.json({ error: 'Mot de passe incorrect.' }, { status: 401 })
    }

    const token = await createSessionToken(Date.now())
    const res = NextResponse.json({ ok: true })
    res.cookies.set(SESSION_COOKIE, token, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge: SESSION_MAX_AGE_SECONDS,
    })
    return res
  } catch {
    return NextResponse.json({ error: 'Requête invalide.' }, { status: 400 })
  }
}
