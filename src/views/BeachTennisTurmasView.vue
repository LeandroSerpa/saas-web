<script setup>
import { computed, onBeforeUnmount, onMounted, ref, nextTick } from 'vue'
import { useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarFuncionarios,
  buscarStatusFinanceiroMinhaEmpresa,
  buscarTurmasBeachTennis,
  criarTurmaBeachTennis,
  atualizarTurmaBeachTennis,
  excluirTurmaBeachTennis,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import {
  OPCOES_DIAS_SEMANA_BEACH_TENNIS,
  OPCOES_NIVEL_BEACH_TENNIS,
  normalizarArrayBeachTennis,
  rotuloCompeticaoBeachTennis,
  rotuloDiaBeachTennis,
  rotuloNivelBeachTennis,
} from '@/utils/beachTennis'
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'
import { formatarResumoCapacidadeTurma, interpretarCapacidadeTurma } from '@/utils/capacidadeTurma'

const router = useRouter()
const EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS = 'beach-tennis-turmas-atualizadas'
const turmas = ref([])
const funcionarios = ref([])
const carregando = ref(true)
const salvandoTurma = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const turmaEditandoId = ref(null)
const statusFinanceiro = ref(null)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const turma = ref(criarTurmaInicial())
const nomeCampoRef = ref(null)
const nivelCampoRef = ref(null)
const horarioCampoRef = ref(null)
const duracaoCampoRef = ref(null)
const capacidadeRegularCampoRef = ref(null)
const limiteExtrasCampoRef = ref(null)
const diasCampoRef = ref(null)
const professorCampoRef = ref(null)
const ativoCampoRef = ref(null)
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Participante')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Participantes')
const termoResponsavelSingular = computed(() => 'Professor')
const termoResponsavelPlural = computed(() => 'Professores')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')
const tituloPagina = computed(() =>
  nomeModalidade.value === 'Beach Tennis'
    ? 'Turmas Beach Tennis'
    : `${termoGrupoPlural.value} de ${nomeModalidade.value}`,
)
const descricaoPagina = computed(() =>
  `Cadastre e edite ${termoGrupoPlural.value.toLocaleLowerCase('pt-BR')} sem misturar a gestão de participantes.`,
)
const descricaoFormulario = computed(() =>
  `Mantenha aqui o cadastro da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}. A gestão de participantes agora fica na tela dedicada.`,
)
const descricaoLista = computed(() =>
  `Cards enxutos com quantidade de ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} e responsável informado pela API.`,
)
const resumoCapacidadeFormulario = computed(() => formatarResumoCapacidadeTurma(turma.value, 'formulario'))
const capacidadeTurmaFormulario = computed(() => interpretarCapacidadeTurma(turma.value))
const professoresDisponiveis = computed(() =>
  [...funcionarios.value]
    .filter((item) => item && item.ativo !== false)
    .sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')),
)
const temProfessoresDisponiveis = computed(() => professoresDisponiveis.value.length > 0)

function criarTurmaInicial() {
  return {
    nome: '',
    nivelBeachTennis: '',
    competicao: false,
    diasSemana: [],
    horarioInicio: '',
    duracaoMinutos: 60,
    capacidadeRegular: '',
    limiteParticipantesExtras: '',
    vagas: '',
    professorResponsavelId: '',
    observacoes: '',
    ativo: true,
  }
}

