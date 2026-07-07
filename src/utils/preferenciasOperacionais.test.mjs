import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import {
  ITENS_POR_PAGINA_VALIDOS,
  MODULO_PREFERIDO_AUTO,
  ORIGEM_OPCOES_OPERACIONAIS_LOCAL,
  ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND,
  ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
  PAGINA_INICIAL_DASHBOARD,
  STATUS_SINCRONIZACAO_OPERACIONAIS_VALIDOS,
  STATUS_SINCRONIZACAO_OPERACIONAL_ERRO,
  STATUS_SINCRONIZACAO_OPERACIONAL_SALVO,
  carregarOpcoesPreferenciasOperacionaisBackend,
  carregarPreferenciasOperacionaisBackend,
  criarPayloadPreferenciasOperacionais,
  estadoSincronizacaoOperacionais,
  lerPreferenciasOperacionaisLocais,
  normalizarOpcoesPreferenciasOperacionaisBackend,
  normalizarPreferenciasOperacionais,
  obterOpcoesPreferenciasOperacionaisFallback,
  obterPreferenciasOperacionaisPadrao,
  obterResumoSincronizacaoOperacionais,
  opcoesPreferenciasOperacionais,
  origemOpcoesPreferenciasOperacionais,
  origemPreferenciasOperacionais,
  preferenciasOperacionais,
  resetarPreferenciasOperacionaisBackend,
} from './preferenciasOperacionais.js'

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

function criarPayloadOpcoesOperacionaisBackend(alteracoes = {}) {
  return {
    paginasIniciais: [
      { valor: 'DASHBOARD', nome: 'Dashboard' },
      { valor: 'AGENDAMENTOS', nome: 'Agendamentos' },
      { valor: 'CLIENTES', nome: 'Clientes' },
      { valor: 'ESTOQUE', nome: 'Estoque' },
      { valor: 'ESPORTIVO', nome: 'Gestão Esportiva' },
      { valor: 'MINHA_CONTA', nome: 'Minha conta' },
    ],
    modulosPreferidos: [
      { valor: 'AUTO', nome: 'Automático' },
      { valor: 'AGENDAMENTO', nome: 'Agendamento' },
      { valor: 'ESTOQUE', nome: 'Estoque' },
      { valor: 'ESPORTIVO', nome: 'Gestão Esportiva' },
      { valor: 'ADMIN', nome: 'Administração' },
    ],
    itensPorPagina: ITENS_POR_PAGINA_VALIDOS.map((valor) => ({ valor, nome: `${valor} itens` })),
    ...alteracoes,
  }
}

