import type { Config } from 'tailwindcss'

const config = {
  darkMode: ['class'],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: '',
  theme: {
    container: {
      center: true,
      padding: '2rem',
      screens: {
        '2xl': '1400px',
      },
    },
    extend: {
      colors: {
        // Ace Truckers Brand Colors
        atc: {
          primary: '#0E86C7',
          'primary-hover': '#0B74AC',
          'primary-active': '#095D8A',
          accent: '#2BC0E4',
          bg: '#FFFFFF',
          'bg-subtle': '#F6FAFD',
          'bg-alt': '#F0FAFF',
          text: '#0B1F2A',
          'text-strong': '#07131B',
          'text-muted': '#5B6B76',
          border: '#E6EEF4',
          success: '#14B86A',
          warning: '#F5A524',
          danger: '#E5484D',
          critical: '#B42318',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: {
          DEFAULT: '#0E86C7',
          foreground: '#FFFFFF',
        },
        secondary: {
          DEFAULT: '#FFFFFF',
          foreground: '#0B1F2A',
        },
        destructive: {
          DEFAULT: '#E5484D',
          foreground: '#FFFFFF',
        },
        muted: {
          DEFAULT: '#F6FAFD',
          foreground: '#5B6B76',
        },
        accent: {
          DEFAULT: '#2BC0E4',
          foreground: '#FFFFFF',
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))',
        },
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))',
        },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: '16px',
        sm: '12px',
      },
      fontFamily: {
        heading: ['Space Grotesk', 'Inter', 'system-ui', 'sans-serif'],
        body: ['Inter', 'system-ui', 'sans-serif'],
      },
      keyframes: {
        'accordion-down': {
          from: { height: '0' },
          to: { height: 'var(--radix-accordion-content-height)' },
        },
        'accordion-up': {
          from: { height: 'var(--radix-accordion-content-height)' },
          to: { height: '0' },
        },
      },
      animation: {
        'accordion-down': 'accordion-down 0.2s ease-out',
        'accordion-up': 'accordion-up 0.2s ease-out',
      },
    },
  },
  plugins: [require('tailwindcss-animate')],
} satisfies Config

export default config
