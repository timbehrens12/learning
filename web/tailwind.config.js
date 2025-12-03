/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505', 
        surface: '#0F0F0F', 
        primary: '#6366f1', // Indigo-500 - cleaner purple/blue
        secondary: '#0ea5e9', 
        accent: '#f43f5e',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-highlight': 'rgba(255, 255, 255, 0.1)',
      },
      fontFamily: {
        sans: ['"Plus Jakarta Sans"', 'Inter', 'system-ui', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      backgroundImage: {
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow': 'conic-gradient(from 180deg at 50% 50%, #2a2a2a 0deg, #1a1a1a 50%, #2a2a2a 100%)',
      },
      animation: {
        'pulse-slow': 'pulse 4s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
        'glow': 'glow 2s ease-in-out infinite alternate',
      },
      keyframes: {
        float: {
          '0%, 100%': { transform: 'translateY(0)' },
          '50%': { transform: 'translateY(-10px)' },
        },
        glow: {
          'from': { boxShadow: '0 0 10px -10px rgba(99, 102, 241, 0)' },
          'to': { boxShadow: '0 0 20px 5px rgba(99, 102, 241, 0.3)' },
        }
      }
    },
  },
  plugins: [],
}
