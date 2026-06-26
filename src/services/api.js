import { debugLog } from '@/utils/devDebug'
import { normalizarUrlImagemPublica } from '@/utils/imagens'
import {
  HEADER_EMPRESA_OPERACIONAL,
  resolverEmpresaIdEfetiva,
  resolverEmpresaOperacionalHeader,
  resolverPayloadEmpresaEfetiva,
  resolverQueryEmpresaEfetiva,
  usuarioEhSuperAdmin,
} from './empresaOperacionalHeader'

const PUBLIC_APP_URL_HOMOLOGACAO = 'https://gestao-hml.nuvemmais.com.br'
const PUBLIC_APP_URL_PRODUCAO = 'https://gestao.nuvemmais.com.br'
export const TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO = 'Pedir pelo WhatsApp'

const API_URL_FALLBACK = import.meta.env.DEV ? 'http://localhost:8080' : 'https://api.nuvemmais.com.br'
const PUBLIC_APP_URL_FALLBACK = import.meta.env.DEV ? 'http://localhost:5173' : PUBLIC_APP_URL_PRODUCAO
export const APP_NAME = String(import.meta.env.VITE_APP_NAME || 'NuvemMais Gestão').trim() || 'NuvemMais Gestão'
export const APP_VERSION = String(import.meta.env.VITE_APP_VERSION || __APP_VERSION__ || '').trim()
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

const CHAVE_EMPRESA_VISUALIZACAO = 'empresaVisualizacao'
export const EVENTO_EMPRESA_VISUALIZACAO = 'empresa-visualizacao-atualizada'
export const EVENTO_UNIDADES_ESTOQUE_ATUALIZADAS = 'unidades-estoque-atualizadas'
const CAMINHOS_PUBLICOS_FRONTEND = ['/cadastro', '/cadastro-empresa', '/comece-agora', '/termos', '/privacidade', '/sobre']
const CAMINHOS_NEUTROS_PARA_NOTIFICACOES = ['/login', '/cadastro-pendente', '/alterar-senha']

function normalizarUrlBase(url, fallback = '') {
  const valor = String(url || '').trim()

  return (valor || fallback).replace(/\/+$/, '')
}

function resolverApiUrl() {
  const configurada = normalizarUrlBase(import.meta.env.VITE_API_URL)

  if (configurada) {
    return configurada
  }

  return normalizarUrlBase(API_URL_FALLBACK)
}

export const API_URL = resolverApiUrl()
const PUBLIC_APP_URL = normalizarUrlBase(import.meta.env.VITE_PUBLIC_APP_URL, PUBLIC_APP_URL_FALLBACK)
export const APP_ENVIRONMENT = normalizarAmbienteAplicacao(
  import.meta.env.VITE_APP_ENVIRONMENT || (import.meta.env.DEV ? 'dev' : 'production'),
)
const VERSAO_PRODUCAO_PADRAO = '1.3.0'
const VERSAO_HML_MINIMA = '1.3.0-hml'
const DATA_PUBLICACAO_VERSAO_PADRAO =
  String(import.meta.env.VITE_APP_RELEASE_DATE || '2026-06-14').trim() || '2026-06-14'
const NOVIDADES_VERSAO_PADRAO = Object.freeze([
  'Gestão Esportiva para diferentes modalidades.',
  'Turmas, profissionais, participantes e mensalidades.',
  'Planos apresentados de forma mais clara.',
  'Melhorias no modo operacional do SUPER_ADMIN.',
  'Correções no uso do plano por empresa.',
  'Melhorias visuais e mensagens de validação.',
])


export function obterUrlPublicaFrontend() {
  const origemAtual =
    typeof window !== 'undefined' && window.location?.origin ? normalizarUrlBase(window.location.origin) : ''
  const hostnameAtual = obterHostnameAtual()
  const ambienteAtual = resolverAmbienteSeguroPorHostname(hostnameAtual) || APP_ENVIRONMENT

  if (origemAtual && hostnameEhLocal(hostnameAtual)) {
    return origemAtual
  }

  if (hostnameIndicaHomologacao(hostnameAtual) || ambienteAtual === 'homologacao') {
    return PUBLIC_APP_URL_HOMOLOGACAO
  }

  if (hostnameEhProducaoOficial(hostnameAtual) || ambienteAtual === 'production') {
    return PUBLIC_APP_URL_PRODUCAO
  }

  if (PUBLIC_APP_URL) {
    return PUBLIC_APP_URL
  }

  return origemAtual || PUBLIC_APP_URL_FALLBACK
}

export function montarLinkPublicoAgendamento(slug) {
  const slugNormalizado = String(slug || '').trim()

  return slugNormalizado ? `${obterUrlPublicaFrontend()}/agendar/${slugNormalizado}` : ''
}

export function montarLinkPublicoCatalogo(slug) {
  const slugNormalizado = String(slug || '').trim()

  return slugNormalizado ? `${obterUrlPublicaFrontend()}/catalogo/${slugNormalizado}` : ''
}

export function montarLinkPublicoCardapio(slug) {
  const slugNormalizado = String(slug || '').trim()

  return slugNormalizado ? `${obterUrlPublicaFrontend()}/cardapio/${slugNormalizado}` : ''
}

function normalizarSlugPublico(slug) {
  return encodeURIComponent(String(slug || '').trim())
}

export function caminhoEhRotaPublicaFrontend(caminho) {
  const caminhoNormalizado = String(caminho || '').trim()

  if (!caminhoNormalizado) {
    return false
  }

  return (
    caminhoNormalizado.startsWith('/agendar/') ||
    caminhoNormalizado.startsWith('/catalogo/') ||
    caminhoNormalizado.startsWith('/cardapio/') ||
    CAMINHOS_PUBLICOS_FRONTEND.includes(caminhoNormalizado)
  )
}

function rotaAtualEhPublicaFrontend() {
  if (typeof window === 'undefined') {
    return false
  }

  return caminhoEhRotaPublicaFrontend(window.location?.pathname || '')
}

function caminhoEvitaNotificacoesAutenticadas(caminho) {
  const caminhoNormalizado = String(caminho || '').trim()

  if (!caminhoNormalizado) {
    return true
  }

  if (
    caminhoEhRotaPublicaFrontend(caminhoNormalizado) ||
    CAMINHOS_NEUTROS_PARA_NOTIFICACOES.includes(caminhoNormalizado)
  ) {
    return true
  }

  return (
    caminhoNormalizado.startsWith('/agendar/') ||
    caminhoNormalizado.startsWith('/catalogo/') ||
    caminhoNormalizado.startsWith('/cardapio/')
  )
}

export function temSessaoAutenticada() {
  const token = localStorage.getItem('token')

  return Boolean(token && carregarUsuarioSessao())
}

export function podeConsultarNotificacoesAutenticadas(caminho = '') {
  const caminhoAtual =
    String(caminho || '').trim() || (typeof window !== 'undefined' ? window.location?.pathname || '' : '')

  return temSessaoAutenticada() && !caminhoEvitaNotificacoesAutenticadas(caminhoAtual)
}

function normalizarBooleano(valor) {
  return valor === true
}

export function normalizarAmbienteAplicacao(valor) {
  const ambiente = String(valor || '')
    .trim()
    .toLowerCase()

  if (!ambiente) {
    return 'production'
  }

  if (['prod', 'producao', 'produção', 'production'].includes(ambiente)) {
    return 'production'
  }

  if (['hml', 'homolog', 'homologacao', 'homologação', 'staging'].includes(ambiente)) {
    return 'homologacao'
  }

  if (['dev', 'development', 'desenvolvimento'].includes(ambiente)) {
    return 'dev'
  }

  if (['local', 'localhost'].includes(ambiente)) {
    return 'local'
  }

  return ambiente
}

function obterHostnameAtual() {
  if (typeof window === 'undefined' || !window.location) {
    return ''
  }

  return String(window.location.hostname || '')
    .trim()
    .toLowerCase()
}

function hostnameEhLocal(hostname = obterHostnameAtual()) {
  return (
    hostname === 'localhost' ||
    hostname === '::1' ||
    hostname === '[::1]' ||
    hostname === '0.0.0.0' ||
    hostname.startsWith('127.') ||
    hostname.endsWith('.local')
  )
}

function hostnameEhProducaoOficial(hostname = obterHostnameAtual()) {
  return ['gestao.nuvemmais.com.br', 'www.gestao.nuvemmais.com.br'].includes(hostname)
}

function hostnameIndicaHomologacao(hostname = obterHostnameAtual()) {
  if (!hostname) {
    return false
  }

  if (['gestao-hml.nuvemmais.com.br', 'www.gestao-hml.nuvemmais.com.br'].includes(hostname)) {
    return true
  }

  return /(^|[.-])hml([.-]|$)/i.test(hostname) || hostname.includes('homolog')
}

function resolverAmbienteSeguroPorHostname(hostname = obterHostnameAtual()) {
  if (hostnameEhLocal(hostname)) {
    return 'local'
  }

  if (hostnameIndicaHomologacao(hostname)) {
    return 'homologacao'
  }

  if (hostnameEhProducaoOficial(hostname)) {
    return 'production'
  }

  return ''
}

function resolverVersaoSeguraPorHostname(hostname = obterHostnameAtual()) {
  if (hostnameIndicaHomologacao(hostname)) {
    return VERSAO_HML_MINIMA
  }

  if (hostnameEhProducaoOficial(hostname)) {
    return VERSAO_PRODUCAO_PADRAO
  }

  return ''
}

function garantirSufixoVersaoHomologacao(versao, fallback = VERSAO_HML_MINIMA) {
  const valor = String(versao || '').trim()

  if (!valor) {
    return fallback
  }

  if (/-hml$/i.test(valor)) {
    return valor
  }

  return `${valor}-hml`
}

