<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ativarFaturaRecorrente,
  atualizarFaturaRecorrente,
  buscarEmpresas,
  buscarFaturasRecorrentes,
  buscarSugestaoFaturaRecorrente,
  criarFaturaRecorrente,
  desativarFaturaRecorrente,
  gerarFaturasRecorrentesDoMes,
  gerarProximaFaturaRecorrente,
} from '@/services/api'

const recorrencias = ref([])
const empresas = ref([])
const filtros = ref({ empresaId: '', status: '', busca: '' })
const formulario = ref(criarFormulario())
const editandoId = ref(null)
const mostrarFormulario = ref(false)
const mostrarGeracaoMes = ref(false)
const competenciaGeracao = ref(new Date().toISOString().slice(0, 7))
const carregando = ref(true)
const salvando = ref(false)
const processandoMes = ref(false)
const processandoId = ref(null)
const processandoProximaId = ref(null)
const erro = ref('')
const sucesso = ref('')
const resumoGeracao = ref(null)
const detalhesGeracao = ref([])
const confirmacao = ref(null)
const sugestaoRecorrencia = ref(null)
const carregandoSugestao = ref(false)
const sugestaoConsultada = ref(false)
const erroSugestao = ref('')

const recorrenciasFiltradas = computed(() =>
  recorrencias.value.filter((item) => {
    if (filtros.value.status === 'ATIVA') return estaAtiva(item)
    if (filtros.value.status === 'INATIVA') return !estaAtiva(item)
    return true
  }),
)

const cards = computed(() => {
  const base = recorrenciasFiltradas.value
  const total = base.length
  const ativas = base.filter((item) => estaAtiva(item)).length
  const valorMensal = base
    .filter((item) => estaAtiva(item))
    .reduce((totalValor, item) => totalValor + numero(obterCampo(item, 'valor')), 0)

  return [
    { titulo: 'Total de recorrências', valor: total },
    { titulo: 'Ativas', valor: ativas },
    { titulo: 'Inativas', valor: total - ativas },
    { titulo: 'Valor mensal previsto', valor: formatarMoeda(valorMensal) },
    { titulo: 'Próxima competência', valor: obterProximaCompetencia(base) },
  ]
})

const existemFiltrosAtivos = computed(() =>
  Boolean(filtros.value.empresaId || filtros.value.status || String(filtros.value.busca || '').trim()),
)

const mensagemListaVazia = computed(() =>
  existemFiltrosAtivos.value
    ? 'Nenhuma recorrência encontrada para os filtros selecionados.'
    : 'Nenhuma recorrência cadastrada.',
)

const temAssinaturaAtiva = computed(() => {
  if (!sugestaoConsultada.value || !sugestaoRecorrencia.value) return true
  return valorBooleano(obterCampo(sugestaoRecorrencia.value, 'assinaturaAtiva', 'temAssinaturaAtiva', 'ativa', 'ativo'))
})

const podeSalvarRecorrencia = computed(() =>
  !salvando.value && !carregandoSugestao.value && (editandoId.value || !formulario.value.empresaId || temAssinaturaAtiva.value),
)

