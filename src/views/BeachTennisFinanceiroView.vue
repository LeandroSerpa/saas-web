<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAcordoBeachTennis,
  buscarAcordosBeachTennis,
  buscarAlunosAcordoBeachTennis,
  buscarClientes,
  buscarConfiguracaoBeachTennisFinanceira,
  buscarMensalidadesBeachTennis,
  buscarResumoFinanceiroBeachTennis,
  buscarTurmasAcordoBeachTennis,
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
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'

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
const salvandoAcordo = ref(false)
const salvandoConfiguracao = ref(false)
const salvandoMensalidade = ref(false)
const processandoAcaoId = ref('')
const acordoEditandoId = ref('')
const mensalidadeManualAberta = ref(false)
const mensalidadePagamentoAberta = ref(false)
const erro = ref('')
const sucesso = ref('')
const acordos = ref([])
const mensalidades = ref([])
const resumoFinanceiro = ref(null)
const configuracao = ref(criarConfiguracaoPadrao())
const clientes = ref([])
const turmas = ref([])
const competenciaSelecionada = ref(competenciaAtual())
const filtrosMensalidades = ref({
  status: '',
  acordoId: '',
  alunoId: '',
  busca: '',
})
const filtrosAcordo = ref({
  buscaAluno: '',
  buscaTurma: '',
  status: '',
})
const acordoFormulario = ref(criarAcordoPadrao())
const mensalidadeManual = ref(criarMensalidadeManualPadrao())
const pagamentoMensalidade = ref(criarPagamentoPadrao())
const cobrancaWhatsapp = ref(criarCobrancaWhatsappPadrao())
let janelaWhatsapp = null
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
  `Centralize acordos, mensalidades, cobrancas no WhatsApp e a configuracao de PIX para ${nomeModalidade.value}.`,
)
const nomeAcordoExemplo = computed(() => `Acordo ${nomeModalidade.value}`)

const alunosSelecionadosIds = computed({
  get: () => acordoFormulario.value.alunoIds || [],
  set: (valor) => {
    acordoFormulario.value.alunoIds = [...new Set((valor || []).map((item) => String(item)).filter(Boolean))]
    if (!acordoFormulario.value.alunoIds.includes(String(acordoFormulario.value.responsavelAlunoId || ''))) {
      acordoFormulario.value.responsavelAlunoId = ''
    }
  },
})

const turmasSelecionadasIds = computed({
  get: () => acordoFormulario.value.turmaIds || [],
  set: (valor) => {
    acordoFormulario.value.turmaIds = [...new Set((valor || []).map((item) => String(item)).filter(Boolean))]
  },
})

const alunosDisponiveis = computed(() =>
  [...clientes.value]
    .map((item) => normalizarAluno(item))
    .filter((aluno) => filtrarAlunoNoAcordo(aluno))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)

const turmasDisponiveis = computed(() =>
  [...turmas.value]
    .map((item) => normalizarTurma(item))
    .filter((turma) => filtrarTurmaNoAcordo(turma))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
)

const alunosSelecionadosNoAcordo = computed(() =>
  alunosSelecionadosIds.value
    .map((id) => alunosDisponiveis.value.find((item) => String(item.id) === String(id)) || clientes.value.find((item) => String(item.id) === String(id)))
    .filter(Boolean)
    .map((item) => normalizarAluno(item)),
)

const turmasSelecionadasNoAcordo = computed(() =>
  turmasSelecionadasIds.value
    .map((id) => turmasDisponiveis.value.find((item) => String(item.id) === String(id)) || turmas.value.find((item) => String(item.id) === String(id)))
    .filter(Boolean)
    .map((item) => normalizarTurma(item)),
)

const responsavelSelecionado = computed(() =>
  alunosSelecionadosNoAcordo.value.find((item) => String(item.id) === String(acordoFormulario.value.responsavelAlunoId || '')) || null,
)

