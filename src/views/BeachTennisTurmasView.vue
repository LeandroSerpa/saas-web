<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAlunosTurmaBeachTennis,
  buscarClientes,
  buscarFuncionarios,
  buscarStatusFinanceiroMinhaEmpresa,
  buscarTurmasBeachTennis,
  criarTurmaBeachTennis,
  atualizarTurmaBeachTennis,
  excluirTurmaBeachTennis,
  modoVisualizacaoEmpresaAtivo,
  salvarAlunosTurmaBeachTennis,
} from '@/services/api'
import {
  OPCOES_DIAS_SEMANA_BEACH_TENNIS,
  OPCOES_NIVEL_BEACH_TENNIS,
  formatarDataBrasileira,
  normalizarArrayBeachTennis,
  rotuloDiaBeachTennis,
  rotuloFrequenciaSemanalBeachTennis,
  rotuloNivelBeachTennis,
  rotuloPerfilBeachTennis,
  rotuloPlanoBeachTennis,
} from '@/utils/beachTennis'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'

const turmas = ref([])
const clientes = ref([])
const funcionarios = ref([])
const alunosTurmaSelecionada = ref([])
const alunosSelecionadosIds = ref([])
const carregando = ref(true)
const carregandoVinculos = ref(false)
const salvandoTurma = ref(false)
const salvandoVinculos = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const turmaEditandoId = ref(null)
const turmaSelecionadaId = ref('')
const filtroBuscaAluno = ref('')
const filtroNivelAluno = ref('')
const statusFinanceiro = ref(null)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const turma = ref(criarTurmaInicial())
const router = useRouter()
const nomeCampoRef = ref(null)
const nivelCampoRef = ref(null)
const horarioCampoRef = ref(null)
const duracaoCampoRef = ref(null)
const vagasCampoRef = ref(null)
const diasCampoRef = ref(null)
const professorCampoRef = ref(null)
const ativoCampoRef = ref(null)
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Participante')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Participantes')
const termoResponsavelSingular = computed(() => contextoEsportivo.value?.termoResponsavelSingular || 'Profissional')
const termoResponsavelPlural = computed(() => contextoEsportivo.value?.termoResponsavelPlural || 'Profissionais')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
const termoAtividadeSingular = computed(() => contextoEsportivo.value?.termoAtividadeSingular || 'Atividade')
const nomeEventoLivre = computed(() => contextoEsportivo.value?.nomeEventoLivre || 'Jogo livre')
const tituloPagina = computed(() =>
  nomeModalidade.value === 'Beach Tennis'
    ? 'Turmas Beach Tennis'
    : `${termoGrupoPlural.value} de ${nomeModalidade.value}`,
)
const descricaoPagina = computed(() =>
  `Organize ${termoGrupoPlural.value.toLocaleLowerCase('pt-BR')}, acompanhe vagas e faça o vinculo manual de ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')}.`,
)
const descricaoFormulario = computed(() =>
  `Cadastre ${termoGrupoPlural.value.toLocaleLowerCase('pt-BR')}, horarios e ${termoResponsavelSingular.value.toLocaleLowerCase('pt-BR')}s sem alterar a estrutura atual do modulo.`,
)
const descricaoLista = computed(() =>
  `Cards por ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')} com situacao, nivel e quantidade de ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} vinculados.`,
)

const turmaSelecionada = computed(() =>
  turmas.value.find((item) => String(item.id) === String(turmaSelecionadaId.value)) || null,
)

const nivelTurmaSelecionada = computed(() => String(turmaSelecionada.value?.nivelBeachTennis || '').trim())
const quantidadeAlunosSelecionados = computed(() => alunosSelecionadosIds.value.length)
const quantidadeAlunosVinculados = computed(() => alunosTurmaSelecionada.value.length || obterQuantidadeAlunos(turmaSelecionada.value))
const turmaCheia = computed(() => {
  const vagas = Number(turmaSelecionada.value?.vagas || 0)
  return Boolean(vagas > 0 && quantidadeAlunosVinculados.value >= vagas)
})
const professoresDisponiveis = computed(() =>
  [...funcionarios.value]
    .filter((item) => item && item.ativo !== false)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')),
)
const temProfessoresDisponiveis = computed(() => professoresDisponiveis.value.length > 0)
const alunosDisponiveis = computed(() =>
  [...clientes.value]
    .filter((aluno) => filtrarAlunoDisponivel(aluno))
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')),
)
const gruposAlunosVinculados = computed(() => agruparAlunos(alunosTurmaSelecionada.value))
const gruposAlunosDisponiveis = computed(() => agruparAlunos(alunosDisponiveis.value))

function criarTurmaInicial() {
  return {
    nome: '',
    nivelBeachTennis: '',
    diasSemana: [],
    horarioInicio: '',
    duracaoMinutos: 60,
    vagas: '',
    professorResponsavelId: '',
    observacoes: '',
    ativo: true,
  }
}

function normalizarTurmaFormulario(item = {}) {
  return {
    nome: item.nome || '',
    nivelBeachTennis: item.nivelBeachTennis || item.nivel || '',
    diasSemana: normalizarArrayBeachTennis(item.diasSemana || item.dias || item.diasAtendimento),
    horarioInicio: item.horarioInicio || item.horaInicio || '',
    duracaoMinutos: Number(item.duracaoMinutos || item.duracao || 60) || 60,
    vagas: item.vagas ?? '',
    professorResponsavelId:
      item.professorResponsavelId || item.professorId || item.funcionarioId || item.responsavelId || '',
    observacoes: item.observacoes || item.observacao || '',
    ativo: item.ativo !== false,
  }
}

