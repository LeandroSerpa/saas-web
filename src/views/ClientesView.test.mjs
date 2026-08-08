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
    assert.match(source, /Observação:/)
    assert.match(source, /Nível:/)
    assert.match(source, /Participa de competição:/)
    assert.match(source, /Frequência:/)
    assert.match(source, /Observações:/)
    assert.match(source, /Registros por página/)
    assert.match(source, /Próxima/)
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
    assert.match(source, /O aluno foi cadastrado com sucesso, mas não foi possível retornar à turma\./)
    assert.doesNotMatch(source, /Missing required param/)
    assert.match(source, /obterOrigemTurmaCadastro\(\)/)
  })
})
