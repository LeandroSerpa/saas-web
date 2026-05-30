<script setup>
import { computed, onMounted, ref, watch } from 'vue'
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
  obterEmpresaVisualizacao,
  obterMensagemAmigavelErro,
  atualizarProdutoEstoque,
} from '@/services/api'
import { ehSuperAdmin } from '@/utils/permissoes'

const OPCOES_UNIDADE = Object.freeze([
  { valor: 'UN', descricao: 'Unidade' },
  { valor: 'CX', descricao: 'Caixa' },
  { valor: 'PC', descricao: 'Peça/Pacote' },
  { valor: 'KG', descricao: 'Quilograma' },
  { valor: 'G', descricao: 'Grama' },
  { valor: 'L', descricao: 'Litro' },
  { valor: 'ML', descricao: 'Mililitro' },
  { valor: 'M', descricao: 'Metro' },
  { valor: 'PAR', descricao: 'Par' },
  { valor: 'KIT', descricao: 'Kit' },
  { valor: 'OUTRO', descricao: 'Outro' },
])
const OPCOES_TAMANHO_PAGINA = Object.freeze([5, 10, 20, 50])

const usuario = ref(carregarUsuarioSessao())
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const modoVisualizacaoSuperAdmin = computed(() => superAdmin.value)
const abaAtiva = ref('produtos')
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
const paginacaoProdutos = ref(criarPaginacaoLocal(10))
const paginacaoMovimentacoes = ref(criarPaginacaoLocal(10))
const saldoPrevistoMovimentacao = computed(() => calcularSaldoPrevistoMovimentacao())

const empresaVisualizacao = computed(() => obterEmpresaVisualizacao())
const abasDisponiveis = computed(() => {
  const abas = [
    { id: 'produtos', rotulo: 'Produtos' },
    { id: 'movimentacoes', rotulo: 'Movimentações' },
  ]

  if (!modoVisualizacaoSuperAdmin.value) {
    abas.splice(1, 0, { id: 'novo', rotulo: produtoEditandoId.value ? 'Editar produto' : 'Novo produto' })
  }

  return abas
})

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
    const empresaAtende =
      !superAdmin.value ||
      !filtros.value.empresaId ||
      String(obterEmpresaProdutoId(item)) === String(filtros.value.empresaId)
    const buscaAtende =
      !termo ||
      [
        obterNomeProduto(item),
        obterCategoriaProduto(item),
        obterCodigoProduto(item),
        obterDescricaoProduto(item),
      ].some((campo) => normalizarTexto(campo).includes(termo))

    return statusAtende && categoriaAtende && baixoEstoqueAtende && empresaAtende && buscaAtende
  })
})

const movimentacoesVisiveis = computed(() => {
  return movimentacoes.value.filter((item) => {
    const produtoAtende =
      !filtrosHistorico.value.produtoId ||
      String(obterProdutoMovimentacaoId(item)) === String(filtrosHistorico.value.produtoId)
    const tipoAtende = !filtrosHistorico.value.tipo || tipoMovimentacao(item) === filtrosHistorico.value.tipo
    const empresaAtende =
      !superAdmin.value ||
      !filtrosHistorico.value.empresaId ||
      String(obterEmpresaMovimentacaoId(item)) === String(filtrosHistorico.value.empresaId)

    return produtoAtende && tipoAtende && empresaAtende
  })
})

const produtosPaginados = computed(() => paginarLista(produtosVisiveis.value, paginacaoProdutos.value))
const movimentacoesPaginadas = computed(() => paginarLista(movimentacoesVisiveis.value, paginacaoMovimentacoes.value))
const resumoPaginacaoProdutos = computed(() => resumoPaginacao(produtosVisiveis.value.length, paginacaoProdutos.value, 'produtos'))
const resumoPaginacaoMovimentacoes = computed(() =>
  resumoPaginacao(movimentacoesVisiveis.value.length, paginacaoMovimentacoes.value, 'movimentações'),
)

const cardsResumo = computed(() => [
  {
    rotulo: 'Total de produtos',
    valor: formatarNumero(obterNumeroResumo('totalProdutos', 'produtosTotal', 'total')),
    destaque: 'Itens cadastrados para acompanhamento.',
  },
  {
    rotulo: 'Produtos ativos',
    valor: formatarNumero(obterNumeroResumo('produtosAtivos', 'ativos')),
    destaque: 'Produtos disponíveis para uso e venda.',
  },
  {
    rotulo: 'Baixo estoque',
    valor: formatarNumero(obterNumeroResumo('baixoEstoque', 'produtosBaixoEstoque')),
    destaque: 'Produtos que pedem atenção agora.',
  },
  {
    rotulo: 'Valor estimado de venda',
    valor: formatarMoeda(obterNumeroResumo('valorEstimadoVenda', 'valorVendaEstimado', 'totalEstimadoVenda')),
    destaque: 'Potencial estimado com o saldo atual.',
  },
])

