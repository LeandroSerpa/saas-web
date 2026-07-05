<script setup>
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { RouterLink } from 'vue-router'

const credenciais = [
  'Multiempresa',
  'Módulos por segmento',
  'Agenda pública',
  'Catálogo',
  'Gestão esportiva',
  'Controle operacional',
]

const beneficios = [
  {
    inicial: 'A',
    titulo: 'Agenda mais organizada',
    texto: 'Serviços, horários, equipe e clientes no mesmo fluxo, com menos improviso na rotina.',
  },
  {
    inicial: 'C',
    titulo: 'Clientes em contexto',
    texto: 'Cadastros e histórico acessíveis para melhorar atendimento, relacionamento e acompanhamento.',
  },
  {
    inicial: 'S',
    titulo: 'Serviços padronizados',
    texto: 'Configure duração, valores e disponibilidade para deixar a operação mais previsível.',
  },
  {
    inicial: 'E',
    titulo: 'Equipe bem distribuída',
    texto: 'Acompanhe profissionais, funcionários ou professores conforme o módulo usado pela empresa.',
  },
  {
    inicial: 'V',
    titulo: 'Vitrine pública',
    texto: 'Use catálogo, cardápio ou link público quando esses recursos estiverem ativos para o negócio.',
  },
  {
    inicial: 'R',
    titulo: 'Relatórios para decidir',
    texto: 'Visualize indicadores e dados operacionais sem depender de anotações soltas.',
  },
]

const segmentos = [
  'Barbearia',
  'Salão',
  'Pet shop',
  'Clínica',
  'Cursos',
  'Oficina',
  'Lava jato',
  'Personal trainer',
  'Psicologia e terapia',
  'Condomínio',
  'Fotografia',
  'Gestão esportiva',
]

const passos = [
  {
    titulo: 'Cadastre sua empresa',
    texto: 'Envie as informações principais para nossa equipe analisar a entrada na plataforma.',
  },
  {
    titulo: 'Configure sua operação',
    texto: 'Ajuste serviços, equipe, agenda, estoque, módulos e preferências da empresa.',
  },
  {
    titulo: 'Compartilhe seus links',
    texto: 'Divulgue agendamento, catálogo ou cardápio público quando fizer sentido para o seu plano.',
  },
  {
    titulo: 'Acompanhe pelo painel',
    texto: 'Veja atendimentos, clientes, produtos, relatórios e rotinas administrativas com clareza.',
  },
]

const modulos = [
  {
    titulo: 'Agendamentos',
    texto: 'Clientes, profissionais, serviços, disponibilidade e links públicos de agendamento.',
  },
  {
    titulo: 'Estoque e catálogo',
    texto: 'Produtos, quantidades, catálogo público e cardápio digital para operações que vendem itens.',
  },
  {
    titulo: 'Gestão Esportiva',
    texto: 'Turmas, alunos, professores, aulas, frequência, reposições e rotina de modalidades.',
  },
  {
    titulo: 'Administração SaaS',
    texto: 'Empresas, planos, solicitações, assinaturas e visão administrativa da plataforma.',
  },
  {
    titulo: 'Relatórios',
    texto: 'Informações gerenciais para acompanhar desempenho e apoiar decisões do dia a dia.',
  },
  {
    titulo: 'Personalização pública',
    texto: 'Identidade, links e páginas públicas preparados para uma apresentação mais profissional.',
  },
]

const motivos = [
  {
    titulo: 'Menos retrabalho',
    texto: 'As informações ficam centralizadas, reduzindo conversas perdidas e controles paralelos.',
  },
  {
    titulo: 'Mais presença digital',
    texto: 'Links públicos ajudam clientes a encontrar serviços, produtos e canais de atendimento.',
  },
  {
    titulo: 'Operação por perfil',
    texto: 'Permissões e módulos ajudam cada pessoa a acessar o que precisa, no contexto correto.',
  },
  {
    titulo: 'Base para crescer',
    texto: 'A estrutura multiempresa e modular acompanha negócios simples e operações mais completas.',
  },
]
</script>

