const TIPOS_CHAVE_PIX_BASE = [
  { valor: 'CPF', rotulo: 'CPF', ajuda: 'Use apenas números.' },
  { valor: 'CNPJ', rotulo: 'CNPJ', ajuda: 'Use apenas números.' },
  { valor: 'EMAIL', rotulo: 'E-mail', ajuda: 'Use um e-mail válido.' },
  { valor: 'TELEFONE', rotulo: 'Telefone', ajuda: 'Use o telefone com DDD.' },
  { valor: 'ALEATORIA', rotulo: 'Chave aleatória', ajuda: 'Use a chave informada pelo banco.' },
]

export const TIPOS_CHAVE_PIX = Object.freeze([...TIPOS_CHAVE_PIX_BASE])

const TIPOS_VALIDOS = new Set(TIPOS_CHAVE_PIX_BASE.map((item) => item.valor))

const TIPOS_EQUIVALENTES = {
  CPF: 'CPF',
  CNPJ: 'CNPJ',
  EMAIL: 'EMAIL',
  E_MAIL: 'EMAIL',
  TELEFONE: 'TELEFONE',
  CELULAR: 'TELEFONE',
  FONE: 'TELEFONE',
  ALEATORIA: 'ALEATORIA',
  ALEATORIO: 'ALEATORIA',
  CHAVE_ALEATORIA: 'ALEATORIA',
  CHAVE_ALEATORIO: 'ALEATORIA',
}

function textoSeguro(valor) {
  return String(valor ?? '')
    .replace(/[\r\n\t]+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim()
}

function textoSegurancaBasica(valor) {
  return String(valor ?? '')
    .replace(/[\u0000-\u001f\u007f]/g, '')
    .trim()
}

function normalizarNumeroPix(valor) {
  const texto = textoSeguro(valor).replace(/[R$\s]/g, '')

  if (!texto) {
    return NaN
  }

  if (texto.includes(',')) {
    return Number(texto.replace(/\./g, '').replace(',', '.').replace(/[^0-9.-]/g, ''))
  }

  return Number(texto.replace(/[^0-9.-]/g, ''))
}

function sanitizarChavePixPorTipo(tipo, chave) {
  const chaveLimpa = textoSegurancaBasica(chave)

  if (!chaveLimpa) {
    return ''
  }

  if (tipo === 'EMAIL') {
    return chaveLimpa.toLowerCase()
  }

  if (tipo === 'CPF' || tipo === 'CNPJ' || tipo === 'TELEFONE') {
    return chaveLimpa.replace(/\D/g, '')
  }

  return chaveLimpa
}

function temPropriedade(obj, propriedade) {
  return Boolean(obj && typeof obj === 'object' && Object.prototype.hasOwnProperty.call(obj, propriedade))
}

function primeiroTextoPreenchido(obj, chaves = []) {
  for (const chave of chaves) {
    const valor = textoSeguro(obj?.[chave])
    if (valor) {
      return valor
    }
  }

  return ''
}

function primeiroValorPreenchido(obj, chaves = []) {
  for (const chave of chaves) {
    const valor = obj?.[chave]
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      return valor
    }
  }

  return undefined
}

