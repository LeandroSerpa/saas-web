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

function encerrarSessao() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')

  if (window.location.pathname !== '/login') {
    window.location.href = '/login'
  }
}

async function tratarResposta(response) {
  if (response.status === 401 || response.status === 403) {
    encerrarSessao()
    throw new Error('Sessao expirada ou acesso negado')
  }

  if (!response.ok) {
    throw new Error('Erro ao comunicar com a API')
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
