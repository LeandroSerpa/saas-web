<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAulaGestaoEsportiva,
  cancelarAulaGestaoEsportiva,
  modoVisualizacaoEmpresaAtivo,
  reverterCancelamentoAulaGestaoEsportiva,
  salvarFrequenciasAulaGestaoEsportiva,
} from '@/services/api'
import { rotuloCompeticaoBeachTennis, rotuloNivelBeachTennis } from '@/utils/beachTennis'
import { formatarDataPtBrSemFuso } from '@/utils/datas'
import {
  calcularResumoFrequencias,
  criarSnapshotParticipantes,
  formatarMensagemQuantidade,
  estadoSituacaoAula,
  formatarDuracaoMinutos,
  formatarHorario,
  formatarDataHoraSemConversaoFuso,
  normalizarAulaDetalhe,
  normalizarIdPositivo,
  normalizarSituacaoFrequencia,
  opcoesSituacaoParticipante,
  prepararPayloadFrequenciasAlteradas,
  rotuloSituacaoAula,
  rotuloSituacaoFrequencia,
  temAlteracaoParticipante,
  temLancamentoPersistido,
} from '@/utils/aulasFrequencia'
import {
  carregarContextoGestaoEsportiva,
  contextoGestaoEsportiva,
  recarregarContextoGestaoEsportiva,
} from '@/utils/gestaoEsportiva'

const route = useRoute()
const router = useRouter()

const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Aluno')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Alunos')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')

const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const carregandoDetalhe = ref(true)
const salvandoFrequencias = ref(false)
const erroDetalhe = ref('')
const feedback = ref('')
const tipoFeedback = ref('info')
const aulaDetalhe = ref(null)
const participantesEdicao = ref([])
const snapshotParticipantes = ref(new Map())
const sequenciaDetalhe = ref(0)
const acaoCancelamento = ref('')
const motivoCancelamento = ref('')
const processandoCancelamento = ref(false)
const erroCancelamento = ref('')

const aulaId = computed(() => normalizarIdPositivo(route.params.aulaId ?? route.query.aulaId))
const situacaoAulaSelecionada = computed(() => String(aulaDetalhe.value?.situacao || '').trim().toUpperCase())
const aulaCancelada = computed(() => situacaoAulaSelecionada.value === 'CANCELADA')
const participantesAlterados = computed(() =>
  participantesEdicao.value.filter((participante) => temAlteracaoParticipante(participante, snapshotParticipantes.value)),
)
const participantesAlteradosValidos = computed(() =>
  participantesAlterados.value.filter((participante) => normalizarSituacaoFrequencia(participante.situacao) !== 'NAO_LANCADO'),
)
const temParticipantes = computed(() => participantesEdicao.value.length > 0)
const lancamentosPendentes = computed(() =>
  prepararPayloadFrequenciasAlteradas(participantesEdicao.value, snapshotParticipantes.value),
)
const temAlteracoesPendentes = computed(() => lancamentosPendentes.value.length > 0)
const mensagemEstadoAlteracoes = computed(() => {
  if (!temParticipantes.value) {
    return 'Esta aula ainda não possui participantes vinculados.'
  }

  if (!temAlteracoesPendentes.value) {
    return 'Nenhuma alteração pendente.'
  }

  return formatarMensagemQuantidade(lancamentosPendentes.value.length, 'alteração pendente.', 'alterações pendentes.')
})
function obterContadorResumoAula(...chaves) {
  const fontes = [aulaDetalhe.value, aulaDetalhe.value?.resumoFrequencias]

  for (const fonte of fontes) {
    if (!fonte || typeof fonte !== 'object') {
      continue
    }

    for (const chave of chaves) {
      const numero = Number(fonte[chave])
      if (Number.isFinite(numero) && numero >= 0) {
        return numero
      }
    }
  }

  return 0
}

