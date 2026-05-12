<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  atualizarIndisponibilidade,
  buscarFuncionarios,
  buscarFuncionariosVinculadosAoServico,
  buscarIndisponibilidades,
  buscarServicos,
  criarIndisponibilidade,
  excluirIndisponibilidade,
  salvarFuncionariosVinculadosAoServico,
} from '@/services/api'

const abas = [
  { chave: 'EMPRESA', rotulo: 'Indisponibilidade da empresa' },
  { chave: 'FUNCIONARIO', rotulo: 'Indisponibilidade de funcionário' },
  { chave: 'SERVICO', rotulo: 'Indisponibilidade de serviço' },
  { chave: 'VINCULOS', rotulo: 'Funcionários por serviço' },
]

const abaAtiva = ref('EMPRESA')
const indisponibilidades = ref([])
const funcionarios = ref([])
const servicos = ref([])
const funcionariosSelecionados = ref([])
const servicoVinculoId = ref('')
const carregando = ref(true)
const carregandoVinculos = ref(false)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const mensagemVinculos = ref('')
const indisponibilidadeEditandoId = ref(null)
const ignorarResetAba = ref(false)
const formulario = ref(criarFormularioInicial('EMPRESA'))

const indisponibilidadesDaAba = computed(() =>
  indisponibilidades.value
    .filter((item) => normalizarTipo(item.tipo) === abaAtiva.value)
    .sort((itemA, itemB) => {
      const dataA = criarData(itemA.inicio || itemA.dataHoraInicio)?.getTime() || 0
      const dataB = criarData(itemB.inicio || itemB.dataHoraInicio)?.getTime() || 0

      return dataB - dataA
    }),
)

const tipoIndisponibilidadeAtivo = computed(() =>
  abaAtiva.value === 'VINCULOS' ? 'EMPRESA' : abaAtiva.value,
)

const servicosAtivos = computed(() => servicos.value.filter((servico) => servico.ativo !== false))
const funcionariosAtivos = computed(() =>
  funcionarios.value.filter((funcionario) => funcionario.ativo !== false),
)

const servicoVinculoSelecionado = computed(() =>
  servicos.value.find((servico) => Number(servico.id) === Number(servicoVinculoId.value)),
)

const funcionariosVinculadosAtuais = computed(() =>
  funcionariosAtivos.value.filter((funcionario) =>
    funcionariosSelecionados.value.includes(Number(funcionario.id)),
  ),
)

watch(abaAtiva, (tipo) => {
  if (ignorarResetAba.value) {
    ignorarResetAba.value = false
    return
  }

  erro.value = ''
  mensagemSucesso.value = ''
  mensagemVinculos.value = ''
  indisponibilidadeEditandoId.value = null
  formulario.value = criarFormularioInicial(tipo)

  if (tipo !== 'VINCULOS') {
    carregarIndisponibilidades()
  } else {
    funcionariosSelecionados.value = []
  }
})

watch(servicoVinculoId, () => {
  carregarVinculosDoServico()
})

watch(
  () => formulario.value.diaInteiro,
  (diaInteiro) => {
    if (diaInteiro) {
      formulario.value.dataFim = ''
      formulario.value.horaFim = ''
      return
    }

    if (!formulario.value.dataFim) {
      formulario.value.dataFim = formulario.value.dataInicio
    }
  },
)

