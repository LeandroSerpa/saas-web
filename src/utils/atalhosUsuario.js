import { ref } from 'vue'

export const CHAVE_ATALHOS_USUARIO = 'atalhosUsuario'
export const CHAVE_ATALHOS_USUARIO_PERSONALIZADOS = 'atalhosUsuarioPersonalizados'
export const CHAVE_ATALHOS_USUARIO_STATUS = 'atalhosUsuarioStatus'

export const STATUS_SINCRONIZACAO_ATALHOS_IDLE = 'idle'
export const STATUS_SINCRONIZACAO_ATALHOS_CARREGANDO = 'carregando'
export const STATUS_SINCRONIZACAO_ATALHOS_SALVANDO = 'salvando'
export const STATUS_SINCRONIZACAO_ATALHOS_SALVO = 'salvo'
export const STATUS_SINCRONIZACAO_ATALHOS_ERRO = 'erro'
export const STATUS_SINCRONIZACAO_ATALHOS_LOCAL = 'local'

export const ORIGEM_ATALHOS_USUARIO_BACKEND = 'backend'
export const ORIGEM_ATALHOS_USUARIO_LOCAL = 'localStorage'
export const ORIGEM_OPCOES_ATALHOS_BACKEND = 'backend'
export const ORIGEM_OPCOES_ATALHOS_LOCAL = 'local'

export const MODULO_ATALHO_GERAL = 'GERAL'
export const TIPO_ATALHO_TELA = 'TELA'

export const MODULOS_ATALHOS_VALIDOS = Object.freeze([
  MODULO_ATALHO_GERAL,
  'CONTA',
  'AGENDAMENTO',
  'CLIENTES',
  'SERVICOS',
  'FUNCIONARIOS',
  'ESTOQUE',
  'PUBLICO',
  'SISTEMA',
  'ESPORTIVO',
  'ADMIN',
])

export const TIPOS_ATALHOS_VALIDOS = Object.freeze([
  TIPO_ATALHO_TELA,
  'ACAO',
  'CONFIGURACAO',
  'RELATORIO',
])

export const STATUS_SINCRONIZACAO_ATALHOS_VALIDOS = Object.freeze([
  STATUS_SINCRONIZACAO_ATALHOS_IDLE,
  STATUS_SINCRONIZACAO_ATALHOS_CARREGANDO,
  STATUS_SINCRONIZACAO_ATALHOS_SALVANDO,
  STATUS_SINCRONIZACAO_ATALHOS_SALVO,
  STATUS_SINCRONIZACAO_ATALHOS_ERRO,
  STATUS_SINCRONIZACAO_ATALHOS_LOCAL,
])

