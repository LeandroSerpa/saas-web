<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import PublicPlanosSection from '@/components/publico/PublicPlanosSection.vue'
import { BRAND_NAME, BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'

const heroComErro = ref(false)

function usarFallbackHero() {
  heroComErro.value = true
}

const apoiosHero = [
  'Agenda pública',
  'Catálogo online',
  'Gestão esportiva',
  'Estoque e produtos',
  'Painel administrativo',
  'Personalização por empresa',
]

const beneficios = [
  {
    titulo: 'Agenda e atendimento com contexto',
    texto:
      'Organize horários, serviços, clientes e equipe com uma operação mais clara para quem atende e para quem gerencia.',
    detalhe: 'Links públicos e rotina interna no mesmo fluxo.',
  },
  {
    titulo: 'Catálogo, produtos e presença digital',
    texto:
      'Apresente catálogo, cardápio ou página pública da empresa sem depender de várias ferramentas separadas para operar.',
    detalhe: 'Mais consistência entre divulgação e operação.',
  },
  {
    titulo: 'Módulos por segmento e momento da empresa',
    texto:
      'Ative os recursos que fazem sentido para o negócio e mantenha o painel limpo para a equipe usar todos os dias.',
    detalhe: 'Agendamento, estoque, esporte e administração em uma base só.',
  },
]

const destaquesPainel = [
  {
    rotulo: 'Páginas públicas',
    titulo: 'Entrada profissional para o cliente',
    texto: 'Agendamento, catálogo e apresentação institucional conforme os recursos ativos da empresa.',
  },
  {
    rotulo: 'Cadastros',
    titulo: 'Clientes, produtos e equipe organizados',
    texto: 'Informações centrais para reduzir retrabalho e manter a operação com mais previsibilidade.',
  },
  {
    rotulo: 'Módulos',
    titulo: 'Expansão sem trocar de sistema',
    texto: 'A empresa cresce por módulo, sem poluir a rotina com recursos fora do contexto.',
  },
]

const rotinasPainel = [
  'Agenda pública e disponibilidade por empresa',
  'Clientes, serviços, produtos e catálogo em um só ambiente',
  'Painel administrativo com navegação por perfil e contexto',
]

const segmentos = [
  'Barbearias e salões',
  'Clínicas e atendimentos especializados',
  'Pet shops e serviços locais',
  'Negócios com catálogo ou cardápio',
  'Estúdios, cursos e profissionais autônomos',
  'Gestão esportiva e operações por turma',
]

const jornadas = [
  {
    titulo: 'A empresa publica o que precisa mostrar',
    texto: 'Agendamento, catálogo, cardápio ou página institucional ficam alinhados com a proposta de atendimento.',
  },
  {
    titulo: 'O cliente encontra um caminho simples',
    texto: 'A entrada pública ajuda a orientar o contato sem depender de mensagens soltas e instruções improvisadas.',
  },
  {
    titulo: 'A equipe opera com mais organização',
    texto: 'Cadastros, agenda, produtos e rotinas internas ficam concentrados no painel da empresa.',
  },
  {
    titulo: 'A gestão evolui por módulo',
    texto: 'Conforme a necessidade do negócio, a operação pode ganhar estoque, gestão esportiva e novos recursos.',
  },
]

const modulos = [
  {
    titulo: 'Agendamentos',
    texto: 'Serviços, horários, profissionais, disponibilidade e página pública para marcação online.',
  },
  {
    titulo: 'Catálogo e cardápio',
    texto: 'Apresentação pública de produtos quando o negócio precisa divulgar itens e organizar a vitrine digital.',
  },
  {
    titulo: 'Estoque e produtos',
    texto: 'Controle de produtos, quantidades, movimentações e apoio à rotina operacional da empresa.',
  },
  {
    titulo: 'Gestão esportiva',
    texto: 'Turmas, alunos, professores, aulas e acompanhamento da operação esportiva em contexto próprio.',
  },
  {
    titulo: 'Painel administrativo',
    texto: 'Área interna com permissões, contexto de empresa e visão mais clara da operação diária.',
  },
  {
    titulo: 'Personalização por empresa',
    texto: 'Ajustes de identidade, páginas públicas e experiência de apresentação conforme o perfil do negócio.',
  },
]
</script>

<template>
  <main class="pagina-index-publica">
    <section class="hero">
      <PublicHeader />

      <div class="hero-stage">
        <div class="hero-conteudo">
          <div class="hero-copy">
            <span class="selo claro">{{ BRAND_NAME }}</span>
            <h1>Gestão online para pequenas empresas que precisam organizar agenda, clientes, catálogo e operação.</h1>
            <p>
              O {{ BRAND_NAME }} ajuda pequenas empresas a organizar agenda, clientes, catálogo, estoque, módulos por
              segmento e páginas públicas em uma plataforma online simples de operar.
            </p>

            <div class="acoes-hero">
              <RouterLink class="botao principal" to="/cadastro">Começar agora</RouterLink>
              <RouterLink class="botao secundario" to="/login">Entrar no sistema</RouterLink>
            </div>

            <div class="apoios-hero" aria-label="Recursos em destaque">
              <span v-for="item in apoiosHero" :key="item">{{ item }}</span>
            </div>
          </div>

          <aside class="hero-brand-panel" aria-label="Apresentação da marca NuvemMais Gestão">
            <span class="hero-brand-kicker">Marca e apresentação</span>
            <div class="hero-brand-frame">
              <img
                v-if="!heroComErro"
                class="hero-marca"
                :src="brandAssets.logoHero"
                :alt="BRAND_NAME"
                @error="usarFallbackHero"
              />
              <div v-else class="hero-marca-fallback">
                <span class="hero-marca-badge">
                  <img :src="brandAssets.logoApp" alt="" aria-hidden="true" />
                </span>
                <strong>{{ BRAND_NAME }}</strong>
                <small>{{ BRAND_TAGLINE }}</small>
              </div>
            </div>
            <p>
              A marca aparece com leitura clara e proporção controlada para apoiar a apresentação comercial da página.
            </p>
          </aside>
        </div>

        <div class="produto-visual" aria-label="Resumo visual da plataforma">
          <div class="produto-topo">
            <span></span>
            <span></span>
            <span></span>
            <strong>Plataforma NuvemMais Gestão</strong>
          </div>

          <div class="produto-grid">
            <article class="agenda-card">
              <div class="agenda-card-topo">
                <small>O que a plataforma concentra</small>
                <strong>Uma base única para organizar atendimento, divulgação e operação.</strong>
                <p>
                  O foco está em agenda, clientes, catálogo, produtos, páginas públicas e módulos conforme o tipo de
                  negócio.
                </p>
              </div>

              <ul>
                <li v-for="item in rotinasPainel" :key="item">
                  <span aria-hidden="true"></span>
                  <p>{{ item }}</p>
                </li>
              </ul>
            </article>

            <article v-for="item in destaquesPainel" :key="item.titulo" class="indicador-card">
              <small>{{ item.rotulo }}</small>
              <strong>{{ item.titulo }}</strong>
              <p>{{ item.texto }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section id="recursos" class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Por que usar</span>
        <h2>Uma plataforma pensada para pequenas empresas que precisam atender bem e organizar a rotina.</h2>
        <p>
          O objetivo é dar clareza para a operação da empresa, com recursos públicos e internos que se complementam no dia a dia.
        </p>
      </div>

      <div class="grade beneficios">
        <article v-for="beneficio in beneficios" :key="beneficio.titulo" class="card-beneficio">
          <span aria-hidden="true"></span>
          <h3>{{ beneficio.titulo }}</h3>
          <p>{{ beneficio.texto }}</p>
          <strong>{{ beneficio.detalhe }}</strong>
        </article>
      </div>
    </section>

    <section class="secao segmentos-secao">
      <div class="secao-cabecalho">
        <span class="selo claro">Segmentos</span>
        <h2>Flexível para empresas de serviço, catálogo e gestão por contexto.</h2>
        <p>
          A mesma base atende empresas que trabalham com horários, equipe, produtos, vitrine pública e rotinas por módulo.
        </p>
      </div>

      <div class="segmentos">
        <article v-for="segmento in segmentos" :key="segmento">
          <span aria-hidden="true">{{ segmento.slice(0, 1) }}</span>
          <strong>{{ segmento }}</strong>
        </article>
      </div>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Fluxo da operação</span>
        <h2>Da página pública ao painel interno, com mais continuidade no atendimento.</h2>
        <p>
          A apresentação da empresa e a rotina administrativa ficam conectadas para reduzir ruído entre divulgação, equipe e gestão.
        </p>
      </div>

      <div class="linha-tempo">
        <article v-for="(passo, indice) in jornadas" :key="passo.titulo">
          <span>{{ String(indice + 1).padStart(2, '0') }}</span>
          <h3>{{ passo.titulo }}</h3>
          <p>{{ passo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao modulos-secao">
      <div class="secao-cabecalho">
        <span class="selo">Recursos da plataforma</span>
        <h2>Módulos que acompanham o momento da empresa sem complicar a navegação.</h2>
        <p>
          A empresa ativa o que faz sentido para sua operação e mantém o uso mais limpo para quem trabalha no sistema todos os dias.
        </p>
      </div>

      <div class="grade modulos">
        <article v-for="modulo in modulos" :key="modulo.titulo" class="modulo-card">
          <span aria-hidden="true"></span>
          <h3>{{ modulo.titulo }}</h3>
          <p>{{ modulo.texto }}</p>
        </article>
      </div>
    </section>

    <PublicPlanosSection />

    <section class="cta-final">
      <span class="selo claro">Comece com mais organização</span>
      <h2>Cadastre sua empresa e reúna atendimento, catálogo, agenda e operação em um sistema na nuvem.</h2>
      <p>
        Solicite o cadastro para análise ou entre no sistema para continuar a gestão da sua empresa no painel administrativo.
      </p>
      <div class="acoes-hero">
        <RouterLink class="botao principal claro" to="/cadastro">Começar agora</RouterLink>
        <RouterLink class="botao secundario claro-borda" to="/login">Entrar no sistema</RouterLink>
      </div>
    </section>

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-index-publica {
  min-height: 100vh;
  overflow: hidden;
  background: #f7fafc;
  color: #0f172a;
}

.hero {
  position: relative;
  border-bottom: 1px solid rgba(148, 163, 184, 0.24);
  background:
    linear-gradient(110deg, rgba(14, 165, 233, 0.16) 0 1px, transparent 1px 100%) 0 0 / 72px 72px,
    radial-gradient(circle at 24% 12%, rgba(37, 99, 235, 0.42), transparent 34%),
    radial-gradient(circle at 82% 26%, rgba(20, 184, 166, 0.28), transparent 30%),
    linear-gradient(135deg, #071124 0%, #0f172a 48%, #123b78 100%);
  color: white;
}

.hero-stage {
  position: relative;
  width: min(1180px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 28px;
  padding: 38px 20px 84px;
}

.hero-conteudo {
  position: relative;
  z-index: 1;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(320px, 390px);
  align-items: center;
  gap: 28px;
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: start;
  gap: 18px;
  max-width: 700px;
  text-align: left;
}

.hero-brand-panel {
  position: relative;
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid rgba(125, 211, 252, 0.22);
  border-radius: 28px;
  background:
    radial-gradient(circle at 50% 18%, rgba(125, 211, 252, 0.14), transparent 34%),
    rgba(8, 15, 31, 0.48);
  box-shadow: 0 26px 60px rgba(2, 6, 23, 0.26);
  backdrop-filter: blur(18px);
}

.hero-brand-panel::before {
  content: '';
  position: absolute;
  inset: 18px 26px auto;
  height: 120px;
  border-radius: 999px;
  background: radial-gradient(circle, rgba(56, 189, 248, 0.32), transparent 72%);
  filter: blur(24px);
  pointer-events: none;
}

.hero-brand-kicker {
  position: relative;
  z-index: 1;
  width: fit-content;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 12px;
  background: rgba(255, 255, 255, 0.08);
  color: #bfdbfe;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.hero-brand-frame {
  position: relative;
  display: grid;
  place-items: center;
  min-height: 340px;
  padding: 16px;
  overflow: hidden;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 24px;
  background:
    radial-gradient(circle at 50% 34%, rgba(56, 189, 248, 0.16), transparent 28%),
    linear-gradient(180deg, rgba(255, 255, 255, 0.98), rgba(241, 245, 249, 0.94));
  box-shadow:
    inset 0 1px 0 rgba(255, 255, 255, 0.72),
    0 18px 36px rgba(15, 23, 42, 0.14);
}

.hero-marca {
  position: relative;
  z-index: 1;
  width: auto;
  max-width: min(100%, 304px);
  height: auto;
  max-height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  opacity: 0.98;
}

.hero-marca-fallback {
  position: relative;
  z-index: 1;
  width: 100%;
  height: 100%;
  display: grid;
  justify-items: center;
  align-content: center;
  gap: 14px;
  padding: 24px;
  text-align: center;
}

.hero-marca-badge {
  width: 72px;
  height: 72px;
  display: inline-grid;
  place-items: center;
  border-radius: 24px;
  background: linear-gradient(135deg, #071124 0%, #123b78 100%);
  box-shadow: 0 18px 34px rgba(15, 23, 42, 0.18);
}

.hero-marca-badge img {
  display: block;
  width: 52px;
  height: 52px;
  object-fit: contain;
}

.hero-marca-fallback strong {
  color: #0f172a;
  font-size: 22px;
  font-weight: 900;
}

.hero-marca-fallback small {
  color: #1e3a8a;
  font-size: 14px;
  font-weight: 800;
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
h3,
p,
ul {
  margin: 0;
}

h1 {
  max-width: 13ch;
  font-size: clamp(42px, 6vw, 74px);
  line-height: 1;
  font-weight: 900;
}

h2 {
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.04;
  font-weight: 900;
}

h3 {
  font-size: 20px;
  line-height: 1.18;
  font-weight: 900;
}

.hero-copy p {
  max-width: 640px;
  color: #dbeafe;
  font-size: 18px;
  line-height: 1.68;
}

.hero-brand-panel p {
  position: relative;
  z-index: 1;
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
}

.acoes-hero {
  display: flex;
  align-items: center;
  justify-content: flex-start;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.apoios-hero {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.apoios-hero span {
  display: inline-flex;
  align-items: center;
  min-height: 38px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(255, 255, 255, 0.08);
  padding: 0 14px;
  color: #e0f2fe;
  font-size: 13px;
  font-weight: 800;
}

.botao {
  display: inline-flex;
  min-height: 50px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 13px 20px;
  font-weight: 900;
  text-align: center;
  text-decoration: none;
  transition: transform 0.18s ease, box-shadow 0.18s ease, background 0.18s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao.principal {
  background: #38bdf8;
  color: #071124;
  box-shadow: 0 20px 38px rgba(56, 189, 248, 0.26);
}

.botao.principal.claro {
  background: white;
  color: #0f172a;
}

.botao.secundario {
  border: 1px solid rgba(255, 255, 255, 0.28);
  background: rgba(255, 255, 255, 0.08);
  color: white;
}

.botao.claro-borda {
  border-color: rgba(255, 255, 255, 0.42);
}

.produto-visual {
  position: relative;
  z-index: 1;
  width: 100%;
  margin: 6px auto 0;
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 24px;
  background: rgba(8, 15, 31, 0.72);
  box-shadow: 0 34px 90px rgba(0, 0, 0, 0.32);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.produto-topo {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
  padding: 15px 18px;
}

.produto-topo span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(226, 232, 240, 0.56);
}

.produto-topo strong {
  margin-left: auto;
  color: #bfdbfe;
  font-size: 13px;
  font-weight: 900;
}

.produto-grid {
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) repeat(3, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}

.agenda-card,
.indicador-card {
  border: 1px solid rgba(255, 255, 255, 0.12);
  border-radius: 18px;
  background: rgba(255, 255, 255, 0.08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.08);
}

.agenda-card {
  display: grid;
  gap: 20px;
  padding: 22px;
}

.agenda-card-topo {
  display: grid;
  gap: 10px;
}

.agenda-card small,
.indicador-card small {
  color: #93c5fd;
  font-weight: 900;
  text-transform: uppercase;
}

.agenda-card strong {
  display: block;
  font-size: 29px;
  line-height: 1.15;
}

.agenda-card p {
  color: #cbd5e1;
  font-size: 14px;
  line-height: 1.6;
}

.agenda-card ul {
  display: grid;
  gap: 12px;
  padding: 0;
  list-style: none;
}

.agenda-card li {
  display: grid;
  grid-template-columns: 12px minmax(0, 1fr);
  align-items: start;
  gap: 12px;
  border-radius: 14px;
  background: rgba(255, 255, 255, 0.08);
  padding: 14px;
}

.agenda-card li span {
  width: 12px;
  height: 12px;
  margin-top: 4px;
  border-radius: 999px;
  background: linear-gradient(135deg, #38bdf8 0%, #22c55e 100%);
}

.agenda-card li p {
  color: #eff6ff;
  font-size: 14px;
  font-weight: 700;
}

.indicador-card {
  min-height: 174px;
  display: grid;
  align-content: start;
  gap: 10px;
  padding: 20px;
}

.indicador-card strong {
  font-size: 22px;
  line-height: 1.2;
}

.indicador-card p {
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.55;
}

.secao,
.cta-final {
  width: min(1160px, 100%);
  margin: 0 auto;
  padding-right: 20px;
  padding-left: 20px;
}

.secao {
  padding-top: 84px;
  padding-bottom: 84px;
}

.secao-cabecalho {
  display: grid;
  gap: 14px;
  max-width: 820px;
  margin-bottom: 30px;
}

.secao-cabecalho p,
.card-beneficio p,
.modulo-card p,
.linha-tempo p,
.cta-final p {
  color: #475569;
  font-size: 16px;
  line-height: 1.65;
}

.grade {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.card-beneficio,
.modulo-card,
.linha-tempo article {
  display: grid;
  gap: 14px;
  min-width: 0;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 18px;
  background: white;
  padding: 24px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
}

.card-beneficio > span,
.modulo-card > span {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(37, 99, 235, 0.16), rgba(20, 184, 166, 0.22));
}

.card-beneficio strong {
  color: #1d4ed8;
  font-size: 14px;
  line-height: 1.45;
}

.segmentos-secao {
  width: 100%;
  max-width: none;
  padding-right: max(20px, calc((100% - 1160px) / 2));
  padding-left: max(20px, calc((100% - 1160px) / 2));
  background:
    linear-gradient(110deg, rgba(125, 211, 252, 0.1) 0 1px, transparent 1px 100%) 0 0 / 64px 64px,
    #0f172a;
  color: white;
}

.segmentos-secao .secao-cabecalho p {
  color: #cbd5e1;
}

.segmentos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.segmentos article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 74px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  border-radius: 16px;
  background: rgba(255, 255, 255, 0.08);
  padding: 16px;
}

.segmentos span {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: rgba(125, 211, 252, 0.14);
  color: #7dd3fc;
  font-weight: 900;
}

.linha-tempo {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.linha-tempo article {
  border-top: 4px solid #38bdf8;
}

.linha-tempo article > span {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
}

.modulos-secao {
  padding-top: 34px;
}

.modulo-card {
  min-height: 208px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.cta-final {
  display: grid;
  justify-items: center;
  gap: 16px;
  margin-top: 26px;
  margin-bottom: 24px;
  border-radius: 24px;
  background:
    linear-gradient(110deg, rgba(125, 211, 252, 0.12) 0 1px, transparent 1px 100%) 0 0 / 58px 58px,
    radial-gradient(circle at 76% 24%, rgba(20, 184, 166, 0.3), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #071124 100%);
  padding: 54px 36px;
  color: white;
  text-align: center;
  box-shadow: 0 28px 70px rgba(15, 23, 42, 0.18);
}

.cta-final h2 {
  max-width: 820px;
}

.cta-final p {
  max-width: 720px;
  color: #dbeafe;
}

@media (max-width: 980px) {
  .hero-conteudo {
    grid-template-columns: 1fr;
  }

  .hero-copy {
    max-width: none;
  }

  .hero-brand-panel {
    max-width: 420px;
  }

  .produto-grid,
  .grade,
  .segmentos,
  .linha-tempo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .agenda-card {
    grid-column: 1 / -1;
  }
}

@media (max-width: 640px) {
  .hero-stage {
    padding: 42px 14px 58px;
  }

  .hero-copy {
    text-align: left;
    justify-items: start;
  }

  .hero-brand-panel {
    max-width: none;
    padding: 16px;
  }

  .hero-brand-frame {
    min-height: 280px;
  }

  h1 {
    font-size: 40px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .acoes-hero,
  .botao,
  .apoios-hero span {
    width: 100%;
  }

  .produto-grid,
  .grade,
  .segmentos,
  .linha-tempo {
    grid-template-columns: 1fr;
  }

  .secao {
    padding: 58px 14px;
  }

  .segmentos-secao {
    padding-right: 14px;
    padding-left: 14px;
  }

  .card-beneficio,
  .modulo-card,
  .linha-tempo article,
  .cta-final {
    padding: 22px;
  }

  .cta-final {
    width: calc(100% - 28px);
  }
}
</style>
