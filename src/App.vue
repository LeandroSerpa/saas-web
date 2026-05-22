<script setup>
import { computed, onBeforeUnmount, onErrorCaptured, onMounted, ref, watch } from 'vue'
import { RouterLink, RouterView, useRoute, useRouter } from 'vue-router'
import FinanceiroStatusBanner from '@/components/FinanceiroStatusBanner.vue'
import NotificacoesBell from '@/components/NotificacoesBell.vue'
import {
  API_URL,
  buscarStatusFinanceiroMinhaEmpresa,
  carregarUsuarioSessao,
  limparSessaoAutenticacao,
} from '@/services/api'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const route = useRoute()
const router = useRouter()

const rotaLogin = computed(() => route.path === '/login')
const rotaAgendamentoPublico = computed(() => route.path.startsWith('/agendar'))
const rotaCadastroPublico = computed(() => ['/cadastro', '/cadastro-empresa', '/comece-agora'].includes(route.path))
const rotaInstitucionalPublica = computed(() => ['/termos', '/privacidade', '/sobre'].includes(route.path))
const rotaCadastroPendente = computed(() => route.path === '/cadastro-pendente')
const usuario = ref(carregarUsuarioSessao())
const trocaSenhaObrigatoria = computed(() => usuario.value?.trocaSenhaObrigatoria === true)
const rotaSemLayout = computed(() =>
  rotaLogin.value ||
  rotaAgendamentoPublico.value ||
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

  return 'Empresa'
})
const podeGerenciarUsuarios = computed(() => ehAdmin(usuario.value))
const superAdmin = computed(() => ehSuperAdmin(usuario.value))
const adminEmpresa = computed(() => ehAdmin(usuario.value) && !ehSuperAdmin(usuario.value))
const menuAdminAberto = ref(true)
const menuMobileAberto = ref(false)
const statusFinanceiro = ref(null)
const carregandoStatusFinanceiro = ref(false)
const ultimaConsultaFinanceira = ref(0)
const mensagemGlobal = ref('')
const tipoMensagemGlobal = ref('erro')
const erroInesperado = ref(false)
let timeoutMensagemGlobal = null

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

watch(
  () => route.fullPath,
  () => {
    atualizarUsuarioLogado()
    mensagemGlobal.value = ''
    erroInesperado.value = false
    menuMobileAberto.value = false
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
  window.addEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
  window.addEventListener('mensagem-global', exibirMensagemGlobal)
})

