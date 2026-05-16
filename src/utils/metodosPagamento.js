export const METODOS_PAGAMENTO = [
  { codigo: 'PIX', rotulo: 'Pix' },
  { codigo: 'BOLETO', rotulo: 'Boleto' },
  { codigo: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito' },
  { codigo: 'CARTAO_DEBITO', rotulo: 'Cartão de débito' },
  { codigo: 'TRANSFERENCIA', rotulo: 'Transferência' },
  { codigo: 'DINHEIRO', rotulo: 'Dinheiro' },
  { codigo: 'LINK_MANUAL', rotulo: 'Link manual' },
  { codigo: 'OUTRO', rotulo: 'Outro' },
]

const CODIGOS_VALIDOS = new Set(METODOS_PAGAMENTO.map((metodo) => metodo.codigo))

const equivalencias = {
  CARTAO: 'CARTAO_CREDITO',
  CARTAO_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DE_CREDITO: 'CARTAO_CREDITO',
  CARTAO_DEBITO: 'CARTAO_DEBITO',
  CARTAO_DE_DEBITO: 'CARTAO_DEBITO',
  PIX: 'PIX',
  BOLETO: 'BOLETO',
  TRANSFERENCIA: 'TRANSFERENCIA',
  DINHEIRO: 'DINHEIRO',
  LINK_MANUAL: 'LINK_MANUAL',
  OUTRO: 'OUTRO',
}

export function normalizarCodigoMetodoPagamento(valor) {
  const codigo = String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-zA-Z0-9]+/g, '_')
    .replace(/^_+|_+$/g, '')
    .toUpperCase()

  return equivalencias[codigo] || (CODIGOS_VALIDOS.has(codigo) ? codigo : '')
}

export function obterRotuloMetodoPagamento(codigo) {
  return METODOS_PAGAMENTO.find((metodo) => metodo.codigo === codigo)?.rotulo || codigo
}

export function normalizarListaMetodosPagamento(dados) {
  const lista = normalizarColecao(dados)
  const codigos = lista
    .filter((item) => (typeof item === 'object' && item !== null ? item.ativo !== false : true))
    .map((item) => {
      const valor =
        typeof item === 'object' && item !== null
          ? item.codigo || item.metodo || item.nome || item.rotulo
          : item

      return normalizarCodigoMetodoPagamento(valor)
    })
    .filter(Boolean)

  return [...new Set(codigos)]
}

function normalizarColecao(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []

  return dados.metodosAtivos
    || dados.metodos
    || dados.content
    || dados.data?.metodosAtivos
    || dados.data?.metodos
    || dados.data?.content
    || dados.data
    || dados.items
    || dados.itens
    || []
}
