<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarClientes,
  buscarFuncionarios,
  buscarRelatorioFrequenciaGestaoEsportiva,
  buscarTurmasBeachTennis,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { formatarDataPtBrSemFuso } from '@/utils/datas'
import { criarPaginacaoInicial, OPCOES_TAMANHO_PAGINA } from '@/utils/paginacao'
import { rotuloSituacaoFrequencia } from '@/utils/aulasFrequencia'

const route = useRoute()
const router = useRouter()

const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const carregando = ref(true)
const carregandoBases = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const filtros = ref(criarFiltrosPadrao())
const registros = ref([])
const resumo = ref(criarResumoPadrao())
const paginacao = ref(criarPaginacaoInicial(10))
const turmas = ref([])
const professores = ref([])
const clientes = ref([])
const sequenciaConsulta = ref(0)
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA

const situacoes = [
  { valor: '', rotulo: 'Todas' },
  { valor: 'NAO_LANCADO', rotulo: 'Não lançado' },
  { valor: 'PRESENTE', rotulo: 'Presente' },
  { valor: 'FALTA_JUSTIFICADA', rotulo: 'Falta justificada' },
  { valor: 'FALTA_SEM_JUSTIFICATIVA', rotulo: 'Falta sem justificativa' },
  { valor: 'REPOSICAO_REALIZADA', rotulo: 'Reposição realizada' },
]

const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Aluno')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Alunos')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(
  () => !paginacao.value.last && paginaAtualHumana.value < Math.max(paginacao.value.totalPages || 1, 1),
)
const filtrosAtivos = computed(() =>
  Boolean(
    filtros.value.dataInicial ||
      filtros.value.dataFinal ||
      filtros.value.turmaId ||
      filtros.value.professorId ||
      filtros.value.alunoId ||
      filtros.value.situacao,
  ),
)
const resumoCards = computed(() => [
  { titulo: 'Total de registros', valor: formatarNumero(resumo.value.totalRegistros) },
  { titulo: 'Presentes', valor: formatarNumero(resumo.value.presentes) },
  { titulo: 'Faltas justificadas', valor: formatarNumero(resumo.value.faltasJustificadas) },
  { titulo: 'Faltas sem justificativa', valor: formatarNumero(resumo.value.faltasSemJustificativa) },
  { titulo: 'Reposições realizadas', valor: formatarNumero(resumo.value.reposicoesRealizadas) },
  { titulo: 'Não lançados', valor: formatarNumero(resumo.value.naoLancados) },
])

function criarResumoPadrao() {
  return {
    totalRegistros: 0,
    presentes: 0,
    faltasJustificadas: 0,
    faltasSemJustificativa: 0,
    reposicoesRealizadas: 0,
    naoLancados: 0,
  }
}

function criarFiltrosPadrao() {
  const hoje = new Date()
  const ano = hoje.getFullYear()
  const mes = hoje.getMonth()

  return {
    dataInicial: formatarDataInput(new Date(ano, mes, 1)),
    dataFinal: formatarDataInput(new Date(ano, mes + 1, 0)),
    turmaId: '',
    professorId: '',
    alunoId: '',
    situacao: '',
    page: 1,
    size: 10,
  }
}

function normalizarTexto(valor) {
  return String(valor ?? '').trim()
}

