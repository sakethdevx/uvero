import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { VitePWA } from 'vite-plugin-pwa'
import { writeFileSync } from 'fs'
import { resolve } from 'path'

/**
 * Vite plugin that writes dist/version.json with a unique build timestamp
 * after every production build. The PWA version-check logic (src/lib/versionCheck.js)
 * fetches this file at startup (bypassing caches) and forces a hard reload when
 * the version differs from what is stored in localStorage – keeping iOS PWA users
 * on the latest build.
 */
const versionJsonPlugin = () => ({
  name: 'version-json',
  closeBundle() {
    const version = Date.now().toString()
    writeFileSync(resolve('dist/version.json'), JSON.stringify({ version }))
  },
})

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    VitePWA({
      registerType: 'autoUpdate',
      useCredentials: true,
      includeAssets: ['logo.svg', 'pwa-192x192.png', 'pwa-512x512.png'],
      manifest: {
        name: 'Uvero Toolbox',
        short_name: 'Uvero',
        description: 'Uvero Toolbox brings privacy-first image, PDF, audio, video, and utility tools together in one place.',
        theme_color: '#0ea5e9',
        background_color: '#ffffff',
        display: 'standalone',
        orientation: 'portrait',
        icons: [
          {
            src: 'pwa-192x192.png',
            sizes: '192x192',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png'
          },
          {
            src: 'pwa-512x512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'any maskable'
          }
        ]
      },
      workbox: {
        // Exclude worker files and other chunks from precaching if they are too large or loaded dynamically
        maximumFileSizeToCacheInBytes: 10000000,
        globPatterns: ['**/*.{js,css,html,ico,png,svg}'],
        // Always fetch version.json from the network so iOS PWA clients see the
        // latest version even when the rest of the app shell is served from cache.
        runtimeCaching: [
          {
            urlPattern: /\/version\.json(\?.*)?$/,
            handler: 'NetworkOnly',
          },
        ],
      }
    }),
    versionJsonPlugin(),
  ],
  worker: {
    format: 'es'
  }
})
