import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  CATALOGO_ATALHOS_USUARIO_LOCAL,
  MODULO_ATALHO_GERAL,
  STATUS_SINCRONIZACAO_ATALHOS_VALIDOS,
  TIPO_ATALHO_TELA,
  atalhosPersonalizadosUsuario,
  atalhosUsuario,
  criarAtalhoPersonalizadoUsuarioLocal,
  criarPayloadAtalhoUsuarioBackend,
  fixarAtalhoUsuarioTopoLocal,
  lerAtalhosUsuarioLocais,
  marcarFavoritoAtalhoUsuarioLocal,
  mergeAtalhosUsuarioComCatalogo,
  montarResumoAtalhosUsuario,
  normalizarAtalhoUsuario,
  normalizarModuloAtalho,
  normalizarRotaAtalho,
  normalizarTipoAtalho,
  obterAtalhosRapidosUsuario,
  obterCatalogoAtalhosUsuarioLocal,
  ocultarAtalhoUsuarioLocal,
  reordenarAtalhosUsuarioLocal,
  removerAtalhoPersonalizadoUsuarioLocal,
  resetarAtalhosUsuarioLocais,
  rotaInternaValidaAtalho,
  salvarAtalhosUsuarioLocais,
  atualizarAtalhoPersonalizadoUsuarioLocal,
  validarPayloadAtalhoPersonalizadoUsuario,
} from './atalhosUsuario.js'