function normalizarId(valor) {
  const texto = normalizarTexto(valor)
  if (!texto) {
    return ''
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? String(numero) : ''
}

function normalizarNumero(valor, fallback = 0) {
  const numero = Number(valor)
  return Number.isFinite(numero) ? numero : fallback
}

function formatarNumero(valor) {
  return normalizarNumero(valor).toLocaleString('pt-BR')
}

function formatarDataInput(data) {
  return data.toISOString().slice(0, 10)
}

function criarData(valor) {
  const texto = normalizarTexto(valor)
  if (!texto) {
    return null
  }

  const data = new Date(texto)
  return Number.isNaN(data.getTime()) ? null : data
}

function formatarData(valor) {
  const texto = normalizarTexto(valor)
  return texto ? formatarDataPtBrSemFuso(texto) || '-' : '-'
}

function formatarHorario(valor) {
  const texto = normalizarTexto(valor)
  if (!texto) {
    return '-'
  }

  if (/^\d{2}:\d{2}:\d{2}$/.test(texto)) {
    return texto.slice(0, 5)
  }

  return texto
}

function formatarDataHora(valor) {
  const texto = normalizarTexto(valor)
  if (!texto) {
    return '-'
  }

  const correspondencia = texto.match(
    /^(\d{4}-\d{2}-\d{2})(?:[Tt ](\d{2}):(\d{2})(?::(\d{2}))?)?(Z|[+-]\d{2}:\d{2})?$/,
  )

  if (!correspondencia) {
    return texto
  }

  const data = new Date(texto)
  if (Number.isNaN(data.getTime())) {
    return texto
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) {
    return dados
  }

  if (!dados || typeof dados !== 'object') {
    return []
  }

  if (Array.isArray(dados.content)) return dados.content
  if (Array.isArray(dados.data?.content)) return dados.data.content
  if (Array.isArray(dados.data)) return dados.data
  if (Array.isArray(dados.items)) return dados.items
  if (Array.isArray(dados.itens)) return dados.itens
  if (Array.isArray(dados.resultado)) return dados.resultado

  return []
}

function rotuloTipoParticipacao(valor) {
  const tipo = normalizarTexto(valor).toUpperCase()
  return tipo === 'REPOSICAO' ? 'Reposição' : 'Regular'
}

function normalizarResposta(relatorio) {
  const pagina = relatorio?.pagina && typeof relatorio.pagina === 'object' ? relatorio.pagina : {}
  const resumoApi = relatorio?.resumo && typeof relatorio.resumo === 'object' ? relatorio.resumo : {}

  return {
    pagina: {
      content: normalizarLista(pagina),
      page: Number.isInteger(Number(pagina.page)) ? Number(pagina.page) : 0,
      size: Number.isInteger(Number(pagina.size)) ? Number(pagina.size) : paginacao.value.size,
      totalElements: normalizarNumero(pagina.totalElements, 0),
      totalPages: normalizarNumero(pagina.totalPages, 0),
      first: pagina.first === true,
      last: pagina.last === true,
      numberOfElements: normalizarNumero(pagina.numberOfElements, 0),
    },
    resumo: {
      totalRegistros: normalizarNumero(resumoApi.totalRegistros, 0),
      presentes: normalizarNumero(resumoApi.presentes, 0),
      faltasJustificadas: normalizarNumero(resumoApi.faltasJustificadas, 0),
      faltasSemJustificativa: normalizarNumero(resumoApi.faltasSemJustificativa, 0),
      reposicoesRealizadas: normalizarNumero(resumoApi.reposicoesRealizadas, 0),
      naoLancados: normalizarNumero(resumoApi.naoLancados, 0),
    },
  }
}

function normalizarItem(item = {}) {
  return {
    aulaId: normalizarId(item.aulaId ?? item.id),
    dataAula: normalizarTexto(item.dataAula || item.data),
    horarioInicio: normalizarTexto(item.horarioInicio || item.horario),
    turmaId: normalizarId(item.turmaId),
    turmaNome: normalizarTexto(item.turmaNome || item.turma || ''),
    professorId: normalizarId(item.professorId),
    professorNome: normalizarTexto(item.professorNome || item.professor || item.funcionarioNome || ''),
    alunoId: normalizarId(item.alunoId || item.clienteId),
    alunoNome: normalizarTexto(item.alunoNome || item.clienteNome || item.nomeAluno || item.nome || ''),
    tipoParticipacao: normalizarTexto(item.tipoParticipacao || 'REGULAR').toUpperCase(),
    situacao: normalizarTexto(item.situacao || 'NAO_LANCADO').toUpperCase(),
    observacao: normalizarTexto(item.observacao || item.observacoes || ''),
    lancadoEm: normalizarTexto(item.lancadoEm || item.dataLancamento || item.criadoEm || ''),
    atualizadoEm: normalizarTexto(item.atualizadoEm || item.alteradoEm || ''),
  }
}

function normalizarTurmaOpcao(item = {}) {
  const id = normalizarId(item.id ?? item.turmaId)
  if (!id) {
    return null
  }

  return {
    id,
    nome: normalizarTexto(item.nome || item.turmaNome || `Turma ${id}`),
  }
}

function normalizarProfessorOpcao(item = {}) {
  const id = normalizarId(item.id ?? item.funcionarioId)
  if (!id) {
    return null
  }

  return {
    id,
    nome: normalizarTexto(item.nome || item.funcionarioNome || `Professor ${id}`),
  }
}

function normalizarAlunoOpcao(item = {}) {
  const id = normalizarId(item.id ?? item.clienteId)
  if (!id) {
    return null
  }

  return {
    id,
    nome: normalizarTexto(item.nome || item.clienteNome || `Aluno ${id}`),
  }
}

function ordenarOpcoes(lista = []) {
  return [...lista].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR'))
}

function montarQueryFiltros() {
  const query = {}
  const valores = {
    dataInicial: filtros.value.dataInicial,
    dataFinal: filtros.value.dataFinal,
    turmaId: filtros.value.turmaId,
    professorId: filtros.value.professorId,
    alunoId: filtros.value.alunoId,
    situacao: filtros.value.situacao,
    page: String(paginacao.value.page + 1),
    size: String(paginacao.value.size),
  }

  Object.entries(valores).forEach(([chave, valor]) => {
    const texto = normalizarTexto(valor)
    if (texto) {
      query[chave] = texto
    }
  })

  return query
}

function sincronizarFiltrosDaRota(query = {}) {
  filtros.value = {
    ...criarFiltrosPadrao(),
    dataInicial: normalizarTexto(query.dataInicial) || criarFiltrosPadrao().dataInicial,
    dataFinal: normalizarTexto(query.dataFinal) || criarFiltrosPadrao().dataFinal,
    turmaId: normalizarId(query.turmaId),
    professorId: normalizarId(query.professorId),
    alunoId: normalizarId(query.alunoId),
    situacao: normalizarTexto(query.situacao).toUpperCase(),
    page: Math.max(Number.parseInt(String(query.page || '1'), 10) || 1, 1),
    size: Math.max(Number.parseInt(String(query.size || '10'), 10) || 10, 1),
  }

  paginacao.value.page = Math.max(filtros.value.page - 1, 0)
  paginacao.value.size = filtros.value.size
}

function validarPeriodo() {
  const inicio = criarData(filtros.value.dataInicial)
  const fim = criarData(filtros.value.dataFinal)

  if (filtros.value.dataInicial && !inicio) {
    return 'Informe uma data inicial válida.'
  }

  if (filtros.value.dataFinal && !fim) {
    return 'Informe uma data final válida.'
  }

  if (inicio && fim && inicio > fim) {
    return 'Período inválido. A data inicial não pode ser maior que a data final.'
  }

  return ''
}

function obterMensagemErro(error, fallback) {
  const candidatos = [
    error?.response?.data?.message,
    error?.response?.data?.mensagem,
    error?.response?.data?.detail,
    error?.response?.data?.error,
    error?.data?.message,
    error?.data?.mensagem,
    error?.data?.detail,
    error?.data?.error,
    error?.message,
  ]

  for (const candidato of candidatos) {
    const mensagem = normalizarTexto(candidato)
    if (mensagem) {
      return mensagem
    }
  }

  return fallback
}

async function carregarBases() {
  if (carregandoBases.value) {
    return
  }

  carregandoBases.value = true

  try {
    const [turmasResposta, professoresResposta, clientesResposta] = await Promise.allSettled([
      buscarTurmasBeachTennis(),
      buscarFuncionarios(),
      buscarClientes(),
    ])

    turmas.value = ordenarOpcoes(
      normalizarLista(turmasResposta.status === 'fulfilled' ? turmasResposta.value : []).map(normalizarTurmaOpcao).filter(Boolean),
    )
    professores.value = ordenarOpcoes(
      normalizarLista(professoresResposta.status === 'fulfilled' ? professoresResposta.value : [])
        .map(normalizarProfessorOpcao)
        .filter(Boolean),
    )
    clientes.value = ordenarOpcoes(
      normalizarLista(clientesResposta.status === 'fulfilled' ? clientesResposta.value : [])
        .map(normalizarAlunoOpcao)
        .filter(Boolean),
    )
  } catch (error) {
    console.error(error)
  } finally {
    carregandoBases.value = false
  }
}

async function carregarRelatorio() {
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    registros.value = []
    resumo.value = criarResumoPadrao()
    paginacao.value = criarPaginacaoInicial(filtros.value.size)
    carregando.value = false
    return
  }

  const erroPeriodo = validarPeriodo()
  if (erroPeriodo) {
    erro.value = erroPeriodo
    carregando.value = false
    registros.value = []
    resumo.value = criarResumoPadrao()
    return
  }

  const sequenciaAtual = ++sequenciaConsulta.value
  carregando.value = true
  erro.value = ''
  mensagemSucesso.value = ''

  try {
    const resposta = await buscarRelatorioFrequenciaGestaoEsportiva({
      dataInicial: filtros.value.dataInicial || undefined,
      dataFinal: filtros.value.dataFinal || undefined,
      turmaId: filtros.value.turmaId || undefined,
      professorId: filtros.value.professorId || undefined,
      alunoId: filtros.value.alunoId || undefined,
      situacao: filtros.value.situacao || undefined,
      page: Math.max(paginacao.value.page, 0),
      size: paginacao.value.size,
    })

    if (sequenciaAtual !== sequenciaConsulta.value) {
      return
    }

    const normalizado = normalizarResposta(resposta || {})
    registros.value = normalizado.pagina.content.map(normalizarItem)
    resumo.value = normalizado.resumo
    paginacao.value = {
      ...paginacao.value,
      page: normalizado.pagina.page,
      size: normalizado.pagina.size || paginacao.value.size,
      totalElements: normalizado.pagina.totalElements,
      totalPages: normalizado.pagina.totalPages,
      first: normalizado.pagina.first,
      last: normalizado.pagina.last,
      numberOfElements: normalizado.pagina.numberOfElements,
    }

    if (
      paginacao.value.totalPages > 0 &&
      paginacao.value.page > 0 &&
      registros.value.length === 0 &&
      paginacao.value.totalElements > 0
    ) {
      const ultimaPagina = Math.max(paginacao.value.totalPages - 1, 0)
      if (ultimaPagina !== paginacao.value.page) {
        paginacao.value.page = ultimaPagina
        await router.replace({
          path: route.path,
          query: {
            ...montarQueryFiltros(),
            page: String(ultimaPagina + 1),
          },
        })
        return
      }
    }

    mensagemSucesso.value = 'Relatório atualizado com sucesso.'
  } catch (error) {
    if (sequenciaAtual !== sequenciaConsulta.value) {
      return
    }

    registros.value = []
    resumo.value = criarResumoPadrao()
    erro.value = obterMensagemErro(error, 'Não foi possível carregar o relatório de frequência.')
    console.error(error)
  } finally {
    if (sequenciaAtual === sequenciaConsulta.value) {
      carregando.value = false
    }
  }
}

