<script setup>
import { RouterLink } from 'vue-router'

const beneficios = [
  {
    titulo: 'Agenda',
    texto: 'Organize horários, atendimentos, profissionais e disponibilidade em uma rotina mais clara.',
  },
  {
    titulo: 'Clientes',
    texto: 'Mantenha cadastros, contatos e histórico de relacionamento sempre à mão.',
  },
  {
    titulo: 'Serviços',
    texto: 'Configure serviços, duração, valores e regras de atendimento de forma simples.',
  },
  {
    titulo: 'Equipe',
    texto: 'Acompanhe funcionários, profissionais ou professores conforme o contexto da empresa.',
  },
  {
    titulo: 'Estoque e catálogo',
    texto: 'Controle produtos e compartilhe uma vitrine pública quando esse módulo estiver ativo.',
  },
  {
    titulo: 'Gestão esportiva',
    texto: 'Gerencie turmas, alunos, professores, aulas e rotinas esportivas com mais organização.',
  },
  {
    titulo: 'Relatórios',
    texto: 'Acompanhe indicadores e informações importantes para decidir com mais segurança.',
  },
  {
    titulo: 'Administração SaaS',
    texto: 'Tenha visão multiempresa, planos, solicitações e recursos administrativos para operação da plataforma.',
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
    texto: 'Envie os dados principais para iniciar a entrada no NuvemMais Gestão.',
  },
  {
    titulo: 'Configure serviços e equipe',
    texto: 'Ajuste profissionais, serviços, horários, módulos e recursos conforme sua operação.',
  },
  {
    titulo: 'Compartilhe seu link',
    texto: 'Use links públicos de agendamento, catálogo ou cardápio quando estiverem disponíveis para sua empresa.',
  },
  {
    titulo: 'Acompanhe tudo pelo painel',
    texto: 'Visualize agenda, clientes, estoque, relatórios e rotinas administrativas em um só lugar.',
  },
]

const modulos = [
  {
    titulo: 'Agendamentos',
    texto: 'Fluxo para organizar serviços, profissionais, clientes, horários e agendamentos públicos.',
  },
  {
    titulo: 'Estoque e catálogo',
    texto: 'Controle de produtos, quantidades e publicação de catálogo ou cardápio digital.',
  },
  {
    titulo: 'Gestão Esportiva',
    texto: 'Recursos para turmas, alunos, professores, aulas, frequência e reposições.',
  },
  {
    titulo: 'Administração SaaS',
    texto: 'Ferramentas para acompanhar empresas, planos, assinaturas, auditoria e lixeira global.',
  },
]

const confianca = [
  'Multiempresa',
  'Permissões por perfil',
  'Ambiente online',
  'Personalização da empresa',
  'Auditoria e lixeira',
]
</script>

