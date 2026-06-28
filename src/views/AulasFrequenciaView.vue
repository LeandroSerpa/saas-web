<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAulaGestaoEsportiva,
  buscarAulasGestaoEsportiva,
  buscarFuncionarios,
  buscarPreviaCancelamentoAulasGestaoEsportiva,
  buscarPreviaReversaoAulasGestaoEsportiva,
  cancelarAulasGestaoEsportivaEmLote,
  buscarTurmasBeachTennis,
  gerarAulasGestaoEsportiva,
  modoVisualizacaoEmpresaAtivo,
  salvarFrequenciasAulaGestaoEsportiva,
  reverterAulasGestaoEsportivaEmLote,
} from '@/services/api'
import { formatarDataBrasileira, rotuloCompeticaoBeachTennis, rotuloNivelBeachTennis } from '@/utils/beachTennis'
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'
import { formatarMensagemQuantidade } from '@/utils/aulasFrequencia'

const route = useRoute()
const router = useRouter()

const OPCOES_SITUACAO_AULA = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'AGENDADA', rotulo: 'Agendada' },
  { valor: 'REALIZADA', rotulo: 'Realizada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
  { valor: 'NAO_REALIZADA', rotulo: 'Não realizada' },
]

const OPCOES_SITUACAO_FREQUENCIA = [
  { valor: 'NAO_LANCADO', rotulo: 'Não lançado' },
  { valor: 'PRESENTE', rotulo: 'Presente' },
  { valor: 'FALTA_JUSTIFICADA', rotulo: 'Falta justificada' },
  { valor: 'FALTA_SEM_JUSTIFICATIVA', rotulo: 'Falta sem justificativa' },
  { valor: 'REPOSICAO_REALIZADA', rotulo: 'Reposição realizada' },
]

const STATUS_FREQUENCIA_PERSISTIVEIS = new Set(
  OPCOES_SITUACAO_FREQUENCIA.map((opcao) => opcao.valor).filter((valor) => valor !== 'NAO_LANCADO'),
)

const OPCOES_ITENS_POR_PAGINA = Object.freeze([1, 2, 3, 5, 7, 10, 20])
const OPCOES_ESCOPO_CANCELAMENTO_LOTE = Object.freeze([
  { valor: 'AULAS_ESPECIFICAS', rotulo: 'Aulas específicas' },
  { valor: 'TURMAS_NA_DATA', rotulo: 'Turmas em uma data' },
  { valor: 'TODAS_DA_DATA', rotulo: 'Todas as aulas da data' },
  { valor: 'PERIODO_DA_DATA', rotulo: 'Período do dia' },
])
const OPCOES_PERIODO_CANCELAMENTO_LOTE = Object.freeze([
  { valor: 'MANHA', rotulo: 'Manhã' },
  { valor: 'TARDE', rotulo: 'Tarde' },
  { valor: 'NOITE', rotulo: 'Noite' },
])

const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Aluno')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Alunos')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')

const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const carregandoLista = ref(true)
const carregandoDetalhe = ref(false)
const carregandoBases = ref(false)
const gerandoAulas = ref(false)
const salvandoFrequencias = ref(false)
const erroLista = ref('')
const erroDetalhe = ref('')
const feedback = ref('')
const tipoFeedback = ref('info')
const resultadoGeracao = ref(null)
const aulas = ref([])
const aulaDetalhe = ref(null)
const participantesEdicao = ref([])
const turmas = ref([])
const professores = ref([])
const filtros = ref(criarFiltrosPadrao())
const geracao = ref(criarGeracaoPadrao())
const sequenciaLista = ref(0)
const sequenciaDetalhe = ref(0)
const modalCancelamentoLoteAberto = ref(false)
const aulasEspecificasCancelamentoLote = ref([])
const carregandoAulasEspecificasCancelamentoLote = ref(false)
const aulasEspecificasCancelamentoLoteCarregadas = ref(false)
const erroAulasEspecificasCancelamentoLote = ref('')
const sequenciaAulasEspecificasCancelamentoLote = ref(0)
let debounceAulasEspecificasCancelamentoLote = null
const carregandoPreviaCancelamentoLote = ref(false)
const previsaoCancelamentoLotePendente = ref(false)
const processandoCancelamentoLote = ref(false)
const erroCancelamentoLote = ref('')
const previaCancelamentoLote = ref(null)
const assinaturaPreviaCancelamentoLote = ref('')
const sequenciaPreviaCancelamentoLote = ref(0)
let debouncePreviaCancelamentoLote = null
const cancelamentoLote = ref(criarCancelamentoLotePadrao())
const modalRetomadaLoteAberto = ref(false)
const aulasEspecificasRetomadaLote = ref([])
const carregandoAulasEspecificasRetomadaLote = ref(false)
const aulasEspecificasRetomadaLoteCarregadas = ref(false)
const erroAulasEspecificasRetomadaLote = ref('')
const sequenciaAulasEspecificasRetomadaLote = ref(0)
let debounceAulasEspecificasRetomadaLote = null
const carregandoPreviaRetomadaLote = ref(false)
const previsaoRetomadaLotePendente = ref(false)
const processandoRetomadaLote = ref(false)
const erroRetomadaLote = ref('')
const previaRetomadaLote = ref(null)
const assinaturaPreviaRetomadaLote = ref('')
const sequenciaPreviaRetomadaLote = ref(0)
let debouncePreviaRetomadaLote = null
const retomadaLote = ref(criarRetomadaLotePadrao())

const aulaSelecionadaId = computed(() => normalizarIdPositivo(valorRota(route.query.aulaId)))
const aulasOrdenadas = computed(() => [...aulas.value])
const turmasOrdenadas = computed(() => [...turmas.value].sort(compararPorNomeComAtivo))
const professoresOrdenados = computed(() => [...professores.value].sort(compararPorNomeComAtivo))
const podeGerarAulas = computed(() => !gerandoAulas.value && !salvandoFrequencias.value && !modoVisualizacaoEmpresa.value && moduloAtivo.value)
const temAulas = computed(() => aulasOrdenadas.value.length > 0)
const itensPorPagina = ref(5)
const paginaAtual = ref(1)
const totalAulas = computed(() => aulasOrdenadas.value.length)
const totalPaginas = computed(() => Math.max(1, Math.ceil(totalAulas.value / itensPorPagina.value)))
const paginaAtualExibida = computed(() => Math.min(Math.max(1, paginaAtual.value), totalPaginas.value))
const indiceInicioPagina = computed(() => (totalAulas.value === 0 ? 0 : (paginaAtualExibida.value - 1) * itensPorPagina.value + 1))
const indiceFimPagina = computed(() =>
  totalAulas.value === 0 ? 0 : Math.min(totalAulas.value, indiceInicioPagina.value + itensPorPagina.value - 1),
)
const aulasPaginadas = computed(() =>
  aulasOrdenadas.value.slice(indiceInicioPagina.value > 0 ? indiceInicioPagina.value - 1 : 0, indiceFimPagina.value),
)
const turmasSelecionaveisCancelamentoLote = computed(() => [...turmasOrdenadas.value])
const professoresSelecionaveisCancelamentoLote = computed(() => [...professoresOrdenados.value])
const escopoCancelamentoLote = computed(() => String(cancelamentoLote.value.escopo || 'PERIODO_DA_DATA').trim())
const formularioCancelamentoLoteValidoParaPrevia = computed(() => !validarFormularioCancelamentoLote())
const previewCancelamentoLoteValida = computed(() => Boolean(previaCancelamentoLote.value && assinaturaPreviaCancelamentoLote.value))
const previewCancelamentoLoteAtualizada = computed(
  () =>
    previewCancelamentoLoteValida.value &&
    assinaturaPreviaCancelamentoLote.value === assinaturaAtualCancelamentoLote.value &&
    !carregandoPreviaCancelamentoLote.value &&
    !previsaoCancelamentoLotePendente.value,
)
const previewCancelamentoLoteSemResultados = computed(
  () => previewCancelamentoLoteValida.value && normalizarNumero(previaCancelamentoLote.value?.quantidadeEncontrada, 0) === 0,
)
const previewCancelamentoLoteBloqueado = computed(() => {
  const resumo = previaCancelamentoLote.value
  if (!resumo) {
    return false
  }

  return normalizarNumero(resumo.quantidadeBloqueada, 0) > 0
})
const previewCancelamentoLoteSemAlteracao = computed(
  () =>
    previewCancelamentoLoteValida.value &&
    !previewCancelamentoLoteSemResultados.value &&
    !previewCancelamentoLoteBloqueado.value &&
    normalizarNumero(previaCancelamentoLote.value?.quantidadeCancelavel, 0) === 0 &&
    normalizarNumero(previaCancelamentoLote.value?.quantidadeJaCancelada, 0) > 0,
)
const mensagemBloqueioConfirmacaoCancelamentoLote = computed(() => {
  if (!modalCancelamentoLoteAberto.value) {
    return ''
  }

  if (carregandoPreviaCancelamentoLote.value || previsaoCancelamentoLotePendente.value) {
    return 'Aguarde a atualizaÃ§Ã£o da prÃ©via.'
  }

  if (
    escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS' &&
    aulasEspecificasCancelamentoLoteCarregadas.value &&
    !carregandoAulasEspecificasCancelamentoLote.value &&
    aulasEspecificasCancelamentoLote.value.length === 0
  ) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  const erroFormulario = validarFormularioCancelamentoLote()
  if (erroFormulario) {
    return erroFormulario
  }

  const motivo = String(cancelamentoLote.value.motivo || '').trim()
  if (!motivo) {
    return 'Informe o motivo do cancelamento.'
  }

  if (previewCancelamentoLoteBloqueado.value) {
    return 'O lote possui aulas bloqueadas e nÃ£o pode ser processado parcialmente.'
  }

  if (previewCancelamentoLoteSemResultados.value) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  if (previewCancelamentoLoteSemAlteracao.value) {
    return 'Todas as aulas encontradas jÃ¡ estÃ£o canceladas.'
  }

  if (!previewCancelamentoLoteAtualizada.value) {
    return 'Aguarde a atualizaÃ§Ã£o da prÃ©via.'
  }

  return ''
})
const mensagemPreviewCancelamentoLote = computed(() => {
  if (escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasCancelamentoLote.value) {
    return 'Carregando aulas da data...'
  }

  if (
    escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS' &&
    aulasEspecificasCancelamentoLoteCarregadas.value &&
    aulasEspecificasCancelamentoLote.value.length === 0
  ) {
    return 'Nenhuma aula foi encontrada para a data selecionada.'
  }

  if (carregandoPreviaCancelamentoLote.value || previsaoCancelamentoLotePendente.value) {
    return 'Atualizando prévia...'
  }

  const erroFormulario = validarFormularioCancelamentoLote()
  if (erroFormulario) {
    return erroFormulario
  }

  if (!previewCancelamentoLoteValida.value) {
    return 'A prévia será atualizada automaticamente quando os dados estiverem completos.'
  }

  if (previewCancelamentoLoteSemResultados.value) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  if (previewCancelamentoLoteBloqueado.value) {
    return 'O backend não permitirá cancelamento parcial neste cenário. Ajuste o escopo ou a seleção e consulte uma nova prévia.'
  }

  if (previewCancelamentoLoteSemAlteracao.value) {
    return 'Todas as aulas encontradas já estão canceladas. Nenhuma nova alteração será executada.'
  }

  return 'A prévia está pronta. Confira os itens e informe o motivo para confirmar o cancelamento em lote.'
})
const podeConfirmarCancelamentoLote = computed(() => {
  return !mensagemBloqueioConfirmacaoCancelamentoLote.value
})
const podeAtualizarPreviaCancelamentoLote = computed(
  () =>
    modalCancelamentoLoteAberto.value &&
    formularioCancelamentoLoteValidoParaPrevia.value &&
    !carregandoPreviaCancelamentoLote.value &&
    !processandoCancelamentoLote.value,
)
const assinaturaAtualCancelamentoLote = computed(() => assinaturaCancelamentoLote(montarPayloadCancelamentoLote()))
const escopoRetomadaLote = computed(() => String(retomadaLote.value.escopo || 'PERIODO_DA_DATA').trim())
const formularioRetomadaLoteValidoParaPrevia = computed(() => !validarFormularioRetomadaLote())
const previewRetomadaLoteValida = computed(() => Boolean(previaRetomadaLote.value && assinaturaPreviaRetomadaLote.value))
const previewRetomadaLoteAtualizada = computed(
  () =>
    previewRetomadaLoteValida.value &&
    assinaturaPreviaRetomadaLote.value === assinaturaAtualRetomadaLote.value &&
    !carregandoPreviaRetomadaLote.value &&
    !previsaoRetomadaLotePendente.value,
)
const previewRetomadaLoteSemResultados = computed(
  () => previewRetomadaLoteValida.value && normalizarNumero(previaRetomadaLote.value?.quantidadeEncontrada, 0) === 0,
)
const previewRetomadaLoteBloqueado = computed(() => {
  const resumo = previaRetomadaLote.value
  if (!resumo) {
    return false
  }

  return normalizarNumero(resumo.quantidadeBloqueada, 0) > 0
})
const previewRetomadaLoteSemAlteracao = computed(
  () =>
    previewRetomadaLoteValida.value &&
    !previewRetomadaLoteSemResultados.value &&
    !previewRetomadaLoteBloqueado.value &&
    normalizarNumero(previaRetomadaLote.value?.quantidadeReversivel, 0) === 0 &&
    normalizarNumero(previaRetomadaLote.value?.quantidadeJaAtiva, 0) > 0,
)
const mensagemBloqueioConfirmacaoRetomadaLote = computed(() => {
  if (!modalRetomadaLoteAberto.value) {
    return ''
  }

  if (carregandoPreviaRetomadaLote.value || previsaoRetomadaLotePendente.value) {
    return 'Aguarde a atualizaÃ§Ã£o da prÃ©via.'
  }

  if (
    escopoRetomadaLote.value === 'AULAS_ESPECIFICAS' &&
    aulasEspecificasRetomadaLoteCarregadas.value &&
    !carregandoAulasEspecificasRetomadaLote.value &&
    aulasEspecificasRetomadaLote.value.length === 0
  ) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  const erroFormulario = validarFormularioRetomadaLote()
  if (erroFormulario) {
    return erroFormulario
  }

  if (previewRetomadaLoteBloqueado.value) {
    return 'O lote possui aulas bloqueadas e nÃ£o pode ser processado parcialmente.'
  }

  if (previewRetomadaLoteSemResultados.value) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  if (previewRetomadaLoteSemAlteracao.value) {
    return 'Todas as aulas encontradas jÃ¡ estÃ£o ativas.'
  }

  if (!previewRetomadaLoteAtualizada.value) {
    return 'Aguarde a atualizaÃ§Ã£o da prÃ©via.'
  }

  return ''
})
const mensagemPreviewRetomadaLote = computed(() => {
  if (escopoRetomadaLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasRetomadaLote.value) {
    return 'Carregando aulas da data...'
  }

  if (
    escopoRetomadaLote.value === 'AULAS_ESPECIFICAS' &&
    aulasEspecificasRetomadaLoteCarregadas.value &&
    aulasEspecificasRetomadaLote.value.length === 0
  ) {
    return 'Nenhuma aula foi encontrada para a data selecionada.'
  }

  if (carregandoPreviaRetomadaLote.value || previsaoRetomadaLotePendente.value) {
    return 'Atualizando prévia...'
  }

  const erroFormulario = validarFormularioRetomadaLote()
  if (erroFormulario) {
    return erroFormulario
  }

  if (!previewRetomadaLoteValida.value) {
    return 'A prévia será atualizada automaticamente quando os dados estiverem completos.'
  }

  if (previewRetomadaLoteSemResultados.value) {
    return 'Nenhuma aula foi encontrada para o escopo selecionado.'
  }

  if (previewRetomadaLoteBloqueado.value) {
    return 'O backend não permite processamento parcial neste cenário. Ajuste o escopo ou a seleção e consulte uma nova prévia.'
  }

  if (previewRetomadaLoteSemAlteracao.value) {
    return 'Todas as aulas encontradas já estão ativas. Nenhuma nova alteração será executada.'
  }

  return 'A prévia está pronta. Confira os itens antes de confirmar a retomada em lote.'
})
const podeConfirmarRetomadaLote = computed(() => {
  return !mensagemBloqueioConfirmacaoRetomadaLote.value
})
const podeAtualizarPreviaRetomadaLote = computed(
  () =>
    modalRetomadaLoteAberto.value &&
    formularioRetomadaLoteValidoParaPrevia.value &&
    !carregandoPreviaRetomadaLote.value &&
    !processandoRetomadaLote.value,
)
const assinaturaAtualRetomadaLote = computed(() => assinaturaRetomadaLote(montarPayloadRetomadaLote()))
const assinaturaBuscaAulasEspecificasCancelamentoLote = computed(() =>
  modalCancelamentoLoteAberto.value && escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS'
    ? JSON.stringify({
        data: String(cancelamentoLote.value.data || '').trim(),
        professorId: normalizarIdPositivo(cancelamentoLote.value.professorId),
      })
    : '',
)
const assinaturaBuscaAulasEspecificasRetomadaLote = computed(() =>
  modalRetomadaLoteAberto.value && escopoRetomadaLote.value === 'AULAS_ESPECIFICAS'
    ? JSON.stringify({
        data: String(retomadaLote.value.data || '').trim(),
        professorId: normalizarIdPositivo(retomadaLote.value.professorId),
      })
    : '',
)
const assinaturaSelecaoAulasEspecificasCancelamentoLote = computed(() =>
  modalCancelamentoLoteAberto.value && escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS'
    ? JSON.stringify(normalizarIdsSelecionados(cancelamentoLote.value.aulaIds))
    : '',
)
const assinaturaSelecaoAulasEspecificasRetomadaLote = computed(() =>
  modalRetomadaLoteAberto.value && escopoRetomadaLote.value === 'AULAS_ESPECIFICAS'
    ? JSON.stringify(normalizarIdsSelecionados(retomadaLote.value.aulaIds))
    : '',
)
const assinaturaGatilhoPreviaCancelamentoLote = computed(() =>
  escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS'
    ? assinaturaSelecaoAulasEspecificasCancelamentoLote.value
    : assinaturaAtualCancelamentoLote.value,
)
const assinaturaGatilhoPreviaRetomadaLote = computed(() =>
  escopoRetomadaLote.value === 'AULAS_ESPECIFICAS'
    ? assinaturaSelecaoAulasEspecificasRetomadaLote.value
    : assinaturaAtualRetomadaLote.value,
)
const aulasSelecionaveisCancelamentoLote = computed(() =>
  escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS'
    ? [...aulasEspecificasCancelamentoLote.value]
    : [...aulasOrdenadas.value],
)
const aulasSelecionaveisRetomadaLote = computed(() =>
  escopoRetomadaLote.value === 'AULAS_ESPECIFICAS'
    ? [...aulasEspecificasRetomadaLote.value]
    : [...aulasOrdenadas.value],
)
const intervaloExibido = computed(() =>
  totalAulas.value === 0 ? '0 de 0' : `${indiceInicioPagina.value} a ${indiceFimPagina.value} de ${totalAulas.value}`,
)
const podeIrAnterior = computed(() => paginaAtualExibida.value > 1)
const podeIrProxima = computed(() => paginaAtualExibida.value < totalPaginas.value)

