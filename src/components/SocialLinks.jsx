import { fallbackLabel, resolveContactIcon } from '../lib/icons.jsx'

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

/**
 * Costruisce l'URL navigabile di un contatto.
 * Il repeater puo' contenere `mailto:`, `tel:`, una URL completa, un indirizzo
 * email nudo oppure un dominio senza schema.
 */
export function hrefFor({ url }) {
  const raw = String(url ?? '').trim()
  if (!raw) return null
  if (/^(https?:|mailto:|tel:)/i.test(raw)) return raw
  if (EMAIL_RE.test(raw)) return `mailto:${raw}`
  return `https://${raw.replace(/^\/+/, '')}`
}

/**
 * Barra dei contatti generata dal campo repeater `contatti` di Directus.
 * Ogni voce diventa un'icona vettoriale risolta dinamicamente da `nome_icona`.
 */
export default function SocialLinks({ contacts = [] }) {
  if (!contacts.length) {
    return <p className="empty-note">Il campo repeater `contatti` non contiene voci.</p>
  }

  return (
    <ul className="socials">
      {contacts.map((contact, index) => {
        const Icon = resolveContactIcon(contact)
        const href = hrefFor(contact)
        const label = contact.platform || fallbackLabel(contact.url)
        const isEmail = href?.startsWith('mailto:')

        const inner = (
          <>
            <Icon aria-hidden="true" />
            <span>{label}</span>
          </>
        )

        return (
          <li key={`${label}-${index}`}>
            {href ? (
              <a
                className="social"
                href={href}
                title={contact.url}
                target={isEmail ? undefined : '_blank'}
                rel={isEmail ? undefined : 'me noopener noreferrer'}
              >
                {inner}
              </a>
            ) : (
              <span className="social" aria-disabled="true">
                {inner}
              </span>
            )}
          </li>
        )
      })}
    </ul>
  )
}
