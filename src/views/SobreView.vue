<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buscarConteudoInstitucionalPublico } from '@/services/api'
import { obterVersaoFrontendComPrefixo } from '@/utils/versaoAplicacao'

const conteudo = ref(criarFallback())
const carregando = ref(true)
const versaoPublica = obterVersaoFrontendComPrefixo()

function criarFallback() {
  return {
    titulo: 'Sobre',
    subtitulo: 'Uma plataforma para apoiar a gestão diária de empresas.',
    secoes: [
      {
        titulo: 'O que é o NuvemMais Gestão',
        texto:
          'O NuvemMais Gestão reúne recursos simples para ajudar empresas a organizar atendimentos, clientes, serviços, agendas e informações importantes do dia a dia.',
      },
      {
        titulo: 'Nosso objetivo',
        texto:
          'A proposta é oferecer uma experiência clara e prática para equipes que precisam acompanhar rotinas administrativas com mais previsibilidade e menos retrabalho.',
      },
      {
        titulo: 'Evolução do produto',
        texto:
          'A plataforma pode receber melhorias contínuas, novas telas e ajustes de experiência conforme as necessidades das empresas usuárias forem evoluindo.',
      },
    ],
  }
}

function normalizarConteudo(resposta) {
  if (!resposta) return criarFallback()

  if (typeof resposta === 'string') {
    return { ...criarFallback(), secoes: [{ titulo: '', texto: resposta }] }
  }

  const texto = resposta.texto || resposta.conteudo || resposta.descricao || ''
  const secoes = Array.isArray(resposta.secoes)
    ? resposta.secoes
    : texto
      ? [{ titulo: '', texto }]
      : criarFallback().secoes

  return {
    titulo: resposta.titulo || criarFallback().titulo,
    subtitulo: resposta.subtitulo || criarFallback().subtitulo,
    secoes,
  }
}

async function carregarConteudo() {
  try {
    conteudo.value = normalizarConteudo(await buscarConteudoInstitucionalPublico('sobre'))
  } catch (error) {
    conteudo.value = criarFallback()
    console.error(error)
  } finally {
    carregando.value = false
  }
}

onMounted(carregarConteudo)
</script>

<template>
  <main class="pagina-institucional">
    <section class="conteudo">
      <nav class="nav-publica" aria-label="Páginas públicas">
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/termos">Termos</RouterLink>
        <RouterLink to="/privacidade">Privacidade</RouterLink>
      </nav>

      <article class="card">
        <span class="marca">NuvemMais Gestão</span>
        <h1>{{ conteudo.titulo }}</h1>
        <p class="subtitulo">{{ conteudo.subtitulo }}</p>

        <p v-if="carregando" class="aviso">Carregando conteúdo...</p>

        <section v-for="secao in conteudo.secoes" :key="`${secao.titulo}-${secao.texto}`" class="secao">
          <h2 v-if="secao.titulo">{{ secao.titulo }}</h2>
          <p>{{ secao.texto }}</p>
        </section>

        <section class="versao-publica" aria-label="Versão atual do sistema">
          <p class="versao-etiqueta">Versão atual</p>
          <strong>Versão {{ versaoPublica }}</strong>
          <RouterLink class="link-versao-ajuda" to="/ajuda#versao-novidades">
            Ver novidades e histórico
          </RouterLink>
        </section>

        <p class="nota">Este texto é uma versão inicial e poderá ser atualizado.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina-institucional{min-height:100vh;background:#eef2f7;color:#111827;padding:34px 18px}.conteudo{max-width:860px;margin:0 auto;display:grid;gap:18px}.nav-publica{display:flex;justify-content:flex-end;gap:14px;flex-wrap:wrap}.nav-publica a{color:#2563eb;font-weight:800;text-decoration:none}.nav-publica a:hover{text-decoration:underline}.card{display:grid;gap:18px;background:white;border:1px solid #e5e7eb;border-radius:8px;padding:28px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.marca{color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:36px;font-weight:800}h2{font-size:20px;font-weight:800}.subtitulo,.secao p{color:#475569;font-size:16px;line-height:1.65}.secao{display:grid;gap:8px}.nota,.aviso{border-top:1px solid #e5e7eb;padding-top:16px;color:#64748b;font-size:14px;font-weight:700}.versao-publica{display:grid;gap:10px;padding:18px;border:1px solid #dbeafe;border-radius:12px;background:#eff6ff}.versao-etiqueta{color:#1d4ed8;font-size:12px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}.versao-publica strong{font-size:18px;font-weight:800}.link-versao-ajuda{width:fit-content;color:#2563eb;font-weight:800;text-decoration:none}.link-versao-ajuda:hover{text-decoration:underline}@media(max-width:700px){h1{font-size:30px}.card{padding:22px}.nav-publica{justify-content:flex-start}.versao-publica{padding:16px}}
</style>
