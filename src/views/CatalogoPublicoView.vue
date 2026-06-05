<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO,
  buscarCardapioPublico,
  buscarCatalogoPublico,
  buscarEmpresaPublica,
  buscarPersonalizacaoPublica,
} from '@/services/api'
import { normalizarUrlImagemPublica } from '@/utils/imagens'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())
const acessandoViaCardapio = computed(() => String(route.path || '').startsWith('/cardapio/'))

const carregando = ref(true)
const indisponivel = ref(false)
const erro = ref('')
const empresa = ref(criarEmpresaPadrao())
const personalizacao = ref(criarPersonalizacaoPadrao())
const produtos = ref([])
const categoriasResposta = ref([])
const categoriaAtiva = ref('')
const categoriasRef = ref(null)
const produtoSelecionado = ref(null)
const imagensComErro = ref({})
let overflowBodyAnterior = ''
let overflowHtmlAnterior = ''
let scrollBloqueadoModal = false

const produtosPublicados = computed(() =>
  [...produtos.value]
    .sort((a, b) => {
      const ordemA = Number.isFinite(a.ordemCatalogo) ? a.ordemCatalogo : Number.MAX_SAFE_INTEGER
      const ordemB = Number.isFinite(b.ordemCatalogo) ? b.ordemCatalogo : Number.MAX_SAFE_INTEGER

      return ordemA - ordemB || Number(b.destaque === true) - Number(a.destaque === true) || a.nome.localeCompare(b.nome, 'pt-BR')
    }),
)

const categorias = computed(() => {
  const categoriasApi = normalizarCategoriasCatalogo(categoriasResposta.value)

  if (categoriasApi.length) {
    const contagemPorCategoria = new Map()

    for (const produto of produtosPublicados.value) {
      const categoria = String(produto.categoriaPublica || '').trim()

      if (!categoria) {
        continue
      }

      contagemPorCategoria.set(categoria, (contagemPorCategoria.get(categoria) || 0) + 1)
    }

    return categoriasApi.map((nome) => ({
      nome,
      quantidade: contagemPorCategoria.get(nome) || 0,
    }))
  }

  const mapa = new Map()

  for (const produto of produtosPublicados.value) {
    const categoria = String(produto.categoriaPublica || '').trim()

    if (!categoria) {
      continue
    }

    mapa.set(categoria, (mapa.get(categoria) || 0) + 1)
  }

  return [...mapa.entries()]
    .map(([nome, quantidade]) => ({ nome, quantidade }))
    .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
})

const produtosFiltrados = computed(() => {
  if (!categoriaAtiva.value) {
    return produtosPublicados.value
  }

  return produtosPublicados.value.filter((item) => item.categoriaPublica === categoriaAtiva.value)
})

const tituloPagina = computed(() =>
  String(
    personalizacao.value.tituloCatalogo ||
      personalizacao.value.tituloPagina ||
      `Catalogo de ${empresa.value.nome || 'produtos'}`,
  ).trim(),
)

const subtituloPagina = computed(() =>
  String(
    personalizacao.value.subtituloCatalogo ||
      personalizacao.value.subtituloPagina ||
      empresa.value.mensagemPublica ||
      '',
  ).trim(),
)

const logoEmpresa = computed(() =>
  String(
    personalizacao.value.logoUrl ||
      empresa.value.logoUrl ||
      empresa.value.logo ||
      '',
  ).trim(),
)

const bannerEmpresa = computed(() =>
  String(
    personalizacao.value.bannerUrl ||
      empresa.value.bannerUrl ||
      empresa.value.capaUrl ||
      '',
  ).trim(),
)

const descricaoCatalogo = computed(() =>
  subtituloPagina.value || 'Confira os produtos publicados hoje e fale com a empresa direto pelo WhatsApp.'
)

const corPrincipalCatalogo = computed(() => normalizarCorHex(personalizacao.value.corPrincipal, '#2563eb'))
const corSecundariaCatalogo = computed(() => normalizarCorHex(personalizacao.value.corSecundaria, '#0f172a'))
const temaCatalogo = computed(() => normalizarTemaPublico(personalizacao.value.tema))
const classeTemaCatalogo = computed(() => `tema-${temaCatalogo.value.toLowerCase()}`)
const estilosCatalogo = computed(() => {
  const corPrincipal = corPrincipalCatalogo.value
  const corSecundaria = corSecundariaCatalogo.value
  const mapa = criarMapaVisualCatalogo(corPrincipal, corSecundaria, temaCatalogo.value)

  return {
    '--catalogo-cor-principal': corPrincipal,
    '--catalogo-cor-secundaria': corSecundaria,
    '--catalogo-cor-destaque': mapa.destaque,
    '--catalogo-cor-fundo': mapa.fundo,
    '--catalogo-cor-card': mapa.card,
    '--catalogo-cor-texto': mapa.texto,
    '--catalogo-cor-texto-suave': mapa.textoSuave,
    '--catalogo-cor-borda': mapa.borda,
    '--catalogo-cor-hero': mapa.hero,
    '--catalogo-cor-botao': mapa.botao,
    '--catalogo-cor-botao-texto': mapa.botaoTexto,
    '--catalogo-cor-fundo-secundario': mapa.fundoSecundario,
    '--catalogo-cor-chip': mapa.chip,
    '--catalogo-cor-chip-texto': mapa.chipTexto,
    '--catalogo-cor-sucesso': mapa.sucesso,
    '--catalogo-cor-sucesso-suave': mapa.sucessoSuave,
    '--catalogo-cor-perigo': mapa.perigo,
    '--catalogo-cor-perigo-suave': mapa.perigoSuave,
    '--catalogo-cor-overlay': mapa.overlay,
    '--catalogo-cor-modal': mapa.modal,
    '--catalogo-cor-modal-midia': mapa.modalMidia,
  }
})

const whatsappNumero = computed(() => {
  const candidatos = [
    empresa.value.whatsapp,
    empresa.value.telefoneWhatsapp,
    empresa.value.telefoneComercial,
    empresa.value.telefone,
    personalizacao.value.whatsapp,
    personalizacao.value.telefone,
  ]

  for (const candidato of candidatos) {
    const numero = normalizarTelefoneWhatsappBrasil(candidato)

    if (numero) {
      return numero
    }
  }

  return ''
})

const temWhatsapp = computed(() => Boolean(whatsappNumero.value))
const totalDisponiveis = computed(() => produtosPublicados.value.filter((item) => item.disponivel === true).length)
const totalDestaques = computed(() => produtosPublicados.value.filter((item) => item.destaque === true).length)
const quantidadeCategorias = computed(() => categorias.value.length)
const categoriaAtivaSelecionada = computed(() => categorias.value.find((item) => item.nome === categoriaAtiva.value) || null)
const totalVisiveis = computed(() => produtosFiltrados.value.length)
const totalProdutosPublicados = computed(() => produtosPublicados.value.length)
const linkWhatsappContato = computed(() => {
  if (!temWhatsapp.value) {
    return ''
  }

  const nomeEmpresa = empresa.value.nome || 'empresa'
  const linhas = [
    `Ola! Vim pelo catalogo da ${nomeEmpresa}.`,
    'Quero ver os produtos disponiveis hoje e fazer meu pedido pelo WhatsApp.',
  ]

  return `https://wa.me/${whatsappNumero.value}?text=${encodeURIComponent(linhas.join('\n'))}`
})

watch(
  slug,
  () => {
    carregarCatalogo()
  },
  { immediate: true },
)

