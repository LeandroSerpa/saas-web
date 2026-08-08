<script setup>
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { onBeforeRouteLeave, useRoute, useRouter } from 'vue-router'
import ClienteForm from '@/components/ClienteForm.vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarClientes,
  cadastrarCliente,
  atualizarCliente,
  atualizarAtivoCliente,
  excluirCliente,
  buscarStatusFinanceiroMinhaEmpresa,
  obterEmpresaIdOperacao,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import {
  OPCOES_NIVEL_BEACH_TENNIS,
  OPCOES_PERFIL_BEACH_TENNIS,
  formatarDataBrasileira,
  rotuloCompeticaoBeachTennis,
  rotuloFrequenciaSemanalBeachTennis,
  rotuloNivelBeachTennis,
  rotuloPerfilBeachTennis,
  rotuloPlanoBeachTennis,
} from '@/utils/beachTennis'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { criarNavegacaoRetornoTurmaAlunos } from '@/utils/beachTennisCadastroAluno'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const route = useRoute()
const router = useRouter()
const clientes = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoCliente = ref('')
const clienteEditandoId = ref(null)
const statusFinanceiro = ref(null)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const paginacao = ref(criarPaginacaoInicial())
const termoBusca = ref('')
const filtroAtivo = ref('')
const filtroNivel = ref('')
const filtroPerfil = ref('')
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA

const cliente = ref(criarClienteInicial())
const clienteOriginal = ref(criarClienteInicial())
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(() => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages)
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const rotaCadastroGeralAlunos = computed(() => route.name === 'beach-tennis-cadastro-alunos')
const termoParticipanteSingular = computed(() => contextoEsportivo.value?.termoParticipanteSingular || 'Aluno')
const termoParticipantePlural = computed(() => contextoEsportivo.value?.termoParticipantePlural || 'Alunos')
const rotuloSingularCapitalizado = computed(() =>
  moduloEsportivoAtivo.value ? termoParticipanteSingular.value : 'Cliente',
)
const rotuloSingular = computed(() =>
  moduloEsportivoAtivo.value ? termoParticipanteSingular.value.toLocaleLowerCase('pt-BR') : 'cliente',
)
const rotuloPlural = computed(() =>
  moduloEsportivoAtivo.value ? termoParticipantePlural.value.toLocaleLowerCase('pt-BR') : 'clientes',
)
const tituloPagina = computed(() => {
  if (rotaCadastroGeralAlunos.value) {
    return moduloEsportivoAtivo.value ? termoParticipantePlural.value : 'Clientes'
  }

  return moduloEsportivoAtivo.value ? `Cadastro de ${rotuloPlural.value}` : 'Clientes'
})
const subtituloPagina = computed(() =>
  moduloEsportivoAtivo.value ? contextoEsportivo.value?.nomeModalidade || 'Gestão esportiva' : 'Relacionamento',
)
const descricaoPagina = computed(() =>
  rotaCadastroGeralAlunos.value && moduloEsportivoAtivo.value
    ? `Cadastre e mantenha os dados dos ${rotuloPlural.value} da modalidade.`
    : moduloEsportivoAtivo.value
      ? `Cadastre e mantenha os dados dos ${rotuloPlural.value} da modalidade.`
      : 'Consulte a base de clientes e cadastre novos contatos.',
)
const tituloLista = computed(() =>
  moduloEsportivoAtivo.value ? `${termoParticipantePlural.value} cadastrados` : 'Clientes cadastrados',
)
const descricaoLista = computed(() =>
  moduloEsportivoAtivo.value
    ? `Consulte e gerencie os ${rotuloPlural.value} cadastrados.`
    : 'Consulte e gerencie os clientes cadastrados.',
)
const textoCarregando = computed(() => `Carregando ${rotuloPlural.value}...`)
const textoVazio = computed(() => `Nenhum ${rotuloSingular.value} encontrado.`)
const textoBusca = computed(() => `Buscar ${rotuloPlural.value}`)
const contadorLista = computed(() =>
  moduloEsportivoAtivo.value
    ? `${paginacao.value.totalElements} ${paginacao.value.totalElements === 1 ? rotuloSingular.value : rotuloPlural.value}`
    : `${paginacao.value.totalElements} cliente(s)`,
)
const resumoPaginacao = computed(
  () =>
    moduloEsportivoAtivo.value
      ? `${paginacao.value.totalElements} ${paginacao.value.totalElements === 1 ? 'registro' : 'registros'} - Página ${paginaAtualHumana.value} de ${paginacao.value.totalPages}`
      : `${paginacao.value.totalElements} registro(s) - Página ${paginaAtualHumana.value} de ${paginacao.value.totalPages}`,
)
const tituloSecaoEsportiva = computed(() =>
  contextoEsportivo.value?.nomeModalidade === 'Beach Tennis'
    ? 'Dados de Beach Tennis'
    : `Dados esportivos - ${contextoEsportivo.value?.nomeModalidade || 'Esporte'}`,
)
const formularioAlterado = computed(
  () => JSON.stringify(normalizarClienteFormulario(cliente.value)) !== JSON.stringify(clienteOriginal.value),
)
const deveConfirmarSaida = computed(() => !modoVisualizacaoEmpresa.value && formularioAlterado.value)
let temporizadorBusca = null

