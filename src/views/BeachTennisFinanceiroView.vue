<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAcordosBeachTennis,
  buscarAcordoBeachTennisDetalhe,
  buscarAcordosPaginadosBeachTennis,
  buscarClientes,
  buscarConfiguracaoBeachTennisFinanceira,
  buscarFuncionarios,
  buscarMensalidadesBeachTennis,
  buscarOpcoesAlunosAcordoBeachTennis,
  buscarOpcoesTurmasAcordoBeachTennis,
  buscarResumoFinanceiroBeachTennis,
  buscarTurmasBeachTennis,
  cobrarMensalidadeWhatsappBeachTennis,
  criarAcordoBeachTennis,
  criarMensalidadeBeachTennis,
  gerarMensalidadesBeachTennis,
  marcarMensalidadePagaBeachTennis,
  modoVisualizacaoEmpresaAtivo,
  reabrirMensalidadeBeachTennis,
  salvarConfiguracaoBeachTennisFinanceira,
  atualizarAcordoBeachTennis,
  cancelarMensalidadeBeachTennis,
} from '@/services/api'
import PaginacaoCompacta from '@/components/PaginacaoCompacta.vue'
import ResumoSelecaoAcordo from '@/components/ResumoSelecaoAcordo.vue'
import SeletorAlunosAcordo from '@/components/SeletorAlunosAcordo.vue'
import SeletorTurmasAcordo from '@/components/SeletorTurmasAcordo.vue'
import {
  normalizarArrayBeachTennis,
  rotuloDiaBeachTennis,
  rotuloNivelBeachTennis,
  rotuloPerfilBeachTennis,
} from '@/utils/beachTennis'
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'
import {
  clonarEstadoSelecaoTemporaria,
  criarEstadoResponsavelPagamento,
  filtrarTurmasAcordoLocal,
  hidratarSelecionadosPorOpcoes,
  paginarListaLocal,
  precisaHidratacaoSelecionados,
} from '@/utils/beachTennisFinanceiro'

const ABAS = [
  { id: 'acordos', rotulo: 'Acordos' },
  { id: 'mensalidades', rotulo: 'Mensalidades' },
  { id: 'resumo', rotulo: 'Resumo financeiro' },
  { id: 'configuracao', rotulo: 'Configuração e PIX' },
]

const OPCOES_MODALIDADE = [
  { valor: 'BEACH_TENNIS', rotulo: 'Beach Tennis' },
  { valor: 'FUTEBOL', rotulo: 'Futebol' },
  { valor: 'FUTSAL', rotulo: 'Futsal' },
  { valor: 'VOLEI', rotulo: 'Volei' },
  { valor: 'TENIS', rotulo: 'Tenis' },
  { valor: 'BASQUETE', rotulo: 'Basquete' },
  { valor: 'NATACAO', rotulo: 'Natacao' },
  { valor: 'ARTES_MARCIAIS', rotulo: 'Artes marciais' },
  { valor: 'OUTRO', rotulo: 'Outro' },
]

const TIPO_CHAVE_PIX = [
  { valor: '', rotulo: 'Selecione' },
  { valor: 'CPF', rotulo: 'CPF' },
  { valor: 'CNPJ', rotulo: 'CNPJ' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'TELEFONE', rotulo: 'Telefone' },
  { valor: 'ALEATORIA', rotulo: 'Chave aleatória' },
]

const GESTAO_GERACAO = [
  { valor: 'AUTOMATICA', rotulo: 'Automática' },
  { valor: 'MANUAL', rotulo: 'Manual' },
]

const PRIMEIRO_MES = [
  { valor: 'INTEGRAL', rotulo: 'Integral' },
  { valor: 'PROPORCIONAL', rotulo: 'Proporcional' },
  { valor: 'MANUAL', rotulo: 'Manual' },
]

const STATUS_ACORDO = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'ATIVO', rotulo: 'Ativo' },
  { valor: 'SUSPENSO', rotulo: 'Suspenso' },
  { valor: 'ENCERRADO', rotulo: 'Encerrado' },
]

const STATUS_MENSALIDADE = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'PENDENTE', rotulo: 'Pendente' },
  { valor: 'PAGA', rotulo: 'Paga' },
  { valor: 'VENCIDA', rotulo: 'Vencida' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
  { valor: 'REABERTA', rotulo: 'Reaberta' },
]

const FORMAS_PAGAMENTO_BEACH_TENNIS = [
  { codigo: 'PIX', rotulo: 'Pix' },
  { codigo: 'DINHEIRO', rotulo: 'Dinheiro' },
  { codigo: 'TRANSFERENCIA', rotulo: 'Transferência' },
  { codigo: 'CARTAO', rotulo: 'Cartão' },
  { codigo: 'OUTRO', rotulo: 'Outro' },
]

const statusPagamentoDisponiveis = [...FORMAS_PAGAMENTO_BEACH_TENNIS]

const abaAtiva = ref('acordos')
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const carregando = ref(false)
const carregandoListaAcordos = ref(false)
const carregandoClientesApoio = ref(false)
const carregandoProfessoresAcordo = ref(false)
const carregandoOpcoesAlunos = ref(false)
const carregandoOpcoesTurmas = ref(false)
const carregandoDetalheAcordoId = ref('')
const salvandoAcordo = ref(false)
const salvandoConfiguracao = ref(false)
const salvandoMensalidade = ref(false)
const processandoAcaoId = ref('')
const acordoEditandoId = ref('')
const inicializandoAcordoFormulario = ref(false)
const mensalidadeManualAberta = ref(false)
const mensalidadePagamentoAberta = ref(false)
const configuracaoTermosAvancadosAberta = ref(false)
const seletorAlunosAberto = ref(false)
const seletorTurmasAberto = ref(false)
const erro = ref('')
const sucesso = ref('')
const erroListagemAcordos = ref('')
const erroSeletorAlunos = ref('')
const erroSeletorTurmas = ref('')
const avisoResponsavelRemovido = ref('')
const acordos = ref([])
const acordosPaginados = ref(criarPaginaVazia(10))
const mensalidades = ref([])
const resumoFinanceiro = ref(null)
const configuracao = ref(criarConfiguracaoPadrao())
const clientes = ref([])
const professoresAcordo = ref([])
const paginaAlunosAcordo = ref(criarPaginaVazia(20))
const paginaTurmasAcordo = ref(criarPaginaVazia(20))
const alunosOpcoesAcordo = ref([])
const turmasOpcoesAcordo = ref([])
const alunosConfirmadosMap = ref(new Map())
const turmasConfirmadasMap = ref(new Map())
const alunosTemporariosIds = ref(new Set())
const turmasTemporariasIds = ref(new Set())
const alunosTemporariosMap = ref(new Map())
const turmasTemporariasMap = ref(new Map())
const competenciaSelecionada = ref(competenciaAtual())
const filtrosMensalidades = ref({
  status: '',
  acordoId: '',
  alunoId: '',
  busca: '',
})
const filtrosAcordosPaginados = ref(criarFiltrosAcordosPaginadosPadrao())
const filtrosAlunosAcordo = ref(criarFiltrosAlunosAcordoPadrao())
const filtrosTurmasAcordo = ref(criarFiltrosTurmasAcordoPadrao())
const buscaAcordosDigitada = ref('')
const buscaAcordosDebounced = ref('')
const buscaAlunoAcordoDigitada = ref('')
const buscaAlunoAcordoDebounced = ref('')
const buscaTurmaAcordoDigitada = ref('')
const buscaTurmaAcordoDebounced = ref('')
const acordoFormulario = ref(criarAcordoPadrao())
const mensalidadeManual = ref(criarMensalidadeManualPadrao())
const pagamentoMensalidade = ref(criarPagamentoPadrao())
const cobrancaWhatsapp = ref(criarCobrancaWhatsappPadrao())
const apoioMensalidadesCarregado = ref(false)
let janelaWhatsapp = null
let botaoAberturaSeletorAlunos = null
let botaoAberturaSeletorTurmas = null
let temporizadorBuscaAcordos = null
let temporizadorBuscaAluno = null
let temporizadorBuscaTurma = null
const controleRequisicoes = {
  acordos: 0,
  acordosAuxiliares: 0,
  clientesApoio: 0,
  professoresAcordo: 0,
  mensalidades: 0,
  resumo: 0,
  configuracao: 0,
  alunos: 0,
  turmas: 0,
  detalhe: 0,
}
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Participante')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Participantes')
const termoResponsavelSingular = computed(() => contextoEsportivo.value?.termoResponsavelSingular || 'Responsável')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
const termoAtividadeSingular = computed(() => contextoEsportivo.value?.termoAtividadeSingular || 'Atividade')
const termoAtividadePlural = computed(() => contextoEsportivo.value?.termoAtividadePlural || 'Atividades')
const termoLocalSingular = computed(() => contextoEsportivo.value?.termoLocalSingular || 'Local')
const termoLocalPlural = computed(() => contextoEsportivo.value?.termoLocalPlural || 'Locais')
const rotuloResponsavelPagamento = 'Responsável pelo pagamento'
const nomeEventoLivre = computed(() => contextoEsportivo.value?.nomeEventoLivre || configuracao.value.nomePlay || 'Jogo livre')
const tituloPagina = computed(() => `Financeiro - ${nomeModalidade.value}`)
const descricaoPagina = computed(() =>
  `Centralize acordos, mensalidades, cobranças no WhatsApp e a configuração de PIX para ${nomeModalidade.value}.`,
)
const nomeAcordoExemplo = computed(() => `Acordo ${nomeModalidade.value}`)
const professoresDisponiveisAcordo = computed(() =>
  [...professoresAcordo.value]
    .map((item) => ({
      id: normalizarId(item.id ?? item.funcionarioId ?? ''),
      nome: String(item.nome || item.nomeCompleto || item.apelido || 'Funcionário').trim(),
      ativo: item.ativo !== false,
    }))
    .filter((item) => item.id && item.ativo !== false)
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)

const alunosSelecionadosIds = computed({
  get: () => acordoFormulario.value.alunoIds || [],
  set: (valor) => {
    acordoFormulario.value.alunoIds = [...new Set((valor || []).map((item) => normalizarId(item)).filter(Boolean))]
    if (
      !inicializandoAcordoFormulario.value &&
      !acordoFormulario.value.alunoIds.includes(normalizarId(acordoFormulario.value.responsavelAlunoId))
    ) {
      acordoFormulario.value.responsavelAlunoId = ''
    }
  },
})

const turmasSelecionadasIds = computed({
  get: () => acordoFormulario.value.turmaIds || [],
  set: (valor) => {
    acordoFormulario.value.turmaIds = [...new Set((valor || []).map((item) => normalizarId(item)).filter(Boolean))]
  },
})

const alunosSelecionadosNoAcordo = computed(() =>
  listarSelecionadosPorIds(
    alunosSelecionadosIds.value,
    alunosConfirmadosMap.value,
    acordoFormulario.value.alunos || [],
    criarAlunoSelecionadoFallback,
  ),
)

const turmasSelecionadasNoAcordo = computed(() =>
  listarSelecionadosPorIds(
    turmasSelecionadasIds.value,
    turmasConfirmadasMap.value,
    acordoFormulario.value.turmas || [],
    criarTurmaSelecionadaFallback,
  ),
)
const alunosTemporariosLista = computed(() =>
  listarSelecionadosPorIds([...alunosTemporariosIds.value], alunosTemporariosMap.value, [], criarAlunoSelecionadoFallback),
)
const turmasTemporariasLista = computed(() =>
  listarSelecionadosPorIds([...turmasTemporariasIds.value], turmasTemporariasMap.value, [], criarTurmaSelecionadaFallback),
)
const alunosDisponiveis = computed(() =>
  [...clientes.value]
    .map((item) => normalizarAluno(item))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)
const turmasDisponiveis = computed(() =>
  [...turmasOpcoesAcordo.value]
    .map((item) => normalizarTurma(item))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)
const alunosSelecionadosResumo = computed(() => alunosSelecionadosNoAcordo.value.slice(0, 6))
const turmasSelecionadasResumo = computed(() => turmasSelecionadasNoAcordo.value.slice(0, 6))
const alunosSelecionadosExtras = computed(() => Math.max(alunosSelecionadosNoAcordo.value.length - alunosSelecionadosResumo.value.length, 0))
const turmasSelecionadasExtras = computed(() => Math.max(turmasSelecionadasNoAcordo.value.length - turmasSelecionadasResumo.value.length, 0))
const gruposResumoOcultos = computed(() => turmasSelecionadasResumo.value)
const gruposOcultosDisponiveis = computed(() => turmasDisponiveis.value)

const responsavelSelecionado = computed(() =>
  alunosSelecionadosNoAcordo.value.find((item) => normalizarId(item.id) === normalizarId(acordoFormulario.value.responsavelAlunoId)) || null,
)
const estadoResponsavelPagamento = computed(() =>
  criarEstadoResponsavelPagamento(alunosSelecionadosNoAcordo.value, acordoFormulario.value.responsavelAlunoId, {
    rotuloItem: termoParticipanteSingular.value.toLocaleLowerCase('pt-BR'),
  }),
)
const avisoResponsavelSelecionado = computed(
  () =>
    avisoResponsavelRemovido.value ||
    (
      !inicializandoAcordoFormulario.value &&
      !responsavelSelecionado.value &&
      estadoResponsavelPagamento.value.ajuda
        ? estadoResponsavelPagamento.value.ajuda
        : ''
    ),
)

const acordosOrdenados = computed(() =>
  [...acordos.value]
    .map((item) => normalizarAcordo(item))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)
const acordosPaginadosLista = computed(() =>
  normalizarListaAcordosPaginados(acordosPaginados.value.content || []),
)

const mensalidadesOrdenadas = computed(() =>
  [...mensalidades.value]
    .map((item) => normalizarMensalidade(item))
    .sort((a, b) => compararTexto(`${a.competencia || ''}-${a.vencimento || ''}-${a.id || ''}`, `${b.competencia || ''}-${b.vencimento || ''}-${b.id || ''}`)),
)

const mensalidadesFiltradas = computed(() =>
  mensalidadesOrdenadas.value.filter((item) => {
    const status = String(filtrosMensalidades.value.status || '').trim().toUpperCase()
    const acordoId = String(filtrosMensalidades.value.acordoId || '').trim()
    const alunoId = String(filtrosMensalidades.value.alunoId || '').trim()
    const busca = normalizarTexto(filtrosMensalidades.value.busca)

    if (status && obterStatusMensalidade(item) !== status) {
      return false
    }

    if (acordoId && String(item.acordoId || '') !== acordoId) {
      return false
    }

    if (alunoId && !item.alunoIds.some((id) => String(id) === alunoId)) {
      return false
    }

    if (busca) {
      const camposBusca = [
        item.nome,
        item.nomeAcordo,
        item.responsavelNome,
        item.integrantesResumo,
        item.turmasResumo,
        item.status,
        item.competencia,
      ]

      return camposBusca.some((valor) => normalizarTexto(valor).includes(busca))
    }

    return true
  }),
)

const resumoNormalizado = computed(() => normalizarResumoFinanceiro(resumoFinanceiro.value || {}))
const atrasosResumo = computed(() => {
  const atrasosBackend = Array.isArray(resumoFinanceiro.value?.atrasos) ? resumoFinanceiro.value.atrasos : []

  if (atrasosBackend.length) {
    return normalizarAtrasos(atrasosBackend).slice(0, 5)
  }

  return calcularResumoLocal().atrasos.slice(0, 5)
})
const previewMensagemConfiguracao = computed(() =>
  montarMensagemPreviewConfiguracao({
    nomeResponsavel: 'Maria Souza',
    nomeAcordo: nomeAcordoExemplo.value,
    competencia: competenciaSelecionada.value,
    valor: 250,
    vencimento: '10/06/2026',
    chavePix: configuracao.value.chavePix || '000.000.000-00',
  }),
)

function criarPaginaVazia(size = 10) {
  return {
    content: [],
    page: 0,
    size,
    totalElements: 0,
    totalPages: 0,
    first: true,
    last: true,
    numberOfElements: 0,
  }
}

function criarFiltrosAcordosPaginadosPadrao() {
  return {
    busca: '',
    status: '',
    page: 0,
    size: 10,
  }
}

function criarFiltrosAlunosAcordoPadrao() {
  return {
    nivel: '',
    perfil: '',
    somenteAtivos: true,
    page: 0,
    size: 20,
  }
}

function criarFiltrosTurmasAcordoPadrao() {
  return {
    diaSemana: '',
    funcionarioId: '',
    nivel: '',
    horarioInicioDe: '',
    horarioInicioAte: '',
    somenteAtivas: true,
    page: 0,
    size: 20,
  }
}

function normalizarPaginaResposta(dados, sizePadrao = 10) {
  if (Array.isArray(dados)) {
    return {
      content: dados,
      page: 0,
      size: sizePadrao,
      totalElements: dados.length,
      totalPages: dados.length > 0 ? 1 : 0,
      first: true,
      last: true,
      numberOfElements: dados.length,
    }
  }

  const base = dados && typeof dados === 'object' ? dados : {}
  const content = Array.isArray(base.content) ? base.content : []
  const page = Number(base.page ?? base.number ?? 0)
  const size = Number(base.size ?? sizePadrao)
  const totalElements = Number(base.totalElements ?? content.length ?? 0)
  const totalPages = Number(base.totalPages ?? (totalElements > 0 ? Math.ceil(totalElements / Math.max(size, 1)) : 0))

  return {
    content,
    page: Number.isFinite(page) ? page : 0,
    size: Number.isFinite(size) && size > 0 ? size : sizePadrao,
    totalElements: Number.isFinite(totalElements) ? totalElements : 0,
    totalPages: Number.isFinite(totalPages) ? totalPages : 0,
    first: base.first === true || page <= 0,
    last: base.last === true || totalPages <= 1 || page >= totalPages - 1,
    numberOfElements: Number(base.numberOfElements ?? content.length ?? 0),
  }
}

function listarSelecionadosPorIds(ids = [], mapa = new Map(), fallbackLista = [], fallbackFactory = (id) => ({ id })) {
  const fallbackMap = new Map(
    [].concat(fallbackLista || []).map((item) => {
      const normalizado = item?.turmaId ? normalizarTurma(item) : normalizarAluno(item)
      return [normalizarId(normalizado.id), normalizado]
    }),
  )

  return ids
    .map((id) => {
      const chave = normalizarId(id)
      return mapa.get(chave) || fallbackMap.get(chave) || fallbackFactory(chave)
    })
    .filter(Boolean)
}

function clonarSet(origem = new Set()) {
  return new Set([...origem].map((item) => normalizarId(item)).filter(Boolean))
}

