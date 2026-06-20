export const HEADER_EMPRESA_OPERACIONAL = 'X-Empresa-Operacional-Id'

function normalizarPerfil(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
    .replace(/^role_/, '')
}

export function usuarioEhSuperAdmin(usuario) {
  return normalizarPerfil(usuario?.perfil) === 'super_admin'
}

export function normalizarEmpresaOperacionalId(valor) {
  if (valor === undefined || valor === null) {
    return ''
  }

  const id = String(valor).trim()

  if (!/^[1-9]\d*$/.test(id)) {
    return ''
  }

  return id
}

export function resolverEmpresaOperacionalHeader(usuario, empresaVisualizacao) {
  const empresaOperacionalId = normalizarEmpresaOperacionalId(empresaVisualizacao?.id)

  if (!usuarioEhSuperAdmin(usuario) || !empresaOperacionalId) {
    return {}
  }

  return {
    [HEADER_EMPRESA_OPERACIONAL]: empresaOperacionalId,
  }
}
