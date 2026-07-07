import { ref } from 'vue'

const CHAVE_PREFERENCIAS_OPERACIONAIS = 'preferenciasOperacionais'
const CHAVE_PREFERENCIAS_OPERACIONAIS_STATUS = 'preferenciasOperacionaisStatus'

export const PAGINA_INICIAL_DASHBOARD = 'DASHBOARD'
export const PAGINA_INICIAL_AGENDAMENTOS = 'AGENDAMENTOS'
export const PAGINA_INICIAL_CLIENTES = 'CLIENTES'
export const PAGINA_INICIAL_ESTOQUE = 'ESTOQUE'
export const PAGINA_INICIAL_ESPORTIVO = 'ESPORTIVO'
export const PAGINA_INICIAL_MINHA_CONTA = 'MINHA_CONTA'

export const MODULO_PREFERIDO_AUTO = 'AUTO'
export const MODULO_PREFERIDO_AGENDAMENTO = 'AGENDAMENTO'
export const MODULO_PREFERIDO_ESTOQUE = 'ESTOQUE'
export const MODULO_PREFERIDO_ESPORTIVO = 'ESPORTIVO'
export const MODULO_PREFERIDO_ADMIN = 'ADMIN'

export const STATUS_SINCRONIZACAO_OPERACIONAL_IDLE = 'idle'
export const STATUS_SINCRONIZACAO_OPERACIONAL_CARREGANDO = 'carregando'
export const STATUS_SINCRONIZACAO_OPERACIONAL_SALVANDO = 'salvando'
export const STATUS_SINCRONIZACAO_OPERACIONAL_SALVO = 'salvo'
export const STATUS_SINCRONIZACAO_OPERACIONAL_ERRO = 'erro'
export const STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL = 'local'

export const ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND = 'backend'
export const ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL = 'localStorage'
export const ORIGEM_OPCOES_OPERACIONAIS_BACKEND = 'backend'
export const ORIGEM_OPCOES_OPERACIONAIS_LOCAL = 'local'

export const PAGINAS_INICIAIS_VALIDAS = Object.freeze([
  PAGINA_INICIAL_DASHBOARD,
  PAGINA_INICIAL_AGENDAMENTOS,
  PAGINA_INICIAL_CLIENTES,
  PAGINA_INICIAL_ESTOQUE,
  PAGINA_INICIAL_ESPORTIVO,
  PAGINA_INICIAL_MINHA_CONTA,
])
export const MODULOS_PREFERIDOS_VALIDOS = Object.freeze([
  MODULO_PREFERIDO_AUTO,
  MODULO_PREFERIDO_AGENDAMENTO,
  MODULO_PREFERIDO_ESTOQUE,
  MODULO_PREFERIDO_ESPORTIVO,
  MODULO_PREFERIDO_ADMIN,
])
export const ITENS_POR_PAGINA_VALIDOS = Object.freeze([10, 20, 50, 100])
export const STATUS_SINCRONIZACAO_OPERACIONAIS_VALIDOS = Object.freeze([
  STATUS_SINCRONIZACAO_OPERACIONAL_IDLE,
  STATUS_SINCRONIZACAO_OPERACIONAL_CARREGANDO,
  STATUS_SINCRONIZACAO_OPERACIONAL_SALVANDO,
  STATUS_SINCRONIZACAO_OPERACIONAL_SALVO,
  STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
  STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL,
])

const PREFERENCIAS_OPERACIONAIS_PADRAO = Object.freeze({
  paginaInicial: PAGINA_INICIAL_DASHBOARD,
  moduloPreferido: MODULO_PREFERIDO_AUTO,
  itensPorPagina: 20,
  mostrarResumoInicial: true,
  mostrarDicas: true,
  confirmarAcoesCriticas: true,
  notificacoesInternasAtivas: true,
  alertasAgendamento: true,
  alertasFinanceiro: true,
  alertasSistema: true,
  atualizadoEm: '',
})

export const preferenciasOperacionais = ref(criarPreferenciasOperacionaisPadrao())
export const estadoSincronizacaoOperacionais = ref(STATUS_SINCRONIZACAO_OPERACIONAL_IDLE)
export const mensagemSincronizacaoOperacionais = ref('')
export const origemPreferenciasOperacionais = ref(ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL)
export const opcoesPreferenciasOperacionais = ref(criarOpcoesPreferenciasOperacionaisFallback())
export const origemOpcoesPreferenciasOperacionais = ref(ORIGEM_OPCOES_OPERACIONAIS_LOCAL)

