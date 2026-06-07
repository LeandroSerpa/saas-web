import { createReadStream, existsSync, readFileSync, statSync } from 'node:fs'
import { createServer } from 'node:http'
import { dirname, extname, join, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'

const DIRETORIO_ATUAL = dirname(fileURLToPath(import.meta.url))
const DIRETORIO_DIST = resolve(DIRETORIO_ATUAL, 'dist')
const ARQUIVO_INDEX = join(DIRETORIO_DIST, 'index.html')
const MARCADOR_SEO = /<!-- seo:start -->[\s\S]*?<!-- seo:end -->/
const ROTAS_SEO_CLIENTE = /^\/(catalogo|cardapio|agendar)\/([^/]+)\/?$/
const TIPOS_MIME = {
  '.css': 'text/css; charset=utf-8',
  '.gif': 'image/gif',
  '.ico': 'image/x-icon',
  '.jpeg': 'image/jpeg',
  '.jpg': 'image/jpeg',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.map': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.svg': 'image/svg+xml; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.webp': 'image/webp',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
}

const SEO_PADRAO = Object.freeze({
  title: 'NuvemMais Gestão',
  description: 'Sistema de gestão empresarial na nuvem.',
  imageUrl: '/og-nuvemmais.png',
  type: 'website',
  siteName: 'NuvemMais Gestão',
})

carregarVariaveisAmbienteLocais()

const PORTA = numeroPositivo(process.env.PORT, 4173)
const HOST = String(process.env.HOST || '0.0.0.0').trim() || '0.0.0.0'
const API_URL = normalizarUrlBase(
  process.env.SEO_API_URL || process.env.API_URL || process.env.VITE_API_URL,
)
const CACHE_TTL_MS = numeroPositivo(process.env.SEO_CACHE_TTL_MS, 60_000)
const API_TIMEOUT_MS = numeroPositivo(process.env.SEO_API_TIMEOUT_MS, 3_000)
const cacheSeo = new Map()

if (!existsSync(ARQUIVO_INDEX)) {
  console.error('Build não encontrado. Execute "npm run build" antes de iniciar o servidor.')
  process.exit(1)
}

const htmlBase = readFileSync(ARQUIVO_INDEX, 'utf8')

const servidor = createServer(async (requisicao, resposta) => {
  try {
    if (!['GET', 'HEAD'].includes(requisicao.method || 'GET')) {
      resposta.writeHead(405, { Allow: 'GET, HEAD' })
      resposta.end()
      return
    }

    const urlPublica = montarUrlPublica(requisicao)
    const arquivoEstatico = localizarArquivoEstatico(urlPublica.pathname)

    if (arquivoEstatico) {
      servirArquivo(arquivoEstatico, requisicao, resposta)
      return
    }

    const seo = await resolverSeo(urlPublica.pathname)
    const html = injetarSeo(htmlBase, seo, urlPublica)

    resposta.writeHead(200, {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Content-Type': 'text/html; charset=utf-8',
    })
    resposta.end(requisicao.method === 'HEAD' ? undefined : html)
  } catch (erro) {
    console.error('Falha ao servir requisição:', erro)
    resposta.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' })
    resposta.end('Não foi possível carregar a aplicação.')
  }
})

servidor.listen(PORTA, HOST, () => {
  console.log(`NuvemMais web disponível em http://${HOST}:${PORTA}`)
  if (!API_URL) {
    console.warn('SEO dinâmico sem API: configure VITE_API_URL ou SEO_API_URL no runtime.')
  }
})

async function resolverSeo(caminho) {
  const rota = caminho.match(ROTAS_SEO_CLIENTE)

  if (!rota || !API_URL) {
    return SEO_PADRAO
  }

  const [, tipo, slugCodificado] = rota
  let slug

  try {
    slug = decodeURIComponent(slugCodificado).trim()
  } catch {
    return SEO_PADRAO
  }

  if (!slug) {
    return SEO_PADRAO
  }

  const chaveCache = `${tipo}:${slug}`
  const itemCache = cacheSeo.get(chaveCache)

  if (itemCache?.expiraEm > Date.now()) {
    return itemCache.seo
  }

  const controlador = new AbortController()
  const timeout = setTimeout(() => controlador.abort(), API_TIMEOUT_MS)

  try {
    const endpoint = `${API_URL}/publico/seo/${encodeURIComponent(tipo)}/${encodeURIComponent(slug)}`
    const retorno = await fetch(endpoint, {
      headers: { Accept: 'application/json' },
      signal: controlador.signal,
    })

    if (!retorno.ok) {
      throw new Error(`API SEO respondeu HTTP ${retorno.status}`)
    }

    const seo = normalizarSeo(await retorno.json())
    cacheSeo.set(chaveCache, { seo, expiraEm: Date.now() + CACHE_TTL_MS })
    limitarCache()
    return seo
  } catch (erro) {
    console.warn(`SEO dinâmico indisponível para ${tipo}/${slug}: ${erro.message}`)
    return SEO_PADRAO
  } finally {
    clearTimeout(timeout)
  }
}

function normalizarSeo(valor) {
  const dados = obterObjetoSeo(valor)

  return {
    title: textoOuFallback(dados.title, SEO_PADRAO.title),
    description: textoOuFallback(dados.description, SEO_PADRAO.description),
    imageUrl: textoOuFallback(dados.imageUrl, SEO_PADRAO.imageUrl),
    type: textoOuFallback(dados.type, SEO_PADRAO.type),
    siteName: textoOuFallback(dados.siteName, SEO_PADRAO.siteName),
  }
}

function obterObjetoSeo(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return {}
  }

  for (const candidato of [valor.data, valor.resultado, valor.value]) {
    if (candidato && typeof candidato === 'object' && !Array.isArray(candidato)) {
      return candidato
    }
  }

  return valor
}

