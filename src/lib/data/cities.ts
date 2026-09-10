import { siteConfig } from '@/lib/config/site'
import { haversineMiles } from '@/lib/geo/distance'

export type City = {
  slug: string
  name: string
  lat: number
  lng: number
  neighborhoods: string[]
  blurb: { es: string; en: string }
}

export const CITIES: City[] = [
  {
    slug: 'huntington-park', name: 'Huntington Park', lat: 33.9819, lng: -118.2251,
    neighborhoods: ['Pacific Boulevard', 'Walnut Park'],
    blurb: {
      es: 'Tocamos en Huntington Park casi cada semana, desde salones sobre Pacific Boulevard hasta patios familiares en Walnut Park. Está a pocos minutos de nuestra base en el 90011.',
      en: 'We play Huntington Park nearly every week, from halls along Pacific Boulevard to backyard parties in Walnut Park. It is minutes from our 90011 home base.',
    },
  },
  {
    slug: 'boyle-heights', name: 'Boyle Heights', lat: 34.0339, lng: -118.2078,
    neighborhoods: ['Mariachi Plaza', 'Estrada Courts'],
    blurb: {
      es: 'Boyle Heights es el corazón del mariachi en Los Ángeles. Damos serenatas cerca de Mariachi Plaza y tocamos en misas de la Iglesia de la Soledad y fiestas familiares en todo el barrio.',
      en: 'Boyle Heights is the heart of mariachi in Los Angeles. We play serenatas near Mariachi Plaza and perform at church masses and family parties throughout the neighborhood.',
    },
  },
  {
    slug: 'east-los-angeles', name: 'East Los Angeles', lat: 34.0239, lng: -118.1720,
    neighborhoods: ['City Terrace', 'Belvedere'],
    blurb: {
      es: 'En East LA tocamos quinceañeras, bodas y aniversarios en salones sobre Whittier Boulevard y en casas de City Terrace y Belvedere.',
      en: 'In East LA we play quinceañeras, weddings, and anniversaries at halls along Whittier Boulevard and at homes in City Terrace and Belvedere.',
    },
  },
  {
    slug: 'south-gate', name: 'South Gate', lat: 33.9547, lng: -118.2120,
    neighborhoods: ['Hollydale', 'South Gate Park'],
    blurb: {
      es: 'South Gate está dentro de nuestra zona sin recargo. Tocamos en South Gate Park, en salones de Tweedy Boulevard y en fiestas de Hollydale.',
      en: 'South Gate is inside our no-surcharge zone. We play South Gate Park, halls along Tweedy Boulevard, and parties in Hollydale.',
    },
  },
  {
    slug: 'downey', name: 'Downey', lat: 33.927, lng: -118.1326,
    neighborhoods: ['Downtown Downey', 'Rancho Estates'],
    blurb: {
      es: 'Downey es una de nuestras ciudades más solicitadas para bodas y galas. Tocamos en hoteles cerca del centro y en recepciones familiares por todo Rancho Estates.',
      en: 'Downey is one of our most-requested cities for weddings and galas. We play hotels near downtown and family receptions across Rancho Estates.',
    },
  },
  {
    slug: 'bell', name: 'Bell', lat: 33.9775, lng: -118.1870,
    neighborhoods: ['Bell Gardens border', 'Atlantic Avenue'],
    blurb: {
      es: 'Bell está a un paso de nuestra base. Damos serenatas de cumpleaños y del Día de las Madres y tocamos en salones sobre Atlantic Avenue.',
      en: 'Bell is a short drive from our base. We play birthday and Mother\'s Day serenatas and perform at halls along Atlantic Avenue.',
    },
  },
  {
    slug: 'bell-gardens', name: 'Bell Gardens', lat: 33.9653, lng: -118.1514,
    neighborhoods: ['Ford Boulevard', 'Clara Street'],
    blurb: {
      es: 'En Bell Gardens tocamos quinceañeras y bautizos en salones sobre Eastern Avenue y fiestas en casas cerca de Ford Boulevard.',
      en: 'In Bell Gardens we play quinceañeras and baptism parties at halls along Eastern Avenue and at homes near Ford Boulevard.',
    },
  },
  {
    slug: 'cudahy', name: 'Cudahy', lat: 33.9611, lng: -118.1845,
    neighborhoods: ['Live Oak', 'Atlantic Avenue'],
    blurb: {
      es: 'Cudahy es una de las ciudades más compactas del condado y está en nuestra zona local. Tocamos serenatas a domicilio y fiestas de barrio durante todo el año.',
      en: 'Cudahy is one of the county\'s most compact cities and sits in our local zone. We play doorstep serenatas and block parties year-round.',
    },
  },
  {
    slug: 'maywood', name: 'Maywood', lat: 33.9867, lng: -118.1853,
    neighborhoods: ['Slauson Avenue', 'Heliotrope'],
    blurb: {
      es: 'Maywood está a menos de 15 minutos del 90011. Damos serenatas sorpresa y tocamos en aniversarios y bodas pequeñas.',
      en: 'Maywood is under 15 minutes from 90011. We play surprise serenatas and perform at anniversaries and small weddings.',
    },
  },
  {
    slug: 'lynwood', name: 'Lynwood', lat: 33.9303, lng: -118.2115,
    neighborhoods: ['Long Beach Boulevard', 'Century'],
    blurb: {
      es: 'En Lynwood tocamos misas panamericanas, quinceañeras y graduaciones en salones sobre Long Beach Boulevard.',
      en: 'In Lynwood we play Panamerican masses, quinceañeras, and graduations at halls along Long Beach Boulevard.',
    },
  },
  {
    slug: 'montebello', name: 'Montebello', lat: 34.0165, lng: -118.1137,
    neighborhoods: ['Montebello Town Center', 'Beverly Boulevard'],
    blurb: {
      es: 'Montebello es una parada habitual para bodas y galas corporativas. Tocamos en salones sobre Beverly Boulevard y en el Quiet Cannon.',
      en: 'Montebello is a regular stop for weddings and corporate galas. We play halls along Beverly Boulevard and the Quiet Cannon.',
    },
  },
  {
    slug: 'pico-rivera', name: 'Pico Rivera', lat: 33.9830, lng: -118.0967,
    neighborhoods: ['Rivera', 'Smith Park'],
    blurb: {
      es: 'En Pico Rivera tocamos aniversarios, bodas y fiestas familiares cerca de Smith Park y en salones sobre Whittier Boulevard.',
      en: 'In Pico Rivera we play anniversaries, weddings, and family parties near Smith Park and at halls along Whittier Boulevard.',
    },
  },
  {
    slug: 'whittier', name: 'Whittier', lat: 33.9792, lng: -118.0328,
    neighborhoods: ['Uptown Whittier', 'East Whittier'],
    blurb: {
      es: 'Whittier está cerca del límite de nuestra zona de tarifa base. Tocamos bodas en Uptown Whittier y misas en las parroquias de la zona.',
      en: 'Whittier sits near the edge of our base-rate zone. We play weddings in Uptown Whittier and masses at parishes across the area.',
    },
  },
  {
    slug: 'norwalk', name: 'Norwalk', lat: 33.9022, lng: -118.0817,
    neighborhoods: ['Norwalk Square', 'Studebaker'],
    blurb: {
      es: 'En Norwalk tocamos quinceañeras y bodas en salones cerca de Norwalk Square y recepciones familiares por toda la ciudad.',
      en: 'In Norwalk we play quinceañeras and weddings at halls near Norwalk Square and family receptions across the city.',
    },
  },
  {
    slug: 'commerce', name: 'Commerce', lat: 33.9950, lng: -118.1559,
    neighborhoods: ['The Citadel', 'Rosewood Park'],
    blurb: {
      es: 'Commerce está a minutos de nuestra base. Tocamos eventos corporativos cerca de los hoteles de la ciudad y fiestas familiares en Rosewood Park.',
      en: 'Commerce is minutes from our base. We play corporate events near the city\'s hotels and family parties at Rosewood Park.',
    },
  },
  {
    slug: 'los-angeles', name: 'Los Angeles', lat: 34.0074, lng: -118.2587,
    neighborhoods: ['Downtown', 'South LA', 'Historic South-Central'],
    blurb: {
      es: 'Nuestra base está en el 90011, en el sur de Los Ángeles. Tocamos en todo el centro, en South LA y en los barrios históricos que rodean nuestra sede.',
      en: 'Our home base is 90011 in South Los Angeles. We play across Downtown, South LA, and the historic neighborhoods surrounding our headquarters.',
    },
  },
]

export function getCity(slug: string): City | undefined {
  return CITIES.find((c) => c.slug === slug)
}

export function cityDistanceMi(city: City): number {
  return haversineMiles({ lat: siteConfig.baseLat, lng: siteConfig.baseLng }, city)
}
