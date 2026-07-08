import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  formatarPrecoPlanoPublico,
  normalizarPlanoPublico,
  normalizarPlanosPublicos,
  obterPlanosPublicosFallback,
  resolverPlanoPublicoRecomendado,
} from './planosPublicos.js'

describe('planosPublicos', () => {
  it('fornece fallback com tres planos', () => {
    const planos = obterPlanosPublicosFallback()

    assert.equal(planos.length, 3)
    assert.equal(planos[1].recomendado, true)
    assert.equal(planos[1].nome, 'Profissional')
  })

  it('normaliza um plano do backend', () => {
    const plano = normalizarPlanoPublico(
      {
        id: 42,
        nome: 'Plano Bronze',
        descricao: 'Plano para crescer com calma.',
        recursos: ['Agenda', 'Clientes'],
        precoMensal: '59.9',
        destaque: true,
        textoBotao: 'Assinar agora',
      },
      0,
    )

    assert.equal(plano.id, '42')
    assert.equal(plano.nome, 'Plano Bronze')
    assert.equal(plano.preco.replace(/\s+/g, ' ').trim(), 'R$ 59,90')
    assert.equal(plano.recomendado, true)
    assert.deepEqual(plano.recursos, ['Agenda', 'Clientes'])
    assert.equal(plano.cta, 'Assinar agora')
  })

  it('normaliza colecao vazia para fallback seguro', () => {
    const planos = normalizarPlanosPublicos([])

    assert.equal(planos.length, 3)
    assert.equal(planos[0].nome, 'Essencial')
  })

  it('seleciona o plano recomendado quando existir', () => {
    const planos = [
      { nome: 'B', recomendado: false },
      { nome: 'A', recomendado: true },
    ]

    assert.equal(resolverPlanoPublicoRecomendado(planos).nome, 'A')
  })

  it('mostra consulte condições quando não há preço', () => {
    assert.equal(formatarPrecoPlanoPublico({}), 'Consulte condições')
  })
})
