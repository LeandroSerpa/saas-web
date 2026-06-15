<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarAlunosTurmaBeachTennis,
  buscarClientesDisponiveisBeachTennis,
  buscarTurmaBeachTennisOuLista,
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
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const route = useRoute()
const router = useRouter()
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const nomeModalidade = computed(() => contextoEsportivo.value?.nomeModalidade || 'Esporte')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Participante')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Participantes')
const termoGrupoSingular = computed(() => contextoEsportivo.value?.termoGrupoSingular || 'Turma')
const termoGrupoPlural = computed(() => contextoEsportivo.value?.termoGrupoPlural || 'Turmas')

const turmaId = computed(() => String(route.params.turmaId || '').trim())
const turma = ref(null)
const alunosCache = ref({})
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
const buscaDisponiveisDigitada = ref('')
const buscaDisponiveisDebounced = ref('')
const buscaVinculados = ref('')
const filtroNivel = ref('')
const filtroPerfil = ref('')
const somenteAtivos = ref(true)
const confirmarSaidaAberta = ref(false)
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA
let temporizadorBusca = null
let resolverSaidaPendencia = null
let sequenciaCarregamentoDisponiveis = 0

const EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS = 'beach-tennis-turmas-atualizadas'

const tituloPagina = computed(() =>
  turma.value?.nome
    ? `Gerenciar ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')} - ${turma.value.nome}`
    : `Gerenciar ${termoParticipantePlural.value.toLocaleLowerCase('pt-BR')}`,
)
const descricaoPagina = computed(() =>
  `Escolha quem entra ou sai da ${termoGrupoSingular.value.toLocaleLowerCase('pt-BR')} em lote, com busca paginada e salvamento único.`,
)
const quantidadeAtual = computed(() => idsIniciais.value.size)
const quantidadeFinal = computed(() => idsAtuais.value.size)
const quantidadeAlterada = computed(() => diferencaIds(idsIniciais.value, idsAtuais.value).adicionados.length + diferencaIds(idsIniciais.value, idsAtuais.value).removidos.length)
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

  return `${quantidadeFinal.value} de ${capacidade.value} participantes`
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
  alunosDisponiveis.value.filter((aluno) => !idsAtuais.value.has(obterChaveAluno(aluno))),
)
const listaVinculadosExibidos = computed(() => {
  const busca = normalizarTexto(buscaVinculados.value)
  const lista = [...idsAtuais.value]
    .map((id) => alunosCache.value[String(id)] || criarAlunoResumo(String(id)))
    .filter(Boolean)

  if (!busca) {
    return lista.sort(compararPorNome)
  }

  return lista.filter((aluno) => campoAlunoPesquisa(aluno).some((valor) => normalizarTexto(valor).includes(busca))).sort(compararPorNome)
})
const selecionadosDisponiveis = computed(() => idsMarcadosDisponiveis.value.size)
const selecionadosTurma = computed(() => idsMarcadosTurma.value.size)
const podeSalvar = computed(() => alteracoesPendentes.value && !avisarCapacidade.value && !salvando.value)
const subtituloColunaDisponiveis = computed(() =>
  `${listaDisponiveisVisiveis.value.length} visíveis`,
)
const subtituloColunaTurma = computed(() =>
  `${listaVinculadosExibidos.value.length} vinculados`,
)

