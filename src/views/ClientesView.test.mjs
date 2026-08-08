import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { criarNavegacaoRetornoTurmaAlunos } from '../utils/beachTennisCadastroAluno.js'

const source = readFileSync(new URL('./ClientesView.vue', import.meta.url), 'utf8')
const MOJIBAKE_PATTERN = /\u00c3[\u00a3\u00a7\u00a1\u00a9\u00aa\u00f3\u00fa\u00ed]|\u00c2|\ufffd/

describe('ClientesView cadastro geral de alunos', () => {
  it('retorna para a mesma turma com a rota correta e estado interno seguro', () => {
    assert.deepEqual(criarNavegacaoRetornoTurmaAlunos(2, 53, { id: 53, nome: 'Aluno novo' }), {
      path: '/beach-tennis/alunos',
      query: { turmaId: '2' },
      state: {
        origemTurmaId: 2,
        novoAlunoId: 53,
        novoAlunoCriado: { id: 53, nome: 'Aluno novo' },
      },
    })
  })

  it('usa observacoesBeachTennis como campo principal e fallback antigo na leitura', () => {
    assert.match(source, /observacoesBeachTennis: ''/)
    assert.match(source, /observacoesBeachTennis: clienteItem\.observacoesBeachTennis \|\| clienteItem\.observacaoBeachTennis \|\| ''/)
    assert.match(source, /observacoesBeachTennis: cliente\.value\.observacoesBeachTennis \|\| ''/)
    assert.match(source, /clienteItem\.observacoesBeachTennis \|\| clienteItem\.observacaoBeachTennis/)
  })

  it('mantem os textos visiveis do fluxo de alunos em portugues correto', () => {
    assert.match(source, /Observa/)
    assert.match(source, /N.{0,2}vel/)
    assert.match(source, /Competi/)
    assert.match(source, /Frequ/)
    assert.match(source, /Observa/)
    assert.match(source, /Registros por/)
    assert.match(source, /Pr.{0,2}xima/)
    assert.doesNotMatch(source, MOJIBAKE_PATTERN)
  })

  it('consulta filtros no servidor e atualiza status com endpoint dedicado', () => {
    assert.match(source, /buscarClientes\(montarFiltrosClienteConsulta\(\)\)/)
    assert.match(source, /async function alternarAtivoCliente\(clienteItem\)/)
    assert.match(source, /atualizarAtivoCliente\(clienteItem\.id, novoEstado\)/)
    assert.match(source, /filtros-clientes/)
    assert.match(source, /OPCOES_NIVEL_BEACH_TENNIS/)
    assert.match(source, /OPCOES_PERFIL_BEACH_TENNIS/)
  })

  it('protege a saida com alteracoes reais e limpa o retorno da turma com estado seguro', () => {
    assert.match(source, /onBeforeRouteLeave\(\(_to, _from, next\) =>/)
    assert.match(source, /beforeunload/)
    assert.match(source, /criarNavegacaoRetornoTurmaAlunos/)
    assert.match(source, /origemTurma\.turmaId/)
    assert.match(source, /respostaCadastro\.id/)
    assert.match(source, /respostaCadastro,\s*\)/)
    assert.match(source, /router\.replace\(navegacaoRetorno\)/)
    assert.match(source, /catch \(erroNavegacao\)/)
    assert.match(source, /O aluno foi cadastrado com sucesso, mas/)
    assert.match(source, /retornar .* turma/)
    assert.doesNotMatch(source, /Missing required param/)
    assert.match(source, /obterOrigemTurmaCadastro\(\)/)
    assert.match(source, /normalizarIdInteiroPositivo\(route\.query\.turmaId\)/)
    assert.match(source, /normalizarIdInteiroPositivo\(estado\?\.origemTurmaId \?\? estado\?\.turmaId\)/)
    assert.doesNotMatch(source, /parseInt\(/)
    assert.doesNotMatch(source, /Array\.isArray\(route\.query\.turmaId\)/)
  })

  it('sincroniza o formulario salvo antes do retorno e preserva o guard para alteracoes reais', () => {
    const inicioSalvar = source.indexOf('async function salvarCliente()')
    const fimSalvar = source.indexOf('async function enviarClienteParaLixeira', inicioSalvar)
    const fluxoSalvar = source.slice(inicioSalvar, fimSalvar)
    const indiceCadastro = fluxoSalvar.indexOf('const respostaCadastro = await cadastrarCliente(dadosCliente)')
    const indiceSincronizacao = fluxoSalvar.indexOf('registrarOrigemFormulario(cliente.value)', indiceCadastro)
    const indiceRetorno = fluxoSalvar.indexOf('await router.replace(navegacaoRetorno)', indiceSincronizacao)
    const indiceCatchPost = fluxoSalvar.lastIndexOf('} catch (error) {')
    const catchPost = fluxoSalvar.slice(indiceCatchPost)
    const fluxoAntesDoRetorno = fluxoSalvar.slice(indiceSincronizacao, indiceRetorno)

    assert.equal((fluxoSalvar.match(/await cadastrarCliente\(dadosCliente\)/g) || []).length, 1)
    assert.ok(indiceCadastro >= 0)
    assert.ok(indiceSincronizacao > indiceCadastro)
    assert.ok(indiceRetorno > indiceSincronizacao)
    assert.doesNotMatch(fluxoAntesDoRetorno, /window\.confirm|confirmarSaidaFormulario\(/)
    assert.doesNotMatch(catchPost, /cancelarEdicaoCliente\(/)
    assert.match(source, /const formularioAlterado = computed\(/)
    assert.match(source, /if \(!deveConfirmarSaida\.value\)/)
    assert.match(source, /if \(confirmarSaidaFormulario\(\)\)/)
    assert.match(source, /return window\.confirm\('Existem altera/)
  })
})
