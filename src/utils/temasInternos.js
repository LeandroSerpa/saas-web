import { corComAlpha, criarMapaVisualPublico, misturarCores } from './temasPublicos.js'

export const TEMA_APARENCIA_CLARO = 'claro'
export const TEMA_APARENCIA_MODERNO = 'moderno'
export const TEMA_APARENCIA_ESCURO = 'escuro'
export const TEMA_APARENCIA_SUAVE = 'suave'
export const TEMA_APARENCIA_NUVEMMAIS = 'nuvemmais'
export const TEMA_APARENCIA_NUVEMMAIS_AZUL = 'nuvemmais-azul'
export const TEMA_APARENCIA_OCEANO_PROFISSIONAL = 'oceano-profissional'
export const TEMA_APARENCIA_SAFIRA_ESCURO = 'safira-escuro'
export const TEMA_APARENCIA_ESMERALDA_GESTAO = 'esmeralda-gestao'
export const TEMA_APARENCIA_VIOLETA_PREMIUM = 'violeta-premium'
export const TEMA_APARENCIA_AMBAR_EXECUTIVO = 'ambar-executivo'
export const TEMA_APARENCIA_RUBI_MODERNO = 'rubi-moderno'
export const TEMA_APARENCIA_GRAFITE_CORPORATIVO = 'grafite-corporativo'
export const TEMA_APARENCIA_AURORA_CIANO = 'aurora-ciano'
export const TEMA_APARENCIA_TERRA_ELEGANTE = 'terra-elegante'
export const TEMA_APARENCIA_ROSA_CRIATIVO = 'rosa-criativo'

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
  const tokens = {
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
  }

  return {
    valor,
    nome,
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
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_NUVEMMAIS_AZUL,
    nome: 'NuvemMais Azul',
    temaPublico: 'MODERNO',
    corPrincipal: '#1d4ed8',
    corSecundaria: '#0f2a53',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(29, 78, 216, 0.16), transparent 30%), radial-gradient(circle at 88% 0%, rgba(2, 132, 199, 0.12), transparent 24%), linear-gradient(180deg, #f6faff 0%, #e8f2ff 100%)',
    sidebarBg: 'linear-gradient(180deg, #0f2a53 0%, #123d73 58%, #071529 100%)',
    brandEnd: '#0284c7',
    overrides: {
      '--app-text': '#10233f',
      '--app-text-muted': '#56697f',
      '--app-border': '#cbdcf0',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_OCEANO_PROFISSIONAL,
    nome: 'Oceano Profissional',
    temaPublico: 'MODERNO',
    corPrincipal: '#0e7490',
    corSecundaria: '#0f3b57',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(14, 116, 144, 0.16), transparent 30%), radial-gradient(circle at 90% 0%, rgba(20, 184, 166, 0.12), transparent 24%), linear-gradient(180deg, #f3fbfd 0%, #e7f5f8 100%)',
    sidebarBg: 'linear-gradient(180deg, #0f3b57 0%, #0e7490 58%, #082f49 100%)',
    brandEnd: '#14b8a6',
    overrides: {
      '--app-primary': '#0e7490',
      '--app-primary-strong': '#155e75',
      '--app-primary-soft': 'rgba(14, 116, 144, 0.14)',
      '--app-border': '#c7e2e8',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_SAFIRA_ESCURO,
    nome: 'Safira Escuro',
    temaPublico: 'ESCURO',
    corPrincipal: '#2563eb',
    corSecundaria: '#172554',
    colorScheme: 'dark',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(37, 99, 235, 0.2), transparent 32%), radial-gradient(circle at 90% 0%, rgba(56, 189, 248, 0.12), transparent 24%), linear-gradient(180deg, #0b1327 0%, #050b18 100%)',
    sidebarBg: 'linear-gradient(180deg, #020617 0%, #0f1b38 50%, #172554 100%)',
    brandEnd: '#38bdf8',
    overrides: {
      '--app-bg': '#050b18',
      '--app-surface': 'rgba(15, 23, 42, 0.96)',
      '--app-surface-soft': '#111c32',
      '--app-surface-strong': '#172033',
      '--app-text': '#eef6ff',
      '--app-text-muted': '#b6c8dd',
      '--app-primary': '#2563eb',
      '--app-primary-strong': '#1d4ed8',
      '--app-border': 'rgba(148, 163, 184, 0.26)',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ESMERALDA_GESTAO,
    nome: 'Esmeralda Gestão',
    temaPublico: 'SUAVE',
    corPrincipal: '#047857',
    corSecundaria: '#064e3b',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(4, 120, 87, 0.15), transparent 30%), radial-gradient(circle at 88% 0%, rgba(20, 184, 166, 0.11), transparent 22%), linear-gradient(180deg, #f4fbf8 0%, #e9f7f0 100%)',
    sidebarBg: 'linear-gradient(180deg, #064e3b 0%, #047857 58%, #022c22 100%)',
    brandEnd: '#14b8a6',
    overrides: {
      '--app-primary': '#047857',
      '--app-primary-strong': '#065f46',
      '--app-primary-soft': 'rgba(4, 120, 87, 0.14)',
      '--app-border': '#c8e5d8',
      '--app-success': '#047857',
      '--app-success-soft': 'rgba(4, 120, 87, 0.14)',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_VIOLETA_PREMIUM,
    nome: 'Violeta Premium',
    temaPublico: 'MODERNO',
    corPrincipal: '#7c3aed',
    corSecundaria: '#312e81',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(124, 58, 237, 0.15), transparent 30%), radial-gradient(circle at 90% 0%, rgba(59, 130, 246, 0.12), transparent 22%), linear-gradient(180deg, #fbf8ff 0%, #f0edff 100%)',
    sidebarBg: 'linear-gradient(180deg, #312e81 0%, #5b21b6 58%, #111827 100%)',
    brandEnd: '#2563eb',
    overrides: {
      '--app-primary': '#7c3aed',
      '--app-primary-strong': '#6d28d9',
      '--app-primary-soft': 'rgba(124, 58, 237, 0.13)',
      '--app-border': '#ddd6fe',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_AMBAR_EXECUTIVO,
    nome: '\u00C2mbar Executivo',
    temaPublico: 'PADRAO',
    corPrincipal: '#b45309',
    corSecundaria: '#3f2a11',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(180, 83, 9, 0.13), transparent 30%), radial-gradient(circle at 88% 0%, rgba(217, 119, 6, 0.1), transparent 22%), linear-gradient(180deg, #fffaf2 0%, #f8efe3 100%)',
    sidebarBg: 'linear-gradient(180deg, #3f2a11 0%, #7c4a03 58%, #1f2937 100%)',
    brandEnd: '#d97706',
    overrides: {
      '--app-text': '#241a12',
      '--app-text-muted': '#665648',
      '--app-primary': '#b45309',
      '--app-primary-strong': '#92400e',
      '--app-primary-soft': 'rgba(180, 83, 9, 0.13)',
      '--app-border': '#e8d4b7',
      '--app-warning': '#b45309',
      '--app-warning-soft': 'rgba(180, 83, 9, 0.14)',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_RUBI_MODERNO,
    nome: 'Rubi Moderno',
    temaPublico: 'MODERNO',
    corPrincipal: '#be123c',
    corSecundaria: '#4a1022',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(190, 18, 60, 0.13), transparent 30%), radial-gradient(circle at 88% 0%, rgba(244, 63, 94, 0.1), transparent 22%), linear-gradient(180deg, #fff7f8 0%, #f9edf1 100%)',
    sidebarBg: 'linear-gradient(180deg, #4a1022 0%, #9f1239 58%, #111827 100%)',
    brandEnd: '#e11d48',
    overrides: {
      '--app-primary': '#be123c',
      '--app-primary-strong': '#9f1239',
      '--app-primary-soft': 'rgba(190, 18, 60, 0.13)',
      '--app-border': '#f0ccd5',
      '--app-danger': '#be123c',
      '--app-danger-soft': 'rgba(190, 18, 60, 0.14)',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_GRAFITE_CORPORATIVO,
    nome: 'Grafite Corporativo',
    temaPublico: 'PADRAO',
    corPrincipal: '#334155',
    corSecundaria: '#111827',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(51, 65, 85, 0.12), transparent 30%), radial-gradient(circle at 90% 0%, rgba(37, 99, 235, 0.08), transparent 22%), linear-gradient(180deg, #f7f9fb 0%, #edf1f5 100%)',
    sidebarBg: 'linear-gradient(180deg, #111827 0%, #1f2937 58%, #020617 100%)',
    brandEnd: '#2563eb',
    overrides: {
      '--app-primary': '#334155',
      '--app-primary-strong': '#1f2937',
      '--app-primary-soft': 'rgba(51, 65, 85, 0.12)',
      '--app-border': '#d5dce5',
      '--app-text': '#111827',
      '--app-text-muted': '#596579',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_AURORA_CIANO,
    nome: 'Aurora Ciano',
    temaPublico: 'SUAVE',
    corPrincipal: '#0e7490',
    corSecundaria: '#164e63',
    radius: '20px',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(6, 182, 212, 0.18), transparent 30%), radial-gradient(circle at 88% 0%, rgba(125, 211, 252, 0.2), transparent 24%), linear-gradient(180deg, #f7feff 0%, #e8f9fc 100%)',
    sidebarBg: 'linear-gradient(180deg, #164e63 0%, #0e7490 58%, #083344 100%)',
    brandEnd: '#06b6d4',
    overrides: {
      '--app-primary': '#0e7490',
      '--app-primary-strong': '#155e75',
      '--app-primary-soft': 'rgba(14, 116, 144, 0.13)',
      '--app-border': '#bae6fd',
      '--app-surface-soft': '#f3fcff',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_TERRA_ELEGANTE,
    nome: 'Terra Elegante',
    temaPublico: 'PADRAO',
    corPrincipal: '#92400e',
    corSecundaria: '#5f4631',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(146, 64, 14, 0.11), transparent 30%), radial-gradient(circle at 88% 0%, rgba(120, 72, 37, 0.08), transparent 22%), linear-gradient(180deg, #fffaf5 0%, #f3ebe1 100%)',
    sidebarBg: 'linear-gradient(180deg, #4b3525 0%, #6b4f3a 58%, #24170f 100%)',
    brandEnd: '#a16207',
    overrides: {
      '--app-text': '#2a2119',
      '--app-text-muted': '#68594d',
      '--app-primary': '#92400e',
      '--app-primary-strong': '#78350f',
      '--app-primary-soft': 'rgba(146, 64, 14, 0.12)',
      '--app-border': '#dfcdbb',
      '--app-surface-soft': '#fbf7f1',
    },
  }),
  criarTemaInternoCompartilhado({
    valor: TEMA_APARENCIA_ROSA_CRIATIVO,
    nome: 'Rosa Criativo',
    temaPublico: 'SUAVE',
    corPrincipal: '#db2777',
    corSecundaria: '#831843',
    bgOverlay:
      'radial-gradient(circle at top left, rgba(219, 39, 119, 0.12), transparent 30%), radial-gradient(circle at 88% 0%, rgba(244, 114, 182, 0.1), transparent 22%), linear-gradient(180deg, #fff8fb 0%, #fcecf4 100%)',
    sidebarBg: 'linear-gradient(180deg, #831843 0%, #be185d 58%, #3b1026 100%)',
    brandEnd: '#f472b6',
    overrides: {
      '--app-primary': '#db2777',
      '--app-primary-strong': '#be185d',
      '--app-primary-soft': 'rgba(219, 39, 119, 0.12)',
      '--app-border': '#f4c8dc',
      '--app-surface-soft': '#fff5fa',
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
  NUVEMMAIS_AZUL: TEMA_APARENCIA_NUVEMMAIS_AZUL,
  OCEANO_PROFISSIONAL: TEMA_APARENCIA_OCEANO_PROFISSIONAL,
  SAFIRA_ESCURO: TEMA_APARENCIA_SAFIRA_ESCURO,
  ESMERALDA_GESTAO: TEMA_APARENCIA_ESMERALDA_GESTAO,
  ESMERALDA_GESTÃO: TEMA_APARENCIA_ESMERALDA_GESTAO,
  VIOLETA_PREMIUM: TEMA_APARENCIA_VIOLETA_PREMIUM,
  AMBAR_EXECUTIVO: TEMA_APARENCIA_AMBAR_EXECUTIVO,
  RUBI_MODERNO: TEMA_APARENCIA_RUBI_MODERNO,
  GRAFITE_CORPORATIVO: TEMA_APARENCIA_GRAFITE_CORPORATIVO,
  AURORA_CIANO: TEMA_APARENCIA_AURORA_CIANO,
  TERRA_ELEGANTE: TEMA_APARENCIA_TERRA_ELEGANTE,
  ROSA_CRIATIVO: TEMA_APARENCIA_ROSA_CRIATIVO,
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
