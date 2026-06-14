import { computed, ref } from 'vue'
import { buscarContextoGestaoEsportiva, obterEmpresaIdOperacao } from '@/services/api'

const FALLBACKS_TEXTO = Object.freeze({
  nomeModalidade: 'Esporte',
  termoParticipanteSingular: 'Participante',
  termoParticipantePlural: 'Participantes',
  termoResponsavelSingular: 'Profissional',
  termoResponsavelPlural: 'Profissionais',
  termoGrupoSingular: 'Turma',
  termoGrupoPlural: 'Turmas',
  termoAtividadeSingular: 'Atividade',
  termoAtividadePlural: 'Atividades',
  termoLocalSingular: 'Local',
  termoLocalPlural: 'Locais',
  nomeEventoLivre: 'Jogo livre',
})

function criarEstadoInicial() {
  return {
    carregando: false,
    carregado: false,
    ativo: false,
    erro: null,
    empresaId: '',
    modalidadeCodigo: '',
    nomeModalidade: '',
    termoParticipanteSingular: '',
    termoParticipantePlural: '',
    termoResponsavelSingular: '',
    termoResponsavelPlural: '',
    termoGrupoSingular: '',
    termoGrupoPlural: '',
    termoAtividadeSingular: '',
    termoAtividadePlural: '',
    termoLocalSingular: '',
    termoLocalPlural: '',
    nomeEventoLivre: '',
  }
}

export const estadoGestaoEsportiva = ref(criarEstadoInicial())

let promessaCarregamento = null
let empresaIdCarregando = ''
let sequenciaCarregamento = 0

function textoSeguro(valor, fallback = '') {
  const texto = String(valor || '').trim()
  return texto || fallback
}

function empresaAtualOperacao() {
  return String(obterEmpresaIdOperacao() || '').trim()
}

function normalizarContextoAtivo(dados = {}, empresaId = '') {
  return {
    carregando: false,
    carregado: true,
    ativo: true,
    erro: null,
    empresaId,
    modalidadeCodigo: textoSeguro(dados.modalidadeCodigo),
    nomeModalidade: textoSeguro(dados.nomeModalidade, FALLBACKS_TEXTO.nomeModalidade),
    termoParticipanteSingular: textoSeguro(dados.termoParticipanteSingular, FALLBACKS_TEXTO.termoParticipanteSingular),
    termoParticipantePlural: textoSeguro(dados.termoParticipantePlural, FALLBACKS_TEXTO.termoParticipantePlural),
    termoResponsavelSingular: textoSeguro(dados.termoResponsavelSingular, FALLBACKS_TEXTO.termoResponsavelSingular),
    termoResponsavelPlural: textoSeguro(dados.termoResponsavelPlural, FALLBACKS_TEXTO.termoResponsavelPlural),
    termoGrupoSingular: textoSeguro(dados.termoGrupoSingular, FALLBACKS_TEXTO.termoGrupoSingular),
    termoGrupoPlural: textoSeguro(dados.termoGrupoPlural, FALLBACKS_TEXTO.termoGrupoPlural),
    termoAtividadeSingular: textoSeguro(dados.termoAtividadeSingular, FALLBACKS_TEXTO.termoAtividadeSingular),
    termoAtividadePlural: textoSeguro(dados.termoAtividadePlural, FALLBACKS_TEXTO.termoAtividadePlural),
    termoLocalSingular: textoSeguro(dados.termoLocalSingular, FALLBACKS_TEXTO.termoLocalSingular),
    termoLocalPlural: textoSeguro(dados.termoLocalPlural, FALLBACKS_TEXTO.termoLocalPlural),
    nomeEventoLivre: textoSeguro(dados.nomeEventoLivre, FALLBACKS_TEXTO.nomeEventoLivre),
  }
}

function normalizarContextoInativo(empresaId = '', erro = null) {
  return {
    ...criarEstadoInicial(),
    carregando: false,
    carregado: true,
    ativo: false,
    erro,
    empresaId,
  }
}

export const contextoGestaoEsportiva = computed(() => estadoGestaoEsportiva.value)

export function formatarNomeModalidadeEmCaixaAlta(nome = contextoGestaoEsportiva.value.nomeModalidade) {
  return String(nome || '')
    .trim()
    .toLocaleUpperCase('pt-BR')
}

export function limparContextoGestaoEsportiva() {
  estadoGestaoEsportiva.value = criarEstadoInicial()
}

export function redefinirContextoGestaoEsportiva(empresaId = '') {
  estadoGestaoEsportiva.value = {
    ...criarEstadoInicial(),
    empresaId: String(empresaId || '').trim(),
  }
}

export async function carregarContextoGestaoEsportiva({ forcar = false } = {}) {
  const empresaId = empresaAtualOperacao()

  if (!empresaId) {
    estadoGestaoEsportiva.value = normalizarContextoInativo('')
    return estadoGestaoEsportiva.value
  }

  if (
    !forcar &&
    estadoGestaoEsportiva.value.carregado &&
    !estadoGestaoEsportiva.value.carregando &&
    estadoGestaoEsportiva.value.empresaId === empresaId
  ) {
    return estadoGestaoEsportiva.value
  }

  if (!forcar && promessaCarregamento && empresaIdCarregando === empresaId) {
    return promessaCarregamento
  }

  const requisicaoAtual = ++sequenciaCarregamento
  empresaIdCarregando = empresaId
  estadoGestaoEsportiva.value = {
    ...criarEstadoInicial(),
    carregando: true,
    empresaId,
  }

  promessaCarregamento = (async () => {
    try {
      const resposta = await buscarContextoGestaoEsportiva()
      const ativo = resposta?.ativo === true
      const empresaAindaAtual = empresaAtualOperacao()

      if (requisicaoAtual !== sequenciaCarregamento || empresaAindaAtual !== empresaId) {
        return estadoGestaoEsportiva.value
      }

      estadoGestaoEsportiva.value = ativo
        ? normalizarContextoAtivo(resposta, empresaId)
        : normalizarContextoInativo(empresaId)
      return estadoGestaoEsportiva.value
    } catch (error) {
      console.error(error)

      const empresaAindaAtual = empresaAtualOperacao()
      if (requisicaoAtual !== sequenciaCarregamento || empresaAindaAtual !== empresaId) {
        return estadoGestaoEsportiva.value
      }

      estadoGestaoEsportiva.value = normalizarContextoInativo(empresaId, error)
      return estadoGestaoEsportiva.value
    } finally {
      if (requisicaoAtual === sequenciaCarregamento) {
        promessaCarregamento = null
        empresaIdCarregando = ''
      }
    }
  })()

  return promessaCarregamento
}

export async function recarregarContextoGestaoEsportiva() {
  return carregarContextoGestaoEsportiva({ forcar: true })
}
