<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAlunosTurmaBeachTennis,
  buscarClientesDisponiveisBeachTennis,
  buscarTurmaBeachTennisOuLista,
  buscarTurmasBeachTennis,
  modoVisualizacaoEmpresaAtivo,
  salvarClientesTurmaBeachTennis,
} from '@/services/api'
import {
  OPCOES_NIVEL_BEACH_TENNIS,
  OPCOES_PERFIL_BEACH_TENNIS,
  formatarDataBrasileira,
  rotuloNivelBeachTennis,
  rotuloPerfilBeachTennis,
} from '@/utils/beachTennis'
import { debugLog } from '@/utils/devDebug'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const route = useRoute()
const router = useRouter()

const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Participante')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Participantes')
const termoResponsavelSingular = computed(() => contextoEsportivo.value?.termoResponsavelSingular || 'Professor')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')

const turma = ref(null)
const turmas = ref([])
const alunosPorClienteId = ref(new Map())
const idsIniciais = ref(new Set())
const idsAtuais = ref(new Set())
const idsMarcadosDisponiveis = ref(new Set())
const idsMarcadosTurma = ref(new Set())
const alunosDisponiveis = ref([])
const paginacaoDisponiveis = ref(criarPaginacaoInicial(20))
const carregando = ref(true)
const carregandoDisponiveis = ref(false)
const carregandoVinculados = ref(false)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const filtrosAbertos = ref(false)
const abaMobileAtiva = ref('disponiveis')
const buscaTurmas = ref('')
const buscaDisponiveisDigitada = ref('')
const buscaDisponiveisDebounced = ref('')
const buscaVinculados = ref('')
const filtroNivel = ref('')
const filtroPerfil = ref('')
const somenteAtivos = ref(true)
const confirmarSaidaAberta = ref(false)

let temporizadorBusca = null
let resolverSaidaPendencia = null
let sequenciaTela = 0
let sequenciaCarregamentoDisponiveis = 0

const EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS = 'beach-tennis-turmas-atualizadas'
const MENSAGEM_ERRO_SALVAR = computed(
  () =>
    `Não foi possível salvar os ${termoParticipantePluralLower.value} selecionados. Atualize os dados da ${termoGrupoSingularLower.value} e tente novamente.`,
)

const turmaIdSelecionada = computed(() => normalizarIdPositivo(valorRota(route.query.turmaId ?? route.params.turmaId)))
const turmaSelecionada = computed(() => turmaIdSelecionada.value !== null)
const termoParticipanteSingularLower = computed(() => termoParticipanteSingular.value.toLocaleLowerCase('pt-BR'))
const termoParticipantePluralLower = computed(() => termoParticipantePlural.value.toLocaleLowerCase('pt-BR'))
const termoGrupoSingularLower = computed(() => termoGrupoSingular.value.toLocaleLowerCase('pt-BR'))
const tituloPagina = computed(() =>
  `${termoParticipantePlural.value} por ${termoGrupoSingularLower.value}`,
)
const descricaoPagina = computed(() =>
  turmaSelecionada.value
    ? `Vincule, remova e acompanhe os ${termoParticipantePluralLower.value} participantes de cada ${termoGrupoSingularLower.value}.`
    : `Selecione uma ${termoGrupoSingularLower.value} para acompanhar os ${termoParticipantePluralLower.value} vinculados.`,
)
const quantidadeAtual = computed(() => idsIniciais.value.size)
const quantidadeFinal = computed(() => idsAtuais.value.size)
const quantidadeAlterada = computed(() => {
  const diferenca = diferencaIds(idsIniciais.value, idsAtuais.value)
  return diferenca.adicionados.length + diferenca.removidos.length
})
const capacidade = computed(() => normalizarCapacidade(turma.value?.vagas))
const capacidadeIlimitada = computed(() => capacidade.value === null)
const vagasDisponiveis = computed(() =>
  capacidadeIlimitada.value ? null : Math.max(capacidade.value - quantidadeFinal.value, 0),
)
const excedenteCapacidade = computed(() =>
  capacidadeIlimitada.value ? 0 : Math.max(quantidadeFinal.value - capacidade.value, 0),
)
const mensagemCapacidade = computed(() => {
  if (capacidadeIlimitada.value) {
    return 'Ilimitado'
  }

  return `${quantidadeFinal.value} de ${capacidade.value} ${termoParticipantePluralLower.value}`
})
const textoVagasDisponiveis = computed(() => {
  if (capacidadeIlimitada.value) {
    return 'Ilimitado'
  }

  return `${vagasDisponiveis.value} vagas disponíveis`
})
const alteracoesPendentes = computed(() => !conjuntosIguais(idsIniciais.value, idsAtuais.value))
const avisarCapacidade = computed(() => excedenteCapacidade.value > 0)
const listaDisponiveisVisiveis = computed(() =>
  alunosDisponiveis.value.filter((aluno) => !idsAtuais.value.has(aluno.clienteId)),
)
const listaVinculadosExibidos = computed(() => {
  const busca = normalizarTextoPesquisa(buscaVinculados.value)
  const lista = [...idsAtuais.value]
    .map((clienteId) => alunosPorClienteId.value.get(clienteId) || criarAlunoResumo(clienteId))
    .filter(Boolean)

  if (!busca) {
    return lista.sort(compararPorNome)
  }

  return lista
    .filter((aluno) => campoAlunoPesquisa(aluno).some((valor) => normalizarTextoPesquisa(valor).includes(busca)))
    .sort(compararPorNome)
})
const selecionadosDisponiveis = computed(() => idsMarcadosDisponiveis.value.size)
const selecionadosTurma = computed(() => idsMarcadosTurma.value.size)
const podeSalvar = computed(() => alteracoesPendentes.value && !avisarCapacidade.value && !salvando.value)
const subtituloColunaDisponiveis = computed(() => `${listaDisponiveisVisiveis.value.length} visíveis`)
const subtituloColunaTurma = computed(() => `${listaVinculadosExibidos.value.length} vinculados`)
const turmasFiltradas = computed(() => {
  const busca = normalizarTextoPesquisa(buscaTurmas.value)
  if (!busca) {
    return turmas.value
  }

  return turmas.value.filter((item) =>
    campoTurmaPesquisa(item).some((valor) => normalizarTextoPesquisa(valor).includes(busca)),
  )
})

