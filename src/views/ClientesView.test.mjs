import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./ClientesView.vue', import.meta.url), 'utf8')

describe('ClientesView cadastro geral de alunos', () => {
  it('usa observacoesBeachTennis como campo principal e fallback antigo na leitura', () => {
    assert.match(source, /observacoesBeachTennis: ''/)
    assert.match(source, /observacoesBeachTennis: clienteItem\.observacoesBeachTennis \|\| clienteItem\.observacaoBeachTennis \|\| ''/)
    assert.match(source, /observacoesBeachTennis: cliente\.value\.observacoesBeachTennis \|\| ''/)
    assert.match(source, /clienteItem\.observacoesBeachTennis \|\| clienteItem\.observacaoBeachTennis/)
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
    assert.match(source, /router\.replace\(\{\s*name: 'beach-tennis-turma-alunos'/)
    assert.match(source, /novoAlunoCriado: respostaCadastro/)
    assert.match(source, /obterOrigemTurmaCadastro\(\)/)
  })
})
