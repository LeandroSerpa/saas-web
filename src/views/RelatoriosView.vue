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
  const totalConcluido = contarPorStatus('concluido')
  const totalCancelado = contarPorStatus('cancelado')
  const totalFaltou = contarPorStatus('faltou')
  const receitaPrevista = agendamentosFiltrados.value.reduce((total, agendamento) => total + obterPreco(agendamento.preco), 0)
  const receitaConcluida = somarPorStatus('concluido')

  return [
    { titulo: 'Total de agendamentos', valor: agendamentosFiltrados.value.length },
    { titulo: 'Total concluÃ­do', valor: totalConcluido },
    { titulo: 'Total cancelado', valor: totalCancelado },
    { titulo: 'Total faltou', valor: totalFaltou },
    { titulo: 'Receita prevista', valor: formatarPreco(receitaPrevista) },
    { titulo: 'Receita concluÃ­da', valor: formatarPreco(receitaConcluida) },
    {
      titulo: 'Ticket mÃ©dio',
      valor: formatarPreco(totalConcluido ? receitaConcluida / totalConcluido : 0),
    },
  ]
})
const graficos = computed(() => [
  { titulo: 'Agendamentos por status', itens: agruparContagem(agendamentosFiltrados.value, (a) => statusTexto(a.status)) },
  { titulo: 'Receita por status', itens: agruparSoma(agendamentosFiltrados.value, (a) => statusTexto(a.status), (a) => obterPreco(a.preco)), dinheiro: true },
  { titulo: 'Agendamentos por serviÃ§o', itens: agruparContagem(agendamentosFiltrados.value, (a) => a.servico || 'Sem serviÃ§o') },
  { titulo: 'Agendamentos por funcionÃ¡rio', itens: agruparContagem(agendamentosFiltrados.value, (a) => a.funcionario || 'Sem funcionÃ¡rio') },
  { titulo: 'Agendamentos por dia', itens: agruparContagem(agendamentosFiltrados.value, (a) => formatarData(a.dataHoraInicio)) },
])

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

function formatarPeriodo(agendamento) {
  const inicio = formatarHorario(agendamento.dataHoraInicio)
  const fim = formatarHorario(agendamento.dataHoraFim)

  if (inicio === '-' && fim === '-') {
    return '-'
  }

  if (fim === '-') {
    return inicio
  }

  return `${inicio} as ${fim}`
}

function formatarPreco(preco) {
  return obterPreco(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarPercentual(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'percent',
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })
}

function agruparContagem(lista, obterChave) {
  const mapa = new Map()

  lista.forEach((item) => {
    const chave = obterChave(item)
    mapa.set(chave, (mapa.get(chave) || 0) + 1)
  })

  return normalizarGrafico(mapa)
}

function agruparSoma(lista, obterChave, obterValor) {
  const mapa = new Map()

  lista.forEach((item) => {
    const chave = obterChave(item)
    mapa.set(chave, (mapa.get(chave) || 0) + obterValor(item))
  })

  return normalizarGrafico(mapa)
}

function normalizarGrafico(mapa) {
  const maior = Math.max(...mapa.values(), 0)

  return [...mapa.entries()]
    .map(([nome, valor]) => ({
      nome,
      valor,
      percentual: maior ? Math.max(4, (valor / maior) * 100) : 0,
    }))
    .sort((a, b) => b.valor - a.valor)
}

function statusTexto(status) {
  const statusFormatados = {
    agendado: 'Agendado',
    concluido: 'ConcluÃ­do',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  }

  return statusFormatados[status] || status || '-'
}

function baixarCsv() {
  const cabecalho = ['Data', 'Horario', 'Cliente', 'Servico', 'Funcionario', 'Status', 'Valor']
  const linhas = agendamentosFiltrados.value.map((agendamento) => [
    formatarData(agendamento.dataHoraInicio),
    formatarPeriodo(agendamento),
    agendamento.cliente || '',
    agendamento.servico || '',
    agendamento.funcionario || '',
    statusTexto(agendamento.status),
    obterPreco(agendamento.preco),
  ])
  const csv = [cabecalho, ...linhas]
    .map((linha) => linha.map((valor) => `"${String(valor).replaceAll('"', '""')}"`).join(';'))
    .join('\n')

  baixarArquivo('relatorio-agendamentos.csv', `\uFEFF${csv}`, 'text/csv;charset=utf-8')
}