const acordosOrdenados = computed(() =>
  [...acordos.value]
    .map((item) => normalizarAcordo(item))
    .sort((a, b) => compararTexto(a.nome, b.nome)),
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

function criarAcordoPadrao() {
  return {
    nome: '',
    valorMensal: '',
    frequenciaSemanal: '',
    diaVencimento: '',
    geracao: 'AUTOMATICA',
    primeiroMes: 'INTEGRAL',
    valorPrimeiroMesManual: '',
    dataInicio: '',
    dataFinal: '',
    status: 'ATIVO',
    observacoes: '',
    responsavelAlunoId: '',
    alunoIds: [],
    turmaIds: [],
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

  return Promise.all([carregarBase(), carregarAcordos(), carregarMensalidades(), carregarResumo(), carregarConfiguracao()])
    .catch((exception) => {
      erro.value = obterMensagemErro(exception, `Não foi possível carregar a área financeira de ${nomeModalidade.value}.`)
      console.error(exception)
    })
    .finally(() => {
      carregando.value = false
    })
}

async function carregarBase() {
  const [clientesResp, turmasResp] = await Promise.allSettled([buscarClientes(), buscarTurmasBeachTennis()])

  if (clientesResp.status === 'fulfilled') {
    clientes.value = Array.isArray(clientesResp.value) ? clientesResp.value.map(normalizarAluno) : []
  }

  if (turmasResp.status === 'fulfilled') {
    turmas.value = Array.isArray(turmasResp.value) ? turmasResp.value.map(normalizarTurma) : []
  }
}

async function carregarAcordos() {
  const resposta = await buscarAcordosBeachTennis()
  acordos.value = Array.isArray(resposta) ? resposta : []
}

async function carregarMensalidades() {
  const resposta = await buscarMensalidadesBeachTennis({
    competencia: competenciaSelecionada.value,
  })
  mensalidades.value = Array.isArray(resposta) ? resposta : []
}

async function carregarResumo() {
  try {
    resumoFinanceiro.value = await buscarResumoFinanceiroBeachTennis({
      competencia: competenciaSelecionada.value,
    })
  } catch (exception) {
    resumoFinanceiro.value = null
    console.error(exception)
  }
}

async function carregarConfiguracao() {
  try {
    const resposta = await buscarConfiguracaoBeachTennisFinanceira()
    configuracao.value = normalizarConfiguracao(resposta)
  } catch (exception) {
    configuracao.value = criarConfiguracaoPadrao()
    console.error(exception)
  }
}

function limparDadosTela() {
  acordos.value = []
  mensalidades.value = []
  resumoFinanceiro.value = null
  clientes.value = []
  turmas.value = []
  acordoEditandoId.value = ''
  mensalidadeManualAberta.value = false
  mensalidadePagamentoAberta.value = false
  cobrancaWhatsapp.value = criarCobrancaWhatsappPadrao()
  acordoFormulario.value = criarAcordoPadrao()
  mensalidadeManual.value = criarMensalidadeManualPadrao()
  pagamentoMensalidade.value = criarPagamentoPadrao()
  configuracao.value = criarConfiguracaoPadrao()
  sucesso.value = ''
  erro.value = ''
}

async function recarregarTudo() {
  await carregarTudo()
}

function abrirNovaAcordo() {
  acordoEditandoId.value = ''
  acordoFormulario.value = criarAcordoPadrao()
  mudarAba('acordos')
}

async function abrirEdicaoAcordo(item) {
  acordoEditandoId.value = String(item.id || '')
  acordoFormulario.value = criarAcordoPadrao()
  erro.value = ''
  sucesso.value = ''

  try {
    const [detalheResp, alunosResp, turmasResp] = await Promise.allSettled([
      buscarAcordoBeachTennis(item.id),
      buscarAlunosAcordoBeachTennis(item.id),
      buscarTurmasAcordoBeachTennis(item.id),
    ])

    const base = detalheResp.status === 'fulfilled' ? normalizarAcordo(detalheResp.value) : normalizarAcordo(item)
    const alunos = alunosResp.status === 'fulfilled' ? alunosResp.value : base.alunoIds
    const turmasAcordo = turmasResp.status === 'fulfilled' ? turmasResp.value : base.turmaIds

    acordoFormulario.value = normalizarAcordoFormulario({
      ...base,
      alunoIds: normalizarIds(alunos),
      turmaIds: normalizarIds(turmasAcordo),
    })
    acordoEditandoId.value = String(base.id || item.id || '')
    mudarAba('acordos')
  } catch (exception) {
    acordoFormulario.value = normalizarAcordoFormulario(item)
    acordoEditandoId.value = String(item.id || '')
    console.error(exception)
  }
}

function cancelarEdicaoAcordo(limparMensagens = true) {
  acordoEditandoId.value = ''
  acordoFormulario.value = criarAcordoPadrao()

  if (limparMensagens) {
    sucesso.value = ''
  }
}

function normalizarAcordoFormulario(item = {}) {
  const status = normalizarStatusAcordoBeachTennis(item.status || 'ATIVO')

  return {
    nome: item.nome || '',
    valorMensal: valorParaEntrada(item.valorMensal ?? item.valor ?? item.valorAcordo),
    frequenciaSemanal: String(item.frequenciaSemanal || item.frequencia || ''),
    diaVencimento: String(item.diaVencimento || item.vencimentoDia || ''),
    geracao: String(item.modoGeracao || item.geracao || item.tipoGeracao || 'AUTOMATICA').toUpperCase(),
    primeiroMes: String(item.primeiroMes || item.primeiroMesCobranca || 'INTEGRAL').toUpperCase(),
    dataInicio: dataParaInput(item.dataInicio || item.inicio || item.dataInicioVigencia),
    dataFinal: dataParaInput(item.dataFim || item.dataFinal || item.fim),
    status,
    observacoes: item.observacoes || item.observacao || '',
    responsavelAlunoId: String(
      item.clienteResponsavelId || item.responsavelAlunoId || item.responsavelId || item.responsavelAcordoId || '',
    ),
    valorPrimeiroMesManual: valorParaEntrada(item.valorPrimeiroMesManual ?? item.primeiroMesValorManual ?? ''),
    alunoIds: normalizarIds(item.clienteIds || item.alunoIds || item.alunos || item.integrantes || []),
    turmaIds: normalizarIds(item.turmaIds || item.turmas || []),
  }
}

function normalizarAcordo(item = {}) {
  const alunos = normalizarIds(item.alunos || item.integrantes || item.alunoIds || item.clienteIds || [])
  const turmasAcordo = normalizarIds(item.turmas || item.turmaIds || [])
  const status = normalizarStatusAcordoBeachTennis(item.status)

  return {
    ...item,
    id: item.id ?? item.acordoId ?? item.acordoBeachTennisId ?? '',
    nome: item.nome || item.descricao || item.titulo || 'Acordo sem nome',
    valorMensal: numeroSeguro(item.valorMensal ?? item.valor ?? item.valorAcordo),
    frequenciaSemanal: String(item.frequenciaSemanal || item.frequencia || ''),
    diaVencimento: String(item.diaVencimento || item.vencimentoDia || ''),
    geracao: String(item.modoGeracao || item.geracao || item.tipoGeracao || '').trim().toUpperCase(),
    primeiroMes: String(item.primeiroMes || item.primeiroMesCobranca || '').trim().toUpperCase(),
    valorPrimeiroMesManual: numeroSeguro(item.valorPrimeiroMesManual ?? item.primeiroMesValorManual),
    dataInicio: item.dataInicio || item.inicio || '',
    dataFinal: item.dataFim || item.dataFinal || item.fim || '',
    status,
    observacoes: item.observacoes || item.observacao || '',
    responsavelAlunoId: String(item.clienteResponsavelId || item.responsavelAlunoId || item.responsavelId || ''),
    responsavelNome:
      item.clienteResponsavelNome ||
      item.responsavelNome ||
      item.responsavel ||
      alunosSelecionadosNoNome(item, alunos) ||
      'Responsável não informado',
    alunos,
    turmas: turmasAcordo,
    whatsappUrl: item.whatsappUrl || item.urlWhatsapp || item.linkWhatsapp || '',
  }
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

function aplicarSugestoesModalidade() {
  const sugestao = obterSugestaoModalidade(configuracao.value.modalidadeCodigo)
  if (!sugestao) {
    erro.value = 'Selecione uma modalidade com sugestoes disponiveis antes de aplicar os termos.'
    return
  }

  const confirmou = window.confirm('Aplicar os termos sugeridos para a modalidade selecionada?')
  if (!confirmou) {
    return
  }

  configuracao.value = {
    ...configuracao.value,
    ...sugestao,
  }
}

function gerarPayloadAcordo() {
  const clienteIds = normalizarIds(alunosSelecionadosIds.value)
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id))
  const turmaIds = normalizarIds(turmasSelecionadasIds.value)
    .map((id) => Number.parseInt(id, 10))
    .filter((id) => Number.isFinite(id))
  const modoGeracao = String(acordoFormulario.value.geracao || 'AUTOMATICA').trim().toUpperCase()
  const tipoPrimeiroMes = String(acordoFormulario.value.primeiroMes || 'INTEGRAL').trim().toUpperCase()
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
    dataFim: acordoFormulario.value.dataFinal || '',
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
    return `Selecione o responsável pelo pagamento entre os ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} do acordo.`
  }

  if (!alunosSelecionadosIds.value.includes(String(acordoFormulario.value.responsavelAlunoId || ''))) {
    return 'O responsável pelo pagamento precisa estar entre os participantes selecionados.'
  }

  if (!String(acordoFormulario.value.valorMensal || '').trim()) {
    return 'Informe o valor mensal do acordo.'
  }

  if (String(acordoFormulario.value.primeiroMes || '').trim().toUpperCase() === 'MANUAL' &&
    !String(acordoFormulario.value.valorPrimeiroMesManual || '').trim()) {
    return 'Informe o valor do primeiro mês manual.'
  }

  return ''
}

