<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ativarProdutoEstoque,
  buscarEmpresas,
  buscarMovimentacoesProdutoEstoque,
  buscarProdutoEstoque,
  buscarProdutosBaixoEstoque,
  buscarProdutosEstoque,
  buscarResumoEstoque,
  carregarUsuarioSessao,
  criarMovimentacaoEstoque,
  criarProdutoEstoque,
  desativarProdutoEstoque,
  mensagemIndicaBloqueioPlanoEstoque,
  obterMensagemAmigavelErro,
  atualizarProdutoEstoque,
} from '@/services/api'
import { ehSuperAdmin } from '@/utils/permissoes'

const usuario = ref(carregarUsuarioSessao())
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const empresas = ref([])
const produtos = ref([])
const movimentacoes = ref([])
const resumo = ref(criarResumoPadrao())
const carregando = ref(true)
const carregandoProdutos = ref(false)
const carregandoMovimentacoes = ref(false)
const salvandoProduto = ref(false)
const salvandoMovimentacao = ref(false)
const carregandoDetalheProduto = ref(false)
const erro = ref('')
const erroProdutos = ref('')
const erroBaixoEstoque = ref('')
const erroMovimentacoes = ref('')
const sucesso = ref('')
const bloqueioPlano = ref(false)
const produtoEditandoId = ref(null)
const movimentacaoProduto = ref(null)
const formularioProduto = ref(criarProdutoInicial())
const formularioMovimentacao = ref(criarMovimentacaoInicial())
const filtros = ref(criarFiltrosIniciais())
const filtrosHistorico = ref(criarFiltrosHistoricoIniciais())
const saldoPrevistoMovimentacao = computed(() => calcularSaldoPrevistoMovimentacao())

const categoriasDisponiveis = computed(() => {
  const categorias = produtos.value
    .map((item) => obterCategoriaProduto(item))
    .filter(Boolean)

  return [...new Set(categorias)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
})

const produtosVisiveis = computed(() => {
  const termo = normalizarTexto(filtros.value.busca)

  return produtos.value.filter((item) => {
    const statusAtende =
      !filtros.value.status ||
      (filtros.value.status === 'ATIVO' && produtoAtivo(item)) ||
      (filtros.value.status === 'INATIVO' && !produtoAtivo(item))
    const categoriaAtende = !filtros.value.categoria || obterCategoriaProduto(item) === filtros.value.categoria
    const baixoEstoqueAtende = !filtros.value.somenteBaixoEstoque || produtoBaixoEstoque(item)
    const buscaAtende =
      !termo ||
      [
        obterNomeProduto(item),
        obterCategoriaProduto(item),
        obterCodigoProduto(item),
        obterDescricaoProduto(item),
      ].some((campo) => normalizarTexto(campo).includes(termo))

    return statusAtende && categoriaAtende && baixoEstoqueAtende && buscaAtende
  })
})

const cardsResumo = computed(() => [
  {
    rotulo: 'Total de produtos',
    valor: formatarNumero(obterNumeroResumo('totalProdutos', 'produtosTotal', 'total')),
    destaque: 'Itens cadastrados para acompanhamento.',
  },
  {
    rotulo: 'Produtos ativos',
    valor: formatarNumero(obterNumeroResumo('produtosAtivos', 'ativos')),
    destaque: 'Produtos disponiveis para uso e venda.',
  },
  {
    rotulo: 'Baixo estoque',
    valor: formatarNumero(obterNumeroResumo('baixoEstoque', 'produtosBaixoEstoque')),
    destaque: 'Produtos que pedem atencao agora.',
  },
  {
    rotulo: 'Valor estimado de venda',
    valor: formatarMoeda(obterNumeroResumo('valorEstimadoVenda', 'valorVendaEstimado', 'totalEstimadoVenda')),
    destaque: 'Potencial estimado com o saldo atual.',
  },
])

async function carregarTela() {
  try {
    carregando.value = true
    erro.value = ''
    erroProdutos.value = ''
    erroBaixoEstoque.value = ''
    erroMovimentacoes.value = ''
    sucesso.value = ''
    bloqueioPlano.value = false

    const promessas = [
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosApi()), 'Nao foi possivel carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosApi()), 'Nao foi possivel carregar os produtos do estoque.'),
      consultarEstoque(() => buscarMovimentacoesProdutoEstoque(montarFiltrosHistoricoApi()), 'Nao foi possivel carregar o historico de movimentacoes.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosApi()), 'Nao foi possivel carregar os alertas de baixo estoque.'),
    ]

    if (superAdmin.value) {
      promessas.push(buscarEmpresas().catch(() => []))
    }

    const [resumoResultado, produtosResultado, movimentacoesResultado, baixoEstoqueResultado, empresasApi] = await Promise.all(promessas)

    const resumoApi = dadosConsulta(resumoResultado)
    const produtosApi = dadosConsulta(produtosResultado)
    const movimentacoesApi = dadosConsulta(movimentacoesResultado)
    const baixoEstoqueApi = dadosConsulta(baixoEstoqueResultado)

    if (resumoResultado.sucesso || produtosResultado.sucesso || baixoEstoqueResultado.sucesso) {
      resumo.value = normalizarResumo(resumoApi, baixoEstoqueApi, produtosApi)
    }

    if (produtosResultado.sucesso) {
      produtos.value = normalizarLista(produtosApi)
    }

    if (movimentacoesResultado.sucesso) {
      movimentacoes.value = normalizarLista(movimentacoesApi)
    }
    erroProdutos.value = mensagemConsulta(produtosResultado)
    erroBaixoEstoque.value = mensagemConsulta(baixoEstoqueResultado)
    erroMovimentacoes.value = mensagemConsulta(movimentacoesResultado)

    if (mensagemConsulta(resumoResultado) && !produtosResultado.sucesso && !movimentacoesResultado.sucesso) {
      erro.value = mensagemConsulta(resumoResultado)
    }

    if (superAdmin.value) {
      empresas.value = normalizarLista(empresasApi)
    }
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel carregar o estoque agora.')
  } finally {
    carregando.value = false
  }
}

async function carregarProdutos() {
  try {
    carregandoProdutos.value = true
    erro.value = ''
    erroProdutos.value = ''
    erroBaixoEstoque.value = ''
    const [resumoResultado, produtosResultado, baixoEstoqueResultado] = await Promise.all([
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosApi()), 'Nao foi possivel carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosApi()), 'Nao foi possivel atualizar os produtos.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosApi()), 'Nao foi possivel carregar os alertas de baixo estoque.'),
    ])

    if (resumoResultado.sucesso || produtosResultado.sucesso || baixoEstoqueResultado.sucesso) {
      resumo.value = normalizarResumo(dadosConsulta(resumoResultado), dadosConsulta(baixoEstoqueResultado), dadosConsulta(produtosResultado))
    }

    if (produtosResultado.sucesso) {
      produtos.value = normalizarLista(dadosConsulta(produtosResultado))
    }
    erroProdutos.value = mensagemConsulta(produtosResultado)
    erroBaixoEstoque.value = mensagemConsulta(baixoEstoqueResultado)

    if (mensagemConsulta(resumoResultado) && !erroProdutos.value && !erroBaixoEstoque.value) {
      erroProdutos.value = mensagemConsulta(resumoResultado)
    }
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel atualizar os produtos.')
  } finally {
    carregandoProdutos.value = false
  }
}

