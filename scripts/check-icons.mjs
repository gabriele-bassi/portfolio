/**
 * Verifica che ogni icona importata da `src/lib/icons.jsx` esista davvero nel
 * pacchetto react-icons installato.
 *
 * Serve perche' i nomi cambiano tra le major (es. `FaTwitter` -> `FaXTwitter`)
 * e un nome sbagliato non rompe il type-check di un progetto JavaScript: si
 * vedrebbe solo a runtime, con un import `undefined`.
 *
 * Uso: node scripts/check-icons.mjs
 */

import { readFile } from 'node:fs/promises'

const here = (path) => new URL(path, import.meta.url)

const source = await readFile(here('../src/lib/icons.jsx'), 'utf8')

const blocks = [...source.matchAll(/import\s*\{([^}]*)\}\s*from\s*'react-icons\/([\w-]+)'/g)]

if (!blocks.length) {
  console.error('Nessun import da react-icons trovato in src/lib/icons.jsx')
  process.exit(1)
}

let checked = 0
const missing = []

for (const [, rawNames, pack] of blocks) {
  const dts = await readFile(here(`../node_modules/react-icons/${pack}/index.d.ts`), 'utf8')
  const exported = new Set(
    [...dts.matchAll(/export declare const (\w+):/g)].map((match) => match[1]),
  )

  for (const rawName of rawNames.split(',')) {
    const name = rawName.trim()
    if (!name) continue
    checked += 1
    if (!exported.has(name)) missing.push(`${pack}: ${name}`)
  }
}

console.log(`Icone controllate: ${checked}`)

if (missing.length) {
  console.error(`\nIcone inesistenti in react-icons:\n  ${missing.join('\n  ')}`)
  process.exit(1)
}

console.log('Tutte le icone importate esistono.')