function criarEmpresaPadrao() {
  return {
    nome: '',
    mensagemPublica: '',
    logoUrl: '',
    bannerUrl: '',
    capaUrl: '',
    telefone: '',
    telefoneComercial: '',
    telefoneWhatsapp: '',
    whatsapp: '',
  }
}

function criarPersonalizacaoPadrao() {
  return {
    logoUrl: '',
    bannerUrl: '',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
    tema: 'PADRAO',
    tituloPagina: '',
    subtituloPagina: '',
    tituloCatalogo: '',
    subtituloCatalogo: '',
    whatsapp: '',
    telefone: '',
  }
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []

  const candidatos = [
    valor.content,
    valor.items,
    valor.itens,
    valor.resultado,
    valor.produtos,
    valor.value,
    valor.data?.content,
    valor.data?.items,
    valor.data?.itens,
    valor.data?.resultado,
    valor.data?.produtos,
    valor.data,
  ]

  return candidatos.find(Array.isArray) || []
}

function normalizarCategoriasCatalogo(valor) {
  return [...new Set(normalizarLista(valor).map((item) => String(item || '').trim()).filter(Boolean))].sort((a, b) =>
    a.localeCompare(b, 'pt-BR'),
  )
}

function normalizarProdutoCatalogo(produto) {
  const item = produto && typeof produto === 'object' && !Array.isArray(produto) ? produto : {}
  const categoriaPublica = String(item.categoriaPublica || item.categoria || '').trim()
  const quantidadeDisponivel = Number(
    item.quantidadeDisponivel ?? item.quantidadeAtual ?? item.quantidade ?? item.saldoAtual ?? 0,
  )
  const destaque = item.destaque === true
  const disponivel = item.disponivel === true
  const esgotado = item.esgotado === true
  const ordemBruta = Number(item.ordemCatalogo ?? item.ordemExibicaoCatalogo ?? item.ordem)

  return {
    ...item,
    nome: String(item.nome || '').trim(),
    descricaoPublica: String(item.descricaoPublica || item.descricao || '').trim(),
    categoriaPublica,
    imagemUrl: normalizarUrlImagemPublica(String(item.imagemUrl || item.fotoUrl || item.imagem || '').trim()),
    precoVenda: Number(item.precoVenda ?? item.preco ?? 0),
    quantidadeDisponivel: Number.isFinite(quantidadeDisponivel) ? quantidadeDisponivel : 0,
    unidade: String(item.unidade || item.unidadeMedida || 'UN').trim().toUpperCase(),
    disponivel,
    esgotado,
    destaque,
    mostrarQuantidadePublica: item.mostrarQuantidadePublica === true,
    mostrarPrecoPublico: item.mostrarPrecoPublico !== false,
    textoBotaoPublico: String(item.textoBotaoPublico || '').trim() || TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO,
    ordemCatalogo: Number.isFinite(ordemBruta) ? ordemBruta : Number.MAX_SAFE_INTEGER,
  }
}

function normalizarObjeto(valor) {
  if (!valor || typeof valor !== 'object' || Array.isArray(valor)) {
    return {}
  }

  const candidatos = [valor.data, valor.resultado, valor.value, valor.empresa, valor.personalizacao]
  return candidatos.find((item) => item && typeof item === 'object' && !Array.isArray(item)) || valor
}

function normalizarTelefoneWhatsappBrasil(valor) {
  let numero = String(valor || '').replace(/\D+/g, '')

  if (!numero) {
    return ''
  }

  numero = numero.replace(/^0+/, '')

  if (numero.startsWith('55') && (numero.length === 12 || numero.length === 13)) {
    return numero
  }

  if (numero.length === 10 || numero.length === 11) {
    return `55${numero}`
  }

  return ''
}

function corHexValida(cor) {
  return /^#[0-9a-f]{6}$/.test(String(cor || '').trim().toLowerCase())
}

function normalizarCorHex(cor, fallback = '') {
  const texto = String(cor || '').trim().toLowerCase()

  if (!texto) {
    return fallback
  }

  if (/^#[0-9a-f]{6}$/.test(texto)) {
    return texto
  }

  if (/^[0-9a-f]{6}$/.test(texto)) {
    return `#${texto}`
  }

  return fallback
}

function normalizarTemaPublico(tema) {
  return ['PADRAO', 'MODERNO', 'ESCURO', 'SUAVE'].includes(tema) ? tema : 'PADRAO'
}

function converterHexParaRgb(cor) {
  const corNormalizada = normalizarCorHex(cor, '')

  if (!corHexValida(corNormalizada)) {
    return null
  }

  return {
    r: Number.parseInt(corNormalizada.slice(1, 3), 16),
    g: Number.parseInt(corNormalizada.slice(3, 5), 16),
    b: Number.parseInt(corNormalizada.slice(5, 7), 16),
  }
}

function formatarRgbComoHex({ r, g, b }) {
  return `#${[r, g, b]
    .map((valor) => Math.max(0, Math.min(255, Math.round(valor))).toString(16).padStart(2, '0'))
    .join('')}`
}

function misturarCores(base, mistura, proporcaoMistura = 0.5) {
  const rgbBase = converterHexParaRgb(base)
  const rgbMistura = converterHexParaRgb(mistura)

  if (!rgbBase || !rgbMistura) {
    return normalizarCorHex(base, mistura)
  }

  const proporcao = Math.max(0, Math.min(1, Number(proporcaoMistura)))
  const proporcaoBase = 1 - proporcao

  return formatarRgbComoHex({
    r: rgbBase.r * proporcaoBase + rgbMistura.r * proporcao,
    g: rgbBase.g * proporcaoBase + rgbMistura.g * proporcao,
    b: rgbBase.b * proporcaoBase + rgbMistura.b * proporcao,
  })
}

function corComAlpha(cor, alpha) {
  const rgb = converterHexParaRgb(cor)

  if (!rgb) {
    return `rgba(15, 23, 42, ${alpha})`
  }

  const opacidade = Math.max(0, Math.min(1, Number(alpha)))
  return `rgba(${rgb.r}, ${rgb.g}, ${rgb.b}, ${opacidade})`
}

