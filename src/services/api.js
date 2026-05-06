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

export async function buscarFuncionarios() {
  const response = await fetch(`${API_URL}/funcionarios`, {
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

export async function buscarFuncionariosPublicos(slug) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/funcionarios`, {
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

export async function criarAgendamentoPublico(slug, dados) {
  const response = await fetch(`${API_URL}/publico/empresas/${slug}/agendamentos`, {
    method: 'POST',
    headers: montarHeadersPublicos(true),
    body: JSON.stringify(dados),
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