export const CATALOGO_ATALHOS_USUARIO_LOCAL = Object.freeze([
  criarAtalhoCatalogo('DASHBOARD', 'Dashboard', 'Acompanhe os indicadores principais da empresa.', 'GERAL', 'TELA', '/dashboard', 'D'),
  criarAtalhoCatalogo('MINHA_CONTA', 'Minha conta', 'Atualize dados, senha e preferencias do seu usuario.', 'CONTA', 'TELA', '/minha-conta', 'C'),
  criarAtalhoCatalogo('MINHA_EMPRESA', 'Minha empresa', 'Revise dados, canais e configuracoes da empresa.', 'CONTA', 'TELA', '/minha-empresa', 'E'),
  criarAtalhoCatalogo('AJUDA', 'Ajuda', 'Consulte orientacoes e novidades do sistema.', 'SISTEMA', 'TELA', '/ajuda', '?'),
  criarAtalhoCatalogo('CLIENTES', 'Clientes', 'Acesse a base de clientes e alunos.', 'CLIENTES', 'TELA', '/clientes', 'CL'),
  criarAtalhoCatalogo('NOVO_CLIENTE', 'Novo cliente', 'Abra a area de clientes para cadastrar um novo contato.', 'CLIENTES', 'ACAO', '/clientes', '+C'),
  criarAtalhoCatalogo('AGENDAMENTOS', 'Agenda', 'Veja e organize os agendamentos.', 'AGENDAMENTO', 'TELA', '/agenda', 'A'),
  criarAtalhoCatalogo('NOVO_AGENDAMENTO', 'Novo agendamento', 'Abra a agenda para criar um novo horario.', 'AGENDAMENTO', 'ACAO', '/agenda', '+A'),
  criarAtalhoCatalogo('SERVICOS', 'Servicos', 'Gerencie servicos, duracao e valores.', 'SERVICOS', 'TELA', '/servicos', 'S'),
  criarAtalhoCatalogo('FUNCIONARIOS', 'Funcionarios', 'Gerencie profissionais e permissoes operacionais.', 'FUNCIONARIOS', 'TELA', '/funcionarios', 'F'),
  criarAtalhoCatalogo('ESTOQUE', 'Estoque', 'Acompanhe produtos e movimentacoes.', 'ESTOQUE', 'TELA', '/estoque', 'ES'),
  criarAtalhoCatalogo('NOVO_PRODUTO', 'Novo produto', 'Abra o estoque para cadastrar um novo produto.', 'ESTOQUE', 'ACAO', '/estoque', '+P'),
  criarAtalhoCatalogo('CATALOGO_PUBLICO', 'Catalogo publico', 'Configure a vitrine publica de produtos.', 'PUBLICO', 'TELA', '/catalogo-publico', 'CP'),
  criarAtalhoCatalogo('PERSONALIZACAO_PUBLICA', 'Personalizacao publica', 'Ajuste identidade, cores e textos publicos.', 'PUBLICO', 'CONFIGURACAO', '/personalizacao', 'PP'),
  criarAtalhoCatalogo('NOTIFICACOES', 'Notificacoes', 'Acompanhe comunicados e alertas internos.', 'SISTEMA', 'TELA', '/notificacoes', 'N'),
  criarAtalhoCatalogo('AUDITORIA', 'Auditoria', 'Consulte eventos e alteracoes relevantes.', 'SISTEMA', 'RELATORIO', '/auditoria', 'AU'),
  criarAtalhoCatalogo('LIXEIRA', 'Lixeira', 'Revise registros removidos quando necessario.', 'SISTEMA', 'TELA', '/lixeira', 'L'),
  criarAtalhoCatalogo('MEU_PLANO', 'Meu plano', 'Confira dados do plano e da assinatura.', 'CONTA', 'TELA', '/meu-plano', 'MP'),
  criarAtalhoCatalogo('ESPORTIVO_TURMAS', 'Turmas esportivas', 'Gerencie turmas recorrentes e configuracoes esportivas.', 'ESPORTIVO', 'TELA', '/beach-tennis/turmas', 'T'),
  criarAtalhoCatalogo('ESPORTIVO_FREQUENCIA', 'Frequencia esportiva', 'Registre presencas, ausencias e aulas concretas.', 'ESPORTIVO', 'TELA', '/aulas-frequencia', 'FR'),
  criarAtalhoCatalogo('ESPORTIVO_FINANCEIRO', 'Financeiro esportivo', 'Acompanhe acordos e mensalidades esportivas.', 'ESPORTIVO', 'TELA', '/beach-tennis/financeiro', 'FE'),
  criarAtalhoCatalogo('ADMIN_EMPRESAS', 'Empresas SaaS', 'Administre empresas da plataforma.', 'ADMIN', 'TELA', '/admin/empresas', 'AE'),
  criarAtalhoCatalogo('ADMIN_PLANOS', 'Planos SaaS', 'Gerencie planos comerciais da plataforma.', 'ADMIN', 'TELA', '/admin/planos', 'AP'),
  criarAtalhoCatalogo('ADMIN_FATURAS', 'Faturas SaaS', 'Acompanhe faturas recorrentes da plataforma.', 'ADMIN', 'TELA', '/admin/faturas-recorrentes', 'AF'),
  criarAtalhoCatalogo('ADMIN_SOLICITACOES_CADASTRO', 'Solicitacoes de cadastro', 'Revise solicitacoes de novas empresas.', 'ADMIN', 'TELA', '/admin/solicitacoes', 'SC'),
])

const ATALHOS_LOCAIS_POR_CHAVE = new Map(CATALOGO_ATALHOS_USUARIO_LOCAL.map((atalho) => [atalho.chaveAtalho, atalho]))

export const atalhosUsuario = ref(obterCatalogoAtalhosUsuarioLocal())
export const atalhosPersonalizadosUsuario = ref([])
export const resumoAtalhosUsuario = ref(montarResumoAtalhosUsuario(atalhosUsuario.value, atalhosPersonalizadosUsuario.value))
export const estadoSincronizacaoAtalhos = ref(STATUS_SINCRONIZACAO_ATALHOS_IDLE)
export const mensagemSincronizacaoAtalhos = ref('')
export const origemAtalhosUsuario = ref(ORIGEM_ATALHOS_USUARIO_LOCAL)
export const opcoesAtalhosUsuario = ref(obterOpcoesAtalhosUsuarioFallback())
export const origemOpcoesAtalhosUsuario = ref(ORIGEM_OPCOES_ATALHOS_LOCAL)

function criarAtalhoCatalogo(chaveAtalho, titulo, descricao, modulo, tipo, rota, icone) {
  return Object.freeze({
    chaveAtalho,
    titulo,
    descricao,
    modulo,
    tipo,
    rota,
    icone,
    favorito: false,
    oculto: false,
    fixado: false,
    ordem: 0,
    personalizado: false,
    atualizadoEm: '',
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

function normalizarBooleano(valor) {
  return valor === true
}

function normalizarNumeroInteiro(valor, fallback = 0) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return Number.isFinite(numero) && numero >= 0 ? numero : fallback
}

function normalizarId(valor) {
  const texto = String(valor ?? '').trim()
  return texto || ''
}

function extrairAtalhosResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return []
  }

  if (Array.isArray(resposta)) {
    return resposta
  }

  if (Array.isArray(resposta.data)) {
    return resposta.data
  }

  if (Array.isArray(resposta.atalhos)) {
    return resposta.atalhos
  }

  if (Array.isArray(resposta.itens)) {
    return resposta.itens
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data.atalhos ?? resposta.data.itens ?? resposta.data.content ?? []
  }

  return []
}

function extrairPersonalizadosResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return []
  }

  if (Array.isArray(resposta)) {
    return resposta
  }

  if (Array.isArray(resposta.personalizados)) {
    return resposta.personalizados
  }

  if (Array.isArray(resposta.atalhosPersonalizados)) {
    return resposta.atalhosPersonalizados
  }

  if (Array.isArray(resposta.data)) {
    return resposta.data
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data.personalizados ?? resposta.data.atalhosPersonalizados ?? resposta.data.itens ?? []
  }

  return []
}

function extrairOpcoesResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return {}
  }

  if (resposta.data && typeof resposta.data === 'object' && !Array.isArray(resposta.data)) {
    return resposta.data
  }

  if (resposta.opcoes && typeof resposta.opcoes === 'object') {
    return resposta.opcoes
  }

  return resposta
}

function salvarStatusAtalhosUsuarioLocais(status) {
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_ATALHOS_USUARIO_STATUS, normalizarStatusSincronizacaoAtalhos(status))
  }
}

function definirEstadoSincronizacao(estado, mensagem = '') {
  estadoSincronizacaoAtalhos.value = normalizarStatusSincronizacaoAtalhos(estado)
  mensagemSincronizacaoAtalhos.value = mensagem
  salvarStatusAtalhosUsuarioLocais(estadoSincronizacaoAtalhos.value)
}

function persistirAtalhosLocais(atalhos, personalizados, { origem = ORIGEM_ATALHOS_USUARIO_LOCAL, status = STATUS_SINCRONIZACAO_ATALHOS_LOCAL } = {}) {
  const normalizados = mergeAtalhosUsuarioComCatalogo(atalhos)
  const personalizadosNormalizados = normalizarAtalhosPersonalizadosUsuario(personalizados)

  atalhosUsuario.value = normalizados
  atalhosPersonalizadosUsuario.value = personalizadosNormalizados
  resumoAtalhosUsuario.value = montarResumoAtalhosUsuario(normalizados, personalizadosNormalizados)
  origemAtalhosUsuario.value = origem

  const storage = obterLocalStorageSeguro()
  if (storage) {
    storage.setItem(CHAVE_ATALHOS_USUARIO, JSON.stringify(normalizados))
    storage.setItem(CHAVE_ATALHOS_USUARIO_PERSONALIZADOS, JSON.stringify(personalizadosNormalizados))
    storage.setItem(CHAVE_ATALHOS_USUARIO_STATUS, normalizarStatusSincronizacaoAtalhos(status))
  }

  return normalizados
}

function aplicarAcaoLocal(chaveAtalho, transformar) {
  const chave = normalizarChaveAtalho(chaveAtalho)

  if (!atalhosUsuario.value.some((atalho) => atalho.chaveAtalho === chave)) {
    return atalhosUsuario.value
  }

  const proximos = atalhosUsuario.value.map((atalho) => (atalho.chaveAtalho === chave ? transformar(atalho) : atalho))
  return persistirAtalhosLocais(proximos, atalhosPersonalizadosUsuario.value)
}

function obterBasePersonalizado(payload = {}) {
  return payload && typeof payload === 'object' ? payload : {}
}

export function obterCatalogoAtalhosUsuarioLocal() {
  return CATALOGO_ATALHOS_USUARIO_LOCAL.map((atalho, indice) => ({ ...atalho, ordem: indice + 1 }))
}

export function normalizarChaveAtalho(valor) {
  return normalizarCodigo(valor)
}

export function normalizarModuloAtalho(valor) {
  const modulo = normalizarCodigo(valor)
  return MODULOS_ATALHOS_VALIDOS.includes(modulo) ? modulo : MODULO_ATALHO_GERAL
}

export function normalizarTipoAtalho(valor) {
  const tipo = normalizarCodigo(valor)
  return TIPOS_ATALHOS_VALIDOS.includes(tipo) ? tipo : TIPO_ATALHO_TELA
}

export function rotaInternaValidaAtalho(rota) {
  const texto = String(rota || '').trim()

  if (!texto || !texto.startsWith('/') || texto.startsWith('//')) {
    return false
  }

  if (texto.includes('\\') || texto.includes('\0')) {
    return false
  }

  if (/^[a-z][a-z0-9+.-]*:/i.test(texto)) {
    return false
  }

  if (/\/src\/assets/i.test(texto)) {
    return false
  }

  return true
}

export function normalizarRotaAtalho(rota, fallback = '') {
  const texto = String(rota || '').trim()
  const rotaFallback = rotaInternaValidaAtalho(fallback) ? String(fallback).trim() : ''

  return rotaInternaValidaAtalho(texto) ? texto : rotaFallback
}

export function normalizarStatusSincronizacaoAtalhos(valor) {
  const texto = String(valor || '').trim().toLowerCase()
  return STATUS_SINCRONIZACAO_ATALHOS_VALIDOS.includes(texto) ? texto : STATUS_SINCRONIZACAO_ATALHOS_IDLE
}