function criarConjunto(valor = []) {
  return new Set((Array.isArray(valor) ? valor : [valor]).map((item) => String(item).trim()).filter(Boolean))
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
  const texto = String(valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number(texto)
  if (!Number.isFinite(numero) || numero <= 0) {
    return null
  }

  return numero
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim()
}

function obterChaveAluno(aluno = {}) {
  return String(aluno.id || aluno.clienteId || aluno.alunoId || '').trim()
}

function criarAlunoResumo(id) {
  return {
    id,
    nome: `Participante ${id}`,
    email: '',
    telefone: '',
    nivelBeachTennis: '',
    perfilBeachTennis: '',
    dataNascimento: '',
  }
}

function normalizarAluno(aluno = {}) {
  return {
    ...aluno,
    id: aluno.id ?? aluno.clienteId ?? aluno.alunoId ?? '',
    nome: aluno.nome || aluno.nomeCompleto || aluno.clienteNome || aluno.alunoNome || termoParticipanteSingular.value,
    email: aluno.email || '',
    telefone: aluno.telefone || '',
    nivelBeachTennis: aluno.nivelBeachTennis || '',
    perfilBeachTennis: aluno.perfilBeachTennis || '',
    dataNascimento: aluno.dataNascimento || aluno.nascimento || '',
  }
}

function compararPorNome(a, b) {
  return String(a?.nome || '').localeCompare(String(b?.nome || ''), 'pt-BR')
}

function campoAlunoPesquisa(aluno = {}) {
  return [
    aluno.nome,
    aluno.email,
    aluno.telefone,
    rotuloNivelBeachTennis(aluno.nivelBeachTennis),
    rotuloPerfilBeachTennis(aluno.perfilBeachTennis),
  ]
}

function indexarAlunos(lista = []) {
  const mapa = { ...alunosCache.value }
  for (const item of lista) {
    const aluno = normalizarAluno(item)
    const chave = obterChaveAluno(aluno)
    if (chave) {
      mapa[chave] = aluno
    }
  }
  alunosCache.value = mapa
}

function atualizarSelecoesIniciais(lista = []) {
  const ids = lista.map((item) => obterChaveAluno(item)).filter(Boolean)
  idsIniciais.value = criarConjunto(ids)
  idsAtuais.value = criarConjunto(ids)
  idsMarcadosDisponiveis.value = new Set()
  idsMarcadosTurma.value = new Set()
}

function atualizarAlunosDisponiveis(lista = []) {
  const mapa = new Map()
  for (const item of lista) {
    const aluno = normalizarAluno(item)
    const chave = obterChaveAluno(aluno)
    if (!chave || mapa.has(chave)) {
      continue
    }

    mapa.set(chave, aluno)
  }

  alunosDisponiveis.value = [...mapa.values()].sort(compararPorNome)
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

function extrairIdsAlunosResposta(resposta) {
  if (Array.isArray(resposta?.clienteIds)) {
    return resposta.clienteIds
  }

  if (Array.isArray(resposta?.alunoIds)) {
    return resposta.alunoIds
  }

  return extrairListaAlunosResposta(resposta)
    .map((item) => obterChaveAluno(item))
    .filter(Boolean)
}

function limparEstadosBuscaVisivel() {
  idsMarcadosDisponiveis.value = new Set()
  idsMarcadosTurma.value = new Set()
}

function alternarMarcadoDisponivel(aluno, marcado) {
  const chave = obterChaveAluno(aluno)
  if (!chave) return

  const conjunto = new Set(idsMarcadosDisponiveis.value)
  if (marcado) {
    conjunto.add(chave)
  } else {
    conjunto.delete(chave)
  }
  idsMarcadosDisponiveis.value = conjunto
}

function alternarMarcadoTurma(aluno, marcado) {
  const chave = obterChaveAluno(aluno)
  if (!chave) return

  const conjunto = new Set(idsMarcadosTurma.value)
  if (marcado) {
    conjunto.add(chave)
  } else {
    conjunto.delete(chave)
  }
  idsMarcadosTurma.value = conjunto
}

function selecionarTodosDisponiveis() {
  idsMarcadosDisponiveis.value = new Set(listaDisponiveisVisiveis.value.map((aluno) => obterChaveAluno(aluno)).filter(Boolean))
}

function selecionarTodosVinculados() {
  idsMarcadosTurma.value = new Set(listaVinculadosExibidos.value.map((aluno) => obterChaveAluno(aluno)).filter(Boolean))
}

function limparSelecaoDisponiveis() {
  idsMarcadosDisponiveis.value = new Set()
}

function limparSelecaoTurma() {
  idsMarcadosTurma.value = new Set()
}

function adicionarSelecionados() {
  const conjunto = new Set(idsAtuais.value)
  for (const id of idsMarcadosDisponiveis.value) {
    conjunto.add(String(id))
  }
  idsAtuais.value = conjunto
  limparSelecaoDisponiveis()
}

function removerSelecionados() {
  const conjunto = new Set(idsAtuais.value)
  for (const id of idsMarcadosTurma.value) {
    conjunto.delete(String(id))
  }
  idsAtuais.value = conjunto
  limparSelecaoTurma()
}

function desfazerAlteracoes() {
  idsAtuais.value = new Set(idsIniciais.value)
  limparEstadosBuscaVisivel()
  sucesso.value = ''
  erro.value = ''
}

function aplicarFiltroBusca() {
  if (temporizadorBusca) {
    window.clearTimeout(temporizadorBusca)
  }

  temporizadorBusca = window.setTimeout(() => {
    buscaDisponiveisDebounced.value = String(buscaDisponiveisDigitada.value || '').trim()
    paginacaoDisponiveis.value.page = 0
    limparSelecaoDisponiveis()
    carregarDisponiveis({ reiniciar: true })
  }, 300)
}

async function carregarContexto() {
  await carregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
}

async function carregarTurma() {
  if (!turmaId.value) {
    throw new Error('Turma não informada.')
  }

  const resposta = await buscarTurmaBeachTennisOuLista(turmaId.value)
  turma.value = resposta ? { ...resposta } : null

  if (!turma.value) {
    throw new Error('Turma não encontrada.')
  }
}

async function carregarVinculados() {
  if (!turmaId.value) {
    atualizarSelecoesIniciais([])
    return
  }

  try {
    carregandoVinculados.value = true
    const resposta = await buscarAlunosTurmaBeachTennis(turmaId.value)
    const lista = extrairListaAlunosResposta(resposta).map((item) => normalizarAluno(item))
    indexarAlunos(lista)
    atualizarSelecoesIniciais(lista)
  } catch (error) {
    throw error
  } finally {
    carregandoVinculados.value = false
  }
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

async function carregarDisponiveis({ reiniciar = false } = {}) {
  if (!turmaId.value) {
    atualizarAlunosDisponiveis([])
    return
  }

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

    if (sequenciaAtual !== sequenciaCarregamentoDisponiveis) {
      return
    }

    indexarAlunos(dadosPaginados.content)
    const visiveis = dadosPaginados.content
      .map((item) => normalizarAluno(item))
      .filter((item) => !idsAtuais.value.has(obterChaveAluno(item)))

    atualizarAlunosDisponiveis(reiniciar ? visiveis : [...alunosDisponiveis.value, ...visiveis])
    paginacaoDisponiveis.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }
  } catch (error) {
    throw error
  } finally {
    if (sequenciaAtual === sequenciaCarregamentoDisponiveis) {
      carregandoDisponiveis.value = false
    }
  }
}

async function carregarMaisDisponiveis() {
  if (paginacaoDisponiveis.value.last || carregandoDisponiveis.value) {
    return
  }

  paginacaoDisponiveis.value.page += 1
  await carregarDisponiveis({ reiniciar: false })
}

function atualizarMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  erro.value = mensagem || fallback
}

