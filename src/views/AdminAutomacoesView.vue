<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarAutomacoesDisponiveis,
  buscarExecucaoAutomacaoPorId,
  buscarExecucoesAutomacoes,
  buscarResumoAutomacoes,
  executarAutomacaoFaturasRecorrentes,
  executarAutomacaoLembretesAgendamentos,
  executarAutomacaoLembretesFinanceiros,
} from '@/services/api'

const TIPOS = ['', 'LEMBRETES_AGENDAMENTOS', 'LEMBRETES_FINANCEIROS', 'FATURAS_RECORRENTES']
const STATUS = ['', 'EM_EXECUCAO', 'SUCESSO', 'ERRO']

const automacoes = ref([])
const resumo = ref({})
const execucoes = ref([])
const detalhe = ref(null)
const filtros = ref({ tipoAutomacao: '', status: '', dataInicio: '', dataFim: '' })
const carregando = ref(true)
const carregandoHistorico = ref(false)
const carregandoDetalhe = ref(false)
const executandoTipo = ref('')
const erro = ref('')
const sucesso = ref('')

const cardsResumo = computed(() => [
  { titulo: 'Total de execuções', valor: numeroResumo('totalExecucoes', 'total') },
  { titulo: 'Sucessos', valor: numeroResumo('sucessos', 'totalSucesso') },
  { titulo: 'Erros', valor: numeroResumo('erros', 'totalErros') },
  { titulo: 'Em execução', valor: numeroResumo('emExecucao', 'totalEmExecucao') },
  { titulo: 'Última execução', valor: formatarDataResumo(obterCampo(resumo.value, 'ultimaExecucao', 'ultimaExecucaoEm')) },
  { titulo: 'Última execução com erro', valor: formatarDataResumo(obterCampo(resumo.value, 'ultimaExecucaoErro', 'ultimaExecucaoComErroEm')) },
])

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    sucesso.value = ''
    detalhe.value = null
    const [automacoesApi, resumoApi, execucoesApi] = await Promise.all([
      buscarAutomacoesDisponiveis(),
      buscarResumoAutomacoes(),
      buscarExecucoesAutomacoes(limparVazios(filtros.value)),
    ])
    automacoes.value = normalizarLista(automacoesApi)
    resumo.value = normalizarObjeto(resumoApi)
    execucoes.value = normalizarLista(execucoesApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar a central de automações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarResumoEHistorico() {
  try {
    carregandoHistorico.value = true
    erro.value = ''
    const [resumoApi, execucoesApi] = await Promise.all([
      buscarResumoAutomacoes(),
      buscarExecucoesAutomacoes(limparVazios(filtros.value)),
    ])
    resumo.value = normalizarObjeto(resumoApi)
    execucoes.value = normalizarLista(execucoesApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar o histórico de automações.')
    console.error(error)
  } finally {
    carregandoHistorico.value = false
  }
}

async function executarAutomacao(item) {
  const tipo = tipoAutomacao(item)
  if (!tipo || !window.confirm('Executar esta automação agora?')) return

  const acao = obterAcaoExecucao(tipo)
  if (!acao) {
    erro.value = 'Esta automação ainda não está disponível nesta central.'
    sucesso.value = ''
    return
  }

  try {
    executandoTipo.value = tipo
    erro.value = ''
    sucesso.value = ''
    const resposta = await acao()
    sucesso.value = mensagemSucessoAutomacao(tipo, resposta)
    await carregarResumoEHistorico()
  } catch (error) {
    erro.value = mensagemErroExecucao(error)
    console.error(error)
  } finally {
    executandoTipo.value = ''
  }
}

async function abrirDetalhes(item) {
  if (!item?.id) return

  try {
    carregandoDetalhe.value = true
    erro.value = ''
    detalhe.value = normalizarObjeto(await buscarExecucaoAutomacaoPorId(item.id))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os detalhes da execução.')
    console.error(error)
  } finally {
    carregandoDetalhe.value = false
  }
}

function limparFiltros() {
  filtros.value = { tipoAutomacao: '', status: '', dataInicio: '', dataFim: '' }
  detalhe.value = null
  carregarResumoEHistorico()
}

function aplicarFiltros() {
  detalhe.value = null
  carregarResumoEHistorico()
}

function obterAcaoExecucao(tipo) {
  return {
    LEMBRETES_AGENDAMENTOS: executarAutomacaoLembretesAgendamentos,
    LEMBRETES_FINANCEIROS: executarAutomacaoLembretesFinanceiros,
    FATURAS_RECORRENTES: executarAutomacaoFaturasRecorrentes,
  }[tipo]
}

function mensagemSucessoAutomacao(tipo, resposta) {
  if (typeof resposta === 'string' && resposta.trim()) {
    return resposta.trim()
  }

  const dados = normalizarObjeto(resposta)
  const mensagemBackend = obterCampo(dados, 'mensagemResultado', 'mensagem', 'message', 'detail')

  if (mensagemBackend) {
    return mensagemBackend
  }

  return {
    LEMBRETES_AGENDAMENTOS: 'Lembretes de agendamentos executados com sucesso.',
    LEMBRETES_FINANCEIROS: 'Lembretes financeiros executados com sucesso.',
    FATURAS_RECORRENTES: 'Faturas recorrentes geradas com sucesso.',
  }[tipo] || 'Automação executada com sucesso.'
}

function mensagemErroExecucao(error) {
  const status = obterStatusErro(error)
  const texto = String(error?.message || '').toLowerCase()
  if (status === 403) return 'Você não tem permissão para executar automações.'
  if (status === 404 || texto.includes('não disponível') || texto.includes('indispon')) {
    return 'Esta automação ainda não está disponível nesta central.'
  }
  return 'Não foi possível executar a automação agora.'
}

function tipoAutomacao(item) {
  return normalizar(obterCampo(item, 'tipoAutomacao', 'tipo', 'codigo'))
}

function automacaoDisponivel(item) {
  return obterCampo(item, 'disponivel') !== false
}

function automacaoAtiva(item) {
  return obterCampo(item, 'automaticoAtivo', 'ativoAutomatico') === true
}

function statusClasse(status) {
  return normalizar(status).toLowerCase()
}

function formatarStatus(status) {
  return normalizar(status || '-').replace(/_/g, ' ')
}

function formatarData(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleString('pt-BR')
}

function formatarDataResumo(valor) {
  return valor ? formatarData(valor) : 'Nenhuma automação executada ainda.'
}

function detalhesFormatados(valor) {
  if (!valor) return '-'
  if (typeof valor === 'object') return JSON.stringify(valor, null, 2)
  try {
    return JSON.stringify(JSON.parse(valor), null, 2)
  } catch (error) {
    return String(valor)
  }
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

function numeroResumo(...campos) {
  return Number(obterCampo(resumo.value, ...campos) || 0).toLocaleString('pt-BR')
}

function normalizar(valor) {
  return String(valor || '').trim().toUpperCase()
}

function obterStatusErro(error) {
  return Number(error?.status || error?.response?.status || error?.detalhes?.status || 0)
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
        <p class="subtitulo">Administração SaaS</p>
        <h1>Central de Automações</h1>
        <p class="descricao">Execute e acompanhe rotinas internas do SaaS, como lembretes, notificações e processos recorrentes.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="grade-resumo">
      <article v-for="card in cardsResumo" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="secao">
      <div class="cabecalho-lista">
        <div>
          <h2>Automações disponíveis</h2>
          <p>Rotinas internas que podem ser executadas manualmente pela administração SaaS.</p>
        </div>
      </div>
      <section v-if="carregando" class="card">Carregando automações...</section>
      <section v-else-if="!automacoes.length" class="card">Nenhuma automação disponível.</section>
      <section v-else class="grade-automacoes">
        <article v-for="item in automacoes" :key="tipoAutomacao(item) || item.id" class="card automacao-card">
          <div>
            <h3>{{ obterCampo(item, 'titulo', 'nome') || tipoAutomacao(item) || 'Automação' }}</h3>
            <p>{{ obterCampo(item, 'descricao') || 'Rotina interna do SaaS.' }}</p>
          </div>
          <div class="badges">
            <span class="badge neutra">{{ tipoAutomacao(item) || '-' }}</span>
            <span :class="['badge', automacaoDisponivel(item) ? 'sucesso-badge' : 'erro-badge']">
              {{ automacaoDisponivel(item) ? 'Disponível' : 'Indisponível' }}
            </span>
            <span :class="['badge', automacaoAtiva(item) ? 'sucesso-badge' : 'neutra']">
              {{ automacaoAtiva(item) ? 'Automático ativo' : 'Manual' }}
            </span>
          </div>
          <p v-if="obterCampo(item, 'observacao')" class="observacao">{{ obterCampo(item, 'observacao') }}</p>
          <button
            class="botao principal"
            :disabled="!automacaoDisponivel(item) || executandoTipo === tipoAutomacao(item)"
            @click="executarAutomacao(item)"
          >
            {{ executandoTipo === tipoAutomacao(item) ? 'Executando...' : 'Executar' }}
          </button>
        </article>
      </section>
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>Tipo
          <select v-model="filtros.tipoAutomacao">
            <option v-for="tipo in TIPOS" :key="tipo || 'TODOS'" :value="tipo">{{ tipo || 'Todos' }}</option>
          </select>
        </label>
        <label>Status
          <select v-model="filtros.status">
            <option v-for="status in STATUS" :key="status || 'TODOS'" :value="status">{{ status || 'Todos' }}</option>
          </select>
        </label>
        <label>Data inicial <input v-model="filtros.dataInicio" type="date" /></label>
        <label>Data final <input v-model="filtros.dataFim" type="date" /></label>
      </div>
      <div class="acoes">
        <button class="botao principal" @click="aplicarFiltros">Filtrar</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
        <button class="botao secundario" @click="aplicarFiltros">Atualizar</button>
      </div>
    </section>

    <section class="secao">
      <div class="cabecalho-lista">
        <div>
          <h2>Histórico de execuções</h2>
          <p>Execuções registradas para os filtros selecionados.</p>
        </div>
      </div>
      <section v-if="carregandoHistorico" class="card">Carregando histórico...</section>
      <section v-else-if="!execucoes.length" class="card">Nenhuma execução registrada ainda.</section>
      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Início</th>
                <th>Tipo</th>
                <th>Status</th>
                <th>Executado por</th>
                <th>Processados</th>
                <th>Sucesso</th>
                <th>Ignorados</th>
                <th>Erros</th>
                <th>Mensagem</th>
                <th>Ação</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in execucoes" :key="item.id">
                <td>{{ formatarData(obterCampo(item, 'iniciadoEm', 'criadoEm')) }}</td>
                <td>{{ obterCampo(item, 'tipoAutomacao') || '-' }}</td>
                <td><span :class="['status', statusClasse(obterCampo(item, 'status'))]">{{ formatarStatus(obterCampo(item, 'status')) }}</span></td>
                <td>{{ obterCampo(item, 'executadoPorUsuarioNome', 'executadoPor') || '-' }}</td>
                <td>{{ obterCampo(item, 'totalProcessados') || 0 }}</td>
                <td>{{ obterCampo(item, 'totalSucesso') || 0 }}</td>
                <td>{{ obterCampo(item, 'totalIgnorados') || 0 }}</td>
                <td>{{ obterCampo(item, 'totalErros') || 0 }}</td>
                <td>{{ obterCampo(item, 'mensagemResultado', 'mensagemErro') || '-' }}</td>
                <td><button class="botao compacto secundario" @click="abrirDetalhes(item)">Detalhes</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="detalhe || carregandoDetalhe" class="card detalhe">
      <div class="cabecalho-lista">
        <div>
          <h2>Detalhes da execução</h2>
          <p>{{ detalhe ? obterCampo(detalhe, 'titulo', 'tipoAutomacao') : 'Carregando...' }}</p>
        </div>
        <button class="botao secundario" @click="detalhe = null">Fechar</button>
      </div>
      <p v-if="carregandoDetalhe">Carregando detalhes...</p>
      <div v-else class="detalhes-grid">
        <p><strong>Tipo:</strong> {{ obterCampo(detalhe, 'tipoAutomacao') || '-' }}</p>
        <p><strong>Status:</strong> {{ formatarStatus(obterCampo(detalhe, 'status')) }}</p>
        <p><strong>Título:</strong> {{ obterCampo(detalhe, 'titulo') || '-' }}</p>
        <p class="campo-grande"><strong>Descrição:</strong> {{ obterCampo(detalhe, 'descricao') || '-' }}</p>
        <p><strong>Iniciado em:</strong> {{ formatarData(obterCampo(detalhe, 'iniciadoEm')) }}</p>
        <p><strong>Finalizado em:</strong> {{ formatarData(obterCampo(detalhe, 'finalizadoEm')) }}</p>
        <p><strong>Usuário:</strong> {{ obterCampo(detalhe, 'executadoPorUsuarioNome') || '-' }}</p>
        <p><strong>E-mail:</strong> {{ obterCampo(detalhe, 'executadoPorUsuarioEmail') || '-' }}</p>
        <p><strong>Processados:</strong> {{ obterCampo(detalhe, 'totalProcessados') || 0 }}</p>
        <p><strong>Sucesso:</strong> {{ obterCampo(detalhe, 'totalSucesso') || 0 }}</p>
        <p><strong>Ignorados:</strong> {{ obterCampo(detalhe, 'totalIgnorados') || 0 }}</p>
        <p><strong>Erros:</strong> {{ obterCampo(detalhe, 'totalErros') || 0 }}</p>
        <p class="campo-grande"><strong>Resultado:</strong> {{ obterCampo(detalhe, 'mensagemResultado') || '-' }}</p>
        <p class="campo-grande"><strong>Erro:</strong> {{ obterCampo(detalhe, 'mensagemErro') || '-' }}</p>
        <pre class="campo-grande detalhes-json">{{ detalhesFormatados(obterCampo(detalhe, 'detalhesJson')) }}</pre>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,.secao,.filtros,.detalhe{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.cabecalho-lista,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,h3,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:22px}h3{font-size:18px;font-weight:800}.descricao,.cabecalho-lista p,.automacao-card p,.observacao{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.grade-resumo{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:14px}.indicador{display:grid;gap:8px}.indicador span{color:#64748b;font-weight:800}.indicador strong{font-size:20px;font-weight:800}.grade-automacoes{display:grid;grid-template-columns:repeat(3,minmax(240px,1fr));gap:14px}.automacao-card{display:grid;gap:14px;align-content:start}.badges{display:flex;gap:8px;flex-wrap:wrap}.badge,.status{display:inline-flex;width:fit-content;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.sucesso-badge,.status.sucesso{background:#dcfce7;color:#15803d}.erro-badge,.status.erro{background:#fee2e2;color:#b91c1c}.neutra,.status.em_execucao{background:#fef3c7;color:#92400e}.campos,.detalhes-grid{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:14px}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.botao:disabled{opacity:.55;cursor:not-allowed}.principal{background:#2563eb}.secundario{background:#0f172a}.compacto{width:100%;padding:7px 8px;font-size:11px;line-height:1.2}.tabela-card{padding:0;overflow:hidden}.tabela-container{overflow-x:auto}table{width:100%;min-width:980px;border-collapse:collapse}th,td{padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:left;vertical-align:top;font-size:13px;word-break:break-word}th{background:#f8fafc;color:#111827;font-size:11px;font-weight:800;text-transform:uppercase}.campo-grande{grid-column:1/-1}.detalhes-json{margin:0;white-space:pre-wrap;background:#0f172a;color:#e2e8f0;border-radius:8px;padding:14px;overflow:auto}@media(max-width:900px){.cabecalho-pagina,.cabecalho-lista,.acoes{align-items:flex-start;flex-direction:column}.grade-resumo,.grade-automacoes,.campos,.detalhes-grid{grid-template-columns:1fr}}
</style>
