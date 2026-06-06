<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  buscarDisponibilidadeDataPublica,
  buscarDisponibilidadePublica,
  buscarEmpresaPublica,
  buscarFuncionariosPublicos,
  buscarPersonalizacaoPublica,
  buscarServicosPublicos,
  criarAgendamentoPublico,
} from '@/services/api'
import { emitirAtualizacaoEmpresa } from '@/utils/atualizacoesEmpresa'
import { debugLog } from '@/utils/devDebug'
import { normalizarUrlImagemPublica } from '@/utils/imagens'
import {
  criarMapaVisualPublico,
  criarVariaveisCssPublicas,
  normalizarCorHex as normalizarCorHexPublica,
  normalizarTemaPublico as normalizarTemaPublicoCompartilhado,
} from '@/utils/temasPublicos'
import { sanitizarTelefoneDoEvento } from '@/utils/validacoes'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())

const empresa = ref(null)
const personalizacao = ref(criarPersonalizacaoPublicaPadrao())
const servicos = ref([])
const funcionarios = ref([])
const funcionariosServico = ref([])
const disponibilidade = ref(null)
const disponibilidadeData = ref(null)
const carregando = ref(true)
const carregandoDisponibilidade = ref(false)
const carregandoDisponibilidadeData = ref(false)
const enviando = ref(false)
const indisponivel = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const mensagemCopia = ref('')
const confirmacaoAgendamento = ref(null)
const agendamento = ref(criarAgendamentoInicial())
const logoPublicoComErro = ref(false)
const bannerPublicoComErro = ref(false)

const servicoSelecionado = computed(() =>
  servicos.value.find((servico) => Number(servico.id) === Number(agendamento.value.servicoId)),
)

const funcionarioSelecionado = computed(() =>
  funcionariosDisponiveis.value.find(
    (funcionario) => Number(funcionario.id) === Number(agendamento.value.funcionarioId),
  ),
)

const funcionariosDisponiveis = computed(() =>
  agendamento.value.servicoId && funcionariosServico.value.length
    ? funcionariosServico.value
    : funcionarios.value,
)

const duracaoMinutos = computed(() => obterDuracaoValida(servicoSelecionado.value))

const dataHoraFimSelecionada = computed(() => {
  if (!agendamento.value.dataHoraInicio || !duracaoMinutos.value) {
    return null
  }

  return calcularDataHoraFim(agendamento.value.dataHoraInicio, duracaoMinutos.value)
})

const terminoPrevisto = computed(() =>
  dataHoraFimSelecionada.value ? formatarDataHoraPreview(dataHoraFimSelecionada.value) : '',
)

const temaPublico = computed(() => normalizarTemaPublicoCompartilhado(personalizacao.value.tema))
const mapaVisualPublico = computed(() =>
  criarMapaVisualPublico(personalizacao.value.corPrincipal, personalizacao.value.corSecundaria, temaPublico.value),
)
const estilosPersonalizados = computed(() => ({
  ...criarVariaveisCssPublicas(mapaVisualPublico.value, '--publico-cor'),
  '--cor-principal-publica': mapaVisualPublico.value.principal,
  '--cor-secundaria-publica': mapaVisualPublico.value.secundaria,
}))

const classeTemaPublico = computed(() => `tema-${temaPublico.value.toLowerCase()}`)

const tituloPublico = computed(() => personalizacao.value.tituloPagina || empresa.value?.nome || 'Agendamento')
const logoPublicoUrl = computed(() =>
  normalizarUrlImagemPublica(
    String(personalizacao.value.logoUrl || empresa.value?.logoUrl || empresa.value?.logo || '').trim(),
  ),
)
const bannerPublicoUrl = computed(() =>
  normalizarUrlImagemPublica(
    String(personalizacao.value.bannerUrl || empresa.value?.bannerUrl || empresa.value?.capaUrl || '').trim(),
  ),
)
const empresaIniciais = computed(() =>
  String(empresa.value?.nome || tituloPublico.value || 'AG')
    .split(' ')
    .map((parte) => parte.trim())
    .filter(Boolean)
    .slice(0, 2)
    .map((parte) => parte[0]?.toUpperCase() || '')
    .join('') || 'AG',
)

const subtituloPublico = computed(
  () => personalizacao.value.subtituloPagina || empresa.value?.mensagemPublica || '',
)

const mensagemConfirmacaoPublica = computed(
  () =>
    personalizacao.value.mensagemConfirmacao ||
    'Guarde essas informações. A empresa poderá entrar em contato para confirmação do atendimento.',
)

function atualizarTituloPaginaAgendamento(nomeEmpresa = '') {
  if (typeof document === 'undefined') {
    return
  }

  document.title = nomeEmpresa ? `Agendar com ${nomeEmpresa} | NuvemMais` : 'NuvemMais Gestão'
}

const dataAtendimentoFormatada = computed(() =>
  agendamento.value.dataAtendimento ? formatarDataAtendimento(agendamento.value.dataAtendimento) : '',
)

const inicioSelecionado = computed(() => {
  const horario = String(agendamento.value.dataHoraInicio || '').slice(11, 16)

  return horario || ''
})

const horariosDisponiveis = computed(() =>
  dataBloqueada.value
    ? []
    : normalizarListaHorarios(disponibilidade.value?.horariosDisponiveis).map((item) => ({
        valor: item.valor,
        label: item.label,
        ocupado: false,
      })),
)

const horariosOcupados = computed(() =>
  dataBloqueada.value
    ? []
    : normalizarListaHorarios(disponibilidade.value?.horariosOcupados)
        .filter((item) => !horariosDisponiveis.value.some((horario) => horario.valor === item.valor))
        .map((item) => ({
          valor: item.valor,
          label: item.label,
          ocupado: true,
        })),
)

const dataBloqueada = computed(() => disponibilidadeData.value?.bloqueado === true)

const mensagemBloqueioData = computed(() => {
  if (!dataBloqueada.value) {
    return ''
  }

  return (
    String(disponibilidadeData.value?.mensagem || '').trim() ||
    'A empresa não realizará atendimentos nesta data. Escolha outro dia para continuar.'
  )
})

const mensagemDisponibilidade = computed(() => {
  if (mensagemBloqueioData.value) {
    return mensagemBloqueioData.value
  }

  if (!disponibilidade.value) {
    return ''
  }

  const mensagem = String(disponibilidade.value.mensagem || '').trim()

  if (disponibilidade.value.empresaAtendeNoDia === false) {
    return mensagem || `A empresa ${empresa.value?.nome || ''} não atende neste dia.`
  }

  if (disponibilidade.value.funcionarioAtendeNoDia === false) {
    return mensagem || `O funcionário ${funcionarioSelecionado.value?.nome || ''} não atende neste dia.`
  }

  if (horariosDisponiveis.value.length === 0) {
    return (
      mensagem ||
      'Nenhum horário disponível para esta data. Escolha outro dia, serviço ou funcionário.'
    )
  }

  return ''
})

const mensagemOrientacaoHorarios = computed(() => {
  if (carregandoDisponibilidadeData.value) {
    return 'Validando atendimento nesta data...'
  }

  if (mensagemBloqueioData.value) {
    return mensagemBloqueioData.value
  }

  if (!agendamento.value.servicoId) {
    return 'Escolha um serviço para consultar os horários.'
  }

  if (!agendamento.value.funcionarioId) {
    return 'Escolha um funcionário para consultar os horários.'
  }

  if (!agendamento.value.dataAtendimento) {
    return 'Escolha uma data para consultar os horários.'
  }

  if (carregandoDisponibilidade.value) {
    return 'Buscando horários disponíveis...'
  }

  if (mensagemDisponibilidade.value) {
    return mensagemDisponibilidade.value
  }

  if (horariosDisponiveis.value.length > 0) {
    return agendamento.value.dataHoraInicio
      ? 'Horário selecionado. Você já pode confirmar o agendamento.'
      : 'Escolha um dos horários disponíveis abaixo.'
  }

  return 'Nenhum horário disponível para esta data. Escolha outro dia, serviço ou funcionário.'
})

