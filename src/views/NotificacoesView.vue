<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  arquivarNotificacao,
  buscarNotificacoes,
  buscarResumoNotificacoes,
  desarquivarNotificacao,
  excluirNotificacao,
  marcarNotificacaoComoLida,
} from '@/services/api'

const STATUS = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'CRIADA', rotulo: 'Novas' },
  { valor: 'LIDA', rotulo: 'Lidas' },
  { valor: 'ARQUIVADA', rotulo: 'Arquivadas' },
]

const router = useRouter()
const filtros = ref({
  status: '',
  tipo: '',
  dataInicial: '',
  dataFinal: '',
})
const notificacoes = ref([])
const resumo = ref({})
const carregando = ref(true)
const processandoId = ref(null)
const erro = ref('')
const sucesso = ref('')

const cards = computed(() => [
  { titulo: 'Total', valor: numeroResumo('total', 'totalNotificacoes') },
  { titulo: 'Não lidas', valor: numeroResumo('naoLidas', 'totalNaoLidas') },
  { titulo: 'Alta prioridade', valor: numeroResumo('altaPrioridade', 'totalAltaPrioridade', 'altas') },
  { titulo: 'Críticas', valor: numeroResumo('criticas', 'totalCriticas') },
])

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const [listaApi, resumoApi] = await Promise.all([
      buscarNotificacoes(limparVazios(filtros.value)),
      buscarResumoNotificacoes(),
    ])
    notificacoes.value = normalizarLista(listaApi).filter((item) => statusValor(item) !== 'EXCLUIDA')
    resumo.value = normalizarObjeto(resumoApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as notificações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function marcarComoLida(item) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await marcarNotificacaoComoLida(item.id)
    sucesso.value = 'Notificação marcada como lida.'
    await carregarDados()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar como lida.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function arquivar(item) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await arquivarNotificacao(item.id)
    sucesso.value = 'Notificação arquivada.'
    await carregarDados()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível arquivar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function desarquivar(item) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await desarquivarNotificacao(item.id)
    sucesso.value = 'Notificação desarquivada.'
    await carregarDados()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível desarquivar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function excluir(item) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await excluirNotificacao(item.id)
    sucesso.value = 'Notificação movida para a lixeira.'
    await carregarDados()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível mover a notificação para a lixeira.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function abrir(item) {
  const link = normalizarLinkAcao(obterCampo(item, 'linkAcao', 'link', 'url'))
  if (!link) return

  if (ehLinkExterno(link)) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }

  if (!rotaInternaExiste(link)) {
    erro.value = 'Link de ação inválido ou indisponível.'
    sucesso.value = ''
    return
  }

  router.push(link)
}

function limparFiltros() {
  filtros.value = { status: '', tipo: '', dataInicial: '', dataFinal: '' }
  carregarDados()
}

function statusNaoLida(item) {
  return statusValor(item) === 'CRIADA'
}

