import { useEffect, useMemo } from 'react'
import {
  FaBriefcase,
  FaCode,
  FaEnvelope,
  FaFolderOpen,
  FaHouse,
  FaUser,
} from 'react-icons/fa6'

import Footer from './components/Footer.jsx'
import Nav from './components/Nav.jsx'
import About from './components/sections/About.jsx'
import Contact from './components/sections/Contact.jsx'
import Hero from './components/sections/Hero.jsx'
import Projects from './components/sections/Projects.jsx'
import Skills from './components/sections/Skills.jsx'
import Timeline from './components/sections/Timeline.jsx'
import { BootSkeleton, EmptyProfile, ErrorState, Maintenance } from './components/states.jsx'
import { useExperiences, useProfile, useProjects, useSections } from './hooks/useContent.js'
import { useActiveSection } from './hooks/useActiveSection.js'
import { useReveal } from './hooks/useReveal.js'
import { useScrollProgress } from './hooks/useScrollProgress.js'
import { applySiteMeta } from './lib/head.js'
import { SectionTextsProvider, buildSectionTexts } from './lib/sectionTexts.jsx'
import { useTheme } from './lib/theme.js'

/** Etichetta e icona di ogni sezione: ordine e numerazione derivano da qui. */
const SECTION_META = {
  top: { label: 'Inizio', icon: FaHouse },
  'chi-sono': { label: 'Chi sono', icon: FaUser },
  competenze: { label: 'Competenze', icon: FaCode },
  percorso: { label: 'Percorso', icon: FaBriefcase },
  progetti: { label: 'Progetti', icon: FaFolderOpen },
  contatti: { label: 'Contatti', icon: FaEnvelope },
}

export default function App() {
  const { theme, toggleTheme } = useTheme()

  const profileResource = useProfile()
  const projectsResource = useProjects()
  const experiencesResource = useExperiences()

  // Titoli e sottotitoli delle sezioni: vivono nel CMS, con i valori di
  // partenza nel codice come rete di sicurezza. Non influenzano cosa compare.
  const sectionsResource = useSections()
  const sectionTexts = useMemo(
    () => buildSectionTexts(sectionsResource.data?.items),
    [sectionsResource.data?.items],
  )

  const profile = profileResource.data?.profile ?? null
  const projects = projectsResource.data?.items ?? []
  const experiences = experiencesResource.data?.items ?? []

  // Il CMS non risponde: la pagina intera diventa la schermata di manutenzione.
  const offline = profileResource.data?.source === 'offline'

  /**
   * Una sezione compare se ha contenuti, oppure se la collezione non esiste
   * ancora: in quel caso mostra le istruzioni per crearla in Directus. Se la
   * collezione esiste ma e' vuota, la sezione sparisce del tutto, cosi' il sito
   * pubblico non mostra mai contenitori vuoti.
   */
  const hasContent = (resource, items) =>
    resource.status === 'success' && (items.length > 0 || Boolean(resource.data?.missing))

  const showExperiences = hasContent(experiencesResource, experiences)

  // Ordine delle sezioni numerate (il hero resta fuori dalla numerazione).
  const sectionIds = ['chi-sono', 'competenze']
  if (showExperiences) sectionIds.push('percorso')
  sectionIds.push('progetti')
  sectionIds.push('contatti')

  const nums = {}
  sectionIds.forEach((id, index) => {
    nums[id] = String(index + 1).padStart(2, '0')
  })

  // I numeri della navigazione devono coincidere con quelli mostrati
  // nell'intestazione di ogni sezione: il hero prende 00, poi si prosegue.
  const navItems = [
    { id: 'top', num: '00', ...SECTION_META.top },
    ...sectionIds.map((id) => ({ id, num: nums[id], ...SECTION_META[id] })),
  ]

  const activeId = useActiveSection(navItems.map((item) => item.id))

  useScrollProgress()

  // Titolo, descrizione, URL canonica e favicon possono arrivare dal CMS.
  // Quello che manca resta come scritto in index.html.
  const meta = profile?.meta
  useEffect(() => {
    applySiteMeta({
      titolo: meta?.titolo,
      descrizione: meta?.descrizione,
      url: meta?.url,
      immagine: meta?.immagine,
      favicon: profile?.faviconUrl,
    })
  }, [meta?.titolo, meta?.descrizione, meta?.url, meta?.immagine, profile?.faviconUrl])
  // I contenuti arrivano dal CMS in modo asincrono: quando cambia qualcosa
  // l'osservatore va ri-eseguito sugli elementi nuovi.
  useReveal(
    [
      profileResource.status,
      projectsResource.status,
      experiencesResource.status,
      sectionIds.join(','),
    ].join('|'),
  )

  /*
   * CMS irraggiungibile: si esce qui, dopo tutti gli hook, e non dentro il ramo
   * di `main`. In questo stato non devono comparire né la navigazione né il piè
   * di pagina: punterebbero a sezioni che non esistono e parlerebbero di un sito
   * che non c'è.
   */
  if (offline) {
    return (
      <div className="shell shell--solo">
        <main id="contenuti">
          <Maintenance onRetry={profileResource.reload} />
        </main>
      </div>
    )
  }

  return (
    <div className="shell">
      <a className="skip-link" href="#contenuti">
        Salta ai contenuti
      </a>

      <Nav
        items={navItems}
        activeId={activeId}
        theme={theme}
        onToggleTheme={toggleTheme}
        profile={profile}
      />

      <main id="contenuti">
        {profileResource.status === 'loading' ? <BootSkeleton /> : null}

        {profileResource.status === 'error' ? (
          <ErrorState error={profileResource.error} onRetry={profileResource.reload} />
        ) : null}

        {profileResource.status === 'success' && !profile ? (
          <EmptyProfile onRetry={profileResource.reload} />
        ) : null}

        {profileResource.status === 'success' && profile ? (
          <>
            <Hero profile={profile} />

            {/* Le intestazioni numerate leggono i testi dal CMS attraverso il
                contesto, senza passare le proprieta' a ogni sezione. */}
            <SectionTextsProvider value={sectionTexts}>
              <About num={nums['chi-sono']} profile={profile} />
              <Skills num={nums.competenze} profile={profile} />

              {showExperiences ? (
                <Timeline
                  num={nums.percorso}
                  items={experiences}
                  missing={experiencesResource.data?.missing}
                />
              ) : null}

              <Projects
                num={nums.progetti}
                items={projects}
                missing={projectsResource.data?.missing}
              />

              <Contact num={nums.contatti} profile={profile} />
            </SectionTextsProvider>
          </>
        ) : null}
      </main>

      <Footer nome={profile?.nome} profile={profile} />
    </div>
  )
}
