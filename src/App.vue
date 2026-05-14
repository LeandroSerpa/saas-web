<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import FinanceiroStatusBanner from '@/components/FinanceiroStatusBanner.vue'
import NotificacoesBell from '@/components/NotificacoesBell.vue'
import { buscarStatusFinanceiroMinhaEmpresa } from '@/services/api'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const route = useRoute()
const router = useRouter()

const rotaLogin = computed(() => route.path === '/login')
const rotaAgendamentoPublico = computed(() => route.path.startsWith('/agendar'))
const rotaCadastroPublico = computed(() => route.path === '/comece-agora')
const rotaSemLayout = computed(() => rotaLogin.value || rotaAgendamentoPublico.value || rotaCadastroPublico.value)
const usuario = ref(null)
const empresaLogada = computed(() => {
  if (usuario.value?.empresaNome) {
    return `Empresa: ${usuario.value.empresaNome}`
  }

  if (usuario.value?.empresaId) {
    return `Empresa ID: ${usuario.value.empresaId}`
  }

  return 'Empresa ID: -'
})
const podeGerenciarUsuarios = computed(() => ehAdmin(usuario.value))
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const adminEmpresa = computed(() => ehAdmin(usuario.value) && !ehSuperAdmin(usuario.value))
const menuAdminAberto = ref(true)
const statusFinanceiro = ref(null)
const carregandoStatusFinanceiro = ref(false)
const ultimaConsultaFinanceira = ref(0)

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

function sair() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  statusFinanceiro.value = null
  router.push('/login')
}

function atualizarUsuarioLogado() {
  if (rotaAgendamentoPublico.value) {
    usuario.value = null
    statusFinanceiro.value = null
    return
  }

  usuario.value = carregarUsuario()
  carregarStatusFinanceiro()
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

watch(
  () => route.fullPath,
  () => {
    atualizarUsuarioLogado()
  },
  { immediate: true },
)

onMounted(() => {
  window.addEventListener('usuario-atualizado', atualizarUsuarioLogado)
  window.addEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
})

onBeforeUnmount(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuarioLogado)
  window.removeEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
})
</script>

<template>
  <RouterView v-if="rotaSemLayout" />

  <div v-else class="app-shell">
    <aside class="barra-lateral">
      <div class="marca">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>Gestao SaaS</strong>
          <small>MicroSaaS empresarial</small>
        </div>
      </div>

      <nav class="menu-principal" aria-label="Navegação principal">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/agenda">Agenda</RouterLink>
        <RouterLink to="/clientes">Clientes</RouterLink>
        <RouterLink to="/servicos">Serviços</RouterLink>
        <RouterLink to="/funcionarios">Funcionários</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/disponibilidade">Disponibilidade</RouterLink>
        <RouterLink v-if="adminEmpresa" to="/onboarding">Primeiros passos</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/relatorios">Relatórios</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa">Minha empresa</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa/notificacoes">Notificações da empresa</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/personalizacao">Personalização</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/meu-plano">Meu plano</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/faturas">Faturas</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/usuarios">Usuários</RouterLink>

        <section v-if="superAdmin" class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="menuAdminAberto = !menuAdminAberto">
            <span>ADMINISTRAÇÃO SAAS</span>
            <span>{{ menuAdminAberto ? '−' : '+' }}</span>
          </button>

          <div v-if="menuAdminAberto" class="submenu">
            <RouterLink to="/admin-dashboard">Dashboard SaaS</RouterLink>
            <RouterLink to="/empresas">Empresas</RouterLink>
            <RouterLink to="/planos">Planos</RouterLink>
            <RouterLink to="/assinaturas">Assinaturas</RouterLink>
            <RouterLink to="/admin/notificacoes">Notificações</RouterLink>
            <RouterLink to="/admin/financeiro">Inadimplência</RouterLink>
            <RouterLink to="/faturas-recorrentes">Faturas recorrentes</RouterLink>
            <RouterLink to="/configuracoes-pagamento">Config. pagamento</RouterLink>
            <RouterLink to="/segmentos">Segmentos/Módulos</RouterLink>
            <RouterLink to="/solicitacoes">Solicitações</RouterLink>
            <RouterLink to="/auditoria">Auditoria</RouterLink>
            <RouterLink to="/lixeira">Lixeira</RouterLink>
          </div>
        </section>

        <RouterLink to="/alterar-senha">Alterar senha</RouterLink>
      </nav>
    </aside>

    <div class="area-principal">
      <header class="topo-app">
        <div>
          <span class="ambiente">API publicada</span>
          <p>https://automacao-le-saas-api.1mweab.easypanel.host</p>
        </div>

        <div class="usuario-logado">
          <NotificacoesBell />

          <div>
            <strong>{{ empresaLogada }}</strong>
            <span>Usuário: {{ usuario?.nome || 'Usuário' }}</span>
            <small>{{ usuario?.email || 'Sessão ativa' }}</small>
          </div>

          <button class="botao-sair" @click="sair">Sair</button>
        </div>
      </header>

      <FinanceiroStatusBanner v-if="adminEmpresa" :status="statusFinanceiro" />

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: #eef2f7;
  color: #111827;
}

.barra-lateral {
  background: #0f172a;
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
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

.area-principal {
  min-width: 0;
  max-width: none;
  width: 100%;
  padding: 24px;
}

.topo-app {
  margin: 0 0 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topo-app p {
  margin: 4px 0 0;
  color: #475569;
  word-break: break-word;
}

.ambiente {
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.usuario-logado {
  display: flex;
  align-items: center;
  gap: 12px;
  text-align: right;
}

.usuario-logado strong,
.usuario-logado span,
.usuario-logado small {
  display: block;
}

.usuario-logado strong {
  font-size: 14px;
  font-weight: 800;
}

.usuario-logado span {
  margin-top: 3px;
  color: #334155;
  font-size: 13px;
  font-weight: 700;
}

.usuario-logado small {
  margin-top: 3px;
  color: #64748b;
  font-size: 13px;
}

.botao-sair {
  border: none;
  color: white;
  background: #0f172a;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    background 0.15s ease;
}

.botao-sair:hover {
  background: #1e293b;
  transform: translateY(-1px);
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .barra-lateral {
    padding: 18px;
  }

  .area-principal {
    padding: 18px;
  }

  .topo-app,
  .usuario-logado {
    align-items: flex-start;
    flex-direction: column;
    text-align: left;
  }
}
</style>
