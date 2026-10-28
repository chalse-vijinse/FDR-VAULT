/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // Fintech Brand Palette
        brand: {
          primary: '#12345A',    // Deep Navy Blue
          secondary: '#2563EB',  // Royal Blue
          accent: '#14B8A6',     // Teal
          surface: '#F8FAFC',    // Soft Off-White
          card: '#FFFFFF',       // Card White
          text: '#1E293B',       // Slate Body Text
        },
        navy: {
          50: '#f0f5fa',
          100: '#dfecf5',
          200: '#c5dcee',
          300: '#9ec4e2',
          400: '#70a5d2',
          500: '#4c86be',
          600: '#386da6',
          700: '#2c5685',
          800: '#1d3e64',
          900: '#12345A', // User Specified Primary Deep Navy
          950: '#0b2038',
        },
        royal: {
          50: '#eff6ff',
          100: '#dbeafe',
          200: '#bfdbfe',
          300: '#93c5fd',
          400: '#60a5fa',
          500: '#3b82f6',
          600: '#2563EB', // User Specified Secondary Royal Blue
          700: '#1d4ed8',
          800: '#1e40af',
          900: '#1e3a8a',
        },
        tealAccent: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          300: '#5eead4',
          400: '#2dd4bf',
          500: '#14B8A6', // User Specified Accent Teal
          600: '#0d9488',
          700: '#0f766e',
          800: '#115e59',
          900: '#134e4a',
        },
        status: {
          approved: '#10B981', // Green for approved
          pending: '#F59E0B',  // Amber for pending
          rejected: '#EF4444', // Red for rejected
          review: '#2563EB',   // Blue for under verification
        },
        slateSurface: '#F8FAFC',
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(18, 52, 90, 0.06), 0 1px 2px -1px rgba(18, 52, 90, 0.04)',
        'card-hover': '0 6px 16px -2px rgba(18, 52, 90, 0.08), 0 2px 6px -2px rgba(18, 52, 90, 0.04)',
        'modal': '0 20px 25px -5px rgba(18, 52, 90, 0.2), 0 8px 10px -6px rgba(18, 52, 90, 0.1)',
        'glow-teal': '0 0 15px -2px rgba(20, 184, 166, 0.35)',
        'glow-royal': '0 0 15px -2px rgba(37, 99, 235, 0.35)',
      }
    },
  },
  plugins: [],
}
