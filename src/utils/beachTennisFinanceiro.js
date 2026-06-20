function normalizarIdTexto(valor) {
  return String(valor ?? '').trim()
}

export function normalizarTextoBuscaBeachTennis(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function criarVariacoesTextoBusca(valor) {
  const textoBase = normalizarTextoBuscaBeachTennis(valor)

  if (!textoBase) {
    return []
  }

  const variacoes = new Set([textoBase])
  const horario = textoBase.match(/^(\d{1,2}):(\d{2})$/)

  if (horario) {
    const hora = horario[1]
    const minutos = horario[2]
    variacoes.add(`${hora}h`)
    variacoes.add(`${hora}h${minutos}`)
  }

  const horarioComH = textoBase.match(/^(\d{1,2})h(\d{2})?$/)
  if (horarioComH) {
    const hora = horarioComH[1]
    const minutos = horarioComH[2] || '00'
    variacoes.add(`${hora}:${minutos}`)
  }

  return [...variacoes]
}

function normalizarHorarioParaMinutos(valor) {
  const texto = String(valor || '').trim().toLowerCase()

  if (!texto) {
    return null
  }

  const horarioComMinutos = texto.match(/^(\d{1,2}):(\d{2})$/)
  if (horarioComMinutos) {
    return Number(horarioComMinutos[1]) * 60 + Number(horarioComMinutos[2])
  }

  const horarioHoraCheia = texto.match(/^(\d{1,2})h$/)
  if (horarioHoraCheia) {
    return Number(horarioHoraCheia[1]) * 60
  }

  if (/^\d{1,2}$/.test(texto)) {
    return Number(texto) * 60
  }

  return null
}

function horarioDentroDoIntervalo(horario, inicio, fim) {
  const horarioMinutos = normalizarHorarioParaMinutos(horario)
  const inicioMinutos = normalizarHorarioParaMinutos(inicio)
  const fimMinutos = normalizarHorarioParaMinutos(fim)

  if (horarioMinutos === null) {
    return !inicioMinutos && !fimMinutos
  }

  if (inicioMinutos !== null && horarioMinutos < inicioMinutos) {
    return false
  }

  if (fimMinutos !== null && horarioMinutos > fimMinutos) {
    return false
  }

  return true
}

export function filtrarTurmasAcordoLocal(lista = [], filtros = {}) {
  const termosBusca = criarVariacoesTextoBusca(filtros.busca)
  const diaSemana = String(filtros.diaSemana || '').trim().toUpperCase()
  const funcionarioId = normalizarIdTexto(filtros.funcionarioId)
  const nivel = String(filtros.nivel || '').trim().toUpperCase()
  const somenteAtivas = filtros.somenteAtivas !== false

  return [...lista].filter((turma) => {
    if (somenteAtivas && turma?.ativo === false) {
      return false
    }

    if (diaSemana && ![].concat(turma?.diasSemana || []).includes(diaSemana)) {
      return false
    }

    if (funcionarioId && normalizarIdTexto(turma?.professorId) !== funcionarioId) {
      return false
    }

    if (nivel && String(turma?.nivelBeachTennis || '').trim().toUpperCase() !== nivel) {
      return false
    }

    if (!horarioDentroDoIntervalo(turma?.horarioInicio, filtros.horarioInicioDe, filtros.horarioInicioAte)) {
      return false
    }

    if (!termosBusca.length) {
      return true
    }

    return [
      turma?.nome,
      turma?.turmaNome,
      turma?.professorResponsavelNome,
      turma?.nivelRotulo,
      turma?.diasSemanaFormatados,
      turma?.horarioFormatado,
      turma?.horarioInicio,
    ].some((valor) => {
      const variacoesValor = criarVariacoesTextoBusca(valor)
      return termosBusca.some((termo) => variacoesValor.some((variacao) => variacao.includes(termo)))
    })
  })
}

export function paginarListaLocal(lista = [], { page = 0, size = 20 } = {}) {
  const paginaAtual = Math.max(Number(page) || 0, 0)
  const tamanhoPagina = Math.max(Number(size) || 20, 1)
  const totalElements = lista.length
  const totalPages = Math.max(Math.ceil(totalElements / tamanhoPagina), 1)
  const inicio = paginaAtual * tamanhoPagina
  const content = lista.slice(inicio, inicio + tamanhoPagina)

  return {
    content,
    page: paginaAtual,
    size: tamanhoPagina,
    totalElements,
    totalPages,
    first: paginaAtual <= 0,
    last: paginaAtual >= totalPages - 1,
    numberOfElements: content.length,
  }
}

function extrairIdItem(item, idKeys = ['id']) {
  if (!item || typeof item !== 'object') {
    return normalizarIdTexto(item)
  }

  for (const chave of idKeys) {
    const valor = normalizarIdTexto(item?.[chave])
    if (valor) {
      return valor
    }
  }

  return ''
}

function extrairNomeItem(item, nomeKeys = ['nome']) {
  if (!item || typeof item !== 'object') {
    return ''
  }

  for (const chave of nomeKeys) {
    const valor = String(item?.[chave] || '').trim()
    if (valor) {
      return valor
    }
  }

  return ''
}

function nomeEhGenerico(nome, nomeGenerico) {
  const valor = normalizarTextoBuscaBeachTennis(nome)
  const generico = normalizarTextoBuscaBeachTennis(nomeGenerico)

  return !valor || (generico && valor === generico)
}

function possuiNomeReal(item, { nomeGenerico = '', idKeys = ['id'], nomeKeys = ['nome'] } = {}) {
  const id = extrairIdItem(item, idKeys)
  const nome = extrairNomeItem(item, nomeKeys)

  return Boolean(id && nome && !nomeEhGenerico(nome, nomeGenerico))
}

export function precisaHidratacaoSelecionados(ids = [], lista = [], opcoes = {}) {
  const idsNormalizados = [...new Set([].concat(ids || []).map((id) => normalizarIdTexto(id)).filter(Boolean))]

  if (!idsNormalizados.length) {
    return false
  }

  const idsPresentes = new Set(lista.map((item) => extrairIdItem(item, opcoes.idKeys)).filter(Boolean))
  if (idsPresentes.size < idsNormalizados.length) {
    return true
  }

  return lista.some((item) => !possuiNomeReal(item, opcoes))
}

export function hidratarSelecionadosPorOpcoes(ids = [], atuais = [], opcoes = [], configuracao = {}) {
  const idKeys = configuracao.idKeys || ['id']
  const nomeKeys = configuracao.nomeKeys || ['nome']
  const nomeGenerico = configuracao.nomeGenerico || ''
  const criarFallback = configuracao.criarFallback || ((id) => ({ id }))
  const mapaAtuais = new Map(
    [].concat(atuais || [])
      .map((item) => [extrairIdItem(item, idKeys), item])
      .filter(([id]) => Boolean(id)),
  )
  const mapaOpcoes = new Map(
    [].concat(opcoes || [])
      .map((item) => [extrairIdItem(item, idKeys), item])
      .filter(([id]) => Boolean(id)),
  )

  return [...new Set([].concat(ids || []).map((id) => normalizarIdTexto(id)).filter(Boolean))].map((id) => {
    const opcao = mapaOpcoes.get(id)
    const atual = mapaAtuais.get(id)

    if (possuiNomeReal(opcao, { idKeys, nomeKeys, nomeGenerico })) {
      return {
        ...(atual || {}),
        ...opcao,
      }
    }

    if (possuiNomeReal(atual, { idKeys, nomeKeys, nomeGenerico })) {
      return atual
    }

    if (opcao) {
      return {
        ...(atual || {}),
        ...opcao,
      }
    }

    if (atual) {
      return atual
    }

    return criarFallback(id)
  })
}

export function criarEstadoResponsavelPagamento(alunosSelecionados = [], responsavelAlunoId = '', { rotuloItem = 'aluno' } = {}) {
  const ids = [].concat(alunosSelecionados || [])
    .map((item) => normalizarIdTexto(item?.id ?? item?.clienteId ?? item))
    .filter(Boolean)
  const responsavelNormalizado = normalizarIdTexto(responsavelAlunoId)
  const responsavelValido = Boolean(responsavelNormalizado && ids.includes(responsavelNormalizado))

  if (!ids.length) {
    return {
      disabled: true,
      placeholder: `Selecione primeiro um ${rotuloItem}`,
      ajuda: `Selecione ao menos um ${rotuloItem} para liberar o responsável pelo pagamento.`,
      responsavelValido: false,
    }
  }

  return {
    disabled: false,
    placeholder: 'Selecione',
    ajuda: responsavelValido ? '' : 'Escolha o responsável pelo pagamento entre os alunos selecionados.',
    responsavelValido,
  }
}

export function clonarEstadoSelecaoTemporaria(ids = new Set(), mapa = new Map()) {
  return {
    ids: new Set([...(ids || new Set())].map((id) => normalizarIdTexto(id)).filter(Boolean)),
    mapa: new Map(mapa || new Map()),
  }
}
