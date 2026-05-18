export function emailBasicoValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim())
}

export function sanitizarTelefone(valor) {
  return String(valor || '').replace(/[^0-9()+\-\s]/g, '')
}

export function telefoneBasicoValido(valor) {
  const texto = sanitizarTelefone(valor).trim()
  const digitos = texto.replace(/\D/g, '')

  return !texto || digitos.length >= 8
}

export function sanitizarDocumento(valor) {
  return String(valor || '').replace(/[^0-9./\-]/g, '')
}

export function documentoBasicoValido(valor) {
  const texto = sanitizarDocumento(valor).trim()
  const digitos = texto.replace(/\D/g, '')

  return !texto || digitos.length >= 11
}

export function sanitizarDecimal(valor) {
  const texto = String(valor || '').replace(',', '.').replace(/[^0-9.]/g, '')
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
  return String(valor || '').replace(/\D/g, '')
}

export function inteiroPositivoValido(valor) {
  const texto = sanitizarInteiroPositivo(valor).trim()

  return /^[1-9]\d*$/.test(texto)
}

