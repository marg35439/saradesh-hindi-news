import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import {defineConfig} from 'vite';
import { legacyCssCompatPlugin } from './vite-plugin-css-compat';

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      legacyCssCompatPlugin(),
    ],
    css: {
      devSourcemap: false,
    },
    build: {
      target: ['es2017', 'chrome79', 'firefox78', 'safari13', 'edge79'],
      cssTarget: ['chrome79', 'firefox78', 'safari13', 'edge79'],
    },
    esbuild: {
      target: 'es2017',
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      // HMR is disabled in AI Studio via DISABLE_HMR env var.
      // Do not modify—file watching is disabled to prevent flickering during agent edits.
      hmr: process.env.DISABLE_HMR !== 'true',
      // Disable file watching when DISABLE_HMR is true to save CPU during agent edits.
      watch: process.env.DISABLE_HMR === 'true' ? null : {},
    },
  };
});