async function carregarDados() {
  if (carregando.value && recorrencias.value.length) return

  try {
    carregando.value = true
    erro.value = ''
    const [recorrenciasApi, empresasApi] = await Promise.all([
      buscarFaturasRecorrentes(montarFiltrosApi()),
      buscarEmpresas(),
    ])
    recorrencias.value = normalizarLista(recorrenciasApi)
    empresas.value = normalizarLista(empresasApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as faturas recorrentes.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function montarFiltrosApi() {
  const status = normalizarStatusRecorrencia(filtros.value.status)
  const ativo = status === 'ATIVA' ? true : status === 'INATIVA' ? false : ''

  return limparVazios({
    empresaId: filtros.value.empresaId,
    busca: filtros.value.busca,
    status,
    ativo,
  })
}

async function limparFiltros() {
  filtros.value = { empresaId: '', status: '', busca: '' }
  await carregarDados()
}

function abrirNova() {
  editandoId.value = null
  formulario.value = criarFormulario()
  limparSugestao()
  mostrarFormulario.value = true
  erro.value = ''
  sucesso.value = ''
}

function editar(item) {
  editandoId.value = item.id
  formulario.value = {
    empresaId: obterCampo(item, 'empresaId') || obterCampo(item.empresa, 'id') || '',
    descricao: obterCampo(item, 'descricao') || '',
    valor: formatarValorFormulario(obterCampo(item, 'valor')),
    diaVencimento: obterCampo(item, 'diaVencimento') || '',
    competenciaInicio: normalizarCompetenciaEntrada(obterCampo(item, 'competenciaInicio')) || '',
    competenciaFim: normalizarCompetenciaEntrada(obterCampo(item, 'competenciaFim')) || '',
    observacao: obterCampo(item, 'observacao') || '',
    metodoPagamentoPadrao: 'PIX',
    usarValorPersonalizado: true,
  }
  limparSugestao()
  mostrarFormulario.value = true
  erro.value = ''
  sucesso.value = ''
}

async function carregarSugestaoEmpresa() {
  if (editandoId.value) return

  const empresaId = formulario.value.empresaId
  limparSugestao()

  if (!empresaId) return

  try {
    carregandoSugestao.value = true
    erroSugestao.value = ''
    sugestaoConsultada.value = true
    const resposta = await buscarSugestaoFaturaRecorrente(empresaId)
    const sugestao = normalizarObjeto(resposta)
    sugestaoRecorrencia.value = sugestao

    if (!temAssinaturaAtiva.value) {
      erroSugestao.value = 'Esta empresa não possui assinatura ativa. Cadastre uma assinatura antes de criar recorrência.'
      return
    }

    aplicarSugestaoRecorrencia(sugestao)
  } catch (error) {
    erroSugestao.value = obterMensagemErro(error, 'Não foi possível buscar a sugestão da recorrência para esta empresa.')
    console.error(error)
  } finally {
    carregandoSugestao.value = false
  }
}

function aplicarSugestaoRecorrencia(sugestao) {
  const valor = obterCampo(sugestao, 'valorMensal', 'valorPlano', 'valor', 'mensalidade')
  const descricao = obterCampo(sugestao, 'descricaoSugerida', 'descricao', 'descricaoRecorrencia')
  const dia = obterCampo(sugestao, 'diaVencimentoSugerido', 'diaVencimento', 'vencimentoDia')

  formulario.value.valor = valor !== '' ? formatarValorFormulario(valor) : formulario.value.valor
  formulario.value.descricao = descricao || formulario.value.descricao
  formulario.value.diaVencimento = dia || formulario.value.diaVencimento
  formulario.value.usarValorPersonalizado = false
}

function limparSugestao() {
  sugestaoRecorrencia.value = null
  carregandoSugestao.value = false
  sugestaoConsultada.value = false
  erroSugestao.value = ''
}

async function salvar() {
  if (salvando.value) return

  const validacao = validarFormulario()
  if (validacao) {
    erro.value = validacao
    sucesso.value = ''
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    const payload = montarPayload()
    if (editandoId.value) {
      await atualizarFaturaRecorrente(editandoId.value, payload)
      sucesso.value = 'Recorrência atualizada com sucesso.'
    } else {
      await criarFaturaRecorrente(payload)
      sucesso.value =
        'Recorrência criada com sucesso. As faturas poderão ser geradas a partir da competência informada.'
    }
    fecharFormulario()
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar a recorrência.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function pedirAlternarAtivo(item) {
  const ativa = estaAtiva(item)
  confirmacao.value = {
    titulo: ativa ? 'Desativar recorrência' : 'Ativar recorrência',
    mensagem: ativa
      ? 'Esta recorrência não será considerada nas próximas gerações automáticas.'
      : 'Esta recorrência voltará a ser considerada nas próximas gerações.',
    textoBotao: ativa ? 'Desativar' : 'Ativar',
    tipo: ativa ? 'perigo' : 'sucesso-botao',
    executar: () => alternarAtivo(item),
  }
}

async function alternarAtivo(item) {
  if (processandoId.value) return

  try {
    processandoId.value = item.id
    erro.value = ''
    sucesso.value = ''
    if (estaAtiva(item)) {
      await desativarFaturaRecorrente(item.id)
      sucesso.value =
        'Recorrência desativada com sucesso. Ela não será considerada nas próximas gerações automáticas.'
    } else {
      await ativarFaturaRecorrente(item.id)
      sucesso.value =
        'Recorrência ativada com sucesso. Ela voltará a ser considerada nas próximas gerações.'
    }
    confirmacao.value = null
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível alterar a recorrência.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function gerarProxima(item) {
  if (processandoProximaId.value === item.id) return
  if (!estaAtiva(item)) {
    erro.value = 'Ative a recorrência para gerar novas faturas.'
    sucesso.value = ''
    return
  }

  try {
    processandoProximaId.value = item.id
    erro.value = ''
    sucesso.value = ''
    const resposta = await gerarProximaFaturaRecorrente(item.id)
    sucesso.value = obterMensagemGerarProxima(resposta)
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível gerar a próxima fatura. Verifique os detalhes.')
    console.error(error)
  } finally {
    processandoProximaId.value = null
  }
}

function abrirGeracaoMes() {
  mostrarGeracaoMes.value = true
  competenciaGeracao.value ||= new Date().toISOString().slice(0, 7)
  erro.value = ''
  sucesso.value = ''
}

function cancelarGeracaoMes() {
  mostrarGeracaoMes.value = false
  erro.value = ''
}

async function gerarMes() {
  if (processandoMes.value) return

  const competencia = String(competenciaGeracao.value || '').trim()
  const validacao = validarCompetencia(competencia)
  if (validacao) {
    erro.value = validacao
    sucesso.value = ''
    return
  }

  try {
    processandoMes.value = true
    erro.value = ''
    sucesso.value = ''
    resumoGeracao.value = null
    detalhesGeracao.value = []
    const resposta = await gerarFaturasRecorrentesDoMes({ competencia, metodoPagamento: 'PIX' })
    resumoGeracao.value = normalizarObjeto(resposta)
    detalhesGeracao.value = normalizarDetalhesGeracao(resumoGeracao.value)
    sucesso.value = obterMensagemSucessoGeracao(resumoGeracao.value, competencia)
    mostrarGeracaoMes.value = false
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível gerar as faturas recorrentes.')
    console.error(error)
  } finally {
    processandoMes.value = false
  }
}

function obterMensagemSucessoGeracao(resumo, competencia) {
  const criadas = obterNumeroCampo(resumo, 'criadas', 'faturasCriadas', 'totalCriadas', 'criadasCount')
  const ignoradas = obterNumeroCampo(resumo, 'ignoradas', 'faturasIgnoradas', 'totalIgnoradas', 'ignoradasCount')
  const erros = obterNumeroCampo(resumo, 'erros', 'faturasComErro', 'totalErros', 'falhas')
  const competenciaFormatada = formatarCompetencia(competencia)
  const ignoradasPorInatividade = detalhesGeracao.value.some((item) => motivoIndicaInatividade(item.motivo))

  if (erros > 0) {
    return 'Geração concluída com atenção. Algumas recorrências não puderam ser processadas. Verifique os detalhes.'
  }

  if (criadas === 1 && ignoradas === 0) {
    return `Geração concluída com sucesso. 1 fatura foi criada para a competência ${competenciaFormatada}.`
  }

  if (criadas > 1 && ignoradas === 0) {
    return `Geração concluída com sucesso. ${criadas} faturas foram criadas para a competência ${competenciaFormatada}.`
  }

  if (criadas > 0) {
    return `Geração concluída com sucesso. ${criadas} ${criadas === 1 ? 'fatura foi criada' : 'faturas foram criadas'} para a competência ${competenciaFormatada}.`
  }

  if (ignoradasPorInatividade && criadas === 0) {
    return 'Geração concluída. Recorrência ignorada porque está inativa.'
  }

  if (ignoradas > 0) {
    return 'Geração concluída. Nenhuma nova fatura foi criada porque as cobranças dessa competência já haviam sido processadas.'
  }

  return 'Geração concluída. Nenhuma fatura foi criada porque não foram encontradas recorrências ativas elegíveis para essa competência.'
}

function obterMensagemGerarProxima(resposta) {
  const dados = normalizarObjeto(resposta)
  const status = String(obterCampo(dados, 'status', 'resultado', 'situacao') || '').toUpperCase()
  const criada = obterCampo(dados, 'criada', 'faturaCriada', 'gerada', 'sucesso')
  const motivo = String(obterCampo(dados, 'motivo', 'mensagem', 'message') || '').toLowerCase()

  if (criada === true || ['CRIADA', 'GERADA', 'SUCESSO'].includes(status)) {
    return 'Próxima fatura gerada com sucesso.'
  }

  if (status.includes('IGNOR') || motivo.includes('já') || motivo.includes('ja') || motivo.includes('exist')) {
    return 'A fatura dessa competência já havia sido gerada.'
  }

  if (criada === false || status.includes('ERRO') || status.includes('FALHA') || status.includes('NAO')) {
    return 'Não foi possível gerar a próxima fatura. Verifique os detalhes.'
  }

  return 'Próxima fatura gerada com sucesso.'
}

function fecharFormulario() {
  mostrarFormulario.value = false
  editandoId.value = null
  formulario.value = criarFormulario()
}

function criarFormulario() {
  return {
    empresaId: '',
    descricao: 'Mensalidade Gestão SaaS',
    valor: '',
    diaVencimento: '10',
    competenciaInicio: new Date().toISOString().slice(0, 7),
    competenciaFim: '',
    observacao: '',
    metodoPagamentoPadrao: 'PIX',
    usarValorPersonalizado: false,
  }
}

function validarFormulario() {
  if (!formulario.value.empresaId) return 'Selecione a empresa.'
  if (!String(formulario.value.descricao || '').trim()) return 'Informe a descrição da recorrência.'

  const valor = converterValor(formulario.value.valor)
  if (!Number.isFinite(valor) || valor <= 0) return 'Informe um valor válido e maior que zero.'

  const dia = Number(formulario.value.diaVencimento)
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return 'Informe um dia de vencimento entre 1 e 31.'

  if (validarCompetencia(formulario.value.competenciaInicio)) {
    return 'Informe a competência de início no formato YYYY-MM. Exemplo: 2026-05.'
  }

  if (formulario.value.competenciaFim && validarCompetencia(formulario.value.competenciaFim)) {
    return 'Informe a competência fim no formato YYYY-MM. Exemplo: 2026-05.'
  }

  return ''
}

function validarCompetencia(valor) {
  const texto = String(valor || '').trim()
  const match = texto.match(/^(\d{4})-(\d{2})$/)

  if (!match) return 'Informe a competência no formato YYYY-MM. Exemplo: 2026-05.'

  const mes = Number(match[2])
  if (mes < 1 || mes > 12) return 'Informe a competência no formato YYYY-MM. Exemplo: 2026-05.'

  return ''
}

function montarPayload() {
  return limparVazios({
    ...formulario.value,
    empresaId: Number(formulario.value.empresaId),
    valor: converterValor(formulario.value.valor),
    diaVencimento: Number(formulario.value.diaVencimento),
    competenciaInicio: String(formulario.value.competenciaInicio || '').trim(),
    competenciaFim: String(formulario.value.competenciaFim || '').trim(),
    metodoPagamentoPadrao: 'PIX',
    usarValorPersonalizado: Boolean(formulario.value.usarValorPersonalizado),
  })
}

function estaAtiva(item) {
  const status = normalizarStatusRecorrencia(obterCampo(item, 'status', 'situacao'))
  if (status) return status === 'ATIVA'

  const ativo = obterCampo(item, 'ativo', 'ativa', 'isAtivo', 'isAtiva')
  if (ativo !== '') return ativo !== false && String(ativo).toLowerCase() !== 'false'

  return true
}

function normalizarStatusRecorrencia(status) {
  const valor = String(status || '').trim().toUpperCase()
  if (['ATIVA', 'ATIVAS', 'ATIVO', 'ATIVOS', 'ACTIVE'].includes(valor)) return 'ATIVA'
  if (['INATIVA', 'INATIVAS', 'INATIVO', 'INATIVOS', 'INACTIVE'].includes(valor)) return 'INATIVA'
  return ''
}

function nomeEmpresa(item) {
  return (
    obterCampo(item, 'empresaNome', 'nomeEmpresa', 'razaoSocialEmpresa') ||
    obterCampo(item.empresa, 'nome', 'razaoSocial') ||
    empresas.value.find((empresa) => String(empresa.id) === String(obterCampo(item, 'empresaId')))?.nome ||
    '-'
  )
}

function obterProximaCompetencia(base) {
  const valores = base
    .filter((item) => estaAtiva(item))
    .map((item) => obterCampo(item, 'proximaCompetencia', 'proximaCompetenciaGeracao'))
    .filter(Boolean)
    .sort()
  return valores[0] ? formatarCompetencia(valores[0]) : '-'
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  return dados.content || dados.data?.content || dados.data || dados.items || dados.itens || dados.resultado || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && !Array.isArray(dados.data) ? dados.data : dados
}

function normalizarDetalhesGeracao(resumo) {
  const detalhes = normalizarLista(
    obterCampo(resumo, 'detalhes', 'itens', 'items', 'resultados', 'recorrencias', 'processamentos'),
  )

  return detalhes.map((item) => ({
    empresa: nomeEmpresaDetalhe(item),
    descricao: obterCampo(item, 'descricao', 'recorrencia', 'recorrenciaDescricao') || '-',
    resultado: formatarResultadoGeracao(item),
    motivo: formatarMotivoGeracao(item),
  }))
}

function formatarResultadoGeracao(item) {
  const motivo = obterCampo(item, 'motivo', 'mensagem', 'message', 'erro')
  if (motivoIndicaInatividade(motivo)) return 'Ignorada'
  return obterCampo(item, 'resultado', 'status', 'situacao') || '-'
}

function formatarMotivoGeracao(item) {
  const motivo = obterCampo(item, 'motivo', 'mensagem', 'message', 'erro')
  if (motivoIndicaInatividade(motivo)) return 'Recorrência ignorada porque está inativa.'
  return motivo || '-'
}

function motivoIndicaInatividade(motivo) {
  return String(motivo || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .includes('inativ')
}

function nomeEmpresaDetalhe(item) {
  const empresaDireta = obterCampo(item, 'empresaNome', 'nomeEmpresa', 'razaoSocial', 'razaoSocialEmpresa')
  if (empresaDireta) return empresaDireta

  const empresa = obterCampo(item, 'empresa')
  if (empresa && typeof empresa === 'object') {
    return obterCampo(empresa, 'nome', 'razaoSocial', 'fantasia') || '-'
  }

  return nomeEmpresa(item)
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function obterNumeroCampo(objeto, ...campos) {
  const valor = obterCampo(objeto, ...campos)
  if (Array.isArray(valor)) return valor.length
  if (valor && typeof valor === 'object') {
    return obterNumeroCampo(valor, 'total', 'count', 'quantidade')
  }
  const n = Number(valor)
  if (Number.isFinite(n)) return n
  const match = String(valor || '').match(/\d+/)
  return match ? Number(match[0]) : 0
}

function valorBooleano(valor) {
  if (valor === true) return true
  if (valor === false) return false
  const texto = String(valor || '').trim().toLowerCase()
  if (['true', 'sim', 's', '1', 'ativa', 'ativo'].includes(texto)) return true
  if (['false', 'nao', 'não', 'n', '0', 'inativa', 'inativo'].includes(texto)) return false
  return Boolean(valor)
}

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function converterValor(valor) {
  const texto = String(valor ?? '').trim().replace(/\s/g, '')
  if (!texto) return NaN
  const ultimaVirgula = texto.lastIndexOf(',')
  const ultimoPonto = texto.lastIndexOf('.')
  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    const idx = Math.max(ultimaVirgula, ultimoPonto)
    return Number(`${texto.slice(0, idx).replace(/[.,]/g, '')}.${texto.slice(idx + 1).replace(/[.,]/g, '')}`)
  }
  return Number(texto.replace(/\./g, '').replace(',', '.'))
}

function formatarValorFormulario(valor) {
  const n = numero(valor)
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarMoeda(valor) {
  return numero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function normalizarCompetenciaEntrada(valor) {
  const match = String(valor || '').match(/^(\d{4})-(\d{2})/)
  return match ? `${match[1]}-${match[2]}` : ''
}

function formatarCompetencia(valor) {
  const match = String(valor || '').match(/^(\d{4})-(\d{2})/)
  return match ? `${match[2]}/${match[1]}` : valor || '-'
}

function obterMensagemErro(error, fallback) {
  if (error?.status === 403) return 'Você não tem permissão para executar esta ação.'
  if (error?.status === 500) return 'Não foi possível concluir a operação agora. Tente novamente em instantes.'
  if (error?.status === 400) {
    const mensagem = sanitizarMensagemErro(error?.message)
    return mensagem || 'Não foi possível processar a solicitação. Confira os dados informados.'
  }

  return sanitizarMensagemErro(error?.message) || fallback
}

function sanitizarMensagemErro(mensagem) {
  const texto = String(mensagem || '').trim()
  if (!texto) return ''
  if (/exception|stack trace|sql|constraint|hibernate|java\./i.test(texto)) return ''
  return texto
}

onMounted(carregarDados)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Faturas recorrentes</h1>
        <p class="descricao">Configure cobranças mensais automáticas para empresas ativas.</p>
      </div>
      <div class="acoes">
        <button class="botao secundario" :disabled="carregando || processandoMes" @click="carregarDados">
          {{ carregando ? 'Carregando...' : 'Atualizar' }}
        </button>
        <button class="botao sucesso-botao" :disabled="carregando || processandoMes" @click="abrirGeracaoMes">
          {{ processandoMes ? 'Gerando...' : 'Gerar faturas do mês' }}
        </button>
        <button class="botao principal" :disabled="carregando || salvando" @click="abrirNova">Nova recorrência</button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section v-if="confirmacao" class="card confirmacao">
      <div>
        <h2>{{ confirmacao.titulo }}</h2>
        <p>{{ confirmacao.mensagem }}</p>
      </div>
      <div class="acoes">
        <button class="botao secundario" :disabled="Boolean(processandoId)" @click="confirmacao = null">Cancelar</button>
        <button class="botao" :class="confirmacao.tipo" :disabled="Boolean(processandoId)" @click="confirmacao.executar">
          {{ processandoId ? 'Processando...' : confirmacao.textoBotao }}
        </button>
      </div>
    </section>

    <form v-if="mostrarGeracaoMes" class="card formulario-geracao" @submit.prevent="gerarMes">
      <div class="cabecalho-card">
        <div>
          <h2>Gerar faturas do mês</h2>
          <p>Informe a competência que deseja processar. Exemplo: 2026-05 para maio de 2026.</p>
        </div>
      </div>
      <label>
        Competência
        <input v-model="competenciaGeracao" type="text" placeholder="Ex: 2026-05" inputmode="numeric" />
      </label>
      <div class="acoes">
        <button type="button" class="botao secundario" :disabled="processandoMes" @click="cancelarGeracaoMes">
          Cancelar
        </button>
        <button class="botao sucesso-botao" :disabled="processandoMes">
          {{ processandoMes ? 'Gerando...' : 'Gerar faturas' }}
        </button>
      </div>
    </form>

    <section v-if="detalhesGeracao.length" class="card detalhes-geracao">
      <h2>Detalhes da última geração</h2>
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Descrição</th>
              <th>Resultado</th>
              <th>Motivo</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="(detalhe, index) in detalhesGeracao" :key="index">
              <td>{{ detalhe.empresa }}</td>
              <td>{{ detalhe.descricao }}</td>
              <td>{{ detalhe.resultado }}</td>
              <td>{{ detalhe.motivo }}</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <section v-if="resumoGeracao" class="card resumo-geracao">
      <h2>Resumo retornado pelo backend</h2>
      <div class="resumo-grid">
        <p><strong>Criadas:</strong> {{ obterNumeroCampo(resumoGeracao, 'criadas', 'faturasCriadas', 'totalCriadas', 'criadasCount') }}</p>
        <p><strong>Ignoradas:</strong> {{ obterNumeroCampo(resumoGeracao, 'ignoradas', 'faturasIgnoradas', 'totalIgnoradas', 'ignoradasCount') }}</p>
        <p><strong>Erros:</strong> {{ obterNumeroCampo(resumoGeracao, 'erros', 'faturasComErro', 'totalErros', 'falhas') }}</p>
      </div>
    </section>

    <section class="grade-resumo">
      <article v-for="card in cards" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card aviso-pix">
      Faturas recorrentes geradas automaticamente usam PIX por padrão. O método pode ser alterado depois em uma fatura específica, se necessário.
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>Empresa
          <select v-model="filtros.empresaId" :disabled="carregando">
            <option value="">Todas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}
            </option>
          </select>
        </label>
        <label>Status
          <select v-model="filtros.status" :disabled="carregando">
            <option value="">Todas</option>
            <option value="ATIVA">Ativas</option>
            <option value="INATIVA">Inativas</option>
          </select>
        </label>
        <label>Busca
          <input v-model="filtros.busca" type="text" placeholder="Empresa ou descrição" :disabled="carregando" />
        </label>
      </div>
      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="carregarDados">
          {{ carregando ? 'Carregando...' : 'Aplicar filtros' }}
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <form v-if="mostrarFormulario" class="card formulario" @submit.prevent="salvar">
      <div class="cabecalho-card">
        <div>
          <h2>{{ editandoId ? 'Editar recorrência' : 'Nova recorrência' }}</h2>
          <p>Faturas automáticas usam PIX por padrão.</p>
        </div>
        <button type="button" class="botao secundario" :disabled="salvando" @click="fecharFormulario">Fechar</button>
      </div>
      <div class="campos">
        <label>Empresa
          <select v-model="formulario.empresaId" :disabled="salvando || carregandoSugestao" @change="carregarSugestaoEmpresa">
            <option value="">Selecione</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}
            </option>
          </select>
        </label>
        <label v-if="sugestaoRecorrencia && temAssinaturaAtiva">Plano atual
          <input :value="obterCampo(sugestaoRecorrencia, 'planoNome', 'nomePlano', 'plano', 'assinaturaPlano') || '-'" disabled />
        </label>
        <label>Valor
          <input
            v-model="formulario.valor"
            type="text"
            inputmode="decimal"
            :disabled="salvando || carregandoSugestao || (!formulario.usarValorPersonalizado && !editandoId)"
          />
        </label>
        <label class="checkbox-label">
          <input v-model="formulario.usarValorPersonalizado" type="checkbox" :disabled="salvando || carregandoSugestao" />
          Usar valor personalizado
        </label>
        <label>Dia de vencimento <input v-model="formulario.diaVencimento" type="number" min="1" max="31" :disabled="salvando" /></label>
        <label>Competência início <input v-model="formulario.competenciaInicio" type="month" :disabled="salvando" /></label>
        <label>Competência fim opcional <input v-model="formulario.competenciaFim" type="month" :disabled="salvando" /></label>
        <label>Método padrão <input value="PIX - padrão para faturas automáticas" disabled /></label>
        <label class="campo-grande">Descrição <input v-model="formulario.descricao" type="text" :disabled="salvando" /></label>
        <label class="campo-grande">Observação <textarea v-model="formulario.observacao" rows="3" :disabled="salvando"></textarea></label>
      </div>
      <p v-if="carregandoSugestao" class="sugestao-feedback aviso-pix">Buscando assinatura ativa da empresa...</p>
      <p v-if="erroSugestao" class="sugestao-feedback erro">{{ erroSugestao }}</p>
      <div class="acoes">
        <button class="botao principal" :disabled="!podeSalvarRecorrencia">
          {{ salvando ? 'Salvando...' : editandoId ? 'Salvar edição' : 'Salvar recorrência' }}
        </button>
        <button type="button" class="botao secundario" :disabled="salvando" @click="fecharFormulario">Cancelar</button>
      </div>
    </form>

    <section v-if="carregando" class="card">Carregando recorrências...</section>
    <section v-else-if="!recorrenciasFiltradas.length" class="card">{{ mensagemListaVazia }}</section>
    <section v-else class="card tabela-card">
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Descrição</th>
              <th>Valor</th>
              <th>Dia vencimento</th>
              <th>Competência início</th>
              <th>Competência fim</th>
              <th>Método padrão</th>
              <th>Última gerada</th>
              <th>Próxima</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recorrenciasFiltradas" :key="item.id">
              <td>{{ nomeEmpresa(item) }}</td>
              <td>{{ obterCampo(item, 'descricao') || '-' }}</td>
              <td>{{ formatarMoeda(obterCampo(item, 'valor')) }}</td>
              <td>{{ obterCampo(item, 'diaVencimento') || '-' }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'competenciaInicio')) }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'competenciaFim')) }}</td>
              <td>PIX</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'ultimaCompetenciaGerada')) }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'proximaCompetencia')) }}</td>
              <td><span :class="['status', estaAtiva(item) ? 'ativa' : 'inativa']">{{ estaAtiva(item) ? 'Ativa' : 'Inativa' }}</span></td>
              <td>
                <div class="acoes-tabela">
                  <button
                    class="botao compacto secundario"
                    :disabled="Boolean(processandoId) || processandoProximaId === item.id"
                    @click="editar(item)"
                  >
                    Editar
                  </button>
                  <button
                    class="botao compacto"
                    :class="estaAtiva(item) ? 'perigo' : 'sucesso-botao'"
                    :disabled="Boolean(processandoId) || processandoProximaId === item.id"
                    @click="pedirAlternarAtivo(item)"
                  >
                    {{ processandoId === item.id ? 'Processando...' : estaAtiva(item) ? 'Desativar' : 'Ativar' }}
                  </button>
                  <button
                    class="botao compacto sucesso-botao"
                    :disabled="Boolean(processandoId) || processandoProximaId === item.id || !estaAtiva(item)"
                    :title="!estaAtiva(item) ? 'Ative a recorrência para gerar novas faturas.' : ''"
                    @click="gerarProxima(item)"
                  >
                    {{ processandoProximaId === item.id ? 'Gerando...' : 'Gerar próxima' }}
                  </button>
                  <small v-if="!estaAtiva(item)" class="dica-acao">Ative a recorrência para gerar novas faturas.</small>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.filtros,
