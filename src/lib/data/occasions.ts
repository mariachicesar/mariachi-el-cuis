import { PACKAGES } from '@/lib/data/packages'
import { PRICING } from '@/lib/data/pricing'

/**
 * Occasion landing pages (/services/<slug>). These target "hire" searches
 * ("mariachi para quinceañera", "wedding mariachi los angeles") that the song
 * guides do not answer. Every price comes from PRICING / PACKAGES so the pages
 * never drift from the quote engine.
 */
type L = { es: string; en: string }

export type Occasion = {
  slug: 'quinceanera' | 'wedding' | 'serenata'
  seoTitle: L
  description: L
  h1: L
  intro: L
  moments: { title: L; body: L }[]
  priceRows: { label: L; value: L }[]
  hoursTip: L
  faq: { q: L; a: L }[]
  guideSlug: string
  guideLabel: L
}

const weekend = PRICING.hourlyWeekend
const seven = PRICING.sevenSongsFlat
const sevenWeekend = PRICING.weekendSevenSongsFlat
const bigHall = PACKAGES.find((p) => p.id === 'package-2')?.extra ?? 0

const GUARANTEE_FAQ = {
  q: {
    es: '¿Los músicos que veo son los que llegan?',
    en: 'Are the musicians I see the ones who show up?',
  },
  a: {
    es: 'Sí. Si contratas a Mariachi El Cuis, llega Mariachi El Cuis: sin sustitutos y sin sorpresas. Puedes conocer a cada músico en nuestra página de músicos.',
    en: 'Yes. If you hire Mariachi El Cuis, you get Mariachi El Cuis: no subs, no surprises. You can meet every musician on our musicians page.',
  },
}

const SOUND_FAQ = {
  q: { es: '¿Llevan equipo de sonido?', en: 'Do you bring sound equipment?' },
  a: {
    es: `Sí. Con reservas de 1 hora o más incluimos una bocina y micrófono inalámbrico para el cantante, sin costo. Para salones grandes ofrecemos bocinas y micrófonos para los instrumentos por $${bigHall} extra.`,
    en: `Yes. Bookings of 1 hour or more include a speaker and wireless singing mic at no charge. For big halls we add speakers and instrument mics for $${bigHall} extra.`,
  },
}

const DEPOSIT_FAQ = {
  q: { es: '¿Cómo aparto la fecha?', en: 'How do I hold the date?' },
  a: {
    es: `Con un depósito de $${PRICING.depositPerHour} por hora reservada ($${PRICING.depositPerHour} para el paquete de 7 canciones). El saldo se paga el día del evento directamente al mariachi. El depósito es reembolsable si cancelas ${PRICING.cancellationRefundDays} días o más antes.`,
    en: `With a $${PRICING.depositPerHour} deposit per hour booked ($${PRICING.depositPerHour} for the 7-song package). The balance is paid on the event day directly to the band. The deposit is refundable if you cancel ${PRICING.cancellationRefundDays} or more days ahead.`,
  },
}

