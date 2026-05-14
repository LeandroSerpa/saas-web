<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  buscarAgendamentos,
  buscarClientes,
  buscarFuncionarios,
  buscarOnboarding,
  buscarServicos,
  buscarStatusFinanceiroMinhaEmpresa,
} from '@/services/api'
import { ehAdmin, ehSuperAdmin } from '@/utils/permissoes'

const agendamentos = ref([])
const clientes = ref([])
const servicos = ref([])
const funcionarios = ref([])
const onboarding = ref(null)
const statusFinanceiro = ref(null)
const usuarioLogado = ref(obterUsuarioLogado())

const carregando = ref(true)
const erro = ref('')
const adminEmpresa = computed(() => ehAdmin(usuarioLogado.value) && !ehSuperAdmin(usuarioLogado.value))
const onboardingPercentual = computed(() => {
  const valor = Number(obterCampo(onboarding.value, 'percentualConclusao', 'percentualConcluido', 'percentual', 'progresso'))
  return Number.isFinite(valor) ? Math.max(0, Math.min(100, Math.round(valor))) : 0
})
const onboardingConcluido = computed(() =>
  Boolean(obterCampo(onboarding.value, 'onboardingConcluido', 'concluido', 'finalizado')) || onboardingPercentual.value >= 100,
)
const mostrarCardOnboarding = computed(() => adminEmpresa.value && onboarding.value && !onboardingConcluido.value)
const statusFinanceiroNormalizado = computed(() =>
  String(obterCampo(statusFinanceiro.value, 'statusFinanceiro', 'status', 'situacao') || 'ADIMPLENTE')
    .trim()
    .toUpperCase(),
)
const cardFinanceiro = computed(() => {
  if (!adminEmpresa.value) return null
  const status = statusFinanceiroNormalizado.value
  if (status === 'BLOQUEADA_FINANCEIRO') {
    return {
      classe: 'bloqueado',
      titulo: 'Empresa bloqueada por pendência financeira.',
      texto: 'Regularize as faturas para retomar as ações operacionais.',
    }
  }
  if (status === 'EM_ATRASO') {
    return {
      classe: 'atraso',
      titulo: 'Existem faturas em atraso.',
      texto: 'Regularize para evitar bloqueio.',
    }
  }
  return {
    classe: 'adimplente',
    titulo: 'Sua empresa está em dia.',
    texto: 'Não há pendências financeiras no momento.',
  }
})
const empresaSemDados = computed(
  () => !carregando.value && !clientes.value.length && !servicos.value.length && !funcionarios.value.length && !agendamentos.value.length,
)

const cardsResumo = computed(() => [
  {
    titulo: 'Agendamentos hoje',
    valor: agendamentosHoje.value.length,
    destaque: 'hoje',
  },
  {
    titulo: 'Concluidos hoje',
    valor: contarPorStatus('concluido', agendamentosHoje.value),
    destaque: 'concluido',
  },
  {
    titulo: 'Receita concluida hoje',
    valor: formatarMoeda(receitaPorStatus('concluido', agendamentosHoje.value)),
    destaque: 'receita',
  },
  {
    titulo: 'Agendamentos da semana',
    valor: agendamentosSemana.value.length,
    destaque: 'agenda',
  },
  {
    titulo: 'Receita prevista da semana',
    valor: formatarMoeda(receitaPorStatus('agendado', agendamentosSemana.value)),
    destaque: 'receita-prevista',
  },
  {
    titulo: 'Receita concluida da semana',
    valor: formatarMoeda(receitaPorStatus('concluido', agendamentosSemana.value)),
    destaque: 'receita',
  },
  {
    titulo: 'Total agendado',
    valor: contarPorStatus('agendado'),
    destaque: 'agendado',
  },
  {
    titulo: 'Total concluido',
    valor: contarPorStatus('concluido'),
    destaque: 'concluido',
  },
  {
    titulo: 'Total cancelado',
    valor: contarPorStatus('cancelado'),
    destaque: 'cancelado',
  },
  {
    titulo: 'Total faltou',
    valor: contarPorStatus('faltou'),
    destaque: 'faltou',
  },
  {
    titulo: 'Receita prevista',
    valor: formatarMoeda(receitaPorStatus('agendado')),
    destaque: 'receita',
  },
  {
    titulo: 'Receita concluida',
    valor: formatarMoeda(receitaPorStatus('concluido')),
    destaque: 'receita',
  },
])

