import tailwindcss from '@tailwindcss/vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, '.', '');
  return {
    plugins: [
      react(),
      tailwindcss(),
      VitePWA({
        injectRegister: null,
        includeAssets: ['favicon.svg', 'task2goal-icon-new.jpg', 'task2goal-icon-cropped.svg', 'task2goal-splash.jpg', 'task2goal-splash-cropped.svg', 'manifest.webmanifest'],
        manifest: {
          name: 'Task2Goal - From Tasks to Goals',
          short_name: 'Task2Goal',
          description: 'From Tasks to Goals',
          theme_color: '#ffffff',
          background_color: '#ffffff',
          display: 'standalone',
          icons: [
            {
              src: '/task2goal-icon-cropped.svg',
              sizes: 'any',
              type: 'image/svg+xml',
              purpose: 'any maskable',
            },
          ],
        },
        workbox: {
          globPatterns: ['**/*.{js,css,html,ico,png,jpg,jpeg,svg,woff,woff2}'],
          maximumFileSizeToCacheInBytes: 4 * 1024 * 1024,
          cleanupOutdatedCaches: true,
          skipWaiting: true,
        },
        devOptions: {
          enabled: false,
        },
      }),
    ],
    
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
      },
    },
    server: {
      port: 3000,
      host: '0.0.0.0',
      hmr: process.env.DISABLE_HMR !== 'true',
    },
  };
});
