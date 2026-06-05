<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'

const CHAVE_ASSISTENTE_RECOLHIDO = 'primeiroUsoAssistenteRecolhido'
const STATUS_ROTULOS = {
  concluido: 'Concluído',
  pendente: 'Fazer agora',
  recomendado: 'Recomendado',
  opcional: 'Opcional',
}

const props = defineProps({
  carregando: {
    type: Boolean,
    default: false,
  },
  usandoFallback: {
    type: Boolean,
    default: true,
  },
  statusPrimeiroUso: {
    type: Object,
    default: null,
  },
  empresa: {
    type: Object,
    default: null,
  },
  totalClientes: {
    type: Number,
    default: 0,
  },
  totalServicos: {
    type: Number,
    default: 0,
  },
  totalFuncionarios: {
    type: Number,
    default: 0,
  },
  totalAgendamentos: {
    type: Number,
    default: 0,
  },
  totalRecebidosLinkPublicoHoje: {
    type: Number,
    default: 0,
  },
  linkPublicoAgendamento: {
    type: String,
    default: '',
  },
  linkPublicoCatalogo: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['copiar-link'])

const recolhido = ref(lerAssistenteRecolhido())
const mostrarTodosPassos = ref(true)
const viewportMobile = ref(false)
let mediaQueryViewport = null

const passosBase = [
  {
    id: 'empresa',
    aliases: ['empresa', 'minha empresa', 'dados da empresa'],
    titulo: 'Configure sua empresa',
    descricao: 'Confira nome, horários, telefone e os dados principais do seu negócio.',
    rotuloAcao: 'Fazer agora',
    to: '/minha-empresa',
  },
  {
    id: 'servicos',
    aliases: ['servicos', 'serviços', 'servico', 'serviço'],
    titulo: 'Cadastre seus serviços',
    descricao: 'Cadastre o que você oferece para agilizar os atendimentos.',
    rotuloAcao: 'Fazer agora',
    to: '/servicos',
    topicoAjuda: 'servicos',
  },
  {
    id: 'clientes',
    aliases: ['clientes', 'cliente'],
    titulo: 'Cadastre seus clientes',
    descricao: 'Salve os clientes para agendar mais rápido e organizar o histórico.',
    rotuloAcao: 'Fazer agora',
    to: '/clientes',
  },
  {
    id: 'funcionarios',
    aliases: ['funcionarios', 'funcionários', 'equipe'],
    titulo: 'Cadastre seus profissionais',
    descricao: 'Se mais pessoas atendem com você, cadastre cada uma.',
    rotuloAcao: 'Fazer agora',
    to: '/funcionarios',
    opcional: true,
  },
  {
    id: 'agenda',
    aliases: ['agenda', 'agendamentos', 'agendamento'],
    titulo: 'Teste sua agenda',
    descricao: 'Veja os atendimentos do dia e crie um agendamento de teste.',
    rotuloAcao: 'Fazer agora',
    to: '/agenda',
  },
  {
    id: 'link-publico',
    aliases: ['link publico', 'link público', 'agendamento publico', 'agendamento público', 'slug'],
    titulo: 'Ative seu link público',
    descricao: 'Permita que seus clientes agendem pelo seu link.',
    rotuloAcao: 'Fazer agora',
    to: '/personalizacao',
    topicoAjuda: 'link-publico',
  },
  {
    id: 'personalizacao',
    aliases: ['personalizacao', 'personalização', 'pagina publica', 'página pública'],
    titulo: 'Personalize sua página',
    descricao: 'Adicione informações, mensagem e o visual da página pública.',
    rotuloAcao: 'Fazer agora',
    to: '/personalizacao',
  },
  {
    id: 'catalogo',
    aliases: ['catalogo', 'catálogo', 'cardapio', 'cardápio', 'produtos'],
    titulo: 'Publique seu catálogo',
    descricao: 'Se você vende produtos, mostre preços, fotos e disponibilidade.',
    rotuloAcao: 'Fazer agora',
    to: '/estoque',
    topicoAjuda: 'catalogo-publico',
  },
  {
    id: 'estoque-dia',
    aliases: ['estoque do dia', 'estoque-dia', 'estoque dia'],
    titulo: 'Use o Estoque do dia',
    descricao: 'Atualize rapidamente o que tem disponível hoje.',
    rotuloAcao: 'Fazer agora',
    to: '/estoque?aba=estoque-dia',
    topicoAjuda: 'estoque',
  },
  {
    id: 'compartilhar-link',
    aliases: ['compartilhar link', 'copiar link', 'link compartilhado'],
    titulo: 'Compartilhe seu link',
    descricao: 'Copie o link público e envie para seus clientes no WhatsApp.',
    rotuloAcao: 'Copiar link',
    acao: 'copiar-link',
    topicoAjuda: 'comecando',
  },
]

const podeCopiarLink = computed(() => Boolean(props.linkPublicoAgendamento))
const statusApiDisponivel = computed(() => Object.keys(obterStatusPrimeiroUsoNormalizado()).length > 0)
const passosApi = computed(() => normalizarPassosApi(obterStatusPrimeiroUsoNormalizado().passos))
const usaPassosApi = computed(() => passosApi.value.length > 0)
const totalPassosApi = computed(() => extrairTotalPassosApi())
const passosConcluidosApi = computed(() => extrairPassosConcluidosApi())
const percentualApi = computed(() => extrairPercentualApi())
const statusGeralApi = computed(() => normalizarStatus(obterCampoPrimeiroUso(obterStatusPrimeiroUsoNormalizado(), 'status', 'situacao', 'estado')))
const passoProximoApi = computed(() => localizarPassoApiPorChave(obterCampoPrimeiroUso(obterStatusPrimeiroUsoNormalizado(), 'proximoPassoChave', 'proximo_passo_chave')))
const passosComStatus = computed(() =>
  usaPassosApi.value
    ? passosApi.value
    : passosBase.map((passo, indice) => {
        const status = resolverStatusPasso(passo)

        return {
          ...passo,
          indice: indice + 1,
          status,
          rotuloStatus: STATUS_ROTULOS[status] || STATUS_ROTULOS.recomendado,
        }
      }),
)
const totalPassosPrincipais = computed(() => {
  if (usaPassosApi.value) {
    return totalPassosApi.value || passosComStatus.value.filter((passo) => passo.status !== 'opcional').length
  }

  return passosComStatus.value.filter((passo) => !passo.opcional).length
})
const totalPassosConcluidos = computed(() => {
  if (usaPassosApi.value) {
    const concluidosApi = Number(passosConcluidosApi.value)

    if (Number.isFinite(concluidosApi) && concluidosApi >= 0) {
      return Math.min(Math.round(concluidosApi), totalPassosPrincipais.value || Math.round(concluidosApi))
    }
  }

  return passosComStatus.value.filter((passo) => !passo.opcional && passo.status === 'concluido').length
})
const percentualCalculado = computed(() => {
  if (!totalPassosPrincipais.value) {
    return 0
  }

  return Math.max(0, Math.min(100, Math.round((totalPassosConcluidos.value / totalPassosPrincipais.value) * 100)))
})
const percentualApiNormalizado = computed(() => {
  const percentual = percentualApi.value

  if (!Number.isFinite(percentual)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(percentual)))
})
const percentualExibido = computed(() => {
  if (percentualApiNormalizado.value === null) {
    return percentualCalculado.value
  }

  const percentualCalculadoAtual = percentualCalculado.value

  if (Math.abs(percentualApiNormalizado.value - percentualCalculadoAtual) > 1) {
    return percentualCalculadoAtual
  }

  return percentualApiNormalizado.value
})
const progressoTexto = computed(() => `${totalPassosConcluidos.value} de ${totalPassosPrincipais.value} passos concluídos`)
const resumoColapsado = computed(() => `Primeiros passos: ${totalPassosConcluidos.value} de ${totalPassosPrincipais.value} concluídos`)
const descricaoPainel = computed(() =>
  props.usandoFallback
    ? 'Veja os passos recomendados para começar.'
    : passoProximoApi.value?.titulo
      ? `Próximo passo: ${passoProximoApi.value.titulo}.`
      : statusGeralApi.value === 'concluido'
        ? 'Os principais passos do primeiro uso já foram finalizados.'
        : 'Seu progresso foi atualizado com base nas configurações atuais.',
)
const passosVisiveis = computed(() => {
  if (!viewportMobile.value || mostrarTodosPassos.value) {
    return passosComStatus.value
  }

  return passosComStatus.value.slice(0, 3)
})
const exibirBotaoTodos = computed(() => !recolhido.value && viewportMobile.value && passosComStatus.value.length > 3)

