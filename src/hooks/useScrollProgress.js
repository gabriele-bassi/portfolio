import { useEffect } from 'react'

/**
 * Scrive l'avanzamento di lettura (0..1) nella custom property `--scroll`
 * sull'elemento radice. La barra in alto e quella del rail la consumano via CSS,
 * quindi nessun componente React viene ri-renderizzato durante lo scroll.
 */
export function useScrollProgress() {
  useEffect(() => {
    let frame = 0

    const update = () => {
      frame = 0
      const root = document.documentElement
      const scrollable = root.scrollHeight - window.innerHeight
      const value = scrollable > 0 ? Math.min(1, Math.max(0, window.scrollY / scrollable)) : 0
      root.style.setProperty('--scroll', value.toFixed(4))
    }

    const onScroll = () => {
      // Un solo aggiornamento per frame: lo scroll puo' emettere molti eventi.
      if (!frame) frame = window.requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll, { passive: true })

    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
      if (frame) window.cancelAnimationFrame(frame)
    }
  }, [])
}