function criarPreferenciasOperacionaisPadrao() {
  return { ...PREFERENCIAS_OPERACIONAIS_PADRAO }
}

function criarOpcoesPreferenciasOperacionaisFallback() {
  return {
    paginasIniciais: [
      { valor: PAGINA_INICIAL_DASHBOARD, nome: 'Dashboard' },
      { valor: PAGINA_INICIAL_AGENDAMENTOS, nome: 'Agendamentos' },
      { valor: PAGINA_INICIAL_CLIENTES, nome: 'Clientes' },
      { valor: PAGINA_INICIAL_ESTOQUE, nome: 'Estoque' },
      { valor: PAGINA_INICIAL_ESPORTIVO, nome: 'Gestão Esportiva' },
      { valor: PAGINA_INICIAL_MINHA_CONTA, nome: 'Minha conta' },
    ],
    modulosPreferidos: [
      { valor: MODULO_PREFERIDO_AUTO, nome: 'Automático' },
      { valor: MODULO_PREFERIDO_AGENDAMENTO, nome: 'Agendamento' },
      { valor: MODULO_PREFERIDO_ESTOQUE, nome: 'Estoque' },
      { valor: MODULO_PREFERIDO_ESPORTIVO, nome: 'Gestão Esportiva' },
      { valor: MODULO_PREFERIDO_ADMIN, nome: 'Administração' },
    ],
    itensPorPagina: ITENS_POR_PAGINA_VALIDOS.map((valor) => ({ valor, nome: String(valor) })),
  }
}

function definirEstadoSincronizacao(estado, mensagem = '') {
  estadoSincronizacaoOperacionais.value = normalizarStatusSincronizacao(estado)
  mensagemSincronizacaoOperacionais.value = mensagem
  salvarStatusPreferenciasOperacionaisLocais(estadoSincronizacaoOperacionais.value)
}

function normalizarBooleano(valor, fallback = true) {
  if (valor === true || valor === false) {
    return valor
  }

  if (typeof valor === 'string') {
    const texto = valor.trim().toLowerCase()

    if (['true', '1', 'sim', 's', 'yes'].includes(texto)) {
      return true
    }

    if (['false', '0', 'nao', 'não', 'n', 'no'].includes(texto)) {
      return false
    }
  }

  if (typeof valor === 'number') {
    if (valor === 1) {
      return true
    }

    if (valor === 0) {
      return false
    }
  }

  return fallback
}

function normalizarCodigo(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()
}

export function normalizarPaginaInicial(valor) {
  const codigo = normalizarCodigo(valor)
  return PAGINAS_INICIAIS_VALIDAS.includes(codigo) ? codigo : PREFERENCIAS_OPERACIONAIS_PADRAO.paginaInicial
}

export function normalizarModuloPreferido(valor) {
  const codigo = normalizarCodigo(valor)
  return MODULOS_PREFERIDOS_VALIDOS.includes(codigo) ? codigo : PREFERENCIAS_OPERACIONAIS_PADRAO.moduloPreferido
}

export function normalizarItensPorPagina(valor) {
  const numero = Number.parseInt(String(valor ?? '').trim(), 10)
  return ITENS_POR_PAGINA_VALIDOS.includes(numero) ? numero : PREFERENCIAS_OPERACIONAIS_PADRAO.itensPorPagina
}

function normalizarDataAtualizacao(valor) {
  const texto = String(valor || '').trim()
  return texto || ''
}

function normalizarStatusSincronizacao(valor) {
  const texto = String(valor || '').trim().toLowerCase()
  return STATUS_SINCRONIZACAO_OPERACIONAIS_VALIDOS.includes(texto)
    ? texto
    : STATUS_SINCRONIZACAO_OPERACIONAL_IDLE
}

function extrairPreferenciasOperacionaisResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return {}
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data
  }

  if (resposta.preferencias && typeof resposta.preferencias === 'object') {
    return resposta.preferencias
  }

  return resposta
}

function extrairOpcoesPreferenciasOperacionaisResposta(resposta) {
  if (!resposta || typeof resposta !== 'object') {
    return {}
  }

  if (resposta.data && typeof resposta.data === 'object') {
    return resposta.data
  }

  if (resposta.opcoes && typeof resposta.opcoes === 'object') {
    return resposta.opcoes
  }

  return resposta
}

