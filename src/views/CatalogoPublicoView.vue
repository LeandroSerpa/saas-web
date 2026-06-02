<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  buscarCatalogoPublico,
  buscarEmpresaPublica,
  buscarPersonalizacaoPublica,
} from '@/services/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())

const carregando = ref(true)
const indisponivel = ref(false)
const erro = ref('')
const empresa = ref({})
const personalizacao = ref(criarPersonalizacaoPadrao())
const produtos = ref([])
const categoriaAtiva = ref('')

const categorias = computed(() => {
  const itens = produtosVisiveis.value
    .map((item) => item.categoriaPublica)
    .filter(Boolean)

  return [...new Set(itens)].sort((a, b) => a.localeCompare(b, 'pt-BR'))
})

const produtosVisiveis = computed(() =>
  produtos.value
    .filter((item) => item.exibirCatalogoPublico)
    .sort((a, b) => {
      const ordemA = Number.isFinite(a.ordemCatalogo) ? a.ordemCatalogo : Number.MAX_SAFE_INTEGER
      const ordemB = Number.isFinite(b.ordemCatalogo) ? b.ordemCatalogo : Number.MAX_SAFE_INTEGER
      return ordemA - ordemB || a.nome.localeCompare(b.nome, 'pt-BR')
    }),
)

const produtosFiltrados = computed(() => {
  if (!categoriaAtiva.value) {
    return produtosVisiveis.value
  }

  return produtosVisiveis.value.filter((item) => item.categoriaPublica === categoriaAtiva.value)
})

const tituloPagina = computed(() =>
  String(
    personalizacao.value.tituloCatalogo ||
      personalizacao.value.tituloPagina ||
      `Catalogo de ${empresa.value?.nome || 'produtos'}`,
  ).trim(),
)

const subtituloPagina = computed(() =>
  String(
    personalizacao.value.subtituloCatalogo ||
      personalizacao.value.subtituloPagina ||
      empresa.value?.mensagemPublica ||
      '',
  ).trim(),
)

const logoEmpresa = computed(() =>
  String(
    personalizacao.value.logoUrl ||
      empresa.value?.logoUrl ||
      empresa.value?.logo ||
      '',
  ).trim(),
)

const bannerEmpresa = computed(() =>
  String(
    personalizacao.value.bannerUrl ||
      empresa.value?.bannerUrl ||
      '',
  ).trim(),
)

const whatsappNumero = computed(() => {
  const candidatos = [
    empresa.value?.whatsapp,
    empresa.value?.telefoneWhatsapp,
    empresa.value?.telefoneComercial,
    empresa.value?.telefone,
    personalizacao.value?.whatsapp,
    personalizacao.value?.telefone,
  ]

  for (const candidato of candidatos) {
    const numero = normalizarTelefoneWhatsapp(candidato)
    if (numero) {
      return numero
    }
  }

  return ''
})

const temWhatsapp = computed(() => Boolean(whatsappNumero.value))

watch(
  () => slug.value,
  () => {
    carregarCatalogo()
  },
)

function criarPersonalizacaoPadrao() {
  return {
    logoUrl: '',
    bannerUrl: '',
    tituloPagina: '',
    subtituloPagina: '',
    tituloCatalogo: '',
    subtituloCatalogo: '',
    whatsapp: '',
  }
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []
  return valor.content || valor.items || valor.itens || valor.data?.content || valor.data || []
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''

  for (const campo of campos) {
    const valor = item[campo]
    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      return valor
    }
  }

  return ''
}

function normalizarBooleano(valor, padrao = false) {
  if (typeof valor === 'boolean') return valor
  if (typeof valor === 'number') return valor !== 0

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase()
    if (['true', '1', 'sim', 'yes'].includes(texto)) return true
    if (['false', '0', 'nao', 'não', 'no'].includes(texto)) return false
  }

  return padrao
}

function normalizarNumero(valor, padrao = 0) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : padrao
}