function luminancia(cor) {
  const rgb = converterHexParaRgb(cor)

  if (!rgb) {
    return 0
  }

  const canais = [rgb.r, rgb.g, rgb.b].map((canal) => {
    const valor = canal / 255
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2]
}

function escolherTextoContraste(corFundo, claro = '#f8fafc', escuro = '#0f172a') {
  return luminancia(corFundo) > 0.52 ? escuro : claro
}

function criarMapaVisualCatalogo(corPrincipal, corSecundaria, tema) {
  const base = {
    destaque: misturarCores(corPrincipal, corSecundaria, 0.2),
    fundo: '#f8fafc',
    card: 'rgba(255, 255, 255, 0.92)',
    texto: '#1f2937',
    textoSuave: '#5b6474',
    borda: corComAlpha(misturarCores(corSecundaria, '#cbd5e1', 0.72), 0.38),
    hero: misturarCores(corPrincipal, '#ffffff', 0.88),
    botao: corPrincipal,
    botaoTexto: escolherTextoContraste(corPrincipal),
    fundoSecundario: misturarCores(corSecundaria, '#ffffff', 0.9),
    chip: misturarCores(corSecundaria, '#ffffff', 0.9),
    chipTexto: misturarCores(corSecundaria, '#0f172a', 0.25),
    sucesso: '#166534',
    sucessoSuave: '#dcfce7',
    perigo: '#b91c1c',
    perigoSuave: '#fee2e2',
    overlay: corComAlpha(corSecundaria, 0.72),
    modal: 'rgba(255, 255, 255, 0.99)',
    modalMidia: `linear-gradient(180deg, ${misturarCores(corPrincipal, '#ffffff', 0.78)}, #ffffff)`,
  }

  if (tema === 'MODERNO') {
    return {
      ...base,
      fundo: misturarCores(corPrincipal, '#f8fafc', 0.9),
      card: corComAlpha('#ffffff', 0.9),
      hero: `linear-gradient(135deg, ${corComAlpha(corPrincipal, 0.16)}, ${corComAlpha(corSecundaria, 0.12)})`,
      fundoSecundario: misturarCores(corPrincipal, '#ffffff', 0.92),
      chip: misturarCores(corPrincipal, '#ffffff', 0.88),
    }
  }

  if (tema === 'ESCURO') {
    return {
      ...base,
      fundo: '#020617',
      card: 'rgba(15, 23, 42, 0.88)',
      texto: '#e5e7eb',
      textoSuave: '#cbd5e1',
      borda: corComAlpha('#94a3b8', 0.28),
      hero: `linear-gradient(135deg, ${corComAlpha(corPrincipal, 0.22)}, ${corComAlpha(corSecundaria, 0.4)})`,
      botaoTexto: escolherTextoContraste(corPrincipal, '#f8fafc', '#020617'),
      fundoSecundario: 'rgba(15, 23, 42, 0.92)',
      chip: 'rgba(30, 41, 59, 0.92)',
      chipTexto: '#e2e8f0',
      overlay: corComAlpha('#020617', 0.5),
      modal: 'rgba(15, 23, 42, 0.98)',
      modalMidia: `linear-gradient(180deg, ${corComAlpha(corPrincipal, 0.18)}, rgba(15, 23, 42, 0.96))`,
    }
  }

  if (tema === 'SUAVE') {
    return {
      ...base,
      fundo: misturarCores(corPrincipal, '#f8fafc', 0.95),
      card: 'rgba(255, 255, 255, 0.96)',
      texto: '#243041',
      textoSuave: '#64748b',
      borda: corComAlpha(misturarCores(corPrincipal, '#cbd5e1', 0.7), 0.28),
      hero: misturarCores(corPrincipal, '#ffffff', 0.92),
      fundoSecundario: misturarCores(corPrincipal, '#ffffff', 0.93),
      chip: misturarCores(corSecundaria, '#ffffff', 0.95),
      chipTexto: misturarCores(corSecundaria, '#475569', 0.45),
    }
  }

  return base
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarQuantidade(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  })
}

function formatarQuantidadePublica(produto) {
  const unidade = String(produto.unidade || 'UN').trim().toUpperCase()
  return `${formatarQuantidade(produto.quantidadeDisponivel)} ${unidade}`
}

function chaveImagemProduto(produto) {
  return String(produto?.id ?? produto?.codigo ?? produto?.sku ?? produto?.nome ?? '').trim()
}

function imagemProdutoDisponivel(produto) {
  const chave = chaveImagemProduto(produto)

  if (!imagemProdutoUrl(produto)) {
    return false
  }

  return !imagensComErro.value[chave]
}

function imagemProdutoUrl(produto) {
  return normalizarUrlImagemPublica(String(produto?.imagemUrl || '').trim())
}

function normalizarData(valor) {
  if (!valor) {
    return null
  }

  const texto = String(valor).trim()
  const data = /^\d{4}-\d{2}-\d{2}$/.test(texto) ? new Date(`${texto}T00:00:00`) : new Date(texto)

  return Number.isNaN(data.getTime()) ? null : data
}