function clonarMap(origem = new Map()) {
  return new Map(origem)
}

function criarAcordoPadrao() {
  return {
    nome: '',
    valorMensal: '',
    frequenciaSemanal: '',
    diaVencimento: '',
    modoGeracao: 'AUTOMATICA',
    tipoPrimeiroMes: 'INTEGRAL',
    valorPrimeiroMesManual: '',
    dataInicio: '',
    dataFim: '',
    status: 'ATIVO',
    observacoes: '',
    responsavelAlunoId: '',
    clienteResponsavelId: '',
    clienteResponsavelNome: '',
    alunoIds: [],
    turmaIds: [],
    alunos: [],
    turmas: [],
  }
}

function criarMensalidadeManualPadrao() {
  return {
    acordoId: '',
    competencia: competenciaAtual(),
    valor: '',
    dataVencimento: '',
    status: 'PENDENTE',
    observacoes: '',
  }
}

function criarPagamentoPadrao() {
  return {
    id: '',
    valorPago: '',
    dataPagamento: dataAtual(),
    formaPagamento: 'PIX',
    observacao: '',
  }
}

function criarConfiguracaoPadrao() {
  return {
    modalidadeCodigo: '',
    nomeModalidade: '',
    termoParticipanteSingular: '',
    termoParticipantePlural: '',
    termoResponsavelSingular: '',
    termoResponsavelPlural: '',
    termoGrupoSingular: '',
    termoGrupoPlural: '',
    termoAtividadeSingular: '',
    termoAtividadePlural: '',
    termoLocalSingular: '',
    termoLocalPlural: '',
    tipoChavePix: '',
    chavePix: '',
    nomeRecebedor: '',
    templateMensagem:
      'Olá, {nomeResponsavel}! A mensalidade referente a {competencia}, do acordo {nomeAcordo}, está no valor de {valor} e vence em {vencimento}. PIX: {chavePix}. Após o pagamento, por favor envie o comprovante. Obrigado!',
    nomePlay: 'PLAY',
  }
}

function criarCobrancaWhatsappPadrao() {
  return {
    aberta: false,
    titulo: '',
    mensagem: '',
    orientacao: '',
    whatsappUrl: '',
    telefone: '',
  }
}

async function carregarTudo() {
  await carregarContextoGestaoEsportiva()

  if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
    limparDadosTela()
    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''
  sucesso.value = ''

  return Promise.all([carregarAcordosPaginados(), carregarMensalidades(), carregarResumo(), carregarConfiguracao()])
    .catch((exception) => {
      erro.value = obterMensagemErro(exception, `Não foi possível carregar a área financeira de ${nomeModalidade.value}.`)
      console.error(exception)
    })
    .finally(() => {
      carregando.value = false
    })
}

async function carregarClientesApoio() {
  if (clientes.value.length) {
    return clientes.value
  }

  const requisicaoId = ++controleRequisicoes.clientesApoio

  try {
    carregandoClientesApoio.value = true
    const resposta = await buscarClientes()
    if (requisicaoId !== controleRequisicoes.clientesApoio) {
      return clientes.value
    }

    clientes.value = Array.isArray(resposta) ? resposta.map(normalizarAluno) : []
    return clientes.value
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.clientesApoio) {
      return clientes.value
    }

    clientes.value = []
    console.error(exception)
    return clientes.value
  } finally {
    if (requisicaoId === controleRequisicoes.clientesApoio) {
      carregandoClientesApoio.value = false
    }
  }
}

async function carregarProfessoresAcordo() {
  const requisicaoId = ++controleRequisicoes.professoresAcordo

  try {
    carregandoProfessoresAcordo.value = true
    const resposta = await buscarFuncionarios({ ativo: true })
    if (requisicaoId !== controleRequisicoes.professoresAcordo) {
      return
    }

    professoresAcordo.value = Array.isArray(resposta) ? resposta : []
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.professoresAcordo) {
      return
    }

    professoresAcordo.value = []
    console.error(exception)
  } finally {
    if (requisicaoId === controleRequisicoes.professoresAcordo) {
      carregandoProfessoresAcordo.value = false
    }
  }
}

async function carregarAcordos() {
  const requisicaoId = ++controleRequisicoes.acordosAuxiliares

  try {
    const resposta = await buscarAcordosBeachTennis()
    if (requisicaoId !== controleRequisicoes.acordosAuxiliares) {
      return
    }

    acordos.value = Array.isArray(resposta) ? resposta : []
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.acordosAuxiliares) {
      return
    }

    acordos.value = []
    throw exception
  }
}

async function garantirApoioMensalidades() {
  if (apoioMensalidadesCarregado.value) {
    return
  }

  await Promise.all([carregarClientesApoio(), carregarAcordos()])
  apoioMensalidadesCarregado.value = true
}

async function carregarAcordosPaginados({ ajustarPaginaSeVazia = false } = {}) {
  const requisicaoId = ++controleRequisicoes.acordos

  try {
    carregandoListaAcordos.value = true
    erroListagemAcordos.value = ''

    const resposta = await buscarAcordosPaginadosBeachTennis({
      busca: buscaAcordosDebounced.value,
      status: filtrosAcordosPaginados.value.status,
      page: filtrosAcordosPaginados.value.page,
      size: filtrosAcordosPaginados.value.size,
    })

    if (requisicaoId !== controleRequisicoes.acordos) {
      return
    }

    const pagina = normalizarPaginaResposta(resposta, filtrosAcordosPaginados.value.size)

    if (ajustarPaginaSeVazia && !pagina.content.length && pagina.totalElements > 0 && pagina.page > 0) {
      filtrosAcordosPaginados.value.page = pagina.page - 1
      await carregarAcordosPaginados()
      return
    }

    acordosPaginados.value = pagina
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.acordos) {
      return
    }

    acordosPaginados.value = criarPaginaVazia(filtrosAcordosPaginados.value.size)
    erroListagemAcordos.value = obterMensagemErro(exception, 'Não foi possível carregar os acordos agora.')
    console.error(exception)
  } finally {
    if (requisicaoId === controleRequisicoes.acordos) {
      carregandoListaAcordos.value = false
    }
  }
}

async function carregarMensalidades() {
  const requisicaoId = ++controleRequisicoes.mensalidades

  try {
    const resposta = await buscarMensalidadesBeachTennis({
      competencia: competenciaSelecionada.value,
    })
    if (requisicaoId !== controleRequisicoes.mensalidades) {
      return
    }

    mensalidades.value = Array.isArray(resposta) ? resposta : []
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.mensalidades) {
      return
    }

    mensalidades.value = []
    throw exception
  }
}

async function carregarResumo() {
  const requisicaoId = ++controleRequisicoes.resumo

  try {
    const resposta = await buscarResumoFinanceiroBeachTennis({
      competencia: competenciaSelecionada.value,
    })
    if (requisicaoId !== controleRequisicoes.resumo) {
      return
    }

    resumoFinanceiro.value = resposta
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.resumo) {
      return
    }

    resumoFinanceiro.value = null
    console.error(exception)
  }
}

async function carregarConfiguracao() {
  const requisicaoId = ++controleRequisicoes.configuracao

  try {
    const resposta = await buscarConfiguracaoBeachTennisFinanceira()
    if (requisicaoId !== controleRequisicoes.configuracao) {
      return
    }

    configuracao.value = normalizarConfiguracao(resposta)
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.configuracao) {
      return
    }

    configuracao.value = criarConfiguracaoPadrao()
    console.error(exception)
  }
}

function limparDadosTela() {
  limparTemporizadorBusca('acordos')
  limparTemporizadorBusca('alunos')
  limparTemporizadorBusca('turmas')
  acordos.value = []
  acordosPaginados.value = criarPaginaVazia(10)
  mensalidades.value = []
  resumoFinanceiro.value = null
  clientes.value = []
  professoresAcordo.value = []
  paginaAlunosAcordo.value = criarPaginaVazia(20)
  paginaTurmasAcordo.value = criarPaginaVazia(20)
  alunosOpcoesAcordo.value = []
  turmasOpcoesAcordo.value = []
  alunosConfirmadosMap.value = new Map()
  turmasConfirmadasMap.value = new Map()
  alunosTemporariosIds.value = new Set()
  turmasTemporariasIds.value = new Set()
  alunosTemporariosMap.value = new Map()
  turmasTemporariasMap.value = new Map()
  acordoEditandoId.value = ''
  carregandoDetalheAcordoId.value = ''
  inicializandoAcordoFormulario.value = false
  carregando.value = false
  carregandoListaAcordos.value = false
  carregandoClientesApoio.value = false
  carregandoProfessoresAcordo.value = false
  carregandoOpcoesAlunos.value = false
  carregandoOpcoesTurmas.value = false
  mensalidadeManualAberta.value = false
  mensalidadePagamentoAberta.value = false
  seletorAlunosAberto.value = false
  seletorTurmasAberto.value = false
  cobrancaWhatsapp.value = criarCobrancaWhatsappPadrao()
  acordoFormulario.value = criarAcordoPadrao()
  mensalidadeManual.value = criarMensalidadeManualPadrao()
  pagamentoMensalidade.value = criarPagamentoPadrao()
  configuracao.value = criarConfiguracaoPadrao()
  sucesso.value = ''
  erro.value = ''
  erroListagemAcordos.value = ''
  erroSeletorAlunos.value = ''
  erroSeletorTurmas.value = ''
  avisoResponsavelRemovido.value = ''
  apoioMensalidadesCarregado.value = false
  filtrosAcordosPaginados.value = criarFiltrosAcordosPaginadosPadrao()
  filtrosAlunosAcordo.value = criarFiltrosAlunosAcordoPadrao()
  filtrosTurmasAcordo.value = criarFiltrosTurmasAcordoPadrao()
  buscaAcordosDigitada.value = ''
  buscaAcordosDebounced.value = ''
  buscaAlunoAcordoDigitada.value = ''
  buscaAlunoAcordoDebounced.value = ''
  buscaTurmaAcordoDigitada.value = ''
  buscaTurmaAcordoDebounced.value = ''
  controleRequisicoes.acordos += 1
  controleRequisicoes.acordosAuxiliares += 1
  controleRequisicoes.clientesApoio += 1
  controleRequisicoes.professoresAcordo += 1
  controleRequisicoes.mensalidades += 1
  controleRequisicoes.resumo += 1
  controleRequisicoes.configuracao += 1
  controleRequisicoes.alunos += 1
  controleRequisicoes.turmas += 1
  controleRequisicoes.detalhe += 1
}

async function recarregarTudo() {
  await carregarTudo()
}

function abrirNovaAcordo() {
  acordoEditandoId.value = ''
  inicializandoAcordoFormulario.value = false
  acordoFormulario.value = criarAcordoPadrao()
  alunosConfirmadosMap.value = new Map()
  turmasConfirmadasMap.value = new Map()
  encerrarSeletorAlunos()
  encerrarSeletorTurmas()
  avisoResponsavelRemovido.value = ''
  mudarAba('acordos')
}

async function abrirEdicaoAcordo(item) {
  const acordoId = normalizarId(item.id || item.acordoId || '')
  if (!acordoId) return

  const requisicaoId = ++controleRequisicoes.detalhe
  carregandoDetalheAcordoId.value = acordoId
  erro.value = ''
  sucesso.value = ''
  try {
    const resposta = await buscarAcordoBeachTennisDetalhe(acordoId)
    if (requisicaoId !== controleRequisicoes.detalhe) {
      return
    }

    const base = await hidratarDetalheAcordo(acordoId, normalizarAcordo(resposta))
    inicializandoAcordoFormulario.value = true
    acordoFormulario.value = normalizarAcordoFormulario(base)
    acordoEditandoId.value = String(base.id || acordoId)
    alunosConfirmadosMap.value = construirMapaSelecao(base.alunos || [], normalizarAluno)
    turmasConfirmadasMap.value = construirMapaSelecao(base.turmas || [], normalizarTurma)
    acordoFormulario.value.alunos = [...(base.alunos || [])]
    acordoFormulario.value.turmas = [...(base.turmas || [])]
    sincronizarResponsavelAposSelecao(alunosSelecionadosIds.value, {
      limparSilenciosamente: false,
      preservarSePossivel: true,
    })
    mudarAba('acordos')
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.detalhe) {
      return
    }

    erro.value = obterMensagemErro(exception, 'Não foi possível carregar o detalhe completo do acordo.')
    console.error(exception)
  } finally {
    if (requisicaoId === controleRequisicoes.detalhe) {
      inicializandoAcordoFormulario.value = false
      carregandoDetalheAcordoId.value = ''
    }
  }
}

function cancelarEdicaoAcordo(limparMensagens = true) {
  acordoEditandoId.value = ''
  inicializandoAcordoFormulario.value = false
  acordoFormulario.value = criarAcordoPadrao()
  alunosConfirmadosMap.value = new Map()
  turmasConfirmadasMap.value = new Map()
  encerrarSeletorAlunos()
  encerrarSeletorTurmas()
  avisoResponsavelRemovido.value = ''

  if (limparMensagens) {
    sucesso.value = ''
  }
}

async function carregarAlunosEmpresaEfetivaDetalheAcordo() {
  return (await carregarClientesApoio()).map((item) => normalizarAluno(item))
}

async function carregarTurmasDetalheAcordo(acordoId) {
  try {
    const resposta = await buscarOpcoesTurmasAcordoBeachTennis({
      acordoId,
      page: 0,
      size: 200,
      somenteAtivas: false,
    })

    return normalizarPaginaResposta(resposta, 200).content.map((item) => normalizarTurma(item))
  } catch (exception) {
    const resposta = await buscarTurmasBeachTennis()
    return [].concat(resposta || []).map((item) => normalizarTurma(item))
  }
}

async function hidratarDetalheAcordo(acordoId, base) {
  const precisaHidratarAlunos = precisaHidratacaoSelecionados(base.alunoIds || [], base.alunos || [], {
    idKeys: ['id', 'clienteId'],
    nomeKeys: ['nome', 'clienteNome'],
    nomeGenerico: `${termoParticipanteSingular.value} selecionado`,
  })
  const precisaHidratarTurmas = precisaHidratacaoSelecionados(base.turmaIds || [], base.turmas || [], {
    idKeys: ['id', 'turmaId'],
    nomeKeys: ['nome', 'turmaNome'],
    nomeGenerico: `${termoGrupoSingular.value} vinculada`,
  })

  if (!precisaHidratarAlunos && !precisaHidratarTurmas) {
    return base
  }

  const responsavelId = normalizarId(base.clienteResponsavelId || base.responsavelAlunoId)
  const [alunosHidratados, turmasHidratadas] = await Promise.all([
    precisaHidratarAlunos ? carregarAlunosEmpresaEfetivaDetalheAcordo() : Promise.resolve(base.alunos || []),
    precisaHidratarTurmas ? carregarTurmasDetalheAcordo(acordoId) : Promise.resolve(base.turmas || []),
  ])

  let alunos = precisaHidratarAlunos
    ? hidratarSelecionadosPorOpcoes(base.alunoIds || [], base.alunos || [], alunosHidratados, {
        idKeys: ['id', 'clienteId'],
        nomeKeys: ['nome', 'clienteNome'],
        nomeGenerico: `${termoParticipanteSingular.value} selecionado`,
        criarFallback: criarAlunoSelecionadoFallback,
      }).map((item) => normalizarAluno(item))
    : base.alunos || []
  const turmas = precisaHidratarTurmas
    ? hidratarSelecionadosPorOpcoes(base.turmaIds || [], base.turmas || [], turmasHidratadas, {
        idKeys: ['id', 'turmaId'],
        nomeKeys: ['nome', 'turmaNome'],
        nomeGenerico: `${termoGrupoSingular.value} vinculada`,
        criarFallback: criarTurmaSelecionadaFallback,
      }).map((item) => normalizarTurma(item))
    : base.turmas || []

  const precisaCompletarAlunosEmpresaEfetiva = precisaHidratacaoSelecionados(base.alunoIds || [], alunos, {
    idKeys: ['id', 'clienteId'],
    nomeKeys: ['nome', 'clienteNome'],
    nomeGenerico: `${termoParticipanteSingular.value} selecionado`,
  }) || Boolean(responsavelId && !alunos.some((item) => normalizarId(item.id || item.clienteId) === responsavelId))

  if (precisaCompletarAlunosEmpresaEfetiva) {
    alunos = hidratarSelecionadosPorOpcoes(base.alunoIds || [], alunos, await carregarAlunosEmpresaEfetivaDetalheAcordo(), {
      idKeys: ['id', 'clienteId'],
      nomeKeys: ['nome', 'clienteNome'],
      nomeGenerico: `${termoParticipanteSingular.value} selecionado`,
      criarFallback: criarAlunoSelecionadoFallback,
    }).map((item) => normalizarAluno(item))
  }

  const responsavel = alunos.find((item) => normalizarId(item.id || item.clienteId) === responsavelId) || null

  return {
    ...base,
    alunos,
    turmas,
    alunoIds: alunos.map((item) => normalizarId(item.id || item.clienteId)).filter(Boolean),
    turmaIds: turmas.map((item) => normalizarId(item.id || item.turmaId)).filter(Boolean),
    clienteResponsavelId: responsavelId || base.clienteResponsavelId,
    responsavelAlunoId: responsavelId || base.responsavelAlunoId,
    clienteResponsavelNome: responsavel?.nome || base.clienteResponsavelNome,
    responsavelNome: responsavel?.nome || base.responsavelNome,
  }
}

function normalizarAcordoFormulario(item = {}) {
  const acordo = normalizarAcordo(item)
  const status = normalizarStatusAcordoBeachTennis(item.status || 'ATIVO')
  const responsavelAlunoId = normalizarId(
    item.clienteResponsavelId || item.responsavelAlunoId || item.responsavelId || item.responsavelAcordoId || acordo.clienteResponsavelId,
  )

  return {
    nome: acordo.nome || item.nome || '',
    valorMensal: valorParaEntrada(acordo.valorMensal ?? item.valorMensal ?? item.valor ?? item.valorAcordo),
    frequenciaSemanal: String(item.frequenciaSemanal || item.frequencia || ''),
    diaVencimento: String(item.diaVencimento || item.vencimentoDia || ''),
    modoGeracao: String(
      acordo.modoGeracao ||
      item.modoGeracao ||
      item.tipoGeracaoMensalidades ||
      item.tipoGeracao ||
      item.geracaoMensalidades ||
      item.geracao ||
      'AUTOMATICA',
    ).toUpperCase(),
    tipoPrimeiroMes: String(
      acordo.tipoPrimeiroMes ||
      item.tipoPrimeiroMes ||
      item.formaPrimeiroMes ||
      item.primeiroMes ||
      item.primeiroMesCobranca ||
      'INTEGRAL',
    ).toUpperCase(),
    dataInicio: dataParaInput(acordo.dataInicio || item.dataInicio || item.inicio || item.dataInicioVigencia),
    dataFim: dataParaInput(acordo.dataFim || item.dataFim || item.dataFinal || item.fim),
    status,
    observacoes: item.observacoes || item.observacao || acordo.observacoes || '',
    responsavelAlunoId,
    clienteResponsavelId: responsavelAlunoId,
    clienteResponsavelNome: acordo.clienteResponsavelNome || item.clienteResponsavelNome || item.responsavelNome || '',
    valorPrimeiroMesManual: valorParaEntrada(acordo.valorPrimeiroMesManual ?? item.valorPrimeiroMesManual ?? item.primeiroMesValorManual ?? ''),
    alunoIds: [...(acordo.alunoIds || normalizarIds(item.clienteIds || item.alunoIds || []))],
    turmaIds: [...(acordo.turmaIds || normalizarIds(item.turmaIds || []))],
    alunos: [...(acordo.alunos || [])],
    turmas: [...(acordo.turmas || [])],
  }
}

