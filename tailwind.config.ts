import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{astro,html,js,jsx,ts,tsx}'],
  theme: {
    extend: {
      colors: {
        obsidian: {
          DEFAULT: '#0B0B0B',
          900: '#0B0B0B',
          800: '#141414',
          700: '#1C1C1C',
          600: '#262626',
        },
        gold: {
          DEFAULT: '#C5A059',
          bright: '#D4AF37',
          muted: '#8E7340',
        },
        ivory: {
          DEFAULT: '#F5F2EB',
          dim: '#CFCAC0',
        },
      },
      fontFamily: {
        serif: ['"Cormorant Garamond"', 'serif'],
        sans: ['"Plus Jakarta Sans"', 'system-ui', 'sans-serif'],
      },
      letterSpacing: {
        editorial: '0.3em',
      },
      backgroundImage: {
        'gold-sheen':
          'linear-gradient(135deg,#8E7340 0%,#D4AF37 45%,#C5A059 60%,#8E7340 100%)',
        aurora:
          'radial-gradient(ellipse at 50% 10%,rgba(197,160,89,.12),transparent 46%),radial-gradient(ellipse at 80% 60%,rgba(142,115,64,.08),transparent 42%)',
      },
      boxShadow: {
        'gold-glow': '0 0 40px -10px rgba(212,175,55,0.35)',
      },
      maxWidth: {
        editorial: '88rem',
      },
    },
  },
  plugins: [],
};

export default config;
