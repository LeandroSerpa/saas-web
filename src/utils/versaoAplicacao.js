const VERSAO_BASE_APLICACAO = String(__APP_VERSION__ || '').trim()

function normalizarAmbienteAplicacao(valor) {
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

function obterAmbienteAplicacao() {
  const ambienteConfigurado = normalizarAmbienteAplicacao(
    import.meta.env.VITE_APP_ENVIRONMENT || (import.meta.env.DEV ? 'dev' : 'production'),
  )
  const hostname = obterHostnameAtual()

  if (hostnameIndicaHomologacao(hostname)) {
    return 'homologacao'
  }

  if (hostnameEhProducaoOficial(hostname)) {
    return 'production'
  }

  if (hostnameEhLocal(hostname)) {
    return ambienteConfigurado === 'production' ? 'local' : ambienteConfigurado
  }

  return ambienteConfigurado
}

function removerSufixoHomologacao(valor) {
  return String(valor || '')
    .trim()
    .replace(/-hml$/i, '')
}

function garantirSufixoHomologacao(valor) {
  const semSufixo = removerSufixoHomologacao(valor)

  return semSufixo ? `${semSufixo}-hml` : ''
}

export function obterVersaoFrontend() {
  const versaoBase = removerSufixoHomologacao(VERSAO_BASE_APLICACAO)

  if (!versaoBase) {
    return ''
  }

  return obterAmbienteAplicacao() === 'homologacao' ? garantirSufixoHomologacao(versaoBase) : versaoBase
}

export function obterVersaoFrontendComPrefixo() {
  const versao = obterVersaoFrontend()

  return versao ? `v${versao}` : ''
}

export function obterAmbienteAplicacaoVersao() {
  return obterAmbienteAplicacao()
}

export function adicionarPrefixoVersao(valor) {
  const texto = String(valor || '').trim()

  if (!texto) {
    return ''
  }

  const versao = texto.replace(/^v/i, '')
  return `v${versao}`
}