function alternarAlunoAcordo(id) {
  const conjunto = new Set(alunosSelecionadosIds.value.map(String))
  const chave = String(id || '').trim()

  if (!chave) return
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
    if (String(acordoFormulario.value.responsavelAlunoId || '') === chave) {
      acordoFormulario.value.responsavelAlunoId = ''
    }
  } else {
    conjunto.add(chave)
  }

  alunosSelecionadosIds.value = [...conjunto]
}

function alternarTurmaAcordo(id) {
  const conjunto = new Set(turmasSelecionadasIds.value.map(String))
  const chave = String(id || '').trim()

  if (!chave) return
  if (conjunto.has(chave)) {
    conjunto.delete(chave)
  } else {
    conjunto.add(chave)
  }

  turmasSelecionadasIds.value = [...conjunto]
}

function selecionarResponsavelAcordo(id) {
  acordoFormulario.value.responsavelAlunoId = String(id || '').trim()
}

function filtrarAlunoNoAcordo(aluno = {}) {
  const busca = normalizarTexto(filtrosAcordo.value.buscaAluno)
  if (!busca) return true

  const campos = [aluno.nome, aluno.telefone, aluno.email, aluno.perfilBeachTennis, aluno.nivelBeachTennis]
  return campos.some((campo) => normalizarTexto(campo).includes(busca))
}

