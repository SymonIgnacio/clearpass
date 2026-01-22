import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

// https://vitejs.dev/config/
export default defineConfig(() => {
  const isVitest = !!process.env.VITEST;
  const muiIconsMockPath = fileURLToPath(new URL('./src/test/muiIconsMock.js', import.meta.url));

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
    build: {
      // Enable source maps for debugging in production
      sourcemap: false,
      rollupOptions: {
        output: {
          // Manual chunk splitting for better caching
          manualChunks: {
            // React and core libraries
            'react-vendor': ['react', 'react-dom', 'react-router-dom'],

            // Material-UI components split by category
            'mui-core': ['@mui/material', '@emotion/react', '@emotion/styled'],
            'mui-icons': ['@mui/icons-material'],

            // Data visualization
            charts: ['recharts'],

            // QR code and scanning
            qr: ['qrcode', 'react-qr-scanner'],

            // Utilities and helpers
            utils: ['date-fns', 'axios', 'validator'],
          },
          // Optimize chunk naming for better caching
          chunkFileNames: chunkInfo => {
            const facadeModuleId = chunkInfo.facadeModuleId
              ? chunkInfo.facadeModuleId.split('/').pop()
              : 'chunk';
            return `js/[name]-[hash].js`;
          },
          entryFileNames: 'js/[name]-[hash].js',
          assetFileNames: assetInfo => {
            const info = assetInfo.name.split('.');
            const ext = info[info.length - 1];
            if (/\.(mp4|webm|ogg|mp3|wav|flac|aac)$/.test(assetInfo.name)) {
              return `media/[name]-[hash][extname]`;
            }
            if (/\.(png|jpe?g|gif|svg|webp|avif)$/.test(assetInfo.name)) {
              return `images/[name]-[hash][extname]`;
            }
            if (/\.(woff2?|eot|ttf|otf)$/.test(assetInfo.name)) {
              return `fonts/[name]-[hash][extname]`;
            }
            return `${ext}/[name]-[hash][extname]`;
          },
        },
      },
      // Optimize bundle size
      chunkSizeWarningLimit: 1000, // Increase warning threshold to 1MB
      target: 'es2015', // Target modern browsers for better optimization
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
    // Optimize dependencies for better performance
    optimizeDeps: {
      include: [
        'react',
        'react-dom',
        'react-router-dom',
        '@mui/material',
        '@emotion/react',
        '@emotion/styled',
        'date-fns',
        'axios',
      ],
    },
  };
});
