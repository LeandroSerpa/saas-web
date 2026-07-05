<script setup>
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { RouterLink } from 'vue-router'
import heroMarca from '@/assets/brand/nuvemmais-hero.png'

const credenciais = [
  'Multiempresa',
  'Agenda pública',
  'Catálogo',
  'Módulos por segmento',
  'Gestão esportiva',
  'Administração SaaS',
]

const indicadores = [
  { rotulo: 'Agenda', valor: '32', detalhe: 'atendimentos hoje' },
  { rotulo: 'Receita', valor: 'R$ 8,4 mil', detalhe: 'controle do mês' },
  { rotulo: 'Clientes', valor: '428', detalhe: 'cadastros ativos' },
  { rotulo: 'Estoque', valor: '126', detalhe: 'produtos monitorados' },
  { rotulo: 'Esporte', valor: '18', detalhe: 'turmas ativas' },
]

const beneficios = [
  {
    titulo: 'Agenda com menos improviso',
    texto: 'Serviços, profissionais, horários e clientes ficam conectados para uma rotina mais previsível.',
    detalhe: 'Link público, equipe e disponibilidade em contexto.',
  },
  {
    titulo: 'Operação centralizada',
    texto: 'Clientes, produtos, estoque, catálogo e histórico ficam organizados no mesmo ambiente de gestão.',
    detalhe: 'Menos planilhas paralelas e mais clareza no dia a dia.',
  },
  {
    titulo: 'Módulos por modelo de negócio',
    texto: 'A empresa ativa o que faz sentido para sua operação, sem poluir o painel com recursos desnecessários.',
    detalhe: 'Agenda, estoque, catálogo, esporte e relatórios.',
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
  'Psicologia/Terapia',
  'Condomínio',
  'Fotografia',
  'Gestão esportiva',
]

const modelos = [
  'Serviços com horário marcado',
  'Atendimento por equipe',
  'Produtos com catálogo público',
  'Turmas e aulas esportivas',
]

const passos = [
  {
    titulo: 'Cliente encontra o link',
    texto: 'A empresa divulga o agendamento, catálogo ou cardápio conforme os recursos ativos no plano.',
  },
  {
    titulo: 'Solicitação entra organizada',
    texto: 'Dados importantes chegam com contexto para reduzir ruído entre atendimento, equipe e gestão.',
  },
  {
    titulo: 'Equipe acompanha pelo painel',
    texto: 'Agenda, clientes, produtos, faturas e indicadores ficam visíveis para a rotina interna.',
  },
  {
    titulo: 'Gestão evolui por módulo',
    texto: 'A operação pode crescer com estoque, relatórios, gestão esportiva e personalização pública.',
  },
]

const modulos = [
  {
    titulo: 'Agendamentos',
    texto: 'Clientes, serviços, profissionais, disponibilidade e link público de marcação.',
  },
  {
    titulo: 'Estoque e catálogo',
    texto: 'Produtos, quantidades, vitrine pública e cardápio digital quando aplicável ao negócio.',
  },
  {
    titulo: 'Gestão Esportiva',
    texto: 'Turmas, alunos, professores, aulas, frequência e rotina de modalidades esportivas.',
  },
  {
    titulo: 'Relatórios',
    texto: 'Indicadores operacionais para acompanhar movimento, atendimentos e evolução da empresa.',
  },
  {
    titulo: 'Administração SaaS',
    texto: 'Empresas, planos, solicitações, assinaturas e visão administrativa da plataforma.',
  },
  {
    titulo: 'Personalização pública',
    texto: 'Páginas públicas, identidade, links e presença digital com apresentação mais profissional.',
  },
]
</script>

<template>
  <main class="pagina-index-publica">
    <section class="hero">
      <PublicHeader />

      <div class="hero-stage">
        <img class="hero-marca" :src="heroMarca" alt="" aria-hidden="true" />
        <div class="hero-copy">
          <span class="selo claro">Portal público NuvemMais Gestão</span>
          <h1>Uma vitrine profissional para sua empresa e um painel para organizar a operação.</h1>
          <p>
            Centralize agenda, clientes, equipe, serviços, estoque, catálogo, gestão esportiva e rotinas administrativas
            em uma plataforma modular preparada para empresas reais.
          </p>
          <div class="acoes-hero">
            <RouterLink class="botao principal" to="/cadastro">Começar agora</RouterLink>
            <RouterLink class="botao secundario" to="/login">Entrar no sistema</RouterLink>
          </div>
        </div>

        <div class="produto-visual" aria-label="Prévia ilustrativa do painel NuvemMais Gestão">
          <div class="produto-topo">
            <span></span>
            <span></span>
            <span></span>
            <strong>Painel operacional</strong>
          </div>
          <div class="produto-grid">
            <article class="agenda-card">
              <div>
                <small>Agenda de hoje</small>
                <strong>32 atendimentos</strong>
              </div>
              <ol>
                <li><span>09:00</span><p>Corte e barba</p><strong>Confirmado</strong></li>
                <li><span>10:30</span><p>Aula em turma</p><strong>Aberto</strong></li>
                <li><span>14:00</span><p>Consulta inicial</p><strong>Novo</strong></li>
              </ol>
            </article>

            <article v-for="indicador in indicadores" :key="indicador.rotulo" class="indicador-card">
              <small>{{ indicador.rotulo }}</small>
              <strong>{{ indicador.valor }}</strong>
              <p>{{ indicador.detalhe }}</p>
            </article>
          </div>
        </div>
      </div>
    </section>

    <section class="faixa-confianca" aria-label="Destaques da plataforma">
      <span v-for="item in credenciais" :key="item">{{ item }}</span>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Benefícios</span>
        <h2>O básico da gestão fica simples. O avançado fica no lugar certo.</h2>
        <p>Uma experiência pensada para empresas que precisam vender, atender, organizar equipe e acompanhar resultados.</p>
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
        <h2>Visual único para negócios diferentes.</h2>
        <p>O portal comunica uma plataforma flexível para atendimento, serviços, produtos, aulas e operações locais.</p>
      </div>

      <div class="segmentos">
        <article v-for="segmento in segmentos" :key="segmento">
          <span aria-hidden="true">{{ segmento.slice(0, 1) }}</span>
          <strong>{{ segmento }}</strong>
        </article>
      </div>
    </section>

    <section class="secao modelos-secao">
      <div class="modelo-card">
        <div>
          <span class="selo">Uma plataforma, vários modelos</span>
          <h2>Do atendimento local à gestão esportiva, sem duplicar sistemas.</h2>
          <p>
            A mesma base sustenta empresas que trabalham com horários, equipes, produtos, catálogo público, turmas e
            acompanhamento operacional.
          </p>
        </div>

        <div class="modelo-lista">
          <span v-for="modelo in modelos" :key="modelo">{{ modelo }}</span>
        </div>
      </div>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Fluxo completo</span>
        <h2>Do link público ao painel de gestão.</h2>
        <p>O cliente vê uma entrada clara. A empresa recebe informação com contexto. A equipe trabalha com mais controle.</p>
      </div>

      <div class="linha-tempo">
        <article v-for="(passo, indice) in passos" :key="passo.titulo">
          <span>{{ String(indice + 1).padStart(2, '0') }}</span>
          <h3>{{ passo.titulo }}</h3>
          <p>{{ passo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao modulos-secao">
      <div class="secao-cabecalho">
        <span class="selo">Módulos</span>
        <h2>Recursos premium para compor a operação certa.</h2>
        <p>Ative o que combina com a empresa e mantenha a navegação limpa para quem usa o sistema todos os dias.</p>
      </div>

      <div class="grade modulos">
        <article v-for="modulo in modulos" :key="modulo.titulo" class="modulo-card">
          <span aria-hidden="true"></span>
          <h3>{{ modulo.titulo }}</h3>
          <p>{{ modulo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="cta-final">
      <span class="selo claro">Comece com presença profissional</span>
      <h2>Cadastre sua empresa e leve a rotina para um painel mais claro, modular e confiável.</h2>
      <p>Envie a solicitação para análise ou acesse sua conta para continuar a gestão pelo sistema.</p>
      <div class="acoes-hero">
        <RouterLink class="botao principal claro" to="/cadastro">Começar agora</RouterLink>
        <RouterLink class="botao secundario claro-borda" to="/login">Acessar minha conta</RouterLink>
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
  border-bottom: 1px solid rgba(148, 163, 184, .24);
  background:
    linear-gradient(110deg, rgba(14, 165, 233, .16) 0 1px, transparent 1px 100%) 0 0 / 72px 72px,
    radial-gradient(circle at 24% 12%, rgba(37, 99, 235, .42), transparent 34%),
    radial-gradient(circle at 82% 26%, rgba(20, 184, 166, .28), transparent 30%),
    linear-gradient(135deg, #071124 0%, #0f172a 48%, #123b78 100%);
  color: white;
}

.hero-stage {
  position: relative;
  width: min(1160px, 100%);
  margin: 0 auto;
  display: grid;
  gap: 34px;
  padding: 66px 20px 84px;
}

.hero-marca {
  position: absolute;
  top: 108px;
  right: 20px;
  width: min(430px, 46vw);
  border-radius: 18px;
  opacity: .14;
  filter: saturate(1.15);
}

.hero-copy {
  position: relative;
  z-index: 1;
  display: grid;
  justify-items: center;
  gap: 18px;
  max-width: 920px;
  margin: 0 auto;
  text-align: center;
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
ol {
  margin: 0;
}

h1 {
  max-width: 980px;
  font-size: clamp(44px, 7vw, 78px);
  line-height: .98;
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
  max-width: 780px;
  color: #dbeafe;
  font-size: 19px;
  line-height: 1.7;
}

.acoes-hero {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
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
  transition: transform .18s ease, box-shadow .18s ease, background .18s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao.principal {
  background: #38bdf8;
  color: #071124;
  box-shadow: 0 20px 38px rgba(56, 189, 248, .26);
}

.botao.principal.claro {
  background: white;
  color: #0f172a;
}

.botao.secundario {
  border: 1px solid rgba(255, 255, 255, .28);
  background: rgba(255, 255, 255, .08);
  color: white;
}

.botao.claro-borda {
  border-color: rgba(255, 255, 255, .42);
}

.produto-visual {
  position: relative;
  z-index: 1;
  width: min(100%, 980px);
  margin: 16px auto 0;
  border: 1px solid rgba(255, 255, 255, .2);
  border-radius: 24px;
  background: rgba(8, 15, 31, .72);
  box-shadow: 0 34px 90px rgba(0, 0, 0, .32);
  backdrop-filter: blur(20px);
  overflow: hidden;
}

.produto-topo {
  display: flex;
  align-items: center;
  gap: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, .12);
  padding: 15px 18px;
}

.produto-topo span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: rgba(226, 232, 240, .56);
}

.produto-topo strong {
  margin-left: auto;
  color: #bfdbfe;
  font-size: 13px;
  font-weight: 900;
}

.produto-grid {
  display: grid;
  grid-template-columns: minmax(260px, 1.35fr) repeat(2, minmax(150px, .75fr));
  gap: 14px;
  padding: 18px;
}

.agenda-card,
.indicador-card {
  border: 1px solid rgba(255, 255, 255, .12);
  border-radius: 18px;
  background: rgba(255, 255, 255, .08);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .08);
}

.agenda-card {
  grid-row: span 3;
  display: grid;
  gap: 18px;
  padding: 20px;
}

.agenda-card small,
.indicador-card small {
  color: #93c5fd;
  font-weight: 900;
  text-transform: uppercase;
}

.agenda-card strong {
  display: block;
  margin-top: 6px;
  font-size: 28px;
}

.agenda-card ol {
  display: grid;
  gap: 10px;
  padding: 0;
  list-style: none;
}

.agenda-card li {
  display: grid;
  grid-template-columns: 58px 1fr auto;
  align-items: center;
  gap: 10px;
  border-radius: 12px;
  background: rgba(255, 255, 255, .08);
  padding: 12px;
}

.agenda-card li span,
.agenda-card li strong {
  color: #7dd3fc;
  font-size: 12px;
  font-weight: 900;
}

.agenda-card li p {
  color: #e0f2fe;
  font-weight: 800;
}

.indicador-card {
  min-height: 132px;
  display: grid;
  align-content: center;
  gap: 8px;
  padding: 18px;
}

.indicador-card strong {
  font-size: 27px;
  line-height: 1;
}

.indicador-card p {
  color: #cbd5e1;
  font-size: 13px;
  line-height: 1.45;
}

.faixa-confianca {
  width: min(1160px, calc(100% - 40px));
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 10px;
  margin: -34px auto 0;
  position: relative;
  z-index: 2;
}

.faixa-confianca span {
  display: grid;
  min-height: 64px;
  place-items: center;
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 16px;
  background: rgba(255, 255, 255, .94);
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
  box-shadow: 0 18px 38px rgba(15, 23, 42, .08);
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
  max-width: 790px;
  margin-bottom: 30px;
}

.secao-cabecalho p,
.card-beneficio p,
.modulo-card p,
.linha-tempo p,
.modelo-card p,
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
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 18px;
  background: white;
  padding: 24px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, .07);
}

.card-beneficio > span,
.modulo-card > span {
  width: 42px;
  height: 42px;
  border-radius: 14px;
  background:
    linear-gradient(135deg, rgba(37, 99, 235, .16), rgba(20, 184, 166, .22));
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
    linear-gradient(110deg, rgba(125, 211, 252, .1) 0 1px, transparent 1px 100%) 0 0 / 64px 64px,
    #0f172a;
  color: white;
}

.segmentos-secao .secao-cabecalho p {
  color: #cbd5e1;
}

.segmentos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.segmentos article {
  display: flex;
  align-items: center;
  gap: 12px;
  min-height: 70px;
  border: 1px solid rgba(255, 255, 255, .14);
  border-radius: 16px;
  background: rgba(255, 255, 255, .08);
  padding: 14px;
}

.segmentos span {
  display: inline-grid;
  width: 34px;
  height: 34px;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 12px;
  background: rgba(125, 211, 252, .14);
  color: #7dd3fc;
  font-weight: 900;
}

.modelos-secao {
  padding-bottom: 32px;
}

.modelo-card {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(280px, .62fr);
  gap: 26px;
  align-items: center;
  border: 1px solid rgba(37, 99, 235, .14);
  border-radius: 24px;
  background:
    radial-gradient(circle at 88% 16%, rgba(20, 184, 166, .16), transparent 28%),
    linear-gradient(135deg, #ffffff 0%, #eef6ff 100%);
  padding: 34px;
  box-shadow: 0 22px 54px rgba(15, 23, 42, .08);
}

.modelo-card > div:first-child {
  display: grid;
  gap: 14px;
}

.modelo-lista {
  display: grid;
  gap: 10px;
}

.modelo-lista span {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: white;
  padding: 14px 16px;
  color: #1e3a8a;
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
  background:
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.cta-final {
  display: grid;
  justify-items: center;
  gap: 16px;
  margin-top: 26px;
  margin-bottom: 24px;
  border-radius: 24px;
  background:
    linear-gradient(110deg, rgba(125, 211, 252, .12) 0 1px, transparent 1px 100%) 0 0 / 58px 58px,
    radial-gradient(circle at 76% 24%, rgba(20, 184, 166, .3), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #071124 100%);
  padding: 54px 36px;
  color: white;
  text-align: center;
  box-shadow: 0 28px 70px rgba(15, 23, 42, .18);
}

.cta-final h2 {
  max-width: 820px;
}

.cta-final p {
  max-width: 680px;
  color: #dbeafe;
}

@media (max-width: 980px) {
  .produto-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .agenda-card {
    grid-column: 1 / -1;
    grid-row: auto;
  }

  .faixa-confianca,
  .grade,
  .segmentos,
  .linha-tempo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .modelo-card {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .hero-stage {
    padding: 42px 14px 58px;
  }

  .hero-marca {
    display: none;
  }

  .hero-copy {
    text-align: left;
    justify-items: start;
  }

  h1 {
    font-size: 40px;
  }

  .hero-copy p {
    font-size: 16px;
  }

  .acoes-hero,
  .botao {
    width: 100%;
  }

  .produto-grid,
  .faixa-confianca,
  .grade,
  .segmentos,
  .linha-tempo {
    grid-template-columns: 1fr;
  }

  .agenda-card li {
    grid-template-columns: 1fr;
  }

  .secao {
    padding: 58px 14px;
  }

  .segmentos-secao {
    padding-right: 14px;
    padding-left: 14px;
  }

  .modelo-card,
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
