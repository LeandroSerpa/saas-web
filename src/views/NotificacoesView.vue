<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  arquivarNotificacao,
  buscarNotificacoes,
  buscarResumoNotificacoes,
  desarquivarNotificacao,
  excluirNotificacao,
  marcarNotificacaoComoLida,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import {
  atualizarEscopoSolicitado,
  emitirAtualizacaoEmpresa,
  EVENTO_ATUALIZACAO_EMPRESA,
  lerAtualizacaoEmpresaStorage,
} from '@/utils/atualizacoesEmpresa'
import { debugLog } from '@/utils/devDebug'

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
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())

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
    sucesso.value = ''
    modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
    notificacoes.value = []
    resumo.value = {}

    if (modoVisualizacaoEmpresa.value) {
      return
    }

    debugLog('notificacoes-view', 'Refresh das notificações da empresa', limparVazios(filtros.value))
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
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await marcarNotificacaoComoLida(item.id)
    sucesso.value = 'Notificação marcada como lida.'
    await carregarDados()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-view-lida', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar como lida.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function arquivar(item) {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await arquivarNotificacao(item.id)
    sucesso.value = 'Notificação arquivada.'
    await carregarDados()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-view-arquivar', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível arquivar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function desarquivar(item) {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await desarquivarNotificacao(item.id)
    sucesso.value = 'Notificação desarquivada.'
    await carregarDados()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-view-desarquivar', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível desarquivar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function excluir(item) {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    await excluirNotificacao(item.id)
    sucesso.value = 'Notificação movida para a lixeira.'
    await carregarDados()
    emitirAtualizacaoEmpresa({ origem: 'notificacoes-view-excluir', escopos: ['notificacoes', 'dashboard'] })
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível mover a notificação para a lixeira.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function abrir(item) {
  const link = normalizarLinkAcao(obterCampo(item, 'linkAcao', 'link', 'url', 'rota', 'path', 'acaoLink'))
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
  return !modoVisualizacaoEmpresa.value && statusValor(item) === 'CRIADA'
}

function podeArquivar(item) {
  return !modoVisualizacaoEmpresa.value && !['ARQUIVADA', 'EXCLUIDA'].includes(statusValor(item))
}

function podeDesarquivar(item) {
  return !modoVisualizacaoEmpresa.value && statusValor(item) === 'ARQUIVADA'
}