const cardsBase = computed(() => [
  {
    titulo: 'Clientes',
    valor: clientes.value.length,
  },
  {
    titulo: 'Serviços',
    valor: servicos.value.length,
  },
  {
    titulo: 'Funcionários',
    valor: funcionarios.value.length,
  },
  {
    titulo: 'Agendamentos',
    valor: agendamentos.value.length,
  },
])

const agendamentosHoje = computed(() => {
  return agendamentos.value.filter((agendamento) => mesmaDataHoje(agendamento.dataHoraInicio))
})

const agendamentosSemana = computed(() => {
  const inicioSemana = obterInicioSemanaAtual()
  const fimSemana = obterFimSemanaAtual()

  return agendamentos.value.filter((agendamento) => {
    const dataInicio = criarData(agendamento.dataHoraInicio)

    return dataInicio && dataInicio >= inicioSemana && dataInicio <= fimSemana
  })
})

const proximosAgendamentos = computed(() => {
  const agora = new Date()

  return agendamentos.value
    .filter((agendamento) => {
      if (!agendamento.dataHoraInicio) {
        return false
      }

      return agendamento.status === 'agendado' && new Date(agendamento.dataHoraInicio) >= agora
    })
    .sort((a, b) => new Date(a.dataHoraInicio) - new Date(b.dataHoraInicio))
    .slice(0, 5)
})

const resumoPorFuncionario = computed(() => {
  const resumo = new Map()

  agendamentos.value.forEach((agendamento) => {
    const funcionario = agendamento.funcionario || 'Sem funcionário'
    const item = resumo.get(funcionario) || {
      funcionario,
      quantidade: 0,
      concluidos: 0,
      receitaConcluida: 0,
    }

    item.quantidade += 1

    if (agendamento.status === 'concluido') {
      item.concluidos += 1
      item.receitaConcluida += obterPreco(agendamento.preco)
    }

    resumo.set(funcionario, item)
  })

  return [...resumo.values()].sort((funcionarioA, funcionarioB) =>
    funcionarioA.funcionario.localeCompare(funcionarioB.funcionario, 'pt-BR'),
  )
})

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    const [agendamentosApi, clientesApi, servicosApi, funcionariosApi] = await Promise.all([
      buscarAgendamentos(),
      buscarClientes(),
      buscarServicos(),
      buscarFuncionarios(),
    ])

    agendamentos.value = agendamentosApi
    clientes.value = clientesApi
    servicos.value = servicosApi
    funcionarios.value = funcionariosApi
  } catch (error) {
    erro.value = 'Não foi possível carregar os dados do dashboard.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarOnboardingDashboard() {
  if (!adminEmpresa.value) return

  try {
    onboarding.value = normalizarObjeto(await buscarOnboarding())
  } catch (error) {
    onboarding.value = null
    console.error(error)
  }
}

async function carregarStatusFinanceiroDashboard() {
  if (!adminEmpresa.value) return

  try {
    statusFinanceiro.value = normalizarObjeto(await buscarStatusFinanceiroMinhaEmpresa())
  } catch (error) {
    statusFinanceiro.value = null
    console.error(error)
  }
}

function contarPorStatus(status, lista = agendamentos.value) {
  return lista.filter((agendamento) => agendamento.status === status).length
}

function receitaPorStatus(status, lista = agendamentos.value) {
  return lista
    .filter((agendamento) => agendamento.status === status)
    .reduce((total, agendamento) => total + obterPreco(agendamento.preco), 0)
}

function obterPreco(preco) {
  const valor = Number(preco)

  return Number.isFinite(valor) ? valor : 0
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function mesmaDataHoje(dataHora) {
  const data = criarData(dataHora)

  if (!data) {
    return false
  }

  const hoje = new Date()

  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  )
}

function criarData(dataHora) {
  if (!dataHora) {
    return null
  }

  const data = new Date(dataHora)

  if (Number.isNaN(data.getTime())) {
    return null
  }

  return data
}

function obterInicioSemanaAtual() {
  const hoje = new Date()
  const diaSemana = hoje.getDay()
  const distanciaSegunda = diaSemana === 0 ? -6 : 1 - diaSemana
  const inicioSemana = new Date(hoje)

  inicioSemana.setDate(hoje.getDate() + distanciaSegunda)
  inicioSemana.setHours(0, 0, 0, 0)

  return inicioSemana
}

function obterFimSemanaAtual() {
  const fimSemana = new Date(obterInicioSemanaAtual())

  fimSemana.setDate(fimSemana.getDate() + 6)
  fimSemana.setHours(23, 59, 59, 999)

  return fimSemana
}

