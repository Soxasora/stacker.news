import { normalizeHexColor, hexToRgbTriplet } from '@/lib/color'

// generates CSS variable overrides for Bootstrap and theme colors
// from a per-sub theme row (colors, defaultMode, logo).
export function buildSubThemeCss (theme) {
  if (!theme) return null

  const overrides = []

  const primaryHex = normalizeHexColor(theme.primaryColor)
  if (primaryHex) {
    overrides.push(`--bs-primary: ${primaryHex};`)
    const primaryRgb = hexToRgbTriplet(primaryHex)
    if (primaryRgb) overrides.push(`--bs-primary-rgb: ${primaryRgb};`)
  }

  const secondaryHex = normalizeHexColor(theme.secondaryColor)
  if (secondaryHex) {
    overrides.push(`--bs-secondary: ${secondaryHex};`)
    const secondaryRgb = hexToRgbTriplet(secondaryHex)
    if (secondaryRgb) overrides.push(`--bs-secondary-rgb: ${secondaryRgb};`)
  }

  const linkHex = normalizeHexColor(theme.linkColor)
  if (linkHex) {
    overrides.push(`--theme-link: ${linkHex};`)
    overrides.push(`--theme-linkHover: ${linkHex};`)
  }

  if (overrides.length === 0) return null

  // REVIEW: not so beautiful
  // ensures variables are set at the highest level for both theme modes
  return `:root:root,[data-bs-theme=light][data-bs-theme=light],[data-bs-theme=dark][data-bs-theme=dark]{${overrides.join('')}}`
}