function valorRota(valor) {
  return Array.isArray(valor) ? valor[0] : valor
}

function normalizarIdPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function criarDataISO(dias = 0) {
  const data = new Date()
  data.setHours(0, 0, 0, 0)
  data.setDate(data.getDate() + dias)
  return formatarDataISO(data)
}

function formatarDataISO(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function criarFiltrosPadrao() {
  return {
    dataInicial: criarDataISO(0),
    dataFinal: criarDataISO(0),
    turmaId: '',
    professorId: '',
    nivel: '',
    situacao: '',
  }
}

function criarGeracaoPadrao() {
  return {
    dataInicial: criarDataISO(0),
    dataFinal: criarDataISO(0),
    turmaId: '',
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

function normalizarSituacaoAula(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return ['AGENDADA', 'REALIZADA', 'CANCELADA', 'NAO_REALIZADA'].includes(texto) ? texto : ''
}

function normalizarSituacaoFrequencia(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return STATUS_FREQUENCIA_PERSISTIVEIS.has(texto) || texto === 'NAO_LANCADO' ? texto : 'NAO_LANCADO'
}

function normalizarTipoParticipacao(valor) {
  const texto = String(valor || '').trim().toUpperCase()
  return texto || 'REGULAR'
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

function normalizarAulaLista(item = {}) {
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
    naoLancados: obterNumeroDeCampo([item, resumo], ['naoLancados', 'naoLancados', 'qtdNaoLancados'], 0),
  }
}

function normalizarParticipante(item = {}) {
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

function normalizarAulaDetalhe(item = {}) {
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

function compararAulas(a, b) {
  const dataA = String(a?.dataAula || '')
  const dataB = String(b?.dataAula || '')

  if (dataA !== dataB) {
    return dataA.localeCompare(dataB)
  }

  const horaA = String(a?.horarioInicio || '')
  const horaB = String(b?.horarioInicio || '')

  if (horaA !== horaB) {
    return horaA.localeCompare(horaB)
  }

  return String(a?.turmaNome || '').localeCompare(String(b?.turmaNome || ''), 'pt-BR')
}

function compararPorNomeComAtivo(a, b) {
  const ativoA = a?.ativo === false ? 1 : 0
  const ativoB = b?.ativo === false ? 1 : 0

  if (ativoA !== ativoB) {
    return ativoA - ativoB
  }

  return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR')
}

function formatarDuracaoMinutos(valor) {
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

function formatarDataHora(valor) {
  const texto = String(valor || '').trim()
  if (!texto) {
    return ''
  }

  const data = new Date(texto)
  if (Number.isNaN(data.getTime())) {
    return texto
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function formatarHorario(valor) {
  const texto = String(valor || '').trim()
  if (!texto) {
    return '-'
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(texto)) {
    return texto.slice(0, 5)
  }

  return texto
}

function rotuloSituacaoAula(valor) {
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

function rotuloSituacaoFrequencia(valor) {
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

function estadoSituacaoAula(valor) {
  const situacao = normalizarSituacaoAula(valor)

  return `estado-${situacao.toLowerCase() || 'indefinido'}`
}

function calcularResumoFrequencias(aula = null, participantes = []) {
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
    naoLancados: obterNumeroDeCampo([aula, resumo], ['naoLancados', 'naoLancados', 'qtdNaoLancados'], contarSituacao(lista, 'NAO_LANCADO')),
  }
}

function contarSituacao(lista, situacao) {
  return lista.filter((item) => normalizarSituacaoFrequencia(item.situacao) === situacao).length
}

function definirFeedback(mensagem, tipo = 'info') {
  feedback.value = String(mensagem || '').trim()
  tipoFeedback.value = tipo
}

function limparFeedback() {
  feedback.value = ''
  tipoFeedback.value = 'info'
}

function obterMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  return mensagem || fallback
}

function valorSelecionado(lista = [], id) {
  const identificador = normalizarIdPositivo(id)
  return identificador ? lista.find((item) => item.id === identificador) || null : null
}

function limparDetalhe() {
  aulaDetalhe.value = null
  participantesEdicao.value = []
  erroDetalhe.value = ''
}

function limparLista() {
  aulas.value = []
  erroLista.value = ''
}

function aplicarSelecaoInicial(lista = []) {
  if (aulaSelecionadaId.value || !lista.length) {
    return
  }

  const primeira = lista[0]
  if (primeira?.id) {
    router.replace({
      query: {
        ...route.query,
        aulaId: String(primeira.id),
      },
    })
  }
}

function montarFiltrosConsulta() {
  const consulta = {}

  if (filtros.value.dataInicial) {
    consulta.dataInicial = filtros.value.dataInicial
  }

  if (filtros.value.dataFinal) {
    consulta.dataFinal = filtros.value.dataFinal
  }

  const turmaId = normalizarIdPositivo(filtros.value.turmaId)
  if (turmaId) {
    consulta.turmaId = turmaId
  }

  const professorId = normalizarIdPositivo(filtros.value.professorId)
  if (professorId) {
    consulta.professorId = professorId
  }

  if (filtros.value.nivel) {
    consulta.nivel = String(filtros.value.nivel).trim().toUpperCase()
  }

  if (filtros.value.situacao) {
    consulta.situacao = String(filtros.value.situacao).trim().toUpperCase()
  }

  return consulta
}

function montarPayloadGeracao() {
  const payload = {
    dataInicial: filtrosValidos(geracao.value.dataInicial),
    dataFinal: filtrosValidos(geracao.value.dataFinal),
  }

  const turmaId = normalizarIdPositivo(geracao.value.turmaId)
  if (turmaId) {
    payload.turmaId = turmaId
  }

  return payload
}

function filtrosValidos(valor) {
  return String(valor || '').trim()
}

function normalizarPagina(valor) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return Number.isInteger(numero) && numero > 0 ? numero : 1
}

function normalizarQuantidadePorPagina(valor) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return OPCOES_ITENS_POR_PAGINA.includes(numero) ? numero : 5
}

function rotuloAcaoAula(aula = {}) {
  if (normalizarSituacaoAula(aula.situacao) === 'CANCELADA') {
    return 'Ver detalhes'
  }

  const quantidadeParticipantes = normalizarNumero(aula.quantidadeParticipantes, 0)
  if (quantidadeParticipantes === 0) {
    return 'Ver detalhes'
  }

  const naoLancados = normalizarNumero(aula.naoLancados, 0)
  return naoLancados < quantidadeParticipantes ? 'Ver frequência' : 'Lançar frequência'
}

function criarCancelamentoLotePadrao() {
  return {
    escopo: 'PERIODO_DA_DATA',
    data: criarDataISO(0),
    aulaIds: [],
    turmaIds: [],
    professorId: '',
    periodo: 'MANHA',
    motivo: '',
  }
}

function criarRetomadaLotePadrao() {
  return {
    escopo: 'PERIODO_DA_DATA',
    data: criarDataISO(0),
    aulaIds: [],
    turmaIds: [],
    professorId: '',
    periodo: 'MANHA',
  }
}

function normalizarIdsSelecionados(lista = []) {
  const ids = []
  const vistos = new Set()

  for (const item of Array.isArray(lista) ? lista : []) {
    const id = normalizarIdPositivo(item)
    if (!id || vistos.has(id)) {
      continue
    }

    vistos.add(id)
    ids.push(id)
  }

  return ids.sort((a, b) => a - b)
}

function formatarEscopoCancelamentoLote(valor) {
  return OPCOES_ESCOPO_CANCELAMENTO_LOTE.find((opcao) => opcao.valor === String(valor || '').trim().toUpperCase())?.rotulo || 'Escopo'
}

function formatarPeriodoCancelamentoLote(valor) {
  return OPCOES_PERIODO_CANCELAMENTO_LOTE.find((opcao) => opcao.valor === String(valor || '').trim().toUpperCase())?.rotulo || 'Período'
}

function montarPayloadCancelamentoLote({ incluirMotivo = false } = {}) {
  const escopo = String(cancelamentoLote.value.escopo || 'PERIODO_DA_DATA').trim().toUpperCase()
  const data = String(cancelamentoLote.value.data || '').trim()
  const professorId = normalizarIdPositivo(cancelamentoLote.value.professorId)
  const payload = {
    escopo,
    data: data || null,
    aulaIds: [],
    turmaIds: [],
    professorId: professorId || null,
    periodo: null,
    motivo: incluirMotivo ? String(cancelamentoLote.value.motivo || '').trim() || null : null,
  }

  if (escopo === 'AULAS_ESPECIFICAS') {
    payload.aulaIds = normalizarIdsSelecionados(cancelamentoLote.value.aulaIds)
  }

  if (escopo === 'TURMAS_NA_DATA' || escopo === 'PERIODO_DA_DATA') {
    payload.turmaIds = normalizarIdsSelecionados(cancelamentoLote.value.turmaIds)
  }

  if (escopo === 'PERIODO_DA_DATA') {
    payload.periodo = String(cancelamentoLote.value.periodo || '').trim().toUpperCase() || null
  }

  return payload
}

function montarPayloadRetomadaLote() {
  const escopo = String(retomadaLote.value.escopo || 'PERIODO_DA_DATA').trim().toUpperCase()
  const data = String(retomadaLote.value.data || '').trim()
  const professorId = normalizarIdPositivo(retomadaLote.value.professorId)
  const payload = {
    escopo,
    data: data || null,
    aulaIds: [],
    turmaIds: [],
    professorId: professorId || null,
    periodo: null,
  }

  if (escopo === 'AULAS_ESPECIFICAS') {
    payload.aulaIds = normalizarIdsSelecionados(retomadaLote.value.aulaIds)
  }

  if (escopo === 'TURMAS_NA_DATA' || escopo === 'PERIODO_DA_DATA') {
    payload.turmaIds = normalizarIdsSelecionados(retomadaLote.value.turmaIds)
  }

  if (escopo === 'PERIODO_DA_DATA') {
    payload.periodo = String(retomadaLote.value.periodo || '').trim().toUpperCase() || null
  }

  return payload
}

function assinaturaCancelamentoLote(payload = montarPayloadCancelamentoLote()) {
  return JSON.stringify({
    escopo: payload.escopo,
    data: payload.data || '',
    aulaIds: normalizarIdsSelecionados(payload.aulaIds),
    turmaIds: normalizarIdsSelecionados(payload.turmaIds),
    professorId: payload.professorId || null,
    periodo: payload.periodo || null,
  })
}

function assinaturaRetomadaLote(payload = montarPayloadRetomadaLote()) {
  return JSON.stringify({
    escopo: payload.escopo,
    data: payload.data || '',
    aulaIds: normalizarIdsSelecionados(payload.aulaIds),
    turmaIds: normalizarIdsSelecionados(payload.turmaIds),
    professorId: payload.professorId || null,
    periodo: payload.periodo || null,
  })
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
    canceladaAgora: item.canceladaAgora === true || item.cancelada_agora === true || item.canceladaAgora === 1,
  }
}

function normalizarAulaPreviaRetomadaLote(item = {}) {
  const aulaId = normalizarIdPositivo(item.aulaId ?? item.id)
  if (!aulaId) {
    return null
  }

  const situacao = normalizarSituacaoAula(item.situacao)
  const bloqueada = item.bloqueada === true || item.bloqueada === 'true' || item.bloqueada === 1
  const reversivelExplicita = item.reversivel === true || item.reversivel === 'true' || item.reversivel === 1
  const jaAtivaExplicita = item.jaAtiva === true || item.ja_ativa === true || item.jaAtiva === 1
  const reversivel = reversivelExplicita || (!bloqueada && situacao === 'CANCELADA')
  const jaAtiva = jaAtivaExplicita || (!bloqueada && !reversivel && situacao !== 'CANCELADA')

  return {
    aulaId,
    data: normalizarTextoOpcional(item.data || item.dataAula || item.data_aula),
    horario: normalizarTextoOpcional(item.horario || item.horarioInicio || item.horario_inicio),
    turmaId: normalizarIdPositivo(item.turmaId ?? item.turma_id),
    turmaNome: normalizarTextoOpcional(item.turmaNome || item.turma_nome || item.turma || ''),
    professorId: normalizarIdPositivo(item.professorId ?? item.professor_id ?? item.funcionarioId),
    professorNome: normalizarTextoOpcional(item.professorNome || item.professor_nome || item.funcionarioNome || ''),
    situacao,
    reversivel,
    jaAtiva,
    bloqueada,
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
    quantidadeCancelavel: obterNumeroDeCampo([base], ['quantidadeCancelavel', 'totalCancelavel', 'cancelaveis'], aulasNormalizadas.filter((item) => item.cancelavel).length),
    quantidadeJaCancelada: obterNumeroDeCampo([base], ['quantidadeJaCancelada', 'totalJaCancelada', 'jaCanceladas'], aulasNormalizadas.filter((item) => item.jaCancelada).length),
    quantidadeBloqueada: obterNumeroDeCampo([base], ['quantidadeBloqueada', 'totalBloqueada', 'bloqueadas'], aulasNormalizadas.filter((item) => !item.cancelavel && !item.jaCancelada).length),
    aulas: aulasNormalizadas,
  }
}

function normalizarPreviaRetomadaLote(resposta = {}) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const aulasFonte = Array.isArray(base.aulas) ? base.aulas : Array.isArray(base.itens) ? base.itens : []
  const aulasNormalizadas = aulasFonte
    .map((item) => normalizarAulaPreviaRetomadaLote(item))
    .filter(Boolean)

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

function rotuloStatusPreviaCancelamentoLote(item = {}) {
  if (item.jaCancelada) {
    return 'Já cancelada'
  }

  if (item.cancelavel) {
    return 'Cancelável'
  }

  return 'Bloqueada'
}

function classeStatusPreviaCancelamentoLote(item = {}) {
  if (item.jaCancelada) {
    return 'ja-cancelada'
  }

  if (item.cancelavel) {
    return 'cancelavel'
  }

  return 'bloqueada'
}

function descricaoAulaCancelamentoLote(item = {}) {
  const trechos = [formatarDataBrasileira(item.data), item.horario, item.turmaNome].filter(Boolean)
  return trechos.join(' · ')
}

function rotuloStatusPreviaRetomadaLote(item = {}) {
  if (item.bloqueada) {
    return 'Bloqueada'
  }

  if (item.reversivel) {
    return 'Reversível'
  }

  return 'Já ativa'
}

function classeStatusPreviaRetomadaLote(item = {}) {
  if (item.bloqueada) {
    return 'bloqueada'
  }

  if (item.reversivel) {
    return 'reversivel'
  }

  return 'ja-ativa'
}

function descricaoAulaRetomadaLote(item = {}) {
  const trechos = [formatarDataBrasileira(item.data), item.horario, item.turmaNome].filter(Boolean)
  return trechos.join(' · ')
}

function cancelarAgendamentoPreviaCancelamentoLote() {
  if (debouncePreviaCancelamentoLote) {
    clearTimeout(debouncePreviaCancelamentoLote)
    debouncePreviaCancelamentoLote = null
  }
}

function cancelarAgendamentoPreviaRetomadaLote() {
  if (debouncePreviaRetomadaLote) {
    clearTimeout(debouncePreviaRetomadaLote)
    debouncePreviaRetomadaLote = null
  }
}

function redefinirEstadoPreviaCancelamentoLote() {
  cancelarAgendamentoPreviaCancelamentoLote()
  sequenciaPreviaCancelamentoLote.value += 1
  previsaoCancelamentoLotePendente.value = false
  carregandoPreviaCancelamentoLote.value = false
  previaCancelamentoLote.value = null
  assinaturaPreviaCancelamentoLote.value = ''
  erroCancelamentoLote.value = ''
}

function redefinirEstadoPreviaRetomadaLote() {
  cancelarAgendamentoPreviaRetomadaLote()
  sequenciaPreviaRetomadaLote.value += 1
  previsaoRetomadaLotePendente.value = false
  carregandoPreviaRetomadaLote.value = false
  previaRetomadaLote.value = null
  assinaturaPreviaRetomadaLote.value = ''
  erroRetomadaLote.value = ''
}

function abrirModalCancelamentoLote() {
  redefinirEstadoPreviaCancelamentoLote()
  modalCancelamentoLoteAberto.value = true
  cancelamentoLote.value = criarCancelamentoLotePadrao()
}

function fecharModalCancelamentoLote(forcar = false) {
  if ((carregandoPreviaCancelamentoLote.value || processandoCancelamentoLote.value) && !forcar) {
    return
  }

  modalCancelamentoLoteAberto.value = false
  cancelamentoLote.value = criarCancelamentoLotePadrao()
  redefinirEstadoPreviaCancelamentoLote()
}

function limparPreviaCancelamentoLote(mensagem = '') {
  cancelarAgendamentoPreviaCancelamentoLote()
  previaCancelamentoLote.value = null
  assinaturaPreviaCancelamentoLote.value = ''
  previsaoCancelamentoLotePendente.value = false
  carregandoPreviaCancelamentoLote.value = false
  erroCancelamentoLote.value = String(mensagem || '').trim()
}

function abrirModalRetomadaLote() {
  redefinirEstadoPreviaRetomadaLote()
  modalRetomadaLoteAberto.value = true
  retomadaLote.value = criarRetomadaLotePadrao()
}

function fecharModalRetomadaLote(forcar = false) {
  if ((carregandoPreviaRetomadaLote.value || processandoRetomadaLote.value) && !forcar) {
    return
  }

  modalRetomadaLoteAberto.value = false
  retomadaLote.value = criarRetomadaLotePadrao()
  redefinirEstadoPreviaRetomadaLote()
}

function limparPreviaRetomadaLote(mensagem = '') {
  cancelarAgendamentoPreviaRetomadaLote()
  previaRetomadaLote.value = null
  assinaturaPreviaRetomadaLote.value = ''
  previsaoRetomadaLotePendente.value = false
  carregandoPreviaRetomadaLote.value = false
  erroRetomadaLote.value = String(mensagem || '').trim()
}

function cancelarAgendamentoAulasEspecificasCancelamentoLote() {
  if (debounceAulasEspecificasCancelamentoLote) {
    clearTimeout(debounceAulasEspecificasCancelamentoLote)
    debounceAulasEspecificasCancelamentoLote = null
  }
}

function cancelarAgendamentoAulasEspecificasRetomadaLote() {
  if (debounceAulasEspecificasRetomadaLote) {
    clearTimeout(debounceAulasEspecificasRetomadaLote)
    debounceAulasEspecificasRetomadaLote = null
  }
}

function limparAulasEspecificasCancelamentoLote() {
  cancelarAgendamentoAulasEspecificasCancelamentoLote()
  sequenciaAulasEspecificasCancelamentoLote.value += 1
  aulasEspecificasCancelamentoLote.value = []
  aulasEspecificasCancelamentoLoteCarregadas.value = false
  carregandoAulasEspecificasCancelamentoLote.value = false
  erroAulasEspecificasCancelamentoLote.value = ''
}

function limparAulasEspecificasRetomadaLote() {
  cancelarAgendamentoAulasEspecificasRetomadaLote()
  sequenciaAulasEspecificasRetomadaLote.value += 1
  aulasEspecificasRetomadaLote.value = []
  aulasEspecificasRetomadaLoteCarregadas.value = false
  carregandoAulasEspecificasRetomadaLote.value = false
  erroAulasEspecificasRetomadaLote.value = ''
}

function normalizarListaAulasEspecificas(resposta) {
  return (Array.isArray(resposta) ? resposta : []).map((item) => normalizarAulaLista(item)).filter(Boolean)
}

function agendarConsultaAulasEspecificasCancelamentoLote({ forcar = false } = {}) {
  if (
    !modalCancelamentoLoteAberto.value ||
    escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS' ||
    processandoCancelamentoLote.value
  ) {
    return
  }

  const data = String(cancelamentoLote.value.data || '').trim()
  if (!data) {
    limparAulasEspecificasCancelamentoLote()
    return
  }

  cancelarAgendamentoAulasEspecificasCancelamentoLote()
  const sequenciaAtual = ++sequenciaAulasEspecificasCancelamentoLote.value
  aulasEspecificasCancelamentoLoteCarregadas.value = false
  carregandoAulasEspecificasCancelamentoLote.value = true
  erroAulasEspecificasCancelamentoLote.value = ''
  aulasEspecificasCancelamentoLote.value = []

  const consultar = () => {
    void consultarAulasEspecificasCancelamentoLote(sequenciaAtual)
  }

  if (forcar) {
    consultar()
    return
  }

  debounceAulasEspecificasCancelamentoLote = setTimeout(() => {
    debounceAulasEspecificasCancelamentoLote = null
    consultar()
  }, 420)
}

async function consultarAulasEspecificasCancelamentoLote(sequenciaSolicitada) {
  if (
    !modalCancelamentoLoteAberto.value ||
    escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS' ||
    processandoCancelamentoLote.value ||
    sequenciaSolicitada !== sequenciaAulasEspecificasCancelamentoLote.value
  ) {
    return
  }

  const data = String(cancelamentoLote.value.data || '').trim()
  if (!data) {
    if (sequenciaSolicitada === sequenciaAulasEspecificasCancelamentoLote.value) {
      carregandoAulasEspecificasCancelamentoLote.value = false
      aulasEspecificasCancelamentoLoteCarregadas.value = false
    }
    return
  }

  const professorId = normalizarIdPositivo(cancelamentoLote.value.professorId)
  const filtros = {
    dataInicial: data,
    dataFinal: data,
  }

  if (professorId) {
    filtros.professorId = professorId
  }

  try {
    const resposta = await buscarAulasGestaoEsportiva(filtros)
    if (
      !modalCancelamentoLoteAberto.value ||
      escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS' ||
      sequenciaSolicitada !== sequenciaAulasEspecificasCancelamentoLote.value
    ) {
      return
    }

    aulasEspecificasCancelamentoLote.value = normalizarListaAulasEspecificas(resposta)
    aulasEspecificasCancelamentoLoteCarregadas.value = true
  } catch (error) {
    if (
      !modalCancelamentoLoteAberto.value ||
      escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS' ||
      sequenciaSolicitada !== sequenciaAulasEspecificasCancelamentoLote.value
    ) {
      return
    }

    aulasEspecificasCancelamentoLote.value = []
    aulasEspecificasCancelamentoLoteCarregadas.value = false
    erroAulasEspecificasCancelamentoLote.value = obterMensagemErro(error, 'Não foi possível carregar as aulas da data.')
  } finally {
    if (sequenciaSolicitada === sequenciaAulasEspecificasCancelamentoLote.value) {
      carregandoAulasEspecificasCancelamentoLote.value = false
    }
  }
}

function agendarConsultaAulasEspecificasRetomadaLote({ forcar = false } = {}) {
  if (
    !modalRetomadaLoteAberto.value ||
    escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS' ||
    processandoRetomadaLote.value
  ) {
    return
  }

  const data = String(retomadaLote.value.data || '').trim()
  if (!data) {
    limparAulasEspecificasRetomadaLote()
    return
  }

  cancelarAgendamentoAulasEspecificasRetomadaLote()
  const sequenciaAtual = ++sequenciaAulasEspecificasRetomadaLote.value
  aulasEspecificasRetomadaLoteCarregadas.value = false
  carregandoAulasEspecificasRetomadaLote.value = true
  erroAulasEspecificasRetomadaLote.value = ''
  aulasEspecificasRetomadaLote.value = []

  const consultar = () => {
    void consultarAulasEspecificasRetomadaLote(sequenciaAtual)
  }

  if (forcar) {
    consultar()
    return
  }

  debounceAulasEspecificasRetomadaLote = setTimeout(() => {
    debounceAulasEspecificasRetomadaLote = null
    consultar()
  }, 420)
}

async function consultarAulasEspecificasRetomadaLote(sequenciaSolicitada) {
  if (
    !modalRetomadaLoteAberto.value ||
    escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS' ||
    processandoRetomadaLote.value ||
    sequenciaSolicitada !== sequenciaAulasEspecificasRetomadaLote.value
  ) {
    return
  }

  const data = String(retomadaLote.value.data || '').trim()
  if (!data) {
    if (sequenciaSolicitada === sequenciaAulasEspecificasRetomadaLote.value) {
      carregandoAulasEspecificasRetomadaLote.value = false
      aulasEspecificasRetomadaLoteCarregadas.value = false
    }
    return
  }

  const professorId = normalizarIdPositivo(retomadaLote.value.professorId)
  const filtros = {
    dataInicial: data,
    dataFinal: data,
  }

  if (professorId) {
    filtros.professorId = professorId
  }

  try {
    const resposta = await buscarAulasGestaoEsportiva(filtros)
    if (
      !modalRetomadaLoteAberto.value ||
      escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS' ||
      sequenciaSolicitada !== sequenciaAulasEspecificasRetomadaLote.value
    ) {
      return
    }

    aulasEspecificasRetomadaLote.value = normalizarListaAulasEspecificas(resposta)
    aulasEspecificasRetomadaLoteCarregadas.value = true
  } catch (error) {
    if (
      !modalRetomadaLoteAberto.value ||
      escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS' ||
      sequenciaSolicitada !== sequenciaAulasEspecificasRetomadaLote.value
    ) {
      return
    }

    aulasEspecificasRetomadaLote.value = []
    aulasEspecificasRetomadaLoteCarregadas.value = false
    erroAulasEspecificasRetomadaLote.value = obterMensagemErro(error, 'Não foi possível carregar as aulas da data.')
  } finally {
    if (sequenciaSolicitada === sequenciaAulasEspecificasRetomadaLote.value) {
      carregandoAulasEspecificasRetomadaLote.value = false
    }
  }
}

function validarFormularioCancelamentoLote() {
  const escopo = escopoCancelamentoLote.value
  const data = String(cancelamentoLote.value.data || '').trim()

  if (!['AULAS_ESPECIFICAS', 'TURMAS_NA_DATA', 'TODAS_DA_DATA', 'PERIODO_DA_DATA'].includes(escopo)) {
    return 'Selecione um escopo válido para o cancelamento.'
  }

  if (!data) {
    return 'Informe a data do cancelamento.'
  }

  if (escopo === 'AULAS_ESPECIFICAS' && normalizarIdsSelecionados(cancelamentoLote.value.aulaIds).length === 0) {
    return 'Selecione ao menos uma aula.'
  }

  if (escopo === 'TURMAS_NA_DATA' && normalizarIdsSelecionados(cancelamentoLote.value.turmaIds).length === 0) {
    return 'Selecione pelo menos uma turma para cancelar.'
  }

  if (escopo === 'PERIODO_DA_DATA' && !String(cancelamentoLote.value.periodo || '').trim()) {
    return 'Selecione o período do dia.'
  }

  return ''
}

function validarFormularioRetomadaLote() {
  const escopo = escopoRetomadaLote.value
  const data = String(retomadaLote.value.data || '').trim()

  if (!['AULAS_ESPECIFICAS', 'TURMAS_NA_DATA', 'TODAS_DA_DATA', 'PERIODO_DA_DATA'].includes(escopo)) {
    return 'Selecione um escopo válido para a retomada.'
  }

  if (!data) {
    return 'Informe a data da retomada.'
  }

  if (escopo === 'AULAS_ESPECIFICAS' && normalizarIdsSelecionados(retomadaLote.value.aulaIds).length === 0) {
    return 'Selecione ao menos uma aula.'
  }

  if (escopo === 'TURMAS_NA_DATA' && normalizarIdsSelecionados(retomadaLote.value.turmaIds).length === 0) {
    return 'Selecione pelo menos uma turma para retomar.'
  }

  if (escopo === 'PERIODO_DA_DATA' && !String(retomadaLote.value.periodo || '').trim()) {
    return 'Selecione o período do dia.'
  }

  return ''
}

function agendarConsultaPreviaCancelamentoLote({ forcar = false } = {}) {
  if (
    !modalCancelamentoLoteAberto.value ||
    processandoCancelamentoLote.value ||
    (escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasCancelamentoLote.value)
  ) {
    return
  }

  cancelarAgendamentoPreviaCancelamentoLote()
  sequenciaPreviaCancelamentoLote.value += 1
  previsaoCancelamentoLotePendente.value = true
  carregandoPreviaCancelamentoLote.value = false
  erroCancelamentoLote.value = ''
  previaCancelamentoLote.value = null
  assinaturaPreviaCancelamentoLote.value = ''

  if (forcar) {
    void consultarPreviaCancelamentoLote(true)
    return
  }

  debouncePreviaCancelamentoLote = setTimeout(() => {
    debouncePreviaCancelamentoLote = null
    void consultarPreviaCancelamentoLote(false)
  }, 420)
}

function agendarConsultaPreviaRetomadaLote({ forcar = false } = {}) {
  if (
    !modalRetomadaLoteAberto.value ||
    processandoRetomadaLote.value ||
    (escopoRetomadaLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasRetomadaLote.value)
  ) {
    return
  }

  cancelarAgendamentoPreviaRetomadaLote()
  sequenciaPreviaRetomadaLote.value += 1
  previsaoRetomadaLotePendente.value = true
  carregandoPreviaRetomadaLote.value = false
  erroRetomadaLote.value = ''
  previaRetomadaLote.value = null
  assinaturaPreviaRetomadaLote.value = ''

  if (forcar) {
    void consultarPreviaRetomadaLote(true)
    return
  }

  debouncePreviaRetomadaLote = setTimeout(() => {
    debouncePreviaRetomadaLote = null
    void consultarPreviaRetomadaLote(false)
  }, 420)
}

async function consultarPreviaCancelamentoLote(forcar = false) {
  if (
    !modalCancelamentoLoteAberto.value ||
    processandoCancelamentoLote.value ||
    (escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasCancelamentoLote.value)
  ) {
    return
  }

  const erroFormulario = validarFormularioCancelamentoLote()
  if (erroFormulario) {
    previsaoCancelamentoLotePendente.value = false
    if (forcar || erroCancelamentoLote.value !== erroFormulario) {
      erroCancelamentoLote.value = erroFormulario
    }
    return
  }

  const payload = montarPayloadCancelamentoLote()
  const assinaturaSolicitada = assinaturaCancelamentoLote(payload)
  const sequenciaAtual = ++sequenciaPreviaCancelamentoLote.value
  assinaturaPreviaCancelamentoLote.value = assinaturaSolicitada
  carregandoPreviaCancelamentoLote.value = true
  erroCancelamentoLote.value = ''

  try {
    const resposta = await buscarPreviaCancelamentoAulasGestaoEsportiva(payload)
    if (!modalCancelamentoLoteAberto.value || sequenciaAtual !== sequenciaPreviaCancelamentoLote.value) {
      return
    }

    previaCancelamentoLote.value = normalizarPreviaCancelamentoLote(resposta || {})
  } catch (error) {
    if (!modalCancelamentoLoteAberto.value || sequenciaAtual !== sequenciaPreviaCancelamentoLote.value) {
      return
    }

    previaCancelamentoLote.value = null
    assinaturaPreviaCancelamentoLote.value = ''
    erroCancelamentoLote.value = obterMensagemErro(error, 'Não foi possível consultar a prévia do cancelamento.')
  } finally {
    if (sequenciaAtual === sequenciaPreviaCancelamentoLote.value) {
      carregandoPreviaCancelamentoLote.value = false
      previsaoCancelamentoLotePendente.value = false
    }
  }
}

async function consultarPreviaRetomadaLote(forcar = false) {
  if (
    !modalRetomadaLoteAberto.value ||
    processandoRetomadaLote.value ||
    (escopoRetomadaLote.value === 'AULAS_ESPECIFICAS' && carregandoAulasEspecificasRetomadaLote.value)
  ) {
    return
  }

  const erroFormulario = validarFormularioRetomadaLote()
  if (erroFormulario) {
    previsaoRetomadaLotePendente.value = false
    if (forcar || erroRetomadaLote.value !== erroFormulario) {
      erroRetomadaLote.value = erroFormulario
    }
    return
  }

  const payload = montarPayloadRetomadaLote()
  const assinaturaSolicitada = assinaturaRetomadaLote(payload)
  const sequenciaAtual = ++sequenciaPreviaRetomadaLote.value
  assinaturaPreviaRetomadaLote.value = assinaturaSolicitada
  carregandoPreviaRetomadaLote.value = true
  erroRetomadaLote.value = ''

  try {
    const resposta = await buscarPreviaReversaoAulasGestaoEsportiva(payload)
    if (!modalRetomadaLoteAberto.value || sequenciaAtual !== sequenciaPreviaRetomadaLote.value) {
      return
    }

    previaRetomadaLote.value = normalizarPreviaRetomadaLote(resposta || {})
  } catch (error) {
    if (!modalRetomadaLoteAberto.value || sequenciaAtual !== sequenciaPreviaRetomadaLote.value) {
      return
    }

    previaRetomadaLote.value = null
    assinaturaPreviaRetomadaLote.value = ''
    erroRetomadaLote.value = obterMensagemErro(error, 'Não foi possível consultar a prévia da retomada.')
  } finally {
    if (sequenciaAtual === sequenciaPreviaRetomadaLote.value) {
      carregandoPreviaRetomadaLote.value = false
      previsaoRetomadaLotePendente.value = false
    }
  }
}

async function confirmarCancelamentoLote() {
  if (!modalCancelamentoLoteAberto.value || processandoCancelamentoLote.value) {
    return
  }

  const bloqueioConfirmacao = mensagemBloqueioConfirmacaoCancelamentoLote.value
  if (bloqueioConfirmacao) {
    erroCancelamentoLote.value = bloqueioConfirmacao
    return
  }

  if (assinaturaCancelamentoLote(montarPayloadCancelamentoLote()) !== assinaturaPreviaCancelamentoLote.value) {
    erroCancelamentoLote.value = 'As seleções foram alteradas. Consulte uma nova prévia antes de confirmar.'
    previaCancelamentoLote.value = null
    assinaturaPreviaCancelamentoLote.value = ''
    return
  }

  const payload = montarPayloadCancelamentoLote({ incluirMotivo: true })
  const quantidadeCancelavel = normalizarNumero(previaCancelamentoLote.value?.quantidadeCancelavel, 0)

  try {
    processandoCancelamentoLote.value = true
    erroCancelamentoLote.value = ''
    const resposta = await cancelarAulasGestaoEsportivaEmLote(payload)
    const resultado = resposta && typeof resposta === 'object' ? resposta : {}
    const quantidadeCancelada = obterNumeroDeCampo([resultado], ['quantidadeCancelada', 'totalCancelada', 'canceladas'], quantidadeCancelavel)
    const quantidadeJaCancelada = obterNumeroDeCampo(
      [resultado],
      ['quantidadeJaCancelada', 'totalJaCancelada', 'jaCanceladas'],
      normalizarNumero(previaCancelamentoLote.value?.quantidadeJaCancelada, 0),
    )
    const mensagemSucesso = [
      formatarMensagemQuantidade(quantidadeCancelada, 'aula cancelada com sucesso.', 'aulas canceladas com sucesso.'),
      quantidadeJaCancelada > 0
        ? formatarMensagemQuantidade(quantidadeJaCancelada, 'já estava cancelada.', 'já estavam canceladas.')
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    fecharModalCancelamentoLote(true)
    definirFeedback(mensagemSucesso, 'sucesso')
    await carregarListaAulas()
  } catch (error) {
    erroCancelamentoLote.value = obterMensagemErro(error, 'Não foi possível concluir o cancelamento em lote.')
  } finally {
    processandoCancelamentoLote.value = false
  }
}

async function confirmarRetomadaLote() {
  if (!modalRetomadaLoteAberto.value || processandoRetomadaLote.value) {
    return
  }

  const bloqueioConfirmacao = mensagemBloqueioConfirmacaoRetomadaLote.value
  if (bloqueioConfirmacao) {
    erroRetomadaLote.value = bloqueioConfirmacao
    return
  }

  if (assinaturaRetomadaLote(montarPayloadRetomadaLote()) !== assinaturaPreviaRetomadaLote.value) {
    erroRetomadaLote.value = 'As seleções foram alteradas. Consulte uma nova prévia antes de confirmar.'
    previaRetomadaLote.value = null
    assinaturaPreviaRetomadaLote.value = ''
    return
  }

  const payload = montarPayloadRetomadaLote()
  const quantidadeReversivel = normalizarNumero(previaRetomadaLote.value?.quantidadeReversivel, 0)

  try {
    processandoRetomadaLote.value = true
    erroRetomadaLote.value = ''
    const resposta = await reverterAulasGestaoEsportivaEmLote(payload)
    const resultado = resposta && typeof resposta === 'object' ? resposta : {}
    const quantidadeRevertida = obterNumeroDeCampo(
      [resultado],
      ['quantidadeRevertida', 'quantidadeRetomada', 'totalRevertida', 'totalRetomada', 'revertidas', 'retomadas'],
      quantidadeReversivel,
    )
    const quantidadeJaAtiva = obterNumeroDeCampo(
      [resultado],
      ['quantidadeJaAtiva', 'totalJaAtiva', 'jaAtivas'],
      normalizarNumero(previaRetomadaLote.value?.quantidadeJaAtiva, 0),
    )
    const mensagemSucesso = [
      formatarMensagemQuantidade(quantidadeRevertida, 'aula retomada com sucesso.', 'aulas retomadas com sucesso.'),
      quantidadeJaAtiva > 0
        ? formatarMensagemQuantidade(quantidadeJaAtiva, 'já estava ativa.', 'já estavam ativas.')
        : '',
    ]
      .filter(Boolean)
      .join(' ')

    fecharModalRetomadaLote(true)
    definirFeedback(mensagemSucesso, 'sucesso')
    await carregarListaAulas()
  } catch (error) {
    erroRetomadaLote.value = obterMensagemErro(error, 'Não foi possível concluir a retomada em lote.')
  } finally {
    processandoRetomadaLote.value = false
  }
}

function selecionarTodasAulasCancelamentoLote() {
  cancelamentoLote.value.aulaIds = aulasSelecionaveisCancelamentoLote.value.map((aula) => aula.id)
}

function limparSelecaoAulasCancelamentoLote() {
  cancelamentoLote.value.aulaIds = []
}

function alternarEscopoCancelamentoLote(novoEscopo) {
  cancelamentoLote.value.escopo = String(novoEscopo || '').trim().toUpperCase()
  if (previaCancelamentoLote.value) {
    limparPreviaCancelamentoLote('As seleções foram alteradas. Consulte uma nova prévia.')
  }
}

function selecionarTodasAulasRetomadaLote() {
  retomadaLote.value.aulaIds = aulasSelecionaveisRetomadaLote.value.map((aula) => aula.id)
}

function limparSelecaoAulasRetomadaLote() {
  retomadaLote.value.aulaIds = []
}

function alternarEscopoRetomadaLote(novoEscopo) {
  retomadaLote.value.escopo = String(novoEscopo || '').trim().toUpperCase()
  if (previaRetomadaLote.value) {
    limparPreviaRetomadaLote('As seleções foram alteradas. Consulte uma nova prévia.')
  }
}

function aplicarEstadoDaQueryNaTela() {
  const query = route.query || {}

  filtros.value = {
    dataInicial: String(valorRota(query.dataInicial) || criarDataISO(0)).trim() || criarDataISO(0),
    dataFinal: String(valorRota(query.dataFinal) || criarDataISO(0)).trim() || criarDataISO(0),
    turmaId: String(valorRota(query.turmaId) || '').trim(),
    professorId: String(valorRota(query.professorId) || '').trim(),
    nivel: String(valorRota(query.nivel) || '').trim().toUpperCase(),
    situacao: String(valorRota(query.situacao) || '').trim().toUpperCase(),
  }

  paginaAtual.value = normalizarPagina(valorRota(query.pagina))
  itensPorPagina.value = normalizarQuantidadePorPagina(valorRota(query.itensPorPagina))
}

function trocarPagina(valor) {
  const novaPagina = Math.min(Math.max(1, normalizarPagina(valor)), totalPaginas.value)
  if (novaPagina === paginaAtual.value) {
    return
  }

  paginaAtual.value = novaPagina
  atualizarQueryListaAulas()
}

function irParaPaginaAnterior() {
  if (!podeIrAnterior.value) {
    return
  }

  trocarPagina(paginaAtualExibida.value - 1)
}

function irParaProximaPagina() {
  if (!podeIrProxima.value) {
    return
  }

  trocarPagina(paginaAtualExibida.value + 1)
}

function alterarItensPorPagina(evento) {
  const novoValor = normalizarQuantidadePorPagina(evento?.target?.value)
  if (novoValor === itensPorPagina.value) {
    return
  }

  itensPorPagina.value = novoValor
  paginaAtual.value = 1
  atualizarQueryListaAulas()
}

function validarPeriodo(dataInicial, dataFinal) {
  if (!dataInicial || !dataFinal) {
    return 'Informe a data inicial e a data final.'
  }

  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataInicial) || !/^\d{4}-\d{2}-\d{2}$/.test(dataFinal)) {
    return 'Informe datas válidas no formato YYYY-MM-DD.'
  }

  if (dataFinal < dataInicial) {
    return 'A data final deve ser igual ou posterior à data inicial.'
  }

  return ''
}

function normalizarResultadoGeracao(resposta) {
  if (Array.isArray(resposta)) {
    return {
      criadas: resposta.length,
      existentes: 0,
    }
  }

  const criadas = obterNumeroDeCampo(
    [resposta, resposta?.dados, resposta?.resultado],
    ['quantidadeCriada', 'quantidadeCriadas', 'criados', 'quantidadeNova', 'novasAulas', 'aulasCriadas'],
    0,
  )
  const existentes = obterNumeroDeCampo(
    [resposta, resposta?.dados, resposta?.resultado],
    ['quantidadeJaExistente', 'quantidadeJaExistentes', 'jaExistentes', 'existentes', 'aulasExistentes'],
    0,
  )

  return {
    criadas,
    existentes,
  }
}

function validarLancamentos() {
  for (const participante of participantesEdicao.value) {
    const situacao = normalizarSituacaoFrequencia(participante.situacao)
    participante.situacao = situacao

    if (situacao === 'FALTA_JUSTIFICADA' && !normalizarTextoOpcional(participante.justificativa)) {
      return {
        mensagem: `Informe a justificativa de ${participante.clienteNome}.`,
        participanteId: participante.clienteId,
      }
    }
  }

  return null
}

function prepararPayloadFrequencias() {
  const mapa = new Map()

  for (const participante of participantesEdicao.value) {
    const situacao = normalizarSituacaoFrequencia(participante.situacao)
    if (!STATUS_FREQUENCIA_PERSISTIVEIS.has(situacao)) {
      continue
    }

    if (mapa.has(participante.clienteId)) {
      continue
    }

    mapa.set(participante.clienteId, {
      clienteId: participante.clienteId,
      situacao,
      justificativa: situacao === 'FALTA_JUSTIFICADA' ? normalizarTextoOpcional(participante.justificativa) || null : null,
      observacao: normalizarTextoOpcional(participante.observacao) || null,
      tipoParticipacao: normalizarTipoParticipacao(participante.tipoParticipacao),
    })
  }

  return [...mapa.values()]
}

function aplicarSituacaoParticipante(participante) {
  const situacao = normalizarSituacaoFrequencia(participante.situacao)
  if (situacao !== 'FALTA_JUSTIFICADA') {
    participante.justificativa = ''
  }
}

function montarQueryListaAulas() {
  const query = { ...route.query }
  delete query.aulaId

  return {
    ...query,
    dataInicial: filtros.value.dataInicial,
    dataFinal: filtros.value.dataFinal,
    turmaId: filtros.value.turmaId || undefined,
    professorId: filtros.value.professorId || undefined,
    nivel: filtros.value.nivel || undefined,
    situacao: filtros.value.situacao || undefined,
    pagina: String(paginaAtual.value),
    itensPorPagina: String(itensPorPagina.value),
  }
}

function atualizarQueryListaAulas() {
  router.replace({
    name: 'aulas-frequencia',
    query: montarQueryListaAulas(),
  })
}

function selecionarAula(item = {}) {
  const aulaId = normalizarIdPositivo(item.id)
  if (!aulaId) {
    return
  }

  router.push({
    name: 'aulas-frequencia-detalhe',
    params: {
      aulaId: String(aulaId),
    },
    query: montarQueryListaAulas(),
  })
}

async function carregarTurmasEProfessores() {
  carregandoBases.value = true

  try {
    const [turmasResposta, professoresResposta] = await Promise.all([
      buscarTurmasBeachTennis(),
      buscarFuncionarios(),
    ])

    turmas.value = (Array.isArray(turmasResposta) ? turmasResposta : [])
      .map((item) => normalizarTurmaOpcao(item))
      .filter(Boolean)

    professores.value = (Array.isArray(professoresResposta) ? professoresResposta : [])
      .map((item) => normalizarProfessorOpcao(item))
      .filter(Boolean)
  } catch (error) {
    console.error(error)
    turmas.value = []
    professores.value = []
  } finally {
    carregandoBases.value = false
  }
}

async function carregarListaAulas() {
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    limparLista()
    carregandoLista.value = false
    return true
  }

  const sequenciaAtual = sequenciaLista.value + 1
  sequenciaLista.value = sequenciaAtual
  carregandoLista.value = true
  erroLista.value = ''

  try {
    const resposta = await buscarAulasGestaoEsportiva(montarFiltrosConsulta())
    if (sequenciaAtual !== sequenciaLista.value) {
      return
    }

    const listaNormalizada = (Array.isArray(resposta) ? resposta : [])
      .map((item) => normalizarAulaLista(item))
      .filter(Boolean)

    aulas.value = listaNormalizada
  } catch (error) {
    if (sequenciaAtual !== sequenciaLista.value) {
      return false
    }

    aulas.value = []
    erroLista.value = obterMensagemErro(error, 'Não foi possível carregar as aulas.')
    return false
  } finally {
    if (sequenciaAtual === sequenciaLista.value) {
      carregandoLista.value = false
    }
  }

  return true
}

async function carregarDetalheAula(aulaId) {
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    limparDetalhe()
    carregandoDetalhe.value = false
    return
  }

  const id = normalizarIdPositivo(aulaId)
  if (!id) {
    limparDetalhe()
    carregandoDetalhe.value = false
    erroDetalhe.value = ''
    return
  }

  const sequenciaAtual = sequenciaDetalhe.value + 1
  sequenciaDetalhe.value = sequenciaAtual
  carregandoDetalhe.value = true
  erroDetalhe.value = ''
  aulaDetalhe.value = null
  participantesEdicao.value = []

  try {
    const resposta = await buscarAulaGestaoEsportiva(id)
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    const detalheNormalizado = normalizarAulaDetalhe(resposta || {})
    aulaDetalhe.value = detalheNormalizado
    participantesEdicao.value = detalheNormalizado.participantes.map((participante) => ({ ...participante }))
  } catch (error) {
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    limparDetalhe()
    erroDetalhe.value = obterMensagemErro(error, 'Não foi possível carregar os detalhes da aula.')
  } finally {
    if (sequenciaAtual === sequenciaDetalhe.value) {
      carregandoDetalhe.value = false
    }
  }
}

async function aplicarFiltros() {
  limparFeedback()
  paginaAtual.value = 1
  atualizarQueryListaAulas()
  const carregou = await carregarListaAulas()
  if (carregou) {
    definirFeedback('Filtros aplicados com sucesso.', 'sucesso')
  }
}

function limparFiltros() {
  filtros.value = criarFiltrosPadrao()
  paginaAtual.value = 1
  limparFeedback()
  atualizarQueryListaAulas()
  carregarListaAulas().catch((error) => {
    erroLista.value = obterMensagemErro(error, 'Não foi possível carregar as aulas.')
  })
}

async function gerarAulas() {
  if (!podeGerarAulas.value) {
    return
  }

  const erroPeriodo = validarPeriodo(geracao.value.dataInicial, geracao.value.dataFinal)
  if (erroPeriodo) {
    definirFeedback(erroPeriodo, 'erro')
    return
  }

  try {
    gerandoAulas.value = true
    limparFeedback()

    const resposta = await gerarAulasGestaoEsportiva(montarPayloadGeracao())
    const resultado = normalizarResultadoGeracao(resposta)
    resultadoGeracao.value = resultado

    if (resultado.criadas > 0) {
      definirFeedback(
        resultado.existentes > 0
          ? `${resultado.criadas} aula(s) criada(s) e ${resultado.existentes} já existiam.`
          : `${resultado.criadas} aula(s) criada(s) com sucesso.`,
        'sucesso',
      )
    } else {
      definirFeedback(
        resultado.existentes > 0
          ? `Nenhuma aula nova foi criada. ${resultado.existentes} já existiam.`
          : 'Nenhuma aula nova foi criada.',
        'info',
      )
    }

    await carregarListaAulas()
    atualizarQueryListaAulas()
  } catch (error) {
    definirFeedback(obterMensagemErro(error, 'Não foi possível gerar as aulas.'), 'erro')
  } finally {
    gerandoAulas.value = false
  }
}

async function salvarFrequencias() {
  if (!aulaDetalhe.value?.id) {
    return
  }

  if (aulaCancelada.value) {
    definirFeedback('Esta aula está cancelada e não permite alteração de frequência.', 'aviso')
    return
  }

  const validacao = validarLancamentos()
  if (validacao) {
    definirFeedback(validacao.mensagem, 'erro')
    await nextTick()
    const campo = document.querySelector(
      `[data-participante-id="${validacao.participanteId}"] [data-campo="justificativa"]`,
    )
    if (campo && typeof campo.focus === 'function') {
      campo.focus()
    }
    return
  }

  const payload = prepararPayloadFrequencias()
  const quantidadeLancamentos = payload.length
  if (!payload.length) {
    definirFeedback('Nenhuma alteração pendente.', 'info')
    return
  }

  try {
    salvandoFrequencias.value = true
    limparFeedback()
    await salvarFrequenciasAulaGestaoEsportiva(aulaDetalhe.value.id, payload)
    definirFeedback(
      formatarMensagemQuantidade(
        quantidadeLancamentos,
        'lançamento salvo com sucesso.',
        'lançamentos salvos com sucesso.',
      ),
      'sucesso',
    )
    await carregarDetalheAula(aulaSelecionadaId.value)
    await carregarListaAulas()
  } catch (error) {
    definirFeedback(obterMensagemErro(error, 'Não foi possível salvar a frequência.'), 'erro')
  } finally {
    salvandoFrequencias.value = false
  }
}

async function recarregarTudo() {
  limparFeedback()
  await carregarTurmasEProfessores()
  await carregarListaAulas()
}

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  await carregarTudo()
}

async function carregarTudo() {
  aplicarEstadoDaQueryNaTela()
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()

  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    aulas.value = []
    aulaDetalhe.value = null
    participantesEdicao.value = []
    carregandoLista.value = false
    carregandoDetalhe.value = false
    erroLista.value = ''
    erroDetalhe.value = ''
    return
  }

  const aulaIdCompat = normalizarIdPositivo(valorRota(route.query.aulaId))
  if (aulaIdCompat) {
    await router.replace({
      name: 'aulas-frequencia-detalhe',
      params: {
        aulaId: String(aulaIdCompat),
      },
      query: montarQueryListaAulas(),
    })
    return
  }

  carregandoLista.value = true
  await Promise.all([carregarTurmasEProfessores(), carregarListaAulas()])
}

