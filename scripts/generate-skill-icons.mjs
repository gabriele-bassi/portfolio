/**
 * Genera l'indice delle icone per le competenze.
 *
 * Perche' un generatore e non una mappa scritta a mano: le competenze arrivano
 * dal CMS come testo libero ("nodejs", "linux", "bash") mentre i loghi hanno
 * slug che spesso non coincidono ("nodedotjs", "gnubash"). Indicizzando *sia lo
 * slug sia il titolo ufficiale*, la maggior parte dei nomi si risolve da sola:
 * "Node.js" -> "nodejs" -> SiNodedotjs.
 *
 * Due sorgenti, per un motivo verificato: Simple Icons ha rimosso parecchi
 * brand per motivi di licenza (Java, AWS, Microsoft, Windows, Adobe...), proprio
 * alcuni di quelli che un profilo di sistemi elenca per primi. Font Awesome
 * copre quei casi, quindi fa da seconda sorgente, e le due vengono deduplicate
 * per concetto: un logo gia' presente non viene caricato una seconda volta.
 *
 * Il catalogo e' mirato e non l'intero Simple Icons (3.400 voci): ogni icona
 * finisce nel bundle, quindi si tengono le voci plausibili per un portfolio di
 * sistemi, cloud, sicurezza e sviluppo web. L'elenco e' l'unico punto da
 * toccare per aggiungere altro.
 *
 * Ogni voce e' validata contro i pacchetti installati: se non risolve viene
 * segnalata, invece di rompere la build in silenzio.
 *
 * Uso: node scripts/generate-skill-icons.mjs
 *      node scripts/generate-skill-icons.mjs --check   (non scrive, verifica)
 */

import { readFile, writeFile } from 'node:fs/promises'

import { getIconsData } from 'simple-icons/sdk'

const OUTPUT = new URL('../src/lib/skill-icons.generated.js', import.meta.url)
const SI_TYPES = new URL('../node_modules/react-icons/si/index.d.ts', import.meta.url)
const FA_TYPES = new URL('../node_modules/react-icons/fa6/index.d.ts', import.meta.url)

/** Slug di Simple Icons (loghi ufficiali). */
const SICANDIDATES = [
  // Sistemi operativi
  'linux', 'debian', 'ubuntu', 'fedora', 'archlinux', 'redhat', 'centos', 'alpinelinux',
  'opensuse', 'linuxmint', 'kalilinux', 'raspberrypi', 'freebsd', 'proxmox', 'truenas',

  // Virtualizzazione e storage
  'vmware', 'virtualbox', 'synology', 'qnap', 'openzfs', 'unraid',

  // Linguaggi
  'javascript', 'typescript', 'python', 'php', 'go', 'rust', 'gnubash', 'html5', 'css',

  // Frontend
  'react', 'nextdotjs', 'vuedotjs', 'svelte', 'astro', 'vite', 'tailwindcss', 'wordpress',

  // Backend e runtime
  'nodedotjs', 'express', 'django', 'fastapi', 'laravel',

  // Server web, proxy e rete
  'nginx', 'apache', 'openwrt', 'pfsense', 'opnsense', 'wireguard', 'tailscale', 'cisco',
  'mikrotik', 'ubiquiti',

  // Container, orchestrazione e automazione
  'docker', 'kubernetes', 'helm', 'ansible', 'terraform', 'portainer', 'jenkins',
  'githubactions', 'gitlab', 'git', 'github',

  // Cloud
  'googlecloud', 'cloudflare', 'digitalocean', 'hetzner', 'vercel',

  // Database
  'mysql', 'mariadb', 'postgresql', 'sqlite', 'mongodb', 'redis', 'elasticsearch',
  'supabase', 'minio',

  // Sicurezza
  'tryhackme', 'hackthebox', 'wireshark', 'burpsuite', 'metasploit', 'owasp', 'splunk',
  'bitwarden', 'vaultwarden', 'openssl',

  // Monitoraggio
  'grafana', 'prometheus', 'netdata', 'uptimekuma',

  // Servizi self-hosted
  'jellyfin', 'plex', 'nextcloud', 'homeassistant', 'immich', 'paperlessngx',

  // Strumenti
  'neovim', 'obsidian', 'figma', 'gimp', 'libreoffice', 'npm', 'pnpm',

  // Hardware
  'arduino', 'nvidia', 'intel',
]