function lerAssistenteRecolhido() {
  if (typeof window === 'undefined') {
    return false
  }

  return localStorage.getItem(CHAVE_ASSISTENTE_RECOLHIDO) === 'true'
}

function salvarAssistenteRecolhido(valor) {
  if (typeof window === 'undefined') {
    return
  }

  localStorage.setItem(CHAVE_ASSISTENTE_RECOLHIDO, valor ? 'true' : 'false')
}

function atualizarViewport() {
  const correspondeMobile = Boolean(mediaQueryViewport?.matches)

  viewportMobile.value = correspondeMobile
  mostrarTodosPassos.value = !correspondeMobile
}

function alternarRecolhido() {
  recolhido.value = !recolhido.value
  salvarAssistenteRecolhido(recolhido.value)
}

function alternarListaPassos() {
  mostrarTodosPassos.value = !mostrarTodosPassos.value
}

function passoTemDestino(passo) {
  return String(passo?.to || '').trim().length > 0
}

function obterAjudaPasso(topico) {
  return {
    path: '/ajuda',
    query: {
      topico,
    },
  }
}

function emitirCopiaLink() {
  emit('copiar-link')
}

function obterStatusPrimeiroUsoNormalizado() {
  const status = props.statusPrimeiroUso

  if (!status || typeof status !== 'object') {
    return {}
  }

  if (status.data && typeof status.data === 'object' && !Array.isArray(status.data)) {
    return status.data
  }

  return status
}

