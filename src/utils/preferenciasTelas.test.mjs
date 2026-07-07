import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CHAVE_TELA_DASHBOARD,
  ITENS_POR_PAGINA_TELAS_VALIDOS,
  MODO_VISUALIZACAO_TABELA,
  ORIGEM_OPCOES_TELAS_LOCAL,
  ORIGEM_PREFERENCIAS_TELAS_BACKEND,
  ORIGEM_PREFERENCIAS_TELAS_LOCAL,
  STATUS_SINCRONIZACAO_TELAS_ERRO,
  STATUS_SINCRONIZACAO_TELAS_SALVO,
  STATUS_SINCRONIZACAO_TELAS_VALIDOS,
  TELAS_PREFERENCIAS_SUPORTADAS,
  carregarOpcoesPreferenciasTelasBackend,
  carregarPreferenciasTelasBackend,
  criarPayloadPreferenciaTela,
  estadoSincronizacaoTelas,
  lerPreferenciasTelasLocais,
  normalizarChaveTela,
  normalizarColunasVisiveis,
  normalizarFiltrosSalvos,
  normalizarModoVisualizacao,
  normalizarOpcoesPreferenciasTelasBackend,
  normalizarPreferenciasTelas,
  obterOpcoesPreferenciasTelasFallback,
  obterPreferenciaTelaPadrao,
  obterResumoSincronizacaoTelas,
  opcoesPreferenciasTelas,
  origemOpcoesPreferenciasTelas,
  origemPreferenciasTelas,
  preferenciasTelas,
  resetarPreferenciaTelaBackend,
  resetarPreferenciasTelasBackend,
} from './preferenciasTelas.js'

function criarLocalStorageMock(valoresIniciais = {}) {
  const dados = new Map(Object.entries(valoresIniciais))

  return {
    getItem(chave) {
      return dados.has(chave) ? dados.get(chave) : null
    },
    setItem(chave, valor) {
      dados.set(chave, String(valor))
    },
    removeItem(chave) {
      dados.delete(chave)
    },
    clear() {
      dados.clear()
    },
  }
}

function comLocalStorageMock(valores, teste) {
  const windowAnterior = globalThis.window
  globalThis.window = {
    localStorage: criarLocalStorageMock(valores),
  }

  try {
    return teste(globalThis.window.localStorage)
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = windowAnterior
    }
  }
}

async function comLocalStorageMockAsync(valores, teste) {
  const windowAnterior = globalThis.window
  globalThis.window = {
    localStorage: criarLocalStorageMock(valores),
  }

  try {
    return await teste(globalThis.window.localStorage)
  } finally {
    if (windowAnterior === undefined) {
      delete globalThis.window
    } else {
      globalThis.window = windowAnterior
    }
  }
}

async function comConsoleErrorSilenciado(teste) {
  const consoleErrorAnterior = console.error
  console.error = () => {}

  try {
    return await teste()
  } finally {
    console.error = consoleErrorAnterior
  }
}

function criarOpcoesBackend(alteracoes = {}) {
  return {
    telas: TELAS_PREFERENCIAS_SUPORTADAS.map((tela) => ({ valor: tela.chave, nome: tela.nome })),
    modosVisualizacao: [
      { valor: 'TABELA', nome: 'Tabela' },
      { valor: 'CARDS', nome: 'Cards' },
      { valor: 'LISTA', nome: 'Lista' },
      { valor: 'CALENDARIO', nome: 'Calendario' },
    ],
    itensPorPagina: ITENS_POR_PAGINA_TELAS_VALIDOS.map((valor) => ({ valor, nome: `${valor} itens` })),
    ordenacoesDirecao: [
      { valor: 'ASC', nome: 'Crescente' },
      { valor: 'DESC', nome: 'Decrescente' },
    ],
    ...alteracoes,
  }
}