function valorRota(valor) {
  return Array.isArray(valor) ? valor[0] : valor
}

function normalizarIdPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function normalizarIds(lista = []) {
  const itens = Array.isArray(lista) ? lista : [lista]
  const ids = []
  const vistos = new Set()

  for (const item of itens) {
    const id = normalizarIdPositivo(item)
    if (!id || vistos.has(id)) {
      continue
    }

    vistos.add(id)
    ids.push(id)
  }

  return ids
}

function criarConjuntoIds(lista = []) {
  return new Set(normalizarIds(lista))
}

function conjuntosIguais(a, b) {
  if (a.size !== b.size) {
    return false
  }

  for (const valor of a) {
    if (!b.has(valor)) {
      return false
    }
  }

  return true
}

function diferencaIds(origem, destino) {
  const adicionados = [...destino].filter((id) => !origem.has(id))
  const removidos = [...origem].filter((id) => !destino.has(id))
  return { adicionados, removidos }
}

function normalizarCapacidade(valor) {
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) {
    return null
  }

  return numero
}

function normalizarQuantidadeAlunos(item = {}, fallback = 0) {
  const candidatos = [
    item.quantidadeAlunos,
    item.quantidadeAlunosAtivos,
    item.totalAlunos,
    item.alunosCount,
    item.alunosVinculadosCount,
    Array.isArray(item.alunos) ? item.alunos.length : null,
  ]

  const valor = candidatos.find((candidato) => Number.isFinite(Number(candidato)) && Number(candidato) >= 0)
  return Number.isFinite(Number(valor)) ? Number(valor) : fallback
}

