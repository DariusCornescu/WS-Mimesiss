// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { act, cleanup, fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import AssociationHeader from '../../src/components/asociatie/AssociationHeader'

// jsdom has no CSS layout, so desktop/mobile visibility (pure CSS) is left to
// the browser suite. These tests cover render conditions, ARIA state and focus.

const mockState = vi.hoisted(() => ({ pathname: '/', signedIn: false }))

vi.mock('next/navigation', () => ({
  usePathname: () => mockState.pathname,
}))

vi.mock('next/image', () => ({
  default: ({ priority, alt, ...props }: ComponentProps<'img'> & { priority?: boolean }) => (
    // eslint-disable-next-line @next/next/no-img-element
    <img alt={alt} data-priority={priority ? 'true' : undefined} {...props} />
  ),
}))

vi.mock('next/link', () => ({
  default: ({ href, onClick, children, ...props }: ComponentProps<'a'> & { href: string }) => (
    <a
      href={href}
      onClick={(event) => {
        // jsdom does not implement navigation; keep clicks on the page.
        event.preventDefault()
        onClick?.(event)
      }}
      {...props}
    >
      {children}
    </a>
  ),
}))

const CONGRESS_LABELS = [
  'Prezentare',
  'Informații',
  'Program',
  'Ateliere',
  'Ediții anterioare',
  'Galerie',
  'Regulament',
  'Ghid abstracte',
]

// jsdom implements neither modal dialogs nor layout; model just enough for focus and ARIA tests.
function installBrowserShims() {
  HTMLDialogElement.prototype.showModal = function showModal(this: HTMLDialogElement) { this.setAttribute('open', '') }
  HTMLDialogElement.prototype.close = function close(this: HTMLDialogElement) { this.removeAttribute('open') }
  vi.spyOn(HTMLElement.prototype, 'getClientRects').mockReturnValue([{}] as unknown as DOMRectList)
  vi.stubGlobal('matchMedia', (query: string) => ({ matches: false, media: query, addEventListener() {}, removeEventListener() {} }))
  vi.stubGlobal('fetch', vi.fn(async () => Response.json({ signedIn: mockState.signedIn })))
}

async function renderHeader({ pathname = '/', signedIn = false } = {}) {
  mockState.pathname = pathname
  mockState.signedIn = signedIn
  const user = userEvent.setup()
  const utils = render(<AssociationHeader />)
  await act(async () => {})
  const toggle = screen.getByRole('button', { name: 'Deschide meniul' })

  const openMenu = async () => {
    await user.click(toggle)
    return screen.getByRole('dialog', { name: 'Navigație mobilă' })
  }
  const dismissWithEscape = () => fireEvent(screen.getByRole('dialog'), new Event('cancel', { cancelable: true }))

  return { ...utils, user, toggle, openMenu, dismissWithEscape }
}

beforeEach(() => {
  installBrowserShims()
  document.body.style.overflow = ''
})

afterEach(() => {
  cleanup()
  vi.unstubAllGlobals()
  vi.restoreAllMocks()
  document.body.style.overflow = ''
})

describe('AssociationHeader mobile menu', () => {
  it('renders a closed toggle wired to the menu dialog', async () => {
    const { toggle } = await renderHeader()

    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAttribute('aria-controls', 'association-menu')
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.getElementById('association-menu')).toBeNull()
  })

  it('opens a modal dialog, moves focus into it and locks page scroll', async () => {
    const { toggle, openMenu } = await renderHeader()
    const dialog = await openMenu()

    expect(dialog).toHaveAttribute('id', 'association-menu')
    expect(toggle).toHaveAttribute('aria-expanded', 'true')
    expect(toggle).toHaveAccessibleName('Închide meniul')
    expect(within(dialog).getByRole('button', { name: 'Închide meniul' })).toHaveFocus()
    expect(document.body.style.overflow).toBe('hidden')
  })

  it('closes on Escape, restores focus to the toggle and the previous overflow', async () => {
    const { toggle, openMenu, dismissWithEscape } = await renderHeader()
    document.body.style.overflow = 'auto'
    await openMenu()

    // The browser turns Escape on a modal dialog into a cancel event.
    dismissWithEscape()
    await act(async () => {})

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toggle).toHaveFocus()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(toggle).toHaveAccessibleName('Deschide meniul')
    expect(document.body.style.overflow).toBe('auto')
  })

  it('returns focus to the toggle when the in-panel close button is used', async () => {
    const { user, toggle, openMenu } = await renderHeader()
    const dialog = await openMenu()

    await user.click(within(dialog).getByRole('button', { name: 'Închide meniul' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toggle).toHaveFocus()
  })

  it('closes from the backdrop and releases the scroll lock', async () => {
    const { user, openMenu } = await renderHeader()
    const dialog = await openMenu()

    // A click on the dialog element itself is a click on its backdrop.
    await user.click(dialog)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(document.body.style.overflow).toBe('')
  })

  it('keeps Tab and Shift+Tab inside the panel', async () => {
    const { user, openMenu } = await renderHeader()
    const dialog = await openMenu()
    const first = within(dialog).getByRole('link', { name: 'ASMM — Acasă' })
    const last = within(dialog).getByRole('link', { name: 'Creează cont' })
    first.focus()

    await user.tab({ shift: true })
    expect(last).toHaveFocus()

    await user.tab()
    expect(first).toHaveFocus()

    // Ordinary forward movement inside the panel is not intercepted.
    await user.tab()
    expect(within(dialog).getByRole('button', { name: 'Închide meniul' })).toHaveFocus()
  })

  it('closes the menu when the route changes', async () => {
    const { rerender, toggle, openMenu } = await renderHeader()
    await openMenu()

    mockState.pathname = '/contact'
    rerender(<AssociationHeader />)

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.body.style.overflow).toBe('')
  })
})

