const OPCOES_SITUACAO_FREQUENCIA = Object.freeze([
  { valor: 'NAO_LANCADO', rotulo: 'Não lançado' },
  { valor: 'PRESENTE', rotulo: 'Presente' },
  { valor: 'FALTA_JUSTIFICADA', rotulo: 'Falta justificada' },
  { valor: 'FALTA_SEM_JUSTIFICATIVA', rotulo: 'Falta sem justificativa' },
  { valor: 'REPOSICAO_REALIZADA', rotulo: 'Reposição realizada' },
])

const STATUS_FREQUENCIA_PERSISTIVEIS = new Set(
  OPCOES_SITUACAO_FREQUENCIA.map((opcao) => opcao.valor).filter((valor) => valor !== 'NAO_LANCADO'),
)

function valorRota(valor) {
  return Array.isArray(valor) ? valor[0] : valor
}

export function normalizarIdPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

export function normalizarTextoOpcional(valor) {
  const texto = String(valor ?? '').trim()
  return texto || ''
}

export function normalizarNumero(valor, fallback = 0) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 ? numero : fallback
}

export function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

export function criarDataHojeISO() {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  return formatarDataISO(data)
}

export function normalizarSituacaoAula(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return ['AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_REALIZADA'].includes(texto) ? texto : ''
}

export function normalizarSituacaoFrequencia(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return STATUS_FREQUENCIA_PERSISTIVEIS.has(texto) || texto === 'NAO_LANCADO' ? texto : 'NAO_LANCADO'
}

export function normalizarTipoParticipacao(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return texto || 'REGULAR'
}

export function formatarMensagemQuantidade(quantidade, singular, plural) {
  const numero = Number(quantidade)
  const total = Number.isFinite(numero) && numero >= 0 ? numero : 0
  return `${total} ${total === 1 ? singular : plural}`
}

export function obterNumeroDeCampo(fontes = [], chaves = [], fallback = 0) {
  for (const fonte of fontes) {
    if (!fonte || typeof fonte !== 'object') {
      continue
    }

    for (const chave of chaves) {
      const numero = Number(fonte[chave])
      if (Number.isFinite(numero) && numero >= 0) {
        return numero
      }
    }
  }

  return fallback
}

export function formatarDuracaoMinutos(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) {
    return '-'
  }

  const horas = Math.floor(numero / 60)
  const minutos = numero % 60

  if (horas > 0 && minutos > 0) {
    return `${horas}h ${minutos}min`
  }

  if (horas > 0) {
    return `${horas}h`
  }

  return `${minutos} min`
}

export function formatarHorario(valor) {
  const texto = String(valor || '').trim()
  if (!texto) {
    return '-'
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(texto)) {
    return texto.slice(0, 5)
  }

  return texto
}

export function formatarDataHoraSemConversaoFuso(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return '-'
  }

  const correspondencia = texto.match(
    /^(\d{4})-(\d{2})-(\d{2})[Tt ](\d{2}):(\d{2})(?::\d{2}(?:[.,]\d+)?)?(?:Z|[+-]\d{2}:\d{2})?$/,
  )

  if (!correspondencia) {
    return '-'
  }

  const [, ano, mes, dia, hora, minuto] = correspondencia
  return `${dia}/${mes}/${ano}, ${hora}:${minuto}`
}

export function rotuloSituacaoAula(valor) {
  const situacao = normalizarSituacaoAula(valor)

  return (
    {
      AGENDADA: 'Agendada',
      REALIZADA: 'Realizada',
      CANCELADA: 'Cancelada',
      NAO_REALIZADA: 'Não realizada',
    }[situacao] || situacao || '-'
  )
}

export function rotuloSituacaoFrequencia(valor) {
  const situacao = normalizarSituacaoFrequencia(valor)

  return (
    {
      NAO_LANCADO: 'Não lançado',
      PRESENTE: 'Presente',
      FALTA_JUSTIFICADA: 'Falta justificada',
      FALTA_SEM_JUSTIFICATIVA: 'Falta sem justificativa',
      REPOSICAO_REALIZADA: 'Reposição realizada',
    }[situacao] || situacao || '-'
  )
}

