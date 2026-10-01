import type { Locale } from '@/lib/i18n/locales'

// Every promise and selling line on /book lives here, so it can be edited in
// one place. Only publish claims that hold for every gig: the owner has
// confirmed "no substitute groups" as the guarantee; nothing else (arrival
// time, confirmation windows) is promised.
export type BookFaqItem = { q: string; a: string }

export type BookPageCopy = {
  heroTitle: string
  guarantee: string
  chips: { price: string; noSubs: string; noEmail: string }
  guaranteeHeading: string
  guaranteeItems: string[]
  meetMusicians: string
  talkHeading: string
  talkIntro: string
  whatsappLabel: string
  whatsappText: string
  callLabel: string
  faqHeading: string
  faq: BookFaqItem[]
  pricingQuestion: string
}

export const BOOK_PAGE: Record<Locale, BookPageCopy> = {
  es: {
    heroTitle: 'Ve tu precio en 60 segundos 🎺',
    guarantee: 'Contratas Mariachi El Cuis, llega Mariachi El Cuis. Sin sustitutos.',
    chips: {
      price: 'Precio al instante',
      noSubs: 'Sin sustitutos',
      noEmail: 'Sin dar tu correo',
    },
    guaranteeHeading: 'Nuestra garantía',
    guaranteeItems: [
      'Contratas Mariachi El Cuis, llega Mariachi El Cuis — nunca mandamos otro grupo',
      'Ves tu precio antes de darnos tus datos',
      'Tu fecha queda apartada con el depósito',
      'Recibes la confirmación de tu reserva por correo',
    ],
    meetMusicians: 'Conoce a los músicos',
    talkHeading: '¿Prefieres hablar con alguien?',
    talkIntro: 'Escríbenos o llámanos y te ayudamos con tu cotización.',
    whatsappLabel: 'WhatsApp',
    whatsappText: 'Hola, quiero cotizar mariachi para mi evento',
    callLabel: 'Llamar',
    faqHeading: 'Preguntas frecuentes',
    faq: [
      {
        q: '¿El precio es final?',
        a: 'El precio que ves es un estimado para tu fecha, horario y dirección, sujeto a aprobación. Si tu evento queda fuera de nuestra zona, el formulario te pedirá que nos contactes.',
      },
      {
        q: '¿Llegan ustedes o mandan otro grupo?',
        a: 'Llegamos nosotros. Contratas Mariachi El Cuis, llega Mariachi El Cuis — nunca mandamos otro grupo en nuestro lugar.',
      },
      {
        q: '¿Puedo cambiar la fecha?',
        a: 'Llámanos para revisar que tengamos disponibilidad. Cambiar la fecha puede tener un cargo extra, y según el caso podrías perder el depósito.',
      },
      {
        q: '¿Cubren mi ciudad?',
        a: 'Damos precio al instante en todo el Condado de Los Ángeles. Para eventos fuera del condado, escríbenos o llámanos y lo revisamos.',
      },
    ],
    pricingQuestion: '¿Cómo calculan el precio?',
  },
  en: {
    heroTitle: 'See your price in 60 seconds 🎺',
    guarantee: 'Hire Mariachi El Cuis, get Mariachi El Cuis. No subs.',
    chips: {
      price: 'Instant price',
      noSubs: 'No subs',
      noEmail: 'No email needed',
    },
    guaranteeHeading: 'Our guarantee',
    guaranteeItems: [
      'Hire Mariachi El Cuis, get Mariachi El Cuis — we never send another group',
      'See your price before you give us your details',
      'Your date is held with the deposit',
      'You get your booking confirmation by email',
    ],
    meetMusicians: 'Meet the musicians',
    talkHeading: 'Prefer to talk?',
    talkIntro: 'Message or call us and we will help with your quote.',
    whatsappLabel: 'WhatsApp',
    whatsappText: "Hi, I'd like a mariachi quote",
    callLabel: 'Call',
    faqHeading: 'Frequently asked questions',
    faq: [
      {
        q: 'Is the price final?',
        a: 'The price you see is an estimate for your date, time, and address, subject to approval. If your event is outside our area, the form will ask you to contact us.',
      },
      {
        q: 'Do you show up, or send another group?',
        a: 'We show up. Hire Mariachi El Cuis, get Mariachi El Cuis — we never send another group in our place.',
      },
      {
        q: 'Can I change the date?',
        a: 'Call us so we can check availability. Changing the date may carry an extra charge, and in some cases you could lose the deposit.',
      },
      {
        q: 'Do you cover my city?',
        a: 'We give instant prices across Los Angeles County. For events outside the county, message or call us and we will review it.',
      },
    ],
    pricingQuestion: 'How do you calculate the price?',
  },
}
