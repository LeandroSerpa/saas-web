import { corComAlpha, criarMapaVisualPublico, misturarCores } from './temasPublicos.js'

export const TEMA_APARENCIA_CLARO = 'claro'
export const TEMA_APARENCIA_MODERNO = 'moderno'
export const TEMA_APARENCIA_ESCURO = 'escuro'
export const TEMA_APARENCIA_SUAVE = 'suave'
export const TEMA_APARENCIA_NUVEMMAIS = 'nuvemmais'
export const TEMA_APARENCIA_NATURAL = 'natural'
export const TEMA_APARENCIA_PREMIUM = 'premium'
export const TEMA_APARENCIA_ELEGANTE = 'elegante'
export const TEMA_APARENCIA_ARTESANAL = 'artesanal'
export const TEMA_APARENCIA_CRIATIVO = 'criativo'

function criarTemaInternoCompartilhado({
  valor,
  nome,
  temaPublico,
  corPrincipal,
  corSecundaria,
  colorScheme = 'light',
  radius = '16px',
  shadow,
  shadowElevated,
  bgOverlay,
  sidebarBg,
  brandEnd,
  overrides = {},
} = {}) {
  const visual = criarMapaVisualPublico(corPrincipal, corSecundaria, temaPublico)
  const escuro = colorScheme === 'dark'
  const tokens = {
    '--app-radius': radius,
    '--app-shadow':
      shadow || (escuro ? '0 24px 56px rgba(2, 6, 23, 0.34)' : '0 18px 42px rgba(15, 23, 42, 0.08)'),
    '--app-shadow-elevated':
      shadowElevated || (escuro ? '0 28px 64px rgba(2, 6, 23, 0.42)' : '0 24px 56px rgba(15, 23, 42, 0.12)'),
    '--app-bg': visual.fundo,
    '--app-bg-overlay':
      bgOverlay ||
      `radial-gradient(circle at top left, ${corComAlpha(visual.principal, escuro ? 0.18 : 0.11)}, transparent 32%), linear-gradient(180deg, ${misturarCores(visual.fundo, '#ffffff', escuro ? 0.06 : 0.2)} 0%, ${visual.fundo} 100%)`,
    '--app-surface': escuro ? corComAlpha(visual.card, 0.96) : corComAlpha('#ffffff', 0.94),
    '--app-surface-soft': escuro
      ? misturarCores(visual.card, '#020617', 0.18)
      : misturarCores(visual.fundo, '#ffffff', 0.5),
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
  }

  return {
    valor,
    nome,
    temaPublico,
    colorScheme,
    preview: {
      fundo: tokens['--app-bg'],
      superficie: tokens['--app-surface-strong'],
      primario: tokens['--app-primary'],
      secundario: tokens['--app-brand-end'],
      menu: tokens['--app-sidebar-bg'],
    },
    tokens,
  }
}

