import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  atualizarOrdemTemporariosTurma,
  construirOrdemAlunosTurma,
  criarEstadoCapacidadeTurma,
  filtrarAlunosPorBuscaTurma,
  ordenarAlunosNaTurma,
} from './beachTennisTurmaAlunos.js'

describe('beachTennisTurmaAlunos', () => {
  const alunos = [
    { clienteId: 1, nome: 'Jessica Serpa', email: 'jessica@teste.com', telefone: '11988887777' },
    { clienteId: 2, nome: 'Leandro Serpa', email: 'leandro@teste.com', telefone: '11999990000' },
    { clienteId: 3, nome: 'Maria Souza', email: 'maria@teste.com', telefone: '21977776666' },
  ]

  it('filtra alunos por nome, e-mail e telefone', () => {
    assert.deepEqual(
      filtrarAlunosPorBuscaTurma(alunos, 'jessica').map((aluno) => aluno.clienteId),
      [1],
    )
    assert.deepEqual(
      filtrarAlunosPorBuscaTurma(alunos, 'leandro@teste.com').map((aluno) => aluno.clienteId),
      [2],
    )
    assert.deepEqual(
      filtrarAlunosPorBuscaTurma(alunos, '2197777').map((aluno) => aluno.clienteId),
      [3],
    )
  })

  it('mantem persistidos primeiro e temporarios depois com ordem estavel', () => {
    const ordemPersistidos = construirOrdemAlunosTurma([alunos[1], alunos[0]])
    const ordemTemporarios = atualizarOrdemTemporariosTurma(new Map(), [3], new Set([1, 2]))

    const ordenados = ordenarAlunosNaTurma([alunos[2], alunos[0], alunos[1]], {
      idsPersistidos: new Set([1, 2]),
      ordemPersistidos,
      ordemTemporarios,
    })

    assert.deepEqual(
      ordenados.map((aluno) => aluno.clienteId),
      [2, 1, 3],
    )
  })

  it('bloqueia excesso de capacidade antes do salvamento', () => {
    const estado = criarEstadoCapacidadeTurma(4, 5)

    assert.equal(estado.capacidade, 4)
    assert.equal(estado.vagasDisponiveis, 0)
    assert.equal(estado.excedenteCapacidade, 1)
  })
})
