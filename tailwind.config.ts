import type { Config } from 'tailwindcss';
import defaultTheme from 'tailwindcss/defaultTheme';

const config: Config = {
  darkMode: 'class',
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        base: {
          975: '#020209',
          950: '#05060d',
          900: '#080a16',
          850: '#0b0f1f',
          800: '#0f1224',
          750: '#151833',
          700: '#1f2142',
        },
        accent: {
          cyan: '#5de4ff',
          purple: '#c084fc',
          pink: '#ff94d9',
          amber: '#f6c76c',
          lime: '#9ef0bf',
        },
        surface: {
          DEFAULT: 'rgba(12, 14, 24, 0.85)',
          muted: 'rgba(16, 18, 28, 0.85)',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', ...defaultTheme.fontFamily.sans],
        display: ['var(--font-display)', ...defaultTheme.fontFamily.sans],
      },
      backgroundImage: {
        'orb-primary': 'radial-gradient(circle at 20% -20%, rgba(93, 228, 255, 0.35), transparent 55%)',
        'orb-secondary': 'radial-gradient(circle at 80% 0%, rgba(192, 132, 252, 0.35), transparent 45%)',
        'grid-faint':
          'linear-gradient(transparent 24px, rgba(255,255,255,0.03) 25px), linear-gradient(90deg, transparent 24px, rgba(255,255,255,0.03) 25px)',
      },
      backgroundSize: {
        'grid-faint': '25px 25px',
      },
      boxShadow: {
        glow: '0 20px 70px rgba(93, 228, 255, 0.15)',
        'inner-card': 'inset 0 1px 0 rgba(255, 255, 255, 0.04)',
      },
      keyframes: {
        'pulse-soft': {
          '0%, 100%': { opacity: 0.35 },
          '50%': { opacity: 0.8 },
        },
        'float-slow': {
          '0%, 100%': { transform: 'translate3d(0, -12px, 0)' },
          '50%': { transform: 'translate3d(0, 8px, 0)' },
        },
      },
      animation: {
        'pulse-soft': 'pulse-soft 8s ease-in-out infinite',
        'float-slow': 'float-slow 14s ease-in-out infinite',
      },
    },
  },
  plugins: [],
};

export default config;