export const OCCASIONS: Occasion[] = [
  {
    slug: 'quinceanera',
    seoTitle: {
      es: 'Mariachi para Quinceañera en Los Ángeles | XV Años, Precio Fijo',
      en: 'Quinceañera Mariachi in Los Angeles | Fixed Price, No Subs',
    },
    description: {
      es: `Mariachi para XV años en Los Ángeles: misa, vals, baile sorpresa y fiesta. $${weekend} la hora en fin de semana, precio fijo. Los músicos que contratas son los que llegan.`,
      en: `Quinceañera mariachi in Los Angeles for the Mass, vals, surprise dance, and party. $${weekend}/hr on weekends, fixed price. The musicians you book are the ones who show up.`,
    },
    h1: { es: 'Mariachi para quinceañera en Los Ángeles', en: 'Quinceañera mariachi in Los Angeles' },
    intro: {
      es: 'Tus XV años pasan una sola vez. Tocamos la misa, el vals con papá y la corte, y la fiesta que llena la pista, con las canciones que tu familia elija. Y te garantizamos algo que hoy no todos garantizan: los músicos que contratas son los que llegan.',
      en: 'A quinceañera happens once. We play the Mass, the vals with dad and the court, and the party set that fills the floor, with the songs your family picks. And we guarantee something not every band does anymore: the musicians you book are the ones who show up.',
    },
    moments: [
      {
        title: { es: 'La misa', en: 'The Mass' },
        body: {
          es: 'Ave María, una pieza suave de entrada y una canción de agradecimiento al final, según las indicaciones de tu parroquia.',
          en: 'Ave María, a gentle entrance piece, and a song of thanks at the end, following your parish guidelines.',
        },
      },
      {
        title: { es: 'El vals y el baile sorpresa', en: 'The vals and surprise dance' },
        body: {
          es: 'De Niña a Mujer, Tiempo de Vals o Hermoso Cariño para el vals, y un número rápido para el baile sorpresa.',
          en: 'De Niña a Mujer, Tiempo de Vals, or Hermoso Cariño for the vals, then an upbeat number for the surprise dance.',
        },
      },
      {
        title: { es: 'La fiesta', en: 'The party' },
        body: {
          es: 'El Rey, Volver Volver, El Son de la Negra, La Culebra y Amor Eterno para el momento más emotivo.',
          en: 'El Rey, Volver Volver, El Son de la Negra, La Culebra, and Amor Eterno for the emotional peak.',
        },
      },
    ],
    priceRows: [
      { label: { es: 'Por hora, cualquier día', en: 'Hourly, any day' }, value: { es: `$${weekend} por hora`, en: `$${weekend}/hr` } },
      { label: { es: 'Sonido para salón grande', en: 'Big-hall sound' }, value: { es: `+$${bigHall}`, en: `+$${bigHall}` } },
    ],
    hoursTip: {
      es: 'La mayoría de las quinceañeras reservan de 2 a 3 horas para cubrir la misa o la entrada a la recepción más un set completo de fiesta.',
      en: 'Most quinceañeras book 2 to 3 hours to cover the Mass or reception entrance plus a full party set.',
    },
    faq: [
      {
        q: { es: '¿Cuántas horas de mariachi necesito para una quinceañera?', en: 'How many hours of mariachi do I need for a quinceañera?' },
        a: {
          es: 'De 2 a 3 horas cubre la misa o la entrada al salón más el vals y un set completo de fiesta.',
          en: '2 to 3 hours covers the Mass or the hall entrance plus the vals and a full party set.',
        },
      },
      {
        q: { es: '¿Puedo elegir las canciones?', en: 'Can I choose the songs?' },
        a: {
          es: 'Sí. Envíanos la lista de canciones indispensables de la familia al reservar y la preparamos.',
          en: "Yes. Send the family's must-play list when you book and we'll prepare it.",
        },
      },
      GUARANTEE_FAQ,
      SOUND_FAQ,
      DEPOSIT_FAQ,
    ],
    guideSlug: 'quinceanera-song-guide',
    guideLabel: { es: 'Lista completa de canciones para quinceañera', en: 'Full quinceañera song list' },
  },
  {
    slug: 'wedding',
    seoTitle: {
      es: 'Mariachi para Bodas en Los Ángeles | Ceremonia y Recepción',
      en: 'Wedding Mariachi in Los Angeles | Ceremony to Reception',
    },
    description: {
      es: `Mariachi para tu boda en Los Ángeles: ceremonia, hora del coctel y entrada a la recepción. $${weekend} la hora en fin de semana, precio fijo y sin sustitutos.`,
      en: `Wedding mariachi in Los Angeles for the ceremony, cocktail hour, and reception entrance. $${weekend}/hr on weekends, fixed price, no substitutes.`,
    },
    h1: { es: 'Mariachi para bodas en Los Ángeles', en: 'Wedding mariachi in Los Angeles' },
    intro: {
      es: 'El día de tu boda no hay lugar para sorpresas. Tocamos la ceremonia, la hora del coctel y la entrada a la recepción con un sonido de calidad, y los músicos que contratas son los mismos que llegan.',
      en: 'Your wedding day has no room for surprises. We play the ceremony, cocktail hour, and reception entrance with top-quality sound, and the musicians you book are the same ones who show up.',
    },
    moments: [
      {
        title: { es: 'La ceremonia', en: 'The ceremony' },
        body: {
          es: 'La entrada, una pieza durante la ceremonia como Ave María y la salida de los novios. Considera de 30 a 45 minutos.',
          en: 'The processional, a piece during the ceremony such as Ave María, and the recessional. Plan on 30 to 45 minutes.',
        },
      },
      {
        title: { es: 'La hora del coctel', en: 'Cocktail hour' },
        body: {
          es: 'Un set de pie con sones, boleros y rancheras mientras los invitados pasan a la recepción. Es la opción más popular.',
          en: 'A strolling set of sones, boleros, and rancheras while guests move to the reception. The most popular choice.',
        },
      },
      {
        title: { es: 'La entrada a la recepción', en: 'Reception entrance' },
        body: {
          es: 'Anunciamos a los novios con El Son de la Negra o La Negra y seguimos durante el primer brindis.',
          en: 'We announce the couple with El Son de la Negra or La Negra and keep playing through the first toast.',
        },
      },
    ],
    priceRows: [
      { label: { es: 'Por hora, cualquier día', en: 'Hourly, any day' }, value: { es: `$${weekend} por hora`, en: `$${weekend}/hr` } },
      { label: { es: 'Sonido para salón grande', en: 'Big-hall sound' }, value: { es: `+$${bigHall}`, en: `+$${bigHall}` } },
    ],
    hoursTip: {
      es: '2 horas cubren la ceremonia más el coctel, o el coctel más la entrada a la recepción. 3 horas cubren los tres momentos con espacio para peticiones.',
      en: '2 hours covers the ceremony plus cocktail hour, or cocktail hour plus the reception entrance. 3 hours covers all three with room for requests.',
    },
    faq: [
      {
        q: { es: '¿En qué parte de la boda conviene el mariachi?', en: 'Which part of the wedding should the mariachi play?' },
        a: {
          es: 'La hora del coctel es la más popular. Muchas parejas suman la ceremonia o la entrada a la recepción.',
          en: 'Cocktail hour is the most popular. Many couples add the ceremony or the reception entrance.',
        },
      },
      GUARANTEE_FAQ,
      SOUND_FAQ,
      DEPOSIT_FAQ,
    ],
    guideSlug: 'wedding-mariachi-timeline',
    guideLabel: { es: 'El mariachi en la línea de tiempo de tu boda', en: 'Where a mariachi fits in your wedding timeline' },
  },
  {
    slug: 'serenata',
    seoTitle: {
      es: `Serenata con Mariachi en Los Ángeles | 7 Canciones $${seven}`,
      en: `Mariachi Serenata in Los Angeles | 7 Songs for $${seven}`,
    },
    description: {
      es: `Serenata sorpresa con mariachi en Los Ángeles: Las Mañanitas y 6 canciones más por $${seven} entre semana. Cumpleaños, Día de las Madres, aniversarios. Músicos confirmados, sin sustitutos.`,
      en: `Surprise mariachi serenata in Los Angeles: Las Mañanitas plus 6 more songs for $${seven} on weekdays. Birthdays, Mother's Day, anniversaries. Confirmed musicians, no substitutes.`,
    },
    h1: { es: 'Serenatas y cumpleaños con mariachi en Los Ángeles', en: 'Mariachi serenatas & birthdays in Los Angeles' },
    intro: {
      es: 'Llegamos de sorpresa a la casa, al restaurante o al trabajo con Las Mañanitas y las canciones que tú elijas. Cumpleaños, Día de las Madres, aniversarios y pedidas de mano en todo Los Ángeles.',
      en: 'We arrive by surprise at the house, restaurant, or workplace with Las Mañanitas and the songs you choose. Birthdays, Mother\'s Day, anniversaries, and proposals across Los Angeles.',
    },
    moments: [
      {
        title: { es: 'Cumpleaños', en: 'Birthdays' },
        body: {
          es: 'Las Mañanitas cuando el festejado esté listo, una dedicatoria como Hermoso Cariño y algo alegre como El Mariachi Loco.',
          en: 'Las Mañanitas when the guest of honor is ready, a dedication like Hermoso Cariño, then something lively like El Mariachi Loco.',
        },
      },
      {
        title: { es: 'Aniversarios y pedidas de mano', en: 'Anniversaries & proposals' },
        body: {
          es: 'Boleros y rancheras románticas: Si Nos Dejan, Sabor a Mí, Bésame Mucho.',
          en: 'Boleros and romantic rancheras: Si Nos Dejan, Sabor a Mí, Bésame Mucho.',
        },
      },
      {
        title: { es: 'Sorpresas en restaurantes', en: 'Restaurant surprises' },
        body: {
          es: 'Dinos quién nos da la señal y entramos cuando todos estén en su lugar.',
          en: 'Tell us who gives the signal and we walk in once everyone is in place.',
        },
      },
    ],
    priceRows: [
      { label: { es: '7 canciones, lunes a viernes', en: '7 songs, Monday–Friday' }, value: { es: `$${seven}`, en: `$${seven}` } },
      { label: { es: '7 canciones, sábado o domingo', en: '7 songs, Saturday or Sunday' }, value: { es: `$${sevenWeekend}`, en: `$${sevenWeekend}` } },
      { label: { es: 'Por hora, fin de semana', en: 'Hourly, weekend' }, value: { es: `$${weekend} por hora`, en: `$${weekend}/hr` } },
    ],
    hoursTip: {
      es: 'El paquete de 7 canciones es ideal para una serenata. Para una fiesta completa, reserva por hora.',
      en: 'The 7-song package is ideal for a serenata. For a full party, book by the hour.',
    },
    faq: [
      {
        q: { es: '¿Van a tocar solo Las Mañanitas?', en: 'Can you come for just Las Mañanitas?' },
        a: {
          es: 'Nuestro paquete más pequeño es de 7 canciones, porque todo el grupo se prepara en traje y viaja hasta tu evento. Las Mañanitas va incluida y tú eliges las otras seis.',
          en: 'Our smallest package is 7 songs, since the whole group gets ready in traje and travels to you. Las Mañanitas is included and you pick the other six.',
        },
      },
      {
        q: { es: '¿A qué hora pueden llegar a dar serenata?', en: 'How early can you arrive for a serenata?' },
        a: {
          es: 'Desde las 7:00 AM entre semana y los sábados, y desde las 8:00 AM los domingos.',
          en: 'From 7:00 AM on weekdays and Saturdays, and from 8:00 AM on Sundays.',
        },
      },
      GUARANTEE_FAQ,
      DEPOSIT_FAQ,
    ],
    guideSlug: 'best-mariachi-songs-by-occasion',
    guideLabel: { es: 'Lista de canciones de mariachi por ocasión', en: 'Best mariachi songs for every occasion' },
  },
]

export function getOccasion(slug: string): Occasion | undefined {
  return OCCASIONS.find((o) => o.slug === slug)
}

/** SERVICES card slug → occasion page slug, for linking from /services. */
export const OCCASION_FOR_SERVICE: Record<string, Occasion['slug']> = {
  wedding: 'wedding',
  quinceanera: 'quinceanera',
  serenata: 'serenata',
}