async function carregarHistorico() {
  try {
    carregandoMovimentacoes.value = true
    erro.value = ''
    erroMovimentacoes.value = ''
    const resultado = await consultarEstoque(
      () => buscarMovimentacoesProdutoEstoque(montarFiltrosHistoricoApi()),
      'Nao foi possivel atualizar o historico.',
    )
    if (resultado.sucesso) {
      movimentacoes.value = normalizarLista(dadosConsulta(resultado))
    }
    erroMovimentacoes.value = mensagemConsulta(resultado)
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel atualizar o historico.')
  } finally {
    carregandoMovimentacoes.value = false
  }
}

function montarFiltrosApi() {
  return limparFiltros({
    status: filtros.value.status,
    busca: filtros.value.busca,
    categoria: filtros.value.categoria,
    baixoEstoque: filtros.value.somenteBaixoEstoque ? true : '',
    empresaId: superAdmin.value ? filtros.value.empresaId : '',
  })
}

function montarFiltrosHistoricoApi() {
  return limparFiltros({
    produtoId: filtrosHistorico.value.produtoId,
    tipo: filtrosHistorico.value.tipo,
    dataInicial: filtrosHistorico.value.dataInicial,
    dataFinal: filtrosHistorico.value.dataFinal,
    empresaId: superAdmin.value ? filtros.value.empresaId : '',
  })
}

function limparFiltros(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== ''),
  )
}

function criarResumoPadrao() {
  return {
    totalProdutos: 0,
    produtosAtivos: 0,
    baixoEstoque: 0,
    valorEstimadoVenda: 0,
  }
}

function criarProdutoInicial() {
  return {
    nome: '',
    descricao: '',
    codigoSku: '',
    categoria: '',
    unidade: 'UN',
    precoCusto: '',
    precoVenda: '',
    quantidadeAtual: '',
    estoqueMinimo: '',
    ativo: true,
  }
}

function criarMovimentacaoInicial() {
  return {
    tipo: 'ENTRADA',
    quantidade: '',
    observacao: '',
  }
}

function criarFiltrosIniciais() {
  return {
    status: '',
    busca: '',
    categoria: '',
    somenteBaixoEstoque: false,
    empresaId: '',
  }
}

function criarFiltrosHistoricoIniciais() {
  return {
    produtoId: '',
    tipo: '',
    dataInicial: '',
    dataFinal: '',
  }
}

