import type { Config } from 'tailwindcss';

const config: Config = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      colors: {
        cardinal: {
          50:  '#fdf2f2',
          100: '#fce4e4',
          200: '#f9cccc',
          300: '#f3a5a5',
          400: '#e97070',
          500: '#d94040',
          600: '#c22222',
          700: '#8c1515',
          800: '#731111',
          900: '#5c0f0f',
          950: '#3a0909',
        },
      },
      fontFamily: {
        sans: ['var(--font-sans)', 'system-ui', 'sans-serif'],
      },
    },
  },
  plugins: [],
};

export default config;