export const TEMAS_INTERNOS = Object.freeze([
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_CLARO,
    nome: 'Padrão Claro',
    temaPublico: 'PADRAO',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_MODERNO,
    nome: 'Moderno Azul',
    temaPublico: 'MODERNO',
    corPrincipal: '#2563eb',
    corSecundaria: '#4338ca',
    radius: '18px',
    sidebarBg: 'linear-gradient(180deg, #1e1b4b 0%, #1d4ed8 56%, #0f172a 100%)',
    brandEnd: '#4f46e5',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_NUVEMMAIS,
    nome: 'NuvemMais Gestão',
    temaPublico: 'AZUL_PROFISSIONAL',
    corPrincipal: '#1d4ed8',
    corSecundaria: '#0b1b39',
    sidebarBg: 'linear-gradient(180deg, #0b1b39 0%, #123b78 56%, #071124 100%)',
    brandEnd: '#38bdf8',
    overrides: {
      '--app-text': '#0b1b39',
      '--app-text-muted': '#526581',
      '--app-primary-soft': 'rgba(29, 78, 216, 0.14)',
      '--app-border': '#cfe0f5',
      '--app-focus-ring': 'rgba(29, 78, 216, 0.18)',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_SUAVE,
    nome: 'Suave Celeste',
    temaPublico: 'SUAVE',
    corPrincipal: '#38bdf8',
    corSecundaria: '#334155',
    radius: '18px',
    sidebarBg: 'linear-gradient(180deg, #334155 0%, #475569 100%)',
    brandEnd: '#7dd3fc',
    overrides: {
      '--app-surface-soft': '#fbfdff',
      '--app-border': '#dbeafe',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_NATURAL,
    nome: 'Natural Verde',
    temaPublico: 'VERDE_NATURAL',
    corPrincipal: '#22c55e',
    corSecundaria: '#14532d',
    sidebarBg: 'linear-gradient(180deg, #14532d 0%, #15803d 58%, #052e16 100%)',
    brandEnd: '#86efac',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_PREMIUM,
    nome: 'Premium Dourado',
    temaPublico: 'DOURADO_PREMIUM',
    corPrincipal: '#ca8a04',
    corSecundaria: '#713f12',
    sidebarBg: 'linear-gradient(180deg, #713f12 0%, #a16207 56%, #241409 100%)',
    brandEnd: '#facc15',
    overrides: {
      '--app-text': '#241a12',
      '--app-text-muted': '#665648',
      '--app-border': '#ead8a8',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ARTESANAL,
    nome: 'Artesanal Madeira',
    temaPublico: 'MADEIRA_ARTESANAL',
    corPrincipal: '#92400e',
    corSecundaria: '#292524',
    sidebarBg: 'linear-gradient(180deg, #292524 0%, #78350f 58%, #1c1917 100%)',
    brandEnd: '#f59e0b',
    overrides: {
      '--app-text': '#2a2119',
      '--app-text-muted': '#68594d',
      '--app-border': '#dfcdbb',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ELEGANTE,
    nome: 'Elegante Grafite',
    temaPublico: 'PRETO_ELEGANTE',
    corPrincipal: '#d4af37',
    corSecundaria: '#111111',
    colorScheme: 'dark',
    radius: '16px',
    sidebarBg: 'linear-gradient(180deg, #050505 0%, #18181b 60%, #0f0f0f 100%)',
    brandEnd: '#facc15',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_CRIATIVO,
    nome: 'Criativo Coral',
    temaPublico: 'LARANJA_CRIATIVO',
    corPrincipal: '#f97316',
    corSecundaria: '#7c2d12',
    sidebarBg: 'linear-gradient(180deg, #7c2d12 0%, #ea580c 58%, #1f2937 100%)',
    brandEnd: '#fb7185',
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ESCURO,
    nome: 'Escuro Safira',
    temaPublico: 'ESCURO',
    corPrincipal: '#60a5fa',
    corSecundaria: '#111827',
    colorScheme: 'dark',
    sidebarBg: 'linear-gradient(180deg, #050816 0%, #111827 100%)',
    brandEnd: '#38bdf8',
    overrides: {
      '--app-bg': '#050b18',
      '--app-surface': 'rgba(15, 23, 42, 0.96)',
      '--app-surface-soft': '#111c32',
      '--app-surface-strong': '#172033',
      '--app-text': '#eef6ff',
      '--app-text-muted': '#b6c8dd',
      '--app-border': 'rgba(148, 163, 184, 0.26)',
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
  BRANCO_MINIMALISTA: TEMA_APARENCIA_CLARO,

  MODERNO: TEMA_APARENCIA_MODERNO,
  NUVEMMAIS_AZUL: TEMA_APARENCIA_MODERNO,
  OCEANO_PROFISSIONAL: TEMA_APARENCIA_MODERNO,
  AZUL_MENINO: TEMA_APARENCIA_MODERNO,

  NUVEMMAIS: TEMA_APARENCIA_NUVEMMAIS,
  NUVEMMAIS_GESTAO: TEMA_APARENCIA_NUVEMMAIS,
  NUVEMMAIS_GESTÃO: TEMA_APARENCIA_NUVEMMAIS,
  AZUL_PROFISSIONAL: TEMA_APARENCIA_NUVEMMAIS,

  SUAVE: TEMA_APARENCIA_SUAVE,
  AURORA_CIANO: TEMA_APARENCIA_SUAVE,
  PET_SHOP: TEMA_APARENCIA_SUAVE,
  TURQUESA: TEMA_APARENCIA_SUAVE,

  NATURAL: TEMA_APARENCIA_NATURAL,
  VERDE_NATURAL: TEMA_APARENCIA_NATURAL,
  VERDE_MENTA: TEMA_APARENCIA_NATURAL,
  VERDE_OLIVA: TEMA_APARENCIA_NATURAL,
  ESMERALDA_GESTAO: TEMA_APARENCIA_NATURAL,
  ESMERALDA_GESTÃO: TEMA_APARENCIA_NATURAL,

  PREMIUM: TEMA_APARENCIA_PREMIUM,
  DOURADO_PREMIUM: TEMA_APARENCIA_PREMIUM,
  SOLAR: TEMA_APARENCIA_PREMIUM,
  AMBAR_EXECUTIVO: TEMA_APARENCIA_PREMIUM,

  ARTESANAL: TEMA_APARENCIA_ARTESANAL,
  MADEIRA_ARTESANAL: TEMA_APARENCIA_ARTESANAL,
  CAFE: TEMA_APARENCIA_ARTESANAL,
  CAFÉ: TEMA_APARENCIA_ARTESANAL,
  TERRACOTA: TEMA_APARENCIA_ARTESANAL,
  TERRA_ELEGANTE: TEMA_APARENCIA_ARTESANAL,

  ELEGANTE: TEMA_APARENCIA_ELEGANTE,
  PRETO_ELEGANTE: TEMA_APARENCIA_ELEGANTE,
  PRETO_DOURADO: TEMA_APARENCIA_ELEGANTE,
  PRETO_E_DOURADO: TEMA_APARENCIA_ELEGANTE,
  GRAFITE_CORPORATIVO: TEMA_APARENCIA_ELEGANTE,

  CRIATIVO: TEMA_APARENCIA_CRIATIVO,
  LARANJA_CRIATIVO: TEMA_APARENCIA_CRIATIVO,
  PEACH: TEMA_APARENCIA_CRIATIVO,
  RUBI_MODERNO: TEMA_APARENCIA_CRIATIVO,
  ROSA_CRIATIVO: TEMA_APARENCIA_CRIATIVO,
  ROSA_BOUTIQUE: TEMA_APARENCIA_CRIATIVO,
  ROSA_MENINA: TEMA_APARENCIA_CRIATIVO,
  ROSA_CHIC: TEMA_APARENCIA_CRIATIVO,
  CONFEITARIA: TEMA_APARENCIA_CRIATIVO,
  INFANTIL_COLORIDO: TEMA_APARENCIA_CRIATIVO,

  ESCURO: TEMA_APARENCIA_ESCURO,
  DARK: TEMA_APARENCIA_ESCURO,
  SAFIRA_ESCURO: TEMA_APARENCIA_ESCURO,
  BARBEARIA: TEMA_APARENCIA_ESCURO,
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
  return TEMAS_INTERNOS.map(({ valor, nome, preview }) => ({ valor, nome, preview: { ...preview } }))
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
