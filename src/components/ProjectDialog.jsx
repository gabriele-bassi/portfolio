import { useEffect, useRef, useState } from 'react'
import { FaArrowUpRightFromSquare, FaGithub, FaXmark } from 'react-icons/fa6'

/** Divide la descrizione in paragrafi sulle righe vuote, come fa "Chi sono". */
function toParagraphs(text) {
  return String(text ?? '')
    .split(/\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
}

/**
 * Dettagli di un progetto, in sovraimpressione.
 *
 * Usa l'elemento `dialog` del browser con `showModal()`, e non un pannello
 * costruito a mano, per tre motivi che si vedrebbero tutti in pagina:
 *
 * - finisce nel **livello superiore**, quindi non deve competere in z-index con
 *   la barra sticky e con il rail, che restano sotto per costruzione;
 * - il tasto **Esc** lo chiude senza codice, e il fuoco torna da solo
 *   sull'elemento che era attivo prima, cioe' la card da cui si e' partiti;
 * - il fuoco resta **dentro** il dialogo mentre e' aperto, quindi tabulando non
 *   si finisce a navigare la pagina coperta.
 *
 * Su mobile e' una scheda ancorata in basso, con il resto della pagina visibile
 * sopra: cosi' si capisce che e' una sovraimpressione e resta un punto da
 * toccare per chiuderla, oltre alla X. Da 760 px diventa una scheda centrata.
 */
export default function ProjectDialog({ project, onClose }) {
  const node = useRef(null)
  const [shot, setShot] = useState(0)
  const [shown, setShown] = useState(project)

  /*
   * Il contenuto resta montato un istante piu' a lungo del progetto: chiudendo,
   * il dialogo sparisce subito e senza contenuto non si vedrebbe nessun
   * salto di layout.
   */
  useEffect(() => {
    if (project) setShown(project)
  }, [project])

  // Cambiando progetto si riparte dalla prima immagine.
  useEffect(() => {
    setShot(0)
  }, [project?.id])

  /*
   * Esc non passa da qui: lo gestisce il browser, che poi emette `close`. Senza
   * questo ascoltatore lo stato resterebbe "aperto" e l'effetto qui sotto lo
   * riaprirebbe all'istante, in un ciclo in cui Esc sembra non funzionare.
   */
  useEffect(() => {
    const element = node.current
    if (!element) return undefined

    const onCloseEvent = () => onClose()
    element.addEventListener('close', onCloseEvent)
    return () => element.removeEventListener('close', onCloseEvent)
  }, [onClose])

  useEffect(() => {
    const element = node.current
    if (!element) return

    // `showModal` su un dialogo gia' aperto solleva un'eccezione, quindi lo
    // stato dell'elemento e' la verita': lo stato di React lo segue.
    if (project && !element.open) element.showModal()
    else if (!project && element.open) element.close()
  }, [project])

  // Con la scheda aperta il contenuto sotto non deve scorrere. Stesso metodo
  // del menu mobile, cosi' le due sovraimpressioni si comportano uguale.
  useEffect(() => {
    if (!project) return undefined

    const previous = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = previous
    }
  }, [project])

  const images = shown?.images ?? []
  const current = images[Math.min(shot, Math.max(images.length - 1, 0))]
  const paragraphs = toParagraphs(shown?.descrizione)

  /*
   * Il clic sullo sfondo chiude. Il bersaglio e' il dialogo stesso: la scheda
   * e' figlia, quindi un clic dentro di lei non arriva qui.
   */
  const onBackdrop = (event) => {
    if (event.target === node.current) onClose()
  }

  return (
    <dialog ref={node} className="pdialog" aria-labelledby="pdialog-title" onClick={onBackdrop}>
      {shown ? (
        <article className="pdialog__card">
          <button
            type="button"
            className="pdialog__close"
            onClick={onClose}
            aria-label="Chiudi i dettagli"
          >
            <FaXmark aria-hidden="true" />
          </button>

          <div className="pdialog__scroll">
            {current ? (
              <div className="pdialog__media">
                <img
                  className="pdialog__shot"
                  src={current.url}
                  alt={current.alt || `${shown.titolo || 'Progetto'} — immagine ${shot + 1}`}
                  decoding="async"
                />

                {images.length > 1 ? (
                  <ul className="pdialog__thumbs">
                    {images.map((image, index) => (
                      <li key={image.id}>
                        <button
                          type="button"
                          className="pdialog__thumb"
                          aria-current={index === shot ? 'true' : undefined}
                          aria-label={`Immagine ${index + 1} di ${images.length}`}
                          onClick={() => setShot(index)}
                        >
                          <img src={image.thumbUrl} alt="" loading="lazy" decoding="async" />
                        </button>
                      </li>
                    ))}
                  </ul>
                ) : null}
              </div>
            ) : null}

            <div className="pdialog__body">
              {shown.categoria || shown.anno ? (
                <span className="pdialog__meta">
                  {[shown.categoria, shown.anno].filter(Boolean).join(' · ')}
                </span>
              ) : null}

              <h2 className="pdialog__title" id="pdialog-title">
                {shown.titolo || 'Senza titolo'}
              </h2>

              {shown.ruolo || shown.stato ? (
                <p className="pdialog__role">
                  {[shown.ruolo, shown.stato].filter(Boolean).join(' · ')}
                </p>
              ) : null}

              {paragraphs.map((paragraph, index) => (
                <p className="pdialog__text" key={index}>
                  {paragraph}
                </p>
              ))}

              {shown.tags.length ? (
                <ul className="pdialog__tags">
                  {shown.tags.map((tag) => (
                    <li className="project__tag" key={tag.toLowerCase()}>
                      {tag}
                    </li>
                  ))}
                </ul>
              ) : null}

              {shown.repository || shown.url ? (
                <div className="pdialog__links">
                  {shown.repository ? (
                    <a
                      className="btn btn--ghost"
                      href={shown.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaGithub aria-hidden="true" />
                      Codice
                    </a>
                  ) : null}
                  {shown.url ? (
                    <a
                      className="btn btn--primary"
                      href={shown.url}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <FaArrowUpRightFromSquare aria-hidden="true" />
                      Vedi il progetto
                    </a>
                  ) : null}
                </div>
              ) : null}
            </div>
          </div>
        </article>
      ) : null}
    </dialog>
  )
}
