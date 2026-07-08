const CHAVES_RESUMO = ['aparencia', 'uso', 'telas', 'dicas', 'atalhos']

const RESUMO_FALLBACK = {
  titulo: 'Resumo da conta',
  subtitulo: 'Preferências disponíveis, dicas e atalhos configuráveis.',
  cards: [
    {
      chave: 'aparencia',
      titulo: 'Aparência',
      descricao: 'Tema e visual sincronizados com sua conta.',
    },
    {
      chave: 'uso',
      titulo: 'Uso',
      descricao: 'Preferências operacionais e padrões da rotina.',
    },
    {
      chave: 'telas',
      titulo: 'Telas',
      descricao: 'Configurações por área do sistema.',
    },
    {
      chave: 'dicas',
      titulo: 'Dicas',
      descricao: 'Orientações e primeiros passos disponíveis.',
    },
    {
      chave: 'atalhos',
      titulo: 'Atalhos',
      descricao: 'Favoritos, fixados e ações rápidas.',
    },
  ],
}

function textoLimpo(valor) {
  return String(valor ?? '').trim()
}

function normalizarObjetoResumo(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return null
  }

  return resposta.data && typeof resposta.data === 'object' ? resposta.data : resposta
}

function obterFonteCard(resumo, chave) {
  const possiveis = [
    resumo?.[chave],
    resumo?.[`${chave}Resumo`],
    resumo?.[`${chave}ResumoConta`],
    resumo?.[`${chave}Conta`],
    resumo?.[`${chave}Info`],
  ]

  for (const valor of possiveis) {
    if (valor && typeof valor === 'object' && !Array.isArray(valor)) {
      return valor
    }
  }

  return {}
}

function normalizarCardResumo(resumo, chave, fallback) {
  const fonte = obterFonteCard(resumo, chave)

  const titulo = textoLimpo(fonte.titulo || fonte.nome || resumo?.[`${chave}Titulo`]) || fallback.titulo
  const descricao =
    textoLimpo(fonte.descricao || fonte.texto || fonte.resumo || fonte.detalhe || resumo?.[`${chave}Descricao`]) ||
    fallback.descricao

  return {
    chave,
    titulo,
    descricao,
  }
}

export function obterResumoMinhaContaFallback() {
  return {
    titulo: RESUMO_FALLBACK.titulo,
    subtitulo: RESUMO_FALLBACK.subtitulo,
    cards: RESUMO_FALLBACK.cards.map((card) => ({ ...card })),
  }
}

export function normalizarResumoMinhaConta(resposta) {
  const resumo = normalizarObjetoResumo(resposta)

  if (!resumo) {
    return obterResumoMinhaContaFallback()
  }

  const cardsBackend = Array.isArray(resumo.cards)
    ? resumo.cards
    : Array.isArray(resumo.itens)
      ? resumo.itens
      : Array.isArray(resumo.resumo)
        ? resumo.resumo
        : null

  const cards = cardsBackend && cardsBackend.length
    ? cardsBackend
        .map((item, indice) => {
          const chave = textoLimpo(item?.chave || item?.id || item?.codigo || CHAVES_RESUMO[indice] || `card-${indice + 1}`)
          const fallback = RESUMO_FALLBACK.cards.find((card) => card.chave === chave) || RESUMO_FALLBACK.cards[indice % RESUMO_FALLBACK.cards.length]

          return {
            chave,
            titulo: textoLimpo(item?.titulo || item?.nome) || fallback.titulo,
            descricao: textoLimpo(item?.descricao || item?.texto || item?.resumo || item?.detalhe) || fallback.descricao,
          }
        })
        .filter(Boolean)
    : CHAVES_RESUMO.map((chave, indice) =>
        normalizarCardResumo(
          resumo,
          chave,
          RESUMO_FALLBACK.cards[indice % RESUMO_FALLBACK.cards.length],
        ),
      )

  return {
    titulo: textoLimpo(resumo.titulo || resumo.nome) || RESUMO_FALLBACK.titulo,
    subtitulo: textoLimpo(resumo.subtitulo || resumo.descricao || resumo.resumo) || RESUMO_FALLBACK.subtitulo,
    cards: cards.length ? cards : obterResumoMinhaContaFallback().cards,
  }
}