const resumoVisivel = computed(() =>
  Boolean(
    agendamento.value.servicoId ||
      agendamento.value.funcionarioId ||
      agendamento.value.dataAtendimento ||
      agendamento.value.dataHoraInicio,
  ),
)

const formularioCompleto = computed(() =>
  Boolean(
    agendamento.value.nomeCliente.trim() &&
      agendamento.value.telefoneCliente.trim() &&
      agendamento.value.servicoId &&
      agendamento.value.funcionarioId &&
      agendamento.value.dataAtendimento &&
      agendamento.value.dataHoraInicio &&
      !dataBloqueada.value,
  ),
)

watch(
  () => agendamento.value.dataAtendimento,
  () => {
    agendamento.value.dataHoraInicio = ''
    consultarDisponibilidadeData()
  },
)

watch(
  () => [
    agendamento.value.servicoId,
    agendamento.value.funcionarioId,
    agendamento.value.dataAtendimento,
  ],
  () => {
    agendamento.value.dataHoraInicio = ''
    if (carregandoDisponibilidadeData.value || dataBloqueada.value) {
      disponibilidade.value = null
      return
    }

    carregarDisponibilidade()
  },
)

watch(
  () => agendamento.value.servicoId,
  () => {
    carregarFuncionariosDoServicoPublico()
  },
)

watch(logoPublicoUrl, () => {
  logoPublicoComErro.value = false
})

watch(bannerPublicoUrl, () => {
  bannerPublicoComErro.value = false
})

function criarAgendamentoInicial() {
  return {
    nomeCliente: '',
    telefoneCliente: '',
    emailCliente: '',
    servicoId: '',
    funcionarioId: '',
    dataAtendimento: '',
    dataHoraInicio: '',
    observacao: '',
  }
}

function aplicarTelefoneCliente(evento) {
  agendamento.value.telefoneCliente = sanitizarTelefoneDoEvento(evento)
}

function criarPersonalizacaoPublicaPadrao() {
  return {
    logoUrl: '',
    bannerUrl: '',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
    tituloPagina: '',
    subtituloPagina: '',
    textoSobre: '',
    textoInstrucoes: '',
    politicaCancelamento: '',
    mensagemConfirmacao: '',
    whatsapp: '',
    instagram: '',
    site: '',
    tema: 'PADRAO',
    mostrarPreco: true,
    mostrarFuncionario: true,
    mostrarEndereco: true,
    mostrarTelefone: true,
  }
}

function normalizarPersonalizacaoPublica(dados) {
  const padrao = criarPersonalizacaoPublicaPadrao()
  const origem = dados && typeof dados === 'object' ? dados : {}

  return {
    ...padrao,
    ...origem,
    logoUrl: normalizarUrlImagemPublica(origem.logoUrl),
    bannerUrl: normalizarUrlImagemPublica(origem.bannerUrl),
    corPrincipal: normalizarCorHexPublica(origem.corPrincipal, padrao.corPrincipal),
    corSecundaria: normalizarCorHexPublica(origem.corSecundaria, padrao.corSecundaria),
    tema: normalizarTemaPublicoCompartilhado(origem.tema || padrao.tema),
    mostrarPreco: origem.mostrarPreco !== false,
    mostrarFuncionario: origem.mostrarFuncionario !== false,
    mostrarEndereco: origem.mostrarEndereco !== false,
    mostrarTelefone: origem.mostrarTelefone !== false,
  }
}

function corHexValida(cor) {
  return /^#[0-9a-fA-F]{6}$/.test(String(cor || '').trim())
}

function normalizarTemaPublico(tema) {
  return normalizarTemaPublicoCompartilhado(tema)
}

function criarPayloadAgendamentoPublico() {
  return Object.freeze({
    clienteNome: agendamento.value.nomeCliente.trim(),
    clienteTelefone: agendamento.value.telefoneCliente.trim(),
    clienteEmail: agendamento.value.emailCliente.trim(),
    servicoId: Number(agendamento.value.servicoId),
    funcionarioId: Number(agendamento.value.funcionarioId),
    dataHoraInicio: String(agendamento.value.dataHoraInicio || '').trim(),
    observacao: agendamento.value.observacao.trim(),
  })
}

function criarDadosConfirmacaoFormulario(payload) {
  const servico = servicos.value.find((item) => Number(item.id) === Number(payload.servicoId))
  const funcionario = [...funcionariosServico.value, ...funcionarios.value].find(
    (item) => Number(item.id) === Number(payload.funcionarioId),
  )
  const duracao = obterDuracaoValida(servico)
  const dataHoraFim = payload.dataHoraInicio && duracao ? calcularDataHoraFim(payload.dataHoraInicio, duracao) : null

  return {
    empresaNome: empresa.value?.nome || '',
    clienteNome: payload.clienteNome,
    clienteTelefone: payload.clienteTelefone,
    clienteEmail: payload.clienteEmail,
    servicoNome: servico?.nome || '',
    funcionarioNome: funcionario?.nome || '',
    dataAtendimento: formatarDataAtendimento(String(payload.dataHoraInicio || '').slice(0, 10)),
    horarioInicio: formatarHorarioSeguro(payload.dataHoraInicio),
    horarioTermino: formatarHorarioSeguro(dataHoraFim),
    duracao: duracao ? `${duracao} minutos` : '',
    preco: servico ? formatarPreco(servico.preco) : '',
    observacao: payload.observacao,
    dataHoraInicio: payload.dataHoraInicio,
    dataHoraFim,
  }
}

function criarConfirmacaoAgendamento(respostaApi, dadosFormulario) {
  const dadosApi = normalizarRespostaAgendamentoPublico(respostaApi)
  const dataHoraInicioApi = obterPrimeiroValor(dadosApi.dataHoraInicio, dadosApi.inicio)
  const dataHoraFimApi = obterPrimeiroValor(dadosApi.dataHoraFim, dadosApi.fim)
  const id = obterPrimeiroValor(
    dadosApi.protocolo,
    dadosApi.numeroProtocolo,
    dadosApi.codigo,
    dadosApi.id,
    dadosApi.agendamentoId,
  )
  const camposComFallback = []
  const origem = normalizarOrigemConfirmacao(dadosApi)

  return {
    id,
    status: obterPrimeiroValor(dadosApi.status, ''),
    mensagem: obterPrimeiroValor(dadosApi.mensagem, dadosApi.message, 'Agendamento solicitado com sucesso.'),
    empresaNome: obterValorConfirmacao(
      dadosApi,
      ['empresaNome', 'nomeEmpresa'],
      dadosFormulario.empresaNome,
      camposComFallback,
      'empresa',
    ),
    clienteNome: obterValorConfirmacao(
      dadosApi,
      ['clienteNome', 'nomeCliente', 'cliente'],
      dadosFormulario.clienteNome,
      camposComFallback,
      'cliente',
    ),
    clienteTelefone: obterValorConfirmacao(
      dadosApi,
      ['clienteTelefone', 'telefoneCliente', 'telefone'],
      dadosFormulario.clienteTelefone,
      camposComFallback,
      'telefone',
    ),
    clienteEmail: obterValorConfirmacao(
      dadosApi,
      ['clienteEmail', 'emailCliente', 'email'],
      dadosFormulario.clienteEmail,
      camposComFallback,
      'email',
    ),
    servicoNome: obterValorConfirmacao(
      dadosApi,
      ['servicoNome', 'nomeServico', 'servico'],
      dadosFormulario.servicoNome,
      camposComFallback,
      'serviço',
    ),
    funcionarioNome: obterValorConfirmacao(
      dadosApi,
      ['funcionarioNome', 'nomeFuncionario', 'funcionario'],
      dadosFormulario.funcionarioNome,
      camposComFallback,
      'funcionário',
    ),
    dataAtendimento:
      formatarDataDaConfirmacao(dataHoraInicioApi) ||
      registrarFallbackConfirmacao(dadosFormulario.dataAtendimento, camposComFallback, 'data'),
    horarioInicio:
      formatarHorarioSeguro(dataHoraInicioApi) ||
      registrarFallbackConfirmacao(
        formatarHorarioSeguro(dadosFormulario.dataHoraInicio) || dadosFormulario.horarioInicio,
        camposComFallback,
        'início',
      ),
    horarioTermino:
      formatarHorarioSeguro(dataHoraFimApi) ||
      registrarFallbackConfirmacao(
        formatarHorarioSeguro(dadosFormulario.dataHoraFim) || dadosFormulario.horarioTermino,
        camposComFallback,
        'término',
      ),
    duracao:
      formatarDuracaoConfirmacao(obterPrimeiroValor(dadosApi.duracao, dadosApi.duracaoMinutos)) ||
      registrarFallbackConfirmacao(dadosFormulario.duracao, camposComFallback, 'duração'),
    preco:
      obterPrimeiroValor(
        formatarPrecoConfirmacao(
          obterPrimeiroValor(dadosApi.preco, dadosApi.valorServico, dadosApi.valor),
        ),
      ) || registrarFallbackConfirmacao(dadosFormulario.preco, camposComFallback, 'preço'),
    observacao:
      obterPrimeiroValor(dadosApi.observacao, dadosApi.observacoes) ||
      registrarFallbackConfirmacao(dadosFormulario.observacao, camposComFallback, 'observação'),
    origem,
    origemTexto: origem === 'PUBLICO' ? 'Origem pública' : '',
    camposComFallback,
    avisoFallback: camposComFallback.length
      ? 'Alguns dados não vieram completos na resposta da API e foram complementados com o formulário enviado.'
      : '',
  }
}

