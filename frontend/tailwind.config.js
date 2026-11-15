/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        // ── ALTAIR Design System ─────────────────────────────────────────
        // Background layers
        "void":    "#080C14",   // Deepest background
        "surface": "#0B0F19",   // Primary dark surface
        "panel":   "#111827",   // Panel / card background
        "elevated":"#1A2235",   // Elevated element (inputs, dropdowns)
        "border":  "#1E2D40",   // Subtle border
        "muted":   "#2A3F5A",   // Muted border / separator

        // Text
        "text-primary":  "#F0F4F8",   // Crisp white
        "text-secondary":"#8A9BB8",   // Muted secondary
        "text-dim":      "#4A5E7A",   // Dim / placeholder

        // Functional accent palette
        "cyan": {
          DEFAULT: "#29B6F6",
          dim:     "#1A7FA8",
          glow:    "#29B6F614",
        },
        "amber": {
          DEFAULT: "#F59E0B",
          dim:     "#92600A",
          glow:    "#F59E0B14",
        },
        "crimson": {
          DEFAULT: "#EF4444",
          dim:     "#8B1A1A",
          glow:    "#EF444414",
        },
        "green-ok": {
          DEFAULT: "#22C55E",
          dim:     "#15532E",
        },
      },
      fontFamily: {
        sans:  ["Inter", "system-ui", "sans-serif"],
        mono:  ["JetBrains Mono", "Fira Code", "monospace"],
      },
      fontSize: {
        "2xs": "0.65rem",
        "xs":  "0.75rem",
      },
      backgroundImage: {
        "grid-pattern": "linear-gradient(rgba(29,43,61,0.5) 1px, transparent 1px), linear-gradient(90deg, rgba(29,43,61,0.5) 1px, transparent 1px)",
      },
      backgroundSize: {
        "grid": "40px 40px",
      },
      boxShadow: {
        "panel": "0 0 0 1px rgba(30,45,64,0.8), 0 4px 24px rgba(0,0,0,0.5)",
        "cyan-glow": "0 0 12px rgba(41,182,246,0.2)",
        "crimson-glow": "0 0 12px rgba(239,68,68,0.2)",
      },
      animation: {
        "pulse-slow": "pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite",
        "fade-in": "fadeIn 0.4s ease-out",
        "slide-up": "slideUp 0.3s ease-out",
      },
      keyframes: {
        fadeIn: {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        slideUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
      },
    },
  },
  plugins: [],
}
