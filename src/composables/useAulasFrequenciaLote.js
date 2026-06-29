import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buscarAulasGestaoEsportiva,
  buscarFuncionarios,
  buscarPreviaCancelamentoAulasGestaoEsportiva,
  buscarPreviaReversaoAulasGestaoEsportiva,
  buscarTurmasBeachTennis,
  cancelarAulasGestaoEsportivaEmLote,
  reverterAulasGestaoEsportivaEmLote,
} from '@/services/api'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { formatarDataBrasileira } from '@/utils/beachTennis'
import { formatarMensagemQuantidade } from '@/utils/aulasFrequencia'

const CHAVE_FEEDBACK_RETORNO = 'aulas-frequencia-lote-feedback'

const ETAPAS_LOTE = Object.freeze({
  CONFIGURACAO: 'CONFIGURACAO',
  PREVIA: 'PREVIA',
})

const TIPOS_LOTE = Object.freeze({
  CANCELAMENTO: 'CANCELAMENTO',
  RETOMADA: 'RETOMADA',
})

const OPCOES_ESCOPO = Object.freeze([
  { valor: 'AULAS_ESPECIFICAS', rotulo: 'Aulas específicas da data' },
  { valor: 'TURMAS_NA_DATA', rotulo: 'Turmas específicas na data' },
  { valor: 'TODAS_DA_DATA', rotulo: 'Todas as aulas da data escolhida' },
  { valor: 'PERIODO_DA_DATA', rotulo: 'Aulas por período na data escolhida' },
])

const OPCOES_PERIODO = Object.freeze([
  { valor: 'MANHA', rotulo: 'Manhã' },
  { valor: 'TARDE', rotulo: 'Tarde' },
  { valor: 'NOITE', rotulo: 'Noite' },
])

function valorRota(valor) {
  return Array.isArray(valor) ? valor[0] : valor
}

function resolverTipoLoteDaRota(nomeRota) {
  const rota = String(nomeRota || '').trim()

  if (rota === 'aulas-frequencia-lote-retomar') {
    return TIPOS_LOTE.RETOMADA
  }

  if (rota === 'aulas-frequencia-lote-cancelar') {
    return TIPOS_LOTE.CANCELAMENTO
  }

  return ''
}

function criarDataISO(dias = 0) {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  data.setDate(data.getDate() + dias)
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function criarEstadoInicial(tipo, { data = criarDataISO(0), professorId = '' } = {}) {
  return {
    escopo: 'PERIODO_DA_DATA',
    data,
    professorId,
    periodo: '',
    motivo: tipo === TIPOS_LOTE.CANCELAMENTO ? '' : undefined,
    aulaIds: [],
    turmaIds: [],
  }
}

function normalizarTextoOpcional(valor) {
  const texto = String(valor ?? '').trim()
  return texto || ''
}

function normalizarNumero(valor, fallback = 0) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero >= 0 ? numero : fallback
}

function normalizarIdPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function normalizarSituacaoAula(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return ['AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_REALIZADA'].includes(texto) ? texto : ''
}

function obterNumeroDeCampo(fontes = [], chaves = [], fallback = 0) {
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

function normalizarListaIds(valor) {
  const valores = Array.isArray(valor) ? valor : []
  const ids = []
  const vistos = new Set()

  for (const item of valores) {
    const id = normalizarIdPositivo(item)
    if (!id || vistos.has(id)) {
      continue
    }

    vistos.add(id)
    ids.push(id)
  }

  return ids.sort((a, b) => a - b)
}

function formatarPeriodoLote(valor) {
  return (
    {
      MANHA: 'Manhã',
      TARDE: 'Tarde',
      NOITE: 'Noite',
    }[String(valor || '').trim().toUpperCase()] || ''
  )
}

function obterDescricaoEscopoLote(escopo) {
  const valor = String(escopo || '').trim().toUpperCase()

  return (
    {
      AULAS_ESPECIFICAS: 'Carrega todas as aulas da data selecionada para você escolher manualmente.',
      TURMAS_NA_DATA: 'Considera somente as aulas das turmas marcadas na data selecionada.',
      TODAS_DA_DATA: 'Considera todas as aulas existentes somente na data selecionada, em qualquer horário.',
      PERIODO_DA_DATA: 'Considera somente as aulas da data selecionada dentro do período escolhido.',
    }[valor] || ''
  )
}

function obterRotuloPreviaLote({ data = '', escopo = '', periodo = '', totalTurmasSelecionadas = 0 } = {}) {
  const dataFormatada = formatarDataBrasileira(data) || 'data selecionada'
  const partes = [`Prévia de ${dataFormatada}`]
  const escopoNormalizado = String(escopo || '').trim().toUpperCase()

  if (escopoNormalizado === 'PERIODO_DA_DATA') {
    const rotuloPeriodo = formatarPeriodoLote(periodo)
    if (rotuloPeriodo) {
      partes.push(`— ${rotuloPeriodo}`)
    }
  }

  if (escopoNormalizado === 'TURMAS_NA_DATA') {
    const quantidade = Number(totalTurmasSelecionadas) || 0
    partes.push(`— ${quantidade} turma${quantidade === 1 ? '' : 's'} selecionada${quantidade === 1 ? '' : 's'}`)
  }

  return partes.join(' ')
}

function normalizarTurmaOpcao(item = {}) {
  const id = normalizarIdPositivo(item.id ?? item.turmaId)
  if (!id) {
    return null
  }

  return {
    id,
    nome: normalizarTextoOpcional(item.nome || item.turmaNome || `Turma ${id}`),
    nivel: String(item.nivel || item.nivelBeachTennis || '').trim().toUpperCase(),
    competicao: item.competicao === true,
    ativo: item.ativo !== false,
  }
}

function normalizarProfessorOpcao(item = {}) {
  const id = normalizarIdPositivo(item.id ?? item.funcionarioId)
  if (!id) {
    return null
  }

  return {
    id,
    nome: normalizarTextoOpcional(item.nome || item.nomeCompleto || item.apelido || `Profissional ${id}`),
    ativo: item.ativo !== false,
  }
}

function normalizarAulaLista(item = {}) {
  const id = normalizarIdPositivo(item.id ?? item.aulaId)
  if (!id) {
    return null
  }

  return {
    id,
    dataAula: normalizarTextoOpcional(item.dataAula || item.data),
    horarioInicio: normalizarTextoOpcional(item.horarioInicio || item.horario),
    turmaId: normalizarIdPositivo(item.turmaId),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma || ''),
    professorId: normalizarIdPositivo(item.professorId ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.funcionarioNome || ''),
    situacao: normalizarSituacaoAula(item.situacao),
  }
}