export function estadoSituacaoAula(valor) {
  const situacao = normalizarSituacaoAula(valor)
  return `estado-${situacao.toLowerCase() || 'indefinido'}`
}

export function normalizarAulaLista(item = {}) {
  const id = normalizarIdPositivo(item.id ?? item.aulaId)
  if (!id) {
    return null
  }

  const resumo = item.resumoFrequencias && typeof item.resumoFrequencias === 'object' ? item.resumoFrequencias : {}

  return {
    id,
    dataAula: normalizarTextoOpcional(item.dataAula || item.data),
    horarioInicio: normalizarTextoOpcional(item.horarioInicio || item.horario),
    duracaoMinutos: normalizarNumero(item.duracaoMinutos ?? item.duracao ?? item.duracaoMin ?? 0, 0),
    turmaId: normalizarIdPositivo(item.turmaId),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma || ''),
    nivel: String(item.nivel || item.nivelBeachTennis || '').trim().toUpperCase(),
    competicao: item.competicao === true,
    professorId: normalizarIdPositivo(item.professorId ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.funcionarioNome || ''),
    situacao: normalizarSituacaoAula(item.situacao),
    motivoCancelamento: normalizarTextoOpcional(
      item.motivoCancelamento ||
        item.motivo_cancelamento ||
        item.motivoCancelamentoAula ||
        item.motivoCancelacao ||
        item.motivo_cancelacao ||
        item.motivoCancelacaoAula ||
        item.motivo,
    ),
    canceladoEm: normalizarTextoOpcional(
      item.canceladoEm || item.cancelado_em || item.dataCancelamento || item.data_cancelamento || item.canceladoEmAula,
    ),
    canceladoPorUsuarioNome: normalizarTextoOpcional(
      item.canceladoPorUsuarioNome ||
        item.cancelado_por_usuario_nome ||
        item.usuarioCancelamentoNome ||
        item.usuario_cancelamento_nome ||
        item.canceladoPorNome ||
        item.cancelado_por_nome,
    ),
    quantidadeParticipantes: obterNumeroDeCampo([item, resumo], ['quantidadeParticipantes', 'totalParticipantes', 'total', 'quantidadeTotal'], 0),
    presentes: obterNumeroDeCampo([item, resumo], ['presentes', 'qtdPresentes', 'quantidadePresentes'], 0),
    faltasJustificadas: obterNumeroDeCampo([item, resumo], ['faltasJustificadas', 'qtdFaltasJustificadas', 'faltasComJustificativa'], 0),
    faltasSemJustificativa: obterNumeroDeCampo([item, resumo], ['faltasSemJustificativa', 'qtdFaltasSemJustificativa'], 0),
    reposicoesRealizadas: obterNumeroDeCampo([item, resumo], ['reposicoesRealizadas', 'qtdReposicoesRealizadas', 'reposicoes'], 0),
    naoLancados: obterNumeroDeCampo([item, resumo], ['naoLancados', 'naoLancados', 'qtdNaoLancados'], 0),
  }
}

export function normalizarParticipante(item = {}) {
  const clienteId = normalizarIdPositivo(item.clienteId ?? item.alunoId ?? item.id)
  if (!clienteId) {
    return null
  }

  return {
    clienteId,
    clienteNome: normalizarTextoOpcional(item.clienteNome || item.nome || item.alunoNome || `Participante ${clienteId}`),
    clienteTelefone: normalizarTextoOpcional(item.clienteTelefone || item.telefone),
    clienteNivel: String(item.clienteNivel || item.nivel || item.nivelBeachTennis || '').trim().toUpperCase(),
    dataEntrada: normalizarTextoOpcional(item.dataEntrada),
    dataSaida: normalizarTextoOpcional(item.dataSaida),
    situacao: normalizarSituacaoFrequencia(item.situacao),
    justificativa: normalizarTextoOpcional(item.justificativa),
    observacao: normalizarTextoOpcional(item.observacao),
    tipoParticipacao: normalizarTipoParticipacao(item.tipoParticipacao),
    usuarioLancamentoId: item.usuarioLancamentoId ?? null,
    lancadoEm: normalizarTextoOpcional(item.lancadoEm),
    atualizadoEm: normalizarTextoOpcional(item.atualizadoEm),
  }
}