function contextoOperacionalAtual() {
  return String(obterEmpresaIdOperacao() || 'GLOBAL')
}

function criarClienteInicial() {
  return {
    nome: '',
    telefone: '',
    email: '',
    observacao: '',
    dataNascimento: '',
    perfilBeachTennis: '',
    nivelBeachTennis: '',
    participaCompeticaoBeachTennis: false,
    frequenciaSemanalBeachTennis: '',
    planoBeachTennis: '',
    observacoesBeachTennis: '',
  }
}

function normalizarClienteFormulario(clienteItem = {}) {
  return {
    nome: clienteItem.nome || '',
    telefone: clienteItem.telefone || '',
    email: clienteItem.email || '',
    observacao: clienteItem.observacao || '',
    dataNascimento: clienteItem.dataNascimento || clienteItem.nascimento || '',
    perfilBeachTennis: clienteItem.perfilBeachTennis || '',
    nivelBeachTennis: clienteItem.nivelBeachTennis || '',
    participaCompeticaoBeachTennis: clienteItem.participaCompeticaoBeachTennis === true,
    frequenciaSemanalBeachTennis: clienteItem.frequenciaSemanalBeachTennis || '',
    planoBeachTennis: clienteItem.planoBeachTennis || '',
    observacoesBeachTennis: clienteItem.observacoesBeachTennis || clienteItem.observacaoBeachTennis || '',
  }
}

function montarPayloadCliente() {
  const payload = {
    empresaId: obterEmpresaIdOperacao() ? Number(obterEmpresaIdOperacao()) : '',
    nome: cliente.value.nome || '',
    telefone: cliente.value.telefone || '',
    email: cliente.value.email || '',
    observacao: cliente.value.observacao || '',
  }

  if (moduloEsportivoAtivo.value) {
    return {
      ...payload,
      dataNascimento: cliente.value.dataNascimento || '',
      perfilBeachTennis: cliente.value.perfilBeachTennis || '',
      nivelBeachTennis: cliente.value.nivelBeachTennis || '',
      participaCompeticaoBeachTennis: cliente.value.participaCompeticaoBeachTennis === true,
      frequenciaSemanalBeachTennis: cliente.value.frequenciaSemanalBeachTennis || '',
      planoBeachTennis: cliente.value.planoBeachTennis || '',
      observacoesBeachTennis: cliente.value.observacoesBeachTennis || '',
    }
  }

  return payload
}

function temDadosBeachTennis(clienteItem = {}) {
  if (!moduloEsportivoAtivo.value) {
    return false
  }

  return Boolean(
      clienteItem.dataNascimento ||
      clienteItem.nascimento ||
      clienteItem.perfilBeachTennis ||
      clienteItem.nivelBeachTennis ||
      clienteItem.participaCompeticaoBeachTennis === true ||
      clienteItem.frequenciaSemanalBeachTennis ||
      clienteItem.planoBeachTennis ||
      clienteItem.observacoesBeachTennis || clienteItem.observacaoBeachTennis,
  )
}

