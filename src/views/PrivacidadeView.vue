<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buscarConteudoInstitucionalPublico } from '@/services/api'

const conteudo = ref(criarFallback())
const carregando = ref(true)

function criarFallback() {
  return {
    titulo: 'Política de Privacidade',
    subtitulo: 'Como tratamos informações no Gestão Empresarial.',
    secoes: [
      {
        titulo: 'Dados utilizados',
        texto:
          'Podemos utilizar dados informados pela empresa e por seus usuários para permitir o funcionamento da plataforma, como dados de cadastro, contatos, agenda, serviços e registros necessários à operação.',
      },
      {
        titulo: 'Finalidade',
        texto:
          'As informações são usadas para organizar o atendimento, permitir acesso à conta, exibir dados operacionais, prestar suporte e melhorar a experiência de uso.',
      },
      {
        titulo: 'Cuidados com as informações',
        texto:
          'Adotamos medidas razoáveis para proteger as informações e recomendamos que cada usuário mantenha seus dados de acesso em sigilo. Solicitações sobre dados podem ser encaminhadas pelos canais oficiais de atendimento da empresa responsável pelo serviço.',
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
    conteudo.value = normalizarConteudo(await buscarConteudoInstitucionalPublico('privacidade'))
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
        <RouterLink to="/termos">Termos</RouterLink>
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