function obterMensagemErroEstoque(errorAtual, fallback) {
  if (errorAtual?.status === 403 || mensagemIndicaBloqueioPlanoEstoque(errorAtual?.message)) {
    bloqueioPlano.value = true
    return 'O módulo de estoque não está disponível no plano atual.'
  }

  if (errorAtual?.status === 404) {
    return `Endpoint de estoque nao encontrado${errorAtual.endpoint ? ` (${errorAtual.endpoint})` : ''}. Verifique a publicacao da API em homologacao.`
  }

  if (errorAtual?.status >= 500) {
    return `Servico de estoque indisponivel no momento${errorAtual.endpoint ? ` (${errorAtual.endpoint})` : ''}. Tente novamente ou acione o suporte.`
  }

  return obterMensagemAmigavelErro(errorAtual, fallback)
}

async function consultarEstoque(callback, fallback) {
  try {
    return {
      sucesso: true,
      dados: await callback(),
      mensagem: '',
    }
  } catch (errorAtual) {
    return {
      sucesso: false,
      dados: [],
      mensagem: obterMensagemErroEstoque(errorAtual, fallback),
    }
  }
}

function dadosConsulta(resultado) {
  return resultado?.sucesso ? resultado.dados : []
}

function mensagemConsulta(resultado) {
  return resultado?.sucesso ? '' : resultado?.mensagem || ''
}

function normalizarResumo(resumoApi, baixoEstoqueApi, produtosApi) {
  const origem = normalizarObjeto(resumoApi)
  const listaProdutos = normalizarLista(produtosApi)
  const listaBaixoEstoque = normalizarLista(baixoEstoqueApi)

  return {
    ...criarResumoPadrao(),
    ...origem,
    totalProdutos:
      obterNumeroCampo(origem, 'totalProdutos', 'produtosTotal', 'total') || listaProdutos.length,
    produtosAtivos:
      obterNumeroCampo(origem, 'produtosAtivos', 'ativos') || listaProdutos.filter((item) => produtoAtivo(item)).length,
    baixoEstoque:
      obterNumeroCampo(origem, 'baixoEstoque', 'produtosBaixoEstoque') ||
      listaBaixoEstoque.length ||
      listaProdutos.filter((item) => produtoBaixoEstoque(item)).length,
    valorEstimadoVenda:
      obterNumeroCampo(origem, 'valorEstimadoVenda', 'valorVendaEstimado', 'totalEstimadoVenda') ||
      listaProdutos.reduce(
        (total, item) => total + obterQuantidadeAtual(item) * obterPrecoVenda(item),
        0,
      ),
  }
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []

  return (
    valor.content ||
    valor.items ||
    valor.itens ||
    valor.data?.content ||
    valor.data?.items ||
    valor.data?.itens ||
    valor.data ||
    valor.resultado ||
    valor.produtos ||
    valor.movimentacoes ||
    []
  )
}

function normalizarObjeto(valor) {
  if (!valor || typeof valor !== 'object') return {}
  if (valor.data && !Array.isArray(valor.data)) return valor.data
  return valor
}

