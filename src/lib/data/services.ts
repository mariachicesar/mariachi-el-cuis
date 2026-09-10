export type Service = {
  slug: string
  title: { es: string; en: string }
  summary: { es: string; en: string }
  occasions: { es: string; en: string }[]
}

export const SERVICES: Service[] = [
  {
    slug: 'wedding',
    title: { es: 'Bodas', en: 'Weddings' },
    summary: {
      es: 'Acompañamos la ceremonia, la hora del coctel y la entrada a la recepción con mariachi en vivo.',
      en: 'We play the ceremony, cocktail hour, and the entrance to your reception with live mariachi.',
    },
    occasions: [
      { es: 'Entrada de los novios y Ave María en la ceremonia', en: 'Processional and Ave María at the ceremony' },
      { es: 'Set durante la hora del coctel', en: 'Cocktail-hour set' },
      { es: 'Primer baile o brindis con canción especial', en: 'First dance or toast with a requested song' },
    ],
  },
  {
    slug: 'quinceanera',
    title: { es: 'Quinceañeras', en: 'Quinceañeras' },
    summary: {
      es: 'Desde la misa hasta el vals y el baile sorpresa, con las rancheras que llenan la pista.',
      en: 'From the mass to the vals and the surprise dance, plus the rancheras that fill the floor.',
    },
    occasions: [
      { es: 'Misa de acción de gracias', en: 'Thanksgiving mass' },
      { es: 'Vals con el papá y la corte', en: 'Vals with dad and the court' },
      { es: 'Set de rancheras y sones para la fiesta', en: 'Ranchera and son set for the party' },
    ],
  },
  {
    slug: 'serenata',
    title: { es: 'Serenatas y cumpleaños', en: 'Serenatas & birthdays' },
    summary: {
      es: 'Llegada sorpresa a la casa, al restaurante o al trabajo con Las Mañanitas y canciones a pedido.',
      en: 'A surprise arrival at the house, restaurant, or workplace with Las Mañanitas and requests.',
    },
    occasions: [
      { es: 'Cumpleaños y Día de las Madres', en: 'Birthdays and Mother\'s Day' },
      { es: 'Aniversarios y pedidas de mano', en: 'Anniversaries and proposals' },
      { es: 'Sorpresas en restaurantes', en: 'Restaurant surprises' },
    ],
  },
  {
    slug: 'church-mass',
    title: { es: 'Misas', en: 'Church masses' },
    summary: {
      es: 'Misa panamericana con los cantos de entrada, ofertorio, santo, cordero y salida.',
      en: 'Panamerican mass with entrance, offertory, Santo, Cordero, and recessional hymns.',
    },
    occasions: [
      { es: 'Bautizos y presentaciones', en: 'Baptisms and presentations' },
      { es: 'Misas de quinceañera y aniversario', en: 'Quinceañera and anniversary masses' },
      { es: 'Misas de acción de gracias', en: 'Thanksgiving masses' },
    ],
  },
  {
    slug: 'corporate',
    title: { es: 'Eventos corporativos', en: 'Corporate events' },
    summary: {
      es: 'Recepciones, cenas de premiación y celebraciones de fin de año con un set profesional.',
      en: 'Receptions, awards dinners, and year-end celebrations with a professional set.',
    },
    occasions: [
      { es: 'Recepciones y mezcladores', en: 'Receptions and mixers' },
      { es: 'Cenas de gala y premiaciones', en: 'Gala dinners and awards nights' },
      { es: 'Celebraciones del 5 de mayo y 16 de septiembre', en: 'Cinco de Mayo and Mexican Independence celebrations' },
    ],
  },
  {
    slug: 'memorial',
    title: { es: 'Homenajes y funerales', en: 'Memorials & funerals' },
    summary: {
      es: 'Un homenaje sereno con Amor Eterno, Las Golondrinas y las canciones que pida la familia.',
      en: 'A calm tribute with Amor Eterno, Las Golondrinas, and the songs the family requests.',
    },
    occasions: [
      { es: 'Servicios en capilla o panteón', en: 'Chapel or graveside services' },
      { es: 'Misas de cuerpo presente', en: 'Funeral masses' },
      { es: 'Aniversarios luctuosos', en: 'Memorial anniversaries' },
    ],
  },
]
