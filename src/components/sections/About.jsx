import { FaDownload } from 'react-icons/fa6'

import Section from '../Section.jsx'
import { richText, useSectionText } from '../../lib/sectionTexts.jsx'

/** Divide il testo in paragrafi sulle righe vuote. */
function toParagraphs(text) {
  return String(text)
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Righe della scheda "Chi sono".
 *
 * Nessun contatto qui: e-mail e social compaiono solo nella sezione Contatti,
 * altrimenti lo stesso invito a scrivere si ripete in due punti della pagina.
 */
function quickFacts(profile) {
  const rows = []

  if (profile.stato) rows.push({ label: 'Posizione', value: profile.stato })
  if (profile.localita) rows.push({ label: 'Dove', value: profile.localita })
  if (profile.lingue.length) {
    rows.push({
      label: 'Lingue',
      value: profile.lingue
        .map((lingua) => (lingua.livello ? `${lingua.nome} · ${lingua.livello}` : lingua.nome))
        .join(', '),
    })
  }
  if (profile.disponibile) rows.push({ label: 'Disponibilità', value: 'Aperto a nuove opportunità' })

  return rows
}

/** Sezione biografica: racconto a sinistra, dettagli rapidi a destra. */
export default function About({ num, profile }) {
  const text = useSectionText('chi-sono')
  const paragraphs = toParagraphs(profile.bio)
  const facts = quickFacts(profile)

  return (
    <Section id="chi-sono" num={num} kicker={text.etichetta} title={richText(text.titolo)}>
      <div className="about">
        <div className="about__bio" data-reveal>
          {paragraphs.length ? (
            paragraphs.map((paragraph, index) => <p key={index}>{paragraph}</p>)
          ) : (
            <p className="empty-note">
              Il campo <code>bio</code> è vuoto: compilalo in Directus per far comparire il testo.
            </p>
          )}
        </div>

        {/*
          * La colonna compare solo se ha qualcosa da dire: senza dati resta un
          * riquadro vuoto, che e' peggio di una sezione a una colonna.
          */}
        {facts.length || profile.cvUrl ? (
          <div data-reveal>
            <dl className="facts">
              {facts.map((row) => (
                <div className="facts__row" key={row.label}>
                  <dt>{row.label}</dt>
                  <dd>{row.value}</dd>
                </div>
              ))}

              {profile.cvUrl ? (
                <div className="facts__row">
                  <dt>Curriculum</dt>
                  <dd>
                    <a href={profile.cvUrl} target="_blank" rel="noopener noreferrer">
                      <FaDownload aria-hidden="true" style={{ marginRight: 6 }} />
                      Scarica il PDF
                    </a>
                  </dd>
                </div>
              ) : null}
            </dl>
          </div>
        ) : null}
      </div>
    </Section>
  )
}