function obterCampoPrimeiroUso(origem, ...campos) {
  if (!origem || typeof origem !== 'object') {
    return ''
  }

  for (const campo of campos) {
    const valor = origem[campo]

    if (valor !== null && valor !== undefined && String(valor).trim() !== '') {
      return valor
    }
  }

  return ''
}

function extrairValorNumeroPrimeiroUso(...valores) {
  for (const valor of valores) {
    const numero = Number(valor)

    if (Number.isFinite(numero)) {
      return numero
    }
  }

  return null
}

function extrairTotalPassosApi() {
  const dados = obterStatusPrimeiroUsoNormalizado()
  const total = extrairValorNumeroPrimeiroUso(
    obterCampoPrimeiroUso(dados, 'totalPassos', 'total_passos'),
    obterCampoPrimeiroUso(dados, 'totalPassosPrincipais', 'total_passos_principais'),
    passosApi.value.length,
  )

  if (!Number.isFinite(total)) {
    return 0
  }

  return Math.max(0, Math.round(total))
}

function extrairPassosConcluidosApi() {
  const dados = obterStatusPrimeiroUsoNormalizado()
  const totalConcluidos = extrairValorNumeroPrimeiroUso(
    obterCampoPrimeiroUso(dados, 'passosConcluidos', 'passos_concluidos'),
    obterCampoPrimeiroUso(dados, 'totalPassosConcluidos', 'total_passos_concluidos'),
  )

  if (Number.isFinite(totalConcluidos) && totalConcluidos > 0) {
    return Math.max(0, Math.round(totalConcluidos))
  }

  return passosApi.value.filter((passo) => passo.status === 'concluido').length
}

function localizarPassoApiPorChave(chave) {
  const chaveNormalizada = normalizarIdentificador(chave)

  if (!chaveNormalizada) {
    return null
  }

  return passosApi.value.find((passo) => passo.chaveNormalizada === chaveNormalizada || passo.id === chaveNormalizada) || null
}

function normalizarPassosApi(passos) {
  const lista = Array.isArray(passos)
    ? passos
    : passos && typeof passos === 'object'
      ? Object.values(passos)
      : []

  if (!lista.length) {
    return []
  }

  return lista
    .map((item, indice) => normalizarPassoApi(item, indice))
    .sort((passoA, passoB) => {
      const prioridadeA = Number.isFinite(passoA.prioridade) ? passoA.prioridade : Number.MAX_SAFE_INTEGER
      const prioridadeB = Number.isFinite(passoB.prioridade) ? passoB.prioridade : Number.MAX_SAFE_INTEGER

      if (prioridadeA !== prioridadeB) {
        return prioridadeA - prioridadeB
      }

      return passoA.indiceOriginal - passoB.indiceOriginal
    })
    .map((passo, indice) => ({
      ...passo,
      indice: indice + 1,
      rotuloStatus: STATUS_ROTULOS[passo.status] || STATUS_ROTULOS.recomendado,
    }))
}

