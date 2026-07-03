import type { Config } from 'tailwindcss'

const config: Config = {
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
        // Signature "encre" (ink) palette — a deep, refined prussian-indigo.
        // We remap Tailwind's `blue` so every existing `blue-*` class across
        // the app instantly adopts the elegant new primary, cohesively.
        blue: {
          50: '#f1f4fb',
          100: '#e2e8f5',
          200: '#c6d3ec',
          300: '#9db2dd',
          400: '#6b88c9',
          500: '#4867b0',
          600: '#374f8f', // primary
          700: '#2d4076',
          800: '#283762',
          900: '#243052',
          950: '#171f38',
        },
        // Warm signature accent — used sparingly for highlights (rank #1, etc.)
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