export function normalizarAtalhoUsuario(atalho = {}, fallback = null) {
  const origem = atalho && typeof atalho === 'object' ? atalho : {}
  const chave = normalizarChaveAtalho(origem.chaveAtalho ?? origem.chave ?? origem.codigo)
  const atalhoFallback = fallback || ATALHOS_LOCAIS_POR_CHAVE.get(chave) || null

  if (!chave && !atalhoFallback) {
    return null
  }

  const chaveFinal = atalhoFallback?.chaveAtalho || chave
  const tituloFallback = atalhoFallback?.titulo || chaveFinal

  return {
    chaveAtalho: chaveFinal,
    titulo: normalizarTexto(origem.titulo ?? origem.nome, tituloFallback),
    descricao: normalizarTexto(origem.descricao ?? origem.texto, atalhoFallback?.descricao || 'Atalho disponivel para sua conta.'),
    modulo: normalizarModuloAtalho(origem.modulo ?? origem.categoria ?? atalhoFallback?.modulo),
    tipo: normalizarTipoAtalho(origem.tipo ?? atalhoFallback?.tipo),
    rota: normalizarRotaAtalho(origem.rota ?? origem.linkInterno ?? origem.caminho, atalhoFallback?.rota || ''),
    icone: normalizarTexto(origem.icone ?? origem.iconeTexto, atalhoFallback?.icone || 'A').slice(0, 4),
    favorito: normalizarBooleano(origem.favorito),
    oculto: normalizarBooleano(origem.oculto),
    fixado: normalizarBooleano(origem.fixado),
    ordem: normalizarNumeroInteiro(origem.ordem, atalhoFallback?.ordem || 0),
    personalizado: false,
    atualizadoEm: normalizarTexto(origem.atualizadoEm),
  }
}

export function normalizarAtalhoPersonalizadoUsuario(atalho = {}) {
  const origem = obterBasePersonalizado(atalho)
  const id = normalizarId(origem.id)
  const titulo = normalizarTexto(origem.titulo ?? origem.nome)
  const rota = normalizarRotaAtalho(origem.rota ?? origem.linkInterno ?? origem.caminho)

  if (!titulo || !rota) {
    return null
  }

  return {
    id,
    chaveAtalho: normalizarChaveAtalho(origem.chaveAtalho || id || titulo),
    titulo: titulo.slice(0, 80),
    descricao: normalizarTexto(origem.descricao ?? origem.texto, 'Atalho personalizado.').slice(0, 180),
    modulo: normalizarModuloAtalho(origem.modulo),
    tipo: normalizarTipoAtalho(origem.tipo),
    rota,
    icone: normalizarTexto(origem.icone ?? origem.iconeTexto, 'P').slice(0, 4),
    favorito: origem.favorito !== false,
    oculto: normalizarBooleano(origem.oculto),
    fixado: normalizarBooleano(origem.fixado),
    ordem: normalizarNumeroInteiro(origem.ordem),
    personalizado: true,
    atualizadoEm: normalizarTexto(origem.atualizadoEm),
  }
}

export function normalizarAtalhosPersonalizadosUsuario(atalhos = []) {
  const entradas = extrairPersonalizadosResposta(atalhos)
  return entradas.map((atalho) => normalizarAtalhoPersonalizadoUsuario(atalho)).filter(Boolean)
}

export function mergeAtalhosUsuarioComCatalogo(resposta = []) {
  const entradas = extrairAtalhosResposta(resposta)
  const backendPorChave = new Map()
  const extras = []

  for (const entrada of entradas) {
    const normalizado = normalizarAtalhoUsuario(entrada)

    if (!normalizado?.chaveAtalho) {
      continue
    }

    if (ATALHOS_LOCAIS_POR_CHAVE.has(normalizado.chaveAtalho)) {
      backendPorChave.set(normalizado.chaveAtalho, normalizado)
    } else {
      extras.push(normalizado)
    }
  }

  const locais = obterCatalogoAtalhosUsuarioLocal().map((atalhoLocal) =>
    normalizarAtalhoUsuario(backendPorChave.get(atalhoLocal.chaveAtalho) || {}, atalhoLocal),
  )

  return ordenarAtalhosUsuario([...locais, ...extras])
}

export function ordenarAtalhosUsuario(atalhos = []) {
  return [...atalhos].sort((a, b) => {
    const ordemA = normalizarNumeroInteiro(a?.ordem)
    const ordemB = normalizarNumeroInteiro(b?.ordem)

    if (ordemA !== ordemB) {
      return ordemA - ordemB
    }

    return String(a?.titulo || '').localeCompare(String(b?.titulo || ''), 'pt-BR')
  })
}

export function montarResumoAtalhosUsuario(atalhos = [], personalizados = []) {
  const lista = Array.isArray(atalhos) ? atalhos.map((atalho) => normalizarAtalhoUsuario(atalho)).filter(Boolean) : []
  const listaPersonalizados = normalizarAtalhosPersonalizadosUsuario(personalizados)
  const todos = [...lista, ...listaPersonalizados]

  return {
    total: todos.length,
    favoritos: todos.filter((atalho) => atalho.favorito && !atalho.oculto).length,
    ocultos: todos.filter((atalho) => atalho.oculto).length,
    fixados: todos.filter((atalho) => atalho.fixado && !atalho.oculto).length,
    personalizados: listaPersonalizados.length,
  }
}

