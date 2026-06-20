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

export function resolverEmpresaIdEfetiva(usuario, empresaVisualizacao) {
  if (usuarioEhSuperAdmin(usuario)) {
    return normalizarEmpresaOperacionalId(empresaVisualizacao?.id ?? empresaVisualizacao) || null
  }

  return normalizarEmpresaOperacionalId(usuario?.empresaId ?? usuario?.empresa?.id) || null
}

export function resolverQueryEmpresaEfetiva(usuario, empresaVisualizacao, filtros = {}) {
  const dados = { ...(filtros || {}) }

  if (!usuarioEhSuperAdmin(usuario)) {
    return dados
  }

  const empresaId = resolverEmpresaIdEfetiva(usuario, empresaVisualizacao)

  if (!empresaId) {
    delete dados.empresaId
    return dados
  }

  return {
    ...dados,
    empresaId,
  }
}

export function resolverPayloadEmpresaEfetiva(usuario, empresaVisualizacao, payload = {}) {
  const dados = { ...(payload || {}) }

  if (!usuarioEhSuperAdmin(usuario)) {
    return dados
  }

  const empresaId = resolverEmpresaIdEfetiva(usuario, empresaVisualizacao)

  if (!empresaId) {
    delete dados.empresaId
    return dados
  }

  return {
    ...dados,
    empresaId,
  }
}

export function resolverEmpresaOperacionalHeader(usuario, empresaVisualizacao) {
  const empresaOperacionalId = resolverEmpresaIdEfetiva(usuario, empresaVisualizacao)

  if (!usuarioEhSuperAdmin(usuario) || !empresaOperacionalId) {
    return {}
  }

  return {
    [HEADER_EMPRESA_OPERACIONAL]: empresaOperacionalId,
  }
}