<template>
  <main class="pagina-index-publica">
    <section class="hero">
      <span class="decor decor-um" aria-hidden="true"></span>
      <span class="decor decor-dois" aria-hidden="true"></span>

      <PublicHeader />

      <div class="hero-grid">
        <article class="hero-conteudo">
          <span class="selo">Portal público NuvemMais</span>
          <h1>Gestão online para empresas que querem atender melhor e crescer com controle.</h1>
          <p class="descricao">
            Organize agenda, clientes, equipe, serviços, estoque, catálogo, gestão esportiva e administração SaaS em
            uma plataforma moderna, modular e preparada para diferentes segmentos.
          </p>

          <div class="acoes-hero">
            <RouterLink class="botao principal" to="/cadastro">Começar agora</RouterLink>
            <RouterLink class="botao secundario" to="/login">Entrar no sistema</RouterLink>
          </div>

          <div class="credenciais" aria-label="Destaques da plataforma">
            <span v-for="item in credenciais" :key="item">{{ item }}</span>
          </div>
        </article>

        <aside class="mockup-painel" aria-label="Prévia ilustrativa do painel">
          <div class="mockup-topo">
            <span></span>
            <span></span>
            <span></span>
            <strong>Operação de hoje</strong>
          </div>
          <div class="mockup-corpo">
            <section class="mockup-card destaque">
              <small>Agenda</small>
              <strong>32 atendimentos</strong>
              <div class="barra"><span></span></div>
            </section>
            <section class="mockup-card">
              <small>Clientes</small>
              <strong>428</strong>
              <p>cadastros ativos</p>
            </section>
            <section class="mockup-card">
              <small>Estoque</small>
              <strong>126</strong>
              <p>produtos monitorados</p>
            </section>
            <section class="mockup-lista">
              <div><span></span><p>Equipe disponível</p><strong>8</strong></div>
              <div><span></span><p>Catálogo publicado</p><strong>Ativo</strong></div>
              <div><span></span><p>Relatórios do mês</p><strong>OK</strong></div>
            </section>
          </div>
        </aside>
      </div>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Benefícios</span>
        <h2>Uma rotina mais clara, do primeiro contato ao acompanhamento.</h2>
        <p>Recursos pensados para reduzir bagunça operacional e dar uma visão mais profissional da empresa.</p>
      </div>

      <div class="grade beneficios">
        <article v-for="beneficio in beneficios" :key="beneficio.titulo" class="card-beneficio">
          <span>{{ beneficio.inicial }}</span>
          <h3>{{ beneficio.titulo }}</h3>
          <p>{{ beneficio.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao segmentos-secao">
      <div class="secao-cabecalho">
        <span class="selo">Para quem é</span>
        <h2>Flexível para serviços, atendimento, produtos e esporte.</h2>
        <p>O portal público apresenta uma plataforma preparada para segmentos diferentes sem perder organização.</p>
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
        <span class="selo">Como funciona</span>
        <h2>Um caminho simples para sair da planilha e entrar no painel.</h2>
      </div>

      <div class="linha-tempo">
        <article v-for="(passo, indice) in passos" :key="passo.titulo">
          <span>{{ indice + 1 }}</span>
          <h3>{{ passo.titulo }}</h3>
          <p>{{ passo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao modulos-secao">
      <div class="secao-cabecalho">
        <span class="selo">Módulos</span>
        <h2>Ative o que combina com a operação da empresa.</h2>
        <p>O NuvemMais Gestão pode apoiar desde uma agenda simples até rotinas com estoque, esporte e administração SaaS.</p>
      </div>

      <div class="grade modulos">
        <article v-for="modulo in modulos" :key="modulo.titulo" class="modulo-card">
          <h3>{{ modulo.titulo }}</h3>
          <p>{{ modulo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao porque-secao">
      <div class="porque-card">
        <div class="secao-cabecalho">
          <span class="selo">Por que usar</span>
          <h2>Uma base confiável para profissionalizar a gestão.</h2>
          <p>
            O sistema ajuda empresas a organizar dados, padronizar processos e acompanhar a operação com mais segurança,
            sem prometer automações financeiras que ainda não fazem parte do fluxo final.
          </p>
        </div>

        <div class="motivos">
          <article v-for="motivo in motivos" :key="motivo.titulo">
            <h3>{{ motivo.titulo }}</h3>
            <p>{{ motivo.texto }}</p>
          </article>
        </div>
      </div>
    </section>

    <section class="cta-final">
      <span class="selo">Comece com clareza</span>
      <h2>Seu negócio com uma entrada pública mais profissional e um painel para acompanhar tudo.</h2>
      <p>Cadastre sua empresa para análise ou acesse sua conta para continuar a gestão pelo sistema.</p>
      <div class="acoes-hero">
        <RouterLink class="botao principal" to="/cadastro">Começar agora</RouterLink>
        <RouterLink class="botao secundario claro" to="/login">Acessar minha conta</RouterLink>
      </div>
    </section>

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-index-publica {
  min-height: 100vh;
  overflow: hidden;
  background: #f8fafc;
  color: #0f172a;
}

.hero {
  position: relative;
  border-bottom: 1px solid #dbeafe;
  background:
    radial-gradient(circle at 84% 18%, rgba(20, 184, 166, .22), transparent 28%),
    radial-gradient(circle at 10% 16%, rgba(37, 99, 235, .2), transparent 32%),
    linear-gradient(135deg, #eef6ff 0%, #f8fbff 48%, #ecfeff 100%);
  padding-bottom: 82px;
}

.decor {
  position: absolute;
  pointer-events: none;
  border: 1px solid rgba(37, 99, 235, .15);
  border-radius: 999px;
  background: rgba(255, 255, 255, .4);
  filter: blur(.2px);
}

.decor-um {
  width: 220px;
  height: 220px;
  right: -86px;
  top: 128px;
}

.decor-dois {
  width: 140px;
  height: 140px;
  left: -60px;
  bottom: 36px;
}

.hero-grid,
.secao,
.cta-final {
  width: min(1160px, 100%);
  margin: 0 auto;
  padding-right: 20px;
  padding-left: 20px;
}

.hero-grid {
  position: relative;
  display: grid;
  grid-template-columns: minmax(0, 1.02fr) minmax(360px, .82fr);
  gap: 44px;
  align-items: center;
  padding-top: 56px;
}

.hero-conteudo,
.secao-cabecalho,
.card-beneficio,
.modulo-card,
.porque-card,
.cta-final {
  display: grid;
  gap: 16px;
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  max-width: 840px;
  font-size: 60px;
  line-height: 1.02;
  font-weight: 900;
}

h2 {
  font-size: 36px;
  line-height: 1.12;
  font-weight: 900;
}

h3 {
  font-size: 20px;
  font-weight: 900;
}

.descricao,
.secao-cabecalho p,
.card-beneficio p,
.modulo-card p,
.linha-tempo p,
.porque-card p,
.cta-final p {
  color: #475569;
  font-size: 16px;
  line-height: 1.65;
}

.descricao {
  max-width: 760px;
  font-size: 19px;
}

.acoes-hero,
.credenciais {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.acoes-hero {
  margin-top: 8px;
}

.botao {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 13px 20px;
  font-weight: 900;
  text-align: center;
  text-decoration: none;
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao.principal {
  background: #2563eb;
  color: white;
  box-shadow: 0 18px 34px rgba(37, 99, 235, .24);
}

.botao.secundario {
  border: 1px solid #cbd5e1;
  background: white;
  color: #0f172a;
}

.botao.claro {
  border-color: rgba(255, 255, 255, .5);
  background: rgba(255, 255, 255, .12);
  color: white;
}

.credenciais {
  margin-top: 18px;
}

.credenciais span {
  border: 1px solid rgba(37, 99, 235, .14);
  border-radius: 999px;
  background: rgba(255, 255, 255, .72);
  padding: 9px 12px;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
  box-shadow: 0 10px 22px rgba(15, 23, 42, .05);
}

.mockup-painel {
  border: 1px solid rgba(148, 163, 184, .38);
  border-radius: 22px;
  background: rgba(255, 255, 255, .78);
  box-shadow: 0 28px 70px rgba(15, 23, 42, .16);
  backdrop-filter: blur(18px);
  overflow: hidden;
}

.mockup-topo {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid #e2e8f0;
  padding: 16px 18px;
}

.mockup-topo span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #cbd5e1;
}

.mockup-topo strong {
  margin-left: auto;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
}

.mockup-corpo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
  padding: 18px;
}

.mockup-card,
.mockup-lista {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  background: #ffffff;
  padding: 16px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
}

.mockup-card {
  display: grid;
  gap: 8px;
  min-height: 132px;
}

.mockup-card.destaque {
  grid-column: 1 / -1;
  background:
    radial-gradient(circle at 90% 10%, rgba(20, 184, 166, .18), transparent 30%),
    #0f172a;
  color: white;
}

.mockup-card small,
.mockup-card p {
  color: #64748b;
  font-weight: 800;
}

.mockup-card.destaque small {
  color: #bfdbfe;
}

.mockup-card strong {
  font-size: 26px;
  line-height: 1.08;
}

.barra {
  height: 10px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .18);
  overflow: hidden;
}

.barra span {
  display: block;
  width: 72%;
  height: 100%;
  border-radius: inherit;
  background: #14b8a6;
}

.mockup-lista {
  grid-column: 1 / -1;
  display: grid;
  gap: 10px;
}

.mockup-lista div {
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 10px;
}

.mockup-lista span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #2563eb;
}

.mockup-lista p {
  color: #334155;
  font-weight: 800;
}

.mockup-lista strong {
  font-size: 13px;
  font-weight: 900;
}

.secao {
  padding-top: 74px;
  padding-bottom: 74px;
}

.secao-cabecalho {
  max-width: 780px;
  margin-bottom: 28px;
}

.grade {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 16px;
}

.card-beneficio,
.modulo-card,
.linha-tempo article,
.motivos article {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  background: white;
  padding: 22px;
  box-shadow: 0 14px 34px rgba(15, 23, 42, .06);
}

.card-beneficio span {
  display: inline-grid;
  width: 42px;
  height: 42px;
  place-items: center;
  border-radius: 13px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 900;
}

.segmentos-secao,
.porque-secao {
  width: 100%;
  max-width: none;
  padding-right: max(20px, calc((100% - 1160px) / 2));
  padding-left: max(20px, calc((100% - 1160px) / 2));
  background: #0f172a;
  color: white;
}

.segmentos-secao .secao-cabecalho p,
.segmentos-secao .selo,
.porque-secao .secao-cabecalho p,
.porque-secao .selo {
  color: #bfdbfe;
}

.segmentos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.segmentos article {
  display: flex;
  align-items: center;
  gap: 10px;
  min-height: 66px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 14px;
  background: rgba(255, 255, 255, .08);
  padding: 14px;
}

.segmentos span {
  display: inline-grid;
  width: 32px;
  height: 32px;
  place-items: center;
  border-radius: 10px;
  background: rgba(255, 255, 255, .12);
  color: #bfdbfe;
  font-weight: 900;
}

.segmentos strong {
  font-weight: 900;
}

.linha-tempo {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.linha-tempo article {
  position: relative;
  display: grid;
  gap: 12px;
  border-top: 4px solid #2563eb;
}

.linha-tempo article > span {
  display: inline-grid;
  width: 36px;
  height: 36px;
  place-items: center;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-weight: 900;
}

.modulos-secao {
  padding-top: 20px;
}

.modulo-card {
  min-height: 188px;
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.porque-card {
  width: min(1160px, 100%);
  margin: 0 auto;
  grid-template-columns: minmax(0, .9fr) minmax(360px, 1fr);
  align-items: start;
}

.porque-card .secao-cabecalho {
  margin-bottom: 0;
}

.motivos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.motivos article {
  background: rgba(255, 255, 255, .08);
  border-color: rgba(255, 255, 255, .14);
  box-shadow: none;
}

.motivos p {
  color: #dbeafe;
}

.cta-final {
  margin-top: 54px;
  margin-bottom: 20px;
  border-radius: 24px;
  background:
    radial-gradient(circle at 90% 18%, rgba(20, 184, 166, .34), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
  padding: 48px 36px;
  color: white;
  box-shadow: 0 28px 70px rgba(15, 23, 42, .18);
}

.cta-final .selo,
.cta-final p {
  color: #dbeafe;
}

@media (max-width: 980px) {
  .hero-grid,
  .porque-card {
    grid-template-columns: 1fr;
  }

  .grade,
  .segmentos,
  .linha-tempo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  h1 {
    font-size: 46px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding-bottom: 54px;
  }

  .hero-grid {
    padding: 34px 14px 0;
  }

  h1 {
    font-size: 36px;
  }

  h2 {
    font-size: 28px;
  }

  .descricao {
    font-size: 16px;
  }

  .acoes-hero,
  .botao {
    width: 100%;
  }

  .mockup-corpo,
  .grade,
  .segmentos,
  .linha-tempo,
  .motivos {
    grid-template-columns: 1fr;
  }

  .secao {
    padding: 52px 14px;
  }

  .segmentos-secao,
  .porque-secao {
    padding-right: 14px;
    padding-left: 14px;
  }

  .card-beneficio,
  .modulo-card,
  .linha-tempo article,
  .motivos article,
  .mockup-card,
  .mockup-lista {
    padding: 18px;
  }

  .cta-final {
    width: calc(100% - 28px);
    padding: 34px 20px;
  }
}
</style>
