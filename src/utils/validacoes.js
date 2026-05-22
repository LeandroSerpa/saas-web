export function emailBasicoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim())
}

const REGEX_LOGIN_CURTO = /^[A-Za-z0-9._-]+$/

export function limparEspacos(valor) {
  return String(valor || '').replace(/\s/g, '')
}

export function validarLoginCurto(valor, obrigatorio = false) {
  const texto = String(valor || '').trim()

  if (!texto) {
    return obrigatorio ? 'Informe o usuário/login.' : ''
  }

  if (texto.length < 3) {
    return 'O usuário/login deve ter no mínimo 3 caracteres.'
  }

  if (texto.length > 50) {
    return 'O usuário/login deve ter no máximo 50 caracteres.'
  }

  if (/\s/.test(texto)) {
    return 'O usuário/login não pode conter espaços.'
  }

  if (!REGEX_LOGIN_CURTO.test(texto)) {
    return 'Use apenas letras, números, ponto, underline e hífen no usuário/login.'
  }

  return ''
}

export function loginCurtoValido(valor, obrigatorio = false) {
  return !validarLoginCurto(valor, obrigatorio)
}

export function sanitizarSomenteDigitos(valor) {
  return String(valor || '').replace(/\D/g, '')
}

export const somenteNumeros = sanitizarSomenteDigitos

export function sanitizarTelefone(valor) {
  return sanitizarSomenteDigitos(valor).slice(0, 11)
}

export function sanitizarTelefoneDoEvento(evento) {
  const clipboardLegado =
    typeof window !== 'undefined' ? window?.clipboardData?.getData('Text') : ''
  const valorOriginal =
    evento?.type === 'paste'
      ? evento?.clipboardData?.getData('text') ?? clipboardLegado ?? ''
      : evento?.target?.value
  const valorLimpo = sanitizarTelefone(valorOriginal)

  if (evento?.type === 'paste') {
    evento.preventDefault()
  }

  if (evento?.target) {
    evento.target.value = valorLimpo
  }

  return valorLimpo
}

export function telefoneBasicoValido(valor) {
  const digitos = sanitizarTelefone(valor)
  return !digitos || digitos.length === 10 || digitos.length === 11
}

export function sanitizarDocumento(valor) {
  return sanitizarSomenteDigitos(valor).slice(0, 14)
}

export function documentoBasicoValido(valor) {
  const digitos = sanitizarDocumento(valor)
  return !digitos || digitos.length === 11 || digitos.length === 14
}

export function sanitizarDecimal(valor) {
  const texto = String(valor || '')
    .replace(',', '.')
    .replace(/[^0-9.]/g, '')
  const partes = texto.split('.')

  if (partes.length <= 1) {
    return partes[0]
  }

  return `${partes.shift()}.${partes.join('')}`
}

export function decimalValido(valor) {
  const texto = sanitizarDecimal(valor).trim()

  return /^(0|[1-9]\d*)(\.\d+)?$/.test(texto)
}

export function sanitizarInteiroPositivo(valor) {
  return sanitizarSomenteDigitos(valor)
}

export function inteiroPositivoValido(valor) {
  const texto = sanitizarInteiroPositivo(valor).trim()

  return /^[1-9]\d*$/.test(texto)
}

export function normalizarDecimalParaBackend(valor) {
  const texto = sanitizarDecimal(valor).trim()
  return texto ? Number(texto) : null
}

export function criarManipuladorPasteNumerico(sanitizador) {
  return function aoColarNumerico(evento, aplicarValor) {
    const texto = evento?.clipboardData?.getData('text') ?? window?.clipboardData?.getData('Text') ?? ''
    if (!texto) return
    evento.preventDefault()
    aplicarValor(sanitizador(texto))
  }
}
