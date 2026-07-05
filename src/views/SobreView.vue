<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { buscarConteudoInstitucionalPublico } from '@/services/api'
import { obterVersaoFrontendComPrefixo } from '@/utils/versaoAplicacao'

const conteudo = ref(criarFallback())
const carregando = ref(true)
const versaoPublica = obterVersaoFrontendComPrefixo()

const modulos = ['Agendamentos', 'Estoque e catálogo', 'Gestão Esportiva', 'Relatórios', 'Administração SaaS']
const diferenciais = [
  'Plataforma modular para empresas de segmentos diferentes.',
  'Rotas públicas para cadastro, agendamento, catálogo e cardápio.',
  'Área administrativa com permissões e contexto de empresa.',
  'Base visual preparada para personalização pública da marca.',
]

function criarFallback() {
  return {
    titulo: 'Sobre o NuvemMais Gestão',
    subtitulo: 'Uma plataforma online para organizar a gestão diária de empresas.',
    secoes: [
      {
        titulo: 'Proposta',
        texto:
          'O NuvemMais Gestão reúne recursos para ajudar empresas a organizar atendimentos, clientes, serviços, agendas, produtos e informações importantes do dia a dia.',
      },
      {
        titulo: 'Como a plataforma evolui',
        texto:
          'A estrutura modular permite combinar recursos como agendamento, estoque, catálogo público, gestão esportiva, relatórios e administração SaaS conforme a necessidade da empresa.',
      },
      {
        titulo: 'Visão',
        texto:
          'A plataforma busca entregar uma experiência simples, confiável e profissional para que negócios tenham mais clareza sobre sua operação.',
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
    <PublicHeader compacto />

    <section class="hero-institucional">
      <span class="selo">Institucional</span>
      <h1>{{ conteudo.titulo }}</h1>
      <p>{{ conteudo.subtitulo }}</p>
    </section>

    <section class="conteudo-institucional">
      <aside class="painel-resumo">
        <span class="selo">NuvemMais Gestão</span>
        <h2>Gestão modular para negócios em movimento.</h2>
        <p>Uma base para organizar operação, atendimento, produtos, equipe e crescimento.</p>

        <div class="chips">
          <span v-for="modulo in modulos" :key="modulo">{{ modulo }}</span>
        </div>
      </aside>

      <article class="documento-card">
        <p v-if="carregando" class="aviso">Carregando conteúdo...</p>

        <section v-for="secao in conteudo.secoes" :key="`${secao.titulo}-${secao.texto}`" class="secao-texto">
          <h2 v-if="secao.titulo">{{ secao.titulo }}</h2>
          <p>{{ secao.texto }}</p>
        </section>

        <section class="diferenciais">
          <h2>Diferenciais</h2>
          <ul>
            <li v-for="item in diferenciais" :key="item">{{ item }}</li>
          </ul>
        </section>

        <section class="versao-publica" aria-label="Versão atual do sistema">
          <div>
            <p class="versao-etiqueta">Versão atual</p>
            <strong>Versão {{ versaoPublica }}</strong>
          </div>
          <RouterLink class="link-versao-ajuda" to="/ajuda#versao-novidades">
            Ver novidades e histórico
          </RouterLink>
        </section>

        <p class="nota">Este texto é uma versão inicial e poderá ser atualizado.</p>
      </article>
    </section>

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-institucional {
  min-height: 100vh;
  background:
    radial-gradient(circle at 88% 12%, rgba(20, 184, 166, .16), transparent 28%),
    linear-gradient(135deg, #eef6ff 0%, #f8fafc 46%, #ecfeff 100%);
  color: #0f172a;
}

.hero-institucional,
.conteudo-institucional {
  width: min(1080px, 100%);
  margin: 0 auto;
  padding-right: 20px;
  padding-left: 20px;
}

.hero-institucional {
  display: grid;
  gap: 12px;
  padding-top: 44px;
  padding-bottom: 34px;
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
  max-width: 760px;
  font-size: 46px;
  line-height: 1.08;
  font-weight: 900;
}

.hero-institucional p,
.painel-resumo p,
.secao-texto p,
.nota {
  color: #475569;
  font-size: 16px;
  line-height: 1.7;
}

.hero-institucional p {
  max-width: 720px;
  font-size: 18px;
}

.conteudo-institucional {
  display: grid;
  grid-template-columns: minmax(260px, .42fr) minmax(0, 1fr);
  gap: 22px;
  padding-bottom: 34px;
}

.painel-resumo,
.documento-card {
  border: 1px solid #e2e8f0;
  border-radius: 20px;
  background: rgba(255, 255, 255, .9);
  box-shadow: 0 22px 52px rgba(15, 23, 42, .08);
}

.painel-resumo {
  align-self: start;
  display: grid;
  gap: 14px;
  padding: 24px;
}

.painel-resumo h2,
.secao-texto h2,
.diferenciais h2 {
  font-size: 22px;
  line-height: 1.2;
  font-weight: 900;
}

.chips {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips span {
  border-radius: 999px;
  background: #eff6ff;
  padding: 8px 10px;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 900;
}

.documento-card {
  display: grid;
  gap: 20px;
  padding: 30px;
}

.secao-texto,
.diferenciais {
  display: grid;
  gap: 8px;
}

.diferenciais ul {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 20px;
  color: #334155;
  line-height: 1.6;
}

.aviso,
.nota {
  border-top: 1px solid #e5e7eb;
  padding-top: 16px;
  font-weight: 800;
}

.versao-publica {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: #eff6ff;
  padding: 18px;
}

.versao-etiqueta {
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.versao-publica strong {
  font-size: 18px;
  font-weight: 900;
}

.link-versao-ajuda {
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

.link-versao-ajuda:hover {
  text-decoration: underline;
}

@media (max-width: 840px) {
  .conteudo-institucional {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 36px;
  }
}

@media (max-width: 560px) {
  .hero-institucional,
  .conteudo-institucional {
    padding-right: 14px;
    padding-left: 14px;
  }

  .documento-card,
  .painel-resumo {
    padding: 20px;
  }

  .versao-publica {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
