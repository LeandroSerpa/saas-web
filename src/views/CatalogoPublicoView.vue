<script setup>
import { computed, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  TEXTO_BOTAO_CATALOGO_PUBLICO_PADRAO,
  buscarCatalogoPublico,
  buscarEmpresaPublica,
  buscarPersonalizacaoPublica,
  normalizarProdutoCatalogoPublico,
} from '@/services/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())

const carregando = ref(true)
const indisponivel = ref(false)
const erro = ref('')
const empresa = ref(criarEmpresaPadrao())
const personalizacao = ref(criarPersonalizacaoPadrao())
const produtos = ref([])
const categoriasResposta = ref([])
const categoriaAtiva = ref('')

const produtosPublicados = computed(() =>
  produtos.value
    .filter((item) => item.exibirCatalogoPublico !== false)
    .sort((a, b) => {
      const ordemA = Number.isFinite(a.ordemCatalogo) ? a.ordemCatalogo : Number.MAX_SAFE_INTEGER
      const ordemB = Number.isFinite(b.ordemCatalogo) ? b.ordemCatalogo : Number.MAX_SAFE_INTEGER

      return ordemA - ordemB || Number(b.destaqueCatalogo) - Number(a.destaqueCatalogo) || a.nome.localeCompare(b.nome, 'pt-BR')
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
const totalDisponiveis = computed(() => produtosPublicados.value.filter((item) => item.disponivel).length)
const totalDestaques = computed(() => produtosPublicados.value.filter((item) => item.destaqueCatalogo).length)
const quantidadeCategorias = computed(() => categorias.value.length)

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
  return `${formatarQuantidade(produto.quantidadeAtual)} ${unidade}`
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

function montarMensagemWhatsapp(produto) {
  const linhas = [`Ola! Vim pelo catalogo da NuvemMais e tenho interesse em: ${produto.nome}.`]

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

async function carregarCatalogo() {
  if (!slug.value) {
    carregando.value = false
    indisponivel.value = true
    erro.value = 'Catalogo publico invalido.'
    return
  }

  try {
    carregando.value = true
    indisponivel.value = false
    erro.value = ''
    categoriaAtiva.value = ''
    categoriasResposta.value = []

    const [empresaApi, personalizacaoApi, catalogoApi] = await Promise.all([
      buscarEmpresaPublica(slug.value),
      buscarPersonalizacaoPublica(slug.value).catch(() => null),
      buscarCatalogoPublico(slug.value),
    ])

    empresa.value = {
      ...criarEmpresaPadrao(),
      ...normalizarObjeto(empresaApi),
    }
    personalizacao.value = {
      ...criarPersonalizacaoPadrao(),
      ...normalizarObjeto(personalizacaoApi),
    }
    produtos.value = normalizarLista(catalogoApi?.produtos ?? catalogoApi).map(normalizarProdutoCatalogoPublico)
    categoriasResposta.value = normalizarLista(catalogoApi?.categorias)
  } catch (errorAtual) {
    indisponivel.value = true
    erro.value = 'Nao foi possivel carregar o catalogo desta empresa agora.'
    console.error(errorAtual)
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="catalogo-publico">
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

          <div class="hero-resumo">
            <article class="resumo-pill">
              <span>Disponiveis</span>
              <strong>{{ totalDisponiveis }}</strong>
            </article>
            <article class="resumo-pill">
              <span>Destaques</span>
              <strong>{{ totalDestaques }}</strong>
            </article>
            <article class="resumo-pill">
              <span>Categorias</span>
              <strong>{{ quantidadeCategorias }}</strong>
            </article>
          </div>
        </div>
      </header>

      <section class="painel-superior">
        <article class="card painel-intro">
          <p class="painel-selo">Como comprar</p>
          <h2>Escolha um produto e chame no WhatsApp</h2>
          <p>
            Esta vitrine nao possui carrinho, pedido, pagamento ou checkout nesta fase.
            O atendimento acontece direto com a empresa.
          </p>
        </article>

        <article v-if="!temWhatsapp" class="card painel-aviso">
          <p class="painel-selo">Aviso</p>
          <h2>WhatsApp ainda nao configurado</h2>
          <p>Os produtos continuam visiveis, mas o botao de contato fica oculto ate a empresa informar um numero valido.</p>
        </article>
      </section>

      <section v-if="categorias.length" class="card filtros-categorias">
        <div class="filtros-topo">
          <div>
            <p class="painel-selo">Categorias</p>
            <h2>Filtre a vitrine</h2>
          </div>
          <span class="contador-filtros">{{ produtosPublicados.length }} item(ns)</span>
        </div>

        <div class="chips">
          <button
            type="button"
            class="chip"
            :class="{ ativo: !categoriaAtiva }"
            @click="selecionarCategoria('')"
          >
            Todas
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
      </section>

      <section v-else-if="!produtosFiltrados.length" class="card estado-shell">
        <span class="estado-selo">Sem resultados</span>
        <h2>Nenhum produto encontrado para esta categoria.</h2>
        <p>Escolha outra categoria para visualizar os demais itens da vitrine.</p>
      </section>

      <section v-else class="grid-produtos">
        <article v-for="produto in produtosFiltrados" :key="produto.id" class="card produto-card">
          <div class="produto-midia">
            <img
              v-if="produto.imagemUrl"
              :src="produto.imagemUrl"
              :alt="`Imagem de ${produto.nome}`"
              class="produto-imagem"
            />
            <div v-else class="produto-placeholder">
              <span>{{ extrairIniciais(produto.nome) }}</span>
              <small>Imagem em breve</small>
            </div>

            <div class="badges">
              <span class="badge" :class="produto.disponivel ? 'disponivel' : 'esgotado'">
                {{ produto.disponivel ? 'Disponivel' : 'Esgotado hoje' }}
              </span>
              <span v-if="produto.destaqueCatalogo" class="badge destaque">Destaque</span>
              <span v-if="formatarAtualizacaoProduto(produto)" class="badge atualizacao">{{ formatarAtualizacaoProduto(produto) }}</span>
            </div>
          </div>

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
      </section>
    </template>
  </main>
</template>

<style scoped>
.catalogo-publico {
  --catalogo-bg: #f8f4ed;
  --catalogo-card: rgba(255, 255, 255, 0.92);
  --catalogo-borda: rgba(148, 163, 184, 0.24);
  --catalogo-texto: #1f2937;
  --catalogo-texto-suave: #5b6474;
  --catalogo-destaque: #c2410c;
  --catalogo-destaque-suave: #ffedd5;
  --catalogo-sucesso: #166534;
  --catalogo-sucesso-suave: #dcfce7;
  --catalogo-perigo: #b91c1c;
  --catalogo-perigo-suave: #fee2e2;
  min-height: 100vh;
  padding: 14px;
  display: grid;
  gap: 16px;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.22), transparent 28%),
    radial-gradient(circle at top right, rgba(234, 88, 12, 0.18), transparent 24%),
    linear-gradient(180deg, #fffaf2 0%, var(--catalogo-bg) 55%, #f3f4f6 100%);
  color: var(--catalogo-texto);
}

.card {
  background: var(--catalogo-card);
  backdrop-filter: blur(10px);
  border: 1px solid var(--catalogo-borda);
  border-radius: 24px;
  box-shadow: 0 18px 40px rgba(15, 23, 42, 0.08);
}

.hero {
  overflow: hidden;
}

.hero-banner-shell {
  position: relative;
  min-height: 180px;
}

.hero-banner {
  width: 100%;
  min-height: 180px;
  max-height: 280px;
  object-fit: cover;
  display: block;
}

.hero-banner-placeholder {
  display: grid;
  place-items: center;
  background:
    linear-gradient(135deg, rgba(194, 65, 12, 0.92), rgba(251, 191, 36, 0.88)),
    linear-gradient(45deg, rgba(255, 255, 255, 0.16), rgba(255, 255, 255, 0));
}

.hero-banner-texto {
  display: grid;
  gap: 6px;
  text-align: center;
  color: white;
}

.hero-banner-texto span {
  text-transform: uppercase;
  letter-spacing: 0.18em;
  font-size: 12px;
  font-weight: 800;
}

.hero-banner-texto strong {
  font-size: clamp(24px, 5vw, 38px);
  font-weight: 900;
}

.hero-filtro {
  position: absolute;
  inset: 0;
  background: linear-gradient(180deg, rgba(15, 23, 42, 0.02), rgba(15, 23, 42, 0.18));
  pointer-events: none;
}

.hero-conteudo {
  display: grid;
  gap: 18px;
  padding: 18px;
}

.hero-identidade {
  display: grid;
  gap: 16px;
}

.logo-shell {
  width: 78px;
  height: 78px;
  border-radius: 24px;
  border: 1px solid rgba(255, 255, 255, 0.42);
  background: linear-gradient(135deg, #fff7ed, #ffffff);
  box-shadow: 0 12px 30px rgba(194, 65, 12, 0.12);
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
  background: rgba(255, 237, 213, 0.95);
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
  font-size: 18px;
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
  background: rgba(255, 255, 255, 0.7);
  border: 1px solid rgba(255, 237, 213, 0.86);
}

.resumo-pill span {
  color: var(--catalogo-texto-suave);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
}

.resumo-pill strong {
  font-size: 26px;
  font-weight: 900;
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

.painel-intro p:last-child,
.painel-aviso p:last-child,
.estado-shell p:last-child {
  color: var(--catalogo-texto-suave);
  line-height: 1.6;
}

.filtros-topo {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
  margin-bottom: 14px;
}

.contador-filtros {
  border-radius: 999px;
  padding: 8px 12px;
  background: rgba(194, 65, 12, 0.08);
  color: var(--catalogo-destaque);
  font-size: 13px;
  font-weight: 800;
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
  border: 1px solid rgba(148, 163, 184, 0.34);
  border-radius: 999px;
  padding: 10px 14px;
  background: white;
  color: #475569;
  font: inherit;
  font-weight: 800;
  cursor: pointer;
  transition: transform 0.18s ease, border-color 0.18s ease, background 0.18s ease;
}

.chip span {
  border-radius: 999px;
  padding: 2px 8px;
  background: rgba(148, 163, 184, 0.14);
  font-size: 12px;
}

.chip.ativo {
  border-color: rgba(194, 65, 12, 0.42);
  background: linear-gradient(135deg, #fff7ed, #ffedd5);
  color: var(--catalogo-destaque);
  transform: translateY(-1px);
}

.estado-shell {
  display: grid;
  gap: 12px;
  justify-items: start;
}

.estado-shell h1,
.estado-shell h2 {
  font-size: clamp(24px, 5vw, 32px);
  font-weight: 900;
}

.grid-produtos {
  display: grid;
  gap: 16px;
}

.produto-card {
  overflow: hidden;
  padding: 0;
}

.produto-midia {
  position: relative;
}

.produto-imagem,
.produto-placeholder {
  width: 100%;
  aspect-ratio: 4 / 3;
}

.produto-imagem {
  object-fit: cover;
  display: block;
}

.produto-placeholder {
  display: grid;
  place-items: center;
  gap: 4px;
  background:
    radial-gradient(circle at top left, rgba(251, 191, 36, 0.45), transparent 35%),
    linear-gradient(135deg, #fff7ed, #fde68a);
  color: #9a3412;
}

.produto-placeholder span {
  font-size: 34px;
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
  background: rgba(255, 237, 213, 0.96);
  color: var(--catalogo-destaque);
}

.badge.atualizacao {
  background: rgba(219, 234, 254, 0.96);
  color: #1d4ed8;
}

.produto-corpo {
  display: grid;
  gap: 14px;
  padding: 18px;
}

.produto-cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
}

.produto-cabecalho h2 {
  font-size: 22px;
  font-weight: 900;
  line-height: 1.15;
}

.categoria {
  margin-top: 6px;
  color: var(--catalogo-destaque);
  font-size: 14px;
  font-weight: 800;
}

.descricao {
  color: var(--catalogo-texto-suave);
  line-height: 1.6;
}

.produto-infos {
  display: grid;
  gap: 8px;
}

.preco {
  color: var(--catalogo-sucesso);
  font-size: 24px;
  font-weight: 900;
}

.quantidade {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.esgotado-texto {
  color: var(--catalogo-perigo);
}

.produto-rodape {
  display: grid;
  gap: 10px;
}

.botao-whatsapp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  min-height: 48px;
  border-radius: 16px;
  padding: 12px 16px;
  background: linear-gradient(135deg, #16a34a, #15803d);
  color: white;
  text-decoration: none;
  font-weight: 900;
  box-shadow: 0 12px 24px rgba(22, 163, 74, 0.2);
}

.botao-whatsapp.secundario {
  background: linear-gradient(135deg, #1d4ed8, #1e3a8a);
  box-shadow: 0 12px 24px rgba(29, 78, 216, 0.18);
}

.aviso-card {
  color: var(--catalogo-texto-suave);
  font-size: 14px;
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

  .painel-superior {
    grid-template-columns: minmax(0, 1.5fr) minmax(280px, 1fr);
  }

  .grid-produtos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
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

@media (max-width: 560px) {
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
}
</style>
