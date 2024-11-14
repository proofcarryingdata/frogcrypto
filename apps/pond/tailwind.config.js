/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    fontFamily: {
      mono: ["IBM Plex Mono", "ui-monospace", "monospace"],
    },
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
          mythic: "black",
        },
      },
      boxShadow: {
        frog: "0px 0px 12px 2px rgb(0 0 0 / 0.05)",
      },
      fontSize: {
        "frog-score": ["1rem", "1rem"],
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
        "rotate-gradient": {
          to: {
            "--gradient-angle": "360deg",
          },
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
        "rotate-gradient": "rotate-gradient 30s linear infinite",
      },
    },
  },
  plugins: [
    function ({ addBase, addUtilities }) {
      addBase({
        "@property --gradient-angle": {
          syntax: '"<angle>"',
          inherits: "false",
          initialValue: "0deg",
        },
      });

      const newUtilities = {
        ".bg-dot-pattern": {
          background:
            "linear-gradient( 90deg, #ececec calc(22px - 3px), transparent 1% ) center / 22px 22px, linear-gradient( #ececec calc(22px - 3px), transparent 1% ) center / 22px 22px, #e4e4e4",
        },
        ".bg-lab": {
          background:
            "radial-gradient(50% 172.05% at 50% 50%, #FE2A53 0%, #D88E3C 32.5%, #98BF1A 59%, #A290A0 79.5%, #A143FF 100%)",
        },
        ".gradient-border": {
          "--border-width": "-4px",
          margin: "1px",
          position: "relative",
          zIndex: "0",
          "&::after": {
            content: '""',
            position: "absolute",
            background: `
            linear-gradient(var(--gradient-angle, 45deg), #FFFFFF00 10%, #D1FFD3 20%, #ff552000 70.71%),
            linear-gradient(calc(var(--gradient-angle, 45deg) + 90deg),#FFFFFF00 10%, #EAF 20%, #750cf200 70.71%),
            linear-gradient(calc(var(--gradient-angle, 45deg) + 180deg),#FFFFFF00 10%, #5BFFFF 20%, #0cbcf200 70.71%),
            linear-gradient(calc(var(--gradient-angle, 45deg) + 270deg),#FFFFFF00 10%, #0cbcf2 20%, #ffd80000 70.71%)`,
            animation: "rotate-gradient 30s infinite linear",
            top: "var(--border-width)",
            left: "var(--border-width)",
            right: "var(--border-width)",
            bottom: "var(--border-width)",
            borderRadius: "0.5rem",
            zIndex: "-1",
            boxShadow: "inset 0 0 10px 1px rgba(0, 0, 0, 0.2)",
          },
        },
      };
      addUtilities(newUtilities, ["responsive", "hover"]);
    },
  ],
};
