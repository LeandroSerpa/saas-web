export function emailBasicoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim())
}

export function limparEspacos(valor) {
  return String(valor || '').replace(/\s/g, '')
}

export function sanitizarSomenteDigitos(valor) {
  return String(valor || '').replace(/\D/g, '')
}

export const somenteNumeros = sanitizarSomenteDigitos

export function sanitizarTelefone(valor) {
  return sanitizarSomenteDigitos(valor).slice(0, 11)
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
