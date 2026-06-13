const criarOpcao = (valor, rotulo) => Object.freeze({ valor, rotulo })

export const OPCOES_PERFIL_BEACH_TENNIS = Object.freeze([
  criarOpcao('ALUNO_AULA', 'Aluno de aula'),
  criarOpcao('PARTICIPANTE_PLAY', 'Participante de play'),
  criarOpcao('ALUNO_E_PLAY', 'Aluno e play'),
])

export const OPCOES_NIVEL_BEACH_TENNIS = Object.freeze([
  criarOpcao('INICIANTE', 'Iniciante'),
  criarOpcao('INTERMEDIARIO', 'Intermediário'),
  criarOpcao('AVANCADO', 'Avançado'),
  criarOpcao('COMPETICAO', 'Competição'),
])

export const OPCOES_FREQUENCIA_SEMANAL_BEACH_TENNIS = Object.freeze([
  criarOpcao('UMA_VEZ_SEMANA', '1x por semana'),
  criarOpcao('DUAS_VEZES_SEMANA', '2x por semana'),
  criarOpcao('LIVRE', 'Livre'),
  criarOpcao('AVULSO', 'Avulso'),
])

export const OPCOES_PLANO_BEACH_TENNIS = Object.freeze([
  criarOpcao('MENSAL_1X', 'Mensal 1x'),
  criarOpcao('MENSAL_2X', 'Mensal 2x'),
  criarOpcao('PLAY_MENSAL', 'Play mensal'),
  criarOpcao('PLAY_AVULSO', 'Play avulso'),
  criarOpcao('AVULSO', 'Avulso'),
  criarOpcao('CORTESIA', 'Cortesia'),
])

export const OPCOES_DIAS_SEMANA_BEACH_TENNIS = Object.freeze([
  criarOpcao('SEGUNDA', 'Segunda'),
  criarOpcao('TERCA', 'Terça'),
  criarOpcao('QUARTA', 'Quarta'),
  criarOpcao('QUINTA', 'Quinta'),
  criarOpcao('SEXTA', 'Sexta'),
  criarOpcao('SABADO', 'Sábado'),
  criarOpcao('DOMINGO', 'Domingo'),
])

function rotuloPorOpcao(opcoes, valor) {
  const valorNormalizado = String(valor || '').trim().toUpperCase()
  return opcoes.find((opcao) => opcao.valor === valorNormalizado)?.rotulo || ''
}

export function rotuloPerfilBeachTennis(valor) {
  return rotuloPorOpcao(OPCOES_PERFIL_BEACH_TENNIS, valor)
}

export function rotuloNivelBeachTennis(valor) {
  return rotuloPorOpcao(OPCOES_NIVEL_BEACH_TENNIS, valor)
}

export function rotuloFrequenciaSemanalBeachTennis(valor) {
  return rotuloPorOpcao(OPCOES_FREQUENCIA_SEMANAL_BEACH_TENNIS, valor)
}

export function rotuloPlanoBeachTennis(valor) {
  return rotuloPorOpcao(OPCOES_PLANO_BEACH_TENNIS, valor)
}

export function rotuloDiaBeachTennis(valor) {
  return rotuloPorOpcao(OPCOES_DIAS_SEMANA_BEACH_TENNIS, valor)
}

export function formatarDataBrasileira(valor) {
  const texto = String(valor || '').trim()
  if (!texto) return ''

  const data = new Date(texto)
  if (Number.isNaN(data.getTime())) {
    return texto
  }

  return new Intl.DateTimeFormat('pt-BR', { timeZone: 'UTC' }).format(data)
}

export function normalizarArrayBeachTennis(valor) {
  if (Array.isArray(valor)) {
    return valor.map((item) => String(item || '').trim().toUpperCase()).filter(Boolean)
  }

  if (!valor) {
    return []
  }

  return String(valor)
    .split(',')
    .map((item) => String(item || '').trim().toUpperCase())
    .filter(Boolean)
}

