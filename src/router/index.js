import { createRouter, createWebHistory } from 'vue-router'
import DashboardView from '../views/DashboardView.vue'
import HomeView from '../views/HomeView.vue'
import ClientesView from '../views/ClientesView.vue'
import ServicosView from '../views/ServicosView.vue'
import FuncionariosView from '../views/FuncionariosView.vue'
import LoginView from '../views/LoginView.vue'

const rotasProtegidas = {
  requiresAuth: true,
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
  const token = localStorage.getItem('token')

  if (to.meta.requiresAuth && !token) {
    return '/login'
  }

  if (to.name === 'login' && token) {
    return '/dashboard'
  }

  return true
})

export default router
