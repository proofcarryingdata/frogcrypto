/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        green: {
          50: "#E6F7ED",
          100: "#CCEFDB",
          200: "#99DFB7",
          300: "#66CF93",
          400: "#33BF6F",
          500: "#17A34A",
          600: "#12823B",
          700: "#0E622C",
          800: "#09411E",
          900: "#05210F",
        },
        moss: {
          50: "#E6F3EF",
          100: "#CCE7DF",
          200: "#99CFBF",
          300: "#66B79F",
          400: "#189C73",
          500: "#1B7C5E",
          600: "#235B48",
          700: "#1A4336",
          800: "#122C24",
          900: "#091512",
        },
        teal: {
          50: "#E6F3F3",
          100: "#CCE7E8",
          200: "#99CFD1",
          300: "#66B7BA",
          400: "#339FA3",
          500: "#2C9397",
          600: "#23767A",
          700: "#1A585C",
          800: "#123B3D",
          900: "#091D1F",
        },
        rarity: {
          common: "#2D9061",
          rare: "#4595B2",
          epic: "#683EAA",
          legendary: "#F19E38",
          mythic:
            "linear-gradient(261deg, #D1FFD3 2.82%, #EAF 39.21%, #5BFFFF 99.02%)",
        },
      },
      boxShadow: {
        frog: "0px 0px 12px 2px rgb(0 0 0 / 0.05)",
      },
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
