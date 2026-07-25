import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  avaliarAcessoCatalogoOperacional,
  normalizarModulosOperacionais,
  podeGerenciarCatalogoOperacional,
  possuiModuloCatalogoOuEstoque,
} from './acessoCatalogoOperacional.js'

const usuarioAdminReal = Object.freeze({
  id: 17,
  nome: 'Administrador GraRique',
  email: 'admin@example.test',
  login: 'admin.grarique',
  perfil: 'ADMIN',
  empresaId: 42,
  empresaNome: 'GraRique Artesanatos',
  cadastroPendente: false,
  statusEmpresa: 'ATIVA',
  trocaSenhaObrigatoria: false,
})

describe('acessoCatalogoOperacional', () => {
  it('reconhece modulos antigos e novos de estoque e catalogo', () => {
    assert.deepEqual(
      normalizarModulosOperacionais([
        ' estoque ',
        { codigo: 'catalogo_publico' },
        { codigoModulo: 'produtos_estoque' },
      ]),
      ['ESTOQUE', 'CATALOGO_PUBLICO', 'PRODUTOS_ESTOQUE'],
    )

    assert.equal(possuiModuloCatalogoOuEstoque(['CATALOGO_PUBLICO']), true)
    assert.equal(possuiModuloCatalogoOuEstoque(['PRODUTOS_ESTOQUE']), true)
  })

  it('libera o menu para ADMIN real que ja visualiza Usuarios', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: usuarioAdminReal,
        empresaOperacional: { id: 42, nome: 'GraRique Artesanatos' },
      }),
      true,
    )
  })

  it('libera ADMIN com empresa valida sem exigir modulos', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresaId: 7 },
        empresaOperacional: { id: 7 },
      }),
      true,
    )
  })

  it('libera ADMIN com lista explicita de modulos sem ESTOQ', () => {
    const avaliacao = avaliarAcessoCatalogoOperacional({
      usuario: { perfil: 'ADMIN', empresaId: 7 },
      empresaOperacional: { id: 7, modulosAtivos: ['AGENDAMENTO', 'GESTAO_ESPORTIVA'] },
    })

    assert.equal(avaliacao.permitido, true)
    assert.equal(avaliacao.motivo, 'perfil_admin_empresa_efetiva')
  })

  it('libera o menu para SUPER_ADMIN em modo operacao com empresa selecionada', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'SUPER_ADMIN' },
        empresaOperacional: { id: '28', modulosAtivos: ['AGENDAMENTO'] },
      }),
      true,
    )
  })

  it('nega o menu para SUPER_ADMIN na visao global', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'SUPER_ADMIN' },
        empresaOperacional: null,
      }),
      false,
    )
  })

  it('nega o menu para usuario comum sem permissao', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'USUARIO', empresaId: 7 },
        empresaOperacional: { id: 7 },
      }),
      false,
    )
  })

  it('nega ADMIN sem empresa efetiva', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN' },
        empresaOperacional: null,
      }),
      false,
    )
  })

  it('respeita bloqueio explicito de capacidade quando o contrato informa false', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresaId: 7 },
        empresaOperacional: { id: 7, usoPlano: { permiteEstoque: false } },
      }),
      false,
    )
  })

  it('recalcula a visibilidade ao trocar de empresa', () => {
    const usuario = { perfil: 'SUPER_ADMIN' }

    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario,
        empresaOperacional: { id: '28' },
      }),
      true,
    )

    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario,
        empresaOperacional: { id: '30', usoPlano: { permiteEstoque: false } },
      }),
      false,
    )
  })

  it('nao depende de agenda nem de gestao esportiva', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresaId: 7 },
        empresaOperacional: {
          id: 7,
          modulosAtivos: ['AGENDAMENTO', 'GESTAO_ESPORTIVA'],
          segmento: 'BEACH_TENNIS',
          possuiAgenda: true,
        },
      }),
      true,
    )
  })

  it('reconhece perfil em objeto, string, roles e authorities pela regra canonica', () => {
    const empresas = { id: 7 }

    assert.equal(podeGerenciarCatalogoOperacional({ usuario: { perfil: { nome: 'ADMIN' } }, empresaOperacional: empresas }), true)
    assert.equal(podeGerenciarCatalogoOperacional({ usuario: { role: 'ROLE_ADMIN' }, empresaOperacional: empresas }), true)
    assert.equal(podeGerenciarCatalogoOperacional({ usuario: { roles: ['ADMIN'] }, empresaOperacional: empresas }), true)
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { authorities: [{ authority: 'ROLE_ADMIN' }] },
        empresaOperacional: empresas,
      }),
      true,
    )
  })

  it('aceita empresaId numerico, string, no usuario e na empresa carregada separadamente', () => {
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresaId: 7 },
        empresaOperacional: null,
      }),
      true,
    )
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresaId: '7' },
        empresaOperacional: null,
      }),
      true,
    )
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN', empresa: { id: '7' } },
        empresaOperacional: null,
      }),
      true,
    )
    assert.equal(
      podeGerenciarCatalogoOperacional({
        usuario: { perfil: 'ADMIN' },
        empresaOperacional: { id: '7' },
      }),
      true,
    )
  })
})