watch(modoVisualizacaoSuperAdmin, (ativo) => {
  if (ativo && abaAtiva.value === 'novo') {
    abaAtiva.value = 'produtos'
  }
})

async function carregarTela() {
  try {
    carregando.value = true
    erro.value = ''
    erroProdutos.value = ''
    erroBaixoEstoque.value = ''
    erroMovimentacoes.value = ''
    sucesso.value = ''
    bloqueioPlano.value = false
    aplicarEmpresaVisualizacaoInicial()

    const promessas = [
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosApi()), 'Não foi possível carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosApi()), 'Não foi possível carregar os produtos do estoque.'),
      consultarEstoque(() => buscarMovimentacoesProdutoEstoque(montarFiltrosHistoricoApi()), 'Não foi possível carregar o histórico de movimentações.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosApi()), 'Não foi possível carregar os alertas de baixo estoque.'),
    ]

    if (superAdmin.value) {
      promessas.push(buscarEmpresas().catch(() => []))
    }

    const [resumoResultado, produtosResultado, movimentacoesResultado, baixoEstoqueResultado, empresasApi] = await Promise.all(promessas)

    const produtosApi = dadosConsulta(produtosResultado)
    const baixoEstoqueApi = dadosConsulta(baixoEstoqueResultado)

    if (resumoResultado.sucesso || produtosResultado.sucesso || baixoEstoqueResultado.sucesso) {
      resumo.value = normalizarResumo(dadosConsulta(resumoResultado), baixoEstoqueApi, produtosApi)
    }

    if (produtosResultado.sucesso) {
      produtos.value = normalizarLista(produtosApi)
    }

    if (movimentacoesResultado.sucesso) {
      movimentacoes.value = normalizarLista(dadosConsulta(movimentacoesResultado))
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
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível carregar o estoque agora.')
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
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosApi()), 'Não foi possível carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosApi()), 'Não foi possível atualizar os produtos.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosApi()), 'Não foi possível carregar os alertas de baixo estoque.'),
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
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível atualizar os produtos.')
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
      'Não foi possível atualizar o histórico.',
    )

    if (resultado.sucesso) {
      movimentacoes.value = normalizarLista(dadosConsulta(resultado))
    }

    erroMovimentacoes.value = mensagemConsulta(resultado)
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível atualizar o histórico.')
  } finally {
    carregandoMovimentacoes.value = false
  }
}

function aplicarEmpresaVisualizacaoInicial() {
  if (!superAdmin.value || !empresaVisualizacao.value?.id) {
    return
  }

  filtros.value.empresaId = filtros.value.empresaId || empresaVisualizacao.value.id
  filtrosHistorico.value.empresaId = filtrosHistorico.value.empresaId || empresaVisualizacao.value.id
}

async function aplicarFiltrosProdutos() {
  paginacaoProdutos.value.page = 1
  await carregarProdutos()
}

async function limparFiltrosProdutos() {
  filtros.value = criarFiltrosIniciais()
  paginacaoProdutos.value.page = 1
  await carregarProdutos()
}

async function aplicarFiltrosHistorico() {
  paginacaoMovimentacoes.value.page = 1
  await carregarHistorico()
}

async function limparFiltrosHistorico() {
  filtrosHistorico.value = criarFiltrosHistoricoIniciais()
  paginacaoMovimentacoes.value.page = 1
  await carregarHistorico()
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
    empresaId: superAdmin.value ? filtrosHistorico.value.empresaId : '',
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
    empresaProdutoId: '',
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
    empresaId: obterEmpresaVisualizacao()?.id || '',
  }
}

function criarFiltrosHistoricoIniciais() {
  return {
    produtoId: '',
    tipo: '',
    empresaId: obterEmpresaVisualizacao()?.id || '',
    dataInicial: '',
    dataFinal: '',
  }
}

function criarPaginacaoLocal(size = 10) {
  return {
    page: 1,
    size,
  }
}

