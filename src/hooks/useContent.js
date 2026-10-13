import { useCallback } from 'react'

import {
  COLLECTIONS,
  DIRECTUS_URL,
  ENABLE_FALLBACK,
  fetchHealth,
  fetchItem,
  fetchItems,
} from '../lib/directus.js'
import {
  normalizeExperience,
  normalizeProfile,
  normalizeProject,
  normalizeSection,
} from '../lib/normalize.js'
import { useAsyncResource } from './useAsyncResource.js'

/**
 * Campi che il sito chiede a Directus.
 *
 * Non e' un dettaglio di prestazioni: senza elenco Directus manda **l'intera
 * riga**, quindi il browser di ogni visitatore riceve anche i campi che la
 * pagina non mostra (nella scheda Rete si leggono tutti). Finche' tutte le
 * colonne sono pubblicabili non cambia niente; ma il giorno che ne aggiungi una
 * privata — un telefono, una nota interna, una bozza — quella esce comunque dal
 * tuo server, e nessuno se ne accorge perche' in pagina non compare.
 *
 * Gli elenchi qui sotto sono ricavati dai campi che i normalizzatori leggono
 * davvero (`lib/normalize.js`), verificati uno per uno contro la tua istanza:
 * a parita' di contenuto rendono gli stessi valori, in meno.
 *
 * Si sovrascrivono con le variabili `VITE_*_FIELDS` (vedi `.env.example`), per
 * esempio per tornare a `*` durante una prova.
 */
const DEFAULT_FIELDS = {
  profilo:
    'nome,ruolo,headline,bio,email,localita,stato,disponibile,lingue,skills,contatti,avatar,cv,logo,titolo_sito',
  progetti: 'id,titolo,categoria,anno,descrizione,url,repository,in_evidenza,cover,stack',
  esperienze: 'id,ruolo,organizzazione,tipo,voto,luogo,descrizione,url,inizio,fine,competenze',
  sezioni: 'chiave,etichetta,titolo,sottotitolo',
}

/** Elenco in uso: la variabile d'ambiente se c'e', altrimenti quello stretto. */
const FIELDS = {
  profilo: import.meta.env?.VITE_PROFILO_FIELDS || DEFAULT_FIELDS.profilo,
  progetti: import.meta.env?.VITE_PROGETTI_FIELDS || DEFAULT_FIELDS.progetti,
  esperienze: import.meta.env?.VITE_ESPERIENZE_FIELDS || DEFAULT_FIELDS.esperienze,
  sezioni: import.meta.env?.VITE_SEZIONI_FIELDS || DEFAULT_FIELDS.sezioni,
}

/**
 * Campi che servono alla galleria di un progetto.
 *
 * `immagini` e' una relazione multipla con la libreria dei file, e il valore
 * predefinito di Directus per una relazione sono gli **id delle righe di
 * collegamento** (`[3, 4]`): da un numero non si ricava nessuna immagine,
 * quindi il percorso va chiesto per esteso. La forma che arriva e'
 * `[{ directus_files_id: { id, description, ... } }]`.
 *
 * Verificato sulla tua istanza: la query resta **200 anche se il campo non
 * esiste** (un percorso con il punto viene ignorato), quindi chiedere la
 * galleria non fa fallire i progetti pubblicati prima che il campo esistesse.
 * Un campo inesistente scritto *senza* punto, invece, fa fallire la richiesta:
 * e' la ragione per cui qui il percorso e' sempre annidato — e la ragione per
 * cui in `directus.js` esiste la riprova senza elenco.
 */
const GALLERY_FIELDS = 'immagini.directus_files_id.*'

/** Elenco di campi da chiedere per i progetti, galleria compresa. */
function projectFields(base) {
  if (base.includes('immagini')) return base
  return base ? `${base},${GALLERY_FIELDS}` : `*,${GALLERY_FIELDS}`
}

/**
 * Esito di una collezione opzionale che non si e' potuta leggere.
 *
 * - `missing: true`   la collezione non esiste o Public non ha il permesso. Non
 *                     e' un guasto, e' lavoro in corso: la sezione mostra le
 *                     istruzioni invece di sparire.
 * - `missing: false`  il CMS non risponde. La sezione resta **vuota**: nei suoi
 *                     dati non si mette niente di inventato, e quando il guasto
 *                     riguarda il profilo e' la pagina intera a diventare la
 *                     schermata di manutenzione.
 *
 * Nota verificata sul campo: Directus risponde **403** sia quando una
 * collezione non esiste sia quando manca il permesso Public, con il messaggio
 * "you don't have permission to access collection X or it does not exist".
 * Per una collezione opzionale i due casi sono equivalenti, quindi vanno
 * trattati allo stesso modo.
 */
function failure(error) {
  if (error?.code === 'NOT_FOUND' || error?.code === 'FORBIDDEN') {
    return { source: 'empty', missing: true, items: [], error: null }
  }
  if (!ENABLE_FALLBACK) throw error
  return { source: 'empty', missing: false, items: [], error }
}