export function obterOpcoesAtalhosUsuarioFallback() {
  return {
    modulos: MODULOS_ATALHOS_VALIDOS.map((modulo) => ({ valor: modulo, nome: formatarRotuloCodigoAtalho(modulo) })),
    tipos: TIPOS_ATALHOS_VALIDOS.map((tipo) => ({ valor: tipo, nome: formatarRotuloCodigoAtalho(tipo) })),
    status: [
      { valor: 'VISIVEIS', nome: 'Visiveis' },
      { valor: 'FAVORITOS', nome: 'Favoritos' },
      { valor: 'FIXADOS', nome: 'Fixados' },
      { valor: 'OCULTOS', nome: 'Ocultos' },
    ],
  }
}

export function normalizarOpcoesAtalhosUsuarioBackend(resposta = {}) {
  const origem = extrairOpcoesResposta(resposta)
  const fallback = obterOpcoesAtalhosUsuarioFallback()
  const modulos = normalizarListaOpcoes(origem.modulos, normalizarModuloAtalho)
  const tipos = normalizarListaOpcoes(origem.tipos ?? origem.tipo, normalizarTipoAtalho)
  const status = normalizarListaOpcoes(origem.status, (valor) => normalizarCodigo(valor))

  if (!modulos.length || !tipos.length) {
    return { valido: false, opcoes: fallback }
  }

  return {
    valido: true,
    opcoes: {
      modulos,
      tipos,
      status: status.length ? status : fallback.status,
    },
  }
}

function normalizarListaOpcoes(opcoes = [], normalizarValor) {
  if (!Array.isArray(opcoes)) {
    return []
  }

  return opcoes
    .map((opcao) => {
      const valorBruto = typeof opcao === 'object' ? opcao.valor ?? opcao.codigo ?? opcao.nome : opcao
      const valor = normalizarValor(valorBruto)
      const nome = typeof opcao === 'object' ? normalizarTexto(opcao.nome ?? opcao.label, formatarRotuloCodigoAtalho(valor)) : formatarRotuloCodigoAtalho(valor)
      return valor && nome ? { valor, nome } : null
    })
    .filter((opcao, indice, lista) => opcao && lista.findIndex((item) => item.valor === opcao.valor) === indice)
}

function formatarRotuloCodigoAtalho(valor) {
  return String(valor || '')
    .toLowerCase()
    .replace(/_/g, ' ')
    .replace(/^./, (letra) => letra.toUpperCase())
}

export function lerStatusAtalhosUsuarioLocais() {
  const storage = obterLocalStorageSeguro()
  return normalizarStatusSincronizacaoAtalhos(storage?.getItem(CHAVE_ATALHOS_USUARIO_STATUS))
}

export function lerAtalhosUsuarioLocais() {
  const salvos = lerJsonLocal(CHAVE_ATALHOS_USUARIO)
  return mergeAtalhosUsuarioComCatalogo(Array.isArray(salvos) ? salvos : [])
}

export function lerAtalhosPersonalizadosUsuarioLocais() {
  const salvos = lerJsonLocal(CHAVE_ATALHOS_USUARIO_PERSONALIZADOS)
  return normalizarAtalhosPersonalizadosUsuario(Array.isArray(salvos) ? salvos : [])
}

export function salvarAtalhosUsuarioLocais(
  atalhos = [],
  personalizados = atalhosPersonalizadosUsuario.value,
  { origem = ORIGEM_ATALHOS_USUARIO_LOCAL, status = STATUS_SINCRONIZACAO_ATALHOS_LOCAL } = {},
) {
  return persistirAtalhosLocais(atalhos, personalizados, { origem, status })
}

export function marcarFavoritoAtalhoUsuarioLocal(chaveAtalho, favorito = true) {
  return aplicarAcaoLocal(chaveAtalho, (atalho) => ({
    ...atalho,
    favorito: normalizarBooleano(favorito),
    oculto: normalizarBooleano(favorito) ? false : atalho.oculto,
  }))
}

export function ocultarAtalhoUsuarioLocal(chaveAtalho, oculto = true) {
  return aplicarAcaoLocal(chaveAtalho, (atalho) => ({
    ...atalho,
    oculto: normalizarBooleano(oculto),
    favorito: normalizarBooleano(oculto) ? false : atalho.favorito,
    fixado: normalizarBooleano(oculto) ? false : atalho.fixado,
  }))
}

export function fixarAtalhoUsuarioTopoLocal(chaveAtalho, fixado = true) {
  return aplicarAcaoLocal(chaveAtalho, (atalho) => ({
    ...atalho,
    fixado: normalizarBooleano(fixado),
    favorito: normalizarBooleano(fixado) ? true : atalho.favorito,
    oculto: normalizarBooleano(fixado) ? false : atalho.oculto,
  }))
}

