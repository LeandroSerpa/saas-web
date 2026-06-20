import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  HEADER_EMPRESA_OPERACIONAL,
  normalizarEmpresaOperacionalId,
  resolverEmpresaIdEfetiva,
  resolverEmpresaOperacionalHeader,
  resolverPayloadEmpresaEfetiva,
  resolverQueryEmpresaEfetiva,
  usuarioEhSuperAdmin,
} from './empresaOperacionalHeader.js'

function header(usuario, empresaVisualizacao) {
  return resolverEmpresaOperacionalHeader(usuario, empresaVisualizacao)
}

describe('resolverEmpresaOperacionalHeader', () => {
  it('reconhece SUPER_ADMIN pelo campo real perfil', () => {
    assert.equal(
      usuarioEhSuperAdmin({
        id: 2,
        nome: 'Administrador',
        email: 'admin@saas.com',
        login: 'serpalhss',
        perfil: 'SUPER_ADMIN',
      }),
      true,
    )
  })

  it('envia o header para SUPER_ADMIN com empresa numerica 28', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, 28), {
      [HEADER_EMPRESA_OPERACIONAL]: '28',
    })
  })

  it('envia o header para SUPER_ADMIN com empresa em objeto e id string 28', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, { id: '28', nome: 'Arena Esportiva Teste' }), {
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
    for (const valor of [null, undefined, '', '   ', 0, '0', -1, '-1', 'abc']) {
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

  it('nao envia header quando o perfil esta ausente', () => {
    assert.deepEqual(header({}, { id: 28 }), {})
  })

  it('nao considera texto parcial como SUPER_ADMIN', () => {
    assert.equal(usuarioEhSuperAdmin({ perfil: 'SUPER' }), false)
    assert.deepEqual(header({ perfil: 'SUPER' }, { id: 28 }), {})
  })

  it('encerra o header ao sair da operacao', () => {
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, undefined), {})
  })

  it('nao usa cache na sequencia 28, 30 e visao global', () => {
    assert.equal(header({ perfil: 'SUPER_ADMIN' }, 28)[HEADER_EMPRESA_OPERACIONAL], '28')
    assert.equal(header({ perfil: 'SUPER_ADMIN' }, { id: 30 })[HEADER_EMPRESA_OPERACIONAL], '30')
    assert.deepEqual(header({ perfil: 'SUPER_ADMIN' }, null), {})
  })
})

describe('resolverEmpresaIdEfetiva', () => {
  it('usa a empresa selecionada para SUPER_ADMIN e ignora empresaId autenticada', () => {
    const usuario = { id: 2, perfil: 'SUPER_ADMIN', empresaId: 1 }
    const empresaVisualizacao = { id: '28', nome: 'Arena Esportiva Teste' }

    assert.equal(resolverEmpresaIdEfetiva(usuario, empresaVisualizacao), '28')
  })

  it('usa a empresa real selecionada ao trocar para Barbearia', () => {
    const usuario = { id: 2, perfil: 'SUPER_ADMIN', empresaId: 1 }
    const barbearia = { id: '30', nome: 'Barbearia Teste' }

    assert.equal(resolverEmpresaIdEfetiva(usuario, barbearia), '30')
    assert.notEqual(resolverEmpresaIdEfetiva(usuario, barbearia), '28')
    assert.notEqual(resolverEmpresaIdEfetiva(usuario, barbearia), '1')
  })

  it('na troca 28 para 30 nao reaproveita cache', () => {
    const usuario = { id: 2, perfil: 'SUPER_ADMIN', empresaId: 1 }

    assert.equal(resolverEmpresaIdEfetiva(usuario, { id: 28 }), '28')
    assert.equal(resolverEmpresaIdEfetiva(usuario, { id: 30 }), '30')
  })

  it('em visao global retorna null para SUPER_ADMIN', () => {
    assert.equal(resolverEmpresaIdEfetiva({ perfil: 'SUPER_ADMIN', empresaId: 1 }, null), null)
  })

  it('para ADMIN comum usa a empresa autenticada e ignora visualizacao residual', () => {
    const usuario = { perfil: 'ADMIN', empresaId: 7 }

    assert.equal(resolverEmpresaIdEfetiva(usuario, { id: 28 }), '7')
  })

  it('para USUARIO comum usa a empresa autenticada e ignora visualizacao residual', () => {
    const usuario = { perfil: 'USUARIO', empresaId: 10 }

    assert.equal(resolverEmpresaIdEfetiva(usuario, { id: 28 }), '10')
  })
})

