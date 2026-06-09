const REGEX_DATA_ISO_SIMPLES = /^\d{4}-\d{2}-\d{2}$/

export function formatarDataPtBrSemFuso(valor) {
  if (!valor) {
    return ''
  }

  const texto = String(valor).trim()

  if (REGEX_DATA_ISO_SIMPLES.test(texto)) {
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