watch(totalPaginas, (novoTotal) => {
  if (paginaAtual.value > novoTotal) {
    paginaAtual.value = novoTotal
    atualizarQueryListaAulas()
  }
})

watch(assinaturaBuscaAulasEspecificasCancelamentoLote, (novaAssinatura, assinaturaAnterior) => {
  if (!modalCancelamentoLoteAberto.value) {
    limparAulasEspecificasCancelamentoLote()
    return
  }

  if (escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS') {
    limparAulasEspecificasCancelamentoLote()
    return
  }

  if (!novaAssinatura) {
    limparAulasEspecificasCancelamentoLote()
    cancelamentoLote.value.aulaIds = []
    redefinirEstadoPreviaCancelamentoLote()
    return
  }

  if (novaAssinatura === assinaturaAnterior) {
    return
  }

  cancelamentoLote.value.aulaIds = []
  redefinirEstadoPreviaCancelamentoLote()
  agendarConsultaAulasEspecificasCancelamentoLote()
})

watch(assinaturaBuscaAulasEspecificasRetomadaLote, (novaAssinatura, assinaturaAnterior) => {
  if (!modalRetomadaLoteAberto.value) {
    limparAulasEspecificasRetomadaLote()
    return
  }

  if (escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS') {
    limparAulasEspecificasRetomadaLote()
    return
  }

  if (!novaAssinatura) {
    limparAulasEspecificasRetomadaLote()
    retomadaLote.value.aulaIds = []
    redefinirEstadoPreviaRetomadaLote()
    return
  }

  if (novaAssinatura === assinaturaAnterior) {
    return
  }

  retomadaLote.value.aulaIds = []
  redefinirEstadoPreviaRetomadaLote()
  agendarConsultaAulasEspecificasRetomadaLote()
})

