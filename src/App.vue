<script setup>
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppHeaderCompacto from '@/components/AppHeaderCompacto.vue'
import FinanceiroStatusBanner from '@/components/FinanceiroStatusBanner.vue'
import VisualizacaoEmpresaSelector from '@/components/VisualizacaoEmpresaSelector.vue'
import {
  buscarStatusFinanceiroMinhaEmpresa,
  buscarVersaoSistema,
  carregarUsuarioSessao,
  EVENTO_EMPRESA_VISUALIZACAO,
  limparSessaoAutenticacao,
  obterInfoVersaoSistemaPadrao,
  obterTipoSeloAmbiente,
} from '@/services/api'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const route = useRoute()
const router = useRouter()

const CABECALHOS_PADRAO = {
  dashboard: {
    subtitulo: 'Visão geral',
    titulo: 'Dashboard',
    descricao: 'Acompanhe os principais números da operação.',
  },
  agenda: {
    subtitulo: 'Operação diária',
    titulo: 'Agenda',
    descricao: 'Cadastre e acompanhe os agendamentos da empresa.',
  },
  clientes: {
    subtitulo: 'Relacionamento',
    titulo: 'Clientes',
    descricao: 'Gerencie os clientes cadastrados na sua operação.',
  },
  servicos: {
    subtitulo: 'Catálogo operacional',
    titulo: 'Serviços',
    descricao: 'Organize os serviços oferecidos pela empresa.',
  },
  funcionarios: {
    subtitulo: 'Time',
    titulo: 'Funcionários',
    descricao: 'Acompanhe os profissionais vinculados à operação.',
  },
  disponibilidade: {
    subtitulo: 'Planejamento',
    titulo: 'Disponibilidade',
    descricao: 'Defina horários, bloqueios e regras de atendimento.',
  },
  relatorios: {
    subtitulo: 'Análise',
    titulo: 'Relatórios',
    descricao: 'Consulte indicadores e exporte dados da operação.',
  },
  'minha-conta': {
    subtitulo: 'Perfil',
    titulo: 'Minha conta',
    descricao: 'Atualize os dados do seu acesso.',
  },
  usuarios: {
    subtitulo: 'Acessos',
    titulo: 'Usuários',
    descricao: 'Administre os usuários com acesso ao sistema.',
  },
  estoque: {
    subtitulo: 'Operacao',
    titulo: 'Estoque',
    descricao: 'Controle produtos, quantidades e alertas de baixo estoque.',
  },
  'catalogo-publico-interno': {
    subtitulo: 'Operacao',
    titulo: 'Catalogo publico',
    descricao: 'Configure a vitrine publica de produtos e compartilhe o link com seus clientes.',
  },
  'minha-empresa': {
    subtitulo: 'Configuração empresarial',
    titulo: 'Minha empresa',
    descricao: 'Revise as informações institucionais da empresa.',
  },
  personalizacao: {
    subtitulo: 'Experiência pública',
    titulo: 'Personalização',
    descricao: 'Ajuste a apresentação da página pública da empresa.',
  },
  'meu-plano': {
    subtitulo: 'Assinatura',
    titulo: 'Meu plano',
    descricao: 'Acompanhe recursos e limites do plano atual.',
  },
  ajuda: {
    subtitulo: 'Ajuda interna',
    titulo: 'Central de Ajuda',
    descricao: 'Aprenda a usar as principais funcionalidades do NuvemMais Gestão.',
  },
  onboarding: {
    subtitulo: 'Implantação',
    titulo: 'Primeiros passos',
    descricao: 'Conclua a configuração inicial da empresa.',
  },
  empresas: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Empresas',
    descricao: 'Gerencie as empresas da plataforma.',
  },
  'admin-dashboard': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Dashboard NuvemMais',
    descricao: 'Monitore indicadores gerais da plataforma.',
  },
  planos: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Planos',
    descricao: 'Gerencie planos e módulos disponíveis.',
  },
  assinaturas: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Assinaturas',
    descricao: 'Acompanhe o status das assinaturas ativas.',
  },
  solicitacoes: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Solicitações de cadastro',
    descricao: 'Analise novos pedidos de entrada na plataforma.',
  },
  'solicitacoes-cadastro': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Solicitações de cadastro',
    descricao: 'Analise novos pedidos de entrada na plataforma.',
  },
  faturas: {
    subtitulo: 'Financeiro',
    titulo: 'Faturas',
    descricao: 'Consulte cobranças e pagamentos da empresa.',
  },
  notificacoes: {
    subtitulo: 'Comunicação',
    titulo: 'Notificações',
    descricao: 'Acompanhe avisos e mensagens da plataforma.',
  },
  'configuracoes-notificacoes': {
    subtitulo: 'Comunicação',
    titulo: 'Notificações da empresa',
    descricao: 'Defina como sua empresa recebe notificações.',
  },
  'admin-financeiro': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Inadimplência',
    descricao: 'Acompanhe bloqueios e pendências financeiras.',
  },
  'admin-notificacoes': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Notificações NuvemMais',
    descricao: 'Gerencie envios e filas de notificações da plataforma.',
  },
  'admin-automacoes': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Central de Automações',
    descricao: 'Monitore rotinas automáticas e execuções.',
  },
  'admin-estoque': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Administração de Estoque',
    descricao: 'Gerencie configurações globais do módulo Estoque.',
  },
  'admin-empresas-onboarding': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Novo cadastro guiado',
    descricao: 'Cadastre e acompanhe a implantação de empresas.',
  },
  inadimplencia: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Inadimplência',
    descricao: 'Acompanhe bloqueios e pendências financeiras.',
  },
  'faturas-recorrentes': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Faturas recorrentes',
    descricao: 'Gerencie a geração recorrente de cobranças.',
  },
  'configuracoes-pagamento': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Configurações de pagamento',
    descricao: 'Defina regras e métodos de pagamento da plataforma.',
  },
  auditoria: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Auditoria',
    descricao: 'Consulte o histórico de eventos administrativos.',
  },
  lixeira: {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Lixeira',
    descricao: 'Revise e restaure registros excluídos.',
  },
  'admin-lixeira': {
    subtitulo: 'Administração NuvemMais',
    titulo: 'Lixeira',
    descricao: 'Revise e restaure registros excluídos.',
  },
}

