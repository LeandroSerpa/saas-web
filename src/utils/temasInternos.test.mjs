import assert from 'node:assert/strict'
import { describe, it } from 'node:test'

import { obterOpcoesTemasPublicos } from './temasPublicos.js'
import {
  TEMA_APARENCIA_CLARO,
  criarVariaveisCssTemaInterno,
  normalizarTemaInterno,
  obterColorSchemeTemaInterno,
  obterOpcoesTemasInternos,
  obterTemaInternoPadrao,
} from './temasInternos.js'
import {
  DENSIDADE_INTERFACE_COMPACTA,
  DENSIDADE_INTERFACE_CONFORTAVEL,
  MODO_NAVEGACAO_APARENCIA_AUTO,
  MODO_NAVEGACAO_APARENCIA_EXPANDIDO,
  ORIGEM_OPCOES_APARENCIA_BACKEND,
  ORIGEM_OPCOES_APARENCIA_LOCAL,
  ORIGEM_PREFERENCIAS_APARENCIA_BACKEND,
  ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
  carregarOpcoesAparenciaBackend,
  carregarPreferenciasAparenciaBackend,
  criarPayloadPreferenciasAparencia,
  estadoSincronizacaoAparencia,
  lerPreferenciasAparenciaLocais,
  normalizarOpcoesAparenciaBackend,
  obterResumoSincronizacaoAparencia,
  opcoesAparencia,
  origemOpcoesAparencia,
  origemPreferenciasAparencia,
  preferenciasAparencia,
  resetarPreferenciasAparenciaBackend,
  salvarPreferenciasAparenciaBackend,
} from './aparencia.js'

const TEMAS_ESTAVEIS_ESPERADOS = [
  'padrao',
  'moderno',
  'escuro',
  'suave',
  'rosa-boutique',
  'rosa-menina',
  'azul-menino',
  'azul-profissional',
  'verde-natural',
  'madeira-artesanal',
  'dourado-premium',
  'lilas-delicado',
  'vermelho-energia',
  'laranja-criativo',
  'preto-elegante',
  'branco-minimalista',
  'pet-shop',
  'barbearia',
  'confeitaria',
  'infantil-colorido',
]

const TOKENS_OBRIGATORIOS = [
  '--app-bg',
  '--app-bg-overlay',
  '--app-surface',
  '--app-surface-soft',
  '--app-surface-strong',
  '--app-text',
  '--app-text-muted',
  '--app-primary',
  '--app-primary-strong',
  '--app-primary-soft',
  '--app-border',
  '--app-focus-ring',
  '--app-overlay',
  '--app-sidebar-bg',
  '--app-sidebar-text',
  '--app-sidebar-muted',
  '--app-sidebar-border',
  '--app-sidebar-link',
  '--app-sidebar-link-active',
  '--app-brand-end',
  '--app-input-disabled-bg',
]

const ALIASES_ANTIGOS_ESPERADOS = [
  'Claro',
  'Moderno',
  'Escuro',
  'Suave',
  'NuvemMais',
  'NuvemMais Azul',
  'Oceano Profissional',
  'Safira Escuro',
  'Esmeralda Gestão',
  'Violeta Premium',
  'Âmbar Executivo',
  'Rubi Moderno',
  'Grafite Corporativo',
  'Aurora Ciano',
  'Terra Elegante',
  'Rosa Criativo',
  'Padrão Claro',
  'Natural Verde',
  'Premium Dourado',
  'Artesanal Madeira',
  'Elegante Grafite',
  'Criativo Coral',
  'Escuro Safira',
]

const CAMPOS_PREVIEW_OBRIGATORIOS = ['fundo', 'superficie', 'primario', 'secundario', 'menu']