function formatarData(dataHora) {
  const data = criarData(dataHora)

  if (!data) {
    return '-'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarHorario(dataHora) {
  const data = criarData(dataHora)

  if (!data) {
    return '-'
  }

  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarPeriodo(agendamento) {
  const inicio = formatarHorario(agendamento.dataHoraInicio)
  const fim = formatarHorario(agendamento.dataHoraFim)

  if (fim === '-') {
    return inicio
  }

  return `${inicio} às ${fim}`
}

function exibirValor(valor) {
  return valor || '-'
}

function statusClasse(status) {
  if (status === 'concluido') {
    return 'status concluido'
  }

  if (status === 'cancelado') {
    return 'status cancelado'
  }

  if (status === 'faltou') {
    return 'status faltou'
  }

  return 'status agendado'
}

function statusTexto(status) {
  const statusFormatados = {
    agendado: 'Agendado',
    concluido: 'Concluído',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  }

  return statusFormatados[status] || status || '-'
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch (error) {
    console.error(error)
    return null
  }
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  if (dados.data && !Array.isArray(dados.data) && typeof dados.data === 'object') return dados.data
  return dados
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''
  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') return item[campo]
  }
  return ''
}

onMounted(() => {
  carregarDados()
  carregarOnboardingDashboard()
  carregarStatusFinanceiroDashboard()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Visão geral</p>
        <h1>Dashboard</h1>
        <p class="descricao">Acompanhe os principais números da operação.</p>
      </div>

      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="cardFinanceiro" :class="['card', 'financeiro-card', cardFinanceiro.classe]">
      <div>
        <p class="subtitulo">Status financeiro</p>
        <h2>{{ cardFinanceiro.titulo }}</h2>
        <p>{{ cardFinanceiro.texto }}</p>
        <dl v-if="statusFinanceiroNormalizado !== 'ADIMPLENTE'">
          <div>
            <dt>Valor vencido</dt>
            <dd>{{ formatarMoeda(obterCampo(statusFinanceiro, 'valorVencido', 'valorTotalVencido')) }}</dd>
          </div>
          <div>
            <dt>Maior atraso</dt>
            <dd>{{ obterCampo(statusFinanceiro, 'diasMaiorAtraso', 'maiorAtrasoDias', 'diasAtraso') || 0 }} dia(s)</dd>
          </div>
        </dl>
      </div>
      <RouterLink v-if="statusFinanceiroNormalizado !== 'ADIMPLENTE'" class="botao principal link-botao" to="/faturas">
        Ver faturas
      </RouterLink>
    </section>

    <section v-if="mostrarCardOnboarding" class="card onboarding-card">
      <div>
        <p class="subtitulo">Configure sua empresa</p>
        <h2>Seu onboarding está {{ onboardingPercentual }}% concluído.</h2>
        <p>Finalize os primeiros passos para começar a receber agendamentos com mais segurança.</p>
      </div>
      <RouterLink class="botao principal link-botao" to="/onboarding">Continuar configuração</RouterLink>
    </section>

    <section v-if="empresaSemDados" class="card estado-vazio">
      <p>Sua empresa ainda não possui dados cadastrados. Comece configurando seus serviços e funcionários.</p>
    </section>

    <section class="grade-resumo">
      <article
        v-for="card in cardsResumo"
        :key="card.titulo"
        :class="['card', 'resumo-card', card.destaque]"
      >
        <p>{{ card.titulo }}</p>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="grade-base">
      <article v-for="card in cardsBase" :key="card.titulo" class="card base-card">
        <p>{{ card.titulo }}</p>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="secao-proximos">
      <div class="cabecalho-lista">
        <div>
          <h2>Próximos agendamentos</h2>
          <p>Os 5 próximos horários ordenados por data e hora.</p>
        </div>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando dashboard...</p>
      </section>

      <section v-else-if="proximosAgendamentos.length === 0" class="card">
        <p>Nenhum próximo agendamento em aberto. A agenda está tranquila por enquanto.</p>
      </section>

      <section v-else class="lista-proximos">
        <article
          v-for="agendamento in proximosAgendamentos"
          :key="agendamento.id"
          class="card agendamento-card"
        >
          <div class="topo-card">
            <div>
              <h3>{{ exibirValor(agendamento.cliente) }}</h3>
              <p class="servico">{{ exibirValor(agendamento.servico) }}</p>
            </div>

            <span :class="statusClasse(agendamento.status)">
              {{ agendamento.status }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>Funcionário:</strong> {{ exibirValor(agendamento.funcionario) }}</p>
            <p><strong>Data:</strong> {{ formatarData(agendamento.dataHoraInicio) }}</p>
            <p><strong>Horário:</strong> {{ formatarPeriodo(agendamento) }}</p>
            <p><strong>Preço:</strong> {{ formatarMoeda(agendamento.preco) }}</p>
            <p><strong>Status:</strong> {{ statusTexto(agendamento.status) }}</p>
          </div>
        </article>
      </section>
    </section>

    <section class="secao-resumo-funcionarios">
      <div class="cabecalho-lista">
        <div>
          <h2>Resumo por funcionário</h2>
          <p>Quantidade de agendamentos, concluídos e receita concluída por profissional.</p>
        </div>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando resumo por funcionário...</p>
      </section>

      <section v-else-if="resumoPorFuncionario.length === 0" class="card">
        <p>Nenhum agendamento encontrado para montar o resumo por funcionário.</p>
      </section>

      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Funcionário</th>
                <th>Agendamentos</th>
                <th>Concluídos</th>
                <th>Receita concluída</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in resumoPorFuncionario" :key="item.funcionario">
                <td>{{ item.funcionario }}</td>
                <td>{{ item.quantidade }}</td>
                <td>{{ item.concluidos }}</td>
                <td>{{ formatarMoeda(item.receitaConcluida) }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topo-card {
  align-items: flex-start;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.descricao,
.cabecalho-lista p {
  margin: 6px 0 0;
  color: #64748b;
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(4, minmax(160px, 1fr));
  gap: 18px;
}

.grade-base {
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 14px;
}

.secao-proximos,
.secao-resumo-funcionarios {
  display: grid;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.onboarding-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-left: 5px solid #2563eb;
}

.financeiro-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  border-left: 5px solid #16a34a;
}

.financeiro-card.atraso {
  border-left-color: #d97706;
}

.financeiro-card.bloqueado {
  border-left-color: #dc2626;
}

.financeiro-card h2 {
  margin: 0;
  font-size: 24px;
}

.financeiro-card dl {
  display: flex;
  gap: 18px;
  flex-wrap: wrap;
  margin: 12px 0 0;
}

.financeiro-card dt,
.financeiro-card dd {
  margin: 0;
}

.financeiro-card dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.financeiro-card dd {
  margin-top: 3px;
  font-weight: 800;
}

.onboarding-card h2 {
  margin: 0;
  font-size: 24px;
}

.onboarding-card p:last-child,
.estado-vazio p {
  margin: 6px 0 0;
  color: #64748b;
}

.resumo-card {
  display: grid;
  gap: 8px;
  border-left: 5px solid #2563eb;
}

.resumo-card p {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.resumo-card strong {
  color: #111827;
  font-size: 30px;
  font-weight: 800;
}

.resumo-card.hoje {
  border-left-color: #2563eb;
}

.resumo-card.agenda {
  border-left-color: #0f172a;
}

.resumo-card.agendado {
  border-left-color: #1d4ed8;
}

.resumo-card.concluido,
.resumo-card.receita {
  border-left-color: #16a34a;
}

.resumo-card.receita-prevista {
  border-left-color: #0f766e;
}

.resumo-card.cancelado {
  border-left-color: #dc2626;
}

.resumo-card.faltou {
  border-left-color: #d97706;
}

.base-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  padding: 16px 18px;
}

.base-card p {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.base-card strong {
  color: #111827;
  font-size: 22px;
  font-weight: 800;
}

.lista-proximos {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.agendamento-card {
  display: grid;
  gap: 14px;
}

.agendamento-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.servico {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
}

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.agendado {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.concluido {
  background: #dcfce7;
  color: #15803d;
}

.status.cancelado {
  background: #fee2e2;
  color: #b91c1c;
}

.status.faltou {
  background: #fef3c7;
  color: #92400e;
}

.tabela-card {
  padding: 0;
  overflow: hidden;
}

.tabela-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 640px;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  text-align: left;
  color: #374151;
}

th {
  background: #f8fafc;
  color: #111827;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

tbody tr:last-child td {
  border-bottom: none;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.principal {
  background: #2563eb;
}

.link-botao {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.secundario:hover {
  background: #1e293b;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

@media (max-width: 1100px) {
  .grade-resumo,
  .grade-base {
    grid-template-columns: repeat(2, minmax(160px, 1fr));
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .onboarding-card,
  .financeiro-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .grade-resumo,
  .grade-base,
  .lista-proximos {
    grid-template-columns: 1fr;
  }
}
</style>
