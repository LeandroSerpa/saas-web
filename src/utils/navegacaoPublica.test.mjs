import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  LINKS_ACAO_PUBLICA,
  LINKS_MENU_PUBLICO,
  obterRotaPublicaCadastro,
  obterRotaPublicaCadastroComPlanos,
  obterRotaPublicaEntrar,
  obterRotaPublicaInicio,
  obterRotaPublicaPlanos,
  obterRotaPublicaRecursos,
  obterRotaPublicaSobre,
} from './navegacaoPublica.js'

describe('navegacaoPublica', () => {
  it('expõe rotas públicas coerentes para o menu', () => {
    assert.equal(obterRotaPublicaInicio(), '/')
    assert.equal(obterRotaPublicaRecursos(), '/#recursos')
    assert.equal(obterRotaPublicaPlanos(), '/#planos')
    assert.equal(obterRotaPublicaSobre(), '/sobre')
    assert.equal(obterRotaPublicaEntrar(), '/login')
    assert.equal(obterRotaPublicaCadastro(), '/cadastro')
    assert.equal(obterRotaPublicaCadastroComPlanos(), '/cadastro#planos')
  })

  it('mantem a ordem do menu público principal', () => {
    assert.deepEqual(
      LINKS_MENU_PUBLICO.map((link) => [link.chave, link.rotulo, link.to]),
      [
        ['inicio', 'Início', '/'],
        ['recursos', 'Recursos', '/#recursos'],
        ['planos', 'Planos', '/#planos'],
        ['sobre', 'Sobre', '/sobre'],
      ],
    )
  })

  it('mantem as ações publicas separadas', () => {
    assert.deepEqual(
      LINKS_ACAO_PUBLICA.map((link) => [link.chave, link.rotulo, link.to]),
      [
        ['entrar', 'Entrar', '/login'],
        ['comecar', 'Começar agora', '/cadastro'],
      ],
    )
  })
})
