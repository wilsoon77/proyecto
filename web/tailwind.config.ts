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
          'var(--font-sans)',
          'system-ui',
          '-apple-system',
          'sans-serif'
        ],
        display: [
          'var(--font-display)',
          'Georgia',
          'serif'
        ],
        serif: [
          'var(--font-display)',
          'Georgia',
          'serif'
        ]
      },
      boxShadow: {
        'card': '0 2px 8px -2px hsl(20 14% 10% / 0.06), 0 1px 3px -1px hsl(20 14% 10% / 0.04)',
        'card-hover': '0 14px 28px -6px hsl(20 14% 10% / 0.10), 0 6px 12px -2px hsl(20 14% 10% / 0.06)',
        'warm': '0 4px 16px -4px hsl(32 85% 48% / 0.20)',
        'warm-lg': '0 10px 30px -5px hsl(32 85% 48% / 0.25)',
      },
      backgroundImage: {
        'bakery-gradient': 'linear-gradient(135deg, hsl(40 45% 98%) 0%, hsl(38 50% 92%) 100%)',
        'warm-radial': 'radial-gradient(ellipse at top, hsl(38 60% 94%) 0%, hsl(40 38% 98%) 70%)',
      },
      keyframes: {
        'marquee-scroll': {
          '0%': { transform: 'translateX(0%)' },
          '100%': { transform: 'translateX(-100%)' },
        },
        'marquee-scroll-reverse': {
          '0%': { transform: 'translateX(-100%)' },
          '100%': { transform: 'translateX(0%)' },
        },
      },
      animation: {
        'marquee-scroll': 'marquee-scroll 32s linear infinite',
        'marquee-scroll-reverse': 'marquee-scroll-reverse 32s linear infinite',
      },
    }
  },
  plugins: [require("tailwindcss-animate")],
};

export default config;