function obterNumeroCampo(objeto, ...campos) {
  for (const campo of campos) {
    const valor = objeto?.[campo]
    const numero = Number(valor)

    if (Number.isFinite(numero)) {
      return numero
    }
  }

  return 0
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

function obterNomeProduto(item) {
  return obterCampo(item, 'nome', 'produtoNome', 'titulo') || 'Produto sem nome'
}

function obterDescricaoProduto(item) {
  return obterCampo(item, 'descricao', 'detalhes', 'observacao')
}

function obterCodigoProduto(item) {
  return obterCampo(item, 'codigoSku', 'sku', 'codigo') || '-'
}

function obterCategoriaProduto(item) {
  return obterCampo(item, 'categoria', 'categoriaNome') || 'Sem categoria'
}

function obterUnidadeProduto(item) {
  return obterCampo(item, 'unidade', 'unidadeMedida') || 'UN'
}

function obterQuantidadeAtual(item) {
  return Number(obterCampo(item, 'quantidadeAtual', 'saldoAtual', 'quantidade', 'estoqueAtual') || 0)
}

function obterEstoqueMinimo(item) {
  return Number(obterCampo(item, 'estoqueMinimo', 'quantidadeMinima', 'minimo') || 0)
}

function obterPrecoCusto(item) {
  return Number(obterCampo(item, 'precoCusto', 'valorCusto', 'custo') || 0)
}

function obterPrecoVenda(item) {
  return Number(obterCampo(item, 'precoVenda', 'valorVenda', 'preco') || 0)
}

function produtoAtivo(item) {
  return obterCampo(item, 'ativo', 'status') === false ? false : String(obterCampo(item, 'status')).toUpperCase() !== 'INATIVO'
}

function produtoBaixoEstoque(item) {
  return obterQuantidadeAtual(item) <= obterEstoqueMinimo(item)
}

function obterNumeroResumo(...campos) {
  return obterNumeroCampo(resumo.value, ...campos)
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR')
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarDataHora(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return '-'

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function validarNumeroNaoNegativo(valor, mensagem) {
  const numero = Number(valor)

  if (!Number.isFinite(numero) || numero < 0) {
    erro.value = mensagem
    return false
  }

  return true
}

async function salvarProduto() {
  try {
    erro.value = ''
    sucesso.value = ''

    if (!formularioProduto.value.nome.trim()) {
      erro.value = 'Informe o nome do produto.'
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.quantidadeAtual || 0, 'Informe uma quantidade atual valida.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.estoqueMinimo || 0, 'Informe uma quantidade minima valida.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.precoCusto || 0, 'Informe um preco de custo valido.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.precoVenda || 0, 'Informe um preco de venda valido.')) {
      return
    }

    salvandoProduto.value = true
    const payload = montarPayloadProduto()

    if (produtoEditandoId.value) {
      await atualizarProdutoEstoque(produtoEditandoId.value, payload)
      sucesso.value = 'Produto atualizado com sucesso.'
    } else {
      await criarProdutoEstoque(payload)
      sucesso.value = 'Produto cadastrado com sucesso.'
    }

    cancelarEdicaoProduto(false)
    await Promise.all([carregarProdutos(), carregarHistorico()])
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel salvar o produto.')
  } finally {
    salvandoProduto.value = false
  }
}

function montarPayloadProduto() {
  const payload = {
    nome: formularioProduto.value.nome.trim(),
    descricao: formularioProduto.value.descricao.trim(),
    codigoSku: formularioProduto.value.codigoSku.trim(),
    sku: formularioProduto.value.codigoSku.trim(),
    categoria: formularioProduto.value.categoria.trim(),
    unidade: formularioProduto.value.unidade.trim() || 'UN',
    precoCusto: numeroOuZero(formularioProduto.value.precoCusto),
    precoVenda: numeroOuZero(formularioProduto.value.precoVenda),
    quantidadeAtual: numeroOuZero(formularioProduto.value.quantidadeAtual),
    quantidadeInicial: numeroOuZero(formularioProduto.value.quantidadeAtual),
    estoqueMinimo: numeroOuZero(formularioProduto.value.estoqueMinimo),
    ativo: formularioProduto.value.ativo !== false,
  }

  if (superAdmin.value && filtros.value.empresaId) {
    payload.empresaId = Number(filtros.value.empresaId)
  }

  return payload
}

function numeroOuZero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

async function editarProduto(item) {
  try {
    erro.value = ''
    sucesso.value = ''
    carregandoDetalheProduto.value = true
    produtoEditandoId.value = item.id

    let produtoDetalhado = item

    try {
      produtoDetalhado = await buscarProdutoEstoque(item.id)
    } catch {
      produtoDetalhado = item
    }

    formularioProduto.value = {
      nome: obterNomeProduto(produtoDetalhado),
      descricao: obterDescricaoProduto(produtoDetalhado),
      codigoSku: obterCodigoProduto(produtoDetalhado) === '-' ? '' : obterCodigoProduto(produtoDetalhado),
      categoria: obterCategoriaProduto(produtoDetalhado) === 'Sem categoria' ? '' : obterCategoriaProduto(produtoDetalhado),
      unidade: obterUnidadeProduto(produtoDetalhado),
      precoCusto: obterPrecoCusto(produtoDetalhado),
      precoVenda: obterPrecoVenda(produtoDetalhado),
      quantidadeAtual: obterQuantidadeAtual(produtoDetalhado),
      estoqueMinimo: obterEstoqueMinimo(produtoDetalhado),
      ativo: produtoAtivo(produtoDetalhado),
    }
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel carregar os dados do produto.')
  } finally {
    carregandoDetalheProduto.value = false
  }
}

function cancelarEdicaoProduto(limparMensagens = true) {
  produtoEditandoId.value = null
  formularioProduto.value = criarProdutoInicial()

  if (limparMensagens) {
    sucesso.value = ''
  }
}

async function alternarProduto(item) {
  try {
    erro.value = ''
    sucesso.value = ''

    if (produtoAtivo(item)) {
      await desativarProdutoEstoque(item.id)
      sucesso.value = 'Produto desativado com sucesso.'
    } else {
      await ativarProdutoEstoque(item.id)
      sucesso.value = 'Produto ativado com sucesso.'
    }

    await carregarProdutos()
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel atualizar o status do produto.')
  }
}

function abrirMovimentacao(item, tipo = 'ENTRADA') {
  movimentacaoProduto.value = item
  formularioMovimentacao.value = {
    ...criarMovimentacaoInicial(),
    tipo,
  }
  erro.value = ''
  sucesso.value = ''
}

function fecharMovimentacao() {
  movimentacaoProduto.value = null
  formularioMovimentacao.value = criarMovimentacaoInicial()
}

function calcularSaldoPrevistoMovimentacao() {
  if (!movimentacaoProduto.value) {
    return null
  }

  const saldoAtual = obterQuantidadeAtual(movimentacaoProduto.value)
  const quantidade = Number(formularioMovimentacao.value.quantidade || 0)

  if (!Number.isFinite(quantidade)) {
    return saldoAtual
  }

  if (formularioMovimentacao.value.tipo === 'SAIDA') {
    return saldoAtual - quantidade
  }

  if (formularioMovimentacao.value.tipo === 'AJUSTE') {
    return quantidade
  }

  return saldoAtual + quantidade
}

async function salvarMovimentacao() {
  try {
    erro.value = ''
    sucesso.value = ''

    if (!movimentacaoProduto.value?.id) {
      erro.value = 'Selecione um produto para movimentar.'
      return
    }

    if (!formularioMovimentacao.value.quantidade || Number(formularioMovimentacao.value.quantidade) <= 0) {
      erro.value = 'Informe uma quantidade válida maior que zero.'
      return
    }

    if (saldoPrevistoMovimentacao.value !== null && saldoPrevistoMovimentacao.value < 0) {
      erro.value = 'Essa saída deixaria o produto com quantidade negativa. Ajuste o valor informado.'
      return
    }

    salvandoMovimentacao.value = true
    const payload = {
      produtoId: movimentacaoProduto.value.id,
      tipo: formularioMovimentacao.value.tipo,
      quantidade: Number(formularioMovimentacao.value.quantidade),
      observacao: formularioMovimentacao.value.observacao.trim(),
    }

    if (superAdmin.value && filtros.value.empresaId) {
      payload.empresaId = Number(filtros.value.empresaId)
    }

    await criarMovimentacaoEstoque(payload)

    sucesso.value = 'Movimentacao registrada com sucesso.'
    fecharMovimentacao()
    await Promise.all([carregarProdutos(), carregarHistorico()])
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel registrar a movimentacao.')
  } finally {
    salvandoMovimentacao.value = false
  }
}

function nomeEmpresaPorId(id) {
  return empresas.value.find((empresa) => String(empresa.id) === String(id))?.nome || 'Empresa'
}

function tipoMovimentacao(item) {
  return String(obterCampo(item, 'tipo', 'tipoMovimentacao') || '-').toUpperCase()
}

function produtoMovimentacao(item) {
  return obterCampo(item, 'produtoNome', 'nomeProduto', 'produto', 'titulo') || 'Produto'
}

function quantidadeMovimentacao(item) {
  return formatarNumero(obterCampo(item, 'quantidade', 'quantidadeMovimentada', 'valor'))
}

function saldoAnteriorMovimentacao(item) {
  return formatarNumero(obterCampo(item, 'quantidadeAnterior', 'saldoAnterior', 'antes'))
}

function saldoNovoMovimentacao(item) {
  return formatarNumero(obterCampo(item, 'quantidadeNova', 'saldoNovo', 'depois'))
}

function usuarioMovimentacao(item) {
  return obterCampo(item, 'usuarioNome', 'usuario', 'responsavelNome') || '-'
}

onMounted(() => {
  carregarTela()
})
</script>

<template>
  <main class="pagina estoque-view">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Operacao</p>
        <h1>Estoque</h1>
        <p class="descricao">Controle produtos, quantidades e alertas de baixo estoque.</p>
      </div>

      <button class="botao secundario" :disabled="carregando" @click="carregarTela">
        {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
      </button>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <section v-if="bloqueioPlano" class="card aviso-plano">
      <h2>Recurso disponivel em planos superiores</h2>
      <p>O módulo de estoque não está disponível no plano atual.</p>
    </section>

    <section v-if="carregando" class="card estado">
      <p>Carregando estoque...</p>
    </section>

    <template v-else>
      <section class="cards-resumo">
        <article v-for="card in cardsResumo" :key="card.rotulo" class="card resumo-card">
          <span>{{ card.rotulo }}</span>
          <strong>{{ card.valor }}</strong>
          <p>{{ card.destaque }}</p>
        </article>
      </section>

      <section class="layout-principal">
        <form class="card formulario-produto" @submit.prevent="salvarProduto">
          <div class="titulo-card">
            <h2>{{ produtoEditandoId ? 'Editar produto' : 'Novo produto' }}</h2>
            <p>
              {{ produtoEditandoId ? 'Atualize as informacoes do produto selecionado.' : 'Cadastre produtos para acompanhar quantidades e alertas.' }}
            </p>
          </div>

          <div v-if="carregandoDetalheProduto" class="estado-inline">Carregando dados do produto...</div>

          <div class="campos">
            <label>
              Nome *
              <input v-model="formularioProduto.nome" type="text" placeholder="Ex: Shampoo neutro" />
            </label>
            <label>
              Codigo/SKU
              <input v-model="formularioProduto.codigoSku" type="text" placeholder="Ex: SH-001" />
            </label>
            <label class="campo-grande">
              Descricao
              <textarea v-model="formularioProduto.descricao" rows="3" placeholder="Informacoes importantes para identificar o produto."></textarea>
            </label>
            <label>
              Categoria
              <input v-model="formularioProduto.categoria" type="text" placeholder="Ex: Higiene" />
            </label>
            <label>
              Unidade
              <input v-model="formularioProduto.unidade" type="text" maxlength="10" placeholder="Ex: UN, KG, CX" />
            </label>
            <label>
              Preco de custo
              <input v-model="formularioProduto.precoCusto" type="number" min="0" step="0.01" />
            </label>
            <label>
              Preco de venda
              <input v-model="formularioProduto.precoVenda" type="number" min="0" step="0.01" />
            </label>
            <label>
              Quantidade atual
              <input v-model="formularioProduto.quantidadeAtual" type="number" min="0" step="0.01" />
            </label>
            <label>
              Estoque minimo
              <input v-model="formularioProduto.estoqueMinimo" type="number" min="0" step="0.01" />
            </label>
            <label class="campo-checkbox destaque-checkbox">
              <input v-model="formularioProduto.ativo" type="checkbox" />
              Produto ativo
            </label>
          </div>

          <div class="acoes">
            <button class="botao principal" :disabled="salvandoProduto">
              {{ salvandoProduto ? 'Salvando...' : produtoEditandoId ? 'Salvar alteracoes' : 'Cadastrar produto' }}
            </button>
            <button v-if="produtoEditandoId" type="button" class="botao secundario" @click="cancelarEdicaoProduto">
              Cancelar edicao
            </button>
          </div>
        </form>

        <section class="filtros-coluna">
          <form class="card filtros" @submit.prevent="carregarProdutos">
            <div class="titulo-card">
              <h2>Filtros</h2>
              <p>Encontre produtos com mais rapidez.</p>
            </div>

            <div class="campos filtros-campos">
              <label>
                Status
                <select v-model="filtros.status">
                  <option value="">Todos</option>
                  <option value="ATIVO">Ativos</option>
                  <option value="INATIVO">Inativos</option>
                </select>
              </label>
              <label>
                Busca
                <input v-model="filtros.busca" type="search" placeholder="Nome, categoria ou codigo" />
              </label>
              <label>
                Categoria
                <select v-model="filtros.categoria">
                  <option value="">Todas</option>
                  <option v-for="categoria in categoriasDisponiveis" :key="categoria" :value="categoria">{{ categoria }}</option>
                </select>
              </label>
              <label v-if="superAdmin">
                Empresa
                <select v-model="filtros.empresaId">
                  <option value="">Todas</option>
                  <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">{{ empresa.nome }}</option>
                </select>
              </label>
              <label class="campo-checkbox destaque-checkbox campo-grande">
                <input v-model="filtros.somenteBaixoEstoque" type="checkbox" />
                Mostrar somente produtos com baixo estoque
              </label>
            </div>

            <div class="acoes">
              <button class="botao principal" :disabled="carregandoProdutos">{{ carregandoProdutos ? 'Filtrando...' : 'Aplicar filtros' }}</button>
              <button
                type="button"
                class="botao secundario"
                @click="filtros = criarFiltrosIniciais(); carregarProdutos()"
              >
                Limpar filtros
              </button>
            </div>

            <p v-if="superAdmin && filtros.empresaId" class="ajuda-inline">
              Visualizando dados da empresa {{ nomeEmpresaPorId(filtros.empresaId) }}.
            </p>
          </form>

          <form class="card filtros" @submit.prevent="carregarHistorico">
            <div class="titulo-card">
              <h2>Historico de movimentacoes</h2>
              <p>Acompanhe entradas, saidas e ajustes do estoque.</p>
            </div>

            <div class="campos filtros-campos">
              <label>
                Produto
                <select v-model="filtrosHistorico.produtoId">
                  <option value="">Todos</option>
                  <option v-for="produto in produtos" :key="produto.id" :value="produto.id">{{ obterNomeProduto(produto) }}</option>
                </select>
              </label>
              <label>
                Tipo
                <select v-model="filtrosHistorico.tipo">
                  <option value="">Todos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saida</option>
                  <option value="AJUSTE">Ajuste</option>
                </select>
              </label>
              <label>
                Data inicial
                <input v-model="filtrosHistorico.dataInicial" type="date" />
              </label>
              <label>
                Data final
                <input v-model="filtrosHistorico.dataFinal" type="date" />
              </label>
            </div>

            <div class="acoes">
              <button class="botao principal" :disabled="carregandoMovimentacoes">{{ carregandoMovimentacoes ? 'Atualizando...' : 'Atualizar historico' }}</button>
              <button
                type="button"
                class="botao secundario"
                @click="filtrosHistorico = criarFiltrosHistoricoIniciais(); carregarHistorico()"
              >
                Limpar periodo
              </button>
            </div>
          </form>
        </section>
      </section>

      <section class="secao-lista">
        <div class="cabecalho-secao">
          <div>
            <h2>Produtos</h2>
            <p>{{ produtosVisiveis.length ? 'Acompanhe os produtos cadastrados e movimente o estoque quando precisar.' : 'Nenhum produto encontrado com os filtros atuais.' }}</p>
          </div>
          <span class="contador">{{ produtosVisiveis.length }} item(ns)</span>
        </div>

        <section v-if="erroProdutos" class="card feedback erro">
          <p>{{ erroProdutos }}</p>
        </section>

        <section v-if="!erroProdutos && erroBaixoEstoque" class="card feedback erro">
          <p>{{ erroBaixoEstoque }}</p>
        </section>

        <section v-if="!erroProdutos && !produtosVisiveis.length" class="card estado">
          <p>Nenhum produto cadastrado ainda. Use o formulario para criar o primeiro item do estoque.</p>
        </section>

        <section v-if="!erroProdutos && produtosVisiveis.length" class="grade-produtos">
          <article v-for="produto in produtosVisiveis" :key="produto.id" class="card produto-card">
            <div class="topo-card">
              <div>
                <h3>{{ obterNomeProduto(produto) }}</h3>
                <p>{{ obterCategoriaProduto(produto) }}</p>
              </div>
              <div class="badges-topo">
                <span :class="['status', produtoAtivo(produto) ? 'ativo' : 'inativo']">{{ produtoAtivo(produto) ? 'Ativo' : 'Inativo' }}</span>
                <span v-if="produtoBaixoEstoque(produto)" class="status alerta">Baixo estoque</span>
              </div>
            </div>

            <div class="detalhes-produto">
              <p><strong>Codigo/SKU:</strong> {{ obterCodigoProduto(produto) }}</p>
              <p><strong>Quantidade atual:</strong> {{ formatarNumero(obterQuantidadeAtual(produto)) }}</p>
              <p><strong>Estoque minimo:</strong> {{ formatarNumero(obterEstoqueMinimo(produto)) }}</p>
              <p><strong>Unidade:</strong> {{ obterUnidadeProduto(produto) }}</p>
              <p><strong>Preco de custo:</strong> {{ formatarMoeda(obterPrecoCusto(produto)) }}</p>
              <p><strong>Preco de venda:</strong> {{ formatarMoeda(obterPrecoVenda(produto)) }}</p>
            </div>

            <p v-if="obterDescricaoProduto(produto)" class="descricao-produto">{{ obterDescricaoProduto(produto) }}</p>

            <div class="acoes acoes-produto-card">
              <button class="botao secundario" @click="editarProduto(produto)">Editar</button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'ENTRADA')">Entrada</button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'SAIDA')">Saída</button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'AJUSTE')">Ajuste</button>
              <button :class="['botao', produtoAtivo(produto) ? 'perigo' : 'sucesso-botao']" @click="alternarProduto(produto)">
                {{ produtoAtivo(produto) ? 'Desativar' : 'Ativar' }}
              </button>
            </div>
          </article>
        </section>
      </section>

      <section class="secao-lista">
        <div class="cabecalho-secao">
          <div>
            <h2>Historico</h2>
            <p>Veja o que foi movimentado recentemente no estoque.</p>
          </div>
          <span class="contador">{{ movimentacoes.length }} registro(s)</span>
        </div>

        <section v-if="carregandoMovimentacoes" class="card estado">
          <p>Carregando historico...</p>
        </section>

        <section v-else-if="erroMovimentacoes" class="card feedback erro">
          <p>{{ erroMovimentacoes }}</p>
        </section>

        <section v-else-if="!movimentacoes.length" class="card estado">
          <p>Nenhuma movimentacao encontrada para o periodo selecionado.</p>
        </section>

        <section v-else class="lista-historico">
          <article v-for="(item, indice) in movimentacoes" :key="item.id || indice" class="card historico-card">
            <div class="topo-card">
              <div>
                <h3>{{ produtoMovimentacao(item) }}</h3>
                <p>{{ formatarDataHora(obterCampo(item, 'dataHora', 'criadoEm', 'dataMovimentacao')) }}</p>
              </div>
              <span :class="['status', tipoMovimentacao(item).toLowerCase()]">{{ tipoMovimentacao(item) }}</span>
            </div>

            <div class="detalhes-produto historico-detalhes">
              <p><strong>Quantidade:</strong> {{ quantidadeMovimentacao(item) }}</p>
              <p><strong>Quantidade anterior:</strong> {{ saldoAnteriorMovimentacao(item) }}</p>
              <p><strong>Quantidade nova:</strong> {{ saldoNovoMovimentacao(item) }}</p>
              <p><strong>Observacao:</strong> {{ obterCampo(item, 'observacao', 'motivo') || '-' }}</p>
              <p><strong>Usuario:</strong> {{ usuarioMovimentacao(item) }}</p>
            </div>
          </article>
        </section>
      </section>
    </template>

    <div v-if="movimentacaoProduto" class="modal-overlay" @click.self="fecharMovimentacao">
      <section class="modal card">
        <div class="topo-modal">
          <div>
            <p class="subtitulo">Movimentacao</p>
            <h2>{{ obterNomeProduto(movimentacaoProduto) }}</h2>
            <p class="descricao">Registre entrada, saida ou ajuste do saldo deste produto.</p>
          </div>
          <button class="botao-fechar" type="button" aria-label="Fechar" @click="fecharMovimentacao">x</button>
        </div>

        <form class="formulario-modal" @submit.prevent="salvarMovimentacao">
          <div class="campos">
            <label>
              Tipo
              <select v-model="formularioMovimentacao.tipo">
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saida</option>
                <option value="AJUSTE">Ajuste</option>
              </select>
            </label>
            <label>
              Quantidade
              <input v-model="formularioMovimentacao.quantidade" type="number" min="0" step="0.01" />
            </label>
            <label class="campo-grande">
              Observacao ou motivo
              <textarea v-model="formularioMovimentacao.observacao" rows="4" placeholder="Explique rapidamente esta movimentacao."></textarea>
            </label>
          </div>

          <p v-if="saldoPrevistoMovimentacao !== null" class="saldo-previsto">
            Saldo previsto após a movimentação: <strong>{{ formatarNumero(saldoPrevistoMovimentacao) }}</strong>
          </p>

          <p v-if="formularioMovimentacao.tipo === 'AJUSTE'" class="ajuste-aviso">
            No ajuste, a quantidade informada sera o novo saldo final do produto.
          </p>

          <div class="acoes">
            <button class="botao principal" :disabled="salvandoMovimentacao">
              {{ salvandoMovimentacao ? 'Salvando...' : 'Salvar movimentacao' }}
            </button>
            <button type="button" class="botao secundario" @click="fecharMovimentacao">Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.estoque-view,.cards-resumo,.layout-principal,.filtros-coluna,.secao-lista,.formulario-produto,.filtros,.formulario-modal{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.cabecalho-secao,.topo-card,.acoes,.topo-modal{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}h1,h2,h3,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:24px;font-weight:800}h3{font-size:20px;font-weight:800}.descricao,.titulo-card p,.cabecalho-secao p,.topo-card p,.descricao-produto,.ajuda-inline{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.aviso-plano{border-color:#bfdbfe;background:#eff6ff}.aviso-plano h2{font-size:22px}.estado,.estado-inline{color:#64748b;font-weight:700}.cards-resumo{grid-template-columns:repeat(4,minmax(180px,1fr))}.resumo-card{display:grid;gap:10px;border-left:4px solid #2563eb}.resumo-card span{color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.resumo-card strong{font-size:28px;font-weight:800}.resumo-card p{color:#475569}.layout-principal{grid-template-columns:minmax(0,1.35fr) minmax(300px,.95fr);align-items:start}.campos{display:grid;grid-template-columns:repeat(2,minmax(180px,1fr));gap:14px}.campo-grande{grid-column:1/-1}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select,textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit;background:white}input:focus,select:focus,textarea:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.destaque-checkbox{display:flex;align-items:center;gap:10px;padding:12px 14px;border:1px solid #dbe4f0;border-radius:8px;background:#f8fafc}.destaque-checkbox input{width:auto}.filtros-campos{grid-template-columns:1fr}.grade-produtos,.lista-historico{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:18px}.produto-card,.historico-card{display:grid;gap:14px}.badges-topo{display:flex;gap:8px;flex-wrap:wrap;justify-content:flex-end}.status{display:inline-flex;width:fit-content;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.status.ativo,.status.entrada{background:#dcfce7;color:#166534}.status.inativo,.status.saida{background:#fee2e2;color:#b91c1c}.status.alerta,.status.ajuste{background:#fef3c7;color:#92400e}.detalhes-produto{display:grid;gap:8px}.detalhes-produto p{color:#374151}.detalhes-produto strong{font-weight:800}.contador{border-radius:999px;padding:8px 12px;background:#dbeafe;color:#1d4ed8;font-weight:800}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.botao:disabled{opacity:.6;cursor:not-allowed}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.sucesso-botao{background:#15803d}.acoes-produto-card{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}.acoes-produto-card .botao{width:100%}.modal-overlay{position:fixed;inset:0;background:rgba(15,23,42,.55);display:grid;place-items:center;padding:16px;z-index:60}.modal{width:min(100%,680px);display:grid;gap:18px}.topo-modal{align-items:flex-start}.botao-fechar{border:none;border-radius:999px;width:36px;height:36px;background:#e2e8f0;color:#0f172a;font-size:18px;font-weight:800;cursor:pointer}.saldo-previsto{padding:14px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1e3a8a;font-weight:700}.ajuste-aviso{padding:14px;border:1px solid #fde68a;border-radius:8px;background:#fffbeb;color:#92400e;font-weight:700}.historico-detalhes{grid-template-columns:repeat(2,minmax(0,1fr))}.formulario-modal{display:grid;gap:16px}@media(max-width:1100px){.cards-resumo{grid-template-columns:repeat(2,minmax(180px,1fr))}.layout-principal,.grade-produtos,.lista-historico{grid-template-columns:1fr}}@media(max-width:900px){.cabecalho-pagina,.cabecalho-secao,.topo-card,.acoes,.topo-modal{align-items:flex-start;flex-direction:column}.campos,.historico-detalhes,.cards-resumo,.acoes-produto-card{grid-template-columns:1fr}.badges-topo{justify-content:flex-start}.botao,.botao-fechar{width:auto}}@media(max-width:560px){.card,.modal{padding:18px}.modal-overlay{padding:10px}.acoes{display:grid;grid-template-columns:1fr}.botao{width:100%}}
</style>
