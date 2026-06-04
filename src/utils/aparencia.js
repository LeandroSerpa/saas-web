import { ref } from 'vue'

export const TEMA_APARENCIA_CLARO = 'claro'
export const TEMA_APARENCIA_ESCURO = 'escuro'
export const TEMA_APARENCIA_NUVEMMAIS = 'nuvemmais'

const CHAVE_TEMA_APARENCIA = 'temaAparencia'

export const temaAparencia = ref(TEMA_APARENCIA_CLARO)

export function normalizarTemaAparencia(valor) {
  const tema = String(valor || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')

  if (tema === TEMA_APARENCIA_ESCURO) {
    return TEMA_APARENCIA_ESCURO
  }

  if (tema === TEMA_APARENCIA_NUVEMMAIS || tema === 'nuvemmais-gestao') {
    return TEMA_APARENCIA_NUVEMMAIS
  }

  return TEMA_APARENCIA_CLARO
}

export function obterTemaAparenciaPadrao() {
  return TEMA_APARENCIA_CLARO
}

export function aplicarTemaAparenciaNoDocumento(tema) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return normalizarTemaAparencia(tema) || obterTemaAparenciaPadrao()
  }

  const temaNormalizado = normalizarTemaAparencia(tema) || obterTemaAparenciaPadrao()
  const { documentElement, body } = document

  if (documentElement) {
    documentElement.dataset.appTheme = temaNormalizado
    documentElement.style.colorScheme = temaNormalizado === TEMA_APARENCIA_ESCURO ? 'dark' : 'light'
  }

  if (body) {
    body.dataset.appTheme = temaNormalizado
  }

  return temaNormalizado
}

export function lerTemaAparenciaSalvo() {
  if (typeof window === 'undefined') {
    return ''
  }

  return normalizarTemaAparencia(window.localStorage.getItem(CHAVE_TEMA_APARENCIA)) || ''
}

export function salvarTemaAparencia(tema) {
  const temaNormalizado = normalizarTemaAparencia(tema) || obterTemaAparenciaPadrao()

  if (typeof window !== 'undefined') {
    window.localStorage.setItem(CHAVE_TEMA_APARENCIA, temaNormalizado)
  }

  temaAparencia.value = temaNormalizado
  aplicarTemaAparenciaNoDocumento(temaNormalizado)

  return temaNormalizado
}

export function sincronizarTemaAparencia() {
  const salvo = lerTemaAparenciaSalvo()
  const tema = salvo || obterTemaAparenciaPadrao()

  temaAparencia.value = tema
  aplicarTemaAparenciaNoDocumento(tema)

  if (!salvo && typeof window !== 'undefined') {
    window.localStorage.setItem(CHAVE_TEMA_APARENCIA, tema)
  }

  return tema
}
