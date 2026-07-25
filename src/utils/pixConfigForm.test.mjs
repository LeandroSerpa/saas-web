import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

import { compileScript, compileTemplate, parse } from '@vue/compiler-sfc'

const pixConfigFormSource = readFileSync(new URL('../components/PixConfigForm.vue', import.meta.url), 'utf8')
const financeiroSource = readFileSync(new URL('../views/BeachTennisFinanceiroView.vue', import.meta.url), 'utf8')

function obterScriptSetup(source) {
  const inicio = source.indexOf('<script setup>')
  const fim = source.indexOf('</script>', inicio)

  assert.notEqual(inicio, -1, 'script setup nao encontrado')
  assert.notEqual(fim, -1, 'fim do script setup nao encontrado')

  return source.slice(inicio, fim)
}

function trechoEntre(source, inicio, fim) {
  const indiceInicio = source.indexOf(inicio)
  assert.notEqual(indiceInicio, -1, `Trecho inicial nao encontrado: ${inicio}`)

  const indiceFim = source.indexOf(fim, indiceInicio + inicio.length)
  assert.notEqual(indiceFim, -1, `Trecho final nao encontrado: ${fim}`)

  return source.slice(indiceInicio, indiceFim)
}

function compilarPixConfigForm() {
  const filename = 'src/components/PixConfigForm.vue'
  const { descriptor, errors: parseErrors } = parse(pixConfigFormSource, { filename })
  assert.deepEqual(parseErrors, [])

  const script = compileScript(descriptor, { id: 'pix-config-form-regressao' })
  const template = compileTemplate({
    source: descriptor.template.content,
    filename,
    id: 'pix-config-form-regressao',
    compilerOptions: {
      bindingMetadata: script.bindings,
    },
  })

  return { script, template }
}

describe('PixConfigForm runtime', () => {
  it('declara OPCOES_MONTAGEM_PIX antes da funcao e da primeira execucao', () => {
    const script = obterScriptSetup(pixConfigFormSource)
    const indiceOpcoes = script.indexOf('const OPCOES_MONTAGEM_PIX = [')
    const indiceFuncao = script.indexOf('function criarOpcoesMontagemPadrao()')
    const indicePrimeiraExecucao = script.indexOf('ref(criarOpcoesMontagemPadrao())')

    assert.ok(indiceOpcoes >= 0)
    assert.ok(indiceFuncao > indiceOpcoes)
    assert.ok(indicePrimeiraExecucao > indiceFuncao)
  })

  it('mantem mostrarAcoes booleano em todas as opcoes usadas pelo template', () => {
    const blocoOpcoes = trechoEntre(pixConfigFormSource, 'const OPCOES_MONTAGEM_PIX = [', 'const PLACEHOLDER_BOTOES = [')
    const linhasOpcoes = blocoOpcoes.split('\n').filter((linha) => linha.includes("campo: '"))

    assert.ok(linhasOpcoes.length > 0)
    for (const linha of linhasOpcoes) {
      assert.match(linha, /mostrarAcoes:\s*(true|false)/)
    }
  })

  it('compila o template sem referencias inexistentes', () => {
    const { template } = compilarPixConfigForm()

    assert.deepEqual(template.errors, [])
    assert.doesNotMatch(template.code, /_ctx\.[A-Za-z_$][\w$]*/)
  })

  it('preserva a cobranca WhatsApp sem about blank e sem marcar como paga', () => {
    const trechoCobranca = trechoEntre(financeiroSource, 'async function cobrarNoWhatsApp', 'function orientarCobrancaWhatsApp')

    assert.doesNotMatch(financeiroSource, new RegExp(`about${':'}blank`, 'i'))
    assert.match(trechoCobranca, /normalizarCobrancaWhatsappPix\(resposta/)
    assert.match(trechoCobranca, /abrirWhatsappSeguro\(whatsappUrl\)/)
    assert.doesNotMatch(trechoCobranca, /marcarMensalidadePagaBeachTennis|status:\s*['"]PAGA['"]/)
  })
})