function normalizarAulaPreviaCancelamentoLote(item = {}) {
  const aulaId = normalizarIdPositivo(item.aulaId ?? item.id)
  if (!aulaId) {
    return null
  }

  return {
    aulaId,
    data: normalizarTextoOpcional(item.data || item.dataAula || item.data_aula),
    horario: normalizarTextoOpcional(item.horario || item.horarioInicio || item.horario_inicio),
    turmaId: normalizarIdPositivo(item.turmaId ?? item.turma_id),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma_nome || item.turma || ''),
    professorId: normalizarIdPositivo(item.professorId ?? item.professor_id ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.professor_nome || item.funcionarioNome || ''),
    situacao: normalizarSituacaoAula(item.situacao),
    cancelavel: item.cancelavel === true || item.cancelavel === 'true' || item.cancelavel === 1,
    motivoBloqueio: normalizarTextoOpcional(item.motivoBloqueio || item.motivo_bloqueio),
    jaCancelada: item.jaCancelada === true || item.ja_cancelada === true || item.jaCancelada === 1,
  }
}

function normalizarAulaPreviaRetomadaLote(item = {}) {
  const aulaId = normalizarIdPositivo(item.aulaId ?? item.id)
  if (!aulaId) {
    return null
  }

  return {
    aulaId,
    data: normalizarTextoOpcional(item.data || item.dataAula || item.data_aula),
    horario: normalizarTextoOpcional(item.horario || item.horarioInicio || item.horario_inicio),
    turmaId: normalizarIdPositivo(item.turmaId ?? item.turma_id),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma_nome || item.turma || ''),
    professorId: normalizarIdPositivo(item.professorId ?? item.professor_id ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.professor_nome || item.funcionarioNome || ''),
    situacao: normalizarSituacaoAula(item.situacao),
    reversivel: item.reversivel === true || item.reversivel === 'true' || item.reversivel === 1,
    jaAtiva: item.jaAtiva === true || item.ja_ativa === true || item.jaAtiva === 1,
    bloqueada: item.bloqueada === true || item.bloqueada === 'true' || item.bloqueada === 1,
    motivoBloqueio: normalizarTextoOpcional(item.motivoBloqueio || item.motivo_bloqueio),
  }
}

function normalizarPreviaCancelamentoLote(resposta = {}) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const aulasNormalizadas = (Array.isArray(base.aulas) ? base.aulas : [])
    .map((item) => normalizarAulaPreviaCancelamentoLote(item))
    .filter(Boolean)

  return {
    escopo: String(base.escopo || '').trim().toUpperCase(),
    dataProcessada: normalizarTextoOpcional(base.dataProcessada || base.data),
    quantidadeEncontrada: obterNumeroDeCampo([base], ['quantidadeEncontrada', 'totalEncontrado', 'encontradas'], aulasNormalizadas.length),
    quantidadeCancelavel: obterNumeroDeCampo(
      [base],
      ['quantidadeCancelavel', 'totalCancelavel', 'cancelaveis'],
      aulasNormalizadas.filter((item) => item.cancelavel).length,
    ),
    quantidadeJaCancelada: obterNumeroDeCampo(
      [base],
      ['quantidadeJaCancelada', 'totalJaCancelada', 'jaCanceladas'],
      aulasNormalizadas.filter((item) => item.jaCancelada).length,
    ),
    quantidadeBloqueada: obterNumeroDeCampo(
      [base],
      ['quantidadeBloqueada', 'totalBloqueada', 'bloqueadas'],
      aulasNormalizadas.filter((item) => !item.cancelavel && !item.jaCancelada).length,
    ),
    aulas: aulasNormalizadas,
  }
}

function normalizarPreviaRetomadaLote(resposta = {}) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const aulasFonte = Array.isArray(base.aulas) ? base.aulas : Array.isArray(base.itens) ? base.itens : []
  const aulasNormalizadas = aulasFonte.map((item) => normalizarAulaPreviaRetomadaLote(item)).filter(Boolean)

  return {
    escopo: String(base.escopo || '').trim().toUpperCase(),
    dataProcessada: normalizarTextoOpcional(base.dataProcessada || base.data),
    quantidadeEncontrada: obterNumeroDeCampo([base], ['quantidadeEncontrada', 'totalEncontrado', 'encontradas'], aulasNormalizadas.length),
    quantidadeReversivel: obterNumeroDeCampo(
      [base],
      ['quantidadeReversivel', 'totalReversivel', 'reversiveis'],
      aulasNormalizadas.filter((item) => item.reversivel).length,
    ),
    quantidadeJaAtiva: obterNumeroDeCampo(
      [base],
      ['quantidadeJaAtiva', 'totalJaAtiva', 'jaAtivas'],
      aulasNormalizadas.filter((item) => item.jaAtiva).length,
    ),
    quantidadeBloqueada: obterNumeroDeCampo(
      [base],
      ['quantidadeBloqueada', 'totalBloqueada', 'bloqueadas'],
      aulasNormalizadas.filter((item) => item.bloqueada).length,
    ),
    aulas: aulasNormalizadas,
  }
}

