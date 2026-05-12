<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  baixarRelatorioAgendamentosCsv,
  buscarEmpresas,
  buscarRelatorioAgendamentos,
  buscarRelatorioAgendamentosPorDia,
  buscarRelatorioClientesRecorrentes,
  buscarRelatorioFuncionarios,
  buscarRelatorioReceitaPorDia,
  buscarRelatorioResumo,
  buscarRelatorioServicos,
  buscarRelatorioStatus,
} from '@/services/api'
import { ehSuperAdmin } from '@/utils/permissoes'

const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'AGENDADO', rotulo: 'Agendado' },
  { valor: 'CONCLUIDO', rotulo: 'Concluído' },
  { valor: 'CANCELADO', rotulo: 'Cancelado' },
  { valor: 'FALTOU', rotulo: 'Faltou' },
]

const usuarioLogado = ref(obterUsuarioLogado())
const superAdmin = computed(() => ehSuperAdmin(usuarioLogado.value))
const filtros = ref(criarFiltrosMesAtual())
const empresas = ref([])
const resumo = ref({})
const agendamentosPorDia = ref([])
const receitaPorDia = ref([])
const rankingServicos = ref([])
const rankingFuncionarios = ref([])
const clientesRecorrentes = ref([])
const distribuicaoStatus = ref([])
const agendamentos = ref([])
const carregando = ref(true)
const exportando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')

const filtrosApi = computed(() => limparFiltrosVazios(filtros.value))

const opcoesFuncionarios = computed(() =>
  ordenarOpcoes(
    juntarOpcoes(
      rankingFuncionarios.value.map((item) => ({
        id: obterCampo(item, 'funcionarioId', 'id'),
        nome: obterCampo(item, 'funcionarioNome', 'nome', 'funcionario'),
      })),
      agendamentos.value.map((item) => ({
        id: obterCampo(item, 'funcionarioId'),
        nome: obterCampo(item, 'funcionarioNome', 'funcionario', 'nomeFuncionario'),
      })),
    ),
  ),
)

const opcoesServicos = computed(() =>
  ordenarOpcoes(
    juntarOpcoes(
      rankingServicos.value.map((item) => ({
        id: obterCampo(item, 'servicoId', 'id'),
        nome: obterCampo(item, 'servicoNome', 'nome', 'servico'),
      })),
      agendamentos.value.map((item) => ({
        id: obterCampo(item, 'servicoId'),
        nome: obterCampo(item, 'servicoNome', 'servico', 'nomeServico'),
      })),
    ),
  ),
)

const cardsPrincipais = computed(() => {
  const total = numeroResumo('totalAgendamentos', 'agendamentos', 'total')
  const concluidos = numeroResumo('totalConcluido', 'concluidos', 'totalConcluidos', 'agendamentosConcluidos')
  const cancelados = numeroResumo('totalCancelado', 'cancelados', 'totalCancelados', 'agendamentosCancelados')
  const faltas = numeroResumo('totalFaltou', 'faltas', 'faltou', 'totalFaltas')
  const receitaConcluida = numeroResumo('receitaConcluida', 'valorConcluido')
  const ticketMedio =
    numeroResumoOpcional('ticketMedioConcluido', 'ticketMedio') ??
    (concluidos ? receitaConcluida / concluidos : 0)
  const taxaConclusao =
    numeroResumoOpcional('taxaConclusao') ?? calcularPercentual(concluidos, total)
  const perdasCancelamentoFalta = numeroResumo(
    'perdasPorCancelamentoFalta',
    'perdasCancelamentoFalta',
    'perdas',
    'valorPerdido',
  )

  return [
    { titulo: 'Total de agendamentos', valor: formatarNumero(total), destaque: true },
    { titulo: 'Receita prevista', valor: formatarMoeda(numeroResumo('receitaPrevista', 'valorPrevisto')) },
    { titulo: 'Receita concluída', valor: formatarMoeda(receitaConcluida) },
    {
      titulo: 'Ticket médio',
      valor: formatarMoeda(ticketMedio),
    },
    {
      titulo: 'Taxa de conclusão',
      valor: formatarPercentual(taxaConclusao),
    },
    {
      titulo: 'Perdas por cancelamento/falta',
      valor: formatarMoeda(perdasCancelamentoFalta),
      alerta: cancelados + faltas > 0,
    },
  ]
})

