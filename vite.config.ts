import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import legacy from '@vitejs/plugin-legacy'


export default defineConfig({
  build: {
    target: 'es2015',
    minify: 'terser',
    rollupOptions: {
      output: {
        // ── Chunk splitting ────────────────────────────────────────────────
        // Splitting large vendors into separate chunks lets the browser
        // download them in parallel and parse each chunk individually.
        // On low-end CPUs this avoids a single blocking JS parse step that
        // can stall the splash screen for 2–5 seconds.
        manualChunks(id) {
          if (id.includes('node_modules/react/') ||
              id.includes('node_modules/react-dom/') ||
              id.includes('node_modules/react/jsx-runtime')) {
            return 'vendor-react'
          }
          if (id.includes('node_modules/leaflet/') ||
              id.includes('node_modules/react-leaflet/')) {
            return 'vendor-leaflet'
          }
          if (id.includes('node_modules/@supabase/') ||
              id.includes('node_modules/supabase-js/')) {
            return 'vendor-supabase'
          }
          if (id.includes('node_modules/framer-motion/')) {
            return 'vendor-motion'
          }
        },
      },
    },
  },

  plugins: [
    react(),
    tailwindcss(),

    // ── Legacy WebView support ─────────────────────────────────────────────
    // Generates a SystemJS ES5 bundle served only to browsers that don't
    // support <script type="module"> (Chrome < 80, old Android WebViews).
    // Modern browsers receive the lean ES-module bundle and ignore the legacy
    // chunks entirely (no overhead). The legacy bundle includes all required
    // polyfills for async/await, optional chaining, nullish coalescing, etc.
    legacy({
      targets: ['chrome >= 64', 'safari >= 11', 'android >= 5'],
      additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
      renderLegacyChunks: true,
      polyfills: true,
    }),



    VitePWA({
      registerType: 'prompt',
      includeAssets: ['favicon.svg', 'apple-touch-icon.png', 'pwa-192.png', 'pwa-512.png'],
      manifest: {
        name: 'Zholda',
        short_name: 'Zholda',
        description: 'Real-time marshrutka tracking app',
        theme_color: '#FFD700',
        background_color: '#FFD700',
        display: 'standalone',
        orientation: 'portrait',
        start_url: '/',
        icons: [
          { src: '/pwa-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/pwa-512.png', sizes: '512x512', type: 'image/png', purpose: 'any maskable' },
        ],
      },
      workbox: {
        globPatterns: ['**/*.{js,css,html,ico,png,svg,woff2,mp4}'],
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/tile\.openstreetmap\.org\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'osm-tiles',
              expiration: { maxEntries: 500, maxAgeSeconds: 60 * 60 * 24 * 30 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
          {
            urlPattern: /^https:\/\/.*\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-api',
              expiration: { maxEntries: 100, maxAgeSeconds: 60 * 5 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
    }),
  ],
})
