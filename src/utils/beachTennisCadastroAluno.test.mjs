import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { criarNavegacaoCadastroAluno } from './beachTennisCadastroAluno.js'

describe('navegacao do cadastro de aluno por turma', () => {
  it('retorna a mesma turma para o cadastro e para o retorno', () => {
    const navegacao = criarNavegacaoCadastroAluno('002')

    assert.deepEqual(navegacao, {
      name: 'beach-tennis-cadastro-alunos',
      query: { turmaId: '2' },
      state: { origemTurmaId: 2 },
    })
  })

  it('rejeita valores que não sejam inteiros positivos seguros', () => {
    for (const valor of ['', '2abc', '2.5', 0, -1, Number.MAX_SAFE_INTEGER + 1]) {
      assert.equal(criarNavegacaoCadastroAluno(valor), null)
    }
  })
})
