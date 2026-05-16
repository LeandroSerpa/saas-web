<script setup>
import { computed, onMounted, onUnmounted, ref } from 'vue'
import {
  atualizarFatura,
  atualizarStatusFatura,
  aprovarComprovanteFatura,
  buscarEmpresas,
  buscarFaturas,
  buscarMetodosPagamentoAtivos,
  buscarResumoFaturas,
  buscarStatusFinanceiroMinhaEmpresa,
  cancelarFatura,
  criarFatura,
  enviarComprovanteFatura,
  rejeitarComprovanteFatura,
  reativarFatura,
} from '@/services/api'
import {
  normalizarListaMetodosPagamento,
  obterRotuloMetodoPagamento,
} from '@/utils/metodosPagamento'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'PENDENTE', rotulo: 'Pendente' },
  { valor: 'PAGA', rotulo: 'Paga' },
  { valor: 'VENCIDA', rotulo: 'Vencida' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
]

const FORMAS_PAGAMENTO = ['BOLETO', 'PIX', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO', 'PERMUTA']
const GATEWAYS = ['MANUAL', 'ASAAS', 'MERCADO_PAGO', 'STRIPE']

const usuarioLogado = ref(obterUsuarioLogado())
const superAdmin = computed(() => ehSuperAdmin(usuarioLogado.value))
const adminEmpresa = computed(() => ehAdmin(usuarioLogado.value) && !ehSuperAdmin(usuarioLogado.value))
const faturas = ref([])
const resumo = ref({})
const empresas = ref([])
const statusFinanceiro = ref(null)
const metodosPagamento = ref([])
const filtros = ref(criarFiltrosIniciais())
const formulario = ref(criarFormularioInicial())
const pagamento = ref(criarPagamentoInicial())
const comprovante = ref(criarComprovanteInicial())
const faturaEditandoId = ref(null)
const faturaPagamento = ref(null)
const faturaComprovante = ref(null)
const faturaDetalhe = ref(null)
const confirmacaoFinanceira = ref(null)
const rejeicaoComprovante = ref(null)
const mostrarFormulario = ref(false)
const carregando = ref(true)
const salvando = ref(false)
const processandoId = ref(null)
const erro = ref('')
const erroEmpresas = ref('')
const mensagemSucesso = ref('')
const temporizadorFeedback = ref(null)
const statusFinanceiroNormalizado = computed(() =>
  normalizarStatusFinanceiro(obterCampo(statusFinanceiro.value, 'statusFinanceiro', 'status', 'situacao')),
)
const alertaFinanceiro = computed(() => {
  if (statusFinanceiroNormalizado.value === 'BLOQUEADA_FINANCEIRO') {
    return {
      classe: 'erro',
      texto: 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.',
    }
  }

  if (statusFinanceiroNormalizado.value === 'EM_ATRASO') {
    return {
      classe: 'aviso',
      texto: 'Atenção: existem faturas em atraso. Regularize para evitar bloqueio.',
    }
  }

  return null
})
const formasPagamentoDisponiveis = computed(() => {
  const lista = metodosPagamento.value.length ? metodosPagamento.value : [{ codigo: 'PIX', rotulo: 'PIX' }]
  return lista.map((item) => ({
    codigo: item.codigo,
    rotulo: item.rotulo,
  }))
})

const filtrosApi = computed(() => limparVazios(filtros.value))
const subtituloPagina = computed(() =>
  superAdmin.value
    ? 'Gerencie as cobranças das empresas da plataforma.'
    : 'Acompanhe as faturas da sua empresa.',
)
const cardsResumo = computed(() => [
  { titulo: 'Total de faturas', valor: formatarNumero(numeroResumo('totalFaturas', 'total')) },
  { titulo: 'Pendentes', valor: formatarNumero(numeroResumo('totalPendente', 'totalPendentes', 'pendentes')) },
  { titulo: 'Pagas', valor: formatarNumero(numeroResumo('totalPago', 'totalPagas', 'pagas', 'totalPaga')) },
  { titulo: 'Vencidas', valor: formatarNumero(numeroResumo('totalVencido', 'totalVencidas', 'vencidas', 'totalVencida')) },
  { titulo: 'Canceladas', valor: formatarNumero(numeroResumo('totalCancelado', 'totalCanceladas', 'canceladas', 'totalCancelada')) },
  { titulo: 'Valor pendente', valor: formatarMoeda(numeroResumo('valorPendente', 'totalValorPendente')) },
  { titulo: 'Valor pago', valor: formatarMoeda(numeroResumo('valorPago', 'totalValorPago')) },
  { titulo: 'Valor vencido', valor: formatarMoeda(numeroResumo('valorVencido', 'totalValorVencido')) },
  {
    titulo: 'Próximo vencimento',
    valor: formatarData(obterProximoVencimento()),
  },
])

async function carregarDados(opcoes = {}) {
  const { limparFeedback = true } = opcoes

  try {
    carregando.value = true
    if (limparFeedback) {
      limparMensagens()
    } else {
      erro.value = ''
    }

    const promessas = [
      buscarFaturas(filtrosApi.value),
      buscarResumoFaturas(filtrosApi.value),
    ]

    if (adminEmpresa.value) {
      promessas.push(buscarStatusFinanceiroMinhaEmpresa())
    }

    const [faturasApi, resumoApi, statusApi] = await Promise.all(promessas)

    faturas.value = normalizarLista(faturasApi)
    resumo.value = normalizarObjeto(resumoApi)
    statusFinanceiro.value = statusApi ? normalizarObjeto(statusApi) : statusFinanceiro.value
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as faturas.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarMetodosPagamento() {
  try {
    metodosPagamento.value = normalizarMetodos(await buscarMetodosPagamentoAtivos())
    if (!formasPagamentoDisponiveis.value.some((item) => item.codigo === formulario.value.formaPagamento)) {
      formulario.value.formaPagamento = formasPagamentoDisponiveis.value[0]?.codigo || 'PIX'
    }
  } catch (error) {
    metodosPagamento.value = [{ codigo: 'PIX', rotulo: 'PIX' }]
    if (!erro.value) {
      erro.value = obterMensagemErro(error, 'Não foi possível carregar os métodos de pagamento. Usando PIX como padrão.')
    }
    console.error(error)
  }
}

async function carregarEmpresasSeNecessario() {
  if (!superAdmin.value) return

  try {
    erroEmpresas.value = ''
    empresas.value = normalizarLista(await buscarEmpresas())
  } catch (error) {
    empresas.value = []
    erroEmpresas.value = 'Não foi possível carregar a lista de empresas.'
    console.error(error)
  }
}

function aplicarFiltros() {
  carregarDados()
}

function limparFiltros() {
  filtros.value = criarFiltrosIniciais()
  carregarDados()
}

function abrirNovaFatura() {
  if (!superAdmin.value) return

  faturaEditandoId.value = null
  formulario.value = criarFormularioInicial()
  formulario.value.formaPagamento = formasPagamentoDisponiveis.value[0]?.codigo || 'PIX'
  mostrarFormulario.value = true
  erro.value = ''
  mensagemSucesso.value = ''
}

function editarFatura(item) {
  if (!superAdmin.value) return

  faturaEditandoId.value = item.id
  formulario.value = {
    empresaId: obterCampo(item, 'empresaId') || obterCampo(item.empresa, 'id') || '',
    competencia: obterCampo(item, 'competencia') || '',
    descricao: obterCampo(item, 'descricao') || '',
    valor: formatarValorFormulario(obterCampo(item, 'valor')),
    dataEmissao: obterCampo(item, 'dataEmissao') || '',
    dataVencimento: obterCampo(item, 'dataVencimento') || '',
    formaPagamento: obterCampo(item, 'formaPagamento') || 'PIX',
    linkPagamento: obterCampo(item, 'linkPagamento') || '',
    observacao: obterCampo(item, 'observacao') || '',
    gateway: obterCampo(item, 'gateway') || 'MANUAL',
    referenciaGateway: obterCampo(item, 'referenciaGateway', 'gatewayReferencia') || '',
  }
  mostrarFormulario.value = true
  erro.value = ''
  mensagemSucesso.value = ''
}

function cancelarEdicao() {
  faturaEditandoId.value = null
  formulario.value = criarFormularioInicial()
  mostrarFormulario.value = false
}

async function salvarFatura() {
  const erroValidacao = validarFormulario()

  if (erroValidacao) {
    erro.value = erroValidacao
    mensagemSucesso.value = ''
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const payload = montarPayloadFatura()
    const mensagem = faturaEditandoId.value ? 'Fatura atualizada com sucesso.' : 'Fatura criada com sucesso.'

    if (faturaEditandoId.value) {
      await atualizarFatura(faturaEditandoId.value, payload)
    } else {
      await criarFatura(payload)
    }

    cancelarEdicao()
    await carregarDados({ limparFeedback: false })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
    exibirSucesso(mensagem)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível concluir a operação.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function abrirPagamento(item) {
  if (!superAdmin.value) return

  faturaPagamento.value = item
  pagamento.value = criarPagamentoInicial()
  erro.value = ''
  mensagemSucesso.value = ''
}

function fecharPagamento() {
  faturaPagamento.value = null
  pagamento.value = criarPagamentoInicial()
}

function abrirComprovante(item) {
  if (!adminEmpresa.value || !podeEnviarComprovante(item)) return

  faturaComprovante.value = item
  comprovante.value = criarComprovanteInicial()
  erro.value = ''
  mensagemSucesso.value = ''
}

function fecharComprovante() {
  faturaComprovante.value = null
  comprovante.value = criarComprovanteInicial()
}

function abrirConfirmacaoFinanceira({ item, titulo, mensagem, textoBotao, classeBotao, executar }) {
  if (!superAdmin.value) return

  confirmacaoFinanceira.value = {
    item,
    titulo,
    mensagem,
    textoBotao,
    classeBotao,
    executar,
  }
  erro.value = ''
  mensagemSucesso.value = ''
}

function fecharConfirmacaoFinanceira() {
  confirmacaoFinanceira.value = null
}

async function executarConfirmacaoFinanceira() {
  if (!confirmacaoFinanceira.value?.item?.id || !confirmacaoFinanceira.value?.executar) return
  await confirmacaoFinanceira.value.executar(confirmacaoFinanceira.value.item)
  fecharConfirmacaoFinanceira()
}

function abrirRejeicaoComprovante(item) {
  if (!superAdmin.value) return

  rejeicaoComprovante.value = {
    item,
    motivo: '',
  }
  erro.value = ''
  mensagemSucesso.value = ''
}

function fecharRejeicaoComprovante() {
  rejeicaoComprovante.value = null
}

async function confirmarEnvioComprovante() {
  if (!faturaComprovante.value?.id) return

  const linkComprovante = String(comprovante.value.linkComprovante || '').trim()
  const codigoTransacao = String(comprovante.value.codigoTransacao || '').trim()
  const observacao = String(comprovante.value.observacao || '').trim()

  if (!linkComprovante && !codigoTransacao && !observacao) {
    erro.value = 'Informe o link, código da transação ou observação do comprovante.'
    return
  }

  try {
    const faturaId = faturaComprovante.value.id
    processandoId.value = faturaId
    erro.value = ''
    mensagemSucesso.value = ''
    await enviarComprovanteFatura(
      faturaId,
      limparVazios({
        comprovanteUrl: linkComprovante,
        comprovanteTexto: codigoTransacao,
        codigoTransacao,
        observacao,
      }),
    )
    fecharComprovante()
    await carregarDados({ limparFeedback: false })
    faturas.value = faturas.value.map((item) =>
      item.id === faturaId && !obterCampo(item, 'comprovanteStatus', 'statusComprovante')
        ? { ...item, comprovanteStatus: 'ENVIADO' }
        : item,
    )
    window.dispatchEvent(new Event('financeiro-status-atualizado'))
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
    exibirSucesso('Comprovante enviado para análise.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível enviar o comprovante.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function aprovarComprovante(item) {
  abrirConfirmacaoFinanceira({
    item,
    titulo: 'Aprovar comprovante',
    mensagem: 'Aprovar comprovante e marcar fatura como paga?',
    textoBotao: 'Aprovar comprovante',
    classeBotao: 'sucesso-botao',
    executar: aprovarComprovanteConfirmado,
  })
}

async function aprovarComprovanteConfirmado(item) {
  try {
    processandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''
    await aprovarComprovanteFatura(item.id, {})
    await carregarDados({ limparFeedback: false })
    window.dispatchEvent(new Event('financeiro-status-atualizado'))
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
    exibirSucesso('Pagamento confirmado com sucesso.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível aprovar o comprovante.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function rejeitarComprovante(item) {
  abrirRejeicaoComprovante(item)
}

async function confirmarRejeicaoComprovante() {
  if (!rejeicaoComprovante.value?.item?.id) return

  const motivo = String(rejeicaoComprovante.value.motivo || '').trim()
  if (!motivo) {
    erro.value = 'Informe o motivo da rejeição.'
    return
  }

  try {
    const item = rejeicaoComprovante.value.item
    processandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''
    await rejeitarComprovanteFatura(item.id, { motivoRejeicao: motivo, observacao: motivo })
    fecharRejeicaoComprovante()
    await carregarDados({ limparFeedback: false })
    window.dispatchEvent(new Event('financeiro-status-atualizado'))
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
    exibirSucesso('Comprovante rejeitado.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível rejeitar o comprovante.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function confirmarPagamento() {
  if (!faturaPagamento.value?.id) return

  try {
    processandoId.value = faturaPagamento.value.id
    erro.value = ''
    mensagemSucesso.value = ''
    await atualizarStatusFatura(faturaPagamento.value.id, {
      status: 'PAGA',
      dataPagamento: pagamento.value.dataPagamento,
      observacao: pagamento.value.observacao,
    })
    fecharPagamento()
    await carregarDados({ limparFeedback: false })
    window.dispatchEvent(new Event('financeiro-status-atualizado'))
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
    exibirSucesso('Pagamento confirmado com sucesso.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível concluir a operação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function cancelar(item) {
  abrirConfirmacaoFinanceira({
    item,
    titulo: 'Cancelar fatura',
    mensagem: 'Tem certeza que deseja cancelar esta fatura?',
    textoBotao: 'Cancelar fatura',
    classeBotao: 'perigo',
    executar: cancelarConfirmado,
  })
}

async function cancelarConfirmado(item) {
  try {
    processandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''
    await cancelarFatura(item.id)
    await carregarDados({ limparFeedback: false })
    exibirSucesso('Fatura cancelada com sucesso.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível concluir a operação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function reativar(item) {
  abrirConfirmacaoFinanceira({
    item,
    titulo: 'Reativar fatura',
    mensagem: 'Tem certeza que deseja reativar esta fatura?',
    textoBotao: 'Reativar fatura',
    classeBotao: 'sucesso-botao',
    executar: reativarConfirmado,
  })
}

async function reativarConfirmado(item) {
  try {
    processandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''
    await reativarFatura(item.id)
    await carregarDados({ limparFeedback: false })
    exibirSucesso('Fatura reativada com sucesso.')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível reativar a fatura.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function verDetalhes(item) {
  faturaDetalhe.value = item
}

function fecharDetalhes() {
  faturaDetalhe.value = null
}

function ehUrlPagamento(valor) {
  return /^https?:\/\//i.test(String(valor || '').trim())
}

function normalizarStatus(status) {
  const valor = String(status || 'PENDENTE')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()

  const equivalencias = {
    CANCELADO: 'CANCELADA',
    PAGO: 'PAGA',
    VENCIDO: 'VENCIDA',
  }

  return equivalencias[valor] || valor || 'PENDENTE'
}

function statusValor(item) {
  return normalizarStatus(obterCampo(item, 'status'))
}

function podeMarcarComoPaga(item) {
  return superAdmin.value && ['PENDENTE', 'VENCIDA'].includes(statusValor(item))
}

function podeCancelarFatura(item) {
  return superAdmin.value && ['PENDENTE', 'VENCIDA', 'PAGA'].includes(statusValor(item))
}

function textoCancelarFatura(item) {
  return statusValor(item) === 'PAGA' ? 'Cancelar admin.' : 'Cancelar'
}

function podeReativarFatura(item) {
  return superAdmin.value && statusValor(item) === 'CANCELADA'
}

function podeEnviarComprovante(item) {
  const statusComprovante = normalizarComprovanteStatus(obterCampo(item, 'comprovanteStatus', 'statusComprovante'))
  return (
    adminEmpresa.value &&
    ['PENDENTE', 'VENCIDA'].includes(statusValor(item)) &&
    !['ENVIADO', 'APROVADO'].includes(statusComprovante)
  )
}

function podeAprovarOuRejeitarComprovante(item) {
  return superAdmin.value && normalizarComprovanteStatus(obterCampo(item, 'comprovanteStatus', 'statusComprovante')) === 'ENVIADO'
}

function normalizarComprovanteStatus(status) {
  return String(status || 'NAO_ENVIADO')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function comprovanteTexto(status) {
  const valor = normalizarComprovanteStatus(status)
  return {
    NAO_ENVIADO: 'Não enviado',
    ENVIADO: 'Em análise',
    APROVADO: 'Aprovado',
    REJEITADO: 'Rejeitado',
  }[valor] || 'Não enviado'
}

function comprovanteClasse(status) {
  return normalizarComprovanteStatus(status).toLowerCase()
}

function normalizarStatusFinanceiro(status) {
  return String(status || 'ADIMPLENTE').trim().toUpperCase()
}

function faturaVencida(item) {
  return statusValor(item) === 'VENCIDA'
}

async function copiarPagamento(valor) {
  const texto = String(valor || '').trim()

  if (!texto) return

  try {
    if (navigator.clipboard?.writeText && window.isSecureContext) {
      await navigator.clipboard.writeText(texto)
    } else {
      copiarComFallback(texto)
    }

    exibirSucesso('Informação de pagamento copiada.')
  } catch (error) {
    console.error(error)
    erro.value = 'Não foi possível copiar. Selecione o texto e copie manualmente.'
    mensagemSucesso.value = ''
  }
}

function copiarComFallback(texto) {
  const campo = document.createElement('textarea')
  campo.value = texto
  campo.setAttribute('readonly', '')
  campo.style.position = 'fixed'
  campo.style.left = '-9999px'
  document.body.appendChild(campo)
  campo.select()

  const copiado = document.execCommand('copy')
  document.body.removeChild(campo)

  if (!copiado) {
    throw new Error('Clipboard indisponível')
  }
}

function exibirSucesso(mensagem) {
  if (temporizadorFeedback.value) {
    window.clearTimeout(temporizadorFeedback.value)
  }

  mensagemSucesso.value = mensagem
  erro.value = ''
  temporizadorFeedback.value = window.setTimeout(() => {
    mensagemSucesso.value = ''
    temporizadorFeedback.value = null
  }, 5000)
}

function limparMensagens() {
  erro.value = ''
  mensagemSucesso.value = ''

  if (temporizadorFeedback.value) {
    window.clearTimeout(temporizadorFeedback.value)
    temporizadorFeedback.value = null
  }
}

function fecharFeedback(tipo) {
  if (tipo === 'erro') {
    erro.value = ''
    return
  }

  mensagemSucesso.value = ''
  if (temporizadorFeedback.value) {
    window.clearTimeout(temporizadorFeedback.value)
    temporizadorFeedback.value = null
  }
}

function criarFiltrosIniciais() {
  return {
    status: '',
    competencia: '',
    dataVencimentoInicio: '',
    dataVencimentoFim: '',
    busca: '',
    empresaId: '',
  }
}

function criarFormularioInicial() {
  return {
    empresaId: '',
    competencia: '',
    descricao: '',
    valor: '',
    dataEmissao: new Date().toISOString().slice(0, 10),
    dataVencimento: '',
    formaPagamento: 'PIX',
    linkPagamento: '',
    observacao: '',
    gateway: 'MANUAL',
    referenciaGateway: '',
  }
}

function criarPagamentoInicial() {
  return {
    dataPagamento: new Date().toISOString().slice(0, 10),
    observacao: '',
  }
}

function criarComprovanteInicial() {
  return {
    linkComprovante: '',
    codigoTransacao: '',
    observacao: '',
  }
}

function validarFormulario() {
  if (superAdmin.value && !formulario.value.empresaId) {
    return 'Selecione a empresa da fatura.'
  }

  if (!String(formulario.value.competencia || '').trim()) {
    return 'Informe a competência da fatura.'
  }

  if (!String(formulario.value.descricao || '').trim()) {
    return 'Informe a descrição da fatura.'
  }

  const valor = converterValorFormulario(formulario.value.valor)

  if (formulario.value.valor === '' || formulario.value.valor === null || formulario.value.valor === undefined) {
    return 'Informe o valor da fatura.'
  }

  if (!Number.isFinite(valor)) {
    return 'Informe um valor valido para a fatura.'
  }

  if (valor < 0) {
    return 'O valor da fatura não pode ser negativo.'
  }

  if (!formulario.value.dataVencimento) {
    return 'Informe a data de vencimento.'
  }

  return ''
}

function montarPayloadFatura() {
  const { status, ...camposEditaveis } = formulario.value

  return limparVazios({
    ...camposEditaveis,
    empresaId: formulario.value.empresaId ? Number(formulario.value.empresaId) : '',
    valor: converterValorFormulario(formulario.value.valor),
  })
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  if (Array.isArray(dados.content)) return dados.content
  if (Array.isArray(dados.data?.content)) return dados.data.content
  if (Array.isArray(dados.data)) return dados.data
  if (Array.isArray(dados.items)) return dados.items
  if (Array.isArray(dados.itens)) return dados.itens
  if (Array.isArray(dados.resultado)) return dados.resultado
  if (Array.isArray(dados.value)) return dados.value

  return []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  if (dados.data && !Array.isArray(dados.data) && typeof dados.data === 'object') return dados.data
  if (dados.resultado && !Array.isArray(dados.resultado) && typeof dados.resultado === 'object') return dados.resultado
  return dados
}

function normalizarMetodos(dados) {
  const ativos = normalizarListaMetodosPagamento(dados).map((codigo) => ({
    codigo,
    rotulo: obterRotuloMetodoPagamento(codigo),
  }))

  return ativos.length ? ativos : [{ codigo: 'PIX', rotulo: 'PIX' }]
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch (error) {
    console.error(error)
    return null
  }
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''

  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') {
      return item[campo]
    }
  }

  return ''
}

function numeroResumo(...campos) {
  return numeroValor(obterCampo(resumo.value, ...campos))
}

function obterProximoVencimento() {
  const vencimento = obterCampo(resumo.value, 'proximaFaturaVencimento', 'proximoVencimento')

  if (vencimento) return vencimento

  const proximaFatura = obterCampo(resumo.value, 'proximaFatura')
  return typeof proximaFatura === 'object'
    ? obterCampo(proximaFatura, 'dataVencimento', 'vencimento', 'proximaFaturaVencimento')
    : proximaFatura
}

function numeroValor(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function converterValorFormulario(valor) {
  const texto = String(valor ?? '').trim()

  if (!texto) return NaN

  const semEspacos = texto.replace(/\s/g, '')
  const ultimaVirgula = semEspacos.lastIndexOf(',')
  const ultimoPonto = semEspacos.lastIndexOf('.')
  const indiceDecimal = Math.max(ultimaVirgula, ultimoPonto)

  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    const inteiros = semEspacos.slice(0, indiceDecimal).replace(/[.,]/g, '')
    const decimais = semEspacos.slice(indiceDecimal + 1).replace(/[.,]/g, '')
    return Number(`${inteiros}.${decimais}`)
  }

  if (ultimaVirgula >= 0) {
    return Number(semEspacos.replace(/\./g, '').replace(',', '.'))
  }

  return Number(semEspacos.replace(/,/g, '.'))
}

function formatarValorFormulario(valor) {
  if (valor === '' || valor === null || valor === undefined) return ''

  const numero = typeof valor === 'number' ? valor : converterValorFormulario(valor)
  return Number.isFinite(numero)
    ? numero.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
    : String(valor)
}

function formatarValorFormularioAoSair() {
  formulario.value.valor = formatarValorFormulario(formulario.value.valor)
}

function nomeEmpresa(item) {
  return (
    obterCampo(item, 'empresaNome', 'nomeEmpresa') ||
    obterCampo(item.empresa, 'nome', 'razaoSocial') ||
    empresas.value.find((empresa) => String(empresa.id) === String(obterCampo(item, 'empresaId')))?.nome ||
    '-'
  )
}

function statusTexto(status) {
  const valor = normalizarStatus(status)
  return STATUS.find((item) => item.valor === valor)?.rotulo || valor || '-'
}

function statusClasse(status) {
  return normalizarStatus(status).toLowerCase()
}

function formatarMoeda(valor) {
  return numeroValor(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarNumero(valor) {
  return numeroValor(valor).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function criarData(valor) {
  if (!valor) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
    const [ano, mes, dia] = String(valor).split('-').map(Number)
    return new Date(ano, mes - 1, dia)
  }

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function formatarData(valor) {
  const data = criarData(valor)
  return data ? data.toLocaleDateString('pt-BR') : '-'
}

function formatarCompetencia(valor) {
  if (!valor) return '-'

  const texto = String(valor)
  const match = texto.match(/^(\d{4})-(\d{2})/)

  return match ? `${match[2]}/${match[1]}` : texto
}

function obterMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  const normalizada = mensagem.toLowerCase()

  if (/duplic|semelhante|já existe|ja existe|unique|constraint/i.test(mensagem)) {
    return 'Já existe uma fatura semelhante para esta empresa e competência.'
  }

  if (normalizada === 'forbidden' || normalizada.includes('403') || normalizada.includes('permiss')) {
    return 'Você não tem permissão para executar esta ação.'
  }

  if (error?.status === 400) {
    return mensagem && !mensagemTecnica(mensagem)
      ? mensagem
      : 'Não foi possível processar a solicitação. Confira os dados informados.'
  }

  if (error?.status === 500 || mensagemTecnica(mensagem)) {
    return 'Não foi possível concluir a operação agora. Tente novamente em instantes.'
  }

  return mensagem || fallback || 'Não foi possível concluir a operação.'
}

function mensagemTecnica(mensagem) {
  return /exception|stack trace|sql|constraint|hibernate|java\./i.test(String(mensagem || ''))
}

onMounted(async () => {
  await carregarEmpresasSeNecessario()
  await carregarMetodosPagamento()
  await carregarDados()
})

onUnmounted(() => {
  if (temporizadorFeedback.value) {
    window.clearTimeout(temporizadorFeedback.value)
  }
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">{{ superAdmin ? 'ADMINISTRAÇÃO SAAS' : 'MINHA EMPRESA' }}</p>
        <h1>Faturas</h1>
        <p class="descricao">{{ subtituloPagina }}</p>
      </div>

      <div class="acoes-topo">
        <button class="botao secundario" :disabled="carregando" @click="carregarDados">
          {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
        <button v-if="superAdmin" class="botao principal" @click="abrirNovaFatura">Nova fatura</button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
      <button type="button" class="fechar-feedback" aria-label="Fechar mensagem" @click="fecharFeedback('erro')">
        x
      </button>
    </section>
    <section v-if="erroEmpresas" class="card feedback aviso">
      <p>{{ erroEmpresas }}</p>
    </section>
    <section v-if="mensagemSucesso" class="card feedback sucesso">
      <p>{{ mensagemSucesso }}</p>
      <button type="button" class="fechar-feedback" aria-label="Fechar mensagem" @click="fecharFeedback('sucesso')">
        x
      </button>
    </section>
    <section v-if="alertaFinanceiro" :class="['card', 'feedback', alertaFinanceiro.classe]">
      <p>{{ alertaFinanceiro.texto }}</p>
    </section>

    <section v-if="confirmacaoFinanceira" class="card painel-acao">
      <div class="cabecalho-card">
        <div>
          <h2>{{ confirmacaoFinanceira.titulo }}</h2>
          <p>{{ confirmacaoFinanceira.mensagem }}</p>
        </div>
      </div>
      <div class="acoes">
        <button class="botao secundario" :disabled="Boolean(processandoId)" @click="fecharConfirmacaoFinanceira">
          Cancelar
        </button>
        <button
          class="botao"
          :class="confirmacaoFinanceira.classeBotao"
          :disabled="Boolean(processandoId)"
          @click="executarConfirmacaoFinanceira"
        >
          {{ processandoId ? 'Processando...' : confirmacaoFinanceira.textoBotao }}
        </button>
      </div>
    </section>

    <section v-if="rejeicaoComprovante" class="card painel-acao">
      <div class="cabecalho-card">
        <div>
          <h2>Rejeitar comprovante</h2>
          <p>Informe um motivo claro para a empresa acompanhar a análise.</p>
        </div>
        <button class="botao secundario" :disabled="Boolean(processandoId)" @click="fecharRejeicaoComprovante">
          Fechar
        </button>
      </div>
      <label>
        Motivo da rejeição
        <textarea v-model="rejeicaoComprovante.motivo" rows="3" :disabled="Boolean(processandoId)"></textarea>
      </label>
      <div class="acoes">
        <button class="botao secundario" :disabled="Boolean(processandoId)" @click="fecharRejeicaoComprovante">
          Cancelar
        </button>
        <button class="botao perigo" :disabled="Boolean(processandoId)" @click="confirmarRejeicaoComprovante">
          {{ processandoId ? 'Rejeitando...' : 'Rejeitar comprovante' }}
        </button>
      </div>
    </section>

    <section class="grade-resumo">
      <article v-for="card in cardsResumo" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card filtros">
      <div class="titulo-card">
        <h2>Filtros</h2>
        <p>Refine a consulta por status, competência, vencimento ou empresa.</p>
      </div>

      <div class="campos">
        <label>
          Status
          <select v-model="filtros.status">
            <option v-for="status in STATUS" :key="status.valor" :value="status.valor">
              {{ status.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Competência
          <input v-model="filtros.competencia" type="month" />
        </label>

        <label>
          Vencimento inicial
          <input v-model="filtros.dataVencimentoInicio" type="date" />
        </label>

        <label>
          Vencimento final
          <input v-model="filtros.dataVencimentoFim" type="date" />
        </label>

        <label>
          Busca textual
          <input v-model="filtros.busca" type="text" placeholder="Descrição, forma, gateway..." />
        </label>

        <label v-if="superAdmin">
          Empresa
          <select v-model="filtros.empresaId">
            <option value="">Todas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}
            </option>
          </select>
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="aplicarFiltros">Aplicar filtros</button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">Limpar filtros</button>
        <button v-if="superAdmin" class="botao sucesso-botao" @click="abrirNovaFatura">Nova fatura</button>
      </div>
    </section>

    <form v-if="superAdmin && mostrarFormulario" class="card formulario" @submit.prevent="salvarFatura">
      <div class="cabecalho-card">
        <div>
          <h2>{{ faturaEditandoId ? 'Editar fatura' : 'Nova fatura' }}</h2>
          <p>Preencha os dados da cobrança manual. O status é alterado pelas ações da tabela.</p>
          <p class="nota-pix">Faturas automáticas usam PIX por padrão.</p>
        </div>
        <button type="button" class="botao secundario" @click="cancelarEdicao">Fechar</button>
      </div>

      <div class="campos">
        <label>
          Empresa
          <select v-model="formulario.empresaId">
            <option value="">Selecione</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}
            </option>
          </select>
        </label>

        <label>
          Competência
          <input v-model="formulario.competencia" type="month" />
        </label>

        <label>
          Valor
          <input v-model="formulario.valor" type="text" inputmode="decimal" @blur="formatarValorFormularioAoSair" />
        </label>

        <label>
          Data de emissão
          <input v-model="formulario.dataEmissao" type="date" />
        </label>

        <label>
          Data de vencimento
          <input v-model="formulario.dataVencimento" type="date" />
        </label>

        <label>
          Forma de pagamento
          <select v-model="formulario.formaPagamento">
            <option v-for="forma in formasPagamentoDisponiveis" :key="forma.codigo" :value="forma.codigo">
              {{ forma.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Gateway
          <select v-model="formulario.gateway">
            <option v-for="gateway in GATEWAYS" :key="gateway" :value="gateway">{{ gateway }}</option>
          </select>
        </label>

        <label>
          Referência do gateway
          <input v-model="formulario.referenciaGateway" type="text" />
        </label>

        <label class="campo-grande">
          Descrição
          <input v-model="formulario.descricao" type="text" />
        </label>

        <label class="campo-grande">
          Link, código Pix ou referência de pagamento
          <textarea
            v-model="formulario.linkPagamento"
            rows="2"
            placeholder="Ex: https://..., código Pix, linha digitável ou referência manual"
          ></textarea>
        </label>

        <label class="campo-grande">
          Observação
          <textarea v-model="formulario.observacao" rows="3"></textarea>
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="salvando">
          {{ salvando ? 'Salvando...' : faturaEditandoId ? 'Salvar alterações' : 'Criar fatura' }}
        </button>
        <button type="button" class="botao secundario" :disabled="salvando" @click="cancelarEdicao">
          Cancelar
        </button>
      </div>
    </form>

    <section v-if="superAdmin && faturaPagamento" class="card painel-acao">
      <div class="cabecalho-card">
        <div>
          <h2>Confirmar pagamento</h2>
          <p>{{ nomeEmpresa(faturaPagamento) }} - {{ formatarMoeda(obterCampo(faturaPagamento, 'valor')) }}</p>
        </div>
        <button class="botao secundario" @click="fecharPagamento">Fechar</button>
      </div>

      <div class="campos pagamento-campos">
        <label>
          Data de pagamento
          <input v-model="pagamento.dataPagamento" type="date" />
        </label>

        <label class="campo-grande">
          Observação
          <textarea v-model="pagamento.observacao" rows="3"></textarea>
        </label>
      </div>

      <button class="botao sucesso-botao" :disabled="processandoId === faturaPagamento.id" @click="confirmarPagamento">
        {{ processandoId === faturaPagamento.id ? 'Confirmando...' : 'Confirmar pagamento' }}
      </button>
    </section>

    <section v-if="adminEmpresa && faturaComprovante" class="card painel-acao">
      <div class="cabecalho-card">
        <div>
          <h2>Enviar comprovante</h2>
          <p>{{ nomeEmpresa(faturaComprovante) }} - {{ formatarMoeda(obterCampo(faturaComprovante, 'valor')) }}</p>
          <p class="texto-ajuda">
            Não é necessário anexar imagem. Informe um link, código Pix, ID de transação ou observação para conferência manual.
          </p>
        </div>
        <button class="botao secundario" @click="fecharComprovante">Fechar</button>
      </div>

      <div class="campos">
        <label>
          Link do comprovante, se houver
          <input v-model="comprovante.linkComprovante" type="text" placeholder="https://..." />
        </label>

        <label>
          Código Pix ou ID da transação
          <input v-model="comprovante.codigoTransacao" type="text" />
        </label>

        <label class="campo-grande">
          Observação
          <textarea v-model="comprovante.observacao" rows="3"></textarea>
        </label>
      </div>

      <button class="botao principal" :disabled="processandoId === faturaComprovante.id" @click="confirmarEnvioComprovante">
        {{ processandoId === faturaComprovante.id ? 'Enviando...' : 'Enviar comprovante' }}
      </button>
    </section>

    <section v-if="faturaDetalhe" class="card detalhe">
      <div class="cabecalho-card">
        <div>
          <h2>Detalhes da fatura</h2>
          <p>{{ nomeEmpresa(faturaDetalhe) }} - {{ formatarCompetencia(obterCampo(faturaDetalhe, 'competencia')) }}</p>
        </div>
        <button class="botao secundario" @click="fecharDetalhes">Fechar</button>
      </div>

      <div class="detalhes-grid">
        <p><strong>Descrição:</strong> {{ obterCampo(faturaDetalhe, 'descricao') || '-' }}</p>
        <p><strong>Valor:</strong> {{ formatarMoeda(obterCampo(faturaDetalhe, 'valor')) }}</p>
        <p><strong>Status:</strong> {{ statusTexto(obterCampo(faturaDetalhe, 'status')) }}</p>
        <p><strong>Emissão:</strong> {{ formatarData(obterCampo(faturaDetalhe, 'dataEmissao')) }}</p>
        <p><strong>Vencimento:</strong> {{ formatarData(obterCampo(faturaDetalhe, 'dataVencimento')) }}</p>
        <p><strong>Pagamento:</strong> {{ formatarData(obterCampo(faturaDetalhe, 'dataPagamento')) }}</p>
        <p><strong>Forma:</strong> {{ obterCampo(faturaDetalhe, 'formaPagamento') || '-' }}</p>
        <p><strong>Gateway:</strong> {{ obterCampo(faturaDetalhe, 'gateway') || '-' }}</p>
        <p>
          <strong>Status do comprovante:</strong>
          {{ comprovanteTexto(obterCampo(faturaDetalhe, 'comprovanteStatus', 'statusComprovante')) }}
        </p>
        <p
          v-if="obterCampo(faturaDetalhe, 'comprovanteUrl', 'linkComprovante', 'comprovanteLink')"
          class="campo-grande"
        >
          <strong>Link do comprovante:</strong>
          <a
            :href="obterCampo(faturaDetalhe, 'comprovanteUrl', 'linkComprovante', 'comprovanteLink')"
            target="_blank"
            rel="noreferrer"
          >
            Abrir
          </a>
        </p>
        <p v-if="obterCampo(faturaDetalhe, 'codigoTransacao', 'comprovanteTexto', 'codigoPix')" class="campo-grande">
          <strong>Código/ID da transação:</strong>
          {{ obterCampo(faturaDetalhe, 'codigoTransacao', 'comprovanteTexto', 'codigoPix') }}
        </p>
        <p v-if="obterCampo(faturaDetalhe, 'comprovanteObservacao', 'observacaoComprovante')" class="campo-grande">
          <strong>Observação do comprovante:</strong>
          {{ obterCampo(faturaDetalhe, 'comprovanteObservacao', 'observacaoComprovante') }}
        </p>
        <p
          v-if="obterCampo(faturaDetalhe, 'motivoRejeicaoComprovante', 'comprovanteMotivoRejeicao')"
          class="campo-grande"
        >
          <strong>Motivo de rejeição:</strong>
          {{ obterCampo(faturaDetalhe, 'motivoRejeicaoComprovante', 'comprovanteMotivoRejeicao') }}
        </p>
        <p class="campo-grande pagamento-detalhe">
          <strong>Link, código Pix ou referência:</strong>
          <template v-if="obterCampo(faturaDetalhe, 'linkPagamento')">
            <a
              v-if="ehUrlPagamento(obterCampo(faturaDetalhe, 'linkPagamento'))"
              :href="obterCampo(faturaDetalhe, 'linkPagamento')"
              target="_blank"
              rel="noreferrer"
            >
              Abrir
            </a>
            <button
              v-else
              class="botao compacto secundario"
              @click="copiarPagamento(obterCampo(faturaDetalhe, 'linkPagamento'))"
            >
              Copiar
            </button>
          </template>
          <span v-else>-</span>
        </p>
        <p class="campo-grande"><strong>Observação:</strong> {{ obterCampo(faturaDetalhe, 'observacao') || '-' }}</p>
      </div>
    </section>

    <section class="secao-lista">
      <div class="cabecalho-lista">
        <div>
          <h2>Faturas</h2>
          <p>Lista de cobranças retornadas pela API para os filtros aplicados.</p>
        </div>
        <span class="contador">{{ faturas.length }} fatura(s)</span>
      </div>

      <section v-if="carregando" class="card"><p>Carregando faturas...</p></section>
      <section v-else-if="!faturas.length" class="card">
        <p>Nenhuma fatura encontrada para os filtros selecionados.</p>
      </section>

      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table class="tabela-faturas">
            <thead>
              <tr>
                <th v-if="superAdmin">Empresa</th>
                <th>Competência</th>
                <th>Descrição</th>
                <th>Valor</th>
                <th>Status</th>
                <th>Emissão</th>
                <th>Vencimento</th>
                <th>Pagamento</th>
                <th>Forma</th>
                <th>Comprovante</th>
                <th>Link</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in faturas" :key="item.id" :class="{ 'linha-vencida': faturaVencida(item) }">
                <td v-if="superAdmin">{{ nomeEmpresa(item) }}</td>
                <td>{{ formatarCompetencia(obterCampo(item, 'competencia')) }}</td>
                <td>{{ obterCampo(item, 'descricao') || '-' }}</td>
                <td>{{ formatarMoeda(obterCampo(item, 'valor')) }}</td>
                <td>
                  <span :class="['status', statusClasse(obterCampo(item, 'status'))]">
                    {{ statusTexto(obterCampo(item, 'status')) }}
                  </span>
                </td>
                <td>{{ formatarData(obterCampo(item, 'dataEmissao')) }}</td>
                <td>{{ formatarData(obterCampo(item, 'dataVencimento')) }}</td>
                <td>{{ formatarData(obterCampo(item, 'dataPagamento')) }}</td>
                <td>{{ obterCampo(item, 'formaPagamento') || '-' }}</td>
                <td>
                  <span :class="['comprovante', comprovanteClasse(obterCampo(item, 'comprovanteStatus', 'statusComprovante'))]">
                    {{ comprovanteTexto(obterCampo(item, 'comprovanteStatus', 'statusComprovante')) }}
                  </span>
                </td>
                <td>
                  <a
                    v-if="obterCampo(item, 'linkPagamento') && ehUrlPagamento(obterCampo(item, 'linkPagamento'))"
                    :href="obterCampo(item, 'linkPagamento')"
                    target="_blank"
                    rel="noreferrer"
                  >
                    Abrir
                  </a>
                  <button
                    v-else-if="obterCampo(item, 'linkPagamento')"
                    class="botao compacto secundario"
                    @click="copiarPagamento(obterCampo(item, 'linkPagamento'))"
                  >
                    Copiar
                  </button>
                  <span v-else>-</span>
                </td>
                <td>
                  <div class="acoes-tabela">
                    <template v-if="!superAdmin">
                      <button class="botao compacto secundario" @click="verDetalhes(item)">
                        Ver detalhes
                      </button>
                      <button
                        v-if="podeEnviarComprovante(item)"
                        class="botao compacto principal"
                        :disabled="processandoId === item.id"
                        @click="abrirComprovante(item)"
                      >
                        Enviar comprovante
                      </button>
                    </template>
                    <template v-else>
                      <button class="botao compacto secundario" @click="editarFatura(item)">Editar</button>
                      <button
                        v-if="podeMarcarComoPaga(item)"
                        class="botao compacto sucesso-botao"
                        :disabled="processandoId === item.id"
                        @click="abrirPagamento(item)"
                      >
                        Marcar como paga
                      </button>
                      <button
                        v-if="podeCancelarFatura(item)"
                        class="botao compacto perigo"
                        :disabled="processandoId === item.id"
                        @click="cancelar(item)"
                      >
                        {{ textoCancelarFatura(item) }}
                      </button>
                      <button
                        v-if="podeReativarFatura(item)"
                        class="botao compacto sucesso-botao"
                        :disabled="processandoId === item.id"
                        @click="reativar(item)"
                      >
                        Reativar
                      </button>
                      <button
                        v-if="podeAprovarOuRejeitarComprovante(item)"
                        class="botao compacto sucesso-botao"
                        :disabled="processandoId === item.id"
                        @click="aprovarComprovante(item)"
                      >
                        Aprovar comprovante
                      </button>
                      <button
                        v-if="podeAprovarOuRejeitarComprovante(item)"
                        class="botao compacto perigo"
                        :disabled="processandoId === item.id"
                        @click="rejeitarComprovante(item)"
                      >
                        Rejeitar comprovante
                      </button>
                    </template>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.filtros,
.formulario,
.painel-acao,
.detalhe,
.secao-lista {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-card,
.cabecalho-lista,
.acoes,
.acoes-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

h2 {
  color: #111827;
  font-size: 22px;
  font-weight: 800;
}

.descricao,
.titulo-card p,
.cabecalho-card p,
.cabecalho-lista p {
  margin-top: 6px;
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.feedback {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 14px;
}

.fechar-feedback {
  width: 28px;
  height: 28px;
  border: none;
  border-radius: 999px;
  background: rgba(15, 23, 42, 0.08);
  color: inherit;
  cursor: pointer;
  font-weight: 800;
  line-height: 1;
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(3, minmax(170px, 1fr));
  gap: 16px;
}

.indicador {
  display: grid;
  gap: 8px;
}

.indicador span {
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
}

.indicador strong {
  font-size: 24px;
  font-weight: 800;
}

.campos,
.detalhes-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.pagamento-campos {
  grid-template-columns: minmax(180px, 260px) 1fr;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-size: 14px;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  background: white;
  font: inherit;
  box-sizing: border-box;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.contador {
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.tabela-card {
  padding: 0;
  overflow: hidden;
}

.tabela-container {
  width: 100%;
  overflow-x: visible;
}

table {
  width: 100%;
  min-width: 0;
  border-collapse: collapse;
  table-layout: auto;
}

th,
td {
  padding: 10px 8px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  line-height: 1.35;
  white-space: normal;
  word-break: break-word;
}

th {
  background: #f8fafc;
  color: #111827;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.tabela-faturas th:last-child,
.tabela-faturas td:last-child {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 150px;
  min-width: 150px;
  background: white;
  box-shadow: -8px 0 14px rgba(15, 23, 42, 0.06);
}

.tabela-faturas th:last-child {
  z-index: 3;
  background: #f8fafc;
}

.linha-vencida td:last-child {
  background: #fff7ed;
}

.tabela-faturas td:first-child {
  max-width: 170px;
}

.tabela-faturas td:nth-child(3) {
  max-width: 190px;
}

a {
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

.status {
  display: inline-flex;
  width: fit-content;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.pendente {
  background: #fef3c7;
  color: #92400e;
}

.status.paga {
  background: #dcfce7;
  color: #15803d;
}

.status.vencida {
  background: #ffedd5;
  color: #c2410c;
}

.status.cancelada {
  background: #e5e7eb;
  color: #4b5563;
}

.linha-vencida {
  background: #fff7ed;
}

.nota-pix {
  color: #1d4ed8;
  font-weight: 800;
}

.comprovante {
  display: inline-flex;
  width: fit-content;
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.comprovante.nao_enviado {
  background: #e5e7eb;
  color: #4b5563;
}

.comprovante.enviado {
  background: #dbeafe;
  color: #1d4ed8;
}

.comprovante.aprovado {
  background: #dcfce7;
  color: #15803d;
}

.comprovante.rejeitado {
  background: #fee2e2;
  color: #b91c1c;
}

.acoes-tabela {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: 6px;
  min-width: 0;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.compacto {
  width: 100%;
  padding: 7px 8px;
  font-size: 11px;
  line-height: 1.2;
  white-space: normal;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.sucesso-botao {
  background: #15803d;
}

.perigo {
  background: #dc2626;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.aviso {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

@media (max-width: 1100px) {
  .tabela-container {
    overflow-x: auto;
  }

  table {
    min-width: 1100px;
  }

  .grade-resumo,
  .campos,
  .detalhes-grid {
    grid-template-columns: repeat(2, minmax(180px, 1fr));
  }
}

@media (max-width: 760px) {
  .cabecalho-pagina,
  .cabecalho-card,
  .cabecalho-lista,
  .acoes,
  .acoes-topo {
    align-items: flex-start;
    flex-direction: column;
  }

  .grade-resumo,
  .campos,
  .detalhes-grid,
  .pagamento-campos {
    grid-template-columns: 1fr;
  }
}
</style>
