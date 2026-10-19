/**
 * Endpoint del form contatti.
 *
 * Il form non ha un backend: la pagina invia nome, email e messaggio
 * direttamente al servizio esterno (Formcarry), che li inoltra per email.
 *
 * Se la variabile e' vuota il form **non viene mostrato**. E' una scelta
 * deliberata: un form che si compila e poi non manda niente e' peggio di un
 * form assente, perche' chi scrive crede di essere stato ascoltato. Appena
 * l'endpoint e' configurato (`VITE_CONTACT_ENDPOINT` in `.env.local` e nelle
 * variable del repository) il form compare da solo.
 *
 * Accettati solo http/https: un valore senza schema finirebbe in un `fetch`
 * relativo al sito, che non esiste.
 */
const raw = String(import.meta.env?.VITE_CONTACT_ENDPOINT ?? '').trim()

export const CONTACT_ENDPOINT = /^https?:\/\/\S+$/i.test(raw) ? raw : ''

export const CONTACT_CONFIGURED = Boolean(CONTACT_ENDPOINT)
