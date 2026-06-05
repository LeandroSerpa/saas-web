function extrairIdGoogleDrive(url) {
  const valor = String(url || '').trim()

  if (!valor) {
    return ''
  }

  try {
    const endereco = new URL(valor)
    const host = endereco.hostname.toLowerCase()

    if (!host.includes('google.com')) {
      return ''
    }

    const idQuery = String(endereco.searchParams.get('id') || '').trim()
    if (idQuery) {
      return idQuery
    }

    const caminhos = [
      /\/file\/d\/([^/]+)/i,
      /\/document\/d\/([^/]+)/i,
      /\/presentation\/d\/([^/]+)/i,
      /\/spreadsheets\/d\/([^/]+)/i,
      /\/forms\/d\/([^/]+)/i,
      /\/d\/([^/]+)/i,
    ]

    for (const padrao of caminhos) {
      const correspondencia = endereco.pathname.match(padrao)

      if (correspondencia?.[1]) {
        return correspondencia[1].trim()
      }
    }
  } catch {
    return ''
  }

  return ''
}

export function normalizarUrlImagemPublica(url) {
  const valor = String(url || '').trim()

  if (!valor) {
    return ''
  }

  const idGoogleDrive = extrairIdGoogleDrive(valor)

  if (idGoogleDrive) {
    return `https://drive.google.com/thumbnail?id=${encodeURIComponent(idGoogleDrive)}&sz=w1200`
  }

  return valor
}