async function aplicarFiltros() {
  const erroPeriodo = validarPeriodo()
  if (erroPeriodo) {
    erro.value = erroPeriodo
    return
  }

  await router.replace({
    path: route.path,
    query: {
      ...montarQueryFiltros(),
      page: '1',
    },
  })
}

async function limparFiltros() {
  filtros.value = criarFiltrosPadrao()
  paginacao.value.page = 0
  paginacao.value.size = filtros.value.size
  await router.replace({
    path: route.path,
    query: {
      dataInicial: filtros.value.dataInicial,
      dataFinal: filtros.value.dataFinal,
      page: '1',
      size: String(filtros.value.size),
    },
  })
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  await router.replace({
    path: route.path,
    query: {
      ...montarQueryFiltros(),
      page: String(Math.max(paginacao.value.page, 0)),
    },
  })
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  await router.replace({
    path: route.path,
    query: {
      ...montarQueryFiltros(),
      page: String(paginacao.value.page + 2),
    },
  })
}

async function alterarTamanhoPagina() {
  await router.replace({
    path: route.path,
    query: {
      ...montarQueryFiltros(),
      page: '1',
      size: String(paginacao.value.size),
    },
  })
}

async function tentarNovamente() {
  await carregarRelatorio()
}

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  await carregarRelatorio()
}

