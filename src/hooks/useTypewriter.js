import { useEffect, useState } from 'react'

/**
 * Effetto macchina da scrivere, usato una sola volta sul ruolo nel hero.
 *
 * Scrive senza ciclo: un cursore che riscrive all'infinito distrae. Se l'utente
 * ha chiesto meno animazioni, il testo compare intero e subito.
 */
export function useTypewriter(text, { speed = 52, startDelay = 400 } = {}) {
  const [output, setOutput] = useState('')

  useEffect(() => {
    if (!text) {
      setOutput('')
      return undefined
    }

    const reduce =
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches

    if (reduce) {
      setOutput(text)
      return undefined
    }

    let index = 0
    let timer = 0

    const tick = () => {
      index += 1
      setOutput(text.slice(0, index))
      if (index < text.length) timer = window.setTimeout(tick, speed)
    }

    timer = window.setTimeout(tick, startDelay)
    return () => window.clearTimeout(timer)
  }, [text, speed, startDelay])

  return output
}