function montarPayloadTurma(base = turma.value, overrides = {}) {
  const dados = {
    ...base,
    ...overrides,
  }

  return {
    nome: String(dados.nome || '').trim(),
    nivel: String(dados.nivelBeachTennis || dados.nivel || '').trim().toUpperCase() || null,
    diasSemana: normalizarDiasSemanaPayload(dados.diasSemana),
    horarioInicio: normalizarHorarioPayload(dados.horarioInicio),
    duracaoMinutos: normalizarInteiroPositivo(dados.duracaoMinutos, 60),
    vagas: normalizarInteiroPositivo(dados.vagas, null),
    funcionarioId: normalizarIdOpcional(dados.professorResponsavelId || dados.funcionarioId),
    ativo: dados.ativo !== false,
    observacoes: normalizarTextoOpcional(dados.observacoes),
  }
}

function normalizarTurmas(lista = []) {
  return lista.map((item) => {
    const turmaNormalizada = normalizarTurmaFormulario(item)
    return {
      ...item,
      ...turmaNormalizada,
      vagas: item.vagas ?? turmaNormalizada.vagas,
      diasSemana: turmaNormalizada.diasSemana,
    }
  })
}

function normalizarAluno(aluno = {}) {
  return {
    ...aluno,
    id: aluno.id ?? aluno.alunoId ?? aluno.clienteId ?? aluno.pessoaId ?? '',
    nome: aluno.nome || aluno.nomeCompleto || aluno.clienteNome || aluno.alunoNome || termoParticipanteSingular.value,
    telefone: aluno.telefone || '',
    email: aluno.email || '',
    dataNascimento: aluno.dataNascimento || aluno.nascimento || '',
    perfilBeachTennis: aluno.perfilBeachTennis || '',
    nivelBeachTennis: aluno.nivelBeachTennis || '',
    frequenciaSemanalBeachTennis: aluno.frequenciaSemanalBeachTennis || '',
    planoBeachTennis: aluno.planoBeachTennis || '',
    observacaoBeachTennis: aluno.observacaoBeachTennis || '',
  }
}

function normalizarListaAlunos(lista = []) {
  return lista.map((item) => normalizarAluno(typeof item === 'object' ? item : { id: item }))
}

function obterChaveAluno(aluno = {}) {
  return String(aluno.id || aluno.alunoId || aluno.clienteId || '').trim()
}

function obterNomeResponsavel(item = {}) {
  return item.nome || item.nomeCompleto || item.apelido || item.cargo || termoResponsavelSingular.value
}

function obterQuantidadeAlunos(item = {}) {
  const candidatos = [
    item.quantidadeAlunos,
    item.totalAlunos,
    item.alunosCount,
    item.alunosVinculadosCount,
    Array.isArray(item.alunosVinculados) ? item.alunosVinculados.length : null,
    Array.isArray(item.alunos) ? item.alunos.length : null,
  ]

  const numero = candidatos.find((valor) => Number.isFinite(Number(valor)) && Number(valor) >= 0)
  return Number.isFinite(Number(numero)) ? Number(numero) : 0
}

function estaAtiva(item = {}) {
  return item.ativo !== false
}

function estaCheia(item = {}) {
  const vagas = Number(item.vagas || 0)
  return Boolean(vagas > 0 && obterQuantidadeAlunos(item) >= vagas)
}

function filtrarAlunoDisponivel(aluno = {}) {
  const termoBusca = normalizarTexto(filtroBuscaAluno.value)
  const nivelFiltro = String(filtroNivelAluno.value || '').trim().toUpperCase()

  if (nivelFiltro && String(aluno.nivelBeachTennis || '').trim().toUpperCase() !== nivelFiltro) {
    return false
  }

  if (!termoBusca) {
    return true
  }

  const campos = [
    aluno.nome,
    aluno.email,
    aluno.telefone,
    rotuloPerfilBeachTennis(aluno.perfilBeachTennis),
    rotuloNivelBeachTennis(aluno.nivelBeachTennis),
    rotuloFrequenciaSemanalBeachTennis(aluno.frequenciaSemanalBeachTennis),
    rotuloPlanoBeachTennis(aluno.planoBeachTennis),
  ]

  return campos.some((valor) => normalizarTexto(valor).includes(termoBusca))
}

function agruparAlunos(lista = []) {
  const grupos = {
    ALUNO_AULA: [],
    PARTICIPANTE_PLAY: [],
    ALUNO_E_PLAY: [],
    SEM_PERFIL: [],
  }

  for (const aluno of lista) {
    const perfil = String(aluno.perfilBeachTennis || '').trim().toUpperCase()
    const chave = grupos[perfil] ? perfil : 'SEM_PERFIL'
    grupos[chave].push(aluno)
  }

  return [
    {
      chave: 'ALUNO_AULA',
      titulo: `${termoParticipantePlural.value} de ${termoAtividadeSingular.value.toLocaleLowerCase('pt-BR')}`,
      items: grupos.ALUNO_AULA,
    },
    {
      chave: 'PARTICIPANTE_PLAY',
      titulo: `${termoParticipantePlural.value} de ${nomeEventoLivre.value}`,
      items: grupos.PARTICIPANTE_PLAY,
    },
    { chave: 'ALUNO_E_PLAY', titulo: `${termoParticipantePlural.value} mistos`, items: grupos.ALUNO_E_PLAY },
    { chave: 'SEM_PERFIL', titulo: 'Sem perfil informado', items: grupos.SEM_PERFIL },
  ]
}

