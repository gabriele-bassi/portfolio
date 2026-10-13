import { SKILL_ICONS } from './skill-icons.generated.js'

/**
 * Risoluzione automatica dell'icona di una competenza.
 *
 * L'utente scrive il nome nel CMS ("docker", "bash", "rete") e l'icona compare
 * da sola: nessuna mappatura da mantenere a mano.
 *
 * Funziona in quattro passaggi, dal piu' preciso al piu' permissivo:
 *   1. alias espliciti, per i casi che nessuna normalizzazione puo' indovinare
 *      ("bash" -> gnubash, "k8s" -> kubernetes, "rete" -> networkwired);
 *   2. indice generato, che contiene slug e titoli ufficiali normalizzati
 *      ("Node.js", "nodedotjs" e "nodejs" arrivano tutti alla stessa icona);
 *   3. varianti del nome (singolare/plurale, trattini, spazi, ".js");
 *   4. nessuna icona: il chip resta col suo punto di accento.
 */

/**
 * Alias per i casi che la normalizzazione non copre: nomi comuni diversi dallo
 * slug ufficiale, abbreviazioni e voci italiane di concetto.
 * Il valore e' una chiave presente nell'indice generato.
 */
const ALIASES = {
  // nomi comuni diversi dallo slug
  bash: 'gnubash',
  shell: 'gnubash',
  sh: 'gnubash',
  node: 'nodejs',
  next: 'nextdotjs',
  vue: 'vuedotjs',
  postgres: 'postgresql',
  psql: 'postgresql',
  mongo: 'mongodb',
  k8s: 'kubernetes',
  kube: 'kubernetes',
  win: 'windows',
  macos: 'apple',
  osx: 'apple',
  aws: 'aws',
  gcp: 'googlecloud',
  azure: 'microsoft',
  go: 'go',
  golang: 'golang',
  rgpd: 'shieldhalved',
  gdpr: 'shieldhalved',
  vm: 'virtualbox',
  nas: 'synology',
  ci: 'githubactions',
  cdn: 'cloudflare',
  vpn: 'wireguard',

  // voci di concetto, italiane e inglesi
  rete: 'networkwired',
  reti: 'networkwired',
  networking: 'networkwired',
  network: 'networkwired',
  server: 'server',
  serveri: 'server',
  sicurezza: 'shieldhalved',
  security: 'shieldhalved',
  firewall: 'shieldhalved',
  hardening: 'shieldhalved',
  crittografia: 'lock',
  encryption: 'lock',
  backup: 'harddrive',
  storage: 'database',
  database: 'database',
  db: 'database',
  cloud: 'cloud',
  virtualizzazione: 'cubes',
  virtualization: 'cubes',
  container: 'cubes',
  infrastruttura: 'cubes',
  automazione: 'robot',
  automation: 'robot',
  scripting: 'terminal',
  monitoraggio: 'chartline',
  monitoring: 'chartline',
  osservabilita: 'chartline',
  hardware: 'microchip',
  memoria: 'memory',
  ram: 'memory',
  cpu: 'microchip',
  terminale: 'terminal',
  cli: 'terminal',
  shellscript: 'terminal',
  web: 'globe',
  frontend: 'code',
  backend: 'server',
  sviluppo: 'code',
  dev: 'code',
  programmazione: 'code',
  mobile: 'mobilescreen',
  design: 'palette',
  grafica: 'palette',
  documentazione: 'scroll',
  docs: 'scroll',
  troubleshooting: 'bug',
  debugging: 'bug',
  incidenti: 'bug',
  accessibilita: 'fingerprint',
  postaelettronica: 'envelope',
  email: 'envelope',
  mail: 'envelope',
  networkingbase: 'networkwired',
  virtualizzazionevm: 'virtualbox',

  // Marchi che Simple Icons ha rimosso per licenza e che Font Awesome non ha:
  // senza alias resterebbero senza icona.
  zabbix: 'chartline',
  nmap: 'satellitedish',
  unifi: 'ubiquiti',
  'activedirectory': 'usershield',
  directory: 'usershield',
  'hyperv': 'cubes',
  hypervisor: 'cubes',
  esxi: 'vmware',
  vsphere: 'vmware',
  'office': 'microsoftoffice',
  '365': 'microsoftoffice',
  'ad': 'usershield',
  'gpo': 'usershield',
  'dns': 'sitemap',
  'dhcp': 'sitemap',
  'smb': 'foldertree',
  'nfs': 'foldertree',
  'raid': 'harddrive',
  'bios': 'microchip',
  'uefi': 'microchip',
  'poe': 'plug',
  'fibra': 'ethernet',
  'ftth': 'ethernet',
  'lan': 'ethernet',
  'wan': 'ethernet',
  'voip': 'plug',
  'ssl': 'lock',
  'tls': 'lock',
  'ssh': 'terminal',
  'rdp': 'mobilescreen',
  'api': 'plug',
  'rest': 'plug',
  'sql': 'database',
  'nosql': 'database',
  'kvm': 'cubes',
  'lxc': 'cubes',
  'la': 'code',

  // Suite d'ufficio e grafica: nessun logo disponibile, quindi il concetto.
  microsoftoffice: 'filelines',
  office: 'filelines',
  excel: 'fileexcel',
  foglio: 'fileexcel',
  'foglidicalcolo': 'fileexcel',
  spreadsheet: 'fileexcel',
  word: 'fileword',
  documenti: 'fileword',
  testo: 'fileword',
  powerpoint: 'filepowerpoint',
  presentazioni: 'filepowerpoint',
  slide: 'filepowerpoint',
  pdf: 'filepdf',
  csv: 'filecsv',
  outlook: 'envelope',
  teams: 'users',
  collaborazione: 'users',
  onedrive: 'cloud',
  sharepoint: 'foldertree',
  edge: 'globe',
  browser: 'globe',
  navigazione: 'globe',
  photoshop: 'image',
  illustrator: 'image',
  indesign: 'image',
  lightroom: 'image',
  canva: 'image',
  affinity: 'image',
  acrobat: 'filepdf',
  fotoritocco: 'image',
  graficavettoriale: 'image',
  premiere: 'filevideo',
  aftereffects: 'filevideo',
  montaggio: 'filevideo',
  videoediting: 'filevideo',
  handbrake: 'filevideo',
  multimedia: 'filevideo',
  audio: 'fileaudio',
  musica: 'fileaudio',
  wiki: 'scroll',
  wikijs: 'scroll',
  documentazionetecnica: 'scroll',
  rsync: 'harddrive',
  restic: 'harddrive',
  duplicati: 'harddrive',
  veeam: 'harddrive',
  gigabyte: 'microchip',
  westerndigital: 'harddrive',
  seagate: 'harddrive',
  stampa: 'print',
  stampante: 'print',
  stampanti: 'print',
  schedulazione: 'clock',
  cron: 'clock',
  task: 'clock',
  sincronizzazione: 'cloudarrowup',
  sync: 'cloudarrowup',
  upload: 'cloudarrowup',
  'tcpip': 'networkwired',
  antivirus: 'shieldhalved',
  endpoint: 'shieldhalved',
  zfs: 'openzfs',
  san: 'harddrive',
  assistenza: 'screwdriverwrench',
  tecnica: 'screwdriverwrench',
  tecnico: 'screwdriverwrench',
  supporto: 'screwdriverwrench',
  manutenzione: 'screwdriverwrench',
  'helpdesk': 'headset',
  'assistenzaclienti': 'headset',
  teamwork: 'users',
  lavoroingruppo: 'users',
  formazione: 'graduationcap',
  docenza: 'graduationcap',
  corsi: 'graduationcap',
  teaching: 'graduationcap',
}

