import {
  BarChart3,
  CalendarDays,
  Camera,
  Code2,
  ExternalLink,
  MapPin,
  Megaphone,
  UserCheck,
} from 'lucide-react'
import Image from 'next/image'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ContactForm } from '@/app/[lang]/contact/contact-form'
import groupPhoto from '@/assets/brand/mariachi-el-cuis-group-portrait.webp'
import cesarMariachi from '@/assets/restaurants/cesar-mariachi.webp'
import engineeringTeam from '@/assets/restaurants/cesar-engineering-team.webp'
import ga4Traffic from '@/assets/restaurants/ga4-website-traffic.webp'
import profilesManaged from '@/assets/restaurants/google-profiles-managed.webp'
import medinasProfile from '@/assets/restaurants/medinas-google-profile.webp'
import metaAds from '@/assets/restaurants/meta-ads-results.webp'
import { VideoFacade } from '@/components/media/video-facade'
import { buttonClasses } from '@/components/ui/button'
import { Section } from '@/components/ui/section'
import { siteConfig } from '@/lib/config/site'
import { getDictionary } from '@/lib/i18n/dictionaries'
import { isLocale, type Locale } from '@/lib/i18n/locales'
import { localizedPath } from '@/lib/i18n/paths'
import { buildMetadata } from '@/lib/seo/metadata'

// Weekly-residency pitch for restaurant managers (Taco Tuesday, Tequila
// Thursday, Sunday brunch). Shared by link only: noindex and left out of the
// sitemap and nav. Leads are tagged [Restaurant] in the notification email.

export const dynamicParams = false

export function generateStaticParams() {
  return [{ lang: 'es' }, { lang: 'en' }]
}

const ASSET_ROOT = 'https://mariachiassets.s3.us-west-1.amazonaws.com'
const TEQUILA_VIDEO = {
  src: `${ASSET_ROOT}/una_pura_clip.mp4`,
  poster: `${ASSET_ROOT}/una_pura_clip.jpg`,
}
const BAND_VIDEO = {
  src: `${ASSET_ROOT}/musica_para_bailar_reel.mp4`,
  poster: `${ASSET_ROOT}/musica_para_bailar_reel.jpg`,
}
const PORTFOLIO_URL = 'https://cesar-portfolio-mu.vercel.app/'

