import { debugLog } from '@/utils/devDebug'

const API_URL_FALLBACK = import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.nuvemmais.com.br'
const PUBLIC_APP_URL_FALLBACK = import.meta.env.DEV ? 'http://localhost:5173' : 'https://gestao.nuvemmais.com.br'
const MENSAGENS_PADRAO = {
  sessaoExpirada: 'Sessão expirada. Faça login novamente.',
  acessoNegado: 'Acesso negado. Você não tem permissão para acessar esta área.',
  rotaInexistente: 'Rota inexistente. Verifique o endereço e tente novamente.',
  recursoNaoEncontrado: 'Não foi possível localizar o conteúdo solicitado.',
  redeApiIndisponivel: 'Não foi possível conectar. Verifique sua internet e tente novamente.',
  apiIndisponivel: 'Serviço temporariamente indisponível. Tente novamente em instantes.',
  erroCarregarDados: 'Não foi possível carregar os dados. Tente novamente.',
  erroOperacao: 'Não foi possível concluir a operação. Tente novamente.',
}
export const MENSAGEM_CADASTRO_PENDENTE =
  'Seu cadastro foi recebido e está aguardando aprovação. Assim que for aprovado, o acesso ao sistema será liberado.'

function normalizarUrlBase(url, fallback = '') {
  const valor = String(url || '').trim()

  return (valor || fallback).replace(/\/+$/, '')
}

function resolverApiUrl() {
  const fallback = normalizarUrlBase(API_URL_FALLBACK)
  const configurada = normalizarUrlBase(import.meta.env.VITE_API_URL, fallback)

  if (import.meta.env.DEV) {
    return configurada
  }

  try {
    const origemAtual = new URL(window.location.origin)
    const origemApi = new URL(configurada)
    const origemFallback = new URL(fallback)

    if (origemApi.host === origemAtual.host) {
      return origemFallback.toString().replace(/\/+$/, '')
    }
  } catch (error) {
    debugLog('api', 'Falha ao validar origem da API; mantendo URL configurada.', error)
  }

  return configurada
}

export const API_URL = resolverApiUrl()
const PUBLIC_APP_URL = normalizarUrlBase(import.meta.env.VITE_PUBLIC_APP_URL, PUBLIC_APP_URL_FALLBACK)

export function obterUrlPublicaFrontend() {
  if (PUBLIC_APP_URL) {
    return PUBLIC_APP_URL
  }

  return normalizarUrlBase(window.location.origin)
}

export function montarLinkPublicoAgendamento(slug) {
  const slugNormalizado = String(slug || '').trim()

  return slugNormalizado ? `${obterUrlPublicaFrontend()}/agendar/${slugNormalizado}` : ''
}

function normalizarBooleano(valor) {
  return valor === true
}

function valorPreenchido(valor) {
  if (valor === undefined || valor === null) {
    return false
  }

  if (typeof valor === 'string') {
    return valor.trim() !== ''
  }

  return true
}