export function reordenarAtalhosUsuarioLocal(lista = []) {
  const chaves = Array.isArray(lista)
    ? lista.map((item) => normalizarChaveAtalho(typeof item === 'object' ? item.chaveAtalho ?? item.chave : item)).filter(Boolean)
    : []
  const ordemPorChave = new Map(chaves.map((chave, indice) => [chave, indice + 1]))
  const proximos = atalhosUsuario.value.map((atalho, indice) => ({
    ...atalho,
    ordem: ordemPorChave.get(atalho.chaveAtalho) || chaves.length + indice + 1,
  }))

  return persistirAtalhosLocais(proximos, atalhosPersonalizadosUsuario.value)
}

export function resetarAtalhosUsuarioLocais() {
  return persistirAtalhosLocais(obterCatalogoAtalhosUsuarioLocal(), [], {
    origem: ORIGEM_ATALHOS_USUARIO_LOCAL,
    status: STATUS_SINCRONIZACAO_ATALHOS_LOCAL,
  })
}

export function validarPayloadAtalhoPersonalizadoUsuario(payload = {}) {
  const origem = obterBasePersonalizado(payload)
  const titulo = normalizarTexto(origem.titulo ?? origem.nome)
  const rota = normalizarTexto(origem.rota ?? origem.linkInterno ?? origem.caminho)
  const erros = []

  if (!titulo) {
    erros.push('Informe o titulo do atalho.')
  }

  if (titulo.length > 80) {
    erros.push('O titulo deve ter no maximo 80 caracteres.')
  }

  if (!rotaInternaValidaAtalho(rota)) {
    erros.push('Informe uma rota interna valida.')
  }

  return {
    valido: erros.length === 0,
    erros,
    payload: {
      titulo,
      descricao: normalizarTexto(origem.descricao ?? origem.texto).slice(0, 180),
      rota: normalizarRotaAtalho(rota),
      modulo: normalizarModuloAtalho(origem.modulo),
      tipo: normalizarTipoAtalho(origem.tipo),
      icone: normalizarTexto(origem.icone ?? origem.iconeTexto, 'P').slice(0, 4),
      favorito: origem.favorito !== false,
      fixado: normalizarBooleano(origem.fixado),
      oculto: normalizarBooleano(origem.oculto),
    },
  }
}

export function criarPayloadAtalhoUsuarioBackend(atalho = {}) {
  const normalizado = normalizarAtalhoUsuario(atalho)

  if (!normalizado) {
    return {}
  }

  return {
    favorito: normalizado.favorito,
    oculto: normalizado.oculto,
    fixado: normalizado.fixado,
    ordem: normalizado.ordem,
  }
}

export function criarPayloadAtalhoPersonalizadoBackend(payload = {}) {
  const validacao = validarPayloadAtalhoPersonalizadoUsuario(payload)

  if (!validacao.valido) {
    return null
  }

  return { ...validacao.payload }
}

export function criarAtalhoPersonalizadoUsuarioLocal(payload = {}) {
  const validacao = validarPayloadAtalhoPersonalizadoUsuario(payload)

  if (!validacao.valido) {
    return { valido: false, erros: validacao.erros, atalhos: atalhosPersonalizadosUsuario.value }
  }

  const id = `local-${Date.now()}-${atalhosPersonalizadosUsuario.value.length + 1}`
  const personalizado = normalizarAtalhoPersonalizadoUsuario({
    ...validacao.payload,
    id,
    chaveAtalho: id,
    ordem: atalhosPersonalizadosUsuario.value.length + 1,
  })
  const proximos = [...atalhosPersonalizadosUsuario.value, personalizado]
  persistirAtalhosLocais(atalhosUsuario.value, proximos)

  return { valido: true, atalho: personalizado, atalhos: atalhosPersonalizadosUsuario.value }
}

export function atualizarAtalhoPersonalizadoUsuarioLocal(id, payload = {}) {
  const idNormalizado = normalizarId(id)
  const atual = atalhosPersonalizadosUsuario.value.find((atalho) => atalho.id === idNormalizado)

  if (!atual) {
    return { valido: false, erros: ['Atalho personalizado nao encontrado.'], atalhos: atalhosPersonalizadosUsuario.value }
  }

  const validacao = validarPayloadAtalhoPersonalizadoUsuario({ ...atual, ...payload })

  if (!validacao.valido) {
    return { valido: false, erros: validacao.erros, atalhos: atalhosPersonalizadosUsuario.value }
  }

  const atualizado = normalizarAtalhoPersonalizadoUsuario({
    ...atual,
    ...validacao.payload,
    id: atual.id,
    chaveAtalho: atual.chaveAtalho,
  })
  const proximos = atalhosPersonalizadosUsuario.value.map((atalho) => (atalho.id === idNormalizado ? atualizado : atalho))
  persistirAtalhosLocais(atalhosUsuario.value, proximos)

  return { valido: true, atalho: atualizado, atalhos: atalhosPersonalizadosUsuario.value }
}

export function removerAtalhoPersonalizadoUsuarioLocal(id) {
  const idNormalizado = normalizarId(id)
  const proximos = atalhosPersonalizadosUsuario.value.filter((atalho) => atalho.id !== idNormalizado)
  persistirAtalhosLocais(atalhosUsuario.value, proximos)
  return atalhosPersonalizadosUsuario.value
}

