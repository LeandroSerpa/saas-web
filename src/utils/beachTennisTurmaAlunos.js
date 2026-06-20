function normalizarIdTexto(valor) {
  return String(valor ?? '').trim()
}

export function normalizarTextoPesquisaTurma(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

export function filtrarAlunosPorBuscaTurma(lista = [], busca = '') {
  const termo = normalizarTextoPesquisaTurma(busca)

  if (!termo) {
    return [...lista]
  }

  return [...lista].filter((aluno) =>
    [aluno?.nome, aluno?.email, aluno?.telefone].some((valor) =>
      normalizarTextoPesquisaTurma(valor).includes(termo),
    ),
  )
}

export function construirOrdemAlunosTurma(lista = []) {
  const ordem = new Map()

  for (const [indice, aluno] of [...lista].entries()) {
    const id = normalizarIdTexto(aluno?.clienteId ?? aluno?.id)
    if (id && !ordem.has(id)) {
      ordem.set(id, indice)
    }
  }

  return ordem
}

export function atualizarOrdemTemporariosTurma(ordemAtual = new Map(), idsAdicionados = [], idsPersistidos = new Set()) {
  const proximaOrdem = new Map(ordemAtual)
  const idsPersistidosNormalizados = new Set([...idsPersistidos].map((id) => normalizarIdTexto(id)).filter(Boolean))
  let indice = Math.max(-1, ...proximaOrdem.values()) + 1

  for (const valor of idsAdicionados) {
    const id = normalizarIdTexto(valor)
    if (!id || idsPersistidosNormalizados.has(id) || proximaOrdem.has(id)) {
      continue
    }

    proximaOrdem.set(id, indice)
    indice += 1
  }

  return proximaOrdem
}

function compararTexto(a, b) {
  return String(a || '').localeCompare(String(b || ''), 'pt-BR')
}

export function ordenarAlunosNaTurma(lista = [], { idsPersistidos = new Set(), ordemPersistidos = new Map(), ordemTemporarios = new Map() } = {}) {
  const idsPersistidosNormalizados = new Set([...idsPersistidos].map((id) => normalizarIdTexto(id)).filter(Boolean))

  return [...lista].sort((alunoA, alunoB) => {
    const idA = normalizarIdTexto(alunoA?.clienteId ?? alunoA?.id)
    const idB = normalizarIdTexto(alunoB?.clienteId ?? alunoB?.id)
    const persistidoA = idsPersistidosNormalizados.has(idA)
    const persistidoB = idsPersistidosNormalizados.has(idB)

    if (persistidoA !== persistidoB) {
      return persistidoA ? -1 : 1
    }

    const ordemA = persistidoA ? ordemPersistidos.get(idA) : ordemTemporarios.get(idA)
    const ordemB = persistidoB ? ordemPersistidos.get(idB) : ordemTemporarios.get(idB)

    if (ordemA !== ordemB) {
      return Number(ordemA ?? Number.MAX_SAFE_INTEGER) - Number(ordemB ?? Number.MAX_SAFE_INTEGER)
    }

    const porNome = compararTexto(alunoA?.nome, alunoB?.nome)
    if (porNome !== 0) {
      return porNome
    }

    return compararTexto(idA, idB)
  })
}

export function criarEstadoCapacidadeTurma(vagas, quantidadeFinal) {
  const capacidade = Number.isFinite(Number(vagas)) && Number(vagas) > 0 ? Number(vagas) : null
  const totalSelecionado = Number.isFinite(Number(quantidadeFinal)) ? Number(quantidadeFinal) : 0

  return {
    capacidade,
    capacidadeIlimitada: capacidade === null,
    excedenteCapacidade: capacidade === null ? 0 : Math.max(totalSelecionado - capacidade, 0),
    vagasDisponiveis: capacidade === null ? null : Math.max(capacidade - totalSelecionado, 0),
  }
}
