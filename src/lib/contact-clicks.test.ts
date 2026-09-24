import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { contactClickEvent, handleContactClick } from './contact-clicks'

type FakeEl = {
  getAttribute: (name: string) => string | null
  closest: (selector: string) => FakeEl | null
}

function anchor(href: string, location?: string): FakeEl {
  const section: FakeEl | null = location
    ? { getAttribute: (n) => (n === 'data-track-location' ? location : null), closest: () => null }
    : null
  const a: FakeEl = {
    getAttribute: (n) => (n === 'href' ? href : null),
    closest: (sel) => (sel === 'a[href]' ? a : sel === '[data-track-location]' ? section : null),
  }
  return a
}

function childOf(parent: FakeEl): FakeEl {
  return { getAttribute: () => null, closest: (sel) => (sel === 'a[href]' ? parent : null) }
}

const click = (target: FakeEl | null) => ({ target: target as unknown as EventTarget | null })

describe('contactClickEvent', () => {
  it.each([
    ['tel:+16269220091', 'phone_click'],
    [' TEL:+16269220091', 'phone_click'],
    ['https://wa.me/16269220091', 'whatsapp_click'],
    ['https://wa.me/16269220091?text=Hola', 'whatsapp_click'],
    ['https://www.wa.me/16269220091', 'whatsapp_click'],
    ['https://example.com/?ref=https://wa.me/1', null],
    ['/book', null],
    ['mailto:hola@mariachielcuis.com', null],
    ['', null],
    [null, null],
  ])('%s -> %s', (href, expected) => {
    expect(contactClickEvent(href)).toBe(expected)
  })
})

describe('handleContactClick', () => {
  let gtag: ReturnType<typeof vi.fn>

  beforeEach(() => {
    gtag = vi.fn()
    vi.stubGlobal('window', { gtag, dataLayer: [] })
  })

  afterEach(() => vi.unstubAllGlobals())

  it('sends phone_click with the page path when no location is tagged', () => {
    handleContactClick(click(anchor('tel:+16269220091')), '/en/book')
    expect(gtag).toHaveBeenCalledWith('event', 'phone_click', { link_location: '/en/book' })
  })

  it('uses the nearest data-track-location when present', () => {
    handleContactClick(click(anchor('https://wa.me/16269220091', 'hero')), '/')
    expect(gtag).toHaveBeenCalledWith('event', 'whatsapp_click', { link_location: 'hero' })
  })

  it('handles taps on an icon inside the link', () => {
    handleContactClick(click(childOf(anchor('tel:+16269220091'))), '/')
    expect(gtag).toHaveBeenCalledWith('event', 'phone_click', { link_location: '/' })
  })

  it('ignores other links, non-link targets and null targets', () => {
    handleContactClick(click(anchor('/book')), '/')
    handleContactClick(click({ getAttribute: () => null, closest: () => null }), '/')
    handleContactClick(click(null), '/')
    handleContactClick({ target: {} as EventTarget }, '/')
    expect(gtag).not.toHaveBeenCalled()
  })
})
