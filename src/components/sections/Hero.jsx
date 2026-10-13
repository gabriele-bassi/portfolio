import { useState } from 'react'
import { FaArrowDown, FaArrowRight } from 'react-icons/fa6'

import { useTypewriter } from '../../hooks/useTypewriter.js'

/** Prima schermata: ritratto, nome, ruolo e contatti. */
export default function Hero({ profile }) {
  const [imageFailed, setImageFailed] = useState(false)
  const role = useTypewriter(profile.ruolo)

  const showImage = Boolean(profile.avatarUrl) && !imageFailed
  const lead = profile.headline || profile.bio.split('\n')[0] || ''

  return (
    <section className="hero" id="top">
      <div className="container">
        <div className="hero__grid">
          <div className="hero__avatar-cell">
            <div className={showImage ? 'hero__avatar' : 'hero__avatar hero__avatar--fallback'}>
              {showImage ? (
                <img
                  src={profile.avatarUrl}
                  alt={`Ritratto di ${profile.nome || 'profilo'}`}
                  width="900"
                  height="1125"
                  decoding="async"
                  onError={() => setImageFailed(true)}
                />
              ) : (
                <span aria-hidden="true">{profile.initials}</span>
              )}
            </div>
          </div>

          <div className="hero__text">
            {profile.disponibile ? (
              <span className="hero__status">
                <span className="dot-live" aria-hidden="true" />
                Disponibile
              </span>
            ) : null}

            <h1 className="hero__name">{profile.nome || 'Nome non impostato'}</h1>

            {profile.ruolo ? (
              <p className="hero__role">
                {/* Il testo animato non va letto a pezzi dagli screen reader. */}
                <span className="sr-only">{profile.ruolo}</span>
                <span aria-hidden="true">{role}</span>
                <span className="hero__caret" aria-hidden="true" />
              </p>
            ) : null}

            {lead ? <p className="hero__lead">{lead}</p> : null}

            <div className="hero__actions">
              <a className="btn btn--primary" href="#contatti">
                Contattami
                <FaArrowRight aria-hidden="true" />
              </a>
              <a className="btn btn--ghost" href="#progetti">
                Guarda i progetti
              </a>
            </div>
          </div>
        </div>
      </div>

      <span className="hero__scroll" aria-hidden="true">
        scorri
        <FaArrowDown />
      </span>
    </section>
  )
}