const cardsSecundarios = computed(() => {
  const total = numeroResumo('totalAgendamentos', 'agendamentos', 'total')
  const agendados = numeroResumo('totalAgendado', 'agendados', 'totalAgendados')
  const concluidos = numeroResumo('totalConcluido', 'concluidos', 'totalConcluidos', 'agendamentosConcluidos')
  const cancelados = numeroResumo('totalCancelado', 'cancelados', 'totalCancelados', 'agendamentosCancelados')
  const faltas = numeroResumo('totalFaltou', 'faltas', 'faltou', 'totalFaltas')
  const taxaCancelamento =
    numeroResumoOpcional('taxaCancelamento') ?? calcularPercentual(cancelados, total)
  const taxaFalta = numeroResumoOpcional('taxaFalta') ?? calcularPercentual(faltas, total)

  return [
    { titulo: 'Agendados', valor: formatarNumero(agendados) },
    { titulo: 'Concluídos', valor: formatarNumero(concluidos) },
    { titulo: 'Cancelados', valor: formatarNumero(cancelados) },
    { titulo: 'Faltou', valor: formatarNumero(faltas) },
    { titulo: 'Taxa de cancelamento', valor: formatarPercentual(taxaCancelamento) },
    { titulo: 'Taxa de falta', valor: formatarPercentual(taxaFalta) },
  ]
})

const maiorAgendamentosDia = computed(() =>
  Math.max(...agendamentosPorDia.value.map((item) => numeroItem(item, 'total', 'quantidade')), 0),
)

const maiorReceitaDia = computed(() =>
  Math.max(
    ...receitaPorDia.value.map((item) =>
      Math.max(
        numeroItem(item, 'receitaPrevista', 'prevista'),
        numeroItem(item, 'receitaConcluida', 'concluida'),
        numeroItem(item, 'perdas', 'valorPerdido'),
      ),
    ),
    0,
  ),
)

const mostrarColunaEmpresa = computed(() => superAdmin.value && !filtros.value.empresaId)

async function carregarRelatorios() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const [
      resumoApi,
      agendamentosDiaApi,
      receitaDiaApi,
      servicosApi,
      funcionariosApi,
      clientesApi,
      statusApi,
      agendamentosApi,
    ] = await Promise.all([
      buscarRelatorioResumo(filtrosApi.value),
      buscarRelatorioAgendamentosPorDia(filtrosApi.value),
      buscarRelatorioReceitaPorDia(filtrosApi.value),
      buscarRelatorioServicos(filtrosApi.value),
      buscarRelatorioFuncionarios(filtrosApi.value),
      buscarRelatorioClientesRecorrentes(filtrosApi.value),
      buscarRelatorioStatus(filtrosApi.value),
      buscarRelatorioAgendamentos(filtrosApi.value),
    ])

    resumo.value = normalizarObjeto(resumoApi)
    agendamentosPorDia.value = normalizarLista(agendamentosDiaApi)
    receitaPorDia.value = normalizarLista(receitaDiaApi)
    rankingServicos.value = normalizarLista(servicosApi)
    rankingFuncionarios.value = normalizarLista(funcionariosApi)
    clientesRecorrentes.value = normalizarLista(clientesApi)
    distribuicaoStatus.value = normalizarLista(statusApi)
    agendamentos.value = normalizarLista(agendamentosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os relatórios. Verifique os filtros e tente novamente.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarEmpresasSeNecessario() {
  if (!superAdmin.value) {
    return
  }

  try {
    empresas.value = normalizarLista(await buscarEmpresas())
  } catch (error) {
    empresas.value = []
    console.error(error)
  }
}

function aplicarFiltros() {
  carregarRelatorios()
}

function limparFiltros() {
  filtros.value = criarFiltrosMesAtual()
  carregarRelatorios()
}

async function exportarCsv() {
  try {
    exportando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const nomeArquivo = await baixarRelatorioAgendamentosCsv(filtrosApi.value)
    mensagemSucesso.value = `Arquivo ${nomeArquivo} exportado com sucesso.`
  } catch (error) {
    erro.value = 'Não foi possível exportar o relatório. Tente novamente.'
    console.error(error)
  } finally {
    exportando.value = false
  }
}

function criarFiltrosMesAtual() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  return {
    dataInicio: formatarDataInput(new Date(ano, mes, 1)),
    dataFim: formatarDataInput(new Date(ano, mes + 1, 0)),
    status: '',
    funcionarioId: '',
    servicoId: '',
    busca: '',
    empresaId: '',
  }
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch (error) {
    console.error(error)
    return null
  }
}

