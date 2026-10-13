import Section from '../Section.jsx'
import { richText, useSectionText } from '../../lib/sectionTexts.jsx'

/** Percorso: lavoro, studio, certificazioni. Alimentato dalla collezione `esperienze`. */
export default function Timeline({ num, items, missing }) {
  const text = useSectionText('percorso')

  return (
    <Section
      id="percorso"
      num={num}
      kicker={text.etichetta}
      title={richText(text.titolo)}
      intro={text.sottotitolo}
    >
      {items.length ? (
        <ol className="timeline">
          {items.map((item) => (
            <li
              className={item.inCorso ? 'tl-item tl-item--current' : 'tl-item'}
              key={item.id}
              data-reveal
            >
              <span className="tl-item__when">
                {item.periodo}
                {item.luogo ? ` · ${item.luogo}` : ''}
              </span>

              <div className="tl-item__head">
                <h3 className="tl-item__role">
                  {item.url ? (
                    <a href={item.url} target="_blank" rel="noopener noreferrer">
                      {item.ruolo || item.organizzazione}
                    </a>
                  ) : (
                    item.ruolo || item.organizzazione
                  )}
                </h3>

                {/* Il voto si legge accanto al titolo, non dentro il testo. */}
                {item.voto ? <span className="tl-item__grade">{item.voto}</span> : null}
              </div>

              {item.organizzazione && item.ruolo ? (
                <p className="tl-item__org">{item.organizzazione}</p>
              ) : null}

              {item.descrizione ? <p className="tl-item__text">{item.descrizione}</p> : null}

              {item.tags.length ? (
                <ul className="tl-item__tags">
                  {item.tags.map((tag) => (
                    <li className="project__tag" key={tag.toLowerCase()}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}
            </li>
          ))}
        </ol>
      ) : (
        <div className="placeholder" data-reveal>
          <p className="placeholder__title">
            {missing ? 'Collezione `esperienze` da collegare' : 'Nessuna esperienza pubblicata'}
          </p>
          <p className="empty-note">
            Se la collezione non esiste, creala in Directus con i campi{' '}
            <code>ruolo</code>, <code>organizzazione</code>, <code>tipo</code>,{' '}
            <code>inizio</code>, <code>fine</code>, <code>descrizione</code> e{' '}
            <code>competenze</code>. Se esiste già, abilita il permesso{' '}
            <strong>Public → Read</strong>. Appena ci sono record questa sezione si popola da sola.
          </p>
        </div>
      )}
    </Section>
  )
}