function normalizarPassoApi(item, indice) {
  const dados = item && typeof item === 'object' ? item : {}
  const chaveBruta = obterCampoPrimeiroUso(dados, 'chave', 'id', 'codigo', 'slug', 'etapa', 'passo') || `passo-${indice + 1}`
  const chaveNormalizada = normalizarIdentificador(chaveBruta) || `passo-${indice + 1}`
  const base = encontrarPassoBase(chaveBruta)
  const statusBruto = obterCampoPrimeiroUso(dados, 'status', 'situacao', 'estado', 'resultado', 'tipo', 'rotulo', 'label')
  const status = normalizarStatus(statusBruto) || (base ? resolverStatusFallbackPasso(base) : 'recomendado')
  const prioridade = extrairValorNumeroPrimeiroUso(obterCampoPrimeiroUso(dados, 'prioridade', 'ordem', 'posicao', 'sequencia'))
  const titulo = String(obterCampoPrimeiroUso(dados, 'titulo', 'nome', 'label') || base?.titulo || `Passo ${indice + 1}`).trim()
  const descricao = String(
    obterCampoPrimeiroUso(dados, 'descricao', 'detalhe', 'texto', 'observacao') || base?.descricao || '',
  ).trim()
  const rota = String(obterCampoPrimeiroUso(dados, 'rota', 'to', 'url', 'link') || base?.to || '').trim()
  const rotuloAcao = String(
    obterCampoPrimeiroUso(dados, 'rotuloAcao', 'acaoRotulo', 'textoAcao') || base?.rotuloAcao || 'Fazer agora',
  ).trim()
  const opcional = dados.opcional === true || base?.opcional === true || status === 'opcional'
  const proximoPassoChave = normalizarIdentificador(obterCampoPrimeiroUso(obterStatusPrimeiroUsoNormalizado(), 'proximoPassoChave', 'proximo_passo_chave'))

  return {
    ...base,
    ...dados,
    id: chaveNormalizada,
    chave: chaveBruta,
    chaveNormalizada,
    titulo,
    descricao,
    to: rota || base?.to || '',
    rotuloAcao,
    opcional,
    status,
    prioridade: Number.isFinite(prioridade) ? prioridade : indice + 1,
    indiceOriginal: indice + 1,
    ehProximo: Boolean(proximoPassoChave && proximoPassoChave === chaveNormalizada),
  }
}

function encontrarPassoBase(chave) {
  const chaveNormalizada = normalizarIdentificador(chave)

  if (!chaveNormalizada) {
    return null
  }

  return (
    passosBase.find((passo) => {
      const idNormalizado = normalizarIdentificador(passo.id)
      const aliases = Array.isArray(passo.aliases) ? passo.aliases : []

      return idNormalizado === chaveNormalizada || aliases.some((alias) => normalizarIdentificador(alias) === chaveNormalizada)
    }) || null
  )
}

function resolverStatusPasso(passo) {
  const statusRemoto = resolverStatusRemotoPasso(passo)

  if (statusRemoto) {
    return statusRemoto
  }

  return resolverStatusFallbackPasso(passo)
}

function resolverStatusRemotoPasso(passo) {
  if (!statusApiDisponivel.value) {
    return ''
  }

  const candidatos = [
    ...coletarCandidatosStatus(props.statusPrimeiroUso, passo.aliases),
    ...coletarCandidatosStatus(props.statusPrimeiroUso?.data, passo.aliases),
  ]

  for (const candidato of candidatos) {
    const status = normalizarStatus(candidato)

    if (status) {
      return status
    }
  }

  return ''
}

