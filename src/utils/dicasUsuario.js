import { ref } from 'vue'

export const CHAVE_DICAS_USUARIO = 'dicasUsuario'
export const CHAVE_DICAS_USUARIO_STATUS = 'dicasUsuarioStatus'

export const STATUS_DICA_NAO_VISUALIZADA = 'NAO_VISUALIZADA'
export const STATUS_DICA_VISUALIZADA = 'VISUALIZADA'
export const STATUS_DICA_DISPENSADA = 'DISPENSADA'

export const STATUS_SINCRONIZACAO_DICAS_IDLE = 'idle'
export const STATUS_SINCRONIZACAO_DICAS_CARREGANDO = 'carregando'
export const STATUS_SINCRONIZACAO_DICAS_SALVANDO = 'salvando'
export const STATUS_SINCRONIZACAO_DICAS_SALVO = 'salvo'
export const STATUS_SINCRONIZACAO_DICAS_ERRO = 'erro'
export const STATUS_SINCRONIZACAO_DICAS_LOCAL = 'local'

export const ORIGEM_DICAS_USUARIO_BACKEND = 'backend'
export const ORIGEM_DICAS_USUARIO_LOCAL = 'localStorage'
export const ORIGEM_OPCOES_DICAS_BACKEND = 'backend'
export const ORIGEM_OPCOES_DICAS_LOCAL = 'local'

export const STATUS_DICAS_VALIDOS = Object.freeze([
  STATUS_DICA_NAO_VISUALIZADA,
  STATUS_DICA_VISUALIZADA,
  STATUS_DICA_DISPENSADA,
])

export const STATUS_SINCRONIZACAO_DICAS_VALIDOS = Object.freeze([
  STATUS_SINCRONIZACAO_DICAS_IDLE,
  STATUS_SINCRONIZACAO_DICAS_CARREGANDO,
  STATUS_SINCRONIZACAO_DICAS_SALVANDO,
  STATUS_SINCRONIZACAO_DICAS_SALVO,
  STATUS_SINCRONIZACAO_DICAS_ERRO,
  STATUS_SINCRONIZACAO_DICAS_LOCAL,
])

