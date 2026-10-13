/**
 * Identità del sito in un solo posto.
 *
 * Prima qui c'erano le iniziali calcolate dal nome ("Gabriele" -> "GA"), che non
 * significavano nulla per chi guardava la pagina. Poi un dominio, che pero' era
 * un'invenzione: nessuno puo' dedurre dal codice quale dominio possiedi.
 * Ora il valore di ripiego e' il nome, che e' un dato reale del profilo.
 *
 * Si sovrascrive con `VITE_SITE_NAME` in `.env.local`.
 */
const env = import.meta.env || {}

export const SITE = {
  name: env.VITE_SITE_NAME || 'Gabriele Bassi',
}
