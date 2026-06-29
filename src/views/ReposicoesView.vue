<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import PaginacaoCompacta from '@/components/PaginacaoCompacta.vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAulasGestaoEsportiva,
  buscarClientes,
  buscarFuncionarios,
  buscarTurmasBeachTennis,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import {
  agendarReposicaoGestaoEsportiva,
  buscarReposicaoGestaoEsportiva,
  cancelarAgendamentoReposicaoGestaoEsportiva,
  criarAjusteManualReposicaoGestaoEsportiva,
  gerarPreviaAgendamentoReposicaoGestaoEsportiva,
  listarDisponiveisPorAlunoReposicaoGestaoEsportiva,
  listarReposicoesGestaoEsportiva,
} from '@/services/reposicoes'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { formatarDataPtBrSemFuso } from '@/utils/datas'
import {
  criarDataHojeISO,
  formatarDataHoraSemConversaoFuso,
  formatarHorario,
  normalizarAulaLista,
  normalizarIdPositivo,
  normalizarNumero,
  normalizarTextoOpcional,
} from '@/utils/aulasFrequencia'
import { rotuloCompeticaoBeachTennis, rotuloNivelBeachTennis } from '@/utils/beachTennis'

const route = useRoute()
const router = useRouter()

const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const carregandoLista = ref(true)
const carregandoDetalhe = ref(false)
const carregandoBaseAulas = ref(false)
const carregandoAulasAgendamento = ref(false)
const carregandoAjuste = ref(false)
const carregandoCancelamento = ref(false)
const carregandoAgendamento = ref(false)
const carregandoPrevia = ref(false)
const carregandoClientesFiltro = ref(false)
const carregandoClientesAjuste = ref(false)
const erroLista = ref('')
const erroDetalhe = ref('')
const erroAjuste = ref('')
const erroCancelamento = ref('')
const erroAgendamento = ref('')
const erroClientesFiltro = ref('')
const erroClientesAjuste = ref('')
const feedback = ref('')
const tipoFeedback = ref('info')
const reposicoes = ref([])
const resumoLista = ref(criarResumoPadrao())
const paginacaoLista = ref(criarPaginacaoPadrao(10))
const detalhe = ref(null)
const direitosDisponiveisAluno = ref([])
const reposicoesAjuste = ref([])
const buscaClientesFiltro = ref('')
const buscaClientesAjuste = ref('')
const resultadosClientesFiltro = ref([])
const resultadosClientesAjuste = ref([])
const turmaOptions = ref([])
const professorOptions = ref([])
const aulasAgendamento = ref([])
const resumoAulasAgendamento = ref(criarResumoPadrao())
const paginacaoAulasAgendamento = ref(criarPaginacaoPadrao(8))
const previaAgendamento = ref(null)
const ajusteManual = ref(criarAjusteManualPadrao())
const cancelamentoAgendamento = ref(criarCancelamentoPadrao())
const filtros = ref(criarFiltrosPadrao())
const filtrosAgendamento = ref(criarFiltrosAgendamentoPadrao())
const sequenciaLista = ref(0)
const sequenciaDetalhe = ref(0)
const sequenciaClientesFiltro = ref(0)
const sequenciaClientesAjuste = ref(0)
const sequenciaAulasAgendamento = ref(0)
const sequenciaPrevia = ref(0)
const panelDetalheRef = ref(null)
const panelAgendamentoRef = ref(null)
const modalAjusteRef = ref(null)
const modalCancelamentoRef = ref(null)
let debounceClientesFiltro = null
let debounceClientesAjuste = null

const acaoAtual = computed(() => normalizarTextoOpcional(route.query.acao).trim().toLowerCase())
const reposicaoSelecionadaId = computed(() => normalizarIdPositivo(route.query.reposicaoId))
const painelDetalheAberto = computed(() => acaoAtual.value === 'detalhe' && Boolean(reposicaoSelecionadaId.value))
const painelAgendamentoAberto = computed(() => acaoAtual.value === 'agendar' && Boolean(reposicaoSelecionadaId.value))
const modalCancelamentoAberto = computed(() => acaoAtual.value === 'cancelar' && Boolean(reposicaoSelecionadaId.value))
const modalAjusteAberto = computed(() => acaoAtual.value === 'ajuste')
const possuiFiltrosAtivos = computed(
  () =>
    Boolean(
      filtros.value.alunoId ||
        filtros.value.situacao ||
        filtros.value.motivoOrigem ||
        filtros.value.validadeInicial ||
        filtros.value.validadeFinal ||
        filtros.value.texto,
    ),
)
const paginaAtualHumana = computed(() => paginacaoLista.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacaoLista.value.first && paginacaoLista.value.page > 0)
const podeIrParaProxima = computed(
  () => !paginacaoLista.value.last && paginaAtualHumana.value < Math.max(paginacaoLista.value.totalPages || 1, 1),
)
const resumoFonte = computed(() =>
  resumoLista.value.usouResumoBackend ? 'Totais da consulta' : 'Contagem da página atual',
)
const listaVaziaTexto = computed(() => {
  if (possuiFiltrosAtivos.value) {
    return 'Nenhum direito encontrado para os filtros informados.'
  }

  return 'Nenhum direito de reposição foi encontrado.'
})
const totalListaExibido = computed(() => paginacaoLista.value.totalElements || reposicoes.value.length)
const totalPaginasLista = computed(() => Math.max(Number(paginacaoLista.value.totalPages || 1), 1))
const resumoCards = computed(() => {
  const rotuloEscopo = resumoLista.value.usouResumoBackend ? '' : ' na página atual'

  return [
    { chave: 'disponivel', rotulo: `Disponíveis${rotuloEscopo}`, valor: resumoLista.value.disponivel },
    { chave: 'reservado', rotulo: `Reservadas${rotuloEscopo}`, valor: resumoLista.value.reservado },
    { chave: 'utilizado', rotulo: `Utilizadas${rotuloEscopo}`, valor: resumoLista.value.utilizado },
    { chave: 'expirado', rotulo: `Expiradas${rotuloEscopo}`, valor: resumoLista.value.expirado },
    { chave: 'cancelado', rotulo: `Canceladas${rotuloEscopo}`, valor: resumoLista.value.cancelado },
  ]
})
const tituloPagina = computed(() => 'Reposições de aulas')
const descricaoPagina = computed(
  () =>
    'Consulte direitos de reposição, acompanhe agendamentos, revise o histórico essencial e conceda novas reposições quando necessário.',
)
const classSelecionadaAgendamento = computed(() =>
  aulasAgendamento.value.find((item) => String(item.id) === String(agendamentoAtual.value.aulaDestinoId)) || null,
)
const agendamentoAtual = computed(() => ({
  direitoId: String(reposicaoSelecionadaId.value || '').trim(),
  aulaDestinoId: String(filtrosAgendamento.value.aulaDestinoId || '').trim(),
  confirmarTurmaLotada: filtrosAgendamento.value.confirmarTurmaLotada === true,
  observacao: String(filtrosAgendamento.value.observacao || '').trim(),
}))
const previaPermiteConfirmar = computed(
  () => Boolean(previaAgendamento.value && previaAgendamento.value.permitido !== false),
)
const previaExigeConfirmacao = computed(() => Boolean(previaAgendamento.value?.exigeConfirmacao === true))
const turmaLotadaExigeConfirmacao = computed(() => Boolean(previaAgendamento.value?.turmaLotada === true))
const bloquearConfirmacaoAgendamento = computed(() => {
  if (!painelAgendamentoAberto.value) {
    return true
  }

  if (!agendamentoAtual.value.direitoId || !agendamentoAtual.value.aulaDestinoId) {
    return true
  }

  if (!previaAgendamento.value) {
    return true
  }

  if (carregandoPrevia.value || carregandoAgendamento.value) {
    return true
  }

  if (!previaPermiteConfirmar.value) {
    return true
  }

  if ((previaExigeConfirmacao.value || turmaLotadaExigeConfirmacao.value) && !filtrosAgendamento.value.confirmarTurmaLotada) {
    return true
  }

  return false
})
const textoBotaoConfirmarAgendamento = computed(() =>
  carregandoAgendamento.value ? 'Confirmando...' : 'Confirmar agendamento',
)
const textoBotaoSalvarAjuste = computed(() => (carregandoAjuste.value ? 'Criando...' : 'Conceder reposição'))
const situacaoSelecionadaDetalhe = computed(() => normalizarTextoOpcional(detalhe.value?.situacao).trim().toUpperCase())
const podeAgendarDaLista = computed(() => situacaoSelecionadaDetalhe.value === 'DISPONIVEL')
const podeCancelarDaLista = computed(() => situacaoSelecionadaDetalhe.value === 'RESERVADO')
const textoEstadoDetalhe = computed(() => {
  if (!detalhe.value) {
    return 'Selecione um direito para ver os detalhes.'
  }

  if (situacaoSelecionadaDetalhe.value === 'DISPONIVEL') {
    return 'Este direito está disponível para agendamento.'
  }

  if (situacaoSelecionadaDetalhe.value === 'RESERVADO') {
    return 'Este direito já está reservado e pode ser cancelado mediante motivo.'
  }

  if (situacaoSelecionadaDetalhe.value === 'UTILIZADO') {
    return 'Este direito já foi utilizado.'
  }

  if (situacaoSelecionadaDetalhe.value === 'EXPIRADO') {
    return 'Este direito expirou e não pode mais ser usado.'
  }

  if (situacaoSelecionadaDetalhe.value === 'CANCELADO') {
    return 'Este direito foi cancelado.'
  }

  return 'Confira os dados do direito selecionado.'
})

