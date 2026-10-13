/**
 * Client HTTP minimale per l'istanza Directus self-hosted.
 *
 * Espone solo `fetch` (nessun SDK) cosi' il bundle resta leggero e le
 * chiamate sono facili da tracciare dal Network tab del browser.
 */

import { DEFAULT_DIRECTUS_URL } from './config.js'

/** Legge una variabile d'ambiente di Vite con fallback. */
function readEnv(key, fallback) {
  const raw = import.meta.env?.[key]
  if (raw === undefined || raw === null || raw === '') return fallback
  return String(raw)
}

/** Interpreta in modo esplicito "true"/"1"/"yes"/"on" come booleano. */
function readBool(key, fallback) {
  const raw = readEnv(key, String(fallback))
  return /^(1|true|yes|on)$/i.test(raw.trim())
}

/** URL base di Directus, senza slash finale. */
export const DIRECTUS_URL = readEnv('VITE_DIRECTUS_URL', DEFAULT_DIRECTUS_URL).replace(/\/+$/, '')

export const COLLECTIONS = {
  profilo: readEnv('VITE_COLLECTION_PROFILO', 'profilo'),
  progetti: readEnv('VITE_COLLECTION_PROGETTI', 'progetti'),
  esperienze: readEnv('VITE_COLLECTION_ESPERIENZE', 'esperienze'),
  sezioni: readEnv('VITE_COLLECTION_SEZIONI', 'sezioni'),
}

/** Timeout in millisecondi per ogni richiesta. */
export const REQUEST_TIMEOUT = Number(readEnv('VITE_DIRECTUS_TIMEOUT', '8000')) || 8000

/**
 * Quando Directus non e' raggiungibile il sito pubblico mostrerebbe una pagina
 * vuota. Con il fallback attivo la pagina diventa la schermata di manutenzione,
 * che lo dice in modo presentabile; disattivandolo si vede invece l'errore
 * tecnico con la diagnostica delle sonde, che serve durante lo sviluppo.
 *
 * In nessuno dei due casi vengono mostrati contenuti inventati.
 */
export const ENABLE_FALLBACK = readBool('VITE_ENABLE_FALLBACK', true)

/** Errore tipizzato per distinguere i guasti di rete dagli errori HTTP. */
export class DirectusError extends Error {
  constructor(
    message,
    { code = 'REQUEST_FAILED', status = null, url = null, cause = null, detail = '', fieldAccess = false } = {},
  ) {
    super(message)
    this.name = 'DirectusError'
    this.code = code
    this.status = status
    this.url = url
    this.cause = cause
    /*
     * `detail` e' il messaggio di Directus, che dice **cosa** non va (collezione
     * inesistente, campo vietato, query sbagliata) mentre lo stato HTTP da solo
     * dice solo che la richiesta non e' passata.
     *
     * `fieldAccess` distingue il caso delicato: un campo elencato che non
     * esiste piu' fa fallire l'intera richiesta. Verificato sulla tua istanza:
     *
     *   403  You don't have permission to access field "x" in collection "y"
     *        or it does not exist. Queried in root.
     *
     * cioe' lo **stesso** 403 di una collezione senza permesso Public, con solo
     * il messaggio a distinguerli. Senza questa distinzione un campo rinominato
     * nel CMS spegnerebbe il sito invece di degradare.
     */
    this.detail = detail
    this.fieldAccess = fieldAccess
  }
}

/** Messaggio di errore di Directus, se la risposta ne contiene uno leggibile. */
async function readErrorDetail(response) {
  try {
    const payload = await response.json()
    const message = payload?.errors?.[0]?.message
    return typeof message === 'string' ? message.trim() : ''
  } catch {
    // Risposta non JSON (proxy, pagina HTML di un errore): non e' un problema.
    return ''
  }
}