export const CATALOGO_DICAS_USUARIO_LOCAL = Object.freeze([
  criarDicaCatalogo('BOAS_VINDAS_DASHBOARD', 'Boas-vindas ao dashboard', 'Veja os principais indicadores da empresa e acompanhe os próximos passos do dia.', 'Conta e sistema', 'Abrir dashboard', '/'),
  criarDicaCatalogo('CONFIGURAR_APARENCIA', 'Configure a aparência', 'Escolha tema, densidade e preferências visuais para deixar o sistema mais confortável.', 'Minha conta', 'Abrir aparência', '/minha-conta'),
  criarDicaCatalogo('CONFIGURAR_PREFERENCIAS_USO', 'Ajuste suas preferências de uso', 'Defina página inicial, módulo preferido e alertas para acelerar sua rotina.', 'Minha conta', 'Abrir preferências de uso', '/minha-conta'),
  criarDicaCatalogo('CONFIGURAR_PREFERENCIAS_TELA', 'Configure preferências por tela', 'Personalize visualização, ordenação e colunas das áreas que você usa com frequência.', 'Minha conta', 'Abrir preferências por tela', '/minha-conta'),
  criarDicaCatalogo('PERSONALIZAR_PAGINA_PUBLICA', 'Personalize a página pública', 'Revise identidade, textos e links públicos antes de divulgar seus canais.', 'Público', 'Abrir minha empresa', '/minha-empresa'),
  criarDicaCatalogo('CONFIGURAR_AGENDA_PUBLICA', 'Configure a agenda pública', 'Organize serviços, horários e profissionais para receber agendamentos online.', 'Agendamento', 'Abrir agenda', '/agenda'),
  criarDicaCatalogo('CADASTRAR_CLIENTES', 'Cadastre clientes', 'Mantenha dados de contato atualizados para agilizar agendamentos e atendimentos.', 'Clientes', 'Abrir clientes', '/clientes'),
  criarDicaCatalogo('CADASTRAR_SERVICOS', 'Cadastre serviços', 'Defina duração, preço e status dos serviços oferecidos pela empresa.', 'Agendamento', 'Abrir serviços', '/servicos'),
  criarDicaCatalogo('ORGANIZAR_ESTOQUE', 'Organize o estoque', 'Acompanhe produtos, quantidades e movimentações para evitar faltas na operação.', 'Estoque', 'Abrir estoque', '/estoque'),
  criarDicaCatalogo('USAR_CATALOGO_PUBLICO', 'Use o catálogo público', 'Divulgue produtos e itens ativos em uma página simples para seus clientes.', 'Catálogo', 'Abrir catálogo público', '/catalogo-publico'),
  criarDicaCatalogo('GESTAO_ESPORTIVA_TURMAS', 'Organize turmas esportivas', 'Cadastre turmas recorrentes com professor, nível e capacidade conforme sua operação.', 'Gestão Esportiva', 'Abrir turmas', '/beach-tennis/turmas'),
  criarDicaCatalogo('GESTAO_ESPORTIVA_FREQUENCIA', 'Acompanhe frequência esportiva', 'Use aulas concretas para registrar presenças, ausências e reposições quando aplicável.', 'Gestão Esportiva', 'Abrir aulas', '/gestao-esportiva/aulas'),
  criarDicaCatalogo('CENTRAL_NOTIFICACOES', 'Acompanhe notificações', 'Use a central para ver alertas importantes sem perder atualizações do sistema.', 'Conta e sistema', 'Abrir notificações', '/notificacoes'),
  criarDicaCatalogo('AUDITORIA_E_LIXEIRA', 'Consulte auditoria e lixeira', 'Revise eventos e registros removidos quando precisar conferir alterações sensíveis.', 'Conta e sistema', 'Abrir auditoria', '/auditoria'),
  criarDicaCatalogo('SEGURANCA_MINHA_CONTA', 'Reforce a segurança da conta', 'Mantenha e-mail, login e senha atualizados para proteger o acesso ao sistema.', 'Minha conta', 'Abrir segurança', '/minha-conta'),
])

const DICAS_LOCAIS_POR_CHAVE = new Map(CATALOGO_DICAS_USUARIO_LOCAL.map((dica) => [dica.chaveDica, dica]))

export const dicasUsuario = ref(obterCatalogoDicasUsuarioLocal())
export const resumoDicasUsuario = ref(montarResumoDicasUsuario(dicasUsuario.value))
export const estadoSincronizacaoDicas = ref(STATUS_SINCRONIZACAO_DICAS_IDLE)
export const mensagemSincronizacaoDicas = ref('')
export const origemDicasUsuario = ref(ORIGEM_DICAS_USUARIO_LOCAL)
export const opcoesDicasUsuario = ref(obterOpcoesDicasUsuarioFallback())
export const origemOpcoesDicasUsuario = ref(ORIGEM_OPCOES_DICAS_LOCAL)

function criarDicaCatalogo(chaveDica, titulo, descricao, modulo, acaoLabel = '', acaoRota = '') {
  return Object.freeze({
    chaveDica,
    titulo,
    descricao,
    modulo,
    acaoLabel,
    acaoRota,
    status: STATUS_DICA_NAO_VISUALIZADA,
    visualizacoes: 0,
    atualizadoEm: '',
    visualizadaEm: '',
    dispensadaEm: '',
  })
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

function normalizarCodigo(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

function normalizarTexto(valor, fallback = '') {
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

function normalizarNumeroInteiro(valor, fallback = 0) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return Number.isFinite(numero) && numero >= 0 ? numero : fallback
}

function normalizarData(valor) {
  return String(valor || '').trim()
}

function salvarStatusDicasUsuarioLocais(status) {
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_DICAS_USUARIO_STATUS, normalizarStatusSincronizacaoDicas(status))
  }
}

function definirEstadoSincronizacao(estado, mensagem = '') {
  estadoSincronizacaoDicas.value = normalizarStatusSincronizacaoDicas(estado)
  mensagemSincronizacaoDicas.value = mensagem
  salvarStatusDicasUsuarioLocais(estadoSincronizacaoDicas.value)
}

