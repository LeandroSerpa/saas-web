<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'

const route = useRoute()
const router = useRouter()

const rotaLogin = computed(() => route.path === '/login')
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
const podeGerenciarUsuarios = computed(
  () => usuario.value?.perfil === 'ADMIN' || usuario.value?.perfil === 'SUPER_ADMIN',
)
const superAdmin = computed(() => usuario.value?.perfil === 'SUPER_ADMIN')

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
  router.push('/login')
}

function atualizarUsuarioLogado() {
  usuario.value = carregarUsuario()
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
})

onBeforeUnmount(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuarioLogado)
})
</script>

<template>
  <RouterView v-if="rotaLogin" />

  <div v-else class="app-shell">
    <aside class="barra-lateral">
      <div class="marca">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>Gestao SaaS</strong>
          <small>MicroSaaS empresarial</small>
        </div>
      </div>

      <nav class="menu-principal" aria-label="Navegacao principal">
        <RouterLink to="/dashboard">Dashboard</RouterLink>
        <RouterLink to="/agenda">Agenda</RouterLink>
        <RouterLink to="/clientes">Clientes</RouterLink>
        <RouterLink to="/servicos">Servicos</RouterLink>
        <RouterLink to="/funcionarios">Funcionarios</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa">Minha empresa</RouterLink>
        <RouterLink v-if="superAdmin" to="/empresas">Empresas</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/usuarios">Usuarios</RouterLink>
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
          <div>
            <strong>{{ empresaLogada }}</strong>
            <span>Usuario: {{ usuario?.nome || 'Usuario' }}</span>
            <small>{{ usuario?.email || 'Sessao ativa' }}</small>
          </div>

          <button class="botao-sair" @click="sair">Sair</button>
        </div>
      </header>

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

.area-principal {
  min-width: 0;
  max-width: 1230px;
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
