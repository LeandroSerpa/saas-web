import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  TEMA_APARENCIA_ARTESANAL,
  TEMA_APARENCIA_CLARO,
  TEMA_APARENCIA_CRIATIVO,
  TEMA_APARENCIA_ELEGANTE,
  TEMA_APARENCIA_ESCURO,
  TEMA_APARENCIA_MODERNO,
  TEMA_APARENCIA_NATURAL,
  TEMA_APARENCIA_NUVEMMAIS,
  TEMA_APARENCIA_PREMIUM,
  TEMA_APARENCIA_SUAVE,
  TEMAS_INTERNOS,
  criarVariaveisCssTemaInterno,
  normalizarTemaInterno,
  obterColorSchemeTemaInterno,
  obterOpcoesTemasInternos,
} from './temasInternos.js'

describe('temasInternos', () => {
  it('mantem uma lista enxuta de temas internos alinhados ao catalogo publico', () => {
    assert.deepEqual(
      obterOpcoesTemasInternos().map((tema) => tema.valor),
      [
        TEMA_APARENCIA_CLARO,
        TEMA_APARENCIA_MODERNO,
        TEMA_APARENCIA_NUVEMMAIS,
        TEMA_APARENCIA_SUAVE,
        TEMA_APARENCIA_NATURAL,
        TEMA_APARENCIA_PREMIUM,
        TEMA_APARENCIA_ARTESANAL,
        TEMA_APARENCIA_ELEGANTE,
        TEMA_APARENCIA_CRIATIVO,
        TEMA_APARENCIA_ESCURO,
      ],
    )
  })

  it('usa temas publicos como origem visual dos temas internos', () => {
    assert.deepEqual(
      TEMAS_INTERNOS.map((tema) => tema.temaPublico),
      [
        'PADRAO',
        'MODERNO',
        'AZUL_PROFISSIONAL',
        'SUAVE',
        'VERDE_NATURAL',
        'DOURADO_PREMIUM',
        'MADEIRA_ARTESANAL',
        'PRETO_ELEGANTE',
        'LARANJA_CRIATIVO',
        'ESCURO',
      ],
    )
  })

  it('preserva compatibilidade com valores antigos e aliases publicos', () => {
    assert.equal(normalizarTemaInterno('Claro'), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('PADRAO'), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('Escuro'), TEMA_APARENCIA_ESCURO)
    assert.equal(normalizarTemaInterno('NuvemMais Gestão'), TEMA_APARENCIA_NUVEMMAIS)
    assert.equal(normalizarTemaInterno('NuvemMais Azul'), TEMA_APARENCIA_MODERNO)
    assert.equal(normalizarTemaInterno('Oceano Profissional'), TEMA_APARENCIA_MODERNO)
    assert.equal(normalizarTemaInterno('Safira Escuro'), TEMA_APARENCIA_ESCURO)
    assert.equal(normalizarTemaInterno('Esmeralda Gestão'), TEMA_APARENCIA_NATURAL)
    assert.equal(normalizarTemaInterno('Âmbar Executivo'), TEMA_APARENCIA_PREMIUM)
    assert.equal(normalizarTemaInterno('Terra Elegante'), TEMA_APARENCIA_ARTESANAL)
    assert.equal(normalizarTemaInterno('Grafite Corporativo'), TEMA_APARENCIA_ELEGANTE)
    assert.equal(normalizarTemaInterno('Rubi Moderno'), TEMA_APARENCIA_CRIATIVO)
    assert.equal(normalizarTemaInterno('Rosa Criativo'), TEMA_APARENCIA_CRIATIVO)
  })

  it('gera tokens CSS e preview para todos os temas', () => {
    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)
      assert.equal(typeof variaveis['--app-bg'], 'string')
      assert.equal(typeof variaveis['--app-primary'], 'string')
      assert.equal(typeof variaveis['--app-sidebar-bg'], 'string')
      assert.equal(typeof variaveis['--app-input-disabled-bg'], 'string')
      assert.equal(typeof tema.preview.primario, 'string')
      assert.equal(typeof tema.preview.menu, 'string')
    }
  })

  it('identifica temas escuros pelo esquema de cor', () => {
    assert.equal(obterColorSchemeTemaInterno(TEMA_APARENCIA_ESCURO), 'dark')
    assert.equal(obterColorSchemeTemaInterno(TEMA_APARENCIA_ELEGANTE), 'dark')
    assert.equal(obterColorSchemeTemaInterno(TEMA_APARENCIA_CLARO), 'light')
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