function normalizarAcordo(item = {}) {
  const alunos = normalizarAlunosAcordo(item.alunos || item.integrantes || item.alunoIds || item.clienteIds || [])
  const turmasAcordo = normalizarTurmasAcordo(item.turmas || item.turmaIds || [])
  const status = normalizarStatusAcordoBeachTennis(item.status)
  const clienteResponsavelId = normalizarId(item.clienteResponsavelId || item.responsavelAlunoId || item.responsavelId || item.responsavelAcordoId || '')
  const clienteResponsavelNome =
    item.clienteResponsavelNome ||
    item.responsavelNome ||
    item.responsavel ||
    alunos.find((aluno) => aluno.clienteId === clienteResponsavelId)?.clienteNome ||
    'Responsável não informado'

  return {
    ...item,
    id: normalizarId(item.id ?? item.acordoId ?? item.acordoBeachTennisId ?? ''),
    nome: item.nome || item.descricao || item.titulo || 'Acordo sem nome',
    valorMensal: numeroSeguro(item.valorMensal ?? item.valor ?? item.valorAcordo),
    frequenciaSemanal: String(item.frequenciaSemanal || item.frequencia || ''),
    diaVencimento: String(item.diaVencimento || item.vencimentoDia || ''),
    modoGeracao: String(
      item.modoGeracao || item.tipoGeracaoMensalidades || item.tipoGeracao || item.geracaoMensalidades || item.geracao || '',
    ).trim().toUpperCase(),
    tipoPrimeiroMes: String(item.tipoPrimeiroMes || item.formaPrimeiroMes || item.primeiroMes || item.primeiroMesCobranca || '')
      .trim()
      .toUpperCase(),
    valorPrimeiroMesManual: numeroSeguro(item.valorPrimeiroMesManual ?? item.primeiroMesValorManual),
    dataInicio: item.dataInicio || item.inicio || '',
    dataFim: item.dataFim || item.dataFinal || item.fim || '',
    status,
    observacoes: item.observacoes || item.observacao || '',
    clienteResponsavelId,
    clienteResponsavelNome,
    responsavelAlunoId: clienteResponsavelId,
    responsavelNome: clienteResponsavelNome,
    alunos,
    turmas: turmasAcordo,
    alunoIds: alunos.map((aluno) => aluno.clienteId).filter(Boolean),
    turmaIds: turmasAcordo.map((turma) => turma.turmaId).filter(Boolean),
    whatsappUrl: item.whatsappUrl || item.urlWhatsapp || item.linkWhatsapp || '',
    quantidadeAlunosAtivos: numeroInteiro(item.quantidadeAlunosAtivos ?? alunos.length),
    quantidadeTurmasAtivas: numeroInteiro(item.quantidadeTurmasAtivas ?? turmasAcordo.length),
    atualizadoEm: item.atualizadoEm || item.updatedAt || item.dataAtualizacao || '',
  }
}

function normalizarListaAcordosPaginados(lista = []) {
  return [].concat(lista || []).map((item) => normalizarAcordo(item))
}

function normalizarMensalidade(item = {}) {
  const acordoRelacionado = acordos.value.find((acordo) => String(acordo.id ?? acordo.acordoId ?? '') === String(item.acordoId ?? item.acordoBeachTennisId ?? ''))
  const alunoIds = normalizarIds(
    item.alunoIds ||
      item.alunos ||
      item.integrantes ||
      acordoRelacionado?.alunos ||
      acordoRelacionado?.clienteIds ||
      [],
  )
  const integranteResumo = nomesDosIds(alunoIds)
  const turmaResumo = nomesDosIds(normalizarIds(item.turmas || item.turmaIds || acordoRelacionado?.turmas || []))
  const competencia = String(item.competencia || item.mesReferencia || '').trim()
  const vencimento = dataParaInput(item.dataVencimento || item.vencimento || item.vencimentoPrevisto)
  const status = obterStatusMensalidade(item)

  return {
    ...item,
    id: item.id ?? item.mensalidadeId ?? '',
    acordoId: item.acordoId ?? item.acordoBeachTennisId ?? '',
    nomeAcordo: item.nomeAcordo || item.acordoNome || item.nome || 'Acordo sem nome',
    clienteResponsavelId: item.clienteResponsavelId ?? item.responsavelId ?? acordoRelacionado?.clienteResponsavelId ?? '',
    clienteResponsavelNome:
      item.clienteResponsavelNome || item.responsavelNome || acordoRelacionado?.clienteResponsavelNome || 'Responsável não informado',
    competencia,
    valor: numeroSeguro(item.valor ?? item.valorMensal ?? item.valorCobrado),
    vencimento,
    status,
    statusOriginal: String(item.status || '').trim().toUpperCase(),
    responsavelNome:
      item.clienteResponsavelNome || item.responsavelNome || acordoRelacionado?.clienteResponsavelNome || 'Responsável não informado',
    integranteResumo,
    turmasResumo: turmaResumo,
    alunoIds,
    whatsappUrl: item.whatsappUrl || item.urlWhatsapp || item.linkWhatsapp || '',
    observacao: item.observacao || item.observacoes || '',
    dataPagamento: dataParaInput(item.dataPagamento || item.pagoEm || item.dataQuitacao),
    formaPagamento: normalizarFormaPagamentoBeachTennis(item.formaPagamento || item.metodoPagamento || item.forma),
    valorPago: numeroSeguro(item.valorPago ?? item.valorRecebido ?? item.valor),
    diasAtraso: calcularDiasAtraso(vencimento),
  }
}

function normalizarConfiguracao(item = {}) {
  return {
    modalidadeCodigo: String(item.modalidadeCodigo || contextoEsportivo.value?.modalidadeCodigo || '').trim().toUpperCase(),
    nomeModalidade: item.nomeModalidade || contextoEsportivo.value?.nomeModalidade || '',
    termoParticipanteSingular: item.termoParticipanteSingular || contextoEsportivo.value?.termoParticipanteSingular || '',
    termoParticipantePlural: item.termoParticipantePlural || contextoEsportivo.value?.termoParticipantePlural || '',
    termoResponsavelSingular: item.termoResponsavelSingular || contextoEsportivo.value?.termoResponsavelSingular || '',
    termoResponsavelPlural: item.termoResponsavelPlural || contextoEsportivo.value?.termoResponsavelPlural || '',
    termoGrupoSingular: item.termoGrupoSingular || contextoEsportivo.value?.termoGrupoSingular || '',
    termoGrupoPlural: item.termoGrupoPlural || contextoEsportivo.value?.termoGrupoPlural || '',
    termoAtividadeSingular: item.termoAtividadeSingular || contextoEsportivo.value?.termoAtividadeSingular || '',
    termoAtividadePlural: item.termoAtividadePlural || contextoEsportivo.value?.termoAtividadePlural || '',
    termoLocalSingular: item.termoLocalSingular || contextoEsportivo.value?.termoLocalSingular || '',
    termoLocalPlural: item.termoLocalPlural || contextoEsportivo.value?.termoLocalPlural || '',
    tipoChavePix: String(item.tipoChavePix || item.tipoPix || '').trim().toUpperCase(),
    chavePix: item.chavePix || item.pixChave || item.pix || '',
    nomeRecebedor: item.nomeRecebedorPix || item.nomeRecebedor || item.recebedorNome || '',
    templateMensagem:
      item.mensagemCobrancaTemplate ||
      item.templateMensagem ||
      item.mensagemTemplate ||
      criarConfiguracaoPadrao().templateMensagem,
    nomePlay: item.nomePlay || item.playNome || 'PLAY',
  }
}

function obterSugestaoModalidade(codigo) {
  const chave = String(codigo || '').trim().toUpperCase()

  const sugestoes = {
    BEACH_TENNIS: {
      nomeModalidade: 'Beach Tennis',
      termoParticipanteSingular: 'Aluno',
      termoParticipantePlural: 'Alunos',
      termoResponsavelSingular: 'Professor',
      termoResponsavelPlural: 'Professores',
      termoGrupoSingular: 'Turma',
      termoGrupoPlural: 'Turmas',
      termoAtividadeSingular: 'Aula',
      termoAtividadePlural: 'Aulas',
      termoLocalSingular: 'Quadra',
      termoLocalPlural: 'Quadras',
      nomePlay: 'PLAY',
    },
    FUTEBOL: {
      nomeModalidade: 'Futebol',
      termoParticipanteSingular: 'Atleta',
      termoParticipantePlural: 'Atletas',
      termoResponsavelSingular: 'Treinador',
      termoResponsavelPlural: 'Treinadores',
      termoGrupoSingular: 'Equipe',
      termoGrupoPlural: 'Equipes',
      termoAtividadeSingular: 'Treino',
      termoAtividadePlural: 'Treinos',
      termoLocalSingular: 'Campo',
      termoLocalPlural: 'Campos',
      nomePlay: 'Pelada',
    },
    FUTSAL: {
      nomeModalidade: 'Futsal',
      termoParticipanteSingular: 'Atleta',
      termoParticipantePlural: 'Atletas',
      termoResponsavelSingular: 'Treinador',
      termoResponsavelPlural: 'Treinadores',
      termoGrupoSingular: 'Equipe',
      termoGrupoPlural: 'Equipes',
      termoAtividadeSingular: 'Treino',
      termoAtividadePlural: 'Treinos',
      termoLocalSingular: 'Quadra',
      termoLocalPlural: 'Quadras',
      nomePlay: 'Racha',
    },
    VOLEI: {
      nomeModalidade: 'Volei',
      termoParticipanteSingular: 'Atleta',
      termoParticipantePlural: 'Atletas',
      termoResponsavelSingular: 'Treinador',
      termoResponsavelPlural: 'Treinadores',
      termoGrupoSingular: 'Equipe',
      termoGrupoPlural: 'Equipes',
      termoAtividadeSingular: 'Treino',
      termoAtividadePlural: 'Treinos',
      termoLocalSingular: 'Quadra',
      termoLocalPlural: 'Quadras',
      nomePlay: 'Jogo livre',
    },
    TENIS: {
      nomeModalidade: 'Tenis',
      termoParticipanteSingular: 'Aluno',
      termoParticipantePlural: 'Alunos',
      termoResponsavelSingular: 'Professor',
      termoResponsavelPlural: 'Professores',
      termoGrupoSingular: 'Turma',
      termoGrupoPlural: 'Turmas',
      termoAtividadeSingular: 'Aula',
      termoAtividadePlural: 'Aulas',
      termoLocalSingular: 'Quadra',
      termoLocalPlural: 'Quadras',
      nomePlay: 'Jogo livre',
    },
  }

  return sugestoes[chave] || null
}

function restaurarTermosPadrao() {
  const sugestao = obterSugestaoModalidade(configuracao.value.modalidadeCodigo)
  if (!sugestao) {
    erro.value = 'Selecione uma modalidade com termos disponíveis antes de restaurar os termos.'
    return
  }

  const confirmou = confirmarAcao(
    'Restaurar as nomenclaturas e o template da mensagem para os padrões sugeridos? Os dados PIX não serão apagados.',
  )
  if (!confirmou) {
    return
  }

  const chavePixAtual = configuracao.value.chavePix
  const tipoChavePixAtual = configuracao.value.tipoChavePix
  const nomeRecebedorAtual = configuracao.value.nomeRecebedor
  const nomePlayAtual = configuracao.value.nomePlay

  configuracao.value = {
    ...configuracao.value,
    ...sugestao,
    chavePix: chavePixAtual,
    tipoChavePix: tipoChavePixAtual,
    nomeRecebedor: nomeRecebedorAtual,
    nomePlay: nomePlayAtual,
    templateMensagem: criarConfiguracaoPadrao().templateMensagem,
  }
}

function gerarPayloadAcordo() {
  const clienteIds = obterIdsAlunosElegiveis(alunosSelecionadosIds.value, alunosConfirmadosMap.value)
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id))
  const turmaIds = normalizarIds(turmasSelecionadasIds.value)
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id))
  const modoGeracao = String(acordoFormulario.value.modoGeracao || 'AUTOMATICA').trim().toUpperCase()
  const tipoPrimeiroMes = String(acordoFormulario.value.tipoPrimeiroMes || 'INTEGRAL').trim().toUpperCase()
  const status = normalizarStatusAcordoBeachTennis(acordoFormulario.value.status || 'ATIVO')

  return {
    nome: String(acordoFormulario.value.nome || '').trim(),
    valorMensal: numeroSeguro(acordoFormulario.value.valorMensal),
    frequenciaSemanal: Number.parseInt(String(acordoFormulario.value.frequenciaSemanal || '').trim(), 10) || undefined,
    diaVencimento: Number.parseInt(String(acordoFormulario.value.diaVencimento || '').trim(), 10) || undefined,
    modoGeracao,
    tipoPrimeiroMes,
    valorPrimeiroMesManual:
      tipoPrimeiroMes === 'MANUAL' ? numeroSeguro(acordoFormulario.value.valorPrimeiroMesManual) : undefined,
    dataInicio: acordoFormulario.value.dataInicio || '',
    dataFim: acordoFormulario.value.dataFim || '',
    status,
    observacoes: String(acordoFormulario.value.observacoes || '').trim(),
    clienteResponsavelId: Number.parseInt(String(acordoFormulario.value.responsavelAlunoId || '').trim(), 10) || undefined,
    clienteIds,
    turmaIds,
  }
}

async function salvarAcordo() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  const validacao = validarAcordo()
  if (validacao) {
    erro.value = validacao
    return
  }

  try {
    salvandoAcordo.value = true
    erro.value = ''
    sucesso.value = ''

    const payload = gerarPayloadAcordo()
    let acordoId = acordoEditandoId.value

    if (acordoId) {
      await atualizarAcordoBeachTennis(acordoId, payload)
    } else {
      const resposta = await criarAcordoBeachTennis(payload)
      acordoId = String(resposta?.id || resposta?.acordoId || resposta?.value?.id || '')
    }

    sucesso.value = acordoEditandoId.value ? 'Acordo atualizado com sucesso.' : 'Acordo criado com sucesso.'
    cancelarEdicaoAcordo(false)
    await recarregarAposAlteracao()
  } catch (exception) {
    const mensagem = obterMensagemErro(exception, 'Não foi possível salvar o acordo.')
    erro.value = detectarConflitoAlunoAcordo(mensagem)
      ? `Um dos ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} selecionados já possui um acordo ativo. Revise os integrantes ou encerre o acordo atual.`
      : mensagem
    console.error(exception)
  } finally {
    salvandoAcordo.value = false
  }
}

function validarAcordo() {
  if (!String(acordoFormulario.value.nome || '').trim()) {
    return 'Informe o nome do acordo.'
  }

  if (!alunosSelecionadosIds.value.length) {
    return `Selecione ao menos um ${termoParticipanteSingular.value.toLocaleLowerCase('pt-BR')} para este acordo.`
  }

  if (!String(acordoFormulario.value.responsavelAlunoId || '').trim()) {
    return 'Escolha o responsável pelo pagamento entre os alunos selecionados.'
  }

  if (!alunosSelecionadosIds.value.includes(String(acordoFormulario.value.responsavelAlunoId || ''))) {
    return 'O responsável pelo pagamento precisa estar entre os alunos selecionados.'
  }

  if (!String(acordoFormulario.value.valorMensal || '').trim()) {
    return 'Informe o valor mensal do acordo.'
  }

  if (String(acordoFormulario.value.tipoPrimeiroMes || '').trim().toUpperCase() === 'MANUAL' &&
    !String(acordoFormulario.value.valorPrimeiroMesManual || '').trim()) {
    return 'Informe o valor do primeiro mês manual.'
  }

  return ''
}

function construirMapaSelecao(lista = [], normalizar) {
  return new Map(
    [].concat(lista || []).map((item) => {
      const normalizado = normalizar(item)
      return [normalizarId(normalizado.id), normalizado]
    }),
  )
}

function sincronizarResponsavelAposSelecao(ids = [], { limparSilenciosamente = false, preservarSePossivel = false } = {}) {
  if (inicializandoAcordoFormulario.value) {
    return
  }

  const atual = normalizarId(acordoFormulario.value.responsavelAlunoId)
  if (preservarSePossivel && atual && ids.includes(atual)) {
    avisoResponsavelRemovido.value = ''
    return
  }

  if (atual && ids.includes(atual)) {
    avisoResponsavelRemovido.value = ''
    return
  }

  if (atual && !limparSilenciosamente) {
    avisoResponsavelRemovido.value = 'O responsável anterior saiu do acordo. Escolha outro aluno para continuar.'
  } else if (!atual) {
    avisoResponsavelRemovido.value = ''
  }

  acordoFormulario.value.responsavelAlunoId = ''
}

function preencherMapasConfirmadosDoFormulario() {
  alunosConfirmadosMap.value = construirMapaSelecao(acordoFormulario.value.alunos || [], normalizarAluno)
  turmasConfirmadasMap.value = construirMapaSelecao(acordoFormulario.value.turmas || [], normalizarTurma)
}

function limparSelecaoAlunosAcordo() {
  alunosSelecionadosIds.value = []
  acordoFormulario.value.responsavelAlunoId = ''
  acordoFormulario.value.alunos = []
  alunosConfirmadosMap.value = new Map()
  avisoResponsavelRemovido.value = ''
}

function limparSelecaoTurmasAcordo() {
  turmasSelecionadasIds.value = []
  acordoFormulario.value.turmas = []
  turmasConfirmadasMap.value = new Map()
}

