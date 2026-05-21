<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buscarConteudoInstitucionalPublico } from '@/services/api'

const conteudo = ref(criarFallback())
const carregando = ref(true)

function criarFallback() {
  return {
    titulo: 'Termos de Uso',
    subtitulo: 'Condições gerais para uso do Gestão Empresarial.',
    secoes: [
      {
        titulo: 'Uso da plataforma',
        texto:
          'O Gestão Empresarial oferece ferramentas para apoiar a organização de cadastros, atendimentos, agendas, serviços e informações administrativas. O uso deve ocorrer de forma responsável, com dados corretos e respeitando os direitos de clientes, colaboradores e parceiros.',
      },
      {
        titulo: 'Responsabilidades do usuário',
        texto:
          'Cada empresa é responsável pelas informações cadastradas, pela atualização dos seus dados e pela orientação das pessoas autorizadas a acessar a plataforma. Senhas e acessos devem ser mantidos em segurança.',
      },
      {
        titulo: 'Disponibilidade e melhorias',
        texto:
          'Podem ocorrer ajustes, manutenções e melhorias no serviço. Sempre que possível, buscaremos reduzir impactos e manter uma experiência estável para as empresas usuárias.',
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
    conteudo.value = normalizarConteudo(await buscarConteudoInstitucionalPublico('termos'))
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
        <RouterLink to="/sobre">Sobre</RouterLink>
        <RouterLink to="/privacidade">Privacidade</RouterLink>
      </nav>

      <article class="card">
        <span class="marca">Gestão Empresarial</span>
        <h1>{{ conteudo.titulo }}</h1>
        <p class="subtitulo">{{ conteudo.subtitulo }}</p>

        <p v-if="carregando" class="aviso">Carregando conteúdo...</p>

        <section v-for="secao in conteudo.secoes" :key="`${secao.titulo}-${secao.texto}`" class="secao">
          <h2 v-if="secao.titulo">{{ secao.titulo }}</h2>
          <p>{{ secao.texto }}</p>
        </section>

        <p class="nota">Este texto é uma versão inicial e poderá ser atualizado.</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina-institucional{min-height:100vh;background:#eef2f7;color:#111827;padding:34px 18px}.conteudo{max-width:860px;margin:0 auto;display:grid;gap:18px}.nav-publica{display:flex;justify-content:flex-end;gap:14px;flex-wrap:wrap}.nav-publica a{color:#2563eb;font-weight:800;text-decoration:none}.nav-publica a:hover{text-decoration:underline}.card{display:grid;gap:18px;background:white;border:1px solid #e5e7eb;border-radius:8px;padding:28px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.marca{color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:36px;font-weight:800}h2{font-size:20px;font-weight:800}.subtitulo,.secao p{color:#475569;font-size:16px;line-height:1.65}.secao{display:grid;gap:8px}.nota,.aviso{border-top:1px solid #e5e7eb;padding-top:16px;color:#64748b;font-size:14px;font-weight:700}@media(max-width:700px){h1{font-size:30px}.card{padding:22px}.nav-publica{justify-content:flex-start}}
</style>
