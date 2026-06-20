import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  clonarEstadoSelecaoTemporaria,
  criarEstadoResponsavelPagamento,
  filtrarTurmasAcordoLocal,
  hidratarSelecionadosPorOpcoes,
} from './beachTennisFinanceiro.js'

describe('beachTennisFinanceiro', () => {
  it('localiza turma da 17h e respeita filtros locais do fallback', () => {
    const lista = [
      {
        id: '1',
        nome: 'Turma da 17h',
        professorId: '10',
        professorResponsavelNome: 'Professor Carlos',
        nivelBeachTennis: 'INTERMEDIARIO',
        nivelRotulo: 'Intermediário',
        diasSemana: ['SEGUNDA'],
        diasSemanaFormatados: 'Segunda',
        horarioInicio: '17:00',
        horarioFormatado: '17:00',
        ativo: true,
      },
      {
        id: '2',
        nome: 'Turma da 19h',
        professorId: '11',
        professorResponsavelNome: 'Professora Ana',
        nivelBeachTennis: 'AVANCADO',
        nivelRotulo: 'Avançado',
        diasSemana: ['QUARTA'],
        diasSemanaFormatados: 'Quarta',
        horarioInicio: '19:00',
        horarioFormatado: '19:00',
        ativo: true,
      },
    ]

    const resultado = filtrarTurmasAcordoLocal(lista, {
      busca: '17h',
      funcionarioId: '10',
      nivel: 'INTERMEDIARIO',
      diaSemana: 'SEGUNDA',
      horarioInicioDe: '16:30',
      horarioInicioAte: '17:30',
      somenteAtivas: true,
    })

    assert.deepEqual(resultado.map((turma) => turma.id), ['1'])
  })

  it('encontra horario parcial mesmo quando o texto vem apenas como 17:00', () => {
    const lista = [
      {
        id: '9',
        nome: 'Turma adultos',
        professorId: '10',
        professorResponsavelNome: 'Professor Carlos',
        nivelBeachTennis: 'INTERMEDIARIO',
        diasSemana: ['SEGUNDA'],
        horarioInicio: '17:00',
        horarioFormatado: '17:00',
        ativo: true,
      },
    ]

    const resultado = filtrarTurmasAcordoLocal(lista, {
      busca: '17h',
      somenteAtivas: true,
    })

    assert.deepEqual(resultado.map((turma) => turma.id), ['9'])
  })

  it('hidrata nomes reais de alunos quando o detalhe traz apenas placeholders', () => {
    const hidratados = hidratarSelecionadosPorOpcoes(
      ['7', '8'],
      [
        { id: '7', nome: 'Aluno selecionado' },
        { id: '8', nome: 'Aluno selecionado' },
      ],
      [
        { id: '7', nome: 'Jessica Serpa' },
        { id: '8', nome: 'Leandro Serpa' },
      ],
      {
        idKeys: ['id'],
        nomeKeys: ['nome'],
        nomeGenerico: 'Aluno selecionado',
      },
    )

    assert.deepEqual(
      hidratados.map((item) => item.nome),
      ['Jessica Serpa', 'Leandro Serpa'],
    )
  })

  it('mantem o responsavel desabilitado sem alunos e habilita com selecionados', () => {
    const vazio = criarEstadoResponsavelPagamento([], '', { rotuloItem: 'aluno' })
    const preenchido = criarEstadoResponsavelPagamento([{ id: '8', nome: 'Leandro Serpa' }], '8', {
      rotuloItem: 'aluno',
    })

    assert.equal(vazio.disabled, true)
    assert.match(vazio.ajuda, /selecione ao menos um aluno/i)
    assert.equal(preenchido.disabled, false)
    assert.equal(preenchido.responsavelValido, true)
  })

  it('descarta alteracoes temporarias ao trabalhar com clones do seletor', () => {
    const idsConfirmados = new Set(['7'])
    const mapaConfirmado = new Map([['7', { id: '7', nome: 'Jessica Serpa' }]])
    const temporario = clonarEstadoSelecaoTemporaria(idsConfirmados, mapaConfirmado)

    temporario.ids.add('8')
    temporario.mapa.set('8', { id: '8', nome: 'Leandro Serpa' })

    assert.deepEqual([...idsConfirmados], ['7'])
    assert.equal(mapaConfirmado.has('8'), false)
  })
})
