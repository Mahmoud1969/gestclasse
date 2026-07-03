/**
 * Tiny session-token helper shared by the login API route (Node runtime)
 * and the middleware (Edge runtime). Uses Web Crypto HMAC-SHA256, which is
 * available in both environments.
 *
 * A session token is `<payload>.<hmac>` where payload is a base64url string
 * "gc:<issuedAtMs>". We don't store anything server-side — the HMAC proves
 * the cookie was minted by us with the secret.
 */

export const SESSION_COOKIE = 'gc_session'
const SESSION_MAX_AGE_DAYS = 30

function getSecret(): string {
  return process.env.AUTH_SECRET ?? 'dev-insecure-secret-change-me'
}

function b64url(bytes: ArrayBuffer | Uint8Array): string {
  const arr = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes)
  let str = ''
  for (let i = 0; i < arr.length; i++) str += String.fromCharCode(arr[i])
  return btoa(str).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}

async function hmac(payload: string): Promise<string> {
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw',
    enc.encode(getSecret()),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(payload))
  return b64url(sig)
}

/** Create a signed session token. */
export async function createSessionToken(issuedAt: number): Promise<string> {
  const payload = b64url(new TextEncoder().encode(`gc:${issuedAt}`))
  const sig = await hmac(payload)
  return `${payload}.${sig}`
}

/** Verify a session token is well-formed, correctly signed, and not expired. */
export async function verifySessionToken(token: string | undefined): Promise<boolean> {
  if (!token) return false
  const parts = token.split('.')
  if (parts.length !== 2) return false
  const [payload, sig] = parts
  const expected = await hmac(payload)
  if (sig !== expected) return false
  // Decode issuedAt and check expiry
  try {
    const raw = payload.replace(/-/g, '+').replace(/_/g, '/')
    const decoded = atob(raw)
    const match = decoded.match(/^gc:(\d+)$/)
    if (!match) return false
    const issuedAt = parseInt(match[1], 10)
    const ageMs = Date.now() - issuedAt
    const maxMs = SESSION_MAX_AGE_DAYS * 24 * 60 * 60 * 1000
    return ageMs >= 0 && ageMs < maxMs
  } catch {
    return false
  }
}

export const SESSION_MAX_AGE_SECONDS = SESSION_MAX_AGE_DAYS * 24 * 60 * 60