export function obterTipoSeloAmbiente(valor) {
  const ambiente = normalizarAmbienteAplicacao(valor)
  const hostname = obterHostnameAtual()

  if (ambiente === 'homologacao' || hostnameIndicaHomologacao(hostname)) {
    return 'homologacao'
  }

  if (hostnameEhLocal(hostname) && ['local', 'dev'].includes(ambiente)) {
    return 'local'
  }

  return ''
}

export function ambienteExibeSelo(valor) {
  return Boolean(obterTipoSeloAmbiente(valor))
}

export function formatarRotuloAmbiente(valor) {
  const ambiente = normalizarAmbienteAplicacao(valor)

  if (ambiente === 'production') {
    return 'Produção'
  }

  if (ambiente === 'homologacao') {
    return 'Homologação'
  }

  if (ambiente === 'dev') {
    return 'Desenvolvimento'
  }

  if (ambiente === 'local') {
    return 'Local'
  }

  return ambiente ? ambiente.charAt(0).toUpperCase() + ambiente.slice(1) : ''
}

export function obterInfoVersaoSistemaPadrao() {
  const hostname = obterHostnameAtual()
  const versaoSeguraPorHostname = resolverVersaoSeguraPorHostname(hostname)
  const ambienteSegurancaHost = resolverAmbienteSeguroPorHostname(hostname)
  const versaoBase = String(APP_VERSION || '').trim()
  const ambientePorVersao = /-hml$/i.test(versaoBase) ? 'homologacao' : APP_ENVIRONMENT
  let ambiente = normalizarAmbienteAplicacao(ambienteSegurancaHost || ambientePorVersao || 'production')

  if (!hostnameEhLocal(hostname) && ['dev', 'local'].includes(ambiente)) {
    ambiente = hostnameIndicaHomologacao(hostname) ? 'homologacao' : 'production'
  }

  let versao = versaoBase

  if (ambiente === 'homologacao') {
    const versaoMinimaHomologacao = versaoSeguraPorHostname || VERSAO_HML_MINIMA
    const versaoHomologacaoBase =
      !versaoBase || versaoEhMenorQue(versaoBase, versaoMinimaHomologacao) ? versaoMinimaHomologacao : versaoBase
    versao = garantirSufixoVersaoHomologacao(versaoHomologacaoBase, versaoMinimaHomologacao)
  } else if (ambiente === 'production') {
    versao = versaoSeguraPorHostname || versaoBase || VERSAO_PRODUCAO_PADRAO
  } else if (['local', 'dev'].includes(ambiente)) {
    versao = versaoBase || 'dev'
  } else {
    versao = versaoBase || versaoSeguraPorHostname || VERSAO_PRODUCAO_PADRAO
  }

  return {
    nome: APP_NAME,
    versao,
    ambiente,
    dataPublicacao: DATA_PUBLICACAO_VERSAO_PADRAO,
    novidades: [...NOVIDADES_VERSAO_PADRAO],
  }
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

export function obterEmpresaVisualizacao() {
  if (typeof window === 'undefined') {
    return null
  }

  const dadosSalvos = localStorage.getItem(CHAVE_EMPRESA_VISUALIZACAO) || sessionStorage.getItem(CHAVE_EMPRESA_VISUALIZACAO)

  if (dadosSalvos) {
    try {
      const dados = JSON.parse(dadosSalvos)
      const id = dados?.id ?? dados?.empresaVisualizacaoId

      if (!id) {
        return null
      }

      return {
        id: String(id),
        nome: String(dados?.nome || dados?.empresaVisualizacaoNome || 'Empresa').trim() || 'Empresa',
      }
    } catch (error) {
      console.error(error)
      return null
    }
  }

  // Compatibilidade com sessões antigas que armazenavam apenas as chaves separadas.
  const empresaVisualizacaoId =
    localStorage.getItem('empresaVisualizacaoId') || sessionStorage.getItem('empresaVisualizacaoId')
  const empresaVisualizacaoNome =
    localStorage.getItem('empresaVisualizacaoNome') || sessionStorage.getItem('empresaVisualizacaoNome')

  if (!empresaVisualizacaoId || !String(empresaVisualizacaoId).trim()) {
    return null
  }

  return {
    id: String(empresaVisualizacaoId).trim(),
    nome: String(empresaVisualizacaoNome || 'Empresa').trim() || 'Empresa',
  }
}

export function definirEmpresaVisualizacao(empresa) {
  if (typeof window === 'undefined') {
    return null
  }

  const id = empresa?.id ?? empresa?.empresaVisualizacaoId

  if (!id) {
    limparEmpresaVisualizacao()
    return null
  }

  const dados = {
    id: String(id),
    nome: String(empresa?.nome || empresa?.empresaVisualizacaoNome || 'Empresa').trim() || 'Empresa',
  }

  localStorage.setItem(CHAVE_EMPRESA_VISUALIZACAO, JSON.stringify(dados))
  sessionStorage.setItem(CHAVE_EMPRESA_VISUALIZACAO, JSON.stringify(dados))
  localStorage.setItem('empresaVisualizacaoId', dados.id)
  localStorage.setItem('empresaVisualizacaoNome', dados.nome)
  sessionStorage.setItem('empresaVisualizacaoId', dados.id)
  sessionStorage.setItem('empresaVisualizacaoNome', dados.nome)
  window.dispatchEvent(new CustomEvent(EVENTO_EMPRESA_VISUALIZACAO, { detail: dados }))

  return dados
}

export function limparEmpresaVisualizacao() {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.removeItem(CHAVE_EMPRESA_VISUALIZACAO)
  sessionStorage.removeItem(CHAVE_EMPRESA_VISUALIZACAO)
  localStorage.removeItem('empresaVisualizacaoId')
  localStorage.removeItem('empresaVisualizacaoNome')
  sessionStorage.removeItem('empresaVisualizacaoId')
  sessionStorage.removeItem('empresaVisualizacaoNome')
  window.dispatchEvent(new CustomEvent(EVENTO_EMPRESA_VISUALIZACAO, { detail: null }))
}

export function modoVisualizacaoEmpresaAtivo() {
  const usuario = carregarUsuarioSessao()

  return Boolean(usuarioEhSuperAdmin(usuario) && !obterEmpresaVisualizacao())
}

export function anexarEmpresaIdOperacionalNaQuery(filtros = {}) {
  const usuario = carregarUsuarioSessao()
  return resolverQueryEmpresaEfetiva(usuario, obterEmpresaVisualizacao(), filtros)
}

function montarQueryEmpresaOperacional(filtros = {}) {
  return montarQueryString(anexarEmpresaIdOperacionalNaQuery(filtros))
}

function anexarEmpresaIdOperacionalNoPayload(dados = {}) {
  const usuario = carregarUsuarioSessao()
  return resolverPayloadEmpresaEfetiva(usuario, obterEmpresaVisualizacao(), dados)
}

export function aplicarEmpresaVisualizacao(filtros = {}) {
  return anexarEmpresaIdOperacionalNaQuery(filtros)
}

function aplicarEmpresaSelecionadaNoPayload(dados = {}) {
  return anexarEmpresaIdOperacionalNoPayload(dados)
}

export function obterEmpresaIdOperacao() {
  const usuario = carregarUsuarioSessao()

  return String(resolverEmpresaIdEfetiva(usuario, obterEmpresaVisualizacao()) || '').trim()
}

export function notificarUnidadesEstoqueAtualizadas() {
  if (typeof window === 'undefined') {
    return
  }

  window.dispatchEvent(new CustomEvent(EVENTO_UNIDADES_ESTOQUE_ATUALIZADAS))
}

export function limparSessaoAutenticacao({ notificar = true } = {}) {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  localStorage.removeItem('empresa')
  localStorage.removeItem('empresaAtual')
  limparEmpresaVisualizacao()
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
    Object.assign(headers, resolverEmpresaOperacionalHeader(carregarUsuarioSessao(), obterEmpresaVisualizacao()))
  } else {
    delete headers[HEADER_EMPRESA_OPERACIONAL]
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

function limparVazios(objeto = {}) {
  if (!objeto || typeof objeto !== 'object') {
    return {}
  }

  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => {
      if (valor === null || valor === undefined) {
        return false
      }

      if (typeof valor === 'string') {
        return valor.trim() !== ''
      }

      return true
    }),
  )
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
  const configuracaoFetch = {
    ...(init || {}),
  }

  if (configuracaoFetch.cache == null) {
    configuracaoFetch.cache = 'no-store'
  }

  try {
    return await fetch(input, configuracaoFetch)
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

  if (rotaAtualEhPublicaFrontend()) {
    return
  }

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
    dados.mensagem,
    dados.detail,
    dados.detalhe,
    dados.error,
    dados.erro,
    dados.title,
    dados.titulo,
    dados.titulo,
    dados.descricao,
  ]

  const mensagemDireta = mensagens.map(normalizarMensagemErro).find(Boolean)
  if (mensagemDireta) {
    return mensagemDireta
  }

  return extrairMensagemEstruturada(dados)
}

function normalizarMensagemErro(mensagem) {
  const texto = String(mensagem || '').trim()

  if (!texto || mensagemGenerica(texto)) {
    return ''
  }

  return sanitizarMensagemUsuario(texto, '')
}

