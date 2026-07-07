import { ref } from 'vue'

const CHAVE_PREFERENCIAS_TELAS = 'preferenciasTelas'
const CHAVE_PREFERENCIAS_TELAS_STATUS = 'preferenciasTelasStatus'
const LIMITE_FILTROS_SALVOS_SERIALIZADO = 4096

export const CHAVE_TELA_DASHBOARD = 'DASHBOARD'
export const MODO_VISUALIZACAO_TABELA = 'TABELA'
export const MODO_VISUALIZACAO_CARDS = 'CARDS'
export const MODO_VISUALIZACAO_LISTA = 'LISTA'
export const MODO_VISUALIZACAO_CALENDARIO = 'CALENDARIO'
export const ORDENACAO_ASC = 'ASC'
export const ORDENACAO_DESC = 'DESC'

export const STATUS_SINCRONIZACAO_TELAS_IDLE = 'idle'
export const STATUS_SINCRONIZACAO_TELAS_CARREGANDO = 'carregando'
export const STATUS_SINCRONIZACAO_TELAS_SALVANDO = 'salvando'
export const STATUS_SINCRONIZACAO_TELAS_SALVO = 'salvo'
export const STATUS_SINCRONIZACAO_TELAS_ERRO = 'erro'
export const STATUS_SINCRONIZACAO_TELAS_LOCAL = 'local'

export const ORIGEM_PREFERENCIAS_TELAS_BACKEND = 'backend'
export const ORIGEM_PREFERENCIAS_TELAS_LOCAL = 'localStorage'
export const ORIGEM_OPCOES_TELAS_BACKEND = 'backend'
export const ORIGEM_OPCOES_TELAS_LOCAL = 'local'

export const MODOS_VISUALIZACAO_VALIDOS = Object.freeze([
  MODO_VISUALIZACAO_TABELA,
  MODO_VISUALIZACAO_CARDS,
  MODO_VISUALIZACAO_LISTA,
  MODO_VISUALIZACAO_CALENDARIO,
])
export const ITENS_POR_PAGINA_TELAS_VALIDOS = Object.freeze([10, 20, 50, 100])
export const ORDENACOES_DIRECAO_VALIDAS = Object.freeze([ORDENACAO_ASC, ORDENACAO_DESC])
export const STATUS_SINCRONIZACAO_TELAS_VALIDOS = Object.freeze([
  STATUS_SINCRONIZACAO_TELAS_IDLE,
  STATUS_SINCRONIZACAO_TELAS_CARREGANDO,
  STATUS_SINCRONIZACAO_TELAS_SALVANDO,
  STATUS_SINCRONIZACAO_TELAS_SALVO,
  STATUS_SINCRONIZACAO_TELAS_ERRO,
  STATUS_SINCRONIZACAO_TELAS_LOCAL,
])

export const TELAS_PREFERENCIAS_SUPORTADAS = Object.freeze([
  criarTelaSuportada('DASHBOARD', 'Dashboard', ['periodo', 'resumo', 'agenda', 'financeiro'], 'periodo'),
  criarTelaSuportada('CLIENTES', 'Clientes', ['nome', 'telefone', 'email', 'status'], 'nome'),
  criarTelaSuportada('AGENDAMENTOS', 'Agendamentos', ['dataHora', 'cliente', 'servico', 'status'], 'dataHora'),
  criarTelaSuportada('ESTOQUE', 'Estoque', ['produto', 'categoria', 'quantidade', 'status'], 'produto'),
  criarTelaSuportada('SERVICOS', 'Servicos', ['nome', 'duracao', 'preco', 'status'], 'nome'),
  criarTelaSuportada('FUNCIONARIOS', 'Funcionarios', ['nome', 'telefone', 'email', 'status'], 'nome'),
  criarTelaSuportada('FINANCEIRO', 'Financeiro', ['descricao', 'valor', 'vencimento', 'status'], 'vencimento'),
  criarTelaSuportada('FATURAS', 'Faturas', ['competencia', 'valor', 'vencimento', 'status'], 'vencimento'),
  criarTelaSuportada('AUDITORIA', 'Auditoria', ['dataHora', 'usuario', 'acao', 'entidade'], 'dataHora'),
  criarTelaSuportada('LIXEIRA', 'Lixeira', ['registro', 'tipo', 'excluidoEm', 'responsavel'], 'excluidoEm'),
  criarTelaSuportada('NOTIFICACOES', 'Notificacoes', ['titulo', 'tipo', 'status', 'criadoEm'], 'criadoEm'),
  criarTelaSuportada('ESPORTIVO_TURMAS', 'Turmas esportivas', ['nome', 'professor', 'nivel', 'status'], 'nome'),
  criarTelaSuportada('ESPORTIVO_FREQUENCIA', 'Frequencia esportiva', ['data', 'turma', 'aluno', 'status'], 'data'),
  criarTelaSuportada('ESPORTIVO_FINANCEIRO', 'Financeiro esportivo', ['aluno', 'valor', 'vencimento', 'status'], 'vencimento'),
  criarTelaSuportada('MINHA_CONTA', 'Minha conta', ['secao', 'status', 'atualizadoEm'], 'secao'),
])

