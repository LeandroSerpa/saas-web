export const TEMA_PUBLICO_PADRAO = 'PADRAO'

export const TEMAS_PUBLICOS = Object.freeze([
  {
    valor: 'PADRAO',
    nome: 'Padrão',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
    fundo: '#f8fafc',
    card: '#ffffff',
    destaque: '#1d4ed8',
    badge: '#dbeafe',
  },
  {
    valor: 'MODERNO',
    nome: 'Moderno',
    corPrincipal: '#2563eb',
    corSecundaria: '#4338ca',
    fundo: '#eef2ff',
    card: '#ffffff',
    destaque: '#4f46e5',
    badge: '#dbeafe',
  },
  {
    valor: 'ESCURO',
    nome: 'Escuro',
    corPrincipal: '#60a5fa',
    corSecundaria: '#111827',
    fundo: '#020617',
    card: '#111827',
    destaque: '#93c5fd',
    badge: '#1e293b',
  },
  {
    valor: 'SUAVE',
    nome: 'Suave',
    corPrincipal: '#38bdf8',
    corSecundaria: '#334155',
    fundo: '#f7fbff',
    card: '#ffffff',
    destaque: '#0284c7',
    badge: '#e0f2fe',
  },
  {
    valor: 'ROSA_BOUTIQUE',
    nome: 'Rosa Boutique',
    corPrincipal: '#ec4899',
    corSecundaria: '#831843',
    fundo: '#fff1f7',
    card: '#ffffff',
    destaque: '#be185d',
    badge: '#fce7f3',
  },
  {
    valor: 'ROSA_MENINA',
    nome: 'Rosa Menina',
    corPrincipal: '#f9a8d4',
    corSecundaria: '#9d174d',
    fundo: '#fff1f7',
    card: '#ffffff',
    destaque: '#db2777',
    badge: '#fce7f3',
  },
  {
    valor: 'AZUL_MENINO',
    nome: 'Azul Menino',
    corPrincipal: '#38bdf8',
    corSecundaria: '#075985',
    fundo: '#f0f9ff',
    card: '#ffffff',
    destaque: '#0284c7',
    badge: '#e0f2fe',
  },
  {
    valor: 'AZUL_PROFISSIONAL',
    nome: 'Azul Profissional',
    corPrincipal: '#1d4ed8',
    corSecundaria: '#0f172a',
    fundo: '#eff6ff',
    card: '#ffffff',
    destaque: '#1e40af',
    badge: '#dbeafe',
  },
  {
    valor: 'VERDE_NATURAL',
    nome: 'Verde Natural',
    corPrincipal: '#22c55e',
    corSecundaria: '#14532d',
    fundo: '#f0fdf4',
    card: '#ffffff',
    destaque: '#15803d',
    badge: '#dcfce7',
  },
  {
    valor: 'MADEIRA_ARTESANAL',
    nome: 'Madeira Artesanal',
    corPrincipal: '#92400e',
    corSecundaria: '#292524',
    fundo: '#fafaf9',
    card: '#ffffff',
    destaque: '#78350f',
    badge: '#fef3c7',
  },
  {
    valor: 'DOURADO_PREMIUM',
    nome: 'Dourado Premium',
    corPrincipal: '#ca8a04',
    corSecundaria: '#713f12',
    fundo: '#fefce8',
    card: '#ffffff',
    destaque: '#a16207',
    badge: '#fef9c3',
  },
  {
    valor: 'LILAS_DELICADO',
    nome: 'Lilás Delicado',
    corPrincipal: '#a855f7',
    corSecundaria: '#3b0764',
    fundo: '#faf5ff',
    card: '#ffffff',
    destaque: '#7e22ce',
    badge: '#f3e8ff',
  },
  {
    valor: 'VERMELHO_ENERGIA',
    nome: 'Vermelho Energia',
    corPrincipal: '#dc2626',
    corSecundaria: '#7f1d1d',
    fundo: '#fef2f2',
    card: '#ffffff',
    destaque: '#b91c1c',
    badge: '#fee2e2',
  },
  {
    valor: 'LARANJA_CRIATIVO',
    nome: 'Laranja Criativo',
    corPrincipal: '#f97316',
    corSecundaria: '#7c2d12',
    fundo: '#fff7ed',
    card: '#ffffff',
    destaque: '#ea580c',
    badge: '#ffedd5',
  },
  {
    valor: 'PRETO_ELEGANTE',
    nome: 'Preto Elegante',
    corPrincipal: '#d4af37',
    corSecundaria: '#111111',
    fundo: '#0f0f0f',
    card: '#18181b',
    destaque: '#facc15',
    badge: '#2a2518',
  },
  {
    valor: 'BRANCO_MINIMALISTA',
    nome: 'Branco Minimalista',
    corPrincipal: '#334155',
    corSecundaria: '#0f172a',
    fundo: '#f8fafc',
    card: '#ffffff',
    destaque: '#1f2937',
    badge: '#e2e8f0',
  },
  {
    valor: 'PET_SHOP',
    nome: 'Pet Shop',
    corPrincipal: '#14b8a6',
    corSecundaria: '#134e4a',
    fundo: '#f0fdfa',
    card: '#ffffff',
    destaque: '#0f766e',
    badge: '#ccfbf1',
  },
  {
    valor: 'BARBEARIA',
    nome: 'Barbearia',
    corPrincipal: '#475569',
    corSecundaria: '#020617',
    fundo: '#f1f5f9',
    card: '#ffffff',
    destaque: '#0f172a',
    badge: '#e2e8f0',
  },
  {
    valor: 'CONFEITARIA',
    nome: 'Confeitaria',
    corPrincipal: '#fb7185',
    corSecundaria: '#7c2d12',
    fundo: '#fff7ed',
    card: '#ffffff',
    destaque: '#e11d48',
    badge: '#ffe4e6',
  },
  {
    valor: 'INFANTIL_COLORIDO',
    nome: 'Infantil Colorido',
    corPrincipal: '#22c55e',
    corSecundaria: '#2563eb',
    fundo: '#f0f9ff',
    card: '#ffffff',
    destaque: '#f97316',
    badge: '#dcfce7',
  },
])

