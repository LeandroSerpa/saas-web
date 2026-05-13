const API_URL = 'https://automacao-le-saas-api.1mweab.easypanel.host'

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

function encerrarSessao() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function extrairMensagemErro(response) {
  const mensagemPadrao = 'Não foi possível concluir a operação.'

  const dados = await lerJsonErro(response)

  if (dados) {
    const mensagemJson = extrairMensagemJson(dados)

    if (mensagemJson) {
      return mensagemJson
    }
  }

  const texto = await lerTextoErro(response)

  if (texto) {
    return texto
  }

  return mensagemPadrao
}

async function lerJsonErro(response) {
  try {
    return await response.clone().json()
  } catch (error) {
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
    return dados.trim()
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

  return texto
}

function mensagemGenerica(mensagem) {
  const texto = mensagem.toLowerCase()

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

async function extrairMensagemResposta(response) {
  const mensagemPadrao = 'Não foi possível concluir a operação.'

  try {
    const data = await response.clone().json()

    if (data?.message) {
      return data.message
    }

    if (data?.detail) {
      return data.detail
    }

    if (data?.error) {
      return data.error
    }
  } catch (error) {
    console.error(error)
  }

  try {
    const texto = (await response.clone().text()).trim()

    if (texto) {
      return texto
    }
  } catch (error) {
    console.error(error)
  }

  return mensagemPadrao
}

async function tratarResposta(response) {
  if (!response.ok) {
    const mensagem = await extrairMensagemResposta(response)

    if (response.status === 401) {
      encerrarSessao()
    }

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

async function tratarRespostaPublica(response) {
  if (!response.ok) {
    const mensagem = await extrairMensagemResposta(response)

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

export async function buscarClientes() {
  const response = await fetch(`${API_URL}/clientes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarServicos() {
  const response = await fetch(`${API_URL}/servicos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionarios(filtros = {}) {
  const response = await fetch(`${API_URL}/funcionarios${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAgendamentos() {
  const response = await fetch(`${API_URL}/agendamentos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEmpresaPublica(slug) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarServicosPublicos(slug) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/servicos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarSegmentosPublicos() {
  const response = await fetch(`${API_URL}/publico/segmentos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarSegmentosCadastroPublico() {
  const response = await fetch(`${API_URL}/publico/segmentos-cadastro`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarPlanosPublicos() {
  const response = await fetch(`${API_URL}/publico/planos`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarPlanosCadastroPublico() {
  const response = await fetch(`${API_URL}/publico/planos-cadastro`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function enviarSolicitacaoCadastro(dados) {
  return criarSolicitacaoCadastroEmpresa(dados)
}

export async function criarSolicitacaoCadastroEmpresa(dados) {
  const response = await fetch(`${API_URL}/publico/solicitacoes-cadastro`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
  })

  return tratarRespostaPublica(response)
}

export async function buscarFuncionariosPublicos(slug, filtros = {}) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/funcionarios${montarQueryString(filtros)}`, {
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

  const response = await fetch(`${API_URL}/publico/empresas/${slug}/disponibilidade?${params}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarDisponibilidadeDataPublica(slug, data) {
  const params = new URLSearchParams({ data })
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/disponibilidade-data?${params}`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function criarAgendamentoPublico(slug, dados) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/agendamentos`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
  })

  return tratarRespostaPublica(response)
}

export async function buscarMinhaPersonalizacao() {
  const response = await fetch(`${API_URL}/minha-empresa/personalizacao`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarIndisponibilidades(filtros = {}) {
  const response = await fetch(`${API_URL}/indisponibilidades${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarIndisponibilidadePorId(id) {
  const response = await fetch(`${API_URL}/indisponibilidades/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarIndisponibilidade(dados) {
  const response = await fetch(`${API_URL}/indisponibilidades`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarIndisponibilidade(id, dados) {
  const response = await fetch(`${API_URL}/indisponibilidades/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function excluirIndisponibilidade(id) {
  const response = await fetch(`${API_URL}/indisponibilidades/${id}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionarioServicos(filtros = {}) {
  const response = await fetch(`${API_URL}/funcionario-servicos${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function vincularFuncionarioServico(dados) {
  const response = await fetch(`${API_URL}/funcionario-servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function excluirFuncionarioServico(id) {
  const response = await fetch(`${API_URL}/funcionario-servicos/${id}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFuncionariosVinculadosAoServico(servicoId) {
  const urlPrincipal = `${API_URL}/servicos/${servicoId}/funcionarios-vinculados`
  const response = await fetch(urlPrincipal, {
    headers: montarHeaders(),
  })

  if (response.status === 404) {
    const urlFallback = `${API_URL}/servicos/${servicoId}/funcionarios`
    const fallback = await fetch(urlFallback, {
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
  const response = await fetch(url, {
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
  } catch (error) {
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

export async function buscarServicosVinculadosAoFuncionario(funcionarioId) {
  const response = await fetch(`${API_URL}/funcionarios/${funcionarioId}/servicos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarServicosVinculadosAoFuncionario(funcionarioId, servicoIds) {
  const response = await fetch(`${API_URL}/funcionarios/${funcionarioId}/servicos`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(servicoIds),
  })

  return tratarResposta(response)
}

export async function salvarMinhaPersonalizacao(dados) {
  const response = await fetch(`${API_URL}/minha-empresa/personalizacao`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarPersonalizacaoPublica(slug) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/personalizacao`, {
    headers: montarHeadersPublicos(),
  })

  return tratarRespostaPublica(response)
}

export async function buscarAuditoria(filtros = {}) {
  const response = await fetch(`${API_URL}/admin/auditoria${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAuditoriaPorId(id) {
  const response = await fetch(`${API_URL}/admin/auditoria/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarDashboardSaas() {
  const response = await fetch(`${API_URL}/admin/dashboard-saas`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAcoesAuditoria() {
  const response = await fetch(`${API_URL}/admin/auditoria/acoes`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarModulosAuditoria() {
  const response = await fetch(`${API_URL}/admin/auditoria/modulos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarEntidadesAuditoria() {
  const response = await fetch(`${API_URL}/admin/auditoria/entidades`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSegmentos() {
  const response = await fetch(`${API_URL}/admin/segmentos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSegmentoPorId(id) {
  const response = await fetch(`${API_URL}/admin/segmentos/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarSegmento(dados) {
  const response = await fetch(`${API_URL}/admin/segmentos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarSegmento(id, dados) {
  const response = await fetch(`${API_URL}/admin/segmentos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function ativarSegmento(id) {
  const response = await fetch(`${API_URL}/admin/segmentos/${id}/ativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desativarSegmento(id) {
  const response = await fetch(`${API_URL}/admin/segmentos/${id}/desativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSolicitacoesCadastro(filtros = {}) {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoSolicitacoesCadastro() {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro/resumo`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarSolicitacaoCadastroPorId(id) {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function marcarSolicitacaoEmAnalise(id) {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/em-analise`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function rejeitarSolicitacaoCadastro(id, dados) {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/rejeitar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function aprovarSolicitacaoCadastro(id, dados) {
  const response = await fetch(`${API_URL}/admin/solicitacoes-cadastro/${id}/aprovar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarFaturas(filtros = {}) {
  const response = await fetch(`${API_URL}/faturas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarResumoFaturas(filtros = {}) {
  const response = await fetch(`${API_URL}/faturas/resumo${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarFaturaPorId(id) {
  const response = await fetch(`${API_URL}/faturas/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarFatura(dados) {
  const response = await fetch(`${API_URL}/faturas`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarFatura(id, dados) {
  const response = await fetch(`${API_URL}/faturas/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarStatusFatura(id, dados = {}) {
  const response = await fetch(`${API_URL}/faturas/${id}/status`, {
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
  const response = await fetch(`${API_URL}/faturas/${id}/cancelar`, {
    method: 'PATCH',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function reativarFatura(id) {
  const response = await fetch(`${API_URL}/faturas/${id}/reativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioOperacaonal(filtros = {}) {
  const response = await fetch(`${API_URL}/relatorios/operacaonal${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarRelatorioFinanceiro(filtros = {}) {
  const response = await fetch(`${API_URL}/relatorios/financeiro${montarQueryString(filtros)}`, {
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
  const response = await fetch(`${API_URL}/relatorios/agendamentos.csv${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  if (!response.ok) {
    const mensagem = await extrairMensagemResposta(response)

    if (response.status === 401) {
      encerrarSessao()
    }

    throw new Error(mensagem || 'Não foi possível exportar o relatório.')
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
  const response = await fetch(`${API_URL}${caminho}${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarPlanos() {
  const response = await fetch(`${API_URL}/admin/planos`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarPlanoPorId(id) {
  const response = await fetch(`${API_URL}/admin/planos/${id}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function criarPlano(dados) {
  const response = await fetch(`${API_URL}/admin/planos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function atualizarPlano(id, dados) {
  const response = await fetch(`${API_URL}/admin/planos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function ativarPlano(id) {
  const response = await fetch(`${API_URL}/admin/planos/${id}/ativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function desativarPlano(id) {
  const response = await fetch(`${API_URL}/admin/planos/${id}/desativar`, {
    method: 'PATCH',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAssinaturas(filtros = {}) {
  const response = await fetch(`${API_URL}/admin/assinaturas${montarQueryString(filtros)}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAssinaturaEmpresa(empresaId) {
  const response = await fetch(`${API_URL}/admin/assinaturas/empresa/${empresaId}`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function salvarAssinaturaEmpresa(empresaId, dados) {
  const response = await fetch(`${API_URL}/admin/assinaturas/empresa/${empresaId}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(dados),
  })

  return tratarResposta(response)
}

export async function buscarMinhaAssinatura() {
  const response = await fetch(`${API_URL}/minha-empresa/assinatura`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarUsoPlano() {
  const response = await fetch(`${API_URL}/minha-empresa/uso-plano`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarAgendamentosExcluidos(filtros = {}) {
  const response = await fetch(
    `${API_URL}/admin/lixeira/agendamentos${montarQueryString(filtros)}`,
    {
      headers: montarHeaders(),
    },
  )

  return tratarResposta(response)
}

export async function restaurarAgendamento(id) {
  const response = await fetch(`${API_URL}/admin/lixeira/agendamentos/${id}/restaurar`, {
    method: 'POST',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function login(email, senha) {
  const response = await fetch(`${API_URL}/auth/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ email, senha }),
  })

  return tratarResposta(response)
}

export async function alterarSenha(senhaAtual, novaSenha) {
  const response = await fetch(`${API_URL}/auth/alterar-senha`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify({ senhaAtual, novaSenha }),
  })

  return tratarResposta(response)
}

export async function buscarEmpresas() {
  const response = await fetch(`${API_URL}/empresas`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function buscarMinhaEmpresa() {
  const response = await fetch(`${API_URL}/minha-empresa`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function atualizarMinhaEmpresa(empresa) {
  const response = await fetch(`${API_URL}/minha-empresa`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function cadastrarEmpresa(empresa) {
  const response = await fetch(`${API_URL}/empresas`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function atualizarEmpresa(id, empresa) {
  const response = await fetch(`${API_URL}/empresas/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(empresa),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoEmpresa(id, ativo) {
  const response = await fetch(`${API_URL}/empresas/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function buscarUsuarios() {
  const response = await fetch(`${API_URL}/usuarios`, {
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}

export async function cadastrarUsuario(usuario) {
  const response = await fetch(`${API_URL}/usuarios`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(usuario),
  })

  return tratarResposta(response)
}

export async function atualizarUsuario(id, usuario) {
  const response = await fetch(`${API_URL}/usuarios/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(usuario),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoUsuario(id, ativo) {
  const response = await fetch(`${API_URL}/usuarios/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarCliente(cliente) {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function atualizarCliente(id, cliente) {
  const response = await fetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function cadastrarServico(servico) {
  const response = await fetch(`${API_URL}/servicos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarServico(id, servico) {
  const response = await fetch(`${API_URL}/servicos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoServico(id, ativo) {
  const response = await fetch(`${API_URL}/servicos/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarFuncionario(funcionario) {
  const response = await fetch(`${API_URL}/funcionarios`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarFuncionario(id, funcionario) {
  const response = await fetch(`${API_URL}/funcionarios/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoFuncionario(id, ativo) {
  const response = await fetch(`${API_URL}/funcionarios/${id}/ativo`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarAgendamento(agendamento) {
  const response = await fetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: montarHeaders(true),
    body: JSON.stringify(agendamento),
  })

  return tratarResposta(response)
}

export async function atualizarAgendamento(id, agendamento) {
  const response = await fetch(`${API_URL}/agendamentos/${id}`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify(agendamento),
  })

  return tratarResposta(response)
}

export async function atualizarStatusAgendamento(id, status) {
  const response = await fetch(`${API_URL}/agendamentos/${id}/status`, {
    method: 'PUT',
    headers: montarHeaders(true),
    body: JSON.stringify({ status }),
  })

  return tratarResposta(response)
}

export async function excluirAgendamento(id, motivo = '') {
  const response = await fetch(`${API_URL}/agendamentos/${id}${montarQueryString({ motivo })}`, {
    method: 'DELETE',
    headers: montarHeaders(),
  })

  return tratarResposta(response)
}
