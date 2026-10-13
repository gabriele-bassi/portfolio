import { FaArrowUp } from 'react-icons/fa6'

import Brand from './Brand.jsx'

/**
 * Piè di pagina.
 *
 * Due righe: il marchio con il comando per tornare in cima, un filetto, e la
 * riga dei diritti. Prima era una riga sola che spiegava come è fatto il sito;
 * quella nota non serviva a chi legge, e il piè di pagina non è il posto in cui
 * parlare di sé.
 *
 * L'anno non è scritto a mano da nessuna parte: si legge dall'orologio di chi
 * apre la pagina, quindi a capodanno si aggiorna da solo, anche in una copia
 * statica pubblicata mesi prima. Su una pagina lunga come questa, "torna su"
 * evita di dover risalire con il pollice.
 */
export default function Footer({ nome, profile }) {
  const anno = new Date().getFullYear()

  return (
    <footer className="foot">
      <div className="container">
        <div className="foot__inner">
          <div className="foot__top">
            <span className="foot__brand">
              <Brand profile={profile} />
            </span>

            <a className="foot__up" href="#top">
              Torna su
              <FaArrowUp aria-hidden="true" />
            </a>
          </div>

          <p className="foot__note">
            © {anno}
            {nome ? ` ${nome}` : ''}
          </p>
        </div>
      </div>
    </footer>
  )
}