function filtrarTurmaNoAcordo(turma = {}) {
  const busca = normalizarTexto(filtrosAcordo.value.buscaTurma)
  if (!busca) return true

  const campos = [turma.nome, turma.nivelBeachTennis, turma.professorResponsavelNome]
  return campos.some((campo) => normalizarTexto(campo).includes(busca))
}

function abrirNovaMensalidadeManual() {
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
  await Promise.all([carregarAcordos(), carregarMensalidades(), carregarResumo(), carregarConfiguracao()])
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

function normalizarAluno(item = {}) {
  return {
    ...item,
    id: item.id ?? item.alunoId ?? item.clienteId ?? item.pessoaId ?? '',
    nome: item.nome || item.nomeCompleto || item.clienteNome || termoParticipanteSingular.value,
    telefone: item.telefone || item.celular || '',
    email: item.email || '',
    perfilBeachTennis: item.perfilBeachTennis || '',
    nivelBeachTennis: item.nivelBeachTennis || '',
  }
}

function normalizarTurma(item = {}) {
  return {
    ...item,
    id: item.id ?? item.turmaId ?? '',
    nome: item.nome || item.descricao || termoGrupoSingular.value,
    nivelBeachTennis: item.nivelBeachTennis || item.nivel || '',
    professorResponsavelNome: item.professorResponsavelNome || item.professorNome || item.responsavelNome || '',
  }
}

function nomesDosIds(lista = []) {
  return normalizarIds(lista)
    .map((id) => {
      const aluno = clientes.value.find((item) => String(item.id) === String(id))
      if (aluno) {
        return normalizarAluno(aluno).nome
      }

      const turma = turmas.value.find((item) => String(item.id) === String(id))
      if (turma) {
        return normalizarTurma(turma).nome
      }

      return String(id)
    })
    .filter(Boolean)
    .join(', ')
}

function alunosSelecionadosNoNome(item, alunosIds = []) {
  return normalizarIds(alunosIds)
    .map((id) => clientes.value.find((cliente) => String(cliente.id) === String(id)))
    .filter(Boolean)
    .map((aluno) => normalizarAluno(aluno).nome)
    .join(', ')
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
    if (!ids.includes(String(acordoFormulario.value.responsavelAlunoId || ''))) {
      acordoFormulario.value.responsavelAlunoId = ''
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
              <select v-model="acordoFormulario.geracao">
                <option v-for="opcao in GESTAO_GERACAO" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label>
              Primeiro mês
              <select v-model="acordoFormulario.primeiroMes">
                <option v-for="opcao in PRIMEIRO_MES" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>

            <label v-if="acordoFormulario.primeiroMes === 'MANUAL'">
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
              <input v-model="acordoFormulario.dataFinal" type="date" />
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

          <div class="grade-selecao">
            <section class="bloco-selecao">
              <div class="cabecalho-mini">
                <h3>{{ `${termoParticipantePlural} do acordo` }}</h3>
                <span>{{ alunosSelecionadosIds.length }} selecionado(s)</span>
              </div>
              <p class="ajuda-campo">
                {{ `Selecione um ou vários ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}. O responsável pelo pagamento precisa estar nesta lista.` }}
              </p>
              <label class="campo-busca">
                {{ `Buscar ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')}` }}
                <input v-model="filtrosAcordo.buscaAluno" type="text" placeholder="Nome, telefone ou e-mail" />
              </label>
              <div class="lista-checkboxes">
                <label v-for="aluno in alunosDisponiveis" :key="aluno.id" class="item-checkbox">
                  <input
                    :checked="alunosSelecionadosIds.includes(String(aluno.id))"
                    type="checkbox"
                    @change="alternarAlunoAcordo(aluno.id)"
                  />
                  <span>
                    <strong>{{ aluno.nome }}</strong>
                    <small v-if="aluno.telefone">{{ aluno.telefone }}</small>
                  </span>
                </label>
              </div>
            </section>

            <section class="bloco-selecao">
              <div class="cabecalho-mini">
                <h3>{{ rotuloResponsavelPagamento }}</h3>
                <span v-if="responsavelSelecionado">{{ responsavelSelecionado.nome }}</span>
              </div>
              <p class="ajuda-campo">
                {{ `O pagamento é sempre único por acordo, sem rateio entre ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}.` }}
              </p>
              <label>
                {{ rotuloResponsavelPagamento }}
                <select
                  v-model="acordoFormulario.responsavelAlunoId"
                  :disabled="!alunosSelecionadosIds.length"
                >
                  <option value="">Selecione</option>
                  <option
                    v-for="aluno in alunosSelecionadosNoAcordo"
                    :key="aluno.id"
                    :value="String(aluno.id)"
                  >
                    {{ aluno.nome }}
                  </option>
                </select>
              </label>
            </section>

            <section class="bloco-selecao">
              <div class="cabecalho-mini">
                <h3>{{ `${termoGrupoPlural} vinculadas` }}</h3>
                <span>{{ turmasSelecionadasIds.length }} selecionada(s)</span>
              </div>
              <label class="campo-busca">
                {{ `Buscar ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` }}
                <input v-model="filtrosAcordo.buscaTurma" type="text" :placeholder="`Nome ou ${termoResponsavelSingular.toLocaleLowerCase('pt-BR')}`" />
              </label>
              <div class="lista-checkboxes">
                <label v-for="turma in turmasDisponiveis" :key="turma.id" class="item-checkbox">
                  <input
                    :checked="turmasSelecionadasIds.includes(String(turma.id))"
                    type="checkbox"
                    @change="alternarTurmaAcordo(turma.id)"
                  />
                  <span>
                    <strong>{{ turma.nome }}</strong>
                    <small v-if="turma.professorResponsavelNome">{{ turma.professorResponsavelNome }}</small>
                  </span>
                </label>
              </div>
            </section>
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
              <p>Mostre os integrantes e o responsável pelo pagamento sem dividir o valor por pessoa.</p>
            </div>
            <span class="contador">{{ acordosOrdenados.length }} acordo(s)</span>
          </div>

          <section v-if="!acordosOrdenados.length" class="estado-vazio">
            <p>Nenhum acordo cadastrado ainda.</p>
          </section>

          <div v-else class="grade-acordos">
            <article v-for="acordo in acordosOrdenados" :key="acordo.id" class="acordo-card">
              <div class="cabecalho-card interno">
                <div>
                  <h3>{{ acordo.nome }}</h3>
                  <p>
                    <span :class="classeStatusAcordo(acordo.status)">{{ statusAcordoRotulo(acordo.status) }}</span>
                    <span :class="classeGeracao(acordo.geracao)">{{ acordo.geracao || 'Geração não informada' }}</span>
                    <span :class="classePrimeiroMes(acordo.primeiroMes)">{{ acordo.primeiroMes || 'Primeiro mês não informado' }}</span>
                  </p>
                </div>
                <strong>{{ formatarMoeda(acordo.valorMensal) }}</strong>
              </div>

              <div class="resumo-card">
                <p><strong>Responsável pelo pagamento:</strong> {{ acordo.responsavelNome }}</p>
                <p><strong>{{ termoParticipantePlural }}:</strong> {{ nomesDosIds(acordo.alunos) || `Sem ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}` }}</p>
                <p><strong>{{ termoGrupoPlural }}:</strong> {{ nomesDosIds(acordo.turmas) || `Sem ${termoGrupoPlural.toLocaleLowerCase('pt-BR')}` }}</p>
                <p><strong>Vencimento:</strong> Dia {{ acordo.diaVencimento || '-' }}</p>
                <p><strong>Frequência:</strong> {{ acordo.frequenciaSemanal ? `${acordo.frequenciaSemanal}x por semana` : '-' }}</p>
                <p><strong>Período:</strong> {{ formatarData(acordo.dataInicio) }} {{ acordo.dataFinal ? `até ${formatarData(acordo.dataFinal)}` : '' }}</p>
              </div>

              <p v-if="acordo.observacoes" class="observacoes">{{ acordo.observacoes }}</p>

              <div class="acoes-card">
                <button class="botao secundario" type="button" @click="abrirEdicaoAcordo(acordo)">Editar</button>
              </div>
            </article>
          </div>
        </section>
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
                  <td>{{ formatarCompetencia(mensalidade.competencia) }}</td>
                  <td>{{ mensalidade.nomeAcordo }}</td>
                  <td>{{ mensalidade.responsavelNome }}</td>
                  <td>{{ mensalidade.integranteResumo || '-' }}</td>
                  <td>{{ formatarData(mensalidade.vencimento) }}</td>
                  <td>{{ formatarMoeda(mensalidade.valor) }}</td>
                  <td><span :class="classeStatusMensalidade(mensalidade.status)">{{ statusMensalidadeRotulo(mensalidade.status) }}</span></td>
                  <td>
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
              <p>Defina a identidade esportiva, a chave PIX, o nome do recebedor e o template da mensagem usada na cobrança.</p>
            </div>
            <div class="acoes-cabecalho">
              <button class="botao secundario" type="button" @click="aplicarSugestoesModalidade">
                Aplicar termos sugeridos
              </button>
              <button class="botao principal" type="button" :disabled="salvandoConfiguracao" @click="salvarConfiguracao">
                {{ salvandoConfiguracao ? 'Salvando...' : 'Salvar' }}
              </button>
            </div>
          </div>

          <div class="campos">
            <label>
              Codigo da modalidade
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
              Responsavel singular
              <input v-model="configuracao.termoResponsavelSingular" type="text" placeholder="Ex: Treinador" />
            </label>

            <label>
              Responsaveis plural
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
  color: #0f172a;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 22px 24px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.16), transparent 36%),
    linear-gradient(135deg, #ffffff 0%, #f7fbff 100%);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
}

.subtitulo {
  margin: 0 0 6px;
  color: #0ea5e9;
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
  color: #64748b;
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
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: white;
  color: #334155;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 800;
}

.aba.ativa {
  background: #0f172a;
  color: white;
  border-color: #0f172a;
}

.conteudo-aba {
  display: grid;
  gap: 18px;
}

.card,
.modal-card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.aviso-empresa {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 800;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  background: white;
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
}

.cabecalho-mini {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
  flex-wrap: wrap;
}

.cabecalho-mini h3,
.cabecalho-card h2,
.cabecalho-lista h2 {
  margin: 0;
}

.grade-selecao {
  display: grid;
  grid-template-columns: repeat(3, minmax(240px, 1fr));
  gap: 14px;
  margin-top: 18px;
}

.bloco-selecao {
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  background: #f8fafc;
  display: grid;
  gap: 12px;
  align-content: start;
}

.campo-busca {
  font-weight: 800;
}

.lista-checkboxes {
  display: grid;
  gap: 8px;
  max-height: 270px;
  overflow: auto;
}

.item-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  border: 1px solid #e2e8f0;
  border-radius: 10px;
  background: white;
  padding: 10px;
}

.item-checkbox input {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.item-checkbox span {
  display: grid;
  gap: 3px;
}

.item-checkbox strong {
  font-size: 14px;
}

.item-checkbox small {
  color: #64748b;
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
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
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
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
}

.secundario {
  background: #0f172a;
}

.secundario:hover {
  background: #1e293b;
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
}

.grade-acordos {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 14px;
}

.acordo-card {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 16px;
  display: grid;
  gap: 12px;
  background:
    radial-gradient(circle at top right, rgba(37, 99, 235, 0.08), transparent 26%),
    #fff;
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
  color: #475569;
}

.observacoes {
  padding: 12px;
  border-radius: 10px;
  background: #f8fafc;
  border: 1px dashed #cbd5e1;
}

.contador {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.estado-vazio {
  border: 1px dashed #cbd5e1;
  border-radius: 12px;
  padding: 18px;
  background: #f8fafc;
  color: #64748b;
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
  color: #64748b;
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
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  display: grid;
  gap: 4px;
  background: #f8fafc;
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
  background: #dbeafe;
  color: #1d4ed8;
}

.status.paga {
  background: #dcfce7;
  color: #15803d;
}

.status.vencida {
  background: #fef3c7;
  color: #92400e;
}

.status.cancelada,
.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.status.reaberta,
.status.pausado {
  background: #e0e7ff;
  color: #4338ca;
}

.badge.automatica {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.manual {
  background: #ede9fe;
  color: #6d28d9;
}

.badge.integral {
  background: #dcfce7;
  color: #15803d;
}

.badge.proporcional {
  background: #ffedd5;
  color: #c2410c;
}

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 40;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.45);
}

.modal-card {
  width: min(100%, 820px);
  max-height: 90vh;
  overflow: auto;
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
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  word-break: break-word;
}

th {
  background: #f8fafc;
  color: #111827;
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
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 14px;
  margin-top: 12px;
}

.aviso-whatsapp {
  color: #92400e;
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
}
</style>