function limparFiltrosVazios(origem) {
  return Object.fromEntries(
    Object.entries(origem || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') {
    return {}
  }

  if (dados.data && !Array.isArray(dados.data) && typeof dados.data === 'object') {
    return dados.data
  }

  if (dados.resultado && !Array.isArray(dados.resultado) && typeof dados.resultado === 'object') {
    return dados.resultado
  }

  return dados
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  if (Array.isArray(dados.content)) return dados.content
  if (Array.isArray(dados.data?.content)) return dados.data.content
  if (Array.isArray(dados.data)) return dados.data
  if (Array.isArray(dados.value)) return dados.value
  if (Array.isArray(dados.items)) return dados.items
  if (Array.isArray(dados.itens)) return dados.itens
  if (Array.isArray(dados.resultado)) return dados.resultado
  if (Array.isArray(dados.registros)) return dados.registros

  return []
}

function juntarOpcoes(...listas) {
  const mapa = new Map()

  listas.flat().forEach((item) => {
    const nome = String(item.nome || '').trim()

    if (!nome) return

    const chave = item.id ? `id:${item.id}` : `nome:${nome.toLowerCase()}`
    mapa.set(chave, { id: item.id || nome, nome })
  })

  return [...mapa.values()]
}

function ordenarOpcoes(lista) {
  return [...lista].sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))
}

function numeroResumo(...campos) {
  return numeroValor(obterCampo(resumo.value, ...campos))
}

function numeroResumoOpcional(...campos) {
  const valor = obterCampo(resumo.value, ...campos)

  if (valor === '') {
    return null
  }

  return numeroValor(valor)
}

function numeroItem(item, ...campos) {
  return numeroValor(obterCampo(item, ...campos))
}

function numeroValor(valor) {
  const numero = Number(valor)

  return Number.isFinite(numero) ? numero : 0
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') {
    return ''
  }

  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') {
      return item[campo]
    }
  }

  return ''
}

function calcularPercentual(parte, total) {
  return total ? (parte / total) * 100 : 0
}

function alturaBarra(valor, maior) {
  if (!maior) return 0

  return Math.max(8, (numeroValor(valor) / maior) * 100)
}

function formatarDataInput(data) {
  return data.toISOString().slice(0, 10)
}

function criarData(valor) {
  if (!valor) return null

  if (/^\d{4}-\d{2}-\d{2}$/.test(String(valor))) {
    const [ano, mes, dia] = String(valor).split('-').map(Number)
    return new Date(ano, mes - 1, dia)
  }

  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? null : data
}

function formatarData(valor) {
  const data = criarData(valor)
  return data ? data.toLocaleDateString('pt-BR') : '-'
}

function formatarHorario(valor) {
  const data = criarData(valor)

  if (!data) {
    return obterCampo({ valor }, 'valor') ? String(valor).slice(0, 5) : '-'
  }

  return data.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
}