const routeName = computed(() => (typeof route.name === 'string' ? route.name : ''))
const rotaLogin = computed(() => route.path === '/login')
const rotaAgendamentoPublico = computed(() => route.path.startsWith('/agendar'))
const rotaCatalogoPublico = computed(() => route.path.startsWith('/catalogo/') || route.path.startsWith('/cardapio/'))
const rotaCadastroPublico = computed(() => ['/cadastro', '/cadastro-empresa', '/comece-agora'].includes(route.path))
const rotaInstitucionalPublica = computed(() => ['/termos', '/privacidade', '/sobre'].includes(route.path))
const rotaCadastroPendente = computed(() => route.path === '/cadastro-pendente')
const usuario = ref(carregarUsuarioSessao())
const trocaSenhaObrigatoria = computed(() => usuario.value?.trocaSenhaObrigatoria === true)
const rotaSemLayout = computed(() =>
  rotaLogin.value ||
  rotaAgendamentoPublico.value ||
  rotaCatalogoPublico.value ||
  rotaCadastroPublico.value ||
  rotaInstitucionalPublica.value ||
  rotaCadastroPendente.value ||
  (route.path === '/alterar-senha' && trocaSenhaObrigatoria.value),
)
const empresaLogada = computed(() => {
  if (usuario.value?.empresaNome) {
    return `Empresa: ${usuario.value.empresaNome}`
  }

  if (usuario.value?.empresaId) {
    return 'Empresa'
  }

  if (ehSuperAdmin(usuario.value)) {
    return 'Plataforma NuvemMais'
  }

  return 'Empresa'
})
const identificacaoConta = computed(() => {
  const email = String(usuario.value?.email || '').trim()
  const login = String(usuario.value?.login || '').trim()

  if (email && login) {
    return `${email} - @${login}`
  }

  if (login) {
    return `@${login}`
  }

  return email || 'Sessão ativa'
})
const nomeUsuario = computed(() => usuario.value?.nome || 'Usuário')
const podeGerenciarUsuarios = computed(() => ehAdmin(usuario.value))
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const adminEmpresa = computed(() => ehAdmin(usuario.value) && !ehSuperAdmin(usuario.value))
const gruposMenuAbertos = ref({
  principal: true,
  operacao: true,
  financeiro: true,
  configuracoes: true,
  administracaoSaas: true,
})
const menuMobileAberto = ref(false)
const statusFinanceiro = ref(null)
const carregandoStatusFinanceiro = ref(false)
const ultimaConsultaFinanceira = ref(0)
const mensagemGlobal = ref('')
const tipoMensagemGlobal = ref('erro')
const erroInesperado = ref(false)
const infoVersaoSistema = ref(obterInfoVersaoSistemaPadrao())
const conteudoRotaRef = ref(null)
const cabecalhoPagina = ref(criarCabecalhoPagina())
const recarregamentoVisualizacaoEmpresa = ref(0)
let timeoutMensagemGlobal = null
let observadorCabecalhoPagina = null
let elementoAcaoCabecalhoPagina = null

