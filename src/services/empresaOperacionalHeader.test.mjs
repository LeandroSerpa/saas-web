import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  HEADER_EMPRESA_OPERACIONAL,
  normalizarEmpresaOperacionalId,
  resolverEmpresaOperacionalHeader,
} from './empresaOperacionalHeader.js'

function header(usuario, empresaVisualizacao) {
  return resolverEmpresaOperacionalHeader(usuario, empresaVisualizacao)
}

describe('resolverEmpresaOperacionalHeader', () => {
  it('envia o header para SUPER_ADMIN com empresa 28', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, { id: 28 }), {
      [HEADER_EMPRESA_OPERACIONAL]: '28',
    })
  })

  it('envia o header atualizado para SUPER_ADMIN com empresa 30', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, { id: 30 }), {
      [HEADER_EMPRESA_OPERACIONAL]: '30',
    })
  })

  it('nao envia header para SUPER_ADMIN em visao global', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, null), {})
  })

  it('nao envia header para valores invalidos', () => {
    for (const valor of [null, undefined, '', '   ', 0, '0', 'abc']) {
      assert.equal(normalizarEmpresaOperacionalId(valor), '')
      assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, { id: valor }), {})
    }
  })

  it('nao envia header para ADMIN comum mesmo com valor residual', () => {
    assert.deepEqual(header({ perfil: 'ADMIN' }, { id: 28 }), {})
  })

  it('nao envia header para usuario comum', () => {
    assert.deepEqual(header({ perfil: 'USUARIO' }, { id: 28 }), {})
  })

  it('nao usa cache na sequencia 28, 30 e visao global', () => {
    assert.equal(header({ perfil: 'SUPER_ADMIN' }, { id: 28 })[HEADER_EMPRESA_OPERACIONAL], '28')
    assert.equal(header({ perfil: 'SUPER_ADMIN' }, { id: 30 })[HEADER_EMPRESA_OPERACIONAL], '30')
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, null), {})
  })
})