function formatarMoeda(valor) {
  return numeroValor(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarNumero(valor) {
  return numeroValor(valor).toLocaleString('pt-BR')
}

function formatarPercentual(valor) {
  return `${numeroValor(valor).toLocaleString('pt-BR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 1,
  })}%`
}

function statusTexto(status) {
  const valor = String(status || '').toUpperCase()
  const item = STATUS.find((opcao) => opcao.valor === valor)

  return item?.rotulo || valor || '-'
}

function statusClasse(status) {
  return String(status || 'AGENDADO').toLowerCase()
}

function valorDataItem(item) {
  return obterCampo(item, 'data', 'dia', 'dataAgendamento', 'dataAtendimento')
}

function nomeServico(item) {
  return obterCampo(item, 'servicoNome', 'nome', 'servico') || 'Serviço não informado'
}

function nomeFuncionario(item) {
  return obterCampo(item, 'funcionarioNome', 'nome', 'funcionario') || 'Funcionário não informado'
}

function nomeCliente(item) {
  return obterCampo(item, 'clienteNome', 'cliente', 'nomeCliente') || 'Cliente não informado'
}

function obterMensagemErro(error, mensagemPadrao) {
  const mensagem = String(error?.message || '').trim()

  if (mensagem) {
    const mensagemNormalizada = mensagem.toLowerCase()

    if (mensagemNormalizada.includes('data')) {
      return 'Período inválido. Verifique a data inicial e a data final.'
    }

    return mensagem
  }

  return mensagemPadrao
}

onMounted(async () => {
  await carregarEmpresasSeNecessario()
  await carregarRelatorios()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">{{ superAdmin ? 'Visão administrativa SaaS' : 'Visão da sua empresa' }}</p>
        <h1>Relatórios</h1>
        <p class="descricao">Acompanhe o desempenho financeiro e operacional da empresa.</p>
      </div>

      <button class="botao secundario" :disabled="carregando" @click="carregarRelatorios">
        {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
      </button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section class="card filtros-relatorios">
      <div class="titulo-card">
        <h2>Filtros</h2>
        <p>Use o período e os filtros operacionais para refinar todos os indicadores.</p>
      </div>

      <div class="campos-filtros">
        <label>
          Data inicial
          <input v-model="filtros.dataInicio" type="date" />
        </label>

        <label>
          Data final
          <input v-model="filtros.dataFim" type="date" />
        </label>

        <label>
          Status
          <select v-model="filtros.status">
            <option v-for="status in STATUS" :key="status.valor" :value="status.valor">
              {{ status.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Funcionário
          <select v-model="filtros.funcionarioId">
            <option value="">Todos</option>
            <option v-for="funcionario in opcoesFuncionarios" :key="funcionario.id" :value="funcionario.id">
              {{ funcionario.nome }}
            </option>
          </select>
        </label>

        <label>
          Serviço
          <select v-model="filtros.servicoId">
            <option value="">Todos</option>
            <option v-for="servico in opcoesServicos" :key="servico.id" :value="servico.id">
              {{ servico.nome }}
            </option>
          </select>
        </label>

        <label>
          Cliente ou busca textual
          <input v-model="filtros.busca" type="text" placeholder="Nome, telefone, e-mail..." />
        </label>

        <label v-if="superAdmin && empresas.length">
          Empresa
          <select v-model="filtros.empresaId">
            <option value="">Todas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}
            </option>
          </select>
        </label>
      </div>

      <div class="acoes-filtros">
        <button class="botao principal" :disabled="carregando" @click="aplicarFiltros">
          Aplicar filtros
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
        <button class="botao sucesso-botao" :disabled="exportando || carregando" @click="exportarCsv">
          {{ exportando ? 'Exportando...' : 'Exportar CSV' }}
        </button>
      </div>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando relatórios do período...</p>
    </section>

    <template v-else>
      <section class="grade-indicadores principais">
        <article
          v-for="card in cardsPrincipais"
          :key="card.titulo"
          :class="['card', 'indicador', { destaque: card.destaque, alerta: card.alerta }]"
        >
          <span>{{ card.titulo }}</span>
          <strong>{{ card.valor }}</strong>
        </article>
      </section>

      <section class="grade-indicadores secundarios">
        <article v-for="card in cardsSecundarios" :key="card.titulo" class="card indicador secundario-card">
          <span>{{ card.titulo }}</span>
          <strong>{{ card.valor }}</strong>
        </article>
      </section>

      <section class="grade-graficos">
        <article class="card grafico-card">
          <div class="titulo-card">
            <h2>Agendamentos por dia</h2>
            <p>Total, concluídos, cancelados e faltas no período.</p>
          </div>

          <section v-if="!agendamentosPorDia.length" class="estado-vazio">
            Nenhum agendamento encontrado no período.
          </section>

          <div v-else class="grafico-barras">
            <div v-for="item in agendamentosPorDia" :key="valorDataItem(item)" class="barra-dia">
              <div class="coluna" :style="{ height: `${alturaBarra(numeroItem(item, 'total', 'quantidade'), maiorAgendamentosDia)}%` }"></div>
              <span>{{ formatarData(valorDataItem(item)).slice(0, 5) }}</span>
              <small>
                {{ numeroItem(item, 'total', 'quantidade') }} total |
                {{ numeroItem(item, 'concluidos', 'concluido') }} concl. |
                {{ numeroItem(item, 'cancelados', 'cancelado') }} canc. |
                {{ numeroItem(item, 'faltas', 'faltou') }} faltas
              </small>
            </div>
          </div>
        </article>

        <article class="card grafico-card">
          <div class="titulo-card">
            <h2>Receita por dia</h2>
            <p>Receita prevista, concluída e perdas.</p>
          </div>

          <section v-if="!receitaPorDia.length" class="estado-vazio">
            Nenhuma receita encontrada no período.
          </section>

          <div v-else class="lista-receita">
            <div v-for="item in receitaPorDia" :key="valorDataItem(item)" class="linha-receita">
              <div class="linha-topo">
                <strong>{{ formatarData(valorDataItem(item)) }}</strong>
                <span>{{ formatarMoeda(numeroItem(item, 'receitaConcluida', 'concluida')) }}</span>
              </div>
              <div class="trilhas">
                <span class="prevista" :style="{ width: `${alturaBarra(numeroItem(item, 'receitaPrevista', 'prevista'), maiorReceitaDia)}%` }"></span>
                <span class="concluida" :style="{ width: `${alturaBarra(numeroItem(item, 'receitaConcluida', 'concluida'), maiorReceitaDia)}%` }"></span>
                <span class="perdas" :style="{ width: `${alturaBarra(numeroItem(item, 'perdas', 'valorPerdido'), maiorReceitaDia)}%` }"></span>
              </div>
            </div>
          </div>
        </article>
      </section>

      <section class="grade-tabelas">
        <article class="card tabela-card">
          <h2>Ranking de serviços</h2>
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Serviço</th>
                  <th>Total</th>
                  <th>Concluídos</th>
                  <th>Receita concluída</th>
                  <th>Percentual</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!rankingServicos.length">
                  <td colspan="6">Nenhum serviço encontrado.</td>
                </tr>
                <tr v-for="(item, indice) in rankingServicos" :key="`${nomeServico(item)}-${indice}`">
                  <td>{{ indice + 1 }}</td>
                  <td>{{ nomeServico(item) }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'total', 'totalAgendamentos')) }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'concluidos', 'totalConcluidos')) }}</td>
                  <td>{{ formatarMoeda(numeroItem(item, 'receitaConcluida', 'valorConcluido')) }}</td>
                  <td>{{ formatarPercentual(numeroItem(item, 'percentual')) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card tabela-card">
          <h2>Ranking de funcionários</h2>
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Posição</th>
                  <th>Funcionário</th>
                  <th>Total</th>
                  <th>Concluídos</th>
                  <th>Receita concluída</th>
                  <th>Taxa de conclusão</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!rankingFuncionarios.length">
                  <td colspan="6">Nenhum funcionário encontrado.</td>
                </tr>
                <tr v-for="(item, indice) in rankingFuncionarios" :key="`${nomeFuncionario(item)}-${indice}`">
                  <td>{{ indice + 1 }}</td>
                  <td>{{ nomeFuncionario(item) }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'total', 'totalAgendamentos')) }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'concluidos', 'totalConcluidos')) }}</td>
                  <td>{{ formatarMoeda(numeroItem(item, 'receitaConcluida', 'valorConcluido')) }}</td>
                  <td>{{ formatarPercentual(numeroItem(item, 'taxaConclusao')) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>
      </section>

      <section class="grade-tabelas">
        <article class="card tabela-card">
          <h2>Clientes recorrentes</h2>
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th>Cliente</th>
                  <th>Telefone</th>
                  <th>E-mail</th>
                  <th>Total</th>
                  <th>Concluídos</th>
                  <th>Valor concluído</th>
                </tr>
              </thead>
              <tbody>
                <tr v-if="!clientesRecorrentes.length">
                  <td colspan="6">Nenhum cliente recorrente encontrado.</td>
                </tr>
                <tr v-for="(item, indice) in clientesRecorrentes" :key="`${nomeCliente(item)}-${indice}`">
                  <td>{{ nomeCliente(item) }}</td>
                  <td>{{ obterCampo(item, 'telefone', 'clienteTelefone') || '-' }}</td>
                  <td>{{ obterCampo(item, 'email', 'clienteEmail') || '-' }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'total', 'totalAgendamentos')) }}</td>
                  <td>{{ formatarNumero(numeroItem(item, 'concluidos', 'totalConcluidos')) }}</td>
                  <td>{{ formatarMoeda(numeroItem(item, 'valorConcluido', 'receitaConcluida')) }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </article>

        <article class="card status-card">
          <h2>Distribuição por status</h2>
          <div v-if="!distribuicaoStatus.length" class="estado-vazio">
            Nenhum status encontrado no período.
          </div>
          <div v-else class="status-grid">
            <div v-for="item in distribuicaoStatus" :key="obterCampo(item, 'status')" class="status-item">
              <span :class="['status', statusClasse(obterCampo(item, 'status'))]">
                {{ statusTexto(obterCampo(item, 'status')) }}
              </span>
              <strong>{{ formatarNumero(numeroItem(item, 'total', 'quantidade')) }}</strong>
              <small>{{ formatarPercentual(numeroItem(item, 'percentual')) }}</small>
            </div>
          </div>
        </article>
      </section>

      <section class="secao-lista">
        <div class="cabecalho-lista">
          <div>
            <h2>Tabela detalhada de agendamentos</h2>
            <p>Registros retornados pela API para os filtros aplicados.</p>
          </div>

          <span class="contador">{{ agendamentos.length }} agendamento(s)</span>
        </div>

        <section v-if="!agendamentos.length" class="card">
          <p>Nenhum dado encontrado para os filtros informados.</p>
        </section>

        <section v-else class="card tabela-card tabela-detalhada">
          <div class="tabela-container">
            <table>
              <thead>
                <tr>
                  <th v-if="mostrarColunaEmpresa">Empresa</th>
                  <th>Data</th>
                  <th>Horário</th>
                  <th>Cliente</th>
                  <th>Serviço</th>
                  <th>Funcionário</th>
                  <th>Status</th>
                  <th>Valor</th>
                  <th>Observação</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, indice) in agendamentos" :key="obterCampo(item, 'id') || indice">
                  <td v-if="mostrarColunaEmpresa">{{ obterCampo(item, 'empresaNome', 'empresa') || '-' }}</td>
                  <td>{{ formatarData(obterCampo(item, 'dataHoraInicio', 'inicio', 'dataAtendimento')) }}</td>
                  <td>{{ formatarHorario(obterCampo(item, 'dataHoraInicio', 'inicio', 'horario')) }}</td>
                  <td>{{ nomeCliente(item) }}</td>
                  <td>{{ nomeServico(item) }}</td>
                  <td>{{ nomeFuncionario(item) }}</td>
                  <td>
                    <span :class="['status', statusClasse(obterCampo(item, 'status'))]">
                      {{ statusTexto(obterCampo(item, 'status')) }}
                    </span>
                  </td>
                  <td>{{ formatarMoeda(obterCampo(item, 'valor', 'preco', 'receita')) }}</td>
                  <td>{{ obterCampo(item, 'observacao', 'obs') || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>
      </section>
    </template>
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
.acoes-filtros,
.linha-topo {
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
  font-weight: 800;
  text-transform: uppercase;
}

.cabecalho-pagina h1,
.cabecalho-lista h2,
.titulo-card h2,
.tabela-card h2,
.status-card h2 {
  margin: 0;
  color: #111827;
  font-weight: 800;
}

.cabecalho-pagina h1 {
  font-size: 32px;
}

.descricao,
.cabecalho-lista p,
.titulo-card p {
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
.secao-lista,
.grafico-card,
.status-card {
  display: grid;
  gap: 16px;
}

.campos-filtros {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(190px, 1fr));
  gap: 16px;
}

.campos-filtros label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
}

.campos-filtros input,
.campos-filtros select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  background: white;
  font-size: 15px;
  box-sizing: border-box;
}

