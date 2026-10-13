import { useMemo, useState } from 'react'
import { FaArrowUpRightFromSquare, FaChevronRight, FaGithub } from 'react-icons/fa6'

import Section from '../Section.jsx'
import ProjectDialog from '../ProjectDialog.jsx'
import { richText, useSectionText } from '../../lib/sectionTexts.jsx'

const ALL = '__all'

/**
 * Progetti: griglia filtrabile per categoria.
 *
 * La descrizione nella card e' tagliata a tre righe: l'elenco serve a scegliere,
 * non a leggere. Il testo intero, le immagini e i link stanno nella scheda che
 * si apre toccando la card.
 */
export default function Projects({ num, items, missing }) {
  const text = useSectionText('progetti')

  const [filter, setFilter] = useState(ALL)
  // Il progetto aperto in sovraimpressione, non il suo id: cosi' la scheda
  // continua a mostrare i suoi dati anche se la griglia cambia sotto.
  const [opened, setOpened] = useState(null)

  const categories = useMemo(() => {
    const unique = new Set()
    for (const project of items) {
      if (project.categoria) unique.add(project.categoria)
    }
    return [...unique]
  }, [items])

  // I progetti in evidenza salgono in cima. `sort` e' stabile, quindi dentro i
  // due gruppi resta l'ordine di arrivo dal CMS, che il CMS puo' controllare.
  const ordered = useMemo(
    () => [...items].sort((a, b) => Number(b.inEvidenza) - Number(a.inEvidenza)),
    [items],
  )

  // Se i contenuti cambiano, un filtro non piu' valido non deve svuotare la griglia.
  const active = filter === ALL || categories.includes(filter) ? filter : ALL
  const visible = active === ALL ? ordered : ordered.filter((p) => p.categoria === active)

  return (
    <Section
      id="progetti"
      num={num}
      kicker={text.etichetta}
      title={richText(text.titolo)}
      intro={text.sottotitolo}
    >
      {items.length ? (
        <>
          {categories.length ? (
            <div className="filters" role="group" aria-label="Filtra i progetti per categoria">
              <button
                type="button"
                className="filter"
                aria-pressed={active === ALL}
                onClick={() => setFilter(ALL)}
              >
                Tutti
              </button>
              {categories.map((category) => (
                <button
                  type="button"
                  className="filter"
                  key={category}
                  aria-pressed={active === category}
                  onClick={() => setFilter(category)}
                >
                  {category}
                </button>
              ))}
            </div>
          ) : null}

          <ul className="projects">
            {visible.map((project) => (
              <li className="project" key={project.id} data-reveal>
                {project.coverUrl ? (
                  <img
                    className="project__cover"
                    src={project.coverUrl}
                    alt=""
                    loading="lazy"
                    decoding="async"
                  />
                ) : null}

                <div className="project__body">
                  {project.categoria || project.anno ? (
                    <span className="project__meta">
                      {[project.categoria, project.anno].filter(Boolean).join(' · ')}
                    </span>
                  ) : null}

                  <h3 className="project__title">
                    {/*
                     * Il titolo e' il bottone che apre i dettagli, ma il suo
                     * bersaglio copre tutta la card: la scheda si apre anche
                     * toccando la copertina o la descrizione. Cosi' c'e' un solo
                     * elemento da raggiungere con la tastiera, non ce ne sono di
                     * annidati, e i due link in fondo restano cliccabili.
                     */}
                    <button
                      type="button"
                      className="project__open"
                      aria-haspopup="dialog"
                      onClick={() => setOpened(project)}
                    >
                      {project.titolo || 'Senza titolo'}
                    </button>
                  </h3>

                  {project.descrizione ? (
                    <p className="project__text">{project.descrizione}</p>
                  ) : null}

                  {project.tags.length ? (
                    <ul className="project__tags">
                      {project.tags.map((tag) => (
                        <li className="project__tag" key={tag.toLowerCase()}>
                          {tag}
                        </li>
                      ))}
                    </ul>
                  ) : null}

                  <div className="project__links">
                    {/*
                     * Non e' un link: e' l'invito a toccare la card, e serve
                     * soprattutto su mobile, dove non c'e' il passaggio del
                     * puntatore a suggerire che la scheda si apre.
                     */}
                    <span className="project__more">
                      Dettagli
                      <FaChevronRight aria-hidden="true" />
                    </span>

                    {project.repository ? (
                      <a
                        className="project__link"
                        href={project.repository}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaGithub aria-hidden="true" />
                        Codice
                      </a>
                    ) : null}
                    {project.url ? (
                      <a
                        className="project__link"
                        href={project.url}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <FaArrowUpRightFromSquare aria-hidden="true" />
                        Vedi
                      </a>
                    ) : null}
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <ProjectDialog project={opened} onClose={() => setOpened(null)} />
        </>
      ) : (
        <div className="placeholder" data-reveal>
          <p className="placeholder__title">
            {missing ? 'Collezione `progetti` da popolare' : 'Nessun progetto pubblicato'}
          </p>
          <p className="empty-note">
            La sezione è già collegata a <code>/items/{'{progetti}'}</code>: crea i record in
            Directus con <code>titolo</code>, <code>descrizione</code>, <code>categoria</code>,{' '}
            <code>anno</code>, <code>cover</code>, <code>stack</code>, <code>repository</code> e{' '}
            <code>url</code>, e compariranno qui con i filtri per categoria.
          </p>
        </div>
      )}
    </Section>
  )
}