function coletarCandidatosStatus(origem, aliases = []) {
  if (!origem || typeof origem !== 'object') {
    return []
  }

  const encontrados = []
  const aliasesNormalizados = aliases.map((alias) => normalizarIdentificador(alias))

  Object.entries(origem).forEach(([chave, valor]) => {
    const chaveNormalizada = normalizarIdentificador(chave)

    if (aliasesNormalizados.some((alias) => chaveNormalizada.includes(alias) || alias.includes(chaveNormalizada))) {
      encontrados.push(valor)
    }
  })

  const colecoes = [
    origem.passos,
    origem.etapas,
    origem.checklist,
    origem.items,
    origem.status,
    origem.resumo,
  ]

  colecoes.forEach((colecao) => {
    if (colecao && typeof colecao === 'object' && !Array.isArray(colecao)) {
      Object.entries(colecao).forEach(([chave, valor]) => {
        const chaveNormalizada = normalizarIdentificador(chave)

        if (aliasesNormalizados.some((alias) => chaveNormalizada.includes(alias) || alias.includes(chaveNormalizada))) {
          encontrados.push(valor)
        }
      })
    }

    const itens = Array.isArray(colecao)
      ? colecao
      : colecao && typeof colecao === 'object'
        ? Object.values(colecao)
        : []

    itens.forEach((item) => {
      const identificadores = [
        item?.id,
        item?.codigo,
        item?.chave,
        item?.slug,
        item?.nome,
        item?.titulo,
        item?.etapa,
        item?.passo,
      ]
        .map((valor) => normalizarIdentificador(valor))
        .filter(Boolean)

      if (
        identificadores.some((identificador) =>
          aliasesNormalizados.some((alias) => identificador.includes(alias) || alias.includes(identificador)),
        )
      ) {
        encontrados.push(item)
      }
    })
  })

  return encontrados
}

function normalizarStatus(valor) {
  if (valor === true) {
    return 'concluido'
  }

  if (valor === false) {
    return 'pendente'
  }

  if (typeof valor === 'number') {
    if (valor >= 100) {
      return 'concluido'
    }

    if (valor > 0) {
      return 'recomendado'
    }

    return ''
  }

  if (typeof valor === 'string') {
    const texto = normalizarIdentificador(valor)

    if (['concluido', 'concluida', 'finalizado', 'finalizada', 'feito', 'completo', 'ok'].includes(texto)) {
      return 'concluido'
    }

    if (['pendente', 'nao iniciado', 'nao_iniciado', 'faltando'].includes(texto)) {
      return 'pendente'
    }

    if (['recomendado', 'sugerido', 'em andamento', 'em_andamento'].includes(texto)) {
      return 'recomendado'
    }

    if (['opcional', 'facultativo'].includes(texto)) {
      return 'opcional'
    }

    return ''
  }

  if (!valor || typeof valor !== 'object') {
    return ''
  }

  const textoStatus = [
    valor.status,
    valor.situacao,
    valor.estado,
    valor.resultado,
    valor.tipo,
    valor.rotulo,
    valor.label,
  ]
    .map((item) => normalizarStatus(item))
    .find(Boolean)

  if (textoStatus) {
    return textoStatus
  }

  const camposConcluidos = [
    valor.concluido,
    valor.concluida,
    valor.finalizado,
    valor.finalizada,
    valor.completo,
    valor.completa,
    valor.feito,
    valor.configurado,
    valor.ativo,
  ]

  if (camposConcluidos.some((campo) => campo === true)) {
    return 'concluido'
  }

  if (valor.opcional === true) {
    return 'opcional'
  }

  if (valor.recomendado === true || valor.sugerido === true) {
    return 'recomendado'
  }

  const percentual = extrairPrimeiroNumero(
    valor.percentualConclusao,
    valor.percentualConcluido,
    valor.percentual,
    valor.progresso,
  )

  if (Number.isFinite(percentual)) {
    if (percentual >= 100) {
      return 'concluido'
    }

    if (percentual > 0) {
      return 'recomendado'
    }
  }

  return ''
}

function extrairPercentualApi() {
  if (!statusApiDisponivel.value) {
    return null
  }

  const dados = obterStatusPrimeiroUsoNormalizado()
  const percentual = extrairPrimeiroNumero(
    obterCampoPrimeiroUso(dados, 'percentualConclusao', 'percentual_conclusao'),
    obterCampoPrimeiroUso(dados, 'percentualConcluido', 'percentual_concluido'),
    obterCampoPrimeiroUso(dados, 'percentual'),
    obterCampoPrimeiroUso(dados, 'progresso'),
  )

  if (!Number.isFinite(percentual)) {
    return null
  }

  return Math.max(0, Math.min(100, Math.round(percentual)))
}

