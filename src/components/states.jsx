import { useEffect } from 'react'
import { FaCircleExclamation, FaRotateRight } from 'react-icons/fa6'

import { DIRECTUS_URL, isMixedContent } from '../lib/directus.js'
import { useConnectionDiagnostics } from '../hooks/useContent.js'

/** Skeleton della prima schermata: ricalca il hero per non far saltare il layout. */
export function BootSkeleton() {
  return (
    <div className="container">
      <div className="boot" aria-busy="true" aria-live="polite">
        <span className="sr-only">Caricamento dei contenuti dal CMS…</span>
        <span className="skeleton boot__avatar" />
        <span className="skeleton boot__name" />
        <span className="skeleton boot__line boot__lead" />
        <span className="skeleton boot__line boot__meta" />
        <span className="skeleton boot__line boot__chips" />
      </div>
    </div>
  )
}

function healthLabel(value) {
  return (
    {
      ok: 'raggiungibile',
      // `/server/health` risponde 403 agli anonimi: per la diagnostica
      // significa "server raggiungibile, endpoint protetto".
      FORBIDDEN: 'raggiungibile (health protetto)',
      forbidden: 'permessi insufficienti (403)',
      readable: 'lettura consentita',
      'not-found': 'collezione non trovata',
      unsupported: 'endpoint non disponibile',
      unreachable: 'non raggiungibile',
      NETWORK: 'errore di rete',
      TIMEOUT: 'timeout',
      unknown: 'sconosciuto',
    }[value] || value
  )
}

/** Suggerimenti mirati in base all'esito delle sonde. */
function buildHints(report) {
  const hints = []
  const serverReachable = report.health === 'ok' || report.health === 'FORBIDDEN'

  if (isMixedContent()) {
    hints.push(
      'La pagina è servita in HTTPS ma Directus è in HTTP: il browser blocca la richiesta (mixed content). Serve un reverse proxy o un tunnel con TLS.',
    )
  }

  if (report.health === 'unreachable' || report.health === 'NETWORK') {
    hints.push(
      `Directus non risponde su ${DIRECTUS_URL}: verifica che il servizio sia attivo e che il dispositivo sia sulla stessa rete o VPN.`,
    )
  }

  if (serverReachable && (report.profilo === 'forbidden' || report.profilo === 'FORBIDDEN')) {
    hints.push(
      'Directus risponde ma la lettura di `profilo` è negata: abilita il permesso Public → Read sulla collezione e sul campo `contatti`.',
    )
  }

  if (report.profilo === 'not-found') {
    hints.push(
      'La collezione `profilo` non è raggiungibile: controlla il nome e che sia configurata come singleton.',
    )
  }

  if (!hints.length) {
    hints.push('Controlla la console del browser per il dettaglio della richiesta fallita.')
  }

  return hints
}

/** Errore bloccante, mostrato solo quando il fallback è disattivato. */
export function ErrorState({ error, onRetry }) {
  const { status, data: report } = useConnectionDiagnostics({ enabled: true })
  const hints = report ? buildHints(report) : []

  return (
    <div className="section">
      <div className="container">
        <div className="alert alert--error">
          <div className="alert__head">
            <FaCircleExclamation className="alert__icon" aria-hidden="true" />
            <div>
              <h1 className="alert__title">Impossibile caricare i contenuti</h1>
              <p className="alert__text">
                {error?.message || 'Errore sconosciuto durante la chiamata al CMS.'}
              </p>
            </div>
          </div>

          {error?.url ? <p className="alert__url">{error.url}</p> : null}

          <dl className="diagnostics">
            <div className="diagnostics__row">
              <dt>Endpoint</dt>
              <dd>{DIRECTUS_URL}</dd>
            </div>
            <div className="diagnostics__row">
              <dt>Server</dt>
              <dd>{status === 'loading' ? 'verifica…' : healthLabel(report?.health)}</dd>
            </div>
            <div className="diagnostics__row">
              <dt>Collezione profilo</dt>
              <dd>{status === 'loading' ? 'verifica…' : healthLabel(report?.profilo)}</dd>
            </div>
          </dl>

          <ul className="alert__hints">
            {hints.map((hint) => (
              <li key={hint}>{hint}</li>
            ))}
          </ul>

          <div className="alert__actions">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <FaRotateRight aria-hidden="true" />
              Riprova
            </button>
            <span className="alert__note">
              Schermata di manutenzione disattivata (<code>VITE_ENABLE_FALLBACK=false</code>).
            </span>
          </div>
        </div>
      </div>
    </div>
  )
}

/**
 * Schermata di manutenzione: il CMS non risponde.
 *
 * Prende tutta la pagina, e non un avviso in cima, perché in questo stato non
 * c'è niente di cui fidarsi: la navigazione punterebbe a sezioni che non
 * esistono e il piè di pagina parlerebbe di un sito che non c'è. Meglio una
 * pagina sola, che dice una cosa vera.
 *
 * Il grafico è disegnato con i fogli di stile, non con un'immagine: le
 * immagini di questo sito le serve Directus, quindi proprio quando serve non
 * sarebbero disponibili.
 *
 * Un tentativo automatico ogni mezzo minuto: se il CMS torna su, la pagina si
 * riprende da sola anche con il visitatore fermo qui. Durante il tentativo la
 * risorsa resta in `loading` conservando l'ultimo esito, quindi la schermata
 * non lampeggia.
 *
 * La schermata non spiega e non chiede niente: nessun pulsante, nessuna nota
 * sull'indirizzo, nessuna frase sulle riprove. Chi legge deve solo capire che
 * il sito non e' perso, e il radar lo dice da solo.
 */
export function Maintenance({ onRetry, ogniMs = 30000 }) {
  useEffect(() => {
    const id = setInterval(onRetry, ogniMs)
    return () => clearInterval(id)
  }, [onRetry, ogniMs])

  return (
    <div className="maint">
      <div className="maint__panel">
        <div className="maint__radar" aria-hidden="true">
          <span className="maint__griglia" />
          <span className="maint__spazzata" />
          <span className="maint__punto" />
        </div>

        <span className="maint__label">Manutenzione</span>

        <h1 className="maint__title">
          Torno <em>tra poco</em>
        </h1>
      </div>
    </div>
  )
}

/** Il CMS risponde ma il singleton `profilo` è vuoto. */
export function EmptyProfile({ onRetry }) {
  return (
    <div className="section">
      <div className="container">
        <div className="alert alert--error">
          <div className="alert__head">
            <FaCircleExclamation className="alert__icon" aria-hidden="true" />
            <div>
              <h1 className="alert__title">Profilo non compilato</h1>
              <p className="alert__text">
                Directus ha risposto correttamente ma il singleton <code>profilo</code> è vuoto.
                Compila i campi dal CMS e ricarica.
              </p>
            </div>
          </div>
          <div className="alert__actions">
            <button type="button" className="btn btn--primary" onClick={onRetry}>
              <FaRotateRight aria-hidden="true" />
              Ricarica
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