watch(
  () => route.query,
  async (query) => {
    sincronizarFiltrosDaRota(query)
    await carregarRelatorio()
  },
  { immediate: true, deep: true },
)

onMounted(async () => {
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  carregarBases()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})
</script>

<template>
  <main class="pagina relatorio-frequencia">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">{{ contextoEsportivo?.nomeModalidade || 'Gestão Esportiva' }}</p>
        <h1>Relatório de frequência</h1>
        <p class="descricao">
          Consulte a frequência esportiva com filtros por turma, professor, aluno e situação.
        </p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" :disabled="carregando" @click="tentarNovamente">
          {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
      </div>
    </header>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso">
      <p>Selecione uma empresa no seletor superior para consultar este relatório como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloAtivo" class="card aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <section v-else class="conteudo-relatorio">
      <section class="card filtros-card">
        <div class="titulo-card">
          <div>
            <h2>Filtros</h2>
            <p>Use o período e os filtros esportivos para refinar a consulta.</p>
          </div>
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
            {{ termoGrupoSingular }}
            <select v-model="filtros.turmaId" :disabled="carregandoBases">
              <option value="">Todas</option>
              <option v-for="turma in turmas" :key="turma.id" :value="turma.id">
                {{ turma.nome }}
              </option>
            </select>
          </label>

          <label>
            Professor
            <select v-model="filtros.professorId" :disabled="carregandoBases">
              <option value="">Todos</option>
              <option v-for="professor in professores" :key="professor.id" :value="professor.id">
                {{ professor.nome }}
              </option>
            </select>
          </label>

          <label>
            {{ termoParticipanteSingular }}
            <select v-model="filtros.alunoId" :disabled="carregandoBases">
              <option value="">Todos</option>
              <option v-for="aluno in clientes" :key="aluno.id" :value="aluno.id">
                {{ aluno.nome }}
              </option>
            </select>
          </label>

          <label>
            Situação
            <select v-model="filtros.situacao">
              <option v-for="situacao in situacoes" :key="situacao.valor" :value="situacao.valor">
                {{ situacao.rotulo }}
              </option>
            </select>
          </label>

          <label>
            Registros por página
            <select v-model.number="paginacao.size" @change="alterarTamanhoPagina">
              <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
                {{ opcao }}
              </option>
            </select>
          </label>
        </div>

        <div class="acoes-filtros">
          <button class="botao principal" type="button" :disabled="carregando" @click="aplicarFiltros">
            Aplicar filtros
          </button>
          <button class="botao secundario" type="button" :disabled="carregando" @click="limparFiltros">
            Limpar filtros
          </button>
          <button class="botao secundario" type="button" :disabled="carregando" @click="tentarNovamente">
            Tentar novamente
          </button>
        </div>
      </section>

      <section v-if="erro" class="card erro">
        <p>{{ erro }}</p>
        <div class="acoes-erro">
          <button class="botao principal" type="button" @click="tentarNovamente">Tentar novamente</button>
        </div>
      </section>

      <section v-if="mensagemSucesso && !erro" class="card sucesso">
        <p>{{ mensagemSucesso }}</p>
      </section>

      <section v-if="carregando" class="card estado-carregando">
        <p>Carregando relatório de frequência...</p>
      </section>

      <template v-else>
        <section class="grade-resumo">
          <article v-for="card in resumoCards" :key="card.titulo" class="card resumo-card">
            <span>{{ card.titulo }}</span>
            <strong>{{ card.valor }}</strong>
          </article>
        </section>

        <section class="card lista-relatorio">
          <div class="cabecalho-lista">
            <div>
              <h2>Registros</h2>
              <p>Exibindo os resultados conforme os filtros aplicados.</p>
            </div>
            <span class="contador">{{ paginacao.totalElements }} registro(s)</span>
          </div>

          <section v-if="!registros.length" class="estado-vazio">
            <p>
              {{ filtrosAtivos ? 'Nenhum registro encontrado para os filtros informados.' : 'Nenhum registro de frequência foi encontrado.' }}
            </p>
          </section>

          <template v-else>
            <div class="tabela-desktop">
              <table>
                <thead>
                  <tr>
                    <th>Data e horário</th>
                    <th>Aula</th>
                    <th>Turma</th>
                    <th>Professor</th>
                    <th>{{ termoParticipanteSingular }}</th>
                    <th>Participação</th>
                    <th>Situação</th>
                    <th>Observação</th>
                    <th>Data do lançamento</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="item in registros" :key="`${item.aulaId}-${item.alunoId}-${item.lancadoEm}`">
                    <td>
                      <strong>{{ formatarData(item.dataAula) }}</strong>
                      <div>{{ formatarHorario(item.horarioInicio) }}</div>
                    </td>
                    <td>Aula {{ item.aulaId || '-' }}</td>
                    <td>{{ item.turmaNome || '-' }}</td>
                    <td>{{ item.professorNome || '-' }}</td>
                    <td>{{ item.alunoNome || '-' }}</td>
                    <td>{{ rotuloTipoParticipacao(item.tipoParticipacao) }}</td>
                    <td>{{ rotuloSituacaoFrequencia(item.situacao) }}</td>
                    <td>{{ item.observacao || '-' }}</td>
                    <td>{{ formatarDataHora(item.lancadoEm) }}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div class="lista-mobile" aria-label="Lista de registros de frequência">
              <article v-for="item in registros" :key="`mobile-${item.aulaId}-${item.alunoId}-${item.lancadoEm}`" class="card mobile-card">
                <div class="mobile-topo">
                  <div>
                    <p class="mobile-titulo">Aula {{ item.aulaId || '-' }}</p>
                    <h3>{{ item.alunoNome || '-' }}</h3>
                    <p class="mobile-subtitulo">
                      {{ formatarData(item.dataAula) }} · {{ formatarHorario(item.horarioInicio) }}
                    </p>
                  </div>
                  <span class="chip situacao">{{ rotuloSituacaoFrequencia(item.situacao) }}</span>
                </div>

                <div class="mobile-grid">
                  <p><strong>Turma:</strong> {{ item.turmaNome || '-' }}</p>
                  <p><strong>Professor:</strong> {{ item.professorNome || '-' }}</p>
                  <p><strong>Participação:</strong> {{ rotuloTipoParticipacao(item.tipoParticipacao) }}</p>
                  <p><strong>Observação:</strong> {{ item.observacao || '-' }}</p>
                  <p><strong>Data do lançamento:</strong> {{ formatarDataHora(item.lancadoEm) }}</p>
                </div>
              </article>
            </div>

            <section class="card paginacao-card">
              <p class="resumo-paginacao">
                {{ paginacao.totalElements }} registro(s) - Página {{ paginaAtualHumana }} de {{ Math.max(paginacao.totalPages || 1, 1) }}
              </p>

              <div class="botoes-paginacao">
                <button class="botao secundario" type="button" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
                  Anterior
                </button>
                <button class="botao secundario" type="button" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
                  Próxima
                </button>
              </div>
            </section>
          </template>
        </section>
      </template>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 20px;
  color: var(--app-text);
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.cabecalho-pagina,
.card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow);
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary) 14%, transparent), transparent 32%),
    linear-gradient(135deg, color-mix(in srgb, var(--app-surface) 96%, white), var(--app-surface));
}