function statusValor(item) {
  const status = normalizarStatus(
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

function podeMarcarComoLida(item) {
  return statusValor(item) === 'CRIADA'
}

function podeArquivar(item) {
  return !['ARQUIVADA', 'EXCLUIDA'].includes(statusValor(item))
}

function podeDesarquivar(item) {
  return statusValor(item) === 'ARQUIVADA'
}

function podeExcluir(item) {
  return statusValor(item) !== 'EXCLUIDA'
}

function prioridadeTexto(valor) {
  const prioridade = normalizar(valor || 'NORMAL')
  return prioridade === 'CRITICA' ? 'Crítica' : prioridade.charAt(0) + prioridade.slice(1).toLowerCase()
}

function prioridadeClasse(valor) {
  return normalizar(valor || 'NORMAL').toLowerCase()
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
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleString('pt-BR')
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

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined),
  )
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function normalizarStatus(status) {
  return normalizar(status)
}

function numeroResumo(...campos) {
  return Number(obterCampo(resumo.value, ...campos) || 0).toLocaleString('pt-BR')
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

onMounted(carregarDados)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Central</p>
        <h1>Notificações</h1>
        <p class="descricao">Acompanhe avisos importantes da sua empresa e do sistema.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="grade-resumo">
      <article v-for="card in cards" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>Status
          <select v-model="filtros.status">
            <option v-for="status in STATUS" :key="status.valor" :value="status.valor">{{ status.rotulo }}</option>
          </select>
        </label>
        <label>Tipo
          <input v-model="filtros.tipo" type="text" placeholder="FINANCEIRO, SISTEMA..." />
        </label>
        <label>Data inicial
          <input v-model="filtros.dataInicial" type="date" />
        </label>
        <label>Data final
          <input v-model="filtros.dataFinal" type="date" />
        </label>
      </div>
      <div class="acoes">
        <button class="botao principal" @click="carregarDados">Aplicar filtros</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <section v-if="carregando" class="card">Carregando notificações...</section>
    <section v-else-if="!notificacoes.length" class="card">Nenhuma notificação no momento.</section>
    <section v-else class="card tabela-card">
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Prioridade</th>
              <th>Tipo</th>
              <th>Título</th>
              <th>Mensagem</th>
              <th>Data</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in notificacoes" :key="item.id" :class="{ 'linha-nao-lida': statusNaoLida(item) }">
              <td>
                <span :class="['prioridade', prioridadeClasse(obterCampo(item, 'prioridade'))]">
                  {{ prioridadeTexto(obterCampo(item, 'prioridade')) }}
                </span>
              </td>
              <td>{{ obterCampo(item, 'tipo') || '-' }}</td>
              <td><strong>{{ obterCampo(item, 'titulo', 'title') || 'Notificação' }}</strong></td>
              <td>{{ obterCampo(item, 'mensagem', 'mensagemCurta', 'descricao') || '-' }}</td>
              <td>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</td>
              <td><span :class="['status', statusClasse(item)]">{{ statusTexto(item) }}</span></td>
              <td>
                <div class="acoes-tabela">
                  <button
                    v-if="obterCampo(item, 'linkAcao', 'link', 'url')"
                    class="botao compacto secundario"
                    @click="abrir(item)"
                  >
                    Abrir
                  </button>
                  <button
                    v-if="podeMarcarComoLida(item)"
                    class="botao compacto principal"
                    :disabled="processandoId === item.id"
                    @click="marcarComoLida(item)"
                  >
                    Marcar como lida
                  </button>
                  <button
                    v-if="podeArquivar(item)"
                    class="botao compacto perigo"
                    :disabled="processandoId === item.id"
                    @click="arquivar(item)"
                  >
                    Arquivar
                  </button>
                  <button
                    v-if="podeDesarquivar(item)"
                    class="botao compacto sucesso-botao"
                    :disabled="processandoId === item.id"
                    @click="desarquivar(item)"
                  >
                    Desarquivar
                  </button>
                  <button
                    v-if="podeExcluir(item)"
                    class="botao compacto perigo"
                    :disabled="processandoId === item.id"
                    @click="excluir(item)"
                  >
                    Lixeira
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.filtros {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.acoes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

.descricao {
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 14px;
}

.indicador {
  display: grid;
  gap: 8px;
}

.indicador span {
  color: #64748b;
  font-weight: 800;
}

.indicador strong {
  font-size: 24px;
  font-weight: 800;
}

.campos {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-weight: 800;
}

input,
select {
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.perigo {
  background: #dc2626;
}

.sucesso-botao {
  background: #15803d;
}

.compacto {
  width: 100%;
  padding: 7px 8px;
  font-size: 11px;
  line-height: 1.2;
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.tabela-card {
  padding: 0;
  overflow: hidden;
}

.tabela-container {
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 920px;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  word-break: break-word;
}

th {
  background: #f8fafc;
  color: #111827;
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

th:last-child,
td:last-child {
  position: sticky;
  right: 0;
  z-index: 2;
  width: 140px;
  min-width: 140px;
  background: white;
  box-shadow: -8px 0 14px rgba(15, 23, 42, 0.06);
}

th:last-child {
  z-index: 3;
  background: #f8fafc;
}

.linha-nao-lida {
  background: #f8fbff;
}

.linha-nao-lida td:last-child {
  background: #f8fbff;
}

.prioridade,
.status {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
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

.status.criada {
  background: #fef3c7;
  color: #92400e;
}

.status.lida,
.status.enviada {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.arquivada {
  background: #e5e7eb;
  color: #374151;
}

.status.falha,
.status.cancelada,
.status.excluida {
  background: #fee2e2;
  color: #b91c1c;
}

.acoes-tabela {
  display: flex;
  flex-direction: column;
  gap: 6px;
}

.texto-acao {
  color: #64748b;
  font-weight: 800;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .grade-resumo,
  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