function normalizarTextoPesquisa(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function compararPorNome(a, b) {
  return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR')
}

function criarAlunoResumo(clienteId) {
  return {
    clienteId,
    vinculoId: null,
    nome: `${termoParticipanteSingular.value} ${clienteId}`,
    email: '',
    telefone: '',
    nivel: '',
    perfil: '',
    dataNascimento: '',
  }
}

function normalizarAlunoVinculado(item = {}) {
  const clienteId = normalizarIdPositivo(item.clienteId)
  if (!clienteId) {
    return null
  }

  return {
    clienteId,
    vinculoId: normalizarIdPositivo(item.id),
    nome: String(item.clienteNome || item.nome || item.alunoNome || termoParticipanteSingular.value).trim() || termoParticipanteSingular.value,
    email: String(item.clienteEmail || item.email || '').trim(),
    telefone: String(item.clienteTelefone || item.telefone || '').trim(),
    nivel: String(item.nivelBeachTennis || item.nivel || '').trim(),
    perfil: String(item.perfilBeachTennis || item.perfil || '').trim(),
    dataNascimento: String(item.dataNascimento || item.nascimento || '').trim(),
  }
}

function normalizarClienteDisponivel(item = {}) {
  const clienteId = normalizarIdPositivo(item.id)
  if (!clienteId) {
    return null
  }

  return {
    clienteId,
    vinculoId: null,
    nome: String(item.nome || item.nomeCompleto || termoParticipanteSingular.value).trim() || termoParticipanteSingular.value,
    email: String(item.email || '').trim(),
    telefone: String(item.telefone || '').trim(),
    nivel: String(item.nivelBeachTennis || item.nivel || '').trim(),
    perfil: String(item.perfilBeachTennis || item.perfil || '').trim(),
    dataNascimento: String(item.dataNascimento || item.nascimento || '').trim(),
  }
}

function normalizarTurmaResumo(item = {}) {
  const id = normalizarIdPositivo(item.id || item.turmaId)
  if (!id) {
    return null
  }

  return {
    ...item,
    id,
    nome: String(item.nome || `${termoGrupoSingular.value} ${id}`).trim(),
    horarioInicio: String(item.horarioInicio || item.horaInicio || '').trim(),
    professorResponsavelNome: String(item.professorResponsavelNome || item.nomeProfessor || item.funcionarioNome || '').trim(),
    quantidadeAlunos: normalizarQuantidadeAlunos(item),
    vagas: Number.isFinite(Number(item.vagas)) ? Number(item.vagas) : 0,
  }
}

function normalizarTurmas(lista = []) {
  return (Array.isArray(lista) ? lista : [])
    .map((item) => normalizarTurmaResumo(item))
    .filter(Boolean)
    .sort(compararPorNome)
}

function mesclarAluno(base = {}, atualizacao = {}) {
  return {
    clienteId: atualizacao.clienteId ?? base.clienteId ?? null,
    vinculoId: atualizacao.vinculoId ?? base.vinculoId ?? null,
    nome: atualizacao.nome || base.nome || termoParticipanteSingular.value,
    email: atualizacao.email || base.email || '',
    telefone: atualizacao.telefone || base.telefone || '',
    nivel: atualizacao.nivel || base.nivel || '',
    perfil: atualizacao.perfil || base.perfil || '',
    dataNascimento: atualizacao.dataNascimento || base.dataNascimento || '',
  }
}

function indexarAlunos(lista = []) {
  const mapa = new Map(alunosPorClienteId.value)

  for (const aluno of Array.isArray(lista) ? lista : []) {
    if (!aluno?.clienteId) {
      continue
    }

    mapa.set(aluno.clienteId, mesclarAluno(mapa.get(aluno.clienteId), aluno))
  }

  alunosPorClienteId.value = mapa
}

function normalizarListaAlunosVinculados(lista = []) {
  const mapa = new Map()

  for (const item of Array.isArray(lista) ? lista : []) {
    const aluno = normalizarAlunoVinculado(item)
    if (!aluno || mapa.has(aluno.clienteId)) {
      continue
    }

    mapa.set(aluno.clienteId, aluno)
  }

  return [...mapa.values()].sort(compararPorNome)
}

function normalizarListaClientesDisponiveis(lista = []) {
  const mapa = new Map()

  for (const item of Array.isArray(lista) ? lista : []) {
    const aluno = normalizarClienteDisponivel(item)
    if (!aluno || mapa.has(aluno.clienteId)) {
      continue
    }

    mapa.set(aluno.clienteId, aluno)
  }

  return [...mapa.values()].sort(compararPorNome)
}

function extrairListaAlunosResposta(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  if (Array.isArray(resposta?.alunos)) {
    return resposta.alunos
  }

  if (Array.isArray(resposta?.content)) {
    return resposta.content
  }

  return []
}

function extrairIdsClienteResposta(resposta, alunosNormalizados = []) {
  if (Array.isArray(resposta?.clienteIds)) {
    return normalizarIds(resposta.clienteIds)
  }

  return normalizarIds(alunosNormalizados.map((aluno) => aluno.clienteId))
}

function atualizarSelecoesIniciais(lista = []) {
  const ids = lista.map((item) => item.clienteId)
  idsIniciais.value = criarConjuntoIds(ids)
  idsAtuais.value = criarConjuntoIds(ids)
  idsMarcadosDisponiveis.value = new Set()
  idsMarcadosTurma.value = new Set()
}

function atualizarAlunosDisponiveis(lista = []) {
  const mapa = new Map()

  for (const aluno of Array.isArray(lista) ? lista : []) {
    if (!aluno?.clienteId || mapa.has(aluno.clienteId)) {
      continue
    }

    mapa.set(aluno.clienteId, aluno)
  }

  alunosDisponiveis.value = [...mapa.values()].sort(compararPorNome)
}

function campoAlunoPesquisa(aluno = {}) {
  return [
    aluno.nome,
    aluno.email,
    aluno.telefone,
    rotuloNivelBeachTennis(aluno.nivel),
    rotuloPerfilBeachTennis(aluno.perfil),
  ]
}

function campoTurmaPesquisa(item = {}) {
  return [
    item.nome,
    item.horarioInicio,
    item.professorResponsavelNome,
    String(normalizarQuantidadeAlunos(item)),
  ]
}

function formatarHorario(valor) {
  return String(valor || '').trim() || '-'
}

function formatarCapacidadeTurma(valor) {
  const capacidadeTurma = normalizarCapacidade(valor)
  return capacidadeTurma === null ? 'Ilimitada' : `${capacidadeTurma} vagas`
}

function limparMensagens() {
  erro.value = ''
  sucesso.value = ''
}

function definirErro(mensagem) {
  sucesso.value = ''
  erro.value = String(mensagem || '').trim()
}

function definirSucesso(mensagem) {
  erro.value = ''
  sucesso.value = String(mensagem || '').trim()
}

function limparSelecaoDisponiveis() {
  idsMarcadosDisponiveis.value = new Set()
}

function limparSelecaoTurma() {
  idsMarcadosTurma.value = new Set()
}

function limparEstadosBuscaVisivel() {
  limparSelecaoDisponiveis()
  limparSelecaoTurma()
}

function redefinirPaginacao() {
  paginacaoDisponiveis.value = criarPaginacaoInicial(paginacaoDisponiveis.value.size || 20)
}

function limparEstadoTurmaSelecionada() {
  turma.value = null
  alunosPorClienteId.value = new Map()
  alunosDisponiveis.value = []
  idsIniciais.value = new Set()
  idsAtuais.value = new Set()
  idsMarcadosDisponiveis.value = new Set()
  idsMarcadosTurma.value = new Set()
  buscaDisponiveisDigitada.value = ''
  buscaDisponiveisDebounced.value = ''
  buscaVinculados.value = ''
  filtroNivel.value = ''
  filtroPerfil.value = ''
  somenteAtivos.value = true
  filtrosAbertos.value = false
  abaMobileAtiva.value = 'disponiveis'
  redefinirPaginacao()
}

function invalidarRequisicoesPendentes() {
  sequenciaTela += 1
  sequenciaCarregamentoDisponiveis += 1
}

function alternarMarcadoDisponivel(aluno, marcado) {
  const clienteId = normalizarIdPositivo(aluno?.clienteId)
  if (!clienteId) {
    return
  }

  const conjunto = new Set(idsMarcadosDisponiveis.value)
  if (marcado) {
    conjunto.add(clienteId)
  } else {
    conjunto.delete(clienteId)
  }
  idsMarcadosDisponiveis.value = conjunto
}

function alternarMarcadoTurma(aluno, marcado) {
  const clienteId = normalizarIdPositivo(aluno?.clienteId)
  if (!clienteId) {
    return
  }

  const conjunto = new Set(idsMarcadosTurma.value)
  if (marcado) {
    conjunto.add(clienteId)
  } else {
    conjunto.delete(clienteId)
  }
  idsMarcadosTurma.value = conjunto
}

function selecionarTodosDisponiveis() {
  idsMarcadosDisponiveis.value = new Set(listaDisponiveisVisiveis.value.map((aluno) => aluno.clienteId))
}

function selecionarTodosVinculados() {
  idsMarcadosTurma.value = new Set(listaVinculadosExibidos.value.map((aluno) => aluno.clienteId))
}

function adicionarSelecionados() {
  const conjunto = new Set(idsAtuais.value)
  for (const clienteId of idsMarcadosDisponiveis.value) {
    conjunto.add(clienteId)
  }
  idsAtuais.value = conjunto
  limparSelecaoDisponiveis()
  limparMensagens()
}

function removerSelecionados() {
  const conjunto = new Set(idsAtuais.value)
  for (const clienteId of idsMarcadosTurma.value) {
    conjunto.delete(clienteId)
  }
  idsAtuais.value = conjunto
  limparSelecaoTurma()
  limparMensagens()
}

function desfazerAlteracoes() {
  idsAtuais.value = new Set(idsIniciais.value)
  limparEstadosBuscaVisivel()
  limparMensagens()
}

function aplicarFiltroBusca() {
  if (temporizadorBusca) {
    window.clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = window.setTimeout(() => {
    buscaDisponiveisDebounced.value = String(buscaDisponiveisDigitada.value || '').trim()
    paginacaoDisponiveis.value.page = 0
    limparSelecaoDisponiveis()
    if (turmaSelecionada.value) {
      carregarDisponiveis({ reiniciar: true })
    }
  }, 300)
}

function montarFiltrosDisponiveis() {
  return {
    page: paginacaoDisponiveis.value.page,
    size: paginacaoDisponiveis.value.size,
    busca: buscaDisponiveisDebounced.value || undefined,
    nivel: filtroNivel.value || undefined,
    perfil: filtroPerfil.value || undefined,
    ativo: somenteAtivos.value,
  }
}

function atualizarMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  definirErro(mensagem || fallback)
}

function mapearErroSalvar(error) {
  const mensagem = normalizarTextoPesquisa(error?.message)
  if (
    mensagem.includes('cliente') ||
    mensagem.includes('empresa') ||
    mensagem.includes('turma') ||
    mensagem.includes('participante')
  ) {
    return MENSAGEM_ERRO_SALVAR.value
  }

  return `Não foi possível salvar os ${termoParticipantePluralLower.value} selecionados. Tente novamente.`
}

function voltarParaTurmas() {
  router.push('/beach-tennis/turmas')
}

function selecionarTurmaParaGerenciar(item = {}) {
  const id = normalizarIdPositivo(item.id || item)
  if (!id) {
    return
  }

  limparMensagens()
  router.push({
    name: 'beach-tennis-alunos',
    query: { turmaId: String(id) },
  })
}

async function limparTurmaSelecionadaRota() {
  limparMensagens()
  if (!turmaSelecionada.value && route.name === 'beach-tennis-alunos') {
    return
  }

  await router.replace({ name: 'beach-tennis-alunos' })
}

function abrirConfirmacaoSaida(resolver) {
  confirmarSaidaAberta.value = true
  resolverSaidaPendencia = resolver
}

function fecharConfirmacaoSaida() {
  confirmarSaidaAberta.value = false
  resolverSaidaPendencia = null
}

function confirmarSaidaSemSalvar() {
  if (typeof resolverSaidaPendencia === 'function') {
    resolverSaidaPendencia()
  }
  fecharConfirmacaoSaida()
}

function cancelarSaida() {
  if (typeof resolverSaidaPendencia === 'function') {
    resolverSaidaPendencia(false)
  }
  fecharConfirmacaoSaida()
}

async function carregarContexto() {
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
}

async function carregarTurmasLista(sequenciaAtual) {
  const resposta = await buscarTurmasBeachTennis()
  if (sequenciaAtual !== sequenciaTela) {
    return
  }

  turmas.value = normalizarTurmas(resposta)
}

async function carregarTurmaAtual(sequenciaAtual) {
  if (!turmaIdSelecionada.value) {
    turma.value = null
    return
  }

  const resposta = await buscarTurmaBeachTennisOuLista(turmaIdSelecionada.value)
  if (sequenciaAtual !== sequenciaTela) {
    return
  }

  const turmaNormalizada = normalizarTurmaResumo(resposta)
  if (!turmaNormalizada) {
    throw new Error('Turma não encontrada.')
  }

  turma.value = turmaNormalizada
}

async function carregarVinculados(sequenciaAtual) {
  if (!turmaIdSelecionada.value) {
    atualizarSelecoesIniciais([])
    return
  }

  try {
    carregandoVinculados.value = true
    const resposta = await buscarAlunosTurmaBeachTennis(turmaIdSelecionada.value)
    if (sequenciaAtual !== sequenciaTela) {
      return
    }

    const alunosNormalizados = normalizarListaAlunosVinculados(extrairListaAlunosResposta(resposta))
    indexarAlunos(alunosNormalizados)
    atualizarSelecoesIniciais(alunosNormalizados)
  } finally {
    if (sequenciaAtual === sequenciaTela) {
      carregandoVinculados.value = false
    }
  }
}

async function carregarDisponiveis({ reiniciar = false } = {}) {
  if (!turmaIdSelecionada.value) {
    atualizarAlunosDisponiveis([])
    return
  }

  const sequenciaTelaAtual = sequenciaTela
  const sequenciaAtual = ++sequenciaCarregamentoDisponiveis
  const paginaBase = reiniciar ? 0 : paginacaoDisponiveis.value.page

  try {
    carregandoDisponiveis.value = true
    if (reiniciar) {
      atualizarAlunosDisponiveis([])
    }

    const resposta = await buscarClientesDisponiveisBeachTennis({
      ...montarFiltrosDisponiveis(),
      page: paginaBase,
    })
    const dadosPaginados = normalizarRespostaPaginada(resposta, {
      page: paginaBase,
      size: paginacaoDisponiveis.value.size,
    })

    if (sequenciaTelaAtual !== sequenciaTela || sequenciaAtual !== sequenciaCarregamentoDisponiveis) {
      return
    }

    const alunosNormalizados = normalizarListaClientesDisponiveis(dadosPaginados.content)
    indexarAlunos(alunosNormalizados)
    atualizarAlunosDisponiveis(reiniciar ? alunosNormalizados : [...alunosDisponiveis.value, ...alunosNormalizados])
    paginacaoDisponiveis.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }
  } finally {
    if (sequenciaTelaAtual === sequenciaTela && sequenciaAtual === sequenciaCarregamentoDisponiveis) {
      carregandoDisponiveis.value = false
    }
  }
}

