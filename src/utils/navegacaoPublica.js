export const ROTA_PUBLICA_INICIO = '/'
export const ROTA_PUBLICA_RECURSOS = '/#recursos'
export const ROTA_PUBLICA_PLANOS = '/#planos'
export const ROTA_PUBLICA_SOBRE = '/sobre'
export const ROTA_PUBLICA_ENTRAR = '/login'
export const ROTA_PUBLICA_CADASTRO = '/cadastro'
export const ROTA_PUBLICA_CADASTRO_COM_PLANOS = '/cadastro#planos'

export const LINKS_MENU_PUBLICO = [
  { chave: 'inicio', rotulo: 'Início', to: ROTA_PUBLICA_INICIO },
  { chave: 'recursos', rotulo: 'Recursos', to: ROTA_PUBLICA_RECURSOS },
  { chave: 'planos', rotulo: 'Planos', to: ROTA_PUBLICA_PLANOS },
  { chave: 'sobre', rotulo: 'Sobre', to: ROTA_PUBLICA_SOBRE },
]

export const LINKS_ACAO_PUBLICA = [
  { chave: 'entrar', rotulo: 'Entrar', to: ROTA_PUBLICA_ENTRAR, classe: 'public-nav-login' },
  { chave: 'comecar', rotulo: 'Começar agora', to: ROTA_PUBLICA_CADASTRO, classe: 'public-nav-cta' },
]

export function obterRotaPublicaInicio() {
  return ROTA_PUBLICA_INICIO
}

export function obterRotaPublicaRecursos() {
  return ROTA_PUBLICA_RECURSOS
}

export function obterRotaPublicaPlanos() {
  return ROTA_PUBLICA_PLANOS
}

export function obterRotaPublicaSobre() {
  return ROTA_PUBLICA_SOBRE
}

export function obterRotaPublicaEntrar() {
  return ROTA_PUBLICA_ENTRAR
}

export function obterRotaPublicaCadastro() {
  return ROTA_PUBLICA_CADASTRO
}

export function obterRotaPublicaCadastroComPlanos() {
  return ROTA_PUBLICA_CADASTRO_COM_PLANOS
}
