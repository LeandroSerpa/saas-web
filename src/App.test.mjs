import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import {
  formatarEmpresaLogadaCabecalho,
  resolverEmpresaEfetivaCabecalho,
} from './utils/empresaCabecalho.js'

const appSource = readFileSync(new URL('./App.vue', import.meta.url), 'utf8')

function contarOcorrencias(texto, padrao) {
  return texto.match(padrao)?.length || 0
}

function trechoEntre(inicio, fim) {
  const indiceInicio = appSource.indexOf(inicio)
  const indiceFim = appSource.indexOf(fim, indiceInicio + inicio.length)

  return appSource.slice(indiceInicio, indiceFim > -1 ? indiceFim : undefined)
}

describe('App menu estoque operacional', () => {
  it('renderiza o link de Estoque pela computed correta', () => {
    assert.match(appSource, /const avaliacaoCatalogoOperacao = computed\(\(\) =>\s*avaliarAcessoCatalogoOperacional/)
    assert.match(appSource, /const podeGerenciarCatalogoOperacao = computed\(\(\) => avaliacaoCatalogoOperacao\.value\.permitido\)/)
    assert.match(appSource, /const mostrarEstoqueOperacao = computed\(\(\) => podeGerenciarCatalogoOperacao\.value\)/)
    assert.match(appSource, /<RouterLink v-if="mostrarEstoqueOperacao" to="\/estoque"[^>]*>Estoque<\/RouterLink>/)
  })

  it('nao condiciona o link de Estoque diretamente a modulo ESTOQ', () => {
    const trechoMenuOperacao = trechoEntre('<section v-if="mostrarGrupoOperacao"', '<RouterLink v-if="mostrarCatalogoPublicoOperacao"')
    const trechoComputedEstoque = trechoEntre('const mostrarEstoqueOperacao', 'const mostrarCatalogoPublicoOperacao')

    assert.doesNotMatch(trechoMenuOperacao, /temModulo|moduloAtivo|ESTOQ/)
    assert.doesNotMatch(trechoComputedEstoque, /temModulo|moduloAtivo|ESTOQ/)
  })

  it('nao possui filtro posterior nem link duplicado para /estoque', () => {
    assert.equal(contarOcorrencias(appSource, /to="\/estoque"/g), 1)
    assert.match(appSource, /const mostrarGrupoOperacao = computed\([\s\S]*podeGerenciarCatalogoOperacao\.value/)
    assert.doesNotMatch(appSource, /filter\([\s\S]{0,160}estoque/i)
  })

  it('exibe o cadastro geral de alunos separado de alunos por turma no grupo esportivo', () => {
    assert.match(appSource, /to="\/beach-tennis\/cadastro-alunos"/)
    assert.match(appSource, /rotuloCadastroParticipanteMenu/)
    assert.match(appSource, /to="\/beach-tennis\/alunos"/)
    assert.equal(contarOcorrencias(appSource, /to="\/beach-tennis\/cadastro-alunos"/g), 1)
    assert.equal(contarOcorrencias(appSource, /to="\/beach-tennis\/alunos"/g), 1)
  })
})

describe('App cabecalho empresa operacional', () => {
  it('mostra GraRique para ADMIN autenticado na GraRique', () => {
    const usuario = { perfil: 'ADMIN', empresaId: 42, empresaNome: 'GraRique Artesanatos' }
    const empresaEfetiva = resolverEmpresaEfetivaCabecalho({ usuario, superAdmin: false })

    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin: false }), 'Empresa: GraRique Artesanatos')
  })

  it('mostra GraRique para SUPER_ADMIN vinculado a Barbearia operando GraRique', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1, empresaNome: 'Barbearia Teste' }
    const empresaOperacional = { id: 42, nome: 'GraRique Artesanatos' }
    const empresaEfetiva = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional,
      superAdmin: true,
    })

    assert.equal(empresaEfetiva, empresaOperacional)
    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin: true }), 'Empresa: GraRique Artesanatos')
  })

  it('nao deixa a empresa vinculada ao SUPER_ADMIN prevalecer durante operacao', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1, empresaNome: 'Barbearia Teste' }
    const empresaEfetiva = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional: { id: 42, nome: 'GraRique Artesanatos' },
      superAdmin: true,
    })

    assert.notEqual(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin: true }), 'Empresa: Barbearia Teste')
  })

  it('atualiza o cabecalho ao trocar de GraRique para outra empresa', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1, empresaNome: 'Barbearia Teste' }
    const grarique = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional: { id: 42, nome: 'GraRique Artesanatos' },
      superAdmin: true,
    })
    const outraEmpresa = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional: { id: 77, nome: 'Outra Empresa' },
      superAdmin: true,
    })

    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva: grarique, superAdmin: true }), 'Empresa: GraRique Artesanatos')
    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva: outraEmpresa, superAdmin: true }), 'Empresa: Outra Empresa')
  })

  it('remove o nome operacional ao sair da operacao do SUPER_ADMIN', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1, empresaNome: 'Barbearia Teste' }
    const empresaEfetiva = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional: null,
      empresaVisualizacaoOperacional: null,
      superAdmin: true,
    })

    assert.equal(empresaEfetiva, null)
    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin: true }), 'Plataforma NuvemMais')
  })

  it('usa a empresa selecionada enquanto a empresa operacional completa recarrega', () => {
    const usuario = { perfil: 'SUPER_ADMIN', empresaId: 1, empresaNome: 'Barbearia Teste' }
    const empresaEfetiva = resolverEmpresaEfetivaCabecalho({
      usuario,
      empresaOperacional: null,
      empresaVisualizacaoOperacional: { id: 42, nome: 'GraRique Artesanatos' },
      superAdmin: true,
    })

    assert.equal(formatarEmpresaLogadaCabecalho({ usuario, empresaEfetiva, superAdmin: true }), 'Empresa: GraRique Artesanatos')
  })
})