function normalizarOpcaoValorNome(opcao, normalizarValor) {
  if (typeof opcao === 'string' || typeof opcao === 'number') {
    const valor = normalizarValor(opcao)

    return valor ? { valor, nome: String(opcao).trim() || String(valor) } : null
  }

  if (!opcao || typeof opcao !== 'object') {
    return null
  }

  const valor = normalizarValor(opcao.valor ?? opcao.codigo ?? opcao.id)
  const nome = String(opcao.nome || opcao.label || opcao.descricao || valor || '').trim()

  if (!valor || !nome) {
    return null
  }

  return { valor, nome }
}

function normalizarOpcoesValorNome(opcoes, valoresEsperados, normalizarValor) {
  if (!Array.isArray(opcoes)) {
    return []
  }

  const porValor = new Map()

  for (const opcao of opcoes) {
    const normalizada = normalizarOpcaoValorNome(opcao, normalizarValor)

    if (normalizada && valoresEsperados.includes(normalizada.valor)) {
      porValor.set(normalizada.valor, normalizada)
    }
  }

  return valoresEsperados.map((valor) => porValor.get(valor)).filter(Boolean)
}

export function obterPreferenciasOperacionaisPadrao() {
  return criarPreferenciasOperacionaisPadrao()
}

export function obterOpcoesPreferenciasOperacionaisFallback() {
  return criarOpcoesPreferenciasOperacionaisFallback()
}

export function normalizarPreferenciasOperacionais(preferencias = {}) {
  const origem = extrairPreferenciasOperacionaisResposta(preferencias)
  const padrao = criarPreferenciasOperacionaisPadrao()

  return {
    paginaInicial: normalizarPaginaInicial(origem.paginaInicial),
    moduloPreferido: normalizarModuloPreferido(origem.moduloPreferido),
    itensPorPagina: normalizarItensPorPagina(origem.itensPorPagina),
    mostrarResumoInicial: normalizarBooleano(origem.mostrarResumoInicial, padrao.mostrarResumoInicial),
    mostrarDicas: normalizarBooleano(origem.mostrarDicas, padrao.mostrarDicas),
    confirmarAcoesCriticas: normalizarBooleano(origem.confirmarAcoesCriticas, padrao.confirmarAcoesCriticas),
    notificacoesInternasAtivas: normalizarBooleano(
      origem.notificacoesInternasAtivas,
      padrao.notificacoesInternasAtivas,
    ),
    alertasAgendamento: normalizarBooleano(origem.alertasAgendamento, padrao.alertasAgendamento),
    alertasFinanceiro: normalizarBooleano(origem.alertasFinanceiro, padrao.alertasFinanceiro),
    alertasSistema: normalizarBooleano(origem.alertasSistema, padrao.alertasSistema),
    atualizadoEm: normalizarDataAtualizacao(origem.atualizadoEm),
  }
}

export function criarPayloadPreferenciasOperacionais(preferencias = {}) {
  const normalizadas = normalizarPreferenciasOperacionais(preferencias)

  return {
    paginaInicial: normalizadas.paginaInicial,
    moduloPreferido: normalizadas.moduloPreferido,
    itensPorPagina: normalizadas.itensPorPagina,
    mostrarResumoInicial: normalizadas.mostrarResumoInicial,
    mostrarDicas: normalizadas.mostrarDicas,
    confirmarAcoesCriticas: normalizadas.confirmarAcoesCriticas,
    notificacoesInternasAtivas: normalizadas.notificacoesInternasAtivas,
    alertasAgendamento: normalizadas.alertasAgendamento,
    alertasFinanceiro: normalizadas.alertasFinanceiro,
    alertasSistema: normalizadas.alertasSistema,
  }
}

