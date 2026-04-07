/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          primary: "#2563EB",
          softFrom: "#3B82F6",
          softTo: "#60A5FA",
          bg: "#F8FAFC",
          card: "#FFFFFF",
          border: "#E5E7EB",
          success: "#22C55E",
          warning: "#FACC15",
          danger: "#EF4444",
          text: "#1F2937",
          muted: "#6B7280",
        },
      },
      fontFamily: {
        sans: ["Manrope", "ui-sans-serif", "sans-serif"],
        heading: ["Sora", "ui-sans-serif", "sans-serif"],
      },
      boxShadow: {
        soft: "0 8px 30px rgba(37, 99, 235, 0.12)",
      },
    },
  },
  plugins: [],
}