function injetarSeo(html, seoRecebido, urlPublica) {
  const seo = normalizarSeo(seoRecebido)
  const imageUrl = resolverUrlAbsoluta(seo.imageUrl, urlPublica, API_URL)
  const urlCompleta = urlPublica.href
  const bloco = [
    '<!-- seo:start -->',
    `    <meta name="description" content="${escaparHtml(seo.description)}">`,
    `    <meta property="og:title" content="${escaparHtml(seo.title)}">`,
    `    <meta property="og:description" content="${escaparHtml(seo.description)}">`,
    `    <meta property="og:image" content="${escaparHtml(imageUrl)}">`,
    `    <meta property="og:url" content="${escaparHtml(urlCompleta)}">`,
    `    <meta property="og:type" content="${escaparHtml(seo.type)}">`,
    `    <meta property="og:site_name" content="${escaparHtml(seo.siteName)}">`,
    '    <meta name="twitter:card" content="summary_large_image">',
    `    <meta name="twitter:title" content="${escaparHtml(seo.title)}">`,
    `    <meta name="twitter:description" content="${escaparHtml(seo.description)}">`,
    `    <meta name="twitter:image" content="${escaparHtml(imageUrl)}">`,
    `    <title>${escaparHtml(seo.title)}</title>`,
    '    <!-- seo:end -->',
  ].join('\n')

  return MARCADOR_SEO.test(html) ? html.replace(MARCADOR_SEO, bloco) : html
}

function montarUrlPublica(requisicao) {
  const protocoloEncaminhado = primeiroCabecalho(requisicao.headers['x-forwarded-proto'])
  const hostEncaminhado = primeiroCabecalho(requisicao.headers['x-forwarded-host'])
  const protocolo = protocoloEncaminhado || (requisicao.socket.encrypted ? 'https' : 'http')
  const host = hostEncaminhado || requisicao.headers.host || `localhost:${PORTA}`

  return new URL(requisicao.url || '/', `${protocolo}://${host}`)
}

