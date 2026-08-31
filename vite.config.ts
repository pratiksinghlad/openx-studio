import { defineConfig, searchForWorkspaceRoot } from 'vite';
import react from '@vitejs/plugin-react';
import viteCompression from 'vite-plugin-compression';

export default defineConfig(({ command }) => ({
  base: process.env.VITE_BASE ?? (command === 'serve' ? '/' : '/openx-studio/'),
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 1024,
    }),
  ],
  worker: {
    format: 'es',
  },
  resolve: {
    preserveSymlinks: true,
  },
  server: {
    port: 3001,
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
  preview: {
    port: 3001,
  },
  build: {
    outDir: 'build',
    chunkSizeWarningLimit: 2500,
    minify: true,
    cssCodeSplit: true,
    sourcemap: false,
    reportCompressedSize: false,
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor-radix': [
            '@radix-ui/react-dialog',
            '@radix-ui/react-scroll-area',
            '@radix-ui/react-slider',
            '@radix-ui/react-tabs',
            '@radix-ui/react-tooltip',
          ],
          'vendor-three': ['three'],
          'vendor-icons': ['lucide-react'],
        },
      },
    },
  },
}));

