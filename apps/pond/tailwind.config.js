/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      fontSize: {
        "frog-score": ["1.25rem", "1.25rem"],
      },
      fontFamily: {
        superfunky: ["SuperFunky", "sans-serif"],
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        growAndFade: {
          "0%": { transform: "scale(0)", opacity: "0.25" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        "color-change": {
          "0%, 100%": { color: "#ff9900" },
          "50%": { color: "#afffbc" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in forwards",
        growAndFade: "growAndFade 3s infinite ease-out",
        "color-change": "color-change 1s infinite",
      },
    },
  },
  plugins: [],
};
