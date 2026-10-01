import type { Config } from 'tailwindcss'

// Black & white design system. Tokens are semantic:
//   ink      = black (primary text, primary buttons, dark surfaces)
//   canvas   = page background (off-white)
//   surface  = cards / panels (white)
//   sunken   = hover / inset surfaces
//   line     = borders
//   volt     = the ONE accent, used sparingly on black surfaces only
//   ok/warn/danger = functional status colours (never decorative)
export default <Partial<Config>>{
  content: [
    './app/components/**/*.{vue,js,ts}',
    './app/layouts/**/*.vue',
    './app/pages/**/*.vue',
    './app/app.vue',
    './app/error.vue'
  ],
  theme: {
    extend: {
      colors: {
        ink: { DEFAULT: '#0A0A0A', soft: '#262626', muted: '#6B6B66', faint: '#A3A39E' },
        canvas: '#F5F5F2',
        surface: '#FFFFFF',
        sunken: '#EDEDE9',
        line: { DEFAULT: '#E1E1DB', strong: '#0A0A0A' },
        volt: { DEFAULT: '#C8FF2E', dim: '#A6D91E' },
        ok: '#15803D',
        warn: '#B45309',
        danger: '#DC2626'
      },
      fontFamily: {
        display: ['Archivo', '"Arial Black"', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'ui-monospace', 'monospace']
      },
      borderRadius: {
        sm: '6px',
        DEFAULT: '10px',
        md: '12px',
        lg: '16px',
        xl: '22px',
        '2xl': '28px'
      },
      letterSpacing: { tightest: '-0.035em' },
      boxShadow: {
        card: '0 1px 2px rgba(10,10,10,.05), 0 8px 24px -12px rgba(10,10,10,.12)',
        lift: '0 2px 4px rgba(10,10,10,.06), 0 24px 48px -16px rgba(10,10,10,.28)',
        pop: '0 30px 80px -20px rgba(10,10,10,.55)'
      },
      keyframes: {
        'fade-up': { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
        'pop-in': { '0%': { opacity: '0', transform: 'translateY(24px) scale(.96)' }, '100%': { opacity: '1', transform: 'translateY(0) scale(1)' } },
        'fade-in': { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        marquee: { '0%': { transform: 'translateX(0)' }, '100%': { transform: 'translateX(-50%)' } }
      },
      animation: {
        'fade-up': 'fade-up .7s cubic-bezier(.2,.7,.2,1) both',
        'pop-in': 'pop-in .45s cubic-bezier(.2,.8,.2,1) both',
        'fade-in': 'fade-in .3s ease both',
        marquee: 'marquee 28s linear infinite'
      }
    }
  }
}