function normalizarTurmaFormulario(item = {}) {
  const capacidadeRegular = item.capacidadeRegular ?? ''
  const usaVagasLegado = item.capacidadeRegular == null && item.vagas != null
  const limiteParticipantesExtras = item.limiteParticipantesExtras ?? ''

  return {
    nome: item.nome || '',
    nivelBeachTennis: item.nivelBeachTennis || item.nivel || '',
    competicao: item.competicao === true,
    diasSemana: normalizarArrayBeachTennis(item.diasSemana || item.dias || item.diasAtendimento),
    horarioInicio: item.horarioInicio || item.horaInicio || '',
    duracaoMinutos: Number(item.duracaoMinutos || item.duracao || 60) || 60,
    capacidadeRegular,
    limiteParticipantesExtras,
    vagas: item.vagas ?? item.capacidadeRegular ?? '',
    usaVagasLegado,
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

  const capacidadeRegularInformada = normalizarInteiroOpcionalPositivo(dados.capacidadeRegular)
  const vagasLegado = normalizarInteiroOpcionalPositivo(dados.vagas)
  const capacidadeRegular = capacidadeRegularInformada
  const vagas = capacidadeRegularInformada ?? (dados.usaVagasLegado === true ? vagasLegado : null)
  const limiteParticipantesExtras = normalizarInteiroOpcionalZeroOuMais(dados.limiteParticipantesExtras)

  return {
    nome: String(dados.nome || '').trim(),
    nivel: String(dados.nivelBeachTennis || dados.nivel || '').trim().toUpperCase() || null,
    competicao: dados.competicao === true,
    diasSemana: normalizarDiasSemanaPayload(dados.diasSemana),
    horarioInicio: normalizarHorarioPayload(dados.horarioInicio),
    duracaoMinutos: normalizarInteiroPositivo(dados.duracaoMinutos, 60),
    capacidadeRegular,
    limiteParticipantesExtras: capacidadeRegular === null ? null : limiteParticipantesExtras,
    vagas,
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

function estaAtiva(item = {}) {
  return item.ativo !== false
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

function capacidadeExibidaTurma(item = {}) {
  const capacidade = interpretarCapacidadeTurma(item)
  return capacidade.capacidadeTotalExibicao ?? capacidade.capacidadeRegularExibicao
}

function turmaCheiaParaCard(item = {}) {
  const capacidadeTotal = capacidadeExibidaTurma(item)
  return Boolean(capacidadeTotal > 0 && obterQuantidadeAlunos(item) >= capacidadeTotal)
}

function textoCapacidadeTurma(item = {}) {
  return formatarResumoCapacidadeTurma(item, 'lista')
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

function obterNomeResponsavel(item = {}) {
  return item.nome || item.nomeCompleto || item.apelido || item.cargo || termoResponsavelSingular.value
}

function selecionarTurma(item = {}) {
  turmaEditandoId.value = item.id
  mensagemSucesso.value = ''
  erro.value = ''
  turma.value = normalizarTurmaFormulario(item)
}

function irParaGerenciarAlunos(item = {}) {
  const turmaId = String(item.id || '').trim()
  if (!turmaId) {
    return
  }

  router.push({
    path: '/beach-tennis/alunos',
    query: { turmaId },
  })
}

function cancelarEdicao(limparMensagens = true) {
  turmaEditandoId.value = null
  turma.value = criarTurmaInicial()

  if (limparMensagens) {
    mensagemSucesso.value = ''
  }
}

function normalizarInteiroPositivo(valor, fallback = null) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return fallback
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0 ? numero : fallback
}

function normalizarInteiroOpcionalPositivo(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function normalizarInteiroOpcionalZeroOuMais(valor) {
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number(texto)
  return Number.isInteger(numero) && numero >= 0 ? numero : null
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
      mensagem: `Informe o horário de início da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')}.`,
    }
  }

  if (!horarioValido(horario)) {
    return {
      campo: 'horario',
      mensagem: 'Informe um horário válido no formato HH:mm.',
    }
  }

  const duracao = normalizarInteiroPositivo(turma.value.duracaoMinutos, null)
  if (!duracao) {
    return {
      campo: 'duracao',
      mensagem: 'Informe a duração em minutos.',
    }
  }

  const capacidadeRegularTexto = String(turma.value.capacidadeRegular ?? '').trim()
  const limiteExtrasTexto = String(turma.value.limiteParticipantesExtras ?? '').trim()

  if (!capacidadeRegularTexto && limiteExtrasTexto) {
    return {
      campo: 'capacidadeRegular',
      mensagem: 'Informe a capacidade regular para permitir vagas extras.',
    }
  }

  if (capacidadeRegularTexto) {
    const capacidadeRegular = Number(capacidadeRegularTexto)
    if (!Number.isInteger(capacidadeRegular) || capacidadeRegular <= 0) {
      return {
        campo: 'capacidadeRegular',
        mensagem: 'A capacidade regular deve ser um número inteiro maior que zero.',
      }
    }
  }

  if (limiteExtrasTexto) {
    const limiteExtras = Number(limiteExtrasTexto)
    if (!Number.isInteger(limiteExtras) || limiteExtras < 0) {
      return {
        campo: 'limiteExtras',
        mensagem: 'As vagas extras devem ser um número inteiro maior ou igual a zero.',
      }
    }
  }

  return null
}

function horarioValido(valor) {
  return /^([01]\d|2[0-3]):[0-5]\d$/.test(String(valor || '').trim())
}

function focarCampoFormulario(campo) {
  const mapa = {
    nome: nomeCampoRef,
    nivel: nivelCampoRef,
    horario: horarioCampoRef,
    duracao: duracaoCampoRef,
    capacidadeRegular: capacidadeRegularCampoRef,
    limiteExtras: limiteExtrasCampoRef,
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
  }
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
    const mensagem = String(candidato || '').trim()
    if (mensagem) {
      return mensagem
    }
  }

  return fallback
}

async function carregarTurmas() {
  try {
    const resposta = await buscarTurmasBeachTennis()
    turmas.value = normalizarTurmas(Array.isArray(resposta) ? resposta : [])
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as turmas.')
    console.error(error)
  }
}

async function carregarStatusFinanceiro() {
  try {
    statusFinanceiro.value = await buscarStatusFinanceiroMinhaEmpresa()
  } catch (error) {
    statusFinanceiro.value = null
    console.error(error)
  }
}

async function carregarFuncionarios() {
  try {
    const resposta = await buscarFuncionarios()
    funcionarios.value = Array.isArray(resposta) ? resposta : []
  } catch (error) {
    funcionarios.value = []
    console.error(error)
  }
}

async function carregarTudo() {
  await carregarContextoGestaoEsportiva()

  if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
    turmas.value = []
    statusFinanceiro.value = null
    carregando.value = false
    return
  }

  carregando.value = true
  erro.value = ''
  mensagemSucesso.value = ''

  try {
    await Promise.all([carregarTurmas(), carregarStatusFinanceiro(), carregarFuncionarios()])
  } finally {
    carregando.value = false
  }
}

function atualizarTurmasAposParticipantes() {
  carregarTurmas().catch((error) => {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar as turmas.')
    console.error(error)
  })
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

    const payload = montarPayloadTurma()

    if (turmaEditandoId.value) {
      await atualizarTurmaBeachTennis(turmaEditandoId.value, payload)
      mensagemSucesso.value = `${termoGrupoSingular.value} atualizada com sucesso.`
    } else {
      const resposta = await criarTurmaBeachTennis(payload)
      mensagemSucesso.value = `${termoGrupoSingular.value} cadastrada com sucesso.`
      const novaTurmaId = resposta?.id || resposta?.turmaId
      if (novaTurmaId) {
        turmaEditandoId.value = String(novaTurmaId)
      }
    }

    cancelarEdicao(false)
    await carregarTurmas()
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

function irParaFuncionarios() {
  router.push('/professores')
}

function atualizarContextoEmpresa() {
  recarregarContextoGestaoEsportiva()
    .then(() => {
      modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
      return carregarTudo()
    })
    .catch((error) => {
      erro.value = obterMensagemErro(error, 'Não foi possível atualizar o contexto da empresa.')
    })
}

onMounted(async () => {
  await carregarContextoGestaoEsportiva()
  carregarTudo()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  window.addEventListener(EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS, atualizarTurmasAposParticipantes)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  window.removeEventListener(EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS, atualizarTurmasAposParticipantes)
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

          <label class="campo-checkbox" :class="{ ativa: turma.competicao }">
            <input v-model="turma.competicao" type="checkbox" />
            <span>
              <strong>Turma de competição</strong>
              <small>Use esta marcação para destacar grupos competitivos sem bloquear vínculos.</small>
            </span>
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
            Capacidade regular
            <input
              ref="capacidadeRegularCampoRef"
              v-model="turma.capacidadeRegular"
              type="number"
              min="1"
              step="1"
            />
            <small class="ajuda-campo">Quantidade-base de alunos fixos que participam da turma.</small>
          </label>

          <label>
            Vagas extras
            <input
              ref="limiteExtrasCampoRef"
              v-model="turma.limiteParticipantesExtras"
              type="number"
              min="0"
              step="1"
            />
            <small class="ajuda-campo">
              Quantidade adicional permitida para reposições e outros participantes eventuais.
            </small>
          </label>

          <label v-if="temProfessoresDisponiveis">
            {{ termoResponsavelSingular }} responsável
            <select ref="professorCampoRef" v-model="turma.professorResponsavelId">
              <option value="">Sem vínculo</option>
              <option v-for="professor in professoresDisponiveis" :key="professor.id" :value="String(professor.id)">
                {{ obterNomeResponsavel(professor) || 'Professor' }}
              </option>
            </select>
            <p class="ajuda-campo">Cadastre os {{ termoResponsavelPlural.toLocaleLowerCase('pt-BR') }} em Gestão Esportiva &gt; Professores.</p>
          </label>
          <div v-else class="campo-grande estado-professor-vazio">
            <p>Nenhum {{ termoResponsavelSingular.toLocaleLowerCase('pt-BR') }} cadastrado nesta empresa.</p>
            <button class="botao secundario" type="button" @click="irParaFuncionarios">
              Cadastrar {{ termoResponsavelSingular.toLocaleLowerCase('pt-BR') }}
            </button>
            <p class="ajuda-campo">Cadastre os {{ termoResponsavelPlural.toLocaleLowerCase('pt-BR') }} em Gestão Esportiva &gt; Professores.</p>
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

        <p class="resumo-capacidade-formulario">{{ resumoCapacidadeFormulario }}</p>

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
                  <span v-if="item.competicao === true" class="badge competicao">{{ rotuloCompeticaoBeachTennis(true) }}</span>
                  <span v-if="!estaAtiva(item)" class="badge inativo">Inativa</span>
                  <span v-if="turmaCheiaParaCard(item)" class="badge cheia">{{ termoGrupoSingular }} cheia</span>
                </p>
              </div>
              <div class="badge-vagas">
                <strong>{{ obterQuantidadeAlunos(item) }}</strong>
                <span>/ {{ capacidadeExibidaTurma(item) || '∞' }} {{ termoParticipantePlural.toLocaleLowerCase('pt-BR') }}</span>
              </div>
            </div>

            <div class="grid-resumo">
              <p><strong>Dias:</strong> {{ rotuloDias(item).join(', ') || '-' }}</p>
              <p><strong>Horário:</strong> {{ formatarHorario(item.horarioInicio) }}</p>
              <p><strong>Duração:</strong> {{ item.duracaoMinutos || 60 }} min</p>
              <p><strong>{{ termoResponsavelSingular }}:</strong> {{ item.professorResponsavelNome || obterNomeResponsavel(item.professorResponsavel || {}) || '-' }}</p>
              <p><strong>Capacidade:</strong> {{ textoCapacidadeTurma(item) }}</p>
            </div>

            <p v-if="item.observacoes" class="observacoes">{{ item.observacoes }}</p>

            <div class="acoes-card">
              <button class="botao secundario" type="button" @click="irParaGerenciarAlunos(item)">
                Gerenciar alunos
              </button>
              <button class="botao secundario" type="button" @click="selecionarTurma(item)">Editar</button>
              <button class="botao secundario" type="button" @click="alternarAtivoTurma(item)">
                {{ estaAtiva(item) ? 'Inativar' : 'Ativar' }}
              </button>
              <button class="botao perigo acao-excluir" type="button" @click="removerTurma(item)">Excluir</button>
            </div>
          </article>
        </div>
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

*,
*::before,
*::after {
  box-sizing: border-box;
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
  grid-template-columns: repeat(2, minmax(0, 1fr));
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
  width: 100%;
  min-width: 0;
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
  min-height: 44px;
  min-width: 0;
  cursor: pointer;
}

.dia-opcao input {
  width: auto;
  margin: 0;
}

.dia-opcao span {
  text-align: center;
  overflow-wrap: anywhere;
  word-break: break-word;
}

.dia-opcao:focus-within {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.14);
}

.dia-opcao.selecionado {
  border-color: #0ea5e9;
  background: #e0f2fe;
}

.estado-professor-vazio {
  display: grid;
  gap: 10px;
  align-content: start;
}

.estado-professor-vazio p {
  margin: 0;
}

.ajuda-campo {
  color: #6b7280;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.4;
}

.resumo-capacidade-formulario {
  margin: 0;
  padding: 14px 16px;
  border-radius: 14px;
  background: #eff6ff;
  border: 1px solid #bfdbfe;
  color: #1d4ed8;
  font-size: 14px;
  font-weight: 700;
}

.rodape-formulario,
.rodape-vinculos {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: space-between;
}

.turmas-area {
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

.lista-turmas {
  display: grid;
  grid-template-columns: repeat(2, minmax(300px, 1fr));
  gap: 16px;
}

.turma-card {
  display: grid;
  gap: 14px;
  border-left: 5px solid #0ea5e9;
  min-width: 0;
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

.badge.competicao {
  background: #fef3c7;
  color: #b45309;
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
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.acoes-card .acao-excluir {
  grid-column: 1 / -1;
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
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .cabecalho-turma,
  .rodape-formulario {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos,
  .grid-resumo,
  .dias-campo .dias-grade {
    grid-template-columns: 1fr;
  }

  .badge-vagas {
    align-self: stretch;
    place-items: start;
  }
}

@media (max-width: 760px) {
  .dias-campo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dias-campo legend {
    padding-left: 0;
  }

  .campos {
    grid-template-columns: 1fr;
  }

  .acoes-card {
    grid-template-columns: 1fr;
  }

  .acoes-card .acao-excluir {
    grid-column: auto;
  }

  .acao-excluir {
    border-top: 1px solid rgba(220, 38, 38, 0.15);
    padding-top: 10px;
  }

  .rodape-formulario {
    width: 100%;
  }

  .rodape-formulario .botao {
    width: 100%;
  }
}

@media (max-width: 520px) {
  .dias-campo {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .dia-opcao {
    padding: 10px;
  }
}
</style>
