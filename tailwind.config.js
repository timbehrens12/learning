/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./src/renderer/index.html",
    "./src/renderer/src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        background: '#050505', 
        surface: '#0F0F0F', 
        primary: '#6366f1',
        secondary: '#0ea5e9', 
        accent: '#f43f5e',
        'glass-border': 'rgba(255, 255, 255, 0.08)',
        'glass-bg': 'rgba(255, 255, 255, 0.03)',
        'glass-highlight': 'rgba(255, 255, 255, 0.1)',
      },
    },
  },
  plugins: [],
}

