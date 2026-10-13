import { useEffect, useState } from 'react'

/**
 * Individua la sezione attualmente in lettura, per evidenziarla nella
 * navigazione.
 *
 * Il `rootMargin` negativo ritaglia una fascia sottile al centro dello schermo:
 * la sezione che la attraversa e' quella "attiva", il che evita che piu' sezioni
 * risultino attive nello stesso momento.
 */
export function useActiveSection(ids) {
  const key = ids.join('|')
  const [active, setActive] = useState(ids[0] ?? '')

  useEffect(() => {
    if (!key) return undefined

    const elements = key
      .split('|')
      .map((id) => document.getElementById(id))
      .filter(Boolean)

    if (!elements.length) return undefined

    if (typeof IntersectionObserver === 'undefined') return undefined

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)

        if (visible[0]) setActive(visible[0].target.id)
      },
      { rootMargin: '-45% 0px -45% 0px', threshold: 0 },
    )

    elements.forEach((element) => observer.observe(element))
    return () => observer.disconnect()
  }, [key])

  return active
}
