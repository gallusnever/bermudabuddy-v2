import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    include: ['__tests__/**/*.test.{ts,tsx}', 'tests/**/*.test.{ts,tsx}'],
    globals: true,
    setupFiles: ['./vitest.setup.ts'],
  },
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './'),
      '@bermuda/ui': path.resolve(__dirname, '../../packages/ui/src'),
      '@bermuda/ui/lib/cn': path.resolve(__dirname, '../../packages/ui/src/lib/cn'),
    },
  },
});

