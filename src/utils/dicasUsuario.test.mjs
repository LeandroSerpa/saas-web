import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CATALOGO_DICAS_USUARIO_LOCAL,
  ORIGEM_DICAS_USUARIO_BACKEND,
  STATUS_DICA_DISPENSADA,
  STATUS_DICA_NAO_VISUALIZADA,
  STATUS_DICA_VISUALIZADA,
  STATUS_SINCRONIZACAO_DICAS_VALIDOS,
  dicasUsuario,
  dispensarDicaUsuarioLocal,
  lerDicasUsuarioLocais,
  marcarDicaUsuarioVisualizadaLocal,
  mergeDicasUsuarioComCatalogo,
  montarResumoDicasUsuario,
  normalizarDicaUsuario,
  normalizarStatusDica,
  obterCatalogoDicasUsuarioLocal,
  obterResumoSincronizacaoDicas,
  reativarDicaUsuarioLocal,
  resetarDicasUsuarioLocais,
  salvarDicasUsuarioLocais,
} from './dicasUsuario.js'

const DICAS_OBRIGATORIAS = [
  'BOAS_VINDAS_DASHBOARD',
  'CONFIGURAR_APARENCIA',
  'CONFIGURAR_PREFERENCIAS_USO',
  'CONFIGURAR_PREFERENCIAS_TELA',
  'PERSONALIZAR_PAGINA_PUBLICA',
  'CONFIGURAR_AGENDA_PUBLICA',
  'CADASTRAR_CLIENTES',
  'CADASTRAR_SERVICOS',
  'ORGANIZAR_ESTOQUE',
  'USAR_CATALOGO_PUBLICO',
  'GESTAO_ESPORTIVA_TURMAS',
  'GESTAO_ESPORTIVA_FREQUENCIA',
  'CENTRAL_NOTIFICACOES',
  'AUDITORIA_E_LIXEIRA',
  'SEGURANCA_MINHA_CONTA',
]

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

async function comConsoleErrorSilenciado(teste) {
  const consoleErrorAnterior = console.error
  console.error = () => {}

  try {
    return await teste()
  } finally {
    console.error = consoleErrorAnterior
  }
}