function alternarAlunoAcordo(id) {
  const conjunto = new Set(alunosSelecionadosIds.value.map(String))
  const chave = normalizarId(id)

  if (!chave) return
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
    alunosConfirmadosMap.value.delete(chave)
    alunosConfirmadosMap.value = clonarMap(alunosConfirmadosMap.value)
  } else {
    conjunto.add(chave)
  }

  alunosSelecionadosIds.value = [...conjunto]
  acordoFormulario.value.alunos = alunosSelecionadosNoAcordo.value.map((item) => normalizarAluno(item))
}

function alternarTurmaAcordo(id) {
  const conjunto = new Set(turmasSelecionadasIds.value.map(String))
  const chave = normalizarId(id)

  if (!chave) return
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
    turmasConfirmadasMap.value.delete(chave)
    turmasConfirmadasMap.value = clonarMap(turmasConfirmadasMap.value)
  } else {
    conjunto.add(chave)
  }

  turmasSelecionadasIds.value = [...conjunto]
  acordoFormulario.value.turmas = turmasSelecionadasNoAcordo.value.map((item) => normalizarTurma(item))
}

function buscarAcordosComDebounce() {
  limparTemporizadorBusca('acordos')

  temporizadorBuscaAcordos = window.setTimeout(() => {
    buscaAcordosDebounced.value = String(buscaAcordosDigitada.value || '').trim()
  }, 300)
}

function buscarAlunosAcordoComDebounce() {
  limparTemporizadorBusca('alunos')

  temporizadorBuscaAluno = window.setTimeout(() => {
    buscaAlunoAcordoDebounced.value = String(buscaAlunoAcordoDigitada.value || '').trim()
  }, 300)
}

function buscarTurmasAcordoComDebounce() {
  limparTemporizadorBusca('turmas')

  temporizadorBuscaTurma = window.setTimeout(() => {
    buscaTurmaAcordoDebounced.value = String(buscaTurmaAcordoDigitada.value || '').trim()
  }, 300)
}

function selecionarResponsavelAcordo(id) {
  acordoFormulario.value.responsavelAlunoId = String(id || '').trim()
  if (acordoFormulario.value.responsavelAlunoId) {
    avisoResponsavelRemovido.value = ''
  }
}

function abrirSeletorAlunos(event) {
  if (seletorTurmasAberto.value) {
    encerrarSeletorTurmas()
  }

  botaoAberturaSeletorAlunos = event?.currentTarget || event?.target || null
  erroSeletorAlunos.value = ''
  carregandoOpcoesAlunos.value = false
  limparTemporizadorBusca('alunos')
  buscaAlunoAcordoDigitada.value = ''
  buscaAlunoAcordoDebounced.value = ''
  filtrosAlunosAcordo.value = criarFiltrosAlunosAcordoPadrao()
  alunosOpcoesAcordo.value = []
  paginaAlunosAcordo.value = criarPaginaVazia(filtrosAlunosAcordo.value.size)
  const estadoTemporario = clonarEstadoSelecaoTemporaria(new Set(alunosSelecionadosIds.value), alunosConfirmadosMap.value)
  alunosTemporariosIds.value = estadoTemporario.ids
  alunosTemporariosMap.value = estadoTemporario.mapa
  seletorAlunosAberto.value = true
  void carregarOpcoesAlunosAcordo()
}

function abrirSeletorTurmas(event) {
  if (seletorAlunosAberto.value) {
    encerrarSeletorAlunos()
  }

  botaoAberturaSeletorTurmas = event?.currentTarget || event?.target || null
  erroSeletorTurmas.value = ''
  carregandoOpcoesTurmas.value = false
  carregandoProfessoresAcordo.value = false
  limparTemporizadorBusca('turmas')
  buscaTurmaAcordoDigitada.value = ''
  buscaTurmaAcordoDebounced.value = ''
  filtrosTurmasAcordo.value = criarFiltrosTurmasAcordoPadrao()
  turmasOpcoesAcordo.value = []
  paginaTurmasAcordo.value = criarPaginaVazia(filtrosTurmasAcordo.value.size)
  const estadoTemporario = clonarEstadoSelecaoTemporaria(new Set(turmasSelecionadasIds.value), turmasConfirmadasMap.value)
  turmasTemporariasIds.value = estadoTemporario.ids
  turmasTemporariasMap.value = estadoTemporario.mapa
  seletorTurmasAberto.value = true
  void Promise.all([carregarProfessoresAcordo(), carregarOpcoesTurmasAcordo()])
}

function restaurarFocoNoBotao(gatilho) {
  window.requestAnimationFrame(() => {
    gatilho?.focus?.()
  })
}

function encerrarSeletorAlunos() {
  limparTemporizadorBusca('alunos')
  controleRequisicoes.alunos += 1
  seletorAlunosAberto.value = false
  carregandoOpcoesAlunos.value = false
  erroSeletorAlunos.value = ''
  buscaAlunoAcordoDigitada.value = ''
  buscaAlunoAcordoDebounced.value = ''
  filtrosAlunosAcordo.value = criarFiltrosAlunosAcordoPadrao()
  alunosOpcoesAcordo.value = []
  paginaAlunosAcordo.value = criarPaginaVazia(filtrosAlunosAcordo.value.size)
  alunosTemporariosIds.value = new Set()
  alunosTemporariosMap.value = new Map()
}

function cancelarSeletorAlunos() {
  encerrarSeletorAlunos()
  restaurarFocoNoBotao(botaoAberturaSeletorAlunos)
}

function encerrarSeletorTurmas() {
  limparTemporizadorBusca('turmas')
  controleRequisicoes.turmas += 1
  controleRequisicoes.professoresAcordo += 1
  seletorTurmasAberto.value = false
  carregandoOpcoesTurmas.value = false
  carregandoProfessoresAcordo.value = false
  erroSeletorTurmas.value = ''
  buscaTurmaAcordoDigitada.value = ''
  buscaTurmaAcordoDebounced.value = ''
  filtrosTurmasAcordo.value = criarFiltrosTurmasAcordoPadrao()
  turmasOpcoesAcordo.value = []
  paginaTurmasAcordo.value = criarPaginaVazia(filtrosTurmasAcordo.value.size)
  turmasTemporariasIds.value = new Set()
  turmasTemporariasMap.value = new Map()
}

function cancelarSeletorTurmas() {
  encerrarSeletorTurmas()
  restaurarFocoNoBotao(botaoAberturaSeletorTurmas)
}

function confirmarSeletorAlunos() {
  const idsConfirmados = obterIdsAlunosElegiveis(alunosTemporariosIds.value, alunosTemporariosMap.value)

  alunosSelecionadosIds.value = idsConfirmados
  alunosConfirmadosMap.value = filtrarMapaPorIds(alunosTemporariosMap.value, idsConfirmados)
  acordoFormulario.value.alunos = alunosSelecionadosNoAcordo.value.map((item) => normalizarAluno(item))
  sincronizarResponsavelAposSelecao(alunosSelecionadosIds.value, { preservarSePossivel: true })
  encerrarSeletorAlunos()
  restaurarFocoNoBotao(botaoAberturaSeletorAlunos)
}

function confirmarSeletorTurmas() {
  turmasSelecionadasIds.value = [...turmasTemporariasIds.value]
  turmasConfirmadasMap.value = filtrarMapaPorIds(turmasTemporariasMap.value, turmasSelecionadasIds.value)
  acordoFormulario.value.turmas = turmasSelecionadasNoAcordo.value.map((item) => normalizarTurma(item))
  encerrarSeletorTurmas()
  restaurarFocoNoBotao(botaoAberturaSeletorTurmas)
}

function alternarAlunoTemporario(id) {
  const chave = normalizarId(id)
  const alunoAtual = alunosOpcoesAcordo.value.find((item) => normalizarId(item.id) === chave)
  if (!chave) return
  if (alunoAtual && alunoAtual.elegivel === false && alunoAtual.selecionadoNoAcordo !== true) {
    return
  }

  const conjunto = clonarSet(alunosTemporariosIds.value)
  const mapa = clonarMap(alunosTemporariosMap.value)
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
    mapa.delete(chave)
  } else {
    conjunto.add(chave)
    if (alunoAtual) {
      mapa.set(chave, normalizarAluno(alunoAtual))
    }
  }

  alunosTemporariosIds.value = conjunto
  alunosTemporariosMap.value = mapa
}

function alternarTurmaTemporaria(id) {
  const chave = normalizarId(id)
  if (!chave) return

  const conjunto = clonarSet(turmasTemporariasIds.value)
  const mapa = clonarMap(turmasTemporariasMap.value)
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
    mapa.delete(chave)
  } else {
    conjunto.add(chave)
    const turmaAtual = turmasOpcoesAcordo.value.find((item) => normalizarId(item.id) === chave)
    if (turmaAtual) {
      mapa.set(chave, normalizarTurma(turmaAtual))
    }
  }

  turmasTemporariasIds.value = conjunto
  turmasTemporariasMap.value = mapa
}

function removerAlunoTemporario(id) {
  const chave = normalizarId(id)
  const conjunto = clonarSet(alunosTemporariosIds.value)
  conjunto.delete(chave)
  alunosTemporariosIds.value = conjunto
  alunosTemporariosMap.value.delete(chave)
  alunosTemporariosMap.value = clonarMap(alunosTemporariosMap.value)
}

function removerTurmaTemporaria(id) {
  const chave = normalizarId(id)
  const conjunto = clonarSet(turmasTemporariasIds.value)
  conjunto.delete(chave)
  turmasTemporariasIds.value = conjunto
  turmasTemporariasMap.value.delete(chave)
  turmasTemporariasMap.value = clonarMap(turmasTemporariasMap.value)
}

async function carregarOpcoesAlunosAcordo() {
  const requisicaoId = ++controleRequisicoes.alunos

  try {
    carregandoOpcoesAlunos.value = true
    erroSeletorAlunos.value = ''

    const resposta = await buscarOpcoesAlunosAcordoBeachTennis({
      busca: buscaAlunoAcordoDebounced.value,
      page: filtrosAlunosAcordo.value.page,
      size: filtrosAlunosAcordo.value.size,
      nivel: filtrosAlunosAcordo.value.nivel,
      perfil: filtrosAlunosAcordo.value.perfil,
      somenteAtivos: filtrosAlunosAcordo.value.somenteAtivos,
      acordoId: acordoEditandoId.value || undefined,
    })

    if (requisicaoId !== controleRequisicoes.alunos) {
      return
    }

    const pagina = normalizarPaginaResposta(resposta, filtrosAlunosAcordo.value.size)
    const lista = pagina.content.map((item) => {
      const aluno = normalizarAluno(item)
      const chave = normalizarId(aluno.id)
      if (alunosTemporariosIds.value.has(chave) || aluno.selecionadoNoAcordo) {
        alunosTemporariosMap.value.set(chave, aluno)
      }

      return {
        ...aluno,
        selecionado: alunosTemporariosIds.value.has(chave),
      }
    })

    alunosTemporariosMap.value = clonarMap(alunosTemporariosMap.value)
    alunosOpcoesAcordo.value = lista
    paginaAlunosAcordo.value = {
      ...pagina,
      content: lista,
    }
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.alunos) {
      return
    }

    alunosOpcoesAcordo.value = []
    paginaAlunosAcordo.value = criarPaginaVazia(filtrosAlunosAcordo.value.size)
    erroSeletorAlunos.value = obterMensagemErro(exception, 'Não foi possível carregar os alunos para este acordo.')
    console.error(exception)
  } finally {
    if (requisicaoId === controleRequisicoes.alunos) {
      carregandoOpcoesAlunos.value = false
    }
  }
}

function aplicarPaginaTurmasTemporarias(pagina) {
  const lista = pagina.content.map((item) => {
    const turma = normalizarTurma(item)
    const chave = normalizarId(turma.id)
    if (turmasTemporariasIds.value.has(chave) || turma.selecionadaNoAcordo) {
      turmasTemporariasMap.value.set(chave, turma)
    }

    return {
      ...turma,
      selecionado: turmasTemporariasIds.value.has(chave),
    }
  })

  turmasTemporariasMap.value = clonarMap(turmasTemporariasMap.value)

  return {
    lista,
    pagina: {
      ...pagina,
      content: lista,
    },
  }
}

async function carregarOpcoesTurmasAcordoPorFallback() {
  const resposta = await buscarTurmasBeachTennis()
  const turmasFiltradas = filtrarTurmasAcordoLocal(
    [].concat(resposta || []).map((item) => normalizarTurma(item)),
    {
      busca: buscaTurmaAcordoDebounced.value,
      ...filtrosTurmasAcordo.value,
    },
  )

  return paginarListaLocal(turmasFiltradas, {
    page: filtrosTurmasAcordo.value.page,
    size: filtrosTurmasAcordo.value.size,
  })
}

async function carregarOpcoesTurmasAcordo() {
  const requisicaoId = ++controleRequisicoes.turmas

  try {
    carregandoOpcoesTurmas.value = true
    erroSeletorTurmas.value = ''

    const resposta = await buscarOpcoesTurmasAcordoBeachTennis({
      busca: buscaTurmaAcordoDebounced.value,
      page: filtrosTurmasAcordo.value.page,
      size: filtrosTurmasAcordo.value.size,
      diaSemana: filtrosTurmasAcordo.value.diaSemana,
      funcionarioId: filtrosTurmasAcordo.value.funcionarioId,
      nivel: filtrosTurmasAcordo.value.nivel,
      horarioInicioDe: filtrosTurmasAcordo.value.horarioInicioDe,
      horarioInicioAte: filtrosTurmasAcordo.value.horarioInicioAte,
      somenteAtivas: filtrosTurmasAcordo.value.somenteAtivas,
      acordoId: acordoEditandoId.value || undefined,
    })

    if (requisicaoId !== controleRequisicoes.turmas) {
      return
    }

    let paginaNormalizada = normalizarPaginaResposta(resposta, filtrosTurmasAcordo.value.size)

    if (buscaTurmaAcordoDebounced.value && Number(paginaNormalizada.totalElements || 0) === 0) {
      paginaNormalizada = await carregarOpcoesTurmasAcordoPorFallback()
      if (requisicaoId !== controleRequisicoes.turmas) {
        return
      }
    }

    const { lista, pagina } = aplicarPaginaTurmasTemporarias(paginaNormalizada)

    turmasOpcoesAcordo.value = lista
    paginaTurmasAcordo.value = pagina
  } catch (exception) {
    if (requisicaoId !== controleRequisicoes.turmas) {
      return
    }

    try {
      const paginaFallback = await carregarOpcoesTurmasAcordoPorFallback()

      if (requisicaoId !== controleRequisicoes.turmas) {
        return
      }

      const { lista, pagina } = aplicarPaginaTurmasTemporarias(paginaFallback)
      turmasOpcoesAcordo.value = lista
      paginaTurmasAcordo.value = pagina
      erroSeletorTurmas.value = ''
      console.warn('Fallback local aplicado no seletor de turmas do acordo.', exception)
    } catch (fallbackException) {
      turmasOpcoesAcordo.value = []
      paginaTurmasAcordo.value = criarPaginaVazia(filtrosTurmasAcordo.value.size)
      erroSeletorTurmas.value = obterMensagemErro(fallbackException, 'Não foi possível carregar as turmas para este acordo.')
      console.error(exception)
      console.error(fallbackException)
    }
  } finally {
    if (requisicaoId === controleRequisicoes.turmas) {
      carregandoOpcoesTurmas.value = false
    }
  }
}

function atualizarFiltrosAlunosAcordo(proximosFiltros) {
  const anteriores = filtrosAlunosAcordo.value
  filtrosAlunosAcordo.value = {
    ...anteriores,
    ...proximosFiltros,
    page:
      proximosFiltros.page !== undefined
        ? proximosFiltros.page
        : houveMudancaEmCampos(anteriores, proximosFiltros, ['nivel', 'perfil', 'somenteAtivos'])
          ? 0
          : anteriores.page,
  }
}

function atualizarFiltrosTurmasAcordo(proximosFiltros) {
  const anteriores = filtrosTurmasAcordo.value
  filtrosTurmasAcordo.value = {
    ...anteriores,
    ...proximosFiltros,
    page:
      proximosFiltros.page !== undefined
        ? proximosFiltros.page
        : houveMudancaEmCampos(anteriores, proximosFiltros, [
            'diaSemana',
            'funcionarioId',
            'nivel',
            'horarioInicioDe',
            'horarioInicioAte',
            'somenteAtivas',
          ])
          ? 0
          : anteriores.page,
  }
}

function houveMudancaEmCampos(anteriores, proximos, campos = []) {
  return campos.some((campo) => anteriores?.[campo] !== (proximos?.[campo] ?? anteriores?.[campo]))
}

async function irPaginaAnteriorAcordos() {
  if (filtrosAcordosPaginados.value.page <= 0) return
  filtrosAcordosPaginados.value.page -= 1
  await carregarAcordosPaginados()
}

async function irPaginaProximaAcordos() {
  if (filtrosAcordosPaginados.value.page >= Math.max(acordosPaginados.value.totalPages - 1, 0)) return
  filtrosAcordosPaginados.value.page += 1
  await carregarAcordosPaginados()
}

async function irPaginaAnteriorAlunos() {
  if (filtrosAlunosAcordo.value.page <= 0) return
  atualizarFiltrosAlunosAcordo({ page: filtrosAlunosAcordo.value.page - 1 })
}

async function irPaginaProximaAlunos() {
  if (filtrosAlunosAcordo.value.page >= Math.max(paginaAlunosAcordo.value.totalPages - 1, 0)) return
  atualizarFiltrosAlunosAcordo({ page: filtrosAlunosAcordo.value.page + 1 })
}

async function irPaginaAnteriorTurmas() {
  if (filtrosTurmasAcordo.value.page <= 0) return
  atualizarFiltrosTurmasAcordo({ page: filtrosTurmasAcordo.value.page - 1 })
}

async function irPaginaProximaTurmas() {
  if (filtrosTurmasAcordo.value.page >= Math.max(paginaTurmasAcordo.value.totalPages - 1, 0)) return
  atualizarFiltrosTurmasAcordo({ page: filtrosTurmasAcordo.value.page + 1 })
}

function limparFiltrosAcordos() {
  buscaAcordosDigitada.value = ''
  buscaAcordosDebounced.value = ''
  filtrosAcordosPaginados.value = {
    busca: '',
    status: '',
    page: 0,
    size: 10,
  }
  void carregarAcordosPaginados()
}

