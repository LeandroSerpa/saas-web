import { ref } from 'vue'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

export const MODO_NAVEGACAO_ESSENCIAL = 'essencial'
export const MODO_NAVEGACAO_COMPLETO = 'completo'
const CHAVE_MODO_NAVEGACAO_BASE = 'modoNavegacao'

export const modoNavegacao = ref(MODO_NAVEGACAO_ESSENCIAL)

function obterPerfilNavegacao(usuario) {
  if (ehSuperAdmin(usuario)) {
    return 'SUPER_ADMIN'
  }

  if (ehAdmin(usuario)) {
    return 'ADMIN'
  }

  return 'PADRAO'
}

function obterChaveModoNavegacao(usuario) {
  return `${CHAVE_MODO_NAVEGACAO_BASE}:${obterPerfilNavegacao(usuario)}`
}

export function normalizarModoNavegacao(valor) {
  if (valor === MODO_NAVEGACAO_ESSENCIAL || valor === MODO_NAVEGACAO_COMPLETO) {
    return valor
  }

  return ''
}

export function obterModoNavegacaoPadrao(usuario) {
  return ehSuperAdmin(usuario) ? MODO_NAVEGACAO_COMPLETO : MODO_NAVEGACAO_ESSENCIAL
}

export function lerModoNavegacaoSalvo(usuario) {
  if (typeof window === 'undefined') {
    return ''
  }

  const chave = obterChaveModoNavegacao(usuario)
  const valor = normalizarModoNavegacao(window.localStorage.getItem(chave))

  return valor || ''
}

export function salvarModoNavegacao(usuario, modo) {
  if (typeof window === 'undefined') {
    return ''
  }

  const valor = normalizarModoNavegacao(modo)

  if (!valor) {
    return ''
  }

  window.localStorage.setItem(obterChaveModoNavegacao(usuario), valor)
  modoNavegacao.value = valor

  return valor
}

export function sincronizarModoNavegacao(usuario) {
  if (typeof window === 'undefined') {
    modoNavegacao.value = obterModoNavegacaoPadrao(usuario)
    return modoNavegacao.value
  }

  const salvo = lerModoNavegacaoSalvo(usuario)

  if (salvo) {
    modoNavegacao.value = salvo
    return salvo
  }

  const padrao = obterModoNavegacaoPadrao(usuario)
  salvarModoNavegacao(usuario, padrao)

  return padrao
}