/**
 * Icone Font Awesome: brand che Simple Icons ha rimosso, piu' le icone
 * concettuali (server, rete, sicurezza) e di formato file, che Simple Icons non
 * ha per natura, essendo un catalogo di loghi.
 *
 * Questo elenco puo' contenere anche voci gia' coperte da Simple Icons: la
 * deduplica qui sotto le scarta da sola.
 */
const FACANDIDATES = [
  // Brand assenti da Simple Icons per licenza
  'FaAws', 'FaWindows', 'FaJava', 'FaSlack', 'FaMicrosoft', 'FaApple', 'FaAndroid',
  'FaNode', 'FaNodeJs', 'FaJs', 'FaSass', 'FaAngular', 'FaGitAlt', 'FaGitkraken',
  'FaJira', 'FaTrello', 'FaAtlassian', 'FaSlack', 'FaSteam', 'FaSpotify', 'FaUnity',
  'FaCcStripe', 'FaPaypal', 'FaShopify', 'FaSalesforce', 'FaBlender',

  // Concetti: non sono loghi, ma sono voci legittime di un elenco di competenze
  'FaServer', 'FaDatabase', 'FaNetworkWired', 'FaShieldHalved', 'FaLock', 'FaUserShield',
  'FaTerminal', 'FaCode', 'FaGlobe', 'FaMobileScreen', 'FaHardDrive', 'FaChartLine',
  'FaRobot', 'FaPalette', 'FaMicrochip', 'FaMemory', 'FaEthernet', 'FaWifi', 'FaSitemap',
  'FaGears', 'FaCubes', 'FaBolt', 'FaBug', 'FaFingerprint', 'FaKey', 'FaLayerGroup',
  'FaInfinity', 'FaScroll', 'FaFolderTree', 'FaDiagramProject', 'FaPlug',
  'FaSatelliteDish', 'FaToolbox', 'FaScrewdriverWrench', 'FaCloud', 'FaEnvelope',
  'FaSdCard', 'FaWaveSquare',

  // Formati di file: produttivita' d'ufficio e multimedia, dove i loghi non
  // esistono piu' (Adobe) o non sono mai esistiti (formati).
  'FaFileLines', 'FaFileExcel', 'FaFileWord', 'FaFilePowerpoint', 'FaFilePdf',
  'FaFileImage', 'FaFileVideo', 'FaFileAudio', 'FaFileZipper', 'FaFileCode',
  'FaImage', 'FaVideo', 'FaMusic', 'FaPrint', 'FaClock', 'FaCloudArrowUp', 'FaUsers',
  'FaHeadset', 'FaGraduationCap',
]

async function loadExports(file) {
  const dts = await readFile(file, 'utf8')
  return new Set([...dts.matchAll(/export declare const (\w+):/g)].map((match) => match[1]))
}