.formulario,
.formulario-geracao,
.detalhes-geracao,
.resumo-geracao,
.confirmacao {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-card,
.acoes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
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
}

h2 {
  font-size: 20px;
}

.descricao,
.cabecalho-card p,
.confirmacao p {
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, .06);
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(5, minmax(150px, 1fr));
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
  font-size: 22px;
}

.aviso-pix,
.formulario-geracao {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.aviso-pix {
  color: #1d4ed8;
  font-weight: 800;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}

.resumo-grid {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
}

.checkbox-label {
  align-content: end;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

.checkbox-label input {
  width: auto;
}

.dica-acao {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.25;
}

.sugestao-feedback {
  margin: 0;
  border-radius: 8px;
  padding: 12px 14px;
}

.sugestao-feedback.erro {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

label {
  display: grid;
  gap: 7px;
  font-weight: 800;
  color: #334155;
}

.campo-grande {
  grid-column: 1 / -1;
}

input,
select,
textarea {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
}

input:disabled,
select:disabled,
textarea:disabled,
button:disabled {
  opacity: .7;
  cursor: not-allowed;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
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

.tabela-card {
  padding: 0;
  overflow: hidden;
}

.tabela-container {
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
  text-align: left;
  color: #374151;
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
  text-transform: uppercase;
}

.status {
  display: inline-flex;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.ativa {
  background: #dcfce7;
  color: #15803d;
}

.status.inativa {
  background: #e5e7eb;
  color: #4b5563;
}

.acoes-tabela {
  display: flex;
  flex-direction: column;
  gap: 6px;
  align-items: flex-start;
  min-width: 130px;
}

@media(max-width: 1100px) {
  .tabela-container {
    overflow-x: auto;
  }

  table {
    min-width: 1180px;
  }

  .grade-resumo,
  .campos {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media(max-width: 760px) {
  .cabecalho-pagina,
  .cabecalho-card,
  .acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .grade-resumo,
  .campos {
    grid-template-columns: 1fr;
  }
}

th:last-child,
td:last-child {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 140px;
  min-width: 140px;
  background: white;
  box-shadow: -8px 0 14px rgba(15, 23, 42, .06);
}

th:last-child {
  z-index: 3;
  background: #f8fafc;
}
</style>