function formatarAtualizacaoProduto(produto) {
  const dataAtualizacao = normalizarData(produto.atualizadoEstoqueDiaEm || produto.dataEstoqueDia)

  if (!dataAtualizacao) {
    return ''
  }

  const agora = new Date()
  const ehHoje =
    dataAtualizacao.getFullYear() === agora.getFullYear() &&
    dataAtualizacao.getMonth() === agora.getMonth() &&
    dataAtualizacao.getDate() === agora.getDate()

  if (produto.atualizadoEstoqueDiaEm) {
    return ehHoje
      ? `Atualizado hoje as ${dataAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
      : `Atualizado em ${dataAtualizacao.toLocaleString('pt-BR', {
          day: '2-digit',
          month: '2-digit',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}`
  }

  return ehHoje
    ? 'Atualizado hoje'
    : `Estoque do dia em ${dataAtualizacao.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      })}`
}

function extrairIniciais(texto) {
  const palavras = String(texto || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!palavras.length) {
    return 'NM'
  }

  return palavras.map((parte) => parte.charAt(0).toUpperCase()).join('')
}

function selecionarCategoria(categoria) {
  categoriaAtiva.value = categoria
}

function limparFiltroCategoria() {
  categoriaAtiva.value = ''
}

function irParaCategorias() {
  categoriasRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}

function montarMensagemWhatsapp(produto) {
  const nomeEmpresa = empresa.value.nome || 'empresa'
  const linhas = [`Ola! Vim pelo catalogo da ${nomeEmpresa} e tenho interesse em: ${produto.nome}.`]

  if (produto.mostrarPrecoPublico && Number(produto.precoVenda || 0) > 0) {
    linhas.push(`Preco: ${formatarMoeda(produto.precoVenda)}.`)
  }

  linhas.push('Ainda esta disponivel?')

  return linhas.join('\n')
}

function linkWhatsappProduto(produto) {
  if (!temWhatsapp.value) {
    return ''
  }

  return `https://wa.me/${whatsappNumero.value}?text=${encodeURIComponent(montarMensagemWhatsapp(produto))}`
}

function abrirPreviaProduto(produto) {
  produtoSelecionado.value = produto
}

function fecharPreviaProduto() {
  produtoSelecionado.value = null
}

function aoFalharImagemProduto(produto) {
  const chave = chaveImagemProduto(produto)

  if (!chave) {
    return
  }

  imagensComErro.value = {
    ...imagensComErro.value,
    [chave]: true,
  }
}

function mensagemIndisponibilidadeCatalogo(errorAtual) {
  const status = Number(errorAtual?.status || 0)

  if ([401, 403, 404].includes(status)) {
    return 'Este catalogo publico nao foi encontrado ou nao esta disponivel no momento.'
  }

  if (status === 0) {
    return 'Nao foi possivel conectar ao catalogo agora. Verifique sua internet e tente novamente.'
  }

  return 'Nao foi possivel carregar o catalogo desta empresa agora.'
}

async function carregarCatalogo() {
  if (!slug.value) {
    carregando.value = false
    indisponivel.value = true
    erro.value = 'Link publico invalido. Confira o endereco e tente novamente.'
    return
  }

  try {
    carregando.value = true
    indisponivel.value = false
    erro.value = ''
    categoriaAtiva.value = ''
    categoriasResposta.value = []
    produtoSelecionado.value = null
    imagensComErro.value = {}

    const buscarVitrinePublica = acessandoViaCardapio.value ? buscarCardapioPublico : buscarCatalogoPublico
    const [empresaApi, personalizacaoApi, catalogoApi] = await Promise.all([
      buscarEmpresaPublica(slug.value),
      buscarPersonalizacaoPublica(slug.value).catch(() => null),
      buscarVitrinePublica(slug.value),
    ])

    empresa.value = {
      ...criarEmpresaPadrao(),
      ...normalizarObjeto(empresaApi),
    }
    personalizacao.value = {
      ...criarPersonalizacaoPadrao(),
      ...normalizarObjeto(personalizacaoApi),
    }
    produtos.value = normalizarLista(catalogoApi?.produtos || []).map(normalizarProdutoCatalogo)
    categoriasResposta.value = normalizarLista(catalogoApi?.categorias)
  } catch (errorAtual) {
    indisponivel.value = true
    erro.value = mensagemIndisponibilidadeCatalogo(errorAtual)
    console.error(errorAtual)
  } finally {
    carregando.value = false
  }
}

watch(
  produtoSelecionado,
  (produto) => {
    if (typeof document === 'undefined') {
      return
    }

    if (produto) {
      if (!scrollBloqueadoModal) {
        overflowBodyAnterior = document.body.style.overflow
        overflowHtmlAnterior = document.documentElement.style.overflow
        scrollBloqueadoModal = true
      }

      document.body.style.overflow = 'hidden'
      document.documentElement.style.overflow = 'hidden'
      return
    }

    if (scrollBloqueadoModal) {
      document.body.style.overflow = overflowBodyAnterior
      document.documentElement.style.overflow = overflowHtmlAnterior
      overflowBodyAnterior = ''
      overflowHtmlAnterior = ''
      scrollBloqueadoModal = false
    }
  },
  { immediate: true },
)

onBeforeUnmount(() => {
  if (typeof document !== 'undefined') {
    if (scrollBloqueadoModal) {
      document.body.style.overflow = overflowBodyAnterior
      document.documentElement.style.overflow = overflowHtmlAnterior
      overflowBodyAnterior = ''
      overflowHtmlAnterior = ''
      scrollBloqueadoModal = false
    } else {
      document.body.style.overflow = ''
      document.documentElement.style.overflow = ''
    }
  }
})
</script>

<template>
  <main class="catalogo-publico" :class="classeTemaCatalogo" :style="estilosCatalogo">
    <section v-if="carregando" class="card estado-shell">
      <span class="estado-selo">Carregando</span>
      <h1>Preparando a vitrine publica</h1>
      <p>Buscando os produtos publicados para este catalogo.</p>
    </section>

    <section v-else-if="indisponivel" class="card estado-shell">
      <span class="estado-selo erro">Indisponivel</span>
      <h1>Catalogo indisponivel no momento</h1>
      <p>{{ erro || 'Esta vitrine publica nao esta disponivel agora. Tente novamente mais tarde.' }}</p>
    </section>

    <template v-else>
      <header class="hero card">
        <div class="hero-banner-shell">
          <img v-if="bannerEmpresa" :src="bannerEmpresa" alt="Banner da empresa" class="hero-banner" />
          <div v-else class="hero-banner hero-banner-placeholder">
            <div class="hero-banner-texto">
              <span>Catalogo do dia</span>
              <strong>{{ empresa.nome || 'NuvemMais Gestao' }}</strong>
            </div>
          </div>
          <div class="hero-filtro"></div>
        </div>

        <div class="hero-conteudo">
          <div class="hero-principal">
            <div class="hero-identidade">
              <div class="logo-shell">
                <img v-if="logoEmpresa" :src="logoEmpresa" alt="Logo da empresa" class="logo-empresa" />
                <span v-else>{{ extrairIniciais(empresa.nome || tituloPagina) }}</span>
              </div>

              <div class="hero-textos">
                <p class="selo">Catalogo publico</p>
                <h1>{{ empresa.nome || 'Empresa' }}</h1>
                <p class="titulo">{{ tituloPagina }}</p>
                <p class="subtitulo">{{ descricaoCatalogo }}</p>
              </div>
            </div>

            <div class="hero-cta">
              <a v-if="temWhatsapp" class="botao-primario" :href="linkWhatsappContato" target="_blank" rel="noopener noreferrer">
                Pedir no WhatsApp
              </a>
              <button v-if="categorias.length" type="button" class="botao-secundario" @click="irParaCategorias">
                Ver categorias
              </button>
            </div>
          </div>

          <div class="hero-resumo">
            <article class="resumo-pill">
              <span>Disponiveis</span>
              <strong>{{ totalDisponiveis }}</strong>
              <small>Itens prontos para venda</small>
            </article>
            <article class="resumo-pill">
              <span>Destaques</span>
              <strong>{{ totalDestaques }}</strong>
              <small>Produtos em evidência</small>
            </article>
            <article class="resumo-pill">
              <span>Categorias</span>
              <strong>{{ quantidadeCategorias }}</strong>
              <small>Organização da vitrine</small>
            </article>
          </div>
        </div>
      </header>

      <section class="painel-superior">
        <article class="card painel-intro">
          <div class="painel-intro-topo">
            <div>
              <p class="painel-selo">Como comprar</p>
              <h2>Escolha um produto e finalize o pedido no WhatsApp</h2>
              <p>
                Esta vitrine nao possui carrinho, checkout ou pagamento online. O cliente escolhe o produto e fala direto com a empresa.
              </p>
            </div>

            <a v-if="temWhatsapp" class="botao-primario botao-bloco" :href="linkWhatsappContato" target="_blank" rel="noopener noreferrer">
              Abrir WhatsApp
            </a>
          </div>

          <div class="passos-compra">
            <article class="passo-compra">
              <span>1</span>
              <strong>Escolha</strong>
              <p>Veja os produtos, preços e disponibilidade do dia.</p>
            </article>
            <article class="passo-compra">
              <span>2</span>
              <strong>Chame</strong>
              <p>Toque no botao do WhatsApp para abrir a conversa pronta.</p>
            </article>
            <article class="passo-compra">
              <span>3</span>
              <strong>Confirme</strong>
              <p>Combine retirada, entrega e detalhes com a empresa.</p>
            </article>
          </div>
        </article>

        <article v-if="!temWhatsapp" class="card painel-aviso">
          <p class="painel-selo">Aviso</p>
          <h2>WhatsApp ainda nao configurado</h2>
          <p>Os produtos continuam visiveis, mas o botao de contato fica oculto ate a empresa informar um numero valido.</p>
        </article>
      </section>

      <section v-if="categorias.length" ref="categoriasRef" class="card filtros-categorias">
        <div class="filtros-topo">
          <div>
            <p class="painel-selo">Categorias</p>
            <h2>Filtre a vitrine</h2>
            <p class="filtros-subtitulo">A navegação fica mais rapida quando o cliente toca na categoria desejada.</p>
          </div>
          <div class="filtros-acoes">
            <span class="contador-filtros">{{ totalProdutosPublicados }} item(ns)</span>
            <button v-if="categoriaAtiva" type="button" class="link-limpar" @click="limparFiltroCategoria">Limpar filtro</button>
          </div>
        </div>

        <div class="chips">
          <button
            type="button"
            class="chip"
            :class="{ ativo: !categoriaAtiva }"
            @click="selecionarCategoria('')"
          >
            Todas
            <span>{{ totalProdutosPublicados }}</span>
          </button>
          <button
            v-for="categoria in categorias"
            :key="categoria.nome"
            type="button"
            class="chip"
            :class="{ ativo: categoriaAtiva === categoria.nome }"
            @click="selecionarCategoria(categoria.nome)"
          >
            {{ categoria.nome }}
            <span>{{ categoria.quantidade }}</span>
          </button>
        </div>
      </section>

      <section v-if="!produtosPublicados.length" class="card estado-shell">
        <span class="estado-selo">Vitrine vazia</span>
        <h2>Nenhum produto publicado no catalogo no momento.</h2>
        <p>A empresa ainda pode estar preparando o estoque do dia. Volte mais tarde ou chame no WhatsApp para consultar disponibilidade.</p>
        <a v-if="temWhatsapp" class="botao-primario" :href="linkWhatsappContato" target="_blank" rel="noopener noreferrer">
          Perguntar no WhatsApp
        </a>
      </section>

      <section v-else-if="!produtosFiltrados.length" class="card estado-shell">
        <span class="estado-selo">Sem resultados</span>
        <h2>Nenhum produto encontrado para esta categoria.</h2>
        <p>
          {{
            categoriaAtivaSelecionada
              ? `A categoria ${categoriaAtivaSelecionada.nome} nao possui itens publicados agora.`
              : 'Escolha outra categoria para visualizar os demais itens da vitrine.'
          }}
        </p>
        <div class="estado-acoes">
          <button type="button" class="botao-secundario" @click="limparFiltroCategoria">Ver todas as categorias</button>
          <a v-if="temWhatsapp" class="botao-primario" :href="linkWhatsappContato" target="_blank" rel="noopener noreferrer">
            Falar no WhatsApp
          </a>
        </div>
      </section>

      <section v-else class="secao-produtos">
        <div class="secao-produtos-topo">
          <div>
            <p class="painel-selo">Produtos</p>
            <h2>{{ categoriaAtivaSelecionada ? categoriaAtivaSelecionada.nome : 'Vitrine completa' }}</h2>
            <p>
              {{
                categoriaAtivaSelecionada
                  ? `${totalVisiveis} produto(s) nesta categoria.`
                  : `${totalVisiveis} produto(s) para explorar nesta vitrine.`
              }}
            </p>
          </div>

          <span class="contador-filtros">{{ totalVisiveis }} visiveis</span>
        </div>

        <div class="grid-produtos">
          <article v-for="produto in produtosFiltrados" :key="produto.id" class="card produto-card">
            <button
              type="button"
              class="produto-midia"
              :aria-label="`Abrir prévia de ${produto.nome}`"
              @click="abrirPreviaProduto(produto)"
            >
              <img
                v-if="imagemProdutoDisponivel(produto)"
                :src="imagemProdutoUrl(produto)"
                :alt="`Imagem de ${produto.nome}`"
                class="produto-imagem"
                @error="aoFalharImagemProduto(produto)"
              />
              <div v-else class="produto-placeholder">
                <span class="produto-placeholder-iniciais">{{ extrairIniciais(produto.nome) }}</span>
                <strong>{{ produto.categoriaPublica || 'Produto especial' }}</strong>
                <small>Toque para ampliar</small>
              </div>

              <div class="badges">
                <span class="badge" :class="produto.disponivel ? 'disponivel' : 'esgotado'">
                  {{ produto.disponivel ? 'Disponivel' : 'Esgotado' }}
                </span>
                <span v-if="produto.destaque" class="badge destaque">Destaque</span>
                <span v-if="formatarAtualizacaoProduto(produto)" class="badge atualizacao">{{ formatarAtualizacaoProduto(produto) }}</span>
              </div>
              <span class="produto-midia-acoes">Toque para ampliar</span>
            </button>

            <div class="produto-corpo">
              <div class="produto-cabecalho">
                <div>
                  <h2>{{ produto.nome }}</h2>
                  <p v-if="produto.categoriaPublica" class="categoria">{{ produto.categoriaPublica }}</p>
                </div>
              </div>

              <p v-if="produto.descricaoPublica" class="descricao">{{ produto.descricaoPublica }}</p>

              <div class="produto-infos">
                <p v-if="produto.mostrarPrecoPublico" class="preco">{{ formatarMoeda(produto.precoVenda) }}</p>
                <p v-if="produto.mostrarQuantidadePublica" class="quantidade">
                  Disponivel hoje: {{ formatarQuantidadePublica(produto) }}
                </p>
                <p v-if="!produto.disponivel" class="quantidade esgotado-texto">Estoque do dia encerrado no momento.</p>
              </div>

              <div class="produto-rodape">
                <a
                  v-if="temWhatsapp"
                  class="botao-whatsapp"
                  :class="{ secundario: !produto.disponivel }"
                  :href="linkWhatsappProduto(produto)"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {{ produto.disponivel ? produto.textoBotaoPublico || TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO : 'Perguntar no WhatsApp' }}
                </a>

                <p v-else class="aviso-card">WhatsApp da empresa nao informado.</p>
              </div>
            </div>
          </article>
        </div>
      </section>

      <teleport to="body">
        <transition name="modal-previa">
          <div v-if="produtoSelecionado" class="produto-modal" role="dialog" aria-modal="true" :aria-label="`Prévia de ${produtoSelecionado.nome}`" @click.self="fecharPreviaProduto">
            <div class="produto-modal-conteudo">
              <button type="button" class="produto-modal-fechar" aria-label="Fechar prévia" @click="fecharPreviaProduto">
                ×
              </button>

              <div class="produto-modal-midia">
                <img
                  v-if="imagemProdutoDisponivel(produtoSelecionado)"
                  :src="imagemProdutoUrl(produtoSelecionado)"
                  :alt="`Imagem ampliada de ${produtoSelecionado.nome}`"
                  class="produto-modal-imagem"
                  @error="aoFalharImagemProduto(produtoSelecionado)"
                />
                <div v-else class="produto-modal-placeholder">
                  <span class="produto-placeholder-iniciais">{{ extrairIniciais(produtoSelecionado.nome) }}</span>
                  <strong>{{ produtoSelecionado.categoriaPublica || 'Produto especial' }}</strong>
                  <small>Sem imagem disponível</small>
                </div>
              </div>

              <div class="produto-modal-corpo">
                <div class="produto-modal-cabecalho">
                  <p class="painel-selo">Prévia do produto</p>
                  <h2>{{ produtoSelecionado.nome }}</h2>
                  <p v-if="produtoSelecionado.categoriaPublica" class="produto-modal-categoria">{{ produtoSelecionado.categoriaPublica }}</p>
                </div>

                <div class="produto-modal-dados">
                  <p v-if="produtoSelecionado.mostrarPrecoPublico" class="produto-modal-preco">{{ formatarMoeda(produtoSelecionado.precoVenda) }}</p>
                  <p v-if="produtoSelecionado.mostrarQuantidadePublica" class="produto-modal-quantidade">
                    Disponivel hoje: {{ formatarQuantidadePublica(produtoSelecionado) }}
                  </p>
                  <p v-if="!produtoSelecionado.disponivel" class="produto-modal-quantidade produto-modal-esgotado">
                    Estoque do dia encerrado no momento.
                  </p>
                </div>

                <p v-if="produtoSelecionado.descricaoPublica" class="produto-modal-descricao">{{ produtoSelecionado.descricaoPublica }}</p>

                <div class="produto-modal-acoes">
                  <a
                    v-if="temWhatsapp"
                    class="botao-whatsapp botao-whatsapp-modal"
                    :href="linkWhatsappProduto(produtoSelecionado)"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    {{ produtoSelecionado.disponivel ? produtoSelecionado.textoBotaoPublico || TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO : 'Perguntar no WhatsApp' }}
                  </a>
                  <button type="button" class="botao-secundario botao-fechar-modal" @click="fecharPreviaProduto">
                    Fechar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </transition>
      </teleport>
    </template>
  </main>
</template>

<style scoped>
.catalogo-publico {
  --catalogo-bg: var(--catalogo-cor-fundo);
  --catalogo-card: var(--catalogo-cor-card);
  --catalogo-borda: var(--catalogo-cor-borda);
  --catalogo-texto: var(--catalogo-cor-texto);
  --catalogo-texto-suave: var(--catalogo-cor-texto-suave);
  --catalogo-destaque: var(--catalogo-cor-destaque);
  --catalogo-destaque-suave: var(--catalogo-cor-fundo-secundario);
  --catalogo-sucesso: var(--catalogo-cor-sucesso);
  --catalogo-sucesso-suave: var(--catalogo-cor-sucesso-suave);
  --catalogo-perigo: var(--catalogo-cor-perigo);
  --catalogo-perigo-suave: var(--catalogo-cor-perigo-suave);
  --catalogo-azul: var(--catalogo-cor-secundaria);
  --catalogo-azul-suave: var(--catalogo-cor-chip);
  min-height: 100vh;
  padding: 14px;
  display: grid;
  gap: 14px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--catalogo-cor-principal), transparent 82%), transparent 28%),
    radial-gradient(circle at top right, color-mix(in srgb, var(--catalogo-cor-secundaria), transparent 84%), transparent 24%),
    linear-gradient(180deg, color-mix(in srgb, var(--catalogo-cor-hero), white 28%) 0%, var(--catalogo-bg) 55%, color-mix(in srgb, var(--catalogo-bg), #e2e8f0 22%) 100%);
  color: var(--catalogo-texto);
}

.card {
  background: var(--catalogo-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--catalogo-borda);
  border-radius: 24px;
  box-shadow: 0 16px 34px rgba(15, 23, 42, 0.08);
}

.hero {
  overflow: hidden;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--catalogo-cor-hero), transparent 12%), transparent),
    var(--catalogo-card);
}