const cabecalhoExibido = computed(() => {
  const fallback = obterCabecalhoPadrao(routeName.value)
  return {
    subtitulo: cabecalhoPagina.value.subtitulo || fallback.subtitulo,
    titulo: cabecalhoPagina.value.titulo || fallback.titulo,
    descricao: cabecalhoPagina.value.descricao || fallback.descricao,
  }
})
const tipoSeloAmbienteTopo = computed(() => obterTipoSeloAmbiente(infoVersaoSistema.value?.ambiente))
const mostrarSeloAmbienteTopo = computed(() => Boolean(tipoSeloAmbienteTopo.value))
const rotuloSeloAmbienteTopo = computed(() =>
  tipoSeloAmbienteTopo.value === 'homologacao' ? 'HOMOLOGAÇÃO' : 'LOCAL',
)
const descricaoSeloAmbienteTopo = computed(() =>
  tipoSeloAmbienteTopo.value === 'homologacao' ? 'Ambiente de homologação' : 'Ambiente local',
)
const chaveConteudoRota = computed(() => `${route.fullPath}|empresa:${recarregamentoVisualizacaoEmpresa.value}`)
const versaoMenuLateral = computed(() => {
  const versaoBase = String(infoVersaoSistema.value?.versao || '').trim() || '1.1.1'
  return `v${versaoBase}`
})

function criarCabecalhoPagina() {
  return {
    subtitulo: '',
    titulo: '',
    descricao: '',
    acaoRotulo: '',
    acaoDisponivel: false,
    acaoDesabilitada: false,
  }
}

function obterCabecalhoPadrao(nomeRota) {
  return (
    CABECALHOS_PADRAO[nomeRota] || {
      subtitulo: superAdmin.value ? 'Administração NuvemMais' : 'Painel interno',
      titulo: formatarNomeRota(nomeRota),
      descricao: 'Acompanhe os dados desta área da plataforma.',
    }
  )
}

function formatarNomeRota(nomeRota) {
  if (!nomeRota) {
    return 'Painel'
  }

  return String(nomeRota)
    .split('-')
    .filter(Boolean)
    .map((parte) => parte.charAt(0).toUpperCase() + parte.slice(1))
    .join(' ')
}

function obterTextoCabecalho(elemento) {
  return String(elemento?.textContent || '')
    .replace(/\s+/g, ' ')
    .trim()
}

function sair() {
  limparSessaoAutenticacao()
  statusFinanceiro.value = null
  menuMobileAberto.value = false
  router.push('/login')
}

function atualizarUsuarioLogado() {
  if (rotaAgendamentoPublico.value) {
    usuario.value = null
    statusFinanceiro.value = null
    return
  }

  usuario.value = carregarUsuarioSessao()
  carregarStatusFinanceiro()
}

async function atualizarVisualizacaoEmpresaGlobal() {
  if (rotaSemLayout.value) {
    return
  }

  recarregamentoVisualizacaoEmpresa.value += 1
  await nextTick()
  observarCabecalhoPagina()
  sincronizarCabecalhoPagina()
}

async function carregarStatusFinanceiro({ forcar = false } = {}) {
  if (!adminEmpresa.value || rotaSemLayout.value || carregandoStatusFinanceiro.value) {
    statusFinanceiro.value = null
    return
  }

  const agora = Date.now()
  if (!forcar && statusFinanceiro.value && agora - ultimaConsultaFinanceira.value < 60000) {
    return
  }

  try {
    carregandoStatusFinanceiro.value = true
    statusFinanceiro.value = await buscarStatusFinanceiroMinhaEmpresa()
    ultimaConsultaFinanceira.value = agora
  } catch (error) {
    statusFinanceiro.value = null
    console.error(error)
  } finally {
    carregandoStatusFinanceiro.value = false
  }
}