const TEMAS_PUBLICOS_POR_VALOR = new Map(TEMAS_PUBLICOS.map((tema) => [tema.valor, tema]))

const ALIASES_TEMAS_PUBLICOS = Object.freeze({
  DEFAULT: 'PADRAO',
  PADRAO: 'PADRAO',
  PADRÃO: 'PADRAO',
  NUVEMMAIS: 'PADRAO',
  NUVEMMAIS_GESTAO: 'PADRAO',
  MODERNO: 'MODERNO',
  ESCURO: 'ESCURO',
  DARK: 'ESCURO',
  SUAVE: 'SUAVE',
  ROSA_BEBE: 'ROSA_BEBE',
  ROSA_BEBÊ: 'ROSA_BEBE',
  ROSA_CHIC: 'ROSA_CHIC',
  LILAS: 'LILAS',
  LILÁS: 'LILAS',
  LAVANDA: 'LAVANDA',
  PEACH: 'PEACH',
  CORAL: 'CORAL',
  AZUL_CEU: 'AZUL_CEU',
  AZUL_CÉU: 'AZUL_CEU',
  AZUL_MARINHO: 'AZUL_MARINHO',
  TURQUESA: 'TURQUESA',
  VERDE_MENTA: 'VERDE_MENTA',
  VERDE_OLIVA: 'VERDE_OLIVA',
  TERRACOTA: 'TERRACOTA',
  CAFE: 'CAFE',
  CAFÉ: 'CAFE',
  SOLAR: 'SOLAR',
  PRETO_DOURADO: 'PRETO_DOURADO',
  PRETO_E_DOURADO: 'PRETO_DOURADO',
  ROSA_BOUTIQUE: 'ROSA_BOUTIQUE',
  ROSA_BEBE: 'ROSA_MENINA',
  ROSA_MENINA: 'ROSA_MENINA',
  ROSA_CHIC: 'ROSA_BOUTIQUE',
  AZUL_MENINO: 'AZUL_MENINO',
  AZUL_CEU: 'AZUL_MENINO',
  AZUL_PROFISSIONAL: 'AZUL_PROFISSIONAL',
  AZUL_MARINHO: 'AZUL_PROFISSIONAL',
  VERDE_NATURAL: 'VERDE_NATURAL',
  VERDE_MENTA: 'VERDE_NATURAL',
  VERDE_OLIVA: 'VERDE_NATURAL',
  MADEIRA_ARTESANAL: 'MADEIRA_ARTESANAL',
  CAFE: 'MADEIRA_ARTESANAL',
  TERRACOTA: 'MADEIRA_ARTESANAL',
  DOURADO_PREMIUM: 'DOURADO_PREMIUM',
  SOLAR: 'DOURADO_PREMIUM',
  LILAS_DELICADO: 'LILAS_DELICADO',
  LILAS: 'LILAS_DELICADO',
  LAVANDA: 'LILAS_DELICADO',
  VERMELHO_ENERGIA: 'VERMELHO_ENERGIA',
  CORAL: 'VERMELHO_ENERGIA',
  LARANJA_CRIATIVO: 'LARANJA_CRIATIVO',
  PEACH: 'LARANJA_CRIATIVO',
  PRETO_ELEGANTE: 'PRETO_ELEGANTE',
  PRETO_DOURADO: 'PRETO_ELEGANTE',
  PRETO_E_DOURADO: 'PRETO_ELEGANTE',
  BRANCO_MINIMALISTA: 'BRANCO_MINIMALISTA',
  PET_SHOP: 'PET_SHOP',
  TURQUESA: 'PET_SHOP',
  BARBEARIA: 'BARBEARIA',
  CONFEITARIA: 'CONFEITARIA',
  INFANTIL_COLORIDO: 'INFANTIL_COLORIDO',
})