describe('AssociationHeader congress navigation', () => {
  it('expands and collapses the congress links inside the mobile menu', async () => {
    const { user, openMenu } = await renderHeader()
    const dialog = await openMenu()
    const congressToggle = within(dialog).getByRole('button', { name: 'Congresul MIMESISS' })

    expect(congressToggle).toHaveAttribute('aria-expanded', 'false')
    expect(congressToggle).toHaveAttribute('aria-controls', 'mobile-congress-links')
    expect(document.getElementById('mobile-congress-links')).toBeNull()

    await user.click(congressToggle)

    expect(congressToggle).toHaveAttribute('aria-expanded', 'true')
    const group = document.getElementById('mobile-congress-links')
    expect(group).not.toBeNull()
    expect(within(group!).getAllByRole('link').map((link) => link.textContent)).toEqual(CONGRESS_LABELS)

    await user.click(congressToggle)

    expect(congressToggle).toHaveAttribute('aria-expanded', 'false')
    expect(document.getElementById('mobile-congress-links')).toBeNull()
  })

  it('closes after following a congress link and reopens with the group collapsed', async () => {
    const { user, toggle, openMenu } = await renderHeader()
    const dialog = await openMenu()
    await user.click(within(dialog).getByRole('button', { name: 'Congresul MIMESISS' }))

    await user.click(within(dialog).getByRole('link', { name: 'Program' }))

    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
    expect(toggle).toHaveAttribute('aria-expanded', 'false')

    const reopened = await openMenu()
    expect(within(reopened).getByRole('button', { name: 'Congresul MIMESISS' })).toHaveAttribute('aria-expanded', 'false')
  })

  it('shows the congress sub-navigation and marks the current page inside the congress', async () => {
    const { user, openMenu } = await renderHeader({ pathname: '/congres/program' })

    const congressNav = screen.getByRole('navigation', { name: 'Navigație congres' })
    expect(within(congressNav).getByRole('link', { name: 'Program' })).toHaveAttribute('aria-current', 'page')
    // The overview link is only current on /congres itself.
    expect(within(congressNav).getByRole('link', { name: 'Prezentare' })).not.toHaveAttribute('aria-current')

    const primaryNav = screen.getByRole('navigation', { name: 'Navigație principală' })
    expect(within(primaryNav).getByRole('link', { name: 'MIMESISS' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNav).getByRole('link', { name: 'Acasă' })).not.toHaveAttribute('aria-current')

    const dialog = await openMenu()
    const congressToggle = within(dialog).getByRole('button', { name: 'Congresul MIMESISS' })
    expect(congressToggle).toHaveAttribute('data-active', 'true')

    await user.click(congressToggle)
    const group = document.getElementById('mobile-congress-links')!
    expect(within(group).getByRole('link', { name: 'Program' })).toHaveAttribute('aria-current', 'page')
  })

  it('omits the congress sub-navigation outside the congress section', async () => {
    await renderHeader({ pathname: '/despre' })

    expect(screen.queryByRole('navigation', { name: 'Navigație congres' })).not.toBeInTheDocument()
    const primaryNav = screen.getByRole('navigation', { name: 'Navigație principală' })
    expect(within(primaryNav).getByRole('link', { name: 'Despre noi' })).toHaveAttribute('aria-current', 'page')
    expect(within(primaryNav).getByRole('link', { name: 'MIMESISS' })).not.toHaveAttribute('aria-current')
  })
})

describe('AssociationHeader account controls', () => {
  it('keeps the account link available when the session lookup fails', async () => {
    vi.stubGlobal('fetch', vi.fn(async () => new Response('{}', { status: 500 })))
    await renderHeader()

    expect(screen.getByRole('link', { name: 'Contul meu' })).toHaveAttribute('title', expect.stringContaining('Starea sesiunii'))
    expect(screen.queryByRole('link', { name: 'Conectare' })).not.toBeInTheDocument()
  })

  it('offers a skip link and sign-in links when signed out', async () => {
    await renderHeader()

    expect(screen.getByRole('link', { name: 'Sari la conținut' })).toHaveAttribute('href', '#site-main')
    expect(screen.getByRole('link', { name: 'Conectare' })).toHaveAttribute('href', '/auth/login')
    expect(screen.getByRole('link', { name: 'Creează cont' })).toHaveAttribute('href', '/auth/signup')
    expect(screen.queryByRole('link', { name: 'Contul meu' })).not.toBeInTheDocument()
  })

  it('shows the account link when signed in, on desktop and in the menu', async () => {
    const { openMenu } = await renderHeader({ signedIn: true })

    expect(screen.getByRole('link', { name: 'Contul meu' })).toHaveAttribute('href', '/dashboard')
    expect(screen.queryByRole('link', { name: 'Conectare' })).not.toBeInTheDocument()

    const dialog = await openMenu()
    expect(within(dialog).getByRole('link', { name: 'Contul meu' })).toHaveAttribute('href', '/dashboard')
    expect(within(dialog).queryByRole('link', { name: 'Creează cont' })).not.toBeInTheDocument()
  })
})