.campos-filtros input:focus,
.campos-filtros select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.grade-indicadores,
.grade-graficos,
.grade-tabelas {
  display: grid;
  gap: 16px;
}

.grade-indicadores.principais {
  grid-template-columns: repeat(3, minmax(180px, 1fr));
}

.grade-indicadores.secundarios {
  grid-template-columns: repeat(6, minmax(130px, 1fr));
}

.grade-graficos,
.grade-tabelas {
  grid-template-columns: repeat(2, minmax(280px, 1fr));
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
  font-size: 26px;
  font-weight: 800;
}

.indicador.destaque {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.indicador.alerta {
  border-color: #fed7aa;
  background: #fff7ed;
}

.secundario-card strong {
  font-size: 22px;
}

.grafico-barras {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(54px, 1fr));
  align-items: end;
  min-height: 230px;
  gap: 10px;
}

.barra-dia {
  display: grid;
  grid-template-rows: 1fr auto auto;
  align-items: end;
  gap: 8px;
  min-height: 230px;
}

.coluna {
  width: 100%;
  min-height: 8px;
  border-radius: 8px 8px 0 0;
  background: #2563eb;
}

.barra-dia span,
.barra-dia small {
  color: #475569;
  font-size: 12px;
  font-weight: 800;
  text-align: center;
}