function nivelIncompatível(aluno = {}) {
  const nivelTurma = String(nivelTurmaSelecionada.value || '').trim().toUpperCase()
  const nivelAluno = String(aluno.nivelBeachTennis || '').trim().toUpperCase()

  if (!nivelTurma || !nivelAluno) {
    return false
  }

  return nivelTurma !== nivelAluno
}

function turmaCheiaParaCard(item = {}) {
  return estaCheia(item)
}

function rotuloNivel(item = {}) {
  return rotuloNivelBeachTennis(item.nivelBeachTennis || item.nivel)
}

function rotuloDias(item = {}) {
  const dias = normalizarArrayBeachTennis(item.diasSemana || item.dias || [])
  return dias.map((dia) => rotuloDiaBeachTennis(dia)).filter(Boolean)
}

function formatarHorario(valor) {
  return String(valor || '').trim() || '-'
}

function selecionarTurma(item = {}) {
  turmaSelecionadaId.value = String(item.id || '')
  carregarAlunosTurma(String(item.id || ''))
}

function editarTurma(item = {}) {
  turmaEditandoId.value = item.id
  mensagemSucesso.value = ''
  erro.value = ''
  turma.value = normalizarTurmaFormulario(item)
  selecionarTurma(item)
}

function cancelarEdicao(limparMensagens = true) {
  turmaEditandoId.value = null
  turma.value = criarTurmaInicial()

  if (limparMensagens) {
    mensagemSucesso.value = ''
  }
}

function limparSelecaoAlunos() {
  alunosTurmaSelecionada.value = []
  alunosSelecionadosIds.value = []
}

async function carregarTurmas() {
  try {
    const resposta = await buscarTurmasBeachTennis()
    turmas.value = normalizarTurmas(Array.isArray(resposta) ? resposta : [])

    if (turmaSelecionadaId.value && !turmas.value.some((item) => String(item.id) === String(turmaSelecionadaId.value))) {
      turmaSelecionadaId.value = ''
      limparSelecaoAlunos()
    }
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as turmas.')
    console.error(error)
  }
}

async function carregarBase() {
  try {
    const [clientesResp, funcionariosResp, statusResp] = await Promise.allSettled([
      buscarClientes(),
      buscarFuncionarios(),
      buscarStatusFinanceiroMinhaEmpresa(),
    ])

    if (clientesResp.status === 'fulfilled') {
      clientes.value = normalizarListaAlunos(Array.isArray(clientesResp.value) ? clientesResp.value : [])
    } else if (!clientes.value.length) {
      erro.value = obterMensagemErro(clientesResp.reason, 'Não foi possível carregar os clientes.')
    }

    if (funcionariosResp.status === 'fulfilled') {
      funcionarios.value = Array.isArray(funcionariosResp.value) ? funcionariosResp.value : []
    } else if (!funcionarios.value.length && !erro.value) {
      erro.value = obterMensagemErro(funcionariosResp.reason, 'Não foi possível carregar os funcionários.')
    }

    if (statusResp.status === 'fulfilled') {
      statusFinanceiro.value = statusResp.value
    } else {
      statusFinanceiro.value = null
    }
  } finally {
    // Sem ação adicional: os erros parciais já são tratados acima.
  }
}

async function carregarTudo() {
  await carregarContextoGestaoEsportiva()

  if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
    turmas.value = []
    clientes.value = []
    funcionarios.value = []
    statusFinanceiro.value = null
    limparSelecaoAlunos()
    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''
  mensagemSucesso.value = ''

  try {
    await Promise.all([carregarTurmas(), carregarBase()])

    if (turmaSelecionadaId.value) {
      await carregarAlunosTurma(turmaSelecionadaId.value, { silencioso: true })
    }
  } finally {
    carregando.value = false
  }
}

async function salvarTurma() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  const validacao = validarTurmaFormulario()
  if (validacao) {
    erro.value = validacao.mensagem
    await nextTick()
    focarCampoFormulario(validacao.campo)
    return
  }

  try {
    salvandoTurma.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    if (!turmaEditandoId.value && empresaBloqueadaFinanceiro()) {
      erro.value = 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.'
      return
    }

    const payload = montarPayloadTurma()

    if (turmaEditandoId.value) {
      await atualizarTurmaBeachTennis(turmaEditandoId.value, payload)
      mensagemSucesso.value = `${termoGrupoSingular.value} atualizada com sucesso.`
    } else {
      const resposta = await criarTurmaBeachTennis(payload)
      mensagemSucesso.value = `${termoGrupoSingular.value} cadastrada com sucesso.`
      const novaTurmaId = resposta?.id || resposta?.turmaId
      if (novaTurmaId) {
        turmaSelecionadaId.value = String(novaTurmaId)
      }
    }

    cancelarEdicao(false)
    await carregarTurmas()
    if (turmaSelecionadaId.value) {
      await carregarAlunosTurma(turmaSelecionadaId.value, { silencioso: true })
    }
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      turmaEditandoId.value
        ? `Não foi possível atualizar a ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`
        : `Não foi possível cadastrar a ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    )
    console.error(error)
  } finally {
    salvandoTurma.value = false
  }
}

async function alternarAtivoTurma(item) {
  try {
    erro.value = ''
    mensagemSucesso.value = ''
    await atualizarTurmaBeachTennis(item.id, montarPayloadTurma(normalizarTurmaFormulario(item), { ativo: !estaAtiva(item) }))
    mensagemSucesso.value = estaAtiva(item)
      ? `${termoGrupoSingular.value} inativada com sucesso.`
      : `${termoGrupoSingular.value} ativada com sucesso.`
    await carregarTurmas()
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      `Não foi possível alterar o status da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    )
    console.error(error)
  }
}

