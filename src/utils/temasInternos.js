import { corComAlpha, criarMapaVisualPublico, misturarCores } from './temasPublicos.js'

export const TEMA_APARENCIA_CLARO = 'claro'
export const TEMA_APARENCIA_MODERNO = 'moderno'
export const TEMA_APARENCIA_ESCURO = 'escuro'
export const TEMA_APARENCIA_SUAVE = 'suave'
export const TEMA_APARENCIA_NUVEMMAIS = 'nuvemmais'

function criarTemaInternoCompartilhado({
  valor,
  nome,
  temaPublico,
  corPrincipal,
  corSecundaria,
  colorScheme = 'light',
  radius = '18px',
  shadow,
  shadowElevated,
  bgOverlay,
  sidebarBg,
  brandEnd,
  overrides = {},
} = {}) {
  const visual = criarMapaVisualPublico(corPrincipal, corSecundaria, temaPublico)
  const escuro = colorScheme === 'dark'

  return {
    valor,
    nome,
    colorScheme,
    tokens: {
      '--app-radius': radius,
      '--app-shadow':
        shadow || (escuro ? '0 24px 56px rgba(2, 6, 23, 0.34)' : '0 18px 42px rgba(15, 23, 42, 0.08)'),
      '--app-shadow-elevated':
        shadowElevated || (escuro ? '0 28px 64px rgba(2, 6, 23, 0.42)' : '0 24px 56px rgba(15, 23, 42, 0.12)'),
      '--app-bg': visual.fundo,
      '--app-bg-overlay':
        bgOverlay ||
        `radial-gradient(circle at top left, ${corComAlpha(visual.principal, escuro ? 0.18 : 0.12)}, transparent 32%), linear-gradient(180deg, ${misturarCores(visual.fundo, '#ffffff', escuro ? 0.06 : 0.18)} 0%, ${visual.fundo} 100%)`,
      '--app-surface': escuro ? corComAlpha(visual.card, 0.96) : corComAlpha('#ffffff', 0.94),
      '--app-surface-soft': escuro
        ? misturarCores(visual.card, '#020617', 0.18)
        : misturarCores(visual.fundo, '#ffffff', 0.48),
      '--app-surface-strong': escuro ? misturarCores(visual.card, '#000000', 0.1) : '#ffffff',
      '--app-text': visual.texto,
      '--app-text-muted': visual.textoSuave,
      '--app-primary': visual.principal,
      '--app-primary-strong': visual.destaque,
      '--app-primary-soft': corComAlpha(visual.principal, escuro ? 0.22 : 0.12),
      '--app-border': visual.borda,
      '--app-danger': escuro ? '#fda4af' : '#dc2626',
      '--app-danger-soft': escuro ? 'rgba(251, 113, 133, 0.14)' : 'rgba(220, 38, 38, 0.12)',
      '--app-success': escuro ? '#86efac' : '#16a34a',
      '--app-success-soft': escuro ? 'rgba(74, 222, 128, 0.14)' : 'rgba(22, 163, 74, 0.12)',
      '--app-warning': escuro ? '#fcd34d' : '#d97706',
      '--app-warning-soft': escuro ? 'rgba(251, 191, 36, 0.14)' : 'rgba(217, 119, 6, 0.12)',
      '--app-focus-ring': corComAlpha(visual.principal, escuro ? 0.28 : 0.2),
      '--app-overlay': escuro ? 'rgba(2, 6, 23, 0.72)' : corComAlpha('#0f172a', 0.5),
      '--app-sidebar-bg':
        sidebarBg ||
        `linear-gradient(180deg, ${misturarCores(visual.secundaria, '#0f172a', escuro ? 0.38 : 0.24)} 0%, ${misturarCores(visual.principal, '#0f172a', escuro ? 0.52 : 0.44)} 100%)`,
      '--app-sidebar-text': '#f8fbff',
      '--app-sidebar-muted': escuro ? '#cbd5e1' : '#dbeafe',
      '--app-sidebar-border': escuro ? 'rgba(148, 163, 184, 0.16)' : 'rgba(219, 234, 254, 0.14)',
      '--app-sidebar-chip': escuro ? 'rgba(148, 163, 184, 0.08)' : 'rgba(219, 234, 254, 0.12)',
      '--app-sidebar-link': escuro ? '#dbeafe' : '#e7f0ff',
      '--app-sidebar-link-active': '#ffffff',
      '--app-sidebar-item-active': escuro ? corComAlpha(visual.principal, 0.26) : corComAlpha(visual.principal, 0.22),
      '--app-brand-end': brandEnd || visual.secundaria,
      '--app-input-disabled-bg': escuro
        ? misturarCores(visual.card, '#020617', 0.22)
        : misturarCores(visual.fundo, '#e2e8f0', 0.28),
      '--app-input-disabled-text': escuro ? '#94a3b8' : '#64748b',
      '--app-input-disabled-border': escuro ? '#334155' : '#cbd5e1',
      ...overrides,
    },
  }
}

