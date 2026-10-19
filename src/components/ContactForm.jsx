import { useState } from 'react'
import { FaCircleCheck, FaCircleExclamation, FaPaperPlane } from 'react-icons/fa6'

import { CONTACT_ENDPOINT } from '../lib/contact.js'

const FIELDS = ['name', 'email', 'message']
const FIELD_MESSAGES = {
  name: 'Controlla il nome.',
  email: "Controlla l'indirizzo email.",
  message: 'Controlla il messaggio.',
}
const TIMEOUT = 15000

/**
 * Form contatti, senza backend.
 *
 * Il messaggio viene inviato con `fetch` all'endpoint configurato (Formcarry) e
 * da li' inoltrato per email. Due dettagli non sono decorativi:
 *
 * - il campo `_gotcha` e' un honeypot: invisibile a chi usa il form, viene
 *   compilato dai bot. Quando non e' vuoto la richiesta non parte affatto e si
 *   mostra lo stesso ringraziamento, cosi' il bot non impara che lo abbiamo
 *   riconosciuto;
 * - l'endpoint e' un dato di build, non un segreto: Formcarry identifica il
 *   form dall'URL. Per questo sta in una variabile `VITE_*` e la CSP la ricava
 *   da sola.
 *
 * Il form e' **non controllato**: lo stato di ogni campo vive nel DOM e al
 * submit si legge con `FormData`. Meno stato da tenere sincronizzato, e il
 * browser continua a fare da solo la validazione di `required` e `type=email`.
 * In React restano solo gli stati che riguardano l'invio.
 */
export default function ContactForm({ email }) {
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [fieldErrors, setFieldErrors] = useState({})

  const sending = status === 'sending'

  /** Toglie l'errore di un campo appena lo si corregge. */
  function clearFeedback(field) {
    if (fieldErrors[field]) {
      setFieldErrors((current) => {
        const next = { ...current }
        delete next[field]
        return next
      })
    }
    if (status === 'error' || status === 'sent') {
      setStatus('idle')
      setError('')
    }
  }

  async function onSubmit(event) {
    event.preventDefault()
    if (sending) return

    // Difesa in profondita': la sezione non monta il form senza endpoint, ma
    // un fetch verso una stringa vuota colpirebbe la pagina stessa.
    if (!CONTACT_ENDPOINT) {
      setError('Il form non è configurato. Puoi scrivermi direttamente via email.')
      setStatus('error')
      return
    }

    const form = event.currentTarget
    const data = new FormData(form)

    if (String(data.get('_gotcha') ?? '').trim()) {
      form.reset()
      setStatus('sent')
      return
    }

    const payload = {
      name: String(data.get('name') ?? '').trim(),
      email: String(data.get('email') ?? '').trim(),
      message: String(data.get('message') ?? '').trim(),
    }

    setStatus('sending')
    setError('')
    setFieldErrors({})

    /*
     * Senza timeout una richiesta appesa lascia il bottone su "Invio…" per
     * sempre. Il controller chiude la fetch e lo stato torna modificabile.
     */
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), TIMEOUT)

    try {
      const response = await fetch(CONTACT_ENDPOINT, {
        method: 'POST',
        headers: {
          Accept: 'application/json',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      })

      // Formcarry risponde JSON anche agli errori: il codice HTTP da solo non
      // basta a distinguere un invio riuscito.
      const result = await response.json().catch(() => null)

      if (Number(result?.code) === 200) {
        form.reset()
        setStatus('sent')
        return
      }

      let invalidFields = 0
      if (Number(result?.code) === 422 && result.errors) {
        const next = {}
        for (const field of FIELDS) {
          if (result.errors[field]) next[field] = FIELD_MESSAGES[field]
        }
        invalidFields = Object.keys(next).length
        setFieldErrors(next)
      }

      setError(
        invalidFields
          ? 'Controlla i campi segnalati e riprova.'
          : 'Il messaggio non è partito. Riprova tra poco.',
      )
      setStatus('error')
    } catch {
      setError('Il servizio non ha risposto. Controlla la connessione e riprova.')
      setStatus('error')
    } finally {
      clearTimeout(timer)
    }
  }

  const fieldProps = (field) => ({
    'aria-invalid': fieldErrors[field] ? 'true' : undefined,
    'aria-describedby': fieldErrors[field] ? `contact-${field}-error` : undefined,
    onInput: () => clearFeedback(field),
  })

  return (
    <form
      className="contact-form"
      onSubmit={onSubmit}
      aria-labelledby="contact-form-title"
      aria-busy={sending}
    >
      <div className="contact-form__head">
        <h3 className="contact-form__title" id="contact-form-title">
          Scrivimi un messaggio
        </h3>
      </div>

      {/*
       * Honeypot: fuori schermo, non raggiungibile con Tab e nascosto alle
       * tecnologie assistive. `display: none` sarebbe piu' semplice ma molti
       * bot lo riconoscono e saltano il campo.
       */}
      <div className="contact-form__trap" aria-hidden="true">
        <label htmlFor="contact-gotcha">Non compilare questo campo</label>
        <input
          id="contact-gotcha"
          name="_gotcha"
          type="text"
          tabIndex={-1}
          autoComplete="off"
        />
      </div>

      <div className="contact-form__grid">
        <div className="contact-form__row">
          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor="contact-name">
              Nome
            </label>
            <input
              id="contact-name"
              name="name"
              type="text"
              autoComplete="name"
              maxLength={100}
              required
              {...fieldProps('name')}
            />
            {fieldErrors.name ? (
              <p className="contact-form__field-error" id="contact-name-error">
                {fieldErrors.name}
              </p>
            ) : null}
          </div>

          <div className="contact-form__field">
            <label className="contact-form__label" htmlFor="contact-email">
              Email
            </label>
            <input
              id="contact-email"
              name="email"
              type="email"
              autoComplete="email"
              inputMode="email"
              spellCheck={false}
              maxLength={200}
              required
              {...fieldProps('email')}
            />
            {fieldErrors.email ? (
              <p className="contact-form__field-error" id="contact-email-error">
                {fieldErrors.email}
              </p>
            ) : null}
          </div>
        </div>

        <div className="contact-form__field">
          <label className="contact-form__label" htmlFor="contact-message">
            Messaggio
          </label>
          <textarea
            id="contact-message"
            name="message"
            rows={5}
            maxLength={4000}
            required
            {...fieldProps('message')}
          />
          {fieldErrors.message ? (
            <p className="contact-form__field-error" id="contact-message-error">
              {fieldErrors.message}
            </p>
          ) : null}
        </div>
      </div>

      <div className="contact-form__actions">
        <button type="submit" className="btn btn--primary contact-form__submit" disabled={sending}>
          <FaPaperPlane aria-hidden="true" />
          {sending ? 'Invio…' : 'Invia messaggio'}
        </button>
        <span className="contact-form__hint">Tutti i campi sono obbligatori.</span>
      </div>

      {status === 'sent' ? (
        <p className="contact-form__status contact-form__status--ok" role="status">
          <FaCircleCheck aria-hidden="true" />
          Messaggio inviato. Ti rispondo appena possibile.
        </p>
      ) : null}

      {status === 'error' ? (
        <p className="contact-form__status contact-form__status--error" role="alert">
          <FaCircleExclamation aria-hidden="true" />
          <span>
            {error}
            {email ? (
              <>
                {' '}
                Puoi anche scrivermi a <a href={`mailto:${email}`}>{email}</a>.
              </>
            ) : null}
          </span>
        </p>
      ) : null}

    </form>
  )
}
