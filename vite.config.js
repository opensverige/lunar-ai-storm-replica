import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

function markdownUtf8Headers() {
  const setUtf8Header = (req, res, next) => {
    if (req.url && req.url.split('?')[0].endsWith('.md')) {
      res.setHeader('Content-Type', 'text/plain; charset=utf-8')
      res.setHeader('X-Content-Type-Options', 'nosniff')
    }
    next()
  }

  return {
    name: 'markdown-utf8-headers',
    configureServer(server) {
      server.middlewares.use(setUtf8Header)
    },
    configurePreviewServer(server) {
      server.middlewares.use(setUtf8Header)
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  plugins: [react(), markdownUtf8Headers()],
})

