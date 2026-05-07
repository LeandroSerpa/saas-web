export function normalizarPerfil(perfil) {
  return String(perfil || '')
    .trim()
    .toUpperCase()
    .replace(/^ROLE_/, '')
}

function obterPerfis(usuario) {
  if (!usuario) {
    return []
  }

  const candidatos = [
    usuario.perfil,
    usuario.role,
    usuario.tipo,
    ...(Array.isArray(usuario.perfis) ? usuario.perfis : []),
    ...(Array.isArray(usuario.roles) ? usuario.roles : []),
    ...(Array.isArray(usuario.authorities) ? usuario.authorities : []),
  ]

  return candidatos
    .map((perfil) => (typeof perfil === 'object' ? perfil.authority || perfil.nome || perfil.name : perfil))
    .map(normalizarPerfil)
    .filter(Boolean)
}

export function ehSuperAdmin(usuario) {
  return obterPerfis(usuario).includes('SUPER_ADMIN')
}

export function ehAdmin(usuario) {
  const perfis = obterPerfis(usuario)

  return perfis.includes('ADMIN') || perfis.includes('SUPER_ADMIN')
}
