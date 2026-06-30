/** @type {import('tailwindcss').Config} */
export default {
  darkMode: ["class"],
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    container: {
      center: true,
      padding: "1.5rem",
      screens: { "2xl": "1280px" },
    },
    extend: {
      colors: {
        // Charcoal/black + antique-gold palette via CSS variables (light + dark),
        // following doctorgavrielov.co.il. Token values live in src/index.css.
        gold: "hsl(var(--gold))",
        goldink: "hsl(var(--gold-ink))",
        ink: "hsl(var(--ink))",
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
      },
      borderRadius: {
        // Crisper, more classic corners — less "pill-shaped SaaS".
        lg: "0.5rem",
        md: "0.375rem",
        sm: "0.25rem",
      },
      fontFamily: {
        // doctorgavrielov.co.il uses a clean Hebrew-first sans (Arial). Heebo
        // carries Hebrew + Latin gracefully and matches that utilitarian feel;
        // emphasis comes from weight + gold, not from a serif.
        sans: ["Heebo", "Assistant", "Arial", "system-ui", "Segoe UI", "sans-serif"],
        // Serif only for the gold banner title (the signature look of the
        // original site). Frank Ruhl Libre carries Hebrew + Latin.
        display: ["'Frank Ruhl Libre'", "Georgia", "'Times New Roman'", "serif"],
      },
      keyframes: {
        "fade-in": {
          from: { opacity: "0", transform: "translateY(6px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        shimmer: {
          "100%": { transform: "translateX(100%)" },
        },
      },
      animation: {
        "fade-in": "fade-in 0.4s ease-out both",
      },
    },
  },
  plugins: [],
};
