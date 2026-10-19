import { FaEnvelope } from 'react-icons/fa6'

import ContactForm from '../ContactForm.jsx'
import Section from '../Section.jsx'
import SocialLinks from '../SocialLinks.jsx'
import { CONTACT_CONFIGURED } from '../../lib/contact.js'
import { richText, useSectionText } from '../../lib/sectionTexts.jsx'

/** Contatti: chiusura della pagina, con la via piu' diretta in evidenza. */
export default function Contact({ num, profile }) {
  const text = useSectionText('contatti')

  return (
    <Section
      id="contatti"
      num={num}
      kicker={text.etichetta}
      title={richText(text.titolo)}
      intro={text.sottotitolo}
    >
      <div className="contact">
        <div className="contact__lead" data-reveal>
          {profile.email ? (
            <a className="contact__email" href={`mailto:${profile.email}`}>
              <FaEnvelope aria-hidden="true" />
              {profile.email}
            </a>
          ) : (
            <p className="empty-note">
              Il campo <code>email</code> è vuoto in Directus.
            </p>
          )}
          <p className="empty-note">
            {profile.localita ? `Base: ${profile.localita}. ` : ''}Rispondo di solito entro un
            giorno lavorativo.
          </p>
        </div>

        <div data-reveal>
          <SocialLinks contacts={profile.contatti} />
        </div>

        {/* Senza endpoint il form non compare: niente avvisi in pagina. */}
        {CONTACT_CONFIGURED ? (
          <div className="contact__form" data-reveal>
            <ContactForm email={profile.email} />
          </div>
        ) : null}
      </div>
    </Section>
  )
}