function baixarJson() {
  const dados = {
    filtros: filtros.value,
    indicadores: indicadores.value,
    agendamentos: agendamentosFiltrados.value,
  }

  baixarArquivo('relatorio-agendamentos.json', JSON.stringify(dados, null, 2), 'application/json')
}

function imprimirRelatorio() {
  window.print()
}

function baixarArquivo(nome, conteudo, tipo) {
  const blob = new Blob([conteudo], { type: tipo })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.downaoad = nome
  link.click()
  URL.revokeObjectURL(url)
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
        <h1>RelatÃ³rios</h1>
        <p class="descricao">Acompanhe indicadores financeiros e operacaonais por perÃ­odo.</p>
      </div>

      <div class="acoes-topo">
        <button class="botao secundario" @click="carregarAgendamentos">Atualizar dados</button>
        <button class="botao principal" :disabled="!agendamentosFiltrados.length" @click="baixarCsv">Baixar CSV</button>
        <button class="botao principal" :disabled="!agendamentosFiltrados.length" @click="baixarJson">Baixar JSON</button>
        <button class="botao secundario" @click="imprimirRelatorio">Imprimir/PDF</button>
      </div>
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
            <option value="concluido">ConcluÃ­do</option>
            <option value="cancelado">Cancelado</option>
            <option value="faltou">Faltou</option>
          </select>
        </label>

        <label>
          FuncionÃ¡rio
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
          ServiÃ§o
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

    <section v-if="!carregando && agendamentosFiltrados.length" class="grade-graficos">
      <article v-for="grafico in graficos" :key="grafico.titulo" class="card grafico-card">
        <h2>{{ grafico.titulo }}</h2>
        <div class="barras">
          <div v-for="item in grafico.itens" :key="item.nome" class="barra-linha">
            <div class="barra-inao">
              <span>{{ item.nome }}</span>
              <strong>{{ grafico.dinheiro ? formatarPreco(item.valor) : item.valor }}</strong>
            </div>
            <div class="barra-funao">
              <span :style="{ width: `${item.percentual}%` }"></span>
            </div>
          </div>
        </div>
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
        <p>Carregando relatÃ³rios...</p>
      </section>

      <section v-else-if="agendamentosFiltrados.length === 0" class="card">
        <p>Nenhum dado enaontrado para os filtros informados.</p>
      </section>

      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>HorÃ¡rio</th>
                <th>Cliente</th>
                <th>ServiÃ§o</th>
                <th>FuncionÃ¡rio</th>
                <th>Status</th>
                <th>Valor</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="agendamento in agendamentosFiltrados" :key="agendamento.id">
                <td>{{ formatarData(agendamento.dataHoraInicio) }}</td>
                <td>{{ formatarPeriodo(agendamento) }}</td>
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
.cabecalho-lista,
.acoes-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
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

.grade-graficos {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.grafico-card {
  display: grid;
  gap: 16px;
}

.grafico-card h2 {
  margin: 0;
  font-size: 22px;
  font-weight: 800;
}

.barras {
  display: grid;
  gap: 13px;
}

.barra-linha {
  display: grid;
  gap: 7px;
}

.barra-inao {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  color: #334155;
  font-weight: 800;
}

.barra-funao {
  height: 12px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 999px;
}

.barra-funao span {
  display: block;
  height: 100%;
  background: #2563eb;
  border-radius: 999px;
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
  min-width: 900px;
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

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.55;
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

  .grade-graficos {
    grid-template-columns: 1fr;
  }
}

@media print {
  .barra-lateral,
  .topo-app,
  .filtros-relatorios,
  .acoes-topo {
    display: none !important;
  }
}
</style>

