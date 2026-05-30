/**
 * Build identifier — replaced at build-time by Vercel via the
 * VERCEL_GIT_COMMIT_SHA env var (first 7 chars). Falls back to a local
 * timestamp when developing.
 *
 * This is rendered in the sidebar so we can visually confirm WHICH
 * deployment a browser is showing — useful for diagnosing cache issues.
 */
export const BUILD_ID: string =
  (process.env.NEXT_PUBLIC_BUILD_ID ?? 'dev').slice(0, 7)
