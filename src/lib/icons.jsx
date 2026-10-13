/**
 * Registro icone dinamico.
 *
 * L'icona di ogni contatto arriva dal campo `nome_icona` del repeater, quindi
 * deve essere risolta a runtime. La risoluzione prova in ordine:
 *   1. `nome_icona`  (es. "github", "fa-linkedin", "SiFiverr")
 *   2. `piattaforma` (es. "GitHub", "Fiverr")
 *   3. dominio della URL (es. "github.com" -> GitHub)
 *   4. icona generica di link
 *
 * Cosi' un valore scritto male nel CMS non rompe la barra dei contatti.
 */

import {
  FaArrowUpRightFromSquare,
  FaBehance,
  FaBitbucket,
  FaCodepen,
  FaDev,
  FaDiscord,
  FaDribbble,
  FaEnvelope,
  FaFacebook,
  FaFigma,
  FaGitlab,
  FaGithub,
  FaGlobe,
  FaInstagram,
  FaLink,
  FaLinkedin,
  FaMastodon,
  FaMedium,
  FaNpm,
  FaPhone,
  FaRedditAlien,
  FaStackOverflow,
  FaTelegram,
  FaTiktok,
  FaTwitch,
  FaWhatsapp,
  FaWordpress,
  FaXTwitter,
  FaYoutube,
} from 'react-icons/fa6'
import {
  SiFiverr,
  SiFreelancer,
  SiGithubactions,
  SiHomeassistant,
  SiHackthebox,
  SiJellyfin,
  SiKubernetes,
  SiNextcloud,
  SiProxmox,
  SiTryhackme,
  SiUpwork,
} from 'react-icons/si'

/** Icona generica per un contatto non riconosciuto. */
export const FallbackIcon = FaLink

export const SocialIconFallback = FaArrowUpRightFromSquare

const ICONS = {
  // --- piattaforme e social -------------------------------------------------
  github: FaGithub,
  githubpages: FaGithub,
  gh: FaGithub,
  gitlab: FaGitlab,
  bitbucket: FaBitbucket,
  linkedin: FaLinkedin,
  x: FaXTwitter,
  twitter: FaXTwitter,
  xcom: FaXTwitter,
  instagram: FaInstagram,
  facebook: FaFacebook,
  youtube: FaYoutube,
  tiktok: FaTiktok,
  discord: FaDiscord,
  telegram: FaTelegram,
  whatsapp: FaWhatsapp,
  reddit: FaRedditAlien,
  redditAlien: FaRedditAlien,
  mastodon: FaMastodon,
  devto: FaDev,
  dev: FaDev,
  medium: FaMedium,
  twitch: FaTwitch,
  dribbble: FaDribbble,
  behance: FaBehance,
  stackoverflow: FaStackOverflow,
  codepen: FaCodepen,
  figma: FaFigma,
  npm: FaNpm,
  wordpress: FaWordpress,

  // --- freelance ------------------------------------------------------------
  fiverr: SiFiverr,
  upwork: SiUpwork,
  freelancer: SiFreelancer,

  // --- homelab / infra ------------------------------------------------------
  proxmox: SiProxmox,
  tryhackme: SiTryhackme,
  hackthebox: SiHackthebox,
  htbmachines: SiHackthebox,
  homeassistant: SiHomeassistant,
  jellyfin: SiJellyfin,
  nextcloud: SiNextcloud,
  kubernetes: SiKubernetes,
  githubactions: SiGithubactions,

  // --- contatti diretti -----------------------------------------------------
  email: FaEnvelope,
  mail: FaEnvelope,
  gmail: FaEnvelope,
  contatto: FaEnvelope,
  phone: FaPhone,
  telefono: FaPhone,
  cellulare: FaPhone,
  website: FaGlobe,
  sito: FaGlobe,
  web: FaGlobe,
  blog: FaGlobe,
  portfolio: FaGlobe,
}

/** Mappa dominio -> chiave del registro, usata come ultima risorsa. */
const HOSTS = {
  'github.com': 'github',
  'gist.github.com': 'github',
  'gitlab.com': 'gitlab',
  'bitbucket.org': 'bitbucket',
  'linkedin.com': 'linkedin',
  'x.com': 'x',
  'twitter.com': 'x',
  'instagram.com': 'instagram',
  'facebook.com': 'facebook',
  'youtube.com': 'youtube',
  'youtu.be': 'youtube',
  'tiktok.com': 'tiktok',
  'discord.gg': 'discord',
  'discord.com': 'discord',
  't.me': 'telegram',
  'telegram.me': 'telegram',
  'wa.me': 'whatsapp',
  'reddit.com': 'reddit',
  'mastodon.social': 'mastodon',
  'dev.to': 'devto',
  'medium.com': 'medium',
  'twitch.tv': 'twitch',
  'dribbble.com': 'dribbble',
  'behance.net': 'behance',
  'stackoverflow.com': 'stackoverflow',
  'codepen.io': 'codepen',
  'figma.com': 'figma',
  'npmjs.com': 'npm',
  'fiverr.com': 'fiverr',
  'upwork.com': 'upwork',
  'freelancer.com': 'freelancer',
  'tryhackme.com': 'tryhackme',
  'hackthebox.com': 'hackthebox',
  'proxmox.com': 'proxmox',
}

const PREFIXES = ['lucide', 'fa6', 'fa5', 'fab', 'fas', 'far', 'fa', 'si', 'ri', 'bi', 'icon', 'brand']

/** Chiave di ricerca: minuscolo, senza accenti, solo alfanumerici. */
function normalizeKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/** Nome host di una URL, `''` se non valida. */
export function hostOf(url) {
  const raw = String(url ?? '').trim()
  if (!raw) return ''
  try {
    return new URL(raw.includes('://') ? raw : `https://${raw}`).hostname.replace(/^www\./, '')
  } catch {
    return ''
  }
}

/**
 * Cerca un'icona a partire da una singola stringa.
 * Restituisce `null` se non la riconosce, cosi' il chiamante puo' scegliere un
 * ripiego adatto al contesto (una competenza e un contatto non hanno lo stesso).
 */
export function lookupIcon(value) {
  const key = normalizeKey(value)
  if (!key) return null
  if (ICONS[key]) return ICONS[key]

  for (const prefix of PREFIXES) {
    if (key.length > prefix.length + 1 && key.startsWith(prefix)) {
      const stripped = key.slice(prefix.length)
      if (ICONS[stripped]) return ICONS[stripped]
    }
  }
  return null
}

/**
 * Risolve l'icona di un contatto del repeater.
 * Restituisce sempre un componente, mai `null`.
 */
export function resolveContactIcon({ icon, platform, url } = {}) {
  const direct = lookupIcon(icon) || lookupIcon(platform)
  if (direct) return direct
  if (icon && icon !== platform) {
    // `nome_icona` a volte contiene solo un nome di classe non riconosciuto.
    return lookupIcon(platform) || FallbackIcon
  }

  const host = hostOf(url)
  if (host) {
    if (HOSTS[host]) return ICONS[HOSTS[host]]
    // Sottodominio o suffisso: prova il dominio di secondo livello.
    const [, ...rest] = host.split('.')
    const parent = rest.join('.')
    if (parent && HOSTS[parent]) return ICONS[HOSTS[parent]]
  }

  return FallbackIcon
}

/** Etichetta di ripiego quando il CMS non fornisce `piattaforma`. */
export function fallbackLabel(url) {
  const host = hostOf(url)
  if (!host) return 'Link'
  const base = host.split('.').slice(-2, -1)[0] || host
  return base.charAt(0).toUpperCase() + base.slice(1)
}