function atualizarStatusFinanceiroGlobal() {
  carregarStatusFinanceiro({ forcar: true })
}

async function carregarAmbienteAplicacao() {
  try {
    infoVersaoSistema.value = await buscarVersaoSistema()
  } catch (error) {
    infoVersaoSistema.value = obterInfoVersaoSistemaPadrao()
    console.error(error)
  }
}

function exibirMensagemGlobal(event) {
  const detail = event?.detail || {}
  mensagemGlobal.value = detail.mensagem || 'Não foi possível carregar os dados. Tente novamente.'
  tipoMensagemGlobal.value = detail.tipo || 'erro'

  if (timeoutMensagemGlobal) {
    clearTimeout(timeoutMensagemGlobal)
  }

  timeoutMensagemGlobal = setTimeout(() => {
    mensagemGlobal.value = ''
    timeoutMensagemGlobal = null
  }, 7000)
}

function recarregarAplicacao() {
  window.location.reload()
}

function abrirMenuMobile() {
  menuMobileAberto.value = true
}

function fecharMenuMobile() {
  menuMobileAberto.value = false
}

function grupoMenuAberto(chave) {
  return gruposMenuAbertos.value?.[chave] !== false
}

function alternarGrupoMenu(chave) {
  gruposMenuAbertos.value[chave] = !grupoMenuAberto(chave)
}

function irParaAjudaVersao() {
  fecharMenuMobile()
  router.push({ path: '/ajuda', hash: '#versao-novidades' })
}

function sincronizarCabecalhoPagina() {
  const pagina = conteudoRotaRef.value?.querySelector('.pagina')
  const cabecalho = pagina?.querySelector(':scope > .cabecalho-pagina:first-child')

  if (!cabecalho) {
    elementoAcaoCabecalhoPagina = null
    cabecalhoPagina.value = criarCabecalhoPagina()
    return
  }

  const subtitulo = obterTextoCabecalho(cabecalho.querySelector('.subtitulo'))
  const titulo = obterTextoCabecalho(cabecalho.querySelector('h1'))
  const descricao = obterTextoCabecalho(
    cabecalho.querySelector('.descricao') ||
      [...cabecalho.querySelectorAll('p')].find((paragrafo) => !paragrafo.classList.contains('subtitulo')),
  )
  const acao = cabecalho.querySelector('button, a.botao')

  elementoAcaoCabecalhoPagina = acao instanceof HTMLElement ? acao : null

  cabecalhoPagina.value = {
    subtitulo,
    titulo,
    descricao,
    acaoRotulo: obterTextoCabecalho(acao),
    acaoDisponivel: Boolean(elementoAcaoCabecalhoPagina),
    acaoDesabilitada:
      elementoAcaoCabecalhoPagina?.matches(':disabled') ||
      elementoAcaoCabecalhoPagina?.getAttribute('aria-disabled') === 'true',
  }
}

function observarCabecalhoPagina() {
  if (observadorCabecalhoPagina) {
    observadorCabecalhoPagina.disconnect()
    observadorCabecalhoPagina = null
  }

  if (!conteudoRotaRef.value) {
    return
  }

  observadorCabecalhoPagina = new MutationObserver(() => {
    sincronizarCabecalhoPagina()
  })

  observadorCabecalhoPagina.observe(conteudoRotaRef.value, {
    childList: true,
    subtree: true,
    characterData: true,
    attributes: true,
    attributeFilter: ['disabled', 'aria-disabled', 'class'],
  })
}

function executarAcaoPagina() {
  if (!elementoAcaoCabecalhoPagina || cabecalhoPagina.value.acaoDesabilitada) {
    return
  }

  elementoAcaoCabecalhoPagina.click()
}

watch(
  () => route.fullPath,
  async () => {
    atualizarUsuarioLogado()
    mensagemGlobal.value = ''
    erroInesperado.value = false
    menuMobileAberto.value = false

    await nextTick()
    observarCabecalhoPagina()
    sincronizarCabecalhoPagina()
  },
  { immediate: true },
)

watch(menuMobileAberto, (aberto) => {
  if (typeof document !== 'undefined') {
    document.body.classList.toggle('menu-mobile-aberto', aberto)
  }
})