function criarPaginacaoPadrao(size = 10) {
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

function criarResumoPadrao() {
  return {
    disponivel: 0,
    reservado: 0,
    utilizado: 0,
    expirado: 0,
    cancelado: 0,
    usouResumoBackend: false,
  }
}

function criarFiltrosPadrao() {
  return {
    alunoId: '',
    alunoBusca: '',
    situacao: '',
    motivoOrigem: '',
    validadeInicial: '',
    validadeFinal: '',
    texto: '',
    page: 1,
    size: 10,
  }
}

function criarFiltrosAgendamentoPadrao() {
  return {
    dataInicial: criarDataHojeISO(),
    dataFinal: '',
    turmaId: '',
    professorId: '',
    texto: '',
    page: 1,
    size: 8,
    aulaDestinoId: '',
    confirmarTurmaLotada: false,
    observacao: '',
  }
}

function criarAjusteManualPadrao() {
  return {
    alunoId: '',
    dataValidade: '',
    observacao: '',
  }
}

function criarCancelamentoPadrao() {
  return {
    motivo: '',
  }
}

function normalizarTexto(valor, fallback = '') {
  const texto = String(valor || '').trim()
  return texto || fallback
}

function normalizarBooleano(valor) {
  return valor === true || valor === 'true' || valor === 1 || valor === '1'
}

function primeiroValor(...valores) {
  for (const valor of valores) {
    if (valor === undefined || valor === null) {
      continue
    }

    if (typeof valor === 'string') {
      const texto = valor.trim()
      if (texto) {
        return texto
      }
      continue
    }

    if (typeof valor === 'number' && Number.isFinite(valor)) {
      return valor
    }

    if (typeof valor === 'boolean') {
      return valor
    }

    if (typeof valor === 'object' && Object.keys(valor).length > 0) {
      return valor
    }
  }

  return ''
}

function obterListaTextos(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => (typeof item === 'string' ? item.trim() : normalizarTexto(item?.mensagem || item?.texto || item?.message)))
      .filter(Boolean)
  }

  const texto = normalizarTexto(valor)
  return texto ? [texto] : []
}

function formatarDataHora(valor) {
  const texto = formatarDataHoraSemConversaoFuso(valor)
  return texto === '-' ? normalizarTexto(valor, '-') : texto
}

function rotuloSituacaoReposicao(valor) {
  const situacao = normalizarTexto(valor).toUpperCase()
  return (
    {
      DISPONIVEL: 'Disponível',
      RESERVADO: 'Reservada',
      UTILIZADO: 'Utilizada',
      EXPIRADO: 'Expirada',
      CANCELADO: 'Cancelada',
    }[situacao] || normalizarTexto(valor, '-')
  )
}

function classeSituacaoReposicao(valor) {
  const situacao = normalizarTexto(valor).toUpperCase()
  return `situacao-${situacao.toLowerCase() || 'indefinida'}`
}

function rotuloMotivoReposicao(valor) {
  const motivo = normalizarTexto(valor).toUpperCase()
  return (
    {
      FALTA_JUSTIFICADA: 'Falta justificada',
      AULA_CANCELADA: 'Aula cancelada',
      AJUSTE_MANUAL: 'Ajuste manual',
    }[motivo] || normalizarTexto(valor, '-')
  )
}

function normalizarResumoAula(fonte = {}, fallback = {}) {
  const item = fonte && typeof fonte === 'object' ? fonte : {}
  const base = normalizarAulaLista(item) || {}

  return {
    id: normalizarIdPositivo(item.id ?? item.aulaId ?? base.id ?? fallback.id ?? null) || null,
    dataAula: normalizarTexto(item.dataAula || item.data || base.dataAula || fallback.dataAula),
    horarioInicio: normalizarTexto(item.horarioInicio || item.horario || base.horarioInicio || fallback.horarioInicio),
    turmaNome: normalizarTexto(
      item.turmaNome || item.turma || base.turmaNome || item.nomeTurma || item.grupoNome || fallback.turmaNome,
    ),
    professorNome: normalizarTexto(
      item.professorNome || item.funcionarioNome || base.professorNome || item.profissionalNome || fallback.professorNome,
    ),
    nivel: normalizarTexto(item.nivel || item.nivelBeachTennis || base.nivel || fallback.nivel).toUpperCase(),
    competicao: normalizarBooleano(item.competicao ?? base.competicao ?? fallback.competicao),
    vagasDisponiveis: normalizarNumero(
      primeiroValor(item.vagasDisponiveis, item.vagasLivres, item.vagas, item.disponiveis, item.disponivel),
      0,
    ),
    ocupacaoAtual: normalizarNumero(primeiroValor(item.ocupacaoAtual, item.ocupacao, item.quantidadeAtual), 0),
    limite: normalizarNumero(primeiroValor(item.limite, item.capacidade, item.quantidadeLimite), 0),
  }
}

function rotuloAulaResumo(aula = {}) {
  const partes = []
  if (aula.dataAula) {
    partes.push(formatarDataPtBrSemFuso(aula.dataAula))
  }
  if (aula.horarioInicio) {
    partes.push(formatarHorario(aula.horarioInicio))
  }
  if (aula.turmaNome) {
    partes.push(aula.turmaNome)
  }
  if (aula.professorNome) {
    partes.push(aula.professorNome)
  }

  return partes.filter(Boolean).join(' · ') || 'Não informado'
}

function normalizarHistorico(item = {}) {
  const fontes = []
  if (Array.isArray(item.historico)) fontes.push(...item.historico)
  if (Array.isArray(item.historicoEssencial)) fontes.push(...item.historicoEssencial)
  if (Array.isArray(item.eventos)) fontes.push(...item.eventos)
  if (Array.isArray(item.movimentacoes)) fontes.push(...item.movimentacoes)

  return fontes
    .map((entrada) => {
      if (typeof entrada === 'string') {
        return {
          data: '',
          texto: entrada.trim(),
        }
      }

      if (!entrada || typeof entrada !== 'object') {
        return null
      }

      return {
        data: normalizarTexto(entrada.data || entrada.dataHora || entrada.criadoEm || entrada.createdAt),
        texto: normalizarTexto(entrada.texto || entrada.descricao || entrada.mensagem || entrada.status),
      }
    })
    .filter((entrada) => entrada && entrada.texto)
}

function normalizarReposicaoLista(item = {}) {
  const id = normalizarIdPositivo(item.id ?? item.direitoId ?? item.reposicaoId ?? item.requisicaoId)
  if (!id) {
    return null
  }

  const origem = normalizarResumoAula(
    primeiroValor(item.aulaOrigem, item.origemAula, item.aula, item.aulaBase, {}),
    item,
  )
  const destino = normalizarResumoAula(
    primeiroValor(item.aulaReposicao, item.reposicaoAula, item.aulaDestino, item.destinoAula, {}),
    item,
  )

  return {
    id,
    alunoId: normalizarIdPositivo(item.alunoId ?? item.clienteId ?? item.participanteId),
    alunoNome: normalizarTexto(
      item.alunoNome ||
        item.clienteNome ||
        item.participanteNome ||
        item.aluno?.nome ||
        item.cliente?.nome ||
        item.participante?.nome ||
        '',
      'Aluno não informado',
    ),
    situacao: normalizarTexto(item.situacao || item.status || item.estado, 'DESCONHECIDA').toUpperCase(),
    motivoOrigem: normalizarTexto(item.motivoOrigem || item.motivo || item.origemMotivo),
    aulaOrigem: origem,
    turmaOrigem: normalizarTexto(item.turmaOrigemNome || item.origemTurmaNome || origem.turmaNome),
    frequenciaOrigem: normalizarTexto(item.frequenciaOrigem || item.frequenciaAulaOrigem || item.frequencia),
    dataGeracao: normalizarTexto(item.dataGeracao || item.geradoEm || item.criadoEm || item.createdAt),
    validade: normalizarTexto(item.validade || item.dataValidade || item.validadeEm || item.vigencia),
    aulaReposicao: destino,
    turmaReposicao: normalizarTexto(item.turmaReposicaoNome || item.reposicaoTurmaNome || destino.turmaNome),
    reservadoEm: normalizarTexto(item.reservadoEm || item.dataReserva || item.agendadoEm),
    utilizadoEm: normalizarTexto(item.utilizadoEm || item.dataUso || item.reposicaoUtilizadaEm),
    canceladoEm: normalizarTexto(item.canceladoEm || item.dataCancelamento || item.cancelado_em),
    observacao: normalizarTexto(item.observacao || item.observacoes || item.obs),
    historico: normalizarHistorico(item),
    raw: item,
  }
}

function normalizarReposicaoDetalhe(item = {}) {
  const base = normalizarReposicaoLista(item)

  if (!base) {
    return null
  }

  return {
    ...base,
    frequenciaOrigem: normalizarTexto(
      item.frequenciaOrigem || item.frequenciaAulaOrigem || item.frequencia || base.frequenciaOrigem,
    ),
    aulaOrigem: normalizarResumoAula(primeiroValor(item.aulaOrigem, item.origemAula, item.aula, {}), item),
    turmaOrigem: normalizarTexto(
      item.turmaOrigemNome || item.origemTurmaNome || item.turmaOrigem || item.turmaNomeOrigem || base.turmaOrigem,
    ),
    aulaReposicao: normalizarResumoAula(primeiroValor(item.aulaReposicao, item.reposicaoAula, item.aulaDestino, {}), item),
    turmaReposicao: normalizarTexto(
      item.turmaReposicaoNome || item.reposicaoTurmaNome || item.turmaReposicao || item.turmaNomeReposicao || base.turmaReposicao,
    ),
    historico: normalizarHistorico(item),
    observacao: normalizarTexto(item.observacao || item.observacoes || item.obs || base.observacao),
  }
}

function normalizarPreviaAgendamento(item = {}, aulaSelecionada = null, direito = null) {
  const base = item && typeof item === 'object' ? item : {}
  const capacidadeBase = base.capacidade && typeof base.capacidade === 'object' ? base.capacidade : {}
  const aulaDestino = normalizarResumoAula(primeiroValor(base.aulaDestino, aulaSelecionada, {}), base)
  const dadosDireito = normalizarReposicaoLista(primeiroValor(base.direito, direito, {})) || direito || null

  return {
    permitido: base.permitido !== false,
    exigeConfirmacao: normalizarBooleano(base.exigeConfirmacao),
    alertas: obterListaTextos(base.alertas),
    motivoBloqueio: normalizarTexto(base.motivoBloqueio),
    direito: dadosDireito,
    aulaDestino,
    capacidade: {
      limite: normalizarNumero(primeiroValor(capacidadeBase.limite, base.limite), 0),
      ocupacaoAtual: normalizarNumero(primeiroValor(capacidadeBase.ocupacaoAtual, base.ocupacaoAtual), 0),
      lotada: normalizarBooleano(primeiroValor(capacidadeBase.lotada, base.turmaLotada)),
    },
    turmaLotada: normalizarBooleano(primeiroValor(capacidadeBase.lotada, base.turmaLotada)),
    limite: normalizarNumero(primeiroValor(capacidadeBase.limite, base.limite), 0),
    ocupacaoAtual: normalizarNumero(primeiroValor(capacidadeBase.ocupacaoAtual, base.ocupacaoAtual), 0),
    raw: base,
  }
}