export function normalizarOpcoesPreferenciasOperacionaisBackend(resposta = {}) {
  const origem = extrairOpcoesPreferenciasOperacionaisResposta(resposta)
  const fallback = criarOpcoesPreferenciasOperacionaisFallback()
  const paginasIniciais = normalizarOpcoesValorNome(
    origem.paginasIniciais ?? origem.paginaInicial,
    PAGINAS_INICIAIS_VALIDAS,
    normalizarPaginaInicial,
  )
  const modulosPreferidos = normalizarOpcoesValorNome(
    origem.modulosPreferidos ?? origem.moduloPreferido,
    MODULOS_PREFERIDOS_VALIDOS,
    normalizarModuloPreferido,
  )
  const itensPorPagina = normalizarOpcoesValorNome(
    origem.itensPorPagina,
    ITENS_POR_PAGINA_VALIDOS,
    normalizarItensPorPagina,
  )
  const valido =
    paginasIniciais.length === fallback.paginasIniciais.length &&
    modulosPreferidos.length === fallback.modulosPreferidos.length &&
    itensPorPagina.length === fallback.itensPorPagina.length

  if (!valido) {
    return { valido: false, opcoes: fallback }
  }

  return {
    valido: true,
    opcoes: {
      paginasIniciais,
      modulosPreferidos,
      itensPorPagina,
    },
  }
}

function obterLocalStorageSeguro() {
  if (typeof window === 'undefined' || !window.localStorage) {
    return null
  }

  return window.localStorage
}

function lerJsonLocal(chave) {
  const storage = obterLocalStorageSeguro()

  if (!storage) {
    return null
  }

  try {
    const texto = storage.getItem(chave)
    return texto ? JSON.parse(texto) : null
  } catch (error) {
    console.error(error)
    return null
  }
}

function salvarStatusPreferenciasOperacionaisLocais(status) {
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_PREFERENCIAS_OPERACIONAIS_STATUS, normalizarStatusSincronizacao(status))
  }
}

export function lerStatusPreferenciasOperacionaisLocais() {
  const storage = obterLocalStorageSeguro()
  return normalizarStatusSincronizacao(storage?.getItem(CHAVE_PREFERENCIAS_OPERACIONAIS_STATUS))
}

export function lerPreferenciasOperacionaisLocais() {
  const preferenciasSalvas = lerJsonLocal(CHAVE_PREFERENCIAS_OPERACIONAIS)
  return normalizarPreferenciasOperacionais(
    preferenciasSalvas && typeof preferenciasSalvas === 'object' ? preferenciasSalvas : {},
  )
}

export function salvarPreferenciasOperacionaisLocais(
  preferencias = {},
  { origem = ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL, status = STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL } = {},
) {
  const normalizadas = normalizarPreferenciasOperacionais(preferencias)
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_PREFERENCIAS_OPERACIONAIS, JSON.stringify(normalizadas))
    storage.setItem(CHAVE_PREFERENCIAS_OPERACIONAIS_STATUS, normalizarStatusSincronizacao(status))
  }

  preferenciasOperacionais.value = normalizadas
  origemPreferenciasOperacionais.value = origem

  return normalizadas
}

export function resetarPreferenciasOperacionaisLocais() {
  return salvarPreferenciasOperacionaisLocais(criarPreferenciasOperacionaisPadrao(), {
    origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
    status: STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL,
  })
}

export function obterResumoSincronizacaoOperacionais({
  estado = estadoSincronizacaoOperacionais.value,
  origem = origemPreferenciasOperacionais.value,
  mensagem = mensagemSincronizacaoOperacionais.value,
} = {}) {
  if (estado === STATUS_SINCRONIZACAO_OPERACIONAL_ERRO) {
    return {
      rotulo: 'Erro ao sincronizar',
      detalhe: mensagem || 'A preferência ficou salva neste navegador.',
      tipo: 'erro',
    }
  }

  if (
    estado === STATUS_SINCRONIZACAO_OPERACIONAL_CARREGANDO ||
    estado === STATUS_SINCRONIZACAO_OPERACIONAL_SALVANDO
  ) {
    return {
      rotulo: 'Sincronizando',
      detalhe: mensagem || 'Atualizando preferências de uso.',
      tipo: 'carregando',
    }
  }

  if (origem === ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND) {
    return {
      rotulo: 'Sincronizado',
      detalhe: mensagem || 'Preferências vinculadas ao seu usuário.',
      tipo: 'sucesso',
    }
  }

  return {
    rotulo: 'Salvo localmente',
    detalhe: mensagem || 'Preferências salvas apenas neste navegador.',
    tipo: 'local',
  }
}

