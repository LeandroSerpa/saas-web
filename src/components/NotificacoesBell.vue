<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import {
  buscarNotificacoes,
  buscarResumoNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
  podeConsultarNotificacoesAutenticadas,
} from '@/services/api'
import {
  atualizarEscopoSolicitado,
  emitirAtualizacaoEmpresa,
  EVENTO_ATUALIZACAO_EMPRESA,
  lerAtualizacaoEmpresaStorage,
} from '@/utils/atualizacoesEmpresa'
import { debugLog } from '@/utils/devDebug'

const router = useRouter()
const route = useRoute()
const aberto = ref(false)
const resumo = ref({})
const notificacoes = ref([])
const carregando = ref(false)
const erro = ref('')
const painelRef = ref(null)
const processando = ref(false)

const totalNaoLidas = computed(() =>
  Number(obterCampo(resumo.value, 'naoLidas', 'naoLida', 'totalNaoLidas', 'totalNaoLida', 'unread') || 0),
)

const notificacoesRecentes = computed(() => notificacoes.value.slice(0, 5))

function podeConsultarNotificacoes() {
  return podeConsultarNotificacoesAutenticadas(route.path)
}

async function carregarResumo() {
  if (!podeConsultarNotificacoes()) {
    resumo.value = {}
    return
  }

  try {
    erro.value = ''
    debugLog('notificacoes', 'Refresh do resumo', { rota: route.path })
    resumo.value = normalizarObjeto(await buscarResumoNotificacoes())
  } catch (error) {
    erro.value = ''
    console.error(error)
  }
}

async function carregarNotificacoes() {
  if (!podeConsultarNotificacoes()) {
    notificacoes.value = []
    return
  }

  try {
    carregando.value = true
    erro.value = ''
    debugLog('notificacoes', 'Refresh da lista recente', { rota: route.path })
    const dados = await buscarNotificacoes({ limite: 5, size: 5, status: 'CRIADA' })
    notificacoes.value = normalizarLista(dados).filter((item) => statusValor(item) === 'CRIADA')
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar notificações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function alternarPainel() {
  if (!podeConsultarNotificacoes()) {
    return
  }

  aberto.value = !aberto.value

  if (aberto.value) {
    await atualizarNotificacoes('painel')
  }
}

async function atualizarNotificacoes(origem = 'manual') {
  if (!podeConsultarNotificacoes()) {
    resumo.value = {}
    notificacoes.value = []
    return
  }

  debugLog('notificacoes', 'Refresh solicitado', {
    origem,
    rota: route.path,
    painelAberto: aberto.value,
  })

  const tarefas = [carregarResumo()]

  if (aberto.value || origem === 'painel') {
    tarefas.push(carregarNotificacoes())
  }

  await Promise.all(tarefas)
}

async function marcarComoLida(item) {
  if (!item?.id) return

  try {
    processando.value = true
    await marcarNotificacaoComoLida(item.id)
    notificacoes.value = notificacoes.value.map((notificacao) =>
      notificacao.id === item.id ? { ...notificacao, status: 'LIDA', lida: true } : notificacao,
    )
    await carregarResumo()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-lida', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar como lida.')
    console.error(error)
  } finally {
    processando.value = false
  }
}

async function marcarTodasComoLidas() {
  try {
    processando.value = true
    await marcarTodasNotificacoesComoLidas()
    notificacoes.value = notificacoes.value.map((item) => ({ ...item, status: 'LIDA', lida: true }))
    await carregarResumo()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-todas-lidas', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar todas como lidas.')
    console.error(error)
  } finally {
    processando.value = false
  }
}

function abrirNotificacao(item) {
  const link = normalizarLinkAcao(obterCampo(item, 'linkAcao', 'link', 'url', 'rota', 'path', 'acaoLink'))
  if (!link) return

  if (ehLinkExterno(link)) {
    aberto.value = false
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }

  if (!rotaInternaExiste(link)) {
    erro.value = 'Link de ação inválido ou indisponível.'
    return
  }

  aberto.value = false
  router.push(link)
}

function fecharAoClicarFora(event) {
  if (!aberto.value || painelRef.value?.contains(event.target)) return
  aberto.value = false
}

function statusNaoLida(item) {
  return statusValor(item) === 'CRIADA'
}

function statusValor(item) {
  const status = normalizar(
    obterCampo(item, 'status', 'statusNotificacao', 'situacao', 'estado') || (item.lida ? 'LIDA' : 'CRIADA'),
  )
  if (status === 'NOVA' || status === 'NOVO' || status === 'NAO_LIDA') return 'CRIADA'
  if (status === 'CRIADO') return 'CRIADA'
  if (status === 'LIDO') return 'LIDA'
  if (status === 'ARQUIVADO') return 'ARQUIVADA'
  if (status === 'EXCLUIDO') return 'EXCLUIDA'
  return status || 'CRIADA'
}

