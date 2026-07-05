import logoHero from '@/assets/brand/logo-nuvemmais-hero.svg'
import logoHorizontal from '@/assets/brand/logo-nuvemmais-horizontal.svg'
import logoSimbolo from '@/assets/brand/nuvemmais-marca.svg'

export const logoApp = logoSimbolo

const logoFallbackMarkup = `
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 96 96" role="img" aria-label="NuvemMais Gestão">
  <defs>
    <linearGradient id="fallback-bg" x1="12" y1="8" x2="84" y2="88" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#2563eb" />
      <stop offset="1" stop-color="#0f172a" />
    </linearGradient>
    <linearGradient id="fallback-line" x1="24" y1="18" x2="74" y2="80" gradientUnits="userSpaceOnUse">
      <stop offset="0" stop-color="#7dd3fc" />
      <stop offset="1" stop-color="#38bdf8" />
    </linearGradient>
  </defs>
  <rect width="96" height="96" rx="24" fill="url(#fallback-bg)" />
  <path d="M27 28h10.5L48 44.7 58.5 28H69v40H58.7V46.4L48 62.3 37.3 46.4V68H27V28Z" fill="#ffffff" />
  <path d="M28 73.5h43.8c7.4 0 13.4-6 13.4-13.4 0-5.4-3.2-10.3-8.2-12.4" fill="none" stroke="url(#fallback-line)" stroke-linecap="round" stroke-width="4" />
</svg>
`.trim()

export const logoFallbackSvg = `data:image/svg+xml;charset=UTF-8,${encodeURIComponent(logoFallbackMarkup)}`

export const BRAND_NAME = 'NuvemMais Gestão'
export const BRAND_TAGLINE = 'Gestão empresarial na nuvem'

export const brandAssets = Object.freeze({
  logoHorizontal,
  logoSimbolo,
  logoHero,
  logoApp,
  logoFallbackSvg,
})

export {
  logoHorizontal,
  logoSimbolo,
  logoHero,
}