watch(assinaturaGatilhoPreviaCancelamentoLote, (novaAssinatura, assinaturaAnterior) => {
  if (!modalCancelamentoLoteAberto.value) {
    return
  }

  if (escopoCancelamentoLote.value === 'AULAS_ESPECIFICAS') {
    const temSelecao = normalizarIdsSelecionados(cancelamentoLote.value.aulaIds).length > 0
    if (!temSelecao) {
      cancelarAgendamentoPreviaCancelamentoLote()
      previsaoCancelamentoLotePendente.value = false
      carregandoPreviaCancelamentoLote.value = false
      previaCancelamentoLote.value = null
      assinaturaPreviaCancelamentoLote.value = ''
      return
    }

    if (carregandoAulasEspecificasCancelamentoLote.value) {
      return
    }

    if (novaAssinatura !== assinaturaPreviaCancelamentoLote.value || !previaCancelamentoLote.value) {
      agendarConsultaPreviaCancelamentoLote()
    }

    return
  }

  if (novaAssinatura !== assinaturaAnterior || !previaCancelamentoLote.value) {
    agendarConsultaPreviaCancelamentoLote()
  }
})

watch(assinaturaGatilhoPreviaRetomadaLote, (novaAssinatura, assinaturaAnterior) => {
  if (!modalRetomadaLoteAberto.value) {
    return
  }

  if (escopoRetomadaLote.value === 'AULAS_ESPECIFICAS') {
    const temSelecao = normalizarIdsSelecionados(retomadaLote.value.aulaIds).length > 0
    if (!temSelecao) {
      cancelarAgendamentoPreviaRetomadaLote()
      previsaoRetomadaLotePendente.value = false
      carregandoPreviaRetomadaLote.value = false
      previaRetomadaLote.value = null
      assinaturaPreviaRetomadaLote.value = ''
      return
    }

    if (carregandoAulasEspecificasRetomadaLote.value) {
      return
    }

    if (novaAssinatura !== assinaturaPreviaRetomadaLote.value || !previaRetomadaLote.value) {
      agendarConsultaPreviaRetomadaLote()
    }

    return
  }

  if (novaAssinatura !== assinaturaAnterior || !previaRetomadaLote.value) {
    agendarConsultaPreviaRetomadaLote()
  }
})

