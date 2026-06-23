/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'standalone',  // required for Docker deployment
  // Enforce Sydney region for any server functions touching user data.
  // When deploying to Vercel, also set VERCEL_REGION=syd1 in project settings.

  // Security headers
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          {
            key: 'Content-Security-Policy',
            // Next.js App Router streams RSC payloads via inline <script> tags,
            // so 'unsafe-inline' is required for hydration to work.
            // Tighten to nonce-based CSP once middleware is in place.
            value: [
              "default-src 'self'",
              "script-src 'self' 'unsafe-inline'",
              "style-src 'self' 'unsafe-inline'",
              "font-src 'self' data:",
              "img-src 'self' data:",
              "connect-src 'self' https://*.supabase.co",
              "frame-ancestors 'none'",
            ].join('; '),
          },
        ],
      },
    ]
  },
}

export default nextConfig