const COPY = {
  es: {
    title: 'Mariachi semanal para tu restaurante · Mariachi El Cuis',
    description:
      'Una noche de mariachi cada semana en tu restaurante — Martes de Tacos, Jueves de Tequila o Brunch del Domingo — con marketing digital incluido.',
    badge: 'Para restaurantes',
    heading: 'Mariachi en vivo, cada semana, en tu restaurante',
    nights: 'Martes de Tacos · Jueves de Tequila · Brunch del Domingo',
    intro:
      'Mariachi El Cuis es un mariachi tradicional de Los Ángeles. Buscamos restaurantes para una noche fija cada semana. Y como también soy ingeniero de software, no solo llegamos a tocar: te ayudo a promover la noche para que la gente llegue.',
    call: 'Llama o manda texto',
    cta: 'Planea tu noche semanal',
    formatsHeading: 'Elige tu noche',
    formats: [
      {
        name: 'Martes de Tacos',
        body: 'Convierte un martes tranquilo en una razón para salir. Tocamos de mesa en mesa mientras la gente cena.',
      },
      {
        name: 'Jueves de Tequila',
        body: 'Música en vivo junto con tus especiales de tequila y mezcal. El ambiente de bar que hace que la gente pida otra ronda.',
      },
      {
        name: 'Brunch del Domingo',
        body: 'Familias, cumpleaños y aniversarios. Cantamos Las Mañanitas en la mesa y tocamos lo que pidan.',
      },
    ],
    whyHeading: 'Por qué una noche fija funciona',
    why: [
      {
        icon: 'user',
        title: 'Los mismos músicos cada semana',
        body: 'Sin sustitutos. Tus clientes conocen al grupo y regresan por él.',
      },
      {
        icon: 'calendar',
        title: 'Una cita que la gente recuerda',
        body: '“El jueves hay mariachi” — los clientes planean cumpleaños y salidas alrededor de tu noche.',
      },
      {
        icon: 'pin',
        title: 'Peticiones en cada mesa',
        body: 'Rancheras, boleros, huapangos y sones. Tocamos lo que el público pida y llevamos nuestro propio sonido.',
      },
    ],
    techEyebrow: 'Más que un mariachi',
    techHeading: 'Tu mariachi también es tu equipo de marketing',
    techIntro:
      'Me llamo César Ríos y toco la vihuela en Mariachi El Cuis. De día soy Lead Software Engineer: construyo sitios de e-commerce empresariales que reciben millones de visitas. También manejo perfiles de Google, sitios web y anuncios para negocios locales de la zona. Quiero usar todo eso para que tu noche de mariachi sea un éxito.',
    engineerBadge: 'César Ríos · Lead Software Engineer',
    portfolioLink: 'Ver mi portafolio de ingeniería',
    mariachiCaption: 'En el escenario',
    engineeringCaption: 'En la oficina',
    mariachiPhotoAlt: 'César Ríos con traje de charro, sosteniendo un sombrero de mariachi.',
    engineeringPhotoAlt: 'César Ríos (a la derecha) con su equipo de ingeniería de software.',
    services: [
      {
        icon: 'pin',
        title: 'Google Business Profile',
        body: 'Publicamos tu noche de mariachi como evento en Google y Maps, con fotos y videos de cada semana.',
      },
      {
        icon: 'camera',
        title: 'Videos desde tu restaurante',
        body: 'Grabamos reels en tu local y los publicamos en nuestro Instagram, Facebook y YouTube, etiquetándote.',
      },
      {
        icon: 'megaphone',
        title: 'Anuncios dirigidos',
        body: 'Anuncios en Meta y Google para la gente cerca de tu restaurante, con un presupuesto que planeamos juntos.',
      },
      {
        icon: 'chart',
        title: 'Resultados medibles',
        body: 'Un enlace, código QR o código de reservación único para que veas cuántos clientes llegaron por el mariachi.',
      },
    ],
    proofHeading: 'Resultados reales',
    proofIntro: 'Capturas de cuentas que manejo — mi propio mariachi y negocios locales de la zona.',
    proof: [
      {
        img: 'meta',
        stat: '$44.92 → 2,122 vistas',
        title: 'Anuncios de Meta para Mariachi El Cuis',
        body: 'Un reel promocionado con menos de $45: 2,122 vistas, 980 interacciones y 17 conversaciones por mensaje en 60 días.',
        alt: 'Resumen de anuncios de Meta: 2,122 vistas, 1,216 espectadores y 980 interacciones.',
      },
      {
        img: 'ga4',
        stat: '431 visitantes',
        title: 'Sitio web de Mariachi El Cuis',
        body: 'Sitio nuevo que construí: 431 visitantes en sus primeros 28 días, según Google Analytics.',
        alt: 'Google Analytics: 431 usuarios activos y 2.2K eventos en los últimos 28 días.',
      },
      {
        img: 'medinas',
        stat: '5.0★ · 1,030 interacciones',
        title: "Medina's Mobile Tire Service",
        body: 'Perfil de Google que manejo: 5.0 estrellas con 26 reseñas y 1,030 interacciones de clientes.',
        alt: "Perfil de Google de Medina's Mobile Tire Service: 5.0 estrellas, 26 reseñas, 1,030 interacciones.",
      },
      {
        img: 'profiles',
        stat: 'Perfiles verificados',
        title: 'Negocios locales que manejo',
        body: "Perfiles de Google verificados para Medina's Mobile Tire Service y RnR Electrician.",
        alt: "Lista de perfiles de Google que manejo: Medina's Mobile Tires Service y RnR Electrician.",
      },
    ],
    bandHeading: 'Sobre Mariachi El Cuis',
    bandBody:
      'Somos un conjunto de cinco músicos: dos trompetas, vihuela, guitarrón y violín. Tocamos rancheras, boleros, huapangos y sones, y en cada evento tocamos lo que el público pida.',
    bandLink: 'Mira más videos',
    groupAlt:
      'Los cinco músicos de Mariachi El Cuis con traje de charro, sosteniendo violines, trompeta, guitarrón y vihuela.',
    tequilaVideoTitle: 'Una Pura y Dos Con Sal — Mariachi El Cuis en vivo',
    bandVideoTitle: 'Música para Bailar — Mariachi El Cuis en vivo',
    quoteHeading: 'Hablemos de tu noche semanal',
    quoteBody:
      'Dime el nombre de tu restaurante, la ciudad, qué noche te interesa y el horario. Te mando una propuesta con tarifa semanal y un plan de marketing.',
    messagePlaceholder: 'Restaurante, ciudad, noche (martes, jueves, domingo…) y horario',
  },
  en: {
    title: 'Weekly mariachi for your restaurant · Mariachi El Cuis',
    description:
      'A mariachi night every week at your restaurant — Taco Tuesday, Tequila Thursday, or Sunday Brunch — with digital marketing built in.',
    badge: 'For restaurants',
    heading: 'Live mariachi, every week, at your restaurant',
    nights: 'Taco Tuesday · Tequila Thursday · Sunday Brunch',
    intro:
      "Mariachi El Cuis is a traditional mariachi from Los Angeles. We're looking for restaurants to host a standing night every week. And because I'm also a software engineer, we don't just show up and play: I help you promote the night so people come out for it.",
    call: 'Call or text',
    cta: 'Plan your weekly night',
    formatsHeading: 'Pick your night',
    formats: [
      {
        name: 'Taco Tuesday',
        body: 'Turn a quiet Tuesday into a reason to go out. We stroll table to table while guests eat.',
      },
      {
        name: 'Tequila Thursday',
        body: 'Live music alongside your tequila and mezcal specials. The bar atmosphere that keeps people ordering another round.',
      },
      {
        name: 'Sunday Brunch',
        body: 'Families, birthdays, and anniversaries. We sing Las Mañanitas at the table and play whatever guests request.',
      },
    ],
    whyHeading: 'Why a standing night works',
    why: [
      {
        icon: 'user',
        title: 'The same musicians every week',
        body: 'No substitutes. Your regulars get to know the band and come back for it.',
      },
      {
        icon: 'calendar',
        title: 'A night people remember',
        body: '“Thursday is mariachi night” — guests plan birthdays and nights out around it.',
      },
      {
        icon: 'pin',
        title: 'Requests at every table',
        body: 'Rancheras, boleros, huapangos, and sones. We play what guests ask for and bring our own sound.',
      },
    ],
    techEyebrow: 'More than a mariachi',
    techHeading: 'Your mariachi is also your marketing team',
    techIntro:
      "I'm Cesar Rios, and I play vihuela in Mariachi El Cuis. By day I'm a Lead Software Engineer building enterprise e-commerce sites that bring in millions of visits. I also run Google profiles, websites, and ads for small businesses around the area. I want to put all of that to work so your mariachi night is a success.",
    engineerBadge: 'Cesar Rios · Lead Software Engineer',
    portfolioLink: 'See my engineering portfolio',
    mariachiCaption: 'On stage',
    engineeringCaption: 'At the office',
    mariachiPhotoAlt: 'Cesar Rios in a charro suit, holding a mariachi sombrero.',
    engineeringPhotoAlt: 'Cesar Rios (right) with his software engineering team.',
    services: [
      {
        icon: 'pin',
        title: 'Google Business Profile',
        body: 'We post your mariachi night as an event on Google Search and Maps, with fresh photos and video each week.',
      },
      {
        icon: 'camera',
        title: 'Video from your restaurant',
        body: 'We film reels at your venue and post them on our Instagram, Facebook, and YouTube, tagging you.',
      },
      {
        icon: 'megaphone',
        title: 'Targeted ads',
        body: 'Meta and Google ads aimed at people near your restaurant, on a budget we plan together.',
      },
      {
        icon: 'chart',
        title: 'Results you can measure',
        body: 'A unique link, QR code, or reservation code so you can see how many guests came for the mariachi.',
      },
    ],
    proofHeading: 'Real results',
    proofIntro: 'Screenshots from accounts I manage — my own mariachi and local businesses in the area.',
    proof: [
      {
        img: 'meta',
        stat: '$44.92 → 2,122 views',
        title: 'Meta ads for Mariachi El Cuis',
        body: 'One boosted reel for under $45: 2,122 views, 980 engagements, and 17 message conversations in 60 days.',
        alt: 'Meta ads summary: 2,122 views, 1,216 viewers, and 980 post engagements.',
      },
      {
        img: 'ga4',
        stat: '431 visitors',
        title: 'Mariachi El Cuis website',
        body: 'A new site I built: 431 visitors in its first 28 days, per Google Analytics.',
        alt: 'Google Analytics: 431 active users and 2.2K events over the last 28 days.',
      },
      {
        img: 'medinas',
        stat: '5.0★ · 1,030 interactions',
        title: "Medina's Mobile Tire Service",
        body: 'A Google profile I manage: 5.0 stars from 26 reviews and 1,030 customer interactions.',
        alt: "Medina's Mobile Tire Service Google profile: 5.0 stars, 26 reviews, 1,030 customer interactions.",
      },
      {
        img: 'profiles',
        stat: 'Verified profiles',
        title: 'Local businesses I manage',
        body: "Verified Google Business Profiles for Medina's Mobile Tire Service and RnR Electrician.",
        alt: "List of Google profiles I manage: Medina's Mobile Tires Service and RnR Electrician.",
      },
    ],
    bandHeading: 'About Mariachi El Cuis',
    bandBody:
      'We are a five-piece ensemble: two trumpets, vihuela, guitarrón, and violin. We play rancheras, boleros, huapangos, and sones, and at every event we play what the audience requests.',
    bandLink: 'Watch more videos',
    groupAlt:
      'The five musicians of Mariachi El Cuis in charro suits, holding violins, trumpet, guitarrón, and vihuela.',
    tequilaVideoTitle: 'Una Pura y Dos Con Sal — Mariachi El Cuis live',
    bandVideoTitle: 'Música para Bailar — Mariachi El Cuis live',
    quoteHeading: "Let's talk about your weekly night",
    quoteBody:
      "Tell me your restaurant, city, which night you have in mind, and the hours. I'll send a proposal with a weekly rate and a marketing plan.",
    messagePlaceholder: 'Restaurant, city, night (Tuesday, Thursday, Sunday…), and hours',
  },
} as const

