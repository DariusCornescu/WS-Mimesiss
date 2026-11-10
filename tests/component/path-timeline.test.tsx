// @vitest-environment jsdom
import '@testing-library/jest-dom/vitest'
import { cleanup, render, screen } from '@testing-library/react'
import type { ComponentProps } from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { PathHeroTimer, PathRegistration } from '../../src/components/path/PathTimeline'

vi.mock('next/link', () => ({
  default: ({ href, children, ...props }: ComponentProps<'a'> & { href: string }) => <a href={href} {...props}>{children}</a>,
}))

const epoch = (iso: string) => Math.floor(Date.parse(iso) / 1000)

function at(iso: string) {
  vi.setSystemTime(new Date(iso))
  return epoch(iso)
}

beforeEach(() => { vi.useFakeTimers() })
afterEach(() => { cleanup(); vi.useRealTimers() })

describe('PATH timeline', () => {
  it('counts down to the opening of registrations before 18 November', () => {
    render(<PathHeroTimer renderedAt={at('2026-11-17T22:59:58+02:00')} />)
    expect(screen.getByText('Înscrierile se deschid în')).toBeInTheDocument()
    const timer = screen.getByRole('timer', { name: 'Timp rămas până la deschiderea înscrierilor PATH' })
    expect(timer).toHaveTextContent('00zile01oră00minute02secunde')
  })

  it('counts down to the event once registrations are open', () => {
    render(<PathHeroTimer renderedAt={at('2026-12-03T00:00:00+02:00')} />)
    expect(screen.getByText('PATH începe în')).toBeInTheDocument()
    expect(screen.getByRole('timer', { name: 'Timp rămas până la PATH' })).toHaveTextContent('01zi00ore00minute00secunde')
  })

  it('announces the event while it runs and after it ends', () => {
    const { unmount } = render(<PathHeroTimer renderedAt={at('2026-12-05T12:00:00+02:00')} />)
    expect(screen.getByText('PATH se desfășoară acum.')).toBeInTheDocument()
    expect(screen.queryByRole('timer')).not.toBeInTheDocument()
    unmount()
    render(<PathHeroTimer renderedAt={at('2026-12-06T00:00:00+02:00')} />)
    expect(screen.getByText('Prima ediție PATH s-a încheiat.')).toBeInTheDocument()
  })

  it('trusts the browser clock over a stale server render', () => {
    vi.setSystemTime(new Date('2026-11-20T10:00:00+02:00'))
    render(<PathHeroTimer renderedAt={epoch('2026-11-10T10:00:00+02:00')} />)
    expect(screen.getByText('PATH începe în')).toBeInTheDocument()
  })

  it('explains registration before it opens and does not offer a link until one is configured', () => {
    const { unmount } = render(<PathRegistration renderedAt={at('2026-11-10T10:00:00+02:00')} />)
    expect(screen.getByRole('heading', { name: 'Înscrierile se deschid pe 18 noiembrie.' })).toBeInTheDocument()
    expect(screen.getByRole('timer')).toBeInTheDocument()
    unmount()
    render(<PathRegistration renderedAt={at('2026-11-18T09:00:00+02:00')} />)
    expect(screen.getByRole('heading', { name: 'Înscrierile se deschid în scurt timp.' })).toBeInTheDocument()
    expect(screen.queryByRole('link')).not.toBeInTheDocument()
  })
})