function obterMensagemErroEstoque(errorAtual, fallback) {
  if (errorAtual?.status === 403 || mensagemIndicaBloqueioPlanoEstoque(errorAtual?.message)) {
    bloqueioPlano.value = true
    return 'O módulo de estoque não está disponível no plano atual.'
  }

  if (errorAtual?.status === 404) {
    return `Endpoint de estoque não encontrado${errorAtual.endpoint ? ` (${errorAtual.endpoint})` : ''}. Verifique a publicação da API em homologação.`
  }

  if (errorAtual?.status >= 500) {
    return `Serviço de estoque indisponível no momento${errorAtual.endpoint ? ` (${errorAtual.endpoint})` : ''}. Tente novamente ou acione o suporte.`
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
  return obterCampo(item, 'codigoSku', 'sku', 'codigo')
}

function obterCodigoProdutoCard(item) {
  return obterCodigoProduto(item) || 'Não informado'
}

function obterCategoriaProduto(item) {
  return obterCampo(item, 'categoria', 'categoriaNome') || 'Sem categoria'
}

function obterUnidadeProduto(item) {
  return String(obterCampo(item, 'unidade', 'unidadeMedida') || 'UN').trim().toUpperCase()
}

function obterOpcaoUnidade(valor) {
  const unidade = String(valor || '').trim().toUpperCase()
  return OPCOES_UNIDADE.find((opcao) => opcao.valor === unidade)
}

function formatarUnidadeProduto(item) {
  const unidade = obterUnidadeProduto(item)
  const opcao = obterOpcaoUnidade(unidade)
  return opcao ? `${opcao.valor} (${opcao.descricao})` : `${unidade} (Outro)`
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

function obterEmpresaProdutoId(item) {
  const empresa = obterCampo(item, 'empresaId', 'empresaProdutoId')
  return typeof empresa === 'object' ? empresa?.id : empresa
}

function obterProdutoMovimentacaoId(item) {
  const produto = obterCampo(item, 'produtoId', 'idProduto')
  return produto || (typeof item?.produto === 'object' ? item.produto.id : '')
}

function obterEmpresaMovimentacaoId(item) {
  const empresa = obterCampo(item, 'empresaId', 'empresaMovimentacaoId')
  return empresa || (typeof item?.empresa === 'object' ? item.empresa.id : '')
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

function pluralizar(quantidade, singular, plural) {
  return `${quantidade} ${Number(quantidade) === 1 ? singular : plural}`
}

function paginarLista(lista, paginacao) {
  const pagina = Math.max(Number(paginacao.page) || 1, 1)
  const tamanho = Math.max(Number(paginacao.size) || 10, 1)
  const inicio = (pagina - 1) * tamanho

  return lista.slice(inicio, inicio + tamanho)
}

function resumoPaginacao(total, paginacao, rotulo) {
  if (!total) {
    return `Mostrando 0-0 de 0 ${rotulo}`
  }

  const pagina = Math.min(Math.max(Number(paginacao.page) || 1, 1), totalPaginas(total, paginacao.size))
  const inicio = (pagina - 1) * Number(paginacao.size) + 1
  const fim = Math.min(inicio + Number(paginacao.size) - 1, total)

  return `Mostrando ${inicio}-${fim} de ${total} ${rotulo}`
}

function totalPaginas(total, tamanho) {
  return Math.max(Math.ceil(total / Math.max(Number(tamanho) || 1, 1)), 1)
}

function podePaginaAnterior(paginacao) {
  return paginacao.page > 1
}

function podeProximaPagina(total, paginacao) {
  return paginacao.page < totalPaginas(total, paginacao.size)
}

function irPaginaAnterior(paginacao) {
  paginacao.page = Math.max(paginacao.page - 1, 1)
}

function irProximaPagina(total, paginacao) {
  paginacao.page = Math.min(paginacao.page + 1, totalPaginas(total, paginacao.size))
}

function alterarTamanhoPagina(paginacao) {
  paginacao.page = 1
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
  if (modoVisualizacaoSuperAdmin.value) {
    erro.value = 'SUPER_ADMIN pode acompanhar o estoque, mas não altera dados das empresas.'
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''

    if (!formularioProduto.value.nome.trim()) {
      erro.value = 'Informe o nome do produto.'
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.quantidadeAtual || 0, 'Informe uma quantidade atual válida.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.estoqueMinimo || 0, 'Informe uma quantidade mínima válida.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.precoCusto || 0, 'Informe um preço de custo válido.')) {
      return
    }

    if (!validarNumeroNaoNegativo(formularioProduto.value.precoVenda || 0, 'Informe um preço de venda válido.')) {
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
    abaAtiva.value = 'produtos'
    await Promise.all([carregarProdutos(), carregarHistorico()])
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível salvar o produto.')
  } finally {
    salvandoProduto.value = false
  }
}

function montarPayloadProduto() {
  return {
    nome: formularioProduto.value.nome.trim(),
    descricao: formularioProduto.value.descricao.trim(),
    codigoSku: formularioProduto.value.codigoSku.trim(),
    sku: formularioProduto.value.codigoSku.trim(),
    categoria: formularioProduto.value.categoria.trim(),
    unidade: formularioProduto.value.unidade || 'UN',
    precoCusto: numeroOuZero(formularioProduto.value.precoCusto),
    precoVenda: numeroOuZero(formularioProduto.value.precoVenda),
    quantidadeAtual: numeroOuZero(formularioProduto.value.quantidadeAtual),
    quantidadeInicial: numeroOuZero(formularioProduto.value.quantidadeAtual),
    estoqueMinimo: numeroOuZero(formularioProduto.value.estoqueMinimo),
    ativo: formularioProduto.value.ativo !== false,
  }
}

function numeroOuZero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

async function editarProduto(item) {
  if (modoVisualizacaoSuperAdmin.value) {
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''
    carregandoDetalheProduto.value = true
    produtoEditandoId.value = item.id
    abaAtiva.value = 'novo'

    let produtoDetalhado = item

    try {
      produtoDetalhado = await buscarProdutoEstoque(item.id)
    } catch {
      produtoDetalhado = item
    }

    formularioProduto.value = {
      nome: obterNomeProduto(produtoDetalhado),
      descricao: obterDescricaoProduto(produtoDetalhado),
      codigoSku: obterCodigoProduto(produtoDetalhado),
      empresaProdutoId: '',
      categoria: obterCategoriaProduto(produtoDetalhado) === 'Sem categoria' ? '' : obterCategoriaProduto(produtoDetalhado),
      unidade: obterUnidadeProduto(produtoDetalhado),
      precoCusto: obterPrecoCusto(produtoDetalhado),
      precoVenda: obterPrecoVenda(produtoDetalhado),
      quantidadeAtual: obterQuantidadeAtual(produtoDetalhado),
      estoqueMinimo: obterEstoqueMinimo(produtoDetalhado),
      ativo: produtoAtivo(produtoDetalhado),
    }
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível carregar os dados do produto.')
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
  if (modoVisualizacaoSuperAdmin.value) {
    erro.value = 'SUPER_ADMIN pode acompanhar o estoque, mas não altera dados das empresas.'
    return
  }

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
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível atualizar o status do produto.')
  }
}

function abrirMovimentacao(item, tipo = 'ENTRADA') {
  if (modoVisualizacaoSuperAdmin.value) {
    return
  }

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
  if (modoVisualizacaoSuperAdmin.value) {
    erro.value = 'SUPER_ADMIN pode acompanhar o estoque, mas não altera dados das empresas.'
    return
  }

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
    await criarMovimentacaoEstoque({
      produtoId: movimentacaoProduto.value.id,
      tipo: formularioMovimentacao.value.tipo,
      quantidade: Number(formularioMovimentacao.value.quantidade),
      observacao: formularioMovimentacao.value.observacao.trim(),
    })

    sucesso.value = 'Movimentação registrada com sucesso.'
    fecharMovimentacao()
    abaAtiva.value = 'movimentacoes'
    await Promise.all([carregarProdutos(), carregarHistorico()])
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Não foi possível registrar a movimentação.')
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
  const nomeDireto = obterCampo(item, 'produtoNome', 'nomeProduto')

  if (nomeDireto) {
    return nomeDireto
  }

  if (typeof item?.produto === 'object') {
    return obterNomeProduto(item.produto)
  }

  const produtoId = obterProdutoMovimentacaoId(item)
  const produto = produtos.value.find((produtoItem) => String(produtoItem.id) === String(produtoId))

  return produto ? obterNomeProduto(produto) : 'Produto sem nome'
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
  return obterCampo(item, 'usuarioResponsavelNome', 'usuarioNome', 'usuario', 'responsavelNome') || 'Usuário não informado'
}

onMounted(() => {
  carregarTela()
})
</script>

<template>
  <main class="pagina estoque-view">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Operação</p>
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

    <section v-if="modoVisualizacaoSuperAdmin" class="card aviso-visualizacao">
      <p>Modo visualização: SUPER_ADMIN pode acompanhar o estoque, mas não altera dados das empresas.</p>
      <p v-if="empresaVisualizacao?.id">Empresa em foco: {{ empresaVisualizacao.nome }}.</p>
      <p v-else>Visão global: nenhuma empresa selecionada no filtro.</p>
    </section>

    <section v-if="bloqueioPlano" class="card aviso-plano">
      <h2>Recurso disponível em planos superiores</h2>
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

      <nav class="abas" aria-label="Áreas do estoque">
        <button
          v-for="aba in abasDisponiveis"
          :key="aba.id"
          type="button"
          :class="{ ativa: abaAtiva === aba.id }"
          @click="abaAtiva = aba.id"
        >
          {{ aba.rotulo }}
        </button>
      </nav>

      <section v-if="abaAtiva === 'produtos'" class="secao-lista">
        <form class="card filtros filtros-produtos" @submit.prevent="aplicarFiltrosProdutos">
          <div class="titulo-card">
            <h2>Filtros de produtos</h2>
            <p>Encontre produtos por status, busca, categoria ou baixo estoque.</p>
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
              <input v-model="filtros.busca" type="search" placeholder="Nome, categoria ou código interno" />
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
                <option v-for="empresa in empresas" :key="empresa.id" :value="String(empresa.id)">{{ empresa.nome }}</option>
              </select>
            </label>
            <label class="campo-checkbox destaque-checkbox">
              <input v-model="filtros.somenteBaixoEstoque" type="checkbox" />
              Somente baixo estoque
            </label>
          </div>

          <div class="acoes">
            <button class="botao principal" :disabled="carregandoProdutos">{{ carregandoProdutos ? 'Filtrando...' : 'Aplicar filtros' }}</button>
            <button type="button" class="botao secundario" @click="limparFiltrosProdutos">Limpar filtros</button>
          </div>

          <p v-if="superAdmin && filtros.empresaId" class="ajuda-inline">
            Visualizando produtos da empresa {{ nomeEmpresaPorId(filtros.empresaId) }}.
          </p>
        </form>

        <div class="cabecalho-secao">
          <div>
            <h2>Produtos</h2>
            <p>{{ produtosVisiveis.length ? 'Acompanhe os produtos cadastrados.' : 'Nenhum produto encontrado com os filtros atuais.' }}</p>
          </div>
          <span class="contador">{{ pluralizar(produtosVisiveis.length, 'item', 'itens') }}</span>
        </div>

        <section v-if="erroProdutos" class="card feedback erro">
          <p>{{ erroProdutos }}</p>
        </section>

        <section v-if="!erroProdutos && erroBaixoEstoque" class="card feedback erro">
          <p>{{ erroBaixoEstoque }}</p>
        </section>

        <section v-if="!erroProdutos && !produtosVisiveis.length" class="card estado">
          <p>Nenhum produto cadastrado ainda.</p>
        </section>

        <section v-if="!erroProdutos && produtosVisiveis.length" class="grade-produtos">
          <article v-for="produto in produtosPaginados" :key="produto.id" class="card produto-card">
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
              <p><strong>Código interno/SKU:</strong> {{ obterCodigoProdutoCard(produto) }}</p>
              <p><strong>Quantidade atual:</strong> {{ formatarNumero(obterQuantidadeAtual(produto)) }}</p>
              <p><strong>Estoque mínimo:</strong> {{ formatarNumero(obterEstoqueMinimo(produto)) }}</p>
              <p><strong>Unidade:</strong> {{ formatarUnidadeProduto(produto) }}</p>
              <p><strong>Preço de custo:</strong> {{ formatarMoeda(obterPrecoCusto(produto)) }}</p>
              <p><strong>Preço de venda:</strong> {{ formatarMoeda(obterPrecoVenda(produto)) }}</p>
            </div>

            <p v-if="obterDescricaoProduto(produto)" class="descricao-produto">{{ obterDescricaoProduto(produto) }}</p>

            <div v-if="!modoVisualizacaoSuperAdmin" class="acoes acoes-produto-card">
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

        <section v-if="!erroProdutos && produtosVisiveis.length" class="card paginacao">
          <p>{{ resumoPaginacaoProdutos }}</p>
          <label>
            Produtos por página
            <select v-model.number="paginacaoProdutos.size" @change="alterarTamanhoPagina(paginacaoProdutos)">
              <option v-for="opcao in OPCOES_TAMANHO_PAGINA" :key="opcao" :value="opcao">{{ opcao }}</option>
            </select>
          </label>
          <div class="botoes-paginacao">
            <button class="botao secundario" :disabled="!podePaginaAnterior(paginacaoProdutos)" @click="irPaginaAnterior(paginacaoProdutos)">Anterior</button>
            <button class="botao secundario" :disabled="!podeProximaPagina(produtosVisiveis.length, paginacaoProdutos)" @click="irProximaPagina(produtosVisiveis.length, paginacaoProdutos)">Próxima</button>
          </div>
        </section>
      </section>

      <section v-if="abaAtiva === 'novo' && !modoVisualizacaoSuperAdmin" class="secao-lista">
        <form class="card formulario-produto" @submit.prevent="salvarProduto">
          <div class="titulo-card">
            <h2>{{ produtoEditandoId ? 'Editar produto' : 'Novo produto' }}</h2>
            <p>{{ produtoEditandoId ? 'Atualize as informações do produto selecionado.' : 'Cadastre produtos para acompanhar quantidades e alertas.' }}</p>
          </div>

          <div v-if="carregandoDetalheProduto" class="estado-inline">Carregando dados do produto...</div>

          <div class="campos">
            <label>
              Nome *
              <input v-model="formularioProduto.nome" type="text" placeholder="Ex: Shampoo neutro" />
            </label>
            <label>
              Código interno / SKU
              <input v-model="formularioProduto.codigoSku" type="text" placeholder="Ex: SH-001" />
              <small>SKU é um código interno para identificar o produto. Exemplo: SH-001 para Shampoo.</small>
            </label>
            <label class="campo-grande">
              Descrição
              <textarea v-model="formularioProduto.descricao" rows="3" placeholder="Informações importantes para identificar o produto."></textarea>
            </label>
            <label>
              Categoria
              <input v-model="formularioProduto.categoria" type="text" placeholder="Ex: Higiene" />
            </label>
            <label>
              Unidade
              <select v-model="formularioProduto.unidade">
                <option v-for="opcao in OPCOES_UNIDADE" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.valor }} - {{ opcao.descricao }}
                </option>
              </select>
              <small>Escolha como este produto é contado no estoque.</small>
            </label>
            <label>
              Preço de custo
              <input v-model="formularioProduto.precoCusto" type="number" min="0" step="0.01" />
            </label>
            <label>
              Preço de venda
              <input v-model="formularioProduto.precoVenda" type="number" min="0" step="0.01" />
            </label>
            <label>
              Quantidade atual
              <input v-model="formularioProduto.quantidadeAtual" type="number" min="0" step="0.01" />
            </label>
            <label>
              Estoque mínimo
              <input v-model="formularioProduto.estoqueMinimo" type="number" min="0" step="0.01" />
            </label>
            <label class="campo-checkbox destaque-checkbox">
              <input v-model="formularioProduto.ativo" type="checkbox" />
              Produto ativo
            </label>
          </div>

          <div class="acoes">
            <button class="botao principal" :disabled="salvandoProduto">
              {{ salvandoProduto ? 'Salvando...' : produtoEditandoId ? 'Salvar alterações' : 'Cadastrar produto' }}
            </button>
            <button v-if="produtoEditandoId" type="button" class="botao secundario" @click="cancelarEdicaoProduto">
              Cancelar edição
            </button>
          </div>
        </form>
      </section>

      <section v-if="abaAtiva === 'movimentacoes'" class="secao-lista">
        <form class="card filtros filtro-historico" @submit.prevent="aplicarFiltrosHistorico">
          <div class="titulo-card">
            <h2>Histórico de movimentações</h2>
            <p>Acompanhe entradas, saídas e ajustes do estoque.</p>
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
                <option value="SAIDA">Saída</option>
                <option value="AJUSTE">Ajuste</option>
              </select>
            </label>
            <label v-if="superAdmin">
              Empresa
              <select v-model="filtrosHistorico.empresaId">
                <option value="">Todas</option>
                <option v-for="empresa in empresas" :key="empresa.id" :value="String(empresa.id)">{{ empresa.nome }}</option>
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
            <button class="botao principal" :disabled="carregandoMovimentacoes">{{ carregandoMovimentacoes ? 'Atualizando...' : 'Atualizar histórico' }}</button>
            <button type="button" class="botao secundario" @click="limparFiltrosHistorico">Limpar filtros do histórico</button>
          </div>
        </form>

        <div class="cabecalho-secao">
          <div>
            <h2>Movimentações registradas</h2>
            <p>Veja o que foi movimentado recentemente no estoque.</p>
          </div>
          <span class="contador">{{ pluralizar(movimentacoesVisiveis.length, 'registro', 'registros') }}</span>
        </div>

        <section v-if="carregandoMovimentacoes" class="card estado">
          <p>Carregando histórico...</p>
        </section>

        <section v-else-if="erroMovimentacoes" class="card feedback erro">
          <p>{{ erroMovimentacoes }}</p>
        </section>

        <section v-else-if="!movimentacoesVisiveis.length" class="card estado">
          <p>Nenhuma movimentação encontrada para o período selecionado.</p>
        </section>

        <section v-else class="lista-historico">
          <article v-for="(item, indice) in movimentacoesPaginadas" :key="item.id || indice" class="card historico-card">
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
              <p><strong>Observação:</strong> {{ obterCampo(item, 'observacao', 'motivo') || 'Não informado' }}</p>
              <p><strong>Usuário:</strong> {{ usuarioMovimentacao(item) }}</p>
            </div>
          </article>
        </section>

        <section v-if="!erroMovimentacoes && movimentacoesVisiveis.length" class="card paginacao">
          <p>{{ resumoPaginacaoMovimentacoes }}</p>
          <label>
            Movimentações por página
            <select v-model.number="paginacaoMovimentacoes.size" @change="alterarTamanhoPagina(paginacaoMovimentacoes)">
              <option v-for="opcao in OPCOES_TAMANHO_PAGINA" :key="opcao" :value="opcao">{{ opcao }}</option>
            </select>
          </label>
          <div class="botoes-paginacao">
            <button class="botao secundario" :disabled="!podePaginaAnterior(paginacaoMovimentacoes)" @click="irPaginaAnterior(paginacaoMovimentacoes)">Anterior</button>
            <button class="botao secundario" :disabled="!podeProximaPagina(movimentacoesVisiveis.length, paginacaoMovimentacoes)" @click="irProximaPagina(movimentacoesVisiveis.length, paginacaoMovimentacoes)">Próxima</button>
          </div>
        </section>
      </section>
    </template>

    <div v-if="movimentacaoProduto && !modoVisualizacaoSuperAdmin" class="modal-overlay" @click.self="fecharMovimentacao">
      <section class="modal card">
        <div class="topo-modal">
          <div>
            <p class="subtitulo">Movimentação</p>
            <h2>{{ obterNomeProduto(movimentacaoProduto) }}</h2>
            <p class="descricao">Registre entrada, saída ou ajuste do saldo deste produto.</p>
          </div>
          <button class="botao-fechar" type="button" aria-label="Fechar" @click="fecharMovimentacao">x</button>
        </div>

        <form class="formulario-modal" @submit.prevent="salvarMovimentacao">
          <div class="campos">
            <label>
              Tipo
              <select v-model="formularioMovimentacao.tipo">
                <option value="ENTRADA">Entrada</option>
                <option value="SAIDA">Saída</option>
                <option value="AJUSTE">Ajuste</option>
              </select>
            </label>
            <label>
              Quantidade
              <input v-model="formularioMovimentacao.quantidade" type="number" min="0" step="0.01" />
            </label>
            <label class="campo-grande">
              Observação ou motivo
              <textarea v-model="formularioMovimentacao.observacao" rows="4" placeholder="Explique rapidamente esta movimentação."></textarea>
            </label>
          </div>

          <p v-if="saldoPrevistoMovimentacao !== null" class="saldo-previsto">
            Saldo previsto após a movimentação: <strong>{{ formatarNumero(saldoPrevistoMovimentacao) }}</strong>
          </p>

          <p v-if="formularioMovimentacao.tipo === 'AJUSTE'" class="ajuste-aviso">
            No ajuste, a quantidade informada será o novo saldo final do produto.
          </p>

          <div class="acoes">
            <button class="botao principal" :disabled="salvandoMovimentacao">
              {{ salvandoMovimentacao ? 'Salvando...' : 'Salvar movimentação' }}
            </button>
            <button type="button" class="botao secundario" @click="fecharMovimentacao">Cancelar</button>
          </div>
        </form>
      </section>
    </div>
  </main>
</template>

<style scoped>
.estoque-view,
.cards-resumo,
.secao-lista,
.formulario-produto,
.filtros,
.formulario-modal {
  display: grid;
  gap: 18px;
  color: #111827;
}
.cabecalho-pagina,
.cabecalho-secao,
.topo-card,
.acoes,
.topo-modal,
.paginacao {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}
.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
h1,
h2,
h3,
p {
  margin: 0;
}
h1 { font-size: 32px; font-weight: 800; }
h2 { font-size: 24px; font-weight: 800; }
h3 { font-size: 20px; font-weight: 800; }
.descricao,
.titulo-card p,
.cabecalho-secao p,
.topo-card p,
.descricao-produto,
.ajuda-inline,
small { color: #64748b; }
.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}
.feedback.erro { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.feedback.sucesso { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.aviso-plano,
.aviso-visualizacao { border-color: #bfdbfe; background: #eff6ff; color: #1e3a8a; }
.aviso-plano h2 { font-size: 22px; }
.estado,
.estado-inline { color: #64748b; font-weight: 700; }
.cards-resumo { grid-template-columns: repeat(4, minmax(180px, 1fr)); }
.resumo-card { display: grid; gap: 10px; border-left: 4px solid #2563eb; }
.resumo-card span { color: #64748b; font-size: 13px; font-weight: 800; text-transform: uppercase; }
.resumo-card strong { font-size: 28px; font-weight: 800; }
.resumo-card p { color: #475569; }
.abas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  border-bottom: 1px solid #dbe4f0;
}
.abas button {
  border: none;
  border-bottom: 3px solid transparent;
  padding: 12px 14px;
  background: transparent;
  color: #475569;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
}
.abas button.ativa {
  border-bottom-color: #2563eb;
  color: #1d4ed8;
}
.campos { display: grid; grid-template-columns: repeat(2, minmax(180px, 1fr)); gap: 14px; }
.filtros-campos { grid-template-columns: repeat(3, minmax(180px, 1fr)); }
.campo-grande { grid-column: 1 / -1; }
label { display: grid; gap: 7px; color: #334155; font-weight: 800; }
input, select, textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  background: white;
}
input:focus, select:focus, textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}
.destaque-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #f8fafc;
}
.destaque-checkbox input { width: auto; }
.grade-produtos { display: grid; grid-template-columns: repeat(2, minmax(340px, 1fr)); gap: 18px; }
.lista-historico { display: grid; grid-template-columns: repeat(2, minmax(300px, 1fr)); gap: 18px; }
.produto-card,
.historico-card { display: grid; gap: 14px; }
.badges-topo { display: flex; gap: 8px; flex-wrap: wrap; justify-content: flex-end; }
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
.status.ativo, .status.entrada { background: #dcfce7; color: #166534; }
.status.inativo, .status.saida { background: #fee2e2; color: #b91c1c; }
.status.alerta, .status.ajuste { background: #fef3c7; color: #92400e; }
.detalhes-produto { display: grid; gap: 8px; }
.detalhes-produto p { color: #374151; }
.detalhes-produto strong { font-weight: 800; }
.contador { border-radius: 999px; padding: 8px 12px; background: #dbeafe; color: #1d4ed8; font-weight: 800; }
.botao { border: none; border-radius: 8px; padding: 10px 16px; color: white; cursor: pointer; font-weight: 800; text-decoration: none; }
.botao:disabled { opacity: 0.6; cursor: not-allowed; }
.principal { background: #2563eb; }
.secundario { background: #0f172a; }
.perigo { background: #dc2626; }
.sucesso-botao { background: #15803d; }
.acoes-produto-card { display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 10px; }
.acoes-produto-card .botao { width: 100%; }
.filtro-historico { border-style: dashed; border-width: 1px; border-color: #bfdbfe; background: #f8fbff; }
.paginacao p { color: #475569; font-weight: 800; }
.paginacao label { display: flex; align-items: center; gap: 8px; }
.paginacao select { width: auto; }
.botoes-paginacao { display: flex; gap: 8px; flex-wrap: wrap; }
.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.55);
  display: grid;
  place-items: center;
  padding: 16px;
  z-index: 60;
}
.modal { width: min(100%, 680px); display: grid; gap: 18px; }
.topo-modal { align-items: flex-start; }
.botao-fechar {
  border: none;
  border-radius: 999px;
  width: 36px;
  height: 36px;
  background: #e2e8f0;
  color: #0f172a;
  font-size: 18px;
  font-weight: 800;
  cursor: pointer;
}
.saldo-previsto { padding: 14px; border: 1px solid #bfdbfe; border-radius: 8px; background: #eff6ff; color: #1e3a8a; font-weight: 700; }
.ajuste-aviso { padding: 14px; border: 1px solid #fde68a; border-radius: 8px; background: #fffbeb; color: #92400e; font-weight: 700; }
.historico-detalhes { grid-template-columns: repeat(2, minmax(0, 1fr)); }
.formulario-modal { display: grid; gap: 16px; }
@media (max-width: 1200px) {
  .cards-resumo { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
  .filtros-campos,
  .grade-produtos,
  .lista-historico { grid-template-columns: 1fr; }
}
@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-secao,
  .topo-card,
  .acoes,
  .topo-modal,
  .paginacao { align-items: flex-start; flex-direction: column; }
  .campos,
  .historico-detalhes,
  .cards-resumo,
  .acoes-produto-card { grid-template-columns: 1fr; }
  .badges-topo { justify-content: flex-start; }
  .botao,
  .botao-fechar { width: auto; }
}
@media (max-width: 560px) {
  .card,
  .modal { padding: 18px; }
  .modal-overlay { padding: 10px; }
  .acoes,
  .botoes-paginacao { display: grid; grid-template-columns: 1fr; width: 100%; }
  .botao,
  .paginacao label,
  .paginacao select { width: 100%; }
}
</style>