function atualizarEstadoDicas(dicas, { origem = ORIGEM_DICAS_USUARIO_LOCAL, status = STATUS_SINCRONIZACAO_DICAS_LOCAL } = {}) {
  const normalizadas = mergeDicasUsuarioComCatalogo(dicas)
  dicasUsuario.value = normalizadas
  resumoDicasUsuario.value = montarResumoDicasUsuario(normalizadas)
  origemDicasUsuario.value = origem

  const storage = obterLocalStorageSeguro()
  if (storage) {
    storage.setItem(CHAVE_DICAS_USUARIO, JSON.stringify(normalizadas))
    storage.setItem(CHAVE_DICAS_USUARIO_STATUS, normalizarStatusSincronizacaoDicas(status))
  }

  return normalizadas
}

function extrairDicasResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return []
  }

  if (Array.isArray(resposta)) {
    return resposta
  }

  if (Array.isArray(resposta.data)) {
    return resposta.data
  }

  if (Array.isArray(resposta.dicas)) {
    return resposta.dicas
  }

  if (Array.isArray(resposta.itens)) {
    return resposta.itens
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data.dicas ?? resposta.data.itens ?? resposta.data.content ?? []
  }

  return []
}

function extrairOpcoesResposta(resposta) {
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

function aplicarAcaoLocal(chaveDica, transformar) {
  const chave = normalizarChaveDica(chaveDica)

  if (!dicasUsuario.value.some((dica) => dica.chaveDica === chave)) {
    return dicasUsuario.value
  }

  const proximas = dicasUsuario.value.map((dica) => (dica.chaveDica === chave ? transformar(dica) : dica))
  return atualizarEstadoDicas(proximas, {
    origem: ORIGEM_DICAS_USUARIO_LOCAL,
    status: STATUS_SINCRONIZACAO_DICAS_LOCAL,
  })
}

export function obterCatalogoDicasUsuarioLocal() {
  return CATALOGO_DICAS_USUARIO_LOCAL.map((dica) => ({ ...dica }))
}

export function normalizarChaveDica(valor) {
  return normalizarCodigo(valor)
}

export function normalizarStatusDica(valor) {
  const status = normalizarCodigo(valor)
  return STATUS_DICAS_VALIDOS.includes(status) ? status : STATUS_DICA_NAO_VISUALIZADA
}

export function normalizarStatusSincronizacaoDicas(valor) {
  const texto = String(valor || '').trim().toLowerCase()
  return STATUS_SINCRONIZACAO_DICAS_VALIDOS.includes(texto) ? texto : STATUS_SINCRONIZACAO_DICAS_IDLE
}

export function normalizarDicaUsuario(dica = {}, fallback = null) {
  const origem = dica && typeof dica === 'object' ? dica : {}
  const chave = normalizarChaveDica(origem.chaveDica ?? origem.chave ?? origem.codigo)
  const dicaFallback = fallback || DICAS_LOCAIS_POR_CHAVE.get(chave) || null

  if (!chave && !dicaFallback) {
    return null
  }

  const chaveFinal = dicaFallback?.chaveDica || chave
  const tituloFallback = dicaFallback?.titulo || chaveFinal

  return {
    chaveDica: chaveFinal,
    titulo: normalizarTexto(origem.titulo ?? origem.nome, tituloFallback),
    descricao: normalizarTexto(origem.descricao ?? origem.texto, dicaFallback?.descricao || 'Dica disponível para sua conta.'),
    modulo: normalizarTexto(origem.modulo ?? origem.categoria, dicaFallback?.modulo || 'Geral'),
    status: normalizarStatusDica(origem.status),
    visualizacoes: normalizarNumeroInteiro(origem.visualizacoes ?? origem.quantidadeVisualizacoes, dicaFallback?.visualizacoes || 0),
    acaoLabel: normalizarTexto(origem.acaoLabel ?? origem.rotuloAcao, dicaFallback?.acaoLabel || 'Ver dica'),
    acaoRota: normalizarTexto(origem.acaoRota ?? origem.rota ?? origem.linkInterno, dicaFallback?.acaoRota || ''),
    atualizadoEm: normalizarData(origem.atualizadoEm),
    visualizadaEm: normalizarData(origem.visualizadaEm),
    dispensadaEm: normalizarData(origem.dispensadaEm),
  }
}

export function mergeDicasUsuarioComCatalogo(resposta = []) {
  const entradas = extrairDicasResposta(resposta)
  const backendPorChave = new Map()
  const extras = []

  for (const entrada of entradas) {
    const normalizada = normalizarDicaUsuario(entrada)

    if (!normalizada?.chaveDica) {
      continue
    }

    if (DICAS_LOCAIS_POR_CHAVE.has(normalizada.chaveDica)) {
      backendPorChave.set(normalizada.chaveDica, normalizada)
    } else {
      extras.push(normalizada)
    }
  }

  const locais = CATALOGO_DICAS_USUARIO_LOCAL.map((dicaLocal) =>
    normalizarDicaUsuario(backendPorChave.get(dicaLocal.chaveDica) || {}, dicaLocal),
  )

  return [...locais, ...extras]
}

export function montarResumoDicasUsuario(dicas = []) {
  const lista = Array.isArray(dicas) ? dicas.map((dica) => normalizarDicaUsuario(dica)).filter(Boolean) : []
  const resumo = {
    total: lista.length,
    naoVisualizadas: 0,
    visualizadas: 0,
    dispensadas: 0,
    pendentes: 0,
  }

  for (const dica of lista) {
    if (dica.status === STATUS_DICA_VISUALIZADA) {
      resumo.visualizadas += 1
    } else if (dica.status === STATUS_DICA_DISPENSADA) {
      resumo.dispensadas += 1
    } else {
      resumo.naoVisualizadas += 1
    }
  }

  resumo.pendentes = resumo.naoVisualizadas
  return resumo
}

export function obterOpcoesDicasUsuarioFallback() {
  const modulos = [...new Set(CATALOGO_DICAS_USUARIO_LOCAL.map((dica) => dica.modulo))].sort()

  return {
    modulos: modulos.map((modulo) => ({ valor: modulo, nome: modulo })),
    status: [
      { valor: STATUS_DICA_NAO_VISUALIZADA, nome: 'Não visualizadas' },
      { valor: STATUS_DICA_VISUALIZADA, nome: 'Visualizadas' },
      { valor: STATUS_DICA_DISPENSADA, nome: 'Dispensadas' },
    ],
  }
}

export function normalizarOpcoesDicasUsuarioBackend(resposta = {}) {
  const origem = extrairOpcoesResposta(resposta)
  const fallback = obterOpcoesDicasUsuarioFallback()
  const modulosOrigem = Array.isArray(origem.modulos) ? origem.modulos : []
  const statusOrigem = Array.isArray(origem.status) ? origem.status : []
  const modulos = modulosOrigem
    .map((opcao) => {
      const valor = typeof opcao === 'object' ? normalizarTexto(opcao.valor ?? opcao.nome) : normalizarTexto(opcao)
      const nome = typeof opcao === 'object' ? normalizarTexto(opcao.nome ?? opcao.label, valor) : valor
      return valor && nome ? { valor, nome } : null
    })
    .filter(Boolean)
  const status = statusOrigem
    .map((opcao) => {
      const valor = normalizarStatusDica(typeof opcao === 'object' ? opcao.valor ?? opcao.codigo : opcao)
      const nome = typeof opcao === 'object' ? normalizarTexto(opcao.nome ?? opcao.label, valor) : valor
      return { valor, nome }
    })
    .filter((opcao, indice, lista) => STATUS_DICAS_VALIDOS.includes(opcao.valor) && lista.findIndex((item) => item.valor === opcao.valor) === indice)

  if (!modulos.length || status.length !== STATUS_DICAS_VALIDOS.length) {
    return { valido: false, opcoes: fallback }
  }

  return { valido: true, opcoes: { modulos, status } }
}

export function lerStatusDicasUsuarioLocais() {
  const storage = obterLocalStorageSeguro()
  return normalizarStatusSincronizacaoDicas(storage?.getItem(CHAVE_DICAS_USUARIO_STATUS))
}

export function lerDicasUsuarioLocais() {
  const salvas = lerJsonLocal(CHAVE_DICAS_USUARIO)
  return mergeDicasUsuarioComCatalogo(salvas && typeof salvas === 'object' ? salvas : [])
}

export function salvarDicasUsuarioLocais(
  dicas = [],
  { origem = ORIGEM_DICAS_USUARIO_LOCAL, status = STATUS_SINCRONIZACAO_DICAS_LOCAL } = {},
) {
  return atualizarEstadoDicas(dicas, { origem, status })
}

export function marcarDicaUsuarioVisualizadaLocal(chaveDica) {
  return aplicarAcaoLocal(chaveDica, (dica) => ({
    ...dica,
    status: STATUS_DICA_VISUALIZADA,
    visualizacoes: dica.visualizacoes + 1,
    visualizadaEm: dica.visualizadaEm || new Date().toISOString(),
    dispensadaEm: '',
  }))
}

export function dispensarDicaUsuarioLocal(chaveDica) {
  return aplicarAcaoLocal(chaveDica, (dica) => ({
    ...dica,
    status: STATUS_DICA_DISPENSADA,
    dispensadaEm: dica.dispensadaEm || new Date().toISOString(),
  }))
}

export function reativarDicaUsuarioLocal(chaveDica) {
  return aplicarAcaoLocal(chaveDica, (dica) => ({
    ...dica,
    status: STATUS_DICA_NAO_VISUALIZADA,
    dispensadaEm: '',
  }))
}

export function resetarDicasUsuarioLocais() {
  return atualizarEstadoDicas(obterCatalogoDicasUsuarioLocal(), {
    origem: ORIGEM_DICAS_USUARIO_LOCAL,
    status: STATUS_SINCRONIZACAO_DICAS_LOCAL,
  })
}

export function obterResumoSincronizacaoDicas({
  estado = estadoSincronizacaoDicas.value,
  origem = origemDicasUsuario.value,
  mensagem = mensagemSincronizacaoDicas.value,
} = {}) {
  if (estado === STATUS_SINCRONIZACAO_DICAS_ERRO) {
    return {
      rotulo: 'Erro ao sincronizar',
      detalhe: mensagem || 'As dicas ficaram salvas neste navegador.',
      tipo: 'erro',
    }
  }

  if (estado === STATUS_SINCRONIZACAO_DICAS_CARREGANDO || estado === STATUS_SINCRONIZACAO_DICAS_SALVANDO) {
    return {
      rotulo: 'Sincronizando',
      detalhe: mensagem || 'Atualizando dicas.',
      tipo: 'carregando',
    }
  }

  if (origem === ORIGEM_DICAS_USUARIO_BACKEND) {
    return {
      rotulo: 'Sincronizado',
      detalhe: mensagem || 'Dicas vinculadas ao seu usuário.',
      tipo: 'sucesso',
    }
  }

  return {
    rotulo: 'Salvo localmente',
    detalhe: mensagem || 'Dicas salvas apenas neste navegador.',
    tipo: 'local',
  }
}

export async function carregarOpcoesDicasUsuarioBackend(buscarOpcoesDicasUsuario) {
  if (typeof buscarOpcoesDicasUsuario !== 'function') {
    opcoesDicasUsuario.value = obterOpcoesDicasUsuarioFallback()
    origemOpcoesDicasUsuario.value = ORIGEM_OPCOES_DICAS_LOCAL
    return opcoesDicasUsuario.value
  }

  try {
    const resposta = await buscarOpcoesDicasUsuario()
    const { valido, opcoes } = normalizarOpcoesDicasUsuarioBackend(resposta)
    opcoesDicasUsuario.value = opcoes
    origemOpcoesDicasUsuario.value = valido ? ORIGEM_OPCOES_DICAS_BACKEND : ORIGEM_OPCOES_DICAS_LOCAL
    return opcoesDicasUsuario.value
  } catch (error) {
    console.error(error)
    opcoesDicasUsuario.value = obterOpcoesDicasUsuarioFallback()
    origemOpcoesDicasUsuario.value = ORIGEM_OPCOES_DICAS_LOCAL
    return opcoesDicasUsuario.value
  }
}

export async function carregarDicasUsuarioBackend(buscarDicasUsuario, buscarOpcoesDicasUsuario) {
  await carregarOpcoesDicasUsuarioBackend(buscarOpcoesDicasUsuario)

  if (typeof buscarDicasUsuario !== 'function') {
    const dicas = salvarDicasUsuarioLocais(lerDicasUsuarioLocais(), {
      origem: ORIGEM_DICAS_USUARIO_LOCAL,
      status: STATUS_SINCRONIZACAO_DICAS_LOCAL,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_LOCAL)
    return dicas
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_CARREGANDO, 'Carregando dicas...')

  try {
    const resposta = await buscarDicasUsuario()
    const dicas = salvarDicasUsuarioLocais(mergeDicasUsuarioComCatalogo(resposta), {
      origem: ORIGEM_DICAS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_DICAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVO, 'Dicas sincronizadas.')
    return dicas
  } catch (error) {
    console.error(error)
    const dicas = salvarDicasUsuarioLocais(lerDicasUsuarioLocais(), {
      origem: ORIGEM_DICAS_USUARIO_LOCAL,
      status: STATUS_SINCRONIZACAO_DICAS_ERRO,
    })
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_DICAS_ERRO,
      'Não foi possível sincronizar as dicas. Usando o que está salvo neste navegador.',
    )
    return dicas
  }
}

export async function marcarDicaUsuarioVisualizadaBackend(chaveDica, marcarVisualizada) {
  const locais = marcarDicaUsuarioVisualizadaLocal(chaveDica)

  if (typeof marcarVisualizada !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVANDO, 'Salvando dica visualizada...')

  try {
    const resposta = await marcarVisualizada(normalizarChaveDica(chaveDica))
    const sincronizadas = salvarDicasUsuarioLocais(mergeDicasUsuarioComCatalogo(resposta?.dicas ? resposta : locais), {
      origem: ORIGEM_DICAS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_DICAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVO, 'Dica marcada como vista.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_ERRO, 'A dica ficou salva neste navegador.')
    return locais
  }
}

export async function dispensarDicaUsuarioBackend(chaveDica, dispensarDica) {
  const locais = dispensarDicaUsuarioLocal(chaveDica)

  if (typeof dispensarDica !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVANDO, 'Dispensando dica...')

  try {
    const resposta = await dispensarDica(normalizarChaveDica(chaveDica))
    const sincronizadas = salvarDicasUsuarioLocais(mergeDicasUsuarioComCatalogo(resposta?.dicas ? resposta : locais), {
      origem: ORIGEM_DICAS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_DICAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVO, 'Dica dispensada.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_ERRO, 'A dica ficou dispensada neste navegador.')
    return locais
  }
}

export async function reativarDicaUsuarioBackend(chaveDica, reativarDica) {
  const locais = reativarDicaUsuarioLocal(chaveDica)

  if (typeof reativarDica !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVANDO, 'Reativando dica...')

  try {
    const resposta = await reativarDica(normalizarChaveDica(chaveDica))
    const sincronizadas = salvarDicasUsuarioLocais(mergeDicasUsuarioComCatalogo(resposta?.dicas ? resposta : locais), {
      origem: ORIGEM_DICAS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_DICAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVO, 'Dica reativada.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_ERRO, 'A dica ficou reativada neste navegador.')
    return locais
  }
}

export async function resetarDicasUsuarioBackend(resetarDicas) {
  const locais = resetarDicasUsuarioLocais()

  if (typeof resetarDicas !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVANDO, 'Resetando dicas...')

  try {
    const resposta = await resetarDicas()
    const sincronizadas = salvarDicasUsuarioLocais(mergeDicasUsuarioComCatalogo(resposta?.dicas ? resposta : locais), {
      origem: ORIGEM_DICAS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_DICAS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_SALVO, 'Dicas resetadas.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_DICAS_ERRO, 'As dicas locais foram resetadas neste navegador.')
    return locais
  }
}