const TELAS_POR_CHAVE = new Map(TELAS_PREFERENCIAS_SUPORTADAS.map((tela) => [tela.chave, tela]))

export const preferenciasTelas = ref({})
export const estadoSincronizacaoTelas = ref(STATUS_SINCRONIZACAO_TELAS_IDLE)
export const mensagemSincronizacaoTelas = ref('')
export const origemPreferenciasTelas = ref(ORIGEM_PREFERENCIAS_TELAS_LOCAL)
export const opcoesPreferenciasTelas = ref(criarOpcoesPreferenciasTelasFallback())
export const origemOpcoesPreferenciasTelas = ref(ORIGEM_OPCOES_TELAS_LOCAL)

function criarTelaSuportada(chave, nome, colunas, ordenacaoCampoPadrao) {
  return Object.freeze({
    chave,
    nome,
    colunas: Object.freeze([...colunas]),
    ordenacaoCampoPadrao,
  })
}

function criarPreferenciaTelaPadrao(chaveTela = CHAVE_TELA_DASHBOARD) {
  const chave = normalizarChaveTela(chaveTela)
  const tela = TELAS_POR_CHAVE.get(chave) || TELAS_POR_CHAVE.get(CHAVE_TELA_DASHBOARD)

  return {
    chaveTela: chave,
    modoVisualizacao: MODO_VISUALIZACAO_TABELA,
    itensPorPagina: 20,
    ordenacaoCampo: tela.ordenacaoCampoPadrao,
    ordenacaoDirecao: ORDENACAO_ASC,
    colunasVisiveis: [...tela.colunas],
    filtrosSalvos: {},
    fixarFiltros: false,
    compactarCards: false,
    atualizadoEm: '',
  }
}

function criarOpcoesPreferenciasTelasFallback() {
  return {
    telas: TELAS_PREFERENCIAS_SUPORTADAS.map((tela) => ({
      valor: tela.chave,
      nome: tela.nome,
    })),
    modosVisualizacao: [
      { valor: MODO_VISUALIZACAO_TABELA, nome: 'Tabela' },
      { valor: MODO_VISUALIZACAO_CARDS, nome: 'Cards' },
      { valor: MODO_VISUALIZACAO_LISTA, nome: 'Lista' },
      { valor: MODO_VISUALIZACAO_CALENDARIO, nome: 'Calendario' },
    ],
    itensPorPagina: ITENS_POR_PAGINA_TELAS_VALIDOS.map((valor) => ({ valor, nome: String(valor) })),
    ordenacoesDirecao: [
      { valor: ORDENACAO_ASC, nome: 'Crescente' },
      { valor: ORDENACAO_DESC, nome: 'Decrescente' },
    ],
    colunasPorTela: TELAS_PREFERENCIAS_SUPORTADAS.reduce((mapa, tela) => {
      mapa[tela.chave] = tela.colunas.map((coluna) => ({ valor: coluna, nome: formatarNomeColuna(coluna) }))
      return mapa
    }, {}),
  }
}

function definirEstadoSincronizacao(estado, mensagem = '') {
  estadoSincronizacaoTelas.value = normalizarStatusSincronizacao(estado)
  mensagemSincronizacaoTelas.value = mensagem
  salvarStatusPreferenciasTelasLocais(estadoSincronizacaoTelas.value)
}

