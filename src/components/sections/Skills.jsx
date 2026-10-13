import { useEffect } from 'react'
import Section from '../Section.jsx'
import { groupSkills } from '../../lib/normalize.js'
import { richText, useSectionText } from '../../lib/sectionTexts.jsx'
import { SKILL_ICONS, resolveSkillIcon } from '../../lib/skillIcons.js'

/**
 * Competenze.
 *
 * L'icona di ogni competenza viene risolta automaticamente dal nome: si scrive
 * "docker" o "Node.js" nel CMS e il logo compare, senza mappature da mantenere.
 * Se un nome non e' risolvibile il chip resta senza icona invece di mostrarne
 * una sbagliata.
 *
 * Deliberatamente senza percentuali: il CMS contiene tag, non livelli. Se in
 * futuro il campo `skills` diventera' un array di oggetti con `categoria`, le
 * competenze si raggruppano da sole senza toccare questo componente.
 */
export default function Skills({ num, profile }) {
  const text = useSectionText('competenze')
  const groups = groupSkills(profile.skills)
  const total = profile.skills.length
  const names = profile.skills.map((item) => item.nome)

  // In sviluppo segnalo le competenze senza icona: sono i nomi su cui vale la
  // pena aggiungere un alias in `skillIcons.js`, invece di scoprirlo per caso.
  useEffect(() => {
    if (!import.meta.env.DEV || !names.length) return

    const missing = names.filter((name) => !resolveSkillIcon(name, SKILL_ICONS))
    if (missing.length) {
      console.info('[skill-icons] nessuna icona per:', missing.join(', '))
    }
    // `names` e' ricreato a ogni render: la dipendenza stabile e' il contenuto.
  }, [names.join('|')])

  return (
    <Section
      id="competenze"
      num={num}
      kicker={text.etichetta}
      title={richText(text.titolo)}
      /*
       * Il sottotitolo compare solo se c'e' almeno una competenza: sopra a un
       * elenco vuoto prometterebbe qualcosa che non c'e'.
       */
      intro={total ? text.sottotitolo : null}
    >
      {total ? (
        <div className="chip-groups" data-reveal>
          {groups.map((group) => (
            <div className="chip-group" key={group.categoria || 'tutte'}>
              {group.categoria ? <span className="chip-group__label">{group.categoria}</span> : null}
              <ul className="chips">
                {group.items.map((item) => {
                  const Icon = resolveSkillIcon(item.nome, SKILL_ICONS)

                  return (
                    <li className="chip" key={item.nome} title={item.categoria || undefined}>
                      {Icon ? <Icon className="chip__icon" aria-hidden="true" focusable="false" /> : null}
                      {item.nome}
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      ) : (
        <p className="empty-note" data-reveal>
          Il campo <code>skills</code> non contiene voci.
        </p>
      )}
    </Section>
  )
}
