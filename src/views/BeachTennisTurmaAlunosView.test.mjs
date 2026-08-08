import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { criarNavegacaoCadastroAluno } from '../utils/beachTennisCadastroAluno.js'

const source = readFileSync(new URL('./BeachTennisTurmaAlunosView.vue', import.meta.url), 'utf8')
const MOJIBAKE_PATTERN = /\u00c3[\u00a3\u00a7\u00a1\u00a9\u00aa\u00f3\u00fa\u00ed]|\u00c2|\ufffd/

function trechoEntre(inicio, fim) {
  const indiceInicio = source.indexOf(inicio)
  const indiceFim = source.indexOf(fim, indiceInicio + inicio.length)

  return source.slice(indiceInicio, indiceFim > -1 ? indiceFim : undefined)
}

describe('BeachTennisTurmaAlunosView retorno do novo aluno', () => {
  it('exibe o cadastro no cabeçalho somente após carregar uma turma selecionada', () => {
    const selecaoSemTurma = trechoEntre('v-else-if="!turmaSelecionada"', '<section v-else class="conteudo-gerencia">')
    const cabecalhoTurma = trechoEntre('<section v-else class="conteudo-gerencia">', '<div class="botoes-mobile">')

    assert.doesNotMatch(selecaoSemTurma, /Cadastrar novo aluno/)
    assert.match(cabecalhoTurma, /v-if="turmaCarregadaSelecionada"[\s\S]*@click="cadastrarNovoAluno"/)
    assert.match(cabecalhoTurma, /Cadastrar novo aluno/)
    assert.match(source, /const turmaCarregadaSelecionada = computed\(\(\) => turma\.value\?\.id === turmaIdSelecionada\.value\)/)
  })

  it('executa a navegação para cadastro apenas com a query da turma selecionada', () => {
    assert.deepEqual(criarNavegacaoCadastroAluno(2), {
      path: '/beach-tennis/cadastro-alunos',
      query: { turmaId: '2' },
      state: { origemTurmaId: 2 },
    })
    assert.equal(criarNavegacaoCadastroAluno('2abc'), null)
    assert.equal(criarNavegacaoCadastroAluno(0), null)
    assert.equal(criarNavegacaoCadastroAluno(-2), null)
    assert.equal(criarNavegacaoCadastroAluno(2.5), null)
  })

  it('mantem o CTA utilizavel no cabeçalho em telas estreitas', () => {
    const mediaResponsiva = trechoEntre('@media (max-width: 900px)', '</style>')

    assert.match(mediaResponsiva, /\.acoes-resumo\s*\{[\s\S]*width: 100%/)
    assert.match(mediaResponsiva, /\.acoes-resumo \.botao\s*\{[\s\S]*width: 100%/)
    assert.doesNotMatch(mediaResponsiva, /\.acoes-resumo\s*\{[^}]*display:\s*none/)
  })

  it('consome o aluno criado sem salvar automaticamente o vinculo', () => {
    const trecho = trechoEntre('async function consumirNovoAlunoCriadoNaTurma()', 'async function carregarDisponiveis')

    assert.match(trecho, /estado\?\.novoAlunoId \|\| valorRota\(route\.query\.novoAlunoId\)/)
    assert.match(trecho, /novoAlunoCriado/)
    assert.match(trecho, /normalizarClienteDisponivel\(novoAlunoCriado\)/)
    assert.match(trecho, /indexarAlunos\(\[alunoNormalizado\]\)/)
    assert.match(trecho, /idsAtuais\.value = idsAtuaisAtualizados/)
    assert.match(trecho, /atualizarOrdemTemporariosTurma/)
    assert.match(trecho, /router\.replace\(\{/)
    assert.match(trecho, /path: '\/beach-tennis\/alunos'/)
    assert.doesNotMatch(trecho, /salvarClientesTurmaBeachTennis/)
  })

  it('mantem os textos da tela de vinculacao de alunos sem mojibake', () => {
    assert.match(source, /Disponíveis/)
    assert.match(source, /Selecionar visíveis/)
    assert.match(source, /Limpar seleção/)
    assert.match(source, /Nível/)
    assert.match(source, /Carregando .* disponíveis\.\.\./)
    assert.match(source, /Nenhum .* disponível com estes filtros\./)
    assert.match(source, /Desfazer alterações/)
    assert.match(source, /Salvar alterações/)
    assert.doesNotMatch(trechoEntre('const turmaIdSelecionada', 'async function carregarDisponiveis'), MOJIBAKE_PATTERN)
  })

  it('continua exigindo confirmacao ao sair com alteracoes pendentes', () => {
    assert.match(source, /onBeforeRouteLeave\(\(_to, _from, next\) =>/)
    assert.match(source, /abrirConfirmacaoSaida\(next\)/)
    assert.match(source, /handleBeforeUnload/)
  })

  it('usa apenas query para identificar a turma ativa', () => {
    assert.match(source, /const turmaIdSelecionada = computed\(\(\) => normalizarIdPositivo\(valorRota\(route\.query\.turmaId\)\)\)/)
    assert.match(source, /watch\(\n  \(\) => route\.query\.turmaId,/)
    assert.doesNotMatch(source, /route\.params\.turmaId/)
  })
})