async function carregarMaisDisponiveis() {
  if (paginacaoDisponiveis.value.last || carregandoDisponiveis.value || !turmaSelecionada.value) {
    return
  }

  paginacaoDisponiveis.value.page += 1
  await carregarDisponiveis({ reiniciar: false })
}

async function salvarAlteracoes() {
  if (!turmaIdSelecionada.value) {
    return
  }

  if (avisarCapacidade.value) {
    definirErro(`Há ${excedenteCapacidade.value} ${termoParticipantePluralLower.value} acima da capacidade. Remova antes de salvar.`)
    return
  }

  try {
    salvando.value = true
    limparMensagens()

    const clienteIds = [...idsAtuais.value]
    const resposta = await salvarClientesTurmaBeachTennis(turmaIdSelecionada.value, clienteIds)
    const alunosNormalizados = normalizarListaAlunosVinculados(extrairListaAlunosResposta(resposta))
    const idsResposta = extrairIdsClienteResposta(resposta, alunosNormalizados)

    indexarAlunos(alunosNormalizados)
    idsIniciais.value = criarConjuntoIds(idsResposta)
    idsAtuais.value = criarConjuntoIds(idsResposta)
    limparEstadosBuscaVisivel()

    if (turma.value) {
      turma.value = {
        ...turma.value,
        quantidadeAlunos: normalizarQuantidadeAlunos(resposta, idsResposta.length),
        vagas: Number.isFinite(Number(resposta?.vagas)) ? Number(resposta.vagas) : turma.value.vagas,
      }
    }

    definirSucesso('Participantes atualizados com sucesso.')
    window.dispatchEvent(
      new CustomEvent(EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS, {
        detail: { turmaId: turmaIdSelecionada.value, clienteIds: idsResposta },
      }),
    )
  } catch (error) {
    debugLog('beach-tennis-alunos', 'Falha ao salvar participantes', {
      mensagem: error?.message,
      detalhes: error?.detalhes,
    })
    definirErro(mapearErroSalvar(error))
  } finally {
    salvando.value = false
  }
}

