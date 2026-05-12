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
import FaturasSaasView from '../views/FaturasSaasView.vue'
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
      path: '/solicitacoes-cadastro',
      name: 'solicitacoes-cadastro',
      component: SolicitacoesCadastroView,
      meta: rotasSuperAdmin,
    },
    {
      path: '/faturas-saas',
      name: 'faturas-saas',
      component: FaturasSaasView,
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
      path: '/agendar/:slug',
      name: 'agendamento-publico',
      component: AgendamentoPublicoView,
    },
    {
      path: '/comece-agora',
      name: 'cadastro-empresa-publico',
      component: CadastroEmpresaPublicoView,
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
  if (to.path.startsWith('/agendar') || to.path === '/comece-agora') {
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
