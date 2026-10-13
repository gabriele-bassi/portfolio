import { useEffect, useState } from 'react'
import { FaBars, FaXmark } from 'react-icons/fa6'

import Brand, { brandName } from './Brand.jsx'
import ThemeToggle from './ThemeToggle.jsx'

/**
 * Navigazione a due velocita':
 * - mobile: barra sottile sempre visibile + menu a schermo intero
 * - desktop: rail verticale di icone con etichetta al passaggio del puntatore
 *
 * Entrambe le versioni esistono nel DOM e vengono mostrate via CSS, cosi'
 * non serve alcun listener su `resize`.
 *
 * I contatti non compaiono qui: stanno solo nella sezione Contatti, altrimenti
 * le stesse icone si ripetono tre volte nella pagina.
 */
export default function Nav({ items, activeId, theme, onToggleTheme, profile }) {
  const [open, setOpen] = useState(false)

  // Con il menu aperto il contenuto sotto non deve scorrere.
  useEffect(() => {
    if (!open) return undefined
    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [open])

  useEffect(() => {
    if (!open) return undefined
    const onKeyDown = (event) => {
      if (event.key === 'Escape') setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open])

  const close = () => setOpen(false)

  const label = brandName(profile)

  // Il pallino e' il segno minimo di identita' quando il marchio e' il nome.
  // Con un logo caricato diventerebbero due segni accostati: resta il logo.
  const brand = (
    <>
      {profile?.logoUrl ? null : <span className="brand-dot" aria-hidden="true" />}
      <Brand profile={profile} />
    </>
  )

  return (
    <>
      <header className="bar">
        <a className="bar__brand" href="#top" onClick={close}>
          {brand}
        </a>

        <div className="bar__actions">
          <ThemeToggle theme={theme} onToggle={onToggleTheme} />
          <button
            type="button"
            className="btn btn--icon"
            aria-label="Apri il menu"
            aria-expanded={open}
            aria-controls="menu-principale"
            onClick={() => setOpen(true)}
          >
            <FaBars aria-hidden="true" />
          </button>
        </div>

        <span className="bar__progress" aria-hidden="true" />
      </header>

      {open ? (
        <div
          className="overlay"
          id="menu-principale"
          role="dialog"
          aria-modal="true"
          aria-label="Menu di navigazione"
        >
          <div className="overlay__top">
            <span className="bar__brand">{brand}</span>
            <button
              type="button"
              className="btn btn--icon"
              aria-label="Chiudi il menu"
              onClick={close}
            >
              <FaXmark aria-hidden="true" />
            </button>
          </div>

          <nav className="overlay__nav" aria-label="Sezioni del sito">
            {items.map((item) => (
              <a
                key={item.id}
                className="overlay__item"
                href={`#${item.id}`}
                aria-current={activeId === item.id ? 'true' : undefined}
                onClick={close}
              >
                <span className="overlay__num">{item.num}</span>
                <span className="overlay__label">{item.label}</span>
              </a>
            ))}
          </nav>
        </div>
      ) : null}

      <nav className="rail" aria-label="Navigazione principale">
        <a className="rail__brand" href="#top" aria-label={`Torna all'inizio — ${label}`}>
          <Brand profile={profile} />
        </a>

        <ul className="rail__nav">
          {items.map((item) => {
            const Icon = item.icon
            return (
              <li key={item.id}>
                <a
                  className="rail__link"
                  href={`#${item.id}`}
                  data-label={item.label}
                  aria-label={item.label}
                  aria-current={activeId === item.id ? 'true' : undefined}
                >
                  <Icon aria-hidden="true" />
                </a>
              </li>
            )
          })}
        </ul>

        <ThemeToggle theme={theme} onToggle={onToggleTheme} variant="rail" />
        <span className="rail__progress" aria-hidden="true" />
      </nav>
    </>
  )
}
