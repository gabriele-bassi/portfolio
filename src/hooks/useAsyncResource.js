import { useCallback, useEffect, useRef, useState } from 'react'

/**
 * Hook generico per una risorsa asincrona.
 *
 * Gestisce i tre stati richiesti (loading / success / error), annulla la
 * richiesta quando il componente viene smontato o quando cambiano le
 * dipendenze, e ignora gli `AbortError` per non mostrare errori fittizi
 * (importante in React StrictMode, dove gli effetti vengono eseguiti due volte).
 *
 * @param {(signal: AbortSignal) => Promise<any>} loader
 * @param {string} key Dipendenze della richiesta, serializzate in una stringa.
 */
export function useAsyncResource(loader, key, { enabled = true } = {}) {
  const [state, setState] = useState(() => ({
    status: enabled ? 'loading' : 'idle',
    data: null,
    error: null,
  }))
  const [nonce, setNonce] = useState(0)

  const loaderRef = useRef(loader)
  loaderRef.current = loader

  useEffect(() => {
    if (!enabled) {
      setState({ status: 'idle', data: null, error: null })
      return undefined
    }

    const controller = new AbortController()
    let active = true

    setState((prev) => ({ status: 'loading', data: prev.data, error: null }))

    Promise.resolve()
      .then(() => loaderRef.current(controller.signal))
      .then((data) => {
        if (!active) return
        setState({ status: 'success', data, error: null })
      })
      .catch((error) => {
        if (!active) return
        // Smontaggio del componente o cambio di dipendenze: non e' un errore.
        if (error?.name === 'AbortError') return
        setState({ status: 'error', data: null, error })
      })

    return () => {
      active = false
      controller.abort()
    }
  }, [key, enabled, nonce])

  const reload = useCallback(() => setNonce((value) => value + 1), [])

  return { ...state, reload }
}
