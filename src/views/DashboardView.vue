<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarAgendamentos,
  buscarClientes,
  buscarFuncionarios,
  buscarServicos,
} from '@/services/api'

const agendamentos = ref([])
const clientes = ref([])
const servicos = ref([])
const funcionarios = ref([])

const carregando = ref(true)
const erro = ref('')

const cardsResumo = computed(() => [
  {
    titulo: 'Agendamentos de hoje',
    valor: agendamentosHoje.value.length,
    destaque: 'hoje',
  },
  {
    titulo: 'Proximos agendamentos',
    valor: proximosAgendamentos.value.length,
    destaque: 'agenda',
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
    titulo: 'Servicos',
    valor: servicos.value.length,
  },
  {
    titulo: 'Funcionarios',
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
    erro.value = 'Nao foi possivel carregar os dados do dashboard.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function contarPorStatus(status) {
  return agendamentos.value.filter((agendamento) => agendamento.status === status).length
}

function receitaPorStatus(status) {
  return agendamentos.value
    .filter((agendamento) => agendamento.status === status)
    .reduce((total, agendamento) => total + Number(agendamento.preco || 0), 0)
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function mesmaDataHoje(dataHora) {
  if (!dataHora) {
    return false
  }

  const data = new Date(dataHora)
  const hoje = new Date()

  return (
    data.getFullYear() === hoje.getFullYear() &&
    data.getMonth() === hoje.getMonth() &&
    data.getDate() === hoje.getDate()
  )
}

function formatarDataHora(dataHora) {
  if (!dataHora) {
    return '-'
  }

  return new Date(dataHora).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
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

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Visao geral</p>
        <h1>Dashboard</h1>
        <p class="descricao">Acompanhe os principais numeros da operacao.</p>
      </div>

      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
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
          <h2>Proximos agendamentos</h2>
          <p>Os 5 proximos horarios ordenados por data e hora.</p>
        </div>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando dashboard...</p>
      </section>

      <section v-else-if="proximosAgendamentos.length === 0" class="card">
        <p>Nenhum proximo agendamento em aberto. A agenda esta tranquila por enquanto.</p>
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
            <p><strong>Funcionario:</strong> {{ exibirValor(agendamento.funcionario) }}</p>
            <p><strong>Data/Hora:</strong> {{ formatarDataHora(agendamento.dataHoraInicio) }}</p>
            <p><strong>Preco:</strong> {{ formatarMoeda(agendamento.preco) }}</p>
          </div>
        </article>
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

.secao-proximos {
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
  .cabecalho-lista {
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
