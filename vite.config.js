import { createHash } from 'node:crypto'

import react from '@vitejs/plugin-react'
import { defineConfig } from 'vite'

import { DEFAULT_DIRECTUS_URL } from './src/lib/config.js'

/**
 * Punto in cui inserire la Content-Security-Policy. E' un segnaposto e non una
 * riga scritta a mano perche' il plugin, se non lo trova, **fa fallire la
 * build**: una protezione che sparisce in silenzio e' peggio di una assente,
 * perche' la si crede ancora attiva.
 */
const CSP_PLACEHOLDER = '<!-- csp -->'

/** Impronta `sha256-…` del contenuto di uno script, nel formato previsto dalla CSP. */
function scriptHash(source) {
  return `sha256-${createHash('sha256').update(source, 'utf8').digest('base64')}`
}

/** Origine di Directus ("http://host:porta") a partire dall'indirizzo configurato. */
function originOf(url) {
  try {
    return new URL(url).origin
  } catch {
    throw new Error(
      `VITE_DIRECTUS_URL non e' un indirizzo valido ("${url}"): la Content-Security-Policy ` +
        'non puo essere calcolata. Correggi la variabile in `.env.local` o su GitHub.',
    )
  }
}

/**
 * Content-Security-Policy in testata, calcolata in fase di build.
 *
 * Serve a dire al browser da dove la pagina puo' caricare roba: senza, qualsiasi
 * cosa riuscisse a finire dentro la pagina (un campo del CMS, una dipendenza
 * compromessa) potrebbe caricare script da un altro dominio ed eseguirli.
 *
 * Due valori non si possono scrivere a mano:
 * - l'**impronta dello script inline** del tema, che cambia appena si tocca quel
 *   codice: se resta indietro, lo script viene bloccato e la pagina lampeggia in
 *   tema scuro prima di passare a quello chiaro;
 * - l'**indirizzo del CMS**, da cui arrivano dati e immagini: con un'origine
 *   sbagliata nella CSP il browser rifiuta le chiamate e la pagina resta vuota.
 *
 * Per questo li ricava il plugin dalla stessa configurazione che usa l'applicazione
 * (`src/lib/config.js`), invece di duplicarli.
 *
 * Vale solo per la build: in sviluppo Vite inietta i propri script inline per il
 * ricaricamento a caldo, che finirebbero bloccati. La politica quindi si prova
 * sul sito compilato (`npm run build && npm run preview`), non sul dev server.
 */
function contentSecurityPolicy() {
  let cmsOrigin = null

  return {
    name: 'portfolio-csp',
    apply: 'build',

    configResolved(config) {
      const url =
        config.env?.VITE_DIRECTUS_URL || process.env.VITE_DIRECTUS_URL || DEFAULT_DIRECTUS_URL
      cmsOrigin = originOf(String(url).replace(/\/+$/, ''))
    },

    transformIndexHtml: {
      // Dopo la trasformazione di Vite: l'impronta deve essere calcolata sullo
      // script **cosi' come esce**, altrimenti non corrisponde piu'.
      order: 'post',
      handler(html) {
        if (!html.includes(CSP_PLACEHOLDER)) {
          throw new Error(
            `Segnaposto ${CSP_PLACEHOLDER} non trovato in index.html: la Content-Security-Policy ` +
              'non verrebbe applicata. Reintegra il segnaposto in testata.',
          )
        }
        if (!cmsOrigin) {
          throw new Error('Origine del CMS non risolta: impossibile costruire la CSP.')
        }

        // Uno script senza `src` e' inline: e' quello che deve essere autorizzato
        // per impronta (l'attributo `type` non conta per l'impronta).
        const hashes = [...html.matchAll(/<script(?![^>]*\ssrc=)[^>]*>([\s\S]*?)<\/script>/gi)].map(
          (match) => `'${scriptHash(match[1])}'`,
        )

        if (!hashes.length) {
          throw new Error('Nessuno script inline trovato in index.html: la CSP sarebbe incoerente.')
        }

        const policy = [
          "default-src 'self'",
          `script-src 'self' ${hashes.join(' ')}`,
          // `unsafe-inline` per gli stili: React scrive l'attributo `style` di
          // alcuni elementi (misure, avanzo di lettura). Il rischio degli stili
          // inline e' molto piu' basso di quello degli script, e una pagina
          // senza misure sbagliate val bene questa riga.
          "style-src 'self' 'unsafe-inline'",
          `img-src 'self' data: ${cmsOrigin}`,
          "font-src 'self'",
          `connect-src 'self' ${cmsOrigin}`,
          "object-src 'none'",
          "base-uri 'none'",
          "form-action 'none'",
          "frame-src 'none'",
        ].join('; ')

        return html.replace(
          CSP_PLACEHOLDER,
          `<meta http-equiv="Content-Security-Policy" content="${policy}" />`,
        )
      },
    },
  }
}

/**
 * Percorso base del sito.
 *
 * GitHub Pages serve un **sito di progetto** su `/<repo>/`, non sulla radice:
 * con `base: '/'` gli asset finiscono a `/assets/…`, che su
 * `gabriele-bassi.github.io/portfolio/` non esiste, e la pagina arriva senza
 * stile e senza script. Su un **dominio personalizzato** invece il sito vive
 * davvero sulla radice e `base` deve tornare `/`.
 *
 * Questo cambio non e' affidato alla memoria: GitHub comunica da solo il
 * percorso giusto, e il workflow lo passa in `VITE_BASE` leggendolo da
 * `actions/configure-pages` (che col dominio personalizzato riporta `/`).
 * La variable `VITE_BASE` del repository, se impostata, ha la precedenza: e' la
 * via per forzare il valore senza toccare il codice.
 *
 * Senza `VITE_BASE` il valore e' `/`: corretto per lo sviluppo in locale e per
 * chi compila fuori da GitHub.
 */
function readBase() {
  const raw = String(process.env.VITE_BASE || '')
    .trim()
    .replace(/^\/+|\/+$/g, '')
  if (!raw) return '/'

  /*
   * Un percorso sbagliato non fa fallire niente: la pagina si compila e poi
   * arriva senza stile e senza script, perche' gli asset puntano nel vuoto.
   * E' il tipo di guasto che si scopre guardando il sito pubblicato, quindi
   * qui si ferma la build. Spazi, due punti e barre rovesciate non compaiono in
   * un percorso di sito: quasi sempre sono il segno di un percorso di Windows
   * finito nella variabile (succede passando `VITE_BASE=/portfolio` da Git Bash,
   * che lo converte: si evita con MSYS_NO_PATHCONV=1).
   */
  if (!/^[\w.~\/@%+-]+$/.test(raw)) {
    throw new Error(
      `VITE_BASE="${process.env.VITE_BASE}" non e' un percorso di sito valido. ` +
        'Atteso qualcosa come "/portfolio" per un sito di progetto, o "/" per il dominio.',
    )
  }

  return `/${raw}/`
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  base: readBase(),
  build: {
    outDir: 'dist',
    sourcemap: false,
  },
  server: {
    host: true,
    port: 5173,
  },
})