export function normalizarTipoChavePix(valor) {
  const texto = String(valor ?? '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^A-Za-z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return TIPOS_EQUIVALENTES[texto] || (TIPOS_VALIDOS.has(texto) ? texto : '')
}

export function formatarValorPix(valor) {
  const numero = typeof valor === 'number' ? valor : normalizarNumeroPix(valor)

  if (!Number.isFinite(numero)) {
    return ''
  }

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
    .format(numero)
    .replace(/\u00a0/g, ' ')
}

export function formatarDataPix(valor) {
  if (!valor) {
    return ''
  }

  const texto = textoSeguro(valor)

  if (/^\d{2}\/\d{2}\/\d{4}$/.test(texto)) {
    return texto
  }

  if (/^\d{4}-\d{2}-\d{2}$/.test(texto)) {
    const [ano, mes, dia] = texto.split('-')
    return `${dia}/${mes}/${ano}`
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return texto
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

export function mascararChavePix(valor, tipo = '') {
  const chave = textoSeguro(valor)
  const tipoNormalizado = normalizarTipoChavePix(tipo)

  if (!chave) {
    return ''
  }

  if (tipoNormalizado === 'EMAIL') {
    const [usuario = '', dominio = ''] = chave.split('@')

    if (!dominio) {
      return chave
    }

    const prefixo = usuario.length <= 2 ? `${usuario.slice(0, 1)}*` : `${usuario.slice(0, 2)}***`
    return `${prefixo}@${dominio}`
  }

  if (tipoNormalizado === 'CPF' || tipoNormalizado === 'CNPJ' || tipoNormalizado === 'TELEFONE') {
    const digitos = chave.replace(/\D/g, '')
    return digitos.length <= 4 ? '****' : `${'*'.repeat(Math.min(digitos.length - 4, 6))}${digitos.slice(-4)}`
  }

  if (chave.length <= 8) {
    return '***'
  }

  return `${chave.slice(0, 4)}...${chave.slice(-4)}`
}

export function aplicarTemplatePix(template, dados = {}) {
  const textoTemplate = textoSeguro(template)

  if (!textoTemplate) {
    return gerarMensagemPixFallback(dados)
  }

  const substituicoes = {
    cliente: textoSeguro(primeiroValorPreenchido(dados, ['cliente', 'nomeCliente', 'nomeResponsavel', 'nome'])),
    valor: formatarValorPix(primeiroValorPreenchido(dados, ['valor', 'valorTotal', 'valorPago'])),
    descricao: textoSeguro(primeiroValorPreenchido(dados, ['descricao', 'nomeAcordo', 'mensagem', 'titulo'])),
    vencimento: formatarDataPix(primeiroValorPreenchido(dados, ['vencimento', 'dataVencimento', 'data'])),
    chavePix: textoSeguro(primeiroValorPreenchido(dados, ['chavePix', 'pixChave', 'pix'])),
    nomeRecebedorPix: textoSeguro(primeiroValorPreenchido(dados, ['nomeRecebedorPix', 'nomeRecebedor', 'recebedorNome'])),
    nomeRecebedor: textoSeguro(primeiroValorPreenchido(dados, ['nomeRecebedor', 'nomeRecebedorPix', 'recebedorNome'])),
    nomeResponsavel: textoSeguro(primeiroValorPreenchido(dados, ['nomeResponsavel', 'cliente', 'nomeCliente', 'nome'])),
    competencia: textoSeguro(primeiroValorPreenchido(dados, ['competencia', 'mes', 'periodo'])),
    nomeAcordo: textoSeguro(primeiroValorPreenchido(dados, ['nomeAcordo', 'descricao', 'titulo'])),
  }

  return textoTemplate.replace(/\{([^}]+)\}/g, (marcador, chave) => {
    if (!Object.prototype.hasOwnProperty.call(substituicoes, chave)) {
      return marcador
    }

    return substituicoes[chave] || ''
  })
}

export function gerarMensagemPixFallback(dados = {}) {
  const cliente = textoSeguro(primeiroValorPreenchido(dados, ['cliente', 'nomeCliente', 'nomeResponsavel', 'nome']))
  const descricao = textoSeguro(primeiroValorPreenchido(dados, ['descricao', 'nomeAcordo', 'titulo']))
  const valor = formatarValorPix(primeiroValorPreenchido(dados, ['valor', 'valorTotal', 'valorPago']))
  const vencimento = formatarDataPix(primeiroValorPreenchido(dados, ['vencimento', 'dataVencimento', 'data']))
  const chavePix = textoSeguro(primeiroValorPreenchido(dados, ['chavePix', 'pixChave', 'pix']))
  const nomeRecebedor = textoSeguro(primeiroValorPreenchido(dados, ['nomeRecebedorPix', 'nomeRecebedor', 'recebedorNome']))

  const partes = []

  if (cliente) {
    partes.push(`Olá, ${cliente}!`)
  }

  if (descricao) {
    partes.push(`Segue a cobrança de ${descricao}.`)
  }

  if (valor) {
    partes.push(`Valor: ${valor}.`)
  }

  if (vencimento) {
    partes.push(`Vencimento: ${vencimento}.`)
  }

  if (chavePix) {
    partes.push(`PIX: ${chavePix}.`)
  }

  if (nomeRecebedor) {
    partes.push(`Recebedor: ${nomeRecebedor}.`)
  }

  partes.push('Após o pagamento, envie o comprovante. Obrigado!')

  return partes
    .join(' ')
    .replace(/\s+/g, ' ')
    .replace(/\s+([.,!?;:])/g, '$1')
    .trim()
}

export function validarConfiguracaoPix(dados = {}) {
  const configuracao = normalizarConfiguracaoPix(dados)
  const possuiAlgumCampo =
    configuracao.pixAtivo ||
    Boolean(configuracao.tipoChavePix || configuracao.chavePix || configuracao.nomeRecebedor || configuracao.instrucoesPix || configuracao.templateMensagem)

  if (!possuiAlgumCampo) {
    return {
      valido: true,
      pixAtivo: false,
      mensagem: '',
      camposInvalidos: {
        tipoChavePix: false,
        chavePix: false,
        nomeRecebedor: false,
      },
    }
  }

  const camposInvalidos = {
    tipoChavePix: false,
    chavePix: false,
    nomeRecebedor: false,
  }

  const faltando = []

  if (!configuracao.tipoChavePix) {
    camposInvalidos.tipoChavePix = true
    faltando.push('o tipo da chave PIX')
  }

  if (!configuracao.chavePix) {
    camposInvalidos.chavePix = true
    faltando.push('a chave PIX')
  }

  if (!configuracao.nomeRecebedor) {
    camposInvalidos.nomeRecebedor = true
    faltando.push('o nome do recebedor')
  }

  if (configuracao.tipoChavePix && configuracao.chavePix) {
    const erroChave = validarChavePixPorTipo(configuracao.tipoChavePix, configuracao.chavePix)

    if (erroChave) {
      return {
        valido: false,
        pixAtivo: configuracao.pixAtivo,
        mensagem: erroChave,
        camposInvalidos: {
          ...camposInvalidos,
          chavePix: true,
        },
      }
    }
  }

  return {
    valido: faltando.length === 0,
    pixAtivo: configuracao.pixAtivo,
    mensagem: montarMensagemCamposFaltantes(faltando),
    camposInvalidos,
  }
}

export function normalizarConfiguracaoPix(dados = {}) {
  const base = dados && typeof dados === 'object' ? dados : {}
  const tipoChavePix = normalizarTipoChavePix(
    primeiroValorPreenchido(base, ['tipoChavePix', 'tipoPix', 'chaveTipoPix', 'tipo']),
  )
  const chavePix = sanitizarChavePixPorTipo(
    tipoChavePix,
    primeiroValorPreenchido(base, ['chavePix', 'pixChave', 'pix', 'chave']),
  )
  const nomeRecebedor = primeiroTextoPreenchido(base, ['nomeRecebedorPix', 'nomeRecebedor', 'recebedorNome'])
  const instrucoesPix = primeiroTextoPreenchido(base, ['instrucoesPix', 'instrucoes', 'orientacoesPix', 'mensagemInstrucaoPix'])
  const templateMensagem = primeiroTextoPreenchido(
    base,
    ['templateMensagem', 'mensagemCobrancaTemplate', 'templatePix', 'mensagemTemplate', 'mensagem'],
  )
  const temDadosPix = Boolean(tipoChavePix || chavePix || nomeRecebedor || instrucoesPix || templateMensagem)

  let pixAtivo = temDadosPix

  if (temPropriedade(base, 'pixAtivo')) {
    pixAtivo = Boolean(base.pixAtivo)
  } else if (temPropriedade(base, 'ativoPix')) {
    pixAtivo = Boolean(base.ativoPix)
  } else if (temPropriedade(base, 'ativo')) {
    pixAtivo = Boolean(base.ativo)
  }

  return {
    pixAtivo,
    tipoChavePix,
    chavePix,
    nomeRecebedor,
    nomeRecebedorPix: nomeRecebedor,
    instrucoesPix,
    templateMensagem,
    mensagemCobrancaTemplate: templateMensagem,
  }
}

export function montarPayloadPix(dados = {}) {
  const configuracao = normalizarConfiguracaoPix(dados)

  return {
    pixAtivo: configuracao.pixAtivo,
    tipoChavePix: configuracao.pixAtivo ? configuracao.tipoChavePix : '',
    chavePix: configuracao.pixAtivo ? configuracao.chavePix : '',
    nomeRecebedor: configuracao.pixAtivo ? configuracao.nomeRecebedor : '',
    nomeRecebedorPix: configuracao.pixAtivo ? configuracao.nomeRecebedor : '',
    instrucoesPix: configuracao.pixAtivo ? configuracao.instrucoesPix : '',
    templateMensagem: configuracao.pixAtivo ? configuracao.templateMensagem : '',
    mensagemCobrancaTemplate: configuracao.pixAtivo ? configuracao.templateMensagem : '',
  }
}

export async function copiarTextoSeguro(texto) {
  const valor = textoSeguro(texto)

  if (!valor || typeof window === 'undefined' || typeof document === 'undefined') {
    return false
  }

  try {
    if (window.isSecureContext && typeof navigator !== 'undefined' && navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(valor)
      return true
    }
  } catch (error) {
    // fallback abaixo
  }

  const area = document.createElement('textarea')
  area.value = valor
  area.setAttribute('readonly', 'readonly')
  area.style.position = 'fixed'
  area.style.top = '-9999px'
  area.style.left = '-9999px'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()

  let copiado = false

  try {
    copiado = document.execCommand('copy')
  } catch (error) {
    copiado = false
  } finally {
    document.body.removeChild(area)
  }

  return copiado
}

function validarChavePixPorTipo(tipoChavePix, chavePix) {
  if (tipoChavePix === 'EMAIL') {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(chavePix) ? '' : 'Informe um e-mail válido para a chave PIX.'
  }

  if (tipoChavePix === 'TELEFONE') {
    return /^\d{10,11}$/.test(chavePix) ? '' : 'Informe um telefone válido com DDD.'
  }

  if (tipoChavePix === 'CPF') {
    return /^\d{11}$/.test(chavePix) ? '' : 'Informe um CPF válido.'
  }

  if (tipoChavePix === 'CNPJ') {
    return /^\d{14}$/.test(chavePix) ? '' : 'Informe um CNPJ válido.'
  }

  if (tipoChavePix === 'ALEATORIA') {
    return textoSeguro(chavePix) ? '' : 'Informe a chave aleatória.'
  }

  return 'Selecione um tipo de chave PIX válido.'
}

function montarMensagemCamposFaltantes(faltando = []) {
  if (!faltando.length) {
    return ''
  }

  if (faltando.length === 1) {
    return `Preencha ${faltando[0]} para continuar.`
  }

  if (faltando.length === 2) {
    return `Preencha ${faltando[0]} e ${faltando[1]} para continuar.`
  }

  return 'Preencha o tipo da chave PIX, a chave PIX e o nome do recebedor para continuar.'
}
