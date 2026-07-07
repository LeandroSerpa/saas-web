import { ref } from 'vue'
import {
  TEMA_APARENCIA_CLARO,
  criarVariaveisCssTemaInterno,
  mesclarOpcoesTemasInternos,
  normalizarTemaInterno,
  obterOpcoesTemasInternos,
  obterColorSchemeTemaInterno,
  obterTemaInternoPadrao,
  obterValorTemaInternoConhecido,
} from './temasInternos.js'

const CHAVE_TEMA_APARENCIA = 'temaAparencia'
const CHAVE_PREFERENCIAS_APARENCIA = 'preferenciasAparencia'
const ID_ESTILO_REDUZIR_ANIMACOES = 'preferencias-aparencia-reduzir-animacoes'

export const MODO_NAVEGACAO_APARENCIA_AUTO = 'AUTO'
export const MODO_NAVEGACAO_APARENCIA_EXPANDIDO = 'EXPANDIDO'
export const MODO_NAVEGACAO_APARENCIA_COMPACTO = 'COMPACTO'
export const DENSIDADE_INTERFACE_CONFORTAVEL = 'CONFORTAVEL'
export const DENSIDADE_INTERFACE_COMPACTA = 'COMPACTA'
export const STATUS_SINCRONIZACAO_APARENCIA_OCIOSO = 'ocioso'
export const STATUS_SINCRONIZACAO_APARENCIA_CARREGANDO = 'carregando'
export const STATUS_SINCRONIZACAO_APARENCIA_SALVANDO = 'salvando'
export const STATUS_SINCRONIZACAO_APARENCIA_SALVO = 'salvo'
export const STATUS_SINCRONIZACAO_APARENCIA_ERRO = 'erro'
export const ORIGEM_PREFERENCIAS_APARENCIA_BACKEND = 'backend'
export const ORIGEM_PREFERENCIAS_APARENCIA_LOCAL = 'localStorage'
export const ORIGEM_OPCOES_APARENCIA_BACKEND = 'backend'
export const ORIGEM_OPCOES_APARENCIA_LOCAL = 'local'

const PREFERENCIAS_APARENCIA_PADRAO = Object.freeze({
  temaInterno: TEMA_APARENCIA_CLARO,
  modoNavegacao: MODO_NAVEGACAO_APARENCIA_AUTO,
  densidadeInterface: DENSIDADE_INTERFACE_CONFORTAVEL,
  reduzirAnimacoes: false,
  altoContraste: false,
  atualizadoEm: '',
})

export const temaAparencia = ref(TEMA_APARENCIA_CLARO)
export const preferenciasAparencia = ref(criarPreferenciasAparenciaPadrao())
export const estadoSincronizacaoAparencia = ref(STATUS_SINCRONIZACAO_APARENCIA_OCIOSO)
export const mensagemSincronizacaoAparencia = ref('')
export const origemPreferenciasAparencia = ref(ORIGEM_PREFERENCIAS_APARENCIA_LOCAL)
export const opcoesAparencia = ref(criarOpcoesAparenciaFallback())
export const origemOpcoesAparencia = ref(ORIGEM_OPCOES_APARENCIA_LOCAL)

function criarPreferenciasAparenciaPadrao() {
  return { ...PREFERENCIAS_APARENCIA_PADRAO }
}

function criarOpcoesAparenciaFallback() {
  return {
    temas: obterOpcoesTemasInternos(),
    modosNavegacao: [
      { valor: MODO_NAVEGACAO_APARENCIA_AUTO, nome: 'Automático' },
      { valor: MODO_NAVEGACAO_APARENCIA_EXPANDIDO, nome: 'Expandido' },
      { valor: MODO_NAVEGACAO_APARENCIA_COMPACTO, nome: 'Compacto' },
    ],
    densidadesInterface: [
      { valor: DENSIDADE_INTERFACE_CONFORTAVEL, nome: 'Confortável' },
      { valor: DENSIDADE_INTERFACE_COMPACTA, nome: 'Compacta' },
    ],
    flags: {
      reduzirAnimacoes: true,
      altoContraste: true,
    },
    temaPadrao: obterTemaInternoPadrao(),
  }
}