describe('resolverQueryEmpresaEfetiva', () => {
  it('sobrescreve query empresaId com empresa selecionada para SUPER_ADMIN', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1 }

    assert.deepEqual(resolverQueryEmpresaEfetiva(usuario, { id: 28 }, { empresaId: 1, page: 0 }), {
      empresaId: '28',
      page: 0,
    })
  })

  it('remove empresaId residual da query em visao global', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1 }

    assert.deepEqual(resolverQueryEmpresaEfetiva(usuario, null, { empresaId: 1, status: 'ativo' }), {
      status: 'ativo',
    })
  })

  it('preserva query de ADMIN comum sem enviar header operacional', () => {
    const usuario = { perfil: 'ADMIN', empresaId: 7 }

    assert.deepEqual(resolverQueryEmpresaEfetiva(usuario, { id: 28 }, { empresaId: 7, page: 1 }), {
      empresaId: 7,
      page: 1,
    })
    assert.deepEqual(header(usuario, { id: 28 }), {})
  })

  it('preserva filtro administrativo global empresaId para usuario nao SUPER_ADMIN', () => {
    const usuario = { perfil: 'ADMIN', empresaId: 10 }

    assert.deepEqual(resolverQueryEmpresaEfetiva(usuario, { id: 28 }, { empresaId: 30, status: 'ativo' }), {
      empresaId: 30,
      status: 'ativo',
    })
  })

  it('nao muta o objeto original de filtros', () => {
    const filtros = { empresaId: 1, status: 'ativo' }
    const resultado = resolverQueryEmpresaEfetiva({ perfil: 'SUPER_ADMIN', empresaId: 1 }, { id: 28 }, filtros)

    assert.deepEqual(filtros, { empresaId: 1, status: 'ativo' })
    assert.deepEqual(resultado, { empresaId: '28', status: 'ativo' })
  })
})

describe('resolverPayloadEmpresaEfetiva', () => {
  it('sobrescreve payload empresaId com empresa selecionada para SUPER_ADMIN', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1 }

    assert.deepEqual(resolverPayloadEmpresaEfetiva(usuario, { id: 28 }, { empresaId: 1, nome: 'Cliente' }), {
      empresaId: '28',
      nome: 'Cliente',
    })
  })

  it('remove empresaId empresarial em visao global', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1 }

    assert.deepEqual(resolverPayloadEmpresaEfetiva(usuario, null, { empresaId: 1, nome: 'Cliente' }), {
      nome: 'Cliente',
    })
  })

  it('falha se header usa 28 mas query ou body continuam com 1', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1 }
    const empresa = { id: 28 }
    const headers = header(usuario, empresa)
    const query = resolverQueryEmpresaEfetiva(usuario, empresa, { empresaId: 1 })
    const payload = resolverPayloadEmpresaEfetiva(usuario, empresa, { empresaId: 1 })

    assert.equal(headers[HEADER_EMPRESA_OPERACIONAL], '28')
    assert.equal(query.empresaId, '28')
    assert.equal(payload.empresaId, '28')
    assert.notEqual(query.empresaId, '1')
    assert.notEqual(payload.empresaId, '1')
  })

  it('nao muta o objeto original de payload', () => {
    const payload = { empresaId: 1, nome: 'Cliente' }
    const resultado = resolverPayloadEmpresaEfetiva({ perfil: 'SUPER_ADMIN', empresaId: 1 }, { id: 28 }, payload)

    assert.deepEqual(payload, { empresaId: 1, nome: 'Cliente' })
    assert.deepEqual(resultado, { empresaId: '28', nome: 'Cliente' })
  })
})
