import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  base: '/ObjectiveCraft/',
  plugins: [
    react()
  ],
  server: {
    proxy: {
      '/freellm': {
        target: 'https://apifreellm.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/freellm/, ''),
      },
    },
  },
})
