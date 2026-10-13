/**
 * Guscio di sezione.
 *
 * L'intestazione e' il motivo decorativo portante del sito: numero in
 * monospace, filetto sottile, etichetta maiuscola e poi il titolo in serif.
 * E' la parte "editoriale" che sostituisce i vecchi effetti di vetro.
 */
export default function Section({ id, num, kicker, title, intro, children, className = '' }) {
  return (
    <section id={id} className={`section ${className}`.trim()} aria-labelledby={`${id}-title`}>
      <div className="container">
        <header className="section__head" data-reveal>
          <div className="section__meta">
            <span className="section__num">{num}</span>
            <span className="section__rule" aria-hidden="true" />
            {/*
              * L'etichetta si disegna solo se c'e': dal CMS puo' arrivare vuota,
              * e un elemento vuoto lascerebbe un buco di spaziatura in fondo al
              * filetto, che si vede.
              */}
            {kicker ? <span className="section__kicker">{kicker}</span> : null}
          </div>
          {title ? (
            <h2 className="section__title" id={`${id}-title`}>
              {title}
            </h2>
          ) : null}
          {intro ? <p className="section__intro">{intro}</p> : null}
        </header>
        {children}
      </div>
    </section>
  )
}
