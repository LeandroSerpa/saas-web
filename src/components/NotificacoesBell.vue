<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import {
  buscarNotificacoes,
  buscarResumoNotificacoes,
  marcarNotificacaoComoLida,
  marcarTodasNotificacoesComoLidas,
} from '@/services/api'

const router = useRouter()
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

async function carregarResumo() {
  try {
    erro.value = ''
    resumo.value = normalizarObjeto(await buscarResumoNotificacoes())
  } catch (error) {
    erro.value = ''
    console.error(error)
  }
}

async function carregarNotificacoes() {
  try {
    carregando.value = true
    erro.value = ''
    const dados = await buscarNotificacoes({ limite: 5, status: 'CRIADA' })
    notificacoes.value = normalizarLista(dados)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar notificações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function alternarPainel() {
  aberto.value = !aberto.value

  if (aberto.value) {
    await Promise.all([carregarResumo(), carregarNotificacoes()])
  }
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
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar todas como lidas.')
    console.error(error)
  } finally {
    processando.value = false
  }
}

function abrirNotificacao(item) {
  const link = obterCampo(item, 'linkAcao', 'link', 'url')
  if (!link) return

  aberto.value = false

  if (/^https?:\/\//i.test(link)) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }

  router.push(link)
}

function fecharAoClicarFora(event) {
  if (!aberto.value || painelRef.value?.contains(event.target)) return
  aberto.value = false
}

function statusNaoLida(item) {
  const status = String(obterCampo(item, 'status', 'situacao') || '').toUpperCase()
  return !item.lida && !item.dataLeitura && !['LIDA', 'ARQUIVADA'].includes(status)
}

function prioridadeClasse(item) {
  return normalizar(obterCampo(item, 'prioridade')).toLowerCase()
}

function prioridadeTexto(item) {
  const prioridade = normalizar(obterCampo(item, 'prioridade') || 'NORMAL')
  return prioridade === 'CRITICA' ? 'Crítica' : prioridade.charAt(0) + prioridade.slice(1).toLowerCase()
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

onMounted(() => {
  carregarResumo()
  window.addEventListener('click', fecharAoClicarFora)
  window.addEventListener('notificacoes-atualizadas', carregarResumo)
})

onBeforeUnmount(() => {
  window.removeEventListener('click', fecharAoClicarFora)
  window.removeEventListener('notificacoes-atualizadas', carregarResumo)
})
</script>

<template>
  <div ref="painelRef" class="notificacoes">
    <button class="botao-sino" type="button" aria-label="Notificações" @click.stop="alternarPainel">
      <span class="icone" aria-hidden="true">!</span>
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
      <p v-else-if="!notificacoesRecentes.length" class="estado">Nenhuma notificação no momento.</p>

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
          <p>{{ obterCampo(item, 'mensagemCurta', 'mensagem', 'descricao') || '-' }}</p>
          <small>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</small>
          <div class="acoes">
            <button v-if="obterCampo(item, 'linkAcao', 'link', 'url')" type="button" @click="abrirNotificacao(item)">
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
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  background: #f8fafc;
  color: #0f172a;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 9px 12px;
  cursor: pointer;
  font-weight: 800;
}

.icone {
  width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #2563eb;
  color: white;
  display: grid;
  place-items: center;
  line-height: 1;
}

.badge {
  min-width: 22px;
  height: 22px;
  border-radius: 999px;
  background: #dc2626;
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
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 18px 45px rgba(15, 23, 42, 0.16);
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
  color: #64748b;
}

.link-botao,
.acoes button,
.ver-todas {
  border: none;
  background: transparent;
  color: #2563eb;
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
  color: #991b1b;
}

.lista {
  max-height: 380px;
  overflow-y: auto;
}

.item {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  display: grid;
  gap: 8px;
}

.item.naoLida {
  background: #f8fbff;
  border-left: 4px solid #2563eb;
}

.item strong {
  color: #111827;
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

.prioridade.critica {
  background: #fee2e2;
  color: #b91c1c;
}

.prioridade.alta {
  background: #ffedd5;
  color: #c2410c;
}

.prioridade.normal {
  background: #dbeafe;
  color: #1d4ed8;
}

.prioridade.baixa {
  background: #e5e7eb;
  color: #4b5563;
}

.acoes {
  justify-content: flex-start;
  flex-wrap: wrap;
}

.ver-todas {
  display: block;
  padding: 14px 16px;
  background: #f8fafc;
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