function extrairMensagemEstruturada(valor, visitados = new Set()) {
  if (valor === null || valor === undefined) {
    return ''
  }

  if (typeof valor === 'string') {
    return normalizarMensagemErro(valor)
  }

  if (typeof valor !== 'object') {
    return ''
  }

  if (visitados.has(valor)) {
    return ''
  }

  visitados.add(valor)

  if (Array.isArray(valor)) {
    for (const item of valor) {
      const mensagem = extrairMensagemEstruturada(item, visitados)
      if (mensagem) {
        return mensagem
      }
    }
    return ''
  }

  const camposPrioritarios = [
    'message',
    'mensagem',
    'detail',
    'detalhe',
    'error',
    'erro',
    'title',
    'titulo',
    'descricao',
    'description',
  ]

  for (const campo of camposPrioritarios) {
    const mensagem = extrairMensagemEstruturada(valor[campo], visitados)
    if (mensagem) {
      return mensagem
    }
  }

  const colecoes = [valor.errors, valor.violations, valor.violation, valor.violacao, valor.violacoes]
  for (const colecao of colecoes) {
    const mensagem = extrairMensagemEstruturada(colecao, visitados)
    if (mensagem) {
      return mensagem
    }
  }

  for (const chave of Object.keys(valor)) {
    if (camposPrioritarios.includes(chave)) {
      continue
    }

    const mensagem = extrairMensagemEstruturada(valor[chave], visitados)
    if (mensagem) {
      return mensagem
    }
  }

  return ''
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

const OPCOES_EXCLUSAO_LOGICA = {
  emitir403: false,
    mensagem403: 'Você não tem permissão para excluir este registro.',
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

async function tratarRespostaCustomizada(response, opcoes = {}) {
  const {
    encerrarSessao401 = true,
    emitir403 = true,
    mensagem401 = '',
    mensagem403 = '',
    mensagensPorStatus = {},
  } = opcoes

  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response)
    const mensagemTratada =
      response.status === 401
        ? mensagem401 || mensagensPorStatus[401] || mensagemPadraoPorStatus(response.status)
        : response.status === 403
          ? mensagem403 || mensagensPorStatus[403] || mensagemPadraoPorStatus(response.status)
          : mensagensPorStatus[response.status] || mensagem
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

async function tratarResposta(response, opcoes = {}) {
  return tratarRespostaCustomizada(response, opcoes)
}

async function tratarRespostaOpcional(response, opcoes = {}) {
  if ([404, 405].includes(response.status)) {
    return null
  }

  return tratarResposta(response, opcoes)
}

async function tratarRespostaPublica(response) {
  if (!response.ok) {
    const mensagem = await extrairMensagemErro(response)
    const erro = new Error(mensagem)
    erro.status = response.status
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

export async function buscarClientes(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/clientes${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtrosConsulta) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarServicos(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/servicos${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtrosConsulta) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarFuncionarios(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/funcionarios${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtrosConsulta) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarAgendamentos(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/agendamentos${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEmpresaPublica(slug) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return tratarRespostaPublica(response)
}

export async function buscarServicosPublicos(slug) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/servicos`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return tratarRespostaPublica(response)
}

export async function buscarCatalogoPublico(slug) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/catalogo/${slugNormalizado}`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return normalizarRespostaCatalogoPublico(await tratarRespostaPublica(response))
}

export async function buscarCardapioPublico(slug) {
  return buscarCatalogoPublico(slug)
}

export async function buscarSegmentosPublicos() {
  const response = await executarFetch(`${API_URL}/publico/segmentos`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
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
    cache: 'no-store',
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
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/funcionarios${montarQueryString(filtros)}`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return tratarRespostaPublica(response)
}

export async function buscarDisponibilidadePublica(slug, servicoId, funcionarioId, data) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const params = new URLSearchParams({
    servicoId,
    funcionarioId,
    data,
  })

  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/disponibilidade?${params}`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return tratarRespostaPublica(response)
}

export async function buscarDisponibilidadeDataPublica(slug, data) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const params = new URLSearchParams({ data })
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/disponibilidade-data?${params}`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
  })

  return tratarRespostaPublica(response)
}

export async function criarAgendamentoPublico(slug, dados) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/agendamentos`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
  })

  return tratarRespostaPublica(response)
}

export async function buscarMinhaPersonalizacao() {
  const filtrosConsulta = anexarEmpresaIdOperacionalNaQuery({})
  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function uploadLogoEmpresa(imagem) {
  const formData = new FormData()
  formData.append('imagem', imagem)

  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao/logo${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'POST',
    headers: montarHeaders(),
    body: formData,
  })

  return tratarResposta(response)
}

export async function buscarStatusUploadsEmpresa() {
  const filtrosConsulta = anexarEmpresaIdOperacionalNaQuery({})
  const response = await executarFetch(`${API_URL}/minha-empresa/uploads/status${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarRespostaOpcional(response)
}

export async function buscarResumoUploadsEmpresa() {
  const filtrosConsulta = anexarEmpresaIdOperacionalNaQuery({})
  const response = await executarFetch(`${API_URL}/minha-empresa/uploads/resumo${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarRespostaOpcional(response)
}

export async function removerLogoEmpresa() {
  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao/logo${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarRespostaOpcional(response)
}

export async function uploadBannerEmpresa(imagem) {
  const formData = new FormData()
  formData.append('imagem', imagem)

  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao/banner${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'POST',
    headers: montarHeaders(),
    body: formData,
  })

  return tratarResposta(response)
}

export async function removerBannerEmpresa() {
  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao/banner${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarRespostaOpcional(response)
}

export async function buscarIndisponibilidades(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/indisponibilidades${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarIndisponibilidadePorId(id) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}${montarQueryEmpresaOperacional()}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarIndisponibilidade(dados) {
  const response = await executarFetch(`${API_URL}/indisponibilidades`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
  })

  return tratarResposta(response)
}

export async function atualizarIndisponibilidade(id, dados) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
  })

  return tratarResposta(response)
}

export async function excluirIndisponibilidade(id) {
  const response = await executarFetch(`${API_URL}/indisponibilidades/${id}${montarQueryEmpresaOperacional()}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionarioServicos(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/funcionario-servicos${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function vincularFuncionarioServico(dados) {
  const response = await executarFetch(`${API_URL}/funcionario-servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
  })

  return tratarResposta(response)
}

export async function excluirFuncionarioServico(id) {
  const response = await executarFetch(`${API_URL}/funcionario-servicos/${id}${montarQueryEmpresaOperacional()}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionariosVinculadosAoServico(servicoId) {
  const queryEmpresa = montarQueryEmpresaOperacional()
  const urlPrincipal = `${API_URL}/servicos/${servicoId}/funcionarios-vinculados${queryEmpresa}`
  const response = await executarFetch(urlPrincipal, {
    headers: montarHeaders(),
  })

  if (response.status === 404) {
    const urlFallback = `${API_URL}/servicos/${servicoId}/funcionarios${queryEmpresa}`
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
  const url = `${API_URL}/servicos/${servicoId}/funcionarios-vinculados${montarQueryEmpresaOperacional()}`
  const payload = aplicarEmpresaSelecionadaNoPayload({ funcionarioIds })
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

  if (Array.isArray(dados.unidades)) {
    return dados.unidades
  }

  if (Array.isArray(dados.unidadesEstoque)) {
    return dados.unidadesEstoque
  }

  if (Array.isArray(dados.data?.unidades)) {
    return dados.data.unidades
  }

  if (Array.isArray(dados.data?.unidadesEstoque)) {
    return dados.data.unidadesEstoque
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

function normalizarObjetoVersaoSistema(valor) {
  if (!valor || typeof valor !== 'object') {
    return {}
  }

  if (valor.data && typeof valor.data === 'object' && !Array.isArray(valor.data)) {
    return valor.data
  }

  return valor
}

function obterCampoVersaoSistema(origem, ...campos) {
  for (const campo of campos) {
    const valor = origem?.[campo]

    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return valor
    }
  }

  return ''
}

function normalizarNovidadesVersaoSistema(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (item && typeof item === 'object') {
          return String(
            item.titulo ||
              item.descricao ||
              item.texto ||
              item.label ||
              item.nome ||
              '',
          ).trim()
        }

        return ''
      })
      .filter(Boolean)
  }

  if (typeof valor === 'string' && valor.trim()) {
    return valor
      .split(/\r?\n|;/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

function extrairVersaoSemSufixo(versao) {
  const texto = String(versao || '').trim().toLowerCase()
  const semSufixo = texto.split('-')[0]
  const partes = semSufixo.split('.').map((parte) => Number(parte))

  if (partes.length < 3 || partes.some((parte) => !Number.isFinite(parte))) {
    return null
  }

  return partes
}

function versaoEhMenorQue(versaoA, versaoB) {
  const partesA = extrairVersaoSemSufixo(versaoA)
  const partesB = extrairVersaoSemSufixo(versaoB)

  if (!partesA || !partesB) {
    return false
  }

  for (let indice = 0; indice < 3; indice += 1) {
    if (partesA[indice] < partesB[indice]) {
      return true
    }

    if (partesA[indice] > partesB[indice]) {
      return false
    }
  }

  return false
}

function mesclarInfoVersaoSistema(respostaApi) {
  const padrao = obterInfoVersaoSistemaPadrao()
  const origem = normalizarObjetoVersaoSistema(respostaApi)
  const hostname = obterHostnameAtual()
  const ambienteResposta = normalizarAmbienteAplicacao(
    obterCampoVersaoSistema(origem, 'ambiente', 'environment', 'perfil', 'stage') || padrao.ambiente,
  )
  const ambienteApi =
    !hostnameEhLocal(hostname) && ['dev', 'local'].includes(ambienteResposta)
      ? resolverAmbienteSeguroPorHostname(hostname) || padrao.ambiente
      : ambienteResposta
  const versaoApi = String(obterCampoVersaoSistema(origem, 'versao', 'version', 'appVersion') || '').trim()
  const novidadesApi = normalizarNovidadesVersaoSistema(
    origem.novidades ??
      origem.changelog ??
      origem.itens ??
      origem.items ??
      origem.alteracoes ??
      origem.changes,
  )
  let versaoFinal = versaoApi || padrao.versao

  if (ambienteApi === 'homologacao') {
    const versaoMinimaHomologacao = resolverVersaoSeguraPorHostname(hostname) || VERSAO_HML_MINIMA
    if (versaoEhMenorQue(versaoFinal, versaoMinimaHomologacao)) {
      versaoFinal = versaoMinimaHomologacao
    }
    versaoFinal = garantirSufixoVersaoHomologacao(versaoFinal, versaoMinimaHomologacao)
  } else if (ambienteApi === 'production') {
    versaoFinal = versaoFinal || resolverVersaoSeguraPorHostname(hostname) || VERSAO_PRODUCAO_PADRAO
  }

  return {
    nome: padrao.nome,
    versao: versaoFinal,
    ambiente: ambienteApi,
    dataPublicacao:
      obterCampoVersaoSistema(origem, 'dataPublicacao', 'publicadoEm', 'releaseDate', 'publishedAt') ||
      padrao.dataPublicacao,
    novidades: novidadesApi.length ? novidadesApi : padrao.novidades,
  }
}

export async function buscarVersaoSistema() {
  try {
    const respostaApi = await tentarRotas(
      [
        {
          url: `${API_URL}/publico/versao`,
          init: {
            headers: montarHeadersPublicos(),
          },
        },
        {
          url: `${API_URL}/versao`,
          init: {
            headers: montarHeaders(),
          },
        },
      ],
      {
        headers: montarHeadersPublicos(),
      },
      {
        encerrarSessao401: false,
        emitir403: false,
        mensagem401: MENSAGENS_PADRAO.erroCarregarDados,
        mensagem403: MENSAGENS_PADRAO.erroCarregarDados,
      },
    )

    return mesclarInfoVersaoSistema(respostaApi)
  } catch (error) {
    return obterInfoVersaoSistemaPadrao()
  }
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
  const payload = {
    ...dados,
    logoUrl: normalizarUrlImagemPublica(dados?.logoUrl),
    bannerUrl: normalizarUrlImagemPublica(dados?.bannerUrl),
  }

  const response = await executarFetch(`${API_URL}/minha-empresa/personalizacao${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(payload)),
  })

  return tratarResposta(response)
}

export async function buscarPersonalizacaoPublica(slug) {
  const slugNormalizado = normalizarSlugPublico(slug)
  const response = await executarFetch(`${API_URL}/publico/empresas/${slugNormalizado}/personalizacao`, {
    headers: montarHeadersPublicos(),
    cache: 'no-store',
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
  const filtrosConsulta = aplicarEmpresaVisualizacao({})
  const response = await executarFetch(`${API_URL}/onboarding${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarStatusPrimeiroUso() {
  const filtrosConsulta = aplicarEmpresaVisualizacao({})
  const query = montarQueryString(filtrosConsulta)

  return tentarRotas(
    [
      `${API_URL}/minha-empresa/primeiro-uso/status${query}`,
      `${API_URL}/primeiro-uso/status${query}`,
      `${API_URL}/primeiro-uso${query}`,
      `${API_URL}/onboarding/status${query}`,
      `${API_URL}/onboarding${query}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
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
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/faturas${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtrosConsulta) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarResumoFaturas(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/faturas/resumo${montarQueryString(filtrosConsulta)}`, {
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
  const filtrosConsulta = aplicarEmpresaVisualizacao({})
  const response = await executarFetch(`${API_URL}/minha-empresa/status-financeiro${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
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
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/relatorios/operacaonal${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioFinanceiro(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/relatorios/financeiro${montarQueryString(filtrosConsulta)}`, {
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
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/relatorios/agendamentos.csv${montarQueryString(filtrosConsulta)}`, {
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
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}${caminho}${montarQueryString(filtrosConsulta)}`, {
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

async function buscarRecursoEstoque(caminho, filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}${caminho}${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  try {
    return await tratarResposta(response, {
      emitir403: false,
    })
  } catch (error) {
    error.endpoint = caminho
    error.metodo = 'GET'
    registrarDiagnosticoEstoque(error)
    throw error
  }
}

function registrarDiagnosticoEstoque(error) {
  if (!['homologacao', 'dev', 'local'].includes(APP_ENVIRONMENT) || (error?.status !== 404 && error?.status < 500)) {
    return
  }

  console.warn('[estoque-api] Falha ao consultar endpoint de estoque', {
    metodo: error.metodo || 'GET',
    endpoint: error.endpoint || '/estoque',
    status: error.status,
    ambiente: APP_ENVIRONMENT,
  })
}

function normalizarBooleanoFlexivelEstoque(valor, padrao = false) {
  if (typeof valor === 'boolean') {
    return valor
  }

  if (typeof valor === 'number') {
    return valor !== 0
  }

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase()

    if (['true', '1', 'sim', 'yes'].includes(texto)) {
      return true
    }

    if (['false', '0', 'nao', 'não', 'no'].includes(texto)) {
      return false
    }
  }

  return padrao
}

function normalizarNumeroEstoque(valor, padrao = 0) {
  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : padrao
}

function normalizarProdutoEstoqueResposta(produto) {
  if (!produto || typeof produto !== 'object' || Array.isArray(produto)) {
    return produto
  }

  const codigoSku = primeiroValorPreenchido(produto.codigoSku, produto.sku, produto.codigo) || ''
  const quantidadeAtual = normalizarNumeroEstoque(
    primeiroValorPreenchido(
      produto.quantidadeAtual,
      produto.quantidadeDisponivel,
      produto.saldoAtual,
      produto.quantidade,
      produto.estoqueAtual,
    ),
    0,
  )
  const estoqueMinimo = normalizarNumeroEstoque(
    primeiroValorPreenchido(produto.estoqueMinimo, produto.quantidadeMinima, produto.minimo),
    0,
  )
  const precoCusto = normalizarNumeroEstoque(primeiroValorPreenchido(produto.precoCusto, produto.valorCusto, produto.custo), 0)
  const precoVenda = normalizarNumeroEstoque(primeiroValorPreenchido(produto.precoVenda, produto.valorVenda, produto.preco), 0)
  const ordemCatalogo = normalizarNumeroEstoque(primeiroValorPreenchido(produto.ordemCatalogo, produto.ordem), 0)
  const ativo =
    produto.ativo === false || String(produto.status || '').trim().toUpperCase() === 'INATIVO'
      ? false
      : normalizarBooleanoFlexivelEstoque(primeiroValorPreenchido(produto.ativo, produto.status), true)
  const exibirCatalogoPublico = normalizarBooleanoFlexivelEstoque(
    primeiroValorPreenchido(produto.exibirCatalogoPublico, produto.catalogoPublicoAtivo),
    false,
  )
  const mostrarQuantidadePublica = normalizarBooleanoFlexivelEstoque(produto.mostrarQuantidadePublica, false)
  const mostrarPrecoPublico = normalizarBooleanoFlexivelEstoque(produto.mostrarPrecoPublico, true)
  const quantidadeInicialDia = normalizarNumeroEstoque(
    primeiroValorPreenchido(
      produto.quantidadeInicialDia,
      produto.quantidadeInicialEstoqueDia,
      produto.quantidadeInicialDoDia,
      produto.quantidadeInicial,
      produto.estoqueDiaQuantidadeInicial,
    ),
    0,
  )
  const dataEstoqueDia = String(
    primeiroValorPreenchido(
      produto.dataEstoqueDia,
      produto.dataReferenciaEstoqueDia,
      produto.dataDoEstoqueDia,
      produto.dataReferencia,
    ) || '',
  ).trim()
  const atualizadoEstoqueDiaEm = String(
    primeiroValorPreenchido(
      produto.atualizadoEstoqueDiaEm,
      produto.estoqueDiaAtualizadoEm,
      produto.dataAtualizacaoEstoqueDia,
      produto.dataHoraAtualizacaoEstoqueDia,
    ) || '',
  ).trim()

  return {
    ...produto,
    nome: String(primeiroValorPreenchido(produto.nome, produto.produtoNome, produto.titulo) || '').trim(),
    descricao: String(primeiroValorPreenchido(produto.descricao, produto.detalhes, produto.observacao) || '').trim(),
    codigoSku: String(codigoSku).trim(),
    sku: String(codigoSku).trim(),
    categoria: String(primeiroValorPreenchido(produto.categoria, produto.categoriaNome) || '').trim(),
    unidade: String(primeiroValorPreenchido(produto.unidade, produto.unidadeMedida) || 'UN').trim().toUpperCase(),
    precoCusto,
    precoVenda,
    quantidadeAtual,
    quantidadeInicialDia,
    estoqueMinimo,
    ativo,
    exibirCatalogoPublico,
    dataEstoqueDia,
    atualizadoEstoqueDiaEm,
    imagemUrl: normalizarUrlImagemPublica(
      String(primeiroValorPreenchido(produto.imagemUrl, produto.fotoUrl, produto.imagem) || '').trim(),
    ),
    descricaoPublica: String(primeiroValorPreenchido(produto.descricaoPublica, produto.descricaoCatalogoPublico, produto.descricao) || '').trim(),
    categoriaPublica: String(primeiroValorPreenchido(produto.categoriaPublica, produto.categoriaCatalogoPublico, produto.categoria) || '').trim(),
    destaqueCatalogo: normalizarBooleanoFlexivelEstoque(produto.destaqueCatalogo, false),
    mostrarQuantidadePublica,
    mostrarPrecoPublico,
    ordemCatalogo,
    textoBotaoPublico:
      String(primeiroValorPreenchido(produto.textoBotaoPublico, produto.textoBotaoCatalogo, produto.textoBotaoWhatsapp) || '').trim(),
  }
}

export function normalizarProdutoCatalogoPublico(produto) {
  const produtoBase = normalizarProdutoEstoqueResposta(produto)

  if (!produtoBase || typeof produtoBase !== 'object' || Array.isArray(produtoBase)) {
    return produtoBase
  }

  const esgotado = normalizarBooleanoFlexivelEstoque(
    primeiroValorPreenchido(produtoBase.esgotado, produtoBase.indisponivel, produtoBase.semEstoque),
    false,
  )
  const disponibilidadeExplicita = primeiroValorPreenchido(
    produtoBase.disponivel,
    produtoBase.disponibilidade,
    produtoBase.estoqueDisponivel,
  )
  const disponibilidadeNormalizada =
    disponibilidadeExplicita === '' || disponibilidadeExplicita === null || disponibilidadeExplicita === undefined
      ? null
      : normalizarBooleanoFlexivelEstoque(disponibilidadeExplicita, false)
  const disponivel =
    disponibilidadeNormalizada !== null
      ? disponibilidadeNormalizada
      : !esgotado &&
        Number(primeiroValorPreenchido(produtoBase.quantidadeDisponivel, produtoBase.quantidadeAtual, 0)) > 0

  return {
    ...produtoBase,
    imagemUrl: normalizarUrlImagemPublica(
      String(
        primeiroValorPreenchido(
          produtoBase.imagemUrl,
          produtoBase.fotoUrl,
          produtoBase.imagem,
          produtoBase.imagemCatalogoPublico,
        ) || '',
      ).trim(),
    ),
    descricaoPublica: String(
      primeiroValorPreenchido(
        produtoBase.descricaoPublica,
        produtoBase.descricaoCatalogoPublico,
        produtoBase.descricaoResumida,
        produtoBase.descricao,
      ) || '',
    ).trim(),
    categoriaPublica: String(
      primeiroValorPreenchido(
        produtoBase.categoriaPublica,
        produtoBase.categoriaCatalogoPublico,
        produtoBase.sabor,
        produtoBase.categoria,
      ) || '',
    ).trim(),
    destaque: normalizarBooleanoFlexivelEstoque(
      primeiroValorPreenchido(produtoBase.destaque, produtoBase.destaqueCatalogo, produtoBase.destacarNoCatalogo),
      false,
    ),
    destaqueCatalogo: normalizarBooleanoFlexivelEstoque(
      primeiroValorPreenchido(produtoBase.destaque, produtoBase.destaqueCatalogo, produtoBase.destacarNoCatalogo),
      false,
    ),
    mostrarQuantidadePublica: normalizarBooleanoFlexivelEstoque(
      primeiroValorPreenchido(produtoBase.mostrarQuantidadePublica, produtoBase.exibirQuantidadePublica),
      false,
    ),
    mostrarPrecoPublico: normalizarBooleanoFlexivelEstoque(
      primeiroValorPreenchido(produtoBase.mostrarPrecoPublico, produtoBase.exibirPrecoPublico),
      true,
    ),
    ordemCatalogo: normalizarNumeroEstoque(
      primeiroValorPreenchido(produtoBase.ordemCatalogo, produtoBase.ordemExibicaoCatalogo, produtoBase.ordem),
      0,
    ),
    textoBotaoPublico:
      String(
        primeiroValorPreenchido(
          produtoBase.textoBotaoPublico,
          produtoBase.textoBotaoCatalogo,
          produtoBase.textoBotaoWhatsapp,
        ) || '',
      ).trim(),
    quantidadeDisponivel: normalizarNumeroEstoque(
      primeiroValorPreenchido(
        produtoBase.quantidadeDisponivel,
        produtoBase.quantidadeAtual,
        produtoBase.quantidade,
        produtoBase.saldoAtual,
      ),
      0,
    ),
    exibirCatalogoPublico: normalizarBooleanoFlexivelEstoque(
      primeiroValorPreenchido(produtoBase.exibirCatalogoPublico, produtoBase.catalogoPublicoAtivo),
      true,
    ),
    esgotado,
    disponivel,
  }
}

function normalizarRespostaProdutosEstoque(dados) {
  if (Array.isArray(dados)) {
    return dados.map(normalizarProdutoEstoqueResposta)
  }

  if (!dados || typeof dados !== 'object') {
    return dados
  }

  const colecoes = ['value', 'Value', 'content', 'items', 'itens', 'resultado', 'produtos']
  const colecoesAninhadas = ['value', 'Value', 'content', 'items', 'itens', 'resultado', 'produtos']
  const resposta = { ...dados }

  for (const chave of colecoes) {
    if (Array.isArray(resposta[chave])) {
      resposta[chave] = resposta[chave].map(normalizarProdutoEstoqueResposta)
    }
  }

  if (resposta.data && typeof resposta.data === 'object' && !Array.isArray(resposta.data)) {
    resposta.data = { ...resposta.data }

    for (const chave of colecoesAninhadas) {
      if (Array.isArray(resposta.data[chave])) {
        resposta.data[chave] = resposta.data[chave].map(normalizarProdutoEstoqueResposta)
      }
    }
  }

  return resposta
}

function normalizarRespostaCatalogoPublico(dados) {
  const dadosNormalizados = normalizarRespostaProdutosEstoque(dados)

  if (Array.isArray(dadosNormalizados)) {
    return dadosNormalizados.map(normalizarProdutoCatalogoPublico)
  }

  if (!dadosNormalizados || typeof dadosNormalizados !== 'object') {
    return dadosNormalizados
  }

  const resposta = { ...dadosNormalizados }
  const colecoes = ['value', 'Value', 'content', 'items', 'itens', 'resultado', 'produtos']

  for (const chave of colecoes) {
    if (Array.isArray(resposta[chave])) {
      resposta[chave] = resposta[chave].map(normalizarProdutoCatalogoPublico)
    }
  }

  if (resposta.data && typeof resposta.data === 'object' && !Array.isArray(resposta.data)) {
    resposta.data = { ...resposta.data }

    for (const chave of colecoes) {
      if (Array.isArray(resposta.data[chave])) {
        resposta.data[chave] = resposta.data[chave].map(normalizarProdutoCatalogoPublico)
      }
    }
  }

  return resposta
}

export async function buscarResumoEstoque(filtros = {}) {
  return buscarRecursoEstoque('/estoque/resumo', filtros)
}

export async function buscarUnidadesEstoque(filtros = {}) {
  const dados = await tentarRotas(
    [
      `${API_URL}/estoque/unidades${montarQueryString(filtros)}`,
      `${API_URL}/admin/estoque/unidades${montarQueryString(filtros)}`,
      `${API_URL}/admin/unidades-estoque${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
      cache: 'no-store',
    },
    {
      emitir403: false,
    },
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarUnidadesEstoqueAdmin(filtros = {}) {
  const dados = await tentarRotas(
    [
      `${API_URL}/admin/estoque/unidades${montarQueryString(filtros)}`,
      `${API_URL}/admin/unidades-estoque${montarQueryString(filtros)}`,
      `${API_URL}/estoque/unidades${montarQueryString(filtros)}`,
    ],
    {
      headers: montarHeaders(),
      cache: 'no-store',
    },
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function criarUnidadeEstoqueAdmin(dados) {
  return tentarRotas(
    [
      `${API_URL}/admin/estoque/unidades`,
      `${API_URL}/admin/unidades-estoque`,
    ],
    {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify(dados),
    },
  )
}

export async function atualizarUnidadeEstoqueAdmin(id, dados) {
  return tentarRotas(
    [
      `${API_URL}/admin/estoque/unidades/${id}`,
      `${API_URL}/admin/unidades-estoque/${id}`,
    ],
    {
      method: 'PUT',
      headers: montarHeaders(true),
      body: JSON.stringify(dados),
    },
  )
}

export async function ativarUnidadeEstoqueAdmin(id) {
  return tentarRotas(
    [
      `${API_URL}/admin/estoque/unidades/${id}/ativar`,
      `${API_URL}/admin/estoque/unidades/${id}/reativar`,
      `${API_URL}/admin/unidades-estoque/${id}/ativar`,
      `${API_URL}/admin/unidades-estoque/${id}/reativar`,
      {
        url: `${API_URL}/admin/estoque/unidades/${id}/ativo`,
        init: {
          method: 'PUT',
          headers: montarHeaders(true),
          body: JSON.stringify({ ativo: true }),
        },
      },
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(),
    },
  )
}

export async function desativarUnidadeEstoqueAdmin(id) {
  return tentarRotas(
    [
      `${API_URL}/admin/estoque/unidades/${id}/desativar`,
      `${API_URL}/admin/estoque/unidades/${id}/inativar`,
      `${API_URL}/admin/unidades-estoque/${id}/desativar`,
      `${API_URL}/admin/unidades-estoque/${id}/inativar`,
      {
        url: `${API_URL}/admin/estoque/unidades/${id}/ativo`,
        init: {
          method: 'PUT',
          headers: montarHeaders(true),
          body: JSON.stringify({ ativo: false }),
        },
      },
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(),
    },
  )
}

export async function buscarProdutosEstoque(filtros = {}) {
  const dados = normalizarRespostaProdutosEstoque(await buscarRecursoEstoque('/estoque/produtos', filtros))

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function listarEstoqueDia(filtros = {}) {
  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/estoque/produtos/estoque-dia${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = normalizarRespostaProdutosEstoque(
    await tratarRespostaCustomizada(response, {
      emitir403: false,
      mensagensPorStatus: {
        400: 'Nao foi possivel listar o estoque do dia com os filtros informados.',
        403: 'Voce nao tem permissao para visualizar o estoque do dia desta empresa.',
        404: 'O estoque do dia ainda nao esta disponivel para esta empresa.',
      },
    }),
  )

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function atualizarQuantidadeRapidaProduto(produtoId, quantidadeAtual) {
  const response = await executarFetch(`${API_URL}/estoque/produtos/${produtoId}/quantidade-rapida`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload({
      quantidadeAtual,
      quantidade: quantidadeAtual,
      saldoAtual: quantidadeAtual,
    })),
  })

  return normalizarProdutoEstoqueResposta(
    await tratarRespostaCustomizada(response, {
      emitir403: false,
      mensagensPorStatus: {
        400: 'Informe uma quantidade valida para atualizar o estoque do dia.',
        403: 'Voce nao tem permissao para atualizar rapidamente este produto.',
        404: 'Produto nao encontrado para atualizar o estoque do dia.',
      },
    }),
  )
}

export async function configurarEstoqueDiaProduto(produtoId, payload) {
  const response = await executarFetch(`${API_URL}/estoque/produtos/${produtoId}/estoque-dia`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(payload || {})),
  })

  return normalizarProdutoEstoqueResposta(
    await tratarRespostaCustomizada(response, {
      emitir403: false,
      mensagensPorStatus: {
        400: 'Revise os dados do estoque do dia informados para este produto.',
        403: 'Voce nao tem permissao para configurar o estoque do dia deste produto.',
        404: 'Produto nao encontrado para configurar o estoque do dia.',
      },
    }),
  )
}

export async function reiniciarEstoqueDia(payload) {
  const response = await executarFetch(`${API_URL}/estoque/estoque-dia/reiniciar`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(payload || {})),
  })

  return normalizarRespostaProdutosEstoque(
    await tratarRespostaCustomizada(response, {
      emitir403: false,
      mensagensPorStatus: {
        400: 'Revise a data e as quantidades informadas antes de reiniciar o estoque do dia.',
        403: 'Voce nao tem permissao para reiniciar o estoque do dia desta empresa.',
        404: 'Nao foi possivel localizar o recurso de reinicio do estoque do dia.',
      },
    }),
  )
}

export async function buscarProdutoEstoque(id) {
  const queryEmpresa = montarQueryEmpresaOperacional()
  return normalizarProdutoEstoqueResposta(
    await tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}${queryEmpresa}`,
      `${API_URL}/produtos/${id}${queryEmpresa}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
  )
}

export async function criarProdutoEstoque(dados) {
  return normalizarProdutoEstoqueResposta(
    await tentarRotas(
    [
      `${API_URL}/estoque/produtos`,
      `${API_URL}/produtos`,
    ],
    {
      method: 'POST',
      headers: montarHeaders(true),
      body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
    },
  )
  )
}

export async function atualizarProdutoEstoque(id, dados) {
  return normalizarProdutoEstoqueResposta(
    await tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}`,
      `${API_URL}/produtos/${id}`,
    ],
    {
      method: 'PUT',
      headers: montarHeaders(true),
      body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
    },
  )
  )
}

export async function ativarProdutoEstoque(id) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}/ativar${montarQueryEmpresaOperacional()}`,
      `${API_URL}/produtos/${id}/ativar${montarQueryEmpresaOperacional()}`,
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(true),
      body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload({})),
    },
  )
}

export async function desativarProdutoEstoque(id) {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}/desativar${montarQueryEmpresaOperacional()}`,
      `${API_URL}/produtos/${id}/desativar${montarQueryEmpresaOperacional()}`,
    ],
    {
      method: 'PATCH',
      headers: montarHeaders(true),
      body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload({})),
    },
  )
}

export async function buscarProdutosBaixoEstoque(filtros = {}) {
  const dados = normalizarRespostaProdutosEstoque(await buscarRecursoEstoque('/estoque/produtos/baixo-estoque', filtros))

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarMovimentacoesEstoque(filtros = {}) {
  const dados = await buscarRecursoEstoque('/estoque/movimentacoes', filtros)

  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarMovimentacoesProdutoEstoque(filtros = {}) {
  return buscarMovimentacoesEstoque(filtros)
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
      body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(dados)),
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

export async function buscarMinhaAssinatura(empresaId = '') {
  const filtrosConsulta = aplicarEmpresaVisualizacao(empresaId ? { empresaId } : {})
  const response = await executarFetch(`${API_URL}/minha-empresa/assinatura${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarUsoPlano(empresaId = '') {
  const filtrosConsulta = aplicarEmpresaVisualizacao(empresaId ? { empresaId } : {})
  const response = await executarFetch(`${API_URL}/minha-empresa/uso-plano${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarMinhasConfiguracoesNotificacoes() {
  const filtrosConsulta = aplicarEmpresaVisualizacao({})
  const response = await executarFetch(`${API_URL}/minha-empresa/notificacoes/configuracoes${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function salvarMinhasConfiguracoesNotificacoes(payload) {
  const response = await executarFetch(`${API_URL}/minha-empresa/notificacoes/configuracoes${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(payload)),
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

function normalizarTipoLixeiraAdmin(tipo) {
  const tipoBruto = String(tipo || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  const aliases = {
    EMPRESA: 'EMPRESAS',
    USUARIO: 'USUARIOS',
    CLIENTE: 'CLIENTES',
    SERVICO: 'SERVICOS',
    FUNCIONARIO: 'FUNCIONARIOS',
    PRODUTO: 'PRODUTOS_ESTOQUE',
    PRODUTOS: 'PRODUTOS_ESTOQUE',
    PRODUTO_ESTOQUE: 'PRODUTOS_ESTOQUE',
    PRODUTOS_ESTOQUES: 'PRODUTOS_ESTOQUE',
    AGENDAMENTO: 'AGENDAMENTOS',
  }
  const tipoNormalizado = aliases[tipoBruto] || tipoBruto

  if (!tipoNormalizado || tipoNormalizado === 'TODOS' || tipoNormalizado === 'ALL') {
    return ''
  }

  return tipoNormalizado
}

function construirSegmentosTipoLixeiraAdmin(tipoNormalizado) {
  if (!tipoNormalizado) {
    return []
  }

  const segmentos = new Set([
    tipoNormalizado,
    tipoNormalizado.toLowerCase(),
    tipoNormalizado.toLowerCase().replace(/_/g, '-'),
  ])
  if (tipoNormalizado === 'PRODUTOS_ESTOQUE') {
    segmentos.add('produtos-estoque')
    segmentos.add('produto-estoque')
    segmentos.add('produtos_estoque')
  }

  return [...segmentos]
}

async function tentarOperacaoLixeiraAdmin(candidatas = [], opcoesTratamento = {}) {
  let ultimoErro = null

  for (const candidata of candidatas) {
    const url = candidata?.url
    const init = candidata?.init || {}

    if (!url) {
      continue
    }

    const response = await executarFetch(url, init)

    if (response.ok) {
      return tratarResposta(response, opcoesTratamento)
    }

    if ([404, 405].includes(response.status)) {
      ultimoErro = criarErroHttp(response.status)
      continue
    }

    return tratarResposta(response, opcoesTratamento)
  }

  throw ultimoErro || criarErroHttp(404)
}

export async function listarResumoLixeiraAdmin(filtros = {}) {
  const filtrosConsulta = limparVazios(filtros)
  const query = montarQueryString(filtrosConsulta)

  return tentarRotas(
    [
      `${API_URL}/admin/lixeira/resumo${query}`,
      `${API_URL}/admin/lixeira/contadores${query}`,
    ],
    {
      headers: montarHeaders(),
    },
  )
}

export async function listarLixeiraAdmin(tipo = '', filtros = {}) {
  const tipoNormalizado = normalizarTipoLixeiraAdmin(tipo)
  const filtrosBase = limparVazios(filtros)
  const filtrosConsulta = tipoNormalizado ? { ...filtrosBase, tipo: tipoNormalizado } : filtrosBase
  const queryBase = montarQueryString(filtrosBase)
  const query = montarQueryString(filtrosConsulta)
  const candidatos = [`${API_URL}/admin/lixeira${query}`]

  for (const segmentoTipo of construirSegmentosTipoLixeiraAdmin(tipoNormalizado)) {
    candidatos.push(`${API_URL}/admin/lixeira/${segmentoTipo}${queryBase}`)
  }

  if (tipoNormalizado === 'AGENDAMENTOS') {
    candidatos.push(`${API_URL}/admin/lixeira/agendamentos${queryBase}`)
  }

  const dados = await tentarRotas(
    candidatos,
    {
      headers: montarHeaders(),
    },
  )

  return solicitouPaginacao(filtrosBase) ? dados : normalizarColecaoResposta(dados)
}

export async function restaurarItemLixeiraAdmin(tipo, id) {
  const tipoNormalizado = normalizarTipoLixeiraAdmin(tipo)
  const queryTipo = montarQueryString(tipoNormalizado ? { tipo: tipoNormalizado } : {})
  const candidatas = [
    {
      url: `${API_URL}/admin/lixeira/${id}/restaurar${queryTipo}`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    },
  ]

  for (const segmentoTipo of construirSegmentosTipoLixeiraAdmin(tipoNormalizado)) {
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/restaurar`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/restaurar`,
      init: {
        method: 'PATCH',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/restaurar`,
      init: {
        method: 'PUT',
        headers: montarHeaders(),
      },
    })
  }

  if (tipoNormalizado === 'AGENDAMENTOS') {
    candidatas.push({
      url: `${API_URL}/admin/lixeira/agendamentos/${id}/restaurar`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    })
  }

  return tentarOperacaoLixeiraAdmin(candidatas)
}

export async function excluirDefinitivoItemLixeiraAdmin(tipo, id) {
  const tipoNormalizado = normalizarTipoLixeiraAdmin(tipo)
  const queryTipo = montarQueryString(tipoNormalizado ? { tipo: tipoNormalizado } : {})
  const candidatas = [{
    url: `${API_URL}/admin/lixeira/${id}/definitivo${queryTipo}`,
    init: {
      method: 'DELETE',
      headers: montarHeaders(),
    },
  }, {
    init: {
      method: 'POST',
      headers: montarHeaders(),
    },
    url: `${API_URL}/admin/lixeira/${id}/definitivo${queryTipo}`,
  }, {
    url: `${API_URL}/admin/lixeira/${id}/excluir-definitivo${queryTipo}`,
    init: {
      method: 'POST',
      headers: montarHeaders(),
    },
  }]

  for (const segmentoTipo of construirSegmentosTipoLixeiraAdmin(tipoNormalizado)) {
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/definitivo`,
      init: {
        method: 'DELETE',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/definitivo`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}`,
      init: {
        method: 'DELETE',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/${segmentoTipo}/${id}/excluir-definitivo`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    })
  }

  if (tipoNormalizado === 'AGENDAMENTOS') {
    candidatas.push({
      url: `${API_URL}/admin/lixeira/agendamentos/${id}/definitivo`,
      init: {
        method: 'DELETE',
        headers: montarHeaders(),
      },
    })
    candidatas.push({
      url: `${API_URL}/admin/lixeira/agendamentos/${id}/excluir-definitivo`,
      init: {
        method: 'POST',
        headers: montarHeaders(),
      },
    })
  }

  candidatas.push({
    url: `${API_URL}/admin/lixeira/${id}/excluir-definitivo${queryTipo}`,
    init: {
      method: 'DELETE',
      headers: montarHeaders(),
    },
  })

  return tentarOperacaoLixeiraAdmin(candidatas)
}

export async function restaurarItemLixeira(tipo, id) {
  return restaurarItemLixeiraAdmin(tipo, id)
}

export async function excluirDefinitivamenteItemLixeira(tipo, id) {
  return excluirDefinitivoItemLixeiraAdmin(tipo, id)
}

export async function buscarAgendamentosExcluidos(filtros = {}) {
  return listarLixeiraAdmin('AGENDAMENTOS', filtros)
}

export async function restaurarAgendamento(id) {
  return restaurarItemLixeiraAdmin('AGENDAMENTOS', id)
}

export async function buscarNotificacoes(filtros = {}) {
  if (!podeConsultarNotificacoesAutenticadas()) {
    return []
  }

  const filtrosConsulta = aplicarEmpresaVisualizacao(filtros)
  const response = await executarFetch(`${API_URL}/notificacoes${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoNotificacoes() {
  if (!podeConsultarNotificacoesAutenticadas()) {
    return {}
  }

  const filtrosConsulta = aplicarEmpresaVisualizacao({})
  const response = await executarFetch(`${API_URL}/notificacoes/resumo${montarQueryString(filtrosConsulta)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarNotificacaoComoLida(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/lida${montarQueryEmpresaOperacional()}`, {
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
  const response = await executarFetch(`${API_URL}/notificacoes/marcar-todas-lidas${montarQueryEmpresaOperacional()}`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function arquivarNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/arquivar${montarQueryEmpresaOperacional()}`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desarquivarNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/desarquivar${montarQueryEmpresaOperacional()}`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function excluirNotificacao(id) {
  const response = await executarFetch(`${API_URL}/notificacoes/${id}/excluir${montarQueryEmpresaOperacional()}`, {
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
  const empresaVisualizacao = obterEmpresaVisualizacao()
  const usuario = carregarUsuarioSessao()

  if (empresaVisualizacao?.id && usuarioEhSuperAdmin(usuario)) {
    return buscarEmpresaPorId(empresaVisualizacao.id)
  }

  const response = await executarFetch(`${API_URL}/minha-empresa`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarEmpresaPorId(id) {
  const response = await executarFetch(`${API_URL}/empresas/${id}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function atualizarMinhaEmpresa(empresa) {
  const response = await executarFetch(`${API_URL}/minha-empresa${montarQueryString(anexarEmpresaIdOperacionalNaQuery())}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(empresa)),
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

export async function excluirEmpresa(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/empresas/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
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

export async function excluirUsuario(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/usuarios/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
}

export async function cadastrarCliente(cliente) {
  const response = await executarFetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(cliente)),
  })

  return tratarResposta(response)
}

export async function atualizarCliente(id, cliente) {
  const response = await executarFetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(cliente)),
  })

  return tratarResposta(response)
}

export async function excluirCliente(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/clientes/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
}

export async function buscarTurmasBeachTennis(filtros = {}) {
  const response = await executarFetch(`${API_URL}/beach-tennis/turmas${montarQueryEmpresaOperacional(filtros)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return normalizarColecaoResposta(dados)
}

export async function buscarContextoGestaoEsportiva() {
  const response = await executarFetch(`${API_URL}/gestao-esportiva/contexto${montarQueryEmpresaOperacional()}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarRespostaCustomizada(response, {
    emitir403: false,
  })
}

export async function buscarTurmaBeachTennis(id) {
  const response = await executarFetch(`${API_URL}/beach-tennis/turmas/${id}${montarQueryEmpresaOperacional()}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarTurmaBeachTennisOuLista(id, filtros = {}) {
  const turmaId = String(id || '').trim()

  if (!turmaId) {
    return null
  }

  try {
    const detalhe = await buscarTurmaBeachTennis(turmaId)
    if (detalhe) {
      return detalhe
    }
  } catch (error) {
    if (error?.status !== 404) {
      throw error
    }
  }

  const turmas = await buscarTurmasBeachTennis(filtros)
  return Array.isArray(turmas)
    ? turmas.find((item) => String(item?.id || '') === turmaId) || null
    : null
}

export async function criarTurmaBeachTennis(turma) {
  const response = await executarFetch(`${API_URL}/beach-tennis/turmas${montarQueryEmpresaOperacional()}`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(turma)),
  })

  return tratarResposta(response)
}

export async function atualizarTurmaBeachTennis(id, turma) {
  const response = await executarFetch(`${API_URL}/beach-tennis/turmas/${id}${montarQueryEmpresaOperacional()}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(turma)),
  })

  return tratarResposta(response)
}

export async function excluirTurmaBeachTennis(id, motivo = '') {
  const response = await executarFetch(
    `${API_URL}/beach-tennis/turmas/${id}${montarQueryEmpresaOperacional({ motivo })}`,
    {
      method: 'DELETE',
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
}

export async function buscarAlunosTurmaBeachTennis(turmaId) {
  const response = await executarFetch(`${API_URL}/beach-tennis/turmas/${turmaId}/alunos${montarQueryEmpresaOperacional()}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return normalizarColecaoResposta(dados)
}

export async function buscarAulasGestaoEsportiva(filtros = {}) {
  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas${montarQueryEmpresaOperacional(filtros)}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return normalizarColecaoResposta(dados)
}

export async function buscarAulaGestaoEsportiva(aulaId) {
  const id = String(aulaId || '').trim()

  if (!id) {
    return null
  }

  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/${id}${montarQueryEmpresaOperacional()}`, {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function cancelarAulaGestaoEsportiva(aulaId, motivo = '') {
  const id = String(aulaId || '').trim()

  if (!id) {
    return null
  }

  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/${id}/cancelar${montarQueryEmpresaOperacional()}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({
      motivo: String(motivo || '').trim(),
    }),
  })

  return tratarResposta(response)
}

export async function reverterCancelamentoAulaGestaoEsportiva(aulaId) {
  const id = String(aulaId || '').trim()

  if (!id) {
    return null
  }

  const response = await executarFetch(
    `${API_URL}/gestao-esportiva/aulas/${id}/reverter-cancelamento${montarQueryEmpresaOperacional()}`,
    {
      method: 'PUT',
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function gerarAulasGestaoEsportiva(payload = {}) {
  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/gerar${montarQueryEmpresaOperacional()}`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(payload),
  })

  return tratarResposta(response)
}

export async function salvarFrequenciasAulaGestaoEsportiva(aulaId, frequencias = []) {
  const id = String(aulaId || '').trim()

  if (!id) {
    return null
  }

  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/${id}/frequencias${montarQueryEmpresaOperacional()}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(frequencias),
  })

  return tratarResposta(response)
}

export async function buscarPreviaCancelamentoAulasGestaoEsportiva(payload = {}) {
  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/cancelamentos/previa${montarQueryEmpresaOperacional()}`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(payload || {}),
  })

  return tratarResposta(response)
}

export async function cancelarAulasGestaoEsportivaEmLote(payload = {}) {
  const response = await executarFetch(`${API_URL}/gestao-esportiva/aulas/cancelamentos/lote${montarQueryEmpresaOperacional()}`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(payload || {}),
  })

  return tratarResposta(response)
}

export async function buscarClientesDisponiveisBeachTennis(filtros = {}) {
  const possuiFiltroAtivo = Object.prototype.hasOwnProperty.call(filtros, 'ativo')

  return buscarClientes({
    ...filtros,
    ativo: possuiFiltroAtivo ? filtros.ativo : true,
  })
}

export async function salvarAlunosTurmaBeachTennis(turmaId, alunoIds) {
  const payload = aplicarEmpresaSelecionadaNoPayload({ alunoIds })
  const response = await executarFetch(
    `${API_URL}/beach-tennis/turmas/${turmaId}/alunos${montarQueryEmpresaOperacional()}`,
    {
      method: 'PUT',
      headers: montarHeaders(true),
      body: JSON.stringify(payload),
    },
  )

  return tratarResposta(response)
}

export async function salvarClientesTurmaBeachTennis(turmaId, clienteIds) {
  const ids = (Array.isArray(clienteIds) ? clienteIds : [clienteIds])
    .map((id) => Number.parseInt(String(id).trim(), 10))
    .filter((id) => Number.isFinite(id))

  const response = await executarFetch(
    `${API_URL}/beach-tennis/turmas/${turmaId}/alunos${montarQueryEmpresaOperacional()}`,
    {
      method: 'PUT',
      headers: montarHeaders(true),
      body: JSON.stringify({ clienteIds: ids }),
    },
  )

  return tratarResposta(response)
}

function montarUrlBeachTennisAcordos(caminho = '', filtros = {}) {
  return `${API_URL}/beach-tennis/acordos${caminho}${montarQueryEmpresaOperacional(filtros)}`
}

function montarUrlBeachTennisMensalidades(caminho = '', filtros = {}) {
  return `${API_URL}/beach-tennis/mensalidades${caminho}${montarQueryEmpresaOperacional(filtros)}`
}

function montarUrlBeachTennisConfiguracao(caminho = '', filtros = {}) {
  return `${API_URL}/beach-tennis/configuracao${caminho}${montarQueryEmpresaOperacional(filtros)}`
}

function montarUrlBeachTennisResumo(filtros = {}) {
  return `${API_URL}/beach-tennis/financeiro/resumo${montarQueryEmpresaOperacional(filtros)}`
}

function normalizarDataHoraBeachTennis(valor) {
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

async function executarRecursoBeachTennis(url, { method = 'GET', payload, opcional = false } = {}) {
  const response = await executarFetch(url, {
    method,
    headers: montarHeaders(payload !== undefined),
    body: payload === undefined ? undefined : JSON.stringify(aplicarEmpresaSelecionadaNoPayload(payload)),
  })

  return opcional ? tratarRespostaOpcional(response) : tratarResposta(response)
}

export async function buscarAcordosBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisAcordos('', filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarAcordoBeachTennis(id) {
  return executarRecursoBeachTennis(montarUrlBeachTennisAcordos(`/${id}`))
}

export async function buscarAcordoBeachTennisDetalhe(id) {
  return buscarAcordoBeachTennis(id)
}

export async function buscarAcordosPaginadosBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisAcordos('/paginados', filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarOpcoesAlunosAcordoBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisAcordos('/opcoes/alunos', filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarOpcoesTurmasAcordoBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisAcordos('/opcoes/turmas', filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function criarAcordoBeachTennis(acordo) {
  return executarRecursoBeachTennis(montarUrlBeachTennisAcordos(), {
    method: 'POST',
    payload: acordo,
  })
}

export async function atualizarAcordoBeachTennis(id, acordo) {
  return executarRecursoBeachTennis(montarUrlBeachTennisAcordos(`/${id}`), {
    method: 'PUT',
    payload: acordo,
  })
}

export async function buscarAlunosAcordoBeachTennis(acordoId) {
  const response = await executarFetch(montarUrlBeachTennisAcordos(`/${acordoId}/alunos`), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return normalizarColecaoResposta(dados)
}

export async function salvarAlunosAcordoBeachTennis(acordoId, alunoIds) {
  const clienteIds = (Array.isArray(alunoIds) ? alunoIds : [alunoIds])
    .map((id) => Number.parseInt(String(id).trim(), 10))
    .filter((id) => Number.isFinite(id))

  return executarRecursoBeachTennis(montarUrlBeachTennisAcordos(`/${acordoId}/alunos`), {
    method: 'PUT',
    payload: { clienteIds },
  })
}

export async function buscarTurmasAcordoBeachTennis(acordoId) {
  const response = await executarFetch(montarUrlBeachTennisAcordos(`/${acordoId}/turmas`), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return normalizarColecaoResposta(dados)
}

export async function salvarTurmasAcordoBeachTennis(acordoId, turmaIds) {
  const ids = (Array.isArray(turmaIds) ? turmaIds : [turmaIds])
    .map((id) => Number.parseInt(String(id).trim(), 10))
    .filter((id) => Number.isFinite(id))

  return executarRecursoBeachTennis(montarUrlBeachTennisAcordos(`/${acordoId}/turmas`), {
    method: 'PUT',
    payload: { turmaIds: ids },
  })
}

export async function buscarMensalidadesBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisMensalidades('', filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  const dados = await tratarResposta(response)
  return solicitouPaginacao(filtros) ? dados : normalizarColecaoResposta(dados)
}

export async function buscarMensalidadeBeachTennis(id) {
  return executarRecursoBeachTennis(montarUrlBeachTennisMensalidades(`/${id}`))
}

export async function criarMensalidadeBeachTennis(mensalidade) {
  return executarRecursoBeachTennis(montarUrlBeachTennisMensalidades(), {
    method: 'POST',
    payload: mensalidade,
  })
}

export async function gerarMensalidadesBeachTennis(dados = {}) {
  const filtros = {
    competencia: dados?.competencia,
    acordoId: dados?.acordoId,
  }

  const response = await executarFetch(montarUrlBeachTennisMensalidades('/gerar', filtros), {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarMensalidadePagaBeachTennis(id, dados = {}) {
  return executarRecursoBeachTennis(montarUrlBeachTennisMensalidades(`/${id}/pagar`), {
    method: 'PATCH',
    payload: {
      ...dados,
      dataPagamento: normalizarDataHoraBeachTennis(dados?.dataPagamento),
      observacoes: dados?.observacoes ?? dados?.observacao,
    },
  })
}

export async function cancelarMensalidadeBeachTennis(id, motivo = '') {
  const response = await executarFetch(
    `${API_URL}/beach-tennis/mensalidades/${id}/cancelar${montarQueryEmpresaOperacional({ observacoes: motivo })}`,
    {
      method: 'PATCH',
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function reabrirMensalidadeBeachTennis(id) {
  const response = await executarFetch(`${API_URL}/beach-tennis/mensalidades/${id}/reabrir${montarQueryEmpresaOperacional()}`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function cobrarMensalidadeWhatsappBeachTennis(id) {
  const response = await executarFetch(montarUrlBeachTennisMensalidades(`/${id}/mensagem-whatsapp`), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function buscarConfiguracaoBeachTennisFinanceira() {
  return executarRecursoBeachTennis(montarUrlBeachTennisConfiguracao())
}

export async function salvarConfiguracaoBeachTennisFinanceira(payload) {
  return executarRecursoBeachTennis(montarUrlBeachTennisConfiguracao(), {
    method: 'PUT',
    payload,
  })
}

export async function buscarResumoFinanceiroBeachTennis(filtros = {}) {
  const response = await executarFetch(montarUrlBeachTennisResumo(filtros), {
    headers: montarHeaders(),
    cache: 'no-store',
  })

  return tratarResposta(response)
}

export async function cadastrarServico(servico) {
  const response = await executarFetch(`${API_URL}/servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(servico)),
  })

  return tratarResposta(response)
}

export async function atualizarServico(id, servico) {
  const response = await executarFetch(`${API_URL}/servicos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(servico)),
  })

  return tratarResposta(response)
}

export async function excluirServico(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/servicos/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
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
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(funcionario)),
  })

  return tratarResposta(response)
}

export async function atualizarFuncionario(id, funcionario) {
  const response = await executarFetch(`${API_URL}/funcionarios/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(funcionario)),
  })

  return tratarResposta(response)
}

export async function excluirFuncionario(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/funcionarios/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response, OPCOES_EXCLUSAO_LOGICA)
}

export async function atualizarAtivoFuncionario(id, ativo) {
  const response = await executarFetch(`${API_URL}/funcionarios/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function excluirProdutoEstoque(id, motivo = '') {
  return tentarRotas(
    [
      `${API_URL}/estoque/produtos/${id}${montarQueryEmpresaOperacional({ motivo })}`,
      `${API_URL}/produtos/${id}${montarQueryEmpresaOperacional({ motivo })}`,
    ],
    {
      method: 'DELETE',
      headers: montarHeaders(),
    },
    OPCOES_EXCLUSAO_LOGICA,
  )
}

export async function uploadImagemProduto(produtoId, imagem) {
  const formData = new FormData()
  formData.append('imagem', imagem)

  const response = await executarFetch(`${API_URL}/estoque/produtos/${produtoId}/imagem`, {
    method: 'POST',
    headers: montarHeaders(),
    body: formData,
  })

  return tratarResposta(response)
}

export async function removerImagemProduto(produtoId) {
  const response = await executarFetch(`${API_URL}/estoque/produtos/${produtoId}/imagem`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarRespostaOpcional(response)
}

export async function cadastrarAgendamento(agendamento) {
  const response = await executarFetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(agendamento)),
  })

  return tratarResposta(response)
}

export async function atualizarAgendamento(id, agendamento) {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload(agendamento)),
  })

  return tratarResposta(response)
}

export async function atualizarStatusAgendamento(id, status) {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}/status${montarQueryEmpresaOperacional()}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(aplicarEmpresaSelecionadaNoPayload({ status })),
  })

  return tratarResposta(response)
}

export async function excluirAgendamento(id, motivo = '') {
  const response = await executarFetch(`${API_URL}/agendamentos/${id}${montarQueryEmpresaOperacional({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}