.hero-banner-shell {
  position: relative;
  min-height: 140px;
}

.hero-banner {
  width: 100%;
  min-height: 140px;
  max-height: 210px;
  object-fit: cover;
  display: block;
}

.hero-banner-placeholder {
  display: grid;
  place-items: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.26), transparent 28%),
    linear-gradient(135deg, var(--catalogo-cor-principal), var(--catalogo-cor-secundaria));
}

.hero-banner-texto {
  display: grid;
  gap: 6px;
  text-align: center;
  color: white;
  padding: 18px;
}

.hero-banner-texto span {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 800;
}

.hero-banner-texto strong {
  font-size: clamp(22px, 5vw, 34px);
  font-weight: 900;
}

.hero-filtro {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.04), var(--catalogo-cor-overlay));
  pointer-events: none;
}

.hero-conteudo {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.hero-principal {
  display: grid;
  gap: 16px;
}

.hero-identidade {
  display: grid;
  gap: 16px;
}

.logo-shell {
  width: 72px;
  height: 72px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(135deg, color-mix(in srgb, var(--catalogo-cor-principal), white 86%), #ffffff);
  box-shadow: 0 12px 30px color-mix(in srgb, var(--catalogo-cor-principal), transparent 82%);
  display: grid;
  place-items: center;
  overflow: hidden;
  color: var(--catalogo-destaque);
  font-size: 24px;
  font-weight: 900;
}

.logo-empresa {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.hero-textos {
  display: grid;
  gap: 6px;
}

.hero-textos h1,
.hero-textos h2,
.hero-textos p,
.estado-shell h1,
.estado-shell h2,
.estado-shell p,
.produto-card h2,
.produto-card p,
.painel-intro h2,
.painel-intro p,
.painel-aviso h2,
.painel-aviso p {
  margin: 0;
}

.selo,
.painel-selo,
.estado-selo {
  display: inline-flex;
  width: fit-content;
  align-items: center;
  gap: 6px;
  border-radius: 999px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--catalogo-cor-principal), white 86%);
  color: var(--catalogo-destaque);
  text-transform: uppercase;
  letter-spacing: 0.08em;
  font-size: 11px;
  font-weight: 800;
}

.estado-selo.erro {
  background: var(--catalogo-perigo-suave);
  color: var(--catalogo-perigo);
}

.hero-textos h1 {
  font-size: clamp(28px, 6vw, 42px);
  font-weight: 900;
  line-height: 1.05;
}

.titulo {
  font-size: 17px;
  font-weight: 800;
}

.subtitulo {
  color: var(--catalogo-texto-suave);
  line-height: 1.6;
}

.hero-resumo {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.resumo-pill {
  display: grid;
  gap: 4px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--catalogo-cor-card), white 18%);
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-secundaria), white 82%);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.72);
}

