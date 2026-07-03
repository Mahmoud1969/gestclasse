import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: 'class',
  content: [
    './pages/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
    './app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['var(--font-dm-sans)', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'monospace'],
        display: ['var(--font-display)', 'Georgia', 'serif'],
      },
      colors: {
        // Signature "améthyste" palette — a deep, refined violet. We remap
        // Tailwind's `blue` so every existing `blue-*` class adopts it cohesively.
        blue: {
          50: '#f5f2fb',
          100: '#ebe4f7',
          200: '#d9ccf0',
          300: '#bda6e3',
          400: '#9d78d1',
          500: '#8354bf',
          600: '#6d4aa8', // primary
          700: '#5a3d8a',
          800: '#4b3570',
          900: '#3f2e5c',
          950: '#281d3d',
        },
        // Warm signature accent
        gold: {
          50: '#fbf7ef',
          100: '#f5ebd6',
          200: '#ead4ac',
          300: '#dcb676',
          400: '#d09b4d',
          500: '#c2853a',
          600: '#a66a2f',
          700: '#855029',
          800: '#6f4227',
          900: '#5e3823',
        },
        // Semantic surface/text/border tokens — flip between light & dark via
        // CSS variables (see globals.css). Enables a full dark theme without
        // per-component dark: variants.
        surface: 'rgb(var(--c-surface) / <alpha-value>)',
        surface2: 'rgb(var(--c-surface2) / <alpha-value>)',
        canvas: 'rgb(var(--c-canvas) / <alpha-value>)',
        ink: 'rgb(var(--c-ink) / <alpha-value>)',
        muted: 'rgb(var(--c-muted) / <alpha-value>)',
        faint: 'rgb(var(--c-faint) / <alpha-value>)',
        line: 'rgb(var(--c-line) / <alpha-value>)',
        'line-strong': 'rgb(var(--c-line-strong) / <alpha-value>)',
      },
      boxShadow: {
        card: '0 1px 2px rgba(16, 24, 40, 0.04), 0 1px 3px rgba(16, 24, 40, 0.06)',
        'card-hover': '0 4px 12px rgba(16, 24, 40, 0.08), 0 2px 4px rgba(16, 24, 40, 0.04)',
        elevated: '0 10px 30px -10px rgba(16, 24, 40, 0.20), 0 4px 8px -4px rgba(16, 24, 40, 0.08)',
      },
    },
  },
  plugins: [],
}

export default config
