import type { StaticImageData } from 'next/image'
import type { Locale } from '@/lib/i18n/locales'

// Oktober-Fiesta 2026 (Vecinos de South Pasadena). Mariachi El Cuis opens the
// festival. The page stays live for SEO after the event; from midnight Pacific
// on Oct 18 it renders a "thank you" state instead (the page revalidates
// hourly, so no redeploy is needed for the switch).
export const OKTOBER_FIESTA_PATH = '/eventos/oktober-fiesta-2026'

// Midnight starting Oct 18 in Pacific time (PDT is UTC−7).
const EVENT_OVER_AT = Date.parse('2026-10-18T07:00:00Z')

export function isOktoberFiestaOver(now: Date = new Date()): boolean {
  return now.getTime() >= EVENT_OVER_AT
}

export const OKTOBER_FIESTA = {
  startDate: '2026-10-17T15:15:00-07:00',
  endDate: '2026-10-17T15:45:00-07:00',
  venueName: 'Metro Station Square Park',
  streetAddress: '913 Meridian Avenue',
  city: 'South Pasadena',
  region: 'CA',
  // South Pasadena's only ZIP code.
  postalCode: '91030',
  hostName: 'Vecinos de South Pasadena',
  hostUrl: 'https://vecinosdesouthpasadena.org',
  mapsUrl:
    'https://www.google.com/maps/search/?api=1&query=' +
    encodeURIComponent('Metro Station Square Park, 913 Meridian Avenue, South Pasadena, CA 91030'),
  ogImagePath: '/events/oktober-fiesta-2026-og.jpg',
}

// Photos/videos from the show, added after Oct 17. The "thank you" state shows
// a gallery once this has entries.
// TODO: owner — add photos (static imports from src/assets/events/oktober-fiesta-2026/)
// and/or video (S3 URLs, same as the home page clips) after the event.
export type OktoberFiestaMedia =
  | { kind: 'photo'; image: StaticImageData; alt: Record<Locale, string> }
  | { kind: 'video'; src: string; poster: string; vertical?: boolean; title: Record<Locale, string> }

export const OKTOBER_FIESTA_MEDIA: OktoberFiestaMedia[] = []