/** Ordina i progetti: prima quelli in evidenza, poi dal piu' recente. */
function sortProjects(items) {
  return [...items].sort((a, b) => {
    if (a.inEvidenza !== b.inEvidenza) return a.inEvidenza ? -1 : 1
    const yearA = Number(a.anno) || 0
    const yearB = Number(b.anno) || 0
    return yearB - yearA
  })
}

/**
 * Collezione singleton `profilo`.
 *
 * E' la risorsa da cui dipende la pagina intera, quindi e' l'unica che
 * distingue "il CMS non risponde" da "il CMS ha risposto male": nel primo caso
 * l'esito e' `offline`, e la pagina lo dice con la schermata di manutenzione.
 * Un profilo inventato mostrerebbe al visitatore contenuti che non sono tuoi,
 * che e' peggio di una pagina che ammette di essere offline.
 */
export function useProfile() {
  const loader = useCallback(async (signal) => {
    try {
      const raw = await fetchItem(COLLECTIONS.profilo, { fields: FIELDS.profilo, signal })
      return {
        source: 'directus',
        profile: normalizeProfile(raw),
        error: null,
      }
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (!ENABLE_FALLBACK) throw error

      return { source: 'offline', profile: null, error }
    }
  }, [])

  return useAsyncResource(loader, `profilo:${COLLECTIONS.profilo}:${FIELDS.profilo}`)
}

/** Collezione `progetti`. */
export function useProjects() {
  const loader = useCallback(async (signal) => {
    try {
      const raw = await fetchItems(COLLECTIONS.progetti, {
        fields: projectFields(FIELDS.progetti),
        signal,
      })
      const items = raw.map(normalizeProject).filter(Boolean)
      return { source: 'directus', missing: false, items: sortProjects(items), error: null }
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return failure(error)
    }
  }, [])

  return useAsyncResource(loader, `progetti:${COLLECTIONS.progetti}:${projectFields(FIELDS.progetti)}`)
}

/**
 * Collezione `sezioni`: titoli e sottotitoli delle intestazioni.
 *
 * Non e' una sezione della pagina, e' un dettaglio dei testi: se la collezione
 * non risponde il sito usa i valori scritti in `sectionTexts.js`, quindi qui
 * non c'e' niente da segnalare al visitatore e nessuna sezione da nascondere.
 */
export function useSections() {
  const loader = useCallback(async (signal) => {
    try {
      const raw = await fetchItems(COLLECTIONS.sezioni, { fields: FIELDS.sezioni, signal })
      return { items: raw.map(normalizeSection).filter(Boolean), error: null }
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return { items: [], error }
    }
  }, [])

  return useAsyncResource(loader, `sezioni:${COLLECTIONS.sezioni}:${FIELDS.sezioni}`)
}

/** Collezione `esperienze`: lavoro, studio, certificazioni. */
export function useExperiences() {
  const loader = useCallback(async (signal) => {
    try {
      const raw = await fetchItems(COLLECTIONS.esperienze, { fields: FIELDS.esperienze, signal })
      const items = raw.map(normalizeExperience).filter(Boolean)
      /*
       * Ordinamento lato client: dal piu' recente.
       *
       * Si ordina per data di **fine**, non di inizio, e non si mettono piu' le
       * voci in corso in cima. Due motivi, tutti e due visti in pagina: un
       * percorso di cinque anni cominciato nel 2021 finiva in fondo, sotto
       * esperienze molto piu' vecchie ma piu' brevi; e un volontariato ancora
       * aperto dal 2022 scavalcava un lavoro del 2026 solo perche' non aveva
       * una data di fine. Cosi' invece l'introduzione della sezione, "dalla piu'
       * recente", e' vera: quello che conta e' quando la cosa si e' conclusa.
       * Una voce ancora aperta non ha una fine, quindi si colloca dove e'
       * cominciata.
       */
      const chiusura = (item) => String(item.fine || item.inizio)
      items.sort((a, b) => chiusura(b).localeCompare(chiusura(a)))
      return { source: 'directus', missing: false, items, error: null }
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      return failure(error)
    }
  }, [])

  return useAsyncResource(loader, `esperienze:${COLLECTIONS.esperienze}:${FIELDS.esperienze}`)
}

/**
 * Sonda di connettivita' usata dal pannello di errore: distingue fra rete,
 * permessi Public e collezione mancante.
 */
export function useConnectionDiagnostics({ enabled = false } = {}) {
  const loader = useCallback(async (signal) => {
    const report = {
      baseUrl: DIRECTUS_URL,
      health: 'unknown',
      profilo: 'unknown',
    }

    try {
      await fetchHealth({ signal })
      report.health = 'ok'
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      report.health = error?.code === 'NOT_FOUND' ? 'unsupported' : error?.code || 'unreachable'
    }

    try {
      await fetchItem(COLLECTIONS.profilo, { fields: 'id', signal })
      report.profilo = 'readable'
    } catch (error) {
      if (error?.name === 'AbortError') throw error
      if (error?.status === 403 || error?.status === 401) report.profilo = 'forbidden'
      else if (error?.status === 404) report.profilo = 'not-found'
      else report.profilo = error?.code || 'unreachable'
    }

    return report
  }, [])

  return useAsyncResource(loader, 'diagnostics', { enabled })
}
