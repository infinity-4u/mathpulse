import type { Config } from 'tailwindcss'
import plugin from 'tailwindcss/plugin'

// Token values mirrored from src/theme/tokens.ts — keep in sync when tokens change
const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx,mdx}'],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#1B5E9B',
          dark:    '#134478',
          light:   '#EFF6FF',
        },
        success: {
          DEFAULT: '#166534',
          light:   '#DCFCE7',
        },
        repair: {
          DEFAULT: '#B45309',
          light:   '#FEF3C7',
        },
        error: {
          DEFAULT: '#B91C1C',
          light:   '#FEE2E2',
        },
        // Neutral — prefixed to avoid Tailwind built-in name collisions
        ink: {
          DEFAULT: '#111827', // color.text — 19:1 on white
          muted:   '#4B5563', // color.textMuted — 5.9:1 on white
        },
        edge: {
          DEFAULT: '#D1D5DB', // color.border — decorative only
          strong:  '#6B7280', // color.borderStrong — meaningful UI borders (4.6:1)
        },
        surface:  '#FFFFFF',
        canvas:   '#F9FAFB', // page background
        // Strand identity (AA contrast on white — see tokens.ts)
        strand: {
          number:      '#2563EB',
          algebra:     '#7C3AED',
          measurement: '#047857',
          space:       '#C2410C',
          statistics:  '#DC2626',
          probability: '#0E7490',
        },
        // Calm mode overrides (future toggle)
        calm: {
          bg:      '#F5F0E8',
          primary: '#2D5A3D',
          text:    '#1C1917',
        },
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['ui-monospace', 'Cascadia Code', 'monospace'],
      },
      boxShadow: {
        card:   '0 1px 3px rgba(0,0,0,0.1)',
        raised: '0 4px 12px rgba(17,24,39,0.08)',
      },
      minHeight: {
        touch: '44px',
      },
    },
  },
  plugins: [
    // calm: variant — active when <html data-calm> is set by CalmModeContext
    plugin(({ addVariant }) => {
      addVariant('calm', '[data-calm] &')
    }),
  ],
}

export default config
