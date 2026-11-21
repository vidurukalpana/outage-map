import tailwindcss from '@tailwindcss/vite'
import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

export default defineConfig({
  plugins: [react(), tailwindcss()],
  // One shared .env lives at the repo root.
  envDir: '..',
  // Dev only: same-origin API calls, so no CORS is needed locally.
  server: {
    proxy: { '/api': 'http://localhost:8080' },
  },
})