const temFrequenciaPersistida = computed(() =>
  participantesEdicao.value.some((participante) => temLancamentoPersistido(participante, snapshotParticipantes.value)) ||
  obterContadorResumoAula('presentes', 'qtdPresentes', 'quantidadePresentes') > 0 ||
  obterContadorResumoAula('faltasJustificadas', 'qtdFaltasJustificadas', 'faltasComJustificativa') > 0 ||
  obterContadorResumoAula('faltasSemJustificativa', 'qtdFaltasSemJustificativa') > 0 ||
  obterContadorResumoAula('reposicoesRealizadas', 'qtdReposicoesRealizadas', 'reposicoes') > 0,
)
const podeCancelarAula = computed(
  () =>
    Boolean(aulaDetalhe.value?.id) &&
    situacaoAulaSelecionada.value === 'AGENDADA' &&
    !temFrequenciaPersistida.value &&
    !processandoCancelamento.value,
)
const podeReverterCancelamento = computed(
  () => aulaCancelada.value && !modoVisualizacaoEmpresa.value && moduloAtivo.value && Boolean(aulaDetalhe.value?.id),
)
const mensagemBloqueioCancelamento = computed(() => {
  if (!aulaDetalhe.value?.id || aulaCancelada.value) {
    return ''
  }

  if (temFrequenciaPersistida.value) {
    return 'Aulas com frequência lançada não podem ser canceladas nesta etapa.'
  }

  if (situacaoAulaSelecionada.value === 'REALIZADA') {
    return 'Esta aula já foi realizada e não pode ser cancelada.'
  }

  if (situacaoAulaSelecionada.value === 'NAO_REALIZADA') {
    return 'Esta aula foi marcada como não realizada e não pode ser cancelada.'
  }

  return ''
})
const tituloModalCancelamento = computed(() =>
  acaoCancelamento.value === 'reverter' ? 'Reverter cancelamento' : 'Cancelar aula',
)
const textoBotaoModalCancelamento = computed(() =>
  acaoCancelamento.value === 'reverter'
    ? processandoCancelamento.value
      ? 'Revertendo...'
      : 'Confirmar reversão'
    : processandoCancelamento.value
      ? 'Cancelando...'
      : 'Confirmar cancelamento',
)
const textoConfirmacaoCancelamento = computed(() =>
  acaoCancelamento.value === 'reverter'
    ? 'A aula voltará para a situação Agendada. A turma, o horário e os participantes permanecem inalterados.'
    : 'A aula será cancelada sem exclusão do registro. Não será criada reposição automaticamente nesta fase.',
)
const podeSalvarFrequencias = computed(
  () =>
    Boolean(aulaDetalhe.value?.id) &&
    !aulaCancelada.value &&
    !salvandoFrequencias.value &&
    !modoVisualizacaoEmpresa.value &&
    moduloAtivo.value &&
    temAlteracoesPendentes.value,
)
const resumoFrequencias = computed(() => calcularResumoFrequencias(aulaDetalhe.value, participantesEdicao.value))
const queryRetorno = computed(() => {
  const query = { ...route.query }
  delete query.aulaId
  return query
})

function definirFeedback(mensagem, tipo = 'info') {
  feedback.value = String(mensagem || '').trim()
  tipoFeedback.value = tipo
}

function limparFeedback() {
  feedback.value = ''
  tipoFeedback.value = 'info'
}

function obterMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  return mensagem || fallback
}

