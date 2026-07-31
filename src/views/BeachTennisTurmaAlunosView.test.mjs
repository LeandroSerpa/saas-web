import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./BeachTennisTurmaAlunosView.vue', import.meta.url), 'utf8')

function trechoEntre(inicio, fim) {
  const indiceInicio = source.indexOf(inicio)
  const indiceFim = source.indexOf(fim, indiceInicio + inicio.length)

  return source.slice(indiceInicio, indiceFim > -1 ? indiceFim : undefined)
}

describe('BeachTennisTurmaAlunosView retorno do novo aluno', () => {
  it('consome o aluno criado sem salvar automaticamente o vinculo', () => {
    const trecho = trechoEntre('async function consumirNovoAlunoCriadoNaTurma()', 'async function carregarDisponiveis')

    assert.match(trecho, /novoAlunoId/)
    assert.match(trecho, /novoAlunoCriado/)
    assert.match(trecho, /normalizarClienteDisponivel\(novoAlunoCriado\)/)
    assert.match(trecho, /indexarAlunos\(\[alunoNormalizado\]\)/)
    assert.match(trecho, /idsAtuais\.value = idsAtuaisAtualizados/)
    assert.match(trecho, /atualizarOrdemTemporariosTurma/)
    assert.match(trecho, /router\.replace\(\{/)
    assert.doesNotMatch(trecho, /salvarClientesTurmaBeachTennis/)
  })

  it('continua exigindo confirmacao ao sair com alteracoes pendentes', () => {
    assert.match(source, /onBeforeRouteLeave\(\(_to, _from, next\) =>/)
    assert.match(source, /abrirConfirmacaoSaida\(next\)/)
    assert.match(source, /handleBeforeUnload/)
  })
})