export function obterAtalhosRapidosUsuario({ limite = 3, incluirFavoritos = true } = {}) {
  const maximo = normalizarNumeroInteiro(limite, 3) || 3
  const todos = [...atalhosUsuario.value, ...atalhosPersonalizadosUsuario.value]
  const visiveis = todos.filter((atalho) => !atalho.oculto && (atalho.fixado || (incluirFavoritos && atalho.favorito)))

  return ordenarAtalhosUsuario(visiveis).slice(0, maximo)
}

export function obterResumoSincronizacaoAtalhos({
  estado = estadoSincronizacaoAtalhos.value,
  origem = origemAtalhosUsuario.value,
  mensagem = mensagemSincronizacaoAtalhos.value,
} = {}) {
  if (estado === STATUS_SINCRONIZACAO_ATALHOS_ERRO) {
    return {
      rotulo: 'Erro ao sincronizar',
      detalhe: mensagem || 'Os atalhos ficaram salvos neste navegador.',
      tipo: 'erro',
    }
  }

  if (estado === STATUS_SINCRONIZACAO_ATALHOS_CARREGANDO || estado === STATUS_SINCRONIZACAO_ATALHOS_SALVANDO) {
    return {
      rotulo: 'Sincronizando',
      detalhe: mensagem || 'Atualizando atalhos.',
      tipo: 'carregando',
    }
  }

  if (origem === ORIGEM_ATALHOS_USUARIO_BACKEND) {
    return {
      rotulo: 'Sincronizado',
      detalhe: mensagem || 'Atalhos vinculados ao seu usuario.',
      tipo: 'sucesso',
    }
  }

  return {
    rotulo: 'Salvo localmente',
    detalhe: mensagem || 'Atalhos salvos apenas neste navegador.',
    tipo: 'local',
  }
}

export async function carregarOpcoesAtalhosUsuarioBackend(buscarOpcoesAtalhosUsuario) {
  if (typeof buscarOpcoesAtalhosUsuario !== 'function') {
    opcoesAtalhosUsuario.value = obterOpcoesAtalhosUsuarioFallback()
    origemOpcoesAtalhosUsuario.value = ORIGEM_OPCOES_ATALHOS_LOCAL
    return opcoesAtalhosUsuario.value
  }

  try {
    const resposta = await buscarOpcoesAtalhosUsuario()
    const { valido, opcoes } = normalizarOpcoesAtalhosUsuarioBackend(resposta)
    opcoesAtalhosUsuario.value = opcoes
    origemOpcoesAtalhosUsuario.value = valido ? ORIGEM_OPCOES_ATALHOS_BACKEND : ORIGEM_OPCOES_ATALHOS_LOCAL
    return opcoesAtalhosUsuario.value
  } catch (error) {
    console.error(error)
    opcoesAtalhosUsuario.value = obterOpcoesAtalhosUsuarioFallback()
    origemOpcoesAtalhosUsuario.value = ORIGEM_OPCOES_ATALHOS_LOCAL
    return opcoesAtalhosUsuario.value
  }
}

export async function carregarAtalhosUsuarioBackend(buscarAtalhosUsuario, buscarOpcoesAtalhosUsuario, buscarPersonalizadosUsuario) {
  await carregarOpcoesAtalhosUsuarioBackend(buscarOpcoesAtalhosUsuario)

  if (typeof buscarAtalhosUsuario !== 'function') {
    const atalhos = salvarAtalhosUsuarioLocais(lerAtalhosUsuarioLocais(), lerAtalhosPersonalizadosUsuarioLocais())
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_LOCAL)
    return atalhos
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_CARREGANDO, 'Carregando atalhos...')

  try {
    const resposta = await buscarAtalhosUsuario()
    const personalizados =
      typeof buscarPersonalizadosUsuario === 'function'
        ? normalizarAtalhosPersonalizadosUsuario(await buscarPersonalizadosUsuario())
        : lerAtalhosPersonalizadosUsuarioLocais()
    const atalhos = salvarAtalhosUsuarioLocais(mergeAtalhosUsuarioComCatalogo(resposta), personalizados, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalhos sincronizados.')
    return atalhos
  } catch (error) {
    console.error(error)
    const atalhos = salvarAtalhosUsuarioLocais(lerAtalhosUsuarioLocais(), lerAtalhosPersonalizadosUsuarioLocais(), {
      origem: ORIGEM_ATALHOS_USUARIO_LOCAL,
      status: STATUS_SINCRONIZACAO_ATALHOS_ERRO,
    })
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_ATALHOS_ERRO,
      'Nao foi possivel sincronizar os atalhos. Usando o que esta salvo neste navegador.',
    )
    return atalhos
  }
}