onBeforeUnmount(() => {
  window.removeEventListener('usuario-atualizado', atualizarUsuarioLogado)
  window.removeEventListener('financeiro-status-atualizado', atualizarStatusFinanceiroGlobal)
  window.removeEventListener('mensagem-global', exibirMensagemGlobal)

  if (timeoutMensagemGlobal) {
    clearTimeout(timeoutMensagemGlobal)
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
    <header class="topo-mobile">
      <button class="botao-hamburguer" type="button" aria-label="Abrir menu" @click="abrirMenuMobile">
        <span></span>
        <span></span>
        <span></span>
      </button>

      <div class="topo-mobile-texto">
        <strong>Gestão SaaS</strong>
        <small>{{ empresaLogada }}</small>
      </div>

      <button class="botao-sair mobile" @click="sair">Sair</button>
    </header>

    <button
      v-if="menuMobileAberto"
      class="menu-overlay"
      type="button"
      aria-label="Fechar menu"
      @click="fecharMenuMobile"
    ></button>

    <aside class="barra-lateral" :class="{ aberta: menuMobileAberto }">
      <div class="topo-menu-mobile">
        <span>Menu</span>
        <button class="botao-fechar-menu" type="button" aria-label="Fechar menu" @click="fecharMenuMobile">×</button>
      </div>

      <div class="marca">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>Gestão SaaS</strong>
          <small>MicroSaaS empresarial</small>
        </div>
      </div>

      <nav class="menu-principal" aria-label="Navegação principal">
        <RouterLink to="/dashboard" @click="fecharMenuMobile">Dashboard</RouterLink>
        <RouterLink to="/agenda" @click="fecharMenuMobile">Agenda</RouterLink>
        <RouterLink to="/clientes" @click="fecharMenuMobile">Clientes</RouterLink>
        <RouterLink to="/servicos" @click="fecharMenuMobile">Serviços</RouterLink>
        <RouterLink to="/funcionarios" @click="fecharMenuMobile">Funcionários</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/disponibilidade" @click="fecharMenuMobile">Disponibilidade</RouterLink>
        <RouterLink v-if="adminEmpresa" to="/onboarding" @click="fecharMenuMobile">Primeiros passos</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/relatorios" @click="fecharMenuMobile">Relatórios</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa" @click="fecharMenuMobile">Minha empresa</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/minha-empresa/notificacoes" @click="fecharMenuMobile">Notificações da empresa</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/personalizacao" @click="fecharMenuMobile">Personalização</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/meu-plano" @click="fecharMenuMobile">Meu plano</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/faturas" @click="fecharMenuMobile">Faturas</RouterLink>
        <RouterLink v-if="podeGerenciarUsuarios" to="/usuarios" @click="fecharMenuMobile">Usuários</RouterLink>

        <section v-if="superAdmin" class="grupo-menu">
          <button class="grupo-menu-botao" type="button" @click="menuAdminAberto = !menuAdminAberto">
            <span>Administração SaaS</span>
            <span>{{ menuAdminAberto ? '−' : '+' }}</span>
          </button>

          <div v-if="menuAdminAberto" class="submenu">
            <RouterLink to="/admin-dashboard" @click="fecharMenuMobile">Dashboard SaaS</RouterLink>
            <RouterLink to="/empresas" @click="fecharMenuMobile">Empresas</RouterLink>
            <RouterLink to="/admin/empresas/onboarding" @click="fecharMenuMobile">Novo cadastro guiado</RouterLink>
            <RouterLink to="/planos" @click="fecharMenuMobile">Planos</RouterLink>
            <RouterLink to="/assinaturas" @click="fecharMenuMobile">Assinaturas</RouterLink>
            <RouterLink to="/admin/notificacoes" @click="fecharMenuMobile">Notificações SaaS</RouterLink>
            <RouterLink to="/admin/automacoes" @click="fecharMenuMobile">Automações</RouterLink>
            <RouterLink to="/admin/financeiro" @click="fecharMenuMobile">Inadimplência</RouterLink>
            <RouterLink to="/faturas-recorrentes" @click="fecharMenuMobile">Faturas recorrentes</RouterLink>
            <RouterLink to="/configuracoes-pagamento" @click="fecharMenuMobile">Configuração de pagamento</RouterLink>
            <RouterLink to="/segmentos" @click="fecharMenuMobile">Segmentos/Módulos</RouterLink>
            <RouterLink to="/solicitacoes" @click="fecharMenuMobile">Solicitações</RouterLink>
            <RouterLink to="/auditoria" @click="fecharMenuMobile">Auditoria</RouterLink>
            <RouterLink to="/lixeira" @click="fecharMenuMobile">Lixeira</RouterLink>
          </div>
        </section>

        <RouterLink to="/alterar-senha" @click="fecharMenuMobile">Alterar senha</RouterLink>
      </nav>
    </aside>

    <div class="area-principal">
      <header class="topo-app">
        <div>
          <span class="ambiente">API publicada</span>
          <p>{{ API_URL }}</p>
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

      <section v-if="mensagemGlobal" class="mensagem-global" :class="tipoMensagemGlobal">
        <p>{{ mensagemGlobal }}</p>
      </section>

      <RouterView />
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

.barra-lateral {
  background: #0f172a;
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.topo-mobile,
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

.botao-hamburguer {
  border: none;
  background: #0f172a;
  color: white;
  width: 42px;
  height: 42px;
  border-radius: 8px;
  display: grid;
  place-content: center;
  gap: 4px;
  cursor: pointer;
}

.botao-hamburguer span {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
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
  margin: 0 0 18px;
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

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .topo-mobile {
    position: sticky;
    top: 0;
    z-index: 30;
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 12px 16px;
    background: white;
    border-bottom: 1px solid #e5e7eb;
  }

  .topo-mobile-texto {
    min-width: 0;
    flex: 1;
  }

  .topo-mobile-texto strong,
  .topo-mobile-texto small {
    display: block;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }

  .topo-mobile-texto small {
    margin-top: 2px;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
  }

  .botao-sair.mobile {
    padding: 8px 12px;
    font-size: 13px;
  }

  .menu-overlay {
    position: fixed;
    inset: 0;
    border: none;
    background: rgba(15, 23, 42, 0.55);
    z-index: 35;
    display: block;
  }

  .barra-lateral {
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

  .barra-lateral.aberta {
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

  .area-principal {
    padding: 16px;
  }

  .topo-app,
  .usuario-logado {
    align-items: flex-start;
    flex-direction: column;
    text-align: left;
  }
}

@media (max-width: 768px) {
  .area-principal {
    width: 100%;
    max-width: 100%;
  }

  .topo-app {
    padding: 14px;
  }
}

@media (max-width: 480px) {
  .card-erro-interno {
    padding: 20px;
  }

  .card-erro-interno h1 {
    font-size: 24px;
  }

  .area-principal {
    padding: 12px;
  }
}
</style>