function formatarDataHora(valor) {
  const texto = String(valor || '').trim()
  if (!texto) {
    return ''
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

function voltarParaAulas() {
  router.replace({
    name: 'aulas-frequencia',
    query: queryRetorno.value,
  })
}

function abrirCancelamentoAula() {
  if (!podeCancelarAula.value || !aulaDetalhe.value?.id) {
    return
  }

  acaoCancelamento.value = 'cancelar'
  motivoCancelamento.value = ''
  erroCancelamento.value = ''
}

function abrirReversaoCancelamento() {
  if (!podeReverterCancelamento.value) {
    return
  }

  acaoCancelamento.value = 'reverter'
  motivoCancelamento.value = ''
  erroCancelamento.value = ''
}

function fecharModalCancelamento(forcar = false) {
  if (processandoCancelamento.value && !forcar) {
    return
  }

  acaoCancelamento.value = ''
  motivoCancelamento.value = ''
  erroCancelamento.value = ''
}

async function confirmarCancelamentoAula() {
  if (!aulaDetalhe.value?.id || !acaoCancelamento.value || processandoCancelamento.value) {
    return
  }

  if (acaoCancelamento.value === 'cancelar' && !String(motivoCancelamento.value || '').trim()) {
    erroCancelamento.value = 'Informe o motivo do cancelamento.'
    return
  }

  try {
    processandoCancelamento.value = true
    erroCancelamento.value = ''

    if (acaoCancelamento.value === 'cancelar') {
      await cancelarAulaGestaoEsportiva(aulaDetalhe.value.id, motivoCancelamento.value)
      definirFeedback('Aula cancelada com sucesso.', 'sucesso')
    } else {
      await reverterCancelamentoAulaGestaoEsportiva(aulaDetalhe.value.id)
      definirFeedback('Cancelamento revertido com sucesso. A aula voltou para agendada.', 'sucesso')
    }

    fecharModalCancelamento(true)
    await carregarDetalheAula(aulaDetalhe.value.id)
  } catch (error) {
    erroCancelamento.value = obterMensagemErro(error, 'Não foi possível concluir a operação.')
  } finally {
    processandoCancelamento.value = false
  }
}

function aplicarSituacaoParticipante(participante) {
  const situacao = normalizarSituacaoFrequencia(participante.situacao)
  const originalPersistido = temLancamentoPersistido(participante, snapshotParticipantes.value)

  if (situacao === 'NAO_LANCADO' && originalPersistido) {
    participante.situacao = snapshotParticipantes.value.get(participante.clienteId)?.situacao || 'PRESENTE'
    definirFeedback('Não é possível remover um lançamento nesta etapa. Escolha outro estado válido.', 'aviso')
    return
  }

  if (situacao !== 'FALTA_JUSTIFICADA') {
    participante.justificativa = ''
  }
}

function validarLancamentosPendentes() {
  for (const participante of participantesAlteradosValidos.value) {
    const situacao = normalizarSituacaoFrequencia(participante.situacao)

    if (situacao === 'FALTA_JUSTIFICADA' && !String(participante.justificativa || '').trim()) {
      return {
        mensagem: `Informe a justificativa de ${participante.clienteNome}.`,
        participanteId: participante.clienteId,
      }
    }
  }

  return null
}

function prepararPayloadFrequencias() {
  return lancamentosPendentes.value
}

async function carregarDetalheAula(aulaIdAtual = aulaId.value) {
  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    aulaDetalhe.value = null
    participantesEdicao.value = []
    snapshotParticipantes.value = new Map()
    carregandoDetalhe.value = false
    return
  }

  const id = normalizarIdPositivo(aulaIdAtual)
  if (!id) {
    erroDetalhe.value = 'Não foi possível identificar a aula selecionada.'
    carregandoDetalhe.value = false
    return
  }

  const sequenciaAtual = sequenciaDetalhe.value + 1
  sequenciaDetalhe.value = sequenciaAtual
  carregandoDetalhe.value = true
  erroDetalhe.value = ''
  aulaDetalhe.value = null
  participantesEdicao.value = []
  snapshotParticipantes.value = new Map()

  try {
    const resposta = await buscarAulaGestaoEsportiva(id)
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    const detalheNormalizado = normalizarAulaDetalhe(resposta || {})
    aulaDetalhe.value = detalheNormalizado
    participantesEdicao.value = detalheNormalizado.participantes.map((participante) => ({ ...participante }))
    snapshotParticipantes.value = criarSnapshotParticipantes(detalheNormalizado.participantes)
  } catch (error) {
    if (sequenciaAtual !== sequenciaDetalhe.value) {
      return
    }

    aulaDetalhe.value = null
    participantesEdicao.value = []
    snapshotParticipantes.value = new Map()
    erroDetalhe.value = obterMensagemErro(error, 'Não foi possível carregar os detalhes da aula.')
  } finally {
    if (sequenciaAtual === sequenciaDetalhe.value) {
      carregandoDetalhe.value = false
    }
  }
}

async function salvarFrequencias() {
  if (!aulaDetalhe.value?.id || !podeSalvarFrequencias.value) {
    if (aulaCancelada.value) {
      definirFeedback('Esta aula está cancelada e não permite alteração de frequência.', 'aviso')
      return
    }

    if (!temAlteracoesPendentes.value) {
      definirFeedback(mensagemEstadoAlteracoes.value, 'info')
    }
    return
  }

  const validacao = validarLancamentosPendentes()
  if (validacao) {
    definirFeedback(validacao.mensagem, 'erro')
    await nextTick()
    const campo = document.querySelector(
      `[data-participante-id="${validacao.participanteId}"] [data-campo="justificativa"]`,
    )
    if (campo && typeof campo.focus === 'function') {
      campo.focus()
    }
    return
  }

  const payload = prepararPayloadFrequencias()
  const quantidadeLancamentos = payload.length
  if (!payload.length) {
    definirFeedback(mensagemEstadoAlteracoes.value, 'info')
    return
  }

  try {
    salvandoFrequencias.value = true
    limparFeedback()
    await salvarFrequenciasAulaGestaoEsportiva(aulaDetalhe.value.id, payload)
    await carregarDetalheAula(aulaDetalhe.value.id)
    definirFeedback(
      formatarMensagemQuantidade(
        quantidadeLancamentos,
        'lançamento salvo com sucesso.',
        'lançamentos salvos com sucesso.',
      ),
      'sucesso',
    )
  } catch (error) {
    definirFeedback(obterMensagemErro(error, 'Não foi possível salvar a frequência.'), 'erro')
  } finally {
    salvandoFrequencias.value = false
  }
}

async function atualizarContextoEmpresa() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  await carregarTudo()
}

