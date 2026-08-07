/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        bg0: '#08152B',
        bg1: '#0C1F3D',
        bg2: '#122A4F',
        card: '#152F5A',
        cardBorder: 'rgba(255,255,255,0.08)',
        accent: '#3FE0D0',
        blue: '#5B8DEF',
        danger: '#FF6B6B',
        dangerDim: '#3A1E24',
        success: '#37D6A0',
        successDim: '#12332B',
        warning: '#FFB84D',
        text: '#F2F6FB',
        textMuted: '#8FA3C2',
        textFaint: '#5C7093',
      },
      fontFamily: {
        display: ['Sora', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
        mono: ['"JetBrains Mono"', 'monospace'],
      },
      borderRadius: {
        card: '16px',
      },
    },
  },
  plugins: [],
};
