<script setup>
import { onMounted, ref } from 'vue'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { buscarConteudoInstitucionalPublico } from '@/services/api'

const conteudo = ref(criarFallback())
const carregando = ref(true)

function criarFallback() {
  return {
    titulo: 'Política de Privacidade',
    subtitulo: 'Como tratamos informações no NuvemMais Gestão.',
    secoes: [
      {
        titulo: 'Dados utilizados',
        texto:
          'A plataforma pode utilizar informações cadastrais, dados de acesso e registros operacionais necessários para funcionamento do sistema.',
      },
      {
        titulo: 'Finalidade',
        texto:
          'As informações são usadas para viabilizar cadastro, autenticação, gestão empresarial, suporte e melhoria da experiência na plataforma.',
      },
      {
        titulo: 'Segurança',
        texto:
          'Adotamos práticas de proteção compatíveis com o ambiente da aplicação e recomendamos que usuários mantenham suas credenciais em sigilo.',
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
  <main class="pagina-legal">
    <PublicHeader compacto />

    <section class="hero-legal">
      <span class="selo claro">Privacidade</span>
      <h1>{{ conteudo.titulo }}</h1>
      <p>{{ conteudo.subtitulo }}</p>
    </section>

    <section class="conteudo-legal">
      <aside class="indice-card">
        <span class="selo">Nesta página</span>
        <a v-for="(secao, indice) in conteudo.secoes" :key="`${secao.titulo}-${indice}`" :href="`#secao-${indice}`">
          {{ secao.titulo || `Seção ${indice + 1}` }}
        </a>
      </aside>

      <article class="documento-card">
        <p v-if="carregando" class="aviso">Carregando conteúdo...</p>

        <section
          v-for="(secao, indice) in conteudo.secoes"
          :id="`secao-${indice}`"
          :key="`${secao.titulo}-${secao.texto}`"
          class="secao-texto"
        >
          <span>{{ String(indice + 1).padStart(2, '0') }}</span>
          <h2 v-if="secao.titulo">{{ secao.titulo }}</h2>
          <p>{{ secao.texto }}</p>
        </section>

        <p class="nota">Este texto é uma versão inicial e poderá ser atualizado.</p>
      </article>
    </section>

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-legal {
  min-height: 100vh;
  background:
    linear-gradient(110deg, rgba(14, 165, 233, .1) 0 1px, transparent 1px 100%) 0 0 / 70px 70px,
    radial-gradient(circle at 86% 12%, rgba(20, 184, 166, .14), transparent 28%),
    #f8fafc;
  color: #0f172a;
}

.hero-legal,
.conteudo-legal {
  width: min(1080px, 100%);
  margin: 0 auto;
  padding-right: 20px;
  padding-left: 20px;
}

.hero-legal {
  display: grid;
  gap: 12px;
  margin-top: 34px;
  border-radius: 28px;
  background:
    radial-gradient(circle at 86% 18%, rgba(20, 184, 166, .28), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #071124 100%);
  padding-top: 48px;
  padding-bottom: 48px;
  color: white;
  box-shadow: 0 30px 80px rgba(15, 23, 42, .18);
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.selo.claro {
  color: #7dd3fc;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  max-width: 760px;
  font-size: clamp(36px, 5vw, 58px);
  line-height: 1.04;
  font-weight: 900;
}

.hero-legal p {
  max-width: 720px;
  color: #dbeafe;
  font-size: 18px;
  line-height: 1.7;
}

.conteudo-legal {
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  gap: 22px;
  padding-top: 28px;
  padding-bottom: 34px;
}

.indice-card,
.documento-card {
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 22px;
  background: rgba(255, 255, 255, .94);
  box-shadow: 0 24px 58px rgba(15, 23, 42, .08);
}

.indice-card {
  position: sticky;
  top: 92px;
  align-self: start;
  display: grid;
  gap: 10px;
  padding: 20px;
}

.indice-card a {
  border-radius: 8px;
  padding: 10px;
  color: #334155;
  font-weight: 800;
  text-decoration: none;
}

.indice-card a:hover {
  background: #eff6ff;
  color: #2563eb;
}

.documento-card {
  display: grid;
  gap: 24px;
  padding: 32px;
}

.secao-texto {
  display: grid;
  gap: 8px;
  scroll-margin-top: 110px;
}

.secao-texto span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.secao-texto h2 {
  font-size: 23px;
  line-height: 1.2;
  font-weight: 900;
}

.secao-texto p,
.nota {
  color: #475569;
  font-size: 16px;
  line-height: 1.75;
}

.aviso,
.nota {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  font-weight: 800;
}

@media (max-width: 760px) {
  .conteudo-legal {
    grid-template-columns: 1fr;
  }

  .indice-card {
    position: static;
  }
}

@media (max-width: 560px) {
  .hero-legal,
  .conteudo-legal {
    padding-right: 14px;
    padding-left: 14px;
  }

  .hero-legal {
    margin-top: 22px;
    border-radius: 22px;
    padding-top: 34px;
    padding-bottom: 34px;
  }

  .documento-card,
  .indice-card {
    padding: 20px;
  }
}
</style>