.barra-dia small {
  font-weight: 700;
}

.lista-receita {
  display: grid;
  gap: 14px;
}

.linha-receita {
  display: grid;
  gap: 8px;
}

.trilhas {
  display: grid;
  gap: 4px;
}

.trilhas span {
  display: block;
  height: 10px;
  min-width: 4px;
  border-radius: 999px;
}

.trilhas .prevista {
  background: #93c5fd;
}

.trilhas .concluida {
  background: #22c55e;
}

.trilhas .perdas {
  background: #f97316;
}

.estado-vazio {
  padding: 18px;
  border: 1px dashed #cbd5e1;
  border-radius: 8px;
  color: #64748b;
  font-weight: 800;
}

.contador {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.tabela-card {
  overflow: hidden;
}

.tabela-card h2,
.status-card h2 {
  font-size: 22px;
}

.tabela-card.card {
  padding: 0;
}

.tabela-card > h2 {
  padding: 22px 22px 0;
}

.tabela-container {
  width: 100%;
  overflow-x: auto;
}

table {
  width: 100%;
  min-width: 820px;
  border-collapse: collapse;
}

.tabela-detalhada table {
  min-width: 1100px;
}

th,
td {
  padding: 14px 16px;
  border-bottom: 1px solid #e5e7eb;
  color: #374151;
  text-align: left;
  vertical-align: top;
}

th {
  background: #f8fafc;
  color: #111827;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.status-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: 12px;
}

.status-item {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.status-item strong {
  font-size: 24px;
}

.status {
  display: inline-flex;
  width: fit-content;
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
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.sucesso-botao {
  background: #15803d;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

@media (max-width: 1100px) {
  .grade-indicadores.principais,
  .grade-indicadores.secundarios,
  .grade-graficos,
  .grade-tabelas {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 760px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .acoes-filtros {
    align-items: flex-start;
    flex-direction: column;
  }

  .grade-indicadores.principais,
  .grade-indicadores.secundarios,
  .grade-graficos,
  .grade-tabelas,
  .status-grid {
    grid-template-columns: 1fr;
  }
}

@media print {
  .barra-lateral,
  .topo-app,
  .filtros-relatorios,
  .botao {
    display: none !important;
  }
}
</style>