function localizarArquivoEstatico(caminho) {
  let caminhoDecodificado

  try {
    caminhoDecodificado = decodeURIComponent(caminho)
  } catch {
    return null
  }

  if (caminhoDecodificado.endsWith('/')) {
    return null
  }

  const relativo = caminhoDecodificado.replace(/^[/\\]+/, '')
  const absoluto = resolve(DIRETORIO_DIST, relativo)
  const prefixoDist = `${DIRETORIO_DIST}${sep}`

  if (absoluto !== DIRETORIO_DIST && !absoluto.startsWith(prefixoDist)) {
    return null
  }

  try {
    return statSync(absoluto).isFile() ? absoluto : null
  } catch {
    return null
  }
}

function servirArquivo(arquivo, requisicao, resposta) {
  const extensao = extname(arquivo).toLowerCase()
  const imutavel = arquivo.includes(`${sep}assets${sep}`)

  resposta.writeHead(200, {
    'Cache-Control': imutavel ? 'public, max-age=31536000, immutable' : 'public, max-age=3600',
    'Content-Type': TIPOS_MIME[extensao] || 'application/octet-stream',
  })

  if (requisicao.method === 'HEAD') {
    resposta.end()
    return
  }

  createReadStream(arquivo).pipe(resposta)
}

function resolverUrlAbsoluta(valor, urlPublica, apiUrl) {
  const url = textoOuFallback(valor, SEO_PADRAO.imageUrl)

  try {
    let urlResolvida

    if (/^https?:\/\//i.test(url)) {
      urlResolvida = new URL(url)
    } else if (url.startsWith('/') && apiUrl && url !== SEO_PADRAO.imageUrl) {
      urlResolvida = new URL(url, `${apiUrl}/`)
    } else {
      urlResolvida = new URL(url, urlPublica.origin)
    }

    if (!['http:', 'https:'].includes(urlResolvida.protocol)) {
      throw new Error('Protocolo de imagem não permitido')
    }

    return urlResolvida.href
  } catch {
    return new URL(SEO_PADRAO.imageUrl, urlPublica.origin).href
  }
}

function escaparHtml(valor) {
  return String(valor || '')
    .replaceAll('&', '&amp;')
    .replaceAll('"', '&quot;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll("'", '&#39;')
}

function textoOuFallback(valor, fallback) {
  const texto = String(valor ?? '').trim()
  return texto || fallback
}

function normalizarUrlBase(valor) {
  return String(valor || '').trim().replace(/\/+$/, '')
}

function primeiroCabecalho(valor) {
  return String(Array.isArray(valor) ? valor[0] : valor || '')
    .split(',')[0]
    .trim()
}

function numeroPositivo(valor, fallback) {
  const numero = Number(valor)
  return Number.isFinite(numero) && numero > 0 ? numero : fallback
}

function limitarCache() {
  if (cacheSeo.size <= 500) {
    return
  }

  const agora = Date.now()

  for (const [chave, item] of cacheSeo) {
    if (item.expiraEm <= agora || cacheSeo.size > 400) {
      cacheSeo.delete(chave)
    }
  }
}

function carregarVariaveisAmbienteLocais() {
  for (const nomeArquivo of ['.env.local', '.env']) {
    const caminho = join(DIRETORIO_ATUAL, nomeArquivo)

    if (!existsSync(caminho)) {
      continue
    }

    for (const linha of readFileSync(caminho, 'utf8').split(/\r?\n/)) {
      const conteudo = linha.trim()

      if (!conteudo || conteudo.startsWith('#')) {
        continue
      }

      const separador = conteudo.indexOf('=')

      if (separador <= 0) {
        continue
      }

      const chave = conteudo.slice(0, separador).trim()
      let valor = conteudo.slice(separador + 1).trim()

      if (
        (valor.startsWith('"') && valor.endsWith('"')) ||
        (valor.startsWith("'") && valor.endsWith("'"))
      ) {
        valor = valor.slice(1, -1)
      }

      if (chave && process.env[chave] === undefined) {
        process.env[chave] = valor
      }
    }
  }
}
