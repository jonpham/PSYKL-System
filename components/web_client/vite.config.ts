import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico'],
      manifest: {
        name: 'PSYKL-System',
        short_name: 'PSYKL',
        description: 'Time-independent planning around energy cycles.',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/pwa-icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png' },
          { src: '/pwa-icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      injectRegister: false,
      devOptions: {
        enabled: true,
      },
      injectManifest: {
        globPatterns: ['**/*.{html,js,css,png,webmanifest}'],
      },
    }),
  ],
  server: {
    port: 5173,
    host: '0.0.0.0',
  },
});