async function removerTurma(item) {
  const confirmou = window.confirm(
    `Deseja excluir ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')} "${item?.nome || ''}"?`,
  )
  if (!confirmou) {
    return
  }

  const motivo = window.prompt('Motivo da exclusão (opcional):', '')
  if (motivo === null) {
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''
    await excluirTurmaBeachTennis(item.id, String(motivo || '').trim())
    mensagemSucesso.value = `${termoGrupoSingular.value} enviada para a lixeira com sucesso.`

    if (String(turmaSelecionadaId.value) === String(item.id)) {
      turmaSelecionadaId.value = ''
      limparSelecaoAlunos()
    }

    if (String(turmaEditandoId.value) === String(item.id)) {
      cancelarEdicao(false)
    }

    await carregarTurmas()
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      `Não foi possível excluir a ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    )
    console.error(error)
  }
}

async function carregarAlunosTurma(turmaId, { silencioso = false } = {}) {
  if (!turmaId) {
    limparSelecaoAlunos()
    return
  }

  try {
    carregandoVinculos.value = !silencioso
    if (!silencioso) {
      erro.value = ''
    }

    const resposta = await buscarAlunosTurmaBeachTennis(turmaId)
    const lista = normalizarListaAlunos(Array.isArray(resposta) ? resposta : [])
    alunosTurmaSelecionada.value = lista
    alunosSelecionadosIds.value = lista.map((aluno) => obterChaveAluno(aluno)).filter(Boolean)
  } catch (error) {
    if (!silencioso) {
      erro.value = obterMensagemErro(
        error,
        `Não foi possível carregar os ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} vinculados.`,
      )
    }
    console.error(error)
  } finally {
    carregandoVinculos.value = false
  }
}

function alternarAlunoSelecionado(aluno, selecionado) {
  const chave = obterChaveAluno(aluno)
  if (!chave) {
    return
  }

  const conjunto = new Set(alunosSelecionadosIds.value.map((item) => String(item)))
  if (selecionado) {
    conjunto.add(chave)
  } else {
    conjunto.delete(chave)
  }
  alunosSelecionadosIds.value = [...conjunto]
}

async function salvarVinculos() {
  if (!turmaSelecionadaId.value) {
    erro.value = `Selecione ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')} para vincular ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')}.`
    return
  }

  try {
    salvandoVinculos.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    await salvarAlunosTurmaBeachTennis(turmaSelecionadaId.value, alunosSelecionadosIds.value)
    mensagemSucesso.value = `Vínculos de ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')} salvos com sucesso.`
    await carregarAlunosTurma(turmaSelecionadaId.value)
    await carregarTurmas()
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      `Não foi possível salvar os vínculos de ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    )
    console.error(error)
  } finally {
    salvandoVinculos.value = false
  }
}

function aplicarFiltroNivel(valor) {
  filtroNivelAluno.value = valor
}

function limparFiltrosAlunos() {
  filtroBuscaAluno.value = ''
  filtroNivelAluno.value = ''
}

function empresaBloqueadaFinanceiro() {
  return String(statusFinanceiro.value?.statusFinanceiro || statusFinanceiro.value?.status || '')
    .trim()
    .toUpperCase() === 'BLOQUEADA_FINANCEIRO'
}

function horarioValido(valor) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor || '').trim())
}

function numeroPositivoOuVazio(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return true
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0
}

function normalizarInteiroPositivo(valor, fallback = null) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return fallback
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0 ? numero : fallback
}

function normalizarIdOpcional(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function normalizarTextoOpcional(valor) {
  const texto = String(valor ?? '').trim()
  return texto || null
}

function normalizarHorarioPayload(valor) {
  const texto = String(valor ?? '').trim()
  return horarioValido(texto) ? texto : null
}

function normalizarDiasSemanaPayload(lista = []) {
  return normalizarArrayBeachTennis(lista).join(',')
}

function validarTurmaFormulario() {
  const nome = String(turma.value.nome || '').trim()
  if (!nome) {
    return {
      campo: 'nome',
      mensagem: `Informe o nome da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    }
  }

  const nivel = String(turma.value.nivelBeachTennis || '').trim()
  if (!nivel) {
    return {
      campo: 'nivel',
      mensagem: `Selecione o nível da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    }
  }

  const horario = String(turma.value.horarioInicio || '').trim()
  if (!horario) {
    return {
      campo: 'horario',
      mensagem: 'Informe o horário de início.',
    }
  }

  if (!horarioValido(horario)) {
    return {
      campo: 'horario',
      mensagem: 'Informe um horário de início válido no formato HH:mm.',
    }
  }

  if (!numeroPositivoOuVazio(turma.value.duracaoMinutos)) {
    return {
      campo: 'duracao',
      mensagem: 'Informe uma duração maior que zero.',
    }
  }

  if (!numeroPositivoOuVazio(turma.value.vagas)) {
    return {
      campo: 'vagas',
      mensagem: 'Informe uma quantidade de vagas maior que zero.',
    }
  }

  return null
}

function focarCampoFormulario(campo) {
  const mapa = {
    nome: nomeCampoRef,
    nivel: nivelCampoRef,
    horario: horarioCampoRef,
    duracao: duracaoCampoRef,
    vagas: vagasCampoRef,
    dias: diasCampoRef,
    professor: professorCampoRef,
    ativo: ativoCampoRef,
  }

  const alvo = mapa[campo]
  if (!alvo?.value) {
    return
  }

  const foco = alvo.value.querySelector?.('input, select, textarea, button')
  if (typeof foco?.focus === 'function') {
    foco.focus()
    return
  }

  if (typeof alvo.value.focus === 'function') {
    alvo.value.focus()
  }
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''
  return mensagem || fallback
}

function irParaFuncionarios() {
  router.push('/funcionarios')
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  erro.value = ''
  mensagemSucesso.value = ''
  cancelarEdicao(false)
  limparSelecaoAlunos()
  carregarTudo()
}

onMounted(async () => {
  await carregarContextoGestaoEsportiva()
  carregarTudo()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina beach">
      <div>
        <p class="subtitulo">{{ nomeModalidade }}</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">{{ descricaoPagina }}</p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" @click="carregarTudo">Atualizar dados</button>
      </div>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso">
      <p>Selecione uma empresa no seletor superior para operar esta tela como SUPER_ADMIN.</p>
    </section>

    <section v-else class="grade-principal">
      <section class="card formulario-card">
        <div class="titulo-card">
          <h2>{{ turmaEditandoId ? `Editar ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` : `Nova ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` }}</h2>
          <p>{{ descricaoFormulario }}</p>
        </div>

        <div class="campos">
          <label class="campo-grande">
            Nome *
            <input ref="nomeCampoRef" v-model="turma.nome" type="text" :placeholder="`Ex: ${termoGrupoSingular} principal`" />
          </label>

          <label>
            Nível
            <select ref="nivelCampoRef" v-model="turma.nivelBeachTennis">
              <option value="">Selecione</option>
              <option v-for="opcao in OPCOES_NIVEL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.rotulo }}
              </option>
            </select>
          </label>

          <label>
            Horário de início
            <input ref="horarioCampoRef" v-model="turma.horarioInicio" type="time" />
          </label>

          <label>
            Duração em minutos
            <input ref="duracaoCampoRef" v-model="turma.duracaoMinutos" type="number" min="15" step="15" />
          </label>

          <label>
            Vagas
            <input ref="vagasCampoRef" v-model="turma.vagas" type="number" min="1" step="1" />
          </label>

          <label v-if="temProfessoresDisponiveis">
            {{ termoResponsavelSingular }} responsável
            <select ref="professorCampoRef" v-model="turma.professorResponsavelId">
              <option value="">Sem vínculo</option>
              <option v-for="professor in professoresDisponiveis" :key="professor.id" :value="String(professor.id)">
                {{ obterNomeResponsavel(professor) || 'Funcionário' }}
              </option>
            </select>
            <p class="ajuda-campo">Cadastre os {{ termoResponsavelPlural.toLocaleLowerCase('pt-BR') }} em Operação → Funcionários.</p>
          </label>
          <div v-else class="campo-grande estado-professor-vazio">
            <p>Nenhum {{ termoResponsavelSingular.toLocaleLowerCase('pt-BR') }} cadastrado nesta empresa.</p>
            <button class="botao secundario" type="button" @click="irParaFuncionarios">
              Cadastrar {{ termoResponsavelSingular.toLocaleLowerCase('pt-BR') }}
            </button>
            <p class="ajuda-campo">Cadastre os {{ termoResponsavelPlural.toLocaleLowerCase('pt-BR') }} em Operação → Funcionários.</p>
          </div>

          <fieldset ref="diasCampoRef" class="campo-grande dias-campo">
            <legend>Dias da semana</legend>
            <label
              v-for="opcao in OPCOES_DIAS_SEMANA_BEACH_TENNIS"
              :key="opcao.valor"
              class="dia-opcao"
              :class="{ selecionado: turma.diasSemana.includes(opcao.valor) }"
            >
              <input v-model="turma.diasSemana" type="checkbox" :value="opcao.valor" />
              <span>{{ opcao.rotulo }}</span>
            </label>
          </fieldset>

          <label class="campo-grande">
            Observações
            <textarea
              v-model="turma.observacoes"
              rows="3"
              :placeholder="`Ex: Priorizar nivelamento e ajustar ${termoParticipantePlural.toLocaleLowerCase('pt-BR')} quando necessário.`"
            ></textarea>
          </label>

          <label ref="ativoCampoRef" class="campo-checkbox turma-ativa-card" :class="{ ativa: turma.ativo }">
            <input v-model="turma.ativo" type="checkbox" />
            <span>
              <strong>Turma ativa</strong>
              <small>Turmas inativas ficam preservadas, mas não devem ser usadas em novos vínculos.</small>
            </span>
          </label>
        </div>

        <div class="rodape-formulario">
          <button class="botao principal" type="button" :disabled="salvandoTurma" @click="salvarTurma">
            {{ salvandoTurma ? 'Salvando...' : `Salvar ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` }}
          </button>
          <button v-if="turmaEditandoId" class="botao secundario" type="button" @click="cancelarEdicao">
            Cancelar edição
          </button>
        </div>
      </section>

      <section class="turmas-area">
        <div class="cabecalho-lista">
          <div>
            <h2>{{ termoGrupoPlural }}</h2>
            <p>{{ descricaoLista }}</p>
          </div>
          <span class="contador">{{ turmas.length }} {{ termoGrupoPlural.toLocaleLowerCase('pt-BR') }}</span>
        </div>

        <section v-if="carregando" class="card estado-vazio">
          <p>{{ `Carregando ${termoGrupoPlural.toLocaleLowerCase('pt-BR')} e bases auxiliares...` }}</p>
        </section>

        <section v-else-if="!turmas.length" class="card estado-vazio">
          <p>Nenhuma {{ termoGrupoSingular.toLocaleLowerCase('pt-BR') }} cadastrada ainda.</p>
        </section>

        <div v-else class="lista-turmas">
          <article
            v-for="item in turmas"
            :key="item.id"
            class="card turma-card"
            :class="{ cheia: turmaCheiaParaCard(item), inativa: !estaAtiva(item) }"
          >
            <div class="cabecalho-turma">
              <div>
                <h3>{{ item.nome }}</h3>
                <p class="subinfo">
                  <span v-if="rotuloNivel(item)" class="badge nivel">{{ rotuloNivel(item) }}</span>
                  <span v-if="!estaAtiva(item)" class="badge inativo">Inativa</span>
                  <span v-if="turmaCheiaParaCard(item)" class="badge cheia">{{ termoGrupoSingular }} cheia</span>
                </p>
              </div>
              <div class="badge-vagas">
                <strong>{{ obterQuantidadeAlunos(item) }}</strong>
                <span>/ {{ item.vagas || '∞' }} {{ termoParticipantePlural.toLocaleLowerCase('pt-BR') }}</span>
              </div>
            </div>

            <div class="grid-resumo">
              <p><strong>Dias:</strong> {{ rotuloDias(item).join(', ') || '-' }}</p>
              <p><strong>Horário:</strong> {{ formatarHorario(item.horarioInicio) }}</p>
              <p><strong>Duração:</strong> {{ item.duracaoMinutos || 60 }} min</p>
              <p><strong>{{ termoResponsavelSingular }}:</strong> {{ item.professorResponsavelNome || obterNomeResponsavel(item.professorResponsavel || {}) || '-' }}</p>
            </div>

            <p v-if="item.observacoes" class="observacoes">{{ item.observacoes }}</p>

            <div class="acoes-card">
              <button class="botao secundario" type="button" @click="selecionarTurma(item)">Ver {{ termoParticipantePlural.toLocaleLowerCase('pt-BR') }}</button>
              <button class="botao secundario" type="button" @click="editarTurma(item)">Editar</button>
              <button class="botao secundario" type="button" @click="alternarAtivoTurma(item)">
                {{ estaAtiva(item) ? 'Inativar' : 'Ativar' }}
              </button>
              <button class="botao perigo" type="button" @click="removerTurma(item)">Excluir</button>
            </div>
          </article>
        </div>
      </section>

      <section v-if="turmaSelecionada" class="painel-vinculos">
        <article class="card painel-detalhe">
          <div class="titulo-card">
            <h2>{{ termoParticipantePlural }} vinculados</h2>
            <p>
              {{ turmaSelecionada.nome }}
              <span v-if="turmaCheia" class="badge cheia">{{ termoGrupoSingular }} cheia</span>
              <span class="badge nivel">{{ quantidadeAlunosVinculados }} {{ termoParticipantePlural.toLocaleLowerCase('pt-BR') }} vinculados</span>
            </p>
          </div>

          <section v-if="carregandoVinculos" class="estado-vazio compacto">
            <p>Carregando alunos vinculados...</p>
          </section>

          <section v-else-if="!alunosTurmaSelecionada.length" class="estado-vazio compacto">
            <p>{{ `Nenhum ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')} vinculado ainda.` }}</p>
          </section>

          <div v-else class="grupos-alunos">
            <article v-for="grupo in gruposAlunosVinculados" :key="grupo.chave" class="grupo-alunos">
              <h3>{{ grupo.titulo }} <span>{{ grupo.items.length }}</span></h3>
              <ul class="lista-alunos">
                <li v-for="aluno in grupo.items" :key="obterChaveAluno(aluno)" class="aluno-item">
                  <div class="aluno-info">
                    <strong>{{ aluno.nome }}</strong>
                    <span v-if="rotuloNivelBeachTennis(aluno.nivelBeachTennis)" class="micro-badge">
                      {{ rotuloNivelBeachTennis(aluno.nivelBeachTennis) }}
                    </span>
                    <span v-if="nivelIncompatível(aluno)" class="micro-badge alerta">
                      {{ `Nível diferente da ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` }}
                    </span>
                  </div>
                  <small>
                    {{ rotuloPerfilBeachTennis(aluno.perfilBeachTennis) || 'Sem perfil informado' }}
                    <span v-if="aluno.email"> · {{ aluno.email }}</span>
                    <span v-if="formatarDataBrasileira(aluno.dataNascimento)"> · {{ formatarDataBrasileira(aluno.dataNascimento) }}</span>
                  </small>
                </li>
              </ul>
            </article>
          </div>
        </article>

        <article class="card painel-selecao">
          <div class="titulo-card">
            <h2>{{ `Vincular ${termoParticipantePlural}` }}</h2>
            <p>
              {{
                `Use os checkboxes para incluir ou remover ${termoParticipantePlural.toLocaleLowerCase('pt-BR')}. Se houver nível diferente da ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}, o alerta é apenas visual.`
              }}
            </p>
          </div>

          <div class="filtros-alunos">
            <label>
              Buscar
              <input v-model="filtroBuscaAluno" type="text" placeholder="Nome, e-mail, perfil..." />
            </label>
            <label>
              Filtrar por nível
              <select v-model="filtroNivelAluno">
                <option value="">Todos</option>
                <option v-for="opcao in OPCOES_NIVEL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
                  {{ opcao.rotulo }}
                </option>
              </select>
            </label>
            <button class="botao secundario limpar-filtros" type="button" @click="limparFiltrosAlunos">Limpar filtros</button>
          </div>

          <section v-if="!alunosDisponiveis.length" class="estado-vazio compacto">
            <p>{{ `Nenhum ${termoParticipanteSingular.toLocaleLowerCase('pt-BR')} disponível para vínculo.` }}</p>
          </section>

          <div v-else class="grupos-alunos vinculo">
            <article v-for="grupo in gruposAlunosDisponiveis" :key="grupo.chave" class="grupo-alunos">
              <h3>{{ grupo.titulo }} <span>{{ grupo.items.length }}</span></h3>

              <ul class="lista-alunos">
                <li v-for="aluno in grupo.items" :key="obterChaveAluno(aluno)" class="aluno-item selecionavel" :class="{ alerta: nivelIncompatível(aluno) }">
                  <label class="aluno-checkbox">
                    <input
                      type="checkbox"
                      :checked="alunosSelecionadosIds.includes(obterChaveAluno(aluno))"
                      @change="alternarAlunoSelecionado(aluno, $event.target.checked)"
                    />
                    <div class="aluno-info">
                      <strong>{{ aluno.nome }}</strong>
                      <span v-if="rotuloNivelBeachTennis(aluno.nivelBeachTennis)" class="micro-badge">
                        {{ rotuloNivelBeachTennis(aluno.nivelBeachTennis) }}
                      </span>
                      <span v-if="nivelIncompatível(aluno)" class="micro-badge alerta">
                        {{ `Nível diferente da ${termoGrupoSingular.toLocaleLowerCase('pt-BR')}` }}
                      </span>
                    </div>
                  </label>
                  <small>
                    {{ rotuloPerfilBeachTennis(aluno.perfilBeachTennis) || 'Sem perfil informado' }}
                    <span v-if="aluno.email"> · {{ aluno.email }}</span>
                    <span v-if="aluno.telefone"> · {{ aluno.telefone }}</span>
                    <span v-if="formatarDataBrasileira(aluno.dataNascimento)"> · {{ formatarDataBrasileira(aluno.dataNascimento) }}</span>
                  </small>
                  <small v-if="aluno.frequenciaSemanalBeachTennis || aluno.planoBeachTennis" class="meta-aluno">
                    {{ rotuloFrequenciaSemanalBeachTennis(aluno.frequenciaSemanalBeachTennis) || '-' }}
                    <span v-if="rotuloPlanoBeachTennis(aluno.planoBeachTennis)"> · {{ rotuloPlanoBeachTennis(aluno.planoBeachTennis) }}</span>
                  </small>
                </li>
              </ul>
            </article>
          </div>

          <div class="rodape-vinculos">
            <p class="resumo-vinculos">
              {{ `${quantidadeAlunosSelecionados} ${termoParticipantePlural.toLocaleLowerCase('pt-BR')} selecionados` }}
            </p>
            <button
              class="botao principal"
              type="button"
              :disabled="salvandoVinculos || !turmaSelecionadaId"
              @click="salvarVinculos"
            >
              {{ salvandoVinculos ? 'Salvando vínculos...' : 'Salvar vínculos' }}
            </button>
          </div>
        </article>
      </section>

      <section v-else class="card estado-vazio detalhe-aguardando">
        <p>
          {{ `Selecione ${termoGrupoSingular.toLocaleLowerCase('pt-BR')} para ver e alterar ${termoParticipantePlural.toLocaleLowerCase('pt-BR')} vinculados.` }}
        </p>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 22px;
  color: #0f172a;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  gap: 18px;
  align-items: center;
  padding: 22px 24px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 34%),
    linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
}