function definirEstadoSincronizacao(estado, mensagem = '') {
  estadoSincronizacaoAparencia.value = estado
  mensagemSincronizacaoAparencia.value = mensagem
}

function normalizarBooleano(valor) {
  return valor === true
}

function normalizarModoNavegacaoAparencia(valor) {
  const texto = String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()

  if (['AUTO', 'AUTOMATICO', 'AUTOMATIC'].includes(texto)) {
    return MODO_NAVEGACAO_APARENCIA_AUTO
  }

  if (['EXPANDIDO', 'EXPANDIDA', 'COMPLETO', 'COMPLETA', 'FULL'].includes(texto)) {
    return MODO_NAVEGACAO_APARENCIA_EXPANDIDO
  }

  if (['COMPACTO', 'COMPACTA', 'ESSENCIAL', 'ESSENTIAL'].includes(texto)) {
    return MODO_NAVEGACAO_APARENCIA_COMPACTO
  }

  return MODO_NAVEGACAO_APARENCIA_AUTO
}

function normalizarDensidadeInterface(valor) {
  const texto = String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[\s-]+/g, '_')
    .toUpperCase()

  if (['COMPACTA', 'COMPACTO', 'COMPACT'].includes(texto)) {
    return DENSIDADE_INTERFACE_COMPACTA
  }

  return DENSIDADE_INTERFACE_CONFORTAVEL
}

function normalizarDataAtualizacao(valor) {
  const texto = String(valor || '').trim()
  return texto || ''
}

