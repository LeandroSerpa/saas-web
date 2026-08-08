import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'
import { createMemoryHistory, createRouter } from 'vue-router'

import {
  criarNavegacaoRetornoTurmaAlunos,
  normalizarIdInteiroPositivo,
} from '../utils/beachTennisCadastroAluno.js'

const routerSource = readFileSync(new URL('./index.js', import.meta.url), 'utf8')

function trechoEntre(inicio, fim) {
  const indiceInicio = routerSource.indexOf(inicio)
  const indiceFim = routerSource.indexOf(fim, indiceInicio + inicio.length)

  return routerSource.slice(indiceInicio, indiceFim > -1 ? indiceFim : undefined)
}

function criarRouterTeste() {
  return createRouter({
    history: createMemoryHistory(),
    routes: [
      {
        path: '/beach-tennis/turmas',
        name: 'beach-tennis-turmas',
        component: { template: '<div />' },
      },
      {
        path: '/beach-tennis/alunos',
        name: 'beach-tennis-alunos',
        component: { template: '<div />' },
      },
      {
        path: '/beach-tennis/turmas/:turmaId/alunos',
        name: 'beach-tennis-turma-alunos',
        redirect: (to) => {
          const turmaId = normalizarIdInteiroPositivo(to.params.turmaId)

          if (!turmaId) {
            return '/beach-tennis/turmas'
          }

          return {
            path: '/beach-tennis/alunos',
            query: {
              ...to.query,
              turmaId,
            },
          }
        },
      },
    ],
  })
}

async function navegarSemWarning(router, navegacao, contexto) {
  const warnings = []
  const originalWarn = console.warn

  console.warn = (...args) => {
    warnings.push(args.map((valor) => String(valor)).join(' '))
  }

  try {
    await router.push(navegacao)
  } finally {
    console.warn = originalWarn
  }

  const warningRuido = warnings.find((mensagem) => mensagem.includes('Discarded invalid param(s) "turmaId"'))
  assert.equal(
    warningRuido,
    undefined,
    `${contexto} emitiu warning inesperado: ${warningRuido || warnings.join(' | ')}`,
  )
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

  it('expone o cadastro geral de alunos com protecao administrativa e de gestao esportiva', () => {
    const rotaNova = trechoEntre("path: '/beach-tennis/cadastro-alunos'", "path: '/beach-tennis/turmas'")

    assert.match(rotaNova, /name:\s*'beach-tennis-cadastro-alunos'/)
    assert.match(rotaNova, /component:\s*ClientesView/)
    assert.match(rotaNova, /meta:\s*\{\s*\.\.\.rotasAdmin,\s*requiresGestaoEsportiva:\s*true\s*\}/)
  })

  it('usa fallback seguro para o redirect legado quando o turmaId e invalido', () => {
    const redirectTurma = trechoEntre("path: '/beach-tennis/turmas/:turmaId/alunos'", "path: '/beach-tennis/financeiro'")

    assert.match(redirectTurma, /redirect:\s*\(to\)\s*=>/)
    assert.match(redirectTurma, /normalizarIdInteiroPositivo\(to\.params\.turmaId\)/)
    assert.match(redirectTurma, /return '\/beach-tennis\/turmas'/)
    assert.match(redirectTurma, /path:\s*'\/beach-tennis\/alunos'/)
    assert.match(redirectTurma, /turmaId:/)
  })

  it('preserva o redirect valido de turma para alunos por turma', async () => {
    const router = criarRouterTeste()

    await navegarSemWarning(router, '/beach-tennis/turmas/2/alunos', 'redirect legado valido')

    const rotaAtual = router.currentRoute.value

    assert.equal(rotaAtual.fullPath, '/beach-tennis/alunos?turmaId=2')
    assert.equal(rotaAtual.name, 'beach-tennis-alunos')
    assert.equal(rotaAtual.query.turmaId, '2')
    assert.equal(rotaAtual.params.turmaId, undefined)
  })

  it('manda IDs invalidos para a listagem de turmas sem query invalida', async () => {
    for (const turmaId of ['abc', '2abc', '0', '-1']) {
      const router = criarRouterTeste()

      await navegarSemWarning(router, `/beach-tennis/turmas/${turmaId}/alunos`, `redirect legado invalido ${turmaId}`)

      const rotaAtual = router.currentRoute.value

      assert.equal(rotaAtual.fullPath, '/beach-tennis/turmas')
      assert.equal(rotaAtual.name, 'beach-tennis-turmas')
      assert.deepEqual(rotaAtual.query, {})
      assert.equal(rotaAtual.params.turmaId, undefined)
    }
  })

  it('executa o retorno do cadastro com navegacao real sem exigir params', async () => {
    const router = criarRouterTeste()
    const navegacao = criarNavegacaoRetornoTurmaAlunos(2, 53, { id: 53, nome: 'Aluno novo' })

    await navegarSemWarning(router, navegacao, 'retorno canonico do cadastro')

    const rotaAtual = router.currentRoute.value

    assert.equal(rotaAtual.fullPath, '/beach-tennis/alunos?turmaId=2')
    assert.equal(rotaAtual.name, 'beach-tennis-alunos')
    assert.equal(rotaAtual.query.turmaId, '2')
    assert.equal(rotaAtual.params.turmaId, undefined)
  })
})
