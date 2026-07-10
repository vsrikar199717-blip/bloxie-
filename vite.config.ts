import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { copyFileSync, existsSync } from 'node:fs'
import { resolve } from 'node:path'

// GitHub Pages has no server-side routing, so deep links like /bloxie-/welcome
// would 404 on refresh. Serving a copy of index.html as 404.html lets the SPA
// router take over and render the right screen.
function spa404Fallback(): Plugin {
  return {
    name: 'spa-404-fallback',
    apply: 'build',
    closeBundle() {
      const from = resolve(process.cwd(), 'dist/index.html')
      const to = resolve(process.cwd(), 'dist/404.html')
      if (existsSync(from)) copyFileSync(from, to)
    },
  }
}

// GitHub Pages serves this project under /bloxie-/. Public assets are referenced
// with absolute paths (/assets/…, /fonts/…), which Vite does NOT rewrite for the
// base path. This plugin prefixes those roots with the base at build time only,
// so local dev (base '/') is unaffected.
function assetBasePrefix(base: string): Plugin {
  return {
    name: 'asset-base-prefix',
    enforce: 'pre',
    apply: 'build',
    transform(code, id) {
      if (base === '/') return null
      if (!/\.(t|j)sx?$/.test(id) && !id.endsWith('.css')) return null
      const out = code
        .split('"/assets/').join(`"${base}assets/`)
        .split("'/assets/").join(`'${base}assets/`)
        .split('`/assets/').join(`\`${base}assets/`)
        .split('"/fonts/').join(`"${base}fonts/`)
        .split("'/fonts/").join(`'${base}fonts/`)
        .split('(/fonts/').join(`(${base}fonts/`)
      return out === code ? null : out
    },
  }
}

// https://vite.dev/config/
export default defineConfig(({ command }) => {
  const base = command === 'build' ? '/bloxie-/' : '/'
  return {
    base,
    plugins: [assetBasePrefix(base), spa404Fallback(), react(), tailwindcss()],
  }
})
