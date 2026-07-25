import { createRouter, createWebHistory } from 'vue-router'
const IndexPublicaView = () => import('../views/IndexPublicaView.vue')
const DashboardView = () => import('../views/DashboardView.vue')
const HomeView = () => import('../views/HomeView.vue')
const ClientesView = () => import('../views/ClientesView.vue')
const BeachTennisTurmasView = () => import('../views/BeachTennisTurmasView.vue')
const BeachTennisTurmaAlunosView = () => import('../views/BeachTennisTurmaAlunosView.vue')
const BeachTennisFinanceiroView = () => import('../views/BeachTennisFinanceiroView.vue')
const AulasFrequenciaView = () => import('../views/AulasFrequenciaView.vue')
const AulasFrequenciaLoteView = () => import('../views/AulasFrequenciaLoteView.vue')
const AulaFrequenciaDetalheView = () => import('../views/AulaFrequenciaDetalheView.vue')
const ReposicoesView = () => import('../views/ReposicoesView.vue')
const ServicosView = () => import('../views/ServicosView.vue')
const FuncionariosView = () => import('../views/FuncionariosView.vue')
const DisponibilidadeView = () => import('../views/DisponibilidadeView.vue')
const LoginView = () => import('../views/LoginView.vue')
const CadastroPendenteView = () => import('../views/CadastroPendenteView.vue')
const AlterarSenhaView = () => import('../views/AlterarSenhaView.vue')
const MinhaContaView = () => import('../views/MinhaContaView.vue')
const UsuariosView = () => import('../views/UsuariosView.vue')
const EmpresasView = () => import('../views/EmpresasView.vue')
const EmpresaOnboardingAdminView = () => import('../views/EmpresaOnboardingAdminView.vue')
const MinhaEmpresaView = () => import('../views/MinhaEmpresaView.vue')
const RelatoriosView = () => import('../views/RelatoriosView.vue')
const RelatorioFrequenciaEsportivaView = () => import('../views/RelatorioFrequenciaEsportivaView.vue')
const PersonalizacaoPublicaView = () => import('../views/PersonalizacaoPublicaView.vue')
const AgendamentoPublicoView = () => import('../views/AgendamentoPublicoView.vue')
const CatalogoPublicoView = () => import('../views/CatalogoPublicoView.vue')
const AuditoriaView = () => import('../views/AuditoriaView.vue')
const LixeiraView = () => import('../views/LixeiraView.vue')
const PlanosView = () => import('../views/PlanosView.vue')
const AssinaturasView = () => import('../views/AssinaturasView.vue')
const MeuPlanoView = () => import('../views/MeuPlanoView.vue')
const AdminDashboardView = () => import('../views/AdminDashboardView.vue')
const SegmentosView = () => import('../views/SegmentosView.vue')
const CadastroEmpresaPublicoView = () => import('../views/CadastroEmpresaPublicoView.vue')
const SolicitacoesCadastroView = () => import('../views/SolicitacoesCadastroView.vue')
const FaturasView = () => import('../views/FaturasView.vue')
const OnboardingView = () => import('../views/OnboardingView.vue')
const InadimplenciaView = () => import('../views/InadimplenciaView.vue')
const FaturasRecorrentesView = () => import('../views/FaturasRecorrentesView.vue')
const ConfiguracoesPagamentoView = () => import('../views/ConfiguracoesPagamentoView.vue')
const NotificacoesView = () => import('../views/NotificacoesView.vue')
const AdminNotificacoesView = () => import('../views/AdminNotificacoesView.vue')
const ConfiguracoesNotificacoesView = () => import('../views/ConfiguracoesNotificacoesView.vue')
const AdminAutomacoesView = () => import('../views/AdminAutomacoesView.vue')
const AdminEstoqueView = () => import('../views/AdminEstoqueView.vue')
const AcessoNegadoView = () => import('../views/AcessoNegadoView.vue')
const NaoEncontradoView = () => import('../views/NaoEncontradoView.vue')
const TermosView = () => import('../views/TermosView.vue')
const PrivacidadeView = () => import('../views/PrivacidadeView.vue')
const SobreView = () => import('../views/SobreView.vue')
const AjudaView = () => import('../views/AjudaView.vue')
const EstoqueView = () => import('../views/EstoqueView.vue')
import { caminhoEhRotaPublicaFrontend, carregarUsuarioSessao, limparSessaoAutenticacao } from '@/services/api'
import { buscarMinhaEmpresa, obterEmpresaVisualizacao } from '@/services/api'
import { carregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import {
  avaliarAcessoCatalogoOperacional,
} from '@/utils/acessoCatalogoOperacional'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const rotasProtegidas = {
  requiresAuth: true,
}

const rotasAdmin = {
  requiresAuth: true,
  requiresAdmin: true,
}

const rotasCatalogoOperacional = {
  requiresAuth: true,
  requiresCatalogoOperacional: true,
}

const rotasSuperAdmin = {
  requiresAuth: true,
  requiresSuperAdmin: true,
}

const rotasPublicas = {
  requiresAuth: false,
  publico: true,
}

function empresaPendente(usuario) {
  if (!usuario || typeof usuario !== 'object') return false
  const statusEmpresa = String(usuario.statusEmpresa || usuario.empresaStatus || '').trim().toUpperCase()
  return usuario.cadastroPendente === true || statusEmpresa === 'PENDENTE'
}

function trocaSenhaObrigatoria(usuario) {
  return usuario?.trocaSenhaObrigatoria === true
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, _from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }

    if (to.hash) {
      return {
        el: to.hash,
        top: 12,
        behavior: 'smooth',
      }
    }

    return { top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'index-publica',
      component: IndexPublicaView,
      meta: rotasPublicas,
    },
    {
      path: '/dashboard',
      name: 'dashboard',
      component: DashboardView,
      meta: rotasProtegidas,
    },
    {
      path: '/agenda',
      name: 'agenda',
      component: HomeView,
      meta: rotasProtegidas,
    },
    {
      path: '/clientes',
      name: 'clientes',
      component: ClientesView,
      meta: rotasProtegidas,
    },
    {
      path: '/beach-tennis/turmas',
      name: 'beach-tennis-turmas',
      component: BeachTennisTurmasView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/beach-tennis/alunos',
      name: 'beach-tennis-alunos',
      component: BeachTennisTurmaAlunosView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/beach-tennis/turmas/:turmaId/alunos',
      name: 'beach-tennis-turma-alunos',
      redirect: (to) => ({
        name: 'beach-tennis-alunos',
        query: {
          ...to.query,
          turmaId: String(to.params.turmaId || '').trim(),
        },
      }),
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/beach-tennis/financeiro',
      name: 'beach-tennis-financeiro',
      component: BeachTennisFinanceiroView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/aulas-frequencia',
      name: 'aulas-frequencia',
      component: AulasFrequenciaView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/aulas-frequencia/lote/cancelar',
      name: 'aulas-frequencia-lote-cancelar',
      component: AulasFrequenciaLoteView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/aulas-frequencia/lote/retomar',
      name: 'aulas-frequencia-lote-retomar',
      component: AulasFrequenciaLoteView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/aulas-frequencia/:aulaId',
      name: 'aulas-frequencia-detalhe',
      component: AulaFrequenciaDetalheView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/reposicoes',
      name: 'reposicoes',
      component: ReposicoesView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/professores',
      name: 'professores',
      component: FuncionariosView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/servicos',
      name: 'servicos',
      component: ServicosView,
      meta: rotasProtegidas,
    },
    {
      path: '/funcionarios',
      name: 'funcionarios',
      component: FuncionariosView,
      meta: rotasProtegidas,
    },
    {
      path: '/disponibilidade',
      name: 'disponibilidade',
      component: DisponibilidadeView,
      meta: rotasAdmin,
    },
    {
      path: '/relatorios',
      name: 'relatorios',
      component: RelatoriosView,
      meta: rotasAdmin,
    },
    {
      path: '/relatorios/frequencia-esportiva',
      name: 'relatorios-frequencia-esportiva',
      component: RelatorioFrequenciaEsportivaView,
      meta: { ...rotasAdmin, requiresGestaoEsportiva: true },
    },
    {
      path: '/alterar-senha',
      name: 'alterar-senha',
      component: AlterarSenhaView,
      meta: rotasProtegidas,
    },
    {
      path: '/minha-conta',
      name: 'minha-conta',
      component: MinhaContaView,
      meta: rotasProtegidas,
    },
    {
      path: '/usuarios',
      name: 'usuarios',
      component: UsuariosView,
      meta: rotasAdmin,
    },
    {
      path: '/minha-empresa',
      name: 'minha-empresa',
      component: MinhaEmpresaView,
      meta: rotasAdmin,
    },
    {
      path: '/personalizacao',
      name: 'personalizacao',
      component: PersonalizacaoPublicaView,
      meta: rotasAdmin,
    },
    {
      path: '/meu-plano',
      name: 'meu-plano',
      component: MeuPlanoView,
      meta: rotasAdmin,
    },
    {
      path: '/estoque',
      name: 'estoque',
      component: EstoqueView,
      meta: rotasCatalogoOperacional,
    },
    {
      path: '/catalogo-publico',
      name: 'catalogo-publico-interno',
      component: EstoqueView,
      meta: rotasCatalogoOperacional,
    },
    {
      path: '/ajuda',
      name: 'ajuda',
      component: AjudaView,
      meta: rotasProtegidas,
    },
    {
      path: '/onboarding',
      name: 'onboarding',
      component: OnboardingView,
      meta: rotasAdmin,
    },
    {
      path: '/empresas',
      name: 'empresas',
      component: EmpresasView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin-dashboard',
      name: 'admin-dashboard',
      component: AdminDashboardView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/planos',
      name: 'planos',
      component: PlanosView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/assinaturas',
      name: 'assinaturas',
      component: AssinaturasView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/segmentos',
      name: 'segmentos',
      component: SegmentosView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/solicitacoes',
      name: 'solicitacoes',
      component: SolicitacoesCadastroView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/solicitacoes-cadastro',
      name: 'solicitacoes-cadastro',
      component: SolicitacoesCadastroView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/faturas',
      name: 'faturas',
      component: FaturasView,
      meta: rotasAdmin,
    },
    {
      path: '/notificacoes',
      name: 'notificacoes',
      component: NotificacoesView,
      meta: rotasAdmin,
    },
    {
      path: '/minha-empresa/notificacoes',
      name: 'configuracoes-notificacoes',
      component: ConfiguracoesNotificacoesView,
      meta: rotasAdmin,
    },
    {
      path: '/faturas-saas',
      redirect: '/faturas',
    },
    {
      path: '/admin/financeiro',
      name: 'admin-financeiro',
      component: InadimplenciaView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/notificacoes',
      name: 'admin-notificacoes',
      component: AdminNotificacoesView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/automacoes',
      name: 'admin-automacoes',
      component: AdminAutomacoesView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/estoque',
      name: 'admin-estoque',
      component: AdminEstoqueView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/empresas',
      name: 'admin-empresas',
      component: EmpresasView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/empresas/onboarding',
      name: 'admin-empresas-onboarding',
      component: EmpresaOnboardingAdminView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/planos',
      name: 'admin-planos',
      component: PlanosView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/assinaturas',
      name: 'admin-assinaturas',
      component: AssinaturasView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/inadimplencia',
      name: 'admin-inadimplencia',
      component: InadimplenciaView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/faturas-recorrentes',
      name: 'admin-faturas-recorrentes',
      component: FaturasRecorrentesView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/config-pagamento',
      name: 'admin-config-pagamento',
      component: ConfiguracoesPagamentoView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/segmentos-modulos',
      name: 'admin-segmentos-modulos',
      component: SegmentosView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/solicitacoes',
      name: 'admin-solicitacoes',
      component: SolicitacoesCadastroView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/auditoria',
      name: 'admin-auditoria',
      component: AuditoriaView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/lixeira',
      name: 'admin-lixeira',
      component: LixeiraView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/inadimplencia',
      name: 'inadimplencia',
      component: InadimplenciaView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/faturas-recorrentes',
      name: 'faturas-recorrentes',
      component: FaturasRecorrentesView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/configuracoes-pagamento',
      name: 'configuracoes-pagamento',
      component: ConfiguracoesPagamentoView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/auditoria',
      name: 'auditoria',
      component: AuditoriaView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/lixeira',
      name: 'lixeira',
      component: LixeiraView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/admin/:pathMatch(.*)*',
      name: 'admin-nao-encontrado',
      component: NaoEncontradoView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/agendar/:slug',
      name: 'agendamento-publico',
      component: AgendamentoPublicoView,
      meta: rotasPublicas,
    },
    {
      path: '/catalogo/:slug',
      alias: ['/cardapio/:slug'],
      name: 'catalogo-publico',
      component: CatalogoPublicoView,
      meta: rotasPublicas,
    },
    {
      path: '/cadastro',
      name: 'cadastro-empresa-publico',
      component: CadastroEmpresaPublicoView,
      meta: rotasPublicas,
    },
    {
      path: '/termos',
      name: 'termos',
      component: TermosView,
      meta: rotasPublicas,
    },
    {
      path: '/privacidade',
      name: 'privacidade',
      component: PrivacidadeView,
      meta: rotasPublicas,
    },
    {
      path: '/sobre',
      name: 'sobre',
      component: SobreView,
      meta: rotasPublicas,
    },
    {
      path: '/cadastro-empresa',
      redirect: '/cadastro',
    },
    {
      path: '/comece-agora',
      redirect: '/cadastro',
    },
    {
      path: '/login',
      name: 'login',
      component: LoginView,
      meta: rotasPublicas,
    },
    {
      path: '/cadastro-pendente',
      name: 'cadastro-pendente',
      component: CadastroPendenteView,
    },
    {
      path: '/acesso-negado',
      name: 'acesso-negado',
      component: AcessoNegadoView,
      meta: rotasProtegidas,
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'nao-encontrado',
      component: NaoEncontradoView,
      meta: rotasPublicas,
    },
  ],
})