function listaResumoBeachTennis(clienteItem = {}) {
  const itens = []

  const perfil = rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)
  const nivel = rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)
  const frequencia = rotuloFrequenciaSemanalBeachTennis(clienteItem.frequenciaSemanalBeachTennis)
  const plano = rotuloPlanoBeachTennis(clienteItem.planoBeachTennis)
  const nascimento = formatarDataBrasileira(clienteItem.dataNascimento || clienteItem.nascimento)

  if (perfil) itens.push(`Perfil: ${perfil}`)
  if (nivel) itens.push(`Nível: ${nivel}`)
  if (clienteItem.participaCompeticaoBeachTennis === true) itens.push('Participa de competição: Sim')
  if (frequencia) itens.push(`Frequência: ${frequencia}`)
  if (plano) itens.push(`Plano: ${plano}`)
  if (nascimento) itens.push(`Nascimento: ${nascimento}`)

  return itens
}

function normalizarIdPositivo(valor) {
  const texto = String(Array.isArray(valor) ? valor[0] : valor ?? '').trim()
  if (!texto) {
    return null
  }

  const numero = Number.parseInt(texto, 10)
  return Number.isInteger(numero) && numero > 0 ? numero : null
}

function normalizarFiltroAtivo(valor) {
  if (valor === '') {
    return ''
  }

  return valor === true || valor === 'true'
}

function montarFiltrosClienteConsulta() {
  const filtros = {
    page: paginacao.value.page,
    size: paginacao.value.size,
  }

  const busca = String(termoBusca.value || '').trim()
  if (busca) {
    filtros.busca = busca
  }

  if (filtroAtivo.value !== '') {
    filtros.ativo = normalizarFiltroAtivo(filtroAtivo.value)
  }

  if (moduloEsportivoAtivo.value) {
    const nivel = String(filtroNivel.value || '').trim()
    const perfil = String(filtroPerfil.value || '').trim()

    if (nivel) {
      filtros.nivel = nivel
    }

    if (perfil) {
      filtros.perfil = perfil
    }
  }

  return filtros
}

function obterEstadoNavegacao() {
  if (typeof window === 'undefined') {
    return {}
  }

  return window.history && typeof window.history.state === 'object' && window.history.state !== null
    ? window.history.state
    : {}
}

function obterOrigemTurmaCadastro() {
  const turmaId = normalizarIdPositivo(Array.isArray(route.query.turmaId) ? route.query.turmaId[0] : route.query.turmaId)
  const estado = obterEstadoNavegacao()
  const turmaIdEstado = normalizarIdPositivo(estado?.origemTurmaId || estado?.turmaId)

  if (!turmaId || !turmaIdEstado || turmaId !== turmaIdEstado) {
    return null
  }

  return {
    turmaId,
    estado,
  }
}

function confirmarSaidaFormulario() {
  return window.confirm('Existem alterações não salvas. Deseja sair mesmo assim?')
}

function registrarOrigemFormulario(clienteItem = null) {
  clienteOriginal.value = clienteItem ? normalizarClienteFormulario(clienteItem) : criarClienteInicial()
}

