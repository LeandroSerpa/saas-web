export function resolverEmpresaEfetivaCabecalho({
  usuario,
  empresaOperacional,
  empresaVisualizacaoOperacional,
  superAdmin = false,
} = {}) {
  if (superAdmin) {
    return empresaOperacional || empresaVisualizacaoOperacional || null
  }

  return empresaOperacional || usuario?.empresa || {
    id: usuario?.empresaId,
    nome: usuario?.empresaNome,
  }
}

export function formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin = false } = {}) {
  const nomeEmpresa = String(empresaEfetiva?.nome || empresaEfetiva?.empresaNome || '').trim()
  const empresaId = empresaEfetiva?.id ?? empresaEfetiva?.empresaId ?? usuario?.empresaId

  if (nomeEmpresa) {
    return `Empresa: ${nomeEmpresa}`
  }

  if (superAdmin) {
    return 'Plataforma NuvemMais'
  }

  if (empresaId) {
    return 'Empresa'
  }

  return 'Empresa'
}