function normalizarCodigo(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

function normalizarTextoSimples(valor) {
  return String(valor || '').trim()
}

function normalizarBooleano(valor, fallback = false) {
  if (valor === true || valor === false) {
    return valor
  }

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase()

    if (['true', '1', 'sim', 's', 'yes'].includes(texto)) {
      return true
    }

    if (['false', '0', 'nao', 'não', 'n', 'no'].includes(texto)) {
      return false
    }
  }

  if (typeof valor === 'number') {
    if (valor === 1) {
      return true
    }

    if (valor === 0) {
      return false
    }
  }

  return fallback
}

function normalizarDataAtualizacao(valor) {
  const texto = String(valor || '').trim()
  return texto || ''
}

function normalizarStatusSincronizacao(valor) {
  const texto = String(valor || '').trim().toLowerCase()
  return STATUS_SINCRONIZACAO_TELAS_VALIDOS.includes(texto) ? texto : STATUS_SINCRONIZACAO_TELAS_IDLE
}

function extrairPreferenciasTelasResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return {}
  }

  if (Array.isArray(resposta)) {
    return resposta
  }

  if (Array.isArray(resposta.data)) {
    return resposta.data
  }

  if (Array.isArray(resposta.preferencias)) {
    return resposta.preferencias
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data.preferencias ?? resposta.data.telas ?? resposta.data
  }

  if (resposta.preferencias && typeof resposta.preferencias === 'object') {
    return resposta.preferencias
  }

  return resposta
}

function extrairOpcoesPreferenciasTelasResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return {}
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data
  }

  if (resposta.opcoes && typeof resposta.opcoes === 'object') {
    return resposta.opcoes
  }

  return resposta
}

function normalizarOpcaoValorNome(opcao, normalizarValor) {
  if (typeof opcao === 'string' || typeof opcao === 'number') {
    const valor = normalizarValor(opcao)
    return valor ? { valor, nome: String(opcao).trim() || String(valor) } : null
  }

  if (!opcao || typeof opcao !== 'object') {
    return null
  }

  const valor = normalizarValor(opcao.valor ?? opcao.chave ?? opcao.chaveTela ?? opcao.codigo ?? opcao.id)
  const nome = String(opcao.nome || opcao.label || opcao.descricao || valor || '').trim()

  if (!valor || !nome) {
    return null
  }

  return { valor, nome }
}

function normalizarOpcoesValorNome(opcoes, valoresEsperados, normalizarValor) {
  if (!Array.isArray(opcoes)) {
    return []
  }

  const porValor = new Map()

  for (const opcao of opcoes) {
    const normalizada = normalizarOpcaoValorNome(opcao, normalizarValor)

    if (normalizada && valoresEsperados.includes(normalizada.valor)) {
      porValor.set(normalizada.valor, normalizada)
    }
  }

  return valoresEsperados.map((valor) => porValor.get(valor)).filter(Boolean)
}

function obterLocalStorageSeguro() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return window.localStorage
}

function lerJsonLocal(chave) {
  const storage = obterLocalStorageSeguro()

  if (!storage) {
    return null
  }

  try {
    const texto = storage.getItem(chave)
    return texto ? JSON.parse(texto) : null
  } catch (error) {
    console.error(error)
    return null
  }
}

function salvarStatusPreferenciasTelasLocais(status) {
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_PREFERENCIAS_TELAS_STATUS, normalizarStatusSincronizacao(status))
  }
}

function formatarNomeColuna(coluna) {
  return String(coluna || '')
    .replace(/([a-z])([A-Z])/g, '$1 $2')
    .replace(/[_-]+/g, ' ')
    .trim()
    .replace(/^./, (letra) => letra.toUpperCase())
}

export function normalizarChaveTela(valor, fallback = CHAVE_TELA_DASHBOARD) {
  const codigo = normalizarCodigo(valor)

  if (TELAS_POR_CHAVE.has(codigo)) {
    return codigo
  }

  const chaveFallback = normalizarCodigo(fallback)
  return TELAS_POR_CHAVE.has(chaveFallback) ? chaveFallback : CHAVE_TELA_DASHBOARD
}

