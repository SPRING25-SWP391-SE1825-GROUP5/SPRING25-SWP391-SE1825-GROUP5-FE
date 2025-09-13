import { defineConfig, loadEnv } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueJsx from '@vitejs/plugin-vue-jsx'
import { resolve } from 'path'
import { fileURLToPath, URL } from 'node:url'

/**
 * Vite Configuration for EV Service Center Management System
 * - Vue 3 + TypeScript + JSX Support
 * - Path aliases for better imports
 * - Development server configuration
 */
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    plugins: [
      vue({
        // Enable script setup sugar for better TypeScript support
        script: {
          defineModel: true,
          propsDestructure: true
        }
      }),
      vueJsx({
        // Enable JSX/TSX support for Vue components
        optimize: true,
        isCustomElement: (tag) => tag.startsWith('ion-')
      })
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
        '@/components': fileURLToPath(new URL('./src/components', import.meta.url)),
        '@/views': fileURLToPath(new URL('./src/views', import.meta.url)),
        '@/stores': fileURLToPath(new URL('./src/stores', import.meta.url)),
        '@/types': fileURLToPath(new URL('./src/types', import.meta.url)),
        '@/utils': fileURLToPath(new URL('./src/utils', import.meta.url)),
        '@/constants': fileURLToPath(new URL('./src/constants', import.meta.url)),
        '@/services': fileURLToPath(new URL('./src/services', import.meta.url)),
        '@/layouts': fileURLToPath(new URL('./src/layouts', import.meta.url))
      }
    },
    // TypeScript configuration
    esbuild: {
      target: 'es2020',
      keepNames: true
    },

    // Build configuration
    build: {
      target: 'es2020',
      sourcemap: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'vue-vendor': ['vue', 'vue-router', 'pinia'],
            'ui-vendor': ['axios']
          }
        }
      }
    },

    server: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || 'localhost',
      open: true, // Automatically open browser
    },
    preview: {
      port: parseInt(env.VITE_PORT) || 3000,
      host: env.VITE_HOST || 'localhost',
    },

    // Define global constants for TypeScript
    define: {
      __VUE_OPTIONS_API__: true,
      __VUE_PROD_DEVTOOLS__: false,
      __VUE_PROD_HYDRATION_MISMATCH_DETAILS__: false
    }
  }
})
