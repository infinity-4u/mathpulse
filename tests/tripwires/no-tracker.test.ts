/**
 * TRIPWIRE: no-tracker
 * Fails if any analytics/tracker package appears in dependencies.
 * Enforces CONTRACT.md §2 (APP 6) and compliance.md.
 */
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'fs'
import { resolve } from 'path'

const ROOT = resolve(__dirname, '../..')

const BANNED_PACKAGES = [
  // Analytics
  '@google-analytics',
  'firebase',
  'mixpanel',
  'mixpanel-browser',
  'amplitude-js',
  '@amplitude/analytics-browser',
  'segment',
  '@segment/analytics-next',
  'rudderstack',
  'posthog-js',
  'heap',
  'fullstory',
  '@fullstory/browser',
  'hotjar',
  'clarity',
  '@microsoft/clarity',
  // Advertising / tracking
  'fbq',
  'gtag',
  'ga-4-react',
  'react-ga',
  'react-ga4',
  // Error tracking that phone home (self-hosted alternatives OK)
  '@sentry/browser',    // flag for review — only allow if data residency confirmed
  'datadog-rum',
  '@datadog/browser-rum',
]

describe('no-tracker tripwire', () => {
  it('package.json contains no banned tracker/analytics packages', () => {
    const pkg = JSON.parse(readFileSync(resolve(ROOT, 'package.json'), 'utf-8'))
    const allDeps = {
      ...pkg.dependencies,
      ...pkg.devDependencies,
      ...pkg.peerDependencies,
    }
    const found = BANNED_PACKAGES.filter(banned =>
      Object.keys(allDeps).some(dep => dep === banned || dep.startsWith(banned + '/'))
    )
    expect(found, `Banned tracker packages found: ${found.join(', ')}`).toHaveLength(0)
  })

  it('next.config.ts does not load external tracking scripts', () => {
    const config = readFileSync(resolve(ROOT, 'next.config.ts'), 'utf-8')
    const trackingPatterns = [
      'googletagmanager',
      'google-analytics',
      'analytics.js',
      'hotjar',
      'clarity.ms',
      'fbevents',
    ]
    const found = trackingPatterns.filter(p => config.toLowerCase().includes(p))
    expect(found, `Tracking script references found in next.config.ts: ${found.join(', ')}`).toHaveLength(0)
  })
})