describe('preferenciasOperacionais', () => {
  it('mantem a preferencia padrao segura', () => {
    assert.deepEqual(obterPreferenciasOperacionaisPadrao(), {
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
  })

  it('normaliza payload valido', () => {
    assert.deepEqual(
      normalizarPreferenciasOperacionais({
        paginaInicial: 'clientes',
        moduloPreferido: 'estoque',
        itensPorPagina: '50',
        mostrarResumoInicial: false,
        mostrarDicas: true,
        confirmarAcoesCriticas: false,
        notificacoesInternasAtivas: true,
        alertasAgendamento: false,
        alertasFinanceiro: true,
        alertasSistema: false,
        atualizadoEm: '2026-07-07T00:00:00',
      }),
      {
        paginaInicial: 'CLIENTES',
        moduloPreferido: 'ESTOQUE',
        itensPorPagina: 50,
        mostrarResumoInicial: false,
        mostrarDicas: true,
        confirmarAcoesCriticas: false,
        notificacoesInternasAtivas: true,
        alertasAgendamento: false,
        alertasFinanceiro: true,
        alertasSistema: false,
        atualizadoEm: '2026-07-07T00:00:00',
      },
    )
  })

  it('valor invalido de paginaInicial cai para padrao', () => {
    assert.equal(normalizarPreferenciasOperacionais({ paginaInicial: 'RELATORIOS' }).paginaInicial, 'DASHBOARD')
  })

  it('valor invalido de moduloPreferido cai para padrao', () => {
    assert.equal(normalizarPreferenciasOperacionais({ moduloPreferido: 'FINANCEIRO' }).moduloPreferido, 'AUTO')
  })

  it('itensPorPagina invalido cai para 20', () => {
    assert.equal(normalizarPreferenciasOperacionais({ itensPorPagina: 999 }).itensPorPagina, 20)
    assert.equal(normalizarPreferenciasOperacionais({ itensPorPagina: 'abc' }).itensPorPagina, 20)
  })

  it('booleans sao normalizados', () => {
    const preferencias = normalizarPreferenciasOperacionais({
      mostrarResumoInicial: 'false',
      mostrarDicas: 'true',
      confirmarAcoesCriticas: 0,
      notificacoesInternasAtivas: 1,
      alertasAgendamento: 'nao',
      alertasFinanceiro: 'sim',
      alertasSistema: null,
    })

    assert.equal(preferencias.mostrarResumoInicial, false)
    assert.equal(preferencias.mostrarDicas, true)
    assert.equal(preferencias.confirmarAcoesCriticas, false)
    assert.equal(preferencias.notificacoesInternasAtivas, true)
    assert.equal(preferencias.alertasAgendamento, false)
    assert.equal(preferencias.alertasFinanceiro, true)
    assert.equal(preferencias.alertasSistema, true)
  })

  it('payload para backend nao envia campos somente leitura', () => {
    assert.deepEqual(
      criarPayloadPreferenciasOperacionais({
        paginaInicial: 'MINHA_CONTA',
        moduloPreferido: 'ADMIN',
        itensPorPagina: 100,
        mostrarResumoInicial: false,
        mostrarDicas: false,
        confirmarAcoesCriticas: true,
        notificacoesInternasAtivas: false,
        alertasAgendamento: true,
        alertasFinanceiro: false,
        alertasSistema: true,
        atualizadoEm: '2026-07-07T00:00:00',
        origem: 'backend',
        status: 'salvo',
      }),
      {
        paginaInicial: 'MINHA_CONTA',
        moduloPreferido: 'ADMIN',
        itensPorPagina: 100,
        mostrarResumoInicial: false,
        mostrarDicas: false,
        confirmarAcoesCriticas: true,
        notificacoesInternasAtivas: false,
        alertasAgendamento: true,
        alertasFinanceiro: false,
        alertasSistema: true,
      },
    )
  })

  it('usa fallback localStorage valido', () => {
    comLocalStorageMock(
      {
        preferenciasOperacionais: JSON.stringify({
          paginaInicial: 'ESTOQUE',
          moduloPreferido: 'ESTOQUE',
          itensPorPagina: 10,
          mostrarDicas: false,
        }),
      },
      () => {
        const preferencias = lerPreferenciasOperacionaisLocais()

        assert.equal(preferencias.paginaInicial, 'ESTOQUE')
        assert.equal(preferencias.moduloPreferido, 'ESTOQUE')
        assert.equal(preferencias.itensPorPagina, 10)
        assert.equal(preferencias.mostrarDicas, false)
      },
    )
  })

  it('localStorage invalido cai para padrao', async () => {
    await comLocalStorageMockAsync({ preferenciasOperacionais: '{invalido' }, async () => {
      const preferencias = await comConsoleErrorSilenciado(() => lerPreferenciasOperacionaisLocais())

      assert.equal(preferencias.paginaInicial, 'DASHBOARD')
      assert.equal(preferencias.moduloPreferido, 'AUTO')
      assert.equal(preferencias.itensPorPagina, 20)
    })
  })

  it('reset retorna padrao', async () => {
    const preferencias = await resetarPreferenciasOperacionaisBackend(async () => ({
      ...obterPreferenciasOperacionaisPadrao(),
      atualizadoEm: '2026-07-07T00:00:00',
    }))

    assert.equal(preferencias.paginaInicial, 'DASHBOARD')
    assert.equal(preferencias.moduloPreferido, 'AUTO')
    assert.equal(estadoSincronizacaoOperacionais.value, STATUS_SINCRONIZACAO_OPERACIONAL_SALVO)
    assert.equal(origemPreferenciasOperacionais.value, ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND)
  })

  it('opcoes incompletas caem no fallback local', async () => {
    const opcoes = await carregarOpcoesPreferenciasOperacionaisBackend(async () =>
      criarPayloadOpcoesOperacionaisBackend({
        paginasIniciais: [{ valor: 'DASHBOARD', nome: 'Dashboard' }],
      }),
    )

    assert.equal(opcoes.paginasIniciais.length, 6)
    assert.equal(opcoes.modulosPreferidos.length, 5)
    assert.equal(opcoes.itensPorPagina.length, 4)
    assert.equal(origemOpcoesPreferenciasOperacionais.value, ORIGEM_OPCOES_OPERACIONAIS_LOCAL)
    assert.deepEqual(opcoes, obterOpcoesPreferenciasOperacionaisFallback())
  })

  it('status de sincronizacao e representavel', async () => {
    assert.deepEqual(STATUS_SINCRONIZACAO_OPERACIONAIS_VALIDOS, [
      'idle',
      'carregando',
      'salvando',
      'salvo',
      'erro',
      'local',
    ])

    assert.equal(
      obterResumoSincronizacaoOperacionais({
        estado: 'salvo',
        origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_BACKEND,
      }).rotulo,
      'Sincronizado',
    )
    assert.equal(
      obterResumoSincronizacaoOperacionais({
        estado: 'erro',
        origem: ORIGEM_PREFERENCIAS_OPERACIONAIS_LOCAL,
      }).rotulo,
      'Erro ao sincronizar',
    )
  })

  it('payload com usuarioId externo e ignorado no frontend', () => {
    assert.deepEqual(
      criarPayloadPreferenciasOperacionais({
        usuarioId: 123,
        paginaInicial: 'AGENDAMENTOS',
        moduloPreferido: 'AGENDAMENTO',
        itensPorPagina: 10,
      }),
      {
        paginaInicial: 'AGENDAMENTOS',
        moduloPreferido: 'AGENDAMENTO',
        itensPorPagina: 10,
        mostrarResumoInicial: true,
        mostrarDicas: true,
        confirmarAcoesCriticas: true,
        notificacoesInternasAtivas: true,
        alertasAgendamento: true,
        alertasFinanceiro: true,
        alertasSistema: true,
      },
    )
  })

  it('prioriza backend valido e localStorage quando o backend falha', async () => {
    await comLocalStorageMockAsync(
      {
        preferenciasOperacionais: JSON.stringify({
          paginaInicial: 'CLIENTES',
          moduloPreferido: 'AGENDAMENTO',
          itensPorPagina: 50,
        }),
      },
      async () => {
        const backend = await carregarPreferenciasOperacionaisBackend(
          async () => ({
            paginaInicial: 'ESPORTIVO',
            moduloPreferido: 'ESPORTIVO',
            itensPorPagina: 100,
          }),
          async () => criarPayloadOpcoesOperacionaisBackend(),
        )

        assert.equal(backend.paginaInicial, 'ESPORTIVO')
        assert.equal(preferenciasOperacionais.value.moduloPreferido, 'ESPORTIVO')
        assert.equal(opcoesPreferenciasOperacionais.value.itensPorPagina.length, 4)

        const local = await comConsoleErrorSilenciado(() =>
          carregarPreferenciasOperacionaisBackend(
            async () => {
              throw new Error('indisponivel')
            },
            async () => normalizarOpcoesPreferenciasOperacionaisBackend(criarPayloadOpcoesOperacionaisBackend()).opcoes,
          ),
        )

        assert.equal(local.paginaInicial, 'ESPORTIVO')
        assert.equal(estadoSincronizacaoOperacionais.value, STATUS_SINCRONIZACAO_OPERACIONAL_ERRO)
      },
    )
  })
})
