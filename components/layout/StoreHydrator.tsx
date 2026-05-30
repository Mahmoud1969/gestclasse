'use client'

import { useEffect } from 'react'
import { useStore } from '@/store'

/**
 * Loads the cloud-stored app state on first mount and refreshes it
 * whenever the user comes back to the tab. This is what makes the app
 * stay in sync between Chrome / Edge / phone — every focus re-pulls
 * the latest data from the Blob store.
 */
export function StoreHydrator() {
  const hydrate = useStore((s) => s.hydrate)
  const refresh = useStore((s) => s.refresh)

  useEffect(() => {
    hydrate()
  }, [hydrate])

  useEffect(() => {
    function onVisibility() {
      if (document.visibilityState === 'visible') {
        refresh()
      }
    }
    document.addEventListener('visibilitychange', onVisibility)
    window.addEventListener('focus', refresh)
    return () => {
      document.removeEventListener('visibilitychange', onVisibility)
      window.removeEventListener('focus', refresh)
    }
  }, [refresh])

  return null
}
