module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
    "./app/**/*.{js,jsx,ts,tsx}",
    "./components/**/*.{js,jsx,ts,tsx}" // Add components path
  ],
  darkMode: 'class', // Enable class-based dark mode
  theme: {
    extend: {
      colors: {
        // Light mode colors
        primary: {
          DEFAULT: '#3182ce',
          dark: '#2c5282',
        },
        secondary: {
          DEFAULT: '#2d3748',
          dark: '#1a202c',
        },
        tertiary: '#1a202c',
        border: {
          DEFAULT: '#e2e8f0',
          dark: '#4a5568',
        },
        background: {
          DEFAULT: '#f7fafc',
          dark: '#1a202c',
        },
        foreground: {
          DEFAULT: '#1a202c',
          dark: '#f7fafc',
        },
        card: {
          DEFAULT: '#ffffff',
          dark: '#2d3748',
        },
        muted: {
          DEFAULT: '#f7fafc',
          dark: '#4a5568',
        },
        accent: {
          DEFAULT: '#edf2f7',
          dark: '#2d3748',
        },
      },
      spacing: {
        '64': '16rem', // Custom spacing for sidebar width
        '18': '4.5rem', // Header height
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
      }
    },
  },
  plugins: [],
};