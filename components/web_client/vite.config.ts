import react from '@vitejs/plugin-react';
import { defineConfig, type Plugin } from 'vite';
import { VitePWA } from 'vite-plugin-pwa';

/**
 * Publishes the build commit at `/version.json`, outside the service worker's
 * precache (`injectManifest.globPatterns` covers no `.json`), so a running app
 * can read what the origin is actually serving and offer an in-app update.
 */
function versionManifest(): Plugin {
  const commit = process.env['VITE_GIT_SHA']?.trim() || 'dev';
  const body = () => JSON.stringify({ builtAt: new Date().toISOString(), commit });

  return {
    name: 'psykl-version-manifest',
    configureServer(server) {
      server.middlewares.use('/version.json', (_request, response) => {
        response.setHeader('Cache-Control', 'no-store');
        response.setHeader('Content-Type', 'application/json');
        response.end(body());
      });
    },
    generateBundle() {
      this.emitFile({ fileName: 'version.json', source: body(), type: 'asset' });
    },
  };
}

export default defineConfig({
  plugins: [
    react(),
    versionManifest(),
    VitePWA({
      registerType: 'autoUpdate',
      strategies: 'injectManifest',
      srcDir: 'src',
      filename: 'sw.ts',
      includeAssets: ['favicon.ico', 'favicon.svg', 'apple-touch-icon.png', 'safari-pinned-tab.svg'],
      manifest: {
        name: 'PSYKL-System',
        short_name: 'PSYKL',
        description: 'Time-independent planning around energy cycles.',
        theme_color: '#1a1a2e',
        background_color: '#ffffff',
        display: 'standalone',
        start_url: '/',
        icons: [
          { src: '/android-chrome-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
          { src: '/android-chrome-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
          // Separate assets: the maskable pair carries the safe-zone padding a
          // launcher mask crops into, which the `any` icons deliberately lack.
          { src: '/maskable-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'maskable' },
          { src: '/maskable-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
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
