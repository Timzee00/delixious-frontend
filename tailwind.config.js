/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  theme: {
    extend: {
      colors: {
        ink: 'rgb(var(--color-ink) / <alpha-value>)',
        'ink-soft': 'rgb(var(--color-ink-soft) / <alpha-value>)',
        sand: 'rgb(var(--color-sand) / <alpha-value>)',
        paper: 'rgb(var(--color-paper) / <alpha-value>)',
        hairline: 'rgb(var(--color-hairline) / <alpha-value>)',
        pepper: { DEFAULT: 'rgb(var(--color-pepper) / <alpha-value>)', dark: 'rgb(var(--color-pepper-dark) / <alpha-value>)' },
        gold: 'rgb(var(--color-gold) / <alpha-value>)',
        jade: { DEFAULT: 'rgb(var(--color-jade) / <alpha-value>)', soft: 'rgb(var(--color-jade-soft) / <alpha-value>)' },
        danger: 'rgb(var(--color-danger) / <alpha-value>)',
      },
      fontFamily: {
        display: ['"Space Grotesk"', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"IBM Plex Mono"', 'monospace'],
      },
    },
  },
  plugins: [],
};
