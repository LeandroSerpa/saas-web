<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  ativarProdutoEstoque,
  buscarEmpresas,
  buscarMinhaEmpresa,
  buscarMovimentacoesProdutoEstoque,
  buscarProdutoEstoque,
  buscarProdutosBaixoEstoque,
  buscarProdutosEstoque,
  buscarResumoEstoque,
  buscarUnidadesEstoque,
  carregarUsuarioSessao,
  criarMovimentacaoEstoque,
  criarProdutoEstoque,
  desativarProdutoEstoque,
  excluirProdutoEstoque,
  EVENTO_EMPRESA_VISUALIZACAO,
  EVENTO_UNIDADES_ESTOQUE_ATUALIZADAS,
  mensagemIndicaBloqueioPlanoEstoque,
  montarLinkPublicoCatalogo,
  obterEmpresaVisualizacao,
  obterMensagemAmigavelErro,
  atualizarProdutoEstoque,
} from '@/services/api'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const UNIDADES_FALLBACK = Object.freeze([
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
const TEXTO_BOTAO_PUBLICO_PADRAO = 'Pedir pelo WhatsApp'

const route = useRoute()

const usuario = ref(carregarUsuarioSessao())
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const adminOperacional = computed(() => ehAdmin(usuario.value))
const empresaVisualizacao = ref(obterEmpresaVisualizacao())
const empresaUsuarioId = computed(() => usuario.value?.empresaId || '')
const superAdminComEmpresaSelecionada = computed(() =>
  Boolean(superAdmin.value && String(empresaVisualizacao.value?.id || '').trim()),
)
const empresaVisualizacaoEhPropria = computed(() =>
  Boolean(superAdmin.value && empresaVisualizacao.value?.id && empresaUsuarioId.value) &&
  String(empresaVisualizacao.value.id) === String(empresaUsuarioId.value),
)
const modoVisualizacaoSuperAdmin = computed(() => superAdmin.value && !superAdminComEmpresaSelecionada.value)
const podeExcluirProduto = computed(() => adminOperacional.value && !modoVisualizacaoSuperAdmin.value)
const abaAtiva = ref(obterAbaInicial())
const empresas = ref([])
const produtos = ref([])
const movimentacoes = ref([])
const unidadesEstoque = ref([...UNIDADES_FALLBACK])
const avisoUnidades = ref('')
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
const mensagemLinkCatalogo = ref('')
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
const minhaEmpresa = ref({ slug: '' })

const abasDisponiveis = computed(() => {
  const abas = [
    { id: 'produtos', rotulo: 'Produtos' },
    { id: 'catalogo', rotulo: 'Catálogo público' },
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
const opcoesUnidadeAtivas = computed(() =>
  unidadesEstoque.value.filter((unidade) => unidade.ativo !== false),
)
const opcoesUnidadeProduto = computed(() => {
  const opcoes = [...opcoesUnidadeAtivas.value]

  if (!produtoEditandoId.value) {
    return opcoes
  }

  const unidadeAtual = String(formularioProduto.value.unidade || '').trim().toUpperCase()

  if (!unidadeAtual || opcoes.some((opcao) => opcao.valor === unidadeAtual)) {
    return opcoes
  }

  const unidadeConhecida =
    unidadesEstoque.value.find((opcao) => opcao.valor === unidadeAtual) ||
    UNIDADES_FALLBACK.find((opcao) => opcao.valor === unidadeAtual)

  return [
    ...opcoes,
    {
      id: unidadeAtual,
      valor: unidadeAtual,
      descricao: `${unidadeConhecida?.descricao || 'Unidade'} (inativa)`,
      ativo: false,
    },
  ]
})
const filtrosProdutosAtivos = computed(() =>
  Boolean(
    filtros.value.status ||
      String(filtros.value.busca || '').trim() ||
      filtros.value.categoria ||
      filtros.value.somenteBaixoEstoque,
  ),
)
const mensagemListaProdutosVazia = computed(() => {
  if (filtros.value.somenteBaixoEstoque) {
    return 'Nenhum produto com baixo estoque encontrado.'
  }

  if (filtrosProdutosAtivos.value) {
    return 'Nenhum produto encontrado com os filtros atuais.'
  }

  return 'Nenhum produto cadastrado ainda.'
})
const mensagemModoEstoque = computed(() => {
  if (!superAdmin.value) {
    return ''
  }

  if (modoVisualizacaoSuperAdmin.value) {
    return 'Selecione uma empresa para operar o estoque.'
  }

  if (empresaVisualizacaoEhPropria.value) {
    return `Modo operação: você está usando a própria empresa ${empresaVisualizacao.value.nome}.`
  }

  if (empresaVisualizacao.value?.id) {
    return `Modo operação: você está atuando na empresa ${empresaVisualizacao.value.nome}.`
  }

  return 'Visão global: você está vendo dados consolidados da plataforma. Alterações estão bloqueadas.'
})

const slugCatalogo = computed(() => String(minhaEmpresa.value?.slug || '').trim())
const linkCatalogoPublico = computed(() => montarLinkPublicoCatalogo(slugCatalogo.value))
const produtosCatalogoOrdenados = computed(() =>
  [...produtos.value].sort((a, b) => {
    const prioridadeExibicao = Number(obterExibirCatalogoPublico(b)) - Number(obterExibirCatalogoPublico(a))
    if (prioridadeExibicao) return prioridadeExibicao

    const prioridadeDisponibilidade = Number(produtoDisponivelNoCatalogo(b)) - Number(produtoDisponivelNoCatalogo(a))
    if (prioridadeDisponibilidade) return prioridadeDisponibilidade

    const prioridadeDestaque = Number(obterDestaqueCatalogo(b)) - Number(obterDestaqueCatalogo(a))
    if (prioridadeDestaque) return prioridadeDestaque

    return obterOrdemCatalogo(a) - obterOrdemCatalogo(b) || obterNomeProduto(a).localeCompare(obterNomeProduto(b), 'pt-BR')
  }),
)
const cardsResumoCatalogo = computed(() => [
  {
    rotulo: 'Na vitrine',
    valor: formatarNumero(produtos.value.filter((item) => statusCatalogoProduto(item) === 'Na vitrine').length),
    destaque: 'Produtos visiveis e com saldo disponivel.',
  },
  {
    rotulo: 'Ocultos',
    valor: formatarNumero(produtos.value.filter((item) => statusCatalogoProduto(item) === 'Oculto').length),
    destaque: 'Produtos que nao aparecem no link publico.',
  },
  {
    rotulo: 'Esgotados',
    valor: formatarNumero(produtos.value.filter((item) => statusCatalogoProduto(item) === 'Esgotado').length),
    destaque: 'Itens exibidos, mas sem saldo disponivel no momento.',
  },
  {
    rotulo: 'Destaques',
    valor: formatarNumero(produtos.value.filter((item) => obterDestaqueCatalogo(item)).length),
    destaque: 'Produtos marcados para ganhar prioridade na vitrine.',
  },
])

function obterAbaInicial() {
  if (route.name === 'catalogo-publico-interno' || String(route.query?.aba || '').trim() === 'catalogo') {
    return 'catalogo'
  }

  return 'produtos'
}

function selecionarAba(aba) {
  abaAtiva.value = aba
}

function normalizarCategoriaEnvio(valor) {
  return valor === 'Sem categoria' ? '' : String(valor || '').trim()
}

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
    mensagemLinkCatalogo.value = ''
    bloqueioPlano.value = false
    sincronizarEmpresaVisualizacaoEstoque()

    const promessas = [
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosProdutosApi(false)), 'Não foi possível carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosProdutosApi()), 'Não foi possível carregar os produtos do estoque.'),
      consultarEstoque(() => buscarMovimentacoesProdutoEstoque(montarFiltrosHistoricoApi()), 'Não foi possível carregar o histórico de movimentações.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosProdutosApi(false)), 'Não foi possível carregar os alertas de baixo estoque.'),
      carregarUnidadesEstoque(),
      carregarMinhaEmpresaContexto(),
    ]

    if (superAdmin.value) {
      promessas.push(buscarEmpresas().catch(() => []))
    }

    const [resumoResultado, produtosResultado, movimentacoesResultado, baixoEstoqueResultado, , , empresasApi] = await Promise.all(promessas)

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
      consultarEstoque(() => buscarResumoEstoque(montarFiltrosProdutosApi(false)), 'Não foi possível carregar o resumo do estoque.'),
      consultarEstoque(() => buscarProdutosEstoque(montarFiltrosProdutosApi()), 'Não foi possível atualizar os produtos.'),
      consultarEstoque(() => buscarProdutosBaixoEstoque(montarFiltrosProdutosApi(false)), 'Não foi possível carregar os alertas de baixo estoque.'),
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

function sincronizarEmpresaVisualizacaoEstoque() {
  empresaVisualizacao.value = obterEmpresaVisualizacao()

  if (!superAdmin.value) {
    return
  }

  const empresaId = empresaVisualizacao.value?.id || ''
  filtros.value.empresaId = empresaId
  filtrosHistorico.value.empresaId = empresaId
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

function montarFiltrosProdutosApi(comPaginacao = true) {
  return limparFiltros({
    status: filtros.value.status,
    busca: filtros.value.busca,
    categoria: filtros.value.categoria,
    baixoEstoque: filtros.value.somenteBaixoEstoque ? true : '',
    empresaId: superAdmin.value ? filtros.value.empresaId : '',
    page: comPaginacao ? Math.max(Number(paginacaoProdutos.value.page) || 1, 1) - 1 : '',
    size: comPaginacao ? paginacaoProdutos.value.size : '',
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
    exibirCatalogoPublico: false,
    imagemUrl: '',
    descricaoPublica: '',
    categoriaPublica: '',
    destaqueCatalogo: false,
    mostrarQuantidadePublica: false,
    mostrarPrecoPublico: true,
    ordemCatalogo: '',
    textoBotaoPublico: TEXTO_BOTAO_PUBLICO_PADRAO,
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
  if (modoVisualizacaoSuperAdmin.value && (errorAtual?.status === 403 || mensagemIndicaBloqueioPlanoEstoque(errorAtual?.message))) {
    return 'Selecione uma empresa para operar o estoque.'
  }

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

  const mensagem = obterMensagemAmigavelErro(errorAtual, fallback)
  const texto = normalizarTexto(mensagem)

  if (texto.includes('duplic') || texto.includes('ja existe') || texto.includes('já existe')) {
    return 'Já existe um produto ou unidade com os dados informados.'
  }

  if (texto.includes('codigo') || texto.includes('código')) {
    return 'Código inválido. Revise o código informado e tente novamente.'
  }

  if (texto.includes('unidade') && (texto.includes('nao encontrada') || texto.includes('não encontrada'))) {
    return 'Unidade não encontrada ou inativa. Escolha uma unidade ativa.'
  }

  if (texto.includes('permiss') || errorAtual?.status === 403) {
    return 'Permissão negada para alterar o estoque neste modo.'
  }

  return mensagem
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

async function carregarMinhaEmpresaContexto() {
  try {
    const empresaAtual = await buscarMinhaEmpresa()
    minhaEmpresa.value = empresaAtual && typeof empresaAtual === 'object' ? empresaAtual : { slug: '' }
  } catch {
    minhaEmpresa.value = { slug: '' }
  }
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

async function carregarUnidadesEstoque() {
  try {
    avisoUnidades.value = ''
    const unidadesApi = await buscarUnidadesEstoque({ ativo: true })
    const unidades = normalizarLista(unidadesApi)
      .map(normalizarUnidadeEstoque)
      .filter((unidade) => unidade.valor)
      .sort(ordenarUnidadesEstoque)

    unidadesEstoque.value = unidades
    avisoUnidades.value = unidades.length
      ? ''
      : 'Nenhuma unidade ativa foi encontrada. Peça à Administração do Sistema para ativar ou cadastrar uma opção.'
  } catch (errorAtual) {
    unidadesEstoque.value = [...UNIDADES_FALLBACK]
    avisoUnidades.value = 'Não foi possível carregar as unidades de estoque. Usando opções padrão temporariamente.'
    console.error(errorAtual)
  }
}

function normalizarUnidadeEstoque(item) {
  const valor = String(obterCampo(item, 'codigo', 'valor', 'sigla') || '').trim().toUpperCase()
  const nome = String(obterCampo(item, 'nome', 'descricao', 'label') || valor).trim()
  const status = String(obterCampo(item, 'status') || '').trim().toUpperCase()
  const ativo = obterCampo(item, 'ativo')
  const statusInativo = ['INATIVO', 'INATIVA', 'INACTIVE', 'DESATIVADO', 'DESATIVADA'].includes(status)

  return {
    id: obterCampo(item, 'id', 'unidadeId') || valor,
    valor,
    descricao: nome,
    ordem: Number(obterCampo(item, 'ordem', 'posicao') ?? 0),
    ativo: ativo === false || String(ativo).toLowerCase() === 'false' ? false : !statusInativo,
  }
}

function ordenarUnidadesEstoque(a, b) {
  return (Number(a.ordem) || 0) - (Number(b.ordem) || 0) || a.descricao.localeCompare(b.descricao, 'pt-BR')
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

function obterBooleanoCampo(item, campos = [], padrao = false) {
  for (const campo of campos) {
    const valor = item?.[campo]
    const booleano = normalizarBooleanoFlex(valor)

    if (booleano !== null) {
      return booleano
    }
  }

  return padrao
}

function normalizarBooleanoFlex(valor) {
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'number') return valor !== 0

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase()

    if (['true', '1', 'sim', 'yes'].includes(texto)) return true
    if (['false', '0', 'nao', 'não', 'no'].includes(texto)) return false
  }

  return null
}

function obterNomeProduto(item) {
  return obterCampo(item, 'nome', 'produtoNome', 'titulo') || 'Produto sem nome'
}

function obterDescricaoProduto(item) {
  return obterCampo(item, 'descricao', 'detalhes', 'observacao')
}

function obterDescricaoPublicaProduto(item) {
  return obterCampo(item, 'descricaoPublica', 'descricaoCatalogoPublico', 'descricao')
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

function obterCategoriaPublicaProduto(item) {
  return obterCampo(item, 'categoriaPublica', 'categoriaCatalogoPublico', 'categoria')
}

function obterUnidadeProduto(item) {
  return String(obterCampo(item, 'unidade', 'unidadeMedida') || 'UN').trim().toUpperCase()
}

function obterOpcaoUnidade(valor) {
  const unidade = String(valor || '').trim().toUpperCase()
  return unidadesEstoque.value.find((opcao) => opcao.valor === unidade) ||
    UNIDADES_FALLBACK.find((opcao) => opcao.valor === unidade)
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

function obterExibirCatalogoPublico(item) {
  return obterBooleanoCampo(item, ['exibirCatalogoPublico', 'catalogoPublicoAtivo'], false)
}

function obterImagemUrlProduto(item) {
  return String(obterCampo(item, 'imagemUrl', 'fotoUrl', 'imagem') || '').trim()
}

function obterDestaqueCatalogo(item) {
  return obterBooleanoCampo(item, ['destaqueCatalogo'], false)
}

function obterMostrarQuantidadePublica(item) {
  return obterBooleanoCampo(item, ['mostrarQuantidadePublica'], false)
}

function obterMostrarPrecoPublico(item) {
  return obterBooleanoCampo(item, ['mostrarPrecoPublico'], true)
}

function obterOrdemCatalogo(item) {
  const valor = Number(obterCampo(item, 'ordemCatalogo', 'ordem'))
  return Number.isFinite(valor) ? valor : 0
}

function obterTextoBotaoPublico(item) {
  const valor = String(obterCampo(item, 'textoBotaoPublico') || '').trim()
  return valor || TEXTO_BOTAO_PUBLICO_PADRAO
}

function produtoDisponivelNoCatalogo(item) {
  return produtoAtivo(item) && obterQuantidadeAtual(item) > 0
}

function statusCatalogoProduto(item) {
  if (!obterExibirCatalogoPublico(item)) {
    return 'Oculto'
  }

  if (!produtoDisponivelNoCatalogo(item)) {
    return 'Esgotado'
  }

  return 'Na vitrine'
}

function classeStatusCatalogo(item) {
  const status = statusCatalogoProduto(item)

  if (status === 'Na vitrine') return 'catalogo-vitrine'
  if (status === 'Esgotado') return 'catalogo-esgotado'
  return 'catalogo-oculto'
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

function bloquearAcaoOperacional() {
  erro.value = 'Selecione uma empresa para operar o estoque.'
}

async function salvarProduto() {
  if (modoVisualizacaoSuperAdmin.value) {
    bloquearAcaoOperacional()
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''

    if (!formularioProduto.value.nome.trim()) {
      erro.value = 'Informe o nome do produto.'
      return
    }

    if (!produtoEditandoId.value && !validarNumeroNaoNegativo(formularioProduto.value.quantidadeAtual || 0, 'Informe uma quantidade atual válida.')) {
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

    if (!validarNumeroNaoNegativo(formularioProduto.value.ordemCatalogo || 0, 'Informe uma ordem válida para o catálogo público.')) {
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
  const payload = {
    nome: formularioProduto.value.nome.trim(),
    descricao: formularioProduto.value.descricao.trim(),
    codigoSku: formularioProduto.value.codigoSku.trim(),
    sku: formularioProduto.value.codigoSku.trim(),
    categoria: formularioProduto.value.categoria.trim(),
    unidade: formularioProduto.value.unidade || 'UN',
    precoCusto: numeroOuZero(formularioProduto.value.precoCusto),
    precoVenda: numeroOuZero(formularioProduto.value.precoVenda),
    estoqueMinimo: numeroOuZero(formularioProduto.value.estoqueMinimo),
    ativo: formularioProduto.value.ativo !== false,
    exibirCatalogoPublico: formularioProduto.value.exibirCatalogoPublico === true,
    imagemUrl: formularioProduto.value.imagemUrl.trim(),
    descricaoPublica: formularioProduto.value.descricaoPublica.trim(),
    categoriaPublica: formularioProduto.value.categoriaPublica.trim(),
    destaqueCatalogo: formularioProduto.value.destaqueCatalogo === true,
    mostrarQuantidadePublica: formularioProduto.value.mostrarQuantidadePublica === true,
    mostrarPrecoPublico: formularioProduto.value.mostrarPrecoPublico !== false,
    ordemCatalogo: numeroOuZero(formularioProduto.value.ordemCatalogo),
    textoBotaoPublico: formularioProduto.value.textoBotaoPublico.trim() || TEXTO_BOTAO_PUBLICO_PADRAO,
  }

  if (!produtoEditandoId.value) {
    payload.quantidadeAtual = numeroOuZero(formularioProduto.value.quantidadeAtual)
    payload.quantidadeInicial = numeroOuZero(formularioProduto.value.quantidadeAtual)
  }

  return payload
}

function numeroOuZero(valor) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : 0
}

function montarPayloadProdutoExistente(produtoOrigem, sobrescritas = {}) {
  const payloadBase = {
    nome: obterNomeProduto(produtoOrigem),
    descricao: obterDescricaoProduto(produtoOrigem),
    codigoSku: obterCodigoProduto(produtoOrigem),
    sku: obterCodigoProduto(produtoOrigem),
    categoria: normalizarCategoriaEnvio(obterCategoriaProduto(produtoOrigem)),
    unidade: obterUnidadeProduto(produtoOrigem),
    precoCusto: numeroOuZero(obterPrecoCusto(produtoOrigem)),
    precoVenda: numeroOuZero(obterPrecoVenda(produtoOrigem)),
    estoqueMinimo: numeroOuZero(obterEstoqueMinimo(produtoOrigem)),
    ativo: produtoAtivo(produtoOrigem),
    exibirCatalogoPublico: obterExibirCatalogoPublico(produtoOrigem),
    imagemUrl: obterImagemUrlProduto(produtoOrigem),
    descricaoPublica: obterDescricaoPublicaProduto(produtoOrigem),
    categoriaPublica: normalizarCategoriaEnvio(obterCategoriaPublicaProduto(produtoOrigem)),
    destaqueCatalogo: obterDestaqueCatalogo(produtoOrigem),
    mostrarQuantidadePublica: obterMostrarQuantidadePublica(produtoOrigem),
    mostrarPrecoPublico: obterMostrarPrecoPublico(produtoOrigem),
    ordemCatalogo: numeroOuZero(obterOrdemCatalogo(produtoOrigem)),
    textoBotaoPublico: obterTextoBotaoPublico(produtoOrigem),
  }

  return {
    ...payloadBase,
    ...sobrescritas,
    nome: String((sobrescritas.nome ?? payloadBase.nome) || '').trim(),
    descricao: String((sobrescritas.descricao ?? payloadBase.descricao) || '').trim(),
    codigoSku: String((sobrescritas.codigoSku ?? payloadBase.codigoSku) || '').trim(),
    sku: String((sobrescritas.sku ?? sobrescritas.codigoSku ?? payloadBase.sku) || '').trim(),
    categoria: normalizarCategoriaEnvio(sobrescritas.categoria ?? payloadBase.categoria),
    imagemUrl: String((sobrescritas.imagemUrl ?? payloadBase.imagemUrl) || '').trim(),
    descricaoPublica: String((sobrescritas.descricaoPublica ?? payloadBase.descricaoPublica) || '').trim(),
    categoriaPublica: normalizarCategoriaEnvio(sobrescritas.categoriaPublica ?? payloadBase.categoriaPublica),
    ordemCatalogo: numeroOuZero(sobrescritas.ordemCatalogo ?? payloadBase.ordemCatalogo),
    textoBotaoPublico:
      String((sobrescritas.textoBotaoPublico ?? payloadBase.textoBotaoPublico) || '').trim() || TEXTO_BOTAO_PUBLICO_PADRAO,
  }
}

async function alternarVisibilidadeCatalogo(item, exibir) {
  if (modoVisualizacaoSuperAdmin.value) {
    bloquearAcaoOperacional()
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''

    const produtoDetalhado = await buscarProdutoEstoque(item.id).catch(() => item)
    const payload = montarPayloadProdutoExistente(produtoDetalhado, {
      exibirCatalogoPublico: exibir === true,
    })

    await atualizarProdutoEstoque(item.id, payload)
    sucesso.value = exibir ? 'Produto exibido na vitrine com sucesso.' : 'Produto ocultado da vitrine com sucesso.'
    await carregarProdutos()
  } catch (errorAtual) {
    erro.value = obterMensagemErroEstoque(errorAtual, 'Nao foi possivel atualizar a vitrine deste produto.')
  }
}

async function copiarTexto(texto) {
  if (!texto) {
    return false
  }

  if (navigator?.clipboard?.writeText) {
    await navigator.clipboard.writeText(texto)
    return true
  }

  const campo = document.createElement('textarea')
  campo.value = texto
  campo.setAttribute('readonly', 'true')
  campo.style.position = 'fixed'
  campo.style.opacity = '0'
  document.body.appendChild(campo)
  campo.select()

  let copiado = false

  try {
    copiado = document.execCommand('copy')
  } finally {
    document.body.removeChild(campo)
  }

  return copiado
}

async function copiarLinkCatalogo() {
  if (!linkCatalogoPublico.value) {
    mensagemLinkCatalogo.value = 'Defina o slug da empresa para gerar o link publico do catalogo.'
    return
  }

  try {
    const copiado = await copiarTexto(linkCatalogoPublico.value)
    mensagemLinkCatalogo.value = copiado
      ? 'Link do catalogo copiado com sucesso.'
      : 'Nao foi possivel copiar automaticamente. O link continua disponivel abaixo.'
  } catch {
    mensagemLinkCatalogo.value = 'Nao foi possivel copiar automaticamente. O link continua disponivel abaixo.'
  }
}

function abrirCatalogoPublico() {
  if (!linkCatalogoPublico.value) {
    mensagemLinkCatalogo.value = 'Defina o slug da empresa para abrir o catalogo publico.'
    return
  }

  window.open(linkCatalogoPublico.value, '_blank', 'noopener,noreferrer')
}

async function editarProduto(item) {
  if (modoVisualizacaoSuperAdmin.value) {
    bloquearAcaoOperacional()
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
      exibirCatalogoPublico: obterExibirCatalogoPublico(produtoDetalhado),
      imagemUrl: obterImagemUrlProduto(produtoDetalhado),
      descricaoPublica: obterDescricaoPublicaProduto(produtoDetalhado),
      categoriaPublica: obterCategoriaPublicaProduto(produtoDetalhado),
      destaqueCatalogo: obterDestaqueCatalogo(produtoDetalhado),
      mostrarQuantidadePublica: obterMostrarQuantidadePublica(produtoDetalhado),
      mostrarPrecoPublico: obterMostrarPrecoPublico(produtoDetalhado),
      ordemCatalogo: obterOrdemCatalogo(produtoDetalhado),
      textoBotaoPublico: obterTextoBotaoPublico(produtoDetalhado),
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
    bloquearAcaoOperacional()
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

async function enviarProdutoParaLixeira(item) {
  if (modoVisualizacaoSuperAdmin.value) {
    bloquearAcaoOperacional()
    return
  }

  const confirmou = window.confirm(`Deseja enviar o produto "${obterNomeProduto(item)}" para a lixeira?`)

  if (!confirmou) {
    return
  }

  const motivoInformado = window.prompt('Motivo da exclusão (opcional):', '')

  if (motivoInformado === null) {
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''
    await excluirProdutoEstoque(item.id, String(motivoInformado || '').trim())
    produtos.value = produtos.value.filter((produto) => String(produto.id) !== String(item.id))
    sucesso.value = 'Registro enviado para a lixeira com sucesso.'
    await Promise.all([carregarProdutos(), carregarHistorico()])
  } catch (errorAtual) {
    erro.value = obterMensagemErroExclusaoEstoque(errorAtual)
  }
}

function obterMensagemErroExclusaoEstoque(errorAtual) {
  if (modoVisualizacaoSuperAdmin.value && errorAtual?.status === 403) {
    return 'Selecione uma empresa para operar o estoque.'
  }

  if (errorAtual?.status === 403) {
    return 'Você não tem permissão para excluir este registro.'
  }

  if (errorAtual?.status === 404) {
    return 'Registro não encontrado ou já removido.'
  }

  return obterMensagemErroEstoque(errorAtual, 'Não foi possível enviar o registro para a lixeira. Tente novamente.')
}

function abrirMovimentacao(item, tipo = 'ENTRADA') {
  if (modoVisualizacaoSuperAdmin.value) {
    bloquearAcaoOperacional()
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
    bloquearAcaoOperacional()
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''

    if (!movimentacaoProduto.value?.id) {
      erro.value = 'Selecione um produto para movimentar.'
      return
    }

    const quantidadeMovimentada = Number(formularioMovimentacao.value.quantidade)

    if (!Number.isFinite(quantidadeMovimentada) || quantidadeMovimentada <= 0) {
      erro.value = 'Informe uma quantidade válida maior que zero.'
      return
    }

    if (formularioMovimentacao.value.tipo === 'SAIDA' && saldoPrevistoMovimentacao.value !== null && saldoPrevistoMovimentacao.value < 0) {
      erro.value = 'Essa saída deixaria o produto com quantidade negativa. Ajuste o valor informado.'
      return
    }

    salvandoMovimentacao.value = true
    await criarMovimentacaoEstoque({
      produtoId: movimentacaoProduto.value.id,
      tipo: formularioMovimentacao.value.tipo,
      quantidade: quantidadeMovimentada,
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

function atualizarContextoEstoque() {
  usuario.value = carregarUsuarioSessao()
  abaAtiva.value = obterAbaInicial()
  paginacaoProdutos.value.page = 1
  paginacaoMovimentacoes.value.page = 1
  carregarTela()
}

function atualizarUnidadesEstoque() {
  carregarUnidadesEstoque()
}

onMounted(() => {
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEstoque)
  window.addEventListener(EVENTO_UNIDADES_ESTOQUE_ATUALIZADAS, atualizarUnidadesEstoque)
  carregarTela()
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEstoque)
  window.removeEventListener(EVENTO_UNIDADES_ESTOQUE_ATUALIZADAS, atualizarUnidadesEstoque)
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

    <section v-if="superAdmin" class="card aviso-visualizacao">
      <p>{{ mensagemModoEstoque }}</p>
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
              <select v-model="filtros.empresaId" disabled>
                <option value="">Todas</option>
                <option v-for="empresa in empresas" :key="empresa.id" :value="String(empresa.id)">{{ empresa.nome }}</option>
              </select>
              <small>Use o seletor de visualização no topo para trocar a empresa.</small>
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
            <p>{{ produtosVisiveis.length ? 'Acompanhe os produtos cadastrados.' : mensagemListaProdutosVazia }}</p>
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
          <p>{{ mensagemListaProdutosVazia }}</p>
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
                <span :class="['status', classeStatusCatalogo(produto)]">{{ statusCatalogoProduto(produto) }}</span>
                <span v-if="obterDestaqueCatalogo(produto)" class="status catalogo-destaque">Destaque</span>
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
              <button class="botao secundario" @click="alternarVisibilidadeCatalogo(produto, !obterExibirCatalogoPublico(produto))">
                {{ obterExibirCatalogoPublico(produto) ? 'Ocultar da vitrine' : 'Mostrar na vitrine' }}
              </button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'ENTRADA')">Entrada</button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'SAIDA')">Saída</button>
              <button class="botao secundario" @click="abrirMovimentacao(produto, 'AJUSTE')">Ajuste</button>
              <button :class="['botao', produtoAtivo(produto) ? 'perigo' : 'sucesso-botao']" @click="alternarProduto(produto)">
                {{ produtoAtivo(produto) ? 'Desativar' : 'Ativar' }}
              </button>
              <button v-if="podeExcluirProduto" class="botao perigo" @click="enviarProdutoParaLixeira(produto)">Excluir</button>
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

      <section v-if="abaAtiva === 'catalogo'" class="secao-lista">
        <section class="card catalogo-link-card">
          <div class="titulo-card">
            <h2>Link publico do catalogo</h2>
            <p>Compartilhe este endereco com seus clientes para apresentar os produtos do dia e receber contatos pelo WhatsApp.</p>
          </div>

          <div class="catalogo-link-conteudo">
            <div class="catalogo-link-bloco">
              <span class="link-rotulo">Endereco do catalogo</span>
              <strong class="link-publico">
                {{ linkCatalogoPublico || 'Configure o slug da empresa em Minha empresa para liberar o link.' }}
              </strong>
              <p class="ajuda-inline">
                {{ slugCatalogo ? 'O host acompanha automaticamente o ambiente atual.' : 'Sem slug nao e possivel gerar o link publico.' }}
              </p>
            </div>

            <div class="acoes">
              <button class="botao principal" type="button" :disabled="!linkCatalogoPublico" @click="copiarLinkCatalogo">
                Copiar link do catalogo
              </button>
              <button class="botao secundario" type="button" :disabled="!linkCatalogoPublico" @click="abrirCatalogoPublico">
                Abrir catalogo
              </button>
            </div>
          </div>

          <p v-if="mensagemLinkCatalogo" class="ajuda-inline">{{ mensagemLinkCatalogo }}</p>
        </section>

        <section class="cards-resumo">
          <article v-for="card in cardsResumoCatalogo" :key="card.rotulo" class="card resumo-card">
            <span>{{ card.rotulo }}</span>
            <strong>{{ card.valor }}</strong>
            <p>{{ card.destaque }}</p>
          </article>
        </section>

        <div class="cabecalho-secao">
          <div>
            <h2>Produtos na vitrine</h2>
            <p>Revise o que esta visivel no catalogo publico e ajuste rapidamente sem sair do estoque.</p>
          </div>
          <span class="contador">{{ pluralizar(produtosCatalogoOrdenados.length, 'produto', 'produtos') }}</span>
        </div>

        <section v-if="!produtosCatalogoOrdenados.length" class="card estado">
          <p>Cadastre um produto para comecar a montar o catalogo publico.</p>
        </section>

        <section v-else class="grade-produtos">
          <article v-for="produto in produtosCatalogoOrdenados" :key="`catalogo-${produto.id}`" class="card produto-card">
            <img
              v-if="obterImagemUrlProduto(produto)"
              :src="obterImagemUrlProduto(produto)"
              :alt="`Imagem de ${obterNomeProduto(produto)}`"
              class="catalogo-imagem"
            />

            <div class="topo-card">
              <div>
                <h3>{{ obterNomeProduto(produto) }}</h3>
                <p>{{ obterCategoriaPublicaProduto(produto) || obterCategoriaProduto(produto) }}</p>
              </div>
              <div class="badges-topo">
                <span :class="['status', classeStatusCatalogo(produto)]">{{ statusCatalogoProduto(produto) }}</span>
                <span v-if="obterDestaqueCatalogo(produto)" class="status catalogo-destaque">Destaque</span>
                <span v-if="produtoBaixoEstoque(produto)" class="status alerta">Baixo estoque</span>
              </div>
            </div>

            <p v-if="obterDescricaoPublicaProduto(produto)" class="descricao-produto">{{ obterDescricaoPublicaProduto(produto) }}</p>

            <div class="detalhes-produto">
              <p><strong>Categoria publica:</strong> {{ obterCategoriaPublicaProduto(produto) || 'Nao informada' }}</p>
              <p><strong>Ordem no catalogo:</strong> {{ formatarNumero(obterOrdemCatalogo(produto)) }}</p>
              <p><strong>Preco publico:</strong> {{ obterMostrarPrecoPublico(produto) ? formatarMoeda(obterPrecoVenda(produto)) : 'Oculto' }}</p>
              <p><strong>Quantidade publica:</strong> {{ obterMostrarQuantidadePublica(produto) ? formatarNumero(obterQuantidadeAtual(produto)) : 'Oculta' }}</p>
              <p><strong>Botao:</strong> {{ obterTextoBotaoPublico(produto) }}</p>
            </div>

            <div v-if="!modoVisualizacaoSuperAdmin" class="acoes acoes-produto-card">
              <button class="botao secundario" type="button" @click="editarProduto(produto)">Editar produto</button>
              <button
                class="botao secundario"
                type="button"
                @click="alternarVisibilidadeCatalogo(produto, !obterExibirCatalogoPublico(produto))"
              >
                {{ obterExibirCatalogoPublico(produto) ? 'Ocultar da vitrine' : 'Mostrar na vitrine' }}
              </button>
              <button class="botao principal" type="button" :disabled="!linkCatalogoPublico" @click="abrirCatalogoPublico">
                Abrir catalogo
              </button>
            </div>
          </article>
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
                <option v-for="opcao in opcoesUnidadeProduto" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.valor }} - {{ opcao.descricao }}
                </option>
              </select>
              <small>Caso precise de uma nova opção, entre em contato com a Administração do Sistema para que a equipe adicione o tipo.</small>
              <small v-if="avisoUnidades" class="aviso-campo">{{ avisoUnidades }}</small>
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
              <input v-model="formularioProduto.quantidadeAtual" type="number" min="0" step="0.01" :readonly="Boolean(produtoEditandoId)" />
              <small v-if="produtoEditandoId">O saldo do produto deve ser alterado por Entrada, Saída ou Ajuste, para manter o histórico do estoque.</small>
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

          <section class="secao-formulario-publico">
            <div class="titulo-card">
              <h2>Catalogo publico</h2>
              <p>Defina como este produto aparece na vitrine publica e no botao de WhatsApp.</p>
            </div>

            <div class="campos">
              <label class="campo-checkbox destaque-checkbox">
                <input v-model="formularioProduto.exibirCatalogoPublico" type="checkbox" />
                Exibir no catalogo publico
              </label>
              <label class="campo-checkbox destaque-checkbox">
                <input v-model="formularioProduto.destaqueCatalogo" type="checkbox" />
                Produto em destaque
              </label>
              <label>
                Imagem do produto por URL
                <input v-model="formularioProduto.imagemUrl" type="url" placeholder="https://..." />
                <small>O upload de imagem fica para uma proxima fase. Por enquanto, use um link direto.</small>
              </label>
              <label>
                Categoria publica
                <input v-model="formularioProduto.categoriaPublica" type="text" placeholder="Ex: Doces do dia" />
              </label>
              <label class="campo-grande">
                Descricao para o cliente
                <textarea
                  v-model="formularioProduto.descricaoPublica"
                  rows="3"
                  placeholder="Explique sabor, tamanho, recheio ou observacoes importantes."
                ></textarea>
              </label>
              <label>
                Ordem no catalogo
                <input v-model="formularioProduto.ordemCatalogo" type="number" min="0" step="1" />
              </label>
              <label>
                Texto do botao
                <input v-model="formularioProduto.textoBotaoPublico" type="text" :placeholder="TEXTO_BOTAO_PUBLICO_PADRAO" />
              </label>
              <label class="campo-checkbox destaque-checkbox">
                <input v-model="formularioProduto.mostrarQuantidadePublica" type="checkbox" />
                Mostrar quantidade ao cliente
              </label>
              <label class="campo-checkbox destaque-checkbox">
                <input v-model="formularioProduto.mostrarPrecoPublico" type="checkbox" />
                Mostrar preco ao cliente
              </label>
            </div>
          </section>

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
              <select v-model="filtrosHistorico.empresaId" disabled>
                <option value="">Todas</option>
                <option v-for="empresa in empresas" :key="empresa.id" :value="String(empresa.id)">{{ empresa.nome }}</option>
              </select>
              <small>Use o seletor de visualização no topo para trocar a empresa.</small>
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
.aviso-campo { color: #92400e; }
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
.catalogo-link-card,
.catalogo-link-conteudo,
.catalogo-link-bloco,
.secao-formulario-publico { display: grid; gap: 14px; }
.catalogo-link-conteudo { grid-template-columns: minmax(0, 1fr) auto; align-items: center; }
.link-rotulo {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}
.link-publico {
  word-break: break-word;
  color: #0f172a;
  font-size: 15px;
}
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
input[readonly] { background: #f8fafc; color: #64748b; }
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
.catalogo-imagem {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #dbe4f0;
}
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
.status.catalogo-vitrine { background: #dbeafe; color: #1d4ed8; }
.status.catalogo-esgotado { background: #fee2e2; color: #b91c1c; }
.status.catalogo-oculto { background: #e2e8f0; color: #334155; }
.status.catalogo-destaque { background: #fde68a; color: #92400e; }
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
.secao-formulario-publico {
  padding-top: 18px;
  border-top: 1px solid #dbe4f0;
}
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
  .lista-historico,
  .catalogo-link-conteudo { grid-template-columns: 1fr; }
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
