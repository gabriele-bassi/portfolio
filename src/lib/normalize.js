/**
 * Normalizzazione delle risposte Directus.
 *
 * Le collezioni gestite a mano cambiano forma facilmente (un campo "tags" puo'
 * arrivare come array JSON, come stringa CSV o come relazione). Qui tutto viene
 * ricondotto a strutture prevedibili, cosi' i componenti restano semplici e un
 * campo scritto male nel CMS non fa sparire una sezione.
 */

import { assetUrl } from './directus.js'

/** Stringa pulita o `''`. */
export function str(value) {
  if (value === undefined || value === null) return ''
  if (typeof value === 'string') return value.trim()
  if (typeof value === 'number' || typeof value === 'boolean') return String(value)
  return ''
}

/**
 * URL che si puo' mettere in un `href`, oppure `''`.
 *
 * Il valore arriva dal CMS, quindi e' un dato non fidato: un `href` che comincia
 * per `javascript:` esegue codice al clic. React 19 blocca gia' questi URL (con
 * un errore in console invece di un'esecuzione), ma affidare la difesa di un
 * dato esterno a una protezione della libreria e' una scommessa, e la stessa
 * regola esiste gia' per i contatti (`components/SocialLinks.jsx`).
 *
 * Accettati: `http(s)://`, `//dominio`, un percorso `/…` e un dominio nudo, a
 * cui si antepone `https://`. Rifiutato qualsiasi altro schema — `javascript:`,
 * `data:`, `vbscript:`, e anche `mailto:`/`tel:`, che non sono link da aprire in
 * una nuova scheda (li gestisce la barra dei contatti).
 *
 * Un valore senza senso viene rifiutato (il link non compare) solo quando non e'
 * nemmeno interpretabile come indirizzo: "vedi il progetto" non e' una URL,
 * "localhost:3000" si' e resta. Meglio un link storto che uno nascosto.
 */