onErrorCaptured((error) => {
  console.error(error)
  erroInesperado.value = true
  mensagemGlobal.value = 'Ocorreu um erro inesperado. Recarregue a página para continuar.'
  tipoMensagemGlobal.value = 'erro'
  return false
})

onMounted(() => {
  window.addEventListener('usuario-atualizado', atualizarUsuarioLogado)
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarVisualizacaoEmpresaGlobal)
  window.addEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
  window.addEventListener('mensagem-global', exibirMensagemGlobal)
  carregarAmbienteAplicacao()
  observarCabecalhoPagina()
  sincronizarCabecalhoPagina()
})

onBeforeUnmount(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuarioLogado)
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarVisualizacaoEmpresaGlobal)
  window.removeEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
  window.removeEventListener('mensagem-global', exibirMensagemGlobal)

  if (timeoutMensagemGlobal) {
    clearTimeout(timeoutMensagemGlobal)
  }

  if (observadorCabecalhoPagina) {
    observadorCabecalhoPagina.disconnect()
  }

  if (typeof document !== 'undefined') {
    document.body.classList.remove('menu-mobile-aberto')
  }
})
</script>

<template>
  <main v-if="erroInesperado" class="pagina-erro-interno">
    <section class="card-erro-interno">
      <span class="selo-erro">Erro inesperado</span>
      <h1>Não foi possível concluir esta ação.</h1>
      <p>Recarregue a página para continuar. Se o problema persistir, tente novamente em instantes.</p>
      <div class="acoes-erro-interno">
        <button class="botao-erro-interno" type="button" @click="recarregarAplicacao">
          Recarregar página
        </button>
      </div>
    </section>
  </main>

  <RouterView v-else-if="rotaSemLayout" />

  <div v-else class="app-shell">

    <button
      v-if="menuMobileAberto"
      class="menu-overlay"
      type="button"
      aria-label="Fechar menu"
      @click="fecharMenuMobile"
    ></button>

    <aside class="app-sidebar" :class="{ aberta: menuMobileAberto }">
      <div class="topo-menu-mobile">
        <span>Menu</span>
        <button class="botao-fechar-menu" type="button" aria-label="Fechar menu" @click="fecharMenuMobile">×</button>
      </div>

      <div class="marca">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>NuvemMais Gestão</strong>
          <small>Gestão empresarial na nuvem</small>
        </div>
      </div>

      <nav class="menu-principal" aria-label="Navegação principal">
        <section class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('principal')">
            <span>Principal</span>
            <span>{{ grupoMenuAberto('principal') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('principal')" class="submenu">
            <RouterLink to="/dashboard" @click="fecharMenuMobile">Dashboard</RouterLink>
            <RouterLink to="/agenda" @click="fecharMenuMobile">Agenda</RouterLink>
            <RouterLink to="/clientes" @click="fecharMenuMobile">Clientes</RouterLink>
          </div>
        </section>

        <section class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('operacao')">
            <span>Operação</span>
            <span>{{ grupoMenuAberto('operacao') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('operacao')" class="submenu">
            <RouterLink to="/servicos" @click="fecharMenuMobile">Serviços</RouterLink>
            <RouterLink to="/funcionarios" @click="fecharMenuMobile">Funcionários</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/estoque" @click="fecharMenuMobile">Estoque</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/catalogo-publico" @click="fecharMenuMobile">Catálogo público</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/disponibilidade" @click="fecharMenuMobile">Disponibilidade</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/relatorios" @click="fecharMenuMobile">Relatórios</RouterLink>
            <RouterLink v-if="adminEmpresa" to="/onboarding" @click="fecharMenuMobile">Primeiros passos</RouterLink>
          </div>
        </section>

        <section v-if="podeGerenciarUsuarios" class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('financeiro')">
            <span>Financeiro</span>
            <span>{{ grupoMenuAberto('financeiro') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('financeiro')" class="submenu">
            <RouterLink to="/faturas" @click="fecharMenuMobile">Faturas</RouterLink>
            <RouterLink to="/meu-plano" @click="fecharMenuMobile">Meu plano</RouterLink>
          </div>
        </section>

        <section class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('configuracoes')">
            <span>Configurações</span>
            <span>{{ grupoMenuAberto('configuracoes') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('configuracoes')" class="submenu">
            <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa" @click="fecharMenuMobile">Minha empresa</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/personalizacao" @click="fecharMenuMobile">Personalização</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/usuarios" @click="fecharMenuMobile">Usuários</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/ajuda" @click="fecharMenuMobile">Ajuda</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa/notificacoes" @click="fecharMenuMobile">Notificações da empresa</RouterLink>
            <RouterLink to="/minha-conta" @click="fecharMenuMobile">Minha conta</RouterLink>
            <RouterLink to="/alterar-senha" @click="fecharMenuMobile">Alterar senha</RouterLink>
          </div>
        </section>

        <section v-if="superAdmin" class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('administracaoSaas')">
            <span>Administração SaaS</span>
            <span>{{ grupoMenuAberto('administracaoSaas') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('administracaoSaas')" class="submenu">
            <RouterLink to="/admin-dashboard" @click="fecharMenuMobile">Dashboard NuvemMais</RouterLink>
            <RouterLink to="/empresas" @click="fecharMenuMobile">Empresas</RouterLink>
            <RouterLink to="/planos" @click="fecharMenuMobile">Planos</RouterLink>
            <RouterLink to="/assinaturas" @click="fecharMenuMobile">Assinaturas</RouterLink>
            <RouterLink to="/solicitacoes" @click="fecharMenuMobile">Solicitações</RouterLink>
            <RouterLink to="/auditoria" @click="fecharMenuMobile">Auditoria</RouterLink>
            <RouterLink to="/lixeira" @click="fecharMenuMobile">Lixeira</RouterLink>
            <RouterLink to="/admin/estoque" @click="fecharMenuMobile">Administração de Estoque</RouterLink>
            <RouterLink to="/admin/notificacoes" @click="fecharMenuMobile">Notificações NuvemMais</RouterLink>
            <RouterLink to="/admin/automacoes" @click="fecharMenuMobile">Automações</RouterLink>
            <RouterLink to="/admin/financeiro" @click="fecharMenuMobile">Inadimplência</RouterLink>
            <RouterLink to="/faturas-recorrentes" @click="fecharMenuMobile">Faturas recorrentes</RouterLink>
            <RouterLink to="/configuracoes-pagamento" @click="fecharMenuMobile">Configuração de pagamento</RouterLink>
            <RouterLink to="/segmentos" @click="fecharMenuMobile">Segmentos/Módulos</RouterLink>
            <RouterLink to="/admin/empresas/onboarding" @click="fecharMenuMobile">Novo cadastro guiado</RouterLink>
          </div>
        </section>
      </nav>

      <footer class="rodape-versao-menu" aria-label="Versão do sistema">
        <button type="button" class="link-versao-menu" @click="irParaAjudaVersao">
          {{ versaoMenuLateral }}
        </button>
      </footer>
    </aside>

    <div class="app-main">
      <section v-if="mostrarSeloAmbienteTopo" class="selo-homologacao" :aria-label="descricaoSeloAmbienteTopo">
        {{ rotuloSeloAmbienteTopo }}
      </section>

      <AppHeaderCompacto
        :cabecalho="cabecalhoExibido"
        :empresa-logada="empresaLogada"
        :nome-usuario="nomeUsuario"
        :identificacao-conta="identificacaoConta"
        :acao-rotulo="cabecalhoPagina.acaoRotulo"
        :acao-disponivel="cabecalhoPagina.acaoDisponivel"
        :acao-desabilitada="cabecalhoPagina.acaoDesabilitada"
        @abrir-menu="abrirMenuMobile"
        @executar-acao="executarAcaoPagina"
        @sair="sair"
      >
        <template #visualizacao>
          <VisualizacaoEmpresaSelector v-if="superAdmin" />
        </template>
      </AppHeaderCompacto>
      <FinanceiroStatusBanner v-if="adminEmpresa" :status="statusFinanceiro" />

      <section v-if="mensagemGlobal" class="mensagem-global" :class="tipoMensagemGlobal">
        <p>{{ mensagemGlobal }}</p>
      </section>

      <div ref="conteudoRotaRef" class="conteudo-rota">
        <RouterView :key="chaveConteudoRota" />
      </div>
    </div>
  </div>
</template>

<style scoped>
.pagina-erro-interno {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #eef2f7;
  color: #111827;
}

.card-erro-interno {
  width: min(100%, 620px);
  display: grid;
  gap: 14px;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.selo-erro {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.card-erro-interno h1,
.card-erro-interno p {
  margin: 0;
}

.card-erro-interno h1 {
  font-size: 30px;
  font-weight: 800;
}

.card-erro-interno p {
  color: #475569;
  line-height: 1.5;
}

.acoes-erro-interno {
  display: flex;
  gap: 10px;
}

.botao-erro-interno {
  border: none;
  border-radius: 8px;
  padding: 11px 16px;
  color: white;
  background: #2563eb;
  font-weight: 800;
  cursor: pointer;
}

.botao-erro-interno:hover {
  background: #1d4ed8;
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: #eef2f7;
  color: #111827;
  position: relative;
}

.app-sidebar {
  background: #0f172a;
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.topo-menu-mobile,
.menu-overlay {
  display: none;
}

.marca {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marca-simbolo {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #2563eb;
  font-weight: 800;
}

.marca strong,
.marca small {
  display: block;
}

.marca strong {
  font-size: 17px;
  font-weight: 800;
}

.marca small {
  color: #cbd5e1;
  font-size: 13px;
}

.menu-principal {
  display: grid;
  gap: 8px;
  align-content: start;
  flex: 1 1 auto;
}

.menu-principal a {
  color: #e2e8f0;
  text-decoration: none;
  border-radius: 8px;
  padding: 11px 12px;
  font-weight: 700;
}

.menu-principal a.router-link-active {
  background: rgba(37, 99, 235, 0.22);
  color: white;
}

.grupo-menu {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid rgba(226, 232, 240, 0.16);
}

.grupo-menu-botao {
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: rgba(15, 23, 42, 0.3);
  color: #cbd5e1;
  padding: 10px 12px;
  border-radius: 8px;
  cursor: pointer;
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  text-align: left;
  text-transform: uppercase;
}

.submenu {
  display: grid;
  gap: 6px;
  padding-left: 12px;
  border-left: 2px solid rgba(37, 99, 235, 0.45);
}

.submenu a {
  padding: 9px 10px;
  font-size: 14px;
}

.rodape-versao-menu {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid rgba(226, 232, 240, 0.16);
  color: #94a3b8;
}

.link-versao-menu {
  border: none;
  background: transparent;
  color: inherit;
  display: inline-flex;
  font-size: 11px;
  letter-spacing: 0.04em;
  font-weight: 700;
  cursor: pointer;
  padding: 0;
  text-decoration: underline;
  text-underline-offset: 2px;
}

.link-versao-menu:hover {
  color: #cbd5e1;
}

.app-main {
  min-width: 0;
  max-width: none;
  width: 100%;
  padding: 24px;
  display: grid;
  align-content: start;
  grid-auto-rows: max-content;
  gap: 12px;
}

.selo-homologacao {
  width: fit-content;
  border: 1px solid #f59e0b;
  border-radius: 999px;
  padding: 7px 12px;
  background: #fffbeb;
  color: #b45309;
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}


.botao-fechar-menu {
  border: none;
  border-radius: 8px;
  width: 34px;
  height: 34px;
  background: rgba(148, 163, 184, 0.16);
  color: #e2e8f0;
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.mensagem-global {
  margin: 0;
  border-radius: 8px;
  padding: 14px 16px;
  font-weight: 700;
}

.mensagem-global p {
  margin: 0;
}

.mensagem-global.erro {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.mensagem-global.sucesso {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.conteudo-rota {
  min-width: 0;
}

:deep(.conteudo-rota > .pagina > .cabecalho-pagina:first-child) {
  display: none !important;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .menu-overlay {
    position: fixed;
    inset: 0;
    border: none;
    background: rgba(15, 23, 42, 0.55);
    z-index: 35;
    display: block;
  }

  .app-sidebar {
    position: fixed;
    top: 0;
    left: 0;
    height: 100vh;
    width: min(82vw, 320px);
    padding: 16px;
    z-index: 40;
    transform: translateX(-100%);
    transition: transform 0.22s ease;
    overflow-y: auto;
  }

  .app-sidebar.aberta {
    transform: translateX(0);
  }

  .topo-menu-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: #cbd5e1;
    font-size: 12px;
    font-weight: 800;
    text-transform: uppercase;
    letter-spacing: 0.03em;
  }

  .app-main {
    padding: 16px;
  }

}

@media (max-width: 480px) {
  .card-erro-interno {
    padding: 20px;
  }

  .card-erro-interno h1 {
    font-size: 24px;
  }

  .app-main {
    padding: 12px;
  }
}
</style>
