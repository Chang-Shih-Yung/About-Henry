import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import tailwindcss from '@tailwindcss/vite'
import { VitePWA } from 'vite-plugin-pwa'
import fs from 'fs'
import path from 'path'

// Vite plugin: local file save API
function localSavePlugin() {
  return {
    name: 'local-save',
    configureServer(server) {
      server.middlewares.use('/api/save', (req, res) => {
        if (req.method !== 'POST') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        let body = ''
        req.on('data', chunk => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const { filename, content } = JSON.parse(body)
            const allowed = ['content/henry/Intro.md', 'content/QA.md', 'content/About.md', 'content/Data.md']
            if (!allowed.includes(filename)) {
              res.statusCode = 400
              res.end(JSON.stringify({ ok: false, error: 'Invalid filename' }))
              return
            }
            const filePath = path.resolve(process.cwd(), filename)
            fs.writeFileSync(filePath, content, 'utf-8')
            res.setHeader('Content-Type', 'application/json')
            res.end(JSON.stringify({ ok: true }))
          } catch (e) {
            res.statusCode = 500
            res.end(JSON.stringify({ ok: false, error: e.message }))
          }
        })
      })

      server.middlewares.use('/api/load', (req, res) => {
        if (req.method !== 'GET') {
          res.statusCode = 405
          res.end('Method Not Allowed')
          return
        }
        const url = new URL(req.url, 'http://localhost')
        const filename = url.searchParams.get('filename')
        const allowed = ['content/henry/Intro.md', 'content/guest/Intro.md', 'content/QA.md', 'content/About.md', 'content/Data.md']
        if (!allowed.includes(filename)) {
          res.statusCode = 400
          res.end(JSON.stringify({ ok: false, error: 'Invalid filename' }))
          return
        }
        const filePath = path.resolve(process.cwd(), filename)
        if (fs.existsSync(filePath)) {
          const content = fs.readFileSync(filePath, 'utf-8')
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, content }))
        } else {
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, content: '' }))
        }
      })
    }
  }
}

export default defineConfig({
  plugins: [
    vue(),
    tailwindcss(),
    localSavePlugin(),
    VitePWA({
      registerType: 'autoUpdate',
      workbox: {
        globPatterns: ['**/*.{js,css,html,jpg,png,svg,ico,woff,woff2}'],
        runtimeCaching: [
          {
            urlPattern: /\/api\/load/,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'api-content',
              networkTimeoutSeconds: 4,
              expiration: { maxAgeSeconds: 60 * 60 * 24 * 7 },
              cacheableResponse: { statuses: [0, 200] },
            },
          },
        ],
      },
      manifest: {
        name: '關於 Henry',
        short_name: 'Henry',
        theme_color: '#09090b',
        background_color: '#09090b',
        display: 'standalone',
        start_url: '/',
        icons: [],
      },
    }),
  ],
  resolve: {
    alias: {
      '@': path.resolve(process.cwd(), './src'),
    },
  },
})