function limparTemporizadorBusca() {
  if (temporizadorBusca) {
    clearTimeout(temporizadorBusca)
    temporizadorBusca = null
  }
}
async function carregarClientes() {
  const contextoInicial = contextoOperacionalAtual()

  try {
    carregando.value = true
    erro.value = ''
    modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()

    if (modoVisualizacaoEmpresa.value) {
      clientes.value = []
      paginacao.value = criarPaginacaoInicial()
      return
    }

    const resposta = await buscarClientes(montarFiltrosClienteConsulta())
    const dadosPaginados = normalizarRespostaPaginada(resposta, paginacao.value)

    if (contextoOperacionalAtual() !== contextoInicial) {
      return
    }

    clientes.value = dadosPaginados.content
    paginacao.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }

    if (
      dadosPaginados.paginada &&
      dadosPaginados.page > 0 &&
      dadosPaginados.content.length === 0 &&
      dadosPaginados.totalElements > 0
    ) {
      const ultimaPaginaValida = Math.max(dadosPaginados.totalPages - 1, 0)

      if (ultimaPaginaValida !== dadosPaginados.page) {
        paginacao.value.page = ultimaPaginaValida
        await carregarClientes()
      }
    }
  } catch (error) {
    if (contextoOperacionalAtual() !== contextoInicial) {
      return
    }

    erro.value = 'Não foi possível carregar os clientes.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarCliente() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''

    if (!clienteEditandoId.value && empresaBloqueadaFinanceiro()) {
      erro.value = 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.'
      return
    }

    if (!cliente.value.nome.trim()) {
      erro.value = moduloEsportivoAtivo.value ? `Informe o nome do ${rotuloSingular.value}.` : 'Informe o nome do cliente.'
      return
    }

    const dadosCliente = montarPayloadCliente()

    if (clienteEditandoId.value) {
      await atualizarCliente(clienteEditandoId.value, dadosCliente)
      mensagemSucessoCliente.value = moduloEsportivoAtivo.value
        ? `${rotuloSingularCapitalizado.value} atualizado com sucesso.`
        : 'Cliente atualizado com sucesso.'
    } else {
      const respostaCadastro = await cadastrarCliente(dadosCliente)
      mensagemSucessoCliente.value = moduloEsportivoAtivo.value
        ? `${rotuloSingularCapitalizado.value} cadastrado com sucesso.`
        : 'Cliente cadastrado com sucesso.'

      const origemTurma = rotaCadastroGeralAlunos.value ? obterOrigemTurmaCadastro() : null

      if (origemTurma && respostaCadastro?.id) {
        const navegacaoRetorno = criarNavegacaoRetornoTurmaAlunos(
          origemTurma.turmaId,
          respostaCadastro.id,
          respostaCadastro,
        )

        if (!navegacaoRetorno) {
          erro.value = 'O aluno foi cadastrado com sucesso, mas não foi possível retornar à turma.'
          cancelarEdicaoCliente(false)
          await carregarClientes()
          return
        }

        try {
          await router.replace(navegacaoRetorno)
          return
        } catch (erroNavegacao) {
          erro.value = 'O aluno foi cadastrado com sucesso, mas não foi possível retornar à turma.'
          console.error(erroNavegacao)
          cancelarEdicaoCliente(false)
          await carregarClientes()
          return
        }
      }
    }

    cancelarEdicaoCliente(false)
    await carregarClientes()
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      clienteEditandoId.value
        ? moduloEsportivoAtivo.value
          ? `Não foi possível atualizar o ${rotuloSingular.value}.`
          : 'Não foi possível atualizar o cliente.'
        : moduloEsportivoAtivo.value
          ? `Não foi possível cadastrar o ${rotuloSingular.value}.`
          : 'Não foi possível cadastrar o cliente.',
    )
    console.error(error)
  }
}

async function enviarClienteParaLixeira(clienteItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  const confirmou = window.confirm(
    moduloEsportivoAtivo.value
      ? `Deseja enviar o ${rotuloSingular.value} "${clienteItem?.nome || ''}" para a lixeira?`
      : `Deseja enviar o cliente "${clienteItem?.nome || ''}" para a lixeira?`,
  )

  if (!confirmou) {
    return
  }

  const motivoInformado = window.prompt('Motivo da exclusão (opcional):', '')

  if (motivoInformado === null) {
    return
  }

  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''
    await excluirCliente(clienteItem.id, String(motivoInformado || '').trim())
    clientes.value = clientes.value.filter((item) => String(item.id) !== String(clienteItem.id))
    mensagemSucessoCliente.value = moduloEsportivoAtivo.value
      ? `${rotuloSingularCapitalizado.value} enviado para a lixeira com sucesso.`
      : 'Registro enviado para a lixeira com sucesso.'

    if (clienteEditandoId.value && String(clienteEditandoId.value) === String(clienteItem.id)) {
      cancelarEdicaoCliente(false)
    }

    await carregarClientes()
  } catch (error) {
    erro.value = obterMensagemErroExclusao(error)
    console.error(error)
  }
}

async function alternarAtivoCliente(clienteItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''
    const novoEstado = clienteItem?.ativo === true ? false : true
    await atualizarAtivoCliente(clienteItem.id, novoEstado)
    mensagemSucessoCliente.value = novoEstado
      ? `${rotuloSingularCapitalizado.value} ativado com sucesso.`
      : `${rotuloSingularCapitalizado.value} inativado com sucesso.`
    await carregarClientes()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar o status do registro.')
    console.error(error)
  }
}