function extrairPrimeiroNumero(...valores) {
  for (const valor of valores) {
    const numero = Number(valor)

    if (Number.isFinite(numero)) {
      return numero
    }
  }

  return null
}

function resolverStatusFallbackPasso(passo) {
  if (passo.id === 'empresa') {
    return empresaTemDadosPrincipais() ? 'concluido' : 'pendente'
  }

  if (passo.id === 'servicos') {
    return props.totalServicos > 0 ? 'concluido' : 'pendente'
  }

  if (passo.id === 'clientes') {
    return props.totalClientes > 0 ? 'concluido' : 'pendente'
  }

  if (passo.id === 'funcionarios') {
    return props.totalFuncionarios > 0 ? 'concluido' : 'opcional'
  }

  if (passo.id === 'agenda') {
    return props.totalAgendamentos > 0 ? 'concluido' : 'recomendado'
  }

  if (passo.id === 'link-publico') {
    return possuiLinkPublicoAtivo() ? 'concluido' : 'pendente'
  }

  if (passo.id === 'personalizacao') {
    if (empresaTemPersonalizacaoBasica()) {
      return 'concluido'
    }

    return possuiLinkPublicoAtivo() ? 'recomendado' : 'pendente'
  }

  if (passo.id === 'catalogo') {
    return props.linkPublicoCatalogo ? 'concluido' : 'recomendado'
  }

  if (passo.id === 'estoque-dia') {
    return props.linkPublicoCatalogo ? 'recomendado' : 'pendente'
  }

  if (passo.id === 'compartilhar-link') {
    if (props.totalRecebidosLinkPublicoHoje > 0) {
      return 'concluido'
    }

    return props.linkPublicoAgendamento ? 'recomendado' : 'pendente'
  }

  return passo.opcional ? 'opcional' : 'recomendado'
}

function empresaTemDadosPrincipais() {
  const empresa = props.empresa || {}

  return Boolean(
    textoPreenchido(empresa.nome) &&
      textoPreenchido(empresa.telefone) &&
      textoPreenchido(empresa.horaAbertura) &&
      textoPreenchido(empresa.horaFechamento),
  )
}

function empresaTemPersonalizacaoBasica() {
  const empresa = props.empresa || {}

  return Boolean(
    textoPreenchido(empresa.mensagemPublica) ||
      textoPreenchido(empresa.whatsapp) ||
      textoPreenchido(empresa.instagram) ||
      textoPreenchido(empresa.endereco),
  )
}

function possuiLinkPublicoAtivo() {
  const empresa = props.empresa || {}
  const permiteAgendamento = empresa.permitirAgendamentoPublico

  if (!props.linkPublicoAgendamento) {
    return false
  }

  return permiteAgendamento !== false
}

function textoPreenchido(valor) {
  return String(valor || '').trim().length > 0
}

function normalizarIdentificador(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, ' ')
    .trim()
    .toLowerCase()
}

onMounted(() => {
  if (typeof window === 'undefined' || typeof window.matchMedia !== 'function') {
    return
  }

  mediaQueryViewport = window.matchMedia('(max-width: 900px)')

  if (typeof mediaQueryViewport.addEventListener === 'function') {
    mediaQueryViewport.addEventListener('change', atualizarViewport)
  } else {
    mediaQueryViewport.addListener(atualizarViewport)
  }

  atualizarViewport()
})

onBeforeUnmount(() => {
  if (!mediaQueryViewport) {
    return
  }

  if (typeof mediaQueryViewport.removeEventListener === 'function') {
    mediaQueryViewport.removeEventListener('change', atualizarViewport)
  } else {
    mediaQueryViewport.removeListener(atualizarViewport)
  }
})
</script>

