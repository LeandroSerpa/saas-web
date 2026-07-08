import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  normalizarResumoMinhaConta,
  obterResumoMinhaContaFallback,
} from './minhaContaResumo.js'

describe('minhaContaResumo', () => {
  it('fornece fallback com cards principais', () => {
    const resumo = obterResumoMinhaContaFallback()

    assert.equal(resumo.cards.length, 5)
    assert.deepEqual(
      resumo.cards.map((card) => card.chave),
      ['aparencia', 'uso', 'telas', 'dicas', 'atalhos'],
    )
  })

  it('normaliza resposta com cards do backend', () => {
    const resumo = normalizarResumoMinhaConta({
      titulo: 'Resumo remoto',
      subtitulo: 'Tudo certo.',
      cards: [
        { chave: 'aparencia', titulo: 'Tema', descricao: 'Escuro' },
        { chave: 'uso', nome: 'Uso', texto: 'Preferências salvas' },
      ],
    })

    assert.equal(resumo.titulo, 'Resumo remoto')
    assert.equal(resumo.cards[0].titulo, 'Tema')
    assert.equal(resumo.cards[1].descricao, 'Preferências salvas')
  })

  it('cai para fallback quando a resposta não serve', () => {
    const resumo = normalizarResumoMinhaConta(null)

    assert.equal(resumo.cards.length, 5)
    assert.equal(resumo.subtitulo.includes('configuráveis'), true)
  })
})
