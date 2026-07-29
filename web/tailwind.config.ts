import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class", "class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: 'hsl(var(--primary))',
          foreground: 'hsl(var(--primary-foreground))'
        },
        secondary: {
          DEFAULT: 'hsl(var(--secondary))',
          foreground: 'hsl(var(--secondary-foreground))'
        },
        background: 'hsl(var(--background))',
        foreground: 'hsl(var(--foreground))',
        card: {
          DEFAULT: 'hsl(var(--card))',
          foreground: 'hsl(var(--card-foreground))'
        },
        popover: {
          DEFAULT: 'hsl(var(--popover))',
          foreground: 'hsl(var(--popover-foreground))'
        },
        muted: {
          DEFAULT: 'hsl(var(--muted))',
          foreground: 'hsl(var(--muted-foreground))'
        },
        accent: {
          DEFAULT: 'hsl(var(--accent))',
          foreground: 'hsl(var(--accent-foreground))'
        },
        destructive: {
          DEFAULT: 'hsl(var(--destructive))',
          foreground: 'hsl(var(--destructive-foreground))'
        },
        border: 'hsl(var(--border))',
        input: 'hsl(var(--input))',
        ring: 'hsl(var(--ring))',
        chart: {
          '1': 'hsl(var(--chart-1))',
          '2': 'hsl(var(--chart-2))',
          '3': 'hsl(var(--chart-3))',
          '4': 'hsl(var(--chart-4))',
          '5': 'hsl(var(--chart-5))'
        },
        cream: 'hsl(var(--cream))',
        crust: 'hsl(var(--crust))',
        success: {
          DEFAULT: 'hsl(var(--success))',
          foreground: '0 0% 100%'
        },
        warning: {
          DEFAULT: 'hsl(var(--warning))',
          foreground: '0 0% 100%'
        },
        category: {
          pan: 'hsl(var(--cat-pan))',
          pasteles: 'hsl(var(--cat-pasteles))',
          galletas: 'hsl(var(--cat-galletas))',
          dulces: 'hsl(var(--cat-dulces))',
          bebidas: 'hsl(var(--cat-bebidas))',
        }
      },
      borderRadius: {
        lg: 'var(--radius)',
        md: 'calc(var(--radius) - 2px)',
        sm: 'calc(var(--radius) - 4px)'
      },
      fontFamily: {
        sans: [
          'var(--font-inter)',
          'system-ui',
          'sans-serif'
        ],
        display: [
          'var(--font-display)',
          'var(--font-inter)',
          'serif'
        ]
      },
      boxShadow: {
        'card': '0 2px 8px -2px hsl(20 14% 10% / 0.08), 0 1px 3px -1px hsl(20 14% 10% / 0.06)',
        'card-hover': '0 12px 24px -6px hsl(20 14% 10% / 0.12), 0 4px 8px -2px hsl(20 14% 10% / 0.08)',
        'warm': '0 4px 16px -4px hsl(32 85% 48% / 0.15)',
      },
      backgroundImage: {
        'bakery-gradient': 'linear-gradient(135deg, hsl(40 45% 96%) 0%, hsl(38 60% 88%) 100%)',
        'warm-radial': 'radial-gradient(ellipse at top, hsl(38 60% 92%) 0%, hsl(40 38% 98%) 60%)',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