<template>
  <section class="card assistente-primeiro-uso" :class="{ recolhido }">
    <div class="topo-assistente">
      <div class="topo-textos">
        <p class="subtitulo">Primeiros passos</p>
        <h2>Configure seu sistema em poucos minutos</h2>
        <p class="descricao-assistente">Organize o básico para começar sem se perder.</p>
      </div>

      <div class="topo-acoes">
        <RouterLink class="acao-textual" :to="obterAjudaPasso('comecando')">
          Ver guia passo a passo
        </RouterLink>
        <button
          class="botao secundario compacto botao-recolher"
          type="button"
          :aria-expanded="!recolhido"
          @click="alternarRecolhido"
        >
          {{ recolhido ? 'Mostrar passos' : 'Recolher' }}
        </button>
      </div>
    </div>

    <section v-if="carregando" class="estado-assistente">
      <p>Preparando seus primeiros passos...</p>
    </section>

    <template v-else>
      <section class="resumo-assistente">
        <div class="resumo-linha">
          <strong>{{ progressoTexto }}</strong>
          <span>{{ percentualExibido }}%</span>
        </div>
        <div
          class="barra-progresso"
          role="progressbar"
          :aria-valuenow="percentualExibido"
          aria-valuemin="0"
          aria-valuemax="100"
          :aria-label="progressoTexto"
        >
          <span :style="{ width: `${percentualExibido}%` }"></span>
        </div>
        <p class="mensagem-assistente">{{ descricaoPainel }}</p>
      </section>

      <section v-if="recolhido" class="painel-recolhido">
        <div>
          <p class="resumo-recolhido">{{ resumoColapsado }}</p>
          <p>Quando quiser, abra novamente para continuar a configuração.</p>
        </div>
        <button class="botao secundario compacto botao-expandir" type="button" :aria-expanded="!recolhido" @click="alternarRecolhido">
          Expandir
        </button>
      </section>

      <template v-else>
        <section class="grade-passos">
          <article v-for="passo in passosVisiveis" :key="passo.id" class="passo-card" :class="`status-${passo.status}`">
            <div class="passo-topo">
              <span class="numero-passo">{{ passo.indice }}</span>
              <span class="selo-status" :class="`selo-${passo.status}`">{{ passo.rotuloStatus }}</span>
            </div>

            <div class="passo-conteudo">
              <h3>{{ passo.titulo }}</h3>
              <p>{{ passo.descricao }}</p>
              <p class="status-passo">{{ passo.status === 'concluido' ? 'Passo já resolvido.' : passo.status === 'pendente' ? 'Este passo ainda é necessário.' : passo.status === 'recomendado' ? 'Vale fazer para deixar tudo pronto.' : 'Opcional, se fizer sentido para sua operação.' }}</p>
              <p v-if="passo.id === 'compartilhar-link' && !podeCopiarLink" class="observacao-passo">
                Antes disso, configure o link público da empresa.
              </p>
            </div>

            <div class="passo-acoes">
              <button
                v-if="passo.acao === 'copiar-link'"
                class="botao principal compacto"
                type="button"
                :disabled="!podeCopiarLink"
                @click="emitirCopiaLink"
              >
                {{ passo.rotuloAcao }}
              </button>

              <RouterLink v-else-if="passoTemDestino(passo)" class="botao secundario compacto link-acao" :to="passo.to">
                {{ passo.rotuloAcao }}
              </RouterLink>

              <button v-else class="botao secundario compacto link-acao" type="button" disabled>
                {{ passo.rotuloAcao }}
              </button>

              <RouterLink v-if="passo.topicoAjuda" class="link-ajuda" :to="obterAjudaPasso(passo.topicoAjuda)">
                Ajuda
              </RouterLink>
            </div>
          </article>
        </section>

        <button v-if="exibirBotaoTodos" class="botao secundario compacto botao-lista" type="button" @click="alternarListaPassos">
          {{ mostrarTodosPassos ? 'Mostrar menos' : 'Ver todos os passos' }}
        </button>
      </template>
    </template>
  </section>
</template>

<style scoped>
.assistente-primeiro-uso {
  display: grid;
  gap: 18px;
  border-color: color-mix(in srgb, var(--app-primary) 18%, var(--app-border));
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary-soft) 78%, transparent) 0%, transparent 36%),
    linear-gradient(180deg, color-mix(in srgb, var(--app-primary-soft) 38%, var(--app-surface)) 0%, var(--app-surface) 100%);
}

.assistente-primeiro-uso.recolhido {
  gap: 14px;
}

.topo-assistente,
.topo-acoes,
.resumo-linha,
.passo-topo,
.passo-acoes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
}

.topo-assistente {
  align-items: flex-start;
}

.topo-textos h2,
.passo-conteudo h3 {
  margin: 0;
  color: var(--app-text);
}

.topo-textos h2 {
  font-size: clamp(22px, 2.6vw, 28px);
  line-height: 1.1;
}