/** Chiave di ricerca: minuscolo, senza accenti, solo alfanumerici. */
function normalize(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/** "nodedotjs" -> "SiNodedotjs". */
function siName(slug) {
  return `Si${slug.charAt(0).toUpperCase()}${slug.slice(1).replace(/-/g, '')}`
}

const siExports = await loadExports(SI_TYPES)
const faExports = await loadExports(FA_TYPES)
const icons = await getIconsData()
const bySlug = new Map(icons.map((icon) => [icon.slug, icon]))

const included = new Map()
const index = new Map()
const skipped = []
const covered = []

/** Indice: slug e titolo ufficiali normalizzati, piu' il nome del componente. */
function indexIcon(entry) {
  for (const key of new Set([normalize(entry.slug), normalize(entry.title)])) {
    if (key && !index.has(key)) index.set(key, entry.name)
  }
}

// 1. Simple Icons: priorita' ai loghi ufficiali.
for (const slug of SICANDIDATES) {
  const data = bySlug.get(slug)
  if (!data) {
    skipped.push(`${slug} — slug assente in simple-icons`)
    continue
  }

  const name = siName(slug)
  if (!siExports.has(name)) {
    skipped.push(`${slug} — react-icons/si non esporta ${name}`)
    continue
  }

  const entry = { name, source: 'si', title: data.title, slug }
  included.set(name, entry)
  indexIcon(entry)
}

// 2. Font Awesome: solo per i concetti che Simple Icons non copre. Un logo gia'
//    presente non viene caricato una seconda volta: sarebbe un secondo SVG per
//    lo stesso marchio, quindi peso inutile nel bundle.
for (const name of FACANDIDATES) {
  if (!faExports.has(name)) {
    skipped.push(`${name} — assente in react-icons/fa6`)
    continue
  }

  const key = normalize(name.slice(2))
  if (index.has(key)) {
    covered.push(`${name} — gia' coperto da Simple Icons`)
    continue
  }

  const entry = { name, source: 'fa', slug: key, title: key }
  included.set(name, entry)
  indexIcon(entry)
}

if (!included.size) {
  console.error('Nessuna icona risolta: controlla le dipendenze simple-icons / react-icons.')
  process.exit(1)
}

const entries = [...included.values()]
const siEntries = entries.filter((entry) => entry.source === 'si')
const faEntries = entries.filter((entry) => entry.source === 'fa')

const lines = [
  '/*',
  ' * FILE GENERATO — non modificare a mano.',
  ' *',
  ' * Per rigenerarlo:  npm run icons',
  ' *',
  ` * Icone: ${entries.length} (${siEntries.length} da Simple Icons, ${faEntries.length} da Font Awesome)`,
  ` * Chiavi di ricerca: ${index.size}`,
  ' *',
  ' * Ogni chiave è uno slug, un titolo ufficiale o il nome dell\'icona,',
  ' * normalizzato in minuscolo senza separatori: così "Node.js", "nodedotjs"',
  ' * e "nodejs" portano tutti alla stessa icona, senza mappature a mano.',
  ' */',
  '',
  'import {',
  ...siEntries.map((entry) => `  ${entry.name},`),
  "} from 'react-icons/si'",
  'import {',
  ...faEntries.map((entry) => `  ${entry.name},`),
  "} from 'react-icons/fa6'",
  '',
  '/** Chiave normalizzata -> componente icona. */',
  'export const SKILL_ICONS = {',
  ...[...index.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, name]) => `  ${key}: ${name},`),
  '}',
  '',
]

const content = lines.join('\n')
const checkOnly = process.argv.includes('--check')

if (checkOnly) {
  const current = await readFile(OUTPUT, 'utf8').catch(() => '')
  if (current === content) {
    console.log(`Indice aggiornato: ${entries.length} icone, ${index.size} chiavi.`)
    process.exit(0)
  }
  console.error('L\'indice delle icone è disallineato: esegui `npm run icons`.')
  process.exit(1)
}

await writeFile(OUTPUT, content, 'utf8')

console.log(`Icone: ${entries.length} (Simple Icons ${siEntries.length}, Font Awesome ${faEntries.length})`)
console.log(`Chiavi di ricerca: ${index.size}`)
console.log('File: src/lib/skill-icons.generated.js')

if (covered.length) {
  console.log(`\nNon duplicate (${covered.length}):`)
  for (const item of covered) console.log(`  - ${item}`)
}

if (skipped.length) {
  console.log(`\nScartate (${skipped.length}):`)
  for (const item of skipped) console.log(`  - ${item}`)
}