async function carregarStatusFinanceiro() {
  const contextoInicial = contextoOperacionalAtual()

  if (modoVisualizacaoEmpresaAtivo()) {
    statusFinanceiro.value = null
    return
  }

  try {
    const statusFinanceiroApi = await buscarStatusFinanceiroMinhaEmpresa()

    if (contextoOperacionalAtual() !== contextoInicial) {
      return
    }

    statusFinanceiro.value = statusFinanceiroApi
  } catch (error) {
    if (contextoOperacionalAtual() !== contextoInicial) {
      return
    }

    statusFinanceiro.value = null
    console.error(error)
  }
}

function empresaBloqueadaFinanceiro() {
  return String(statusFinanceiro.value?.statusFinanceiro || statusFinanceiro.value?.status || '')
    .trim()
    .toUpperCase() === 'BLOQUEADA_FINANCEIRO'
}

function editarCliente(clienteItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  erro.value = ''
  mensagemSucessoCliente.value = ''
  clienteEditandoId.value = clienteItem.id
  cliente.value = normalizarClienteFormulario(clienteItem)
  clienteOriginal.value = normalizarClienteFormulario(clienteItem)
}

function cancelarEdicaoCliente(limparMensagens = true) {
  clienteEditandoId.value = null
  cliente.value = criarClienteInicial()
  clienteOriginal.value = criarClienteInicial()

  if (limparMensagens) {
    mensagemSucessoCliente.value = ''
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

function obterMensagemErroExclusao(error) {
  if (error?.status === 403) {
    return 'Você não tem permissão para excluir este registro.'
  }

  if (error?.status === 404) {
    return 'Registro não encontrado ou já removido.'
  }

  return obterMensagemErro(error, 'Não foi possível enviar o registro para a lixeira. Tente novamente.')
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  paginacao.value.page = Math.max(paginacao.value.page - 1, 0)
  await carregarClientes()
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  paginacao.value.page += 1
  await carregarClientes()
}

async function alterarTamanhoPagina() {
  paginacao.value.page = 0
  await carregarClientes()
}

async function atualizarModoVisualizacao() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  cancelarEdicaoCliente(false)
  clientes.value = []
  paginacao.value = criarPaginacaoInicial()
  carregarClientes()
  carregarStatusFinanceiro()
}

watch(termoBusca, () => {
  limparTemporizadorBusca()
  temporizadorBusca = window.setTimeout(() => {
    paginacao.value.page = 0
    void carregarClientes()
  }, 350)
})

watch([filtroAtivo, filtroNivel, filtroPerfil], () => {
  paginacao.value.page = 0
  void carregarClientes()
})

onBeforeRouteLeave((_to, _from, next) => {
  if (!deveConfirmarSaida.value) {
    next()
    return
  }

  if (confirmarSaidaFormulario()) {
    next()
    return
  }

  next(false)
})

onMounted(() => {
  carregarContextoGestaoEsportiva()
  carregarClientes()
  carregarStatusFinanceiro()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
  window.addEventListener('beforeunload', bloquearSaidaNavegador)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
  window.removeEventListener('beforeunload', bloquearSaidaNavegador)
  limparTemporizadorBusca()
})

function bloquearSaidaNavegador(evento) {
  if (!deveConfirmarSaida.value) {
    return
  }

  evento.preventDefault()
  evento.returnValue = ''
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">{{ subtituloPagina }}</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">{{ descricaoPagina }}</p>
      </div>

      <button class="botao secundario" @click="carregarClientes">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso-visualizacao">
      <p>Selecione uma empresa no seletor superior para operar esta tela.</p>
    </section>

    <section v-if="!modoVisualizacaoEmpresa" class="card filtros-clientes">
      <div class="filtros-clientes-grid">
        <label class="campo-filtro campo-grande">
          {{ textoBusca }}
          <input v-model="termoBusca" type="search" placeholder="Nome, telefone ou e-mail" />
        </label>

        <label class="campo-filtro">
          Status
          <select v-model="filtroAtivo">
            <option value="">Todos</option>
            <option value="true">Ativos</option>
            <option value="false">Inativos</option>
          </select>
        </label>

        <label v-if="moduloEsportivoAtivo" class="campo-filtro">
          Nível
          <select v-model="filtroNivel">
            <option value="">Todos</option>
            <option v-for="opcao in OPCOES_NIVEL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label v-if="moduloEsportivoAtivo" class="campo-filtro">
          Perfil
          <select v-model="filtroPerfil">
            <option value="">Todos</option>
            <option v-for="opcao in OPCOES_PERFIL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>
      </div>
    </section>

    <ClienteForm
      v-if="!modoVisualizacaoEmpresa"
      v-model="cliente"
      :contexto-esportivo="contextoEsportivo"
      :mensagem-sucesso="mensagemSucessoCliente"
      :modo-edicao="Boolean(clienteEditandoId)"
      @salvar="salvarCliente"
      @cancelar="cancelarEdicaoCliente"
    />

    <section class="secao-clientes">
      <div class="cabecalho-lista">
        <div>
          <h2>{{ tituloLista }}</h2>
          <p>{{ descricaoLista }}</p>
        </div>

        <span class="contador">{{ contadorLista }}</span>
      </div>

      <section v-if="carregando" class="card">
        <p>{{ textoCarregando }}</p>
      </section>

      <section v-else-if="clientes.length === 0" class="card">
        <p>{{ textoVazio }}</p>
      </section>

      <section v-else class="lista-clientes">
        <article v-for="clienteItem in clientes" :key="clienteItem.id" class="card cliente-card">
          <div class="cabecalho-cliente">
            <div>
              <h3>{{ clienteItem.nome }}</h3>
              <p class="email">{{ exibirValor(clienteItem.email) }}</p>
              <p class="status-cliente">
                <span :class="clienteItem.ativo === false ? 'chip status inativo' : 'chip status ativo'">
                  {{ clienteItem.ativo === false ? 'Inativo' : 'Ativo' }}
                </span>
              </p>
            </div>

            <div v-if="temDadosBeachTennis(clienteItem)" class="chips-beach">
              <span v-if="rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)" class="chip beach">
                {{ rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis) }}
              </span>
              <span v-if="rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)" class="chip beach sutileza">
                {{ rotuloNivelBeachTennis(clienteItem.nivelBeachTennis) }}
              </span>
              <span v-if="clienteItem.participaCompeticaoBeachTennis === true" class="chip beach competicao">
                {{ rotuloCompeticaoBeachTennis(true) }}
              </span>
            </div>
          </div>

          <div class="detalhes">
            <p><strong>Telefone:</strong> {{ exibirValor(clienteItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(clienteItem.email) }}</p>
            <p><strong>Observação:</strong> {{ exibirValor(clienteItem.observacao) }}</p>
          </div>

          <details v-if="temDadosBeachTennis(clienteItem)" class="beach-resumo">
            <summary>{{ tituloSecaoEsportiva }}</summary>
            <div class="beach-resumo-grid">
              <p><strong>Data de nascimento:</strong> {{ exibirValor(formatarDataBrasileira(clienteItem.dataNascimento || clienteItem.nascimento)) }}</p>
              <p><strong>Perfil:</strong> {{ exibirValor(rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)) }}</p>
              <p><strong>Nível:</strong> {{ exibirValor(rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)) }}</p>
              <p><strong>Participa de competição:</strong> {{ clienteItem.participaCompeticaoBeachTennis === true ? 'Sim' : 'Não' }}</p>
              <p><strong>Frequência:</strong> {{ exibirValor(rotuloFrequenciaSemanalBeachTennis(clienteItem.frequenciaSemanalBeachTennis)) }}</p>
              <p><strong>Plano:</strong> {{ exibirValor(rotuloPlanoBeachTennis(clienteItem.planoBeachTennis)) }}</p>
              <p><strong>Observações:</strong> {{ exibirValor(clienteItem.observacoesBeachTennis || clienteItem.observacaoBeachTennis) }}</p>
            </div>
            <ul v-if="listaResumoBeachTennis(clienteItem).length" class="lista-resumo">
              <li v-for="item in listaResumoBeachTennis(clienteItem)" :key="item">{{ item }}</li>
            </ul>
          </details>

          <div v-if="!modoVisualizacaoEmpresa" class="acoes">
            <button class="botao secundario" @click="editarCliente(clienteItem)">Editar</button>
            <button class="botao secundario" @click="alternarAtivoCliente(clienteItem)">
              {{ clienteItem.ativo === false ? 'Ativar' : 'Inativar' }}
            </button>
            <button class="botao perigo" @click="enviarClienteParaLixeira(clienteItem)">Excluir</button>
          </div>
        </article>
      </section>

      <section v-if="!carregando" class="card paginacao">
        <p class="resumo-paginacao">{{ resumoPaginacao }}</p>

        <label class="tamanho-pagina">
          Registros por página
          <select v-model.number="paginacao.size" :disabled="carregando" @change="alterarTamanhoPagina">
            <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
              {{ opcao }}
            </option>
          </select>
        </label>

        <div class="botoes-paginacao">
          <button class="botao secundario" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
            Anterior
          </button>
          <button class="botao secundario" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
            Próxima
          </button>
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