watch(modalCancelamentoLoteAberto, (aberto) => {
  if (aberto) {
    if (escopoCancelamentoLote.value !== 'AULAS_ESPECIFICAS') {
      agendarConsultaPreviaCancelamentoLote()
    }
    return
  }

  cancelarAgendamentoPreviaCancelamentoLote()
  previsaoCancelamentoLotePendente.value = false
  limparAulasEspecificasCancelamentoLote()
})

watch(modalRetomadaLoteAberto, (aberto) => {
  if (aberto) {
    if (escopoRetomadaLote.value !== 'AULAS_ESPECIFICAS') {
      agendarConsultaPreviaRetomadaLote()
    }
    return
  }

  cancelarAgendamentoPreviaRetomadaLote()
  previsaoRetomadaLotePendente.value = false
  limparAulasEspecificasRetomadaLote()
})

onMounted(() => {
  carregarTudo().catch((error) => {
    console.error(error)
    erroLista.value = obterMensagemErro(error, 'Não foi possível carregar os dados da tela.')
  })
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  cancelarAgendamentoPreviaCancelamentoLote()
  cancelarAgendamentoPreviaRetomadaLote()
  cancelarAgendamentoAulasEspecificasCancelamentoLote()
  cancelarAgendamentoAulasEspecificasRetomadaLote()
  sequenciaPreviaCancelamentoLote.value += 1
  sequenciaPreviaRetomadaLote.value += 1
  sequenciaAulasEspecificasCancelamentoLote.value += 1
  sequenciaAulasEspecificasRetomadaLote.value += 1
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina aulas">
      <div>
        <p class="subtitulo">Gestão Esportiva</p>
        <h1>Aulas e frequência</h1>
        <p class="descricao">
          Consulte as aulas geradas, filtre o período desejado e lance a frequência dos participantes com segurança.
        </p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao principal" type="button" :disabled="!podeGerarAulas" @click="gerarAulas">
          {{ gerandoAulas ? 'Gerando...' : 'Gerar aulas' }}
        </button>
        <button class="botao secundario" type="button" :disabled="carregandoLista || gerandoAulas || salvandoFrequencias" @click="carregarListaAulas">
          {{ carregandoLista ? 'Atualizando...' : 'Atualizar lista' }}
        </button>
      </div>
    </header>

    <section v-if="feedback" class="feedback" :class="tipoFeedback">
      <p>{{ feedback }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso">
      <p>Selecione uma empresa no seletor superior para consultar e lançar as aulas como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloAtivo" class="card aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <template v-else>
      <section class="grade-superior">
        <article class="card painel">
          <div class="titulo-card">
            <div>
              <p class="subtitulo-mini">Filtros</p>
              <h2>Localize as aulas</h2>
            </div>
            <span class="contador">{{ aulasOrdenadas.length }} aula(s)</span>
          </div>

          <div class="campos-filtros">
            <label>
              Data inicial
              <input v-model="filtros.dataInicial" type="date" />
            </label>

            <label>
              Data final
              <input v-model="filtros.dataFinal" type="date" />
            </label>

            <label>
              Turma
              <select v-model="filtros.turmaId">
                <option value="">Todas</option>
                <option v-for="turma in turmasOrdenadas" :key="turma.id" :value="String(turma.id)">
                  {{ turma.nome }}
                  <template v-if="rotuloNivelBeachTennis(turma.nivel)"> - {{ rotuloNivelBeachTennis(turma.nivel) }}</template>
                </option>
              </select>
            </label>

            <label>
              Professor
              <select v-model="filtros.professorId">
                <option value="">Todos</option>
                <option v-for="professor in professoresOrdenados" :key="professor.id" :value="String(professor.id)">
                  {{ professor.nome }}
                </option>
              </select>
            </label>

            <label>
              Nível
              <select v-model="filtros.nivel">
                <option value="">Todos</option>
                <option v-for="opcao in ['INICIANTE', 'INTERMEDIARIO', 'AVANCADO']" :key="opcao" :value="opcao">
                  {{ rotuloNivelBeachTennis(opcao) }}
                </option>
              </select>
            </label>

            <label>
              Situação da aula
              <select v-model="filtros.situacao">
                <option v-for="opcao in OPCOES_SITUACAO_AULA" :key="opcao.valor || 'todas'" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>
          </div>

          <div class="acoes-card">
            <button class="botao secundario" type="button" @click="aplicarFiltros">Aplicar filtros</button>
            <button class="botao secundario" type="button" @click="limparFiltros">Limpar filtros</button>
          </div>
        </article>

        <article class="card painel">
          <div class="titulo-card">
            <div>
              <p class="subtitulo-mini">Geração</p>
              <h2>Gerar aulas em lote</h2>
            </div>
            <span class="contador">Automático</span>
          </div>

          <div class="campos-filtros">
            <label>
              Data inicial
              <input v-model="geracao.dataInicial" type="date" />
            </label>

            <label>
              Data final
              <input v-model="geracao.dataFinal" type="date" />
            </label>

            <label>
              Turma opcional
              <select v-model="geracao.turmaId" :disabled="carregandoBases">
                <option value="">Todas as turmas</option>
                <option v-for="turma in turmasOrdenadas" :key="turma.id" :value="String(turma.id)">
                  {{ turma.nome }}
                </option>
              </select>
            </label>
          </div>

          <p class="ajuda-campo">
            Use o botão <strong>Gerar aulas</strong> no topo para criar aulas no período selecionado. Aulas já
            existentes não geram erro.
          </p>

          <div v-if="resultadoGeracao" class="resumo-geracao">
            <div>
              <span>Criadas</span>
              <strong>{{ resultadoGeracao.criadas }}</strong>
            </div>
            <div>
              <span>Já existentes</span>
              <strong>{{ resultadoGeracao.existentes }}</strong>
            </div>
          </div>
        </article>
      </section>

      <section class="lista-aulas-section">
        <article class="card lista-aulas-card">
          <div class="titulo-card">
            <div>
              <p class="subtitulo-mini">Lista</p>
              <h2>Aulas encontradas</h2>
              <p class="descricao-card">Clique em uma aula para abrir o detalhe e lançar a frequência.</p>
            </div>
            <div class="titulo-card-lado">
              <div class="acoes-cabecalho acoes-cabecalho-lista">
                <button
                  id="btn-cancelar-aulas-lote"
                  data-testid="cancelar-aulas-lote"
                  class="botao perigo"
                  type="button"
                  :disabled="carregandoLista || carregandoBases || gerandoAulas || salvandoFrequencias || carregandoPreviaCancelamentoLote || processandoCancelamentoLote || carregandoPreviaRetomadaLote || processandoRetomadaLote"
                  @click="abrirModalCancelamentoLote"
                >
                  Cancelar aulas em lote
                </button>
                <button
                  id="btn-retomar-aulas-lote"
                  data-testid="retomar-aulas-lote"
                  class="botao secundario"
                  type="button"
                  :disabled="carregandoLista || carregandoBases || gerandoAulas || salvandoFrequencias || carregandoPreviaCancelamentoLote || processandoCancelamentoLote || carregandoPreviaRetomadaLote || processandoRetomadaLote"
                  @click="abrirModalRetomadaLote"
                >
                  Retomar aulas em lote
                </button>
              </div>
              <span class="contador">{{ totalAulas }} aula(s)</span>
            </div>
          </div>

          <section v-if="carregandoLista && !temAulas" class="estado-vazio">
            <p>Carregando aulas...</p>
          </section>

          <section v-else-if="erroLista" class="estado-erro">
            <p>{{ erroLista }}</p>
          </section>

          <section v-else-if="!temAulas" class="estado-vazio">
            <p>Nenhuma aula encontrada para os filtros informados.</p>
          </section>

          <template v-else>
            <div class="paginacao-superior">
              <div class="paginacao-info">
                <p><strong>{{ totalAulas }}</strong> aula(s) no total</p>
                <p>Página {{ paginaAtualExibida }} de {{ totalPaginas }}</p>
                <p>Exibindo {{ intervaloExibido }}</p>
              </div>

              <div class="paginacao-controles">
                <label class="seletor-paginacao">
                  Itens por página
                  <select :value="String(itensPorPagina)" @change="alterarItensPorPagina">
                    <option v-for="opcao in OPCOES_ITENS_POR_PAGINA" :key="opcao" :value="String(opcao)">
                      {{ opcao }}
                    </option>
                  </select>
                </label>

                <div class="acoes-card">
                  <button class="botao secundario" type="button" :disabled="!podeIrAnterior" @click="irParaPaginaAnterior">
                    Anterior
                  </button>
                  <button class="botao secundario" type="button" :disabled="!podeIrProxima" @click="irParaProximaPagina">
                    Próxima
                  </button>
                </div>
              </div>
            </div>

            <div class="lista-aulas">
              <button
                v-for="aula in aulasPaginadas"
                :key="aula.id"
                class="aula-card"
                type="button"
                @click="selecionarAula(aula)"
              >
                <div class="aula-card-topo">
                  <div>
                    <p class="aula-data">{{ formatarDataBrasileira(aula.dataAula) || 'Data não informada' }}</p>
                    <h3>{{ aula.turmaNome || `Aula ${aula.id}` }}</h3>
                    <p class="aula-horario">
                      {{ formatarHorario(aula.horarioInicio) }} · {{ formatarDuracaoMinutos(aula.duracaoMinutos) }}
                    </p>
                  </div>
                </div>

                <div class="chips-aula">
                  <span v-if="rotuloNivelBeachTennis(aula.nivel)" class="chip">{{ rotuloNivelBeachTennis(aula.nivel) }}</span>
                  <span v-if="aula.competicao" class="chip competicao">{{ rotuloCompeticaoBeachTennis(true) }}</span>
                  <span v-else class="chip sutileza">Sem competição</span>
                  <span class="chip situacao" :class="estadoSituacaoAula(aula.situacao)">
                    {{ rotuloSituacaoAula(aula.situacao) }}
                  </span>
                </div>

                <p v-if="aula.situacao === 'CANCELADA' && aula.motivoCancelamento" class="motivo-cancelamento">
                  <strong>Motivo:</strong> {{ aula.motivoCancelamento }}
                </p>

                <div class="resumo-aula">
                  <div><span>Participantes</span><strong>{{ aula.quantidadeParticipantes }}</strong></div>
                  <div><span>Presentes</span><strong>{{ aula.presentes }}</strong></div>
                  <div><span>Faltas justificadas</span><strong>{{ aula.faltasJustificadas }}</strong></div>
                  <div><span>Faltas sem justificativa</span><strong>{{ aula.faltasSemJustificativa }}</strong></div>
                  <div><span>Não lançados</span><strong>{{ aula.naoLancados }}</strong></div>
                </div>

                <div class="rodape-aula">
                  <p>
                    <strong>Professor:</strong>
                    {{ aula.professorNome || '-' }}
                  </p>
                  <span class="botao-link">
                    {{ rotuloAcaoAula(aula) }}
                  </span>
                </div>
              </button>
            </div>

            <div class="paginacao-rodape">
              <div class="paginacao-info">
                <p><strong>{{ totalAulas }}</strong> aula(s) no total</p>
                <p>Página {{ paginaAtualExibida }} de {{ totalPaginas }}</p>
                <p>Exibindo {{ intervaloExibido }}</p>
              </div>

              <div class="acoes-card">
                <button class="botao secundario" type="button" :disabled="!podeIrAnterior" @click="irParaPaginaAnterior">
                  Anterior
                </button>
                <button class="botao secundario" type="button" :disabled="!podeIrProxima" @click="irParaProximaPagina">
                  Próxima
                </button>
              </div>
            </div>
          </template>
        </article>
      </section>

      <section v-if="modalCancelamentoLoteAberto" class="modal-fundo" @click.self="fecharModalCancelamentoLote">
        <form class="card modal modal-lote modal-lote-painel" @submit.prevent="confirmarCancelamentoLote">
          <div class="cabecalho-card">
            <div>
              <p class="subtitulo-mini">Cancelamento em lote</p>
              <h2>Cancelar aulas em lote</h2>
              <p class="descricao-card">Consulte a prévia antes de confirmar e informe o motivo do cancelamento.</p>
            </div>

            <button
              type="button"
              class="botao secundario"
              :disabled="carregandoPreviaCancelamentoLote || processandoCancelamentoLote"
              @click="fecharModalCancelamentoLote"
            >
              Fechar
            </button>
          </div>

          <fieldset class="modal-lote-campo" :disabled="carregandoPreviaCancelamentoLote || processandoCancelamentoLote">
            <div class="modal-lote-corpo">
              <div class="lote-grid">
                <div class="lote-formulario">
                  <div class="campos-lote">
                    <label>
                      Escopo
                      <select v-model="cancelamentoLote.escopo">
                        <option v-for="opcao in OPCOES_ESCOPO_CANCELAMENTO_LOTE" :key="opcao.valor" :value="opcao.valor">
                          {{ opcao.rotulo }}
                        </option>
                      </select>
                    </label>

                    <label>
                      Data
                      <input v-model="cancelamentoLote.data" type="date" />
                    </label>

                    <label>
                      Professor, opcional
                      <select v-model="cancelamentoLote.professorId">
                        <option value="">Todos os professores</option>
                        <option v-for="professor in professoresSelecionaveisCancelamentoLote" :key="professor.id" :value="String(professor.id)">
                          {{ professor.nome }}
                        </option>
                      </select>
                    </label>

                    <label v-if="escopoCancelamentoLote === 'PERIODO_DA_DATA'">
                      Período
                      <select v-model="cancelamentoLote.periodo">
                        <option v-for="opcao in OPCOES_PERIODO_CANCELAMENTO_LOTE" :key="opcao.valor" :value="opcao.valor">
                          {{ opcao.rotulo }}
                        </option>
                        </select>
                        <small class="ajuda-campo">Manhã: antes de 12h. Tarde: de 12h até antes de 18h. Noite: a partir de 18h.</small>
                      </label>
                    </div>

                    <section class="bloco-selecao">
                      <div class="secao-cabecalho">
                        <div>
                          <h3>Motivo</h3>
                          <p>O motivo é obrigatório na confirmação final.</p>
                        </div>
                      </div>

                      <label class="campo-grande">
                        Motivo do cancelamento
                        <textarea
                          v-model="cancelamentoLote.motivo"
                          rows="4"
                          placeholder="Ex.: Chuva intensa durante a manhã"
                        ></textarea>
                      </label>
                    </section>

                    <section v-if="escopoCancelamentoLote === 'AULAS_ESPECIFICAS'" class="bloco-selecao">
                      <div class="secao-cabecalho">
                        <div>
                          <h3>Aulas específicas</h3>
                          <p>Carregue as aulas da data e selecione uma ou mais opções.</p>
                        </div>
                        <div class="acoes-mini">
                          <button type="button" class="botao secundario compacto" @click="selecionarTodasAulasCancelamentoLote">
                            Selecionar todas
                        </button>
                        <button type="button" class="botao secundario compacto" @click="limparSelecaoAulasCancelamentoLote">
                          Limpar
                        </button>
                      </div>
                      </div>

                      <div v-if="carregandoAulasEspecificasCancelamentoLote" class="estado-vazio estado-vazio-compacto">
                        <p>Carregando aulas da data...</p>
                      </div>

                      <div v-else-if="erroAulasEspecificasCancelamentoLote" class="estado-erro">
                        <p>{{ erroAulasEspecificasCancelamentoLote }}</p>
                      </div>

                      <div
                        v-else-if="
                          aulasEspecificasCancelamentoLoteCarregadas && !aulasSelecionaveisCancelamentoLote.length
                        "
                        class="estado-vazio estado-vazio-compacto"
                      >
                        <p>Nenhuma aula foi encontrada para a data selecionada.</p>
                      </div>

                      <div v-else-if="!aulasSelecionaveisCancelamentoLote.length" class="estado-vazio estado-vazio-compacto">
                        <p>Selecione uma data para carregar as aulas.</p>
                      </div>

                      <div v-else class="lista-selecao aulas lista-selecao-rolavel">
                        <label v-for="aula in aulasSelecionaveisCancelamentoLote" :key="aula.id" class="card-selecao">
                          <input v-model="cancelamentoLote.aulaIds" type="checkbox" :value="aula.id" />
                          <div>
                            <strong>{{ formatarDataBrasileira(aula.dataAula) || 'Data não informada' }}</strong>
                            <p>{{ formatarHorario(aula.horarioInicio) }} · {{ aula.turmaNome || `Aula ${aula.id}` }}</p>
                            <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                            <span class="chip situacao" :class="estadoSituacaoAula(aula.situacao)">
                              {{ rotuloSituacaoAula(aula.situacao) }}
                            </span>
                          </div>
                        </label>
                      </div>
                    </section>

                  <section
                    v-if="escopoCancelamentoLote === 'TURMAS_NA_DATA' || escopoCancelamentoLote === 'PERIODO_DA_DATA'"
                    class="bloco-selecao"
                  >
                    <div class="secao-cabecalho">
                      <div>
                        <h3>Turmas</h3>
                        <p>{{ escopoCancelamentoLote === 'TURMAS_NA_DATA' ? 'Selecione as turmas da data.' : 'As turmas são opcionais neste escopo.' }}</p>
                      </div>
                    </div>

                    <div v-if="!turmasSelecionaveisCancelamentoLote.length" class="estado-vazio estado-vazio-compacto">
                      <p>Nenhuma turma encontrada.</p>
                    </div>

                    <div v-else class="lista-selecao turmas">
                      <label v-for="turma in turmasSelecionaveisCancelamentoLote" :key="turma.id" class="card-selecao">
                        <input v-model="cancelamentoLote.turmaIds" type="checkbox" :value="turma.id" />
                        <div>
                          <strong>{{ turma.nome }}</strong>
                          <p>
                            {{ [rotuloNivelBeachTennis(turma.nivel), turma.competicao ? rotuloCompeticaoBeachTennis(true) : ''].filter(Boolean).join(' · ') || 'Turma sem classificação' }}
                          </p>
                        </div>
                      </label>
                    </div>
                  </section>

                  </div>

                <aside class="lote-previa">
                  <div class="secao-cabecalho">
                    <div>
                      <h3>Prévia obrigatória</h3>
                      <p>{{ formatarEscopoCancelamentoLote(cancelamentoLote.escopo) }}</p>
                    </div>
                    <span class="contador">
                      {{
                        carregandoPreviaCancelamentoLote || previsaoCancelamentoLotePendente
                          ? 'Atualizando...'
                          : previewCancelamentoLoteAtualizada
                            ? 'Prévia pronta'
                            : 'Aguardando'
                      }}
                    </span>
                  </div>

                  <p v-if="escopoCancelamentoLote !== 'AULAS_ESPECIFICAS'" class="ajuda-campo ajuda-auto-previa">
                    As aulas correspondentes ao escopo selecionado aparecerão automaticamente na prévia.
                  </p>

                  <p class="ajuda-campo">{{ mensagemPreviewCancelamentoLote }}</p>

                  <p v-if="erroCancelamentoLote" class="estado-erro">{{ erroCancelamentoLote }}</p>

                  <section v-if="carregandoPreviaCancelamentoLote" class="estado-vazio estado-vazio-compacto">
                    <p>Consultando prévia...</p>
                  </section>

                  <template v-else-if="previaCancelamentoLote">
                    <div class="grade-resumo-lote">
                      <article class="mini-card">
                        <span>Encontradas</span>
                        <strong>{{ previaCancelamentoLote.quantidadeEncontrada }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Canceláveis</span>
                        <strong>{{ previaCancelamentoLote.quantidadeCancelavel }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Já canceladas</span>
                        <strong>{{ previaCancelamentoLote.quantidadeJaCancelada }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Bloqueadas</span>
                        <strong>{{ previaCancelamentoLote.quantidadeBloqueada }}</strong>
                      </article>
                    </div>

                    <section v-if="!previaCancelamentoLote.aulas.length" class="estado-vazio estado-vazio-compacto">
                      <p>Nenhuma aula retornou na prévia.</p>
                    </section>

                    <div v-else class="lista-previa">
                      <article v-for="aula in previaCancelamentoLote.aulas" :key="aula.aulaId" class="card-previa">
                        <div class="card-previa-topo">
                          <div>
                            <strong>{{ formatarDataBrasileira(aula.data) || 'Data não informada' }}</strong>
                            <p>{{ [formatarHorario(aula.horario), aula.turmaNome || `Aula ${aula.aulaId}`].filter(Boolean).join(' · ') }}</p>
                          </div>
                          <span class="chip previa-status" :class="classeStatusPreviaCancelamentoLote(aula)">
                            {{ rotuloStatusPreviaCancelamentoLote(aula) }}
                          </span>
                        </div>

                        <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                        <p><strong>Situação:</strong> {{ rotuloSituacaoAula(aula.situacao) }}</p>
                        <p v-if="aula.motivoBloqueio"><strong>Bloqueio:</strong> {{ aula.motivoBloqueio }}</p>
                      </article>
                    </div>
                  </template>

                  <section v-else class="estado-vazio estado-vazio-compacto">
                    <p>Gere a prévia para visualizar os contadores e a lista de aulas encontradas.</p>
                  </section>
                </aside>
              </div>
            </div>
          </fieldset>

          <p v-if="mensagemBloqueioConfirmacaoCancelamentoLote" class="ajuda-campo ajuda-bloqueio-confirmacao">
            {{ mensagemBloqueioConfirmacaoCancelamentoLote }}
          </p>

          <div class="acoes-card acoes-lote modal-lote-rodape">
            <button
              type="button"
              class="botao secundario"
              :disabled="!podeAtualizarPreviaCancelamentoLote"
              @click="agendarConsultaPreviaCancelamentoLote({ forcar: true })"
            >
              {{ carregandoPreviaCancelamentoLote ? 'Atualizando...' : 'Atualizar prévia' }}
            </button>
            <button type="submit" class="botao perigo" :disabled="!podeConfirmarCancelamentoLote">
              {{ processandoCancelamentoLote ? 'Cancelando...' : 'Confirmar cancelamento em lote' }}
            </button>
          </div>
        </form>
      </section>

      <section v-if="modalRetomadaLoteAberto" class="modal-fundo" @click.self="fecharModalRetomadaLote">
        <form class="card modal modal-lote modal-lote-painel" @submit.prevent="confirmarRetomadaLote">
          <div class="cabecalho-card">
            <div>
              <p class="subtitulo-mini">Retomada em lote</p>
              <h2>Retomar aulas em lote</h2>
              <p class="descricao-card">Consulte a prévia antes de confirmar a retomada das aulas canceladas.</p>
            </div>

            <button
              type="button"
              class="botao secundario"
              :disabled="carregandoPreviaRetomadaLote || processandoRetomadaLote"
              @click="fecharModalRetomadaLote"
            >
              Fechar
            </button>
          </div>

          <fieldset class="modal-lote-campo" :disabled="carregandoPreviaRetomadaLote || processandoRetomadaLote">
            <div class="modal-lote-corpo">
              <div class="lote-grid">
                <div class="lote-formulario">
                  <div class="campos-lote">
                    <label>
                      Escopo
                      <select v-model="retomadaLote.escopo">
                        <option v-for="opcao in OPCOES_ESCOPO_CANCELAMENTO_LOTE" :key="opcao.valor" :value="opcao.valor">
                          {{ opcao.rotulo }}
                        </option>
                      </select>
                    </label>

                    <label>
                      Data
                      <input v-model="retomadaLote.data" type="date" />
                    </label>

                    <label>
                      Professor, opcional
                      <select v-model="retomadaLote.professorId">
                        <option value="">Todos os professores</option>
                        <option v-for="professor in professoresSelecionaveisCancelamentoLote" :key="professor.id" :value="String(professor.id)">
                          {{ professor.nome }}
                        </option>
                      </select>
                    </label>

                    <label v-if="escopoRetomadaLote === 'PERIODO_DA_DATA'">
                      Período
                      <select v-model="retomadaLote.periodo">
                        <option v-for="opcao in OPCOES_PERIODO_CANCELAMENTO_LOTE" :key="opcao.valor" :value="opcao.valor">
                          {{ opcao.rotulo }}
                        </option>
                      </select>
                      <small class="ajuda-campo">Manhã: antes de 12h. Tarde: de 12h até antes de 18h. Noite: a partir de 18h.</small>
                    </label>
                  </div>

                  <section v-if="escopoRetomadaLote === 'AULAS_ESPECIFICAS'" class="bloco-selecao">
                    <div class="secao-cabecalho">
                      <div>
                        <h3>Aulas específicas</h3>
                        <p>Carregue as aulas da data e selecione uma ou mais opções.</p>
                      </div>
                      <div class="acoes-mini">
                        <button type="button" class="botao secundario compacto" @click="selecionarTodasAulasRetomadaLote">
                          Selecionar todas
                        </button>
                        <button type="button" class="botao secundario compacto" @click="limparSelecaoAulasRetomadaLote">
                          Limpar
                        </button>
                      </div>
                    </div>

                    <div v-if="carregandoAulasEspecificasRetomadaLote" class="estado-vazio estado-vazio-compacto">
                      <p>Carregando aulas da data...</p>
                    </div>

                    <div v-else-if="erroAulasEspecificasRetomadaLote" class="estado-erro">
                      <p>{{ erroAulasEspecificasRetomadaLote }}</p>
                    </div>

                    <div v-else-if="aulasEspecificasRetomadaLoteCarregadas && !aulasSelecionaveisRetomadaLote.length" class="estado-vazio estado-vazio-compacto">
                      <p>Nenhuma aula foi encontrada para a data selecionada.</p>
                    </div>

                    <div v-else-if="!aulasSelecionaveisRetomadaLote.length" class="estado-vazio estado-vazio-compacto">
                      <p>Selecione uma data para carregar as aulas.</p>
                    </div>

                    <div v-else class="lista-selecao aulas lista-selecao-rolavel">
                      <label v-for="aula in aulasSelecionaveisRetomadaLote" :key="aula.id" class="card-selecao">
                        <input v-model="retomadaLote.aulaIds" type="checkbox" :value="aula.id" />
                        <div>
                          <strong>{{ formatarDataBrasileira(aula.dataAula) || 'Data não informada' }}</strong>
                          <p>{{ formatarHorario(aula.horarioInicio) }} · {{ aula.turmaNome || `Aula ${aula.id}` }}</p>
                          <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                          <span class="chip situacao" :class="estadoSituacaoAula(aula.situacao)">
                            {{ rotuloSituacaoAula(aula.situacao) }}
                          </span>
                        </div>
                      </label>
                    </div>
                  </section>

                  <section
                    v-if="escopoRetomadaLote === 'TURMAS_NA_DATA' || escopoRetomadaLote === 'PERIODO_DA_DATA'"
                    class="bloco-selecao"
                  >
                    <div class="secao-cabecalho">
                      <div>
                        <h3>Turmas</h3>
                        <p>{{ escopoRetomadaLote === 'TURMAS_NA_DATA' ? 'Selecione as turmas da data.' : 'As turmas são opcionais neste escopo.' }}</p>
                      </div>
                    </div>

                    <div v-if="!turmasSelecionaveisCancelamentoLote.length" class="estado-vazio estado-vazio-compacto">
                      <p>Nenhuma turma encontrada.</p>
                    </div>

                    <div v-else class="lista-selecao turmas">
                      <label v-for="turma in turmasSelecionaveisCancelamentoLote" :key="turma.id" class="card-selecao">
                        <input v-model="retomadaLote.turmaIds" type="checkbox" :value="turma.id" />
                        <div>
                          <strong>{{ turma.nome }}</strong>
                          <p>
                            {{ [rotuloNivelBeachTennis(turma.nivel), turma.competicao ? rotuloCompeticaoBeachTennis(true) : ''].filter(Boolean).join(' · ') || 'Turma sem classificação' }}
                          </p>
                        </div>
                      </label>
                    </div>
                  </section>
                </div>

                <aside class="lote-previa">
                  <div class="secao-cabecalho">
                    <div>
                      <h3>Prévia obrigatória</h3>
                      <p>{{ formatarEscopoCancelamentoLote(retomadaLote.escopo) }}</p>
                    </div>
                    <span class="contador">
                      {{
                        carregandoPreviaRetomadaLote || previsaoRetomadaLotePendente
                          ? 'Atualizando...'
                          : previewRetomadaLoteAtualizada
                            ? 'Prévia pronta'
                            : 'Aguardando'
                      }}
                    </span>
                  </div>

                  <p v-if="escopoRetomadaLote !== 'AULAS_ESPECIFICAS'" class="ajuda-campo ajuda-auto-previa">
                    As aulas correspondentes ao escopo selecionado aparecerão automaticamente na prévia.
                  </p>

                  <p class="ajuda-campo">{{ mensagemPreviewRetomadaLote }}</p>

                  <p v-if="erroRetomadaLote" class="estado-erro">{{ erroRetomadaLote }}</p>

                  <section v-if="carregandoPreviaRetomadaLote" class="estado-vazio estado-vazio-compacto">
                    <p>Consultando prévia...</p>
                  </section>

                  <template v-else-if="previaRetomadaLote">
                    <div class="grade-resumo-lote">
                      <article class="mini-card">
                        <span>Encontradas</span>
                        <strong>{{ previaRetomadaLote.quantidadeEncontrada }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Reversíveis</span>
                        <strong>{{ previaRetomadaLote.quantidadeReversivel }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Já ativas</span>
                        <strong>{{ previaRetomadaLote.quantidadeJaAtiva }}</strong>
                      </article>
                      <article class="mini-card">
                        <span>Bloqueadas</span>
                        <strong>{{ previaRetomadaLote.quantidadeBloqueada }}</strong>
                      </article>
                    </div>

                    <section v-if="!previaRetomadaLote.aulas.length" class="estado-vazio estado-vazio-compacto">
                      <p>Nenhuma aula retornou na prévia.</p>
                    </section>

                    <div v-else class="lista-previa">
                      <article v-for="aula in previaRetomadaLote.aulas" :key="aula.aulaId" class="card-previa">
                        <div class="card-previa-topo">
                          <div>
                            <strong>{{ formatarDataBrasileira(aula.data) || 'Data não informada' }}</strong>
                            <p>{{ descricaoAulaRetomadaLote(aula) }}</p>
                          </div>
                          <span class="chip previa-status" :class="classeStatusPreviaRetomadaLote(aula)">
                            {{ rotuloStatusPreviaRetomadaLote(aula) }}
                          </span>
                        </div>

                        <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                        <p><strong>Situação:</strong> {{ rotuloSituacaoAula(aula.situacao) }}</p>
                        <p v-if="aula.motivoBloqueio"><strong>Bloqueio:</strong> {{ aula.motivoBloqueio }}</p>
                      </article>
                    </div>
                  </template>

                  <section v-else class="estado-vazio estado-vazio-compacto">
                    <p>Gere a prévia para visualizar os contadores e a lista de aulas encontradas.</p>
                  </section>
                </aside>
              </div>
            </div>
          </fieldset>

          <p v-if="mensagemBloqueioConfirmacaoRetomadaLote" class="ajuda-campo ajuda-bloqueio-confirmacao">
            {{ mensagemBloqueioConfirmacaoRetomadaLote }}
          </p>

          <div class="acoes-card acoes-lote modal-lote-rodape">
            <button
              type="button"
              class="botao secundario"
              :disabled="!podeAtualizarPreviaRetomadaLote"
              @click="agendarConsultaPreviaRetomadaLote({ forcar: true })"
            >
              {{ carregandoPreviaRetomadaLote ? 'Atualizando...' : 'Atualizar prévia' }}
            </button>
            <button type="submit" class="botao principal" :disabled="!podeConfirmarRetomadaLote">
              {{ processandoRetomadaLote ? 'Retomando...' : 'Confirmar retomada em lote' }}
            </button>
          </div>
        </form>
      </section>
    </template>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 20px;
  color: var(--app-text);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.cabecalho-pagina,
.card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow);
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary) 14%, transparent), transparent 32%),
    linear-gradient(135deg, color-mix(in srgb, var(--app-surface) 96%, white), var(--app-surface));
}

.subtitulo,
.subtitulo-mini {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-primary);
}

.cabecalho-pagina h1,
.titulo-card h2,
.aula-card h3,
.detalhe-aula-card h2,
.participante-card h3 {
  margin: 0;
}

.descricao,
.descricao-card,
.ajuda-campo,
.estado-vazio p,
.estado-erro p,
.feedback p,
.aviso-bloqueio p,
.participante-meta,
.rodape-aula p,
.rodape-participante p {
  margin: 0;
  color: var(--app-text-muted);
}

.acoes-cabecalho,
.acoes-card,
.chips-aula,
.chips-participante {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.botao.principal {
  background: linear-gradient(135deg, var(--app-primary), var(--app-brand-end));
  color: #fff;
}

.botao.secundario {
  background: var(--app-surface-soft);
  color: var(--app-primary);
  border-color: var(--app-border);
}

.botao.perigo {
  background: linear-gradient(135deg, var(--app-danger), color-mix(in srgb, var(--app-danger) 88%, black));
  color: #fff;
}

.feedback {
  padding: 16px 18px;
}

.feedback.erro,
.estado-erro {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
}

.feedback.erro {
  color: var(--app-danger);
}

.feedback.sucesso {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.feedback.info,
.feedback.aviso {
  border-color: var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.aviso {
  padding: 20px 22px;
  color: var(--app-text);
}

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
}

.modal {
  max-height: calc(100vh - 32px);
  overflow: hidden;
  min-width: 0;
}

.modal-lote-painel {
  width: min(1180px, calc(100vw - 32px));
  max-width: 1180px;
  min-width: min(900px, calc(100vw - 32px));
  min-height: 0;
}

.modal-lote {
  display: flex;
  flex-direction: column;
  gap: 16px;
  min-height: 0;
}

.modal-lote-campo {
  display: flex;
  flex: 1 1 auto;
  min-width: 0;
  min-height: 0;
  border: 0;
  margin: 0;
  padding: 0;
}

.modal-lote-corpo {
  flex: 1 1 auto;
  min-height: 0;
  overflow: auto;
  overflow-x: hidden;
  padding-right: 2px;
}

.modal-lote-rodape {
  padding-top: 16px;
  border-top: 1px solid var(--app-border);
}

.lote-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 18px;
  align-items: start;
  min-width: 0;
}

.lote-formulario,
.lote-previa {
  display: grid;
  gap: 16px;
  align-content: start;
  min-width: 0;
}

.campos-lote {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.secao-cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.secao-cabecalho h3 {
  margin: 0;
}

.secao-cabecalho p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.acoes-mini,
.acoes-lote {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.acoes-cabecalho-lista {
  justify-content: flex-end;
}

.acoes-lote {
  justify-content: flex-end;
}

.bloco-selecao {
  display: grid;
  gap: 14px;
}

.lista-selecao {
  display: grid;
  gap: 12px;
}

.lista-selecao.aulas,
.lista-selecao.turmas {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.lista-selecao-rolavel {
  max-height: 320px;
  overflow-y: auto;
  overflow-x: hidden;
  padding-right: 4px;
  overscroll-behavior: contain;
}

.card-selecao {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  gap: 12px;
  align-items: flex-start;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.card-selecao input {
  width: auto;
  margin-top: 3px;
}

.card-selecao strong {
  display: block;
  margin-bottom: 6px;
}

.card-selecao p {
  margin: 0 0 8px;
  color: var(--app-text-muted);
}

.grade-resumo-lote {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.mini-card {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 14px;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
}

.mini-card span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.mini-card strong {
  font-size: 24px;
  font-weight: 900;
}

.lista-previa {
  display: grid;
  gap: 12px;
}

.card-previa {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.card-previa-topo {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: flex-start;
}

.card-previa-topo p,
.card-previa p {
  margin: 0;
  color: var(--app-text-muted);
}

.previa-status.cancelavel {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.previa-status.reversivel {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.previa-status.ja-cancelada {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.previa-status.ja-ativa {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.previa-status.bloqueada {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.motivo-cancelamento {
  margin: 0;
  color: var(--app-text-muted);
  display: -webkit-box;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
  overflow: hidden;
}

.grade-superior {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
}

.painel {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.titulo-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.titulo-card-lado {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 12px;
  flex: 1 1 320px;
  flex-wrap: wrap;
}

.cabecalho-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.cabecalho-card p {
  margin-top: 6px;
  color: var(--app-text-muted);
}

.titulo-card-lado .contador {
  margin-left: auto;
}

.contador {
  background: var(--app-primary-soft);
  color: var(--app-primary);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 900;
  white-space: nowrap;
}

.campos-filtros {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 8px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 11px 12px;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

textarea {
  resize: vertical;
  min-height: 92px;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.resumo-geracao {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.resumo-geracao div,
.resumo-aula div,
.resumo-frequencia div {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
}

.resumo-geracao span,
.resumo-aula span,
.resumo-frequencia span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.resumo-geracao strong,
.resumo-aula strong,
.resumo-frequencia strong {
  font-size: 20px;
  font-weight: 900;
}

.grade-principal {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.lista-aulas-card,
.detalhe-aula-card {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.lista-aulas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.paginacao-superior,
.paginacao-rodape {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  align-items: flex-start;
}

.paginacao-info {
  display: grid;
  gap: 6px;
  color: var(--app-text-muted);
}

.paginacao-info strong {
  color: var(--app-text);
}

.paginacao-controles {
  display: grid;
  gap: 12px;
  justify-items: end;
}

.seletor-paginacao {
  min-width: 180px;
}

.aula-card {
  display: grid;
  gap: 14px;
  width: 100%;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.aula-card.selecionada {
  border-color: var(--app-primary);
  box-shadow: inset 0 0 0 1px var(--app-primary);
}

.aula-card-topo {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.aula-data {
  margin: 0 0 6px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.aula-horario {
  margin: 8px 0 0;
  color: var(--app-text-muted);
}

.acao-card,
.botao-link {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: flex-start;
  min-width: 132px;
  border-radius: 999px;
  padding: 9px 12px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.chips-aula .chip,
.chips-participante .chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 700;
}

.chip.sutileza {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.chip.competicao {
  background: #fef3c7;
  color: #b45309;
}

.chip.situacao.estado-agendada,
.chip.situacao.estado-realizada {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.chip.situacao.estado-cancelada,
.chip.situacao.estado-nao_realizada {
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.chip.situacao.estado-nao_lancado {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.resumo-aula,
.resumo-frequencia {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.rodape-aula {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.detalhe-acoes {
  justify-content: flex-end;
}

.cabecalho-detalhe {
  display: grid;
  gap: 16px;
}

.meta-aula {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meta-aula div {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
}

.meta-aula span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-aula strong {
  font-size: 15px;
  font-weight: 800;
}

.aviso-bloqueio {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.participantes {
  display: grid;
  gap: 14px;
}

.participante-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.participante-topo {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.participante-meta {
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.campos-participante {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.rodape-participante {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  justify-content: space-between;
}

.estado-vazio,
.estado-erro {
  padding: 24px 18px;
  border-radius: 16px;
  text-align: center;
  border: 1px dashed var(--app-border);
}

.estado-erro {
  text-align: left;
}

.estado-vazio p,
.estado-erro p {
  color: var(--app-text-muted);
}

.estado-erro {
  color: var(--app-danger);
}

.estado-vazio-compacto {
  padding: 16px 14px;
  text-align: left;
}

.ajuda-auto-previa {
  font-weight: 600;
}

.botao-link {
  background: transparent;
  border: 1px solid var(--app-primary-soft);
}

@media (max-width: 1100px) {
  .grade-principal,
  .grade-superior {
    grid-template-columns: 1fr;
  }

  .lista-aulas {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .titulo-card,
  .aula-card-topo,
  .rodape-aula,
  .participante-topo,
  .secao-cabecalho,
  .card-previa-topo,
  .titulo-card-lado {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos-filtros,
  .resumo-geracao,
  .resumo-aula,
  .resumo-frequencia,
  .meta-aula,
  .campos-participante {
    grid-template-columns: 1fr;
  }

  .paginacao-superior,
  .paginacao-rodape,
  .detalhe-acoes,
  .acoes-lote {
    justify-content: flex-start;
  }

  .paginacao-controles,
  .acoes-mini {
    justify-content: flex-start;
  }

  .titulo-card-lado {
    width: 100%;
  }

  .titulo-card-lado .contador {
    margin-left: 0;
  }
}

@media (max-width: 768px) {
  .modal-fundo {
    padding: 8px;
  }

  .modal-lote-painel {
    width: calc(100vw - 16px);
    min-width: 0;
    max-width: none;
    max-height: calc(100vh - 16px);
  }

  .lote-grid,
  .campos-lote,
  .grade-resumo-lote,
  .lista-selecao.aulas,
  .lista-selecao.turmas {
    grid-template-columns: 1fr;
  }

  .lista-selecao-rolavel {
    max-height: clamp(240px, 36vh, 280px);
  }

  .acoes-lote,
  .modal-lote-rodape {
    flex-direction: column;
    align-items: stretch;
  }

  .acoes-lote .botao,
  .modal-lote-rodape .botao {
    width: 100%;
  }
}

@media (max-width: 640px) {
  .cabecalho-pagina,
  .painel,
  .lista-aulas-card,
  .detalhe-aula-card {
    padding: 18px;
  }

  .aula-card {
    padding: 14px;
  }

  .modal-fundo {
    padding: 8px;
  }
}
</style>