async function recarregarTudo() {
  const sequenciaAtual = ++sequenciaTela

  try {
    carregando.value = true
    limparMensagens()
    await carregarContexto()

    if (sequenciaAtual !== sequenciaTela) {
      return
    }

    if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
      turmas.value = []
      limparEstadoTurmaSelecionada()
      return
    }

    await carregarTurmasLista(sequenciaAtual)
    if (sequenciaAtual !== sequenciaTela) {
      return
    }

    if (!turmaIdSelecionada.value) {
      limparEstadoTurmaSelecionada()
      return
    }

    await carregarTurmaAtual(sequenciaAtual)
    await carregarVinculados(sequenciaAtual)
    if (sequenciaAtual !== sequenciaTela) {
      return
    }

    await carregarDisponiveis({ reiniciar: true })
  } catch (error) {
    if (sequenciaAtual !== sequenciaTela) {
      return
    }
    atualizarMensagemErro(error, `Não foi possível carregar ${tituloPagina.value.toLocaleLowerCase('pt-BR')}.`)
  } finally {
    if (sequenciaAtual === sequenciaTela) {
      carregando.value = false
    }
  }
}

async function atualizarContextoEmpresa() {
  invalidarRequisicoesPendentes()
  turmas.value = []
  limparEstadoTurmaSelecionada()
  limparMensagens()

  try {
    await recarregarContextoGestaoEsportiva()
    modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()

    if (turmaSelecionada.value) {
      await limparTurmaSelecionadaRota()
      return
    }

    await recarregarTudo()
  } catch (error) {
    atualizarMensagemErro(error, 'Não foi possível atualizar o contexto da empresa.')
  }
}

function alterarAbaMobile(aba) {
  abaMobileAtiva.value = aba
}

function handleBeforeUnload(event) {
  if (!alteracoesPendentes.value) {
    return
  }

  event.preventDefault()
  event.returnValue = ''
}

onBeforeRouteLeave((_to, _from, next) => {
  if (!alteracoesPendentes.value) {
    next()
    return
  }

  abrirConfirmacaoSaida(next)
})

watch(
  () => [route.params.turmaId, route.query.turmaId],
  async () => {
    await recarregarTudo()
  },
)

watch([filtroNivel, filtroPerfil, somenteAtivos], async () => {
  if (!turmaSelecionada.value || modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
    return
  }

  limparSelecaoDisponiveis()
  paginacaoDisponiveis.value.page = 0
  await carregarDisponiveis({ reiniciar: true })
})

watch(buscaDisponiveisDigitada, () => {
  aplicarFiltroBusca()
})

watch(buscaVinculados, () => {
  limparSelecaoTurma()
})

onMounted(async () => {
  await recarregarTudo()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  window.addEventListener('beforeunload', handleBeforeUnload)
})

