import { ehSuperAdmin, normalizarPerfil } from '../utils/permissoes.js'

export const HEADER_EMPRESA_OPERACIONAL = 'X-Empresa-Operacional-Id'

export function usuarioEhSuperAdmin(usuario) {
  const perfilPrincipal = normalizarPerfil(usuario?.perfil)

  if (perfilPrincipal) {
    return perfilPrincipal === 'SUPER_ADMIN'
  }

  return ehSuperAdmin(usuario)
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
  const empresaOperacionalId = normalizarEmpresaOperacionalId(empresaVisualizacao?.id ?? empresaVisualizacao)

  if (!usuarioEhSuperAdmin(usuario) || !empresaOperacionalId) {
    return {}
  }

  return {
    [HEADER_EMPRESA_OPERACIONAL]: empresaOperacionalId,
  }
}
