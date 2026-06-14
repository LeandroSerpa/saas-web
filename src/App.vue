<script setup>
import { computed, nextTick, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import AppHeaderCompacto from '@/components/AppHeaderCompacto.vue'
import AjudaContextualLink from '@/components/AjudaContextualLink.vue'
import FinanceiroStatusBanner from '@/components/FinanceiroStatusBanner.vue'
import ModoNavegacaoSelector from '@/components/ModoNavegacaoSelector.vue'
import TemaAparenciaSelector from '@/components/TemaAparenciaSelector.vue'
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
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  formatarNomeModalidadeEmCaixaAlta,
  limparContextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'
import {
  aplicarTemaAparenciaNoDocumento,
  salvarTemaAparencia,
  sincronizarTemaAparencia,
  temaAparencia,
} from '@/utils/aparencia'
import {
  MODO_NAVEGACAO_COMPLETO,
  modoNavegacao,
  salvarModoNavegacao,
  sincronizarModoNavegacao,
} from '@/utils/modoNavegacao'
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
  'beach-tennis-turmas': {
    subtitulo: 'Beach Tennis',
    titulo: 'Turmas Beach Tennis',
    descricao: 'Cadastre turmas, acompanhe níveis e vincule alunos manualmente.',
  },
  'beach-tennis-financeiro': {
    subtitulo: 'Beach Tennis',
    titulo: 'Financeiro Beach Tennis',
    descricao: 'Gerencie acordos, mensalidades, cobranças e a configuração do PIX.',
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
const AJUDA_CONTEXTUAL_POR_ROTA = {
  dashboard: 'dashboard',
  agenda: 'agenda',
  clientes: 'clientes',
  'beach-tennis-turmas': 'clientes',
  'beach-tennis-financeiro': 'faturas-meu-plano',
  servicos: 'servicos',
  funcionarios: 'funcionarios',
  disponibilidade: 'disponibilidade',
  relatorios: 'relatorios',
  'minha-conta': 'minha-conta',
  'alterar-senha': 'alterar-senha',
  usuarios: 'usuarios',
  estoque: 'estoque',
  'catalogo-publico-interno': 'catalogo-publico',
  'minha-empresa': 'minha-empresa',
  personalizacao: 'personalizacao',
  'meu-plano': 'faturas-meu-plano',
  faturas: 'faturas-meu-plano',
  notificacoes: 'notificacoes',
  'configuracoes-notificacoes': 'notificacoes',
  lixeira: 'lixeira-global',
  'admin-lixeira': 'lixeira-global',
}
const topicoAjudaContextual = computed(() => AJUDA_CONTEXTUAL_POR_ROTA[routeName.value] || '')
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
const modoNavegacaoAtual = computed(() => modoNavegacao.value)
const temaAparenciaAtual = computed(() => temaAparencia.value)
const modoNavegacaoCompleto = computed(() => modoNavegacaoAtual.value === MODO_NAVEGACAO_COMPLETO)
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloGestaoEsportivaVisivel = computed(() => podeGerenciarUsuarios.value && contextoEsportivo.value?.ativo === true)
const tituloMenuGestaoEsportiva = computed(() => formatarNomeModalidadeEmCaixaAlta(contextoEsportivo.value?.nomeModalidade))
const rotuloGrupoEsportivoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
const gruposMenuAbertos = ref({
  principal: true,
  beachTennis: true,
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
  const versaoBase = String(infoVersaoSistema.value?.versao || '').trim() || '1.2.2'
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
  if (contextoEsportivo.value?.ativo === true) {
    if (nomeRota === 'beach-tennis-turmas') {
      return {
        subtitulo: contextoEsportivo.value.nomeModalidade,
        titulo: `${contextoEsportivo.value.termoGrupoPlural} - ${contextoEsportivo.value.nomeModalidade}`,
        descricao: `Gerencie ${normalizarTextoCabecalho(contextoEsportivo.value.termoGrupoPlural)} e vínculos da modalidade.`,
      }
    }

    if (nomeRota === 'beach-tennis-financeiro') {
      return {
        subtitulo: contextoEsportivo.value.nomeModalidade,
        titulo: `Financeiro - ${contextoEsportivo.value.nomeModalidade}`,
        descricao: 'Acompanhe acordos, mensalidades e a configuração financeira da modalidade.',
      }
    }
  }

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

function normalizarTextoCabecalho(valor) {
  return String(valor || '')
    .trim()
    .toLocaleLowerCase('pt-BR')
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

function alterarModoNavegacao(novoModo) {
  if (!usuario.value) {
    return
  }

  const modoSalvo = salvarModoNavegacao(usuario.value, novoModo)

  if (!modoSalvo) {
    return
  }
}

function alterarTemaAparencia(novoTema) {
  salvarTemaAparencia(novoTema)
}

function atualizarUsuarioLogado() {
  if (
    rotaAgendamentoPublico.value ||
    rotaCatalogoPublico.value ||
    rotaCadastroPublico.value ||
    rotaInstitucionalPublica.value
  ) {
    usuario.value = null
    statusFinanceiro.value = null
    limparContextoGestaoEsportiva()
    return
  }

  usuario.value = carregarUsuarioSessao()

  if (usuario.value) {
    sincronizarModoNavegacao(usuario.value)
    carregarContextoGestaoEsportiva()
  } else {
    limparContextoGestaoEsportiva()
  }

  carregarStatusFinanceiro()
}

async function atualizarVisualizacaoEmpresaGlobal() {
  if (rotaSemLayout.value) {
    return
  }

  await recarregarContextoGestaoEsportiva()
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

watch(
  () => [routeName.value, contextoEsportivo.value?.carregado, contextoEsportivo.value?.ativo],
  ([nomeRota, carregado, ativo]) => {
    if (!carregado) {
      return
    }

    if (
      String(nomeRota || '').startsWith('beach-tennis') &&
      ativo !== true &&
      route.name !== 'acesso-negado'
    ) {
      router.replace({ name: 'acesso-negado', query: { motivo: 'gestao-esportiva' } })
    }
  },
)

watch(
  temaAparencia,
  (tema) => {
    aplicarTemaAparenciaNoDocumento(tema)
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
  carregarContextoGestaoEsportiva()
  sincronizarTemaAparencia()
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

        <section v-if="moduloGestaoEsportivaVisivel" class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="alternarGrupoMenu('beachTennis')">
            <span>{{ tituloMenuGestaoEsportiva }}</span>
            <span>{{ grupoMenuAberto('beachTennis') ? '−' : '+' }}</span>
          </button>
          <div v-if="grupoMenuAberto('beachTennis')" class="submenu">
            <RouterLink to="/beach-tennis/turmas" @click="fecharMenuMobile">{{ rotuloGrupoEsportivoPlural }}</RouterLink>
            <RouterLink to="/beach-tennis/financeiro" @click="fecharMenuMobile">Financeiro</RouterLink>
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
            <RouterLink v-if="modoNavegacaoCompleto && podeGerenciarUsuarios" to="/disponibilidade" @click="fecharMenuMobile">
              Disponibilidade
            </RouterLink>
            <RouterLink v-if="modoNavegacaoCompleto && podeGerenciarUsuarios" to="/relatorios" @click="fecharMenuMobile">
              Relatórios
            </RouterLink>
            <RouterLink v-if="modoNavegacaoCompleto && adminEmpresa" to="/onboarding" @click="fecharMenuMobile">
              Primeiros passos
            </RouterLink>
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
            <RouterLink
              v-if="modoNavegacaoCompleto && podeGerenciarUsuarios"
              to="/minha-empresa/notificacoes"
              @click="fecharMenuMobile"
            >
              Notificações da empresa
            </RouterLink>
            <RouterLink to="/minha-conta" @click="fecharMenuMobile">Minha conta</RouterLink>
            <RouterLink to="/alterar-senha" @click="fecharMenuMobile">Alterar senha</RouterLink>
            <RouterLink v-if="podeGerenciarUsuarios" to="/ajuda" @click="fecharMenuMobile">Ajuda</RouterLink>
          </div>
        </section>

        <section v-if="superAdmin && modoNavegacaoCompleto" class="grupo-menu">
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
        <template #preferencias>
          <ModoNavegacaoSelector :modo="modoNavegacaoAtual" @update:modo="alterarModoNavegacao" />
          <TemaAparenciaSelector :tema="temaAparenciaAtual" @update:tema="alterarTemaAparencia" />
        </template>

        <template #acoes-secundarias>
          <AjudaContextualLink v-if="topicoAjudaContextual" :topico="topicoAjudaContextual" />
        </template>

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
  background: var(--app-bg);
  color: var(--app-text);
}

.card-erro-interno {
  width: min(100%, 620px);
  display: grid;
  gap: 14px;
  background: var(--app-surface);
  border: 1px solid color-mix(in srgb, var(--app-danger) 24%, var(--app-border));
  border-radius: var(--app-radius);
  padding: 28px;
  box-shadow: var(--app-shadow);
}

.selo-erro {
  color: var(--app-danger);
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
  color: var(--app-text-muted);
  line-height: 1.5;
}

.acoes-erro-interno {
  display: flex;
  gap: 10px;
}

.botao-erro-interno {
  border: none;
  border-radius: 12px;
  padding: 11px 16px;
  color: white;
  background: var(--app-primary);
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18);
}

.botao-erro-interno:hover {
  background: var(--app-primary-strong);
}

.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background:
    var(--app-bg-overlay, none),
    var(--app-bg);
  color: var(--app-text);
  position: relative;
}

.app-sidebar {
  background: var(--app-sidebar-bg);
  color: var(--app-sidebar-text);
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
  border-radius: 14px;
  background: linear-gradient(135deg, var(--app-primary) 0%, var(--app-brand-end) 100%);
  font-weight: 800;
  color: white;
  box-shadow: 0 12px 24px rgba(37, 99, 235, 0.24);
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
  color: var(--app-sidebar-muted);
  font-size: 13px;
}

.menu-principal {
  display: grid;
  gap: 8px;
  align-content: start;
  flex: 1 1 auto;
}

.menu-principal a {
  color: var(--app-sidebar-link);
  text-decoration: none;
  border-radius: 12px;
  padding: 11px 12px;
  font-weight: 700;
  transition:
    background 0.16s ease,
    color 0.16s ease,
    transform 0.16s ease;
}

.menu-principal a.router-link-active {
  background: var(--app-sidebar-item-active);
  color: var(--app-sidebar-link-active);
}

.grupo-menu {
  display: grid;
  gap: 8px;
  margin-top: 8px;
  padding-top: 12px;
  border-top: 1px solid var(--app-sidebar-border);
}

.grupo-menu-botao {
  border: none;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  background: var(--app-sidebar-chip);
  color: var(--app-sidebar-muted);
  padding: 10px 12px;
  border-radius: 12px;
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
  border-left: 2px solid var(--app-primary);
}

.submenu a {
  padding: 9px 10px;
  font-size: 14px;
}

.rodape-versao-menu {
  margin-top: auto;
  padding-top: 10px;
  border-top: 1px solid var(--app-sidebar-border);
  color: var(--app-sidebar-muted);
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
  color: var(--app-sidebar-link-active);
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
  border: 1px solid var(--app-warning);
  border-radius: 999px;
  padding: 7px 12px;
  background: color-mix(in srgb, var(--app-warning) 12%, white);
  color: color-mix(in srgb, var(--app-warning) 82%, black);
  font-size: 12px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}


.botao-fechar-menu {
  border: none;
  border-radius: 12px;
  width: 34px;
  height: 34px;
  background: var(--app-sidebar-chip);
  color: var(--app-sidebar-link);
  font-size: 22px;
  line-height: 1;
  cursor: pointer;
}

.mensagem-global {
  margin: 0;
  border-radius: var(--app-radius);
  padding: 14px 16px;
  font-weight: 700;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.mensagem-global p {
  margin: 0;
}

.mensagem-global.erro {
  border-color: color-mix(in srgb, var(--app-danger) 28%, var(--app-border));
  background: color-mix(in srgb, var(--app-danger) 8%, var(--app-surface));
  color: var(--app-danger);
}

.mensagem-global.sucesso {
  border-color: color-mix(in srgb, var(--app-success) 28%, var(--app-border));
  background: color-mix(in srgb, var(--app-success) 8%, var(--app-surface));
  color: var(--app-success);
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
    background: var(--app-overlay);
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
    box-shadow: 28px 0 50px rgba(15, 23, 42, 0.22);
  }

  .app-sidebar.aberta {
    transform: translateX(0);
  }

  .topo-menu-mobile {
    display: flex;
    align-items: center;
    justify-content: space-between;
    color: var(--app-sidebar-muted);
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