export const OKTOBER_FIESTA_COPY = {
  es: {
    title: 'Mariachi El Cuis en Oktober-Fiesta 2026 · South Pasadena',
    description:
      'Mariachi El Cuis abre Oktober-Fiesta el sábado 17 de octubre a las 3:15 PM en Metro Station Square Park, South Pasadena. Fiesta gratis y familiar de Vecinos de South Pasadena.',
    pastTitle: '¡Gracias, South Pasadena! · Mariachi El Cuis en Oktober-Fiesta 2026',
    pastDescription:
      'Mariachi El Cuis abrió Oktober-Fiesta 2026 en South Pasadena, una fiesta gratis de Vecinos de South Pasadena por el Mes de la Herencia Hispana.',
    eventName: 'Mariachi El Cuis en Oktober-Fiesta 2026',
    dateLong: 'Sábado 17 de octubre de 2026',
    eyebrow: 'Sábado · 17 de octubre',
    heading: 'Abrimos el show en',
    festival: 'Oktober-Fiesta',
    setTime: '3:15 – 3:45 PM',
    free: 'Gratis · Free',
    intro:
      'Somos el mariachi que abre Oktober-Fiesta, la fiesta de Vecinos de South Pasadena para celebrar el Mes de la Herencia Hispana. La entrada es gratis: tráete a toda la familia, que habrá muchos artistas locales y actividades para todos.',
    logoAlt: 'Logotipo de Mariachi El Cuis: escudo dorado con guitarra y trompeta',
    groupAlt:
      'Los cinco músicos de Mariachi El Cuis con traje de charro negro, con violines, trompeta, guitarrón y vihuela',
    detailsHeading: 'Detalles del evento',
    details: {
      date: 'Fecha',
      ourSet: 'Nuestro set',
      festivalHours: 'Horario del festival',
      festivalHoursValue: '3:00 – 8:00 PM',
      location: 'Lugar',
      admission: 'Entrada',
      admissionValue: 'Gratis para todos',
      family: 'Para la familia',
      familyValue: 'Muchos artistas locales y actividades para toda la familia',
    },
    mapsLink: 'Abrir en Google Maps',
    hostHeading: 'Quién organiza',
    hostBody:
      'Oktober-Fiesta es organizada por Vecinos de South Pasadena, una organización sin fines de lucro 501(c)(3) formada completamente por voluntarios, para celebrar el Mes de la Herencia Hispana. Gracias por invitarnos a abrir la fiesta.',
    hostLink: 'Visita vecinosdesouthpasadena.org',
    bookHeading: '¿No puedes ir? Llévanos a tu evento',
    pastBookHeading: '¿Te gustó? Llévanos a tu evento',
    bookBody: 'Tocamos en quinceañeras, bodas, cumpleaños y serenatas en el Condado de Los Ángeles.',
    promise: 'Si contratas Mariachi El Cuis, llega Mariachi El Cuis. Sin sustitutos, sin sorpresas.',
    shareHeading: 'Comparte el evento',
    pastShareHeading: 'Comparte',
    shareText: 'Mariachi El Cuis abre Oktober-Fiesta en South Pasadena, sábado 17 de octubre, 3:15 PM. ¡Gratis!',
    pastShareText: 'Mariachi El Cuis en Oktober-Fiesta 2026, South Pasadena',
    copyLink: 'Copiar enlace',
    copied: '¡Enlace copiado!',
    pastEyebrow: 'Oktober-Fiesta · 17 de octubre de 2026',
    pastHeading: '¡Gracias, South Pasadena!',
    pastIntro:
      'Fue un honor abrir Oktober-Fiesta 2026. Gracias a Vecinos de South Pasadena por invitarnos a celebrar el Mes de la Herencia Hispana con su comunidad.',
    mediaHeading: 'Fotos y video',
  },
  en: {
    title: 'Mariachi El Cuis at Oktober-Fiesta 2026 · South Pasadena',
    description:
      'Mariachi El Cuis opens Oktober-Fiesta on Saturday, October 17 at 3:15 PM at Metro Station Square Park, South Pasadena. A free family festival by Vecinos de South Pasadena.',
    pastTitle: 'Thank you, South Pasadena! · Mariachi El Cuis at Oktober-Fiesta 2026',
    pastDescription:
      'Mariachi El Cuis opened Oktober-Fiesta 2026 in South Pasadena, a free festival by Vecinos de South Pasadena celebrating Hispanic Heritage Month.',
    eventName: 'Mariachi El Cuis at Oktober-Fiesta 2026',
    dateLong: 'Saturday, October 17, 2026',
    eyebrow: 'Saturday · Oct 17',
    heading: 'Opening the show at',
    festival: 'Oktober-Fiesta',
    setTime: '3:15 – 3:45 PM',
    free: 'Free · Gratis',
    intro:
      "We're the opening mariachi at Oktober-Fiesta, Vecinos de South Pasadena's celebration of Hispanic Heritage Month. Admission is free, so bring the whole family: there are lots of local performers and family activities.",
    logoAlt: 'Mariachi El Cuis logo: a gold crest with a guitar and a trumpet',
    groupAlt:
      'The five musicians of Mariachi El Cuis in black charro suits, holding violins, a trumpet, a guitarrón, and a vihuela',
    detailsHeading: 'Event details',
    details: {
      date: 'Date',
      ourSet: 'Our set',
      festivalHours: 'Festival hours',
      festivalHoursValue: '3:00 – 8:00 PM',
      location: 'Location',
      admission: 'Admission',
      admissionValue: 'Free for everyone',
      family: 'For families',
      familyValue: 'Lots of local performers and family activities',
    },
    mapsLink: 'Open in Google Maps',
    hostHeading: 'About the host',
    hostBody:
      'Oktober-Fiesta is hosted by Vecinos de South Pasadena, a 501(c)(3) all-volunteer nonprofit, to celebrate Hispanic Heritage Month. Thank you for inviting us to open the show.',
    hostLink: 'Visit vecinosdesouthpasadena.org',
    bookHeading: "Can't make it? Book us for your event",
    pastBookHeading: 'Enjoyed the show? Book us for your event',
    bookBody: 'We play quinceañeras, weddings, birthdays, and serenatas across Los Angeles County.',
    promise: 'If you hire Mariachi El Cuis, you get Mariachi El Cuis. No subs, no surprises.',
    shareHeading: 'Share this event',
    pastShareHeading: 'Share',
    shareText: 'Mariachi El Cuis opens Oktober-Fiesta in South Pasadena, Saturday Oct 17, 3:15 PM. Free!',
    pastShareText: 'Mariachi El Cuis at Oktober-Fiesta 2026, South Pasadena',
    copyLink: 'Copy link',
    copied: 'Link copied!',
    pastEyebrow: 'Oktober-Fiesta · October 17, 2026',
    pastHeading: 'Thank you, South Pasadena!',
    pastIntro:
      'It was an honor to open Oktober-Fiesta 2026. Thank you to Vecinos de South Pasadena for inviting us to celebrate Hispanic Heritage Month with your community.',
    mediaHeading: 'Photos & video',
  },
} as const
