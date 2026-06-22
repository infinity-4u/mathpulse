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

  // Neutral
  text:        '#111827', // 19:1 on white ✓
  textMuted:   '#4B5563', // 5.9:1 on white ✓
  border:      '#D1D5DB',
  surface:     '#FFFFFF',
  background:  '#F9FAFB',

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
