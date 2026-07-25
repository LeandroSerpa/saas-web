import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { describe, it } from 'node:test'

const apiSource = readFileSync(new URL('../services/api.js', import.meta.url), 'utf8')
const financeiroSource = readFileSync(new URL('../views/BeachTennisFinanceiroView.vue', import.meta.url), 'utf8')

function trechoEntre(source, inicio, fim) {
  const indiceInicio = source.indexOf(inicio)
  assert.notEqual(indiceInicio, -1, `Trecho inicial nao encontrado: ${inicio}`)

  const indiceFim = source.indexOf(fim, indiceInicio + inicio.length)
  assert.notEqual(indiceFim, -1, `Trecho final nao encontrado: ${fim}`)

  return source.slice(indiceInicio, indiceFim)
}

describe('cobranca WhatsApp Beach Tennis', () => {
  it('usa o endpoint novo de cobranca-whatsapp no servico real', () => {
    const trecho = trechoEntre(
      apiSource,
      'export async function cobrarMensalidadeWhatsappBeachTennis',
      'export async function buscarConfiguracaoBeachTennisFinanceira',
    )

    assert.match(trecho, /\/cobranca-whatsapp/)
    assert.doesNotMatch(trecho, /\/mensagem-whatsapp/)
  })

  it('VITE_API_URL explicita prevalece antes de qualquer fallback', () => {
    const trecho = trechoEntre(apiSource, 'function resolverApiUrl()', 'export const API_URL')

    assert.ok(trecho.indexOf('import.meta.env.VITE_API_URL') < trecho.indexOf('API_URL_FALLBACK'))
    assert.doesNotMatch(trecho, /localStorage|sessionStorage/)
    assert.match(apiSource, /const API_URL_FALLBACK = import\.meta\.env\.DEV \? 'http:\/\/localhost:8080'/)
  })

  it('nao abre aba vazia antes da resposta da API', () => {
    const trecho = trechoEntre(financeiroSource, 'async function cobrarNoWhatsApp', 'function orientarCobrancaWhatsApp')
    const chamadaApi = trecho.indexOf('await cobrarMensalidadeWhatsappBeachTennis')
    const abertura = trecho.indexOf('abrirWhatsappSeguro(whatsappUrl)')

    assert.notEqual(chamadaApi, -1)
    assert.notEqual(abertura, -1)
    assert.ok(chamadaApi < abertura)
    assert.doesNotMatch(financeiroSource, /window\.open\(\s*['"]\s*['"]/)
    assert.doesNotMatch(financeiroSource, new RegExp(`about${':'}blank`, 'i'))
  })

  it('valida whatsappUrl, podeAbrirWhatsApp e motivoBloqueio retornados pela API', () => {
    const trecho = trechoEntre(financeiroSource, 'async function cobrarNoWhatsApp', 'function orientarCobrancaWhatsApp')

    assert.match(trecho, /normalizarCobrancaWhatsappPix\(resposta/)
    assert.match(trecho, /whatsappUrl/)
    assert.match(trecho, /podeAbrirWhatsApp/)
    assert.match(trecho, /motivoBloqueio/)
  })

  it('mantem copia da mensagem quando nao ha URL ou quando o popup e bloqueado', () => {
    const preview = trechoEntre(
      financeiroSource,
      '<section v-if="cobrancaWhatsapp.aberta"',
      '<section v-show="abaAtiva === \'resumo\'"',
    )

    assert.match(preview, /Copiar mensagem/)
    assert.match(preview, /cobrancaWhatsapp\.popupBloqueado/)
    assert.match(preview, /:href="cobrancaWhatsapp\.whatsappUrl"/)
  })

  it('erro HTTP cai no catch sem manter whatsappUrl aberta', () => {
    const fluxo = trechoEntre(financeiroSource, 'async function cobrarNoWhatsApp', 'function orientarCobrancaWhatsApp')
    const trecho = trechoEntre(fluxo, '} catch (exception) {', '} finally {')

    assert.match(trecho, /Não foi possível preparar a cobrança via WhatsApp/)
    assert.match(trecho, /whatsappUrl: ''/)
    assert.doesNotMatch(trecho, /abrirWhatsappSeguro/)
  })

  it('o fluxo de cobranca WhatsApp nao marca mensalidade como paga', () => {
    const trecho = trechoEntre(financeiroSource, 'async function cobrarNoWhatsApp', 'function orientarCobrancaWhatsApp')

    assert.doesNotMatch(trecho, /marcarMensalidadePagaBeachTennis|confirmarPagamento|status:\s*['"]PAGA['"]/)
  })
})