const ICONS = {
  user: UserCheck,
  calendar: CalendarDays,
  pin: MapPin,
  camera: Camera,
  megaphone: Megaphone,
  chart: BarChart3,
} as const

const PROOF_IMAGES = {
  meta: metaAds,
  ga4: ga4Traffic,
  medinas: medinasProfile,
  profiles: profilesManaged,
} as const

export async function generateMetadata({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  const locale: Locale = isLocale(lang) ? lang : 'es'
  const t = COPY[locale]
  return buildMetadata({
    locale,
    path: '/restaurantes',
    title: t.title,
    description: t.description,
    titleAbsolute: true,
    noindex: true,
  })
}

const linkCls =
  'text-sm font-medium text-burnished-gold underline underline-offset-4 hover:no-underline'

export default async function RestaurantsPage({ params }: { params: Promise<{ lang: string }> }) {
  const { lang } = await params
  if (!isLocale(lang)) notFound()
  const locale = lang
  const dict = await getDictionary(locale)
  const t = COPY[locale]

  return (
    <main id="main">
      <Section className="overflow-hidden border-b border-charcoal-border bg-surface-container-lowest">
        <div className="flex flex-col items-center gap-10 md:flex-row md:gap-12">
          <div className="md:w-1/2">
            <p className="inline-flex items-center gap-2 rounded-full border border-burnished-gold/60 bg-burnished-gold/10 px-4 py-1.5 text-sm font-semibold uppercase tracking-wider text-burnished-gold">
              {t.badge}
            </p>
            <h1 className="mt-5 font-display text-4xl text-burnished-gold md:text-6xl">
              {t.heading}
            </h1>
            <p className="mt-5 text-lg font-semibold text-crema-white">{t.nights}</p>
            <p className="mt-3 max-w-xl text-on-surface-variant">{t.intro}</p>
            <div className="mt-8 flex flex-wrap gap-4">
              <a href={`tel:${siteConfig.phoneTel}`} className={buttonClasses('primary')}>
                {t.call} {siteConfig.phoneDisplay}
              </a>
              <a href="#quote" className={buttonClasses('ghost')}>
                {t.cta}
              </a>
            </div>
          </div>
          <div className="relative w-full md:w-1/2">
            <div
              aria-hidden="true"
              className="absolute inset-0 rounded-full bg-[radial-gradient(circle_at_50%_60%,rgba(242,166,68,0.32),rgba(214,84,84,0.18)_45%,transparent_70%)]"
            />
            <Image
              src={groupPhoto}
              alt={t.groupAlt}
              priority
              sizes="(max-width: 768px) 100vw, 50vw"
              className="relative h-auto w-full"
            />
          </div>
        </div>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
          {t.formatsHeading}
        </h2>
        <ul className="mt-6 grid gap-4 md:grid-cols-3">
          {t.formats.map((f) => (
            <li
              key={f.name}
              className="rounded-xl border border-burnished-gold bg-surface-container p-6"
            >
              <p className="font-display text-2xl text-crema-white">{f.name}</p>
              <p className="mt-2 text-on-surface-variant">{f.body}</p>
            </li>
          ))}
        </ul>

        <h2 className="mt-16 font-display text-2xl text-burnished-gold md:text-3xl">
          {t.whyHeading}
        </h2>
        <ul className="mt-6 grid gap-6 md:grid-cols-3">
          {t.why.map((w) => {
            const Icon = ICONS[w.icon]
            return (
              <li key={w.title} className="flex gap-4">
                <Icon aria-hidden="true" className="mt-1 h-6 w-6 shrink-0 text-burnished-gold" />
                <div>
                  <p className="font-semibold text-crema-white">{w.title}</p>
                  <p className="mt-1 text-on-surface-variant">{w.body}</p>
                </div>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section className="border-y border-charcoal-border bg-surface-container-lowest">
        <div className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12">
          <div>
          <p className="text-sm font-semibold uppercase tracking-wider text-muted-silver">
            {t.techEyebrow}
          </p>
          <h2 className="mt-2 font-display text-3xl text-burnished-gold md:text-4xl">
            {t.techHeading}
          </h2>
          <p className="mt-4 inline-flex items-center gap-2 rounded-full border border-burnished-gold/60 bg-burnished-gold/10 px-4 py-1.5 text-sm font-semibold text-crema-white">
            <Code2 aria-hidden="true" className="h-4 w-4 text-burnished-gold" />
            {t.engineerBadge}
          </p>
          <p className="mt-4 max-w-2xl text-on-surface">{t.techIntro}</p>
          <a
            href={PORTFOLIO_URL}
            target="_blank"
            rel="noopener noreferrer"
            className={buttonClasses('primary', 'mt-6')}
          >
            {t.portfolioLink}
            <ExternalLink aria-hidden="true" className="h-4 w-4" />
          </a>
          </div>
          {/* Same person, two worlds: on stage with the band and at work with the engineering team. */}
          <div className="grid grid-cols-2 gap-4">
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-charcoal-border bg-[radial-gradient(circle_at_50%_55%,rgba(242,166,68,0.35),rgba(214,84,84,0.15)_50%,transparent_75%)]">
                <Image
                  src={cesarMariachi}
                  alt={t.mariachiPhotoAlt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className="object-contain object-bottom px-3 pt-5"
                />
              </div>
              <figcaption className="mt-2 text-center text-sm font-semibold text-crema-white">
                {t.mariachiCaption}
              </figcaption>
            </figure>
            <figure>
              <div className="relative aspect-[4/5] overflow-hidden rounded-xl border border-charcoal-border">
                <Image
                  src={engineeringTeam}
                  alt={t.engineeringPhotoAlt}
                  fill
                  sizes="(max-width: 1024px) 50vw, 300px"
                  className="object-cover object-[80%_center]"
                />
              </div>
              <figcaption className="mt-2 text-center text-sm font-semibold text-crema-white">
                {t.engineeringCaption}
              </figcaption>
            </figure>
          </div>
        </div>
        <ul className="mt-10 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {t.services.map((s) => {
            const Icon = ICONS[s.icon]
            return (
              <li
                key={s.title}
                className="rounded-xl border border-charcoal-border bg-surface-container p-5"
              >
                <Icon aria-hidden="true" className="h-6 w-6 text-burnished-gold" />
                <p className="mt-3 font-semibold text-crema-white">{s.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{s.body}</p>
              </li>
            )
          })}
        </ul>
      </Section>

      <Section>
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.proofHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.proofIntro}</p>
        <ul className="mt-8 grid gap-6 md:grid-cols-2">
          {t.proof.map((p) => (
            <li
              key={p.title}
              className="flex flex-col overflow-hidden rounded-xl border border-charcoal-border bg-surface-container"
            >
              <div className="p-5">
                <p className="font-display text-3xl text-burnished-gold">{p.stat}</p>
                <p className="mt-1 font-semibold text-crema-white">{p.title}</p>
                <p className="mt-1 text-sm text-on-surface-variant">{p.body}</p>
              </div>
              <div className="mt-auto border-t border-charcoal-border bg-white">
                <Image
                  src={PROOF_IMAGES[p.img]}
                  alt={p.alt}
                  sizes="(max-width: 768px) 100vw, 600px"
                  className="h-auto w-full"
                />
              </div>
            </li>
          ))}
        </ul>
      </Section>

      <Section className="border-t border-charcoal-border bg-surface-container-lowest">
        {/* Landscape band reel under the copy; the vertical tequila clip beside it. */}
        <div className="grid items-start gap-8 md:grid-cols-[1fr_16rem] md:gap-12">
          <div>
            <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">
              {t.bandHeading}
            </h2>
            <p className="mt-3 max-w-xl text-on-surface-variant">{t.bandBody}</p>
            <Link
              href={localizedPath('/media', locale)}
              className={`mt-4 inline-block ${linkCls}`}
            >
              {t.bandLink}
            </Link>
            <div className="mt-8 max-w-xl">
              <VideoFacade
                src={BAND_VIDEO.src}
                poster={BAND_VIDEO.poster}
                title={t.bandVideoTitle}
              />
            </div>
          </div>
          <div className="mx-auto w-full max-w-64">
            <VideoFacade
              src={TEQUILA_VIDEO.src}
              poster={TEQUILA_VIDEO.poster}
              title={t.tequilaVideoTitle}
              vertical
            />
          </div>
        </div>
      </Section>

      <Section id="quote" className="border-t border-charcoal-border bg-surface-container">
        <h2 className="font-display text-2xl text-burnished-gold md:text-3xl">{t.quoteHeading}</h2>
        <p className="mt-3 max-w-2xl text-on-surface-variant">{t.quoteBody}</p>
        <div className="mt-8">
          <ContactForm
            dict={dict}
            locale={locale}
            source="restaurants"
            messagePlaceholder={t.messagePlaceholder}
          />
        </div>
      </Section>
    </main>
  )
}