function normalizarListaClientes(resposta) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const lista = Array.isArray(base.content) ? base.content : Array.isArray(resposta) ? resposta : []
  return lista
    .map((item) => ({
      id: normalizarIdPositivo(item.id ?? item.clienteId),
      nome: normalizarTexto(item.nome || item.clienteNome || item.razaoSocial || 'Cliente'),
      telefone: normalizarTexto(item.telefone || item.telefoneCelular || item.celular),
      email: normalizarTexto(item.email || item.emailPrincipal || item.usuarioEmail),
    }))
    .filter((item) => item.id)
}

function normalizarRespostaLista(resposta, sizePadrao = 10) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const lista = Array.isArray(base.content) ? base.content : Array.isArray(resposta) ? resposta : []
  const content = lista.map((item) => normalizarReposicaoLista(item)).filter(Boolean)
  const page = normalizarNumero(base.page ?? base.number ?? 0, 0)
  const size = normalizarNumero(base.size ?? sizePadrao, sizePadrao)
  const totalElements = normalizarNumero(base.totalElements ?? base.total ?? base.quantidadeTotal ?? content.length, content.length)
  const totalPages = normalizarNumero(base.totalPages, totalElements > 0 ? Math.ceil(totalElements / Math.max(size, 1)) : 1)
  const resumoBase = base.resumo || base.summary || base.totais || base.contadores || {}

  return {
    content,
    page,
    size,
    totalElements,
    totalPages: Math.max(totalPages, 1),
    first: base.first === true || page <= 0,
    last: base.last === true || totalPages <= 1 || page >= totalPages - 1,
    numberOfElements: normalizarNumero(base.numberOfElements ?? base.number ?? content.length, content.length),
    resumo: {
      disponivel: normalizarNumero(primeiroValor(resumoBase.disponivel, base.disponivel), contarPorSituacao(content, 'DISPONIVEL')),
      reservado: normalizarNumero(primeiroValor(resumoBase.reservado, base.reservado), contarPorSituacao(content, 'RESERVADO')),
      utilizado: normalizarNumero(primeiroValor(resumoBase.utilizado, base.utilizado), contarPorSituacao(content, 'UTILIZADO')),
      expirado: normalizarNumero(primeiroValor(resumoBase.expirado, base.expirado), contarPorSituacao(content, 'EXPIRADO')),
      cancelado: normalizarNumero(primeiroValor(resumoBase.cancelado, base.cancelado), contarPorSituacao(content, 'CANCELADO')),
      usouResumoBackend: Object.keys(resumoBase).length > 0,
    },
  }
}

function contarPorSituacao(lista = [], situacao = '') {
  const valor = normalizarTexto(situacao).toUpperCase()
  return lista.filter((item) => normalizarTexto(item?.situacao).toUpperCase() === valor).length
}

function normalizarRespostaPaginaAulas(resposta, sizePadrao = 8) {
  const base = resposta && typeof resposta === 'object' ? resposta : {}
  const lista = Array.isArray(base.content) ? base.content : Array.isArray(resposta) ? resposta : []
  const content = lista
    .map((item) => {
      const aula = normalizarAulaLista(item)
      if (!aula) {
        return null
      }

      return {
        ...aula,
        vagasDisponiveis: normalizarNumero(primeiroValor(item.vagasDisponiveis, item.vagasLivres, item.vagas), 0),
        ocupacaoAtual: normalizarNumero(primeiroValor(item.ocupacaoAtual, item.ocupacao, item.quantidadeAtual), 0),
        limite: normalizarNumero(primeiroValor(item.limite, item.capacidade, item.quantidadeLimite), 0),
      }
    })
    .filter(Boolean)
  const page = normalizarNumero(base.page ?? base.number ?? 0, 0)
  const size = normalizarNumero(base.size ?? sizePadrao, sizePadrao)
  const totalElements = normalizarNumero(base.totalElements ?? base.total ?? content.length, content.length)
  const totalPages = normalizarNumero(base.totalPages, totalElements > 0 ? Math.ceil(totalElements / Math.max(size, 1)) : 1)

  return {
    content,
    page,
    size,
    totalElements,
    totalPages: Math.max(totalPages, 1),
    first: base.first === true || page <= 0,
    last: base.last === true || totalPages <= 1 || page >= totalPages - 1,
    numberOfElements: normalizarNumero(base.numberOfElements ?? content.length, content.length),
  }
}

function queryComoObjeto() {
  return {
    alunoId: String(route.query.alunoId || '').trim(),
    alunoBusca: String(route.query.alunoBusca || '').trim(),
    situacao: String(route.query.situacao || '').trim(),
    motivoOrigem: String(route.query.motivo || route.query.motivoOrigem || '').trim(),
    validadeInicial: String(route.query.dataValidadeInicial || route.query.validadeInicial || '').trim(),
    validadeFinal: String(route.query.dataValidadeFinal || route.query.validadeFinal || '').trim(),
    texto: String(route.query.texto || '').trim(),
    page: Math.max(Number.parseInt(String(route.query.page || '1'), 10) || 1, 1),
    size: Math.max(Number.parseInt(String(route.query.size || '10'), 10) || 10, 1),
  }
}

function queryAgendamentoComoObjeto() {
  return {
    dataInicial: String(route.query.dataInicial || criarDataHojeISO()).trim(),
    dataFinal: String(route.query.dataFinal || '').trim(),
    turmaId: String(route.query.turmaId || '').trim(),
    professorId: String(route.query.professorId || '').trim(),
    texto: String(route.query.textoAula || route.query.textoAgendamento || '').trim(),
    page: Math.max(Number.parseInt(String(route.query.pageAulas || '1'), 10) || 1, 1),
    size: Math.max(Number.parseInt(String(route.query.sizeAulas || '8'), 10) || 8, 1),
    aulaDestinoId: String(route.query.aulaDestinoId || '').trim(),
    confirmarTurmaLotada: normalizarBooleano(route.query.confirmarTurmaLotada),
    observacao: String(route.query.observacaoAgendamento || '').trim(),
  }
}

function aplicarQueryNosFiltros() {
  const query = queryComoObjeto()
  filtros.value = {
    ...filtros.value,
    ...query,
  }
  buscaClientesFiltro.value = query.alunoBusca
  ajusteManual.value.alunoId = String(route.query.alunoAjusteId || ajusteManual.value.alunoId || '').trim()
  ajusteManual.value.dataValidade = String(route.query.dataValidade || ajusteManual.value.dataValidade || '').trim()
  ajusteManual.value.observacao = String(route.query.observacaoAjuste || ajusteManual.value.observacao || '').trim()
  cancelamentoAgendamento.value.motivo = String(route.query.motivoCancelamento || cancelamentoAgendamento.value.motivo || '').trim()

  filtrosAgendamento.value = {
    ...filtrosAgendamento.value,
    ...queryAgendamentoComoObjeto(),
  }
}

function atualizarQueryRota(patch = {}, { manterAcao = true } = {}) {
  const queryAtual = { ...route.query }
  const queryBase = manterAcao
    ? queryAtual
    : Object.fromEntries(Object.entries(queryAtual).filter(([chave]) => !['acao', 'reposicaoId'].includes(chave)))

  const query = { ...queryBase, ...patch }

  Object.keys(query).forEach((chave) => {
    if (query[chave] === undefined || query[chave] === null || query[chave] === '') {
      delete query[chave]
    }
  })

  router.replace({
    name: 'reposicoes',
    query,
  })
}

function aplicarFiltros() {
  atualizarQueryRota({
    alunoId: filtros.value.alunoId || undefined,
    alunoBusca: filtros.value.alunoBusca || undefined,
    situacao: filtros.value.situacao || undefined,
    motivoOrigem: filtros.value.motivoOrigem || undefined,
    validadeInicial: undefined,
    validadeFinal: undefined,
    dataValidadeInicial: filtros.value.validadeInicial || undefined,
    dataValidadeFinal: filtros.value.validadeFinal || undefined,
    texto: filtros.value.texto || undefined,
    page: 1,
    size: filtros.value.size,
    acao: route.query.acao || undefined,
    reposicaoId: route.query.reposicaoId || undefined,
  })
}

function limparFiltros() {
  filtros.value = criarFiltrosPadrao()
  buscaClientesFiltro.value = ''
  resultadosClientesFiltro.value = []
  atualizarQueryRota({ page: 1, size: filtros.value.size }, { manterAcao: false })
}

function alterarTamanhoPaginaLista(valor) {
  atualizarQueryRota({ size: Number(valor) || 10, page: 1 })
}

function recarregarAulasAgendamento() {
  filtrosAgendamento.value.page = 1
  carregarAulasAgendamento()
}

function limparFiltrosAgendamento() {
  filtrosAgendamento.value = criarFiltrosAgendamentoPadrao()
  filtrosAgendamento.value.dataInicial = criarDataHojeISO()
  filtrosAgendamento.value.page = 1
  previaAgendamento.value = null
  erroAgendamento.value = ''
  carregarAulasAgendamento()
}

function irParaPaginaAnteriorAulas() {
  if (paginacaoAulasAgendamento.value.page <= 0) {
    return
  }

  filtrosAgendamento.value.page = Math.max(Number(paginacaoAulasAgendamento.value.page) - 1, 0)
  carregarAulasAgendamento()
}

function irParaProximaPaginaAulas() {
  if (paginacaoAulasAgendamento.value.last) {
    return
  }

  filtrosAgendamento.value.page = Number(paginacaoAulasAgendamento.value.page) + 1
  carregarAulasAgendamento()
}

function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value) return
  atualizarQueryRota({ page: Math.max(Number(filtros.value.page || 1) - 1, 1) })
}

function irParaProximaPagina() {
  if (!podeIrParaProxima.value) return
  atualizarQueryRota({ page: Number(filtros.value.page || 1) + 1 })
}

function abrirDetalheReposicao(item) {
  const id = normalizarIdPositivo(item?.id)
  if (!id) return
  atualizarQueryRota({ acao: 'detalhe', reposicaoId: id })
}

function abrirAgendamentoReposicao(item) {
  const id = normalizarIdPositivo(item?.id)
  if (!id) return
  filtrosAgendamento.value = {
    ...criarFiltrosAgendamentoPadrao(),
    dataInicial: criarDataHojeISO(),
  }
  previaAgendamento.value = null
  atualizarQueryRota({ acao: 'agendar', reposicaoId: id })
}

function abrirCancelamentoAgendamento(item) {
  const id = normalizarIdPositivo(item?.id)
  if (!id) return
  cancelamentoAgendamento.value.motivo = ''
  atualizarQueryRota({ acao: 'cancelar', reposicaoId: id })
}