export const TEMAS_INTERNOS = Object.freeze([
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_CLARO,
    nome: 'Claro',
    temaPublico: 'PADRAO',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_MODERNO,
    nome: 'Moderno',
    temaPublico: 'MODERNO',
    corPrincipal: '#2563eb',
    corSecundaria: '#4338ca',
    radius: '20px',
    shadow: '0 22px 52px rgba(37, 99, 235, 0.12)',
    shadowElevated: '0 28px 68px rgba(37, 99, 235, 0.16)',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(79, 70, 229, 0.18), transparent 30%), radial-gradient(circle at 88% 0%, rgba(37, 99, 235, 0.12), transparent 22%), linear-gradient(180deg, #f7faff 0%, #eef2ff 100%)',
    sidebarBg: 'linear-gradient(180deg, #1e1b4b 0%, #1d4ed8 54%, #0f172a 100%)',
    brandEnd: '#4f46e5',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ESCURO,
    nome: 'Escuro',
    temaPublico: 'ESCURO',
    corPrincipal: '#60a5fa',
    corSecundaria: '#111827',
    colorScheme: 'dark',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(96, 165, 250, 0.16), transparent 32%), linear-gradient(180deg, #101a2f 0%, #0b1220 100%)',
    sidebarBg: 'linear-gradient(180deg, #050816 0%, #111827 100%)',
    brandEnd: '#38bdf8',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_SUAVE,
    nome: 'Suave',
    temaPublico: 'SUAVE',
    corPrincipal: '#38bdf8',
    corSecundaria: '#475569',
    radius: '20px',
    shadow: '0 16px 34px rgba(56, 189, 248, 0.08)',
    shadowElevated: '0 24px 48px rgba(56, 189, 248, 0.12)',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(125, 211, 252, 0.22), transparent 32%), radial-gradient(circle at 88% 0%, rgba(191, 219, 254, 0.18), transparent 24%), linear-gradient(180deg, #fcfdff 0%, #f7fbff 100%)',
    sidebarBg: 'linear-gradient(180deg, #334155 0%, #475569 100%)',
    brandEnd: '#7dd3fc',
    overrides: {
      '--app-surface-soft': '#fbfdff',
      '--app-border': '#dbeafe',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_NUVEMMAIS,
    nome: 'NuvemMais',
    temaPublico: 'MODERNO',
    corPrincipal: '#1d4ed8',
    corSecundaria: '#0b1b39',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(37, 99, 235, 0.18), transparent 28%), radial-gradient(circle at 88% 0%, rgba(14, 165, 233, 0.12), transparent 22%), linear-gradient(180deg, #f5f9ff 0%, #eaf3ff 100%)',
    sidebarBg: 'linear-gradient(180deg, #0b1b39 0%, #10294f 100%)',
    brandEnd: '#4f46e5',
    overrides: {
      '--app-text': '#0b1b39',
      '--app-text-muted': '#526581',
      '--app-primary': '#1d4ed8',
      '--app-primary-strong': '#1e40af',
      '--app-primary-soft': 'rgba(29, 78, 216, 0.14)',
      '--app-border': '#cfe0f5',
      '--app-danger': '#d9465f',
      '--app-danger-soft': 'rgba(217, 70, 95, 0.14)',
      '--app-success': '#059669',
      '--app-success-soft': 'rgba(5, 150, 105, 0.14)',
      '--app-warning': '#d97706',
      '--app-warning-soft': 'rgba(217, 119, 6, 0.14)',
      '--app-focus-ring': 'rgba(29, 78, 216, 0.18)',
      '--app-overlay': 'rgba(11, 27, 57, 0.56)',
    },
  }),
])

const TEMAS_INTERNOS_POR_VALOR = new Map(TEMAS_INTERNOS.map((tema) => [tema.valor, tema]))

const ALIASES_TEMAS_INTERNOS = Object.freeze({
  CLARO: TEMA_APARENCIA_CLARO,
  LIGHT: TEMA_APARENCIA_CLARO,
  PADRAO: TEMA_APARENCIA_CLARO,
  PADRÃO: TEMA_APARENCIA_CLARO,
  DEFAULT: TEMA_APARENCIA_CLARO,
  MODERNO: TEMA_APARENCIA_MODERNO,
  ESCURO: TEMA_APARENCIA_ESCURO,
  DARK: TEMA_APARENCIA_ESCURO,
  SUAVE: TEMA_APARENCIA_SUAVE,
  NUVEMMAIS: TEMA_APARENCIA_NUVEMMAIS,
  NUVEMMAIS_GESTAO: TEMA_APARENCIA_NUVEMMAIS,
  NUVEMMAIS_GESTÃO: TEMA_APARENCIA_NUVEMMAIS,
})

function normalizarChaveTemaInterno(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

export function obterOpcoesTemasInternos() {
  return TEMAS_INTERNOS.map(({ valor, nome }) => ({ valor, nome }))
}

export function normalizarTemaInterno(valor) {
  const texto = normalizarChaveTemaInterno(valor)

  if (!texto) {
    return TEMA_APARENCIA_CLARO
  }

  const alias = ALIASES_TEMAS_INTERNOS[texto]
  if (alias && TEMAS_INTERNOS_POR_VALOR.has(alias)) {
    return alias
  }

  const valorNormalizado = String(valor || '').trim().toLowerCase()
  return TEMAS_INTERNOS_POR_VALOR.has(valorNormalizado) ? valorNormalizado : TEMA_APARENCIA_CLARO
}

export function obterTemaInterno(valor) {
  return TEMAS_INTERNOS_POR_VALOR.get(normalizarTemaInterno(valor)) || TEMAS_INTERNOS_POR_VALOR.get(TEMA_APARENCIA_CLARO)
}

export function obterTemaInternoPadrao() {
  return TEMA_APARENCIA_CLARO
}

export function obterColorSchemeTemaInterno(valor) {
  return obterTemaInterno(valor).colorScheme || 'light'
}

export function criarVariaveisCssTemaInterno(valor) {
  return {
    ...obterTemaInterno(valor).tokens,
  }
}
