<script setup>
import { onMounted, ref } from 'vue'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { buscarConteudoInstitucionalPublico } from '@/services/api'

const conteudo = ref(criarFallback())
const carregando = ref(true)

function criarFallback() {
  return {
    titulo: 'Termos de Uso',
    subtitulo: 'Condições gerais para uso do NuvemMais Gestão.',
    secoes: [
      {
        titulo: 'Uso da plataforma',
        texto:
          'O NuvemMais Gestão é uma plataforma de apoio à gestão empresarial. O uso deve respeitar as regras de acesso, segurança e finalidade dos recursos disponíveis.',
      },
      {
        titulo: 'Responsabilidades',
        texto:
          'Cada usuário é responsável pelas informações inseridas no sistema e pela proteção de suas credenciais de acesso.',
      },
      {
        titulo: 'Atualizações',
        texto:
          'Estes termos podem ser atualizados para refletir melhorias no serviço, ajustes operacionais ou orientações legais aplicáveis.',
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
  <main class="pagina-legal">
    <PublicHeader compacto />

    <section class="hero-legal">
      <span class="selo">Leitura institucional</span>
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
    radial-gradient(circle at 86% 12%, rgba(20, 184, 166, .14), transparent 28%),
    linear-gradient(135deg, #eef6ff 0%, #f8fafc 48%, #ffffff 100%);
  color: #0f172a;
}

.hero-legal,
.conteudo-legal {
  width: min(1040px, 100%);
  margin: 0 auto;
  padding-right: 20px;
  padding-left: 20px;
}

.hero-legal {
  display: grid;
  gap: 12px;
  padding-top: 42px;
  padding-bottom: 30px;
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 44px;
  line-height: 1.08;
  font-weight: 900;
}

.hero-legal p,
.secao-texto p,
.nota {
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
}

.hero-legal p {
  max-width: 720px;
  font-size: 18px;
}

.conteudo-legal {
  display: grid;
  grid-template-columns: 250px minmax(0, 1fr);
  gap: 22px;
  padding-bottom: 34px;
}

.indice-card,
.documento-card {
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: rgba(255, 255, 255, .92);
  box-shadow: 0 22px 52px rgba(15, 23, 42, .08);
}

.indice-card {
  position: sticky;
  top: 18px;
  align-self: start;
  display: grid;
  gap: 10px;
  padding: 20px;
}

.indice-card a {
  border-radius: 8px;
  padding: 9px 10px;
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
  gap: 22px;
  padding: 30px;
}

.secao-texto {
  display: grid;
  gap: 8px;
  scroll-margin-top: 20px;
}

.secao-texto span {
  color: #2563eb;
  font-size: 12px;
  font-weight: 900;
}

.secao-texto h2 {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 900;
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

  h1 {
    font-size: 34px;
  }
}

@media (max-width: 560px) {
  .hero-legal,
  .conteudo-legal {
    padding-right: 14px;
    padding-left: 14px;
  }

  .documento-card,
  .indice-card {
    padding: 20px;
  }
}
</style>