function normalizarRespostaAgendamentoPublico(respostaApi) {
  if (!respostaApi || typeof respostaApi !== 'object') {
    return {}
  }

  if (respostaApi.data && typeof respostaApi.data === 'object' && !Array.isArray(respostaApi.data)) {
    return respostaApi.data
  }

  if (
    respostaApi.resultado &&
    typeof respostaApi.resultado === 'object' &&
    !Array.isArray(respostaApi.resultado)
  ) {
    return respostaApi.resultado
  }

  return respostaApi
}

function normalizarOrigemConfirmacao(dadosApi) {
  const origem = String(
    obterPrimeiroValor(dadosApi.origem, dadosApi.tipoOrigem, dadosApi.canalOrigem, dadosApi.origemAgendamento),
  )
    .trim()
    .toUpperCase()

  if (origem === 'PUBLICO') {
    return 'PUBLICO'
  }

  if (dadosApi.publico === true) {
    return 'PUBLICO'
  }

  if (typeof dadosApi.publico === 'string') {
    return dadosApi.publico.trim().toLowerCase() === 'true' ? 'PUBLICO' : ''
  }

  if (typeof dadosApi.publico === 'number') {
    return dadosApi.publico === 1 ? 'PUBLICO' : ''
  }

  return ''
}

function obterValorConfirmacao(dadosApi, camposApi, fallback, camposComFallback, identificador) {
  const valorApi = obterPrimeiroValor(...camposApi.map((campo) => dadosApi[campo]))

  if (valorApi) {
    return valorApi
  }

  return registrarFallbackConfirmacao(fallback, camposComFallback, identificador)
}

function registrarFallbackConfirmacao(valor, camposComFallback, identificador) {
  if (valor) {
    camposComFallback.push(identificador)
  }

  return valor || ''
}

function obterPrimeiroValor(...valores) {
  return valores.find((valor) => valor !== null && valor !== undefined && String(valor).trim()) || ''
}

function fazerNovoAgendamento() {
  agendamento.value = criarAgendamentoInicial()
  disponibilidade.value = null
  disponibilidadeData.value = null
  funcionariosServico.value = []
  confirmacaoAgendamento.value = null
  mensagemSucesso.value = ''
  mensagemCopia.value = ''
  erro.value = ''
}

async function copiarResumoConfirmacao() {
  if (!confirmacaoAgendamento.value) {
    return
  }

  try {
    if (typeof navigator === 'undefined' || !navigator.clipboard?.writeText) {
      throw new Error('Clipboard indisponível')
    }

    await navigator.clipboard.writeText(montarTextoConfirmacao(confirmacaoAgendamento.value))
    mensagemCopia.value = 'Resumo copiado para a área de transferência.'
  } catch (error) {
    mensagemCopia.value =
      'Não foi possível copiar automaticamente. Você pode tirar um print desta confirmação.'
    console.error(error)
  }
}

function montarTextoConfirmacao(confirmacao) {
  return [
    'Agendamento solicitado com sucesso!',
    `Empresa: ${confirmacao.empresaNome}`,
    `Cliente: ${confirmacao.clienteNome}`,
    confirmacao.clienteTelefone ? `Telefone: ${confirmacao.clienteTelefone}` : '',
    confirmacao.clienteEmail ? `E-mail: ${confirmacao.clienteEmail}` : '',
    `Serviço: ${confirmacao.servicoNome}`,
    `Funcionário: ${confirmacao.funcionarioNome}`,
    `Data: ${confirmacao.dataAtendimento}`,
    `Início: ${confirmacao.horarioInicio}`,
    `Término previsto: ${confirmacao.horarioTermino}`,
    `Duração: ${confirmacao.duracao}`,
    personalizacao.value.mostrarPreco ? `Preço: ${confirmacao.preco}` : '',
    confirmacao.origemTexto ? `Origem: ${confirmacao.origemTexto}` : '',
    confirmacao.observacao ? `Observação: ${confirmacao.observacao}` : '',
    confirmacao.id ? `Código/Protocolo: ${confirmacao.id}` : '',
  ]
    .filter(Boolean)
    .join('\n')
}

function montarLabelServico(servico) {
  return personalizacao.value.mostrarPreco
    ? `${servico.nome} - ${formatarPreco(servico.preco)}`
    : servico.nome
}

