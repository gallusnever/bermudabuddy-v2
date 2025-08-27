import type { Config } from 'tailwindcss';

export default {
  darkMode: 'class',
  content: [
    './app/**/*.{ts,tsx,js,jsx}',
    './components/**/*.{ts,tsx,js,jsx}',
    '../../packages/ui/src/**/*.{ts,tsx,js,jsx}',
  ],
  theme: {
    extend: {
      fontFamily: {
        mono: ['var(--font-jetbrains)', 'ui-monospace', 'SFMono-Regular', 'Menlo', 'monospace'],
      },
      colors: {
        bg: 'rgb(var(--bb-bg))',
        surface: 'rgb(var(--bb-surface))',
        surface2: 'rgb(var(--bb-surface-2))',
        border: 'rgb(var(--bb-border))',
        accent: 'rgb(var(--bb-accent))',
        text: 'rgb(var(--bb-text))',
        muted: 'rgb(var(--bb-text-muted))',
      },
      borderRadius: {
        sm: 'var(--bb-radius-sm)',
        md: 'var(--bb-radius-md)',
        lg: 'var(--bb-radius-lg)',
      },
      boxShadow: {
        soft: 'var(--bb-shadow)',
      },
    },
  },
  plugins: [],
} satisfies Config;
