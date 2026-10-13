import { useEffect } from 'react'

/**
 * Comparsa degli elementi `[data-reveal]` allo scroll.
 *
 * Implementato con un controllo geometrico su `getBoundingClientRect` e non con
 * `IntersectionObserver`. La ragione e' concreta: l'observer dipende dalla
 * pipeline di rendering e, se il compositing non avviene (ambienti headless,
 * webview non ancora dipinte, `overflow-x: hidden` sul body che crea un
 * contenitore di scroll), i callback non arrivano mai e il contenuto resta a
 * `opacity: 0`. Un contenuto invisibile e' il guasto peggiore possibile, quindi
 * qui si usa il meccanismo che dipende solo dalla posizione di scroll.
 *
 * Il costo e' trascurabile: gli elementi sono poche decine e ognuno viene
 * rimosso dalla coda appena rivelato.
 *
 * `dependency` serve perche' i contenuti arrivano dal CMS in modo asincrono:
 * quando cambia, gli elementi vengono cercati di nuovo.
 *
 * Da sola quella dipendenza non basta, ed e' un errore che si e' visto in
 * pagina: le viste che cambiano contenuto **da sole** (i filtri dei progetti)
 * rimontano i propri `[data-reveal]` senza che `dependency` cambi, e quei nodi
 * nascevano direttamente a `opacity: 0` per sempre. Il sintomo era che,
 * filtrando per categoria e tornando su "Tutti", le card rimontate sparivano.
 * Per questo c'e' anche un `MutationObserver`: la raccolta non e' piu' una
 * fotografia scattata all'avvio, ma segue il DOM.
 */
export function useReveal(dependency) {
  useEffect(() => {
    // Coda degli elementi noti e non ancora rivelati.
    let pending = []
    let frame = 0

    /** Accoda gli elementi presenti nel DOM e non ancora rivelati. */
    const collect = () => {
      const queued = new Set(pending)
      for (const node of document.querySelectorAll('[data-reveal]:not(.is-visible)')) {
        if (!queued.has(node)) pending.push(node)
      }
    }

    /** Rivela quello che e' entrato nella parte visibile della pagina. */
    const check = () => {
      // Si rivela quando la sommita' dell'elemento entra nell'ultimo 10%.
      const limit = window.innerHeight * 0.9
      pending = pending.filter((node) => {
        // Un elemento tolto dal DOM (per esempio filtrato via) non torna piu':
        // va scartato, altrimenti la coda non si svuota mai.
        if (!node.isConnected) return false
        if (node.getBoundingClientRect().top > limit) return true
        node.classList.add('is-visible')
        return false
      })
    }

    /*
     * Prima passata immediata, di proposito fuori dal rAF: se un fotogramma non
     * arrivasse, con il rAF come unico innesco **tutto** il contenuto resterebbe
     * a `opacity: 0`. E' il guasto che questo hook esiste per evitare, quindi
     * l'innesco non deve dipendere dalla pipeline di rendering. Il rAF resta
     * solo dove serve a raggruppare lo scroll, che e' l'unico evento che arriva
     * a raffica.
     */
    collect()
    check()

    const onScroll = () => {
      if (frame) return
      frame = window.requestAnimationFrame(() => {
        frame = 0
        check()
      })
    }

    /*
     * Gli ascoltatori restano agganciati anche a coda vuota: staccarli era
     * l'altra meta' del guasto, perche' un elemento montato piu' tardi non
     * avrebbe piu' avuto nessuno che lo guardasse. Un fotogramma con la coda
     * vuota non costa niente.
     */
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    /*
     * Si osservano solo i nodi **aggiunti**: cambiare una classe non produce una
     * mutazione `childList`, quindi non c'e' rischio di ciclo. Il filtro su
     * `addedNodes` serve perche' un aggiornamento di solo testo (l'effetto
     * macchina da scrivere sul ruolo) genera mutazioni in continuazione senza
     * aggiungere nulla da rivelare.
     *
     * Qui collect e check girano subito e non via rAF: l'observer consegna gia'
     * le mutazioni raggruppate, l'elemento nuovo e' montato e la posizione di
     * scroll non e' cambiata, quindi non c'e' niente da rimandare.
     */
    const observer = new MutationObserver((records) => {
      if (!records.some((record) => record.addedNodes.length)) return
      collect()
      check()
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      observer.disconnect()
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [dependency])
}