async function abrirNovaMensalidadeManual() {
  await garantirApoioMensalidades()
  mensalidadeManual.value = criarMensalidadeManualPadrao()
  if (filtrosMensalidades.value.acordoId) {
    mensalidadeManual.value.acordoId = filtrosMensalidades.value.acordoId
    aplicarAcordoNaMensalidadeManual(filtrosMensalidades.value.acordoId)
  }
  mensalidadeManualAberta.value = true
  mensalidadePagamentoAberta.value = false
  mensalidadePagamento.value = criarPagamentoPadrao()
  cobrarLimparPreview()
}

function aplicarAcordoNaMensalidadeManual(acordoId) {
  const acordo = acordosOrdenados.value.find((item) => String(item.id) === String(acordoId))
  if (!acordo) return

  mensalidadeManual.value.valor = valorParaEntrada(acordo.valorMensal)
  mensalidadeManual.value.dataVencimento =
    montarDataVencimentoCompetencia(mensalidadeManual.value.competencia, acordo.diaVencimento) ||
    acordo.dataVencimento ||
    ''
  mensalidadeManual.value.status = 'PENDENTE'
}

async function salvarMensalidadeManual() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  const validacao = validarMensalidadeManual()
  if (validacao) {
    erro.value = validacao
    return
  }

  try {
    salvandoMensalidade.value = true
    erro.value = ''
    sucesso.value = ''

    await criarMensalidadeBeachTennis({
      acordoId: String(mensalidadeManual.value.acordoId || '').trim(),
      competencia: competenciaParaApi(mensalidadeManual.value.competencia),
      valorCobrado: numeroSeguro(mensalidadeManual.value.valor),
      valorOriginal: numeroSeguro(mensalidadeManual.value.valor),
      dataVencimento: mensalidadeManual.value.dataVencimento || '',
      status: String(mensalidadeManual.value.status || 'PENDENTE').trim().toUpperCase(),
      observacoes: String(mensalidadeManual.value.observacoes || '').trim(),
      origem: 'MANUAL',
    })

    sucesso.value = 'Mensalidade manual criada com sucesso.'
    mensalidadeManualAberta.value = false
    mensalidadeManual.value = criarMensalidadeManualPadrao()
    await recarregarAposAlteracao()
  } catch (exception) {
    erro.value = obterMensagemErro(exception, 'Não foi possível criar a mensalidade manual.')
    console.error(exception)
  } finally {
    salvandoMensalidade.value = false
  }
}

function validarMensalidadeManual() {
  if (!String(mensalidadeManual.value.acordoId || '').trim()) {
    return 'Selecione um acordo para a mensalidade manual.'
  }

  if (!String(mensalidadeManual.value.competencia || '').trim()) {
    return 'Informe a competência da mensalidade.'
  }

  if (!String(mensalidadeManual.value.valor || '').trim()) {
    return 'Informe o valor da mensalidade.'
  }

  return ''
}

function abrirPagamento(mensalidade) {
  pagamentoMensalidade.value = {
    id: String(mensalidade.id || ''),
    valorPago: valorParaEntrada(mensalidade.valorPago || mensalidade.valor),
    dataPagamento: dataAtual(),
    formaPagamento: mensalidade.formaPagamento || 'PIX',
    observacao: '',
  }
  mensalidadePagamentoAberta.value = true
  mensalidadeManualAberta.value = false
  mensalidadeManual.value = criarMensalidadeManualPadrao()
  cobrarLimparPreview()
}

async function confirmarPagamento() {
  if (!String(pagamentoMensalidade.value.id || '').trim()) {
    erro.value = 'Selecione uma mensalidade para marcar como paga.'
    return
  }

  if (!String(pagamentoMensalidade.value.valorPago || '').trim()) {
    erro.value = 'Informe o valor pago.'
    return
  }

  if (!String(pagamentoMensalidade.value.dataPagamento || '').trim()) {
    erro.value = 'Informe a data do pagamento.'
    return
  }

  try {
    salvandoMensalidade.value = true
    erro.value = ''
    sucesso.value = ''

    await marcarMensalidadePagaBeachTennis(pagamentoMensalidade.value.id, {
      valorPago: numeroSeguro(pagamentoMensalidade.value.valorPago),
      dataPagamento: dataParaLocalDateTime(pagamentoMensalidade.value.dataPagamento),
      formaPagamento: normalizarFormaPagamentoBeachTennis(pagamentoMensalidade.value.formaPagamento) || 'PIX',
      observacoes: String(pagamentoMensalidade.value.observacao || '').trim(),
    })

    sucesso.value = 'Mensalidade marcada como paga.'
    mensalidadePagamentoAberta.value = false
    pagamentoMensalidade.value = criarPagamentoPadrao()
    await recarregarAposAlteracao()
  } catch (exception) {
    erro.value = obterMensagemErro(exception, 'Não foi possível confirmar o pagamento.')
    console.error(exception)
  } finally {
    salvandoMensalidade.value = false
  }
}

async function cancelarMensalidade(item) {
  if (!confirmacaoSimples('Tem certeza que deseja cancelar esta mensalidade?')) return

  await executarAcaoMensalidade(item.id, async () => cancelarMensalidadeBeachTennis(item.id, ''))
}

async function reabrirMensalidade(item) {
  await executarAcaoMensalidade(item.id, async () => reabrirMensalidadeBeachTennis(item.id))
}

async function gerarMensalidades() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (!confirmacaoSimples(`Gerar mensalidades para a competência ${formatarCompetencia(competenciaSelecionada.value)}?`)) {
    return
  }

  try {
    processandoAcaoId.value = 'gerar-mensalidades'
    erro.value = ''
    sucesso.value = ''

    await gerarMensalidadesBeachTennis({
      competencia: competenciaSelecionada.value,
      acordoId: filtrosMensalidades.value.acordoId || '',
    })

    sucesso.value = 'Mensalidades geradas com sucesso.'
    await recarregarAposAlteracao()
  } catch (exception) {
    erro.value = obterMensagemErro(exception, 'Não foi possível gerar as mensalidades.')
    console.error(exception)
  } finally {
    processandoAcaoId.value = ''
  }
}

async function cobrarNoWhatsApp(mensalidade) {
  if (!String(mensalidade.id || '').trim()) {
    return
  }

  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (processandoAcaoId.value) {
    return
  }

  janelaWhatsapp = abrirJanelaWhatsApp()

  try {
    processandoAcaoId.value = String(mensalidade.id)
    erro.value = ''
    sucesso.value = ''

    const resposta = await cobrarMensalidadeWhatsappBeachTennis(mensalidade.id)

    const whatsappUrl = textoResposta(resposta, 'whatsappUrl', 'urlWhatsapp', 'linkWhatsapp')
    const telefone = textoResposta(resposta, 'telefoneNormalizado', 'telefone')
    const mensagem = textoResposta(resposta, 'mensagem', 'preview', 'mensagemPreview', 'textoMensagem') ||
      montarMensagemPreviewLocal(mensalidade)
    const orientacao =
      textoResposta(resposta, 'orientacao', 'ajuda', 'mensagemOrientacao') ||
      orientarCobrancaWhatsApp(mensalidade)

    cobrancaWhatsapp.value = {
      aberta: true,
      titulo: `Cobrança de ${mensalidade.nomeAcordo}`,
      mensagem,
      orientacao,
      whatsappUrl,
      telefone,
    }

    if (whatsappUrl) {
      if (janelaWhatsapp) {
        janelaWhatsapp.location.href = whatsappUrl
      } else {
        window.open(whatsappUrl, '_blank', 'noopener,noreferrer')
      }
    } else if (janelaWhatsapp) {
      janelaWhatsapp.close()
      janelaWhatsapp = null
    }
  } catch (exception) {
    if (janelaWhatsapp) {
      janelaWhatsapp.close()
      janelaWhatsapp = null
    }
    erro.value = obterMensagemErro(exception, 'Não foi possível preparar a cobrança via WhatsApp.')
    cobrancaWhatsapp.value = {
      aberta: true,
      titulo: `Cobrança de ${mensalidade.nomeAcordo}`,
      mensagem: montarMensagemPreviewLocal(mensalidade),
      orientacao: orientarCobrancaWhatsApp(mensalidade),
      whatsappUrl: '',
      telefone: '',
    }
    console.error(exception)
  } finally {
    processandoAcaoId.value = ''
  }
}

function orientarCobrancaWhatsApp(mensalidade) {
  if (!configuracao.value.chavePix) {
    return 'Configure uma chave PIX na aba Configuração para liberar a cobrança com mensagem pronta.'
  }

  const telefone = extrairTelefoneResponsavel(mensalidade)
  if (!telefone) {
    return `Este acordo não tem telefone válido para o responsável pelo pagamento. Atualize o cadastro do ${termoParticipanteSingular.value.toLocaleLowerCase('pt-BR')} ou escolha outro responsável.`
  }

  return 'A cobrança é manual. O WhatsApp será aberto em nova aba com a mensagem pronta para revisão e envio.'
}

function montarMensagemPreviewLocal(mensalidade) {
  return montarMensagemPreviewConfiguracao({
    nomeResponsavel: mensalidade.clienteResponsavelNome || mensalidade.responsavelNome || rotuloResponsavelPagamento,
    nomeAcordo: mensalidade.nomeAcordo || 'Acordo sem nome',
    competencia: mensalidade.competencia || competenciaSelecionada.value,
    valor: mensalidade.valor || 0,
    vencimento: mensalidade.vencimento ? formatarData(mensalidade.vencimento) : 'sem vencimento informado',
    chavePix: configuracao.value.chavePix || 'chave PIX não configurada',
  })
}

function montarMensagemPreviewConfiguracao(dados = {}) {
  const template = String(configuracao.value.templateMensagem || criarConfiguracaoPadrao().templateMensagem)
  const substituicoes = {
    '{nomeResponsavel}': dados.nomeResponsavel || '',
    '{nomeAcordo}': dados.nomeAcordo || '',
    '{competencia}': formatarCompetencia(dados.competencia || ''),
    '{valor}': formatarMoeda(dados.valor || 0),
    '{vencimento}': dados.vencimento || '',
    '{chavePix}': dados.chavePix || '',
  }

  return Object.entries(substituicoes).reduce(
    (texto, [chave, valor]) => texto.replaceAll(chave, String(valor || '')),
    template,
  )
}

async function salvarConfiguracao() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  try {
    salvandoConfiguracao.value = true
    erro.value = ''
    sucesso.value = ''

    await salvarConfiguracaoBeachTennisFinanceira({
      modalidadeCodigo: String(configuracao.value.modalidadeCodigo || '').trim().toUpperCase(),
      nomeModalidade: String(configuracao.value.nomeModalidade || '').trim(),
      termoParticipanteSingular: String(configuracao.value.termoParticipanteSingular || '').trim(),
      termoParticipantePlural: String(configuracao.value.termoParticipantePlural || '').trim(),
      termoResponsavelSingular: String(configuracao.value.termoResponsavelSingular || '').trim(),
      termoResponsavelPlural: String(configuracao.value.termoResponsavelPlural || '').trim(),
      termoGrupoSingular: String(configuracao.value.termoGrupoSingular || '').trim(),
      termoGrupoPlural: String(configuracao.value.termoGrupoPlural || '').trim(),
      termoAtividadeSingular: String(configuracao.value.termoAtividadeSingular || '').trim(),
      termoAtividadePlural: String(configuracao.value.termoAtividadePlural || '').trim(),
      termoLocalSingular: String(configuracao.value.termoLocalSingular || '').trim(),
      termoLocalPlural: String(configuracao.value.termoLocalPlural || '').trim(),
      chavePix: String(configuracao.value.chavePix || '').trim(),
      tipoChavePix: String(configuracao.value.tipoChavePix || '').trim().toUpperCase(),
      nomeRecebedorPix: String(configuracao.value.nomeRecebedor || '').trim(),
      mensagemCobrancaTemplate: String(configuracao.value.templateMensagem || '').trim(),
      nomePlay: String(configuracao.value.nomePlay || 'PLAY').trim() || 'PLAY',
    })

    sucesso.value = 'Configuração salva com sucesso.'
    await carregarConfiguracao()
    await recarregarContextoGestaoEsportiva()
  } catch (exception) {
    erro.value = obterMensagemErro(exception, `Não foi possível salvar a configuração de ${nomeModalidade.value}.`)
    console.error(exception)
  } finally {
    salvandoConfiguracao.value = false
  }
}

async function executarAcaoMensalidade(id, executar) {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  try {
    processandoAcaoId.value = String(id)
    erro.value = ''
    sucesso.value = ''
    await executar()
    sucesso.value = 'Ação concluída com sucesso.'
    await recarregarAposAlteracao()
  } catch (exception) {
    erro.value = obterMensagemErro(exception, 'Não foi possível concluir a ação da mensalidade.')
    console.error(exception)
  } finally {
    processandoAcaoId.value = ''
  }
}

async function recarregarAposAlteracao() {
  const tarefas = [carregarAcordosPaginados({ ajustarPaginaSeVazia: true }), carregarMensalidades(), carregarResumo(), carregarConfiguracao()]

  if (apoioMensalidadesCarregado.value) {
    tarefas.push(carregarAcordos())
  }

  await Promise.all(tarefas)
}

function normalizarResumoFinanceiro(dados = {}) {
  const resumoBase = dados && typeof dados === 'object' ? dados : {}
  return {
    totalPrevisto: numeroSeguro(textoResposta(resumoBase, 'totalPrevisto', 'previsto', 'valorPrevisto', 'totalAReceber')),
    totalRecebido: numeroSeguro(textoResposta(resumoBase, 'totalRecebido', 'recebido', 'valorRecebido', 'totalPago')),
    totalPendente: numeroSeguro(textoResposta(resumoBase, 'totalPendente', 'pendente', 'valorPendente')),
    totalVencido: numeroSeguro(textoResposta(resumoBase, 'totalVencido', 'vencido', 'valorVencido')),
    quantidadePagas: numeroInteiro(textoResposta(resumoBase, 'quantidadePagas', 'quantidadePaga', 'paga', 'totalPagas')),
    quantidadePendentes: numeroInteiro(
      textoResposta(resumoBase, 'quantidadePendentes', 'quantidadePendente', 'pendente', 'totalPendentes'),
    ),
    quantidadeVencidas: numeroInteiro(textoResposta(resumoBase, 'quantidadeVencidas', 'quantidadeVencida', 'vencida', 'totalVencidas')),
    quantidadeCortesias: numeroInteiro(textoResposta(resumoBase, 'quantidadeCortesias', 'cortesias', 'totalCortesias')),
  }
}

function normalizarAtrasos(dados = []) {
  const lista = Array.isArray(dados) ? dados : []
  return lista
    .map((item) => {
      const mensalidade = normalizarMensalidade(item)
      return {
        id: mensalidade.id,
        nomeAcordo: mensalidade.nomeAcordo,
        responsavelNome: mensalidade.responsavelNome,
        competencia: mensalidade.competencia,
        valor: mensalidade.valor,
        vencimento: mensalidade.vencimento,
        diasAtraso: mensalidade.diasAtraso,
      }
    })
    .sort((a, b) => (b.diasAtraso || 0) - (a.diasAtraso || 0))
}

function calcularResumoLocal() {
  const lista = mensalidadesOrdenadas.value.map((item) => normalizarMensalidade(item))
  const previsto = lista.reduce((total, item) => total + item.valor, 0)
  const recebido = lista.filter((item) => item.status === 'PAGA').reduce((total, item) => total + item.valorPago, 0)
  const pendentes = lista.filter((item) => item.status === 'PENDENTE' || item.status === 'REABERTA')
  const vencidas = lista.filter((item) => item.status === 'VENCIDA')

  return {
    totalPrevisto: previsto,
    totalRecebido: recebido,
    totalPendente: pendentes.reduce((total, item) => total + item.valor, 0),
    totalVencido: vencidas.reduce((total, item) => total + item.valor, 0),
    quantidadePagas: lista.filter((item) => item.status === 'PAGA').length,
    quantidadePendentes: pendentes.length,
    quantidadeVencidas: vencidas.length,
    quantidadeCortesias: lista.filter((item) => item.origem === 'PRIMEIRO_MES').length,
    atrasos: vencidas.slice(0, 5),
  }
}

function mudarAba(aba) {
  abaAtiva.value = aba
}

