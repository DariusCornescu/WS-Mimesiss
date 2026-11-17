/**
 * Minimum password length shown and checked by the site's own forms.
 *
 * The rule that is actually enforced lives in the sign-in provider's dashboard
 * (Production instance → User & authentication → Password). Keep this value
 * equal to it, so the forms do not accept a password the provider will reject.
 */
export const PASSWORD_MIN_LENGTH = 10
