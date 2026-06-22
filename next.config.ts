import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
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
            // No inline scripts; KaTeX loads its own CSS — adjust font-src as needed.
            value: [
              "default-src 'self'",
              "script-src 'self'",
              "style-src 'self' 'unsafe-inline'", // KaTeX needs inline styles
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