export async function carregarOpcoesPreferenciasOperacionaisBackend(buscarOpcoesPreferenciasOperacionais) {
  if (typeof buscarOpcoesPreferenciasOperacionais !== 'function') {
    opcoesPreferenciasOperacionais.value = criarOpcoesPreferenciasOperacionaisFallback()
    origemOpcoesPreferenciasOperacionais.value = ORIGEM_OPCOES_OPERACIONAIS_LOCAL
    return opcoesPreferenciasOperacionais.value
  }

  try {
    const resposta = await buscarOpcoesPreferenciasOperacionais()
    const { valido, opcoes } = normalizarOpcoesPreferenciasOperacionaisBackend(resposta)

    opcoesPreferenciasOperacionais.value = opcoes
    origemOpcoesPreferenciasOperacionais.value = valido
      ? ORIGEM_OPCOES_OPERACIONAIS_BACKEND
      : ORIGEM_OPCOES_OPERACIONAIS_LOCAL
    return opcoesPreferenciasOperacionais.value
  } catch (error) {
    console.error(error)
    opcoesPreferenciasOperacionais.value = criarOpcoesPreferenciasOperacionaisFallback()
    origemOpcoesPreferenciasOperacionais.value = ORIGEM_OPCOES_OPERACIONAIS_LOCAL
    return opcoesPreferenciasOperacionais.value
  }
}

export async function carregarPreferenciasOperacionaisBackend(
  buscarPreferenciasOperacionais,
  buscarOpcoesPreferenciasOperacionais,
) {
  await carregarOpcoesPreferenciasOperacionaisBackend(buscarOpcoesPreferenciasOperacionais)

  if (typeof buscarPreferenciasOperacionais !== 'function') {
    const preferencias = salvarPreferenciasOperacionaisLocais(lerPreferenciasOperacionaisLocais(), {
      origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
      status: STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL)
    return preferencias
  }

  definirEstadoSincronizacao(
    STATUS_SINCRONIZACAO_OPERACIONAL_CARREGANDO,
    'Carregando preferências de uso...',
  )

  try {
    const resposta = await buscarPreferenciasOperacionais()
    const preferencias = salvarPreferenciasOperacionaisLocais(normalizarPreferenciasOperacionais(resposta), {
      origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND,
      status: STATUS_SINCRONIZACAO_OPERACIONAL_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_SALVO, 'Preferências de uso sincronizadas.')
    return preferencias
  } catch (error) {
    console.error(error)
    const preferencias = salvarPreferenciasOperacionaisLocais(lerPreferenciasOperacionaisLocais(), {
      origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
      status: STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
    })
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
      'Não foi possível sincronizar as preferências de uso. Usando o que está salvo neste navegador.',
    )
    return preferencias
  }
}

export async function salvarPreferenciasOperacionaisBackend(preferencias, salvarPreferenciasOperacionais) {
  const locais = salvarPreferenciasOperacionaisLocais(preferencias, {
    origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
    status: STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL,
  })

  if (typeof salvarPreferenciasOperacionais !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_SALVANDO, 'Salvando preferências de uso...')

  try {
    const resposta = await salvarPreferenciasOperacionais(criarPayloadPreferenciasOperacionais(locais))
    const origem = resposta && typeof resposta === 'object' ? resposta : locais
    const sincronizadas = salvarPreferenciasOperacionaisLocais({
      ...locais,
      ...extrairPreferenciasOperacionaisResposta(origem),
    }, {
      origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND,
      status: STATUS_SINCRONIZACAO_OPERACIONAL_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_SALVO, 'Preferências de uso salvas.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
      'Não foi possível sincronizar. As preferências ficaram salvas neste navegador.',
    )
    return locais
  }
}

export async function resetarPreferenciasOperacionaisBackend(resetarPreferenciasOperacionais) {
  const padrao = resetarPreferenciasOperacionaisLocais()

  if (typeof resetarPreferenciasOperacionais !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_LOCAL)
    return padrao
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_SALVANDO, 'Restaurando preferências de uso...')

  try {
    const resposta = await resetarPreferenciasOperacionais()
    const origem = resposta && typeof resposta === 'object' ? resposta : padrao
    const sincronizadas = salvarPreferenciasOperacionaisLocais({
      ...padrao,
      ...extrairPreferenciasOperacionaisResposta(origem),
    }, {
      origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND,
      status: STATUS_SINCRONIZACAO_OPERACIONAL_SALVO,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_OPERACIONAL_SALVO, 'Preferências de uso restauradas.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
      'Não foi possível sincronizar a restauração. O padrão ficou salvo neste navegador.',
    )
    return padrao
  }
}
