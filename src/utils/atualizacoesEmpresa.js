export const EVENTO_ATUALIZACAO_EMPRESA = 'gestao-saas:atualizacao-empresa'
export const CHAVE_STORAGE_ATUALIZACAO_EMPRESA = 'gestao-saas:atualizacao-empresa'

const ESCOPOS_VALIDOS = new Set(['agenda', 'notificacoes', 'dashboard'])

function normalizarEscopos(escopos) {
  const lista = Array.isArray(escopos) ? escopos : []

  const normalizados = lista
    .map((escopo) => String(escopo || '').trim().toLowerCase())
    .filter((escopo) => ESCOPOS_VALIDOS.has(escopo))

  return normalizados.length ? [...new Set(normalizados)] : ['agenda', 'notificacoes', 'dashboard']
}

function criarDetalheAtualizacao({ origem = 'sistema', escopos = [] } = {}) {
  return {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
    origem: String(origem || 'sistema').trim() || 'sistema',
    escopos: normalizarEscopos(escopos),
    em: new Date().toISOString(),
  }
}

export function emitirAtualizacaoEmpresa(opcoes = {}) {
  const detalhe = criarDetalheAtualizacao(opcoes)

  if (typeof window !== 'undefined') {
    window.dispatchEvent(
      new CustomEvent(EVENTO_ATUALIZACAO_EMPRESA, {
        detail: detalhe,
      }),
    )

    try {
      window.localStorage.setItem(CHAVE_STORAGE_ATUALIZACAO_EMPRESA, JSON.stringify(detalhe))
    } catch (error) {
      console.error(error)
    }
  }

  return detalhe
}

export function atualizarEscopoSolicitado(detalhe, escopo) {
  const escopoNormalizado = String(escopo || '').trim().toLowerCase()

  if (!ESCOPOS_VALIDOS.has(escopoNormalizado)) {
    return false
  }

  return normalizarEscopos(detalhe?.escopos).includes(escopoNormalizado)
}

export function lerAtualizacaoEmpresaStorage(event) {
  if (event?.key !== CHAVE_STORAGE_ATUALIZACAO_EMPRESA || !event.newValue) {
    return null
  }

  try {
    return JSON.parse(event.newValue)
  } catch {
    return null
  }
}