function abrirAjusteManual() {
  ajusteManual.value = criarAjusteManualPadrao()
  buscaClientesAjuste.value = ''
  resultadosClientesAjuste.value = []
  atualizarQueryRota({ acao: 'ajuste' }, { manterAcao: false })
}

function fecharAcaoAtual() {
  atualizarQueryRota({}, { manterAcao: false })
}

function definirFeedback(mensagem, tipo = 'info') {
  feedback.value = normalizarTexto(mensagem)
  tipoFeedback.value = tipo
}

function limparFeedback() {
  feedback.value = ''
  tipoFeedback.value = 'info'
}

function obterMensagemErro(error, fallback) {
  const candidatos = [
    error?.response?.data?.message,
    error?.response?.data?.mensagem,
    error?.response?.data?.detail,
    error?.response?.data?.error,
    error?.data?.message,
    error?.data?.mensagem,
    error?.data?.detail,
    error?.data?.error,
    error?.message,
  ]

  for (const candidato of candidatos) {
    const mensagem = normalizarTexto(candidato)
    if (mensagem) {
      return mensagem
    }
  }

  return fallback
}

async function carregarContexto() {
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
}

async function carregarListaReposicoes() {
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    reposicoes.value = []
    paginacaoLista.value = criarPaginacaoPadrao(filtros.value.size)
    resumoLista.value = criarResumoPadrao()
    carregandoLista.value = false
    return
  }

  const sequenciaAtual = ++sequenciaLista.value
  carregandoLista.value = true
  erroLista.value = ''

  const consulta = {
    page: Math.max(Number(filtros.value.page || 1) - 1, 0),
    size: Math.max(Number(filtros.value.size || 10), 1),
  }

  if (filtros.value.alunoId) consulta.alunoId = filtros.value.alunoId
  if (filtros.value.situacao) consulta.situacao = filtros.value.situacao
  if (filtros.value.motivoOrigem) consulta.motivoOrigem = filtros.value.motivoOrigem
  if (filtros.value.validadeInicial) consulta.dataValidadeInicial = filtros.value.validadeInicial
  if (filtros.value.validadeFinal) consulta.dataValidadeFinal = filtros.value.validadeFinal
  if (filtros.value.texto) consulta.texto = filtros.value.texto
  if (filtros.value.alunoBusca) consulta.alunoBusca = filtros.value.alunoBusca

  try {
    const resposta = await listarReposicoesGestaoEsportiva(consulta)
    if (sequenciaAtual !== sequenciaLista.value) {
      return
    }

    const normalizada = normalizarRespostaLista(resposta, consulta.size)
    reposicoes.value = normalizada.content
    paginacaoLista.value = {
      page: normalizada.page,
      size: normalizada.size,
      totalElements: normalizada.totalElements,
      totalPages: normalizada.totalPages,
      first: normalizada.first,
      last: normalizada.last,
      numberOfElements: normalizada.numberOfElements,
    }
    resumoLista.value = normalizada.resumo
  } catch (error) {
    if (sequenciaAtual !== sequenciaLista.value) {
      return
    }

    reposicoes.value = []
    resumoLista.value = criarResumoPadrao()
    erroLista.value = obterMensagemErro(error, 'Não foi possível carregar as reposições.')
  } finally {
    if (sequenciaAtual === sequenciaLista.value) {
      carregandoLista.value = false
    }
  }
}

async function carregarDetalheReposicao(id = reposicaoSelecionadaId.value) {
  const reposicaoId = normalizarIdPositivo(id)
  if (!reposicaoId) {
    detalhe.value = null
    direitosDisponiveisAluno.value = []
    carregandoDetalhe.value = false
    return
  }

  const sequenciaAtual = ++sequenciaDetalhe.value
  carregandoDetalhe.value = true
  erroDetalhe.value = ''
  detalhe.value = null
  direitosDisponiveisAluno.value = []

  try {
    const resposta = await buscarReposicaoGestaoEsportiva(reposicaoId)
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    const normalizado = normalizarReposicaoDetalhe(resposta || {})
    detalhe.value = normalizado

    if (normalizado?.alunoId) {
      await carregarDireitosDisponiveisAluno(normalizado.alunoId, sequenciaAtual)
    }
  } catch (error) {
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    erroDetalhe.value = obterMensagemErro(error, 'Não foi possível carregar os detalhes da reposição.')
  } finally {
    if (sequenciaAtual === sequenciaDetalhe.value) {
      carregandoDetalhe.value = false
    }
  }
}

async function carregarDireitosDisponiveisAluno(alunoId, sequenciaBase = sequenciaDetalhe.value) {
  const id = normalizarIdPositivo(alunoId)
  if (!id) {
    direitosDisponiveisAluno.value = []
    return
  }

  try {
    const resposta = await listarDisponiveisPorAlunoReposicaoGestaoEsportiva(id)
    if (sequenciaBase !== sequenciaDetalhe.value) {
      return
    }

    direitosDisponiveisAluno.value = (Array.isArray(resposta) ? resposta : [])
      .map((item) => normalizarReposicaoLista(item))
      .filter(Boolean)
  } catch (error) {
    if (sequenciaBase !== sequenciaDetalhe.value) {
      return
    }

    direitosDisponiveisAluno.value = []
    console.error(error)
  }
}

async function carregarBasesAgendamento() {
  if (carregandoBaseAulas.value) {
    return
  }

  carregandoBaseAulas.value = true

  try {
    const [turmasResposta, professoresResposta] = await Promise.all([buscarTurmasBeachTennis(), buscarFuncionarios()])

    turmaOptions.value = (Array.isArray(turmasResposta) ? turmasResposta : [])
      .map((item) => ({
        id: normalizarIdPositivo(item.id ?? item.turmaId),
        nome: normalizarTexto(item.nome || item.turmaNome || item.descricao || `Turma ${item.id || ''}`),
        nivel: normalizarTexto(item.nivel || item.nivelBeachTennis),
        competicao: item.competicao === true || item.participaCompeticaoBeachTennis === true,
      }))
      .filter((item) => item.id)
    professorOptions.value = (Array.isArray(professoresResposta) ? professoresResposta : [])
      .map((item) => ({
        id: normalizarIdPositivo(item.id ?? item.funcionarioId),
        nome: normalizarTexto(item.nome || item.nomeCompleto || item.apelido || 'Professor'),
      }))
      .filter((item) => item.id)
  } catch (error) {
    console.error(error)
  } finally {
    carregandoBaseAulas.value = false
  }
}

function normalizarAulaAgendamento(item = {}) {
  const aula = normalizarAulaLista(item)
  if (!aula) {
    return null
  }

  return {
    ...aula,
    vagasDisponiveis: normalizarNumero(primeiroValor(item.vagasDisponiveis, item.vagasLivres, item.vagas), 0),
    ocupacaoAtual: normalizarNumero(primeiroValor(item.ocupacaoAtual, item.ocupacao, item.quantidadeAtual), 0),
    limite: normalizarNumero(primeiroValor(item.limite, item.capacidade, item.quantidadeLimite), 0),
    descricao: rotuloAulaResumo({
      dataAula: aula.dataAula,
      horarioInicio: aula.horarioInicio,
      turmaNome: aula.turmaNome,
      professorNome: aula.professorNome,
    }),
  }
}

async function carregarAulasAgendamento() {
  if (!painelAgendamentoAberto.value || !agendamentoAtual.value.direitoId) {
    aulasAgendamento.value = []
    resumoAulasAgendamento.value = criarResumoPadrao()
    paginacaoAulasAgendamento.value = criarPaginacaoPadrao(filtrosAgendamento.value.size)
    return
  }

  const sequenciaAtual = ++sequenciaAulasAgendamento.value
  carregandoAulasAgendamento.value = true
  erroAgendamento.value = ''

  const consulta = {
    page: Math.max(Number(filtrosAgendamento.value.page || 1) - 1, 0),
    size: Math.max(Number(filtrosAgendamento.value.size || 8), 1),
    situacao: 'AGENDADA',
  }

  if (filtrosAgendamento.value.dataInicial) consulta.dataInicial = filtrosAgendamento.value.dataInicial
  if (filtrosAgendamento.value.dataFinal) consulta.dataFinal = filtrosAgendamento.value.dataFinal
  if (filtrosAgendamento.value.turmaId) consulta.turmaId = filtrosAgendamento.value.turmaId
  if (filtrosAgendamento.value.professorId) consulta.professorId = filtrosAgendamento.value.professorId
  if (filtrosAgendamento.value.texto) consulta.texto = filtrosAgendamento.value.texto

  try {
    const resposta = await buscarAulasGestaoEsportiva(consulta)
    if (sequenciaAtual !== sequenciaAulasAgendamento.value) {
      return
    }

    const normalizada = normalizarRespostaPaginaAulas(resposta, consulta.size)
    const aulasNormalizadas = normalizada.content.map((item) => normalizarAulaAgendamento(item)).filter(Boolean)

    if (Array.isArray(resposta)) {
      const totalElements = aulasNormalizadas.length
      const totalPages = Math.max(Math.ceil(totalElements / Math.max(consulta.size, 1)), 1)
      const pageAtual = Math.min(Math.max(consulta.page, 0), totalPages - 1)
      const inicio = pageAtual * consulta.size
      const pageContent = aulasNormalizadas.slice(inicio, inicio + consulta.size)

      aulasAgendamento.value = pageContent
      paginacaoAulasAgendamento.value = {
        page: pageAtual,
        size: consulta.size,
        totalElements,
        totalPages,
        first: pageAtual <= 0,
        last: pageAtual >= totalPages - 1,
        numberOfElements: pageContent.length,
      }
    } else {
      aulasAgendamento.value = aulasNormalizadas
      paginacaoAulasAgendamento.value = {
        page: normalizada.page,
        size: normalizada.size,
        totalElements: normalizada.totalElements,
        totalPages: normalizada.totalPages,
        first: normalizada.first,
        last: normalizada.last,
        numberOfElements: normalizada.numberOfElements,
      }
    }
    resumoAulasAgendamento.value = criarResumoPadrao()
  } catch (error) {
    if (sequenciaAtual !== sequenciaAulasAgendamento.value) {
      return
    }

    aulasAgendamento.value = []
    erroAgendamento.value = obterMensagemErro(error, 'Não foi possível carregar as aulas para reposição.')
  } finally {
    if (sequenciaAtual === sequenciaAulasAgendamento.value) {
      carregandoAulasAgendamento.value = false
    }
  }
}

