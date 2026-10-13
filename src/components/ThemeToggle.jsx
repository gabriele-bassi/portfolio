/**
 * Icone disegnate a mano su una griglia comune di 24x24.
 *
 * Perche' non quelle di una libreria: le icone di Font Awesome hanno inchiostro
 * di dimensioni molto diverse tra loro (misurato: il sole riempie il suo
 * riquadro, la luna ne occupa l'87% in altezza e il 75% in larghezza), quindi
 * affiancate risultano una grande e una piccola, che si legge come "fuori
 * centro". Con due tracciati che condividono griglia e peso il problema non si
 * pone. Il tratto e' in `currentColor`, quindi segue il tema.
 */

const stroke = {
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round',
}

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...stroke}>
      <circle cx="12" cy="12" r="4.3" />
      <path d="M12 2.9v2.1M12 19v2.1M2.9 12H5M19 12h2.1M5.6 5.6l1.5 1.5M16.9 16.9l1.5 1.5M18.4 5.6l-1.5 1.5M7.1 16.9l-1.5 1.5" />
    </svg>
  )
}

/**
 * Luna crescente centrata: il cerchio esterno e' pieno, quello interno lo
 * intacca da destra in alto. L'inchiostro occupa 2..22 su entrambi gli assi,
 * come il sole, quindi le due icone hanno lo stesso peso ottico.
 */
function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" width="1em" height="1em" aria-hidden="true" {...stroke}>
      <path d="M13.6 2.3a9.7 9.7 0 1 0 8.1 8.1 7.4 7.4 0 0 1-8.1-8.1Z" />
    </svg>
  )
}

/**
 * Slider dark/light.
 *
 * Componente presentazionale: lo stato del tema vive in `App` e viene passato
 * qui, altrimenti i due interruttori (barra mobile e rail desktop) resterebbero
 * disallineati, dato che entrambi esistono nel DOM contemporaneamente.
 */
export default function ThemeToggle({ theme, onToggle, variant = 'bar' }) {
  const isDark = theme === 'dark'
  const label = isDark ? 'Passa al tema chiaro' : 'Passa al tema scuro'

  const icon = (active) => `theme-toggle__icon${active ? ' theme-toggle__icon--active' : ''}`

  return (
    <button
      type="button"
      role="switch"
      aria-checked={isDark}
      aria-label={label}
      title={label}
      onClick={onToggle}
      className={variant === 'rail' ? 'theme-toggle theme-toggle--rail' : 'theme-toggle'}
    >
      <span className="theme-toggle__knob" aria-hidden="true" />
      <span className={icon(!isDark)} aria-hidden="true">
        <SunIcon />
      </span>
      <span className={icon(isDark)} aria-hidden="true">
        <MoonIcon />
      </span>
    </button>
  )
}
