/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        primary: "#06b6d4",
        accent: "#8b5cf6",
        danger: "#ef4444",
        success: "#22c55e",
        panel: "#111827",
        card: "#1e293b"
      }
    }
  },
  plugins: [],
};
