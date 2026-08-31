import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  worker: {
    format: 'es',
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    headers: {
      'Cross-Origin-Opener-Policy': 'same-origin',
      'Cross-Origin-Embedder-Policy': 'require-corp',
    },
    fs: {
      strict: false,
      allow: [
        searchForWorkspaceRoot(process.cwd()),
        '..',
      ],
    },
  },
  optimizeDeps: {
    exclude: ['three'],
  },
});
