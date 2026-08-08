import type { Config } from 'tailwindcss';
import tailwindcssAnimate from "tailwindcss-animate";

const config: Config = {
  darkMode: ['class'],
  content: [
    './src/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    container: { center: true, padding: '1rem', screens: { '2xl': '1400px' } },
    extend: {
      colors: {
        // Brand gaming palette (used as `gaming-purple`, `gaming-cyan`, etc. across the app)
        gaming: {
          purple: '#7C3AED',
          pink: '#EC4899',
          cyan: '#22D3EE',
          blue: '#3B82F6',
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        primary: { DEFAULT: 'hsl(var(--primary))', foreground: 'hsl(var(--primary-foreground))' },
        secondary: { DEFAULT: 'hsl(var(--secondary))', foreground: 'hsl(var(--secondary-foreground))' },
        destructive: { DEFAULT: 'hsl(var(--destructive))', foreground: 'hsl(var(--destructive-foreground))' },
        success: { DEFAULT: 'hsl(var(--success))', foreground: 'hsl(var(--success-foreground))' },
        warning: { DEFAULT: 'hsl(var(--warning))', foreground: 'hsl(var(--warning-foreground))' },
        muted: { DEFAULT: 'hsl(var(--muted))', foreground: 'hsl(var(--muted-foreground))' },
        accent: { DEFAULT: 'hsl(var(--accent))', foreground: 'hsl(var(--accent-foreground))' },
        popover: { DEFAULT: 'hsl(var(--popover))', foreground: 'hsl(var(--popover-foreground))' },
        card: { DEFAULT: 'hsl(var(--card))', foreground: 'hsl(var(--card-foreground))' },
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)',
        xl: 'calc(var(--radius) + 4px)',
        '2xl': 'calc(var(--radius) + 8px)',
      },
      fontFamily: {
        heading: ['Inter', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        body: ['Inter', 'var(--font-inter)', 'system-ui', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
      keyframes: {
        'accordion-down': { from: { height: '0' }, to: { height: 'var(--radix-accordion-content-height)' } },
        'accordion-up': { from: { height: 'var(--radix-accordion-content-height)' }, to: { height: '0' } },
        'glow-pulse': { '0%, 100%': { boxShadow: '0 0 10px hsl(var(--primary)/0.3)' }, '50%': { boxShadow: '0 0 20px hsl(var(--primary)/0.6)' } },
        'scale-in': { from: { transform: 'scale(0.95)', opacity: '0' }, to: { transform: 'scale(1)', opacity: '1' } },
        'slide-up': { from: { transform: 'translateY(10px)', opacity: '0' }, to: { transform: 'translateY(0)', opacity: '1' } },
        'fade-in': { from: { opacity: '0' }, to: { opacity: '1' } },
        'ping-slow': { '75%, 100%': { transform: 'scale(1.5)', opacity: '0' } },
      },
      animation: {
        'accordion-down': 'accordion-down 0.15s ease-out',
        'accordion-up': 'accordion-up 0.15s ease-out',
        'glow-pulse': 'glow-pulse 1.5s ease-in-out infinite',
        'scale-in': 'scale-in 0.12s ease-out',
        'slide-up': 'slide-up 0.15s ease-out',
        'fade-in': 'fade-in 0.12s ease-out',
        'ping-fast': 'ping-slow 1.5s cubic-bezier(0, 0, 0.2, 1) infinite',
      },
    },
  },
  plugins: [tailwindcssAnimate],
};
export default config;