export function webUrl(value) {
  const raw = str(value)
  if (!raw) return ''

  if (/^https?:\/\//i.test(raw)) return raw
  if (raw.startsWith('//')) return `https:${raw}`
  if (raw.startsWith('/')) return raw
  if (/^[a-z][a-z0-9+.-]*:/i.test(raw)) return ''

  try {
    return new URL(`https://${raw}`).href
  } catch {
    return ''
  }
}

/** Booleano tollerante: accetta true, 1, "true", "si", "sì". */
function bool(value) {
  if (typeof value === 'boolean') return value
  if (typeof value === 'number') return value !== 0
  return /^(1|true|si|sì|yes|on)$/i.test(str(value))
}

/**
 * Converte un campo "repeater/tags" in un array.
 * Accetta: array, stringa JSON, stringa CSV, oggetto mappa.
 */
export function toArray(value) {
  if (Array.isArray(value)) return value.filter((item) => item !== null && item !== undefined)
  if (value === null || value === undefined) return []

  if (typeof value === 'object') {
    // Forma compatta tipo { github: "https://...", linkedin: "..." }
    return Object.entries(value).map(([key, item]) =>
      typeof item === 'object' && item !== null
        ? { piattaforma: key, ...item }
        : { piattaforma: key, url: item },
    )
  }

  const raw = String(value).trim()
  if (!raw) return []

  if (raw.startsWith('[') || raw.startsWith('{')) {
    try {
      const parsed = JSON.parse(raw)
      if (Array.isArray(parsed) || (parsed && typeof parsed === 'object')) return toArray(parsed)
    } catch {
      /* non era JSON: si prosegue con lo split */
    }
  }

  return raw
    .split(/[,\n;]/)
    .map((part) => part.trim())
    .filter(Boolean)
}

/** Etichetta leggibile per un elemento, in qualunque forma arrivi. */
function label(item) {
  if (typeof item === 'string') return item.trim()
  if (typeof item === 'number') return String(item)
  if (item && typeof item === 'object') {
    return (
      str(item.nome) ||
      str(item.name) ||
      str(item.label) ||
      str(item.skill) ||
      str(item.title) ||
      str(item.titolo) ||
      str(item.value)
    )
  }
  return ''
}

/** Array di stringhe uniche, ordine preservato. */
export function normalizeTags(value) {
  const seen = new Set()
  const out = []

  for (const item of toArray(value)) {
    const text = label(item)
    const key = text.toLowerCase()
    if (!text || seen.has(key)) continue
    seen.add(key)
    out.push(text)
  }

  return out
}

/**
 * Competenze come oggetti `{ nome, categoria }`.
 *
 * Se il CMS fornisce solo stringhe, la categoria resta vuota e la sezione le
 * mostra in un unico gruppo. Se fornisce oggetti con `categoria`, la sezione le
 * raggruppa: e' il modo per avere gruppi senza inventare percentuali.
 */
export function normalizeSkills(value) {
  const seen = new Set()
  const out = []

  for (const item of toArray(value)) {
    const nome = label(item)
    const key = nome.toLowerCase()
    if (!nome || seen.has(key)) continue
    seen.add(key)

    const categoria =
      item && typeof item === 'object'
        ? str(item.categoria) || str(item.category) || str(item.gruppo) || str(item.group)
        : ''

    out.push({ nome, categoria })
  }

  return out
}

/**
 * Raggruppa le competenze per categoria, preservando l'ordine di arrivo.
 * Ogni voce resta l'oggetto completo `{ nome, categoria }`: chi disegna il chip
 * ha bisogno anche della categoria, per esempio per risolvere l'icona.
 */
export function groupSkills(skills) {
  const groups = new Map()

  for (const skill of skills) {
    const key = skill.categoria || ''
    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push(skill)
  }

  return [...groups.entries()].map(([categoria, items]) => ({ categoria, items }))
}

/** Array di contatti del repeater, ripulito e normalizzato. */
export function normalizeContacts(value) {
  return toArray(value)
    .map((item) => {
      if (typeof item === 'string') return { platform: '', url: item.trim(), icon: '' }
      if (!item || typeof item !== 'object') return null

      return {
        platform:
          str(item.piattaforma) || str(item.platform) || str(item.nome) || str(item.name) || '',
        url: str(item.url) || str(item.link) || str(item.href) || str(item.indirizzo) || '',
        icon:
          str(item.nome_icona) ||
          str(item.nomeIcona) ||
          str(item.icon) ||
          str(item.icona) ||
          '',
      }
    })
    .filter((contact) => contact && (contact.url || contact.platform))
}

/** Lingue parlate: `{ nome, livello }`. */
export function normalizeLanguages(value) {
  return toArray(value)
    .map((item) => {
      if (typeof item === 'string') return { nome: item.trim(), livello: '' }
      if (!item || typeof item !== 'object') return null
      const nome = str(item.lingua) || str(item.nome) || str(item.name)
      if (!nome) return null
      return { nome, livello: str(item.livello) || str(item.level) || '' }
    })
    .filter(Boolean)
}

/** Iniziali usate quando l'avatar non e' disponibile. */
export function initials(name) {
  const parts = str(name).split(/\s+/).filter(Boolean)
  if (!parts.length) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** "2024-09-01" -> "set 2024". */
function formatMonth(value) {
  const raw = str(value)
  if (!raw) return ''
  const match = /^(\d{4})-(\d{2})/.exec(raw)
  if (!match) return raw

  const date = new Date(Number(match[1]), Number(match[2]) - 1, 1)
  if (Number.isNaN(date.getTime())) return raw

  const text = new Intl.DateTimeFormat('it-IT', { month: 'short', year: 'numeric' }).format(date)
  return text.replace('.', '')
}

/** Periodo leggibile: "feb 2024 — oggi". */
export function formatPeriod(start, end, current) {
  const from = formatMonth(start)
  const to = current ? 'oggi' : formatMonth(end)
  if (!from) return to || ''
  return to ? `${from} — ${to}` : from
}

/** Record `profilo` di Directus nella forma usata dai componenti. */
export function normalizeProfile(raw) {
  if (!raw || typeof raw !== 'object') return null

  const nome = str(raw.nome) || str(raw.name)
  const avatarSource = raw.avatar ?? raw.immagine ?? raw.foto ?? null

  return {
    nome,
    ruolo: str(raw.ruolo) || str(raw.role) || str(raw.titolo),
    headline: str(raw.headline) || str(raw.sommario) || str(raw.tagline),
    bio: str(raw.bio) || str(raw.descrizione),
    email: str(raw.email),
    localita: str(raw.localita) || str(raw.location) || str(raw.citta),
    stato: str(raw.stato) || str(raw.status),
    disponibile: bool(raw.disponibile ?? raw.available),
    lingue: normalizeLanguages(raw.lingue ?? raw.languages),
    skills: normalizeSkills(raw.skills ?? raw.competenze),
    contatti: normalizeContacts(raw.contatti ?? raw.contacts ?? raw.social),
    avatarUrl: assetUrl(avatarSource, { width: 900, height: 1125, fit: 'cover', quality: 88 }),
    cvUrl: assetUrl(raw.cv ?? raw.curriculum, {}),
    initials: initials(nome),

    /*
     * Identita' del sito: logo e metadati arrivano dal CMS, cosi' cambiarli non
     * richiede una modifica al codice. Gli alias sono volutamente solo nomi che
     * indicano un file: un campo di testo finirebbe in una URL di asset
     * inesistente.
     */
    /*
     * Solo la larghezza: chiedere anche un'altezza fissa costringe Directus a
     * incasellare il file in quel formato. Con `height: 160` un marchio quadrato
     * diventava un 480x160 con due terzi di vuoto, e in pagina finiva alto 18 px.
     * L'altezza la impone il CSS (22 px nella barra), l'immagine porta solo le
     * proporzioni.
     */
    logoUrl: assetUrl(logoSource(raw), { width: 480, quality: 92 }),
    faviconUrl: assetUrl(raw.favicon ?? raw.favicon_file ?? raw.icona_sito, {
      width: 96,
      height: 96,
      fit: 'contain',
    }),
    meta: {
      titolo: str(raw.titolo_sito) || str(raw.seo_titolo) || str(raw.meta_titolo),
      descrizione:
        str(raw.descrizione_sito) || str(raw.seo_descrizione) || str(raw.meta_descrizione),
      url: str(raw.url_sito) || str(raw.website) || str(raw.sito),
      immagine: assetUrl(raw.og_immagine ?? raw.immagine_social ?? raw.immagine_og, {
        width: 1200,
        height: 630,
        fit: 'cover',
        quality: 82,
      }),
    },
  }
}

/** Primo fra i campi che possono contenere il file del logo. */
function logoSource(raw) {
  return raw.logo ?? raw.logo_file ?? raw.immagine_logo ?? raw.logo_immagine ?? null
}

/**
 * Identificativo di un file, in qualunque forma Directus lo consegni.
 *
 * Tre forme possibili, tutte viste sulla tua istanza:
 * - la stringa con l'id (campo file singolo);
 * - l'oggetto del file, quando la query chiede anche i suoi campi;
 * - la riga di collegamento di una relazione multipla, che annida il file
 *   sotto `directus_files_id`.
 */
function fileId(value) {
  if (typeof value === 'string') return value.trim() || null
  if (!value || typeof value !== 'object') return null

  const nested = value.directus_files_id ?? value.file ?? value.files_id
  if (nested !== undefined && nested !== null) return fileId(nested)

  return str(value.id) || null
}

/** Oggetto del file dentro una riga di collegamento, se c'e'. */
function fileObject(value) {
  if (!value || typeof value !== 'object') return null
  const nested = value.directus_files_id ?? value.file ?? value.files_id
  return nested && typeof nested === 'object' ? nested : null
}

/**
 * Testo alternativo dell'immagine, che in Directus e' il campo **Description**
 * del file.
 *
 * Non si usa il campo `title` come ripiego: Directus lo riempie da solo con il
 * nome del file, quindi al posto di una descrizione arriverebbe "Screenshot
 * 2026 10 13 093813", che a uno screen reader non dice niente. Se Description
 * e' vuota il testo alternativo lo compone chi disegna l'immagine, che sa di
 * quale progetto si tratta.
 */
function fileAlt(value) {
  const file = fileObject(value) ?? (value && typeof value === 'object' ? value : null)
  if (!file) return ''
  return str(file.description)
}

/**
 * Immagine della galleria, nella forma che serve alla pagina.
 *
 * Due misure per lo stesso file: `url` e' grande e senza ritaglio, perche' nel
 * dialogo gli screenshot devono restare leggibili per intero; `thumbUrl` e'
 * piccolo e ritagliato 16:10, perche' nella striscia delle miniature conta solo
 * riconoscere l'immagine.
 */
function galleryImage(value) {
  const id = fileId(value)
  if (!id) return null

  return {
    id,
    alt: fileAlt(value),
    url: assetUrl(id, { width: 1600, quality: 86 }),
    thumbUrl: assetUrl(id, { width: 260, height: 170, fit: 'cover', quality: 70 }),
  }
}

/**
 * Galleria di un progetto: campo `immagini` (relazione multipla con i file).
 *
 * Vengono scartati i numeri: senza i campi richiesti nella query Directus
 * consegna le righe di collegamento come semplici id numerici, che non dicono
 * quale file sia. Non e' un guasto da segnalare, e' una query da completare, e
 * la query giusta la fa `useProjects`.
 */
export function normalizeImages(value) {
  const out = []
  const seen = new Set()

  for (const item of toArray(value)) {
    if (typeof item === 'number') continue

    const image = galleryImage(item)
    if (!image || seen.has(image.id)) continue

    seen.add(image.id)
    out.push(image)
  }

  return out
}

/** Collezione `progetti`. */
export function normalizeProject(raw) {
  if (!raw || typeof raw !== 'object') return null

  const titolo = str(raw.titolo) || str(raw.nome) || str(raw.title)

  const coverSource = raw.cover ?? raw.immagine ?? raw.image
  const cover = galleryImage(coverSource)
  const gallery = normalizeImages(raw.immagini ?? raw.images ?? raw.galleria)

  /*
   * La galleria comincia dalla copertina.
   *
   * Cosi' un progetto pubblicato prima che esistesse il campo `immagini` ha
   * comunque la sua galleria, senza migrare niente: la copertina c'e' gia'.
   * Il confronto per id evita il doppione quando la stessa immagine e' anche
   * la prima della galleria, cosa che succede appena la si ricarica dentro il
   * campo nuovo invece di usare quella vecchia.
   */
  const images = cover ? [cover, ...gallery.filter((image) => image.id !== cover.id)] : gallery

  return {
    id: raw.id ?? titolo,
    titolo,
    categoria: str(raw.categoria) || str(raw.category) || str(raw.tipo),
    anno: str(raw.anno) || str(raw.year),
    descrizione: str(raw.descrizione) || str(raw.description) || str(raw.sommario),
    ruolo: str(raw.ruolo) || str(raw.role),
    stato: str(raw.stato) || str(raw.status),
    url: webUrl(str(raw.url) || str(raw.link) || str(raw.demo) || str(raw.demo_url)),
    repository: webUrl(str(raw.repository) || str(raw.repo) || str(raw.github)),
    inEvidenza: bool(raw.in_evidenza ?? raw.featured),
    // Ritaglio 16:9 della sola card: nel dialogo la stessa immagine viene
    // chiesta grande e intera, perche' li' uno screenshot va letto, non
    // riempito a forza.
    coverUrl: assetUrl(coverSource, { width: 900, height: 506, fit: 'cover', quality: 82 }),
    images,
    tags: normalizeTags(raw.tags ?? raw.stack ?? raw.tech ?? raw.tecnologie),
  }
}

/** Collezione `sezioni`: intestazioni e sottotitoli delle sezioni. */
export function normalizeSection(raw) {
  if (!raw || typeof raw !== 'object') return null

  const chiave = str(raw.chiave) || str(raw.key) || str(raw.sezione)
  if (!chiave) return null

  return {
    chiave,
    etichetta: str(raw.etichetta) || str(raw.label) || str(raw.kicker),
    titolo: str(raw.titolo) || str(raw.title),
    sottotitolo: str(raw.sottotitolo) || str(raw.subtitle) || str(raw.intro),
  }
}

/** Collezione `esperienze`: lavoro, studio, certificazioni, volontariato. */
export function normalizeExperience(raw) {
  if (!raw || typeof raw !== 'object') return null

  const ruolo = str(raw.ruolo) || str(raw.incarico) || str(raw.titolo) || str(raw.nome)
  const organizzazione = str(raw.organizzazione) || str(raw.azienda) || str(raw.ente) || str(raw.istituto)
  const inCorso = bool(raw.in_corso ?? raw.attuale ?? raw.current) || !str(raw.fine)

  return {
    id: raw.id ?? `${ruolo}-${organizzazione}`,
    ruolo,
    organizzazione,
    tipo: str(raw.tipo) || str(raw.type) || 'lavoro',
    // Voto o valutazione finale, per i titoli di studio: si mostra come
    // etichetta accanto al ruolo, non in fondo alla descrizione. Per tutto il
    // resto resta vuoto e non compare niente.
    voto: str(raw.voto) || str(raw.valutazione) || str(raw.punteggio) || str(raw.grade),
    luogo: str(raw.luogo) || str(raw.location),
    descrizione: str(raw.descrizione) || str(raw.description),
    url: webUrl(str(raw.url) || str(raw.link)),
    inCorso,
    // Le date grezze servono per ordinare; l'ordinamento avviene lato client
    // per non dipendere da un campo di ordinamento lato Directus.
    inizio: str(raw.inizio) || str(raw.dal) || str(raw.start),
    fine: str(raw.fine) || str(raw.al) || str(raw.end),
    periodo: formatPeriod(raw.inizio ?? raw.dal ?? raw.start, raw.fine ?? raw.al ?? raw.end, inCorso),
    tags: normalizeTags(raw.competenze ?? raw.tags ?? raw.skills),
  }
}

