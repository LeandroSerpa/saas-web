<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarAgendamentos } from '@/services/api'

const agendamentos = ref([])
const carregando = ref(true)
const erro = ref('')
const filtros = ref({
  dataInicial: '',
  dataFinal: '',
  status: '',
  funcionario: '',
  servico: '',
})

const funcionariosDisponiveis = computed(() =>
  criarOpcoesUnicas(agendamentos.value.map((agendamento) => agendamento.funcionario)),
)
const servicosDisponiveis = computed(() =>
  criarOpcoesUnicas(agendamentos.value.map((agendamento) => agendamento.servico)),
)
const agendamentosFiltrados = computed(() => {
  return agendamentos.value
    .filter((agendamento) => {
      const dataInicio = criarData(agendamento.dataHoraInicio)

      if (filtros.value.dataInicial) {
        const dataInicial = new Date(`${filtros.value.dataInicial}T00:00:00`)

        if (!dataInicio || dataInicio < dataInicial) {
          return false
        }
      }

      if (filtros.value.dataFinal) {
        const dataFinal = new Date(`${filtros.value.dataFinal}T23:59:59`)

        if (!dataInicio || dataInicio > dataFinal) {
          return false
        }
      }

      if (filtros.value.status && agendamento.status !== filtros.value.status) {
        return false
      }

      if (filtros.value.funcionario && agendamento.funcionario !== filtros.value.funcionario) {
        return false
      }

      if (filtros.value.servico && agendamento.servico !== filtros.value.servico) {
        return false
      }

      return true
    })
    .sort((agendamentoA, agendamentoB) => {
      const dataA = criarData(agendamentoA.dataHoraInicio)?.getTime() || 0
      const dataB = criarData(agendamentoB.dataHoraInicio)?.getTime() || 0

      return dataB - dataA
    })
})
const indicadores = computed(() => {
  const totalAgendado = contarPorStatus('agendado')
  const totalConcluido = contarPorStatus('concluido')
  const receitaPrevista = somarPorStatus('agendado')
  const receitaConcluida = somarPorStatus('concluido')

  return [
    { titulo: 'Total de agendamentos', valor: agendamentosFiltrados.value.length },
    { titulo: 'Total agendado', valor: totalAgendado },
    { titulo: 'Total concluido', valor: totalConcluido },
    { titulo: 'Total cancelado', valor: contarPorStatus('cancelado') },
    { titulo: 'Total faltou', valor: contarPorStatus('faltou') },
    { titulo: 'Receita prevista', valor: formatarPreco(receitaPrevista) },
    { titulo: 'Receita concluida', valor: formatarPreco(receitaConcluida) },
    {
      titulo: 'Ticket medio concluido',
      valor: formatarPreco(totalConcluido ? receitaConcluida / totalConcluido : 0),
    },
  ]
})

