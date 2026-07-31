import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const source = readFileSync(new URL('./api.js', import.meta.url), 'utf8')

describe('api clientes', () => {
  it('mantem o filtro de busca e adiciona o endpoint de ativo', () => {
    assert.match(source, /export async function buscarClientes\(filtros = \{\}\)/)
    assert.match(source, /montarQueryString\(filtrosConsulta\)/)
    assert.match(source, /export async function atualizarAtivoCliente\(id, ativo\)/)
    assert.match(source, /\/clientes\/\$\{id\}\/ativo/)
  })
})
