import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { viteSingleFile } from 'vite-plugin-singlefile'
import path from 'path'
import fs from 'fs'

// Post-processes dist/index.html after all plugins (including vite-plugin-singlefile)
// have finished. Moves the inlined <script type="module"> to end of <body> so the
// DOM is ready when it runs. (defer is silently ignored for inline scripts.)
// Uses lastIndexOf('</body>') because the JS bundle contains </body> string literals.
const standaloneHtml = (): Plugin => ({
  name: 'standalone-html',
  apply: 'build',
  closeBundle() {
    const outFile = path.resolve(__dirname, 'dist/index.html')
    if (!fs.existsSync(outFile)) return
    const html = fs.readFileSync(outFile, 'utf8')
    const scripts: string[] = []
    const processed = html
      .replace(/ crossorigin/g, '')
      .replace(
        /<script\b[^>]*type="module"[^>]*>([\s\S]*?)<\/script>/g,
        (_, content) => { scripts.push(`<script>${content}</script>`); return '' },
      )
    const cut = processed.lastIndexOf('</body>')
    if (cut === -1) { fs.writeFileSync(outFile, processed); return }
    const result = processed.slice(0, cut) + scripts.join('\n') + '\n</body>' + processed.slice(cut + 7)
    fs.writeFileSync(outFile, result)
  },
})

// https://vite.dev/config/
export default defineConfig({
  base: './',
  plugins: [react(), tailwindcss(), viteSingleFile(), standaloneHtml()],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rollupOptions: {
      output: {
        format: 'iife',
        inlineDynamicImports: true,
      },
    },
  },
})
