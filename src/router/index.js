import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import HomeView from '../views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import ServicosView from '../views/ServicosView.vue'
import FuncionariosView from '../views/FuncionariosView.vue'
import DisponibilidadeView from '../views/DisponibilidadeView.vue'
import LoginView from '../views/LoginView.vue'
import AlterarSenhaView from '../views/AlterarSenhaView.vue'
import UsuariosView from '../views/UsuariosView.vue'
import EmpresasView from '../views/EmpresasView.vue'
import EmpresaOnboardingAdminView from '../views/EmpresaOnboardingAdminView.vue'
import MinhaEmpresaView from '../views/MinhaEmpresaView.vue'
import RelatoriosView from '../views/RelatoriosView.vue'
import PersonalizacaoPublicaView from '../views/PersonalizacaoPublicaView.vue'
import AgendamentoPublicoView from '../views/AgendamentoPublicoView.vue'
import AuditoriaView from '../views/AuditoriaView.vue'
import LixeiraView from '../views/LixeiraView.vue'
import PlanosView from '../views/PlanosView.vue'
import AssinaturasView from '../views/AssinaturasView.vue'
import MeuPlanoView from '../views/MeuPlanoView.vue'
import AdminDashboardView from '../views/AdminDashboardView.vue'
import SegmentosView from '../views/SegmentosView.vue'
import CadastroEmpresaPublicoView from '../views/CadastroEmpresaPublicoView.vue'
import SolicitacoesCadastroView from '../views/SolicitacoesCadastroView.vue'
import FaturasView from '../views/FaturasView.vue'
import OnboardingView from '../views/OnboardingView.vue'
import InadimplenciaView from '../views/InadimplenciaView.vue'
import FaturasRecorrentesView from '../views/FaturasRecorrentesView.vue'
import ConfiguracoesPagamentoView from '../views/ConfiguracoesPagamentoView.vue'
import NotificacoesView from '../views/NotificacoesView.vue'
import AdminNotificacoesView from '../views/AdminNotificacoesView.vue'
import ConfiguracoesNotificacoesView from '../views/ConfiguracoesNotificacoesView.vue'
import AdminAutomacoesView from '../views/AdminAutomacoesView.vue'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const rotasProtegidas = {
  requiresAuth: true,
}

const rotasAdmin = {
  requiresAuth: true,
  requiresAdmin: true,
}

const rotasSuperAdmin = {
  requiresAuth: true,
  requiresSuperAdmin: true,
}

function carregarUsuario() {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (!usuarioSalvo) {
    return null
  }

  try {
    return JSON.parse(usuarioSalvo)
  } catch (error) {
    console.error(error)
    return null
  }
}

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      redirect: '/dashboard',
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
      path: '/alterar-senha',
      name: 'alterar-senha',
      component: AlterarSenhaView,
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
      redirect: '/dashboard',
    },
    {
      path: '/agendar/:slug',
      name: 'agendamento-publico',
      component: AgendamentoPublicoView,
    },
    {
      path: '/cadastro',
      name: 'cadastro-empresa-publico',
      component: CadastroEmpresaPublicoView,
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
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
  ],
})

router.beforeEach((to) => {
  if (to.path.startsWith('/agendar') || ['/cadastro', '/cadastro-empresa', '/comece-agora'].includes(to.path)) {
    return true
  }

  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.meta.requiresAdmin) {
    const usuario = carregarUsuario()

    if (!ehAdmin(usuario)) {
      return '/dashboard'
    }
  }

  if (to.meta.requiresSuperAdmin) {
    const usuario = carregarUsuario()

    if (!ehSuperAdmin(usuario)) {
      return '/dashboard'
    }
  }

  if (to.name === 'login' && token) {
    return '/dashboard'
  }

  return true
})

export default router