function podeExcluir(item) {
  return !modoVisualizacaoEmpresa.value && statusValor(item) !== 'EXCLUIDA'
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

async function processarAtualizacaoCompartilhada(detalhe) {
  if (!atualizarEscopoSolicitado(detalhe, 'notificacoes')) {
    return
  }

  await carregarDados()
}

function aoReceberAtualizacaoEmpresa(evento) {
  processarAtualizacaoCompartilhada(evento?.detail)
}

function aoReceberAtualizacaoEmpresaStorage(evento) {
  const detalhe = lerAtualizacaoEmpresaStorage(evento)

  if (!detalhe) {
    return
  }

  processarAtualizacaoCompartilhada(detalhe)
}

function atualizarModoVisualizacao() {
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  erro.value = ''
  sucesso.value = ''
  carregarDados()
}

onMounted(() => {
  carregarDados()
  window.addEventListener(EVENTO_ATUALIZACAO_EMPRESA, aoReceberAtualizacaoEmpresa)
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
  window.addEventListener('storage', aoReceberAtualizacaoEmpresaStorage)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_ATUALIZACAO_EMPRESA, aoReceberAtualizacaoEmpresa)
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
  window.removeEventListener('storage', aoReceberAtualizacaoEmpresaStorage)
})
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
    <section v-if="modoVisualizacaoEmpresa" class="card aviso-visualizacao">
      <p>Selecione uma empresa no seletor superior para operar esta tela.</p>
    </section>

    <section class="grade-resumo">
      <article v-for="card in cards" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card filtros">
      <div class="titulo-card">
        <h2>Filtros de notificações</h2>
        <p>Refine a lista por status, tipo e período sem perder a leitura dos avisos.</p>
      </div>

      <div class="campos">
        <label>
          Status
          <select v-model="filtros.status">
            <option v-for="status in STATUS" :key="status.valor" :value="status.valor">{{ status.rotulo }}</option>
          </select>
        </label>

        <label>
          Tipo
          <input v-model="filtros.tipo" type="text" placeholder="FINANCEIRO, SISTEMA..." />
        </label>

        <label>
          Data inicial
          <input v-model="filtros.dataInicial" type="date" />
        </label>

        <label>
          Data final
          <input v-model="filtros.dataFinal" type="date" />
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" @click="carregarDados">Aplicar filtros</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <section v-if="carregando" class="card">Carregando notificações...</section>
    <section v-else-if="!notificacoes.length" class="card estado-vazio">
      <strong>Nenhuma notificação no momento.</strong>
      <p>Quando novos avisos chegarem, eles aparecerão aqui em cards mais fáceis de ler.</p>
    </section>
    <section v-else class="grade-notificacoes">
      <article
        v-for="item in notificacoes"
        :key="item.id"
        :class="['card notificacao-card', { 'nao-lida': statusNaoLida(item) }]"
      >
        <div class="notificacao-topo">
          <div class="notificacao-titulos">
            <div class="badges">
              <span :class="['prioridade', prioridadeClasse(obterCampo(item, 'prioridade'))]">
                {{ prioridadeTexto(obterCampo(item, 'prioridade')) }}
              </span>
              <span :class="['status', statusClasse(item)]">{{ statusTexto(item) }}</span>
            </div>
            <h2>{{ obterCampo(item, 'titulo', 'title') || 'Notificação' }}</h2>
            <p class="tipo-notificacao">{{ obterCampo(item, 'tipo') || 'Tipo não informado' }}</p>
          </div>

          <div class="meta-notificacao">
            <span>Data</span>
            <strong>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</strong>
          </div>
        </div>

        <p class="mensagem-notificacao">
          {{ obterCampo(item, 'mensagem', 'mensagemCurta', 'descricao') || 'Sem descrição disponível.' }}
        </p>

        <div class="acoes-notificacao">
          <button
            v-if="obterCampo(item, 'linkAcao', 'link', 'url', 'rota', 'path', 'acaoLink')"
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
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina {
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
h2,
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

.titulo-card h2,
.notificacao-titulos h2 {
  color: #111827;
  font-weight: 800;
}

.titulo-card h2 {
  font-size: 22px;
}

.titulo-card p {
  margin-top: 6px;
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

.filtros,
.notificacao-card {
  display: grid;
  gap: 16px;
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
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
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

.botao.compacto {
  padding: 8px 10px;
  font-size: 12px;
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

.aviso-visualizacao,
.estado-vazio {
  color: #64748b;
}

.aviso-visualizacao p {
  margin: 0;
}

.grade-notificacoes {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 14px;
}

.notificacao-card {
  align-content: start;
}

.notificacao-card.nao-lida {
  border-color: #bfdbfe;
  background: #f8fbff;
}

.notificacao-topo {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.notificacao-titulos {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.notificacao-titulos h2 {
  font-size: 20px;
  line-height: 1.25;
}

.badges {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
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

.tipo-notificacao,
.mensagem-notificacao,
.meta-notificacao span,
.meta-notificacao strong {
  color: #64748b;
}

.tipo-notificacao {
  font-size: 14px;
  font-weight: 700;
}

.meta-notificacao {
  display: grid;
  gap: 4px;
  justify-items: end;
  text-align: right;
  white-space: nowrap;
}

.meta-notificacao span {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.meta-notificacao strong {
  font-size: 14px;
}

.mensagem-notificacao {
  line-height: 1.5;
  word-break: break-word;
}

.acoes-notificacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.acoes-notificacao .botao.compacto {
  width: fit-content;
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

  .notificacao-topo {
    flex-direction: column;
  }

  .meta-notificacao {
    justify-items: start;
    text-align: left;
  }

  .acoes-notificacao .botao.compacto {
    width: 100%;
  }
}
</style>
