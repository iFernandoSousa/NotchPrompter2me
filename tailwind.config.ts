import type { Config } from 'tailwindcss';

export default {
  content: ['./src/renderer/**/*.{tsx,ts,html}'],
  theme: {
    extend: {
      fontFamily: {
        display: ['"SF Pro Display"', '-apple-system', 'system-ui', 'sans-serif'],
        mono: ['"SF Mono"', 'ui-monospace', 'monospace'],
      },
      keyframes: {
        'pulse-ring': {
          '0%': { transform: 'scale(1)', opacity: '0.7' },
          '100%': { transform: 'scale(2.5)', opacity: '0' },
        },
        'fade-in': {
          '0%': { opacity: '0', transform: 'translateY(4px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'pulse-ring': 'pulse-ring 1.5s ease-out infinite',
        'fade-in': 'fade-in 0.2s ease-out',
      },
    },
  },
  plugins: [],
} satisfies Config;