.subtitulo {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-primary);
}

.cabecalho-pagina h1,
.titulo-card h2,
.lista-relatorio h2 {
  margin: 0;
}

.descricao,
.titulo-card p,
.cabecalho-lista p,
.estado-vazio p,
.sucesso p,
.erro p,
.resumo-paginacao {
  margin: 0;
  color: var(--app-text-muted);
}

.acoes-cabecalho,
.acoes-filtros,
.acoes-erro,
.botoes-paginacao {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao {
  appearance: none;
  border: 1px solid transparent;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  cursor: pointer;
  transition:
    transform 0.2s ease,
    opacity 0.2s ease,
    background 0.2s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.botao.principal {
  background: linear-gradient(135deg, var(--app-primary), var(--app-brand-end));
  color: #fff;
}

.botao.secundario {
  background: var(--app-surface-soft);
  color: var(--app-primary);
  border-color: var(--app-border);
}

.aviso {
  padding: 20px 22px;
}

.conteudo-relatorio {
  display: grid;
  gap: 20px;
}

.filtros-card,
.lista-relatorio,
.paginacao-card {
  display: grid;
  gap: 16px;
  padding: 22px;
}

.campos-filtros {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 14px;
}

.campos-filtros label {
  display: grid;
  gap: 8px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 600;
}

.campos-filtros input,
.campos-filtros select {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 11px 12px;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

.campos-filtros input:focus,
.campos-filtros select:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.grade-resumo {
  display: grid;
  grid-template-columns: repeat(6, minmax(0, 1fr));
  gap: 14px;
}

.resumo-card {
  display: grid;
  gap: 6px;
  padding: 16px;
}

.resumo-card span,
.chip {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.resumo-card strong {
  font-size: 24px;
  font-weight: 900;
  overflow-wrap: anywhere;
}

.contador {
  display: inline-flex;
  width: fit-content;
  padding: 8px 12px;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 800;
  white-space: nowrap;
}

.tabela-desktop {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 16px;
}

table {
  width: 100%;
  border-collapse: collapse;
}

th,
td {
  padding: 12px 10px;
  border-bottom: 1px solid var(--app-border);
  color: var(--app-text);
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  word-break: break-word;
}

th {
  background: var(--app-surface-soft);
  color: var(--app-text);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.lista-mobile {
  display: none;
}

.mobile-card {
  display: grid;
  gap: 12px;
}

.mobile-topo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.mobile-titulo {
  margin: 0 0 4px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.mobile-topo h3 {
  margin: 0;
}

.mobile-subtitulo {
  margin: 4px 0 0;
  color: var(--app-text-muted);
}

.chip {
  display: inline-flex;
  width: fit-content;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.mobile-grid {
  display: grid;
  gap: 8px;
}

.mobile-grid p {
  margin: 0;
  overflow-wrap: anywhere;
}

.paginacao-card {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  flex-wrap: wrap;
}

.estado-vazio,
.erro {
  padding: 24px 18px;
  border-radius: 16px;
  text-align: left;
  border: 1px dashed var(--app-border);
}

.erro {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.sucesso {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
  padding: 16px 18px;
}

@media (max-width: 1100px) {
  .grade-resumo,
  .campos-filtros {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina {
    flex-direction: column;
    align-items: flex-start;
  }

  .grade-resumo,
  .campos-filtros {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 768px) {
  .tabela-desktop {
    display: none;
  }

  .lista-mobile {
    display: grid;
    gap: 14px;
  }

  .paginacao-card {
    align-items: stretch;
  }

  .botoes-paginacao .botao {
    width: 100%;
  }
}
</style>
