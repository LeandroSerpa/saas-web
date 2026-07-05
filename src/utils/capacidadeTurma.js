function normalizarInteiroOpcional(valor, { permitirZero = false } = {}) {
  const texto = String(valor ?? '').trim()

  if (!texto) {
    return null
  }

  if (!/^-?\d+$/.test(texto)) {
    return null
  }

  const numero = Number(texto)

  if (!Number.isInteger(numero)) {
    return null
  }

  if (permitirZero) {
    return numero >= 0 ? numero : null
  }

  return numero > 0 ? numero : null
}

function formatarQuantidade(valor, singular, plural) {
  return `${valor} ${valor === 1 ? singular : plural}`
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
    return 'Capacidade não controlada'
  }

  const regular = capacidade.capacidadeRegularExibicao
  const extras = capacidade.limiteParticipantesExtras ?? 0
  const total = capacidade.capacidadeTotalExibicao ?? regular

  if (extras > 0) {
    if (modo === 'formulario') {
      return `${formatarQuantidade(regular, 'regular', 'regulares')} + ${formatarQuantidade(extras, 'extra', 'extras')} = ${formatarQuantidade(total, 'participante', 'participantes')} por aula.`
    }

    return `Capacidade: ${formatarQuantidade(regular, 'regular', 'regulares')} + ${formatarQuantidade(extras, 'extra', 'extras')} — limite total de ${formatarQuantidade(total, 'participante', 'participantes')}`
  }

  if (modo === 'formulario') {
    return `Capacidade total por aula: ${formatarQuantidade(total, 'participante', 'participantes')}.`
  }

  return `Capacidade: ${formatarQuantidade(total, 'participante', 'participantes')}`
}