export async function salvarPreferenciaAtalhoUsuarioBackend(chaveAtalho, alteracoes, salvarPreferencia) {
  const chave = normalizarChaveAtalho(chaveAtalho)
  const atual = atalhosUsuario.value.find((atalho) => atalho.chaveAtalho === chave)
  const locais = aplicarAcaoLocal(chave, (atalho) => ({ ...atalho, ...alteracoes }))

  if (!atual || typeof salvarPreferencia !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Salvando atalho...')

  try {
    const atualizado = atalhosUsuario.value.find((atalho) => atalho.chaveAtalho === chave)
    const resposta = await salvarPreferencia(chave, criarPayloadAtalhoUsuarioBackend(atualizado))
    const sincronizados = salvarAtalhosUsuarioLocais(resposta?.atalhos ? resposta : atalhosUsuario.value, atalhosPersonalizadosUsuario.value, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalho salvo.')
    return sincronizados
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'O atalho ficou salvo neste navegador.')
    return locais
  }
}

export async function reordenarAtalhosUsuarioBackend(lista, reordenarAtalhos) {
  const locais = reordenarAtalhosUsuarioLocal(lista)

  if (typeof reordenarAtalhos !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Reordenando atalhos...')

  try {
    const payload = atalhosUsuario.value.map((atalho) => ({ chaveAtalho: atalho.chaveAtalho, ordem: atalho.ordem }))
    const resposta = await reordenarAtalhos(payload)
    const sincronizados = salvarAtalhosUsuarioLocais(resposta?.atalhos ? resposta : atalhosUsuario.value, atalhosPersonalizadosUsuario.value, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Ordem dos atalhos salva.')
    return sincronizados
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'A ordem ficou salva neste navegador.')
    return locais
  }
}

export async function resetarAtalhosUsuarioBackend(resetarAtalhos) {
  const locais = resetarAtalhosUsuarioLocais()

  if (typeof resetarAtalhos !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Resetando atalhos...')

  try {
    const resposta = await resetarAtalhos()
    const sincronizados = salvarAtalhosUsuarioLocais(resposta?.atalhos ? resposta : locais, atalhosPersonalizadosUsuario.value, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalhos resetados.')
    return sincronizados
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'Os atalhos locais foram resetados neste navegador.')
    return locais
  }
}

export async function criarAtalhoPersonalizadoUsuarioBackend(payload, criarAtalho) {
  const local = criarAtalhoPersonalizadoUsuarioLocal(payload)

  if (!local.valido || typeof criarAtalho !== 'function') {
    definirEstadoSincronizacao(local.valido ? STATUS_SINCRONIZACAO_ATALHOS_LOCAL : STATUS_SINCRONIZACAO_ATALHOS_ERRO)
    return local
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Criando atalho personalizado...')

  try {
    const resposta = await criarAtalho(criarPayloadAtalhoPersonalizadoBackend(payload))
    const personalizados = normalizarAtalhosPersonalizadosUsuario(resposta?.personalizados ? resposta : [...atalhosPersonalizadosUsuario.value])
    persistirAtalhosLocais(atalhosUsuario.value, personalizados.length ? personalizados : atalhosPersonalizadosUsuario.value, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalho personalizado criado.')
    return { valido: true, atalhos: atalhosPersonalizadosUsuario.value }
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'O atalho personalizado ficou salvo neste navegador.')
    return local
  }
}

export async function atualizarAtalhoPersonalizadoUsuarioBackend(id, payload, atualizarAtalho) {
  const local = atualizarAtalhoPersonalizadoUsuarioLocal(id, payload)

  if (!local.valido || typeof atualizarAtalho !== 'function') {
    definirEstadoSincronizacao(local.valido ? STATUS_SINCRONIZACAO_ATALHOS_LOCAL : STATUS_SINCRONIZACAO_ATALHOS_ERRO)
    return local
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Atualizando atalho personalizado...')

  try {
    const resposta = await atualizarAtalho(id, criarPayloadAtalhoPersonalizadoBackend(payload))
    const personalizados = normalizarAtalhosPersonalizadosUsuario(resposta?.personalizados ? resposta : atalhosPersonalizadosUsuario.value)
    persistirAtalhosLocais(atalhosUsuario.value, personalizados.length ? personalizados : atalhosPersonalizadosUsuario.value, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalho personalizado atualizado.')
    return { valido: true, atalhos: atalhosPersonalizadosUsuario.value }
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'O atalho personalizado ficou salvo neste navegador.')
    return local
  }
}

export async function removerAtalhoPersonalizadoUsuarioBackend(id, removerAtalho) {
  const locais = removerAtalhoPersonalizadoUsuarioLocal(id)

  if (typeof removerAtalho !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVANDO, 'Removendo atalho personalizado...')

  try {
    const resposta = await removerAtalho(id)
    const personalizados = normalizarAtalhosPersonalizadosUsuario(resposta?.personalizados ? resposta : locais)
    persistirAtalhosLocais(atalhosUsuario.value, personalizados, {
      origem: ORIGEM_ATALHOS_USUARIO_BACKEND,
      status: STATUS_SINCRONIZACAO_ATALHOS_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_SALVO, 'Atalho personalizado removido.')
    return atalhosPersonalizadosUsuario.value
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_ATALHOS_ERRO, 'O atalho personalizado foi removido neste navegador.')
    return locais
  }
}
