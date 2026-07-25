import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  TIPOS_CHAVE_PIX,
  PLACEHOLDERS_PIX_PERMITIDOS,
  abrirWhatsappSeguro,
  aplicarTemplatePix,
  copiarTextoSeguro,
  extrairPlaceholdersPix,
  formatarDataPix,
  formatarValorPix,
  gerarMensagemPixFallback,
  gerarTemplatePixPadrao,
  mensagemPixContemValoresNaoResolvidos,
  mascararChavePix,
  montarTemplatePixPorSelecao,
  montarWhatsappUrl,
  montarPayloadPix,
  normalizarCobrancaWhatsappPix,
  normalizarConfiguracaoPix,
  normalizarTelefoneWhatsapp,
  normalizarTipoChavePix,
  validarPlaceholdersPix,
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

  it('template automatico padrao inclui placeholders permitidos e remove campos desmarcados', () => {
    const template = montarTemplatePixPorSelecao({
      incluirNomeResponsavel: true,
      incluirCompetencia: true,
      incluirNomeAcordo: true,
      incluirValor: true,
      incluirVencimento: true,
      incluirChavePix: true,
      incluirNomeRecebedorPix: false,
      incluirEmpresa: false,
      incluirInstrucoesPix: true,
      incluirPedidoComprovante: true,
    })

    const placeholders = extrairPlaceholdersPix(template)

    assert.equal(template.includes('{nomeResponsavel}'), true)
    assert.equal(template.includes('{nomeRecebedorPix}'), false)
    assert.equal(template.includes('{empresa}'), false)
    assert.equal(template.includes('{instrucoesPix}'), true)
    assert.deepEqual(placeholders.sort(), ['chavePix', 'competencia', 'instrucoesPix', 'nomeAcordo', 'nomeResponsavel', 'valor', 'vencimento'])
  })

  it('detecta placeholders permitidos e desconhecidos', () => {
    const validacao = validarPlaceholdersPix('Olá, {nomeResponsavel}! {nomeAcordo} {valor}')
    const invalido = validarPlaceholdersPix('Olá, {Joaquim}! {PLAY} {07/2026}')

    assert.equal(validacao.valido, true)
    assert.equal(invalido.valido, false)
    assert.equal(invalido.placeholdersInvalidos.includes('Joaquim'), true)
    assert.equal(invalido.placeholdersInvalidos.includes('PLAY'), true)
    assert.equal(invalido.placeholdersInvalidos.includes('07/2026'), true)
  })

  it('template valido nao gera aviso e placeholders sao permitidos', () => {
    const template = gerarTemplatePixPadrao()
    const validacao = validarPlaceholdersPix(template)

    assert.equal(validacao.valido, true)
    assert.deepEqual(
      extrairPlaceholdersPix(template).every((item) => PLACEHOLDERS_PIX_PERMITIDOS.includes(item)),
      true,
    )
  })

  it('normaliza telefone para WhatsApp e monta URL com wa.me', () => {
    assert.equal(normalizarTelefoneWhatsapp('(11) 99999-8888'), '5511999998888')
    assert.equal(normalizarTelefoneWhatsapp('5511999998888'), '5511999998888')
    assert.equal(normalizarTelefoneWhatsapp(''), '')

    const url = montarWhatsappUrl('(11) 99999-8888', 'Olá, João e Maria')
    assert.equal(url?.startsWith('https://wa.me/5511999998888?text='), true)
    assert.equal(url.includes('Olá'), false)
    assert.equal(decodeURIComponent(url.split('text=')[1]), 'Olá, João e Maria')
  })

  it('url nao e gerada sem telefone ou mensagem', () => {
    assert.equal(montarWhatsappUrl('', 'Mensagem'), null)
    assert.equal(montarWhatsappUrl('(11) 99999-8888', ''), null)
  })

  it('normaliza cobranca WhatsApp com URL valida retornada pela API', () => {
    const cobranca = normalizarCobrancaWhatsappPix({
      podeAbrirWhatsApp: true,
      whatsappUrl: 'https://wa.me/5511999998888?text=Mensagem%20pronta',
      telefoneWhatsApp: '5511999998888',
      mensagem: 'Mensagem pronta pelo backend.',
    })

    assert.equal(cobranca.podeAbrirWhatsApp, true)
    assert.equal(cobranca.whatsappUrl, 'https://wa.me/5511999998888?text=Mensagem%20pronta')
    assert.equal(cobranca.mensagem, 'Mensagem pronta pelo backend.')
    assert.equal(cobranca.telefone, '5511999998888')
  })

  it('normaliza cobranca WhatsApp sem telefone mantendo motivo e copia da mensagem', () => {
    const cobranca = normalizarCobrancaWhatsappPix(
      {
        podeAbrirWhatsApp: false,
        motivoBloqueio: 'Telefone do responsável não encontrado.',
        mensagem: 'Mensagem pronta para copiar.',
      },
      {
        telefoneFallback: '',
        mensagemFallback: 'Mensagem fallback.',
      },
    )

    assert.equal(cobranca.podeAbrirWhatsApp, false)
    assert.equal(cobranca.whatsappUrl, '')
    assert.equal(cobranca.motivoBloqueio, 'Telefone do responsável não encontrado.')
    assert.equal(cobranca.orientacao, 'Telefone do responsável não encontrado.')
    assert.equal(cobranca.mensagem, 'Mensagem pronta para copiar.')
  })

  it('normaliza cobranca WhatsApp com motivo de bloqueio mesmo quando o backend usa alias', () => {
    const cobranca = normalizarCobrancaWhatsappPix({
      abrirWhatsapp: 'false',
      mensagemBloqueio: 'Revise o telefone antes de cobrar.',
      preview: 'Mensagem de cobrança pronta.',
    })

    assert.equal(cobranca.podeAbrirWhatsApp, false)
    assert.equal(cobranca.motivoBloqueio, 'Revise o telefone antes de cobrar.')
    assert.equal(cobranca.orientacao, 'Revise o telefone antes de cobrar.')
    assert.equal(cobranca.mensagem, 'Mensagem de cobrança pronta.')
  })

  it('normaliza cobranca WhatsApp sem URL como fluxo bloqueado sem abrir aba', () => {
    const cobranca = normalizarCobrancaWhatsappPix(
      {
        podeAbrirWhatsApp: true,
        telefoneWhatsApp: '(11) 99999-8888',
        mensagem: 'Mensagem pronta.',
      },
      {
        orientacaoFallback: 'Não foi possível preparar o link do WhatsApp para esta cobrança.',
      },
    )

    assert.equal(cobranca.podeAbrirWhatsApp, false)
    assert.equal(cobranca.whatsappUrl, '')
    assert.equal(cobranca.telefone, '5511999998888')
    assert.match(cobranca.orientacao, /link do WhatsApp/i)
  })

  it('abrirWhatsappSeguro abre exatamente a URL informada', () => {
    const janelaAnterior = globalThis.window
    const chamadas = []

    globalThis.window = {
      open: (url, alvo, recursos) => {
        chamadas.push({ url, alvo, recursos })
        return { closed: false }
      },
    }

    try {
      const resultado = abrirWhatsappSeguro('https://wa.me/5511999998888?text=Oi')

      assert.equal(resultado.aberta, true)
      assert.equal(resultado.bloqueado, false)
      assert.deepEqual(chamadas, [
        {
          url: 'https://wa.me/5511999998888?text=Oi',
          alvo: '_blank',
          recursos: 'noopener,noreferrer',
        },
      ])
    } finally {
      globalThis.window = janelaAnterior
    }
  })

  it('abrirWhatsappSeguro informa popup bloqueado sem criar fallback vazio', () => {
    const janelaAnterior = globalThis.window
    const chamadas = []

    globalThis.window = {
      open: (url) => {
        chamadas.push(url)
        return null
      },
    }

    try {
      const resultado = abrirWhatsappSeguro('https://wa.me/5511999998888?text=Oi')

      assert.equal(resultado.aberta, false)
      assert.equal(resultado.bloqueado, true)
      assert.deepEqual(chamadas, ['https://wa.me/5511999998888?text=Oi'])
    } finally {
      globalThis.window = janelaAnterior
    }
  })

  it('abrirWhatsappSeguro fecha janela temporaria quando a URL e invalida', () => {
    let fechou = false
    const janelaAnterior = globalThis.window
    globalThis.window = {
      open: () => {
        throw new Error('Nao deve abrir URL vazia.')
      },
    }

    try {
      const resultado = abrirWhatsappSeguro('', {
        close: () => {
          fechou = true
        },
      })

      assert.equal(resultado.aberta, false)
      assert.equal(resultado.bloqueado, false)
      assert.equal(fechou, true)
    } finally {
      globalThis.window = janelaAnterior
    }
  })

  it('mensagem com valores nao resolvidos e detectada', () => {
    assert.equal(mensagemPixContemValoresNaoResolvidos('Olá, {nomeResponsavel}!'), true)
    assert.equal(mensagemPixContemValoresNaoResolvidos('Olá, undefined'), true)
    assert.equal(mensagemPixContemValoresNaoResolvidos('Mensagem pronta sem marcadores.'), false)
  })

  it('copiarTextoSeguro existe e retorna booleano sem depender do navegador nos testes', async () => {
    const resultado = await copiarTextoSeguro('')
    assert.equal(typeof resultado, 'boolean')
  })
})
