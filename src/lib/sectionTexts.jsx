import { createContext, useContext } from 'react'

import { str } from './normalize.js'

/**
 * Titoli e sottotitoli delle sezioni.
 *
 * I testi veri vivono nella collezione `sezioni` di Directus: si cambiano dal
 * CMS, senza toccare il codice e senza ricompilare. Quelli scritti qui sotto
 * sono la rete di sicurezza, e servono in due casi soltanto: la collezione non
 * risponde, oppure il record di quella sezione e' stato cancellato. In nessuno
 * dei due il sito deve mostrare una sezione senza titolo.
 *
 * Quando invece il record c'e', i suoi valori vincono **anche se vuoti**: se
 * svuoti il sottotitolo di una sezione, quel sottotitolo sparisce davvero. E'
 * l'unico comportamento che rende prevedibile il CMS: il pulsante "cancella"
 * deve cancellare.
 *
 * Nota sul corsivo: il titolo si scrive con gli asterischi attorno alla parola
 * da evidenziare, per esempio `Cose che ho *costruito*`. Il carattere non e'
 * decorazione: nella testata della sezione quella parola prende colore d'accento
 * e corsivo, ed e' la ragione per cui il titolo non e' un semplice campo testo.
 */
export const SECTION_TEXTS = {
  'chi-sono': {
    etichetta: 'Chi sono',
    titolo: 'Sistemi che reggono, *senza sorprese*',
    sottotitolo: '',
  },
  competenze: {
    etichetta: 'Competenze',
    titolo: 'Cosa so *mettere in produzione*',
    sottotitolo: 'Strumenti e tecnologie che uso davvero, non un elenco di logo.',
  },
  percorso: {
    etichetta: 'Percorso',
    titolo: 'Da dove *vengo*',
    sottotitolo: 'Esperienze, formazione e certificazioni in ordine cronologico, dalla più recente.',
  },
  progetti: {
    etichetta: 'Progetti',
    titolo: 'Cose che ho *costruito*',
    sottotitolo: 'Una selezione di lavori: cosa fa, con cosa è fatto e dove guardarlo.',
  },
  contatti: {
    etichetta: 'Contatti',
    titolo: 'Scrivimi, *parliamone*',
    sottotitolo: 'Per una collaborazione, uno stage o anche solo per una domanda tecnica.',
  },
}

/**
 * Trasforma il testo del CMS in nodi React, evidenziando le parole fra
 * asterischi. Un testo senza asterischi torna cosi' com'e': la funzione non
 * costruisce un array quando non serve.
 *
 * Non e' un interprete di markdown e non vuole esserlo: una sola regola, cosi'
 * quello che scrivi nel CMS e' esattamente quello che leggi in pagina.
 */
export function richText(value) {
  const text = str(value)
  if (!text) return null

  const parts = text.split(/\*([^*]+)\*/g)
  if (parts.length === 1) return text

  return parts.map((part, index) =>
    // Gli indici dispari sono i gruppi catturati, cioe' il testo fra asterischi.
    index % 2 ? <em key={index}>{part}</em> : part,
  )
}

/**
 * Unisce i record del CMS ai valori di partenza.
 * Una chiave sconosciuta viene ignorata: nel CMS la `chiave` e' un elenco
 * chiuso, quindi puo' arrivare solo da un errore, e un record con la chiave
 * sbagliata non deve rubare il titolo a una sezione.
 */
export function buildSectionTexts(records) {
  const texts = { ...SECTION_TEXTS }

  for (const record of records ?? []) {
    const chiave = str(record?.chiave)
    if (!chiave || !(chiave in SECTION_TEXTS)) continue

    texts[chiave] = {
      etichetta: str(record.etichetta),
      titolo: str(record.titolo),
      sottotitolo: str(record.sottotitolo),
    }
  }

  return texts
}

const SectionTextsContext = createContext(null)

/** Rende i testi disponibili a ogni sezione senza passaggi di proprieta'. */
export function SectionTextsProvider({ value, children }) {
  return <SectionTextsContext.Provider value={value}>{children}</SectionTextsContext.Provider>
}

/**
 * Testi di una sezione, per chiave.
 *
 * Se il fornitore manca o la chiave non c'e' si ricade sui valori di partenza:
 * una sezione non resta mai senza intestazione per un problema di dati.
 */
export function useSectionText(chiave) {
  const texts = useContext(SectionTextsContext)
  return texts?.[chiave] ?? SECTION_TEXTS[chiave]
}