function converterHexParaRgb(cor) {
  const match = String(cor || '').match(/^#([0-9a-f]{6})$/i)

  if (!match) {
    return null
  }

  return {
    r: Number.parseInt(match[1].slice(0, 2), 16),
    g: Number.parseInt(match[1].slice(2, 4), 16),
    b: Number.parseInt(match[1].slice(4, 6), 16),
  }
}

function luminancia(cor) {
  const rgb = converterHexParaRgb(cor)

  if (!rgb) {
    return null
  }

  const canais = [rgb.r, rgb.g, rgb.b].map((canal) => {
    const valor = canal / 255
    return valor <= 0.03928 ? valor / 12.92 : ((valor + 0.055) / 1.055) ** 2.4
  })

  return 0.2126 * canais[0] + 0.7152 * canais[1] + 0.0722 * canais[2]
}

function calcularRazaoContraste(corA, corB) {
  const luminanciaA = luminancia(corA)
  const luminanciaB = luminancia(corB)

  if (luminanciaA === null || luminanciaB === null) {
    return null
  }

  const maisClara = Math.max(luminanciaA, luminanciaB)
  const maisEscura = Math.min(luminanciaA, luminanciaB)

  return (maisClara + 0.05) / (maisEscura + 0.05)
}

function extrairHexadecimais(valor) {
  return String(valor || '').match(/#[0-9a-f]{6}/gi) || []
}

function assertContrasteMinimo({ tema, primeiroPlano, fundos, minimo, contexto }) {
  const fundosValidos = fundos.filter(Boolean)
  assert.ok(fundosValidos.length > 0, `${tema} sem fundo para validar ${contexto}`)

  for (const fundo of fundosValidos) {
    const razao = calcularRazaoContraste(primeiroPlano, fundo)
    assert.notEqual(razao, null, `${tema} usa cor invalida em ${contexto}: ${primeiroPlano} sobre ${fundo}`)
    assert.ok(
      razao >= minimo,
      `${tema} com contraste baixo em ${contexto}: ${primeiroPlano} sobre ${fundo} = ${razao.toFixed(2)}`,
    )
  }
}

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

function criarPayloadOpcoesAparenciaBackend(alteracoes = {}) {
  return {
    temas: obterOpcoesTemasInternos().map((tema) => ({
      valor: tema.valor,
      nome: `Backend ${tema.nome}`,
      escuro: tema.escuro,
      descricao: `Descrição backend para ${tema.nome}.`,
    })),
    modosNavegacao: [
      { valor: 'AUTO', nome: 'Automático' },
      { valor: 'EXPANDIDO', nome: 'Expandido' },
      { valor: 'COMPACTO', nome: 'Compacto' },
    ],
    densidadesInterface: [
      { valor: 'CONFORTAVEL', nome: 'Confortável' },
      { valor: 'COMPACTA', nome: 'Compacta' },
    ],
    flags: {
      reduzirAnimacoes: true,
      altoContraste: true,
    },
    temaPadrao: 'padrao',
    ...alteracoes,
  }
}

describe('temasInternos', () => {
  it('exibe todos os temas equivalentes aos temas publicos no seletor', () => {
    const temasPublicos = obterOpcoesTemasPublicos()
    const temasInternos = obterOpcoesTemasInternos()

    assert.equal(temasInternos.length, temasPublicos.length)
    assert.ok(temasInternos.length > 5)
    assert.deepEqual(
      temasInternos.map((tema) => tema.nome),
      temasPublicos.map((tema) => tema.nome),
    )
  })

  it('mantem os 20 valores estaveis do seletor interno', () => {
    const temasInternos = obterOpcoesTemasInternos()

    assert.equal(temasInternos.length, 20)
    assert.deepEqual(
      temasInternos.map((tema) => tema.valor),
      TEMAS_ESTAVEIS_ESPERADOS,
    )

    for (const tema of temasInternos) {
      assert.equal(normalizarTemaInterno(tema.valor), tema.valor)
      assert.equal(typeof tema.valor, 'string')
      assert.match(tema.valor, /^[a-z0-9]+(?:-[a-z0-9]+)*$/)
      assert.equal(typeof tema.nome, 'string')
      assert.ok(tema.nome.trim().length >= 3, `${tema.valor} sem nome amigavel`)
      assert.doesNotMatch(tema.nome, /^[A-Z0-9_]+$/, `${tema.valor} exibindo chave tecnica como nome`)
    }
  })

  it('mantem o tema padrao estavel', () => {
    assert.equal(obterTemaInternoPadrao(), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno(undefined), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno(''), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('claro'), TEMA_APARENCIA_CLARO)
  })

  it('preserva compatibilidade com valores antigos apontando para temas do seletor', () => {
    const opcoesValidas = new Set(obterOpcoesTemasInternos().map((tema) => tema.valor))

    for (const alias of ALIASES_ANTIGOS_ESPERADOS) {
      const tema = normalizarTemaInterno(alias)
      assert.ok(opcoesValidas.has(tema), `${alias} resolveu para ${tema}`)
    }
  })

  it('normaliza entradas invalidas ou com caixa diferente para um tema seguro', () => {
    assert.equal(normalizarTemaInterno(null), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno(undefined), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno(''), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('   '), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('tema-inexistente'), TEMA_APARENCIA_CLARO)
    assert.equal(normalizarTemaInterno('MoDeRnO'), 'moderno')
    assert.equal(normalizarTemaInterno('ÂMBAR EXECUTIVO'), 'dourado-premium')
  })

  it('gera tokens CSS e preview para todos os temas do seletor', () => {
    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)

      for (const token of TOKENS_OBRIGATORIOS) {
        assert.equal(typeof variaveis[token], 'string', `${tema.valor} sem ${token}`)
        assert.ok(variaveis[token].trim(), `${tema.valor} com ${token} vazio`)
      }

      for (const campo of CAMPOS_PREVIEW_OBRIGATORIOS) {
        assert.equal(typeof tema.preview[campo], 'string', `${tema.valor} sem preview.${campo}`)
        assert.ok(tema.preview[campo].trim(), `${tema.valor} com preview.${campo} vazio`)
      }
    }
  })

  it('mantem contraste minimo nos textos principais dos temas', () => {
    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)

      assertContrasteMinimo({
        tema: tema.valor,
        primeiroPlano: variaveis['--app-text'],
        fundos: [variaveis['--app-bg'], variaveis['--app-surface-strong']],
        minimo: 4.5,
        contexto: 'texto principal',
      })

      assertContrasteMinimo({
        tema: tema.valor,
        primeiroPlano: variaveis['--app-text-muted'],
        fundos: [variaveis['--app-bg'], variaveis['--app-surface-strong']],
        minimo: 3,
        contexto: 'texto secundario',
      })
    }
  })

  it('mantem contraste minimo em botoes e sidebar quando ha tokens suficientes', () => {
    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)
      const textoBotao = variaveis['--app-button-primary-text'] || variaveis['--app-primary-text']
      const fundoBotao = variaveis['--app-button-primary-bg'] || variaveis['--app-primary']

      if (textoBotao && fundoBotao) {
        assertContrasteMinimo({
          tema: tema.valor,
          primeiroPlano: textoBotao,
          fundos: [fundoBotao],
          minimo: 4.5,
          contexto: 'botao principal',
        })
      }

      const fundosSidebar = extrairHexadecimais(variaveis['--app-sidebar-bg'])
      assertContrasteMinimo({
        tema: tema.valor,
        primeiroPlano: variaveis['--app-sidebar-text'],
        fundos: fundosSidebar,
        minimo: 3,
        contexto: 'sidebar',
      })
    }
  })

  it('mantem pelo menos um tema escuro realmente escuro', () => {
    const temasEscuros = obterOpcoesTemasInternos().filter(
      (tema) => obterColorSchemeTemaInterno(tema.valor) === 'dark',
    )

    assert.ok(temasEscuros.length >= 1)

    for (const tema of temasEscuros) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)
      assert.ok(luminancia(variaveis['--app-bg']) < 0.18, `${tema.valor} nao tem fundo escuro`)
      assertContrasteMinimo({
        tema: tema.valor,
        primeiroPlano: variaveis['--app-text'],
        fundos: [variaveis['--app-bg']],
        minimo: 4.5,
        contexto: 'tema escuro',
      })
    }
  })

  it('mantem diferenca real de paleta entre os temas', () => {
    const assinaturas = new Set(
      obterOpcoesTemasInternos().map((tema) => {
        const variaveis = criarVariaveisCssTemaInterno(tema.valor)
        return [
          variaveis['--app-bg'],
          variaveis['--app-surface'],
          variaveis['--app-primary'],
          variaveis['--app-sidebar-bg'],
          variaveis['--app-brand-end'],
        ].join('|')
      }),
    )

    assert.ok(assinaturas.size >= obterOpcoesTemasInternos().length - 1)

    const fundos = new Set()
    const primarias = new Set()
    const menus = new Set()
    const acentos = new Set()

    for (const tema of obterOpcoesTemasInternos()) {
      const variaveis = criarVariaveisCssTemaInterno(tema.valor)
      fundos.add(variaveis['--app-bg'])
      primarias.add(variaveis['--app-primary'])
      menus.add(variaveis['--app-sidebar-bg'])
      acentos.add(variaveis['--app-brand-end'])
    }

    assert.ok(fundos.size >= 10, 'temas com poucos fundos diferentes')
    assert.ok(primarias.size >= 12, 'temas com poucas cores primarias diferentes')
    assert.ok(menus.size >= 18, 'temas com poucos menus diferentes')
    assert.ok(acentos.size >= 12, 'temas com poucos acentos diferentes')
  })

  it('mantem o tema independente do modo de navegacao salvo em paralelo', () => {
    const preferencias = {
      modo: 'essencial',
      tema: 'moderno',
    }

    const temaAntes = normalizarTemaInterno(preferencias.tema)
    preferencias.modo = 'completo'

    assert.equal(temaAntes, 'moderno')
    assert.equal(normalizarTemaInterno(preferencias.tema), 'moderno')
  })

  it('usa localStorage como fallback seguro e preserva a chave antiga de tema', () => {
    comLocalStorageMock({ temaAparencia: 'nuvemmais-azul' }, (storage) => {
      const preferencias = lerPreferenciasAparenciaLocais()

      assert.equal(preferencias.temaInterno, 'azul-profissional')
      assert.equal(preferencias.modoNavegacao, MODO_NAVEGACAO_APARENCIA_AUTO)
      assert.equal(preferencias.densidadeInterface, DENSIDADE_INTERFACE_CONFORTAVEL)

      storage.setItem('preferenciasAparencia', JSON.stringify({ temaInterno: 'tema-inexistente' }))
      storage.removeItem('temaAparencia')

      assert.equal(lerPreferenciasAparenciaLocais().temaInterno, TEMA_APARENCIA_CLARO)
    })
  })

  it('usa fallback local quando o endpoint de opcoes falha', async () => {
    const opcoes = await comConsoleErrorSilenciado(() =>
      carregarOpcoesAparenciaBackend(async () => {
        throw new Error('opcoes indisponiveis')
      }),
    )

    assert.equal(opcoes.temas.length, 20)
    assert.deepEqual(
      opcoes.temas.map((tema) => tema.valor),
      TEMAS_ESTAVEIS_ESPERADOS,
    )
    assert.equal(origemOpcoesAparencia.value, ORIGEM_OPCOES_APARENCIA_LOCAL)
  })

  it('usa fallback local quando o payload de opcoes esta incompleto', async () => {
    const opcoes = await carregarOpcoesAparenciaBackend(async () =>
      criarPayloadOpcoesAparenciaBackend({
        temas: [{ valor: 'padrao', nome: 'Padrão backend', escuro: false }],
      }),
    )

    assert.equal(opcoes.temas.length, 20)
    assert.equal(opcoes.temas[0].valor, TEMA_APARENCIA_CLARO)
    assert.equal(opcoes.temas[0].nome, 'Padrão')
    assert.equal(origemOpcoesAparencia.value, ORIGEM_OPCOES_APARENCIA_LOCAL)
  })

  it('usa nomes e descricoes do backend quando opcoes sao validas', async () => {
    const { valido, opcoes } = normalizarOpcoesAparenciaBackend(criarPayloadOpcoesAparenciaBackend())

    assert.equal(valido, true)
    assert.equal(opcoes.temas.length, 20)
    assert.equal(opcoes.temas[0].nome, 'Backend Padrão')
    assert.equal(opcoes.temas[0].descricao, 'Descrição backend para Padrão.')
    assert.equal(typeof opcoes.temas[0].preview.fundo, 'string')
  })

  it('prioriza preferencia do backend quando ela e valida', async () => {
    await comLocalStorageMockAsync(
      {
        preferenciasAparencia: JSON.stringify({ temaInterno: 'moderno' }),
      },
      async () => {
        const preferencias = await carregarPreferenciasAparenciaBackend(
          async () => ({
            temaInterno: 'escuro',
            modoNavegacao: 'EXPANDIDO',
            densidadeInterface: 'COMPACTA',
            reduzirAnimacoes: true,
            altoContraste: true,
            atualizadoEm: '2026-07-06T00:00:00',
          }),
          async () => criarPayloadOpcoesAparenciaBackend(),
        )

        assert.equal(preferencias.temaInterno, 'escuro')
        assert.equal(preferencias.modoNavegacao, MODO_NAVEGACAO_APARENCIA_EXPANDIDO)
        assert.equal(origemPreferenciasAparencia.value, ORIGEM_PREFERENCIAS_APARENCIA_BACKEND)
        assert.equal(origemOpcoesAparencia.value, ORIGEM_OPCOES_APARENCIA_BACKEND)
        assert.equal(opcoesAparencia.value.temas.length, 20)
      },
    )
  })

  it('usa localStorage quando a preferencia do backend falha', async () => {
    await comLocalStorageMockAsync(
      {
        preferenciasAparencia: JSON.stringify({
          temaInterno: 'pet-shop',
          modoNavegacao: 'COMPACTO',
        }),
      },
      async () => {
        const preferencias = await comConsoleErrorSilenciado(() =>
          carregarPreferenciasAparenciaBackend(
            async () => {
              throw new Error('preferencia indisponivel')
            },
            async () => {
              throw new Error('opcoes indisponiveis')
            },
          ),
        )

        assert.equal(preferencias.temaInterno, 'pet-shop')
        assert.equal(origemPreferenciasAparencia.value, ORIGEM_PREFERENCIAS_APARENCIA_LOCAL)
        assert.equal(origemOpcoesAparencia.value, ORIGEM_OPCOES_APARENCIA_LOCAL)
        assert.equal(estadoSincronizacaoAparencia.value, 'erro')
      },
    )
  })

  it('gera o payload esperado para salvar preferencias no backend', async () => {
    const chamadas = []

    await salvarPreferenciasAparenciaBackend(
      {
        temaInterno: 'claro',
        modoNavegacao: 'expandido',
        densidadeInterface: 'compacta',
        reduzirAnimacoes: true,
        altoContraste: true,
      },
      async (payload) => {
        chamadas.push(payload)
        return { ...payload, atualizadoEm: '2026-07-06T00:00:00' }
      },
    )

    assert.deepEqual(chamadas, [
      {
        temaInterno: TEMA_APARENCIA_CLARO,
        modoNavegacao: MODO_NAVEGACAO_APARENCIA_EXPANDIDO,
        densidadeInterface: DENSIDADE_INTERFACE_COMPACTA,
        reduzirAnimacoes: true,
        altoContraste: true,
      },
    ])
    assert.equal(preferenciasAparencia.value.atualizadoEm, '2026-07-06T00:00:00')
  })

  it('normaliza payload direto sem enviar campos somente de leitura', () => {
    assert.deepEqual(
      criarPayloadPreferenciasAparencia({
        temaInterno: 'rosa-menina',
        modoNavegacao: 'AUTO',
        densidadeInterface: 'CONFORTAVEL',
        reduzirAnimacoes: false,
        altoContraste: false,
        atualizadoEm: '2026-07-06T00:00:00',
      }),
      {
        temaInterno: 'rosa-menina',
        modoNavegacao: MODO_NAVEGACAO_APARENCIA_AUTO,
        densidadeInterface: DENSIDADE_INTERFACE_CONFORTAVEL,
        reduzirAnimacoes: false,
        altoContraste: false,
      },
    )
  })

  it('restaura preferencias pelo endpoint de reset e deixa estado salvo', async () => {
    let resetChamado = 0

    const preferencias = await resetarPreferenciasAparenciaBackend(async () => {
      resetChamado += 1
      return {
        temaInterno: 'padrao',
        modoNavegacao: 'AUTO',
        densidadeInterface: 'CONFORTAVEL',
        reduzirAnimacoes: false,
        altoContraste: false,
        atualizadoEm: '2026-07-06T00:00:00',
      }
    })

    assert.equal(resetChamado, 1)
    assert.equal(preferencias.temaInterno, TEMA_APARENCIA_CLARO)
    assert.equal(preferencias.reduzirAnimacoes, false)
    assert.equal(estadoSincronizacaoAparencia.value, 'salvo')
    assert.equal(origemPreferenciasAparencia.value, ORIGEM_PREFERENCIAS_APARENCIA_BACKEND)
  })

  it('representa status de sincronizacao no estado utilitario', () => {
    assert.deepEqual(obterResumoSincronizacaoAparencia({
      estado: 'salvo',
      origem: ORIGEM_PREFERENCIAS_APARENCIA_BACKEND,
      mensagem: '',
    }), {
      rotulo: 'Sincronizado',
      detalhe: 'Preferência vinculada ao seu usuário.',
      tipo: 'sucesso',
    })

    assert.equal(
      obterResumoSincronizacaoAparencia({
        estado: 'ocioso',
        origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
      }).rotulo,
      'Salvo localmente',
    )

    assert.equal(
      obterResumoSincronizacaoAparencia({
        estado: 'erro',
        origem: ORIGEM_PREFERENCIAS_APARENCIA_LOCAL,
      }).rotulo,
      'Erro ao sincronizar',
    )
  })
})
