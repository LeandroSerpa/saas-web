import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  TEMA_APARENCIA_CLARO,
  TEMA_APARENCIA_ESCURO,
  TEMA_APARENCIA_MODERNO,
  TEMA_APARENCIA_NUVEMMAIS,
  TEMA_APARENCIA_SUAVE,
  criarVariaveisCssTemaInterno,
  normalizarTemaInterno,
  obterOpcoesTemasInternos,
} from './temasInternos.js'

describe('temasInternos', () => {
  it('mantem o catalogo final de cinco temas internos', () => {
    assert.deepEqual(
      obterOpcoesTemasInternos().map((tema) => tema.valor),
      [
        TEMA_APARENCIA_CLARO,
        TEMA_APARENCIA_MODERNO,
        TEMA_APARENCIA_ESCURO,
        TEMA_APARENCIA_SUAVE,
        TEMA_APARENCIA_NUVEMMAIS,
      ],
    )
  })

  it('preserva compatibilidade com valores antigos e aliases publicos', () => {
    assert.equal(normalizarTemaInterno('Claro'), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('PADRAO'), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('Escuro'), TEMA_APARENCIA_ESCURO)
    assert.equal(normalizarTemaInterno('NuvemMais Gestão'), TEMA_APARENCIA_NUVEMMAIS)
  })

  it('gera tokens CSS para os cinco temas', () => {
    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)
      assert.equal(typeof variaveis['--app-bg'], 'string')
      assert.equal(typeof variaveis['--app-primary'], 'string')
      assert.equal(typeof variaveis['--app-sidebar-bg'], 'string')
      assert.equal(typeof variaveis['--app-input-disabled-bg'], 'string')
    }
  })

  it('mantem o tema independente do modo de navegacao salvo em paralelo', () => {
    const preferencias = {
      modo: 'essencial',
      tema: 'moderno',
    }

    const temaAntes = normalizarTemaInterno(preferencias.tema)
    preferencias.modo = 'completo'

    assert.equal(temaAntes, TEMA_APARENCIA_MODERNO)
    assert.equal(normalizarTemaInterno(preferencias.tema), TEMA_APARENCIA_MODERNO)
  })
})
