function normalizarInteiroOpcional(valor, { permitirZero = false } = {}) {
  const numero = Number(valor)

  if (!Number.isFinite(numero)) {
    return null
  }

  if (permitirZero) {
    return numero >= 0 && Number.isInteger(numero) ? numero : null
  }

  return numero > 0 && Number.isInteger(numero) ? numero : null
}

export function interpretarCapacidadeTurma(fonte = {}) {
  const item = fonte && typeof fonte === 'object' ? fonte : {}
  const capacidadeRegular = normalizarInteiroOpcional(item.capacidadeRegular)
  const vagasLegado = normalizarInteiroOpcional(item.vagas)
  const limiteParticipantesExtras = normalizarInteiroOpcional(item.limiteParticipantesExtras, {
    permitirZero: true,
  })
  const capacidadeTotal = normalizarInteiroOpcional(item.capacidadeTotal)
  const capacidadeRegularExibicao = capacidadeRegular ?? vagasLegado
  const capacidadeTotalExibicao =
    capacidadeTotal ??
    (capacidadeRegularExibicao !== null
      ? capacidadeRegularExibicao + (limiteParticipantesExtras ?? 0)
      : null)
  const controleCapacidadeAtivo =
    item.controleCapacidadeAtivo === true ||
    capacidadeRegular !== null ||
    limiteParticipantesExtras !== null ||
    capacidadeTotal !== null

  return {
    capacidadeRegular,
    capacidadeRegularExibicao,
    limiteParticipantesExtras,
    capacidadeTotal,
    capacidadeTotalExibicao,
    controleCapacidadeAtivo,
  }
}

export function formatarResumoCapacidadeTurma(fonte = {}, modo = 'lista') {
  const capacidade = interpretarCapacidadeTurma(fonte)

  if (capacidade.capacidadeRegularExibicao === null) {
    return 'Capacidade não controlada.'
  }

  const regular = capacidade.capacidadeRegularExibicao
  const extras = capacidade.limiteParticipantesExtras ?? 0
  const total = capacidade.capacidadeTotalExibicao ?? regular

  if (extras > 0) {
    if (modo === 'formulario') {
      return `${regular} regulares + ${extras} extras = ${total} participantes por aula.`
    }

    return `Capacidade: ${regular} regulares + ${extras} extras`
  }

  if (modo === 'formulario') {
    return `Capacidade total por aula: ${total} participantes.`
  }

  return `Capacidade: ${total} participantes`
}
