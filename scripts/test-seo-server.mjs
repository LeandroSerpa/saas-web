import assert from 'node:assert/strict'
import { spawn } from 'node:child_process'
import { createServer } from 'node:http'

const HOST = '127.0.0.1'
let consultasSeo = 0

const api = createServer((requisicao, resposta) => {
  consultasSeo += 1

  if (requisicao.url?.includes('/falha')) {
    resposta.writeHead(503, { 'Content-Type': 'application/json; charset=utf-8' })
    resposta.end(JSON.stringify({ message: 'Serviço indisponível' }))
    return
  }

  resposta.writeHead(200, { 'Content-Type': 'application/json; charset=utf-8' })
  resposta.end(
    JSON.stringify({
      data: {
        title: 'Empresa & "Especial"',
        description: 'Descrição <segura> da empresa',
        imageUrl: '/uploads/logo-social.png',
        type: 'website',
        siteName: 'NuvemMais Gestão',
      },
    }),
  )
})

await escutar(api)
const apiPort = api.address().port
const webPort = await obterPortaLivre()
const processoWeb = spawn(process.execPath, ['server.js'], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    HOST,
    PORT: String(webPort),
    VITE_API_URL: `http://${HOST}:${apiPort}`,
  },
  stdio: ['ignore', 'pipe', 'pipe'],
})

let saidaServidor = ''
processoWeb.stdout.on('data', (dados) => {
  saidaServidor += dados
})
processoWeb.stderr.on('data', (dados) => {
  saidaServidor += dados
})

try {
  await aguardarServidor(`http://${HOST}:${webPort}/`)

  const headersProxy = {
    'X-Forwarded-Host': 'gestao-hml.nuvemmais.com.br',
    'X-Forwarded-Proto': 'https',
  }
  const urlCatalogo = `http://${HOST}:${webPort}/catalogo/neuciartes?produto=42`
  const catalogo = await buscarTexto(urlCatalogo, headersProxy)

  assert.match(catalogo, /Empresa &amp; &quot;Especial&quot;/)
  assert.match(catalogo, /Descrição &lt;segura&gt; da empresa/)
  assert.match(catalogo, /http:\/\/127\.0\.0\.1:\d+\/uploads\/logo-social\.png/)
  assert.match(
    catalogo,
    /https:\/\/gestao-hml\.nuvemmais\.com\.br\/catalogo\/neuciartes\?produto=42/,
  )
  assert.match(catalogo, /name="twitter:card" content="summary_large_image"/)

  const consultasAposCatalogo = consultasSeo
  await buscarTexto(urlCatalogo, headersProxy)
  assert.equal(consultasSeo, consultasAposCatalogo, 'A segunda consulta deve usar o cache SEO')

  const cardapio = await buscarTexto(`http://${HOST}:${webPort}/cardapio/neuciartes`, headersProxy)
  assert.match(cardapio, /Empresa &amp; &quot;Especial&quot;/)

  const agendamento = await buscarTexto(
    `http://${HOST}:${webPort}/agendar/barbearia-teste`,
    headersProxy,
  )
  assert.match(agendamento, /Empresa &amp; &quot;Especial&quot;/)

  const consultasAposRotasCliente = consultasSeo
  const raiz = await buscarTexto(`http://${HOST}:${webPort}/`, headersProxy)
  assert.match(raiz, /NuvemMais Gestão/)
  assert.match(raiz, /https:\/\/gestao-hml\.nuvemmais\.com\.br\/og-nuvemmais\.png/)

  const cadastro = await buscarTexto(`http://${HOST}:${webPort}/cadastro`, headersProxy)
  assert.match(cadastro, /NuvemMais Gestão/)

  const dashboard = await buscarTexto(`http://${HOST}:${webPort}/dashboard`, headersProxy)
  assert.match(dashboard, /NuvemMais Gestão/)
  assert.doesNotMatch(dashboard, /Empresa &amp;/)
  assert.equal(
    consultasSeo,
    consultasAposRotasCliente,
    'Rotas padrão e internas não devem consultar a API SEO',
  )

  const fallbackFalha = await buscarTexto(
    `http://${HOST}:${webPort}/catalogo/falha`,
    headersProxy,
  )
  assert.match(fallbackFalha, /NuvemMais Gestão/)
  assert.doesNotMatch(fallbackFalha, /Empresa &amp;/)

  const asset = await fetch(`http://${HOST}:${webPort}/og-nuvemmais.png`)
  assert.equal(asset.status, 200)
  assert.equal(asset.headers.get('content-type'), 'image/png')

  console.log('Teste SEO concluído: metas dinâmicas, fallback, cache e asset validados.')
} catch (erro) {
  if (saidaServidor.trim()) {
    console.error(saidaServidor.trim())
  }
  throw erro
} finally {
  processoWeb.kill()
  await encerrar(api)
}

function escutar(servidor) {
  return new Promise((resolve, reject) => {
    servidor.once('error', reject)
    servidor.listen(0, HOST, resolve)
  })
}

async function obterPortaLivre() {
  const servidor = createServer()
  await escutar(servidor)
  const porta = servidor.address().port
  await encerrar(servidor)
  return porta
}

function encerrar(servidor) {
  return new Promise((resolve, reject) => {
    servidor.close((erro) => (erro ? reject(erro) : resolve()))
  })
}

async function aguardarServidor(url) {
  let ultimoErro

  for (let tentativa = 0; tentativa < 30; tentativa += 1) {
    try {
      const resposta = await fetch(url)

      if (resposta.ok) {
        return
      }
    } catch (erro) {
      ultimoErro = erro
    }

    await new Promise((resolve) => setTimeout(resolve, 100))
  }

  throw ultimoErro || new Error('Servidor web não iniciou no tempo esperado.')
}

async function buscarTexto(url, headers = {}) {
  const resposta = await fetch(url, { headers })
  assert.equal(resposta.status, 200)
  return resposta.text()
}