async function carregarDadosPublicos() {
  atualizarTituloPaginaAgendamento()

  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    indisponivel.value = false

    const [empresaApi, personalizacaoApi] = await Promise.all([
      buscarEmpresaPublica(slug.value),
      buscarPersonalizacaoPublica(slug.value).catch((error) => {
        console.error('Não foi possível carregar a personalização pública.', error)
        return null
      }),
    ])

    if (!empresaApi || empresaApi.agendamentoPublicoAtivo === false) {
      indisponivel.value = true
      return
    }

    empresa.value = empresaApi
    personalizacao.value = normalizarPersonalizacaoPublica(personalizacaoApi)
    atualizarTituloPaginaAgendamento(empresa.value?.nome)

    const [servicosApi, funcionariosApi] = await Promise.all([
      buscarServicosPublicos(slug.value),
      buscarFuncionariosPublicos(slug.value),
    ])

    servicos.value = Array.isArray(servicosApi) ? servicosApi : []
    funcionarios.value = Array.isArray(funcionariosApi) ? funcionariosApi : []

    if (!personalizacao.value.mostrarFuncionario && funcionariosDisponiveis.value.length === 1) {
      agendamento.value.funcionarioId = funcionariosDisponiveis.value[0].id
    }
  } catch (error) {
    indisponivel.value = true
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarFuncionariosDoServicoPublico() {
  funcionariosServico.value = []
  agendamento.value.funcionarioId = ''
  disponibilidade.value = null

  if (!slug.value || !agendamento.value.servicoId) {
    return
  }

  try {
    const dados = await buscarFuncionariosPublicos(slug.value, {
      servicoId: agendamento.value.servicoId,
    })
    funcionariosServico.value = Array.isArray(dados) ? dados : []

    if (!personalizacao.value.mostrarFuncionario && funcionariosDisponiveis.value.length === 1) {
      agendamento.value.funcionarioId = funcionariosDisponiveis.value[0].id
    }
  } catch (error) {
    funcionariosServico.value = []
    console.error(error)
  }
}

async function consultarDisponibilidadeData() {
  disponibilidadeData.value = null
  disponibilidade.value = null

  if (!slug.value || !agendamento.value.dataAtendimento) {
    return
  }

  const dataConsultada = agendamento.value.dataAtendimento

  try {
    carregandoDisponibilidadeData.value = true
    erro.value = ''

    const resposta = await buscarDisponibilidadeDataPublica(slug.value, dataConsultada)

    if (agendamento.value.dataAtendimento !== dataConsultada) {
      return
    }

    disponibilidadeData.value = resposta

    if (resposta?.bloqueado === true) {
      agendamento.value.funcionarioId = ''
      agendamento.value.dataHoraInicio = ''
      disponibilidade.value = null
      return
    }

    carregandoDisponibilidadeData.value = false
    carregarDisponibilidade()
  } catch (error) {
    if (agendamento.value.dataAtendimento === dataConsultada) {
      disponibilidadeData.value = null
    }

    console.error(error)
  } finally {
    if (agendamento.value.dataAtendimento === dataConsultada) {
      carregandoDisponibilidadeData.value = false
    }
  }
}

async function carregarDisponibilidade() {
  disponibilidade.value = null

  if (
    !slug.value ||
    carregandoDisponibilidadeData.value ||
    dataBloqueada.value ||
    !agendamento.value.servicoId ||
    !agendamento.value.funcionarioId ||
    !agendamento.value.dataAtendimento
  ) {
    return
  }

  try {
    carregandoDisponibilidade.value = true
    erro.value = ''
    disponibilidade.value = await buscarDisponibilidadePublica(
      slug.value,
      agendamento.value.servicoId,
      agendamento.value.funcionarioId,
      agendamento.value.dataAtendimento,
    )
  } catch (error) {
    const mensagemApi = typeof error?.message === 'string' ? error.message.trim() : ''

    erro.value = mensagemApi || 'Não foi possível buscar os horários disponíveis.'
    console.error(error)
  } finally {
    carregandoDisponibilidade.value = false
  }
}

function selecionarHorario(horario) {
  if (horario.ocupado || dataBloqueada.value) {
    return
  }

  agendamento.value.dataHoraInicio = `${agendamento.value.dataAtendimento}T${horario.valor}:00`
  erro.value = ''
  mensagemSucesso.value = ''
}

async function enviarAgendamento() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!agendamento.value.nomeCliente.trim()) {
      erro.value = 'Informe o nome do cliente.'
      return
    }

    if (!agendamento.value.telefoneCliente.trim()) {
      erro.value = 'Informe o telefone do cliente.'
      return
    }

    if (!agendamento.value.servicoId) {
      erro.value = 'Selecione um serviço.'
      return
    }

    if (!agendamento.value.funcionarioId) {
      erro.value = 'Selecione um funcionário.'
      return
    }

    if (!agendamento.value.dataAtendimento) {
      erro.value = 'Selecione uma data.'
      return
    }

    if (dataBloqueada.value) {
      erro.value = mensagemBloqueioData.value
      return
    }

    if (!agendamento.value.dataHoraInicio) {
      erro.value = 'Selecione um horário disponível.'
      return
    }

    enviando.value = true

    const payload = criarPayloadAgendamentoPublico()
    const dadosConfirmacao = criarDadosConfirmacaoFormulario(payload)

    debugLog('agendamento-publico', 'Payload enviado', payload)

    const respostaApi = await criarAgendamentoPublico(slug.value, payload)

    debugLog('agendamento-publico', 'Resposta recebida', respostaApi)

    confirmacaoAgendamento.value = criarConfirmacaoAgendamento(respostaApi, dadosConfirmacao)
    agendamento.value = criarAgendamentoInicial()
    disponibilidade.value = null
    disponibilidadeData.value = null
    funcionariosServico.value = []
    mensagemSucesso.value = confirmacaoAgendamento.value.mensagem
    mensagemCopia.value = ''

    emitirAtualizacaoEmpresa({
      origem: 'agendamento-publico',
      escopos: ['agenda', 'notificacoes', 'dashboard'],
    })
  } catch (error) {
    const mensagemApi = typeof error?.message === 'string' ? error.message.trim() : ''

    erro.value = mensagemApi || 'Não foi possível realizar o agendamento.'
    console.error(error)
  } finally {
    enviando.value = false
  }
}

function obterDuracaoValida(servico) {
  const duracao = Number(servico?.duracaoMinutos)

  if (!Number.isFinite(duracao) || duracao <= 0) {
    return null
  }

  return duracao
}

function calcularDataHoraFim(dataHoraInicio, duracao) {
  const inicio = dataHoraInicio instanceof Date ? dataHoraInicio : new Date(dataHoraInicio)

  if (Number.isNaN(inicio.getTime())) {
    return null
  }

  return new Date(inicio.getTime() + duracao * 60000)
}

function normalizarListaHorarios(horarios) {
  return Array.isArray(horarios)
    ? horarios.map(normalizarHorarioDisponibilidade).filter((horario) => horario.valor)
    : []
}

function normalizarHorarioDisponibilidade(horario) {
  if (horario && typeof horario === 'object') {
    const valor = extrairHorario(
      horario.horario || horario.hora || horario.inicio || horario.dataHoraInicio || '',
    )

    return {
      valor,
      label: String(horario.label || horario.texto || valor),
    }
  }

  const valor = extrairHorario(horario)

  return {
    valor,
    label: valor,
  }
}

function extrairHorario(valor) {
  return formatarHorarioSeguro(valor)
}

function formatarHorarioSeguro(valor) {
  if (!valor) {
    return ''
  }

  if (valor instanceof Date) {
    if (Number.isNaN(valor.getTime())) {
      return ''
    }

    return formatarHoraMinuto(valor.getHours(), valor.getMinutes())
  }

  const texto = String(valor || '')
  const parteHorario = texto.includes('T') ? texto.split('T')[1] : texto
  const horario = parteHorario.trim().match(/^(\d{2}):(\d{2})(?::\d{2})?/)

  if (horario) {
    return `${horario[1]}:${horario[2]}`
  }

  const data = criarDataValida(texto)

  if (!data) {
    return ''
  }

  return formatarHoraMinuto(data.getHours(), data.getMinutes())
}

function formatarHoraMinuto(hora, minuto) {
  return `${String(hora).padStart(2, '0')}:${String(minuto).padStart(2, '0')}`
}

function horarioSelecionado(horario) {
  return String(agendamento.value.dataHoraInicio || '').slice(11, 16) === horario.valor
}

