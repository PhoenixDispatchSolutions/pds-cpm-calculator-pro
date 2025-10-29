/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  theme: {
    extend: {
      backgroundSize: {
        '200%': '200% 200%',
      },
    },
  },
  plugins: [],
};


