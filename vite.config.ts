import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'apple-touch-icon.png', 'mask-icon.svg'],
      manifest: {
        name: 'Global Observer - Konflikt-Monitor',
        short_name: 'GlobalObserver',
        description: 'Echtzeit-Überwachung globaler Konflikte und Krisengebiete',
        theme_color: '#0a0a0f',
        background_color: '#0a0a0f',
        display: 'standalone',
        orientation: 'any',
        start_url: '/',
        icons: [
          {
            src: '/icon-192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: '/icon-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable'
          }
        ]
      },
      workbox: {
        // Cache Strategien
        runtimeCaching: [
          {
            // Cache für Kartenkacheln
            urlPattern: /^https:\/\/(a|b|c)\.basemaps\.cartocdn\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'map-tiles-cache',
              expiration: {
                maxEntries: 500,
                maxAgeSeconds: 7 * 24 * 60 * 60 // 7 Tage
              },
              cacheableResponse: {
                statuses: [0, 200]
              }
            }
          },
          {
            // Cache für API-Antworten
            urlPattern: /^https:\/\/(api\.gdeltproject\.org|api\.reliefweb\.int|earthquake\.usgs\.gov|eonet\.gsfc\.nasa\.gov)\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 5 * 60 // 5 Minuten
              },
              networkTimeoutSeconds: 10
            }
          },
          {
            // Cache für statische Assets
            urlPattern: /\.(?:js|css|woff2?)$/i,
            handler: 'StaleWhileRevalidate',
            options: {
              cacheName: 'static-resources',
              expiration: {
                maxEntries: 100
              }
            }
          }
        ],
        // Offline-Fallback
        navigateFallback: '/index.html',
        navigateFallbackDenylist: [/^\/__/, /\/api\//]
      }
    })
  ],
  build: {
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Separiere MapLibre für Lazy Loading
          if (id.includes('maplibre-gl')) {
            return 'vendor-maplibre'
          }
          if (id.includes('pmtiles')) {
            return 'vendor-pmtiles'
          }
          // React separat
          if (id.includes('react-dom')) {
            return 'vendor-react-dom'
          }
          if (id.includes('node_modules/react/')) {
            return 'vendor-react'
          }
          // Supabase separat
          if (id.includes('@supabase')) {
            return 'vendor-supabase'
          }
          // Radix UI zusammenfassen
          if (id.includes('@radix-ui')) {
            return 'vendor-radix'
          }
          // Lucide Icons (viele kleine Module)
          if (id.includes('lucide-react')) {
            return 'vendor-icons'
          }
          // Date Utils
          if (id.includes('date-fns')) {
            return 'vendor-date'
          }
          // State Management
          if (id.includes('zustand')) {
            return 'vendor-state'
          }
        },
      },
    },
    // Target für moderne Browser
    target: 'esnext',
    // Source Maps nur für Produktion
    sourcemap: false,
    // Minifizierung optimieren
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true,
        drop_debugger: true
      }
    },
    chunkSizeWarningLimit: 600,
  },
  optimizeDeps: {
    include: ['react', 'react-dom', 'zustand', 'date-fns'],
    // MapLibre explizit für Lazy Loading ausschließen
    exclude: ['maplibre-gl']
  },
  // Bessere Dev-Performance
  server: {
    hmr: {
      overlay: true
    }
  }
})
