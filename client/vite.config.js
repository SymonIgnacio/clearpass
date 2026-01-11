import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { fileURLToPath } from 'url'

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isVitest = !!process.env.VITEST
  const muiIconsMockPath = fileURLToPath(new URL('./src/test/muiIconsMock.js', import.meta.url))

  return {
    plugins: [react()],
    css: {
      postcss: './postcss.config.js',
    },
    resolve: {
      alias: isVitest
        ? [
            { find: /^@mui\/icons-material$/, replacement: muiIconsMockPath },
            { find: /^@mui\/icons-material\/.*$/, replacement: muiIconsMockPath },
          ]
        : [],
    },
    server: {
      port: 5174,
      host: true,
      proxy: {
        '/api': {
          target: 'http://localhost:3002',
          changeOrigin: true,
          secure: false,
        },
      },
    },
    test: {
      globals: true,
      environment: 'jsdom',
      setupFiles: './src/test/setup.js',
      fileParallelism: false,
      maxConcurrency: 1,
      pool: 'threads',
      poolOptions: {
        threads: {
          minThreads: 1,
          maxThreads: 1,
        },
      },
      deps: {
        optimizer: {
          web: {
            enabled: false,
          },
          ssr: {
            enabled: false,
          },
        },
      },
    },
  }
})