.resumo-pill span {
  color: var(--catalogo-texto-suave);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.resumo-pill strong {
  font-size: 24px;
  font-weight: 900;
}

.resumo-pill small {
  color: var(--catalogo-texto-suave);
  font-size: 12px;
  line-height: 1.35;
}

.hero-cta {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao-primario,
.botao-secundario {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 46px;
  border-radius: 16px;
  padding: 12px 16px;
  font: inherit;
  font-weight: 900;
  text-decoration: none;
  cursor: pointer;
  transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.botao-primario {
  background: linear-gradient(135deg, var(--catalogo-cor-botao), color-mix(in srgb, var(--catalogo-cor-botao), #000000 18%));
  color: var(--catalogo-cor-botao-texto);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--catalogo-cor-botao), transparent 78%);
  border: 1px solid rgba(255, 255, 255, 0.16);
}

.botao-secundario {
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-secundaria), white 76%);
  background: color-mix(in srgb, var(--catalogo-cor-secundaria), white 92%);
  color: color-mix(in srgb, var(--catalogo-cor-secundaria), #0f172a 28%);
}

.botao-primario:hover,
.botao-secundario:hover,
.chip:hover,
.link-limpar:hover {
  transform: translateY(-1px);
}

.painel-superior {
  display: grid;
  gap: 16px;
}

.painel-intro,
.painel-aviso,
.filtros-categorias,
.estado-shell {
  padding: 18px;
}

.painel-intro-topo,
.secao-produtos-topo {
  display: grid;
  gap: 14px;
}

.painel-intro p:last-child,
.painel-aviso p:last-child,
.estado-shell p:last-child {
  color: var(--catalogo-texto-suave);
  line-height: 1.6;
}

.painel-intro h2,
.painel-aviso h2,
.secao-produtos-topo h2,
.filtros-topo h2 {
  font-size: clamp(22px, 4vw, 30px);
  line-height: 1.1;
  font-weight: 900;
}

.passos-compra {
  display: grid;
  gap: 12px;
  margin-top: 18px;
}

.passo-compra {
  display: grid;
  gap: 6px;
  padding: 14px;
  border-radius: 18px;
  background: color-mix(in srgb, var(--catalogo-cor-principal), white 92%);
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-principal), white 74%);
}

.passo-compra span {
  width: 28px;
  height: 28px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: linear-gradient(135deg, color-mix(in srgb, var(--catalogo-cor-principal), white 80%), color-mix(in srgb, var(--catalogo-cor-secundaria), white 76%));
  color: var(--catalogo-destaque);
  font-weight: 900;
  font-size: 13px;
}

.passo-compra strong {
  font-size: 15px;
  font-weight: 900;
}

.passo-compra p {
  color: var(--catalogo-texto-suave);
  line-height: 1.5;
  font-size: 14px;
}

.botao-bloco {
  width: 100%;
}

.filtros-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.filtros-subtitulo {
  margin-top: 6px;
  color: var(--catalogo-texto-suave);
  line-height: 1.55;
}

