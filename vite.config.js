import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

import { cloudflare } from "@cloudflare/vite-plugin";

// https://vite.dev/config/
export default defineConfig({
  base: '/ObjectiveCraft/',
  plugins: [react(), cloudflare()],
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