export function normalizarModoVisualizacao(valor) {
  const codigo = normalizarCodigo(valor)
  return MODOS_VISUALIZACAO_VALIDOS.includes(codigo) ? codigo : MODO_VISUALIZACAO_TABELA
}

export function normalizarItensPorPaginaTela(valor) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return ITENS_POR_PAGINA_TELAS_VALIDOS.includes(numero) ? numero : 20
}

export function normalizarOrdenacaoDirecao(valor) {
  const codigo = normalizarCodigo(valor)
  return ORDENACOES_DIRECAO_VALIDAS.includes(codigo) ? codigo : ORDENACAO_ASC
}

export function obterColunasTela(chaveTela) {
  const chave = normalizarChaveTela(chaveTela)
  return [...(TELAS_POR_CHAVE.get(chave)?.colunas || TELAS_POR_CHAVE.get(CHAVE_TELA_DASHBOARD).colunas)]
}

export function normalizarOrdenacaoCampo(chaveTela, valor) {
  const campo = normalizarTextoSimples(valor)
  const colunas = obterColunasTela(chaveTela)

  if (campo && colunas.includes(campo)) {
    return campo
  }

  return TELAS_POR_CHAVE.get(normalizarChaveTela(chaveTela))?.ordenacaoCampoPadrao || colunas[0]
}

export function normalizarColunasVisiveis(chaveTela, colunas) {
  const colunasPadrao = obterColunasTela(chaveTela)

  if (!Array.isArray(colunas)) {
    return colunasPadrao
  }

  const visiveis = colunas
    .map((coluna) => normalizarTextoSimples(coluna))
    .filter((coluna, indice, lista) => colunasPadrao.includes(coluna) && lista.indexOf(coluna) === indice)

  return visiveis.length ? visiveis : colunasPadrao
}

export function normalizarFiltrosSalvos(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return {}
  }

  try {
    const serializado = JSON.stringify(valor)

    if (!serializado || serializado.length > LIMITE_FILTROS_SALVOS_SERIALIZADO) {
      return {}
    }

    return JSON.parse(serializado)
  } catch (error) {
    console.error(error)
    return {}
  }
}

export function obterPreferenciaTelaPadrao(chaveTela = CHAVE_TELA_DASHBOARD) {
  return criarPreferenciaTelaPadrao(chaveTela)
}

export function obterOpcoesPreferenciasTelasFallback() {
  return criarOpcoesPreferenciasTelasFallback()
}

export function normalizarPreferenciaTela(preferencia = {}, chaveFallback = CHAVE_TELA_DASHBOARD) {
  const origem = preferencia && typeof preferencia === 'object' ? preferencia : {}
  const chaveTela = normalizarChaveTela(origem.chaveTela ?? origem.chave ?? chaveFallback)
  const padrao = criarPreferenciaTelaPadrao(chaveTela)

  return {
    chaveTela,
    modoVisualizacao: normalizarModoVisualizacao(origem.modoVisualizacao ?? origem.visualizacao),
    itensPorPagina: normalizarItensPorPaginaTela(origem.itensPorPagina),
    ordenacaoCampo: normalizarOrdenacaoCampo(chaveTela, origem.ordenacaoCampo),
    ordenacaoDirecao: normalizarOrdenacaoDirecao(origem.ordenacaoDirecao),
    colunasVisiveis: normalizarColunasVisiveis(chaveTela, origem.colunasVisiveis),
    filtrosSalvos: normalizarFiltrosSalvos(origem.filtrosSalvos),
    fixarFiltros: normalizarBooleano(origem.fixarFiltros, padrao.fixarFiltros),
    compactarCards: normalizarBooleano(origem.compactarCards, padrao.compactarCards),
    atualizadoEm: normalizarDataAtualizacao(origem.atualizadoEm),
  }
}

export function normalizarPreferenciasTelas(preferencias = {}) {
  const origem = extrairPreferenciasTelasResposta(preferencias)
  const mapa = {}

  if (Array.isArray(origem)) {
    for (const preferencia of origem) {
      const normalizada = normalizarPreferenciaTela(preferencia)
      mapa[normalizada.chaveTela] = normalizada
    }

    return mapa
  }

  if (!origem || typeof origem !== 'object') {
    return mapa
  }

  for (const [chave, preferencia] of Object.entries(origem)) {
    const normalizada = normalizarPreferenciaTela(preferencia, chave)
    mapa[normalizada.chaveTela] = normalizada
  }

  return mapa
}

