'use client'

import { useEffect } from 'react'

/**
 * Aggressively clears any stale browser caches that could prevent users
 * from seeing the latest deployment. Runs once on initial mount.
 *
 * Targets:
 * - Service Workers (any registered worker is unregistered)
 * - Cache Storage API (Chrome's `caches.*` namespace, often populated by
 *   old service workers even after they're unregistered)
 *
 * NOTE: We intentionally do NOT touch localStorage — that holds the user's
 * classes/eleves/notes/absences. Only ephemeral caches are purged.
 */
export function CachePurger() {
  useEffect(() => {
    // Unregister any service worker that might be intercepting requests
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker
        .getRegistrations()
        .then((regs) => {
          regs.forEach((r) => {
            r.unregister().catch(() => {})
          })
        })
        .catch(() => {})
    }

    // Wipe Cache Storage (used by service workers / PWA)
    if (typeof window !== 'undefined' && 'caches' in window) {
      caches
        .keys()
        .then((keys) => {
          keys.forEach((k) => {
            caches.delete(k).catch(() => {})
          })
        })
        .catch(() => {})
    }
  }, [])

  return null
}