function normalizarProdutoCatalogo(item) {
  const quantidadeAtual = normalizarNumero(
    obterCampo(item, 'quantidadeAtual', 'saldoAtual', 'quantidade', 'estoqueAtual'),
    0,
  )
  const ativo = normalizarBooleano(obterCampo(item, 'ativo'), true)
  const exibirCatalogoPublico = normalizarBooleano(
    obterCampo(item, 'exibirCatalogoPublico', 'catalogoPublicoAtivo'),
    true,
  )
  const destaqueCatalogo = normalizarBooleano(obterCampo(item, 'destaqueCatalogo'), false)
  const mostrarQuantidadePublica = normalizarBooleano(obterCampo(item, 'mostrarQuantidadePublica'), false)
  const mostrarPrecoPublico = normalizarBooleano(obterCampo(item, 'mostrarPrecoPublico'), true)
  const ordemCatalogo = normalizarNumero(obterCampo(item, 'ordemCatalogo', 'ordem'), Number.MAX_SAFE_INTEGER)
  const preco = normalizarNumero(obterCampo(item, 'precoVenda', 'valorVenda', 'preco'), 0)
  const esgotado = normalizarBooleano(obterCampo(item, 'esgotado'), false)
  const disponivelApi = obterCampo(item, 'disponivel', 'disponibilidade')
  const disponivel =
    !esgotado &&
    ativo &&
    (typeof disponivelApi === 'boolean' ? disponivelApi : quantidadeAtual > 0)

  return {
    id: obterCampo(item, 'id', 'produtoId') || Math.random().toString(36).slice(2),
    nome: String(obterCampo(item, 'nome', 'produtoNome', 'titulo') || 'Produto').trim(),
    descricao: String(obterCampo(item, 'descricaoPublica', 'descricao', 'detalhes') || '').trim(),
    categoriaPublica: String(obterCampo(item, 'categoriaPublica', 'categoria', 'categoriaNome', 'sabor') || '').trim(),
    imagemUrl: String(obterCampo(item, 'imagemUrl', 'fotoUrl', 'imagem') || '').trim(),
    textoBotaoPublico:
      String(obterCampo(item, 'textoBotaoPublico') || '').trim() || 'Pedir pelo WhatsApp',
    exibirCatalogoPublico,
    destaqueCatalogo,
    mostrarQuantidadePublica,
    mostrarPrecoPublico,
    ordemCatalogo,
    preco,
    quantidadeAtual,
    disponivel,
  }
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function selecionarCategoria(categoria) {
  categoriaAtiva.value = categoria
}

function normalizarTelefoneWhatsapp(valor) {
  const digitos = String(valor || '').replace(/\D+/g, '')
  if (!digitos) return ''
  if (digitos.length < 10) return ''
  return digitos
}

function montarMensagemWhatsapp(produto) {
  const linhas = [
    `Ola! Vim pelo catalogo da NuvemMais e tenho interesse em: ${produto.nome}.`,
  ]

  if (produto.mostrarPrecoPublico) {
    linhas.push(`Produto: ${produto.nome}`)
    linhas.push(`Preco: ${formatarMoeda(produto.preco)}`)
  }

  if (produto.mostrarQuantidadePublica) {
    linhas.push(`Quantidade disponivel: ${produto.quantidadeAtual}`)
  }

  linhas.push(produto.disponivel ? 'Ainda tem disponivel?' : 'Hoje esta esgotado?')

  return linhas.join('\n')
}

function linkWhatsappProduto(produto) {
  if (!temWhatsapp.value) return ''
  const mensagem = encodeURIComponent(montarMensagemWhatsapp(produto))
  return `https://wa.me/${whatsappNumero.value}?text=${mensagem}`
}

async function carregarCatalogo() {
  try {
    carregando.value = true
    indisponivel.value = false
    erro.value = ''
    categoriaAtiva.value = ''

    const [empresaApi, personalizacaoApi, catalogoApi] = await Promise.all([
      buscarEmpresaPublica(slug.value),
      buscarPersonalizacaoPublica(slug.value).catch(() => null),
      buscarCatalogoPublico(slug.value),
    ])

    empresa.value = empresaApi && typeof empresaApi === 'object' ? empresaApi : {}
    personalizacao.value = {
      ...criarPersonalizacaoPadrao(),
      ...(personalizacaoApi && typeof personalizacaoApi === 'object' ? personalizacaoApi : {}),
    }

    const listaNormalizada = normalizarLista(catalogoApi).map(normalizarProdutoCatalogo)
    produtos.value = listaNormalizada

    if (!empresa.value?.nome && !listaNormalizada.length) {
      indisponivel.value = true
    }
  } catch (errorAtual) {
    indisponivel.value = true
    erro.value = 'Nao foi possivel carregar o catalogo desta empresa agora.'
    console.error(errorAtual)
  } finally {
    carregando.value = false
  }
}

onMounted(() => {
  carregarCatalogo()
})
</script>

<template>
  <main class="catalogo-publico">
    <section v-if="carregando" class="card estado">
      <p>Carregando catalogo...</p>
    </section>

    <section v-else-if="indisponivel" class="card estado">
      <h1>Catalogo indisponivel no momento</h1>
      <p>{{ erro || 'Esta vitrine publica nao esta disponivel agora. Tente novamente mais tarde.' }}</p>
    </section>

    <template v-else>
      <header class="hero">
        <img v-if="bannerEmpresa" :src="bannerEmpresa" alt="Banner da empresa" class="hero-banner" />
        <div class="hero-conteudo">
          <div class="hero-topo">
            <img v-if="logoEmpresa" :src="logoEmpresa" alt="Logo da empresa" class="logo-empresa" />
            <div>
              <p class="selo">Vitrine publica</p>
              <h1>{{ empresa.nome || 'Empresa' }}</h1>
              <p class="titulo">{{ tituloPagina }}</p>
              <p v-if="subtituloPagina" class="subtitulo">{{ subtituloPagina }}</p>
            </div>
          </div>
          <p v-if="!temWhatsapp" class="aviso-whatsapp">
            WhatsApp da empresa nao informado. A vitrine esta visivel, mas sem botao de contato.
          </p>
        </div>
      </header>

      <section class="filtros-categorias">
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
          :key="categoria"
          type="button"
          class="chip"
          :class="{ ativo: categoriaAtiva === categoria }"
          @click="selecionarCategoria(categoria)"
        >
          {{ categoria }}
        </button>
      </section>

      <section v-if="!produtosFiltrados.length" class="card estado">
        <p>Nenhum produto encontrado para esta categoria.</p>
      </section>

      <section v-else class="grid-produtos">
        <article v-for="produto in produtosFiltrados" :key="produto.id" class="card produto-card">
          <img
            v-if="produto.imagemUrl"
            :src="produto.imagemUrl"
            :alt="`Imagem de ${produto.nome}`"
            class="produto-imagem"
          />

          <div class="produto-topo">
            <h2>{{ produto.nome }}</h2>
            <div class="badges">
              <span class="badge" :class="produto.disponivel ? 'disponivel' : 'esgotado'">
                {{ produto.disponivel ? 'Disponivel' : 'Esgotado hoje' }}
              </span>
              <span v-if="produto.destaqueCatalogo" class="badge destaque">Destaque</span>
            </div>
          </div>

          <p v-if="produto.descricao" class="descricao">{{ produto.descricao }}</p>
          <p v-if="produto.categoriaPublica" class="categoria">{{ produto.categoriaPublica }}</p>

          <p v-if="produto.mostrarPrecoPublico" class="preco">{{ formatarMoeda(produto.preco) }}</p>
          <p v-if="produto.mostrarQuantidadePublica" class="quantidade">
            Quantidade disponivel: {{ produto.quantidadeAtual }}
          </p>

          <a
            v-if="temWhatsapp"
            class="botao-whatsapp"
            :class="{ desativado: !produto.disponivel }"
            :href="linkWhatsappProduto(produto)"
            target="_blank"
            rel="noopener noreferrer"
          >
            {{ produto.disponivel ? produto.textoBotaoPublico : 'Perguntar no WhatsApp' }}
          </a>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.catalogo-publico {
  min-height: 100vh;
  padding: 18px;
  display: grid;
  gap: 16px;
  background: radial-gradient(circle at top right, #ecfccb, #f8fafc 45%);
  color: #0f172a;
}

.card {
  background: white;
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  box-shadow: 0 10px 26px rgba(15, 23, 42, 0.08);
  padding: 16px;
}

.estado {
  text-align: center;
}

.hero {
  overflow: hidden;
  border-radius: 16px;
  border: 1px solid #dbe4f0;
  background: white;
}

.hero-banner {
  width: 100%;
  max-height: 220px;
  object-fit: cover;
  display: block;
}

.hero-conteudo {
  display: grid;
  gap: 12px;
  padding: 16px;
}

.hero-topo {
  display: flex;
  gap: 14px;
  align-items: center;
}

.logo-empresa {
  width: 68px;
  height: 68px;
  object-fit: cover;
  border-radius: 12px;
  border: 1px solid #dbe4f0;
}

.selo {
  margin: 0 0 4px;
  color: #15803d;
  font-weight: 800;
  text-transform: uppercase;
  font-size: 11px;
  letter-spacing: 0.08em;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 26px;
  font-weight: 900;
}

.titulo {
  margin-top: 4px;
  color: #1e293b;
  font-weight: 700;
}

.subtitulo {
  margin-top: 6px;
  color: #475569;
}

.aviso-whatsapp {
  border: 1px dashed #fde68a;
  background: #fffbeb;
  color: #92400e;
  border-radius: 10px;
  padding: 10px;
  font-weight: 600;
}

.filtros-categorias {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border: 1px solid #cbd5e1;
  background: white;
  border-radius: 999px;
  padding: 8px 12px;
  font-weight: 700;
  color: #334155;
  cursor: pointer;
}

.chip.ativo {
  border-color: #15803d;
  background: #dcfce7;
  color: #166534;
}

.grid-produtos {
  display: grid;
  gap: 14px;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
}

.produto-card {
  display: grid;
  gap: 10px;
}

.produto-imagem {
  width: 100%;
  aspect-ratio: 4 / 3;
  object-fit: cover;
  border-radius: 10px;
  border: 1px solid #dbe4f0;
}

.produto-topo {
  display: flex;
  justify-content: space-between;
  gap: 8px;
}

.produto-topo h2 {
  font-size: 18px;
}

.badges {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  justify-content: flex-end;
}

.badge {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 11px;
  text-transform: uppercase;
  font-weight: 800;
}

.badge.disponivel {
  background: #dcfce7;
  color: #166534;
}

.badge.esgotado {
  background: #fee2e2;
  color: #b91c1c;
}

.badge.destaque {
  background: #fef3c7;
  color: #92400e;
}

.descricao {
  color: #475569;
}

.categoria {
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.preco {
  color: #166534;
  font-size: 20px;
  font-weight: 900;
}

.quantidade {
  color: #334155;
  font-size: 14px;
}

.botao-whatsapp {
  display: inline-flex;
  justify-content: center;
  align-items: center;
  border-radius: 10px;
  background: #16a34a;
  color: white;
  font-weight: 800;
  text-decoration: none;
  padding: 10px 12px;
}

.botao-whatsapp.desativado {
  background: #1d4ed8;
}

@media (max-width: 600px) {
  .catalogo-publico {
    padding: 12px;
  }

  .hero-topo {
    align-items: flex-start;
  }
}
</style>