export function criarPayloadPreferenciaTela(preferencia = {}, chaveFallback = CHAVE_TELA_DASHBOARD) {
  const normalizada = normalizarPreferenciaTela(preferencia, chaveFallback)

  return {
    chaveTela: normalizada.chaveTela,
    modoVisualizacao: normalizada.modoVisualizacao,
    itensPorPagina: normalizada.itensPorPagina,
    ordenacaoCampo: normalizada.ordenacaoCampo,
    ordenacaoDirecao: normalizada.ordenacaoDirecao,
    colunasVisiveis: [...normalizada.colunasVisiveis],
    filtrosSalvos: { ...normalizada.filtrosSalvos },
    fixarFiltros: normalizada.fixarFiltros,
    compactarCards: normalizada.compactarCards,
  }
}

export function normalizarOpcoesPreferenciasTelasBackend(resposta = {}) {
  const origem = extrairOpcoesPreferenciasTelasResposta(resposta)
  const fallback = criarOpcoesPreferenciasTelasFallback()
  const chavesTelas = TELAS_PREFERENCIAS_SUPORTADAS.map((tela) => tela.chave)
  const telas = normalizarOpcoesValorNome(origem.telas ?? origem.chavesTela, chavesTelas, normalizarChaveTela)
  const modosVisualizacao = normalizarOpcoesValorNome(
    origem.modosVisualizacao,
    MODOS_VISUALIZACAO_VALIDOS,
    normalizarModoVisualizacao,
  )
  const itensPorPagina = normalizarOpcoesValorNome(
    origem.itensPorPagina,
    ITENS_POR_PAGINA_TELAS_VALIDOS,
    normalizarItensPorPaginaTela,
  )
  const ordenacoesDirecao = normalizarOpcoesValorNome(
    origem.ordenacoesDirecao ?? origem.ordenacaoDirecao,
    ORDENACOES_DIRECAO_VALIDAS,
    normalizarOrdenacaoDirecao,
  )
  const valido =
    telas.length === fallback.telas.length &&
    modosVisualizacao.length === fallback.modosVisualizacao.length &&
    itensPorPagina.length === fallback.itensPorPagina.length &&
    ordenacoesDirecao.length === fallback.ordenacoesDirecao.length

  if (!valido) {
    return { valido: false, opcoes: fallback }
  }

  return {
    valido: true,
    opcoes: {
      telas,
      modosVisualizacao,
      itensPorPagina,
      ordenacoesDirecao,
      colunasPorTela: fallback.colunasPorTela,
    },
  }
}

export function obterPreferenciaTela(chaveTela = CHAVE_TELA_DASHBOARD, mapaPreferencias = preferenciasTelas.value) {
  const chave = normalizarChaveTela(chaveTela)
  return normalizarPreferenciaTela(mapaPreferencias?.[chave] || {}, chave)
}

export function lerStatusPreferenciasTelasLocais() {
  const storage = obterLocalStorageSeguro()
  return normalizarStatusSincronizacao(storage?.getItem(CHAVE_PREFERENCIAS_TELAS_STATUS))
}

export function lerPreferenciasTelasLocais() {
  const preferenciasSalvas = lerJsonLocal(CHAVE_PREFERENCIAS_TELAS)
  return normalizarPreferenciasTelas(preferenciasSalvas && typeof preferenciasSalvas === 'object' ? preferenciasSalvas : {})
}

export function salvarPreferenciasTelasLocais(
  preferencias = {},
  { origem = ORIGEM_PREFERENCIAS_TELAS_LOCAL, status = STATUS_SINCRONIZACAO_TELAS_LOCAL } = {},
) {
  const normalizadas = normalizarPreferenciasTelas(preferencias)
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_PREFERENCIAS_TELAS, JSON.stringify(normalizadas))
    storage.setItem(CHAVE_PREFERENCIAS_TELAS_STATUS, normalizarStatusSincronizacao(status))
  }

  preferenciasTelas.value = normalizadas
  origemPreferenciasTelas.value = origem

  return normalizadas
}

