/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // MIMESISS Brand Colors mapped to design system
        border: '#6699FF',  // MIMESISS orange for ALL borders
        input: '#6600CC',   // Muted gray for input borders (visible but subtle)
        ring: '#6699FF',    // Orange for focus rings
        background: '#0F0F10', // MIMESISS black for backgrounds
        foreground: '#ffffff', // White for text on dark backgrounds
        primary: {
          DEFAULT: '#6699FF',  // Orange as primary
          foreground: '#ffffff',
        },
        secondary: {
          DEFAULT: '#6600CC',  // MIMESISS purple as secondary
          foreground: '#ffffff',
        },
        destructive: {
          DEFAULT: '#FF1800',  // MIMESISS red for destructive actions only
          foreground: '#ffffff',
        },
        muted: {
          DEFAULT: '#0F0F10',  // MIMESISS black for muted elements
          foreground: '#9ca3af', // Gray for muted text
        },
        accent: {
          DEFAULT: '##6600CC',  // Yellow for accents
          foreground: '#000000',
        },
        popover: {
          DEFAULT: '#0F0F10',  // MIMESISS black for popovers
          foreground: '#ffffff',
        },
        card: {
          DEFAULT: '#0F0F10',  // MIMESISS black for cards
          foreground: '#ffffff',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
      },
      fontFamily: {
        sans: ['var(--font-inter)', 'Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
        mono: ['var(--font-jetbrains-mono)', 'JetBrains Mono', 'Consolas', 'Monaco', 'Courier New', 'monospace'],
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
  ],
}