export function normalizarAulaDetalhe(item = {}) {
  const base = normalizarAulaLista(item) || {
    id: normalizarIdPositivo(item.id ?? item.aulaId) || null,
    dataAula: normalizarTextoOpcional(item.dataAula || item.data),
    horarioInicio: normalizarTextoOpcional(item.horarioInicio || item.horario),
    duracaoMinutos: normalizarNumero(item.duracaoMinutos ?? item.duracao ?? 0, 0),
    turmaId: normalizarIdPositivo(item.turmaId),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma || ''),
    nivel: String(item.nivel || item.nivelBeachTennis || '').trim().toUpperCase(),
    competicao: item.competicao === true,
    professorId: normalizarIdPositivo(item.professorId ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.funcionarioNome || ''),
    situacao: normalizarSituacaoAula(item.situacao),
    quantidadeParticipantes: 0,
    presentes: 0,
    faltasJustificadas: 0,
    faltasSemJustificativa: 0,
    reposicoesRealizadas: 0,
    naoLancados: 0,
  }

  const participantes = Array.isArray(item.participantes) ? item.participantes : []
  const mapa = new Map()

  for (const participante of participantes) {
    const normalizado = normalizarParticipante(participante)
    if (!normalizado || mapa.has(normalizado.clienteId)) {
      continue
    }

    mapa.set(normalizado.clienteId, normalizado)
  }

  const participantesNormalizados = [...mapa.values()].sort((a, b) =>
    String(a.clienteNome).localeCompare(String(b.clienteNome), 'pt-BR'),
  )

  return {
    ...base,
    resumoFrequencias: item.resumoFrequencias && typeof item.resumoFrequencias === 'object' ? item.resumoFrequencias : {},
    quantidadeParticipantes: base.quantidadeParticipantes || participantesNormalizados.length,
    participantes: participantesNormalizados,
    motivoCancelamento:
      base.motivoCancelamento ||
      normalizarTextoOpcional(
        item.motivoCancelamento || item.motivo_cancelamento || item.motivoCancelacao || item.motivo_cancelacao || item.motivo,
      ),
    canceladoEm:
      base.canceladoEm ||
      normalizarTextoOpcional(item.canceladoEm || item.cancelado_em || item.dataCancelamento || item.data_cancelamento),
    canceladoPorUsuarioNome:
      base.canceladoPorUsuarioNome ||
      normalizarTextoOpcional(
        item.canceladoPorUsuarioNome ||
          item.cancelado_por_usuario_nome ||
          item.usuarioCancelamentoNome ||
          item.usuario_cancelamento_nome,
      ),
  }
}

export function contarSituacao(lista, situacao) {
  const itens = Array.isArray(lista) ? lista : []
  return itens.filter((item) => normalizarSituacaoFrequencia(item.situacao) === situacao).length
}

export function calcularResumoFrequencias(aula = null, participantes = []) {
  const resumo = aula?.resumoFrequencias && typeof aula.resumoFrequencias === 'object' ? aula.resumoFrequencias : {}
  const lista = Array.isArray(participantes) ? participantes : []

  return {
    quantidadeParticipantes: obterNumeroDeCampo([aula, resumo], ['quantidadeParticipantes', 'totalParticipantes', 'total', 'quantidadeTotal'], lista.length),
    presentes: obterNumeroDeCampo([aula, resumo], ['presentes', 'qtdPresentes', 'quantidadePresentes'], contarSituacao(lista, 'PRESENTE')),
    faltasJustificadas: obterNumeroDeCampo(
      [aula, resumo],
      ['faltasJustificadas', 'qtdFaltasJustificadas', 'faltasComJustificativa'],
      contarSituacao(lista, 'FALTA_JUSTIFICADA'),
    ),
    faltasSemJustificativa: obterNumeroDeCampo(
      [aula, resumo],
      ['faltasSemJustificativa', 'qtdFaltasSemJustificativa'],
      contarSituacao(lista, 'FALTA_SEM_JUSTIFICATIVA'),
    ),
    reposicoesRealizadas: obterNumeroDeCampo(
      [aula, resumo],
      ['reposicoesRealizadas', 'qtdReposicoesRealizadas', 'reposicoes'],
      contarSituacao(lista, 'REPOSICAO_REALIZADA'),
    ),
    naoLancados: obterNumeroDeCampo([aula, resumo], ['naoLancados', 'naoLancados', 'qtdNaoLancados'], contarSituacao(lista, 'NAO_LANCADO')),
  }
}