async function carregarAgendamentos() {
  try {
    carregando.value = true
    erro.value = ''

    agendamentos.value = await buscarAgendamentos()
  } catch (error) {
    erro.value = 'Nao foi possivel carregar os relatorios.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function contarPorStatus(status) {
  return agendamentosFiltrados.value.filter((agendamento) => agendamento.status === status).length
}

function somarPorStatus(status) {
  return agendamentosFiltrados.value
    .filter((agendamento) => agendamento.status === status)
    .reduce((total, agendamento) => total + obterPreco(agendamento.preco), 0)
}

function obterPreco(preco) {
  const valor = Number(preco)

  return Number.isFinite(valor) ? valor : 0
}

function criarOpcoesUnicas(valores) {
  return [...new Set(valores.filter(Boolean))].sort((valorA, valorB) =>
    String(valorA).localeCompare(String(valorB), 'pt-BR'),
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

function formatarPreco(preco) {
  return obterPreco(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function statusTexto(status) {
  const statusFormatados = {
    agendado: 'Agendado',
    concluido: 'Concluido',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  }

  return statusFormatados[status] || status || '-'
}

function limparFiltros() {
  filtros.value = {
    dataInicial: '',
    dataFinal: '',
    status: '',
    funcionario: '',
    servico: '',
  }
}

onMounted(() => {
  carregarAgendamentos()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Indicadores</p>
        <h1>Relatorios</h1>
        <p class="descricao">Acompanhe indicadores financeiros e operacionais por periodo.</p>
      </div>

      <button class="botao secundario" @click="carregarAgendamentos">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section class="card filtros-relatorios">
      <div class="titulo-card">
        <h2>Filtros</h2>
        <p>Refine os dados usados nos indicadores e na listagem.</p>
      </div>

      <div class="campos-filtros">
        <label>
          Data inicial
          <input v-model="filtros.dataInicial" type="date" />
        </label>

        <label>
          Data final
          <input v-model="filtros.dataFinal" type="date" />
        </label>

        <label>
          Status
          <select v-model="filtros.status">
            <option value="">Todos</option>
            <option value="agendado">Agendado</option>
            <option value="concluido">Concluido</option>
            <option value="cancelado">Cancelado</option>
            <option value="faltou">Faltou</option>
          </select>
        </label>

        <label>
          Funcionario
          <select v-model="filtros.funcionario">
            <option value="">Todos</option>
            <option
              v-for="funcionario in funcionariosDisponiveis"
              :key="funcionario"
              :value="funcionario"
            >
              {{ funcionario }}
            </option>
          </select>
        </label>

        <label>
          Servico
          <select v-model="filtros.servico">
            <option value="">Todos</option>
            <option v-for="servico in servicosDisponiveis" :key="servico" :value="servico">
              {{ servico }}
            </option>
          </select>
        </label>

        <div class="acoes-filtros">
          <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
        </div>
      </div>
    </section>

    <section class="grade-indicadores">
      <article v-for="indicador in indicadores" :key="indicador.titulo" class="card indicador">
        <span>{{ indicador.titulo }}</span>
        <strong>{{ indicador.valor }}</strong>
      </article>
    </section>

    <section class="secao-lista">
      <div class="cabecalho-lista">
        <div>
          <h2>Agendamentos filtrados</h2>
          <p>Lista usada para calcular os indicadores acima.</p>
        </div>

        <span class="contador">{{ agendamentosFiltrados.length }} agendamento(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando relatorios...</p>
      </section>

      <section v-else-if="agendamentosFiltrados.length === 0" class="card">
        <p>Nenhum agendamento encontrado para os filtros selecionados.</p>
      </section>

      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Horario</th>
                <th>Cliente</th>
                <th>Servico</th>
                <th>Funcionario</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agendamento in agendamentosFiltrados" :key="agendamento.id">
                <td>{{ formatarData(agendamento.dataHoraInicio) }}</td>
                <td>{{ formatarHorario(agendamento.dataHoraInicio) }}</td>
                <td>{{ agendamento.cliente || '-' }}</td>
                <td>{{ agendamento.servico || '-' }}</td>
                <td>{{ agendamento.funcionario || '-' }}</td>
                <td>
                  <span :class="['status', agendamento.status || 'agendado']">
                    {{ statusTexto(agendamento.status) }}
                  </span>
                </td>
                <td>{{ formatarPreco(agendamento.preco) }}</td>
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
.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
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

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.filtros-relatorios,
.secao-lista {
  display: grid;
  gap: 16px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.campos-filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(180px, 1fr));
  gap: 16px;
  align-items: end;
}

.campos-filtros label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.campos-filtros input,
.campos-filtros select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

.campos-filtros input:focus,
.campos-filtros select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.acoes-filtros {
  display: flex;
  align-items: end;
}

.grade-indicadores {
  display: grid;
  grid-template-columns: repeat(4, minmax(180px, 1fr));
  gap: 16px;
}

.indicador {
  display: grid;
  gap: 8px;
}

.indicador span {
  color: #64748b;
  font-size: 14px;
  font-weight: 800;
}

.indicador strong {
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
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
  min-width: 840px;
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

.status {
  display: inline-flex;
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

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .grade-indicadores {
    grid-template-columns: 1fr;
  }
}
</style>
