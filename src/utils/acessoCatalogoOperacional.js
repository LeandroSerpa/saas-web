import { ehAdmin, ehSuperAdmin } from './permissoes.js'

const MODULOS_CATALOGO_E_ESTOQUE = Object.freeze([
  'ESTOQUE',
  'ESTOQ',
  'PRODUTO',
  'PRODUTOS',
  'PRODUTO_ESTOQUE',
  'PRODUTOS_ESTOQUE',
  'CATALOGO',
  'CATALOGO_PUBLICO',
  'CATALOGO_PUBLICO_INTEGRADO',
  'CATALOGO_PUBLICO_INTERNO',
  'CARDAPIO',
  'CARDAPIO_PUBLICO',
  'CARDAPIO_PUBLICO_INTEGRADO',
])

function normalizarCodigoModulo(valor) {
  return String(valor || '').trim().toUpperCase()
}

function extrairCodigoModulo(item) {
  if (item && typeof item === 'object') {
    return normalizarCodigoModulo(item.codigo || item.codigoModulo || item.nome || item.id || '')
  }

  return normalizarCodigoModulo(item)
}

export function normalizarModulosOperacionais(valor) {
  if (valor === undefined || valor === null) {
    return []
  }

  const lista = Array.isArray(valor)
    ? valor
    : typeof valor === 'object' && Object.prototype.hasOwnProperty.call(valor, 'modulosAtivos')
      ? (Array.isArray(valor.modulosAtivos) ? valor.modulosAtivos : valor.modulosAtivos ? [valor.modulosAtivos] : [])
      : [valor]

  return [...new Set(lista.map(extrairCodigoModulo).filter(Boolean))]
}

export function possuiModuloCatalogoOuEstoque(modulos = []) {
  return normalizarModulosOperacionais(modulos).some((modulo) =>
    MODULOS_CATALOGO_E_ESTOQUE.some(
      (candidato) => modulo === candidato || modulo.includes(candidato) || candidato.includes(modulo),
    ),
  )
}

function obterCapacidade(empresaOperacional, campo, alternativo = '') {
  if (!empresaOperacional || typeof empresaOperacional !== 'object') {
    return { encontrado: false, valor: undefined }
  }

  const fontes = [
    empresaOperacional.usoPlano,
    empresaOperacional.assinatura?.usoPlano,
    empresaOperacional.plano,
    empresaOperacional.assinatura?.plano,
  ]

  for (const fonte of fontes) {
    if (!fonte || typeof fonte !== 'object') {
      continue
    }

    if (Object.prototype.hasOwnProperty.call(fonte, campo)) {
      return { encontrado: true, valor: fonte[campo] }
    }

    if (alternativo && Object.prototype.hasOwnProperty.call(fonte, alternativo)) {
      return { encontrado: true, valor: fonte[alternativo] }
    }

    if (fonte.limites && typeof fonte.limites === 'object') {
      if (Object.prototype.hasOwnProperty.call(fonte.limites, campo)) {
        return { encontrado: true, valor: fonte.limites[campo] }
      }

      if (alternativo && Object.prototype.hasOwnProperty.call(fonte.limites, alternativo)) {
        return { encontrado: true, valor: fonte.limites[alternativo] }
      }
    }
  }

  return { encontrado: false, valor: undefined }
}

function avaliarLimiteCapacidade(resultado) {
  if (!resultado.encontrado) {
    return null
  }

  if (resultado.valor === null || resultado.valor === true) {
    return true
  }

  if (resultado.valor === false) {
    return false
  }

  const numero = Number(resultado.valor)

  if (!Number.isNaN(numero)) {
    return numero > 0
  }

  return null
}

function avaliarPermissaoCapacidade(resultado) {
  if (!resultado.encontrado) {
    return null
  }

  if (resultado.valor === true || resultado.valor === 1) {
    return true
  }

  if (resultado.valor === false || resultado.valor === 0) {
    return false
  }

  const texto = String(resultado.valor || '').trim().toLowerCase()

  if (['true', '1', 'sim', 's', 'ativo', 'on'].includes(texto)) {
    return true
  }

  if (['false', '0', 'nao', 'não', 'inativo', 'off'].includes(texto)) {
    return false
  }

  return null
}

function avaliarCapacidadeCatalogoOuEstoque(empresaOperacional) {
  const capacidades = [
    avaliarPermissaoCapacidade(obterCapacidade(empresaOperacional, 'permiteEstoque')),
    avaliarLimiteCapacidade(obterCapacidade(empresaOperacional, 'limiteProdutos')),
  ]

  if (capacidades.some((valor) => valor === true)) {
    return true
  }

  if (capacidades.some((valor) => valor === false)) {
    return false
  }

  return null
}

function normalizarIdEmpresa(valor) {
  if (valor === undefined || valor === null) {
    return ''
  }

  return String(valor).trim()
}

function obterEmpresaIdUsuario(usuario) {
  return normalizarIdEmpresa(usuario?.empresaId ?? usuario?.empresa?.id)
}

function obterEmpresaIdOperacional(empresaOperacional, empresaVisualizacao) {
  return normalizarIdEmpresa(
    empresaOperacional?.id ??
      empresaOperacional?.empresaId ??
      empresaVisualizacao?.id ??
      empresaVisualizacao?.empresaId ??
      empresaVisualizacao,
  )
}

export function avaliarAcessoCatalogoOperacional({
  usuario,
  empresaOperacional,
  empresaVisualizacao,
  modulos,
  carregando = false,
} = {}) {
  if (carregando) {
    return { permitido: false, motivo: 'empresa_operacional_carregando' }
  }

  if (!ehAdmin(usuario)) {
    return { permitido: false, motivo: 'usuario_sem_perfil_administrativo' }
  }

  const superAdmin = ehSuperAdmin(usuario)
  const empresaOperacionalId = obterEmpresaIdOperacional(empresaOperacional, empresaVisualizacao)
  const empresaAutenticadaId = obterEmpresaIdUsuario(usuario)
  const empresaEfetivaId = superAdmin ? empresaOperacionalId : empresaOperacionalId || empresaAutenticadaId

  if (superAdmin && !empresaEfetivaId) {
    return { permitido: false, motivo: 'super_admin_sem_empresa_operacional' }
  }

  if (!superAdmin && !empresaEfetivaId) {
    return { permitido: false, motivo: 'usuario_sem_empresa_efetiva' }
  }

  const modulosAtivos = normalizarModulosOperacionais(modulos ?? empresaOperacional)
  const visibilidadeCapacidade = avaliarCapacidadeCatalogoOuEstoque(empresaOperacional)

  if (visibilidadeCapacidade === false) {
    return { permitido: false, motivo: 'capacidade_estoque_explicitamente_bloqueada' }
  }

  if (possuiModuloCatalogoOuEstoque(modulosAtivos)) {
    return { permitido: true, motivo: 'perfil_admin_empresa_efetiva_modulo_catalogo_estoque' }
  }

  if (visibilidadeCapacidade === true) {
    return { permitido: true, motivo: 'perfil_admin_empresa_efetiva_capacidade_estoque' }
  }

  return { permitido: true, motivo: 'perfil_admin_empresa_efetiva' }
}

export function podeGerenciarCatalogoOperacional(opcoes = {}) {
  return avaliarAcessoCatalogoOperacional(opcoes).permitido
}
