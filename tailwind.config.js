/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./app/**/*.{js,jsx,ts,tsx}", "./components/**/*.{js,jsx,ts,tsx}", "./src/**/*.{js,jsx,ts,tsx}"],
  presets: [require("nativewind/preset")],
  theme: {
    extend: {
      colors: {
        background: "#0a0e1a",
        gold: "#c8aa6e",
        border: "#1e2740",
        muted: "#5c6478",
        card: "#0f1320",
      },
    },
  },
  plugins: [],
};