onBeforeUnmount(() => {
  invalidarRequisicoesPendentes()
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (temporizadorBusca) {
    window.clearTimeout(temporizadorBusca)
  }
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">{{ nomeModalidade }}</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">{{ descricaoPagina }}</p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" @click="voltarParaTurmas">Voltar</button>
        <button
          v-if="turmaSelecionada"
          class="botao secundario"
          type="button"
          :disabled="salvando"
          @click="limparTurmaSelecionadaRota"
        >
          Escolher turma
        </button>
        <button class="botao secundario" type="button" :disabled="carregando" @click="recarregarTudo">
          {{ carregando ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-else-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card feedback aviso">
      <p>Selecione uma empresa no seletor superior para gerenciar {{ termoParticipantePluralLower }} como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloEsportivoAtivo" class="card feedback aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <section v-else-if="!turmaSelecionada" class="conteudo-gerencia">
      <section class="card seletor-turmas">
        <div class="resumo-topo">
          <div>
            <p class="subtitulo-mini">{{ termoGrupoPlural }}</p>
            <h2>{{ tituloPagina }}</h2>
            <p class="resumo-descricao">Escolha uma {{ termoGrupoSingularLower }} para abrir a gestão com o contexto correto.</p>
          </div>
        </div>

        <label class="busca-turma">
          Buscar turma
          <input
            v-model="buscaTurmas"
            type="search"
            placeholder="Nome, horário ou professor"
          />
        </label>

        <section v-if="carregando && !turmas.length" class="estado-vazio compacto">
          <p>Carregando turmas...</p>
        </section>

        <section v-else-if="!turmasFiltradas.length" class="estado-vazio compacto">
          <p>Nenhuma turma encontrada para os filtros informados.</p>
        </section>

        <div v-else class="lista-turmas-selecao">
          <article
            v-for="item in turmasFiltradas"
            :key="item.id"
            class="card card-turma-selecao"
          >
            <div class="cabecalho-turma-selecao">
              <div>
                <p class="subtitulo-mini">{{ termoGrupoSingular }}</p>
                <h3>{{ item.nome }}</h3>
              </div>
              <button class="botao principal compacto" type="button" @click="selecionarTurmaParaGerenciar(item)">
                Gerenciar
              </button>
            </div>

            <div class="grid-resumo-selecao">
              <p><strong>Horário:</strong> {{ formatarHorario(item.horarioInicio) }}</p>
              <p><strong>{{ termoResponsavelSingular }}:</strong> {{ item.professorResponsavelNome || '-' }}</p>
              <p><strong>{{ termoParticipantePlural }}:</strong> {{ normalizarQuantidadeAlunos(item) }}</p>
              <p><strong>Capacidade:</strong> {{ formatarCapacidadeTurma(item.vagas) }}</p>
            </div>
          </article>
        </div>
      </section>
    </section>

    <section v-else class="conteudo-gerencia">
      <section class="card resumo-capacidade">
        <div class="resumo-topo">
          <div>
            <p class="subtitulo-mini">Turma</p>
            <h2>{{ turma?.nome || 'Carregando turma...' }}</h2>
            <p class="resumo-descricao">{{ descricaoPagina }}</p>
          </div>

          <button class="botao principal" type="button" :disabled="!podeSalvar" @click="salvarAlteracoes">
            {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>

        <div class="metricas-capacidade">
          <article class="metrica">
            <span>Quantidade atual</span>
            <strong>{{ quantidadeAtual }}</strong>
          </article>
          <article class="metrica">
            <span>Quantidade final</span>
            <strong>{{ quantidadeFinal }}</strong>
          </article>
          <article class="metrica" :class="{ alerta: avisarCapacidade }">
            <span>Capacidade</span>
            <strong>{{ mensagemCapacidade }}</strong>
          </article>
          <article class="metrica">
            <span>Vagas disponíveis</span>
            <strong>{{ textoVagasDisponiveis }}</strong>
          </article>
        </div>

        <p v-if="quantidadeAlterada" class="resumo-alteracoes">
          {{ quantidadeAlterada }} alteração(ões) pendente(s).
        </p>
        <p v-if="avisarCapacidade" class="resumo-alerta">
          A seleção atual excede a capacidade em {{ excedenteCapacidade }} {{ termoParticipantePluralLower }}. Remova antes de salvar.
        </p>
      </section>

      <div class="botoes-mobile">
        <button
          class="aba-mobile"
          type="button"
          :class="{ ativa: abaMobileAtiva === 'disponiveis' }"
          :aria-selected="abaMobileAtiva === 'disponiveis'"
          @click="alterarAbaMobile('disponiveis')"
        >
          Disponíveis
        </button>
        <button
          class="aba-mobile"
          type="button"
          :class="{ ativa: abaMobileAtiva === 'turma' }"
          :aria-selected="abaMobileAtiva === 'turma'"
          @click="alterarAbaMobile('turma')"
        >
          Na turma
        </button>
      </div>

      <div class="layout-gerencia">
        <section class="coluna" :class="{ ativa: abaMobileAtiva === 'disponiveis' }">
          <header class="cabecalho-coluna">
            <div>
              <p class="subtitulo-mini">{{ termoParticipantePlural }} disponíveis</p>
              <h2>Disponíveis</h2>
              <p>{{ subtituloColunaDisponiveis }}</p>
            </div>

            <div class="cabecalho-acoes">
              <button class="botao secundario compacto" type="button" @click="selecionarTodosDisponiveis">Selecionar visíveis</button>
              <button class="botao secundario compacto" type="button" @click="limparSelecaoDisponiveis">Limpar seleção</button>
              <button class="botao principal compacto" type="button" :disabled="selecionadosDisponiveis === 0" @click="adicionarSelecionados">
                Adicionar selecionados
              </button>
            </div>
          </header>

          <div class="barra-filtros">
            <label>
              Buscar
              <input
                v-model="buscaDisponiveisDigitada"
                type="search"
                placeholder="Nome, e-mail ou telefone"
              />
            </label>
            <button class="botao secundario compacto" type="button" @click="filtrosAbertos = !filtrosAbertos">
              Filtrar
            </button>
          </div>

          <div v-if="filtrosAbertos" class="filtros-recolhiveis">
            <label>
              Nível
              <select v-model="filtroNivel">
                <option value="">Todos</option>
                <option v-for="opcao in OPCOES_NIVEL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>
            <label>
              Perfil
              <select v-model="filtroPerfil">
                <option value="">Todos</option>
                <option v-for="opcao in OPCOES_PERFIL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>
            <label class="checkbox-line">
              <input v-model="somenteAtivos" type="checkbox" />
              Somente ativos
            </label>
          </div>

          <section v-if="carregandoDisponiveis && !alunosDisponiveis.length" class="estado-vazio compacto">
            <p>Carregando {{ termoParticipantePluralLower }} disponíveis...</p>
          </section>

          <section v-else-if="!listaDisponiveisVisiveis.length" class="estado-vazio compacto">
            <p>Nenhum {{ termoParticipanteSingularLower }} disponível com estes filtros.</p>
          </section>

          <div v-else class="lista-participantes">
            <article
              v-for="aluno in listaDisponiveisVisiveis"
              :key="aluno.clienteId"
              class="participante-card"
              :class="{ selecionado: idsMarcadosDisponiveis.has(aluno.clienteId) }"
              tabindex="0"
              role="button"
              :aria-pressed="idsMarcadosDisponiveis.has(aluno.clienteId)"
              @click="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(aluno.clienteId))"
              @keydown.enter.prevent="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(aluno.clienteId))"
              @keydown.space.prevent="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(aluno.clienteId))"
            >
              <label class="participante-selecao">
                <input
                  :checked="idsMarcadosDisponiveis.has(aluno.clienteId)"
                  type="checkbox"
                  @change="alternarMarcadoDisponivel(aluno, $event.target.checked)"
                />
                <span>
                  <strong>{{ aluno.nome }}</strong>
                  <small>
                    <span v-if="aluno.email">{{ aluno.email }}</span>
                    <span v-if="aluno.telefone"> · {{ aluno.telefone }}</span>
                    <span v-if="formatarDataBrasileira(aluno.dataNascimento)"> · {{ formatarDataBrasileira(aluno.dataNascimento) }}</span>
                  </small>
                </span>
              </label>

              <div class="chips-participante">
                <span v-if="rotuloNivelBeachTennis(aluno.nivel)" class="chip">{{ rotuloNivelBeachTennis(aluno.nivel) }}</span>
                <span v-if="rotuloPerfilBeachTennis(aluno.perfil)" class="chip sutileza">
                  {{ rotuloPerfilBeachTennis(aluno.perfil) }}
                </span>
              </div>
            </article>
          </div>

          <footer class="rodape-coluna">
            <button
              class="botao secundario"
              type="button"
              :disabled="paginacaoDisponiveis.last || carregandoDisponiveis"
              @click="carregarMaisDisponiveis"
            >
              {{ carregandoDisponiveis ? 'Carregando...' : 'Carregar mais' }}
            </button>
            <p>{{ paginacaoDisponiveis.totalElements }} resultado(s) no servidor.</p>
          </footer>
        </section>

        <section class="coluna" :class="{ ativa: abaMobileAtiva === 'turma' }">
          <header class="cabecalho-coluna">
            <div>
              <p class="subtitulo-mini">{{ termoParticipantePlural }} na turma</p>
              <h2>Na turma</h2>
              <p>{{ subtituloColunaTurma }}</p>
            </div>

            <div class="cabecalho-acoes">
              <button class="botao secundario compacto" type="button" @click="selecionarTodosVinculados">Selecionar visíveis</button>
              <button class="botao secundario compacto" type="button" @click="limparSelecaoTurma">Limpar seleção</button>
              <button class="botao perigo compacto" type="button" :disabled="selecionadosTurma === 0" @click="removerSelecionados">
                Remover selecionados
              </button>
            </div>
          </header>

          <label class="busca-interna">
            Buscar dentro da turma
            <input v-model="buscaVinculados" type="search" placeholder="Nome, e-mail ou telefone" />
          </label>

          <section v-if="carregandoVinculados && !listaVinculadosExibidos.length" class="estado-vazio compacto">
            <p>Carregando {{ termoParticipantePluralLower }} vinculados...</p>
          </section>

          <section v-else-if="!listaVinculadosExibidos.length" class="estado-vazio compacto">
            <p>Nenhum {{ termoParticipanteSingularLower }} vinculado a esta {{ termoGrupoSingularLower }}.</p>
          </section>

          <div v-else class="lista-participantes">
            <article
              v-for="aluno in listaVinculadosExibidos"
              :key="aluno.clienteId"
              class="participante-card vinculado"
              :class="{ selecionado: idsMarcadosTurma.has(aluno.clienteId) }"
              tabindex="0"
              role="button"
              :aria-pressed="idsMarcadosTurma.has(aluno.clienteId)"
              @click="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(aluno.clienteId))"
              @keydown.enter.prevent="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(aluno.clienteId))"
              @keydown.space.prevent="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(aluno.clienteId))"
            >
              <label class="participante-selecao">
                <input
                  :checked="idsMarcadosTurma.has(aluno.clienteId)"
                  type="checkbox"
                  @change="alternarMarcadoTurma(aluno, $event.target.checked)"
                />
                <span>
                  <strong>{{ aluno.nome }}</strong>
                  <small>
                    <span v-if="aluno.email">{{ aluno.email }}</span>
                    <span v-if="aluno.telefone"> · {{ aluno.telefone }}</span>
                    <span v-if="formatarDataBrasileira(aluno.dataNascimento)"> · {{ formatarDataBrasileira(aluno.dataNascimento) }}</span>
                  </small>
                </span>
              </label>

              <div class="chips-participante">
                <span v-if="rotuloNivelBeachTennis(aluno.nivel)" class="chip">{{ rotuloNivelBeachTennis(aluno.nivel) }}</span>
                <span v-if="rotuloPerfilBeachTennis(aluno.perfil)" class="chip sutileza">
                  {{ rotuloPerfilBeachTennis(aluno.perfil) }}
                </span>
              </div>
            </article>
          </div>

          <footer class="rodape-coluna">
            <button class="botao secundario" type="button" @click="desfazerAlteracoes">Desfazer alterações</button>
            <p>{{ idsAtuais.size }} {{ termoParticipantePluralLower }} na {{ termoGrupoSingularLower }}.</p>
          </footer>
        </section>
      </div>

      <footer class="barra-fixa-mobile">
        <div>
          <strong>{{ quantidadeAlterada }} alteração(ões)</strong>
          <span v-if="avisarCapacidade">Excede a capacidade em {{ excedenteCapacidade }}</span>
          <span v-else>{{ textoVagasDisponiveis }}</span>
        </div>
        <div class="barra-fixa-acoes">
          <button class="botao secundario" type="button" @click="desfazerAlteracoes">Desfazer</button>
          <button class="botao principal" type="button" :disabled="!podeSalvar" @click="salvarAlteracoes">
            {{ salvando ? 'Salvando...' : 'Salvar alterações' }}
          </button>
        </div>
      </footer>
    </section>

    <section
      v-if="confirmarSaidaAberta"
      class="modal-fundo"
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirmar-saida-titulo"
    >
      <article class="card modal-card">
        <h2 id="confirmar-saida-titulo">Alterações não salvas</h2>
        <p>Existem alterações não salvas. Deseja sair mesmo assim?</p>
        <div class="modal-acoes">
          <button class="botao secundario" type="button" @click="cancelarSaida">Continuar editando</button>
          <button class="botao perigo" type="button" @click="confirmarSaidaSemSalvar">Sair mesmo assim</button>
        </div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 20px;
  color: #0f172a;
}

*,
*::before,
*::after {
  box-sizing: border-box;
}

.cabecalho-pagina,
.card {
  background: #ffffff;
  border: 1px solid #dbeafe;
  border-radius: 20px;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 20px;
  padding: 24px;
}

.subtitulo,
.subtitulo-mini {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: #0f766e;
}

.cabecalho-pagina h1,
.resumo-topo h2,
.cabecalho-turma-selecao h3,
.cabecalho-coluna h2,
.modal-card h2 {
  margin: 0;
}

.descricao,
.resumo-descricao,
.cabecalho-coluna p,
.grid-resumo-selecao p,
.rodape-coluna p,
.estado-vazio p,
.feedback p,
.modal-card p {
  margin: 0;
  color: #475569;
}

.acoes-cabecalho,
.cabecalho-acoes,
.modal-acoes,
.barra-fixa-acoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao {
  appearance: none;
  border: none;
  border-radius: 12px;
  padding: 11px 16px;
  font-weight: 700;
  cursor: pointer;
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
}

.botao:hover:not(:disabled) {
  transform: translateY(-1px);
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.botao.compacto {
  padding: 9px 12px;
  font-size: 13px;
}

.botao.principal {
  background: linear-gradient(135deg, #0f766e, #14b8a6);
  color: #ffffff;
}

.botao.secundario {
  background: #eff6ff;
  color: #1d4ed8;
}

.botao.perigo {
  background: #fee2e2;
  color: #b91c1c;
}

.feedback {
  padding: 16px 18px;
}

.feedback.erro {
  border-color: #fecaca;
  background: #fff1f2;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

.feedback.aviso {
  border-color: #fde68a;
  background: #fffbeb;
}

.conteudo-gerencia {
  display: grid;
  gap: 20px;
  min-width: 0;
}

.resumo-capacidade,
.seletor-turmas {
  padding: 22px;
  min-width: 0;
}

.resumo-topo,
.cabecalho-turma-selecao,
.cabecalho-coluna {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
  min-width: 0;
}

.metricas-capacidade {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
  margin-top: 18px;
}

.metrica {
  padding: 16px;
  border-radius: 16px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.metrica span {
  display: block;
  margin-bottom: 6px;
  color: #475569;
}

.metrica strong {
  font-size: 22px;
}

.metrica.alerta {
  border-color: #f59e0b;
  background: #fffbeb;
}

.resumo-alteracoes,
.resumo-alerta {
  margin-top: 14px;
}

.resumo-alerta {
  color: #b45309;
  font-weight: 700;
}

.busca-turma,
.busca-interna,
.barra-filtros label,
.filtros-recolhiveis label {
  display: grid;
  gap: 8px;
  font-weight: 600;
  color: #0f172a;
  min-width: 0;
}

.busca-turma {
  margin-top: 18px;
}

input,
select {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 11px 12px;
  background: #ffffff;
  color: #0f172a;
}

.lista-turmas-selecao {
  display: grid;
  gap: 14px;
  margin-top: 18px;
  min-width: 0;
}

.card-turma-selecao {
  padding: 18px;
  min-width: 0;
}

.grid-resumo-selecao {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  margin-top: 14px;
}

.botoes-mobile {
  display: none;
}

.layout-gerencia {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  min-width: 0;
}

.coluna {
  display: grid;
  gap: 16px;
  padding: 22px;
  border-radius: 20px;
  border: 1px solid #dbeafe;
  background: #ffffff;
  box-shadow: 0 16px 40px rgba(15, 23, 42, 0.06);
  min-width: 0;
}

.barra-filtros,
.filtros-recolhiveis {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.checkbox-line {
  grid-auto-flow: column;
  justify-content: start;
  align-items: center;
}

.checkbox-line input {
  width: auto;
}

.estado-vazio {
  padding: 28px 18px;
  border-radius: 16px;
  border: 1px dashed #cbd5e1;
  background: #f8fafc;
  text-align: center;
}

.lista-participantes {
  display: grid;
  gap: 12px;
  min-width: 0;
}

.participante-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid #dbeafe;
  background: #f8fafc;
  cursor: pointer;
  min-width: 0;
  min-height: 44px;
}

.participante-card:focus-within,
.participante-card:focus-visible {
  border-color: #0f766e;
  box-shadow: 0 0 0 3px rgba(15, 118, 110, 0.14);
}

.participante-card.vinculado {
  background: #ecfeff;
}

.participante-card.selecionado {
  border-color: #0f766e;
  box-shadow: inset 0 0 0 1px #0f766e;
}

.participante-selecao {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.participante-selecao input {
  width: auto;
  margin-top: 0;
}

.participante-selecao strong {
  display: block;
}

.participante-selecao small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  overflow-wrap: anywhere;
}

.chips-participante {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 700;
}

.chip.sutileza {
  background: #e2e8f0;
  color: #334155;
}

.rodape-coluna {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: center;
  min-width: 0;
}

.barra-fixa-mobile {
  display: none;
}

.modal-fundo {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 20px;
  background: rgba(15, 23, 42, 0.55);
}

.modal-card {
  width: min(100%, 440px);
  padding: 24px;
}

@media (max-width: 960px) {
  .cabecalho-pagina,
  .resumo-topo,
  .cabecalho-coluna,
  .cabecalho-turma-selecao,
  .rodape-coluna {
    grid-template-columns: 1fr;
    display: grid;
  }

  .metricas-capacidade,
  .grid-resumo-selecao,
  .layout-gerencia {
    grid-template-columns: 1fr;
  }

  .botoes-mobile {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .aba-mobile {
    appearance: none;
    border: 1px solid #cbd5e1;
    border-radius: 14px;
    background: #ffffff;
    padding: 12px;
    font-weight: 700;
    color: #334155;
    min-height: 44px;
  }

  .aba-mobile.ativa {
    border-color: #0f766e;
    background: #ccfbf1;
    color: #115e59;
  }

  .coluna {
    display: none;
  }

  .coluna.ativa {
    display: grid;
  }

  .conteudo-gerencia {
    padding-bottom: 180px;
  }

  .busca-turma,
  .busca-interna,
  .barra-filtros {
    position: sticky;
    top: 0;
    z-index: 4;
    background: #ffffff;
    padding-top: 8px;
  }

  .coluna {
    padding-bottom: 18px;
  }

  .barra-fixa-mobile {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: grid;
    gap: 12px;
    padding: 16px;
    border-radius: 18px;
    border: 1px solid #dbeafe;
    background: rgba(255, 255, 255, 0.98);
    box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
    max-width: calc(100vw - 32px);
  }

  .barra-fixa-acoes .botao,
  .rodape-coluna .botao,
  .cabecalho-acoes .botao {
    width: 100%;
  }
}
</style>
