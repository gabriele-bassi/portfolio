/**
 * Valori di configurazione condivisi fra il browser e la configurazione di Vite.
 *
 * Sta in un file a parte perche' lo legge anche `vite.config.js`: da questo
 * indirizzo dipende la Content-Security-Policy, quindi se le due copie
 * divergessero la pagina si romperebbe in modo silenzioso (il browser
 * rifiuterebbe le chiamate al CMS senza dire perche' nel codice).
 */

/**
 * Indirizzo predefinito dell'istanza Directus, senza slash finale.
 *
 * E' un valore di ripiego, non l'indirizzo di casa: quello vero vive in
 * `.env.local` (ignorato da git) e, per il sito pubblicato, nella variable
 * `VITE_DIRECTUS_URL` del repository su GitHub. Cosi' il codice che finisce
 * online non racconta com'e' fatta la rete di casa, e chi clona il progetto lo
 * configura senza modificarlo.
 */
export const DEFAULT_DIRECTUS_URL = 'http://localhost:8055'