.filtros-acoes {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.contador-filtros {
  border-radius: 999px;
  padding: 8px 12px;
  background: color-mix(in srgb, var(--catalogo-cor-principal), white 88%);
  color: var(--catalogo-destaque);
  font-size: 13px;
  font-weight: 800;
}

.link-limpar {
  border: 0;
  background: transparent;
  color: var(--catalogo-azul);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
}

.chips {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-secundaria), white 78%);
  border-radius: 999px;
  padding: 10px 14px;
  background: var(--catalogo-cor-chip);
  color: var(--catalogo-cor-chip-texto);
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 8px 18px rgba(15, 23, 42, 0.04);
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease, box-shadow 0.18s ease;
}

.chip span {
  border-radius: 999px;
  padding: 2px 8px;
  background: color-mix(in srgb, var(--catalogo-cor-secundaria), white 84%);
  font-size: 12px;
}

.chip.ativo {
  border-color: color-mix(in srgb, var(--catalogo-cor-principal), #0f172a 12%);
  background: linear-gradient(135deg, color-mix(in srgb, var(--catalogo-cor-principal), white 86%), color-mix(in srgb, var(--catalogo-cor-secundaria), white 86%));
  color: var(--catalogo-destaque);
  transform: translateY(-1px);
  box-shadow: 0 12px 22px color-mix(in srgb, var(--catalogo-cor-principal), transparent 86%);
}

.estado-shell {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.estado-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.estado-shell h1,
.estado-shell h2 {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 900;
}

.grid-produtos {
  display: grid;
  gap: 14px;
}

.produto-card {
  overflow: hidden;
  padding: 0;
  display: flex;
  flex-direction: column;
  min-height: 100%;
  transition: transform 0.18s ease, box-shadow 0.18s ease;
}

.produto-midia {
  appearance: none;
  border: 0;
  padding: 0;
  background: transparent;
  display: block;
  position: relative;
  width: 100%;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  cursor: pointer;
  text-align: inherit;
  outline: none;
}

.produto-imagem,
.produto-placeholder {
  width: 100%;
  height: 100%;
}

.produto-imagem {
  object-fit: cover;
  display: block;
  transform: scale(1);
  transition: transform 0.28s ease, filter 0.28s ease;
}

.produto-placeholder {
  display: grid;
  place-items: center;
  gap: 6px;
  background:
    radial-gradient(circle at top left, color-mix(in srgb, var(--catalogo-cor-principal), white 62%), transparent 28%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--catalogo-cor-secundaria), transparent 84%), transparent 28%),
    linear-gradient(135deg, color-mix(in srgb, var(--catalogo-cor-principal), white 84%), color-mix(in srgb, var(--catalogo-cor-secundaria), white 80%));
  color: var(--catalogo-destaque);
  text-align: center;
  position: relative;
  overflow: hidden;
  padding: 18px;
}

.produto-midia:hover .produto-imagem,
.produto-midia:focus-visible .produto-imagem {
  transform: scale(1.05);
  filter: saturate(1.04) contrast(1.02);
}

.produto-midia:focus-visible {
  box-shadow: inset 0 0 0 2px color-mix(in srgb, var(--catalogo-cor-principal), transparent 72%);
}

.produto-midia-acoes {
  position: absolute;
  right: 12px;
  bottom: 12px;
  z-index: 1;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 10px;
  background: rgba(15, 23, 42, 0.56);
  color: white;
  font-size: 11px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
  backdrop-filter: blur(8px);
}

.produto-placeholder::before,
.produto-placeholder::after {
  content: '';
  position: absolute;
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.45);
  filter: blur(2px);
}

.produto-placeholder::before {
  width: 90px;
  height: 90px;
  top: -24px;
  right: -18px;
}

.produto-placeholder::after {
  width: 120px;
  height: 120px;
  bottom: -52px;
  left: -42px;
}

.produto-placeholder-iniciais {
  position: relative;
  z-index: 1;
  width: 60px;
  height: 60px;
  display: grid;
  place-items: center;
  border-radius: 22px;
  background: rgba(255, 255, 255, 0.82);
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-principal), white 84%);
  font-size: 28px;
  font-weight: 900;
  letter-spacing: 0.04em;
}

.produto-placeholder strong,
.produto-placeholder small {
  position: relative;
  z-index: 1;
}

.produto-placeholder strong {
  font-size: 13px;
  font-weight: 900;
}

.produto-placeholder small {
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}

.badges {
  position: absolute;
  top: 12px;
  left: 12px;
  right: 12px;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.05em;
  backdrop-filter: blur(8px);
}

.badge.disponivel {
  background: rgba(220, 252, 231, 0.96);
  color: var(--catalogo-sucesso);
}

.badge.esgotado {
  background: rgba(254, 226, 226, 0.96);
  color: var(--catalogo-perigo);
}

.badge.destaque {
  background: color-mix(in srgb, var(--catalogo-cor-principal), white 84%);
  color: var(--catalogo-destaque);
}

.badge.atualizacao {
  background: color-mix(in srgb, var(--catalogo-cor-secundaria), white 82%);
  color: var(--catalogo-azul);
}

.produto-corpo {
  display: grid;
  gap: 12px;
  padding: 16px;
  flex: 1;
}

.produto-cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.produto-cabecalho h2 {
  font-size: 20px;
  font-weight: 900;
  line-height: 1.15;
}

.categoria {
  margin-top: 6px;
  color: var(--catalogo-cor-principal);
  font-size: 14px;
  font-weight: 800;
}

.descricao {
  color: var(--catalogo-texto-suave);
  line-height: 1.55;
  font-size: 14px;
}

.produto-infos {
  display: grid;
  gap: 6px;
  padding: 12px;
  border-radius: 16px;
  background: color-mix(in srgb, var(--catalogo-cor-fundo-secundario), white 20%);
  border: 1px solid color-mix(in srgb, var(--catalogo-cor-secundaria), white 84%);
}

.preco {
  color: var(--catalogo-cor-principal);
  font-size: 22px;
  font-weight: 900;
}

