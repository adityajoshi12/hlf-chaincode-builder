/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: 'class', // Enable dark mode using class strategy
  theme: {
    extend: {
      colors: {
        // Light mode colors
        'light-bg': '#f3f4f6',
        'light-card': '#ffffff',
        'light-text': '#1f2937',
        'light-border': '#e5e7eb',
        
        // Dark mode colors
        'dark-bg': '#111827',
        'dark-card': '#1f2937',
        'dark-text': '#f3f4f6',
        'dark-border': '#374151',
      },
      animation: {
        'fadeIn': 'fadeIn 0.3s ease-in-out',
        'fadeOut': 'fadeOut 0.3s ease-in-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: 0 },
          '100%': { opacity: 1 },
        },
        fadeOut: {
          '0%': { opacity: 1 },
          '100%': { opacity: 0 },
        },
      }
    },
  },
  plugins: [],
}