.subtitulo {
  margin: 0 0 4px;
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.descricao-assistente,
.mensagem-assistente,
.estado-assistente p,
.painel-recolhido p,
.passo-conteudo p,
.observacao-passo {
  margin: 0;
  color: var(--app-text-muted);
}

.topo-acoes {
  flex-wrap: wrap;
  justify-content: flex-end;
}

.acao-textual,
.link-ajuda {
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.acao-textual:hover,
.link-ajuda:hover {
  text-decoration: underline;
}

.resumo-assistente {
  display: grid;
  gap: 10px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--app-primary) 24%, var(--app-border));
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-surface) 82%, var(--app-primary-soft));
}

.resumo-linha strong {
  color: var(--app-text);
  font-size: 16px;
  font-weight: 800;
}

.resumo-linha span {
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 900;
}

.barra-progresso {
  width: 100%;
  height: 10px;
  overflow: hidden;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-border) 70%, var(--app-surface));
}

.barra-progresso span {
  display: block;
  height: 100%;
  border-radius: inherit;
  background: linear-gradient(90deg, var(--app-primary) 0%, color-mix(in srgb, var(--app-primary) 65%, white) 100%);
  transition: width 0.2s ease;
}

.estado-assistente,
.painel-recolhido {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  padding: 18px;
  border: 1px dashed color-mix(in srgb, var(--app-primary) 30%, var(--app-border));
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-surface) 88%, var(--app-primary-soft));
}

.resumo-recolhido {
  margin: 0 0 4px;
  color: var(--app-text);
  font-size: 15px;
  font-weight: 800;
}

.grade-passos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

.passo-card {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: color-mix(in srgb, var(--app-surface) 92%, white);
}

.passo-card.status-concluido {
  border-color: color-mix(in srgb, var(--app-success) 55%, var(--app-border));
  background: color-mix(in srgb, var(--app-success-soft) 18%, var(--app-surface));
}

.passo-card.status-pendente {
  border-color: color-mix(in srgb, var(--app-warning) 34%, var(--app-border));
  background: color-mix(in srgb, var(--app-warning-soft) 16%, var(--app-surface));
}

.passo-card.status-recomendado,
.passo-card.status-opcional {
  border-color: color-mix(in srgb, var(--app-primary) 22%, var(--app-border));
  background: color-mix(in srgb, var(--app-primary-soft) 16%, var(--app-surface));
}

.numero-passo {
  width: 32px;
  height: 32px;
  display: inline-grid;
  place-items: center;
  border-radius: 999px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 900;
}

.selo-status {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.selo-concluido {
  background: var(--app-success-soft);
  color: var(--app-success);
}

.selo-pendente {
  background: var(--app-warning-soft);
  color: var(--app-warning);
}

.selo-recomendado {
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.selo-opcional {
  background: color-mix(in srgb, var(--app-surface-soft) 82%, var(--app-border));
  color: var(--app-text-muted);
}

.passo-conteudo {
  display: grid;
  gap: 8px;
}

.passo-conteudo h3 {
  font-size: 17px;
  line-height: 1.2;
}

.passo-conteudo p {
  font-size: 14px;
  line-height: 1.5;
}

.status-passo {
  color: var(--app-text);
  font-size: 13px;
  font-weight: 700;
}

.observacao-passo {
  color: var(--app-warning);
  font-weight: 700;
}

.passo-acoes {
  flex-wrap: wrap;
  justify-content: flex-start;
  margin-top: auto;
}

.link-acao {
  text-decoration: none;
}

.link-acao:disabled {
  cursor: not-allowed;
}

.botao-recolher,
.botao-lista,
.botao-expandir {
  white-space: nowrap;
}

@media (max-width: 900px) {
  .topo-assistente,
  .topo-acoes,
  .resumo-linha {
    flex-direction: column;
    align-items: flex-start;
  }

  .topo-acoes {
    justify-content: flex-start;
  }

  .grade-passos {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 520px) {
  .assistente-primeiro-uso,
  .resumo-assistente,
  .passo-card,
  .estado-assistente,
  .painel-recolhido {
    padding-left: 14px;
    padding-right: 14px;
  }

  .passo-topo,
  .passo-acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .botao-recolher,
  .botao-lista,
  .botao-expandir,
  .passo-acoes .botao,
  .passo-acoes .link-acao {
    width: 100%;
    justify-content: center;
  }

  .painel-recolhido {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
