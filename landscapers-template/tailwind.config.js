/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx,mdx}',
    './components/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        'slate': {
          '50': '#f9fafb',
          '100': '#f3f4f6',
          '200': '#e5e7eb',
          '300': '#d1d5db',
          '400': '#9ca3af',
          '500': '#6b7280',
          '600': '#4b5563',
          '700': '#374151',
          '800': '#1f2937',
          '900': '#111827',
          '950': '#030712',
        },
        // These reference CSS custom properties injected by layout.tsx from config/business.ts
        // Swap business.ts colors → entire site re-skins with zero other changes.
        'accent':         'var(--color-accent)',
        'accent-dark':    'var(--color-accent-dark)',
        'accent-light':   'var(--color-accent-light)',
        'accent-border':  'var(--color-accent-border)',
        'accent-footer':  'var(--color-accent-footer)',
        'accent-footer-border': 'var(--color-accent-footer-border)',
        'accent-footer-text':   'var(--color-accent-footer-text)',
        'accent-footer-heading':'var(--color-accent-footer-heading)',
      },
      fontFamily: {
        'display': ['Georgia', 'serif'],
        'mono': ['Menlo', 'monospace'],
      },
      spacing: {
        '4.5': '1.125rem',
      },
      typography: {
        DEFAULT: {
          css: {
            maxWidth: 'none',
          },
        },
      },
    },
  },
  plugins: [],
}
