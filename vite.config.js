import { defineConfig } from 'vite'
import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
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