.secao-clientes {
  display: grid;
  gap: 16px;
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

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.filtros-clientes {
  padding: 18px 22px;
}

.filtros-clientes-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 14px;
}

.campo-filtro {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.lista-clientes {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.cliente-card {
  display: grid;
  gap: 14px;
}

.cabecalho-cliente {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.cliente-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.email {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
  word-break: break-word;
}

.status-cliente {
  margin: 10px 0 0;
}

.chips-beach {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chip {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
}

.chip.beach {
  background: #dbeafe;
  color: #1d4ed8;
}

.chip.sutileza {
  background: #ecfeff;
  color: #0f766e;
}

.chip.competicao {
  background: #fef3c7;
  color: #b45309;
}

.chip.status {
  display: inline-flex;
  align-items: center;
}

.chip.status.ativo {
  background: #dcfce7;
  color: #166534;
}

.chip.status.inativo {
  background: #fee2e2;
  color: #991b1b;
}

.detalhes p,
.beach-resumo-grid p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong,
.beach-resumo-grid strong {
  font-weight: 800;
}

.beach-resumo {
  display: grid;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 14px 16px;
  background: #f8fbff;
}

.beach-resumo summary {
  cursor: pointer;
  color: #1d4ed8;
  font-weight: 800;
}

.beach-resumo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
}

.lista-resumo {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  display: grid;
  gap: 4px;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.paginacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resumo-paginacao {
  margin: 0;
  color: #475569;
  font-weight: 700;
}

.tamanho-pagina {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-weight: 700;
}

.tamanho-pagina select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: white;
}

.botoes-paginacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.botao,
:deep(.botao) {
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

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

:deep(.secundario) {
  background: #0f172a;
}

:deep(.secundario:hover) {
  background: #1e293b;
}

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

:deep(.formulario) {
  display: grid;
  gap: 16px;
}

:deep(.titulo-card h2) {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

:deep(.titulo-card p) {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.campos) {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

:deep(label) {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

:deep(input),
:deep(select),
:deep(textarea) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(textarea) {
  resize: vertical;
  min-height: 96px;
}

:deep(input:focus),
:deep(select:focus),
:deep(textarea:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

:deep(.campo-grande) {
  grid-column: 1 / -1;
}

:deep(.campo-checkbox) {
  display: flex;
  align-items: center;
  gap: 10px;
  align-self: end;
}

:deep(.campo-checkbox input) {
  width: 18px;
  height: 18px;
  margin: 0;
}

:deep(.rodape-formulario) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.bloco-beach-tennis {
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 16px;
  background: #f8fbff;
}

.bloco-beach-tennis summary {
  cursor: pointer;
  color: #1d4ed8;
  font-weight: 800;
  font-size: 15px;
}

.ajuda-bloco {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 13px;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

:deep(.sucesso-texto) {
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .cabecalho-cliente {
    flex-direction: column;
    align-items: flex-start;
  }

  .filtros-clientes-grid,
  .lista-clientes,
  :deep(.campos),
  .beach-resumo-grid {
    grid-template-columns: 1fr;
  }

  .chips-beach {
    justify-content: flex-start;
  }
}
</style>