.quantidade {
  color: color-mix(in srgb, var(--catalogo-cor-secundaria), #334155 48%);
  font-size: 14px;
  font-weight: 700;
}

.esgotado-texto {
  color: var(--catalogo-perigo);
}

.produto-rodape {
  display: grid;
  gap: 10px;
  margin-top: auto;
}

.botao-whatsapp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 44px;
  border-radius: 14px;
  padding: 10px 14px;
  background: linear-gradient(135deg, var(--catalogo-cor-botao), color-mix(in srgb, var(--catalogo-cor-botao), #000000 18%));
  color: var(--catalogo-cor-botao-texto);
  text-decoration: none;
  font-weight: 900;
  box-shadow: 0 12px 24px color-mix(in srgb, var(--catalogo-cor-botao), transparent 78%);
  transition: transform 0.18s ease, box-shadow 0.18s ease, filter 0.18s ease;
}

.botao-whatsapp.secundario {
  background: linear-gradient(135deg, var(--catalogo-cor-secundaria), color-mix(in srgb, var(--catalogo-cor-secundaria), #000000 16%));
  color: var(--catalogo-cor-botao-texto);
  box-shadow: 0 12px 24px color-mix(in srgb, var(--catalogo-cor-secundaria), transparent 80%);
}

.aviso-card {
  color: var(--catalogo-texto-suave);
  font-size: 14px;
}

.produto-modal {
  position: fixed;
  inset: 0;
  z-index: 80;
  padding: clamp(10px, 2vw, 22px);
  background: rgba(15, 23, 42, 0.76);
  backdrop-filter: blur(14px);
  display: grid;
  place-items: center;
  overflow: auto;
}

.produto-modal-conteudo {
  position: relative;
  width: min(100%, 1240px);
  max-height: min(calc(100dvh - 32px), 940px);
  overflow: hidden;
  background: var(--catalogo-cor-modal);
  border-radius: 30px;
  border: 0;
  outline: 0;
  box-shadow: 0 34px 80px rgba(15, 23, 42, 0.3);
  display: grid;
  align-items: stretch;
  background-clip: padding-box;
}

.produto-modal-fechar {
  position: absolute;
  top: 12px;
  right: 12px;
  width: 42px;
  height: 42px;
  border: 0;
  border-radius: 999px;
  background: color-mix(in srgb, var(--catalogo-cor-secundaria), #000000 26%);
  color: var(--catalogo-cor-botao-texto);
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  z-index: 2;
}

.produto-modal-midia {
  position: relative;
  min-height: 0;
  display: flex;
  align-items: stretch;
  justify-content: stretch;
  padding: 18px;
  background:
    radial-gradient(circle at top left, rgba(255, 255, 255, 0.88), transparent 34%),
    var(--catalogo-cor-modal-midia);
}

.produto-modal-imagem,
.produto-modal-placeholder {
  width: 100%;
  height: 100%;
  min-height: 340px;
  display: block;
  border-radius: 22px;
}

.produto-modal-imagem {
  object-fit: contain;
  background: linear-gradient(180deg, color-mix(in srgb, var(--catalogo-cor-principal), white 88%), rgba(255, 255, 255, 0.98));
}

.produto-modal-placeholder {
  display: grid;
  place-items: center;
  gap: 8px;
  text-align: center;
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.35), transparent 28%),
    radial-gradient(circle at bottom right, color-mix(in srgb, var(--catalogo-cor-secundaria), transparent 84%), transparent 30%),
    linear-gradient(135deg, color-mix(in srgb, var(--catalogo-cor-principal), white 84%), color-mix(in srgb, var(--catalogo-cor-secundaria), white 78%));
  color: var(--catalogo-destaque);
  padding: 28px;
}

.produto-modal-placeholder .produto-placeholder-iniciais {
  width: 104px;
  height: 104px;
  font-size: 40px;
}

.produto-modal-corpo {
  display: grid;
  gap: 18px;
  padding: 28px;
  min-height: 0;
}

.produto-modal-cabecalho {
  display: grid;
  gap: 8px;
  padding-right: 56px;
}

.produto-modal-cabecalho h2 {
  font-size: clamp(24px, 4vw, 34px);
  font-weight: 900;
  line-height: 1.08;
  margin: 0;
}

.produto-modal-categoria {
  margin: 0;
  color: var(--catalogo-cor-principal);
  font-weight: 700;
}

.produto-modal-dados {
  display: grid;
  gap: 8px;
}

.produto-modal-preco {
  color: var(--catalogo-cor-principal);
  font-size: clamp(24px, 5vw, 34px);
  font-weight: 900;
  margin: 0;
}

.produto-modal-quantidade,
.produto-modal-descricao {
  margin: 0;
  color: var(--catalogo-texto-suave);
  line-height: 1.6;
}

.produto-modal-esgotado {
  color: var(--catalogo-perigo);
  font-weight: 700;
}

.produto-modal-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao-whatsapp-modal,
.botao-fechar-modal {
  flex: 1 1 180px;
}

.modal-previa-enter-active,
.modal-previa-leave-active {
  transition: opacity 0.18s ease;
}

.modal-previa-enter-from,
.modal-previa-leave-to {
  opacity: 0;
}

.catalogo-publico.tema-moderno .card {
  border-radius: 28px;
  box-shadow: 0 24px 52px color-mix(in srgb, var(--catalogo-cor-secundaria), transparent 88%);
}

.catalogo-publico.tema-moderno .botao-primario,
.catalogo-publico.tema-moderno .botao-secundario,
.catalogo-publico.tema-moderno .botao-whatsapp {
  border-radius: 999px;
}

.catalogo-publico.tema-moderno .produto-card {
  box-shadow: 0 20px 40px color-mix(in srgb, var(--catalogo-cor-principal), transparent 90%);
}

.catalogo-publico.tema-escuro .card {
  box-shadow: 0 18px 48px rgba(0, 0, 0, 0.28);
}

.catalogo-publico.tema-escuro .resumo-pill,
.catalogo-publico.tema-escuro .passo-compra,
.catalogo-publico.tema-escuro .produto-infos,
.catalogo-publico.tema-escuro .chip,
.catalogo-publico.tema-escuro .produto-midia-acoes {
  background: color-mix(in srgb, var(--catalogo-cor-fundo-secundario), #020617 10%);
}

.catalogo-publico.tema-escuro .botao-secundario {
  color: #e5e7eb;
}

.catalogo-publico.tema-suave .card {
  box-shadow: 0 12px 28px color-mix(in srgb, var(--catalogo-cor-principal), transparent 92%);
}

.catalogo-publico.tema-suave .produto-card,
.catalogo-publico.tema-suave .resumo-pill {
  border-radius: 22px;
}

@media (min-width: 720px) {
  .catalogo-publico {
    padding: 22px;
    gap: 18px;
  }

  .hero-identidade {
    grid-template-columns: auto minmax(0, 1fr);
    align-items: center;
  }

  .painel-intro-topo,
  .secao-produtos-topo {
    grid-template-columns: minmax(0, 1fr) auto;
    align-items: start;
  }

  .painel-superior {
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  }

  .passos-compra {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }

  .grid-produtos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .produto-modal-conteudo {
    grid-template-columns: minmax(0, 1.35fr) minmax(340px, 0.9fr);
  }

  .produto-modal-midia {
    min-height: 100%;
    border-right: 1px solid rgba(148, 163, 184, 0.18);
  }

  .produto-modal-imagem,
  .produto-modal-placeholder {
    min-height: clamp(420px, 58vh, 760px);
  }

  .produto-modal-corpo {
    align-content: start;
    overflow: auto;
  }
}

@media (min-width: 1080px) {
  .catalogo-publico {
    padding: 28px;
  }

  .hero-conteudo {
    grid-template-columns: minmax(0, 1.3fr) minmax(260px, 0.7fr);
    align-items: end;
  }

  .grid-produtos {
    grid-template-columns: repeat(3, minmax(0, 1fr));
  }
}

@media (min-width: 1320px) {
  .grid-produtos {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .hero-banner-shell,
  .hero-banner {
    min-height: 120px;
  }

  .hero-conteudo,
  .painel-intro,
  .painel-aviso,
  .filtros-categorias,
  .estado-shell {
    padding: 16px;
  }

  .hero-resumo {
    grid-template-columns: 1fr;
  }

  .filtros-topo,
  .produto-cabecalho {
    flex-direction: column;
  }

  .chip {
    width: 100%;
    justify-content: space-between;
  }

  .estado-acoes,
  .hero-cta {
    width: 100%;
  }

  .botao-primario,
  .botao-secundario {
    width: 100%;
  }
}

@media (max-width: 719px) {
  .produto-modal {
    padding: 8px;
  }

  .produto-modal-conteudo {
    width: min(100%, calc(100vw - 16px));
    max-height: calc(100dvh - 16px);
  }

  .produto-modal-midia {
    padding: 14px 14px 0;
  }

  .produto-modal-imagem,
  .produto-modal-placeholder {
    min-height: min(52vh, 420px);
  }

  .produto-modal-corpo {
    padding: 18px 18px 20px;
  }

  .produto-midia-acoes {
    right: 10px;
    bottom: 10px;
    font-size: 10px;
  }
}
</style>