export function salvarPreferenciaTelaLocal(
  chaveTela,
  preferencia = {},
  { origem = ORIGEM_PREFERENCIAS_TELAS_LOCAL, status = STATUS_SINCRONIZACAO_TELAS_LOCAL } = {},
) {
  const chave = normalizarChaveTela(chaveTela)
  const normalizada = normalizarPreferenciaTela({ ...preferencia, chaveTela: chave }, chave)

  return salvarPreferenciasTelasLocais(
    {
      ...preferenciasTelas.value,
      [chave]: normalizada,
    },
    { origem, status },
  )[chave]
}

export function resetarPreferenciaTelaLocal(chaveTela) {
  const chave = normalizarChaveTela(chaveTela)
  return salvarPreferenciaTelaLocal(chave, criarPreferenciaTelaPadrao(chave), {
    origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
    status: STATUS_SINCRONIZACAO_TELAS_LOCAL,
  })
}

export function resetarPreferenciasTelasLocais() {
  return salvarPreferenciasTelasLocais({}, {
    origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
    status: STATUS_SINCRONIZACAO_TELAS_LOCAL,
  })
}

export function obterResumoSincronizacaoTelas({
  estado = estadoSincronizacaoTelas.value,
  origem = origemPreferenciasTelas.value,
  mensagem = mensagemSincronizacaoTelas.value,
} = {}) {
  if (estado === STATUS_SINCRONIZACAO_TELAS_ERRO) {
    return {
      rotulo: 'Erro ao sincronizar',
      detalhe: mensagem || 'As preferencias por tela ficaram salvas neste navegador.',
      tipo: 'erro',
    }
  }

  if (estado === STATUS_SINCRONIZACAO_TELAS_CARREGANDO || estado === STATUS_SINCRONIZACAO_TELAS_SALVANDO) {
    return {
      rotulo: 'Sincronizando',
      detalhe: mensagem || 'Atualizando preferencias por tela.',
      tipo: 'carregando',
    }
  }

  if (origem === ORIGEM_PREFERENCIAS_TELAS_BACKEND) {
    return {
      rotulo: 'Sincronizado',
      detalhe: mensagem || 'Preferencias por tela vinculadas ao seu usuario.',
      tipo: 'sucesso',
    }
  }

  return {
    rotulo: 'Salvo localmente',
    detalhe: mensagem || 'Preferencias por tela salvas apenas neste navegador.',
    tipo: 'local',
  }
}

export async function carregarOpcoesPreferenciasTelasBackend(buscarOpcoesPreferenciasTelas) {
  if (typeof buscarOpcoesPreferenciasTelas !== 'function') {
    opcoesPreferenciasTelas.value = criarOpcoesPreferenciasTelasFallback()
    origemOpcoesPreferenciasTelas.value = ORIGEM_OPCOES_TELAS_LOCAL
    return opcoesPreferenciasTelas.value
  }

  try {
    const resposta = await buscarOpcoesPreferenciasTelas()
    const { valido, opcoes } = normalizarOpcoesPreferenciasTelasBackend(resposta)

    opcoesPreferenciasTelas.value = opcoes
    origemOpcoesPreferenciasTelas.value = valido ? ORIGEM_OPCOES_TELAS_BACKEND : ORIGEM_OPCOES_TELAS_LOCAL
    return opcoesPreferenciasTelas.value
  } catch (error) {
    console.error(error)
    opcoesPreferenciasTelas.value = criarOpcoesPreferenciasTelasFallback()
    origemOpcoesPreferenciasTelas.value = ORIGEM_OPCOES_TELAS_LOCAL
    return opcoesPreferenciasTelas.value
  }
}

