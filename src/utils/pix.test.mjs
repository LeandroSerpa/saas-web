import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  TIPOS_CHAVE_PIX,
  aplicarTemplatePix,
  copiarTextoSeguro,
  formatarDataPix,
  formatarValorPix,
  gerarMensagemPixFallback,
  mascararChavePix,
  montarPayloadPix,
  normalizarConfiguracaoPix,
  normalizarTipoChavePix,
  validarConfiguracaoPix,
} from './pix.js'

describe('pix', () => {
  it('normaliza configuracao vazia', () => {
    assert.deepEqual(normalizarConfiguracaoPix({}), {
      pixAtivo: false,
      tipoChavePix: '',
      chavePix: '',
      nomeRecebedor: '',
      nomeRecebedorPix: '',
      instrucoesPix: '',
      templateMensagem: '',
      mensagemCobrancaTemplate: '',
    })
  })

  it('normaliza configuracao valida e tipos equivalentes', () => {
    const config = normalizarConfiguracaoPix({
      pixAtivo: true,
      tipoPix: 'chave aleatória',
      chavePix: ' chave segura ',
      nomeRecebedorPix: '  Maria  ',
      instrucoes: 'Enviar comprovante',
      mensagemCobrancaTemplate: 'Olá, {cliente} - {valor} - {vencimento}',
    })

    assert.equal(config.pixAtivo, true)
    assert.equal(config.tipoChavePix, 'ALEATORIA')
    assert.equal(config.chavePix, 'chave segura')
    assert.equal(config.nomeRecebedor, 'Maria')
    assert.equal(config.templateMensagem, 'Olá, {cliente} - {valor} - {vencimento}')
  })

  it('tipo invalido cai para vazio e gera erro controlado', () => {
    assert.equal(normalizarTipoChavePix('tipo desconhecido'), '')

    const validacao = validarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: 'tipo desconhecido',
      chavePix: '123',
      nomeRecebedor: 'Recebedor',
    })

    assert.equal(validacao.valido, false)
    assert.match(validacao.mensagem, /tipo da chave pix/i)
  })

  it('configuracao parcial retorna erro amigavel', () => {
    const validacao = validarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: 'CPF',
      chavePix: '',
      nomeRecebedor: '',
    })

    assert.equal(validacao.valido, false)
    assert.match(validacao.mensagem, /chave pix/i)
    assert.equal(validacao.camposInvalidos.chavePix, true)
    assert.equal(validacao.camposInvalidos.nomeRecebedor, true)
  })

  it('pixAtivo true exige campos minimos', () => {
    const validacao = validarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: '',
      chavePix: '',
      nomeRecebedor: '',
    })

    assert.equal(validacao.valido, false)
    assert.equal(validacao.camposInvalidos.tipoChavePix, true)
    assert.equal(validacao.camposInvalidos.chavePix, true)
    assert.equal(validacao.camposInvalidos.nomeRecebedor, true)
  })

  it('pixAtivo false permite vazio', () => {
    const validacao = validarConfiguracaoPix({
      pixAtivo: false,
    })

    assert.equal(validacao.valido, true)
    assert.equal(validacao.mensagem, '')
  })

  it('payload remove usuarioId e empresaId e preserva campos de pix', () => {
    const payload = montarPayloadPix({
      pixAtivo: true,
      tipoChavePix: 'email',
      chavePix: 'Pix@Exemplo.Com',
      nomeRecebedor: 'Recebedor Teste',
      usuarioId: '99',
      empresaId: '123',
      camposLeitura: 'nao entra',
    })

    assert.equal(payload.usuarioId, undefined)
    assert.equal(payload.empresaId, undefined)
    assert.equal(payload.tipoChavePix, 'EMAIL')
    assert.equal(payload.chavePix, 'pix@exemplo.com')
    assert.equal(payload.nomeRecebedorPix, 'Recebedor Teste')
  })

  it('template vazio gera mensagem fallback', () => {
    const mensagem = aplicarTemplatePix('', {
      cliente: 'Mariana',
      valor: 150,
      descricao: 'Mensalidade',
      vencimento: '2026-06-12',
      chavePix: 'chave@pix.com',
      nomeRecebedorPix: 'Recebedor',
    })

    assert.equal(mensagem, gerarMensagemPixFallback({
      cliente: 'Mariana',
      valor: 150,
      descricao: 'Mensalidade',
      vencimento: '2026-06-12',
      chavePix: 'chave@pix.com',
      nomeRecebedorPix: 'Recebedor',
    }))
  })

  it('aplica cliente valor descricao vencimento chave e recebedor no template', () => {
    const mensagem = aplicarTemplatePix(
      'Cliente: {cliente} | Valor: {valor} | Descricao: {descricao} | Vencimento: {vencimento} | Chave: {chavePix} | Recebedor: {nomeRecebedorPix}',
      {
        cliente: 'Mariana',
        valor: '150',
        descricao: 'Mensalidade',
        vencimento: '2026-06-12',
        chavePix: 'chave@pix.com',
        nomeRecebedorPix: 'Recebedor',
      },
    )

    assert.equal(
      mensagem,
      'Cliente: Mariana | Valor: R$ 150,00 | Descricao: Mensalidade | Vencimento: 12/06/2026 | Chave: chave@pix.com | Recebedor: Recebedor',
    )
  })

  it('valor e data sao formatados corretamente', () => {
    assert.equal(formatarValorPix('R$ 150,00'), 'R$ 150,00')
    assert.equal(formatarValorPix(150), 'R$ 150,00')
    assert.equal(formatarDataPix('2026-06-12'), '12/06/2026')
    assert.equal(formatarDataPix('12/06/2026'), '12/06/2026')
  })

  it('payload incompleto nao quebra', () => {
    const payload = montarPayloadPix(null)

    assert.equal(payload.pixAtivo, false)
    assert.equal(payload.tipoChavePix, '')
    assert.equal(payload.chavePix, '')
  })

  it('telefone com caracteres extras e email invalido sao tratados', () => {
    const telefone = normalizarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: 'telefone',
      chavePix: '(11) 99999-8888',
      nomeRecebedor: 'Recebedor',
    })
    const validacaoEmail = validarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: 'email',
      chavePix: 'email-invalido',
      nomeRecebedor: 'Recebedor',
    })

    assert.equal(telefone.chavePix, '11999998888')
    assert.equal(validacaoEmail.valido, false)
    assert.match(validacaoEmail.mensagem, /e-mail/i)
  })

  it('chave aleatoria aceita texto seguro e mascaramento funciona', () => {
    const config = normalizarConfiguracaoPix({
      pixAtivo: true,
      tipoChavePix: 'aleatoria',
      chavePix: '  123e4567-e89b-12d3-a456-426614174000  ',
      nomeRecebedor: 'Recebedor',
    })

    assert.equal(config.chavePix, '123e4567-e89b-12d3-a456-426614174000')
    assert.match(mascararChavePix(config.chavePix, config.tipoChavePix), /\.\.\./)
  })

  it('mensagem pronta para WhatsApp nao contem undefined nem null', () => {
    const mensagem = gerarMensagemPixFallback({
      cliente: 'Mariana',
      valor: 150,
      descricao: 'Mensalidade',
      vencimento: '2026-06-12',
      chavePix: 'chave@pix.com',
      nomeRecebedorPix: 'Recebedor',
    })

    assert.equal(mensagem.includes('undefined'), false)
    assert.equal(mensagem.includes('null'), false)
  })

  it('lista de tipos exportada mantém os valores esperados', () => {
    assert.deepEqual(
      TIPOS_CHAVE_PIX.map((item) => item.valor),
      ['CPF', 'CNPJ', 'EMAIL', 'TELEFONE', 'ALEATORIA'],
    )
  })

  it('copiarTextoSeguro existe e retorna booleano sem depender do navegador nos testes', async () => {
    const resultado = await copiarTextoSeguro('')
    assert.equal(typeof resultado, 'boolean')
  })
})
