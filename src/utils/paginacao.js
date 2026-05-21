export const OPCOES_TAMANHO_PAGINA = Object.freeze([10, 20, 50, 100])

export function criarPaginacaoInicial(size = 10) {
  return {
    page: 0,
    size,
    totalElements: 0,
    totalPages: 1,
    first: true,
    last: true,
    numberOfElements: 0,
  }
}

export function normalizarRespostaPaginada(resposta, { page = 0, size = 10 } = {}) {
  if (resposta && typeof resposta === 'object' && Array.isArray(resposta.content)) {
    const pageAtual = normalizarNumero(resposta.page ?? resposta.number, page)
    const sizeAtual = normalizarNumero(resposta.size, size)
    const totalElements = normalizarNumero(resposta.totalElements ?? resposta.total, resposta.content.length)
    const totalPagesCalculado = totalElements > 0 ? Math.ceil(totalElements / Math.max(sizeAtual, 1)) : 1
    const totalPages = Math.max(normalizarNumero(resposta.totalPages, totalPagesCalculado), 1)

    return {
      paginada: true,
      content: resposta.content,
      page: pageAtual,
      size: sizeAtual,
      totalElements,
      totalPages,
      first: Boolean(resposta.first ?? pageAtual <= 0),
      last: Boolean(resposta.last ?? pageAtual >= totalPages - 1),
      numberOfElements: normalizarNumero(resposta.numberOfElements, resposta.content.length),
    }
  }

  const lista = extrairListaResposta(resposta)

  return {
    paginada: false,
    content: lista,
    page: 0,
    size,
    totalElements: lista.length,
    totalPages: 1,
    first: true,
    last: true,
    numberOfElements: lista.length,
  }
}

function extrairListaResposta(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.items || resposta?.data || resposta?.dados || resposta?.registros || []
}

function normalizarNumero(valor, fallback) {
  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : fallback
}