/** Chiave di ricerca: minuscolo, senza accenti, solo alfanumerici. */
export function iconKey(value) {
  return String(value ?? '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]/g, '')
}

/**
 * L'indice e' importato staticamente di proposito. Caricarlo in un chunk a
 * parte non alleggerisce il primo caricamento: `icons.jsx` importa gia' da
 * react-icons, quindi le icone condivise finiscono comunque nel chunk
 * principale e l'unica cosa che resterebbe separata sarebbe la mappa dei nomi.
 * Importandolo qui le icone ci sono dal primo render, senza comparse tardive.
 */
export { SKILL_ICONS }

/** Cerca un'icona nell'indice, provando anche alcune varianti del nome. */
function lookup(table, key) {
  if (!key) return null
  if (table[key]) return table[key]

  // Varianti: singolare/plurale, suffisso .js gia' rimosso, "js" finale.
  const variants = [key.replace(/s$/, ''), `${key}s`, key.replace(/js$/, ''), `${key}js`]
  for (const variant of variants) {
    if (variant && table[variant]) return table[variant]
  }
  return null
}

/**
 * Ultima risorsa: confronto per contenimento.
 *
 * Serve per due casi che nessuna tabella di alias puo' coprire in anticipo:
 * i nomi composti senza separatori ("proxmoxve" contiene "proxmox") e i nomi
 * troncati rispetto allo slug ufficiale ("githubaction" sta dentro
 * "githubactions").
 *
 * Le soglie sono diverse di proposito: una chiave lunga dentro un nome corto
 * e' un indizio forte, il contrario lo e' meno, quindi li' si pretende di piu'.
 */
function fuzzyLookup(table, key) {
  let best = null
  let bestLength = 0

  for (const candidate of Object.keys(table)) {
    if (candidate.length < 4) continue

    const contained = key.includes(candidate)
    const contains = candidate.includes(key) && key.length >= 6
    if (!contained && !contains) continue

    // Vince la corrispondenza piu' lunga: "windows" batte "server" in
    // "Windows Server", che e' la lettura giusta.
    if (candidate.length > bestLength) {
      best = candidate
      bestLength = candidate.length
    }
  }

  return best ? table[best] : null
}

/**
 * Restituisce il componente icona per una competenza risolta dal nome, o `null`
 * se non c'e' modo di risolverla in modo affidabile. Meglio nessuna icona che
 * una icona sbagliata: un chip senza icona e' comunque leggibile.
 *
 * Ordine dei tentativi: nome intero, alias, singole parole, contenimento.
 * Le parole sono quelle scritte prima della normalizzazione, perche' `iconKey`
 * rimuove i separatori e con essi l'informazione utile: "BE-FE dev" si risolve
 * perche' "dev" e' una parola a se', cosa impossibile dopo la normalizzazione.
 */
export function resolveSkillIcon(name, table) {
  if (!table) return null

  const key = iconKey(name)
  if (!key) return null

  const aliased = ALIASES[key]
  if (aliased && table[aliased]) return table[aliased]

  const whole = lookup(table, key)
  if (whole) return whole

  const words = String(name)
    .split(/[^a-zA-Z0-9]+/)
    .map(iconKey)
    .filter((word) => word.length > 1)
    .sort((a, b) => b.length - a.length)

  for (const word of words) {
    const wordAlias = ALIASES[word]
    if (wordAlias && table[wordAlias]) return table[wordAlias]
  }

  for (const word of words) {
    const found = lookup(table, word)
    if (found) return found
  }

  return fuzzyLookup(table, key)
}