describe('dicasUsuario', () => {
  it('catalogo local contem todas as dicas obrigatorias', () => {
    const chaves = CATALOGO_DICAS_USUARIO_LOCAL.map((dica) => dica.chaveDica)

    assert.equal(chaves.length, DICAS_OBRIGATORIAS.length)
    for (const chave of DICAS_OBRIGATORIAS) {
      assert.ok(chaves.includes(chave))
    }
  })

  it('normaliza dica valida', () => {
    assert.deepEqual(
      normalizarDicaUsuario({
        chaveDica: 'cadastrar_clientes',
        titulo: 'Clientes',
        descricao: 'Cadastre clientes.',
        modulo: 'Clientes',
        status: 'visualizada',
        visualizacoes: '2',
        acaoLabel: 'Abrir',
        acaoRota: '/clientes',
      }),
      {
        chaveDica: 'CADASTRAR_CLIENTES',
        titulo: 'Clientes',
        descricao: 'Cadastre clientes.',
        modulo: 'Clientes',
        status: STATUS_DICA_VISUALIZADA,
        visualizacoes: 2,
        acaoLabel: 'Abrir',
        acaoRota: '/clientes',
        atualizadoEm: '',
        visualizadaEm: '',
        dispensadaEm: '',
      },
    )
  })

  it('dica incompleta recebe fallback', () => {
    const dica = normalizarDicaUsuario({ chaveDica: 'CONFIGURAR_APARENCIA' })

    assert.equal(dica.titulo, 'Configure a aparência')
    assert.equal(dica.modulo, 'Minha conta')
    assert.equal(dica.status, STATUS_DICA_NAO_VISUALIZADA)
  })

  it('status invalido cai para NAO_VISUALIZADA', () => {
    assert.equal(normalizarStatusDica('ARQUIVADA'), STATUS_DICA_NAO_VISUALIZADA)
  })

  it('resumo conta nao visualizadas, visualizadas e dispensadas', () => {
    const resumo = montarResumoDicasUsuario([
      { chaveDica: 'CADASTRAR_CLIENTES', status: 'NAO_VISUALIZADA' },
      { chaveDica: 'CADASTRAR_SERVICOS', status: 'VISUALIZADA' },
      { chaveDica: 'ORGANIZAR_ESTOQUE', status: 'DISPENSADA' },
    ])

    assert.equal(resumo.total, 3)
    assert.equal(resumo.naoVisualizadas, 1)
    assert.equal(resumo.visualizadas, 1)
    assert.equal(resumo.dispensadas, 1)
    assert.equal(resumo.pendentes, 1)
  })

  it('merge backend + catalogo local preserva dicas locais', () => {
    const dicas = mergeDicasUsuarioComCatalogo([
      { chaveDica: 'CADASTRAR_CLIENTES', status: 'VISUALIZADA' },
    ])

    assert.equal(dicas.length, DICAS_OBRIGATORIAS.length)
    assert.equal(dicas.find((dica) => dica.chaveDica === 'CADASTRAR_CLIENTES').status, STATUS_DICA_VISUALIZADA)
    assert.ok(dicas.find((dica) => dica.chaveDica === 'SEGURANCA_MINHA_CONTA'))
  })

  it('payload backend incompleto usa fallback local', () => {
    const dicas = mergeDicasUsuarioComCatalogo({ data: { dicas: [{ chaveDica: 'CONFIGURAR_AGENDA_PUBLICA' }] } })
    const dica = dicas.find((item) => item.chaveDica === 'CONFIGURAR_AGENDA_PUBLICA')

    assert.equal(dica.titulo, 'Configure a agenda pública')
    assert.equal(dica.descricao.length > 0, true)
  })

  it('marcar visualizada local altera status e incrementa visualizacoes', () => {
    salvarDicasUsuarioLocais(obterCatalogoDicasUsuarioLocal())
    marcarDicaUsuarioVisualizadaLocal('CADASTRAR_SERVICOS')
    const dica = dicasUsuario.value.find((item) => item.chaveDica === 'CADASTRAR_SERVICOS')

    assert.equal(dica.status, STATUS_DICA_VISUALIZADA)
    assert.equal(dica.visualizacoes, 1)
  })

  it('dispensar local altera status', () => {
    salvarDicasUsuarioLocais(obterCatalogoDicasUsuarioLocal())
    dispensarDicaUsuarioLocal('ORGANIZAR_ESTOQUE')
    const dica = dicasUsuario.value.find((item) => item.chaveDica === 'ORGANIZAR_ESTOQUE')

    assert.equal(dica.status, STATUS_DICA_DISPENSADA)
  })

  it('reativar local altera status', () => {
    salvarDicasUsuarioLocais([{ chaveDica: 'ORGANIZAR_ESTOQUE', status: 'DISPENSADA' }])
    reativarDicaUsuarioLocal('ORGANIZAR_ESTOQUE')
    const dica = dicasUsuario.value.find((item) => item.chaveDica === 'ORGANIZAR_ESTOQUE')

    assert.equal(dica.status, STATUS_DICA_NAO_VISUALIZADA)
  })

  it('reset local limpa status', () => {
    salvarDicasUsuarioLocais([{ chaveDica: 'CADASTRAR_CLIENTES', status: 'VISUALIZADA', visualizacoes: 3 }])
    resetarDicasUsuarioLocais()
    const dica = dicasUsuario.value.find((item) => item.chaveDica === 'CADASTRAR_CLIENTES')

    assert.equal(dica.status, STATUS_DICA_NAO_VISUALIZADA)
    assert.equal(dica.visualizacoes, 0)
  })

  it('localStorage valido e usado', () => {
    comLocalStorageMock(
      {
        dicasUsuario: JSON.stringify([{ chaveDica: 'CADASTRAR_CLIENTES', status: 'VISUALIZADA' }]),
      },
      () => {
        const dicas = lerDicasUsuarioLocais()

        assert.equal(dicas.find((dica) => dica.chaveDica === 'CADASTRAR_CLIENTES').status, STATUS_DICA_VISUALIZADA)
      },
    )
  })

  it('localStorage invalido cai para catalogo local', async () => {
    await comLocalStorageMock({ dicasUsuario: '{invalido' }, async () => {
      const dicas = await comConsoleErrorSilenciado(() => lerDicasUsuarioLocais())

      assert.equal(dicas.length, DICAS_OBRIGATORIAS.length)
      assert.equal(dicas[0].status, STATUS_DICA_NAO_VISUALIZADA)
    })
  })

  it('chave invalida nao quebra', () => {
    salvarDicasUsuarioLocais(obterCatalogoDicasUsuarioLocal())

    assert.doesNotThrow(() => marcarDicaUsuarioVisualizadaLocal('CHAVE_INEXISTENTE'))
    assert.equal(dicasUsuario.value.length, DICAS_OBRIGATORIAS.length)
  })

  it('status de sincronizacao e representavel', () => {
    assert.deepEqual(STATUS_SINCRONIZACAO_DICAS_VALIDOS, [
      'idle',
      'carregando',
      'salvando',
      'salvo',
      'erro',
      'local',
    ])
    assert.equal(
      obterResumoSincronizacaoDicas({
        estado: 'salvo',
        origem: ORIGEM_DICAS_USUARIO_BACKEND,
      }).rotulo,
      'Sincronizado',
    )
  })

  it('mostrarDicas false nao remove dicas da central', () => {
    const mostrarDicas = false
    const dicas = mergeDicasUsuarioComCatalogo([])

    assert.equal(mostrarDicas, false)
    assert.equal(dicas.length, DICAS_OBRIGATORIAS.length)
  })

  it('usuarioId externo e ignorado se aparecer no payload', () => {
    const dica = normalizarDicaUsuario({
      chaveDica: 'CADASTRAR_CLIENTES',
      usuarioId: 123,
      status: 'VISUALIZADA',
    })

    assert.equal(Object.hasOwn(dica, 'usuarioId'), false)
    assert.equal(dica.status, STATUS_DICA_VISUALIZADA)
  })
})