.subtitulo {
  margin: 0 0 6px;
  color: #0ea5e9;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 34px;
  font-weight: 900;
}

.descricao,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.acoes-cabecalho {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.grade-principal {
  display: grid;
  gap: 20px;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 22px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
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

.aviso {
  border-color: #fbbf24;
  background: #fffbeb;
  color: #92400e;
}

.formulario-card {
  display: grid;
  gap: 18px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

label,
fieldset {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 11px 12px;
  font-size: 15px;
  background: #fff;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 96px;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
}

.dias-campo {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  padding: 14px;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  background: #f8fbff;
}

.dias-campo legend {
  padding: 0 8px;
  color: #0369a1;
  font-weight: 800;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  font-weight: 700;
}

.campo-checkbox input {
  width: auto;
}

.dias-campo .dias-grade {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 10px;
}

.dia-opcao {
  display: grid;
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 10px 12px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  background: #ffffff;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, box-shadow 0.2s ease;
}

.dia-opcao input {
  width: auto;
  margin: 0;
}

.dia-opcao.selecionado {
  border-color: #0ea5e9;
  background: #e0f2fe;
}

.dia-opcao:focus-within {
  outline: none;
  border-color: #0284c7;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.18);
}

.turma-ativa-card {
  justify-content: flex-start;
  align-items: flex-start;
  padding: 14px 16px;
  border: 1px solid #cbd5e1;
  border-radius: 14px;
  background: #ffffff;
  cursor: pointer;
}

.turma-ativa-card.ativa {
  border-color: #22c55e;
  background: #f0fdf4;
}

.turma-ativa-card span {
  display: grid;
  gap: 4px;
}

.turma-ativa-card small {
  color: #475569;
  font-weight: 500;
  line-height: 1.35;
}

.turma-ativa-card:focus-within {
  outline: none;
  box-shadow: 0 0 0 3px rgba(34, 197, 94, 0.18);
}

.estado-professor-vazio {
  display: grid;
  gap: 10px;
  align-content: start;
}

.estado-professor-vazio p {
  margin: 0;
}

.rodape-formulario,
.rodape-vinculos {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.turmas-area,
.painel-vinculos {
  display: grid;
  gap: 18px;
}

.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 900;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 900;
  white-space: nowrap;
}

.estado-vazio {
  color: #64748b;
}

.estado-vazio.compacto {
  padding: 14px 0 0;
}

.lista-turmas {
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  gap: 16px;
}

.turma-card {
  display: grid;
  gap: 14px;
  border-left: 5px solid #0ea5e9;
}

.turma-card.cheia {
  border-left-color: #dc2626;
}

.turma-card.inativa {
  opacity: 0.78;
}

.cabecalho-turma {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.cabecalho-turma h3 {
  margin: 0;
  font-size: 21px;
  font-weight: 900;
}

.subinfo {
  margin: 8px 0 0;
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.badge {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 900;
}

.badge.nivel {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.badge.cheia {
  background: #fef3c7;
  color: #92400e;
}

.badge-vagas {
  display: grid;
  place-items: center;
  min-width: 86px;
  padding: 10px 12px;
  border-radius: 14px;
  background: #f8fbff;
  border: 1px solid #dbeafe;
  color: #1e40af;
}

.badge-vagas strong {
  font-size: 26px;
  font-weight: 900;
  line-height: 1;
}

.badge-vagas span {
  font-size: 12px;
  font-weight: 800;
}

.grid-resumo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px 14px;
}

.grid-resumo p,
.observacoes {
  margin: 0;
  color: #374151;
}

.grid-resumo strong {
  font-weight: 900;
}

.observacoes {
  padding: 12px 14px;
  border-radius: 12px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
}

.acoes-card {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.painel-detalhe,
.painel-selecao {
  display: grid;
  gap: 16px;
}

.grupos-alunos {
  display: grid;
  gap: 14px;
}

.grupo-alunos {
  display: grid;
  gap: 10px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 14px;
  background: #fff;
}

.grupo-alunos h3 {
  margin: 0;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  font-size: 16px;
  font-weight: 900;
}

.grupo-alunos h3 span {
  font-size: 12px;
  color: #1d4ed8;
  background: #dbeafe;
  border-radius: 999px;
  padding: 4px 8px;
}

.lista-alunos {
  list-style: none;
  margin: 0;
  padding: 0;
  display: grid;
  gap: 10px;
}

.aluno-item {
  border: 1px solid #e5e7eb;
  border-radius: 14px;
  padding: 12px 14px;
  background: #f8fafc;
  display: grid;
  gap: 6px;
}

.aluno-item.selecionavel {
  background: #fff;
}

.aluno-item.alerta {
  border-color: #fbbf24;
  background: #fffbeb;
}

.aluno-checkbox {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 10px;
  align-items: start;
  cursor: pointer;
}

.aluno-checkbox input {
  width: auto;
  margin-top: 3px;
}

.aluno-info {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.aluno-info strong {
  font-size: 15px;
}

.micro-badge {
  border-radius: 999px;
  padding: 4px 8px;
  font-size: 11px;
  font-weight: 900;
  background: #dbeafe;
  color: #1d4ed8;
}

.micro-badge.alerta {
  background: #fef3c7;
  color: #92400e;
}

.meta-aluno {
  color: #475569;
}

.filtros-alunos {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.limpar-filtros {
  min-width: 0;
}

.resumo-vinculos {
  margin: 0;
  color: #475569;
  font-weight: 800;
}

.detalhe-aguardando {
  color: #64748b;
}

.botao,
:deep(.botao) {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover,
:deep(.botao:hover) {
  transform: translateY(-1px);
}

.botao:disabled,
:deep(.botao:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
}

.principal {
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
}

.principal:hover {
  background: linear-gradient(135deg, #0284c7 0%, #1d4ed8 100%);
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

@media (max-width: 1100px) {
  .lista-turmas {
    grid-template-columns: 1fr;
  }

  .painel-vinculos {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .cabecalho-turma,
  .rodape-formulario,
  .rodape-vinculos {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos,
  .grid-resumo,
  .filtros-alunos,
  .dias-campo .dias-grade {
    grid-template-columns: 1fr;
  }

  .badge-vagas {
    align-self: stretch;
    place-items: start;
  }
}
</style>