function criarFormularioInicial(tipo) {
  return {
    tipo,
    funcionarioId: '',
    servicoId: '',
    dataInicio: '',
    horaInicio: '',
    dataFim: '',
    horaFim: '',
    diaInteiro: false,
    motivo: '',
    ativo: true,
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    const [indisponibilidadesApi, funcionariosApi, servicosApi] = await Promise.all([
      buscarIndisponibilidades({ tipo: tipoIndisponibilidadeAtivo.value }),
      buscarFuncionarios(),
      buscarServicos(),
    ])

    atualizarIndisponibilidadesDaAba(indisponibilidadesApi)
    funcionarios.value = normalizarColecao(funcionariosApi)
    servicos.value = normalizarColecao(servicosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os dados de disponibilidade.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarIndisponibilidades() {
  try {
    erro.value = ''
    const dados = await buscarIndisponibilidades({ tipo: tipoIndisponibilidadeAtivo.value })
    atualizarIndisponibilidadesDaAba(dados)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as indisponibilidades.')
    console.error(error)
  }
}

async function salvarIndisponibilidade() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    const mensagemValidacao = validarFormulario()

    if (mensagemValidacao) {
      erro.value = mensagemValidacao
      return
    }

    salvando.value = true
    const dados = montarPayloadIndisponibilidade()

    if (indisponibilidadeEditandoId.value) {
      await atualizarIndisponibilidade(indisponibilidadeEditandoId.value, dados)
      mensagemSucesso.value = 'Indisponibilidade atualizada com sucesso.'
    } else {
      await criarIndisponibilidade(dados)
      mensagemSucesso.value = 'Indisponibilidade salva com sucesso.'
    }

    cancelarEdicao(false)
    await carregarIndisponibilidades()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar a indisponibilidade.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function excluirIndisponibilidadeSelecionada(item) {
  if (!window.confirm('Deseja excluir esta indisponibilidade?')) {
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''
    await excluirIndisponibilidade(item.id)
    mensagemSucesso.value = 'Indisponibilidade excluída com sucesso.'
    await carregarIndisponibilidades()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível excluir a indisponibilidade.')
    console.error(error)
  }
}

function editarIndisponibilidade(item) {
  const tipo = normalizarTipo(item.tipo)

  if (abaAtiva.value !== tipo) {
    ignorarResetAba.value = true
  }

  abaAtiva.value = tipo
  erro.value = ''
  mensagemSucesso.value = ''
  indisponibilidadeEditandoId.value = item.id
  formulario.value = {
    tipo,
    funcionarioId: item.funcionarioId || item.funcionario?.id || '',
    servicoId: item.servicoId || item.servico?.id || '',
    ...formatarPeriodoParaFormulario(item.inicio || item.dataHoraInicio, item.fim || item.dataHoraFim),
    diaInteiro: Boolean(item.diaInteiro),
    motivo: item.motivo || '',
    ativo: item.ativo !== false,
  }
}

function cancelarEdicao(limparMensagem = true) {
  indisponibilidadeEditandoId.value = null
  formulario.value = criarFormularioInicial(abaAtiva.value)

  if (limparMensagem) {
    mensagemSucesso.value = ''
  }
}

function validarFormulario() {
  if (abaAtiva.value === 'FUNCIONARIO' && !formulario.value.funcionarioId) {
    return 'Selecione um funcionário.'
  }

  if (abaAtiva.value === 'SERVICO' && !formulario.value.servicoId) {
    return 'Selecione um serviço.'
  }

  if (!formulario.value.dataInicio) {
    return formulario.value.diaInteiro ? 'Informe a data.' : 'Informe a data inicial.'
  }

  if (formulario.value.diaInteiro) {
    return ''
  }

  if (!horaValida(formulario.value.horaInicio)) {
    return 'Informe a hora inicial no formato HH:mm.'
  }

  if (!formulario.value.dataFim) {
    return 'Informe a data final.'
  }

  if (!horaValida(formulario.value.horaFim)) {
    return 'Informe a hora final no formato HH:mm.'
  }

  const inicio = criarData(obterInicioFormulario())
  const fim = criarData(obterFimFormulario())

  if (!inicio || !fim || fim <= inicio) {
    return 'A data final deve ser maior que a data inicial.'
  }

  return ''
}

function montarPayloadIndisponibilidade() {
  const tipo = abaAtiva.value

  const payload = {
    tipo,
    funcionarioId: tipo === 'FUNCIONARIO' ? Number(formulario.value.funcionarioId) : null,
    servicoId: tipo === 'SERVICO' ? Number(formulario.value.servicoId) : null,
    inicio: obterInicioFormulario(),
    fim: obterFimFormulario(),
    diaInteiro: Boolean(formulario.value.diaInteiro),
    motivo: formulario.value.motivo.trim(),
  }

  if (indisponibilidadeEditandoId.value || formulario.value.ativo === false) {
    payload.ativo = Boolean(formulario.value.ativo)
  }

  return payload
}

function obterInicioFormulario() {
  return formulario.value.diaInteiro
    ? `${formulario.value.dataInicio}T00:00:00`
    : `${formulario.value.dataInicio}T${formulario.value.horaInicio}:00`
}

function obterFimFormulario() {
  if (formulario.value.diaInteiro) {
    return null
  }

  return `${formulario.value.dataFim}T${formulario.value.horaFim}:00`
}

async function carregarVinculosDoServico({ limparSucesso = true } = {}) {
  funcionariosSelecionados.value = []
  erro.value = ''
  if (limparSucesso) {
    mensagemSucesso.value = ''
  }
  mensagemVinculos.value = ''

  if (!servicoVinculoId.value) {
    return
  }

  try {
    carregandoVinculos.value = true
    erro.value = ''
    const dados = await buscarFuncionariosVinculadosAoServico(servicoVinculoId.value)
    const listaNormalizada = normalizarColecao(dados)
    const idsExtraidos = extrairFuncionarioIds(listaNormalizada)
    funcionariosSelecionados.value = idsExtraidos

    console.debug('Vínculos retornados pela API:', dados)
    console.debug('IDs extraídos:', idsExtraidos)
  } catch (error) {
    funcionariosSelecionados.value = []
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os vínculos.')
    console.error(error)
  } finally {
    carregandoVinculos.value = false
  }
}

async function salvarVinculos() {
  if (salvando.value) {
    return
  }

  if (!servicoVinculoId.value) {
    erro.value = 'Selecione um serviço.'
    mensagemSucesso.value = ''
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''
    salvando.value = true
    const funcionarioIds = funcionariosSelecionados.value.map(Number)

    await salvarFuncionariosVinculadosAoServico(
      servicoVinculoId.value,
      funcionarioIds,
    )
    await carregarVinculosDoServico({ limparSucesso: false })
    erro.value = ''
    mensagemSucesso.value = 'Vínculos atualizados com sucesso.'
  } catch (error) {
    mensagemSucesso.value = ''
    erro.value = obterMensagemErro(error, 'Não foi possível salvar os vínculos.')
    console.error('Erro ao salvar vínculos de funcionários ao serviço:', error?.detalhes || error)
  } finally {
    salvando.value = false
  }
}

function normalizarIds(dados) {
  return extrairFuncionarioIds(normalizarColecao(dados))
}

function extrairFuncionarioIds(lista) {
  return lista
    .map((item) => Number(obterFuncionarioIdVinculo(item)))
    .filter((id) => Number.isFinite(id))
}

function obterFuncionarioIdVinculo(item) {
  if (!item || typeof item !== 'object') {
    return item
  }

  if (item.funcionarioId !== null && item.funcionarioId !== undefined) {
    return item.funcionarioId
  }

  if (item.funcionario?.id !== null && item.funcionario?.id !== undefined) {
    return item.funcionario.id
  }

  if (item.servicoId || item.servicoNome) {
    return null
  }

  return item.id
}

function normalizarColecao(dados) {
  if (Array.isArray(dados)) {
    return dados
  }

  if (!dados || typeof dados !== 'object') {
    return []
  }

  if (Array.isArray(dados.value)) {
    return dados.value
  }

  if (Array.isArray(dados.Value)) {
    return dados.Value
  }

  if (dados.value !== undefined && (dados.Count !== undefined || dados.count !== undefined)) {
    return dados.value ? [dados.value].flat() : []
  }

  if (dados.Value !== undefined && (dados.Count !== undefined || dados.count !== undefined)) {
    return dados.Value ? [dados.Value].flat() : []
  }

  if (Array.isArray(dados.content)) {
    return dados.content
  }

  if (Array.isArray(dados.data?.value)) {
    return dados.data.value
  }

  if (Array.isArray(dados.data?.Value)) {
    return dados.data.Value
  }

  if (
    dados.data?.value !== undefined &&
    (dados.data.Count !== undefined || dados.data.count !== undefined)
  ) {
    return dados.data.value ? [dados.data.value].flat() : []
  }

  if (
    dados.data?.Value !== undefined &&
    (dados.data.Count !== undefined || dados.data.count !== undefined)
  ) {
    return dados.data.Value ? [dados.data.Value].flat() : []
  }

  if (Array.isArray(dados.data?.content)) {
    return dados.data.content
  }

  if (Array.isArray(dados.data)) {
    return dados.data
  }

  return dados.items || dados.itens || dados.resultado || []
}

function atualizarIndisponibilidadesDaAba(dados) {
  const tipo = tipoIndisponibilidadeAtivo.value
  const itens = normalizarColecao(dados).map((item) => ({
    tipo,
    ...item,
  }))

  indisponibilidades.value = [
    ...indisponibilidades.value.filter((item) => normalizarTipo(item.tipo) !== tipo),
    ...itens,
  ]
}

function alternarFuncionario(funcionarioId) {
  const id = Number(funcionarioId)

  if (funcionariosSelecionados.value.includes(id)) {
    funcionariosSelecionados.value = funcionariosSelecionados.value.filter((item) => item !== id)
    return
  }

  funcionariosSelecionados.value = [...funcionariosSelecionados.value, id]
}

function normalizarTipo(tipo) {
  const texto = String(tipo || 'EMPRESA').trim().toUpperCase()

  return ['EMPRESA', 'FUNCIONARIO', 'SERVICO'].includes(texto) ? texto : 'EMPRESA'
}

function obterNomeFuncionario(item) {
  const id = item.funcionarioId || item.funcionario?.id
  const funcionario = funcionarios.value.find((funcionarioItem) => Number(funcionarioItem.id) === Number(id))

  return item.funcionarioNome || item.funcionario?.nome || funcionario?.nome || '-'
}

function obterNomeServico(item) {
  const id = item.servicoId || item.servico?.id
  const servico = servicos.value.find((servicoItem) => Number(servicoItem.id) === Number(id))

  return item.servicoNome || item.servico?.nome || servico?.nome || '-'
}

function formatarPeriodo(item) {
  const inicio = item.inicio || item.dataHoraInicio
  const fim = item.fim || item.dataHoraFim

  if (item.diaInteiro) {
    return `${formatarData(inicio)} - Dia inteiro`
  }

  return `${formatarDataHora(inicio)} até ${formatarDataHora(fim)}`
}

function formatarData(valor) {
  const data = criarData(valor)

  if (!data) {
    return '-'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarDataHora(valor) {
  const data = criarData(valor)

  if (!data) {
    return '-'
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarPeriodoParaFormulario(inicio, fim) {
  const dataInicio = criarData(inicio)
  const dataFim = criarData(fim)

  return {
    dataInicio: formatarDataInput(dataInicio),
    horaInicio: formatarHoraInput(dataInicio),
    dataFim: formatarDataInput(dataFim),
    horaFim: formatarHoraInput(dataFim),
  }
}

function formatarDataInput(data) {
  if (!data) {
    return ''
  }

  return [
    data.getFullYear(),
    String(data.getMonth() + 1).padStart(2, '0'),
    String(data.getDate()).padStart(2, '0'),
  ].join('-')
}

function formatarHoraInput(data) {
  if (!data) {
    return ''
  }

  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

function aplicarMascaraHora(campo, valor) {
  const numeros = String(valor || '').replace(/\D/g, '').slice(0, 4)
  const hora = numeros.length > 2 ? `${numeros.slice(0, 2)}:${numeros.slice(2)}` : numeros

  formulario.value[campo] = hora
}

function horaValida(valor) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor || '').trim())
}

function criarData(valor) {
  if (!valor) {
    return null
  }

  const data = new Date(valor)

  return Number.isNaN(data.getTime()) ? null : data
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem && !mensagemTecnica(mensagem) ? mensagem : fallback
}

function mensagemTecnica(mensagem) {
  const texto = mensagem.toLowerCase()

  return [
    'failed to fetch',
    'networkerror',
    'load failed',
    'internal server error',
    'no message available',
  ].includes(texto)
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Operação</p>
        <h1>Disponibilidade</h1>
        <p class="descricao">
          Gerencie períodos de indisponibilidade e vínculos entre funcionários e serviços.
        </p>
      </div>

      <button class="botao secundario" type="button" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <nav class="abas" aria-label="Seções de disponibilidade">
      <button
        v-for="aba in abas"
        :key="aba.chave"
        type="button"
        :class="{ ativa: abaAtiva === aba.chave }"
        @click="abaAtiva = aba.chave"
      >
        {{ aba.rotulo }}
      </button>
    </nav>

    <section v-if="carregando" class="card">
      <p>Carregando disponibilidade...</p>
    </section>

    <template v-else>
      <section v-if="abaAtiva !== 'VINCULOS'" class="grade-conteudo">
        <section class="card formulario">
          <div class="titulo-card">
            <h2>{{ indisponibilidadeEditandoId ? 'Editar indisponibilidade' : 'Nova indisponibilidade' }}</h2>
            <p>Defina o período e mantenha a agenda protegida.</p>
          </div>

          <div class="campos">
            <label v-if="abaAtiva === 'FUNCIONARIO'">
              Funcionário *
              <select v-model="formulario.funcionarioId">
                <option value="">Selecione um funcionário</option>
                <option v-for="funcionario in funcionariosAtivos" :key="funcionario.id" :value="funcionario.id">
                  {{ funcionario.nome }}
                </option>
              </select>
            </label>

            <label v-if="abaAtiva === 'SERVICO'">
              Serviço *
              <select v-model="formulario.servicoId">
                <option value="">Selecione um serviço</option>
                <option v-for="servico in servicosAtivos" :key="servico.id" :value="servico.id">
                  {{ servico.nome }}
                </option>
              </select>
            </label>

            <label>
              {{ formulario.diaInteiro ? 'Data *' : 'Data inicial *' }}
              <input v-model="formulario.dataInicio" type="date" />
            </label>

            <label v-if="!formulario.diaInteiro">
              Hora inicial *
              <input
                :value="formulario.horaInicio"
                type="text"
                inputmode="numeric"
                maxlength="5"
                placeholder="HH:mm"
                @input="aplicarMascaraHora('horaInicio', $event.target.value)"
              />
            </label>

            <label v-if="!formulario.diaInteiro">
              Data final *
              <input v-model="formulario.dataFim" type="date" />
            </label>

            <label v-if="!formulario.diaInteiro">
              Hora final *
              <input
                :value="formulario.horaFim"
                type="text"
                inputmode="numeric"
                maxlength="5"
                placeholder="HH:mm"
                @input="aplicarMascaraHora('horaFim', $event.target.value)"
              />
            </label>

            <label class="campo-checkbox">
              <input v-model="formulario.diaInteiro" type="checkbox" />
              Dia inteiro
            </label>

            <label class="campo-checkbox">
              <input v-model="formulario.ativo" type="checkbox" />
              Ativo
            </label>

            <label class="campo-grande">
              Motivo
              <input v-model="formulario.motivo" type="text" placeholder="Ex: feriado, manutenção ou treinamento" />
            </label>
          </div>

          <div class="acoes">
            <button class="botao principal" type="button" :disabled="salvando" @click="salvarIndisponibilidade">
              {{ salvando ? 'Salvando...' : 'Salvar indisponibilidade' }}
            </button>
            <button
              v-if="indisponibilidadeEditandoId"
              class="botao secundario"
              type="button"
              @click="cancelarEdicao"
            >
              Cancelar
            </button>
          </div>
        </section>

        <section class="lista-wrapper">
          <div class="cabecalho-lista">
            <div>
              <h2>Indisponibilidades</h2>
              <p>Períodos cadastrados para a seção selecionada.</p>
            </div>

            <span class="contador">{{ indisponibilidadesDaAba.length }} registro(s)</span>
          </div>

          <section v-if="indisponibilidadesDaAba.length === 0" class="card">
            <p>Nenhuma indisponibilidade cadastrada.</p>
          </section>

          <section v-else class="lista">
            <article v-for="item in indisponibilidadesDaAba" :key="item.id" class="card item-card">
              <div class="topo-card">
                <div>
                  <span :class="['badge', normalizarTipo(item.tipo).toLowerCase()]">
                    {{ normalizarTipo(item.tipo) === 'EMPRESA' ? 'Empresa' : normalizarTipo(item.tipo) === 'FUNCIONARIO' ? 'Funcionário' : 'Serviço' }}
                  </span>
                  <h3 v-if="normalizarTipo(item.tipo) === 'EMPRESA'">Tipo: Empresa</h3>
                  <h3 v-else-if="normalizarTipo(item.tipo) === 'FUNCIONARIO'">
                    {{ obterNomeFuncionario(item) }}
                  </h3>
                  <h3 v-else>{{ obterNomeServico(item) }}</h3>
                </div>

                <span :class="['status', item.ativo !== false ? 'ativo' : 'inativo']">
                  {{ item.ativo !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <div class="detalhes">
                <p><strong>Período:</strong> {{ formatarPeriodo(item) }}</p>
                <p><strong>Motivo:</strong> {{ item.motivo || '-' }}</p>
                <p><strong>Situação:</strong> {{ item.ativo !== false ? 'Ativo' : 'Inativo' }}</p>
              </div>

              <div class="acoes">
                <button class="botao secundario" type="button" @click="editarIndisponibilidade(item)">
                  Editar
                </button>
                <button class="botao perigo" type="button" @click="excluirIndisponibilidadeSelecionada(item)">
                  Excluir
                </button>
              </div>
            </article>
          </section>
        </section>
      </section>

      <section v-else class="card vinculos-card">
        <div class="titulo-card">
          <h2>Funcionários por serviço</h2>
          <p>
            Se nenhum funcionário for vinculado a este serviço, todos os funcionários ativos poderão
            executá-lo. Quando houver pelo menos um vínculo, somente os funcionários selecionados
            poderão atender este serviço.
          </p>
        </div>

        <label class="servico-vinculo">
          Serviço
          <select v-model="servicoVinculoId">
            <option value="">Selecione um serviço</option>
            <option v-for="servico in servicosAtivos" :key="servico.id" :value="servico.id">
              {{ servico.nome }}
            </option>
          </select>
        </label>

        <section v-if="servicoVinculoId" class="lista-funcionarios">
          <div class="cabecalho-lista">
            <div>
              <h2>{{ servicoVinculoSelecionado?.nome || 'Serviço selecionado' }}</h2>
              <p>{{ carregandoVinculos ? 'Carregando vínculos...' : 'Marque quem pode executar este serviço.' }}</p>
            </div>
          </div>

          <section class="vinculos-atuais">
            <h3>Funcionários vinculados atualmente</h3>
            <div v-if="funcionariosVinculadosAtuais.length" class="chips-vinculos">
              <span
                v-for="funcionario in funcionariosVinculadosAtuais"
                :key="funcionario.id"
              >
                {{ funcionario.nome }}
              </span>
            </div>
            <p v-else>
              Nenhum funcionário vinculado. Enquanto não houver vínculo salvo, todos os funcionários ativos poderão executar este serviço.
            </p>
          </section>

          <label
            v-for="funcionario in funcionariosAtivos"
            :key="funcionario.id"
            class="funcionario-checkbox"
          >
            <input
              type="checkbox"
              :checked="funcionariosSelecionados.includes(Number(funcionario.id))"
              @change="alternarFuncionario(funcionario.id)"
            />
            <span>{{ funcionario.nome }}</span>
          </label>
        </section>

        <div class="acoes">
          <button
            class="botao principal"
            type="button"
            :disabled="salvando || carregandoVinculos"
            @click="salvarVinculos"
          >
            {{ salvando ? 'Salvando...' : 'Salvar vínculos' }}
          </button>
        </div>
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
.cabecalho-lista p,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.abas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.abas button {
  border: 1px solid #dbe3ef;
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
}

.abas button.ativa {
  border-color: #2563eb;
  background: #dbeafe;
  color: #1d4ed8;
}

.grade-conteudo {
  display: grid;
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.formulario,
.vinculos-card,
.lista-wrapper {
  display: grid;
  gap: 16px;
}

.titulo-card h2,
.cabecalho-lista h2 {
  margin: 0;
  color: #111827;
  font-weight: 800;
}

.titulo-card h2 {
  font-size: 22px;
}

.cabecalho-lista h2 {
  font-size: 26px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

input:disabled,
select:disabled {
  background: #f1f5f9;
  color: #94a3b8;
  cursor: not-allowed;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.campo-checkbox {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

.campo-grande {
  grid-column: 1 / -1;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.item-card {
  display: grid;
  gap: 14px;
}

.item-card h3 {
  margin: 8px 0 0;
  font-size: 20px;
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

.badge,
.status,
.contador {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  white-space: nowrap;
  font-weight: 800;
}

.badge,
.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 14px;
}

.badge.empresa {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.funcionario {
  background: #fef3c7;
  color: #92400e;
}

.badge.servico {
  background: #ede9fe;
  color: #6d28d9;
}

.status.ativo {
  background: #dcfce7;
  color: #15803d;
}

.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.servico-vinculo {
  max-width: 460px;
}

.lista-funcionarios {
  display: grid;
  gap: 12px;
}

.funcionario-checkbox {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.vinculos-atuais {
  display: grid;
  gap: 10px;
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 8px;
  background: #eff6ff;
}

.vinculos-atuais h3 {
  margin: 0;
  color: #1e3a8a;
  font-size: 15px;
}

.vinculos-atuais p {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
}

.chips-vinculos {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chips-vinculos span {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  padding: 7px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .topo-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos,
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
