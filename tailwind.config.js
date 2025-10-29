/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      keyframes: {
        phoenixPulse: {
          '0%':   { backgroundPosition: '0% 50%', filter: 'brightness(1)' },
          '50%':  { backgroundPosition: '100% 50%', filter: 'brightness(1.2)' },
          '100%': { backgroundPosition: '0% 50%', filter: 'brightness(1)' },
        },
      },
      animation: {
        phoenixPulse: 'phoenixPulse 8s ease-in-out infinite',
      },
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
};

