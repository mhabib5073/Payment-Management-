import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  server: {
    host: true, // reachable from Windows via the VM's IP
    proxy: { '/api': 'http://localhost:8000' },
  },
  test: { environment: 'node' },
})