export function obterOpcoesTemasPublicos() {
  return TEMAS_PUBLICOS.map((tema) => ({ ...tema }))
}

export function normalizarTemaPublico(valor) {
  const texto = String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/[\s-]+/g, '_')

  if (!texto) {
    return TEMA_PUBLICO_PADRAO
  }

  const alias = ALIASES_TEMAS_PUBLICOS[texto]

  if (alias && TEMAS_PUBLICOS_POR_VALOR.has(alias)) {
    return alias
  }

  return TEMAS_PUBLICOS_POR_VALOR.has(texto) ? texto : TEMA_PUBLICO_PADRAO
}

export function obterTemaPublico(valor) {
  return TEMAS_PUBLICOS_POR_VALOR.get(normalizarTemaPublico(valor)) || TEMAS_PUBLICOS_POR_VALOR.get(TEMA_PUBLICO_PADRAO)
}

export function obterNomeTemaPublico(valor) {
  return obterTemaPublico(valor).nome
}

export function corHexValida(cor) {
  return /^#[0-9a-f]{6}$/.test(String(cor || '').trim().toLowerCase())
}

export function normalizarCorHex(cor, fallback = '') {
  const texto = String(cor || '').trim().toLowerCase()

  if (!texto) {
    return fallback
  }

  if (/^#[0-9a-f]{6}$/.test(texto)) {
    return texto
  }

  if (/^[0-9a-f]{6}$/.test(texto)) {
    return `#${texto}`
  }

  return fallback
}

function converterHexParaRgb(cor) {
  const corNormalizada = normalizarCorHex(cor, '')

  if (!corHexValida(corNormalizada)) {
    return null
  }

  return {
    r: Number.parseInt(corNormalizada.slice(1, 3), 16),
    g: Number.parseInt(corNormalizada.slice(3, 5), 16),
    b: Number.parseInt(corNormalizada.slice(5, 7), 16),
  }
}

function formatarRgbComoHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((valor) => Math.max(0, Math.min(255, Math.round(valor))).toString(16).padStart(2, '0'))
    .join('')}`
}

export function misturarCores(base, mistura, proporcaoMistura = 0.5) {
  const rgbBase = converterHexParaRgb(base)
  const rgbMistura = converterHexParaRgb(mistura)

  if (!rgbBase || !rgbMistura) {
    return normalizarCorHex(base, mistura)
  }

  const proporcao = Math.max(0, Math.min(1, Number(proporcaoMistura)))
  const proporcaoBase = 1 - proporcao

  return formatarRgbComoHex({
    r: rgbBase.r * proporcaoBase + rgbMistura.r * proporcao,
    g: rgbBase.g * proporcaoBase + rgbMistura.g * proporcao,
    b: rgbBase.b * proporcaoBase + rgbMistura.b * proporcao,
  })
}

export function corComAlpha(cor, alpha) {
  const rgb = converterHexParaRgb(cor)

  if (!rgb) {
    return `rgba(15, 23, 42, ${alpha})`
  }

  const opacidade = Math.max(0, Math.min(1, Number(alpha)))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacidade})`
}

