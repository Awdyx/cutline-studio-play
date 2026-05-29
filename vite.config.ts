import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DEFAULT_SEED_PATH = join(__dirname, 'src/defaults/cutlineDefaultSeed.json')

function defaultSeedCapturePlugin() {
  return {
    name: 'cutline-default-seed-capture',
    configureServer(server: import('vite').ViteDevServer) {
      server.middlewares.use(async (req, res, next) => {
        if (req.method !== 'POST' || req.url !== '/__dev/save-default-seed') {
          next()
          return
        }

        try {
          const chunks: Buffer[] = []
          for await (const chunk of req) chunks.push(Buffer.from(chunk))
          const body = Buffer.concat(chunks).toString('utf8')
          const parsed = JSON.parse(body)
          await mkdir(dirname(DEFAULT_SEED_PATH), { recursive: true })
          await writeFile(DEFAULT_SEED_PATH, `${JSON.stringify(parsed, null, 2)}\n`)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ ok: true, path: DEFAULT_SEED_PATH }))
        } catch (err) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(
            JSON.stringify({
              ok: false,
              error: err instanceof Error ? err.message : 'save_failed',
            }),
          )
        }
      })
    },
  }
}

// https://vite.dev/config/
export default defineConfig({
  // GitHub Pages base matches repo name; local dev stays at /
  base:
    process.env.GITHUB_PAGES === 'true'
      ? `/${process.env.GITHUB_PAGES_REPO ?? 'cutline-studio-demo'}/`
      : '/',
  plugins: [react(), defaultSeedCapturePlugin()],
  server: {
    host: true,
  },
})
