import { afterEach, describe, expect, it, vi } from 'vitest'
import { authErrorMessage } from '@/lib/auth-errors'

const fallback = 'Nu am putut crea contul. Încearcă din nou.'

describe('authErrorMessage', () => {
  afterEach(() => vi.restoreAllMocks())

  it('translates a known error', () => {
    expect(authErrorMessage({ errors: [{ code: 'form_identifier_exists' }] }, fallback)).toMatch(/deja înregistrată/)
  })

  it("quotes the provider's own minimum password length", () => {
    const error = { errors: [{ code: 'form_password_length_too_short', message: 'Passwords must be 15 characters or more.' }] }
    expect(authErrorMessage(error, fallback)).toBe('Parola trebuie să aibă cel puțin 15 caractere.')
    expect(authErrorMessage({ errors: [{ code: 'form_password_length_too_short' }] }, fallback)).toBe('Parola trebuie să aibă cel puțin 8 caractere.')
  })

  it('falls back for an unknown error and records its code', () => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(authErrorMessage({ errors: [{ code: 'form_param_unknown' }] }, fallback)).toBe(fallback)
    expect(logged).toHaveBeenCalledWith('Unhandled authentication error:', 'form_param_unknown')
  })

  it.each([null, undefined, 'boom', new Error('network'), { errors: [] }])('falls back quietly for %s', value => {
    const logged = vi.spyOn(console, 'error').mockImplementation(() => {})
    expect(authErrorMessage(value, fallback)).toBe(fallback)
    expect(logged).not.toHaveBeenCalled()
  })
})