async function consultarClientesSugeridos(termo, carregandoRef, sequenciaRef) {
  const texto = normalizarTexto(termo)
  if (!texto) {
    return []
  }

  const sequenciaAtual = ++sequenciaRef.value
  carregandoRef.value = true

  try {
    const resposta = await buscarClientes({
      busca: texto,
      page: 0,
      size: 8,
    })

    if (sequenciaAtual !== sequenciaRef.value) {
      return []
    }

    return normalizarListaClientes(resposta)
  } catch (error) {
    console.error(error)
    return []
  } finally {
    if (sequenciaAtual === sequenciaRef.value) {
      carregandoRef.value = false
    }
  }
}

async function atualizarClientesFiltro() {
  if (debounceClientesFiltro) {
    clearTimeout(debounceClientesFiltro)
  }

  debounceClientesFiltro = setTimeout(async () => {
    erroClientesFiltro.value = ''
    resultadosClientesFiltro.value = await consultarClientesSugeridos(
      buscaClientesFiltro.value,
      carregandoClientesFiltro,
      sequenciaClientesFiltro,
    )
  }, 250)
}

async function atualizarClientesAjuste() {
  if (debounceClientesAjuste) {
    clearTimeout(debounceClientesAjuste)
  }

  debounceClientesAjuste = setTimeout(async () => {
    erroClientesAjuste.value = ''
    resultadosClientesAjuste.value = await consultarClientesSugeridos(
      buscaClientesAjuste.value,
      carregandoClientesAjuste,
      sequenciaClientesAjuste,
    )
  }, 250)
}

function selecionarClienteFiltro(cliente) {
  if (!cliente?.id) return
  filtros.value.alunoId = String(cliente.id)
  filtros.value.alunoBusca = cliente.nome
  buscaClientesFiltro.value = cliente.nome
  resultadosClientesFiltro.value = []
}

function limparAlunoFiltro() {
  filtros.value.alunoId = ''
  filtros.value.alunoBusca = ''
  buscaClientesFiltro.value = ''
  resultadosClientesFiltro.value = []
}

function selecionarClienteAjuste(cliente) {
  if (!cliente?.id) return
  ajusteManual.value.alunoId = String(cliente.id)
  buscaClientesAjuste.value = cliente.nome
  resultadosClientesAjuste.value = []
}

function limparAlunoAjuste() {
  ajusteManual.value.alunoId = ''
  buscaClientesAjuste.value = ''
  resultadosClientesAjuste.value = []
}

function abrirPainelDaLista(item, acao) {
  const id = normalizarIdPositivo(item?.id)
  if (!id) return
  const patch = { acao, reposicaoId: id }

  if (acao === 'agendar') {
    filtrosAgendamento.value = {
      ...criarFiltrosAgendamentoPadrao(),
      dataInicial: criarDataHojeISO(),
      page: 1,
    }
    previaAgendamento.value = null
  }

  if (acao === 'cancelar') {
    cancelamentoAgendamento.value = criarCancelamentoPadrao()
  }

  atualizarQueryRota(patch)
}

async function selecionarAulaDestino(aula) {
  if (!painelAgendamentoAberto.value || !agendamentoAtual.value.direitoId || !aula?.id) {
    return
  }

  filtrosAgendamento.value.aulaDestinoId = String(aula.id)
  erroAgendamento.value = ''
  previaAgendamento.value = null
  const sequenciaAtual = ++sequenciaPrevia.value
  carregandoPrevia.value = true

  try {
    const resposta = await gerarPreviaAgendamentoReposicaoGestaoEsportiva(agendamentoAtual.value.direitoId, {
      aulaDestinoId: String(aula.id),
    })

    if (sequenciaAtual !== sequenciaPrevia.value) {
      return
    }

    previaAgendamento.value = normalizarPreviaAgendamento(resposta || {}, aula, detalhe.value)
    filtrosAgendamento.value.confirmarTurmaLotada = previaAgendamento.value.turmaLotada === true
  } catch (error) {
    if (sequenciaAtual !== sequenciaPrevia.value) {
      return
    }

    previaAgendamento.value = null
    erroAgendamento.value = obterMensagemErro(error, 'Não foi possível gerar a prévia do agendamento.')
  } finally {
    if (sequenciaAtual === sequenciaPrevia.value) {
      carregandoPrevia.value = false
    }
  }
}

function validarAjusteManual() {
  if (!ajusteManual.value.alunoId) {
    return 'Selecione um aluno.'
  }

  if (!ajusteManual.value.dataValidade) {
    return 'Informe a data de validade.'
  }

  const observacao = normalizarTexto(ajusteManual.value.observacao)
  if (!observacao) {
    return 'Informe a observação.'
  }

  return ''
}

async function salvarAjusteManual() {
  const validacao = validarAjusteManual()
  if (validacao) {
    erroAjuste.value = validacao
    return
  }

  if (!window.confirm('Confirma a concessão desta reposição manual?')) {
    return
  }

  carregandoAjuste.value = true
  erroAjuste.value = ''

  try {
    await criarAjusteManualReposicaoGestaoEsportiva({
      alunoId: ajusteManual.value.alunoId,
      dataValidade: ajusteManual.value.dataValidade,
      observacao: normalizarTexto(ajusteManual.value.observacao),
    })

    definirFeedback('Reposição manual criada com sucesso.', 'sucesso')
    fecharAcaoAtual()
    await carregarListaReposicoes()
    if (painelDetalheAberto.value) {
      await carregarDetalheReposicao()
    }
  } catch (error) {
    erroAjuste.value = obterMensagemErro(error, 'Não foi possível criar o ajuste manual.')
  } finally {
    carregandoAjuste.value = false
  }
}

function validarCancelamento() {
  if (!cancelamentoAgendamento.value.motivo.trim()) {
    return 'Informe o motivo do cancelamento do agendamento.'
  }

  return ''
}

async function confirmarCancelamentoAgendamento() {
  const validacao = validarCancelamento()
  if (validacao) {
    erroCancelamento.value = validacao
    return
  }

  carregandoCancelamento.value = true
  erroCancelamento.value = ''

  try {
    await cancelarAgendamentoReposicaoGestaoEsportiva(agendamentoAtual.value.direitoId, {
      motivo: normalizarTexto(cancelamentoAgendamento.value.motivo),
    })
    definirFeedback('Agendamento cancelado com sucesso.', 'sucesso')
    fecharAcaoAtual()
    await carregarListaReposicoes()
    if (painelDetalheAberto.value) {
      await carregarDetalheReposicao()
    }
  } catch (error) {
    erroCancelamento.value = obterMensagemErro(error, 'Não foi possível cancelar o agendamento da reposição.')
  } finally {
    carregandoCancelamento.value = false
  }
}

async function confirmarAgendamento() {
  if (!agendamentoAtual.value.direitoId || !agendamentoAtual.value.aulaDestinoId) {
    erroAgendamento.value = 'Selecione uma aula antes de confirmar.'
    return
  }

  if (!previaPermiteConfirmar.value) {
    erroAgendamento.value = 'A prévia bloqueou este agendamento.'
    return
  }

  if ((previaExigeConfirmacao.value || turmaLotadaExigeConfirmacao.value) && !filtrosAgendamento.value.confirmarTurmaLotada) {
    erroAgendamento.value = 'Confirme explicitamente que deseja seguir com o agendamento.'
    return
  }

  carregandoAgendamento.value = true
  erroAgendamento.value = ''

  const payload = {
    aulaDestinoId: agendamentoAtual.value.aulaDestinoId,
    confirmarTurmaLotada: filtrosAgendamento.value.confirmarTurmaLotada === true,
  }

  const observacao = normalizarTexto(filtrosAgendamento.value.observacao)
  if (observacao) {
    payload.observacao = observacao
  }

  try {
    await agendarReposicaoGestaoEsportiva(agendamentoAtual.value.direitoId, payload)
    definirFeedback('Agendamento concluído com sucesso.', 'sucesso')
    fecharAcaoAtual()
    await carregarListaReposicoes()
    if (painelDetalheAberto.value) {
      await carregarDetalheReposicao()
    }
  } catch (error) {
    erroAgendamento.value = obterMensagemErro(error, 'Não foi possível concluir o agendamento da reposição.')
  } finally {
    carregandoAgendamento.value = false
  }
}

function atualizarModoVisualizacao() {
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  if (modoVisualizacaoEmpresa.value) {
    reposicoes.value = []
    detalhe.value = null
    direitosDisponiveisAluno.value = []
    aulasAgendamento.value = []
  }
  carregarTudo()
}

async function carregarTudo() {
  await carregarContexto()
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    carregandoLista.value = false
    return
  }

  aplicarQueryNosFiltros()
  await Promise.all([
    carregarListaReposicoes(),
    painelAgendamentoAberto.value ? carregarBasesAgendamento() : Promise.resolve(),
    painelAgendamentoAberto.value ? carregarAulasAgendamento() : Promise.resolve(),
    painelDetalheAberto.value || painelAgendamentoAberto.value || modalCancelamentoAberto.value
      ? carregarDetalheReposicao()
      : Promise.resolve(),
  ])
}

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  atualizarModoVisualizacao()
}

watch(
  () => route.fullPath,
  async () => {
    aplicarQueryNosFiltros()
    if (!moduloAtivo.value) {
      return
    }

    await carregarListaReposicoes()

    if (painelDetalheAberto.value || painelAgendamentoAberto.value || modalCancelamentoAberto.value) {
      await carregarDetalheReposicao()
      await nextTick()
      panelDetalheRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    } else {
      detalhe.value = null
      direitosDisponiveisAluno.value = []
    }

    if (painelAgendamentoAberto.value) {
      await carregarBasesAgendamento()
      await carregarAulasAgendamento()
      await nextTick()
      panelAgendamentoRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    } else {
      aulasAgendamento.value = []
      previaAgendamento.value = null
    }

    if (modalAjusteAberto.value) {
      await nextTick()
      modalAjusteRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }

    if (modalCancelamentoAberto.value) {
      await nextTick()
      modalCancelamentoRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
    }
  },
  { immediate: true },
)

watch(buscaClientesFiltro, atualizarClientesFiltro)
watch(buscaClientesAjuste, atualizarClientesAjuste)

watch(
  () => filtros.value.size,
  (novoSize, antigoSize) => {
    if (Number(novoSize) !== Number(antigoSize)) {
      atualizarQueryRota({ size: Number(novoSize) || 10, page: 1 })
    }
  },
)

watch(
  () => filtrosAgendamento.value.size,
  (novoSize, antigoSize) => {
    if (Number(novoSize) !== Number(antigoSize)) {
      filtrosAgendamento.value.page = 1
      if (painelAgendamentoAberto.value) {
        carregarAulasAgendamento()
      }
    }
  },
)