function montarPayloadCancelamentoLote(lote, { incluirMotivo = false } = {}) {
  const escopo = String(lote.escopo || 'PERIODO_DA_DATA').trim().toUpperCase()
  const data = String(lote.data || '').trim()
  const professorId = normalizarIdPositivo(lote.professorId)
  const payload = {
    escopo,
    data: data || null,
    aulaIds: [],
    turmaIds: [],
    professorId: professorId || null,
    periodo: null,
    motivo: incluirMotivo ? String(lote.motivo || '').trim() || null : null,
  }

  if (escopo === 'AULAS_ESPECIFICAS') {
    payload.aulaIds = normalizarListaIds(lote.aulaIds)
  }

  if (escopo === 'TURMAS_NA_DATA' || escopo === 'PERIODO_DA_DATA') {
    payload.turmaIds = normalizarListaIds(lote.turmaIds)
  }

  if (escopo === 'PERIODO_DA_DATA') {
    payload.periodo = String(lote.periodo || '').trim().toUpperCase() || null
  }

  return payload
}

function montarPayloadRetomadaLote(lote) {
  const escopo = String(lote.escopo || 'PERIODO_DA_DATA').trim().toUpperCase()
  const data = String(lote.data || '').trim()
  const professorId = normalizarIdPositivo(lote.professorId)
  const payload = {
    escopo,
    data: data || null,
    aulaIds: [],
    turmaIds: [],
    professorId: professorId || null,
    periodo: null,
  }

  if (escopo === 'AULAS_ESPECIFICAS') {
    payload.aulaIds = normalizarListaIds(lote.aulaIds)
  }

  if (escopo === 'TURMAS_NA_DATA' || escopo === 'PERIODO_DA_DATA') {
    payload.turmaIds = normalizarListaIds(lote.turmaIds)
  }

  if (escopo === 'PERIODO_DA_DATA') {
    payload.periodo = String(lote.periodo || '').trim().toUpperCase() || null
  }

  return payload
}

function assinaturaLote(payload) {
  return JSON.stringify({
    escopo: payload.escopo,
    data: payload.data || '',
    aulaIds: normalizarListaIds(payload.aulaIds),
    turmaIds: normalizarListaIds(payload.turmaIds),
    professorId: payload.professorId || null,
    periodo: payload.periodo || null,
  })
}

function validarReturnToAulasFrequencia(valor) {
  const texto = String(valor || '').trim()
  if (!texto || !texto.startsWith('/aulas-frequencia')) {
    return ''
  }

  try {
    const url = new URL(texto, window.location.origin)
    if (!url.pathname.startsWith('/aulas-frequencia')) {
      return ''
    }

    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return ''
  }
}

function extrairFiltrosDoReturnTo(valor) {
  const caminho = validarReturnToAulasFrequencia(valor)
  if (!caminho) {
    return null
  }

  try {
    const url = new URL(caminho, window.location.origin)
    const query = url.searchParams
    const dataPadrao = criarDataISO(0)

    return {
      returnTo: caminho,
      dataInicial: String(query.get('dataInicial') || dataPadrao).trim() || dataPadrao,
      dataFinal: String(query.get('dataFinal') || dataPadrao).trim() || dataPadrao,
      turmaId: String(query.get('turmaId') || '').trim(),
      professorId: String(query.get('professorId') || '').trim(),
      nivel: String(query.get('nivel') || '').trim().toUpperCase(),
      situacao: String(query.get('situacao') || '').trim().toUpperCase(),
    }
  } catch {
    return null
  }
}

function registrarMensagemSucessoLote(mensagem) {
  if (typeof window === 'undefined') {
    return
  }

  sessionStorage.setItem(CHAVE_FEEDBACK_RETORNO, String(mensagem || '').trim())
}

function consumirMensagemSucessoLote() {
  if (typeof window === 'undefined') {
    return ''
  }

  const mensagem = String(sessionStorage.getItem(CHAVE_FEEDBACK_RETORNO) || '').trim()
  if (mensagem) {
    sessionStorage.removeItem(CHAVE_FEEDBACK_RETORNO)
  }

  return mensagem
}