function normalizarComparacaoParticipante(participante = {}) {
  return {
    situacao: normalizarSituacaoFrequencia(participante.situacao),
    justificativa: normalizarTextoOpcional(participante.justificativa),
    observacao: normalizarTextoOpcional(participante.observacao),
    tipoParticipacao: normalizarTipoParticipacao(participante.tipoParticipacao),
  }
}

function saoParticipantesIguais(a, b) {
  return (
    a.situacao === b.situacao &&
    a.justificativa === b.justificativa &&
    a.observacao === b.observacao &&
    a.tipoParticipacao === b.tipoParticipacao
  )
}

export function criarSnapshotParticipantes(participantes = []) {
  const mapa = new Map()
  for (const participante of Array.isArray(participantes) ? participantes : []) {
    mapa.set(participante.clienteId, normalizarComparacaoParticipante(participante))
  }
  return mapa
}

export function temLancamentoPersistido(participante = {}, snapshotParticipantes = new Map()) {
  const original = snapshotParticipantes.get(participante.clienteId)
  if (!original) {
    return false
  }

  return STATUS_FREQUENCIA_PERSISTIVEIS.has(original.situacao)
}

export function temFrequenciaPersistidaNaAula(aula = null, participantes = [], snapshotParticipantes = new Map()) {
  const listaParticipantes = Array.isArray(participantes) ? participantes : []
  if (listaParticipantes.some((participante) => temLancamentoPersistido(participante, snapshotParticipantes))) {
    return true
  }

  const resumo = calcularResumoFrequencias(aula, listaParticipantes)
  return (
    resumo.presentes > 0 ||
    resumo.faltasJustificadas > 0 ||
    resumo.faltasSemJustificativa > 0 ||
    resumo.reposicoesRealizadas > 0
  )
}

export function temAlteracaoParticipante(participante = {}, snapshotParticipantes = new Map()) {
  const original = snapshotParticipantes.get(participante.clienteId)
  if (!original) {
    return false
  }

  const atual = normalizarComparacaoParticipante(participante)

  if (!STATUS_FREQUENCIA_PERSISTIVEIS.has(atual.situacao)) {
    return false
  }

  return !saoParticipantesIguais(atual, original)
}

export function prepararPayloadFrequenciasAlteradas(participantes = [], snapshotParticipantes = new Map()) {
  const mapa = new Map()
  const payload = []

  for (const participante of Array.isArray(participantes) ? participantes : []) {
    const original = snapshotParticipantes.get(participante.clienteId)
    if (!original) {
      continue
    }

    const atual = normalizarComparacaoParticipante(participante)
    if (!STATUS_FREQUENCIA_PERSISTIVEIS.has(atual.situacao)) {
      continue
    }

    if (saoParticipantesIguais(atual, original)) {
      continue
    }

    if (mapa.has(participante.clienteId)) {
      continue
    }

    const lancamento = {
      clienteId: participante.clienteId,
      situacao: atual.situacao,
      justificativa: atual.situacao === 'FALTA_JUSTIFICADA' ? atual.justificativa || null : null,
      observacao: atual.observacao || null,
      tipoParticipacao: atual.tipoParticipacao || 'REGULAR',
    }

    mapa.set(participante.clienteId, lancamento)
    payload.push(lancamento)
  }

  return payload
}

export function opcoesSituacaoParticipante(participante = {}, snapshotParticipantes = new Map()) {
  const original = snapshotParticipantes.get(participante.clienteId)
  if (!original || original.situacao === 'NAO_LANCADO') {
    return OPCOES_SITUACAO_FREQUENCIA
  }

  return OPCOES_SITUACAO_FREQUENCIA.filter((opcao) => opcao.valor !== 'NAO_LANCADO')
}

export { OPCOES_SITUACAO_FREQUENCIA, STATUS_FREQUENCIA_PERSISTIVEIS, valorRota }
