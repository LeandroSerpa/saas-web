const API_URL = 'https://automacao-le-saas-api.1mweab.easypanel.host'

async function tratarResposta(response) {
  if (!response.ok) {
    throw new Error('Erro ao comunicar com a API')
  }

  return response.json()
}

export async function buscarClientes() {
  const response = await fetch(`${API_URL}/clientes`)
  return tratarResposta(response)
}

export async function buscarServicos() {
  const response = await fetch(`${API_URL}/servicos`)
  return tratarResposta(response)
}

export async function buscarFuncionarios() {
  const response = await fetch(`${API_URL}/funcionarios`)
  return tratarResposta(response)
}

export async function buscarAgendamentos() {
  const response = await fetch(`${API_URL}/agendamentos`)
  return tratarResposta(response)
}

export async function cadastrarCliente(cliente) {
  const response = await fetch(`${API_URL}/clientes`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function atualizarCliente(id, cliente) {
  const response = await fetch(`${API_URL}/clientes/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(cliente),
  })

  return tratarResposta(response)
}

export async function cadastrarServico(servico) {
  const response = await fetch(`${API_URL}/servicos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarServico(id, servico) {
  const response = await fetch(`${API_URL}/servicos/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(servico),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoServico(id, ativo) {
  const response = await fetch(`${API_URL}/servicos/${id}/ativo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarFuncionario(funcionario) {
  const response = await fetch(`${API_URL}/funcionarios`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarFuncionario(id, funcionario) {
  const response = await fetch(`${API_URL}/funcionarios/${id}`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(funcionario),
  })

  return tratarResposta(response)
}

export async function atualizarAtivoFuncionario(id, ativo) {
  const response = await fetch(`${API_URL}/funcionarios/${id}/ativo`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ ativo }),
  })

  return tratarResposta(response)
}

export async function cadastrarAgendamento(agendamento) {
  const response = await fetch(`${API_URL}/agendamentos`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(agendamento),
  })

  return tratarResposta(response)
}

export async function atualizarStatusAgendamento(id, status) {
  const response = await fetch(`${API_URL}/agendamentos/${id}/status`, {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  })

  return tratarResposta(response)
}
