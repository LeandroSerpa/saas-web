import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  criarNavegacaoCadastroAluno,
  criarNavegacaoRetornoTurmaAlunos,
} from './beachTennisCadastroAluno.js'

describe('navegacao do cadastro de aluno por turma', () => {
  it('retorna a mesma turma para o cadastro e para o retorno', () => {
    const navegacao = criarNavegacaoCadastroAluno('002')
    const retorno = criarNavegacaoRetornoTurmaAlunos('002', '53', { id: 53, nome: 'Aluno novo' })

    assert.deepEqual(navegacao, {
      path: '/beach-tennis/cadastro-alunos',
      query: { turmaId: '2' },
      state: { origemTurmaId: 2 },
    })
    assert.deepEqual(retorno, {
      path: '/beach-tennis/alunos',
      query: { turmaId: '2' },
      state: {
        origemTurmaId: 2,
        novoAlunoId: 53,
        novoAlunoCriado: { id: 53, nome: 'Aluno novo' },
      },
    })
  })

  it('rejeita valores que não sejam inteiros positivos seguros', () => {
    for (const valor of ['', '2abc', '2.5', 0, -1, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(criarNavegacaoCadastroAluno(valor), null)
      assert.equal(criarNavegacaoRetornoTurmaAlunos(valor, 53, { id: 53 }), null)
    }
  })
})
