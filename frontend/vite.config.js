import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
    {
      name: 'sync-dist-folders',
      closeBundle() {
        try {
          const rootDist = path.resolve(__dirname, '../dist')
          const frontendDist = path.resolve(__dirname, 'dist')
          if (fs.existsSync(rootDist)) {
            fs.cpSync(rootDist, frontendDist, { recursive: true })
          }
        } catch (err) {
          console.warn('Sync dist folders notice:', err.message)
        }
      }
    }
  ],
  build: {
    outDir: path.resolve(__dirname, '../dist'),
    emptyOutDir: true,
  }
})
