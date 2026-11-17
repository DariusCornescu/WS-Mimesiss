import type { AppSettingsPlain } from '@/lib/settings'

/**
 * Whether participants can pick their workshops right now. Used only for the
 * wording shown after a purchase; registration itself checks its own gates.
 */
export function workshopChoiceOpen(
  settings: Pick<AppSettingsPlain, 'globalRegistrationEnabled' | 'registrationStartTime' | 'registrationDeadline'>,
  now = Date.now(),
): boolean {
  if (!settings.globalRegistrationEnabled) return false
  if (settings.registrationStartTime && Date.parse(settings.registrationStartTime) > now) return false
  if (settings.registrationDeadline && Date.parse(settings.registrationDeadline) < now) return false
  return true
}