const ATALHOS_OBRIGATORIOS = [
  'DASHBOARD',
  'MINHA_CONTA',
  'MINHA_EMPRESA',
  'AJUDA',
  'CLIENTES',
  'NOVO_CLIENTE',
  'AGENDAMENTOS',
  'NOVO_AGENDAMENTO',
  'SERVICOS',
  'FUNCIONARIOS',
  'ESTOQUE',
  'NOVO_PRODUTO',
  'CATALOGO_PUBLICO',
  'PERSONALIZACAO_PUBLICA',
  'NOTIFICACOES',
  'AUDITORIA',
  'LIXEIRA',
  'MEU_PLANO',
  'ESPORTIVO_TURMAS',
  'ESPORTIVO_FREQUENCIA',
  'ESPORTIVO_FINANCEIRO',
  'ADMIN_EMPRESAS',
  'ADMIN_PLANOS',
  'ADMIN_FATURAS',
  'ADMIN_SOLICITACOES_CADASTRO',
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

describe('atalhosUsuario', () => {
  it('catalogo local contem todos os atalhos obrigatorios', () => {
    const chaves = CATALOGO_ATALHOS_USUARIO_LOCAL.map((atalho) => atalho.chaveAtalho)

    assert.equal(chaves.length, ATALHOS_OBRIGATORIOS.length)
    for (const chave of ATALHOS_OBRIGATORIOS) {
      assert.ok(chaves.includes(chave))
    }
  })

  it('normaliza atalho valido', () => {
    assert.deepEqual(
      normalizarAtalhoUsuario({
        chaveAtalho: 'clientes',
        titulo: 'Clientes',
        descricao: 'Abrir clientes.',
        modulo: 'clientes',
        tipo: 'acao',
        rota: '/clientes',
        icone: 'CL',
        favorito: true,
        oculto: false,
        fixado: true,
        ordem: '2',
      }),
      {
        chaveAtalho: 'CLIENTES',
        titulo: 'Clientes',
        descricao: 'Abrir clientes.',
        modulo: 'CLIENTES',
        tipo: 'ACAO',
        rota: '/clientes',
        icone: 'CL',
        favorito: true,
        oculto: false,
        fixado: true,
        ordem: 2,
        personalizado: false,
        atualizadoEm: '',
      },
    )
  })

  it('atalho incompleto recebe fallback', () => {
    const atalho = normalizarAtalhoUsuario({ chaveAtalho: 'MINHA_CONTA' })

    assert.equal(atalho.titulo, 'Minha conta')
    assert.equal(atalho.rota, '/minha-conta')
  })

  it('modulo invalido cai para GERAL', () => {
    assert.equal(normalizarModuloAtalho('financeiro'), MODULO_ATALHO_GERAL)
  })

  it('tipo invalido cai para TELA', () => {
    assert.equal(normalizarTipoAtalho('externo'), TIPO_ATALHO_TELA)
  })

  it('rota externa invalida e rejeitada de forma segura', () => {
    assert.equal(rotaInternaValidaAtalho('https://exemplo.com'), false)
    assert.equal(normalizarRotaAtalho('https://exemplo.com'), '')
  })

  it('resumo conta favoritos, ocultos, fixados e personalizados', () => {
    const resumo = montarResumoAtalhosUsuario(
      [
        { chaveAtalho: 'CLIENTES', favorito: true },
        { chaveAtalho: 'SERVICOS', oculto: true },
        { chaveAtalho: 'ESTOQUE', fixado: true },
      ],
      [{ id: '1', titulo: 'Atalho', rota: '/clientes' }],
    )

    assert.equal(resumo.total, 4)
    assert.equal(resumo.favoritos, 2)
    assert.equal(resumo.ocultos, 1)
    assert.equal(resumo.fixados, 1)
    assert.equal(resumo.personalizados, 1)
  })

  it('merge backend + catalogo local preserva catalogo', () => {
    const atalhos = mergeAtalhosUsuarioComCatalogo([{ chaveAtalho: 'CLIENTES', favorito: true }])

    assert.equal(atalhos.length, ATALHOS_OBRIGATORIOS.length)
    assert.equal(atalhos.find((atalho) => atalho.chaveAtalho === 'CLIENTES').favorito, true)
    assert.ok(atalhos.find((atalho) => atalho.chaveAtalho === 'ADMIN_PLANOS'))
  })

  it('payload backend incompleto usa fallback local', () => {
    const atalhos = mergeAtalhosUsuarioComCatalogo({ data: { atalhos: [{ chaveAtalho: 'AGENDAMENTOS' }] } })
    const atalho = atalhos.find((item) => item.chaveAtalho === 'AGENDAMENTOS')

    assert.equal(atalho.titulo, 'Agenda')
    assert.equal(atalho.rota, '/agenda')
  })

  it('marcar favorito local', () => {
    salvarAtalhosUsuarioLocais(obterCatalogoAtalhosUsuarioLocal())
    marcarFavoritoAtalhoUsuarioLocal('CLIENTES')

    assert.equal(atalhosUsuario.value.find((item) => item.chaveAtalho === 'CLIENTES').favorito, true)
  })

  it('ocultar local', () => {
    salvarAtalhosUsuarioLocais(obterCatalogoAtalhosUsuarioLocal())
    ocultarAtalhoUsuarioLocal('SERVICOS')

    assert.equal(atalhosUsuario.value.find((item) => item.chaveAtalho === 'SERVICOS').oculto, true)
  })

  it('fixar no topo local', () => {
    salvarAtalhosUsuarioLocais(obterCatalogoAtalhosUsuarioLocal())
    fixarAtalhoUsuarioTopoLocal('ESTOQUE')
    const atalho = atalhosUsuario.value.find((item) => item.chaveAtalho === 'ESTOQUE')

    assert.equal(atalho.fixado, true)
    assert.equal(atalho.favorito, true)
  })

  it('reordenar local', () => {
    salvarAtalhosUsuarioLocais(obterCatalogoAtalhosUsuarioLocal())
    reordenarAtalhosUsuarioLocal(['ESTOQUE', 'CLIENTES'])

    assert.equal(atalhosUsuario.value.find((item) => item.chaveAtalho === 'ESTOQUE').ordem, 1)
    assert.equal(atalhosUsuario.value.find((item) => item.chaveAtalho === 'CLIENTES').ordem, 2)
  })

  it('reset local', () => {
    salvarAtalhosUsuarioLocais([{ chaveAtalho: 'CLIENTES', favorito: true }])
    resetarAtalhosUsuarioLocais()

    assert.equal(atalhosUsuario.value.find((item) => item.chaveAtalho === 'CLIENTES').favorito, false)
    assert.equal(atalhosPersonalizadosUsuario.value.length, 0)
  })

  it('criar personalizado valido', () => {
    resetarAtalhosUsuarioLocais()
    const resultado = criarAtalhoPersonalizadoUsuarioLocal({ titulo: 'Abrir clientes', rota: '/clientes' })

    assert.equal(resultado.valido, true)
    assert.equal(atalhosPersonalizadosUsuario.value.length, 1)
  })

  it('rejeitar personalizado com titulo grande', () => {
    const resultado = validarPayloadAtalhoPersonalizadoUsuario({
      titulo: 'A'.repeat(81),
      rota: '/clientes',
    })

    assert.equal(resultado.valido, false)
  })

  it('rejeitar personalizado com rota externa', () => {
    const resultado = validarPayloadAtalhoPersonalizadoUsuario({
      titulo: 'Externo',
      rota: 'https://exemplo.com',
    })

    assert.equal(resultado.valido, false)
  })

  it('atualizar personalizado', () => {
    resetarAtalhosUsuarioLocais()
    const criado = criarAtalhoPersonalizadoUsuarioLocal({ titulo: 'Clientes', rota: '/clientes' })
    const atualizado = atualizarAtalhoPersonalizadoUsuarioLocal(criado.atalho.id, { titulo: 'Clientes ativos' })

    assert.equal(atualizado.valido, true)
    assert.equal(atalhosPersonalizadosUsuario.value[0].titulo, 'Clientes ativos')
  })

  it('remover personalizado', () => {
    resetarAtalhosUsuarioLocais()
    const criado = criarAtalhoPersonalizadoUsuarioLocal({ titulo: 'Clientes', rota: '/clientes' })
    removerAtalhoPersonalizadoUsuarioLocal(criado.atalho.id)

    assert.equal(atalhosPersonalizadosUsuario.value.length, 0)
  })

  it('localStorage valido e usado', () => {
    comLocalStorageMock(
      {
        atalhosUsuario: JSON.stringify([{ chaveAtalho: 'CLIENTES', favorito: true }]),
      },
      () => {
        const atalhos = lerAtalhosUsuarioLocais()

        assert.equal(atalhos.find((atalho) => atalho.chaveAtalho === 'CLIENTES').favorito, true)
      },
    )
  })

  it('localStorage invalido cai para catalogo local', async () => {
    await comLocalStorageMock({ atalhosUsuario: '{invalido' }, async () => {
      const atalhos = await comConsoleErrorSilenciado(() => lerAtalhosUsuarioLocais())

      assert.equal(atalhos.length, ATALHOS_OBRIGATORIOS.length)
      assert.equal(atalhos[0].favorito, false)
    })
  })

  it('usuarioId externo e ignorado', () => {
    const atalho = normalizarAtalhoUsuario({
      chaveAtalho: 'CLIENTES',
      usuarioId: 123,
      favorito: true,
    })

    assert.equal(Object.hasOwn(atalho, 'usuarioId'), false)
  })

  it('payload para backend nao envia campos somente leitura', () => {
    const payload = criarPayloadAtalhoUsuarioBackend({
      chaveAtalho: 'CLIENTES',
      titulo: 'Clientes',
      rota: '/clientes',
      favorito: true,
      oculto: false,
      fixado: true,
      ordem: 4,
      usuarioId: 10,
      criadoEm: '2026-07-07',
    })

    assert.deepEqual(payload, {
      favorito: true,
      oculto: false,
      fixado: true,
      ordem: 4,
    })
  })

  it('status de sincronizacao e representavel', () => {
    assert.deepEqual(STATUS_SINCRONIZACAO_ATALHOS_VALIDOS, [
      'idle',
      'carregando',
      'salvando',
      'salvo',
      'erro',
      'local',
    ])
  })

  it('lista de fixados retorna no maximo 3 quando solicitado', () => {
    salvarAtalhosUsuarioLocais([
      { chaveAtalho: 'CLIENTES', fixado: true, favorito: true, ordem: 1 },
      { chaveAtalho: 'SERVICOS', fixado: true, favorito: true, ordem: 2 },
      { chaveAtalho: 'ESTOQUE', fixado: true, favorito: true, ordem: 3 },
      { chaveAtalho: 'AGENDAMENTOS', fixado: true, favorito: true, ordem: 4 },
    ])

    assert.equal(obterAtalhosRapidosUsuario({ limite: 3 }).length, 3)
  })
})