function voltarParaTurmas() {
  router.push('/beach-tennis/turmas')
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

async function salvarAlteracoes() {
  if (avisarCapacidade.value) {
    erro.value = `Há ${excedenteCapacidade.value} participante(s) acima da capacidade. Remova antes de salvar.`
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    const resposta = await salvarClientesTurmaBeachTennis(turmaId.value, [...idsAtuais.value])

    const idsResposta = extrairIdsAlunosResposta(resposta)
    if (idsResposta.length > 0) {
      const quantidadeResposta = Number(resposta?.quantidadeAlunos)
      idsIniciais.value = criarConjunto(idsResposta)
      idsAtuais.value = criarConjunto(idsResposta)

      if (turma.value) {
        turma.value = {
          ...turma.value,
          quantidadeAlunos: Number.isFinite(quantidadeResposta) ? quantidadeResposta : idsResposta.length,
        }
      }
    } else {
      await carregarTurma()
      await carregarVinculados()
    }

    limparEstadosBuscaVisivel()
    sucesso.value = 'Participantes atualizados com sucesso.'
    window.dispatchEvent(
      new CustomEvent(EVENTO_TURMAS_BEACH_TENNIS_ATUALIZADAS, {
        detail: { turmaId: turmaId.value },
      }),
    )
  } catch (error) {
    atualizarMensagemErro(error, 'Não foi possível salvar as alterações.')
  } finally {
    salvando.value = false
  }
}

async function recarregarTudo() {
  try {
    carregando.value = true
    erro.value = ''
    sucesso.value = ''

    await carregarContexto()

    if (modoVisualizacaoEmpresa.value || !moduloEsportivoAtivo.value) {
      turma.value = null
      atualizarAlunosDisponiveis([])
      atualizarSelecoesIniciais([])
      return
    }

    await carregarTurma()
    await carregarVinculados()
    await carregarDisponiveis({ reiniciar: true })
  } catch (error) {
    atualizarMensagemErro(error, 'Não foi possível carregar a gestão de participantes.')
  } finally {
    carregando.value = false
  }
}

function atualizarContextoEmpresa() {
  recarregarContextoGestaoEsportiva()
    .then(() => {
      modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
      return recarregarTudo()
    })
    .catch((error) => {
      atualizarMensagemErro(error, 'Não foi possível atualizar o contexto da empresa.')
    })
}

async function alterarAbaMobile(aba) {
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
  () => route.params.turmaId,
  async () => {
    if (!route.params.turmaId) {
      return
    }

    await recarregarTudo()
  },
)

watch([filtroNivel, filtroPerfil, somenteAtivos], async () => {
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
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarContextoEmpresa)
  window.removeEventListener('beforeunload', handleBeforeUnload)
  if (temporizadorBusca) {
    window.clearTimeout(temporizadorBusca)
  }
  sequenciaCarregamentoDisponiveis += 1
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
        <button class="botao secundario" type="button" :disabled="carregando" @click="recarregarTudo">
          {{ carregando ? 'Atualizando...' : 'Atualizar' }}
        </button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card feedback aviso">
      <p>Selecione uma empresa no seletor superior para gerenciar participantes como SUPER_ADMIN.</p>
    </section>

    <section v-else-if="!moduloEsportivoAtivo" class="card feedback aviso">
      <p>Este recurso só fica disponível para empresas com o módulo de Gestão Esportiva ativo.</p>
    </section>

    <section v-else class="conteudo-gerencia">
      <section class="card resumo-capacidade">
        <div class="resumo-topo">
          <div>
            <p class="subtitulo-mini">Turma</p>
            <h2>{{ turma?.nome || 'Carregando turma...' }}</h2>
            <p class="resumo-descricao">{{ turma?.descricao || `Gerencie ${termoParticipantePlural.toLocaleLowerCase('pt-BR')} em lote.` }}</p>
          </div>
          <button
            class="botao principal"
            type="button"
            :disabled="!podeSalvar"
            @click="salvarAlteracoes"
          >
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
          A seleção atual excede a capacidade em {{ excedenteCapacidade }} participante(s). Remova antes de salvar.
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
        <section class="coluna coluna-disponiveis" :class="{ ativa: abaMobileAtiva === 'disponiveis' }">
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
            <p>Carregando participantes disponíveis...</p>
          </section>

          <section v-else-if="!listaDisponiveisVisiveis.length" class="estado-vazio compacto">
            <p>Nenhum participante disponível com estes filtros.</p>
          </section>

          <div v-else class="lista-participantes">
            <article
              v-for="aluno in listaDisponiveisVisiveis"
              :key="obterChaveAluno(aluno)"
              class="participante-card"
              :class="{ selecionado: idsMarcadosDisponiveis.has(obterChaveAluno(aluno)) }"
              tabindex="0"
              role="button"
              :aria-pressed="idsMarcadosDisponiveis.has(obterChaveAluno(aluno))"
              @click="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(obterChaveAluno(aluno)))"
              @keydown.enter.prevent="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(obterChaveAluno(aluno)))"
              @keydown.space.prevent="alternarMarcadoDisponivel(aluno, !idsMarcadosDisponiveis.has(obterChaveAluno(aluno)))"
            >
              <label class="participante-selecao">
                <input
                  :checked="idsMarcadosDisponiveis.has(obterChaveAluno(aluno))"
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
                <span v-if="rotuloNivelBeachTennis(aluno.nivelBeachTennis)" class="chip">{{ rotuloNivelBeachTennis(aluno.nivelBeachTennis) }}</span>
                <span v-if="rotuloPerfilBeachTennis(aluno.perfilBeachTennis)" class="chip sutileza">
                  {{ rotuloPerfilBeachTennis(aluno.perfilBeachTennis) }}
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
            <p>
              {{ paginacaoDisponiveis.totalElements }} resultado(s) no servidor.
            </p>
          </footer>
        </section>

        <section class="coluna coluna-turma" :class="{ ativa: abaMobileAtiva === 'turma' }">
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
            <p>Carregando participantes vinculados...</p>
          </section>

          <section v-else-if="!listaVinculadosExibidos.length" class="estado-vazio compacto">
            <p>Nenhum participante vinculado a esta turma.</p>
          </section>

          <div v-else class="lista-participantes">
            <article
              v-for="aluno in listaVinculadosExibidos"
              :key="obterChaveAluno(aluno)"
              class="participante-card vinculado"
              :class="{ selecionado: idsMarcadosTurma.has(obterChaveAluno(aluno)) }"
              tabindex="0"
              role="button"
              :aria-pressed="idsMarcadosTurma.has(obterChaveAluno(aluno))"
              @click="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(obterChaveAluno(aluno)))"
              @keydown.enter.prevent="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(obterChaveAluno(aluno)))"
              @keydown.space.prevent="alternarMarcadoTurma(aluno, !idsMarcadosTurma.has(obterChaveAluno(aluno)))"
            >
              <label class="participante-selecao">
                <input
                  :checked="idsMarcadosTurma.has(obterChaveAluno(aluno))"
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
                <span v-if="rotuloNivelBeachTennis(aluno.nivelBeachTennis)" class="chip">{{ rotuloNivelBeachTennis(aluno.nivelBeachTennis) }}</span>
                <span v-if="rotuloPerfilBeachTennis(aluno.perfilBeachTennis)" class="chip sutileza">
                  {{ rotuloPerfilBeachTennis(aluno.perfilBeachTennis) }}
                </span>
              </div>
            </article>
          </div>

          <footer class="rodape-coluna">
            <button class="botao secundario" type="button" @click="desfazerAlteracoes">
              Desfazer alterações
            </button>
            <p>{{ idsAtuais.size }} participante(s) na turma.</p>
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

    <section v-if="confirmarSaidaAberta" class="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="confirmar-saida-titulo">
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
  overflow-x: hidden;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
  padding: 22px 24px;
  border: 1px solid #dbeafe;
  border-radius: 18px;
  background:
    radial-gradient(circle at top right, rgba(14, 165, 233, 0.14), transparent 30%),
    linear-gradient(135deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.06);
}

.subtitulo,
.subtitulo-mini {
  margin: 0 0 6px;
  color: #0ea5e9;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.cabecalho-pagina h1,
.resumo-capacidade h2,
.cabecalho-coluna h2,
.modal-card h2 {
  margin: 0;
  font-size: clamp(24px, 2.5vw, 34px);
  font-weight: 900;
}

.descricao,
.resumo-descricao,
.cabecalho-coluna p,
.modal-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.acoes-cabecalho,
.cabecalho-acoes,
.barra-fixa-acoes,
.modal-acoes,
.rodape-coluna {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
  align-items: center;
}

.card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 18px;
  padding: 20px;
  box-shadow: 0 12px 28px rgba(15, 23, 42, 0.06);
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.feedback.aviso {
  border-color: #fbbf24;
  background: #fffbeb;
  color: #92400e;
}

.conteudo-gerencia {
  display: grid;
  gap: 18px;
}

.resumo-capacidade {
  display: grid;
  gap: 16px;
}

.resumo-topo {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.metricas-capacidade {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.metrica {
  padding: 14px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  background: linear-gradient(180deg, #f8fbff 0%, #ffffff 100%);
}

.metrica span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.metrica strong {
  display: block;
  margin-top: 8px;
  color: #0f172a;
  font-size: 20px;
  font-weight: 900;
}

.metrica.alerta {
  border-color: #fecaca;
  background: #fef2f2;
}

.resumo-alteracoes {
  margin: 0;
  color: #1d4ed8;
  font-weight: 800;
}

.resumo-alerta {
  margin: 0;
  color: #b91c1c;
  font-weight: 800;
}

.botoes-mobile {
  display: none;
  gap: 8px;
}

.aba-mobile {
  flex: 1;
  min-height: 48px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #fff;
  color: #0f172a;
  font-weight: 900;
}

.aba-mobile.ativa {
  background: #0ea5e9;
  color: #fff;
  border-color: #0ea5e9;
}

.layout-gerencia {
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
  gap: 18px;
}

.coluna {
  display: grid;
  gap: 14px;
}

.cabecalho-coluna {
  display: grid;
  gap: 10px;
}

.barra-filtros,
.filtros-recolhiveis {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  align-items: end;
}

.filtros-recolhiveis {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.busca-interna,
label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
}

input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 12px;
  padding: 11px 12px;
  font-size: 15px;
  background: #fff;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
}

.estado-vazio {
  color: #64748b;
}

.estado-vazio.compacto {
  padding: 8px 0 0;
}

.lista-participantes {
  display: grid;
  gap: 12px;
}

.participante-card {
  display: grid;
  gap: 10px;
  padding: 14px 15px;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  background: #fff;
  cursor: pointer;
  transition: border-color 0.15s ease, box-shadow 0.15s ease, transform 0.15s ease;
}

.participante-card:hover,
.participante-card:focus-visible {
  border-color: #0ea5e9;
  box-shadow: 0 0 0 3px rgba(14, 165, 233, 0.12);
  transform: translateY(-1px);
}

.participante-card.selecionado {
  border-color: #0ea5e9;
  background: #f0f9ff;
}

.participante-card.vinculado.selecionado {
  border-color: #dc2626;
  background: #fef2f2;
}

.participante-selecao {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  align-items: flex-start;
  cursor: pointer;
}

.participante-selecao input {
  width: 22px;
  height: 22px;
  margin-top: 2px;
}

.participante-selecao strong {
  display: block;
  font-size: 15px;
}

.participante-selecao small {
  display: block;
  margin-top: 4px;
  color: #64748b;
  font-weight: 600;
  line-height: 1.45;
  word-break: break-word;
}

.chips-participante {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 900;
  background: #dbeafe;
  color: #1d4ed8;
}

.chip.sutileza {
  background: #e2e8f0;
  color: #334155;
}

.compacto {
  min-width: 0;
  padding: 8px 10px;
  font-size: 12px;
}

.principal {
  background: linear-gradient(135deg, #0ea5e9 0%, #2563eb 100%);
}

.secundario {
  background: #0f172a;
}

.perigo {
  background: #dc2626;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 900;
  transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.rodape-coluna {
  justify-content: space-between;
  align-items: center;
}

.rodape-coluna p {
  margin: 0;
  color: #64748b;
  font-weight: 800;
}

.barra-fixa-mobile {
  display: none;
}

.modal-fundo {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 18px;
  background: rgba(15, 23, 42, 0.42);
  backdrop-filter: blur(2px);
  z-index: 50;
}

.modal-card {
  width: min(520px, 100%);
  border: 1px solid #dbeafe;
}

.modal-acoes {
  margin-top: 18px;
  justify-content: flex-end;
}

@media (max-width: 980px) {
  .layout-gerencia {
    grid-template-columns: 1fr;
  }

  .metricas-capacidade {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }

  .barra-filtros,
  .filtros-recolhiveis {
    grid-template-columns: 1fr;
  }

  .cabecalho-pagina,
  .resumo-topo,
  .rodape-coluna {
    flex-direction: column;
    align-items: flex-start;
  }
}

@media (max-width: 720px) {
  .botoes-mobile {
    display: flex;
  }

  .coluna {
    display: none;
  }

  .coluna.ativa {
    display: grid;
  }

  .barra-fixa-mobile {
    position: fixed;
    left: 16px;
    right: 16px;
    bottom: 16px;
    display: flex;
    flex-direction: column;
    align-items: stretch;
    gap: 12px;
    padding: 14px 16px;
    border: 1px solid #dbeafe;
    border-radius: 18px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 -10px 24px rgba(15, 23, 42, 0.08);
    box-sizing: border-box;
    max-width: calc(100vw - 32px);
  }

  .barra-fixa-acoes {
    width: 100%;
  }

  .barra-fixa-acoes .botao {
    flex: 1;
  }

  .conteudo-gerencia {
    padding-bottom: 180px;
  }

  .barra-fixa-mobile strong {
    display: block;
    color: #0f172a;
  }

  .barra-fixa-mobile span {
    display: block;
    color: #64748b;
    font-size: 12px;
    font-weight: 700;
    margin-top: 2px;
  }
}
</style>