function normalizarOpcaoValorNome(opcao, normalizarValor) {
  if (!opcao || typeof opcao !== 'object') {
    return null
  }

  const valor = normalizarValor(opcao.valor)
  const nome = String(opcao.nome || '').trim()

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

function extrairPreferenciasAparenciaResposta(resposta) {
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

function extrairOpcoesAparenciaResposta(resposta) {
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

export function normalizarTemaAparencia(valor) {
  return normalizarTemaInterno(valor)
}

export function obterTemaAparenciaPadrao() {
  return obterTemaInternoPadrao()
}

export function obterPreferenciasAparenciaPadrao() {
  return criarPreferenciasAparenciaPadrao()
}

export function obterOpcoesAparenciaFallback() {
  return criarOpcoesAparenciaFallback()
}

export function normalizarOpcoesAparenciaBackend(resposta = {}) {
  const origem = extrairOpcoesAparenciaResposta(resposta)
  const fallback = criarOpcoesAparenciaFallback()
  const valoresTemasLocais = fallback.temas.map((tema) => tema.valor)
  const valoresTemasRecebidos = new Set()

  if (!Array.isArray(origem.temas)) {
    return { valido: false, opcoes: fallback }
  }

  for (const tema of origem.temas) {
    const valor = obterValorTemaInternoConhecido(tema?.valor)

    if (valor) {
      valoresTemasRecebidos.add(valor)
    }
  }

  const possuiTodosTemasLocais = valoresTemasLocais.every((valor) => valoresTemasRecebidos.has(valor))
  const modosNavegacao = normalizarOpcoesValorNome(
    origem.modosNavegacao,
    [
      MODO_NAVEGACAO_APARENCIA_AUTO,
      MODO_NAVEGACAO_APARENCIA_EXPANDIDO,
      MODO_NAVEGACAO_APARENCIA_COMPACTO,
    ],
    normalizarModoNavegacaoAparencia,
  )
  const densidadesInterface = normalizarOpcoesValorNome(
    origem.densidadesInterface,
    [DENSIDADE_INTERFACE_CONFORTAVEL, DENSIDADE_INTERFACE_COMPACTA],
    normalizarDensidadeInterface,
  )
  const valido =
    possuiTodosTemasLocais &&
    modosNavegacao.length === fallback.modosNavegacao.length &&
    densidadesInterface.length === fallback.densidadesInterface.length

  if (!valido) {
    return { valido: false, opcoes: fallback }
  }

  const flagsOrigem = origem.flags && typeof origem.flags === 'object' ? origem.flags : {}
  const temaPadrao = obterValorTemaInternoConhecido(origem.temaPadrao) || fallback.temaPadrao

  return {
    valido: true,
    opcoes: {
      temas: mesclarOpcoesTemasInternos(origem.temas),
      modosNavegacao,
      densidadesInterface,
      flags: {
        reduzirAnimacoes: flagsOrigem.reduzirAnimacoes === true,
        altoContraste: flagsOrigem.altoContraste === true,
      },
      temaPadrao,
    },
  }
}

export function obterResumoSincronizacaoAparencia({
  estado = estadoSincronizacaoAparencia.value,
  origem = origemPreferenciasAparencia.value,
  mensagem = mensagemSincronizacaoAparencia.value,
} = {}) {
  if (estado === STATUS_SINCRONIZACAO_APARENCIA_ERRO) {
    return {
      rotulo: 'Erro ao sincronizar',
      detalhe: mensagem || 'A preferência ficou salva neste navegador.',
      tipo: 'erro',
    }
  }

  if (estado === STATUS_SINCRONIZACAO_APARENCIA_CARREGANDO || estado === STATUS_SINCRONIZACAO_APARENCIA_SALVANDO) {
    return {
      rotulo: 'Sincronizando',
      detalhe: mensagem || 'Atualizando preferência de aparência.',
      tipo: 'carregando',
    }
  }

  if (origem === ORIGEM_PREFERENCIAS_APARENCIA_BACKEND) {
    return {
      rotulo: 'Sincronizado',
      detalhe: mensagem || 'Preferência vinculada ao seu usuário.',
      tipo: 'sucesso',
    }
  }

  return {
    rotulo: 'Salvo localmente',
    detalhe: mensagem || 'Preferência salva apenas neste navegador.',
    tipo: 'local',
  }
}

export function normalizarPreferenciasAparencia(preferencias = {}) {
  const origem = extrairPreferenciasAparenciaResposta(preferencias)
  const padrao = criarPreferenciasAparenciaPadrao()
  const tema = normalizarTemaAparencia(origem.temaInterno ?? origem.tema ?? origem.temaAparencia)

  return {
    temaInterno: tema || padrao.temaInterno,
    modoNavegacao: normalizarModoNavegacaoAparencia(origem.modoNavegacao ?? origem.modo),
    densidadeInterface: normalizarDensidadeInterface(origem.densidadeInterface ?? origem.densidade),
    reduzirAnimacoes: normalizarBooleano(origem.reduzirAnimacoes),
    altoContraste: normalizarBooleano(origem.altoContraste),
    atualizadoEm: normalizarDataAtualizacao(origem.atualizadoEm),
  }
}

export function criarPayloadPreferenciasAparencia(preferencias = {}) {
  const normalizadas = normalizarPreferenciasAparencia(preferencias)

  return {
    temaInterno: normalizadas.temaInterno,
    modoNavegacao: normalizadas.modoNavegacao,
    densidadeInterface: normalizadas.densidadeInterface,
    reduzirAnimacoes: normalizadas.reduzirAnimacoes,
    altoContraste: normalizadas.altoContraste,
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

export function lerPreferenciasAparenciaLocais() {
  const storage = obterLocalStorageSeguro()
  const preferenciasSalvas = lerJsonLocal(CHAVE_PREFERENCIAS_APARENCIA)
  const temaLegado = storage ? storage.getItem(CHAVE_TEMA_APARENCIA) : ''
  const preferencias = normalizarPreferenciasAparencia({
    ...(preferenciasSalvas && typeof preferenciasSalvas === 'object' ? preferenciasSalvas : {}),
    temaInterno: preferenciasSalvas?.temaInterno ?? preferenciasSalvas?.tema ?? temaLegado,
  })

  return preferencias
}

export function aplicarTemaAparenciaNoDocumento(tema) {
  return aplicarPreferenciasAparenciaNoDocumento({
    ...preferenciasAparencia.value,
    temaInterno: tema,
  }).temaInterno
}

function sincronizarEstiloReducaoAnimacoes(ativo) {
  if (typeof document === 'undefined') {
    return
  }

  const existente = document.getElementById(ID_ESTILO_REDUZIR_ANIMACOES)

  if (!ativo) {
    existente?.remove()
    return
  }

  if (existente) {
    return
  }

  const style = document.createElement('style')
  style.id = ID_ESTILO_REDUZIR_ANIMACOES
  style.textContent =
    '*,*::before,*::after{animation-duration:0.01ms!important;animation-iteration-count:1!important;scroll-behavior:auto!important;transition-duration:0.01ms!important;}'
  document.head.appendChild(style)
}

export function aplicarPreferenciasAparenciaNoDocumento(preferencias = {}) {
  const preferenciasNormalizadas = normalizarPreferenciasAparencia(preferencias)

  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return preferenciasNormalizadas
  }

  const { documentElement, body } = document
  const variaveisCss = criarVariaveisCssTemaInterno(preferenciasNormalizadas.temaInterno)
  const colorScheme = obterColorSchemeTemaInterno(preferenciasNormalizadas.temaInterno)
  const densidade = preferenciasNormalizadas.densidadeInterface === DENSIDADE_INTERFACE_COMPACTA ? 'compacta' : 'confortavel'

  if (documentElement) {
    documentElement.dataset.appTheme = preferenciasNormalizadas.temaInterno
    documentElement.dataset.appColorScheme = colorScheme
    documentElement.dataset.appDensity = densidade
    documentElement.dataset.appReducedMotion = String(preferenciasNormalizadas.reduzirAnimacoes)
    documentElement.dataset.appHighContrast = String(preferenciasNormalizadas.altoContraste)
    documentElement.style.colorScheme = colorScheme

    Object.entries(variaveisCss).forEach(([chave, valor]) => {
      documentElement.style.setProperty(chave, valor)
    })

    documentElement.style.setProperty('--app-density-padding-scale', densidade === 'compacta' ? '0.86' : '1')

    if (preferenciasNormalizadas.altoContraste) {
      documentElement.style.setProperty('--app-focus-ring', colorScheme === 'dark' ? 'rgba(255, 255, 255, 0.48)' : 'rgba(15, 23, 42, 0.34)')
      documentElement.style.setProperty('--app-border', colorScheme === 'dark' ? '#e2e8f0' : '#334155')
    }
  }

  if (body) {
    body.dataset.appTheme = preferenciasNormalizadas.temaInterno
    body.dataset.appColorScheme = colorScheme
    body.dataset.appDensity = densidade
    body.dataset.appReducedMotion = String(preferenciasNormalizadas.reduzirAnimacoes)
    body.dataset.appHighContrast = String(preferenciasNormalizadas.altoContraste)
  }

  sincronizarEstiloReducaoAnimacoes(preferenciasNormalizadas.reduzirAnimacoes)

  return preferenciasNormalizadas
}

export function salvarPreferenciasAparenciaLocais(preferencias = {}, { origem = ORIGEM_PREFERENCIAS_APARENCIA_LOCAL } = {}) {
  const normalizadas = normalizarPreferenciasAparencia(preferencias)
  const storage = obterLocalStorageSeguro()

  if (storage) {
    storage.setItem(CHAVE_PREFERENCIAS_APARENCIA, JSON.stringify(normalizadas))
    storage.setItem(CHAVE_TEMA_APARENCIA, normalizadas.temaInterno)
  }

  preferenciasAparencia.value = normalizadas
  temaAparencia.value = normalizadas.temaInterno
  origemPreferenciasAparencia.value = origem
  aplicarPreferenciasAparenciaNoDocumento(normalizadas)

  return normalizadas
}

export function lerTemaAparenciaSalvo() {
  return lerPreferenciasAparenciaLocais().temaInterno || ''
}

export function salvarTemaAparencia(tema) {
  return salvarPreferenciasAparenciaLocais({
    ...preferenciasAparencia.value,
    temaInterno: tema,
  }).temaInterno
}

export function sincronizarTemaAparencia() {
  const preferencias = lerPreferenciasAparenciaLocais()
  salvarPreferenciasAparenciaLocais(preferencias, { origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL })
  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_OCIOSO)

  return preferencias.temaInterno
}

export async function carregarOpcoesAparenciaBackend(buscarOpcoesAparencia) {
  if (typeof buscarOpcoesAparencia !== 'function') {
    opcoesAparencia.value = criarOpcoesAparenciaFallback()
    origemOpcoesAparencia.value = ORIGEM_OPCOES_APARENCIA_LOCAL
    return opcoesAparencia.value
  }

  try {
    const resposta = await buscarOpcoesAparencia()
    const { valido, opcoes } = normalizarOpcoesAparenciaBackend(resposta)

    opcoesAparencia.value = opcoes
    origemOpcoesAparencia.value = valido ? ORIGEM_OPCOES_APARENCIA_BACKEND : ORIGEM_OPCOES_APARENCIA_LOCAL
    return opcoesAparencia.value
  } catch (error) {
    console.error(error)
    opcoesAparencia.value = criarOpcoesAparenciaFallback()
    origemOpcoesAparencia.value = ORIGEM_OPCOES_APARENCIA_LOCAL
    return opcoesAparencia.value
  }
}

export async function carregarPreferenciasAparenciaBackend(buscarPreferenciasAparencia, buscarOpcoesAparencia) {
  await carregarOpcoesAparenciaBackend(buscarOpcoesAparencia)

  if (typeof buscarPreferenciasAparencia !== 'function') {
    return salvarPreferenciasAparenciaLocais(lerPreferenciasAparenciaLocais(), {
      origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
    })
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_CARREGANDO, 'Carregando preferências de aparência...')

  try {
    const resposta = await buscarPreferenciasAparencia()
    const preferencias = salvarPreferenciasAparenciaLocais(normalizarPreferenciasAparencia(resposta), {
      origem: ORIGEM_PREFERENCIAS_APARENCIA_BACKEND,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_SALVO, 'Preferências sincronizadas.')
    return preferencias
  } catch (error) {
    console.error(error)
    const preferencias = salvarPreferenciasAparenciaLocais(lerPreferenciasAparenciaLocais(), {
      origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
    })
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_APARENCIA_ERRO,
      'Não foi possível sincronizar a aparência. Usando a preferência salva neste navegador.',
    )
    return preferencias
  }
}

export async function salvarPreferenciasAparenciaBackend(preferencias, salvarPreferenciasAparencia) {
  const locais = salvarPreferenciasAparenciaLocais(preferencias, {
    origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
  })

  if (typeof salvarPreferenciasAparencia !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_OCIOSO)
    return locais
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_SALVANDO, 'Salvando aparência...')

  try {
    const resposta = await salvarPreferenciasAparencia(criarPayloadPreferenciasAparencia(locais))
    const origem = resposta && typeof resposta === 'object' ? resposta : locais
    const sincronizadas = salvarPreferenciasAparenciaLocais({
      ...locais,
      ...extrairPreferenciasAparenciaResposta(origem),
    }, {
      origem: ORIGEM_PREFERENCIAS_APARENCIA_BACKEND,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_SALVO, 'Aparência salva.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_APARENCIA_ERRO,
      'Não foi possível sincronizar. A preferência ficou salva neste navegador.',
    )
    return locais
  }
}

export async function resetarPreferenciasAparenciaBackend(resetarPreferenciasAparencia) {
  const padrao = salvarPreferenciasAparenciaLocais(criarPreferenciasAparenciaPadrao(), {
    origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
  })

  if (typeof resetarPreferenciasAparencia !== 'function') {
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_OCIOSO)
    return padrao
  }

  definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_SALVANDO, 'Restaurando aparência...')

  try {
    const resposta = await resetarPreferenciasAparencia()
    const origem = resposta && typeof resposta === 'object' ? resposta : padrao
    const sincronizadas = salvarPreferenciasAparenciaLocais({
      ...padrao,
      ...extrairPreferenciasAparenciaResposta(origem),
    }, {
      origem: ORIGEM_PREFERENCIAS_APARENCIA_BACKEND,
    })
    definirEstadoSincronizacao(STATUS_SINCRONIZACAO_APARENCIA_SALVO, 'Aparência restaurada.')
    return sincronizadas
  } catch (error) {
    console.error(error)
    definirEstadoSincronizacao(
      STATUS_SINCRONIZACAO_APARENCIA_ERRO,
      'Não foi possível sincronizar a restauração. O padrão ficou salvo neste navegador.',
    )
    return padrao
  }
}