function luminancia(cor) {
  const rgb = converterHexParaRgb(cor)

  if (!rgb) {
    return 0
  }

  const canais = [rgb.r, rgb.g, rgb.b].map((canal) => {
    const valor = canal / 255
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2]
}

export function escolherTextoContraste(corFundo, claro = '#f8fafc', escuro = '#0f172a') {
  return luminancia(corFundo) > 0.52 ? escuro : claro
}

export function criarMapaVisualPublico(corPrincipalEntrada, corSecundariaEntrada, temaEntrada) {
  const tema = obterTemaPublico(temaEntrada)
  const corPrincipal = normalizarCorHex(corPrincipalEntrada, tema.corPrincipal)
  const corSecundaria = normalizarCorHex(corSecundariaEntrada, tema.corSecundaria)
  const ehEscuro = ['ESCURO', 'PRETO_ELEGANTE', 'PRETO_DOURADO'].includes(tema.valor)

  const base = {
    principal: corPrincipal,
    secundaria: corSecundaria,
    destaque: tema.destaque || misturarCores(corPrincipal, corSecundaria, 0.2),
    fundo: tema.fundo || '#f8fafc',
    card: tema.card || '#ffffff',
    texto: ehEscuro ? '#f8fafc' : '#1f2937',
    textoSuave: ehEscuro ? '#cbd5e1' : '#5b6474',
    borda: ehEscuro ? corComAlpha('#94a3b8', 0.28) : corComAlpha(misturarCores(corSecundaria, '#cbd5e1', 0.72), 0.38),
    hero: ehEscuro
      ? `linear-gradient(135deg, ${corComAlpha(corPrincipal, 0.26)}, ${corComAlpha(corSecundaria, 0.52)})`
      : `linear-gradient(135deg, ${misturarCores(corPrincipal, '#ffffff', 0.86)}, ${misturarCores(corSecundaria, '#ffffff', 0.9)})`,
    botao: corPrincipal,
    botaoTexto: escolherTextoContraste(corPrincipal, '#f8fafc', '#0f172a'),
    fundoSecundario: ehEscuro ? 'rgba(15, 23, 42, 0.96)' : misturarCores(corSecundaria, '#ffffff', 0.9),
    chip: tema.badge || misturarCores(corSecundaria, '#ffffff', 0.9),
    chipTexto: ehEscuro ? '#e2e8f0' : misturarCores(corSecundaria, '#0f172a', 0.25),
    sucesso: '#166534',
    sucessoSuave: '#dcfce7',
    perigo: '#b91c1c',
    perigoSuave: '#fee2e2',
    overlay: ehEscuro ? corComAlpha('#020617', 0.62) : corComAlpha(corSecundaria, 0.68),
    modal: '#ffffff',
    modalMidia: `linear-gradient(180deg, ${misturarCores(corPrincipal, '#ffffff', 0.84)}, #ffffff)`,
    modalTexto: '#0f172a',
    modalTextoSuave: '#475569',
    modalBorda: 'rgba(148, 163, 184, 0.26)',
    modalFechar: 'rgba(226, 232, 240, 0.98)',
    modalFecharTexto: '#0f172a',
  }

  if (tema.valor === 'MODERNO') {
    return {
      ...base,
      fundo: misturarCores(corPrincipal, '#f8fafc', 0.9),
      card: '#ffffff',
      fundoSecundario: misturarCores(corPrincipal, '#ffffff', 0.92),
      chip: misturarCores(corPrincipal, '#ffffff', 0.88),
    }
  }

  if (tema.valor === 'SUAVE') {
    return {
      ...base,
      fundo: misturarCores(corPrincipal, '#f8fafc', 0.95),
      texto: '#243041',
      textoSuave: '#64748b',
      borda: corComAlpha(misturarCores(corPrincipal, '#cbd5e1', 0.7), 0.28),
      fundoSecundario: misturarCores(corPrincipal, '#ffffff', 0.93),
      chipTexto: misturarCores(corSecundaria, '#475569', 0.45),
    }
  }

  return base
}

export function criarVariaveisCssPublicas(mapaEntrada, prefixo) {
  const mapa = mapaEntrada || criarMapaVisualPublico('', '', TEMA_PUBLICO_PADRAO)
  const base = String(prefixo || '--publico-cor').replace(/-$/, '')

  return {
    [`${base}-principal`]: mapa.principal,
    [`${base}-secundaria`]: mapa.secundaria,
    [`${base}-destaque`]: mapa.destaque,
    [`${base}-fundo`]: mapa.fundo,
    [`${base}-card`]: mapa.card,
    [`${base}-texto`]: mapa.texto,
    [`${base}-texto-suave`]: mapa.textoSuave,
    [`${base}-borda`]: mapa.borda,
    [`${base}-hero`]: mapa.hero,
    [`${base}-botao`]: mapa.botao,
    [`${base}-botao-texto`]: mapa.botaoTexto,
    [`${base}-fundo-secundario`]: mapa.fundoSecundario,
    [`${base}-chip`]: mapa.chip,
    [`${base}-chip-texto`]: mapa.chipTexto,
    [`${base}-sucesso`]: mapa.sucesso,
    [`${base}-sucesso-suave`]: mapa.sucessoSuave,
    [`${base}-perigo`]: mapa.perigo,
    [`${base}-perigo-suave`]: mapa.perigoSuave,
    [`${base}-overlay`]: mapa.overlay,
    [`${base}-modal`]: mapa.modal,
    [`${base}-modal-midia`]: mapa.modalMidia,
    [`${base}-modal-texto`]: mapa.modalTexto,
    [`${base}-modal-texto-suave`]: mapa.modalTextoSuave,
    [`${base}-modal-borda`]: mapa.modalBorda,
    [`${base}-modal-fechar`]: mapa.modalFechar,
    [`${base}-modal-fechar-texto`]: mapa.modalFecharTexto,
  }
}
