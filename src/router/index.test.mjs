import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const routerSource = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

function trechoEntre(inicio, fim) {
  const indiceInicio = routerSource.indexOf(inicio)
  const indiceFim = routerSource.indexOf(fim, indiceInicio + inicio.length)

  return routerSource.slice(indiceInicio, indiceFim > -1 ? indiceFim : undefined)
}

describe('router catalogo operacional', () => {
  it('protege estoque e catalogo interno com uma unica regra operacional', () => {
    const metaCatalogo = trechoEntre('const rotasCatalogoOperacional = {', 'const rotasSuperAdmin = {')

    assert.match(metaCatalogo, /requiresAuth:\s*true/)
    assert.match(metaCatalogo, /requiresCatalogoOperacional:\s*true/)
    assert.doesNotMatch(metaCatalogo, /requiresAdmin|requiresModulo|modulo|roles|perfis|permissions|ESTOQ|ESTOQUE/)
    assert.match(trechoEntre("path: '/estoque'", "path: '/catalogo-publico'"), /meta:\s*rotasCatalogoOperacional/)
    assert.match(trechoEntre("path: '/catalogo-publico'", "path: '/ajuda'"), /meta:\s*rotasCatalogoOperacional/)
    assert.match(routerSource, /avaliarAcessoCatalogoOperacional\(\{\s*usuario,\s*empresaOperacional,\s*empresaVisualizacao,/)
  })

  it('remove bloqueios antigos de modulo da rota /estoque', () => {
    const rotaEstoque = trechoEntre("path: '/estoque'", "path: '/catalogo-publico'")

    assert.doesNotMatch(rotaEstoque, /requiresAdmin|requiresModulo|modulo|roles|perfis|permissions|ESTOQ|ESTOQUE|CATALOGO/)
    assert.match(rotaEstoque, /meta:\s*rotasCatalogoOperacional/)
  })

  it('mantem o catalogo publico externo como rota publica', () => {
    assert.match(trechoEntre("path: '/catalogo/:slug'", "path: '/cadastro'"), /meta:\s*rotasPublicas/)
    assert.match(trechoEntre("alias: ['/cardapio/:slug']", "path: '/cadastro'"), /meta:\s*rotasPublicas/)
    assert.doesNotMatch(trechoEntre("path: '/catalogo/:slug'", "path: '/cadastro'"), /requiresAuth:\s*true|requiresCatalogoOperacional/)
  })
})