describe('preferenciasTelas', () => {
  it('mantem a lista local de telas suportadas', () => {
    assert.deepEqual(
      TELAS_PREFERENCIAS_SUPORTADAS.map((tela) => tela.chave),
      [
        'DASHBOARD',
        'CLIENTES',
        'AGENDAMENTOS',
        'ESTOQUE',
        'SERVICOS',
        'FUNCIONARIOS',
        'FINANCEIRO',
        'FATURAS',
        'AUDITORIA',
        'LIXEIRA',
        'NOTIFICACOES',
        'ESPORTIVO_TURMAS',
        'ESPORTIVO_FREQUENCIA',
        'ESPORTIVO_FINANCEIRO',
        'MINHA_CONTA',
      ],
    )
  })

  it('cria preferencia padrao por tela', () => {
    assert.deepEqual(obterPreferenciaTelaPadrao('CLIENTES'), {
      chaveTela: 'CLIENTES',
      modoVisualizacao: 'TABELA',
      itensPorPagina: 20,
      ordenacaoCampo: 'nome',
      ordenacaoDirecao: 'ASC',
      colunasVisiveis: ['nome', 'telefone', 'email', 'status'],
      filtrosSalvos: {},
      fixarFiltros: false,
      compactarCards: false,
      atualizadoEm: '',
    })
  })

  it('chave invalida cai para DASHBOARD', () => {
    assert.equal(normalizarChaveTela('RELATORIOS'), CHAVE_TELA_DASHBOARD)
  })

  it('modoVisualizacao invalido cai para TABELA', () => {
    assert.equal(normalizarModoVisualizacao('GRADE'), MODO_VISUALIZACAO_TABELA)
  })

  it('itensPorPagina invalido cai para 20', () => {
    assert.equal(normalizarPreferenciasTelas([{ chaveTela: 'CLIENTES', itensPorPagina: 999 }]).CLIENTES.itensPorPagina, 20)
    assert.equal(normalizarPreferenciasTelas([{ chaveTela: 'CLIENTES', itensPorPagina: 'abc' }]).CLIENTES.itensPorPagina, 20)
  })

  it('ordenacaoDirecao invalida cai para ASC', () => {
    assert.equal(
      normalizarPreferenciasTelas([{ chaveTela: 'CLIENTES', ordenacaoDirecao: 'BAIXO' }]).CLIENTES.ordenacaoDirecao,
      'ASC',
    )
  })

  it('colunasVisiveis invalidas viram lista padrao', () => {
    assert.deepEqual(normalizarColunasVisiveis('CLIENTES', ['id', null, 'codigo']), [
      'nome',
      'telefone',
      'email',
      'status',
    ])
  })

  it('filtrosSalvos invalido vira objeto vazio', () => {
    assert.deepEqual(normalizarFiltrosSalvos(null), {})
    assert.deepEqual(normalizarFiltrosSalvos(['status']), {})
  })

  it('filtrosSalvos grande demais e descartado', () => {
    assert.deepEqual(normalizarFiltrosSalvos({ texto: 'x'.repeat(5000) }), {})
  })

  it('payload para backend nao envia campos somente leitura', () => {
    assert.deepEqual(
      criarPayloadPreferenciaTela({
        chaveTela: 'CLIENTES',
        modoVisualizacao: 'CARDS',
        itensPorPagina: 50,
        ordenacaoCampo: 'nome',
        ordenacaoDirecao: 'DESC',
        colunasVisiveis: ['nome', 'email'],
        filtrosSalvos: { status: 'ativos' },
        fixarFiltros: true,
        compactarCards: true,
        atualizadoEm: '2026-07-07T00:00:00',
        origem: 'backend',
        status: 'salvo',
      }),
      {
        chaveTela: 'CLIENTES',
        modoVisualizacao: 'CARDS',
        itensPorPagina: 50,
        ordenacaoCampo: 'nome',
        ordenacaoDirecao: 'DESC',
        colunasVisiveis: ['nome', 'email'],
        filtrosSalvos: { status: 'ativos' },
        fixarFiltros: true,
        compactarCards: true,
      },
    )
  })

  it('usuarioId externo e ignorado', () => {
    assert.deepEqual(
      criarPayloadPreferenciaTela({
        chaveTela: 'AGENDAMENTOS',
        usuarioId: 123,
        itensPorPagina: 10,
      }),
      {
        chaveTela: 'AGENDAMENTOS',
        modoVisualizacao: 'TABELA',
        itensPorPagina: 10,
        ordenacaoCampo: 'dataHora',
        ordenacaoDirecao: 'ASC',
        colunasVisiveis: ['dataHora', 'cliente', 'servico', 'status'],
        filtrosSalvos: {},
        fixarFiltros: false,
        compactarCards: false,
      },
    )
  })

  it('usa fallback localStorage valido', () => {
    comLocalStorageMock(
      {
        preferenciasTelas: JSON.stringify({
          CLIENTES: {
            chaveTela: 'CLIENTES',
            modoVisualizacao: 'CARDS',
            itensPorPagina: 50,
            colunasVisiveis: ['nome', 'email'],
            filtrosSalvos: { status: 'ativos' },
          },
        }),
      },
      () => {
        const preferencias = lerPreferenciasTelasLocais()

        assert.equal(preferencias.CLIENTES.modoVisualizacao, 'CARDS')
        assert.equal(preferencias.CLIENTES.itensPorPagina, 50)
        assert.deepEqual(preferencias.CLIENTES.colunasVisiveis, ['nome', 'email'])
      },
    )
  })

  it('localStorage invalido cai para padrao seguro', async () => {
    await comLocalStorageMockAsync({ preferenciasTelas: '{invalido' }, async () => {
      const preferencias = await comConsoleErrorSilenciado(() => lerPreferenciasTelasLocais())

      assert.deepEqual(preferencias, {})
      assert.deepEqual(obterPreferenciaTelaPadrao('CLIENTES').colunasVisiveis, ['nome', 'telefone', 'email', 'status'])
    })
  })

  it('reset por tela retorna padrao', async () => {
    const preferencia = await resetarPreferenciaTelaBackend('CLIENTES', async () => ({
      chaveTela: 'CLIENTES',
      atualizadoEm: '2026-07-07T00:00:00',
    }))

    assert.equal(preferencia.chaveTela, 'CLIENTES')
    assert.equal(preferencia.modoVisualizacao, 'TABELA')
    assert.equal(estadoSincronizacaoTelas.value, STATUS_SINCRONIZACAO_TELAS_SALVO)
    assert.equal(origemPreferenciasTelas.value, ORIGEM_PREFERENCIAS_TELAS_BACKEND)
  })

  it('reset geral retorna mapa vazio quando backend nao devolve preferencias', async () => {
    const preferencias = await resetarPreferenciasTelasBackend(async () => ({}))

    assert.deepEqual(preferencias, {})
  })

  it('opcoes incompletas do backend usam fallback local', async () => {
    const opcoes = await carregarOpcoesPreferenciasTelasBackend(async () =>
      criarOpcoesBackend({
        telas: [{ valor: 'DASHBOARD', nome: 'Dashboard' }],
      }),
    )

    assert.equal(opcoes.telas.length, TELAS_PREFERENCIAS_SUPORTADAS.length)
    assert.equal(opcoes.modosVisualizacao.length, 4)
    assert.equal(origemOpcoesPreferenciasTelas.value, ORIGEM_OPCOES_TELAS_LOCAL)
    assert.deepEqual(opcoes, obterOpcoesPreferenciasTelasFallback())
  })

  it('lista de preferencias backend valida e normalizada', async () => {
    await comLocalStorageMockAsync({}, async () => {
      const preferencias = await carregarPreferenciasTelasBackend(
        async () => [
          {
            chaveTela: 'clientes',
            modoVisualizacao: 'cards',
            itensPorPagina: '50',
            ordenacaoCampo: 'email',
            ordenacaoDirecao: 'desc',
            colunasVisiveis: ['email', 'nome'],
            filtrosSalvos: { status: 'ativos' },
            fixarFiltros: 'true',
            compactarCards: 1,
          },
        ],
        async () => criarOpcoesBackend(),
      )

      assert.equal(preferencias.CLIENTES.modoVisualizacao, 'CARDS')
      assert.equal(preferencias.CLIENTES.ordenacaoDirecao, 'DESC')
      assert.deepEqual(preferencias.CLIENTES.colunasVisiveis, ['email', 'nome'])
      assert.equal(preferenciasTelas.value.CLIENTES.compactarCards, true)
      assert.equal(opcoesPreferenciasTelas.value.telas.length, TELAS_PREFERENCIAS_SUPORTADAS.length)
    })
  })

  it('status de sincronizacao e representavel', async () => {
    assert.deepEqual(STATUS_SINCRONIZACAO_TELAS_VALIDOS, [
      'idle',
      'carregando',
      'salvando',
      'salvo',
      'erro',
      'local',
    ])

    assert.equal(
      obterResumoSincronizacaoTelas({
        estado: 'salvo',
        origem: ORIGEM_PREFERENCIAS_TELAS_BACKEND,
      }).rotulo,
      'Sincronizado',
    )
    assert.equal(
      obterResumoSincronizacaoTelas({
        estado: STATUS_SINCRONIZACAO_TELAS_ERRO,
        origem: ORIGEM_PREFERENCIAS_TELAS_LOCAL,
      }).rotulo,
      'Erro ao sincronizar',
    )
  })

  it('prioriza backend valido e localStorage quando backend falha', async () => {
    await comLocalStorageMockAsync(
      {
        preferenciasTelas: JSON.stringify({
          ESTOQUE: {
            chaveTela: 'ESTOQUE',
            itensPorPagina: 10,
          },
        }),
      },
      async () => {
        const backend = await carregarPreferenciasTelasBackend(
          async () => [{ chaveTela: 'SERVICOS', modoVisualizacao: 'LISTA', itensPorPagina: 100 }],
          async () => criarOpcoesBackend(),
        )

        assert.equal(backend.SERVICOS.modoVisualizacao, 'LISTA')

        const local = await comConsoleErrorSilenciado(() =>
          carregarPreferenciasTelasBackend(
            async () => {
              throw new Error('indisponivel')
            },
            async () => normalizarOpcoesPreferenciasTelasBackend(criarOpcoesBackend()).opcoes,
          ),
        )

        assert.equal(local.SERVICOS.itensPorPagina, 100)
        assert.equal(estadoSincronizacaoTelas.value, STATUS_SINCRONIZACAO_TELAS_ERRO)
      },
    )
  })
})