onMounted(() => {
  carregarTudo().catch((error) => {
    console.error(error)
    erroLista.value = obterMensagemErro(error, 'Não foi possível carregar a tela de reposições.')
  })
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  if (debounceClientesFiltro) clearTimeout(debounceClientesFiltro)
  if (debounceClientesAjuste) clearTimeout(debounceClientesAjuste)
})
</script>

<template>
  <main class="pagina reposicoes-pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Gestão Esportiva</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">{{ descricaoPagina }}</p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" :disabled="carregandoLista" @click="carregarListaReposicoes">
          {{ carregandoLista ? 'Atualizando...' : 'Atualizar' }}
        </button>
        <button class="botao principal" type="button" @click="abrirAjusteManual">Conceder reposição</button>
      </div>
    </header>

    <section v-if="feedback" class="feedback" :class="tipoFeedback">
      <p>{{ feedback }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso">
      <p>Selecione uma empresa no seletor superior para operar esta área como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloAtivo" class="card aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <template v-else>
      <section class="grade-resumo">
        <article v-for="item in resumoCards" :key="item.chave" class="card resumo-card">
          <span>{{ item.rotulo }}</span>
          <strong>{{ item.valor }}</strong>
        </article>
      </section>

      <section class="card card-lista">
        <div class="cabecalho-lista">
          <div>
            <h2>Lista de reposições</h2>
            <p>{{ resumoFonte }} · {{ totalListaExibido }} resultado(s)</p>
          </div>

          <span class="contador">Página {{ paginaAtualHumana }} de {{ totalPaginasLista }}</span>
        </div>

        <details class="filtros-card" open>
          <summary>Filtros</summary>

          <div class="campos-filtros">
            <label class="campo-busca campo-busca-aluno">
              Aluno
              <input
                v-model="buscaClientesFiltro"
                type="search"
                placeholder="Busque o cliente por nome, telefone ou e-mail"
              />
              <small v-if="filtros.alunoId" class="ajuda-campo">
                Selecionado: {{ filtros.alunoBusca || 'Aluno escolhido' }}
                <button class="link-texto" type="button" @click="limparAlunoFiltro">Limpar</button>
              </small>
            </label>

            <div v-if="carregandoClientesFiltro" class="lista-sugestoes">
              <span class="mensagem-suave">Carregando clientes...</span>
            </div>

            <div v-else-if="resultadosClientesFiltro.length" class="lista-sugestoes">
              <button
                v-for="cliente in resultadosClientesFiltro"
                :key="cliente.id"
                class="chip-sugestao"
                type="button"
                @click="selecionarClienteFiltro(cliente)"
              >
                <strong>{{ cliente.nome }}</strong>
                <small v-if="cliente.telefone || cliente.email">
                  {{ [cliente.telefone, cliente.email].filter(Boolean).join(' · ') }}
                </small>
              </button>
            </div>

            <label>
              Situação
              <select v-model="filtros.situacao">
                <option value="">Todas</option>
                <option value="DISPONIVEL">Disponível</option>
                <option value="RESERVADO">Reservada</option>
                <option value="UTILIZADO">Utilizada</option>
                <option value="EXPIRADO">Expirada</option>
                <option value="CANCELADO">Cancelada</option>
              </select>
            </label>

            <label>
              Motivo de origem
              <select v-model="filtros.motivoOrigem">
                <option value="">Todos</option>
                <option value="FALTA_JUSTIFICADA">Falta justificada</option>
                <option value="AULA_CANCELADA">Aula cancelada</option>
                <option value="AJUSTE_MANUAL">Ajuste manual</option>
              </select>
            </label>

            <label>
              Validade inicial
              <input v-model="filtros.validadeInicial" type="date" />
            </label>

            <label>
              Validade final
              <input v-model="filtros.validadeFinal" type="date" />
            </label>

            <label class="campo-grande">
              Texto
              <input v-model="filtros.texto" type="search" placeholder="Buscar por aluno, turma ou observação" />
            </label>

            <label>
              Quantidade por página
              <select v-model.number="filtros.size">
                <option :value="10">10</option>
                <option :value="20">20</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
              </select>
            </label>
          </div>

          <div class="acoes-filtros">
            <button class="botao secundario" type="button" @click="limparFiltros">Limpar filtros</button>
            <button class="botao principal" type="button" @click="aplicarFiltros">Aplicar filtros</button>
          </div>
        </details>

        <section v-if="erroLista" class="estado-erro">
          <p>{{ erroLista }}</p>
          <button class="botao principal" type="button" @click="carregarListaReposicoes">Tentar novamente</button>
        </section>

        <section v-else-if="carregandoLista" class="estado-vazio">
          <p>Carregando reposições...</p>
        </section>

        <section v-else-if="!reposicoes.length" class="estado-vazio">
          <p>{{ listaVaziaTexto }}</p>
        </section>

        <template v-else>
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Aluno</th>
                  <th>Situação</th>
                  <th>Motivo</th>
                  <th>Aula/turma de origem</th>
                  <th>Data de geração</th>
                  <th>Validade</th>
                  <th>Aula/turma de reposição</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="item in reposicoes" :key="item.id">
                  <td data-label="Aluno">
                    <strong>{{ item.alunoNome }}</strong>
                    <div class="linha-secundaria">
                      <span v-if="item.alunoId" class="chip-chip sutileza">Aluno {{ item.alunoId }}</span>
                    </div>
                  </td>
                  <td data-label="Situação">
                    <span class="chip-chip" :class="classeSituacaoReposicao(item.situacao)">
                      {{ rotuloSituacaoReposicao(item.situacao) }}
                    </span>
                  </td>
                  <td data-label="Motivo">{{ rotuloMotivoReposicao(item.motivoOrigem) }}</td>
                  <td data-label="Aula/turma de origem">
                    <strong>{{ item.aulaOrigem.turmaNome || item.turmaOrigem || 'Não informado' }}</strong>
                    <p class="linha-secundaria">{{ rotuloAulaResumo(item.aulaOrigem) }}</p>
                    <p v-if="item.frequenciaOrigem" class="linha-secundaria">Frequência: {{ item.frequenciaOrigem }}</p>
                  </td>
                  <td data-label="Data de geração">{{ formatarDataHora(item.dataGeracao) }}</td>
                  <td data-label="Validade">{{ formatarDataPtBrSemFuso(item.validade) || '-' }}</td>
                  <td data-label="Aula/turma de reposição">
                    <strong>{{ item.aulaReposicao.turmaNome || item.turmaReposicao || 'Sem agendamento' }}</strong>
                    <p class="linha-secundaria">{{ rotuloAulaResumo(item.aulaReposicao) }}</p>
                    <p v-if="item.reservadoEm" class="linha-secundaria">Reservado em: {{ formatarDataHora(item.reservadoEm) }}</p>
                    <p v-else-if="item.utilizadoEm" class="linha-secundaria">Utilizado em: {{ formatarDataHora(item.utilizadoEm) }}</p>
                    <p v-else-if="item.canceladoEm" class="linha-secundaria">Cancelado em: {{ formatarDataHora(item.canceladoEm) }}</p>
                  </td>
                  <td data-label="Ações" class="acoes-tabela">
                    <button class="botao secundario compacto" type="button" @click="abrirDetalheReposicao(item)">
                      Detalhes
                    </button>
                    <button
                      v-if="item.situacao === 'DISPONIVEL'"
                      class="botao principal compacto"
                      type="button"
                      @click="abrirAgendamentoReposicao(item)"
                    >
                      Agendar reposição
                    </button>
                    <button
                      v-else-if="item.situacao === 'RESERVADO'"
                      class="botao secundario compacto"
                      type="button"
                      @click="abrirCancelamentoAgendamento(item)"
                    >
                      Cancelar agendamento
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>

          <PaginacaoCompacta
            :pagina="paginacaoLista.page"
            :total-pages="paginacaoLista.totalPages"
            :total-elements="paginacaoLista.totalElements"
            :disabled="carregandoLista"
            @anterior="irParaPaginaAnterior"
            @proxima="irParaProximaPagina"
          />
        </template>
      </section>

      <section v-if="painelDetalheAberto" ref="panelDetalheRef" class="card painel-detalhe">
        <div class="cabecalho-painel">
          <div>
            <p class="subtitulo">Detalhes</p>
            <h2>{{ detalhe ? detalhe.alunoNome : 'Detalhes da reposição' }}</h2>
            <p class="descricao">{{ textoEstadoDetalhe }}</p>
          </div>

          <div class="acoes-painel">
            <button class="botao secundario" type="button" @click="fecharAcaoAtual">Fechar</button>
            <button
              v-if="detalhe && detalhe.situacao === 'DISPONIVEL'"
              class="botao principal"
              type="button"
              @click="abrirAgendamentoReposicao(detalhe)"
            >
              Agendar reposição
            </button>
            <button
              v-else-if="detalhe && detalhe.situacao === 'RESERVADO'"
              class="botao secundario"
              type="button"
              @click="abrirCancelamentoAgendamento(detalhe)"
            >
              Cancelar agendamento
            </button>
            <button class="botao principal" type="button" @click="abrirAjusteManual">Conceder reposição</button>
          </div>
        </div>

        <section v-if="erroDetalhe" class="estado-erro">
          <p>{{ erroDetalhe }}</p>
          <button class="botao principal" type="button" @click="carregarDetalheReposicao">Tentar novamente</button>
        </section>

        <section v-else-if="carregandoDetalhe && !detalhe" class="estado-vazio">
          <p>Carregando detalhe...</p>
        </section>

        <template v-else-if="detalhe">
          <div class="grade-detalhes">
            <article class="mini-card">
              <span>Aluno</span>
              <strong>{{ detalhe.alunoNome }}</strong>
            </article>
            <article class="mini-card">
              <span>Situação</span>
              <strong>{{ rotuloSituacaoReposicao(detalhe.situacao) }}</strong>
            </article>
            <article class="mini-card">
              <span>Motivo de origem</span>
              <strong>{{ rotuloMotivoReposicao(detalhe.motivoOrigem) }}</strong>
            </article>
            <article class="mini-card">
              <span>Validade</span>
              <strong>{{ formatarDataPtBrSemFuso(detalhe.validade) || '-' }}</strong>
            </article>
            <article class="mini-card">
              <span>Gerada em</span>
              <strong>{{ formatarDataHora(detalhe.dataGeracao) }}</strong>
            </article>
            <article class="mini-card">
              <span>Reservada em</span>
              <strong>{{ formatarDataHora(detalhe.reservadoEm) }}</strong>
            </article>
            <article class="mini-card">
              <span>Utilizada em</span>
              <strong>{{ formatarDataHora(detalhe.utilizadoEm) }}</strong>
            </article>
            <article class="mini-card">
              <span>Cancelada em</span>
              <strong>{{ formatarDataHora(detalhe.canceladoEm) }}</strong>
            </article>
          </div>

          <div class="grade-origem-destino">
            <article class="bloco-info">
              <h3>Aula de origem</h3>
              <p>{{ rotuloAulaResumo(detalhe.aulaOrigem) }}</p>
              <p v-if="detalhe.turmaOrigem"><strong>Turma:</strong> {{ detalhe.turmaOrigem }}</p>
              <p v-if="detalhe.frequenciaOrigem"><strong>Frequência:</strong> {{ detalhe.frequenciaOrigem }}</p>
            </article>

            <article class="bloco-info">
              <h3>Aula de reposição</h3>
              <p v-if="detalhe.aulaReposicao.id || detalhe.aulaReposicao.turmaNome">{{ rotuloAulaResumo(detalhe.aulaReposicao) }}</p>
              <p v-else>Sem reposição agendada.</p>
              <p v-if="detalhe.turmaReposicao"><strong>Turma:</strong> {{ detalhe.turmaReposicao }}</p>
            </article>
          </div>

          <section v-if="detalhe.observacao" class="bloco-info">
            <h3>Observação</h3>
            <p>{{ detalhe.observacao }}</p>
          </section>

          <section class="bloco-info">
            <h3>Histórico essencial</h3>
            <div v-if="detalhe.historico.length" class="lista-historico">
              <article v-for="(item, indice) in detalhe.historico" :key="`${indice}-${item.texto}`" class="item-historico">
                <strong>{{ item.texto }}</strong>
                <small>{{ formatarDataHora(item.data) }}</small>
              </article>
            </div>
            <p v-else>Sem histórico adicional fornecido pelo backend.</p>
          </section>

          <section class="bloco-info">
            <h3>Direitos disponíveis para o aluno</h3>
            <section v-if="!direitosDisponiveisAluno.length" class="estado-vazio estado-vazio-compacto">
              <p>Nenhum direito disponível para o aluno.</p>
            </section>
            <div v-else class="lista-historico">
              <article v-for="item in direitosDisponiveisAluno" :key="item.id" class="item-historico">
                <strong>{{ rotuloSituacaoReposicao(item.situacao) }} · {{ item.validade ? formatarDataPtBrSemFuso(item.validade) : 'Sem validade' }}</strong>
                <small>{{ item.aulaOrigem.turmaNome || item.turmaOrigem || 'Origem não informada' }}</small>
                <button class="botao secundario compacto" type="button" @click="abrirAgendamentoReposicao(item)">
                  Agendar reposição
                </button>
              </article>
            </div>
          </section>
        </template>
      </section>

      <section v-if="painelAgendamentoAberto" ref="panelAgendamentoRef" class="card painel-agendamento">
        <div class="cabecalho-painel">
          <div>
            <p class="subtitulo">Agendamento</p>
            <h2>Agendar reposição</h2>
            <p class="descricao">Escolha a aula, confira a prévia e confirme apenas quando tudo estiver correto.</p>
          </div>

          <button class="botao secundario" type="button" @click="fecharAcaoAtual">Fechar</button>
        </div>

        <section class="agendamento-grid">
          <div class="bloco-agendamento">
            <details open class="filtros-card">
              <summary>Filtros de aula</summary>
              <div class="campos-filtros">
                <label>
                  Data inicial
                  <input v-model="filtrosAgendamento.dataInicial" type="date" />
                </label>
                <label>
                  Data final
                  <input v-model="filtrosAgendamento.dataFinal" type="date" />
                </label>
                <label>
                  Turma
                  <select v-model="filtrosAgendamento.turmaId">
                    <option value="">Todas</option>
                    <option v-for="turma in turmaOptions" :key="turma.id" :value="String(turma.id)">
                      {{ turma.nome }}
                    </option>
                  </select>
                </label>
                <label>
                  Professor
                  <select v-model="filtrosAgendamento.professorId">
                    <option value="">Todos</option>
                    <option v-for="professor in professorOptions" :key="professor.id" :value="String(professor.id)">
                      {{ professor.nome }}
                    </option>
                  </select>
                </label>
                <label class="campo-grande">
                  Texto
                  <input v-model="filtrosAgendamento.texto" type="search" placeholder="Buscar por turma, professor ou horário" />
                </label>
              </div>

              <div class="acoes-filtros">
                <button class="botao secundario" type="button" @click="limparFiltrosAgendamento">
                  Limpar
                </button>
                <button class="botao principal" type="button" @click="recarregarAulasAgendamento">Carregar aulas</button>
              </div>
            </details>

            <section v-if="erroAgendamento && !previaAgendamento" class="estado-erro">
              <p>{{ erroAgendamento }}</p>
              <button class="botao principal" type="button" @click="carregarAulasAgendamento">Tentar novamente</button>
            </section>

            <section v-else-if="carregandoAulasAgendamento" class="estado-vazio">
              <p>Carregando aulas futuras e agendadas...</p>
            </section>

            <section v-else-if="!aulasAgendamento.length" class="estado-vazio">
              <p>Nenhuma aula disponível para agendamento com os filtros atuais.</p>
            </section>

            <div v-else class="lista-aulas-agendamento">
              <button
                v-for="aula in aulasAgendamento"
                :key="aula.id"
                type="button"
                class="card-aula"
                :class="{ selecionada: String(filtrosAgendamento.aulaDestinoId) === String(aula.id) }"
                @click="selecionarAulaDestino(aula)"
              >
                <strong>{{ aula.descricao }}</strong>
                <span class="chip-chip sutileza">Aula {{ aula.id }}</span>
                <small v-if="aula.nivel">{{ rotuloNivelBeachTennis(aula.nivel) || aula.nivel }}</small>
                <small v-if="aula.competicao">{{ rotuloCompeticaoBeachTennis(true) }}</small>
                <small v-if="aula.vagasDisponiveis || aula.limite">Vagas: {{ aula.vagasDisponiveis || 0 }} / {{ aula.limite || '—' }}</small>
              </button>
            </div>

              <PaginacaoCompacta
              :pagina="paginacaoAulasAgendamento.page"
              :total-pages="paginacaoAulasAgendamento.totalPages"
              :total-elements="paginacaoAulasAgendamento.totalElements"
              :disabled="carregandoAulasAgendamento"
              @anterior="irParaPaginaAnteriorAulas"
              @proxima="irParaProximaPaginaAulas"
            />
          </div>

          <div class="bloco-agendamento">
            <section v-if="erroAgendamento && previaAgendamento" class="estado-erro">
              <p>{{ erroAgendamento }}</p>
            </section>

            <section v-if="!filtrosAgendamento.aulaDestinoId" class="estado-vazio">
              <p>Selecione uma aula para visualizar a prévia.</p>
            </section>

            <template v-else>
              <article class="bloco-info">
                <h3>Prévia</h3>
                <p v-if="carregandoPrevia">Consultando prévia...</p>
                <template v-else-if="previaAgendamento">
                  <p class="linha-secundaria">
                    <strong>Permitido:</strong> {{ previaAgendamento.permitido ? 'Sim' : 'Não' }}
                  </p>
                  <p v-if="previaAgendamento.bloqueios.length" class="linha-secundaria">
                    <strong>Bloqueios:</strong> {{ previaAgendamento.bloqueios.join(' · ') }}
                  </p>
                  <p v-if="previaAgendamento.alertas.length" class="linha-secundaria">
                    <strong>Alertas:</strong> {{ previaAgendamento.alertas.join(' · ') }}
                  </p>
                  <p v-if="previaAgendamento.motivoBloqueio" class="linha-secundaria aviso-linha">
                    {{ previaAgendamento.motivoBloqueio }}
                  </p>
                  <p class="linha-secundaria">
                    <strong>Capacidade:</strong>
                    {{
                      previaAgendamento.capacidade
                        ? `${previaAgendamento.capacidade.ocupacaoAtual}/${previaAgendamento.capacidade.limite}`
                        : '-'
                    }}
                  </p>
                  <p class="linha-secundaria">
                    <strong>Lotada:</strong>
                    {{
                      previaAgendamento.capacidade
                        ? previaAgendamento.capacidade.lotada
                          ? 'Sim'
                          : 'Não'
                        : '-'
                    }}
                  </p>
                  <p v-if="previaAgendamento.turmaLotada" class="linha-secundaria aviso-linha">
                    A turma está lotada e exige confirmação explícita.
                  </p>
                </template>
                <p v-else class="linha-secundaria">A prévia aparecerá após a seleção da aula.</p>
              </article>

              <article class="bloco-info">
                <h3>Dados do direito</h3>
                <p><strong>Aluno:</strong> {{ detalhe?.alunoNome || 'Não informado' }}</p>
                <p><strong>Situação:</strong> {{ detalhe ? rotuloSituacaoReposicao(detalhe.situacao) : '-' }}</p>
                <p><strong>Validade:</strong> {{ detalhe?.validade ? formatarDataPtBrSemFuso(detalhe.validade) : '-' }}</p>
                <p><strong>Origem:</strong> {{ detalhe ? rotuloAulaResumo(detalhe.aulaOrigem) : '-' }}</p>
                <p><strong>Turma de origem:</strong> {{ detalhe?.turmaOrigem || '-' }}</p>
              </article>

              <article class="bloco-info">
                <h3>Dados da aula destino</h3>
                <p><strong>Aula:</strong> {{ classSelecionadaAgendamento ? rotuloAulaResumo(classSelecionadaAgendamento) : '-' }}</p>
                <p><strong>Turma:</strong> {{ classSelecionadaAgendamento?.turmaNome || '-' }}</p>
                <p><strong>Professor:</strong> {{ classSelecionadaAgendamento?.professorNome || '-' }}</p>
                <p><strong>Nível:</strong> {{ classSelecionadaAgendamento?.nivel ? rotuloNivelBeachTennis(classSelecionadaAgendamento.nivel) || classSelecionadaAgendamento.nivel : '-' }}</p>
                <p><strong>Competição:</strong> {{ classSelecionadaAgendamento?.competicao ? rotuloCompeticaoBeachTennis(true) : 'Não' }}</p>
              </article>

              <label class="campo-grande">
                Observação
                <textarea v-model="filtrosAgendamento.observacao" rows="3" placeholder="Observação opcional, quando suportada pelo backend"></textarea>
              </label>

              <label class="checkbox-confirmacao" v-if="previaAgendamento && (previaAgendamento.exigeConfirmacao || previaAgendamento.turmaLotada)">
                <input v-model="filtrosAgendamento.confirmarTurmaLotada" type="checkbox" />
                <span>Confirmo o agendamento mesmo com os alertas de lotação.</span>
              </label>

              <div class="acoes-painel acoes-agendamento">
                <button class="botao secundario" type="button" @click="fecharAcaoAtual">Voltar</button>
                <button class="botao principal" type="button" :disabled="bloquearConfirmacaoAgendamento" @click="confirmarAgendamento">
                  {{ textoBotaoConfirmarAgendamento }}
                </button>
              </div>
            </template>
          </div>
        </section>
      </section>
    </template>

    <section v-if="modalAjusteAberto" ref="modalAjusteRef" class="modal-fundo">
      <section class="card modal-card">
        <div class="cabecalho-painel">
          <div>
            <p class="subtitulo">Ajuste manual</p>
            <h2>Conceder reposição</h2>
            <p class="descricao">Preencha os dados abaixo para criar um novo direito de reposição.</p>
          </div>
          <button class="botao secundario" type="button" @click="fecharAcaoAtual">Fechar</button>
        </div>

        <div class="campos-filtros">
          <label class="campo-grande">
            Aluno
            <input
              v-model="buscaClientesAjuste"
              type="search"
              placeholder="Busque o cliente por nome, telefone ou e-mail"
            />
            <small v-if="ajusteManual.alunoId" class="ajuda-campo">
              Selecionado: {{ buscaClientesAjuste || 'Aluno escolhido' }}
              <button class="link-texto" type="button" @click="limparAlunoAjuste">Limpar</button>
            </small>
          </label>

          <div v-if="carregandoClientesAjuste" class="lista-sugestoes campo-grande">
            <span class="mensagem-suave">Carregando clientes...</span>
          </div>

          <div v-else-if="resultadosClientesAjuste.length" class="lista-sugestoes campo-grande">
            <button
              v-for="cliente in resultadosClientesAjuste"
              :key="cliente.id"
              class="chip-sugestao"
              type="button"
              @click="selecionarClienteAjuste(cliente)"
            >
              <strong>{{ cliente.nome }}</strong>
              <small v-if="cliente.telefone || cliente.email">
                {{ [cliente.telefone, cliente.email].filter(Boolean).join(' · ') }}
              </small>
            </button>
          </div>

          <label>
            Data de validade
            <input v-model="ajusteManual.dataValidade" type="date" />
          </label>

          <label class="campo-grande">
            Observação
            <textarea v-model="ajusteManual.observacao" rows="4" placeholder="Explique o motivo da concessão"></textarea>
          </label>
        </div>

        <p v-if="erroAjuste" class="estado-erro">{{ erroAjuste }}</p>

        <div class="acoes-painel acoes-modal">
          <button class="botao secundario" type="button" @click="fecharAcaoAtual">Cancelar</button>
          <button class="botao principal" type="button" :disabled="carregandoAjuste" @click="salvarAjusteManual">
            {{ textoBotaoSalvarAjuste }}
          </button>
        </div>
      </section>
    </section>

    <section v-if="modalCancelamentoAberto" ref="modalCancelamentoRef" class="modal-fundo">
      <section class="card modal-card">
        <div class="cabecalho-painel">
          <div>
            <p class="subtitulo">Cancelamento</p>
            <h2>Cancelar agendamento</h2>
            <p class="descricao">Informe o motivo para cancelar o agendamento da reposição.</p>
          </div>
          <button class="botao secundario" type="button" @click="fecharAcaoAtual">Fechar</button>
        </div>

        <div class="bloco-info">
          <p><strong>Aluno:</strong> {{ detalhe?.alunoNome || 'Não informado' }}</p>
          <p><strong>Reposição:</strong> {{ detalhe ? rotuloAulaResumo(detalhe.aulaReposicao) : '-' }}</p>
        </div>

        <label class="campo-grande">
          Motivo do cancelamento
          <textarea v-model="cancelamentoAgendamento.motivo" rows="4" placeholder="Informe o motivo do cancelamento"></textarea>
        </label>

        <p v-if="erroCancelamento" class="estado-erro">{{ erroCancelamento }}</p>

        <div class="acoes-painel acoes-modal">
          <button class="botao secundario" type="button" @click="fecharAcaoAtual">Cancelar</button>
          <button class="botao principal" type="button" :disabled="carregandoCancelamento" @click="confirmarCancelamentoAgendamento">
            {{ carregandoCancelamento ? 'Cancelando...' : 'Confirmar cancelamento' }}
          </button>
        </div>
      </section>
    </section>
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
.card,
.modal-card {
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

.subtitulo {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-primary);
}

.cabecalho-pagina h1,
.cabecalho-pagina h2,
.cabecalho-lista h2,
.cabecalho-painel h2 {
  margin: 0;
}

.descricao,
.linha-secundaria,
.bloco-info p,
.item-historico small,
.estado-vazio p,
.estado-erro p,
.feedback p {
  margin: 0;
  color: var(--app-text-muted);
}

.acoes-cabecalho,
.acoes-painel,
.acoes-filtros {
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

.botao.compacto {
  padding: 9px 12px;
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

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(5, minmax(0, 1fr));
  gap: 14px;
}

.resumo-card {
  display: grid;
  gap: 6px;
  padding: 16px;
}

.resumo-card span,
.mini-card span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.resumo-card strong,
.mini-card strong {
  font-size: 24px;
  font-weight: 900;
}

.card-lista,
.painel-detalhe,
.painel-agendamento,
.modal-card {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.cabecalho-lista,
.cabecalho-painel {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  flex-wrap: wrap;
}

.contador {
  background: var(--app-primary-soft);
  color: var(--app-primary);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 900;
  white-space: nowrap;
}

.filtros-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface-soft);
}

.filtros-card summary {
  cursor: pointer;
  font-weight: 800;
}

.campos-filtros {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.campo-grande {
  grid-column: 1 / -1;
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

.lista-sugestoes {
  display: grid;
  gap: 8px;
}

.chip-sugestao {
  display: grid;
  gap: 4px;
  text-align: left;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
}

.chip-sugestao strong {
  font-size: 14px;
}

.chip-sugestao small {
  color: var(--app-text-muted);
}

.tabela-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text);
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  word-break: break-word;
}

th {
  background: var(--app-surface-soft);
  color: var(--app-text);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.acoes-tabela {
  display: flex;
  flex-direction: column;
  gap: 8px;
  min-width: 150px;
}

.chip-chip {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
}

.chip-chip.sutileza {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.situacao-disponivel {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.situacao-reservado {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.situacao-utilizado,
.situacao-cancelado,
.situacao-expirado {
  background: var(--app-danger-soft);
  color: var(--app-danger);
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
  color: var(--app-danger);
}

.estado-vazio-compacto {
  padding: 16px 14px;
  text-align: left;
}

.grade-detalhes {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
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

.grade-origem-destino {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.bloco-info {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.bloco-info h3 {
  margin: 0;
}

.lista-historico {
  display: grid;
  gap: 10px;
}

.item-historico {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 12px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
}

.item-historico strong {
  font-size: 14px;
}

.linha-secundaria {
  font-size: 13px;
}

.aviso-linha {
  color: var(--app-warning);
  font-weight: 700;
}

.bloco-agendamento {
  display: grid;
  gap: 16px;
  min-width: 0;
}

.agendamento-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.1fr) minmax(0, 0.9fr);
  gap: 16px;
}

.lista-aulas-agendamento {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.card-aula {
  display: grid;
  gap: 8px;
  padding: 14px;
  border-radius: 16px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
}

.card-aula.selecionada {
  border-color: var(--app-primary);
  box-shadow: inset 0 0 0 1px var(--app-primary);
}

.checkbox-confirmacao {
  display: flex;
  gap: 10px;
  align-items: center;
}

.checkbox-confirmacao input {
  width: 18px;
  height: 18px;
  accent-color: var(--app-primary);
}

.acoes-agendamento,
.acoes-modal {
  justify-content: flex-end;
}

.link-texto {
  border: none;
  background: transparent;
  color: var(--app-primary);
  padding: 0;
  font: inherit;
  cursor: pointer;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: var(--app-overlay);
}

@media (max-width: 1180px) {
  .grade-resumo,
  .grade-detalhes,
  .grade-origem-destino {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .agendamento-grid,
  .lista-aulas-agendamento {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .cabecalho-painel {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos-filtros,
  .grade-resumo,
  .grade-detalhes,
  .grade-origem-destino {
    grid-template-columns: 1fr;
  }

  .acoes-painel,
  .acoes-filtros {
    justify-content: flex-start;
  }
}

@media (max-width: 760px) {
  .grade-resumo,
  .grade-detalhes,
  .grade-origem-destino,
  .lista-aulas-agendamento {
    grid-template-columns: 1fr;
  }

  .tabela-container {
    overflow: visible;
  }

  table,
  thead,
  tbody,
  tr,
  th,
  td {
    display: block;
    width: 100%;
  }

  thead {
    position: absolute;
    width: 1px;
    height: 1px;
    margin: -1px;
    padding: 0;
    overflow: hidden;
    clip: rect(0 0 0 0);
    border: 0;
  }

  tr {
    margin-bottom: 12px;
    border: 1px solid var(--app-border);
    border-radius: 14px;
    overflow: hidden;
    background: var(--app-surface);
  }

  td {
    display: flex;
    justify-content: space-between;
    gap: 12px;
    padding: 10px 12px;
    border-bottom: 1px solid var(--app-border);
  }

  td::before {
    content: attr(data-label);
    flex: 0 0 36%;
    color: var(--app-text-muted);
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
  }

  td:last-child {
    border-bottom: none;
  }

  .acoes-tabela {
    min-width: 0;
  }

  .acoes-tabela .botao {
    width: 100%;
  }

  .modal-fundo {
    padding: 0;
    place-items: stretch;
  }

  .modal-card {
    width: 100%;
    min-height: 100vh;
    min-height: 100dvh;
    border-radius: 0;
    overflow: auto;
  }
}

@media (max-width: 640px) {
  .cabecalho-pagina,
  .card-lista,
  .painel-detalhe,
  .painel-agendamento,
  .modal-card {
    padding: 18px;
  }

  .botao,
  .acoes-painel .botao,
  .acoes-filtros .botao {
    width: 100%;
  }
}
</style>
