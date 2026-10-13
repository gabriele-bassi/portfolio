import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'gb-theme'
const MEDIA = '(prefers-color-scheme: light)'

/** Tema salvato, se valido. */
function storedTheme() {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    return value === 'light' || value === 'dark' ? value : null
  } catch {
    return null
  }
}

/** Tema di sistema, usato quando l'utente non ha ancora scelto. */
export function systemTheme() {
  if (typeof window === 'undefined' || !window.matchMedia) return 'dark'
  return window.matchMedia(MEDIA).matches ? 'light' : 'dark'
}

/** Tema effettivamente applicato in questo momento. */
export function currentTheme() {
  if (typeof document === 'undefined') return 'dark'
  const attr = document.documentElement.dataset.theme
  return attr === 'light' || attr === 'dark' ? attr : 'dark'
}

function persist(theme) {
  try {
    localStorage.setItem(STORAGE_KEY, theme)
  } catch {
    /* storage non disponibile (Safari privato): il tema resta solo in memoria */
  }
}

/**
 * Gestisce dark/light: applica il tema sull'elemento radice e lo ricorda.
 * Finche' l'utente non sceglie, segue le preferenze di sistema in tempo reale.
 */
export function useTheme() {
  const [theme, setThemeState] = useState(currentTheme)

  const setTheme = useCallback((next) => {
    document.documentElement.dataset.theme = next
    persist(next)
    setThemeState(next)
  }, [])

  const toggleTheme = useCallback(() => {
    setTheme(currentTheme() === 'dark' ? 'light' : 'dark')
  }, [setTheme])

  // Cambio di tema di sistema, solo se l'utente non ha mai scelto.
  useEffect(() => {
    if (storedTheme()) return undefined
    const query = window.matchMedia(MEDIA)
    const onChange = () => setTheme(query.matches ? 'light' : 'dark')
    query.addEventListener('change', onChange)
    return () => query.removeEventListener('change', onChange)
  }, [setTheme])

  return { theme, setTheme, toggleTheme }
}
