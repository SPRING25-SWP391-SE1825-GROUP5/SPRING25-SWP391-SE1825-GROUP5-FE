import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react-swc'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const srcPath = fileURLToPath(new URL('./src', import.meta.url))

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Load all envs (no prefix filter) so we can read VITE_HOST, VITE_PORT, VITE_API_BASE_URL
  const env = loadEnv(mode, process.cwd(), '')

  const host = env.VITE_HOST || 'localhost'
  const port = Number(env.VITE_PORT || 5173)

  // Optional dev proxy to backend to avoid CORS; will proxy the path part from VITE_API_BASE_URL
  // Example: VITE_API_BASE_URL=http://localhost:5000/api -> proxy '/api' to 'http://localhost:5000'
  // SAFETY: never proxy root '/' to avoid hijacking the dev server.
  let proxy: Record<string, any> | undefined
  const apiBase = env.VITE_API_BASE_URL
  if (apiBase) {
    try {
      const u = new URL(apiBase)
      const target = `${u.protocol}//${u.host}`
      let apiPath = u.pathname && u.pathname !== '/' ? u.pathname : '/api'
      if (!apiPath.startsWith('/')) apiPath = `/${apiPath}`
      if (apiPath.endsWith('/') && apiPath !== '/') apiPath = apiPath.slice(0, -1)

      if (apiPath !== '/') {
        proxy = {
          [apiPath]: {
            target,
            changeOrigin: true,
            secure: u.protocol === 'https:', // respect https when explicitly set; can be false if self-signed
          },
        }
      }
    } catch {
      // ignore invalid URL
    }
  }

  return {
    plugins: [react()],
    // Cấu hình base path cho GitHub Pages
    // Thay 'your-repository-name' bằng tên repository của bạn
    base: process.env.NODE_ENV === 'production' ? '/SPRING25-SWP391-SE1825-GROUP5-FE/' : '/',
    resolve: {
      alias: {
        '@': path.resolve(srcPath),
      },
    },
    server: {
      host,
      port,
      proxy,
    },
    // Keep preview same host/port for convenience
    preview: {
      host,
      port,
    },
  }
})
