/** @type {import('next').NextConfig} */
const nextConfig = {
  // Surface the current build SHA to the client (read in lib/build.ts) so we
  // can visually verify which deployment a browser is actually showing.
  env: {
    NEXT_PUBLIC_BUILD_ID:
      process.env.VERCEL_GIT_COMMIT_SHA ?? new Date().toISOString(),
  },

  // Force browsers (looking at you, Chrome) to always revalidate HTML
  // so users always get the latest deployed version without manual cache clearing.
  // Static assets in /_next/static/ keep their long-lived cache because their
  // filenames are content-hashed — that's safe and gives us the best of both.
  async headers() {
    return [
      {
        // Match every route except the hashed static assets and the favicon
        source: '/((?!_next/static|favicon.ico).*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'no-store, must-revalidate',
          },
          {
            key: 'Pragma',
            value: 'no-cache',
          },
          {
            key: 'Expires',
            value: '0',
          },
        ],
      },
    ]
  },
}

export default nextConfig