async function carregarTudo() {
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()

  if (modoVisualizacaoEmpresa.value || !moduloAtivo.value) {
    aulaDetalhe.value = null
    participantesEdicao.value = []
    snapshotParticipantes.value = new Map()
    carregandoDetalhe.value = false
    erroDetalhe.value = ''
    return
  }

  await carregarDetalheAula(aulaId.value)
}

watch(
  () => [aulaId.value, moduloAtivo.value, modoVisualizacaoEmpresa.value],
  async ([novoId]) => {
    await carregarDetalheAula(novoId)
  },
)

onMounted(() => {
  carregarTudo().catch((error) => {
    console.error(error)
    erroDetalhe.value = obterMensagemErro(error, 'Não foi possível carregar os dados da tela.')
  })
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina aulas">
      <div>
        <p class="subtitulo">Gestão Esportiva</p>
        <h1>Detalhe da frequência</h1>
        <p class="descricao">
          Revise a aula, ajuste apenas os lançamentos alterados e salve com segurança.
        </p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" @click="voltarParaAulas">Voltar para aulas</button>
        <button v-if="podeCancelarAula" class="botao perigo" type="button" @click="abrirCancelamentoAula">
          Cancelar aula
        </button>
        <button v-if="podeReverterCancelamento" class="botao secundario" type="button" @click="abrirReversaoCancelamento">
          Reverter cancelamento
        </button>
        <button class="botao principal" type="button" :disabled="!podeSalvarFrequencias" @click="salvarFrequencias">
          {{ salvandoFrequencias ? 'Salvando...' : 'Salvar frequência' }}
        </button>
      </div>
    </header>

    <section v-if="feedback" class="feedback" :class="tipoFeedback">
      <p>{{ feedback }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso">
      <p>Selecione uma empresa no seletor superior para consultar e lançar as aulas como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloAtivo" class="card aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <section v-else class="detalhe-layout">
      <article class="card card-participantes">
        <div class="titulo-card">
          <div>
            <p class="subtitulo-mini">Participantes</p>
            <h2>
              {{ aulaDetalhe ? aulaDetalhe.turmaNome || `Aula ${aulaDetalhe.id}` : 'Selecione uma aula' }}
            </h2>
            <p class="descricao-card">
              {{ aulaDetalhe ? 'Ajuste somente os participantes alterados.' : 'Carregando detalhes da aula.' }}
            </p>
          </div>

          <div class="acoes-card">
            <button class="botao secundario" type="button" :disabled="carregandoDetalhe" @click="carregarDetalheAula(aulaId)">
              {{ carregandoDetalhe ? 'Carregando...' : 'Recarregar' }}
            </button>
          </div>
        </div>

        <section v-if="erroDetalhe" class="estado-erro">
          <p>{{ erroDetalhe }}</p>
        </section>

        <section v-else-if="carregandoDetalhe && !aulaDetalhe" class="estado-vazio">
          <p>Carregando detalhe da aula...</p>
        </section>

        <section v-else-if="!aulaDetalhe" class="estado-vazio">
          <p>Selecione uma aula para ver os participantes e lançar a frequência.</p>
        </section>

        <template v-else>
          <section class="cabecalho-detalhe">
            <div class="meta-aula">
              <div><span>Data</span><strong>{{ formatarDataPtBrSemFuso(aulaDetalhe.dataAula) || '-' }}</strong></div>
              <div><span>Horário</span><strong>{{ formatarHorario(aulaDetalhe.horarioInicio) }}</strong></div>
              <div><span>Duração</span><strong>{{ formatarDuracaoMinutos(aulaDetalhe.duracaoMinutos) }}</strong></div>
              <div><span>Turma</span><strong>{{ aulaDetalhe.turmaNome || '-' }}</strong></div>
              <div><span>Professor</span><strong>{{ aulaDetalhe.professorNome || '-' }}</strong></div>
              <div><span>Situação</span><strong>{{ rotuloSituacaoAula(aulaDetalhe.situacao) }}</strong></div>
            </div>

            <div class="chips-aula detalhe">
              <span v-if="rotuloNivelBeachTennis(aulaDetalhe.nivel)" class="chip">
                {{ rotuloNivelBeachTennis(aulaDetalhe.nivel) }}
              </span>
              <span v-if="aulaDetalhe.competicao" class="chip competicao">
                {{ rotuloCompeticaoBeachTennis(true) }}
              </span>
              <span v-else class="chip sutileza">Sem competição</span>
              <span class="chip situacao" :class="estadoSituacaoAula(aulaDetalhe.situacao)">
                {{ rotuloSituacaoAula(aulaDetalhe.situacao) }}
              </span>
            </div>

            <div class="resumo-frequencia">
              <div><span>Participantes</span><strong>{{ resumoFrequencias.quantidadeParticipantes }}</strong></div>
              <div><span>Presentes</span><strong>{{ resumoFrequencias.presentes }}</strong></div>
              <div><span>Faltas justificadas</span><strong>{{ resumoFrequencias.faltasJustificadas }}</strong></div>
              <div><span>Faltas sem justificativa</span><strong>{{ resumoFrequencias.faltasSemJustificativa }}</strong></div>
              <div><span>Não lançados</span><strong>{{ resumoFrequencias.naoLancados }}</strong></div>
            </div>

            <section v-if="aulaCancelada" class="aviso-bloqueio aula-cancelada">
              <p><strong>Esta aula está cancelada.</strong> A frequência pode ser visualizada, mas não pode ser alterada.</p>
              <p v-if="aulaDetalhe.motivoCancelamento">
                <strong>Motivo:</strong> {{ aulaDetalhe.motivoCancelamento }}
              </p>
              <p v-if="aulaDetalhe.canceladoEm">
                <strong>Cancelada em:</strong> {{ formatarDataHoraSemConversaoFuso(aulaDetalhe.canceladoEm) }}
              </p>
              <p v-if="aulaDetalhe.canceladoPorUsuarioNome">
                <strong>Cancelada por:</strong> {{ aulaDetalhe.canceladoPorUsuarioNome }}
              </p>
            </section>

            <section v-else-if="mensagemBloqueioCancelamento" class="aviso-bloqueio bloqueio-cancelamento">
              <p>{{ mensagemBloqueioCancelamento }}</p>
            </section>
          </section>

          <section v-if="!aulaCancelada" class="estado-vazio estado-vazio-compacto">
            <p>{{ mensagemEstadoAlteracoes }}</p>
          </section>

          <section v-if="temParticipantes" class="participantes">
            <article v-for="participante in participantesEdicao" :key="participante.clienteId" class="participante-card">
              <div class="participante-topo">
                <div>
                  <h3>{{ participante.clienteNome }}</h3>
                  <p class="participante-meta">
                    <span v-if="participante.clienteTelefone">{{ participante.clienteTelefone }}</span>
                    <span v-if="rotuloNivelBeachTennis(participante.clienteNivel)">
                      · {{ rotuloNivelBeachTennis(participante.clienteNivel) }}
                    </span>
                    <span v-if="participante.dataEntrada">
                      · Entrada {{ formatarDataPtBrSemFuso(participante.dataEntrada) }}
                    </span>
                    <span v-if="participante.dataSaida">
                      · Saída {{ formatarDataPtBrSemFuso(participante.dataSaida) }}
                    </span>
                  </p>
                </div>

                <div class="chips-participante">
                  <span class="chip situacao" :class="estadoSituacaoAula(participante.situacao)">
                    {{ rotuloSituacaoFrequencia(participante.situacao) }}
                  </span>
                  <span class="chip sutileza">{{ participante.tipoParticipacao }}</span>
                </div>
              </div>

              <div class="campos-participante">
                <label>
                  Situação
                  <select
                    v-model="participante.situacao"
                    :disabled="aulaCancelada || salvandoFrequencias || modoVisualizacaoEmpresa"
                    @change="aplicarSituacaoParticipante(participante)"
                  >
                    <option
                      v-for="opcao in opcoesSituacaoParticipante(participante, snapshotParticipantes)"
                      :key="opcao.valor"
                      :value="opcao.valor"
                    >
                      {{ opcao.rotulo }}
                    </option>
                  </select>
                </label>

                <label v-if="participante.situacao === 'FALTA_JUSTIFICADA'" :data-participante-id="participante.clienteId">
                  Justificativa
                  <textarea
                    v-model="participante.justificativa"
                    rows="2"
                    :disabled="aulaCancelada || salvandoFrequencias || modoVisualizacaoEmpresa"
                    data-campo="justificativa"
                    placeholder="Explique o motivo da falta"
                  ></textarea>
                </label>

                <label>
                  Observação
                  <textarea
                    v-model="participante.observacao"
                    rows="2"
                    :disabled="aulaCancelada || salvandoFrequencias || modoVisualizacaoEmpresa"
                    :placeholder="participante.situacao === 'FALTA_JUSTIFICADA' ? 'Comentário opcional sobre o lançamento' : 'Observação opcional'"
                  ></textarea>
                </label>
              </div>

              <div class="rodape-participante">
                <p>
                  <strong>Lançado em:</strong>
                  {{ formatarDataHora(participante.lancadoEm) || '-' }}
                </p>
                <p>
                  <strong>Atualizado em:</strong>
                  {{ formatarDataHora(participante.atualizadoEm) || '-' }}
                </p>
              </div>
            </article>
          </section>

          <div class="acoes-rodape">
            <button class="botao secundario" type="button" @click="voltarParaAulas">Voltar para aulas</button>
            <button class="botao principal" type="button" :disabled="!podeSalvarFrequencias" @click="salvarFrequencias">
              {{ salvandoFrequencias ? 'Salvando...' : 'Salvar frequência' }}
            </button>
          </div>
        </template>
      </article>
    </section>

    <section v-if="acaoCancelamento" class="modal-fundo" @click.self="fecharModalCancelamento">
      <form class="card modal pequena" @submit.prevent="confirmarCancelamentoAula">
        <div class="cabecalho-card">
          <div>
            <h2>{{ tituloModalCancelamento }}</h2>
            <p>{{ aulaDetalhe?.turmaNome || `Aula ${aulaDetalhe?.id || ''}` }}</p>
          </div>
          <button type="button" class="botao secundario" :disabled="processandoCancelamento" @click="fecharModalCancelamento">
            Fechar
          </button>
        </div>

        <section class="aviso-bloqueio cancelamento-resumo">
          <p>{{ textoConfirmacaoCancelamento }}</p>
          <p><strong>Turma:</strong> {{ aulaDetalhe?.turmaNome || '-' }}</p>
          <p><strong>Data:</strong> {{ formatarDataPtBrSemFuso(aulaDetalhe?.dataAula) || '-' }}</p>
          <p><strong>Horário:</strong> {{ formatarHorario(aulaDetalhe?.horarioInicio) }}</p>
        </section>

        <label v-if="acaoCancelamento === 'cancelar'">
          Motivo do cancelamento
          <textarea
            v-model="motivoCancelamento"
            rows="4"
            :disabled="processandoCancelamento"
            placeholder="Ex.: Professor indisponível"
          ></textarea>
        </label>

        <p v-if="erroCancelamento" class="estado-erro">{{ erroCancelamento }}</p>

        <button class="botao" :class="acaoCancelamento === 'reverter' ? 'secundario' : 'perigo'" type="submit" :disabled="processandoCancelamento">
          {{ textoBotaoModalCancelamento }}
        </button>
      </form>
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

.subtitulo,
.subtitulo-mini {
  margin: 0 0 8px;
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--app-primary);
}

.cabecalho-pagina h1,
.titulo-card h2,
.participante-card h3 {
  margin: 0;
}

.descricao,
.descricao-card,
.estado-vazio p,
.estado-erro p,
.feedback p,
.aviso-bloqueio p,
.participante-meta,
.rodape-participante p {
  margin: 0;
  color: var(--app-text-muted);
}

.acoes-cabecalho,
.acoes-card,
.chips-aula,
.chips-participante,
.acoes-rodape {
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
  transition: transform 0.2s ease, opacity 0.2s ease, background 0.2s ease;
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

.botao.perigo {
  background: linear-gradient(135deg, var(--app-danger), color-mix(in srgb, var(--app-danger) 88%, black));
  color: #fff;
}

.feedback {
  padding: 16px 18px;
}

.feedback.erro,
.estado-erro {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
}

.feedback.erro {
  color: var(--app-danger);
}

.feedback.sucesso {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.feedback.info,
.feedback.aviso {
  border-color: var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.cabecalho-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.cabecalho-card p {
  margin-top: 6px;
  color: var(--app-text-muted);
}

.aviso {
  padding: 20px 22px;
  color: var(--app-text);
}

.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 30;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.45);
}

.modal {
  width: min(100%, 920px);
  max-height: 88vh;
  overflow: auto;
}

.pequena {
  width: min(100%, 620px);
}

.detalhe-layout {
  display: grid;
  grid-template-columns: minmax(0, 980px);
  justify-content: center;
  gap: 20px;
}

.card-participantes {
  display: grid;
  gap: 18px;
  padding: 22px;
}

.titulo-card {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.contador {
  background: var(--app-primary-soft);
  color: var(--app-primary);
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 900;
  white-space: nowrap;
}

.cabecalho-detalhe {
  display: grid;
  gap: 16px;
}

.meta-aula {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.meta-aula div,
.resumo-frequencia div {
  display: grid;
  gap: 4px;
  padding: 12px 14px;
  border-radius: 14px;
  background: var(--app-surface-soft);
  border: 1px solid var(--app-border);
}

.meta-aula span,
.resumo-frequencia span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.meta-aula strong,
.resumo-frequencia strong {
  font-size: 15px;
  font-weight: 800;
}

.resumo-frequencia {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.aviso-bloqueio {
  padding: 14px 16px;
  border-radius: 16px;
  border: 1px solid var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.aula-cancelada {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.bloqueio-cancelamento {
  border-color: var(--app-warning);
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.cancelamento-resumo {
  display: grid;
  gap: 8px;
}

.cancelamento-resumo p {
  margin: 0;
}

.participantes {
  display: grid;
  gap: 14px;
}

.participante-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border-radius: 18px;
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
}

.participante-topo {
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: flex-start;
}

.participante-meta {
  margin-top: 6px;
  overflow-wrap: anywhere;
}

.campos-participante {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.rodape-participante {
  display: flex;
  flex-wrap: wrap;
  gap: 12px 18px;
  justify-content: space-between;
}

.estado-vazio,
.estado-erro {
  padding: 24px 18px;
  border-radius: 16px;
  text-align: center;
  border: 1px dashed var(--app-border);
}

.estado-vazio-compacto {
  text-align: left;
  border-style: solid;
}

.estado-erro {
  text-align: left;
}

.estado-erro p,
.estado-vazio p {
  color: var(--app-text-muted);
}

.estado-erro {
  color: var(--app-danger);
}

.chip {
  display: inline-flex;
  align-items: center;
  padding: 6px 10px;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 700;
}

.chip.sutileza {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

.chip.competicao {
  background: #fef3c7;
  color: #b45309;
}

.chip.situacao.estado-agendada,
.chip.situacao.estado-realizada {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.chip.situacao.estado-cancelada,
.chip.situacao.estado-nao_realizada {
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.chip.situacao.estado-nao_lancado {
  background: var(--app-surface-soft);
  color: var(--app-text-muted);
}

label {
  display: grid;
  gap: 8px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 600;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 11px 12px;
  background: var(--app-surface-strong);
  color: var(--app-text);
}

textarea {
  resize: vertical;
  min-height: 92px;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.acoes-rodape {
  justify-content: space-between;
  align-items: center;
  padding-top: 6px;
  border-top: 1px solid var(--app-border);
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .titulo-card,
  .participante-topo,
  .acoes-rodape {
    flex-direction: column;
    align-items: flex-start;
  }

  .meta-aula,
  .resumo-frequencia,
  .campos-participante {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 640px) {
  .cabecalho-pagina,
  .card-participantes {
    padding: 18px;
  }
}
</style>