function normalizarTextoComparacao(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function nomeEhPlaceholderSelecionado(nome, termoPadrao) {
  const texto = normalizarTextoComparacao(nome)
  const termo = normalizarTextoComparacao(termoPadrao)

  return Boolean(texto && termo && texto === termo)
}

function escolherNomeAluno(item = {}) {
  const termoGenerico = `${termoParticipanteSingular.value} selecionado`
  const candidatos = [item.nome, item.clienteNome, item.nomeCompleto]

  for (const candidato of candidatos) {
    const nome = String(candidato || '').trim()
    if (!nome || nomeEhPlaceholderSelecionado(nome, termoGenerico)) {
      continue
    }

    return nome
  }

  return String(item.clienteNome || item.nome || item.nomeCompleto || termoParticipanteSingular.value).trim() || termoParticipanteSingular.value
}

function escolherNomeTurma(item = {}) {
  const termoGenerico = `${termoGrupoSingular.value} vinculada`
  const candidatos = [item.nome, item.turmaNome, item.descricao]

  for (const candidato of candidatos) {
    const nome = String(candidato || '').trim()
    if (!nome || nomeEhPlaceholderSelecionado(nome, termoGenerico)) {
      continue
    }

    return nome
  }

  return String(item.turmaNome || item.nome || item.descricao || termoGrupoSingular.value).trim() || termoGrupoSingular.value
}

function resolverAtivoRegistro(item = {}) {
  if (item?.ativo === false) {
    return false
  }

  const situacao = String(item?.status || item?.situacao || '').trim().toUpperCase()
  return !['INATIVA', 'INATIVO', 'ENCERRADA', 'ENCERRADO'].includes(situacao)
}

function normalizarAluno(item = {}) {
  const nivel = String(item.nivelBeachTennis || item.nivel || '').trim().toUpperCase()
  const perfil = String(item.perfilBeachTennis || item.perfil || '').trim().toUpperCase()
  const nome = escolherNomeAluno(item)
  const participaCompeticaoBeachTennis = item.participaCompeticaoBeachTennis === true

  return {
    ...item,
    id: normalizarId(item.id ?? item.alunoId ?? item.clienteId ?? item.pessoaId ?? ''),
    clienteId: normalizarId(item.clienteId ?? item.id ?? item.alunoId ?? item.pessoaId ?? ''),
    clienteNome: nome,
    nome,
    telefone: item.telefone || item.celular || '',
    email: item.email || '',
    perfilBeachTennis: perfil,
    nivelBeachTennis: nivel,
    participaCompeticaoBeachTennis,
    perfilRotulo: rotuloPerfilBeachTennis(perfil),
    nivelRotulo: rotuloNivelBeachTennis(nivel),
    ativo: item.ativo !== false,
    elegivel: item.elegivel !== false,
    selecionadoNoAcordo: item.selecionadoNoAcordo === true,
    motivoIndisponibilidade: String(item.motivoIndisponibilidade || '').trim(),
  }
}

function normalizarTurma(item = {}) {
  const diasSemana = normalizarArrayBeachTennis(item.diasSemana || item.dias || [])
  const vagas = numeroInteiro(item.vagas)
  const quantidadeAlunos = numeroInteiro(item.quantidadeAlunos ?? item.quantidadeAlunosAtivos)
  const horarioInicio = String(item.horarioInicio || item.horaInicio || '').trim()
  const nome = escolherNomeTurma(item)
  const ativo = resolverAtivoRegistro(item)
  const competicao = item.competicao === true

  return {
    ...item,
    id: normalizarId(item.id ?? item.turmaId ?? ''),
    turmaId: normalizarId(item.turmaId ?? item.id ?? ''),
    turmaNome: nome,
    nome,
    nivelBeachTennis: item.nivelBeachTennis || item.nivel || '',
    competicao,
    professorId: normalizarId(item.professorId ?? item.funcionarioId ?? item.professorResponsavelId ?? ''),
    professorResponsavelNome: item.professorResponsavelNome || item.professorNome || item.responsavelNome || '',
    nivelRotulo: rotuloNivelBeachTennis(item.nivelBeachTennis || item.nivel || ''),
    diasSemana,
    diasSemanaFormatados: diasSemana.map((dia) => rotuloDiaBeachTennis(dia)).filter(Boolean).join(', '),
    horarioInicio,
    horarioFormatado: formatarHorarioTexto(horarioInicio),
    vagas,
    quantidadeAlunos,
    ocupacaoTexto: vagas > 0 ? `${quantidadeAlunos} de ${vagas} alunos` : `${quantidadeAlunos} alunos · sem limite`,
    ativo,
    selecionadaNoAcordo: item.selecionadaNoAcordo === true,
  }
}

function normalizarId(valor) {
  return String(valor ?? '').trim()
}

function normalizarAlunoAcordo(item = {}) {
  if (typeof item !== 'object' || item === null) {
    return criarAlunoSelecionadoFallback(item)
  }

  return {
    ...normalizarAluno(item),
    ativo: item.ativo !== false,
  }
}

function normalizarTurmaAcordo(item = {}) {
  if (typeof item !== 'object' || item === null) {
    return criarTurmaSelecionadaFallback(item)
  }

  return {
    ...normalizarTurma(item),
    ativo: item.ativo !== false,
  }
}

function normalizarAlunosAcordo(lista = []) {
  return [].concat(lista || []).map((item) => normalizarAlunoAcordo(item)).filter((item) => item.ativo !== false && item.clienteId)
}

function normalizarTurmasAcordo(lista = []) {
  return [].concat(lista || []).map((item) => normalizarTurmaAcordo(item)).filter((item) => item.ativo !== false && item.turmaId)
}

function nomesDosIds(lista = []) {
  return normalizarIds(lista)
    .map((id) => {
      const aluno = clientes.value.find((item) => String(item.id) === String(id))
      if (aluno) {
        return normalizarAluno(aluno).nome
      }

      const turmaAtual = turmasSelecionadasNoAcordo.value.find((item) => String(item.id) === String(id))
      if (turmaAtual) {
        return turmaAtual.nome
      }

      const turmaAuxiliar = acordos.value
        .flatMap((acordo) => normalizarAcordo(acordo).turmas || [])
        .find((item) => String(item.turmaId || item.id) === String(id))

      if (turmaAuxiliar) {
        return normalizarTurma(turmaAuxiliar).nome
      }

      return String(id)
    })
    .filter(Boolean)
    .join(', ')
}

function rotuloGeracaoAcordo(valor) {
  const tipo = String(valor || '').trim().toUpperCase()
  const mapa = {
    AUTOMATICA: 'Geração automática',
    MANUAL: 'Geração manual',
  }

  return mapa[tipo] || 'Geração não informada'
}

function rotuloPrimeiroMesAcordo(valor) {
  const tipo = String(valor || '').trim().toUpperCase()
  const mapa = {
    INTEGRAL: 'Primeiro mês integral',
    PROPORCIONAL: 'Primeiro mês proporcional',
    MANUAL: 'Primeiro mês manual',
  }

  return mapa[tipo] || 'Primeiro mês não informado'
}

function criarAlunoSelecionadoFallback(id) {
  const clienteId = normalizarId(id)
  return {
    id: clienteId,
    clienteId,
    clienteNome: `${termoParticipanteSingular.value} selecionado`,
    nome: `${termoParticipanteSingular.value} selecionado`,
    telefone: '',
    email: '',
    perfilRotulo: '',
    nivelRotulo: '',
    participaCompeticaoBeachTennis: false,
    ativo: true,
  }
}

function criarTurmaSelecionadaFallback(id) {
  const turmaId = normalizarId(id)
  return {
    id: turmaId,
    turmaId,
    turmaNome: `${termoGrupoSingular.value} vinculada`,
    nome: `${termoGrupoSingular.value} vinculada`,
    diasSemanaFormatados: '',
    horarioFormatado: '',
    nivelRotulo: '',
    competicao: false,
    ocupacaoTexto: '',
    ativo: true,
  }
}

function textinho(valor) {
  return String(valor ?? '')
}

function textoResposta(objeto, ...campos) {
  for (const campo of campos) {
    const valor = objeto?.[campo]
    if (valor !== undefined && valor !== null && `${valor}`.trim() !== '') {
      return valor
    }
  }

  return ''
}

function numeroSeguro(valor) {
  if (typeof valor === 'number') {
    return Number.isFinite(valor) ? valor : 0
  }

  const texto = String(valor ?? '')
    .trim()
    .replace(/\s/g, '')
    .replace(/[R$]/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .replace(/[^0-9.-]/g, '')

  const numero = Number(texto)
  return Number.isFinite(numero) ? numero : 0
}

function filtrarMapaPorIds(mapa = new Map(), ids = []) {
  const idsValidos = new Set(normalizarIds(ids))

  return new Map(
    [...mapa.entries()].filter(([chave]) => idsValidos.has(normalizarId(chave))),
  )
}

function obterIdsAlunosElegiveis(ids = [], mapa = new Map()) {
  return normalizarIds(ids).filter((id) => {
    const aluno = mapa.get(normalizarId(id))

    if (!aluno) {
      return true
    }

    return aluno.elegivel !== false || aluno.selecionadoNoAcordo === true
  })
}

function limparTemporizadorBusca(tipo) {
  if (tipo === 'acordos' && temporizadorBuscaAcordos) {
    window.clearTimeout(temporizadorBuscaAcordos)
    temporizadorBuscaAcordos = null
  }

  if (tipo === 'alunos' && temporizadorBuscaAluno) {
    window.clearTimeout(temporizadorBuscaAluno)
    temporizadorBuscaAluno = null
  }

  if (tipo === 'turmas' && temporizadorBuscaTurma) {
    window.clearTimeout(temporizadorBuscaTurma)
    temporizadorBuscaTurma = null
  }
}

function numeroInteiro(valor) {
  const numero = Number.parseInt(String(valor ?? '').replace(/[^\d-]/g, ''), 10)
  return Number.isFinite(numero) ? numero : 0
}

function normalizarFormaPagamentoBeachTennis(valor) {
  const codigo = normalizarTexto(valor).replace(/[\s-]+/g, '_').toUpperCase()
  const equivalencias = {
    CARTAO: 'CARTAO',
    CARTAO_CREDITO: 'CARTAO',
    CARTAO_DE_CREDITO: 'CARTAO',
    CARTAO_DEBITO: 'CARTAO',
    CARTAO_DE_DEBITO: 'CARTAO',
    PIX: 'PIX',
    DINHEIRO: 'DINHEIRO',
    TRANSFERENCIA: 'TRANSFERENCIA',
    OUTRO: 'OUTRO',
  }
  const valorNormalizado = equivalencias[codigo] || codigo

  return ['PIX', 'DINHEIRO', 'TRANSFERENCIA', 'CARTAO', 'OUTRO'].includes(valorNormalizado) ? valorNormalizado : ''
}

function normalizarStatusAcordoBeachTennis(valor) {
  const status = String(valor || '').trim().toUpperCase()

  if (status === 'PAUSADO' || status === 'INATIVO') {
    return 'SUSPENSO'
  }

  return ['ATIVO', 'SUSPENSO', 'ENCERRADO'].includes(status) ? status : ''
}

function valorParaEntrada(valor) {
  const numero = numeroSeguro(valor)
  if (!numero) {
    return valor ? String(valor) : ''
  }

  return numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarMoeda(valor) {
  const numero = numeroSeguro(valor)
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarCompetencia(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return '-'
  if (!/^\d{4}-\d{2}$/.test(texto)) return texto

  const [ano, mes] = texto.split('-')
  return `${mes}/${ano}`
}

function formatarHorarioTexto(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return ''

  const partes = texto.split(':')
  if (partes.length < 2) {
    return texto
  }

  return `${partes[0].padStart(2, '0')}:${partes[1].padStart(2, '0')}`
}

function dataAtual() {
  const agora = new Date()
  const ano = agora.getFullYear()
  const mes = String(agora.getMonth() + 1).padStart(2, '0')
  const dia = String(agora.getDate()).padStart(2, '0')
  return `${ano}-${mes}-${dia}`
}

function montarDataVencimentoCompetencia(competencia, diaVencimento) {
  const competenciaTexto = String(competencia || '').trim()
  const dia = Number.parseInt(String(diaVencimento || '').replace(/[^\d]/g, ''), 10)

  if (!/^\d{4}-\d{2}$/.test(competenciaTexto) || !Number.isFinite(dia) || dia <= 0) {
    return ''
  }

  const [ano, mes] = competenciaTexto.split('-')
  const diaAjustado = String(Math.min(Math.max(dia, 1), 31)).padStart(2, '0')
  return `${ano}-${mes}-${diaAjustado}`
}

function competenciaAtual() {
  const agora = new Date()
  return `${agora.getFullYear()}-${String(agora.getMonth() + 1).padStart(2, '0')}`
}

function competenciaParaApi(valor) {
  const texto = String(valor || '').trim()
  if (!/^\d{4}-\d{2}$/.test(texto)) {
    return ''
  }

  return `${texto}-01`
}

function dataParaLocalDateTime(valor) {
  const texto = String(valor || '').trim()
  if (!texto) {
    return ''
  }

  if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/.test(texto)) {
    return texto
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    return `${texto}T00:00:00`
  }

  return texto
}

function dataParaInput(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return ''
  if (/^\d{4}-\d{2}-\d{2}/.test(texto)) {
    return texto.slice(0, 10)
  }

  const data = new Date(texto)
  if (!Number.isNaN(data.getTime())) {
    const ano = data.getFullYear()
    const mes = String(data.getMonth() + 1).padStart(2, '0')
    const dia = String(data.getDate()).padStart(2, '0')
    return `${ano}-${mes}-${dia}`
  }

  return ''
}

function formatarData(valor) {
  const texto = dataParaInput(valor)
  if (!texto) return '-'
  const [ano, mes, dia] = texto.split('-')
  return `${dia}/${mes}/${ano}`
}

function calcularDiasAtraso(vencimento) {
  if (!vencimento) return 0

  const data = new Date(`${vencimento}T00:00:00`)
  if (Number.isNaN(data.getTime())) return 0

  const hoje = new Date()
  hoje.setHours(0, 0, 0, 0)
  const diferenca = hoje.getTime() - data.getTime()
  return diferenca > 0 ? Math.floor(diferenca / 86400000) : 0
}

function obterStatusMensalidade(item = {}) {
  const status = String(item.status || item.situacao || item.statusFinanceiro || '').trim().toUpperCase()
  if (['PAGA', 'PAGO', 'LIQUIDADA', 'QUITADA'].includes(status) || item.dataPagamento) return 'PAGA'
  if (['CANCELADA', 'CANCELADO'].includes(status)) return 'CANCELADA'
  if (['REABERTA'].includes(status)) return 'REABERTA'
  if (['VENCIDA', 'ATRASADA', 'EM_ATRASO'].includes(status)) return 'VENCIDA'
  if (calcularDiasAtraso(dataParaInput(item.dataVencimento || item.vencimento || '')) > 0) return 'VENCIDA'
  return 'PENDENTE'
}

function statusMensalidadeRotulo(status) {
  const mapa = {
    PAGA: 'Paga',
    PENDENTE: 'Pendente',
    VENCIDA: 'Vencida',
    CANCELADA: 'Cancelada',
    REABERTA: 'Reaberta',
  }

  return mapa[status] || status || '-'
}

function statusAcordoRotulo(status) {
  const mapa = {
    ATIVO: 'Ativo',
    SUSPENSO: 'Suspenso',
    PAUSADO: 'Pausado',
    ENCERRADO: 'Encerrado',
    INATIVO: 'Inativo',
  }

  return mapa[status] || status || '-'
}

function classeStatusMensalidade(status) {
  return `status ${String(status || '').toLowerCase()}`
}

function classeStatusAcordo(status) {
  return `status ${String(status || '').toLowerCase()}`
}

function classeGeracao(valor) {
  return `badge ${String(valor || '').toLowerCase()}`
}

function classePrimeiroMes(valor) {
  return `badge ${String(valor || '').toLowerCase()}`
}

function normalizarIds(lista = []) {
  if (!Array.isArray(lista)) {
    return [lista]
      .flat()
      .map((item) => String(item?.id ?? item?.alunoId ?? item?.turmaId ?? item))
      .filter(Boolean)
  }

  return lista
    .flat()
    .map((item) =>
      String(
        typeof item === 'object' && item !== null
          ? item.id ?? item.alunoId ?? item.turmaId ?? item.clienteId ?? item.pessoaId ?? item.valor ?? ''
          : item,
      ).trim(),
    )
    .filter(Boolean)
}

function detectarConflitoAlunoAcordo(mensagem) {
  const texto = normalizarTexto(mensagem)
  return (
    texto.includes('acordo ativo') ||
    texto.includes('aluno') && texto.includes('ativo') ||
    texto.includes('já possui') ||
    texto.includes('ja possui')
  )
}

function obterMensagemErro(exception, fallback) {
  const mensagem = String(exception?.message || '').trim()
  return mensagem || fallback
}

function confirmarAcao(mensagem) {
  return typeof window !== 'undefined' ? window.confirm(mensagem) : true
}

function confirmacaoSimples(mensagem) {
  return confirmarAcao(mensagem)
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function compararTexto(a, b) {
  return normalizarTexto(a).localeCompare(normalizarTexto(b), 'pt-BR')
}

function abrirJanelaWhatsApp() {
  if (typeof window === 'undefined') {
    return null
  }

  return window.open('about:blank', '_blank', 'noopener,noreferrer')
}

function cobrarLimparPreview() {
  cobrancaWhatsapp.value = criarCobrancaWhatsappPadrao()
}

function fecharPreviewWhatsapp() {
  cobrancaWhatsapp.value = criarCobrancaWhatsappPadrao()
}

function abrirWhatsappDoPreview() {
  if (!cobrancaWhatsapp.value.whatsappUrl || typeof window === 'undefined') {
    return
  }

  window.open(cobrancaWhatsapp.value.whatsappUrl, '_blank', 'noopener,noreferrer')
}

function extrairTelefoneResponsavel(mensalidade) {
  const alunoPrincipal = clientes.value.find((item) => String(item.id) === String(mensalidade?.clienteResponsavelId || ''))
  return textinho(alunoPrincipal?.telefone || alunoPrincipal?.celular || '')
}

function obterRotuloFormaPagamento(codigo) {
  const metodo = FORMAS_PAGAMENTO_BEACH_TENNIS.find((item) => item.codigo === normalizarFormaPagamentoBeachTennis(codigo))
  return metodo?.rotulo || codigo || '-'
}

watch(competenciaSelecionada, async () => {
  if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) return
  await Promise.all([carregarMensalidades(), carregarResumo()])
}, { immediate: false })

watch(
  alunosSelecionadosIds,
  (ids) => {
    if (inicializandoAcordoFormulario.value) {
      return
    }

    if (!ids.includes(String(acordoFormulario.value.responsavelAlunoId || ''))) {
      sincronizarResponsavelAposSelecao(ids, { limparSilenciosamente: true })
    }
  },
  { deep: true },
)

watch(
  () => mensalidadeManual.value.acordoId,
  (acordoId) => {
    if (mensalidadeManualAberta.value && acordoId) {
      aplicarAcordoNaMensalidadeManual(acordoId)
    }
  },
)

watch(buscaAcordosDigitada, buscarAcordosComDebounce)
watch(buscaAlunoAcordoDigitada, buscarAlunosAcordoComDebounce)
watch(buscaTurmaAcordoDigitada, buscarTurmasAcordoComDebounce)

watch(buscaAcordosDebounced, async () => {
  filtrosAcordosPaginados.value.page = 0
  await carregarAcordosPaginados()
})

watch(
  () => filtrosAcordosPaginados.value.status,
  async () => {
    filtrosAcordosPaginados.value.page = 0
    await carregarAcordosPaginados()
  },
)

watch(
  () => ({ ...filtrosAlunosAcordo.value }),
  async () => {
    if (!seletorAlunosAberto.value) {
      return
    }

    await carregarOpcoesAlunosAcordo()
  },
  { deep: true },
)

watch(
  () => ({ ...filtrosTurmasAcordo.value }),
  async () => {
    if (!seletorTurmasAberto.value) {
      return
    }

    await carregarOpcoesTurmasAcordo()
  },
  { deep: true },
)

watch(buscaAlunoAcordoDebounced, async () => {
  if (!seletorAlunosAberto.value) return
  filtrosAlunosAcordo.value.page = 0
  await carregarOpcoesAlunosAcordo()
})

watch(buscaTurmaAcordoDebounced, async () => {
  if (!seletorTurmasAberto.value) return
  filtrosTurmasAcordo.value.page = 0
  await carregarOpcoesTurmasAcordo()
})

watch(abaAtiva, async (aba) => {
  if (aba === 'mensalidades') {
    await garantirApoioMensalidades()
  }
})

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  limparDadosTela()
  await carregarTudo()
}

onMounted(async () => {
  await carregarContextoGestaoEsportiva()
  await carregarTudo()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)

  if (janelaWhatsapp) {
    janelaWhatsapp.close()
    janelaWhatsapp = null
  }

  if (temporizadorBuscaAluno) {
    window.clearTimeout(temporizadorBuscaAluno)
    temporizadorBuscaAluno = null
  }

  if (temporizadorBuscaAcordos) {
    window.clearTimeout(temporizadorBuscaAcordos)
    temporizadorBuscaAcordos = null
  }

  if (temporizadorBuscaTurma) {
    window.clearTimeout(temporizadorBuscaTurma)
    temporizadorBuscaTurma = null
  }
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina beach-financeiro">
      <div>
        <p class="subtitulo">{{ nomeModalidade }}</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">
          {{ descricaoPagina }}
        </p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" :disabled="carregando" @click="recarregarTudo">
          {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso-empresa">
      <p>
        {{ `Selecione uma empresa no seletor superior para operar o financeiro de ${nomeModalidade} como SUPER_ADMIN.` }}
      </p>
    </section>

    <section v-else class="painel-financeiro">
      <nav class="abas" role="tablist" :aria-label="`Navegação financeira de ${nomeModalidade}`">
        <button
          v-for="aba in ABAS"
          :key="aba.id"
          type="button"
          class="aba"
          :class="{ ativa: abaAtiva === aba.id }"
          role="tab"
          :aria-selected="abaAtiva === aba.id"
          @click="mudarAba(aba.id)"
        >
          {{ aba.rotulo }}
        </button>
      </nav>

      <section v-show="abaAtiva === 'acordos'" class="conteudo-aba">
        <section class="card formulario-card">
          <div class="cabecalho-card">
            <div>
              <h2>{{ acordoEditandoId ? 'Editar acordo' : 'Novo acordo' }}</h2>
              <p>
                {{ `O pagamento é único por acordo. Não fazemos divisão por ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')} nesta etapa.` }}
              </p>
            </div>
            <button v-if="acordoEditandoId" class="botao secundario" type="button" @click="cancelarEdicaoAcordo">
              Cancelar edição
            </button>
          </div>

          <div class="campos">
            <label class="campo-grande">
              Nome do acordo *
              <input v-model="acordoFormulario.nome" type="text" :placeholder="`Ex: ${nomeAcordoExemplo} Adulto`" />
            </label>

            <label>
              Valor mensal *
              <input v-model="acordoFormulario.valorMensal" type="text" inputmode="decimal" placeholder="Ex: 250,00" />
            </label>

            <label>
              Frequência semanal *
              <select v-model="acordoFormulario.frequenciaSemanal">
                <option value="">Selecione</option>
                <option value="1">1x por semana</option>
                <option value="2">2x por semana</option>
                <option value="3">3x por semana</option>
                <option value="4">4x por semana</option>
                <option value="5">5x por semana</option>
                <option value="6">6x por semana</option>
                <option value="7">7x por semana</option>
              </select>
            </label>

            <label>
              Dia de vencimento *
              <input v-model="acordoFormulario.diaVencimento" type="number" min="1" max="31" />
            </label>

            <label>
              Geração
              <select v-model="acordoFormulario.modoGeracao">
                <option v-for="opcao in GESTAO_GERACAO" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label>
              Primeiro mês
              <select v-model="acordoFormulario.tipoPrimeiroMes">
                <option v-for="opcao in PRIMEIRO_MES" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label v-if="acordoFormulario.tipoPrimeiroMes === 'MANUAL'">
              Valor do primeiro mês
              <input
                v-model="acordoFormulario.valorPrimeiroMesManual"
                type="text"
                inputmode="decimal"
                placeholder="Ex: 250,00"
              />
            </label>

            <label>
              Data de início *
              <input v-model="acordoFormulario.dataInicio" type="date" />
            </label>

            <label>
              Data final
              <input v-model="acordoFormulario.dataFim" type="date" />
            </label>

            <label>
              Status
              <select v-model="acordoFormulario.status">
                <option v-for="opcao in STATUS_ACORDO.slice(1)" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label class="campo-grande">
              Observações
              <textarea v-model="acordoFormulario.observacoes" rows="3" placeholder="Observações comerciais, descontos, condições especiais..."></textarea>
            </label>
          </div>


          <div class="grade-selecao grade-selecao-escalavel">
            <ResumoSelecaoAcordo
              :titulo="`${termoParticipantePlural} do acordo`"
              :ajuda="`Selecione um ou vários ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}. O responsável pelo pagamento precisa estar nessa lista.`"
              :quantidade-texto="`${alunosSelecionadosIds.length} selecionado(s)`"
              :selecionados="alunosSelecionadosNoAcordo"
              :botao-gerenciar-texto="`Gerenciar ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}`"
              :vazio-texto="`Nenhum ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')} selecionado ainda.`"
              @gerenciar="abrirSeletorAlunos"
              @limpar="limparSelecaoAlunosAcordo"
            />

            <section class="bloco-selecao" :class="{ desabilitado: estadoResponsavelPagamento.disabled }">
              <div class="cabecalho-mini">
                <h3>{{ rotuloResponsavelPagamento }}</h3>
                <span v-if="responsavelSelecionado">{{ responsavelSelecionado.nome }}</span>
              </div>
              <p class="ajuda-campo">
                {{ `O pagamento é sempre único por acordo, sem rateio entre ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}.` }}
              </p>
              <p v-if="avisoResponsavelSelecionado" class="aviso-responsavel">
                {{ avisoResponsavelSelecionado }}
              </p>
              <label>
                {{ rotuloResponsavelPagamento }}
                <select
                  v-model="acordoFormulario.responsavelAlunoId"
                  :disabled="estadoResponsavelPagamento.disabled"
                  @change="selecionarResponsavelAcordo($event.target.value)"
                >
                  <option value="">{{ estadoResponsavelPagamento.placeholder }}</option>
                  <option
                    v-for="aluno in alunosSelecionadosNoAcordo"
                    :key="aluno.id"
                    :value="String(aluno.id)"
                  >
                    {{ aluno.nome }}
                  </option>
                </select>
              </label>
              <p v-if="estadoResponsavelPagamento.disabled" class="ajuda-campo ajuda-desabilitada">
                {{ estadoResponsavelPagamento.ajuda }}
              </p>
            </section>

            <ResumoSelecaoAcordo
              :titulo="`${termoGrupoPlural} vinculadas`"
              :ajuda="`Vincule apenas as ${termoGrupoPlural.toLocaleLowerCase('pt-BR')} que participam deste acordo.`"
              :quantidade-texto="`${turmasSelecionadasIds.length} selecionada(s)`"
              :selecionados="turmasSelecionadasNoAcordo"
              :botao-gerenciar-texto="`Gerenciar ${termoGrupoPlural.toLocaleLowerCase('pt-BR')}`"
              :vazio-texto="`Nenhuma ${termoGrupoSingular.toLocaleLowerCase('pt-BR')} vinculada ainda.`"
              @gerenciar="abrirSeletorTurmas"
              @limpar="limparSelecaoTurmasAcordo"
            />
          </div>

          <div class="acoes-formulario">
            <button class="botao principal" type="button" :disabled="salvandoAcordo" @click="salvarAcordo">
              {{ salvandoAcordo ? 'Salvando...' : acordoEditandoId ? 'Salvar acordo' : 'Criar acordo' }}
            </button>
            <button class="botao secundario" type="button" @click="cancelarEdicaoAcordo">Limpar</button>
          </div>
        </section>


        <section class="card lista-card">
          <div class="cabecalho-lista">
            <div>
              <h2>Acordos cadastrados</h2>
              <p>Busque, filtre e edite acordos sem carregar a lista inteira de uma só vez.</p>
            </div>
            <span class="contador">{{ Number(acordosPaginados.totalElements || 0).toLocaleString('pt-BR') }} acordo(s)</span>
          </div>

          <div class="campos filtros-acordos">
            <label class="campo-grande">
              Buscar acordo
              <input v-model="buscaAcordosDigitada" type="search" placeholder="Nome do acordo, responsável ou aluno" />
            </label>

            <label>
              Status
              <select v-model="filtrosAcordosPaginados.status">
                <option v-for="opcao in STATUS_ACORDO" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <div class="acoes-filtros-acordos">
              <button class="botao secundario" type="button" @click="limparFiltrosAcordos">
                Limpar filtros
              </button>
            </div>
          </div>

          <p v-if="erroListagemAcordos" class="feedback-lista erro-inline">{{ erroListagemAcordos }}</p>
          <p v-else-if="carregandoListaAcordos" class="feedback-lista">Carregando acordos...</p>

          <section v-if="!carregandoListaAcordos && !acordosPaginadosLista.length" class="estado-vazio">
            <p>Nenhum acordo encontrado para os filtros atuais.</p>
          </section>

          <div v-else class="grade-acordos">
            <article v-for="acordo in acordosPaginadosLista" :key="acordo.id" class="acordo-card">
              <div class="cabecalho-card interno">
                <div>
                  <h3>{{ acordo.nome }}</h3>
                  <p>
                    <span :class="classeStatusAcordo(acordo.status)">{{ statusAcordoRotulo(acordo.status) }}</span>
                    <span :class="classeGeracao(acordo.modoGeracao)">{{ rotuloGeracaoAcordo(acordo.modoGeracao) }}</span>
                    <span :class="classePrimeiroMes(acordo.tipoPrimeiroMes)">{{ rotuloPrimeiroMesAcordo(acordo.tipoPrimeiroMes) }}</span>
                  </p>
                </div>
                <strong>{{ formatarMoeda(acordo.valorMensal) }}</strong>
              </div>

              <div class="resumo-card">
                <p><strong>Responsável pelo pagamento:</strong> {{ acordo.clienteResponsavelNome }}</p>
                <p><strong>{{ termoParticipantePlural }}:</strong> {{ `${acordo.quantidadeAlunosAtivos || 0} aluno(s)` }}</p>
                <p><strong>{{ termoGrupoPlural }}:</strong> {{ `${acordo.quantidadeTurmasAtivas || 0} turma(s)` }}</p>
                <p><strong>Vencimento:</strong> Dia {{ acordo.diaVencimento || '-' }}</p>
                <p><strong>Frequência:</strong> {{ acordo.frequenciaSemanal ? `${acordo.frequenciaSemanal}x por semana` : '-' }}</p>
                <p><strong>Período:</strong> {{ formatarData(acordo.dataInicio) }} {{ acordo.dataFim ? `até ${formatarData(acordo.dataFim)}` : '' }}</p>
                <p v-if="acordo.atualizadoEm"><strong>Atualizado:</strong> {{ formatarData(acordo.atualizadoEm) }}</p>
              </div>

              <p v-if="acordo.observacoes" class="observacoes">{{ acordo.observacoes }}</p>

              <div class="acoes-card">
                <button
                  class="botao secundario"
                  type="button"
                  :disabled="carregandoDetalheAcordoId === acordo.id"
                  @click="abrirEdicaoAcordo(acordo)"
                >
                  {{ carregandoDetalheAcordoId === acordo.id ? 'Carregando...' : 'Editar' }}
                </button>
              </div>
            </article>
          </div>

          <PaginacaoCompacta
            :pagina="Number(acordosPaginados.page || 0)"
            :total-pages="Number(acordosPaginados.totalPages || 0)"
            :total-elements="Number(acordosPaginados.totalElements || 0)"
            :disabled="carregandoListaAcordos"
            @anterior="irPaginaAnteriorAcordos"
            @proxima="irPaginaProximaAcordos"
          />
        </section>

        <SeletorAlunosAcordo
          :aberto="seletorAlunosAberto"
          :busca="buscaAlunoAcordoDigitada"
          :carregando="carregandoOpcoesAlunos"
          :erro="erroSeletorAlunos"
          :pagina="paginaAlunosAcordo"
          :filtros="filtrosAlunosAcordo"
          :alunos="alunosOpcoesAcordo"
          :selecionados="alunosTemporariosLista"
          :termo-singular="termoParticipanteSingular"
          :termo-plural="termoParticipantePlural"
          @fechar="cancelarSeletorAlunos"
          @confirmar="confirmarSeletorAlunos"
          @update:busca="buscaAlunoAcordoDigitada = $event"
          @update:filtros="atualizarFiltrosAlunosAcordo($event)"
          @alternar="alternarAlunoTemporario"
          @remover-selecionado="removerAlunoTemporario"
          @anterior="irPaginaAnteriorAlunos"
          @proxima="irPaginaProximaAlunos"
        />

        <SeletorTurmasAcordo
          :aberto="seletorTurmasAberto"
          :busca="buscaTurmaAcordoDigitada"
          :carregando="carregandoOpcoesTurmas"
          :erro="erroSeletorTurmas"
          :pagina="paginaTurmasAcordo"
          :filtros="filtrosTurmasAcordo"
          :turmas="turmasOpcoesAcordo"
          :selecionados="turmasTemporariasLista"
          :professores="professoresDisponiveisAcordo"
          :termo-singular="termoGrupoSingular"
          :termo-plural="termoGrupoPlural"
          @fechar="cancelarSeletorTurmas"
          @confirmar="confirmarSeletorTurmas"
          @update:busca="buscaTurmaAcordoDigitada = $event"
          @update:filtros="atualizarFiltrosTurmasAcordo($event)"
          @alternar="alternarTurmaTemporaria"
          @remover-selecionado="removerTurmaTemporaria"
          @anterior="irPaginaAnteriorTurmas"
          @proxima="irPaginaProximaTurmas"
        />
      </section>

      <section v-show="abaAtiva === 'mensalidades'" class="conteudo-aba">
        <section class="card filtros-card">
          <div class="cabecalho-card">
            <div>
              <h2>Mensalidades</h2>
              <p>{{ `Filtros por competência, status, acordo e ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')}. A cobrança pelo WhatsApp é individual, uma por vez.` }}</p>
            </div>
            <div class="acoes-cabecalho">
              <button class="botao principal" type="button" :disabled="processandoAcaoId === 'gerar-mensalidades'" @click="gerarMensalidades">
                {{ processandoAcaoId === 'gerar-mensalidades' ? 'Gerando...' : 'Gerar mensalidades' }}
              </button>
              <button class="botao secundario" type="button" @click="abrirNovaMensalidadeManual">Nova mensalidade manual</button>
            </div>
          </div>

          <div class="campos">
            <label>
              Competência
              <input v-model="competenciaSelecionada" type="month" />
            </label>

            <label>
              Status
              <select v-model="filtrosMensalidades.status">
                <option v-for="opcao in STATUS_MENSALIDADE" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label>
              Acordo
              <select v-model="filtrosMensalidades.acordoId">
                <option value="">Todos</option>
                <option v-for="acordo in acordosOrdenados" :key="acordo.id" :value="String(acordo.id)">
                  {{ acordo.nome }}
                </option>
              </select>
            </label>

            <label>
              {{ termoParticipanteSingular }}
              <select v-model="filtrosMensalidades.alunoId">
                <option value="">Todos</option>
                <option v-for="aluno in alunosDisponiveis" :key="aluno.id" :value="String(aluno.id)">
                  {{ aluno.nome }}
                </option>
              </select>
            </label>

            <label class="campo-grande">
              Busca livre
              <input
                v-model="filtrosMensalidades.busca"
                type="text"
                placeholder="Acordo, responsável, participante ou grupo"
              />
            </label>
          </div>
        </section>

        <section class="card lista-card tabela-card">
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Competência</th>
                  <th>Acordo</th>
                  <th>Responsável</th>
                  <th>{{ termoParticipantePlural }}</th>
                  <th>Vencimento</th>
                  <th>Valor</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="mensalidade in mensalidadesFiltradas" :key="mensalidade.id">
                  <td data-label="Competência">{{ formatarCompetencia(mensalidade.competencia) }}</td>
                  <td data-label="Acordo">{{ mensalidade.nomeAcordo }}</td>
                  <td data-label="Responsável">{{ mensalidade.responsavelNome }}</td>
                  <td data-label="Alunos">{{ mensalidade.integranteResumo || '-' }}</td>
                  <td data-label="Vencimento">{{ formatarData(mensalidade.vencimento) }}</td>
                  <td data-label="Valor">{{ formatarMoeda(mensalidade.valor) }}</td>
                  <td data-label="Status">
                    <span :class="classeStatusMensalidade(mensalidade.status)">{{ statusMensalidadeRotulo(mensalidade.status) }}</span>
                  </td>
                  <td data-label="Ações">
                    <div class="acoes-tabela">
                      <button
                        class="botao compacto secundario"
                        type="button"
                        :disabled="processandoAcaoId === mensalidade.id"
                        @click="abrirPagamento(mensalidade)"
                      >
                        Marcar como paga
                      </button>
                      <button
                        class="botao compacto secundario"
                        type="button"
                        :disabled="processandoAcaoId === mensalidade.id"
                        @click="cancelarMensalidade(mensalidade)"
                      >
                        Cancelar
                      </button>
                      <button
                        class="botao compacto secundario"
                        type="button"
                        :disabled="processandoAcaoId === mensalidade.id"
                        @click="reabrirMensalidade(mensalidade)"
                      >
                        Reabrir
                      </button>
                      <button
                        class="botao compacto principal"
                        type="button"
                        :disabled="processandoAcaoId === mensalidade.id"
                        @click="cobrarNoWhatsApp(mensalidade)"
                      >
                        Cobrar no WhatsApp
                      </button>
                    </div>
                  </td>
                </tr>
                <tr v-if="!mensalidadesFiltradas.length">
                  <td colspan="8">Nenhuma mensalidade encontrada para os filtros atuais.</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        <section v-if="cobrancaWhatsapp.aberta" class="card preview-whatsapp">
          <div class="cabecalho-card">
            <div>
              <h2>{{ cobrancaWhatsapp.titulo }}</h2>
              <p>Prévia para conferência antes de abrir a conversa em nova aba.</p>
            </div>
            <button class="botao secundario" type="button" @click="fecharPreviewWhatsapp">Fechar</button>
          </div>

          <p v-if="cobrancaWhatsapp.orientacao" class="aviso-whatsapp">{{ cobrancaWhatsapp.orientacao }}</p>
          <pre class="previsualizacao">{{ cobrancaWhatsapp.mensagem || 'Sem prévia disponível.' }}</pre>
          <button
            v-if="cobrancaWhatsapp.whatsappUrl"
            class="botao principal"
            type="button"
            @click="abrirWhatsappDoPreview"
          >
            Abrir WhatsApp novamente
          </button>
        </section>
      </section>

      <section v-show="abaAtiva === 'resumo'" class="conteudo-aba">
        <section class="card filtros-card">
          <div class="cabecalho-card">
            <div>
              <h2>Resumo financeiro</h2>
              <p>Visão simples para acompanhar previsto, recebido, pendente e vencido na competência selecionada.</p>
            </div>
            <label class="filtro-resumo">
              Competência
              <input v-model="competenciaSelecionada" type="month" />
            </label>
          </div>
        </section>

        <section class="grade-resumo">
          <article class="card indicador">
            <span>Total previsto</span>
            <strong>{{ formatarMoeda(resumoNormalizado.totalPrevisto) }}</strong>
          </article>
          <article class="card indicador">
            <span>Total recebido</span>
            <strong>{{ formatarMoeda(resumoNormalizado.totalRecebido) }}</strong>
          </article>
          <article class="card indicador">
            <span>Pendente</span>
            <strong>{{ formatarMoeda(resumoNormalizado.totalPendente) }}</strong>
          </article>
          <article class="card indicador">
            <span>Vencido</span>
            <strong>{{ formatarMoeda(resumoNormalizado.totalVencido) }}</strong>
          </article>
          <article class="card indicador">
            <span>Pagas</span>
            <strong>{{ resumoNormalizado.quantidadePagas }}</strong>
          </article>
          <article class="card indicador">
            <span>Pendentes</span>
            <strong>{{ resumoNormalizado.quantidadePendentes }}</strong>
          </article>
          <article class="card indicador">
            <span>Vencidas</span>
            <strong>{{ resumoNormalizado.quantidadeVencidas }}</strong>
          </article>
          <article class="card indicador">
            <span>Cortesias</span>
            <strong>{{ resumoNormalizado.quantidadeCortesias }}</strong>
          </article>
        </section>

        <section class="card lista-card">
          <div class="cabecalho-card">
            <div>
              <h2>Principais atrasos</h2>
              <p>Lista resumida dos acordos com maior atraso na competência atual.</p>
            </div>
          </div>

          <section v-if="!atrasosResumo.length" class="estado-vazio">
            <p>Nenhum atraso relevante encontrado.</p>
          </section>

          <div v-else class="lista-atrasos">
            <article v-for="atraso in atrasosResumo" :key="atraso.id || atraso.nomeAcordo" class="atraso-item">
              <strong>{{ atraso.nomeAcordo }}</strong>
              <p>{{ atraso.responsavelNome }}</p>
              <small>
                {{ formatarCompetencia(atraso.competencia) }} · {{ formatarMoeda(atraso.valor) }} ·
                {{ atraso.diasAtraso }} dia(s) em atraso
              </small>
            </article>
          </div>
        </section>
      </section>

      <section v-show="abaAtiva === 'configuracao'" class="conteudo-aba">
        <section class="card formulario-card">
          <div class="cabecalho-card">
            <div>
              <h2>Configuração e PIX</h2>
              <p>Configure a chave PIX e a mensagem de cobrança. As nomenclaturas detalhadas ficam na área avançada.</p>
            </div>
            <div class="acoes-cabecalho">
              <button class="botao secundario" type="button" @click="restaurarTermosPadrao">
                Restaurar termos padrão
              </button>
              <button class="botao principal" type="button" :disabled="salvandoConfiguracao" @click="salvarConfiguracao">
                {{ salvandoConfiguracao ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>

          <div class="campos">
            <label>
              Tipo da chave PIX
              <select v-model="configuracao.tipoChavePix">
                <option v-for="opcao in TIPO_CHAVE_PIX" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label class="campo-grande">
              Chave PIX
              <input v-model="configuracao.chavePix" type="text" placeholder="Digite a chave PIX" />
            </label>

            <label>
              Nome do recebedor
              <input v-model="configuracao.nomeRecebedor" type="text" placeholder="Nome que aparecerá na cobrança" />
            </label>

            <label>
              Nome do evento livre
              <input v-model="configuracao.nomePlay" type="text" :placeholder="nomeEventoLivre" />
            </label>

            <label class="campo-grande">
              Template da mensagem
              <textarea
                v-model="configuracao.templateMensagem"
                rows="6"
                placeholder="Use {nomeResponsavel}, {nomeAcordo}, {competencia}, {valor}, {vencimento} e {chavePix}"
              ></textarea>
            </label>
          </div>
        </section>

        <section class="card preview-configuracao">
          <div class="cabecalho-card">
            <div>
              <h2>Prévia da mensagem</h2>
              <p>Exemplo com dados fictícios para validar o texto antes de salvar.</p>
            </div>
          </div>

          <pre class="previsualizacao">{{ previewMensagemConfiguracao }}</pre>
        </section>

        <details
          class="card secao-avancada"
          :open="configuracaoTermosAvancadosAberta"
          @toggle="configuracaoTermosAvancadosAberta = $event.target.open"
        >
          <summary class="secao-avancada-summary">
            <div>
              <p class="subtitulo-secao">Configuração detalhada</p>
              <h2>Termos e nomenclaturas avançadas</h2>
              <p>Campos menos usados para ajustar a linguagem da modalidade.</p>
            </div>
            <span class="botao secundario secao-avancada-acao">
              {{ configuracaoTermosAvancadosAberta ? 'Recolher' : 'Expandir' }}
            </span>
          </summary>

          <div class="campos">
            <label>
              Código da modalidade
              <select v-model="configuracao.modalidadeCodigo">
                <option value="">Selecione</option>
                <option v-for="opcao in OPCOES_MODALIDADE" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label>
              Nome exibido da modalidade
              <input v-model="configuracao.nomeModalidade" type="text" placeholder="Ex: Futebol" />
            </label>

            <label>
              Participante singular
              <input v-model="configuracao.termoParticipanteSingular" type="text" placeholder="Ex: Atleta" />
            </label>

            <label>
              Participantes plural
              <input v-model="configuracao.termoParticipantePlural" type="text" placeholder="Ex: Atletas" />
            </label>

            <label>
              Responsável singular
              <input v-model="configuracao.termoResponsavelSingular" type="text" placeholder="Ex: Treinador" />
            </label>

            <label>
              Responsáveis plural
              <input v-model="configuracao.termoResponsavelPlural" type="text" placeholder="Ex: Treinadores" />
            </label>

            <label>
              Grupo singular
              <input v-model="configuracao.termoGrupoSingular" type="text" placeholder="Ex: Equipe" />
            </label>

            <label>
              Grupos plural
              <input v-model="configuracao.termoGrupoPlural" type="text" placeholder="Ex: Equipes" />
            </label>

            <label>
              Atividade singular
              <input v-model="configuracao.termoAtividadeSingular" type="text" placeholder="Ex: Treino" />
            </label>

            <label>
              Atividades plural
              <input v-model="configuracao.termoAtividadePlural" type="text" placeholder="Ex: Treinos" />
            </label>

            <label>
              Local singular
              <input v-model="configuracao.termoLocalSingular" type="text" placeholder="Ex: Campo" />
            </label>

            <label>
              Locais plural
              <input v-model="configuracao.termoLocalPlural" type="text" placeholder="Ex: Campos" />
            </label>
          </div>
        </details>
      </section>
    </section>

    <section v-if="mensalidadePagamentoAberta" class="modal-fundo" role="dialog" aria-modal="true">
      <section class="card modal-card">
        <div class="cabecalho-card">
          <div>
            <h2>Marcar como paga</h2>
            <p>Informe os dados da quitação para registrar o recebimento.</p>
          </div>
          <button class="botao secundario" type="button" @click="mensalidadePagamentoAberta = false">Fechar</button>
        </div>

        <div class="campos">
          <label>
            Valor pago
            <input v-model="pagamentoMensalidade.valorPago" type="text" inputmode="decimal" />
          </label>

          <label>
            Data
            <input v-model="pagamentoMensalidade.dataPagamento" type="date" />
          </label>

          <label>
            Forma de pagamento
            <select v-model="pagamentoMensalidade.formaPagamento">
              <option v-for="forma in statusPagamentoDisponiveis" :key="forma.codigo" :value="forma.codigo">
                {{ forma.rotulo }}
              </option>
            </select>
          </label>

          <label class="campo-grande">
            Observação
            <textarea v-model="pagamentoMensalidade.observacao" rows="3" placeholder="Observação opcional"></textarea>
          </label>
        </div>

        <div class="acoes-formulario">
          <button class="botao principal" type="button" :disabled="salvandoMensalidade" @click="confirmarPagamento">
            {{ salvandoMensalidade ? 'Salvando...' : 'Confirmar pagamento' }}
          </button>
          <button class="botao secundario" type="button" @click="mensalidadePagamentoAberta = false">Cancelar</button>
        </div>
      </section>
    </section>

    <section v-if="mensalidadeManualAberta" class="modal-fundo" role="dialog" aria-modal="true">
      <section class="card modal-card">
        <div class="cabecalho-card">
          <div>
            <h2>Nova mensalidade manual</h2>
            <p>Crie uma mensalidade avulsa para um acordo já cadastrado.</p>
          </div>
          <button class="botao secundario" type="button" @click="mensalidadeManualAberta = false">Fechar</button>
        </div>

        <div class="campos">
          <label>
            Acordo
            <select v-model="mensalidadeManual.acordoId" @change="aplicarAcordoNaMensalidadeManual(mensalidadeManual.acordoId)">
              <option value="">Selecione</option>
              <option v-for="acordo in acordosOrdenados" :key="acordo.id" :value="String(acordo.id)">
                {{ acordo.nome }}
              </option>
            </select>
          </label>

          <label>
            Competência
            <input v-model="mensalidadeManual.competencia" type="month" />
          </label>

          <label>
            Valor
            <input v-model="mensalidadeManual.valor" type="text" inputmode="decimal" />
          </label>

          <label>
            Vencimento
            <input v-model="mensalidadeManual.dataVencimento" type="date" />
          </label>

          <label>
            Status
            <select v-model="mensalidadeManual.status">
              <option value="PENDENTE">Pendente</option>
              <option value="PAGA">Paga</option>
              <option value="VENCIDA">Vencida</option>
              <option value="CANCELADA">Cancelada</option>
            </select>
          </label>

          <label class="campo-grande">
            Observação
            <textarea v-model="mensalidadeManual.observacoes" rows="3"></textarea>
          </label>
        </div>

        <div class="acoes-formulario">
          <button class="botao principal" type="button" :disabled="salvandoMensalidade" @click="salvarMensalidadeManual">
            {{ salvandoMensalidade ? 'Salvando...' : 'Criar mensalidade' }}
          </button>
          <button class="botao secundario" type="button" @click="mensalidadeManualAberta = false">Cancelar</button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 22px;
  color: var(--app-text);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 22px 24px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary) 16%, transparent), transparent 36%),
    linear-gradient(135deg, var(--app-surface-strong) 0%, var(--app-surface-soft) 100%);
  box-shadow: var(--app-shadow);
}

.subtitulo {
  margin: 0 0 6px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
}

.descricao,
.cabecalho-card p,
.ajuda-campo {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.painel-financeiro {
  display: grid;
  gap: 18px;
}

.abas {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.aba {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 800;
}

.aba.ativa {
  background: var(--app-primary);
  color: white;
  border-color: var(--app-primary);
}

.conteudo-aba {
  display: grid;
  gap: 18px;
}

.card,
.modal-card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  padding: 22px;
  box-shadow: var(--app-shadow);
}

.feedback.erro {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.feedback.sucesso {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.aviso-empresa {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-weight: 800;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.subtitulo-secao {
  margin: 0 0 6px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: var(--app-text);
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 10px 12px;
  font: inherit;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

input:disabled,
select:disabled,
textarea:disabled {
  background: var(--app-input-disabled-bg);
  color: var(--app-input-disabled-text);
  border-color: var(--app-input-disabled-border);
  cursor: not-allowed;
}

textarea {
  resize: vertical;
  min-height: 108px;
}

.cabecalho-card,
.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
  min-width: 0;
}

.cabecalho-mini {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
  min-width: 0;
}

.cabecalho-mini h3,
.cabecalho-card h2,
.cabecalho-lista h2 {
  margin: 0;
}

.grade-selecao {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.grade-selecao-escalavel {
  align-items: stretch;
}

.bloco-selecao {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  background: var(--app-surface-soft);
  display: grid;
  gap: 12px;
  align-content: start;
  min-width: 0;
}

.bloco-selecao.desabilitado {
  background: color-mix(in srgb, var(--app-input-disabled-bg) 82%, var(--app-surface));
  border-color: var(--app-input-disabled-border);
}

.ajuda-desabilitada {
  margin: 0;
  color: var(--app-input-disabled-text);
}

.campo-busca {
  font-weight: 800;
}

.lista-checkboxes {
  display: grid;
  gap: 8px;
  max-height: min(360px, 52vh);
  overflow: auto;
}

.item-checkbox {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  padding: 12px;
  min-height: 44px;
  width: 100%;
  cursor: pointer;
  min-width: 0;
}

.item-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: var(--app-primary);
}

.item-checkbox span {
  display: grid;
  gap: 3px;
  min-width: 0;
}

.item-checkbox strong {
  font-size: 14px;
}

.item-checkbox small {
  color: var(--app-text-muted);
  overflow-wrap: anywhere;
  word-break: break-word;
}

.item-checkbox:focus-within {
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.resumo-selecao {
  display: grid;
  gap: 10px;
  padding: 12px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: color-mix(in srgb, var(--app-primary-soft) 72%, var(--app-surface));
}

.resumo-selecao-topo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
  flex-wrap: wrap;
}

.chips-selecao {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip-selecao {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
  max-width: 100%;
  overflow-wrap: anywhere;
}

.chip-selecao.sutileza {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.aviso-responsavel {
  margin: 0;
  padding: 10px 12px;
  border-radius: 12px;
  background: var(--app-warning-soft);
  border: 1px solid var(--app-warning);
  color: var(--app-warning);
  font-weight: 700;
}

.filtros-acordos {
  align-items: end;
}

.acoes-filtros-acordos {
  display: flex;
  gap: 10px;
  align-items: end;
}

.feedback-lista {
  margin: 0;
  color: var(--app-text-muted);
  font-weight: 700;
}

.erro-inline {
  color: var(--app-danger);
}

.acoes-formulario,
.acoes-card,
.acoes-cabecalho,
.acoes-tabela {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.acoes-formulario {
  margin-top: 18px;
}

.botao {
  border: 1px solid transparent;
  color: white;
  padding: 10px 16px;
  border-radius: 14px;
  cursor: pointer;
  font-weight: 800;
  transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: var(--app-primary);
}

.principal:hover {
  background: var(--app-primary-strong);
}

.secundario {
  background: var(--app-surface);
  color: var(--app-text);
  border-color: var(--app-border);
}

.secundario:hover {
  background: var(--app-surface-soft);
  border-color: var(--app-primary);
}

.compacto {
  width: 100%;
  padding: 8px 10px;
  font-size: 12px;
  line-height: 1.2;
}

.lista-card {
  display: grid;
  gap: 18px;
  min-width: 0;
}

.grade-acordos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.acordo-card {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 16px;
  display: grid;
  gap: 12px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary) 10%, transparent), transparent 26%),
    var(--app-surface);
  min-width: 0;
}

.cabecalho-card.interno p {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.cabecalho-card.interno strong {
  font-size: 24px;
}

.resumo-card {
  display: grid;
  gap: 6px;
}

.resumo-card p,
.observacoes,
.atraso-item p,
.atraso-item small,
.previsualizacao {
  margin: 0;
  color: var(--app-text-muted);
}

.observacoes {
  padding: 12px;
  border-radius: 10px;
  background: var(--app-surface-soft);
  border: 1px dashed var(--app-border);
}

.contador {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.estado-vazio {
  border: 1px dashed var(--app-border);
  border-radius: 12px;
  padding: 18px;
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
  font-weight: 700;
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 14px;
}

.indicador {
  display: grid;
  gap: 8px;
}

.indicador span {
  color: var(--app-text-muted);
  font-weight: 800;
}

.indicador strong {
  font-size: 24px;
}

.lista-atrasos {
  display: grid;
  gap: 10px;
}

.atraso-item {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 4px;
  background: var(--app-surface-soft);
}

.filtros-card {
  display: grid;
  gap: 16px;
}

.filtro-resumo {
  min-width: 190px;
}

.badge,
.status {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.pendente {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.status.paga {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.status.vencida {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.status.cancelada,
.status.inativo {
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.status.reaberta,
.status.pausado {
  background: color-mix(in srgb, var(--app-primary-soft) 72%, var(--app-surface));
  color: var(--app-primary-strong);
}

.badge.automatica {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.badge.manual {
  background: color-mix(in srgb, var(--app-brand-end) 18%, var(--app-surface));
  color: var(--app-brand-end);
}

.badge.integral {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.badge.proporcional {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: var(--app-overlay);
}

.modal-card {
  width: min(100%, 820px);
  max-height: 90vh;
  overflow: auto;
  min-width: 0;
}

.tabela-card {
  padding: 0;
  overflow: hidden;
}

.tabela-container {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 1080px;
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

td[data-label] {
  min-width: 0;
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
  gap: 6px;
  min-width: 140px;
}

.previsualizacao {
  white-space: pre-wrap;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}

.secao-avancada {
  padding: 0;
}

.secao-avancada summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  padding: 22px;
  cursor: pointer;
  list-style: none;
}

.secao-avancada summary::-webkit-details-marker {
  display: none;
}

.secao-avancada summary h2 {
  margin: 0;
}

.secao-avancada summary p {
  margin: 0;
  color: var(--app-text-muted);
}

.secao-avancada[open] summary {
  border-bottom: 1px solid var(--app-border);
}

.secao-avancada .campos {
  padding: 18px 22px 22px;
}

.secao-avancada-acao {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  white-space: nowrap;
}

.aviso-whatsapp {
  color: var(--app-warning);
  font-weight: 700;
}

@media (max-width: 1080px) {
  .campos,
  .grade-selecao,
  .grade-resumo,
  .grade-acordos {
    grid-template-columns: 1fr;
  }

  .cabecalho-pagina,
  .cabecalho-card,
  .cabecalho-lista,
  .acoes-cabecalho {
    align-items: flex-start;
    flex-direction: column;
  }

  .secao-avancada summary {
    align-items: flex-start;
    flex-direction: column;
  }
}

@media (max-width: 760px) {
  .cabecalho-pagina {
    padding: 18px;
  }

  .card,
  .modal-card {
    padding: 18px;
  }

  .resumo-selecao-topo,
  .cabecalho-mini,
  .cabecalho-card,
  .cabecalho-lista,
  .acoes-cabecalho,
  .acoes-formulario,
  .secao-avancada summary {
    align-items: stretch;
  }

  .item-checkbox {
    min-height: 48px;
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
    flex: 0 0 38%;
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

  .secao-avancada summary,
  .secao-avancada .campos {
    padding-left: 18px;
    padding-right: 18px;
  }
}

@media (max-width: 520px) {
  .grade-selecao,
  .grade-acordos {
    grid-template-columns: 1fr;
  }

  .botao,
  .botao.compacto {
    width: 100%;
  }
}
</style>
