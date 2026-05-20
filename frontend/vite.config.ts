import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
server: {
    port: 5173,
    host: '0.0.0.0', // змушує Vite слухати взагалі всі вхідні адреси
    cors: true,      // дозволяє крос-доменні запити
    hmr: {
      clientPort: 443
    },
    // Для старіших версій Vite (3 та 4):
    fs: {
      strict: false
    }
  }
})