export function useAulasFrequenciaLote(tipoEntrada) {
  const route = useRoute()
  const router = useRouter()

  const tipoRota = computed(() => resolverTipoLoteDaRota(route.name))
  const tipo = computed(() => {
    const tipoResolvido = tipoRota.value || String(tipoEntrada || '').trim().toUpperCase()
    return tipoResolvido === TIPOS_LOTE.RETOMADA ? TIPOS_LOTE.RETOMADA : TIPOS_LOTE.CANCELAMENTO
  })
  const retornoQuery = computed(() => validarReturnToAulasFrequencia(valorRota(route.query.returnTo)))
  const filtrosBase = computed(() => extrairFiltrosDoReturnTo(valorRota(route.query.returnTo)))
  const retornoSeguro = computed(() => retornoQuery.value || '/aulas-frequencia')

  const carregandoInicial = ref(true)
  const erroInicial = ref('')
  const inicializacaoConcluida = ref(false)
  const carregandoBase = ref(false)
  const carregandoLista = ref(false)
  const carregandoTurmas = ref(false)
  const carregandoProfessores = ref(false)
  const baseAulas = ref([])
  const turmas = ref([])
  const professores = ref([])
  const janelaEhMobile = ref(false)
  const etapaAtual = ref(ETAPAS_LOTE.CONFIGURACAO)
  const lote = ref(criarEstadoInicial(tipo.value))
  const aulasEspecificas = ref([])
  const carregandoAulasEspecificas = ref(false)
  const aulasEspecificasCarregadas = ref(false)
  const erroAulasEspecificas = ref('')
  const sequenciaAulasEspecificas = ref(0)
  let debounceAulasEspecificas = null
  let promessaInicializacao = null
  let componenteAtivo = true
  let sequenciaInicializacao = 0
  let assinaturaInicializacaoEmAndamento = ''
  let reinicializacaoPendente = false
  const carregandoPrevia = ref(false)
  const previsaoPendente = ref(false)
  const processando = ref(false)
  const erro = ref('')
  const previa = ref(null)
  const assinaturaPrevia = ref('')
  const sequenciaPrevia = ref(0)
  let debouncePrevia = null
  const modoVisualizacaoEmpresa = ref(false)

  const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
  const moduloAtivo = computed(() => contextoEsportivo.value?.ativo === true)
  const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
  const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Aluno')
  const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Alunos')
  const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
  const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
  const escopo = computed(() => String(lote.value.escopo || 'PERIODO_DA_DATA').trim().toUpperCase())
  const dataLote = computed(() => String(lote.value.data || '').trim())
  const descricaoEscopo = computed(() => obterDescricaoEscopoLote(escopo.value))
  const tituloPrevia = computed(() =>
    obterRotuloPreviaLote({
      data: lote.value.data,
      escopo: escopo.value,
      periodo: lote.value.periodo,
      totalTurmasSelecionadas: normalizarListaIds(lote.value.turmaIds).length,
    }),
  )
  const formularioValidoParaPrevia = computed(() => !validarFormulario())
  const previewValida = computed(() => Boolean(previa.value && assinaturaPrevia.value))
  const previewAtualizada = computed(
    () =>
      previewValida.value &&
      assinaturaPrevia.value === assinaturaAtual.value &&
      !carregandoPrevia.value &&
      !previsaoPendente.value,
  )
  const previewSemResultados = computed(() => previewValida.value && normalizarNumero(previa.value?.quantidadeEncontrada, 0) === 0)
  const previewBloqueada = computed(() => normalizarNumero(previa.value?.quantidadeBloqueada, 0) > 0)
  const previewSemAlteracao = computed(() =>
    tipo.value === TIPOS_LOTE.CANCELAMENTO
      ? previewValida.value &&
        !previewSemResultados.value &&
        !previewBloqueada.value &&
        normalizarNumero(previa.value?.quantidadeCancelavel, 0) === 0 &&
        normalizarNumero(previa.value?.quantidadeJaCancelada, 0) > 0
      : previewValida.value &&
        !previewSemResultados.value &&
        !previewBloqueada.value &&
        normalizarNumero(previa.value?.quantidadeReversivel, 0) === 0 &&
        normalizarNumero(previa.value?.quantidadeJaAtiva, 0) > 0,
  )
  const mensagemBloqueioConfirmacao = computed(() => {
    if (carregandoPrevia.value || previsaoPendente.value) {
      return 'Aguarde a atualização da prévia.'
    }

    if (
      escopo.value === 'AULAS_ESPECIFICAS' &&
      aulasEspecificasCarregadas.value &&
      !carregandoAulasEspecificas.value &&
      aulasEspecificas.value.length === 0
    ) {
      return 'Nenhuma aula foi encontrada para o escopo selecionado.'
    }

    const erroFormulario = validarFormulario()
    if (erroFormulario) {
      return erroFormulario
    }

    if (tipo.value === TIPOS_LOTE.CANCELAMENTO) {
      const motivo = String(lote.value.motivo || '').trim()
      if (!motivo) {
        return 'Informe o motivo do cancelamento.'
      }
    }

    if (previewBloqueada.value) {
      return 'O lote possui aulas bloqueadas e não pode ser processado parcialmente.'
    }

    if (previewSemResultados.value) {
      return 'Nenhuma aula foi encontrada para o escopo selecionado.'
    }

    if (previewSemAlteracao.value) {
      return tipo.value === TIPOS_LOTE.CANCELAMENTO ? 'Todas as aulas encontradas já estão canceladas.' : 'Todas as aulas encontradas já estão ativas.'
    }

    if (!previewAtualizada.value) {
      return 'Aguarde a atualização da prévia.'
    }

    return ''
  })
  const mensagemPreview = computed(() => {
    if (escopo.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificas.value) {
      return 'Carregando aulas da data...'
    }

    if (escopo.value === 'AULAS_ESPECIFICAS' && aulasEspecificasCarregadas.value && aulasEspecificas.value.length === 0) {
      return 'Nenhuma aula foi encontrada para a data selecionada.'
    }

    if (carregandoPrevia.value || previsaoPendente.value) {
      return 'Atualizando prévia...'
    }

    const erroFormulario = validarFormulario()
    if (erroFormulario) {
      return erroFormulario
    }

    if (!previewValida.value) {
      return 'A prévia será atualizada automaticamente quando os dados estiverem completos.'
    }

    if (previewSemResultados.value) {
      return 'Nenhuma aula foi encontrada para o escopo selecionado.'
    }

    if (previewBloqueada.value) {
      return tipo.value === TIPOS_LOTE.CANCELAMENTO
        ? 'O backend não permitirá cancelamento parcial neste cenário. Ajuste o escopo ou a seleção e consulte uma nova prévia.'
        : 'O backend não permite processamento parcial neste cenário. Ajuste o escopo ou a seleção e consulte uma nova prévia.'
    }

    if (previewSemAlteracao.value) {
      return tipo.value === TIPOS_LOTE.CANCELAMENTO
        ? 'Todas as aulas encontradas já estão canceladas. Nenhuma nova alteração será executada.'
        : 'Todas as aulas encontradas já estão ativas. Nenhuma nova alteração será executada.'
    }

    return tipo.value === TIPOS_LOTE.CANCELAMENTO
      ? 'A prévia está pronta. Confira os itens e informe o motivo para confirmar o cancelamento em lote.'
      : 'A prévia está pronta. Confira os itens antes de confirmar a retomada em lote.'
  })
  const podeConfirmar = computed(() => !mensagemBloqueioConfirmacao.value)
  const podeAtualizarPrevia = computed(() => !carregandoPrevia.value && !processando.value && formularioValidoParaPrevia.value)
  const assinaturaAtual = computed(() =>
    assinaturaLote(
      tipo.value === TIPOS_LOTE.CANCELAMENTO ? montarPayloadCancelamentoLote(lote.value) : montarPayloadRetomadaLote(lote.value),
    ),
  )
  const assinaturaBuscaAulasEspecificas = computed(() =>
    escopo.value === 'AULAS_ESPECIFICAS'
      ? JSON.stringify({
          data: String(lote.value.data || '').trim(),
          professorId: normalizarIdPositivo(lote.value.professorId),
        })
      : '',
  )
  const assinaturaSelecaoAulasEspecificas = computed(() =>
    escopo.value === 'AULAS_ESPECIFICAS' ? JSON.stringify(normalizarListaIds(lote.value.aulaIds)) : '',
  )
  const assinaturaGatilhoPrevia = computed(() =>
    escopo.value === 'AULAS_ESPECIFICAS' ? assinaturaSelecaoAulasEspecificas.value : assinaturaAtual.value,
  )
  const aulasSelecionaveis = computed(() =>
    escopo.value === 'AULAS_ESPECIFICAS' ? [...aulasEspecificas.value] : [...baseAulas.value],
  )
  const turmasSelecionaveis = computed(() => [...turmas.value].sort(compararPorNomeComAtivo))
  const professoresSelecionaveis = computed(() => [...professores.value].sort(compararPorNomeComAtivo))
  const textoTitulo = computed(() => (tipo.value === TIPOS_LOTE.CANCELAMENTO ? 'Cancelar aulas em lote' : 'Retomar aulas em lote'))
  const textoIdentificacao = computed(() => (tipo.value === TIPOS_LOTE.CANCELAMENTO ? 'Cancelamento em lote' : 'Retomada em lote'))
  const textoDescricao = computed(() =>
    tipo.value === TIPOS_LOTE.CANCELAMENTO
      ? 'Consulte a prévia antes de confirmar e informe o motivo do cancelamento.'
      : 'Consulte a prévia antes de confirmar a retomada das aulas canceladas.',
  )
  const textoBotaoConfirmar = computed(() =>
    tipo.value === TIPOS_LOTE.CANCELAMENTO ? 'Confirmar cancelamento em lote' : 'Confirmar retomada em lote',
  )
  const textoBotaoAtualizar = computed(() => (carregandoPrevia.value ? 'Atualizando...' : 'Atualizar prévia'))
  const textoBotaoPrincipalEtapa = computed(() => 'Ver prévia')
  const textoBotaoRetornoEtapa = computed(() => 'Voltar à configuração')

  function compararPorNomeComAtivo(a, b) {
    const ativoA = a?.ativo === false ? 1 : 0
    const ativoB = b?.ativo === false ? 1 : 0

    if (ativoA !== ativoB) {
      return ativoA - ativoB
    }

    return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR')
  }

  function carregarJanelaMobile() {
    if (typeof window === 'undefined') {
      return
    }

    janelaEhMobile.value = window.innerWidth <= 768
  }

  function formatarErro(error, fallback) {
    const candidatos = [
      error?.response?.data?.message,
      error?.response?.data?.mensagem,
      error?.message,
    ]

    for (const candidato of candidatos) {
      const mensagem = String(candidato || '').trim()
      if (mensagem) {
        return mensagem
      }
    }

    return fallback
  }

  function limparTimers() {
    if (debounceAulasEspecificas) {
      clearTimeout(debounceAulasEspecificas)
      debounceAulasEspecificas = null
    }

    if (debouncePrevia) {
      clearTimeout(debouncePrevia)
      debouncePrevia = null
    }
  }

  function redefinirEstadoInicial() {
    limparTimers()
    sequenciaAulasEspecificas.value += 1
    sequenciaPrevia.value += 1
    baseAulas.value = []
    turmas.value = []
    professores.value = []
    aulasEspecificas.value = []
    aulasEspecificasCarregadas.value = false
    carregandoAulasEspecificas.value = false
    erroAulasEspecificas.value = ''
    previa.value = null
    assinaturaPrevia.value = ''
    previsaoPendente.value = false
    carregandoPrevia.value = false
    erro.value = ''
    carregandoBase.value = false
    carregandoLista.value = false
    carregandoTurmas.value = false
    carregandoProfessores.value = false
    etapaAtual.value = ETAPAS_LOTE.CONFIGURACAO
    lote.value = criarEstadoInicial(tipo.value, {
      data: filtrosBase.value?.dataInicial || criarDataISO(0),
      professorId: filtrosBase.value?.professorId || '',
    })
  }

  function limparAulasEspecificas() {
    limparTimers()
    sequenciaAulasEspecificas.value += 1
    aulasEspecificas.value = []
    aulasEspecificasCarregadas.value = false
    carregandoAulasEspecificas.value = false
    erroAulasEspecificas.value = ''
  }

  function limparPrevia(mensagem = '') {
    limparTimers()
    previa.value = null
    assinaturaPrevia.value = ''
    previsaoPendente.value = false
    carregandoPrevia.value = false
    erro.value = String(mensagem || '').trim()
  }

  function redefinirEstadoPrevia() {
    limparPrevia()
    sequenciaPrevia.value += 1
  }

  function voltarAConfiguracao() {
    etapaAtual.value = ETAPAS_LOTE.CONFIGURACAO
  }

  function abrirPrevia() {
    if (!previewAtualizada.value) {
      return
    }

    etapaAtual.value = ETAPAS_LOTE.PREVIA
  }

  function selecionarTodasAulas() {
    lote.value.aulaIds = aulasSelecionaveis.value.map((aula) => aula.id)
  }

  function limparSelecaoAulas() {
    lote.value.aulaIds = []
  }

  function alternarEscopo(novoEscopo) {
    lote.value.escopo = String(novoEscopo || '').trim().toUpperCase()
    redefinirEstadoPrevia()
  }

  function validarFormulario() {
    const escopoAtual = escopo.value
    const data = String(lote.value.data || '').trim()

    if (!['AULAS_ESPECIFICAS', 'TURMAS_NA_DATA', 'TODAS_DA_DATA', 'PERIODO_DA_DATA'].includes(escopoAtual)) {
      return 'Selecione um escopo válido.'
    }

    if (!data) {
      return tipo.value === TIPOS_LOTE.CANCELAMENTO ? 'Informe a data do cancelamento.' : 'Informe a data da retomada.'
    }

    if (escopoAtual === 'AULAS_ESPECIFICAS' && normalizarListaIds(lote.value.aulaIds).length === 0) {
      return 'Selecione ao menos uma aula.'
    }

    if (escopoAtual === 'TURMAS_NA_DATA' && normalizarListaIds(lote.value.turmaIds).length === 0) {
      return tipo.value === TIPOS_LOTE.CANCELAMENTO
        ? 'Selecione pelo menos uma turma para cancelar.'
        : 'Selecione pelo menos uma turma para retomar.'
    }

    if (escopoAtual === 'PERIODO_DA_DATA' && !String(lote.value.periodo || '').trim()) {
      return 'Selecione o período do dia.'
    }

    return ''
  }

  function carregarBasesObrigatorias() {
    return Promise.all([buscarTurmasBeachTennis(), buscarFuncionarios()])
  }

  function montarFiltroConsultaAulasEspecificas() {
    const filtros = {
      dataInicial: dataLote.value,
      dataFinal: dataLote.value,
    }

    const professorId = normalizarIdPositivo(lote.value.professorId)
    if (professorId) {
      filtros.professorId = professorId
    }

    return filtros
  }

  function normalizarConsultaBaseAulas(resposta) {
    return (Array.isArray(resposta) ? resposta : []).map((item) => normalizarAulaLista(item)).filter(Boolean)
  }

  function agendarConsultaAulasEspecificas({ forcar = false } = {}) {
    if (!inicializacaoConcluida.value || processando.value || escopo.value !== 'AULAS_ESPECIFICAS') {
      return
    }

    if (!dataLote.value) {
      limparAulasEspecificas()
      return
    }

    if (debounceAulasEspecificas) {
      clearTimeout(debounceAulasEspecificas)
      debounceAulasEspecificas = null
    }

    const sequenciaAtual = ++sequenciaAulasEspecificas.value
    aulasEspecificasCarregadas.value = false
    carregandoAulasEspecificas.value = true
    erroAulasEspecificas.value = ''
    aulasEspecificas.value = []

    const executar = () => void consultarAulasEspecificas(sequenciaAtual)

    if (forcar) {
      executar()
      return
    }

    debounceAulasEspecificas = setTimeout(() => {
      debounceAulasEspecificas = null
      executar()
    }, 420)
  }

  async function consultarAulasEspecificas(sequenciaSolicitada) {
    if (
      !inicializacaoConcluida.value ||
      processando.value ||
      sequenciaSolicitada !== sequenciaAulasEspecificas.value ||
      escopo.value !== 'AULAS_ESPECIFICAS'
    ) {
      return
    }

    try {
      const resposta = await buscarAulasGestaoEsportiva(montarFiltroConsultaAulasEspecificas())
      if (sequenciaSolicitada !== sequenciaAulasEspecificas.value || escopo.value !== 'AULAS_ESPECIFICAS') {
        return
      }

      aulasEspecificas.value = normalizarConsultaBaseAulas(resposta)
      aulasEspecificasCarregadas.value = true
    } catch (error) {
      if (sequenciaSolicitada !== sequenciaAulasEspecificas.value || escopo.value !== 'AULAS_ESPECIFICAS') {
        return
      }

      aulasEspecificas.value = []
      aulasEspecificasCarregadas.value = false
      erroAulasEspecificas.value = formatarErro(error, 'Não foi possível carregar as aulas da data.')
    } finally {
      if (sequenciaSolicitada === sequenciaAulasEspecificas.value) {
        carregandoAulasEspecificas.value = false
      }
    }
  }

  function agendarConsultaPrevia({ forcar = false } = {}) {
    if (
      !inicializacaoConcluida.value ||
      processando.value ||
      (escopo.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificas.value)
    ) {
      return
    }

    if (debouncePrevia) {
      clearTimeout(debouncePrevia)
      debouncePrevia = null
    }

    sequenciaPrevia.value += 1
    previsaoPendente.value = true
    carregandoPrevia.value = false
    erro.value = ''
    previa.value = null
    assinaturaPrevia.value = ''

    const executar = () => void consultarPrevia(forcar)

    if (forcar) {
      executar()
      return
    }

    debouncePrevia = setTimeout(() => {
      debouncePrevia = null
      executar()
    }, 420)
  }

  async function consultarPrevia(forcar = false) {
    if (
      !inicializacaoConcluida.value ||
      processando.value ||
      (escopo.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificas.value)
    ) {
      return
    }

    const erroFormulario = validarFormulario()
    if (erroFormulario) {
      previsaoPendente.value = false
      if (forcar || erro.value !== erroFormulario) {
        erro.value = erroFormulario
      }
      return
    }

    const payload = tipo.value === TIPOS_LOTE.CANCELAMENTO ? montarPayloadCancelamentoLote(lote.value) : montarPayloadRetomadaLote(lote.value)
    const assinaturaSolicitada = assinaturaLote(payload)
    const sequenciaAtual = ++sequenciaPrevia.value
    assinaturaPrevia.value = assinaturaSolicitada
    carregandoPrevia.value = true
    erro.value = ''

    try {
      const resposta =
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? await buscarPreviaCancelamentoAulasGestaoEsportiva(payload)
          : await buscarPreviaReversaoAulasGestaoEsportiva(payload)

      if (sequenciaAtual !== sequenciaPrevia.value) {
        return
      }

      previa.value = tipo.value === TIPOS_LOTE.CANCELAMENTO ? normalizarPreviaCancelamentoLote(resposta || {}) : normalizarPreviaRetomadaLote(resposta || {})
    } catch (error) {
      if (sequenciaAtual !== sequenciaPrevia.value) {
        return
      }

      previa.value = null
      assinaturaPrevia.value = ''
      erro.value = formatarErro(
        error,
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? 'Não foi possível consultar a prévia do cancelamento.'
          : 'Não foi possível consultar a prévia da retomada.',
      )
    } finally {
      if (sequenciaAtual === sequenciaPrevia.value) {
        carregandoPrevia.value = false
        previsaoPendente.value = false
      }
    }
  }

  function abrirTelaRetorno() {
    router.replace(retornoSeguro.value)
  }

  function fechar() {
    abrirTelaRetorno()
  }

  async function confirmar() {
    if (processando.value) {
      return
    }

    const bloqueio = mensagemBloqueioConfirmacao.value
    if (bloqueio) {
      erro.value = bloqueio
      return
    }

    const payload = tipo.value === TIPOS_LOTE.CANCELAMENTO ? montarPayloadCancelamentoLote(lote.value, { incluirMotivo: true }) : montarPayloadRetomadaLote(lote.value)
    const assinaturaSolicitada = assinaturaLote(payload)
    if (assinaturaSolicitada !== assinaturaPrevia.value) {
      erro.value = 'As seleções foram alteradas. Consulte uma nova prévia antes de confirmar.'
      previa.value = null
      assinaturaPrevia.value = ''
      return
    }

    const quantidadeBase =
      tipo.value === TIPOS_LOTE.CANCELAMENTO
        ? normalizarNumero(previa.value?.quantidadeCancelavel, 0)
        : normalizarNumero(previa.value?.quantidadeReversivel, 0)

    try {
      processando.value = true
      erro.value = ''
      const resposta =
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? await cancelarAulasGestaoEsportivaEmLote(payload)
          : await reverterAulasGestaoEsportivaEmLote(payload)
      const resultado = resposta && typeof resposta === 'object' ? resposta : {}

      const quantidadeFinal =
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? obterNumeroDeCampo([resultado], ['quantidadeCancelada', 'totalCancelada', 'canceladas'], quantidadeBase)
          : obterNumeroDeCampo(
              [resultado],
              ['quantidadeRevertida', 'quantidadeRetomada', 'totalRevertida', 'totalRetomada', 'revertidas', 'retomadas'],
              quantidadeBase,
            )

      const quantidadeJa =
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? obterNumeroDeCampo([resultado], ['quantidadeJaCancelada', 'totalJaCancelada', 'jaCanceladas'], normalizarNumero(previa.value?.quantidadeJaCancelada, 0))
          : obterNumeroDeCampo([resultado], ['quantidadeJaAtiva', 'totalJaAtiva', 'jaAtivas'], normalizarNumero(previa.value?.quantidadeJaAtiva, 0))

      const mensagemSucesso = [
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? formatarMensagemQuantidade(quantidadeFinal, 'aula cancelada com sucesso.', 'aulas canceladas com sucesso.')
          : formatarMensagemQuantidade(quantidadeFinal, 'aula retomada com sucesso.', 'aulas retomadas com sucesso.'),
        quantidadeJa > 0
          ? tipo.value === TIPOS_LOTE.CANCELAMENTO
            ? formatarMensagemQuantidade(quantidadeJa, 'já estava cancelada.', 'já estavam canceladas.')
            : formatarMensagemQuantidade(quantidadeJa, 'já estava ativa.', 'já estavam ativas.')
          : '',
      ]
        .filter(Boolean)
        .join(' ')

      registrarMensagemSucessoLote(mensagemSucesso)
      abrirTelaRetorno()
    } catch (error) {
      erro.value = formatarErro(
        error,
        tipo.value === TIPOS_LOTE.CANCELAMENTO
          ? 'Não foi possível concluir o cancelamento em lote.'
          : 'Não foi possível concluir a retomada em lote.',
      )
    } finally {
      processando.value = false
    }
  }

  async function inicializarPagina() {
    const assinaturaSolicitada = JSON.stringify({
      rota: valorRota(route.name),
      returnTo: valorRota(route.query.returnTo),
    })

    if (promessaInicializacao) {
      if (assinaturaSolicitada !== assinaturaInicializacaoEmAndamento) {
        reinicializacaoPendente = true
        sequenciaInicializacao += 1
      }

      return promessaInicializacao
    }

    const sequenciaAtual = ++sequenciaInicializacao
    assinaturaInicializacaoEmAndamento = assinaturaSolicitada
    reinicializacaoPendente = false
    let acaoPosInicializacao = null

    promessaInicializacao = (async () => {
      carregandoInicial.value = true
      erroInicial.value = ''
      inicializacaoConcluida.value = false
      redefinirEstadoInicial()

      try {
        if (!tipoRota.value) {
          throw new Error('Rota de fluxo em lote inválida.')
        }

        await carregarContextoGestaoEsportiva()

        if (!componenteAtivo || sequenciaAtual !== sequenciaInicializacao) {
          return false
        }

        modoVisualizacaoEmpresa.value = false

        if (contextoEsportivo.value?.ativo !== true) {
          throw new Error('O módulo de Gestão Esportiva não está disponível.')
        }

        carregandoTurmas.value = true
        carregandoProfessores.value = true

        const [turmasResposta, professoresResposta] = await carregarBasesObrigatorias()

        if (!componenteAtivo || sequenciaAtual !== sequenciaInicializacao) {
          return false
        }

        turmas.value = (Array.isArray(turmasResposta) ? turmasResposta : []).map((item) => normalizarTurmaOpcao(item)).filter(Boolean)
        professores.value = (Array.isArray(professoresResposta) ? professoresResposta : []).map((item) => normalizarProfessorOpcao(item)).filter(Boolean)

        inicializacaoConcluida.value = true

        if (escopo.value === 'AULAS_ESPECIFICAS') {
          acaoPosInicializacao = () => agendarConsultaAulasEspecificas({ forcar: true })
        } else if (!validarFormulario()) {
          acaoPosInicializacao = () => agendarConsultaPrevia({ forcar: true })
        }

        return true
      } catch (error) {
        if (componenteAtivo && sequenciaAtual === sequenciaInicializacao) {
          console.error('Falha ao inicializar a página de aulas em lote', error)
          erroInicial.value = formatarErro(error, 'Não foi possível carregar os dados necessários. Tente novamente.')
        }

        return false
      } finally {
        if (componenteAtivo && sequenciaAtual === sequenciaInicializacao) {
          carregandoInicial.value = false
        }

        carregandoBase.value = false
        carregandoLista.value = false
        carregandoTurmas.value = false
        carregandoProfessores.value = false
        promessaInicializacao = null
        assinaturaInicializacaoEmAndamento = ''
      }
    })()

    promessaInicializacao.finally(() => {
      if (
        componenteAtivo &&
        sequenciaAtual === sequenciaInicializacao &&
        typeof acaoPosInicializacao === 'function'
      ) {
        acaoPosInicializacao()
      }

      if (reinicializacaoPendente && componenteAtivo) {
        reinicializacaoPendente = false
        void inicializarPagina()
      }
    })

    return promessaInicializacao
  }

  async function carregarDadosBase() {
    return inicializarPagina()
  }

  function aplicarMensagensDeRetorno() {
    return consumirMensagemSucessoLote()
  }

  watch(assinaturaBuscaAulasEspecificas, (novaAssinatura, assinaturaAnterior) => {
    if (!inicializacaoConcluida.value) {
      return
    }

    if (escopo.value !== 'AULAS_ESPECIFICAS') {
      limparAulasEspecificas()
      return
    }

    if (!novaAssinatura) {
      limparAulasEspecificas()
      lote.value.aulaIds = []
      redefinirEstadoPrevia()
      return
    }

    if (novaAssinatura === assinaturaAnterior) {
      return
    }

    lote.value.aulaIds = []
    redefinirEstadoPrevia()
    agendarConsultaAulasEspecificas()
  })

  watch(assinaturaGatilhoPrevia, (novaAssinatura, assinaturaAnterior) => {
    if (!inicializacaoConcluida.value) {
      return
    }

    if (escopo.value === 'AULAS_ESPECIFICAS') {
      const temSelecao = normalizarListaIds(lote.value.aulaIds).length > 0
      if (!temSelecao) {
        limparPrevia()
        return
      }

      if (carregandoAulasEspecificas.value) {
        return
      }

      if (novaAssinatura !== assinaturaPrevia.value || !previa.value) {
        agendarConsultaPrevia()
      }

      return
    }

    if (novaAssinatura !== assinaturaAnterior || !previa.value) {
      agendarConsultaPrevia()
    }
  })

  watch(escopo, (novoEscopo) => {
    if (!inicializacaoConcluida.value) {
      return
    }

    if (novoEscopo !== 'AULAS_ESPECIFICAS') {
      limparAulasEspecificas()
    } else {
      agendarConsultaAulasEspecificas()
    }

    redefinirEstadoPrevia()
  })

  watch(
    () => lote.value.data,
    () => {
      if (!inicializacaoConcluida.value) {
        return
      }

      if (escopo.value === 'AULAS_ESPECIFICAS') {
        agendarConsultaAulasEspecificas()
      } else {
        redefinirEstadoPrevia()
      }
    },
  )

  watch(
    () => lote.value.professorId,
    () => {
      if (!inicializacaoConcluida.value) {
        return
      }

      if (escopo.value === 'AULAS_ESPECIFICAS') {
        agendarConsultaAulasEspecificas()
      } else {
        redefinirEstadoPrevia()
      }
    },
  )

  watch(janelaEhMobile, (ehMobile) => {
    if (!ehMobile) {
      return
    }

    if (!previewAtualizada.value) {
      voltarAConfiguracao()
    }
  })

  watch(
    () => [route.name, route.query.returnTo],
    () => {
      if (!componenteAtivo) {
        return
      }

      void inicializarPagina()
    },
  )

  onMounted(() => {
    carregarJanelaMobile()
    window.addEventListener('resize', carregarJanelaMobile)
  })

  onBeforeUnmount(() => {
    componenteAtivo = false
    window.removeEventListener('resize', carregarJanelaMobile)
    limparTimers()
    sequenciaAulasEspecificas.value += 1
    sequenciaPrevia.value += 1
    sequenciaInicializacao += 1
    promessaInicializacao = null
  })

  return {
    ETAPAS_LOTE,
    TIPOS_LOTE,
    OPCOES_ESCOPO,
    OPCOES_PERIODO,
    tipo,
    tipoRotaValido: computed(() => Boolean(tipoRota.value)),
    retornoSeguro,
    retornoQuery,
    filtrosBase,
    carregandoInicial,
    erroInicial,
    inicializacaoConcluida,
    carregandoBase,
    carregandoLista,
    carregandoTurmas,
    carregandoProfessores,
    contextoEsportivo,
    moduloAtivo,
    nomeModalidade,
    termoParticipanteSingular,
    termoParticipantePlural,
    termoGrupoSingular,
    termoGrupoPlural,
    lote,
    baseAulas,
    turmas,
    professores,
    escopo,
    descricaoEscopo,
    tituloPrevia,
    formularioValidoParaPrevia,
    previewValida,
    previewAtualizada,
    previewSemResultados,
    previewBloqueada,
    previewSemAlteracao,
    mensagemBloqueioConfirmacao,
    mensagemPreview,
    podeConfirmar,
    podeAtualizarPrevia,
    carregandoPrevia,
    previsaoPendente,
    processando,
    erro,
    previa,
    assinaturaPrevia,
    aulaIdsSelecionadas: computed(() => normalizarListaIds(lote.value.aulaIds)),
    turmaIdsSelecionadas: computed(() => normalizarListaIds(lote.value.turmaIds)),
    aulasSelecionaveis,
    turmasSelecionaveis,
    professoresSelecionaveis,
    aulasEspecificas,
    carregandoAulasEspecificas,
    aulasEspecificasCarregadas,
    erroAulasEspecificas,
    janelaEhMobile,
    etapaAtual,
    textoTitulo,
    textoIdentificacao,
    textoDescricao,
    textoBotaoConfirmar,
    textoBotaoAtualizar,
    textoBotaoPrincipalEtapa,
    textoBotaoRetornoEtapa,
    abrirPrevia,
    voltarAConfiguracao,
    selecionarTodasAulas,
    limparSelecaoAulas,
    alternarEscopo,
    agendarConsultaPrevia,
    confirmar,
    fechar,
    inicializarPagina,
    carregarDadosBase,
    aplicarMensagensDeRetorno,
    validarFormulario,
    montarPayloadCancelamentoLote: () => montarPayloadCancelamentoLote(lote.value),
    montarPayloadRetomadaLote: () => montarPayloadRetomadaLote(lote.value),
    formatarPeriodoLote,
    obterRotuloPreviaLote,
  }
}

export {
  CHAVE_FEEDBACK_RETORNO,
  ETAPAS_LOTE,
  OPCOES_ESCOPO,
  OPCOES_PERIODO,
  TIPOS_LOTE,
  consumirMensagemSucessoLote,
  extrairFiltrosDoReturnTo,
  obterDescricaoEscopoLote,
  obterRotuloPreviaLote,
  validarReturnToAulasFrequencia,
  registrarMensagemSucessoLote,
}