function statusTexto(item) {
  return {
    CRIADA: 'NOVA',
    LIDA: 'LIDA',
    ARQUIVADA: 'ARQUIVADA',
    EXCLUIDA: 'LIXEIRA',
    ENVIADA: 'ENVIADA',
    FALHA: 'FALHA',
    CANCELADA: 'CANCELADA',
  }[statusValor(item)] || statusValor(item)
}

function statusClasse(item) {
  return statusValor(item).toLowerCase()
}

function prioridadeClasse(item) {
  return normalizar(obterCampo(item, 'prioridade')).toLowerCase()
}

function prioridadeTexto(item) {
  const prioridade = normalizar(obterCampo(item, 'prioridade') || 'NORMAL')
  return prioridade === 'CRITICA' ? 'Crítica' : prioridade.charAt(0) + prioridade.slice(1).toLowerCase()
}

function normalizarLinkAcao(valor) {
  const link = String(valor || '').trim()
  if (!link) return ''
  if (/^https?:\/\//i.test(link)) return link
  if (/^wa\.me\//i.test(link)) return `https://${link}`

  const interno = link.startsWith('/') ? link : `/${link}`

  if (['/admin/fatura', '/admin/faturas'].includes(interno)) {
    return '/faturas'
  }

  return interno
}

function ehLinkExterno(link) {
  return /^https?:\/\//i.test(link)
}

function rotaInternaExiste(link) {
  return router.resolve(link).matched.length > 0
}

function formatarData(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  return Number.isNaN(data.getTime())
    ? '-'
    : data.toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  return dados.content || dados.data?.content || dados.data || dados.items || dados.itens || dados.resultado || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && !Array.isArray(dados.data) ? dados.data : dados
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function normalizar(valor) {
  return String(valor || 'NORMAL')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

function rotaPrioritariaNotificacoes() {
  return ['/dashboard', '/agenda', '/notificacoes', '/minha-empresa/notificacoes'].includes(route.path)
}

function aoReceberAtualizacaoEmpresa(evento) {
  if (!atualizarEscopoSolicitado(evento?.detail, 'notificacoes')) {
    return
  }

  atualizarNotificacoes('evento')
}

function aoReceberAtualizacaoEmpresaStorage(evento) {
  const detalhe = lerAtualizacaoEmpresaStorage(evento)

  if (!atualizarEscopoSolicitado(detalhe, 'notificacoes')) {
    return
  }

  atualizarNotificacoes('storage')
}

function aoRetornarParaTela() {
  if (document.visibilityState === 'hidden' || !rotaPrioritariaNotificacoes() || !podeConsultarNotificacoes()) {
    return
  }

  atualizarNotificacoes('foco')
}

function aoReceberEventoLegadoNotificacoes() {
  atualizarNotificacoes('evento-legado')
}

onMounted(() => {
  if (!podeConsultarNotificacoes()) {
    return
  }

  atualizarNotificacoes('montagem')
  window.addEventListener('click', fecharAoClicarFora)
  window.addEventListener('notificacoes-atualizadas', aoReceberEventoLegadoNotificacoes)
  window.addEventListener(EVENTO_ATUALIZACAO_EMPRESA, aoReceberAtualizacaoEmpresa)
  window.addEventListener('storage', aoReceberAtualizacaoEmpresaStorage)
  window.addEventListener('focus', aoRetornarParaTela)
  document.addEventListener('visibilitychange', aoRetornarParaTela)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', fecharAoClicarFora)
  window.removeEventListener('notificacoes-atualizadas', aoReceberEventoLegadoNotificacoes)
  window.removeEventListener(EVENTO_ATUALIZACAO_EMPRESA, aoReceberAtualizacaoEmpresa)
  window.removeEventListener('storage', aoReceberAtualizacaoEmpresaStorage)
  window.removeEventListener('focus', aoRetornarParaTela)
  document.removeEventListener('visibilitychange', aoRetornarParaTela)
})

watch(
  () => route.fullPath,
  () => {
    if (!rotaPrioritariaNotificacoes() || !podeConsultarNotificacoes()) {
      return
    }

    atualizarNotificacoes('navegacao')
  },
)
</script>

<template>
  <div ref="painelRef" class="notificacoes">
    <button class="botao-sino" type="button" aria-label="Notificações" @click.stop="alternarPainel">
      <span class="icone" aria-hidden="true">
        <svg viewBox="0 0 24 24" focusable="false">
          <path d="M12 22a2.4 2.4 0 0 0 2.3-1.7H9.7A2.4 2.4 0 0 0 12 22Zm7-5-1.8-2.1V10a5.2 5.2 0 0 0-4-5.1V3a1.2 1.2 0 0 0-2.4 0v1.9a5.2 5.2 0 0 0-4 5.1v4.9L5 17v1.2h14V17Z" />
        </svg>
      </span>
      <span class="texto">Notificações</span>
      <span v-if="totalNaoLidas > 0" class="badge">{{ totalNaoLidas > 99 ? '99+' : totalNaoLidas }}</span>
    </button>

    <section v-if="aberto" class="painel" @click.stop>
      <header class="painel-topo">
        <div>
          <strong>Notificações</strong>
          <span>{{ totalNaoLidas }} não lida(s)</span>
        </div>
        <button class="link-botao" type="button" :disabled="processando || !totalNaoLidas" @click="marcarTodasComoLidas">
          Marcar todas
        </button>
      </header>

      <p v-if="erro" class="erro">{{ erro }}</p>
      <p v-else-if="carregando" class="estado">Carregando notificações...</p>
      <p v-else-if="!notificacoesRecentes.length" class="estado">Nenhuma notificação não lida.</p>

      <div v-else class="lista">
        <article
          v-for="item in notificacoesRecentes"
          :key="item.id"
          :class="['item', { naoLida: statusNaoLida(item) }]"
        >
          <div class="linha">
            <strong>{{ obterCampo(item, 'titulo', 'title') || 'Notificação' }}</strong>
            <span :class="['prioridade', prioridadeClasse(item)]">{{ prioridadeTexto(item) }}</span>
          </div>
          <span :class="['status', statusClasse(item)]">{{ statusTexto(item) }}</span>
          <p>{{ obterCampo(item, 'mensagemCurta', 'mensagem', 'descricao') || '-' }}</p>
          <small>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</small>
          <div class="acoes">
            <button
              v-if="obterCampo(item, 'linkAcao', 'link', 'url', 'rota', 'path', 'acaoLink')"
              type="button"
              @click="abrirNotificacao(item)"
            >
              Abrir
            </button>
            <button v-if="statusNaoLida(item)" type="button" :disabled="processando" @click="marcarComoLida(item)">
              Marcar como lida
            </button>
          </div>
        </article>
      </div>

      <RouterLink class="ver-todas" to="/notificacoes" @click="aberto = false">Ver todas</RouterLink>
    </section>
  </div>
</template>

<style scoped>
.notificacoes {
  position: relative;
  flex: 0 0 auto;
}

.botao-sino {
  position: relative;
  min-height: 40px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface);
  color: var(--app-text);
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 800;
}

.icone {
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: var(--app-primary);
  color: white;
  display: grid;
  place-items: center;
  line-height: 1;
}

.icone svg {
  width: 18px;
  height: 18px;
  fill: currentColor;
}

.badge {
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: var(--app-danger);
  color: white;
  display: grid;
  place-items: center;
  padding: 0 6px;
  font-size: 12px;
}

.painel {
  position: absolute;
  top: calc(100% + 10px);
  right: 0;
  z-index: 30;
  width: min(360px, calc(100vw - 36px));
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 16px;
  box-shadow: var(--app-shadow);
  overflow: hidden;
  text-align: left;
}

.painel-topo,
.linha,
.acoes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
}

.painel-topo {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
}

.painel-topo strong,
.painel-topo span {
  display: block;
}

.painel-topo span,
.item small,
.item p {
  color: var(--app-text-muted);
}

.link-botao,
.acoes button,
.ver-todas {
  border: none;
  background: transparent;
  color: var(--app-primary);
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  text-decoration: none;
}

.link-botao:disabled,
.acoes button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.estado,
.erro {
  margin: 0;
  padding: 18px 16px;
}

.erro {
  color: var(--app-danger);
}

.lista {
  max-height: 380px;
  overflow-y: auto;
}

.item {
  padding: 14px 16px;
  border-bottom: 1px solid var(--app-border);
  display: grid;
  gap: 8px;
}

.item.naoLida {
  background: var(--app-primary-soft);
  border-left: 4px solid var(--app-primary);
}

.item strong {
  color: var(--app-text);
  font-size: 14px;
}

.item p {
  margin: 0;
  font-size: 13px;
}

.prioridade {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.status {
  width: fit-content;
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.status.criada {
  background: color-mix(in srgb, var(--app-warning) 18%, var(--app-surface));
  color: color-mix(in srgb, var(--app-warning) 74%, black);
}

.status.lida,
.status.enviada {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.status.arquivada {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.status.falha,
.status.cancelada,
.status.excluida {
  background: color-mix(in srgb, var(--app-danger) 14%, var(--app-surface));
  color: var(--app-danger);
}

.prioridade.critica {
  background: color-mix(in srgb, var(--app-danger) 14%, var(--app-surface));
  color: var(--app-danger);
}

.prioridade.alta {
  background: color-mix(in srgb, var(--app-warning) 18%, var(--app-surface));
  color: color-mix(in srgb, var(--app-warning) 74%, black);
}

.prioridade.normal {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.prioridade.baixa {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.acoes {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.ver-todas {
  display: block;
  padding: 14px 16px;
  background: var(--app-surface-soft);
  text-align: center;
}

@media (max-width: 900px) {
  .painel {
    left: 0;
    right: auto;
  }
}

@media (max-width: 560px) {
  .texto {
    display: none;
  }
}
</style>
