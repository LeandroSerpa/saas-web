const PLANO_RECOMENDADO = 'PROFISSIONAL'

const PLANOS_FALLBACK = [
  {
    chave: 'essencial',
    nome: 'Essencial',
    descricao: 'Para começar a organizar sua empresa.',
    recursos: ['Clientes', 'Serviços', 'Agenda', 'Catálogo público'],
    recomendado: false,
    destaque: 'Base simples',
    preco: null,
  },
  {
    chave: 'profissional',
    nome: 'Profissional',
    descricao: 'Para empresas que precisam de mais controle.',
    recursos: ['Preferências', 'Notificações', 'Relatórios', 'Automações'],
    recomendado: true,
    destaque: 'Plano recomendado',
    preco: null,
  },
  {
    chave: 'gestao-plus',
    nome: 'Gestão Plus',
    descricao: 'Para operações com mais módulos e acompanhamento.',
    recursos: ['Gestão esportiva', 'Estoque', 'Financeiro', 'Administração'],
    recomendado: false,
    destaque: 'Mais recursos',
    preco: null,
  },
]

function textoLimpo(valor) {
  return String(valor ?? '').trim()
}

function numeroOuNulo(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return null
  }

  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : null
}

function extrairRecursosPlano(plano) {
  const recursos = []

  if (Array.isArray(plano?.recursos)) {
    recursos.push(...plano.recursos)
  }

  if (Array.isArray(plano?.beneficios)) {
    recursos.push(...plano.beneficios)
  }

  if (Array.isArray(plano?.itens)) {
    recursos.push(...plano.itens)
  }

  if (Array.isArray(plano?.destaques)) {
    recursos.push(...plano.destaques)
  }

  const recursosFlags = [
    [plano?.permitePersonalizacao, 'Personalização'],
    [plano?.permiteRelatorios, 'Relatórios'],
    [plano?.permiteAgendamentoPublico, 'Agendamento público'],
    [plano?.permiteEstoque, 'Estoque'],
    [plano?.permiteSuportePrioritario, 'Suporte prioritário'],
    [plano?.permiteGestaoEsportiva, 'Gestão esportiva'],
  ]

  for (const [ativo, rotulo] of recursosFlags) {
    if (ativo === true) {
      recursos.push(rotulo)
    }
  }

  return [...new Set(recursos.map((item) => textoLimpo(item)).filter(Boolean))]
}

function identificarPlanoPublico(plano, indice = 0) {
  const chaveBruta = textoLimpo(plano?.chave || plano?.codigo || plano?.slug || plano?.nome || plano?.titulo)
    .toLowerCase()

  if (chaveBruta.includes('essencial') || chaveBruta.includes('basico') || chaveBruta.includes('básico')) {
    return 'ESSENCIAL'
  }

  if (chaveBruta.includes('plus')) {
    return 'GESTAO_PLUS'
  }

  if (chaveBruta.includes('profissional') || chaveBruta.includes('recomend')) {
    return 'PROFISSIONAL'
  }

  if (indice === 1) {
    return 'PROFISSIONAL'
  }

  return PLANO_RECOMENDADO === chaveBruta.toUpperCase() ? 'PROFISSIONAL' : 'ESSENCIAL'
}

function resolverDescricaoPlano(plano) {
  return (
    textoLimpo(plano?.descricao) ||
    textoLimpo(plano?.resumoComercial) ||
    textoLimpo(plano?.resumo) ||
    textoLimpo(plano?.publicoAlvo) ||
    'Plano disponível para apresentação pública.'
  )
}

function resolverPrecoPlano(plano) {
  const valorNumerico = numeroOuNulo(plano?.precoMensal ?? plano?.preco ?? plano?.valor ?? plano?.valorMensal)

  if (valorNumerico !== null && valorNumerico > 0) {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(valorNumerico)
  }

  const texto = textoLimpo(plano?.precoExibicao ?? plano?.textoPreco ?? plano?.valorExibicao)

  return texto || 'Consulte condições'
}

export function obterPlanosPublicosFallback() {
  return PLANOS_FALLBACK.map((plano) => ({ ...plano, recursos: [...plano.recursos] }))
}

export function normalizarPlanoPublico(plano, indice = 0) {
  if (!plano || typeof plano !== 'object') {
    return null
  }

  const nome = textoLimpo(plano.nome || plano.titulo || plano.nomeExibicao)

  if (!nome) {
    return null
  }

  const recursos = extrairRecursosPlano(plano)
  const chave = textoLimpo(plano.id ?? plano.planoId ?? plano.slug ?? plano.codigo ?? nome).toString()

  return {
    id: chave || `${indice + 1}`,
    chave: chave || `${indice + 1}`,
    nome,
    descricao: resolverDescricaoPlano(plano),
    recursos: recursos.length ? recursos : obterPlanosPublicosFallback()[indice % PLANOS_FALLBACK.length].recursos,
    recomendado:
      plano.recomendado === true ||
      plano.destaque === true ||
      plano.principal === true ||
      plano.emDestaque === true ||
      identificarPlanoPublico(plano, indice) === 'PROFISSIONAL',
    selo: textoLimpo(plano.selo || plano.badge || plano.etiqueta || ''),
    destaque: textoLimpo(plano.publicoAlvo || plano.resumoComercial || plano.destaqueComercial?.selo || ''),
    preco: resolverPrecoPlano(plano),
    cta: textoLimpo(plano.textoBotao || plano.cta || plano.acao || 'Começar agora'),
  }
}

export function normalizarPlanosPublicos(resposta) {
  const origem = Array.isArray(resposta)
    ? resposta
    : Array.isArray(resposta?.data)
      ? resposta.data
      : Array.isArray(resposta?.itens)
        ? resposta.itens
        : Array.isArray(resposta?.content)
          ? resposta.content
          : Array.isArray(resposta?.planos)
            ? resposta.planos
            : Array.isArray(resposta?.lista)
              ? resposta.lista
              : []

  const normalizados = origem
    .map((plano, indice) => normalizarPlanoPublico(plano, indice))
    .filter(Boolean)

  if (normalizados.length === 0) {
    return obterPlanosPublicosFallback()
  }

  return [...normalizados].sort((planoA, planoB) => {
    if (planoA.recomendado && !planoB.recomendado) return -1
    if (!planoA.recomendado && planoB.recomendado) return 1

    return planoA.nome.localeCompare(planoB.nome, 'pt-BR')
  })
}

export function formatarPrecoPlanoPublico(plano) {
  return textoLimpo(plano?.preco) || 'Consulte condições'
}

export function resolverPlanoPublicoRecomendado(planos = []) {
  return planos.find((plano) => plano?.recomendado === true) || planos[1] || planos[0] || null
}
