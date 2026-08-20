/**
 * JS-side mirror of the CSS custom properties in src/app/globals.css.
 *
 * Only for contexts that cannot read CSS variables: canvas-rendered QR codes,
 * the Stripe Elements appearance API, and web app manifests. Everything that
 * renders as DOM should use the Tailwind tokens instead.
 *
 * Keep these in sync with the :root block in globals.css.
 */
export const BRAND = {
  /** --primary  220 100% 70% */
  primary: '#6699FF',
  /**
   * --primary at 30% lightness (same hue and saturation).
   *
   * Used for QR modules, which need luminance contrast to scan reliably rather
   * than to look on-brand: #6699FF is only 2.78:1 against white, while this is
   * 10.86:1. Printed tickets and low-end phone cameras depend on it.
   */
  primaryDeep: '#003399',
  /** --accent-foreground; 7.57:1 on primary */
  onPrimary: '#000000',
  /** --background  240 3% 6% */
  background: '#0F0F10',
  /** --foreground */
  foreground: '#FFFFFF',
  /** --destructive  5.6 100% 50% */
  destructive: '#FF1800',
  /** --muted-foreground  217.9 10.6% 64.9% */
  mutedForeground: '#9CA3AF',
  /**
   * Neutral border for Stripe input fields. Deliberately NOT --input, which is
   * brand purple and would look wrong on a checkout form.
   */
  neutralBorder: '#374151',
} as const;