router.beforeEach(async (to) => {
  if (to.matched.some((registro) => registro.meta?.publico) || caminhoEhRotaPublicaFrontend(to.path)) {
    return true
  }

  const token = localStorage.getItem('token')
  const usuario = carregarUsuarioSessao()

  if (token && !usuario) {
    limparSessaoAutenticacao()
    sessionStorage.setItem('mensagem-login', 'Sessão expirada. Faça login novamente.')
    return to.name === 'login' ? true : '/login'
  }

  if (to.name === 'cadastro-pendente') {
    if (!token || empresaPendente(usuario)) {
      return true
    }

    return '/dashboard'
  }

  if (token && empresaPendente(usuario)) {
    return to.name === 'cadastro-pendente' ? true : '/cadastro-pendente'
  }

  if (token && trocaSenhaObrigatoria(usuario)) {
    return to.name === 'alterar-senha' ? true : '/alterar-senha'
  }

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.meta.requiresAdmin) {
    if (!ehAdmin(usuario)) {
      return { name: 'acesso-negado' }
    }
  }

  if (to.meta.requiresSuperAdmin) {
    if (!ehSuperAdmin(usuario)) {
      return { name: 'acesso-negado' }
    }
  }

  if (to.meta.requiresCatalogoOperacional) {
    const empresaVisualizacao = obterEmpresaVisualizacao()
    const superAdminGlobal = ehSuperAdmin(usuario) && !empresaVisualizacao?.id
    const empresaOperacional = superAdminGlobal
      ? null
      : await buscarMinhaEmpresa().catch((error) => {
          console.error(error)
          return null
        })
    const avaliacaoCatalogo = avaliarAcessoCatalogoOperacional({
      usuario,
      empresaOperacional,
      empresaVisualizacao,
    })

    if (!avaliacaoCatalogo.permitido) {
      return { name: 'acesso-negado' }
    }
  }

  if (to.matched.some((registro) => registro.meta?.requiresGestaoEsportiva)) {
    const contexto = await carregarContextoGestaoEsportiva()

    if (contexto?.ativo !== true) {
      return { name: 'acesso-negado', query: { motivo: 'gestao-esportiva' } }
    }
  }

  if (to.name === 'login' && token) {
    if (trocaSenhaObrigatoria(usuario)) {
      return '/alterar-senha'
    }

    return '/dashboard'
  }

  return true
})

export default router