<template>
  <main class="pagina-index-publica">
    <section class="hero">
      <nav class="nav-publica" aria-label="Navegação pública">
        <RouterLink class="marca" to="/">
          <span class="marca-simbolo">NM</span>
          <span>NuvemMais Gestão</span>
        </RouterLink>

        <div class="nav-links">
          <RouterLink to="/sobre">Sobre</RouterLink>
          <RouterLink to="/cadastro">Comece agora</RouterLink>
          <RouterLink class="link-login" to="/login">Entrar</RouterLink>
        </div>
      </nav>

      <div class="hero-grid">
        <article class="hero-conteudo">
          <span class="selo">Gestão empresarial na nuvem</span>
          <h1>NuvemMais Gestão</h1>
          <p class="frase-valor">Mais controle para sua empresa atender, vender e crescer com organização.</p>
          <p class="descricao">
            Uma plataforma online para centralizar agenda, clientes, serviços, equipe, estoque, catálogo, gestão
            esportiva e administração SaaS em uma experiência simples e profissional.
          </p>

          <div class="acoes-hero">
            <RouterLink class="botao principal" to="/cadastro">Começar agora</RouterLink>
            <RouterLink class="botao secundario" to="/login">Entrar no sistema</RouterLink>
          </div>
        </article>

        <aside class="painel-preview" aria-label="Prévia visual do painel NuvemMais Gestão">
          <div class="preview-topo">
            <span></span>
            <span></span>
            <span></span>
          </div>
          <div class="preview-cabecalho">
            <div>
              <small>Painel</small>
              <strong>Operação do dia</strong>
            </div>
            <span class="preview-status">Online</span>
          </div>
          <div class="preview-metricas">
            <div>
              <small>Agenda</small>
              <strong>24</strong>
              <span>atendimentos</span>
            </div>
            <div>
              <small>Clientes</small>
              <strong>318</strong>
              <span>cadastros</span>
            </div>
          </div>
          <div class="preview-lista">
            <span>Serviços configurados</span>
            <span>Equipe disponível</span>
            <span>Estoque acompanhado</span>
          </div>
        </aside>
      </div>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Benefícios</span>
        <h2>Tudo mais organizado para a rotina da empresa</h2>
        <p>Recursos para reduzir improviso, melhorar acompanhamento e deixar a operação mais fácil de entender.</p>
      </div>

      <div class="grade beneficios">
        <article v-for="beneficio in beneficios" :key="beneficio.titulo" class="card">
          <span class="icone-card" aria-hidden="true">{{ beneficio.titulo.slice(0, 1) }}</span>
          <h3>{{ beneficio.titulo }}</h3>
          <p>{{ beneficio.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao faixa">
      <div class="secao-cabecalho">
        <span class="selo">Para quem é</span>
        <h2>Flexível para diferentes tipos de negócio</h2>
        <p>O NuvemMais Gestão se adapta a empresas de atendimento, serviços, estoque, educação e esporte.</p>
      </div>

      <div class="segmentos">
        <span v-for="segmento in segmentos" :key="segmento">{{ segmento }}</span>
      </div>
    </section>

    <section class="secao">
      <div class="secao-cabecalho">
        <span class="selo">Como funciona</span>
        <h2>Da entrada ao acompanhamento diário</h2>
        <p>Um caminho simples para estruturar a empresa e começar a operar com mais clareza.</p>
      </div>

      <div class="passos">
        <article v-for="(passo, indice) in passos" :key="passo.titulo" class="passo">
          <span>{{ indice + 1 }}</span>
          <h3>{{ passo.titulo }}</h3>
          <p>{{ passo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao modulos-secao">
      <div class="secao-cabecalho">
        <span class="selo">Módulos</span>
        <h2>Ative os recursos certos para cada operação</h2>
        <p>Combine módulos conforme a realidade da empresa, sem misturar rotinas que precisam ficar claras.</p>
      </div>

      <div class="grade modulos">
        <article v-for="modulo in modulos" :key="modulo.titulo" class="card modulo-card">
          <h3>{{ modulo.titulo }}</h3>
          <p>{{ modulo.texto }}</p>
        </article>
      </div>
    </section>

    <section class="secao confianca-secao">
      <div class="confianca-card">
        <div>
          <span class="selo">Confiança</span>
          <h2>Base preparada para crescer com controle</h2>
          <p>
            Recursos administrativos ajudam a manter cada empresa no contexto correto, com permissões, personalização,
            rastreabilidade e organização dos dados.
          </p>
        </div>

        <ul>
          <li v-for="item in confianca" :key="item">{{ item }}</li>
        </ul>
      </div>
    </section>

    <section class="cta-final">
      <span class="selo">Próximo passo</span>
      <h2>Leve sua operação para uma gestão mais profissional</h2>
      <p>Comece o cadastro da empresa ou acesse sua conta para continuar de onde parou.</p>
      <div class="acoes-hero">
        <RouterLink class="botao principal" to="/cadastro">Comece agora</RouterLink>
        <RouterLink class="botao secundario claro" to="/login">Acessar minha conta</RouterLink>
      </div>
    </section>

    <footer class="rodape-publico">
      <strong>NuvemMais Gestão</strong>
      <nav aria-label="Links públicos do rodapé">
        <RouterLink to="/login">Login</RouterLink>
        <RouterLink to="/cadastro">Comece agora</RouterLink>
        <RouterLink to="/sobre">Sobre</RouterLink>
        <RouterLink to="/termos">Termos</RouterLink>
        <RouterLink to="/privacidade">Privacidade</RouterLink>
      </nav>
    </footer>
  </main>
</template>

<style scoped>
.pagina-index-publica {
  min-height: 100vh;
  background: #f8fafc;
  color: #0f172a;
}

.hero {
  background:
    radial-gradient(circle at 88% 12%, rgba(20, 184, 166, .22), transparent 30%),
    linear-gradient(135deg, #eef6ff 0%, #f8fafc 48%, #ecfeff 100%);
  border-bottom: 1px solid #e2e8f0;
  padding: 22px 20px 76px;
}

.nav-publica,
.hero-grid,
.secao,
.cta-final,
.rodape-publico {
  width: min(1160px, 100%);
  margin: 0 auto;
}

.nav-publica {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 18px;
  margin-bottom: 70px;
}

.marca,
.nav-links,
.acoes-hero,
.preview-status,
.segmentos,
.rodape-publico nav {
  display: flex;
  align-items: center;
}

.marca {
  gap: 10px;
  color: #0f172a;
  font-weight: 900;
  text-decoration: none;
}

.marca-simbolo {
  display: inline-grid;
  width: 40px;
  height: 40px;
  place-items: center;
  border-radius: 12px;
  background: #2563eb;
  color: white;
  font-size: 13px;
  letter-spacing: .04em;
}

.nav-links {
  gap: 18px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.nav-links a,
.rodape-publico a {
  color: #334155;
  font-weight: 800;
  text-decoration: none;
}

.nav-links a:hover,
.rodape-publico a:hover {
  color: #2563eb;
  text-decoration: underline;
}

.nav-links .link-login {
  min-height: 40px;
  padding: 10px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: white;
  box-shadow: 0 8px 18px rgba(15, 23, 42, .06);
}

.hero-grid {
  display: grid;
  grid-template-columns: minmax(0, 1.05fr) minmax(320px, .8fr);
  gap: 44px;
  align-items: center;
}

.hero-conteudo,
.secao-cabecalho,
.card,
.passo,
.confianca-card,
.cta-final,
.preview-cabecalho,
.preview-lista {
  display: grid;
  gap: 14px;
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
  max-width: 820px;
  font-size: 64px;
  line-height: 1;
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

.frase-valor {
  max-width: 760px;
  color: #0f172a;
  font-size: 28px;
  line-height: 1.22;
  font-weight: 900;
}

.descricao,
.secao-cabecalho p,
.card p,
.passo p,
.confianca-card p,
.cta-final p {
  color: #475569;
  font-size: 16px;
  line-height: 1.65;
}

.descricao {
  max-width: 720px;
  font-size: 18px;
}

.acoes-hero {
  gap: 12px;
  flex-wrap: wrap;
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
  transition:
    transform .18s ease,
    box-shadow .18s ease,
    background .18s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao.principal {
  background: #2563eb;
  color: white;
  box-shadow: 0 16px 28px rgba(37, 99, 235, .24);
}

.botao.secundario {
  border: 1px solid #cbd5e1;
  background: white;
  color: #0f172a;
}

.botao.claro {
  border-color: rgba(255, 255, 255, .48);
  background: rgba(255, 255, 255, .12);
  color: white;
}

.painel-preview {
  display: grid;
  gap: 18px;
  border: 1px solid rgba(148, 163, 184, .45);
  border-radius: 18px;
  background: rgba(255, 255, 255, .82);
  padding: 22px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .14);
  backdrop-filter: blur(16px);
}

.preview-topo {
  display: flex;
  gap: 7px;
}

.preview-topo span {
  width: 10px;
  height: 10px;
  border-radius: 999px;
  background: #cbd5e1;
}

.preview-cabecalho {
  grid-template-columns: 1fr auto;
  align-items: center;
}

.preview-cabecalho small,
.preview-metricas small,
.preview-metricas span {
  color: #64748b;
  font-weight: 800;
}

.preview-cabecalho strong {
  display: block;
  margin-top: 4px;
  font-size: 24px;
}

.preview-status {
  min-height: 34px;
  padding: 7px 11px;
  border-radius: 999px;
  background: #dcfce7;
  color: #166534;
  font-size: 13px;
  font-weight: 900;
}

.preview-metricas {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.preview-metricas div {
  display: grid;
  gap: 5px;
  min-height: 130px;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: #f8fafc;
  padding: 16px;
}

.preview-metricas strong {
  font-size: 38px;
  line-height: 1;
}

.preview-lista span {
  min-height: 42px;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: white;
  padding: 11px 12px;
  color: #334155;
  font-weight: 800;
}

.secao {
  padding: 72px 20px;
}

.secao-cabecalho {
  max-width: 760px;
  margin-bottom: 28px;
}

.grade {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.card {
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  background: white;
  padding: 22px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
}

.icone-card {
  display: inline-grid;
  width: 38px;
  height: 38px;
  place-items: center;
  border-radius: 10px;
  background: #eff6ff;
  color: #2563eb;
  font-weight: 900;
}

.faixa {
  width: 100%;
  max-width: none;
  padding-right: max(20px, calc((100% - 1160px) / 2));
  padding-left: max(20px, calc((100% - 1160px) / 2));
  background: #0f172a;
  color: white;
}

.faixa .secao-cabecalho p,
.faixa .selo {
  color: #bfdbfe;
}

.segmentos {
  gap: 10px;
  flex-wrap: wrap;
}

.segmentos span {
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 999px;
  background: rgba(255, 255, 255, .08);
  padding: 10px 14px;
  color: white;
  font-weight: 800;
}

.passos {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 16px;
}

.passo {
  position: relative;
  min-width: 0;
  border-top: 3px solid #2563eb;
  border-radius: 12px;
  background: white;
  padding: 22px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, .06);
}

.passo > span {
  display: inline-grid;
  width: 34px;
  height: 34px;
  place-items: center;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  font-weight: 900;
}

.modulos-secao {
  padding-top: 24px;
}

.modulo-card {
  min-height: 190px;
  border-color: #dbeafe;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.confianca-secao {
  padding-top: 24px;
}

.confianca-card {
  grid-template-columns: minmax(0, 1fr) minmax(280px, .7fr);
  align-items: center;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: white;
  padding: 30px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, .08);
}

.confianca-card ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.confianca-card li {
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  background: #f8fafc;
  padding: 12px 14px;
  color: #334155;
  font-weight: 900;
}

.cta-final {
  margin-top: 36px;
  border-radius: 18px;
  background:
    radial-gradient(circle at 92% 20%, rgba(20, 184, 166, .34), transparent 28%),
    linear-gradient(135deg, #1d4ed8 0%, #0f172a 100%);
  padding: 44px 34px;
  color: white;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .18);
}

.cta-final .selo,
.cta-final p {
  color: #dbeafe;
}

.rodape-publico {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  padding: 34px 20px 44px;
  color: #334155;
}

.rodape-publico nav {
  gap: 14px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .nav-publica {
    margin-bottom: 44px;
  }

  .hero-grid,
  .confianca-card {
    grid-template-columns: 1fr;
  }

  .grade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .passos {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  h1 {
    font-size: 48px;
  }

  .frase-valor {
    font-size: 24px;
  }
}

@media (max-width: 640px) {
  .hero {
    padding: 18px 14px 50px;
  }

  .nav-publica,
  .rodape-publico {
    align-items: flex-start;
    flex-direction: column;
  }

  .nav-links,
  .rodape-publico nav {
    width: 100%;
    justify-content: flex-start;
  }

  h1 {
    font-size: 38px;
  }

  h2 {
    font-size: 28px;
  }

  .frase-valor {
    font-size: 21px;
  }

  .descricao {
    font-size: 16px;
  }

  .acoes-hero,
  .botao {
    width: 100%;
  }

  .grade,
  .passos,
  .preview-metricas {
    grid-template-columns: 1fr;
  }

  .secao {
    padding: 52px 14px;
  }

  .card,
  .passo,
  .painel-preview,
  .confianca-card {
    padding: 18px;
  }

  .cta-final {
    width: calc(100% - 28px);
    padding: 32px 20px;
  }
}
</style>