/** Costruisce la URL pubblica di un asset Directus partendo da un file ID. */
export function assetUrl(file, transform = {}) {
  const id =
    typeof file === 'string' ? file : (file?.id ?? file?.filename_download ?? file?.filename ?? null)

  if (!id) return null
  if (/^https?:\/\//i.test(id)) return id

  const params = new URLSearchParams()
  for (const [key, value] of Object.entries(transform)) {
    if (value !== undefined && value !== null && value !== '') params.set(key, String(value))
  }
  const query = params.toString()
  return `${DIRECTUS_URL}/assets/${id}${query ? `?${query}` : ''}`
}

/**
 * Rileva il caso critico di GitHub Pages: pagina in HTTPS che chiama un CMS
 * in HTTP. Il browser blocca la richiesta prima ancora di inviarla.
 */
export function isMixedContent() {
  return (
    typeof window !== 'undefined' &&
    window.location.protocol === 'https:' &&
    DIRECTUS_URL.startsWith('http://')
  )
}

function buildUrl(pathname, query) {
  const entries = Object.entries(query ?? {}).filter(
    ([, value]) => value !== undefined && value !== null && value !== '',
  )
  if (!entries.length) return `${DIRECTUS_URL}${pathname}`

  const params = new URLSearchParams()
  for (const [key, value] of entries) {
    params.set(key, Array.isArray(value) ? value.join(',') : String(value))
  }
  return `${DIRECTUS_URL}${pathname}?${params.toString()}`
}

/** Normalizza le opzioni di query nello stile previsto dalle API Directus. */
function toQuery({ fields, limit, sort, filter, deep, search } = {}) {
  return {
    fields: Array.isArray(fields) ? fields.join(',') : fields,
    limit,
    sort,
    search,
    deep: deep === undefined ? undefined : String(deep),
    filter: filter ? JSON.stringify(filter) : undefined,
  }
}

/**
 * Richiesta GET verso Directus.
 *
 * Distingue tre casi, importanti per gestire bene gli stati nella UI:
 * - abort del chiamante  -> DOMException `AbortError` (smontaggio componente)
 * - timeout scaduto      -> DirectusError con `code === 'TIMEOUT'`
 * - rete/CORS/offline    -> DirectusError con `code === 'NETWORK'`
 *
 * In piu' riprova una volta senza elenco dei campi quando e' **un campo** a far
 * fallire la richiesta: vedi il commento in `request`.
 */
async function send(pathname, { query, signal, timeoutMs = REQUEST_TIMEOUT } = {}) {
  const url = buildUrl(pathname, query)
  const controller = new AbortController()

  const abortFromCaller = () => controller.abort()
  if (signal) {
    if (signal.aborted) {
      controller.abort()
    } else {
      signal.addEventListener('abort', abortFromCaller, { once: true })
    }
  }

  let timedOut = false
  const timer = setTimeout(() => {
    timedOut = true
    controller.abort()
  }, timeoutMs)

  try {
    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      credentials: 'omit',
      signal: controller.signal,
      headers: { Accept: 'application/json' },
    })

    if (!response.ok) {
      const detail = await readErrorDetail(response)
      throw new DirectusError(
        `Directus ha risposto ${response.status} ${response.statusText || ''}`.trim(),
        {
          code:
            response.status === 401 || response.status === 403
              ? 'FORBIDDEN'
              : response.status === 404
                ? 'NOT_FOUND'
                : 'HTTP_ERROR',
          status: response.status,
          url,
          detail,
          fieldAccess: /to access field/i.test(detail),
        },
      )
    }

    const payload = await response.json()
    return payload?.data ?? null
  } catch (error) {
    if (error instanceof DirectusError) throw error
    if (timedOut) {
      throw new DirectusError(`Directus non ha risposto entro ${timeoutMs} ms`, {
        code: 'TIMEOUT',
        url,
        cause: error,
      })
    }
    // Abort volontario (smontaggio): va propagato cosi' com'e'.
    if (error?.name === 'AbortError') throw error
    throw new DirectusError('Impossibile contattare Directus (rete, CORS o servizio offline)', {
      code: 'NETWORK',
      url,
      cause: error,
    })
  } finally {
    clearTimeout(timer)
    signal?.removeEventListener('abort', abortFromCaller)
  }
}

/**
 * Richiesta verso Directus, con una seconda possibilita' se e' un campo a
 * bloccare tutto.
 *
 * Il sito chiede un **elenco esplicito** di campi (vedi `FIELDS` in
 * `hooks/useContent.js`), cosi' il CMS non manda al browser piu' di quanto la
 * pagina mostri. Il costo di questa scelta e' che se in Directus un campo viene
 * rinominato o cancellato, la richiesta non chiede "qualcosa in meno": fallisce
 * del tutto. Qui allora si riprova chiedendo tutti i campi, che e' il
 * comportamento di prima: si perde la strettezza, non il sito.
 *
 * La riprova scatta **solo** sull'errore specifico del campo (`fieldAccess`),
 * non su un 403 di collezione senza permesso: quello resta un guasto vero, e
 * nasconderlo dietro una seconda richiesta lo renderebbe piu' difficile da
 * capire.
 */
async function request(pathname, options = {}) {
  const { query } = options
  try {
    return await send(pathname, options)
  } catch (error) {
    if (query?.fields && error instanceof DirectusError && error.fieldAccess) {
      return send(pathname, { ...options, query: { ...query, fields: undefined } })
    }
    throw error
  }
}

/**
 * Elemento singolo da una collezione.
 * Per una collezione singleton (`profilo`) Directus restituisce un oggetto.
 */
export async function fetchItem(collection, { fields, deep, signal, timeoutMs } = {}) {
  const data = await request(`/items/${encodeURIComponent(collection)}`, {
    query: toQuery({ fields, deep }),
    signal,
    timeoutMs,
  })
  return Array.isArray(data) ? (data[0] ?? null) : data
}

/** Lista di elementi da una collezione. */
export async function fetchItems(
  collection,
  { fields, limit = 50, sort, filter, search, deep, signal, timeoutMs } = {},
) {
  const data = await request(`/items/${encodeURIComponent(collection)}`, {
    query: toQuery({ fields, limit, sort, filter, search, deep }),
    signal,
    timeoutMs,
  })
  return Array.isArray(data) ? data : data ? [data] : []
}

/** Health-check dell'istanza Directus (`GET /server/health`). */
export async function fetchHealth({ signal, timeoutMs = 4000 } = {}) {
  return request('/server/health', { signal, timeoutMs })
}