export async function carregarPreferenciasTelasBackend(buscarPreferenciasTelas, buscarOpcoesPreferenciasTelas) {
  await carregarOpcoesPreferenciasTelasBackend(buscarOpcoesPreferenciasTelas)

  if (typeof buscarPreferenciasTelas !== 'function') {
    const preferencias = salvarPreferenciasTelasLocais(lerPreferenciasTelasLocais(), {
      origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
      status: STATUS_SINCRONIZACAO_TELAS_LOCAL,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_LOCAL)
    return preferencias
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_CARREGANDO, 'Carregando preferencias por tela...')

  try {
    const resposta = await buscarPreferenciasTelas()
    const preferencias = salvarPreferenciasTelasLocais(normalizarPreferenciasTelas(resposta), {
      origem: ORIGEM_PREFERENCIAS_TELAS_BACKEND,
      status: STATUS_SINCRONIZACAO_TELAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVO, 'Preferencias por tela sincronizadas.')
    return preferencias
  } catch (error) {
    console.error(error)
    const preferencias = salvarPreferenciasTelasLocais(lerPreferenciasTelasLocais(), {
      origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
      status: STATUS_SINCRONIZACAO_TELAS_ERRO,
    })
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_TELAS_ERRO,
      'Nao foi possivel sincronizar as preferencias por tela. Usando o que esta salvo neste navegador.',
    )
    return preferencias
  }
}

export async function salvarPreferenciaTelaBackend(chaveTela, preferencia, salvarPreferenciaTela) {
  const chave = normalizarChaveTela(chaveTela)
  const local = salvarPreferenciaTelaLocal(chave, preferencia, {
    origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
    status: STATUS_SINCRONIZACAO_TELAS_LOCAL,
  })

  if (typeof salvarPreferenciaTela !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_LOCAL)
    return local
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVANDO, 'Salvando preferencias por tela...')

  try {
    const resposta = await salvarPreferenciaTela(chave, criarPayloadPreferenciaTela(local, chave))
    const origem = resposta && typeof resposta === 'object' ? resposta : local
    const sincronizada = salvarPreferenciaTelaLocal(chave, {
      ...local,
      ...normalizarPreferenciaTela(extrairPreferenciasTelasResposta(origem), chave),
    }, {
      origem: ORIGEM_PREFERENCIAS_TELAS_BACKEND,
      status: STATUS_SINCRONIZACAO_TELAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVO, 'Preferencias por tela salvas.')
    return sincronizada
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_TELAS_ERRO,
      'Nao foi possivel sincronizar. As preferencias ficaram salvas neste navegador.',
    )
    return local
  }
}

export async function resetarPreferenciaTelaBackend(chaveTela, resetarPreferenciaTela) {
  const chave = normalizarChaveTela(chaveTela)
  const padrao = resetarPreferenciaTelaLocal(chave)

  if (typeof resetarPreferenciaTela !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_LOCAL)
    return padrao
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVANDO, 'Restaurando preferencias da tela...')

  try {
    const resposta = await resetarPreferenciaTela(chave)
    const origem = resposta && typeof resposta === 'object' ? resposta : padrao
    const sincronizada = salvarPreferenciaTelaLocal(chave, {
      ...padrao,
      ...normalizarPreferenciaTela(extrairPreferenciasTelasResposta(origem), chave),
    }, {
      origem: ORIGEM_PREFERENCIAS_TELAS_BACKEND,
      status: STATUS_SINCRONIZACAO_TELAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVO, 'Preferencias da tela restauradas.')
    return sincronizada
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_TELAS_ERRO,
      'Nao foi possivel sincronizar a restauracao. O padrao ficou salvo neste navegador.',
    )
    return padrao
  }
}

export async function resetarPreferenciasTelasBackend(resetarPreferenciasTelas) {
  const locais = resetarPreferenciasTelasLocais()

  if (typeof resetarPreferenciasTelas !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVANDO, 'Restaurando preferencias por tela...')

  try {
    const resposta = await resetarPreferenciasTelas()
    const origem = resposta && typeof resposta === 'object' ? normalizarPreferenciasTelas(resposta) : locais
    const sincronizadas = salvarPreferenciasTelasLocais(origem, {
      origem: ORIGEM_PREFERENCIAS_TELAS_BACKEND,
      status: STATUS_SINCRONIZACAO_TELAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_TELAS_SALVO, 'Preferencias por tela restauradas.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_TELAS_ERRO,
      'Nao foi possivel sincronizar a restauracao. As preferencias locais foram limpas neste navegador.',
    )
    return locais
  }
}
