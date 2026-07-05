import { ref } from 'vue'
import {
  TEMA_APARENCIA_CLARO,
  criarVariaveisCssTemaInterno,
  normalizarTemaInterno,
  obterColorSchemeTemaInterno,
  obterTemaInternoPadrao,
} from './temasInternos.js'

const CHAVE_TEMA_APARENCIA = 'temaAparencia'

export const temaAparencia = ref(TEMA_APARENCIA_CLARO)

export function normalizarTemaAparencia(valor) {
  return normalizarTemaInterno(valor)
}

export function obterTemaAparenciaPadrao() {
  return obterTemaInternoPadrao()
}

export function aplicarTemaAparenciaNoDocumento(tema) {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return normalizarTemaAparencia(tema) || obterTemaAparenciaPadrao()
  }

  const temaNormalizado = normalizarTemaAparencia(tema) || obterTemaAparenciaPadrao()
  const { documentElement, body } = document
  const variaveisCss = criarVariaveisCssTemaInterno(temaNormalizado)

  if (documentElement) {
    documentElement.dataset.appTheme = temaNormalizado
    documentElement.style.colorScheme = obterColorSchemeTemaInterno(temaNormalizado)

    Object.entries(variaveisCss).forEach(([chave, valor]) => {
      documentElement.style.setProperty(chave, valor)
    })
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
