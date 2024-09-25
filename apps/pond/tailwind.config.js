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
          "0%": { opacity: "0", transform: "translateY(10px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        growAndFade: {
          "0%": { transform: "scale(0)", opacity: "0.25" },
          "100%": { transform: "scale(1)", opacity: "0" },
        },
        "color-change": {
          "0%, 100%": { color: "#ff9900" },
          "50%": { color: "#afffbc" },
        },
        pulse: {
          "0%, 100%": { opacity: 1 },
          "50%": { opacity: 0.5 },
        },
        bounce: {
          "0%, 100%": {
            transform: "translateY(-25%)",
            animationTimingFunction: "cubic-bezier(0.8, 0, 1, 1)",
          },
          "50%": {
            transform: "translateY(0)",
            animationTimingFunction: "cubic-bezier(0, 0, 0.2, 1)",
          },
        },
        leap: {
          "0%, 100%": { transform: "translateY(0)" },
          "50%": { transform: "translateY(-20px)" },
        },
        blurIn: {
          "0%": { filter: "blur(10px)", opacity: "0" },
          "100%": { filter: "blur(0)", opacity: "1" },
        },
      },
      animation: {
        fadeIn: "fadeIn 0.5s ease-in forwards",
        growAndFade: "growAndFade 3s infinite ease-out",
        "color-change": "color-change 1s infinite",
        pulse: "pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        bounce: "bounce 1s infinite",
        leap: "leap 1s ease-in-out",
        "blur-in": "blurIn 3s ease-in-out",
      },
    },
  },
  plugins: [],
};
