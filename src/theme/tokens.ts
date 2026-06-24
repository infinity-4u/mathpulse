/**
 * Design tokens — single source of truth for colours, spacing, and typography.
 * Synced from the design system in Claude Design / Figma.
 * See design/DESIGN_PLACEHOLDER.md for the design system setup instructions.
 *
 * Accessibility requirements (CONTRACT.md, spec.md):
 *   - Text on white: minimum 4.5:1 contrast (WCAG 2.1 AA)
 *   - Large text / UI components: minimum 3:1 contrast
 *   - Red (color.error) is reserved for TECHNICAL errors only — never for wrong answers
 *   - Wrong answers use color.repair (amber/orange), never color.error (red)
 */

export const color = {
  // Brand
  primary:     '#1B5E9B', // blue — 4.7:1 on white ✓
  primaryDark: '#134478', // darker for hover states — 7.1:1 on white ✓

  // Feedback — repair states (wrong answers, hints)
  repair:      '#B45309', // amber — used for incorrect / hint states. NEVER use error for wrong answers.
  repairLight: '#FEF3C7', // amber background for repair cards

  // Feedback — correct
  success:     '#166534', // green — 5.6:1 on white ✓
  successLight:'#DCFCE7',

  // Technical errors only (network failures, timeouts — NOT wrong answers)
  error:       '#B91C1C', // red — reserved for technical errors per spec.md
  errorLight:  '#FEE2E2',

  // Selection / informational
  primaryLight: '#EFF6FF', // light blue bg for selected state and info banners

  // Neutral
  text:        '#111827', // 19:1 on white ✓
  textMuted:   '#4B5563', // 5.9:1 on white ✓
  border:      '#D1D5DB',
  borderStrong: '#6B7280', // meaningful borders — WCAG 1.4.11 ≥3:1 on white (4.6:1 ✓)
  focusRing:   '#1B5E9B', // = primary; applied as CSS outline, survives forced-colours mode
  surface:     '#FFFFFF',
  background:  '#F9FAFB',

  // Strand identity — eyebrow text on white, WCAG AA minimum
  strand: {
    number:      '#2563EB', // 5.17:1 ✓
    algebra:     '#7C3AED', // 5.70:1 ✓
    measurement: '#047857', // 5.9:1 ✓  (was #059669 — darkened to clear AA)
    space:       '#C2410C', // 4.8:1 ✓  (was #D97706 — darkened to clear AA)
    statistics:  '#DC2626', // 4.83:1 ✓
    probability: '#0E7490', // 5.0:1 ✓  (was #0891B2 — darkened to clear AA)
  },

  // Calm mode overrides (toggled by student — spec.md)
  calm: {
    background: '#F5F0E8', // warm off-white, less stimulating
    primary:    '#2D5A3D', // muted green
    text:       '#1C1917',
  },
} as const

export const space = {
  1:  '4px',
  2:  '8px',
  3:  '12px',
  4:  '16px',
  5:  '20px',
  6:  '24px',
  8:  '32px',
  10: '40px',
  12: '48px',
  16: '64px',
} as const

export const typography = {
  fontFamily: {
    base:       'system-ui, -apple-system, sans-serif',
    dyslexic:   '"OpenDyslexic", "Lexie Readable", sans-serif', // toggled by student (spec.md)
    mono:       'ui-monospace, "Cascadia Code", monospace',
  },
  fontSize: {
    sm:   '14px',
    base: '16px',
    lg:   '18px',
    xl:   '20px',
    '2xl':'24px',
    '3xl':'30px',
  },
  fontWeight: {
    normal: '400',
    medium: '500',
    bold:   '700',
  },
  lineHeight: {
    tight:  '1.25',
    base:   '1.5',
    loose:  '1.75',
  },
} as const

// Touch targets — minimum 44×44px per spec.md and CONTRACT.md
export const touch = {
  minSize: '44px',
} as const

export const shadows = {
  card:   '0 1px 3px rgba(0,0,0,0.1)',
  raised: '0 4px 12px rgba(17,24,39,0.08)', // elevated QuestionCard above feedback bands
} as const
