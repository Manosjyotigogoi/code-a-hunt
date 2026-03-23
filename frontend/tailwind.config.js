/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        pink: '#FFB6C1',
        'pink-deep': '#FF85A1',
        yellow: '#FFFF66',
        'yellow-muted': '#FFFACD',
        sky: '#87CEEB',
        'sky-deep': '#5BB8D4',
        black: '#0D0D0D',
        'black-soft': '#1A1A1A',
      },
      fontFamily: {
        display: ['Syne', 'sans-serif'],
        body: ['DM Sans', 'sans-serif'],
      },
      borderRadius: {
        sm: '8px',
        md: '16px',
        lg: '24px',
        xl: '32px',
      },
      boxShadow: {
        sm: '0 2px 8px rgba(0,0,0,0.08)',
        md: '0 4px 20px rgba(0,0,0,0.12)',
        lg: '0 8px 40px rgba(0,0,0,0.16)',
      },
      keyframes: {
        fadeUp: {
          from: { opacity: '0', transform: 'translateY(32px)' },
          to: { opacity: '1', transform: 'translateY(0)' },
        },
        fadeIn: {
          from: { opacity: '0' },
          to: { opacity: '1' },
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-16px) rotate(3deg)' },
        },
        floatAlt: {
          '0%, 100%': { transform: 'translateY(0px) rotate(0deg)' },
          '50%': { transform: 'translateY(-10px) rotate(-3deg)' },
        },
        marquee: {
          '0%': { transform: 'translateX(0)' },
          '100%': { transform: 'translateX(-50%)' },
        },
        'spin-slow': {
          from: { transform: 'rotate(0deg)' },
          to: { transform: 'rotate(360deg)' },
        },
      },
      animation: {
        fadeUp: 'fadeUp 0.4s ease both',
        fadeIn: 'fadeIn 0.4s ease both',
        float: 'float 8s ease-in-out infinite',
        floatAlt: 'floatAlt 7s ease-in-out infinite',
        marquee: 'marquee 18s linear infinite',
        'spin-slow': 'spin-slow 0.7s linear infinite',
      },
    },
  },
  plugins: [],
}