function primeiroValorPreenchido(...valores) {
  for (const valor of valores) {
    if (valorPreenchido(valor)) {
      return valor
    }
  }

  return undefined
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function statusIndicaCadastroPendente(status) {
  const texto = normalizarTextoBusca(status).replace(/[\s-]+/g, '_')

  return [
    'pendente',
    'pendente_aprovacao',
    'aguardando_aprovacao',
    'em_analise',
    'analise',
  ].includes(texto)
}

export function mensagemIndicaCadastroPendente(mensagem) {
  const texto = normalizarTextoBusca(mensagem)

  return (
    texto.includes('cadastro pendente') ||
    texto.includes('aguardando aprovacao') ||
    texto.includes('pendente de aprovacao') ||
    texto.includes('empresa pendente') ||
    texto.includes('acesso em analise') ||
    (texto.includes('cadastro') && texto.includes('pendente')) ||
    (texto.includes('empresa') && texto.includes('aprovacao'))
  )
}

export function erroIndicaCadastroPendente(error) {
  return error?.cadastroPendente === true || mensagemIndicaCadastroPendente(error?.message)
}

function extrairUsuarioResposta(dados) {
  const candidatos = [
    dados?.usuario,
    dados?.user,
    dados?.data?.usuario,
    dados?.data?.user,
    dados?.resultado?.usuario,
    dados?.resultado?.user,
  ]

  return candidatos.find((candidato) => candidato && typeof candidato === 'object') || {}
}

function normalizarTrocaSenhaObrigatoria(dados) {
  if (!dados || typeof dados !== 'object') {
    return false
  }

  return normalizarBooleano(
    dados.trocaSenhaObrigatoria ??
      dados.passwordChangeRequired ??
      dados.senhaTemporariaObrigatoria ??
      dados.requirePasswordChange,
  )
}

function normalizarUsuarioSessao(dados = {}, usuarioBase = null) {
  const origem = dados && typeof dados === 'object' ? dados : {}
  const origemUsuario = extrairUsuarioResposta(origem)
  const base = usuarioBase && typeof usuarioBase === 'object' ? usuarioBase : {}
  const statusEmpresa = String(
    primeiroValorPreenchido(
      origem.statusEmpresa,
      origem.empresaStatus,
      origem.situacaoEmpresa,
      origem.statusCadastro,
      origem.empresa?.status,
      origem.empresa?.statusEmpresa,
      origemUsuario.statusEmpresa,
      origemUsuario.empresaStatus,
      origemUsuario.situacaoEmpresa,
      origemUsuario.statusCadastro,
      origemUsuario.empresa?.status,
      origemUsuario.empresa?.statusEmpresa,
      base.statusEmpresa,
      base.empresaStatus,
      base.situacaoEmpresa,
      base.statusCadastro,
      base.empresa?.status,
      base.empresa?.statusEmpresa,
    ) || '',
  )
    .trim()
    .toUpperCase()
  const cadastroPendente =
    origem.cadastroPendente === true ||
    origemUsuario.cadastroPendente === true ||
    base.cadastroPendente === true ||
    statusIndicaCadastroPendente(statusEmpresa)

  return {
    ...base,
    id:
      primeiroValorPreenchido(
        origem.id,
        origem.usuarioId,
        origem.userId,
        origemUsuario.id,
        origemUsuario.usuarioId,
        origemUsuario.userId,
        base.id,
      ) ?? null,
    nome:
      primeiroValorPreenchido(
        origem.nome,
        origem.usuarioNome,
        origemUsuario.nome,
        origemUsuario.usuarioNome,
        base.nome,
      ) || '',
    email:
      primeiroValorPreenchido(
        origem.email,
        origem.usuarioEmail,
        origemUsuario.email,
        origemUsuario.usuarioEmail,
        base.email,
      ) || '',
    login:
      primeiroValorPreenchido(
        origem.login,
        origem.usuarioLogin,
        origem.username,
        origem.userName,
        origemUsuario.login,
        origemUsuario.usuarioLogin,
        origemUsuario.username,
        origemUsuario.userName,
        base.login,
        base.usuarioLogin,
      ) || '',
    perfil:
      primeiroValorPreenchido(
        origem.perfil,
        origem.role,
        origemUsuario.perfil,
        origemUsuario.role,
        base.perfil,
      ) || '',
    empresaId:
      primeiroValorPreenchido(
        origem.empresaId,
        origemUsuario.empresaId,
        base.empresaId,
      ) ?? null,
    empresaNome:
      primeiroValorPreenchido(
        origem.empresaNome,
        origemUsuario.empresaNome,
        base.empresaNome,
      ) || '',
    cadastroPendente,
    statusEmpresa,
    trocaSenhaObrigatoria: normalizarTrocaSenhaObrigatoria(origem) || normalizarTrocaSenhaObrigatoria(origemUsuario) || false,
  }
}

export function carregarUsuarioSessao() {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (!usuarioSalvo) {
    return null
  }

  try {
    const usuario = JSON.parse(usuarioSalvo)
    return normalizarUsuarioSessao(usuario)
  } catch (error) {
    console.error(error)
    return null
  }
}

export function limparSessaoAutenticacao({ notificar = true } = {}) {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.removeItem('empresa')
  localStorage.removeItem('empresaAtual')
  localStorage.removeItem('trocaSenhaObrigatoria')
  localStorage.removeItem('cadastroPendente')
  sessionStorage.removeItem('origemOnboarding')
  sessionStorage.removeItem('etapaOnboarding')

  if (notificar) {
    window.dispatchEvent(new Event('usuario-atualizado'))
  }
}

export function salvarSessaoAutenticacao(respostaLoginOuSessao, usuarioBase = null) {
  const token = respostaLoginOuSessao?.token || localStorage.getItem('token')
  const usuario = normalizarUsuarioSessao(respostaLoginOuSessao, usuarioBase)

  if (token) {
    localStorage.setItem('token', token)
  }

  localStorage.setItem('usuario', JSON.stringify(usuario))
  window.dispatchEvent(new Event('usuario-atualizado'))

  return usuario
}

function montarHeaders(comJson = false) {
  const headers = {}
  const token = localStorage.getItem('token')

  if (comJson) {
    headers['Content-Type'] = 'application/json'
  }

  if (token) {
    headers.Authorization = `Bearer ${token}`
  }

  return headers
}

function montarHeadersPublicos(comJson = false) {
  const headers = {}

  if (comJson) {
    headers['Content-Type'] = 'application/json'
  }

  return headers
}

function montarQueryString(filtros = {}) {
  const params = new URLSearchParams()

  Object.entries(filtros || {}).forEach(([chave, valor]) => {
    if (valor !== null && valor !== undefined && String(valor).trim()) {
      params.append(chave, valor)
    }
  })

  const query = params.toString()

  return query ? `?${query}` : ''
}

function solicitouPaginacao(filtros = {}) {
  if (!filtros || typeof filtros !== 'object') {
    return false
  }

  return filtros.page !== undefined || filtros.size !== undefined
}

async function executarFetch(input, init) {
  try {
    return await fetch(input, init)
  } catch (error) {
    const erro = new Error(MENSAGENS_PADRAO.redeApiIndisponivel)
    erro.status = 0
    erro.causaOriginal = error
    throw erro
  }
}

function emitirMensagemGlobal(mensagem, tipo = 'erro') {
  window.dispatchEvent(
    new CustomEvent('mensagem-global', {
      detail: {
        mensagem,
        tipo,
      },
    }),
  )
}

function encerrarSessao(mensagem = MENSAGENS_PADRAO.sessaoExpirada) {
  limparSessaoAutenticacao()
  sessionStorage.setItem('mensagem-login', mensagem)

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function extrairMensagemErro(response) {
  const mensagemPadrao = mensagemPadraoPorStatus(response.status)

  const dados = await lerJsonErro(response)

  if (dados) {
    const mensagemJson = extrairMensagemJson(dados)

    if (mensagemJson) {
      return sanitizarMensagemUsuario(mensagemJson, mensagemPadrao)
    }
  }

  const texto = await lerTextoErro(response)

  if (texto) {
    return sanitizarMensagemUsuario(texto, mensagemPadrao)
  }

  return mensagemPadrao
}

function mensagemPadraoPorStatus(status) {
  if (status === 401) {
    return MENSAGENS_PADRAO.sessaoExpirada
  }

  if (status === 403) {
    return MENSAGENS_PADRAO.acessoNegado
  }

  if (status === 404) {
    return MENSAGENS_PADRAO.recursoNaoEncontrado
  }

  if (status >= 500) {
    return MENSAGENS_PADRAO.apiIndisponivel
  }

  return MENSAGENS_PADRAO.erroCarregarDados
}

async function lerJsonErro(response) {
  try {
    return await response.clone().json()
  } catch {
    return null
  }
}

async function lerTextoErro(response) {
  try {
    return (await response.clone().text()).trim()
  } catch (error) {
    console.error(error)
    return ''
  }
}

function extrairMensagemJson(dados) {
  if (typeof dados === 'string') {
    return sanitizarMensagemUsuario(dados.trim(), '')
  }

  if (!dados || typeof dados !== 'object') {
    return ''
  }

  const mensagens = [
    dados.message,
    dados.detail,
    dados.error,
    dados.titulo,
    dados.descricao,
  ]

  return mensagens.map(normalizarMensagemErro).find(Boolean) || ''
}

function normalizarMensagemErro(mensagem) {
  const texto = String(mensagem || '').trim()

  if (!texto || mensagemGenerica(texto)) {
    return ''
  }

  return sanitizarMensagemUsuario(texto, '')
}

function mensagemGenerica(mensagem) {
  const texto = String(mensagem || '').toLowerCase()

  return [
    'bad request',
    'unauthorized',
    'forbidden',
    'not found',
    'conflict',
    'internal server error',
    'no message available',
    'erro ao comunicar com a api',
  ].includes(texto)
}

function contemTrechoTecnico(texto) {
  return /<\s*html|<!doctype|stack trace|java\.|org\.springframework|sql|constraint|exception|traceback|syntaxerror/i.test(
    String(texto || ''),
  )
}

function sanitizarMensagemUsuario(mensagem, fallback = MENSAGENS_PADRAO.erroCarregarDados) {
  const texto = String(mensagem || '')
    .replace(/\s+/g, ' ')
    .trim()

  if (!texto) {
    return fallback
  }

  if (mensagemGenerica(texto) || contemTrechoTecnico(texto)) {
    return fallback
  }

  if (texto.length > 280 && /[{[<(]/.test(texto)) {
    return fallback
  }

  return texto
}

export function obterMensagemAmigavelErro(error, fallback = MENSAGENS_PADRAO.erroCarregarDados) {
  const mensagem = sanitizarMensagemUsuario(error?.message, '')
  return mensagem || fallback
}

async function extrairMensagemResposta(response) {
  const mensagemPadrao = MENSAGENS_PADRAO.erroOperacao

  try {
    const data = await response.clone().json()

    if (data?.message) {
      return sanitizarMensagemUsuario(data.message, mensagemPadrao)
    }

    if (data?.detail) {
      return sanitizarMensagemUsuario(data.detail, mensagemPadrao)
    }

    if (data?.error) {
      return sanitizarMensagemUsuario(data.error, mensagemPadrao)
    }
  } catch (error) {
    console.error(error)
  }

  try {
    const texto = (await response.clone().text()).trim()

    if (texto) {
      return sanitizarMensagemUsuario(texto, mensagemPadrao)
    }
  } catch (error) {
    console.error(error)
  }

  return mensagemPadrao
}

async function tratarResposta(response, opcoes = {}) {
  const {
    encerrarSessao401 = true,
    emitir403 = true,
    mensagem401 = '',
    mensagem403 = '',
  } = opcoes

  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response)
    const mensagemTratada =
      response.status === 401
        ? mensagem401 || mensagemPadraoPorStatus(response.status)
        : response.status === 403
          ? mensagem403 || mensagemPadraoPorStatus(response.status)
          : mensagem
    const erro = new Error(mensagemTratada)
    erro.status = response.status

    if (response.status === 401 && encerrarSessao401) {
      encerrarSessao(mensagemPadraoPorStatus(401))
    }

    if (response.status === 403 && emitir403) {
      emitirMensagemGlobal(mensagemPadraoPorStatus(403))
    }

    throw erro
  }

  if (response.status === 204) {
    return { sucesso: true }
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

async function tratarRespostaPublica(response) {
  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response)

    throw new Error(mensagem)
  }

  if (response.status === 204) {
    return { sucesso: true }
  }

  const contentType = response.headers.get('content-type') || ''

  if (contentType.includes('application/json')) {
    return response.json()
  }

  return response.text()
}

export async function buscarClientes(filtros = {}) {
  const response = await executarFetch(`${API_URL}/clientes${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarServicos(filtros = {}) {
  const response = await executarFetch(`${API_URL}/servicos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarFuncionarios(filtros = {}) {
  const response = await executarFetch(`${API_URL}/funcionarios${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarAgendamentos(filtros = {}) {
  const response = await executarFetch(`${API_URL}/agendamentos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEmpresaPublica(slug) {
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarServicosPublicos(slug) {
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/servicos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarSegmentosPublicos() {
  const response = await executarFetch(`${API_URL}/publico/segmentos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarSegmentosCadastroPublico() {
  const response = await executarFetch(`${API_URL}/publico/segmentos-cadastro`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarPlanosPublicos() {
  const response = await executarFetch(`${API_URL}/publico/planos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarPlanosCadastroPublico() {
  const url = `${API_URL}/publico/planos-cadastro`
  const response = await executarFetch(url, {
    headers: montarHeadersPublicos(),
  })
  debugLog('cadastro-publico-planos', 'Requisicao de planos executada', {
    url,
    status: response.status,
    ok: response.ok,
  })

  return tratarRespostaPublica(response)
}

export async function buscarConteudoInstitucionalPublico(tipo) {
  const tipoNormalizado = String(tipo || '').trim()
  const response = await executarFetch(`${API_URL}/publico/institucional/${tipoNormalizado}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function enviarSolicitacaoCadastro(dados) {
  return criarSolicitacaoCadastroEmpresa(dados)
}

export async function criarSolicitacaoCadastroEmpresa(dados) {
  return cadastrarEmpresaInteressadaPublico(dados)
}

export async function cadastrarEmpresaInteressadaPublico(dados) {
  const response = await executarFetch(`${API_URL}/publico/solicitacoes-cadastro/onboarding`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
  })

  return tratarRespostaPublica(response)
}

export async function buscarFuncionariosPublicos(slug, filtros = {}) {
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/funcionarios${montarQueryString(filtros)}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarDisponibilidadePublica(slug, servicoId, funcionarioId, data) {
  const params = new URLSearchParams({
    servicoId,
    funcionarioId,
    data,
  })

  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/disponibilidade?${params}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarDisponibilidadeDataPublica(slug, data) {
  const params = new URLSearchParams({ data })
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/disponibilidade-data?${params}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function criarAgendamentoPublico(slug, dados) {
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/agendamentos`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
  })

  return tratarRespostaPublica(response)
}

export async function buscarMinhaPersonalizacao() {
  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarIndisponibilidades(filtros = {}) {
  const response = await executarFetch(`${API_URL}/indisponibilidades${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarIndisponibilidadePorId(id) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarIndisponibilidade(dados) {
  const response = await executarFetch(`${API_URL}/indisponibilidades`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarIndisponibilidade(id, dados) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function excluirIndisponibilidade(id) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionarioServicos(filtros = {}) {
  const response = await executarFetch(`${API_URL}/funcionario-servicos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function vincularFuncionarioServico(dados) {
  const response = await executarFetch(`${API_URL}/funcionario-servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function excluirFuncionarioServico(id) {
  const response = await executarFetch(`${API_URL}/funcionario-servicos/${id}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionariosVinculadosAoServico(servicoId) {
  const urlPrincipal = `${API_URL}/servicos/${servicoId}/funcionarios-vinculados`
  const response = await executarFetch(urlPrincipal, {
    headers: montarHeaders(),
  })

  if (response.status === 404) {
    const urlFallback = `${API_URL}/servicos/${servicoId}/funcionarios`
    const fallback = await executarFetch(urlFallback, {
      headers: montarHeaders(),
    })

    if (fallback.status === 404) {
      return []
    }

    const dadosFallback = await tratarResposta(fallback)

    return normalizarColecaoResposta(dadosFallback)
  }

  const dados = await tratarResposta(response)

  return normalizarColecaoResposta(dados)
}

export async function salvarFuncionariosVinculadosAoServico(servicoId, funcionarioIds) {
  const url = `${API_URL}/servicos/${servicoId}/funcionarios-vinculados`
  const payload = { funcionarioIds }
  const response = await executarFetch(url, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  if (!response.ok) {
    const respostaBackend = await lerCorpoResposta(response)
    const mensagem = extrairMensagemJson(respostaBackend) || 'Não foi possível concluir a operação.'
    const erro = new Error(mensagem)

    erro.detalhes = {
      status: response.status,
      statusText: response.statusText,
      url,
      payload,
      respostaBackend,
    }

    throw erro
  }

  return tratarResposta(response)
}

async function lerCorpoResposta(response) {
  const texto = await lerTextoErro(response)

  if (!texto) {
    return ''
  }

  try {
    return JSON.parse(texto)
  } catch {
    return texto
  }
}

function normalizarColecaoResposta(dados) {
  if (Array.isArray(dados)) {
    return dados
  }

  if (!dados || typeof dados !== 'object') {
    return []
  }

  if (Array.isArray(dados.value)) {
    return dados.value
  }

  if (Array.isArray(dados.Value)) {
    return dados.Value
  }

  if (dados.value !== undefined && (dados.Count !== undefined || dados.count !== undefined)) {
    return dados.value ? [dados.value].flat() : []
  }

  if (dados.Value !== undefined && (dados.Count !== undefined || dados.count !== undefined)) {
    return dados.Value ? [dados.Value].flat() : []
  }

  if (Array.isArray(dados.content)) {
    return dados.content
  }

  if (Array.isArray(dados.data?.value)) {
    return dados.data.value
  }

  if (Array.isArray(dados.data?.Value)) {
    return dados.data.Value
  }

  if (
    dados.data?.value !== undefined &&
    (dados.data.Count !== undefined || dados.data.count !== undefined)
  ) {
    return dados.data.value ? [dados.data.value].flat() : []
  }

  if (
    dados.data?.Value !== undefined &&
    (dados.data.Count !== undefined || dados.data.count !== undefined)
  ) {
    return dados.data.Value ? [dados.data.Value].flat() : []
  }

  if (Array.isArray(dados.data?.content)) {
    return dados.data.content
  }

  if (Array.isArray(dados.data)) {
    return dados.data
  }

  if (Array.isArray(dados.items)) {
    return dados.items
  }

  if (Array.isArray(dados.itens)) {
    return dados.itens
  }

  if (Array.isArray(dados.resultado)) {
    return dados.resultado
  }

  if (Array.isArray(dados.funcionarioIds)) {
    return dados.funcionarioIds
  }

  if (Array.isArray(dados.funcionarios)) {
    return dados.funcionarios
  }

  return []
}

function criarErroHttp(status, mensagem = MENSAGENS_PADRAO.recursoNaoEncontrado) {
  const erro = new Error(mensagem)
  erro.status = status
  return erro
}

async function tentarRotas(candidatas = [], init = {}, opcoesTratamento = {}) {
  let ultimoErro = null

  for (const candidata of candidatas) {
    const url = typeof candidata === 'string' ? candidata : candidata?.url
    const configuracao = {
      ...init,
      ...(typeof candidata === 'object' && candidata?.init ? candidata.init : {}),
    }

    if (!url) {
      continue
    }

    const response = await executarFetch(url, configuracao)

    if (response.ok) {
      return tratarResposta(response, opcoesTratamento)
    }

    if (response.status === 404) {
      ultimoErro = criarErroHttp(404)
      continue
    }

    return tratarResposta(response, opcoesTratamento)
  }

  throw ultimoErro || criarErroHttp(404)
}

export function mensagemIndicaBloqueioPlanoEstoque(mensagem) {
  const texto = normalizarTextoBusca(mensagem)

  return (
    texto.includes('estoque') &&
    (
      texto.includes('plano') ||
      texto.includes('modulo') ||
      texto.includes('recurso') ||
      texto.includes('nao disponivel') ||
      texto.includes('não disponivel') ||
      texto.includes('superior')
    )
  )
}

export async function buscarServicosVinculadosAoFuncionario(funcionarioId) {
  const response = await executarFetch(`${API_URL}/funcionarios/${funcionarioId}/servicos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarServicosVinculadosAoFuncionario(funcionarioId, servicoIds) {
  const response = await executarFetch(`${API_URL}/funcionarios/${funcionarioId}/servicos`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(servicoIds),
  })

  return tratarResposta(response)
}

export async function salvarMinhaPersonalizacao(dados) {
  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarPersonalizacaoPublica(slug) {
  const response = await executarFetch(`${API_URL}/publico/empresas/${slug}/personalizacao`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarAuditoria(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/auditoria${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAuditoriaPorId(id) {
  const response = await executarFetch(`${API_URL}/admin/auditoria/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarDashboardSaas() {
  const response = await executarFetch(`${API_URL}/admin/dashboard-saas`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarDashboardSaasResumo() {
  const response = await executarFetch(`${API_URL}/admin/dashboard-saas/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarOpcoesDashboardSaas() {
  try {
    return await tentarRotas(
      [
        `${API_URL}/admin/dashboard-saas/opcoes`,
        `${API_URL}/admin/dashboard-saas/empresas/opcoes`,
        `${API_URL}/admin/dashboard-saas/empresas`,
      ],
      {
        headers: montarHeaders(),
      },
    )
  } catch (error) {
    if (error?.status === 404) {
      return buscarEmpresas()
    }

    throw error
  }
}

export async function buscarVisaoEmpresaDashboardSaas(empresaId) {
  const id = Number(empresaId)

  return tentarRotas(
    [
      `${API_URL}/admin/dashboard-saas/empresas/${id}`,
      `${API_URL}/admin/dashboard-saas/empresa/${id}`,
      `${API_URL}/admin/dashboard-saas/visao-empresa/${id}`,
      `${API_URL}/admin/dashboard-saas/empresas/${id}/resumo`,
      `${API_URL}/admin/dashboard-saas/empresa${montarQueryString({ empresaId: id })}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
}

export async function buscarOnboarding() {
  const response = await executarFetch(`${API_URL}/onboarding`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function recalcularOnboarding() {
  const response = await executarFetch(`${API_URL}/onboarding/recalcular`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function atualizarEtapaOnboarding(etapa, dados = {}) {
  const response = await executarFetch(`${API_URL}/onboarding/etapas/${etapa}`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function marcarLinkPublicoVisualizado() {
  const response = await executarFetch(`${API_URL}/onboarding/link-publico/visualizado`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAcoesAuditoria() {
  const response = await executarFetch(`${API_URL}/admin/auditoria/acoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarModulosAuditoria() {
  const response = await executarFetch(`${API_URL}/admin/auditoria/modulos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEntidadesAuditoria() {
  const response = await executarFetch(`${API_URL}/admin/auditoria/entidades`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSegmentos(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/segmentos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarSegmentoPorId(id) {
  const response = await executarFetch(`${API_URL}/admin/segmentos/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarSegmento(dados) {
  const response = await executarFetch(`${API_URL}/admin/segmentos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarSegmento(id, dados) {
  const response = await executarFetch(`${API_URL}/admin/segmentos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function ativarSegmento(id) {
  const response = await executarFetch(`${API_URL}/admin/segmentos/${id}/ativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desativarSegmento(id) {
  const response = await executarFetch(`${API_URL}/admin/segmentos/${id}/desativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSolicitacoesCadastro(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarResumoSolicitacoesCadastro() {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSolicitacaoCadastroPorId(id) {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarSolicitacaoEmAnalise(id) {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/em-analise`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function rejeitarSolicitacaoCadastro(id, dados) {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/rejeitar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function aprovarSolicitacaoCadastro(id, dados) {
  const response = await executarFetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/aprovar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarFaturas(filtros = {}) {
  const response = await executarFetch(`${API_URL}/faturas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarResumoFaturas(filtros = {}) {
  const response = await executarFetch(`${API_URL}/faturas/resumo${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFaturaPorId(id) {
  const response = await executarFetch(`${API_URL}/faturas/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarFatura(dados) {
  const response = await executarFetch(`${API_URL}/faturas`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarFatura(id, dados) {
  const response = await executarFetch(`${API_URL}/faturas/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarStatusFatura(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/faturas/${id}/status`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function marcarFaturaPaga(id, dados = {}) {
  return atualizarStatusFatura(id, { status: 'PAGA', ...dados })
}

export async function cancelarFatura(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/faturas/${id}/cancelar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function reativarFatura(id) {
  const response = await executarFetch(`${API_URL}/faturas/${id}/reativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarStatusFinanceiroMinhaEmpresa() {
  const response = await executarFetch(`${API_URL}/minha-empresa/status-financeiro`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoFinanceiroSaas() {
  const response = await executarFetch(`${API_URL}/admin/financeiro/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEmpresasFinanceiro(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/financeiro/empresas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function alterarBloqueioFinanceiroEmpresa(empresaId, dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/financeiro/empresas/${empresaId}/bloqueio`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarMetodosPagamentoAdmin() {
  const response = await executarFetch(`${API_URL}/admin/financeiro/metodos-pagamento`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarMetodosPagamentoAdmin(dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/financeiro/metodos-pagamento`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarMetodosPagamentoAtivos() {
  const response = await executarFetch(`${API_URL}/financeiro/metodos-pagamento-ativos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFaturasRecorrentes(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFaturaRecorrentePorId(id) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSugestaoFaturaRecorrente(empresaId) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/sugestao${montarQueryString({ empresaId })}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarFaturaRecorrente(dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarFaturaRecorrente(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function ativarFaturaRecorrente(id) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/${id}/ativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desativarFaturaRecorrente(id) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/${id}/desativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function gerarFaturasRecorrentes(dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/gerar`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function gerarFaturasRecorrentesDoMes(dados = {}) {
  return gerarFaturasRecorrentes(dados)
}

export async function gerarFaturasRecorrentesMes(dados = {}) {
  return gerarFaturasRecorrentes(dados)
}

export async function gerarProximaFaturaRecorrente(id) {
  const response = await executarFetch(`${API_URL}/admin/faturas-recorrentes/${id}/gerar-proxima`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function enviarComprovanteFatura(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/faturas/${id}/comprovante`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarComprovantesFaturas(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas/comprovantes${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function aprovarComprovanteFatura(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas/${id}/comprovante/aprovar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function rejeitarComprovanteFatura(id, dados = {}) {
  const response = await executarFetch(`${API_URL}/admin/faturas/${id}/comprovante/rejeitar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioOperacaonal(filtros = {}) {
  const response = await executarFetch(`${API_URL}/relatorios/operacaonal${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioFinanceiro(filtros = {}) {
  const response = await executarFetch(`${API_URL}/relatorios/financeiro${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioResumo(filtros = {}) {
  return buscarRelatorio('/relatorios/resumo', filtros)
}

export async function buscarRelatorioAgendamentosPorDia(filtros = {}) {
  return buscarRelatorio('/relatorios/agendamentos-por-dia', filtros)
}

export async function buscarRelatorioReceitaPorDia(filtros = {}) {
  return buscarRelatorio('/relatorios/receita-por-dia', filtros)
}

export async function buscarRelatorioServicos(filtros = {}) {
  return buscarRelatorio('/relatorios/servicos', filtros)
}

export async function buscarRelatorioFuncionarios(filtros = {}) {
  return buscarRelatorio('/relatorios/funcionarios', filtros)
}

export async function buscarRelatorioClientesRecorrentes(filtros = {}) {
  return buscarRelatorio('/relatorios/clientes-recorrentes', filtros)
}

export async function buscarRelatorioStatus(filtros = {}) {
  return buscarRelatorio('/relatorios/status', filtros)
}

export async function buscarRelatorioAgendamentos(filtros = {}) {
  return buscarRelatorio('/relatorios/agendamentos', filtros)
}

export async function baixarRelatorioAgendamentosCsv(filtros = {}) {
  const response = await executarFetch(`${API_URL}/relatorios/agendamentos.csv${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  if (!response.ok) {
    const mensagemBackend = await extrairMensagemResposta(response)
    const mensagem = [401, 403].includes(response.status)
      ? mensagemPadraoPorStatus(response.status)
      : mensagemBackend
    const erro = new Error(mensagem || 'Não foi possível exportar o relatório.')
    erro.status = response.status

    if (response.status === 401) {
      encerrarSessao(mensagem)
    }

    if (response.status === 403) {
      emitirMensagemGlobal(mensagem)
    }

    throw erro
  }

  const blob = await response.blob()
  const data = new Date().toISOString().slice(0, 10)
  const nomeArquivo = `relatorio-agendamentos-${data}.csv`
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = nomeArquivo
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)

  return nomeArquivo
}

async function buscarRelatorio(caminho, filtros = {}) {
  const response = await executarFetch(`${API_URL}${caminho}${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarPlanos(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/planos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarPlanoPorId(id) {
  const response = await executarFetch(`${API_URL}/admin/planos/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarPlano(dados) {
  const response = await executarFetch(`${API_URL}/admin/planos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarPlano(id, dados) {
  const response = await executarFetch(`${API_URL}/admin/planos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function ativarPlano(id) {
  const response = await executarFetch(`${API_URL}/admin/planos/${id}/ativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desativarPlano(id) {
  const response = await executarFetch(`${API_URL}/admin/planos/${id}/desativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoEstoque(filtros = {}) {
  return tentarRotas(
    [
      `${API_URL}/estoque/resumo${montarQueryString(filtros)}`,
      `${API_URL}/estoque/produtos/resumo${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
}

export async function buscarProdutosEstoque(filtros = {}) {
  const dados = await tentarRotas(
    [
      `${API_URL}/estoque/produtos${montarQueryString(filtros)}`,
      `${API_URL}/produtos${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
    },
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarProdutoEstoque(id) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}`,
      `${API_URL}/produtos/${id}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
}

export async function criarProdutoEstoque(dados) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos`,
      `${API_URL}/produtos`,
    ],
    {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify(dados),
    },
  )
}

export async function atualizarProdutoEstoque(id, dados) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}`,
      `${API_URL}/produtos/${id}`,
    ],
    {
      method: 'PUT',
      headers: montarHeaders(true),
      body: JSON.stringify(dados),
    },
  )
}

export async function ativarProdutoEstoque(id) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}/ativar`,
      `${API_URL}/produtos/${id}/ativar`,
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(),
    },
  )
}

export async function desativarProdutoEstoque(id) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}/desativar`,
      `${API_URL}/produtos/${id}/desativar`,
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(),
    },
  )
}

export async function buscarProdutosBaixoEstoque(filtros = {}) {
  const dados = await tentarRotas(
    [
      `${API_URL}/estoque/baixo-estoque${montarQueryString(filtros)}`,
      `${API_URL}/estoque/produtos/baixo-estoque${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
    },
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarMovimentacoesEstoque(filtros = {}) {
  const dados = await tentarRotas(
    [
      `${API_URL}/estoque/movimentacoes${montarQueryString(filtros)}`,
      `${API_URL}/estoque/historico${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
    },
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function criarMovimentacaoEstoque(dados) {
  return tentarRotas(
    [
      `${API_URL}/estoque/movimentacoes`,
      `${API_URL}/estoque/produtos/movimentacoes`,
    ],
    {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify(dados),
    },
  )
}

export async function buscarAssinaturas(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/assinaturas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarAssinaturaEmpresa(empresaId) {
  const response = await executarFetch(`${API_URL}/admin/assinaturas/empresa/${empresaId}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarAssinaturaEmpresa(empresaId, dados) {
  const response = await executarFetch(`${API_URL}/admin/assinaturas/empresa/${empresaId}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function cadastrarEmpresaComOnboarding({ empresa, assinatura }) {
  const response = await executarFetch(`${API_URL}/admin/empresas/onboarding`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify({ empresa, assinatura }),
  })

  return tratarResposta(response)
}

export async function buscarOpcoesCadastroGuiadoAdmin() {
  const urlPrincipal = `${API_URL}/admin/empresas/onboarding/opcoes`
  const response = await executarFetch(urlPrincipal, {
    headers: montarHeaders(),
  })

  if (response.status === 404) {
    const planos = await buscarPlanos().catch(() => [])
    return { planos }
  }

  return tratarResposta(response)
}

export async function validarSlugOnboardingAdmin(slug) {
  const response = await executarFetch(
    `${API_URL}/admin/empresas/onboarding/validar-slug${montarQueryString({ slug })}`,
    {
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function validarEmailAdminOnboardingAdmin(email) {
  const response = await executarFetch(
    `${API_URL}/admin/empresas/onboarding/validar-email-admin${montarQueryString({ email })}`,
    {
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function criarEmpresaCadastroGuiadoAdmin(payload) {
  const response = await executarFetch(`${API_URL}/admin/empresas/onboarding`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function buscarMinhaAssinatura() {
  const response = await executarFetch(`${API_URL}/minha-empresa/assinatura`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarUsoPlano() {
  const response = await executarFetch(`${API_URL}/minha-empresa/uso-plano`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarMinhasConfiguracoesNotificacoes() {
  const response = await executarFetch(`${API_URL}/minha-empresa/notificacoes/configuracoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarMinhasConfiguracoesNotificacoes(payload) {
  const response = await executarFetch(`${API_URL}/minha-empresa/notificacoes/configuracoes`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function buscarConfiguracoesNotificacoesEmpresa(empresaId) {
  const response = await executarFetch(`${API_URL}/admin/empresas/${empresaId}/notificacoes/configuracoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarConfiguracoesNotificacoesEmpresa(empresaId, payload) {
  const response = await executarFetch(`${API_URL}/admin/empresas/${empresaId}/notificacoes/configuracoes`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function buscarAgendamentosExcluidos(filtros = {}) {
  const response = await executarFetch(
    `${API_URL}/admin/lixeira/agendamentos${montarQueryString(filtros)}`,
    {
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function restaurarAgendamento(id) {
  const response = await executarFetch(`${API_URL}/admin/lixeira/agendamentos/${id}/restaurar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarNotificacoes(filtros = {}) {
  const response = await executarFetch(`${API_URL}/notificacoes${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoNotificacoes() {
  const response = await executarFetch(`${API_URL}/notificacoes/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarNotificacaoComoLida(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/lida`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarNotificacaoComoLidaAdmin(id) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}/lida`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarTodasNotificacoesComoLidas() {
  const response = await executarFetch(`${API_URL}/notificacoes/marcar-todas-lidas`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function arquivarNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/arquivar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desarquivarNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/desarquivar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function excluirNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/excluir`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function restaurarNotificacao(id) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}/restaurar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function arquivarNotificacaoAdmin(id) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}/arquivar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desarquivarNotificacaoAdmin(id) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}/desarquivar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function excluirNotificacaoAdmin(id) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}/excluir`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarNotificacoesAdmin(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function listarNotificacoesLixeiraAdmin(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/lixeira${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function editarNotificacaoAdmin(id, payload) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function buscarTemplatesNotificacao() {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/templates`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function atualizarTemplateNotificacao(id, payload) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/templates/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function enviarNotificacaoManual(payload) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/manual`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function buscarLogsNotificacao(filtros = {}) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/logs${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarOpcoesLogsNotificacao() {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/logs/opcoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function executarLembretesFinanceiros() {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/lembretes-financeiros/executar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function executarLembretesAgendamentos() {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/lembretes-agendamentos/executar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoLembretesAgendamentos(params = {}) {
  const response = await executarFetch(
    `${API_URL}/admin/notificacoes/lembretes-agendamentos/resumo${montarQueryString(params)}`,
    {
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function buscarLembretesAgendamentos(params = {}) {
  const response = await executarFetch(`${API_URL}/admin/notificacoes/lembretes-agendamentos${montarQueryString(params)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(params) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarAutomacoesDisponiveis() {
  const response = await executarFetch(`${API_URL}/admin/automacoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoAutomacoes() {
  const response = await executarFetch(`${API_URL}/admin/automacoes/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarExecucoesAutomacoes(params = {}) {
  const response = await executarFetch(`${API_URL}/admin/automacoes/execucoes${montarQueryString(params)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(params) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarExecucaoAutomacaoPorId(id) {
  const response = await executarFetch(`${API_URL}/admin/automacoes/execucoes/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function executarAutomacaoLembretesAgendamentos() {
  const response = await executarFetch(`${API_URL}/admin/automacoes/lembretes-agendamentos/executar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function executarAutomacaoLembretesFinanceiros() {
  const response = await executarFetch(`${API_URL}/admin/automacoes/lembretes-financeiros/executar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function executarAutomacaoFaturasRecorrentes() {
  const response = await executarFetch(`${API_URL}/admin/automacoes/faturas-recorrentes/gerar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function login(email, senha) {
  const response = await executarFetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, senha }),
  })

  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response)
    const cadastroPendente = [401, 403, 423].includes(response.status) && mensagemIndicaCadastroPendente(mensagem)
    const mensagemTratada =
      cadastroPendente
        ? MENSAGEM_CADASTRO_PENDENTE
        : response.status === 401
          ? 'Não foi possível fazer login. Confira e-mail e senha.'
          : mensagem
    const erro = new Error(mensagemTratada)
    erro.status = response.status
    erro.cadastroPendente = cadastroPendente
    throw erro
  }

  return tratarResposta(response, {
    encerrarSessao401: false,
    emitir403: false,
  })
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const response = await executarFetch(`${API_URL}/auth/alterar-senha`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify({ senhaAtual, novaSenha }),
  })

  return tratarResposta(response)
}

export async function buscarMinhaConta() {
  const response = await executarFetch(`${API_URL}/minha-conta`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function atualizarMinhaConta(payload) {
  const response = await executarFetch(`${API_URL}/minha-conta`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function alterarSenhaMinhaConta(senhaAtual, novaSenha) {
  const response = await executarFetch(`${API_URL}/minha-conta/senha`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify({ senhaAtual, novaSenha }),
  })

  return tratarResposta(response)
}

export async function buscarEmpresas(filtros = {}) {
  const response = await executarFetch(`${API_URL}/empresas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarMinhaEmpresa() {
  const response = await executarFetch(`${API_URL}/minha-empresa`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function atualizarMinhaEmpresa(empresa) {
  const response = await executarFetch(`${API_URL}/minha-empresa`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function cadastrarEmpresa(empresa) {
  const response = await executarFetch(`${API_URL}/empresas`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function atualizarEmpresa(id, empresa) {
  const response = await executarFetch(`${API_URL}/empresas/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoEmpresa(id, ativo) {
  const response = await executarFetch(`${API_URL}/empresas/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function buscarUsuarios(filtros = {}) {
  const response = await executarFetch(`${API_URL}/usuarios${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function cadastrarUsuario(usuario) {
  const response = await executarFetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(usuario),
  })

  return tratarResposta(response)
}

export async function atualizarUsuario(id, usuario) {
  const response = await executarFetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(usuario),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoUsuario(id, ativo) {
  const response = await executarFetch(`${API_URL}/usuarios/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarCliente(cliente) {
  const response = await executarFetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function atualizarCliente(id, cliente) {
  const response = await executarFetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function cadastrarServico(servico) {
  const response = await executarFetch(`${API_URL}/servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarServico(id, servico) {
  const response = await executarFetch(`${API_URL}/servicos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoServico(id, ativo) {
  const response = await executarFetch(`${API_URL}/servicos/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarFuncionario(funcionario) {
  const response = await executarFetch(`${API_URL}/funcionarios`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarFuncionario(id, funcionario) {
  const response = await executarFetch(`${API_URL}/funcionarios/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoFuncionario(id, ativo) {
  const response = await executarFetch(`${API_URL}/funcionarios/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarAgendamento(agendamento) {
  const response = await executarFetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(agendamento),
  })

  return tratarResposta(response)
}

export async function atualizarAgendamento(id, agendamento) {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(agendamento),
  })

  return tratarResposta(response)
}

export async function atualizarStatusAgendamento(id, status) {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}/status`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ status }),
  })

  return tratarResposta(response)
}

export async function excluirAgendamento(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}
