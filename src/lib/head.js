/**
 * Metadati della pagina presi dal CMS.
 *
 * I valori in `index.html` restano: sono lo stato iniziale, quello che vede un
 * crawler che non esegue JavaScript (anteprime social, in particolare). Qui li
 * aggiorniamo a runtime quando Directus fornisce qualcosa di diverso, cosi'
 * cambiare titolo, descrizione o immagine social non richiede di ricompilare.
 *
 * Attenzione al limite: l'aggiornamento a runtime vale per i browser e per i
 * motori che eseguono JS. Le anteprime social leggono l'HTML statico, quindi
 * per quelle fa fede `index.html`.
 */

/** Crea o aggiorna un `<meta>`. */
function setMeta(attr, key, content) {
  if (!content) return
  let element = document.head.querySelector(`meta[${attr}="${key}"]`)
  if (!element) {
    element = document.createElement('meta')
    element.setAttribute(attr, key)
    document.head.appendChild(element)
  }
  element.setAttribute('content', content)
}

/** Crea o aggiorna un `<link rel>`. */
function setLink(rel, href, { dropType = false } = {}) {
  if (!href) return
  let element = document.head.querySelector(`link[rel="${rel}"]`)
  if (!element) {
    element = document.createElement('link')
    element.setAttribute('rel', rel)
    document.head.appendChild(element)
  }
  element.setAttribute('href', href)
  // Il tipo dichiarato in `index.html` e' svg: se dal CMS arriva un png, un
  // `type` sbagliato farebbe ignorare l'icona dal browser.
  if (dropType) element.removeAttribute('type')
}

/**
 * Applica i metadati disponibili. Ogni campo e' indipendente: quello che manca
 * resta com'e' scritto in `index.html`.
 */
export function applySiteMeta({ titolo, descrizione, url, immagine, favicon } = {}) {
  if (typeof document === 'undefined') return

  if (titolo) {
    document.title = titolo
    setMeta('property', 'og:title', titolo)
    setMeta('name', 'twitter:title', titolo)
  }

  if (descrizione) {
    setMeta('name', 'description', descrizione)
    setMeta('property', 'og:description', descrizione)
    setMeta('name', 'twitter:description', descrizione)
  }

  if (url) {
    setMeta('property', 'og:url', url)
    setLink('canonical', url)
  }

  if (immagine) {
    setMeta('property', 'og:image', immagine)
    setMeta('name', 'twitter:image', immagine)
  }

  setLink('icon', favicon, { dropType: true })
}
