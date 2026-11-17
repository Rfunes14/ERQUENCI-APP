/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        erquenci: {
          green: "#34B37B",
          blue: "#1E588D",
          dark: "#1B4D7E",
        },
      },
    },
  },
  plugins: [],
};
