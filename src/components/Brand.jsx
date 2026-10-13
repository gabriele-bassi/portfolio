import { useEffect, useState } from 'react'

import { SITE } from '../lib/site.js'

/** Nome da usare quando non c'e' un logo: nome del profilo, poi configurazione. */
export function brandName(profile) {
  return profile?.nome || SITE.name
}

/**
 * Marchio del sito: l'immagine caricata in Directus (`profilo.logo`) se c'e',
 * altrimenti il nome scritto come testo.
 *
 * Il ripiego scatta anche quando l'immagine non si carica: un campo `logo`
 * riempito con del testo produrrebbe una URL di asset inesistente, e senza
 * questo controllo il sito resterebbe con un'immagine rotta in alto a sinistra.
 */
export default function Brand({ profile, className }) {
  const [failed, setFailed] = useState(false)
  const logo = profile?.logoUrl
  const nome = brandName(profile)

  // Se il logo cambia, il tentativo di caricarlo riparte.
  useEffect(() => {
    setFailed(false)
  }, [logo])

  if (logo && !failed) {
    return (
      <img
        className={className ? `${className} brand__logo` : 'brand__logo'}
        src={logo}
        alt={nome}
        decoding="async"
        onError={() => setFailed(true)}
      />
    )
  }

  return <>{nome}</>
}