function formatarDataHoraPreview(data) {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function aoFalharLogoPublico() {
  logoPublicoComErro.value = true
}

function aoFalharBannerPublico() {
  bannerPublicoComErro.value = true
}

function formatarDataAtendimento(data) {
  const [ano, mes, dia] = String(data || '').split('-').map(Number)

  if (!ano || !mes || !dia) {
    return ''
  }

  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarDataDaConfirmacao(valor) {
  const data = criarDataValida(valor)

  if (!data) {
    return ''
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarDataHoraDaConfirmacao(valor) {
  const data = criarDataValida(valor)

  if (!data) {
    return ''
  }

  return formatarDataHoraPreview(data)
}

function criarDataValida(valor) {
  if (!valor) {
    return null
  }

  const data = valor instanceof Date ? valor : new Date(valor)

  return Number.isNaN(data.getTime()) ? null : data
}

function formatarPreco(preco) {
  if (preco === null || preco === undefined) {
    return 'R$ 0,00'
  }

  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarPrecoConfirmacao(preco) {
  return preco === null || preco === undefined || preco === '' ? '' : formatarPreco(preco)
}

function formatarDuracaoConfirmacao(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return ''
  }

  const duracao = Number(valor)

  if (Number.isFinite(duracao) && duracao > 0) {
    return `${duracao} minutos`
  }

  return String(valor || '').trim()
}

onMounted(() => {
  carregarDadosPublicos()
})
</script>

<template>
  <main class="pagina-publica" :class="classeTemaPublico" :style="estilosPersonalizados">
    <section v-if="carregando" class="card estado">
      <p>Carregando agendamento...</p>
    </section>

    <section v-else-if="indisponivel" class="card estado">
      <h1>Agendamento indisponível.</h1>
      <p>Entre em contato diretamente com a empresa.</p>
    </section>

    <section v-else class="conteudo-publico">
      <section class="hero-publico card">
        <section v-if="bannerPublicoUrl && !bannerPublicoComErro" class="banner-publico">
          <img :src="bannerPublicoUrl" alt="" @error="aoFalharBannerPublico" />
        </section>
        <section v-else class="banner-publico banner-publico-placeholder" aria-hidden="true">
          <strong>{{ tituloPublico }}</strong>
          <span>Banner indisponível</span>
        </section>

        <header class="cabecalho-publico">
          <div class="identidade-empresa">
            <img
              v-if="logoPublicoUrl && !logoPublicoComErro"
              class="logo-publico"
              :src="logoPublicoUrl"
              alt=""
              @error="aoFalharLogoPublico"
            />
            <div v-else class="logo-fallback" aria-hidden="true">{{ empresaIniciais }}</div>
            <div>
              <p class="subtitulo">Agende seu atendimento</p>
              <h1>{{ tituloPublico }}</h1>
              <p class="texto-apoio">Escolha o serviço, profissional, data e horário.</p>
              <p v-if="subtituloPublico" class="mensagem-publica">{{ subtituloPublico }}</p>
            </div>
          </div>

          <div class="dados-empresa">
            <p v-if="personalizacao.mostrarTelefone && empresa?.telefone">
              <strong>Telefone:</strong> {{ empresa.telefone }}
            </p>
            <p v-if="empresa?.email"><strong>E-mail:</strong> {{ empresa.email }}</p>
            <p v-if="personalizacao.mostrarEndereco && empresa?.endereco">
              <strong>Endereço:</strong> {{ empresa.endereco }}
            </p>
            <p v-if="personalizacao.whatsapp"><strong>WhatsApp:</strong> Atendimento disponível</p>
          </div>
        </header>
      </section>

      <section class="layout-publico">
        <aside
          v-if="
            personalizacao.textoSobre ||
            personalizacao.textoInstrucoes ||
            personalizacao.politicaCancelamento ||
            personalizacao.whatsapp ||
            personalizacao.instagram ||
            personalizacao.site
          "
          class="coluna-info"
        >
          <section v-if="personalizacao.textoSobre" class="card bloco-publico">
            <h2>Sobre a empresa</h2>
            <p>{{ personalizacao.textoSobre }}</p>
          </section>

          <section v-if="personalizacao.textoInstrucoes" class="card bloco-publico">
            <h2>Instruções</h2>
            <p class="instrucoes-publicas">{{ personalizacao.textoInstrucoes }}</p>
          </section>

          <section v-if="personalizacao.politicaCancelamento" class="card politica-publica">
            <h2>Política de cancelamento</h2>
            <p>{{ personalizacao.politicaCancelamento }}</p>
          </section>

          <section
            v-if="personalizacao.whatsapp || personalizacao.instagram || personalizacao.site"
            class="card bloco-publico"
          >
            <h2>Links úteis</h2>
            <div class="links-publicos">
              <a v-if="personalizacao.whatsapp" :href="personalizacao.whatsapp" target="_blank" rel="noreferrer">WhatsApp</a>
              <a v-if="personalizacao.instagram" :href="personalizacao.instagram" target="_blank" rel="noreferrer">Instagram</a>
              <a v-if="personalizacao.site" :href="personalizacao.site" target="_blank" rel="noreferrer">Site</a>
            </div>
          </section>
        </aside>

        <section class="coluna-formulario">
          <section v-if="erro" class="card erro">
            <p>{{ erro }}</p>
          </section>

          <section v-if="mensagemSucesso && !confirmacaoAgendamento" class="card sucesso-card">
            <h3>Agendamento solicitado com sucesso!</h3>
            <p>{{ mensagemSucesso }}</p>
            <p>Você receberá a confirmação conforme as orientações da empresa.</p>
          </section>

          <section v-if="confirmacaoAgendamento" class="card confirmacao-card">
            <div class="confirmacao-topo">
              <div>
                <p class="subtitulo">Confirmação</p>
                <h2>Agendamento solicitado com sucesso!</h2>
                <p>{{ mensagemConfirmacaoPublica }}</p>
              </div>
              <div v-if="confirmacaoAgendamento.id" class="protocolo">
                <span>Código/Protocolo</span>
                <strong>{{ confirmacaoAgendamento.id }}</strong>
              </div>
            </div>

            <dl class="resumo-confirmacao">
              <div><dt>Empresa</dt><dd>{{ confirmacaoAgendamento.empresaNome || 'Não informado' }}</dd></div>
              <div>
                <dt>Cliente</dt>
                <dd>
                  {{ confirmacaoAgendamento.clienteNome || 'Não informado' }}
                  <span v-if="confirmacaoAgendamento.clienteTelefone">{{ confirmacaoAgendamento.clienteTelefone }}</span>
                  <span v-if="confirmacaoAgendamento.clienteEmail">{{ confirmacaoAgendamento.clienteEmail }}</span>
                </dd>
              </div>
              <div><dt>Serviço</dt><dd>{{ confirmacaoAgendamento.servicoNome || 'Não informado' }}</dd></div>
              <div><dt>Funcionário</dt><dd>{{ confirmacaoAgendamento.funcionarioNome || 'Não informado' }}</dd></div>
              <div><dt>Data</dt><dd>{{ confirmacaoAgendamento.dataAtendimento || 'Não informado' }}</dd></div>
              <div><dt>Início</dt><dd>{{ confirmacaoAgendamento.horarioInicio || 'Não informado' }}</dd></div>
              <div><dt>Término previsto</dt><dd>{{ confirmacaoAgendamento.horarioTermino || 'Não informado' }}</dd></div>
              <div><dt>Duração</dt><dd>{{ confirmacaoAgendamento.duracao || 'Não informado' }}</dd></div>
              <div v-if="personalizacao.mostrarPreco"><dt>Preço</dt><dd>{{ confirmacaoAgendamento.preco || 'Não informado' }}</dd></div>
              <div v-if="confirmacaoAgendamento.origemTexto"><dt>Origem</dt><dd>{{ confirmacaoAgendamento.origemTexto }}</dd></div>
              <div v-if="confirmacaoAgendamento.observacao" class="item-largo">
                <dt>Observação</dt>
                <dd>{{ confirmacaoAgendamento.observacao }}</dd>
              </div>
            </dl>

            <p v-if="confirmacaoAgendamento.avisoFallback" class="aviso-fallback">
              {{ confirmacaoAgendamento.avisoFallback }}
            </p>

            <p v-if="mensagemCopia" class="mensagem-copia">{{ mensagemCopia }}</p>

            <div class="acoes-confirmacao">
              <button class="botao principal" type="button" @click="fazerNovoAgendamento">Fazer novo agendamento</button>
              <button class="botao secundario" type="button" @click="copiarResumoConfirmacao">Copiar resumo</button>
            </div>
          </section>

          <section v-else class="card formulario">
            <div class="titulo-card">
              <h2>Solicite seu agendamento</h2>
              <p>Preencha os dados abaixo para enviar sua solicitação.</p>
            </div>

            <div class="campos">
              <section class="campo-grande etapa-formulario"><p class="etapa-tag">1. Seus dados</p></section>

              <label>
                Nome do cliente *
                <input v-model="agendamento.nomeCliente" :disabled="enviando" type="text" placeholder="Ex: Ana Costa" />
              </label>

              <label>
                Telefone *
                <input :value="agendamento.telefoneCliente" :disabled="enviando" type="text" inputmode="numeric" placeholder="Ex: (21) 99999-9999" @input="aplicarTelefoneCliente" @paste.prevent="aplicarTelefoneCliente" />
              </label>

              <label>
                E-mail
                <input v-model="agendamento.emailCliente" :disabled="enviando" type="email" placeholder="Ex: cliente@email.com" />
              </label>

              <section class="campo-grande etapa-formulario"><p class="etapa-tag">2. Atendimento</p></section>

              <label>
                Serviço *
                <select v-model="agendamento.servicoId" :disabled="enviando">
                  <option value="">Selecione um serviço</option>
                  <option v-for="servico in servicos" :key="servico.id" :value="servico.id">{{ montarLabelServico(servico) }}</option>
                </select>
              </label>

              <label v-if="personalizacao.mostrarFuncionario || funcionariosDisponiveis.length !== 1">
                Funcionário *
                <select v-model="agendamento.funcionarioId" :disabled="dataBloqueada || enviando">
                  <option value="">Selecione um funcionário</option>
                  <option v-for="funcionario in funcionariosDisponiveis" :key="funcionario.id" :value="funcionario.id">{{ funcionario.nome }}</option>
                </select>
              </label>

              <label>
                Data do atendimento *
                <input v-model="agendamento.dataAtendimento" :disabled="enviando" type="date" />
              </label>

              <section class="campo-grande etapa-formulario"><p class="etapa-tag">3. Horário</p></section>

              <section v-if="dataBloqueada" class="campo-grande bloqueio-data">
                <strong>{{ mensagemBloqueioData }}</strong>
                <span v-if="disponibilidadeData?.motivo">Motivo: {{ disponibilidadeData.motivo }}</span>
              </section>

              <section class="campo-grande horarios">
                <div class="titulo-horarios">
                  <h3>Horários disponíveis</h3>
                  <p>{{ mensagemOrientacaoHorarios }}</p>
                </div>

                <div v-if="horariosDisponiveis.length" class="grade-horarios">
                  <button v-for="horario in horariosDisponiveis" :key="horario.valor" type="button" class="horario" :class="{ selecionado: horarioSelecionado(horario) }" :disabled="enviando" @click="selecionarHorario(horario)">
                    {{ horario.label }}
                  </button>
                </div>

                <div v-if="dataBloqueada" class="estado-horarios bloqueado">
                  <strong>Não há atendimento nesta data.</strong>
                  <span>{{ mensagemBloqueioData }}</span>
                  <span v-if="disponibilidadeData?.motivo">Motivo: {{ disponibilidadeData.motivo }}</span>
                </div>

                <div v-else-if="agendamento.servicoId && agendamento.funcionarioId && agendamento.dataAtendimento && !carregandoDisponibilidade" class="estado-horarios">
                  <strong>Nenhum horário livre nesta data.</strong>
                  <span>Nenhum horário disponível para esta data. Escolha outro dia, serviço ou funcionário.</span>
                </div>

                <div v-else-if="!agendamento.servicoId || !agendamento.funcionarioId || !agendamento.dataAtendimento" class="estado-horarios">
                  <strong>Escolha um serviço, funcionário e data para ver os horários disponíveis.</strong>
                </div>

                <div v-if="horariosOcupados.length" class="legenda-horarios">
                  <strong>Horários ocupados</strong>
                  <div class="lista-ocupados" aria-label="Horários ocupados">
                    <span v-for="horario in horariosOcupados" :key="horario.valor">{{ horario.label }}</span>
                  </div>
                </div>
              </section>

              <section class="campo-grande etapa-formulario"><p class="etapa-tag">4. Confirmação</p></section>

              <div v-if="resumoVisivel" class="campo-grande previa">
                <h3>Resumo do agendamento</h3>
                <p><strong>Serviço:</strong> {{ servicoSelecionado?.nome || 'A selecionar' }}</p>
                <p v-if="personalizacao.mostrarFuncionario || funcionariosDisponiveis.length !== 1"><strong>Funcionário:</strong> {{ funcionarioSelecionado?.nome || 'A selecionar' }}</p>
                <p><strong>Data:</strong> {{ dataAtendimentoFormatada || 'A selecionar' }}</p>
                <p v-if="dataBloqueada"><strong>Atendimento:</strong> Não há atendimento nesta data.</p>
                <p><strong>Início:</strong> {{ inicioSelecionado || 'Selecione um horário' }}</p>
                <p><strong>Término previsto:</strong> {{ terminoPrevisto || 'Selecione um horário' }}</p>
                <p><strong>Duração:</strong> {{ duracaoMinutos ? duracaoMinutos + ' minutos' : 'A definir' }}</p>
                <p v-if="personalizacao.mostrarPreco"><strong>Preço:</strong> {{ formatarPreco(servicoSelecionado?.preco) }}</p>
              </div>

              <label class="campo-grande">
                Observação
                <textarea v-model="agendamento.observacao" :disabled="enviando" rows="4" placeholder="Ex: Preferência por horário pontual"></textarea>
              </label>
            </div>

            <div class="rodape-formulario">
              <button class="botao principal" :disabled="enviando || !formularioCompleto" @click="enviarAgendamento">{{ enviando ? 'Enviando...' : 'Agendar' }}</button>
              <p v-if="!agendamento.dataHoraInicio" class="aviso-horario">{{ dataBloqueada ? mensagemBloqueioData : 'Selecione um horário disponível para liberar o agendamento.' }}</p>
            </div>
          </section>
        </section>
      </section>

      <section class="card bloco-divulgacao-nuvemmais" aria-label="Divulgação NuvemMais">
        <div class="bloco-divulgacao-nuvemmais-texto">
          <p class="bloco-divulgacao-nuvemmais-selo">Tecnologia NuvemMais Gestão</p>
          <h2>Quer receber agendamentos online também?</h2>
          <p>
            Crie sua página de agendamento com o NuvemMais Gestão e facilite o atendimento dos seus clientes.
          </p>
        </div>

        <div class="bloco-divulgacao-nuvemmais-acoes">
          <a class="botao secundario" href="/cadastro" target="_blank" rel="noopener noreferrer">Criar minha página</a>
          <a class="botao principal" href="/cadastro" target="_blank" rel="noopener noreferrer">Conhecer planos</a>
        </div>
      </section>

      <nav class="links-institucionais card" aria-label="Páginas públicas">
        <RouterLink to="/sobre">Sobre</RouterLink>
        <RouterLink to="/termos">Termos de Uso</RouterLink>
        <RouterLink to="/privacidade">Política de Privacidade</RouterLink>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.pagina-publica { min-height: 100vh; padding: 30px 16px 24px; background: radial-gradient(circle at 8% -5%, color-mix(in srgb, var(--publico-cor-principal), transparent 82%), transparent 32%), linear-gradient(180deg, color-mix(in srgb, var(--publico-cor-hero), white 34%) 0%, var(--publico-cor-fundo) 52%, color-mix(in srgb, var(--publico-cor-fundo), #e2e8f0 18%) 100%); color: var(--publico-cor-texto); }
.pagina-publica.tema-moderno { background: radial-gradient(circle at top left, color-mix(in srgb, var(--publico-cor-principal), transparent 84%), transparent 34%), linear-gradient(135deg, var(--publico-cor-fundo) 0%, color-mix(in srgb, var(--publico-cor-principal), white 88%) 48%, color-mix(in srgb, var(--publico-cor-secundaria), white 90%) 100%); }
.pagina-publica.tema-escuro,
.pagina-publica.tema-preto_elegante,
.pagina-publica.tema-preto_dourado { background: var(--publico-cor-fundo); color: var(--publico-cor-texto); }
.pagina-publica.tema-suave { background: var(--publico-cor-fundo); color: var(--publico-cor-texto); }
.conteudo-publico { width: 100%; max-width: 1160px; margin: 0 auto; display: grid; gap: 20px; }
.card { background: var(--publico-cor-card); border: 1px solid var(--publico-cor-borda); border-radius: 18px; padding: 22px; box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.tema-moderno .card { border-radius: 18px; border-color: rgba(37, 99, 235, 0.16); box-shadow: 0 20px 48px rgba(15, 23, 42, 0.14); }
.tema-escuro .card,
.tema-preto_elegante .card,
.tema-preto_dourado .card { background: #111827; border-color: rgba(148, 163, 184, 0.22); color: #e5e7eb; box-shadow: 0 18px 48px rgba(0, 0, 0, 0.32); }
.tema-suave .card { background: #ffffff; border-color: #dbeafe; box-shadow: 0 10px 26px rgba(37, 99, 235, 0.07); }
.hero-publico { display: grid; gap: 18px; }
.banner-publico { min-height: 150px; height: clamp(150px, 24vw, 280px); max-height: 280px; overflow: hidden; border-radius: 14px; background: color-mix(in srgb, var(--publico-cor-fundo-secundario), white 72%); box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06); }
.banner-publico img { width: 100%; height: 100%; display: block; object-fit: cover; object-position: center; background: #ffffff; }
.banner-publico-placeholder {
  display: grid;
  place-items: center;
  gap: 6px;
  background: var(--publico-cor-hero);
  color: var(--cor-secundaria-publica, #0f172a);
  text-align: center;
  padding: 24px;
}
.banner-publico-placeholder strong {
  font-size: 18px;
  font-weight: 800;
}
.banner-publico-placeholder span {
  color: #64748b;
  font-size: 13px;
}
.estado { width: min(100%, 620px); text-align: center; margin: 0 auto; }
.estado h1 { margin: 0 0 8px; font-size: 28px; font-weight: 800; }
.estado p { margin: 0; color: #64748b; }
.tema-escuro .estado p, .tema-escuro .mensagem-publica, .tema-escuro .dados-empresa p, .tema-escuro .titulo-card p, .tema-escuro .titulo-horarios p, .tema-escuro .aviso-horario, .tema-escuro .previa, .tema-escuro .bloco-publico p, .tema-escuro .politica-publica p,
.tema-preto_elegante .estado p, .tema-preto_elegante .mensagem-publica, .tema-preto_elegante .dados-empresa p, .tema-preto_elegante .titulo-card p, .tema-preto_elegante .titulo-horarios p, .tema-preto_elegante .aviso-horario, .tema-preto_elegante .previa, .tema-preto_elegante .bloco-publico p, .tema-preto_elegante .politica-publica p,
.tema-preto_dourado .estado p, .tema-preto_dourado .mensagem-publica, .tema-preto_dourado .dados-empresa p, .tema-preto_dourado .titulo-card p, .tema-preto_dourado .titulo-horarios p, .tema-preto_dourado .aviso-horario, .tema-preto_dourado .previa, .tema-preto_dourado .bloco-publico p, .tema-preto_dourado .politica-publica p { color: #cbd5e1; }
.cabecalho-publico { display: grid; grid-template-columns: minmax(0, 1fr) 280px; gap: 22px; align-items: flex-start; }
.identidade-empresa { display: flex; align-items: flex-start; gap: 20px; }
.subtitulo { margin: 0 0 4px; color: var(--cor-principal-publica, #2563eb); font-size: 14px; font-weight: 700; text-transform: uppercase; }
.logo-publico { width: 78px; height: 78px; border-radius: 16px; object-fit: cover; border: 1px solid #e5e7eb; }
.logo-fallback { width: 78px; height: 78px; border-radius: 16px; display: grid; place-items: center; background: linear-gradient(145deg, var(--cor-principal-publica, #2563eb), #0f172a); color: white; font-size: 28px; font-weight: 800; }
.cabecalho-publico h1 { margin: 0; font-size: clamp(30px, 4vw, 42px); font-weight: 800; letter-spacing: 0; color: var(--cor-secundaria-publica, #0f172a); }
.mensagem-publica { margin: 8px 0 0; color: #475569; }
.texto-apoio { margin: 8px 0 0; color: #334155; font-size: 16px; font-weight: 600; }
.dados-empresa { display: grid; gap: 6px; min-width: 240px; }
.dados-empresa p { margin: 0; color: #374151; word-break: break-word; }
.dados-empresa strong { font-weight: 800; }
.layout-publico { display: grid; grid-template-columns: minmax(280px, 0.95fr) minmax(0, 1.45fr); gap: 20px; align-items: start; }
.coluna-info, .coluna-formulario { display: grid; gap: 16px; }
.bloco-publico { display: grid; gap: 12px; }
.bloco-publico h2 { margin: 0; font-size: 18px; }
.bloco-publico p { margin: 0; color: #475569; }
.instrucoes-publicas { padding: 12px; border-left: 4px solid var(--cor-principal-publica, #2563eb); background: #f8fafc; }
.links-publicos { display: flex; gap: 10px; flex-wrap: wrap; }
.links-publicos a { padding: 9px 12px; border-radius: 10px; color: white; background: var(--cor-secundaria-publica, #0f172a); text-decoration: none; font-weight: 800; }
.links-institucionais { display: flex; justify-content: center; gap: 14px; flex-wrap: wrap; padding: 14px; }
.links-institucionais a { color: #64748b; font-size: 13px; font-weight: 700; text-decoration: none; }
.links-institucionais a:hover { color: var(--cor-principal-publica, #2563eb); text-decoration: underline; }
.tema-escuro .links-institucionais a,
.tema-preto_elegante .links-institucionais a,
.tema-preto_dourado .links-institucionais a { color: #cbd5e1; }
.confirmacao-card { display: grid; gap: 18px; border-color: #bbf7d0; background: #fbfffd; }
.confirmacao-topo { display: flex; justify-content: space-between; gap: 18px; align-items: flex-start; padding-bottom: 16px; border-bottom: 1px solid #dcfce7; }
.confirmacao-topo h2 { margin: 0; color: #14532d; font-size: 26px; font-weight: 800; }
.confirmacao-topo p:not(.subtitulo) { margin: 8px 0 0; color: #475569; }
.protocolo { display: grid; gap: 4px; min-width: 180px; padding: 12px; border: 1px solid #bbf7d0; border-radius: 8px; background: #f0fdf4; color: #166534; }
.protocolo span { font-size: 12px; font-weight: 800; text-transform: uppercase; }
.protocolo strong { font-size: 20px; word-break: break-word; }
.resumo-confirmacao { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 12px; margin: 0; }
.resumo-confirmacao div { display: grid; gap: 4px; padding: 12px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; }
.resumo-confirmacao .item-largo { grid-column: 1 / -1; }
.resumo-confirmacao dt { color: #64748b; font-size: 12px; font-weight: 800; text-transform: uppercase; }
.resumo-confirmacao dd { display: grid; gap: 3px; margin: 0; color: #111827; font-size: 15px; font-weight: 800; word-break: break-word; }
.resumo-confirmacao dd span { color: #64748b; font-size: 13px; font-weight: 700; }
.aviso-fallback { margin: 0; color: #92400e; font-size: 13px; font-weight: 700; }
.mensagem-copia { margin: 0; color: #166534; font-size: 14px; font-weight: 800; }
.acoes-confirmacao { display: flex; gap: 12px; flex-wrap: wrap; }
.formulario { display: grid; gap: 16px; }
.titulo-card h2 { margin: 0; font-size: 22px; color: #111827; font-weight: 800; }
.tema-escuro .titulo-card h2, .tema-escuro .titulo-horarios h3, .tema-escuro .estado-horarios strong, .tema-escuro .politica-publica h2,
.tema-preto_elegante .titulo-card h2, .tema-preto_elegante .titulo-horarios h3, .tema-preto_elegante .estado-horarios strong, .tema-preto_elegante .politica-publica h2,
.tema-preto_dourado .titulo-card h2, .tema-preto_dourado .titulo-horarios h3, .tema-preto_dourado .estado-horarios strong, .tema-preto_dourado .politica-publica h2 { color: #f8fafc; }
.titulo-card p { margin: 6px 0 0; color: #64748b; font-size: 14px; }
.campos { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 16px; }
.etapa-formulario { padding-top: 2px; }
.etapa-tag { margin: 0; display: inline-flex; align-items: center; min-height: 32px; padding: 6px 12px; border-radius: 999px; border: 1px solid #bfdbfe; background: #eff6ff; color: #1e3a8a; font-size: 12px; font-weight: 800; text-transform: uppercase; letter-spacing: 0.05em; }
label { display: grid; gap: 6px; color: #374151; font-weight: 700; font-size: 14px; }
input, select, textarea { width: 100%; min-width: 0; border: 1px solid #d1d5db; border-radius: 10px; padding: 11px 12px; font-size: 15px; background: white; box-sizing: border-box; }
.tema-escuro input, .tema-escuro select, .tema-escuro textarea,
.tema-preto_elegante input, .tema-preto_elegante select, .tema-preto_elegante textarea,
.tema-preto_dourado input, .tema-preto_dourado select, .tema-preto_dourado textarea { background: #0f172a; border-color: #334155; color: #f8fafc; }
.tema-moderno input, .tema-moderno select, .tema-moderno textarea, .tema-moderno .horarios, .tema-moderno .previa { border-radius: 14px; }
.tema-suave input, .tema-suave select, .tema-suave textarea { border-color: #bfdbfe; background: #fbfdff; }
textarea { min-height: 110px; resize: vertical; font-family: inherit; }
input:focus, select:focus, textarea:focus { outline: none; border-color: #2563eb; box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12); }
.campo-grande { grid-column: 1 / -1; }
.horarios { display: grid; gap: 14px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 10px; background: #f8fafc; }
.tema-escuro .horarios, .tema-escuro .estado-horarios, .tema-escuro .previa, .tema-escuro .resumo-confirmacao div, .tema-escuro .lista-ocupados span,
.tema-preto_elegante .horarios, .tema-preto_elegante .estado-horarios, .tema-preto_elegante .previa, .tema-preto_elegante .resumo-confirmacao div, .tema-preto_elegante .lista-ocupados span,
.tema-preto_dourado .horarios, .tema-preto_dourado .estado-horarios, .tema-preto_dourado .previa, .tema-preto_dourado .resumo-confirmacao div, .tema-preto_dourado .lista-ocupados span { background: #0f172a; border-color: #334155; }
.tema-suave .horarios, .tema-suave .previa { background: #f1f8ff; border-color: #dbeafe; }
.titulo-horarios h3, .titulo-horarios p { margin: 0; }
.titulo-horarios h3 { font-size: 16px; font-weight: 800; color: #111827; }
.titulo-horarios p { margin-top: 4px; color: #64748b; font-size: 14px; }
.grade-horarios { display: grid; grid-template-columns: repeat(auto-fill, minmax(128px, 1fr)); gap: 12px; }
.horario { min-height: 56px; border: 1px solid #bfdbfe; border-radius: 10px; background: white; color: var(--cor-principal-publica, #1d4ed8); cursor: pointer; font-size: 16px; font-weight: 800; transition: background 0.15s ease, border-color 0.15s ease, color 0.15s ease, transform 0.15s ease; }
.tema-moderno .horario { min-height: 62px; border-radius: 14px; box-shadow: 0 10px 22px rgba(37, 99, 235, 0.1); }
.tema-escuro .horario,
.tema-preto_elegante .horario,
.tema-preto_dourado .horario { background: #1f2937; border-color: #334155; }
.tema-suave .horario { background: #ffffff; border-color: #dbeafe; }
.horario:hover:not(:disabled) { transform: translateY(-1px); border-color: var(--cor-principal-publica, #2563eb); background: #eff6ff; }
.horario.selecionado { background: var(--cor-principal-publica, #2563eb); border-color: var(--cor-principal-publica, #2563eb); color: white; }
.horario:disabled { opacity: 0.65; cursor: not-allowed; transform: none; }
.estado-horarios { display: grid; gap: 4px; padding: 14px; border: 1px solid #e5e7eb; border-radius: 8px; background: white; color: #475569; font-size: 14px; }
.estado-horarios strong { color: #111827; }
.bloqueio-data, .estado-horarios.bloqueado { display: grid; gap: 6px; padding: 14px; border: 1px solid #fecaca; border-radius: 8px; background: #fef2f2; color: #991b1b; font-size: 14px; }
.bloqueio-data strong, .estado-horarios.bloqueado strong { color: #7f1d1d; }
.bloqueio-data span, .estado-horarios.bloqueado span { color: #991b1b; font-weight: 700; }
.legenda-horarios { display: grid; gap: 8px; padding-top: 12px; border-top: 1px solid #e5e7eb; color: #64748b; font-size: 13px; font-weight: 700; }
.legenda-horarios strong { color: #475569; }
.lista-ocupados { display: flex; gap: 8px; flex-wrap: wrap; }
.lista-ocupados span { display: inline-flex; align-items: center; min-height: 32px; padding: 6px 10px; border: 1px solid #e5e7eb; border-radius: 8px; background: #f1f5f9; color: #64748b; text-decoration: line-through; }
.previa { display: grid; grid-template-columns: repeat(2, minmax(220px, 1fr)); gap: 10px 14px; padding: 14px; border: 1px solid #bfdbfe; border-radius: 10px; background: #eff6ff; color: #1e3a8a; font-size: 14px; }
.previa h3 { grid-column: 1 / -1; margin: 0; color: #1e3a8a; font-size: 16px; font-weight: 800; }
.previa p { margin: 0; }
.rodape-formulario { display: flex; align-items: center; gap: 12px; flex-wrap: wrap; }
.aviso-horario { margin: 0; color: #64748b; font-size: 14px; font-weight: 700; }
.botao { border: none; color: white; padding: 12px 20px; border-radius: 10px; cursor: pointer; font-weight: 800; transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease; }
.tema-moderno .botao { border-radius: 999px; padding: 12px 18px; box-shadow: 0 12px 24px rgba(37, 99, 235, 0.18); }
.tema-suave .botao { color: var(--cor-secundaria-publica, #0f172a); background: #dbeafe; }
.tema-escuro .secundario,
.tema-preto_elegante .secundario,
.tema-preto_dourado .secundario { background: #334155; color: #f8fafc; }
.botao:hover:not(:disabled) { transform: translateY(-1px); }
.botao:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }
.principal { background: var(--cor-principal-publica, #2563eb); }
.principal:hover:not(:disabled) { background: var(--cor-secundaria-publica, #1d4ed8); }
.politica-publica { display: grid; gap: 8px; }
.politica-publica h2 { margin: 0; color: var(--cor-secundaria-publica, #0f172a); font-size: 20px; font-weight: 800; }
.politica-publica p { margin: 0; color: #475569; }
.secundario { border: 1px solid #d1d5db; background: white; color: #1f2937; }
.secundario:hover:not(:disabled) { background: #f8fafc; }
.erro { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.sucesso-card { border-color: #bbf7d0; background: #f0fdf4; color: #15803d; display: grid; gap: 8px; }
.sucesso-card h3, .sucesso-card p { margin: 0; }
.bloco-divulgacao-nuvemmais {
  display: grid;
  gap: 14px;
  border-color: color-mix(in srgb, var(--publico-cor-principal), white 82%);
  background:
    linear-gradient(
      135deg,
      color-mix(in srgb, var(--publico-cor-fundo-secundario), white 18%),
      color-mix(in srgb, var(--publico-cor-principal), white 92%)
    );
}
.bloco-divulgacao-nuvemmais-texto { display: grid; gap: 6px; }
.bloco-divulgacao-nuvemmais-selo {
  margin: 0;
  color: var(--cor-principal-publica, #2563eb);
  font-size: 12px;
  font-weight: 800;
  letter-spacing: 0.04em;
  text-transform: uppercase;
}
.bloco-divulgacao-nuvemmais h2 { margin: 0; font-size: clamp(18px, 2.8vw, 24px); line-height: 1.2; }
.bloco-divulgacao-nuvemmais p { margin: 0; color: #475569; line-height: 1.55; }
.tema-escuro .bloco-divulgacao-nuvemmais p,
.tema-preto_elegante .bloco-divulgacao-nuvemmais p,
.tema-preto_dourado .bloco-divulgacao-nuvemmais p { color: #cbd5e1; }
.bloco-divulgacao-nuvemmais-acoes { display: flex; flex-wrap: wrap; gap: 10px; }
.bloco-divulgacao-nuvemmais-acoes > a { min-width: 180px; }
@media (max-width: 900px) {
  .layout-publico, .cabecalho-publico { grid-template-columns: 1fr; }
  .cabecalho-publico { gap: 16px; }
  .identidade-empresa, .confirmacao-topo { flex-direction: column; }
  .dados-empresa { min-width: 0; }
  .campos, .previa, .resumo-confirmacao { grid-template-columns: 1fr; }
  .rodape-formulario .botao { width: 100%; min-height: 48px; }
  .grade-horarios { grid-template-columns: repeat(2, minmax(0, 1fr)); }
  .bloco-divulgacao-nuvemmais-acoes > a { width: 100%; min-width: 0; }
}
@media (max-width: 520px) {
  .pagina-publica { padding: 20px 12px 18px; }
  .card { padding: 16px; border-radius: 14px; }
  .banner-publico { min-height: 118px; height: clamp(118px, 44vw, 188px); max-height: 188px; padding: 8px; background: color-mix(in srgb, var(--publico-cor-fundo-secundario), white 86%); }
  .banner-publico img { object-fit: contain; border-radius: 12px; }
  .logo-publico, .logo-fallback { width: 68px; height: 68px; border-radius: 14px; }
  .grade-horarios { grid-template-columns: 1fr; }
}
</style>
