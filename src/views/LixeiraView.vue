<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarEmpresas,
  excluirDefinitivoItemLixeiraAdmin,
  listarLixeiraAdmin,
  listarResumoLixeiraAdmin,
  obterMensagemAmigavelErro,
  restaurarItemLixeiraAdmin,
} from '@/services/api'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const TIPO_TODOS = 'TODOS'
const TIPOS_BACKEND_SUPORTADOS = [
  'EMPRESAS',
  'USUARIOS',
  'CLIENTES',
  'SERVICOS',
  'FUNCIONARIOS',
  'PRODUTOS_ESTOQUE',
  'AGENDAMENTOS',
  'OUTROS',
]
const TIPOS_PADRAO = [
  { tipo: 'EMPRESAS', rotulo: 'Empresas' },
  { tipo: 'USUARIOS', rotulo: 'Usuários' },
  { tipo: 'CLIENTES', rotulo: 'Clientes' },
  { tipo: 'SERVICOS', rotulo: 'Serviços' },
  { tipo: 'FUNCIONARIOS', rotulo: 'Funcionários' },
  { tipo: 'PRODUTOS_ESTOQUE', rotulo: 'Produtos/Estoque' },
  { tipo: 'AGENDAMENTOS', rotulo: 'Agendamentos' },
  { tipo: 'OUTROS', rotulo: 'Outros' },
]
const MAPA_ROTULO_TIPO = new Map(TIPOS_PADRAO.map((item) => [item.tipo, item.rotulo]))
const ALIAS_TIPOS = {
  EMPRESA: 'EMPRESAS',
  USUARIO: 'USUARIOS',
  CLIENTE: 'CLIENTES',
  SERVICO: 'SERVICOS',
  FUNCIONARIO: 'FUNCIONARIOS',
  PRODUTO: 'PRODUTOS_ESTOQUE',
  PRODUTOS: 'PRODUTOS_ESTOQUE',
  PRODUTO_ESTOQUE: 'PRODUTOS_ESTOQUE',
  PRODUTOS_ESTOQUES: 'PRODUTOS_ESTOQUE',
  AGENDAMENTO: 'AGENDAMENTOS',
}
const MENSAGEM_RECURSO_NAO_ENCONTRADO = 'Nao foi possivel localizar o conteudo solicitado.'

const filtrosIniciais = {
  tipo: TIPO_TODOS,
  empresaId: '',
  busca: '',
  dataInicial: '',
  dataFinal: '',
}

const filtros = ref({ ...filtrosIniciais })
const empresas = ref([])
const resumoLixeira = ref([])
const resumoCarregado = ref(false)
const resumoIndisponivel = ref(false)
const itensLixeira = ref([])
const paginacao = ref(criarPaginacaoInicial())
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA
const carregando = ref(false)
const carregandoEmpresas = ref(false)
const processandoChave = ref('')
const erro = ref('')
const erroEmpresas = ref('')
const sucesso = ref('')

const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(
  () => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages,
)

const mapaResumo = computed(() => {
  const mapa = new Map(TIPOS_BACKEND_SUPORTADOS.map((tipo) => [tipo, 0]))
  if (resumoCarregado.value && !resumoIndisponivel.value) {
    for (const item of resumoLixeira.value) {
      const tipo = normalizarTipo(item.tipo)
      if (!tipo) continue
      mapa.set(tipo, numeroSeguro(item.total))
    }
    return mapa
  }

  if (resumoIndisponivel.value) {
    for (const item of itensLixeira.value) {
      const tipo = obterTipoItemApi(item)
      if (!tipo) continue
      mapa.set(tipo, (mapa.get(tipo) || 0) + 1)
    }
  }

  return mapa
})

const entidadesDisponiveis = computed(() => {
  return [{ tipo: TIPO_TODOS, rotulo: 'Todos' }, ...TIPOS_PADRAO]
})

onMounted(() => {
  carregarEmpresasFiltro()
  carregarLixeira()
})

async function carregarEmpresasFiltro() {
  try {
    carregandoEmpresas.value = true
    erroEmpresas.value = ''
    empresas.value = normalizarLista(await buscarEmpresas())
  } catch (error) {
    empresas.value = []
    erroEmpresas.value = 'Nao foi possivel carregar a lista de empresas.'
    console.error(error)
  } finally {
    carregandoEmpresas.value = false
  }
}

async function carregarLixeira() {
  if (!datasValidas()) {
    erro.value = 'A data inicial nao pode ser maior que a data final.'
    return
  }

  const filtrosConsulta = montarFiltrosConsulta()

  try {
    carregando.value = true
    erro.value = ''
      sucesso.value = ''
      resumoIndisponivel.value = false

    const [respostaItens, respostaResumo] = await Promise.allSettled([
      listarLixeiraAdmin(filtros.value.tipo, {
        ...filtrosConsulta,
        page: paginacao.value.page,
        size: paginacao.value.size,
      }),
      listarResumoLixeiraAdmin(filtrosConsulta),
    ])

    if (respostaItens.status === 'rejected') {
      throw respostaItens.reason
    }

    const dadosPaginados = normalizarRespostaPaginada(respostaItens.value, paginacao.value)
    itensLixeira.value = dadosPaginados.content
    paginacao.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }

    if (
      dadosPaginados.paginada &&
      dadosPaginados.page > 0 &&
      dadosPaginados.content.length === 0 &&
      dadosPaginados.totalElements > 0
    ) {
      const ultimaPaginaValida = Math.max(dadosPaginados.totalPages - 1, 0)

      if (ultimaPaginaValida !== dadosPaginados.page) {
        paginacao.value.page = ultimaPaginaValida
        await carregarLixeira()
        return
      }
    }

    if (respostaResumo.status === 'fulfilled') {
      resumoLixeira.value = normalizarResumoLixeira(respostaResumo.value)
      resumoCarregado.value = true
      resumoIndisponivel.value = false
    } else {
      resumoLixeira.value = []
      resumoCarregado.value = true
      resumoIndisponivel.value = true
      console.error('Resumo da lixeira indisponivel:', respostaResumo.reason)
    }
  } catch (error) {
    if (error?.status === 404) {
      erro.value = 'Endpoint da Lixeira Global nao encontrado na API HML. Verifique o deploy do backend.'
    } else {
      erro.value = obterMensagemAmigavelErro(
        error,
        'Nao foi possivel carregar a lixeira global. Tente novamente em instantes.',
      )
    }
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function selecionarTipo(tipo) {
  const tipoNormalizado = tipo === TIPO_TODOS ? TIPO_TODOS : normalizarTipo(tipo)

  if (!tipoNormalizado || filtros.value.tipo === tipoNormalizado) {
    return
  }

  filtros.value.tipo = tipoNormalizado
  paginacao.value.page = 0
  carregarLixeira()
}

function aplicarFiltros() {
  filtros.value.tipo = filtros.value.tipo === TIPO_TODOS ? TIPO_TODOS : normalizarTipo(filtros.value.tipo) || TIPO_TODOS
  paginacao.value.page = 0
  carregarLixeira()
}

function limparFiltros() {
  filtros.value = { ...filtrosIniciais }
  paginacao.value.page = 0
  carregarLixeira()
}

function alterarTamanhoPagina() {
  paginacao.value.page = 0
  carregarLixeira()
}

function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) return

  paginacao.value.page = Math.max(0, paginacao.value.page - 1)
  carregarLixeira()
}

function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) return

  paginacao.value.page += 1
  carregarLixeira()
}

function estaProcessando(acao, item) {
  return processandoChave.value === criarChaveProcessamento(acao, item)
}

async function restaurar(item) {
  if (!item?.id) return

  const tipo = obterTipoItemApi(item)

  if (!tipo) {
    erro.value = 'Nao foi possivel identificar o tipo do item para restauracao.'
    return
  }

  const chave = criarChaveProcessamento('restaurar', item)

  try {
    processandoChave.value = chave
    erro.value = ''
    sucesso.value = ''

    await restaurarItemLixeiraAdmin(tipo, item.id)
    await removerItemDaListaAtual(item)
    await carregarLixeira()
    sucesso.value = 'Registro restaurado com sucesso.'
  } catch (error) {
    erro.value = montarMensagemErroOperacao('restaurar', error)
    console.error(error)
  } finally {
    if (processandoChave.value === chave) {
      processandoChave.value = ''
    }
  }
}

async function excluirDefinitivamente(item) {
  if (!item?.id) return

  const tipo = obterTipoItemApi(item)

  if (!tipo) {
    erro.value = 'Nao foi possivel identificar o tipo do item para exclusao definitiva.'
    return
  }

  const confirmou = window.confirm(
    'Confirme a exclusao definitiva. Essa acao e irreversivel e o registro nao podera ser restaurado.',
  )

  if (!confirmou) {
    return
  }

  const chave = criarChaveProcessamento('excluir', item)

  try {
    processandoChave.value = chave
    erro.value = ''
    sucesso.value = ''

    await excluirDefinitivoItemLixeiraAdmin(tipo, item.id)
    await removerItemDaListaAtual(item)
    await carregarLixeira()
    sucesso.value = 'Item excluido definitivamente com sucesso.'
  } catch (error) {
    erro.value = montarMensagemErroOperacao('excluir', error)
    console.error(error)
  } finally {
    if (processandoChave.value === chave) {
      processandoChave.value = ''
    }
  }
}

async function removerItemDaListaAtual(itemRemovido) {
  const tipoRemovido = obterTipoItemApi(itemRemovido)
  const idRemovido = String(itemRemovido?.id || '')
  const totalAntes = itensLixeira.value.length

  itensLixeira.value = itensLixeira.value.filter((item) => {
    const mesmoId = String(item.id) === idRemovido
    const mesmoTipo = obterTipoItemApi(item) === tipoRemovido
    return !(mesmoId && mesmoTipo)
  })

  if (itensLixeira.value.length !== totalAntes) {
    paginacao.value.totalElements = Math.max(0, paginacao.value.totalElements - 1)
    paginacao.value.numberOfElements = Math.max(0, paginacao.value.numberOfElements - 1)
  }

  if (!itensLixeira.value.length && paginacao.value.page > 0) {
    paginacao.value.page = Math.max(0, paginacao.value.page - 1)
    await carregarLixeira()
    return
  }

  await atualizarResumo()
}

async function atualizarResumo() {
  try {
    const resposta = await listarResumoLixeiraAdmin(montarFiltrosConsulta())
    resumoLixeira.value = normalizarResumoLixeira(resposta)
    resumoCarregado.value = true
    resumoIndisponivel.value = false
  } catch (error) {
    resumoLixeira.value = []
    resumoCarregado.value = true
    resumoIndisponivel.value = true
    console.error('Nao foi possivel atualizar o resumo da lixeira:', error)
  }
}

function montarFiltrosConsulta() {
  return limparVazios({
    empresaId: filtros.value.empresaId,
    busca: filtros.value.busca,
    dataInicial: normalizarData(filtros.value.dataInicial),
    dataFinal: normalizarData(filtros.value.dataFinal),
    dataInicio: normalizarData(filtros.value.dataInicial),
    dataFim: normalizarData(filtros.value.dataFinal),
  })
}

function datasValidas() {
  const dataInicial = normalizarData(filtros.value.dataInicial)
  const dataFinal = normalizarData(filtros.value.dataFinal)

  return !(dataInicial && dataFinal && dataInicial > dataFinal)
}

function normalizarData(valor) {
  const data = String(valor || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : ''
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) {
    return valor
  }

  return valor?.content || valor?.items || valor?.dados || valor?.data || []
}

function normalizarResumoLixeira(resposta) {
  const lista = []

  if (Array.isArray(resposta)) {
    for (const item of resposta) {
      const tipo = normalizarTipo(obterCampo(item, 'tipo', 'entidade', 'entityType', 'nomeTipo'))
      const total = numeroSeguro(obterCampo(item, 'total', 'quantidade', 'count', 'qtd'))

      if (!tipo) continue

      lista.push({
        tipo,
        rotulo: mapearRotuloTipo(tipo),
        total,
      })
    }

    return lista
  }

  if (!resposta || typeof resposta !== 'object') {
    return []
  }

  const objeto = resposta.data && typeof resposta.data === 'object' && !Array.isArray(resposta.data) ? resposta.data : resposta
  const possivelMapa =
    extrairPrimeiroObjetoValido(
      objeto?.resumo,
      objeto?.totais,
      objeto?.porTipo,
      objeto?.tipos,
      objeto?.countByType,
      objeto,
    ) || {}
  const chavesIgnoradas = new Set([
    'PAGE',
    'SIZE',
    'TOTAL',
    'TOTALELEMENTS',
    'TOTALPAGES',
    'FIRST',
    'LAST',
    'NUMBER',
    'NUMBERELEMENTS',
    'CONTENT',
    'DATA',
    'ITEMS',
    'ITENS',
    'DADOS',
    'TOTALREGISTROS',
  ])

  for (const [chave, valor] of Object.entries(possivelMapa)) {
    const tipo = normalizarTipo(chave)

    if (!tipo || chavesIgnoradas.has(normalizarTipo(chave).replace(/_/g, ''))) {
      continue
    }

    lista.push({
      tipo,
      rotulo: mapearRotuloTipo(tipo),
      total: numeroSeguro(valor),
    })
  }

  return lista
}

function numeroSeguro(valor) {
  const numero = Number(typeof valor === 'object' ? obterCampo(valor, 'total', 'count', 'quantidade') : valor)
  return Number.isFinite(numero) ? numero : 0
}

function extrairPrimeiroObjetoValido(...candidatos) {
  for (const candidato of candidatos) {
    if (candidato && typeof candidato === 'object' && !Array.isArray(candidato)) {
      return candidato
    }
  }

  return null
}

function obterCampo(origem, ...campos) {
  for (const campo of campos) {
    const valor = origem?.[campo]

    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return valor
    }
  }

  return ''
}

function normalizarTipo(valor) {
  const tipoBruto = String(valor || '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, '_')
  const tipo = ALIAS_TIPOS[tipoBruto] || tipoBruto

  if (!tipo || tipo === TIPO_TODOS || tipo === 'ALL') {
    return ''
  }

  if (TIPOS_BACKEND_SUPORTADOS.includes(tipo)) {
    return tipo
  }

  return ''
}

function mapearRotuloTipo(tipo) {
  const tipoNormalizado = normalizarTipo(tipo)
  const rotuloPadrao = MAPA_ROTULO_TIPO.get(tipoNormalizado)

  if (rotuloPadrao) {
    return rotuloPadrao
  }

  if (!tipoNormalizado) {
    return 'Todos'
  }

  return tipoNormalizado
    .split('_')
    .filter(Boolean)
    .map((parte) => parte.charAt(0) + parte.slice(1).toLowerCase())
    .join(' ')
}

function totalPorTipo(tipo) {
  if (tipo === TIPO_TODOS) {
    if (resumoIndisponivel.value) {
      return itensLixeira.value.length
    }
    return TIPOS_BACKEND_SUPORTADOS.reduce((acumulado, tipoAtual) => acumulado + (mapaResumo.value.get(tipoAtual) || 0), 0)
  }

  const tipoNormalizado = normalizarTipo(tipo)

  if (!tipoNormalizado) {
    return 0
  }

  return mapaResumo.value.get(tipoNormalizado) ?? 0
}

function obterTipoItemApi(item) {
  const tipoItem = normalizarTipo(obterCampo(item, 'tipo', 'entidade', 'entityType', 'tipoRegistro', 'tipoOficial'))

  if (tipoItem) {
    return tipoItem
  }

  const tipoFallbackDescricao = normalizarTipo(
    obterCampo(item, 'entidadeTipo', 'entity', 'entityName', 'tipoDescricao', 'origemTipo'),
  )
  if (tipoFallbackDescricao) {
    return tipoFallbackDescricao
  }
  const tipoFiltro = normalizarTipo(filtros.value.tipo)
  return filtros.value.tipo === TIPO_TODOS ? '' : tipoFiltro || ''
}

function obterTipoItemRotulo(item) {
  return mapearRotuloTipo(obterTipoItemApi(item))
}

function obterNomePrincipal(item) {
  return (
    obterCampo(
      item,
      'nome',
      'titulo',
      'descricao',
      'nomePrincipal',
      'razaoSocial',
      'nomeFantasia',
      'clienteNome',
      'servicoNome',
      'funcionarioNome',
      'usuarioNome',
      'email',
      'codigo',
      'sku',
    ) || `Registro #${item?.id || '-'}`
  )
}

function obterEmpresaNome(item) {
  const empresa = obterCampo(
    item,
    'empresaNome',
    'nomeEmpresa',
    'empresaRazaoSocial',
    'empresaFantasia',
  )

  if (empresa) {
    return empresa
  }

  if (item?.empresa && typeof item.empresa === 'object') {
    return obterCampo(item.empresa, 'nome', 'razaoSocial', 'nomeFantasia') || '-'
  }

  return '-'
}

function obterStatusOriginal(item) {
  return obterCampo(item, 'statusOriginal', 'status', 'situacaoOriginal') || '-'
}

function obterUsuarioResponsavel(item) {
  return (
    obterCampo(
      item,
      'usuarioResponsavel',
      'excluidoPor',
      'usuarioExclusao',
      'usuarioExclusaoNome',
      'deletedBy',
    ) || '-'
  )
}

function obterMotivoExclusao(item) {
  return obterCampo(item, 'motivo', 'motivoExclusao', 'reason') || '-'
}

function obterDataExclusao(item) {
  return obterCampo(item, 'dataExclusao', 'excluidoEm', 'deletedAt', 'dataRemocao') || ''
}

function formatarDataHora(valor) {
  if (!valor) {
    return '-'
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return String(valor)
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function criarChaveProcessamento(acao, item) {
  return `${acao}:${obterTipoItemApi(item)}:${item?.id || ''}`
}

function montarMensagemErroOperacao(acao, error) {
  const mensagemApi = obterMensagemAmigavelErro(error, '').trim()
  const mensagemGenericaNaoEncontrado = !mensagemApi || mensagemApi === MENSAGEM_RECURSO_NAO_ENCONTRADO

  if (error?.status === 403) {
    return acao === 'restaurar'
      ? 'Voce nao tem permissao para restaurar este item.'
      : 'Voce nao tem permissao para excluir definitivamente este item.'
  }

  if (error?.status === 409) {
    return mensagemApi || 'Nao foi possivel concluir a operacao devido a vinculos ativos deste item.'
  }

  if (error?.status === 404) {
    return acao === 'restaurar'
      ? 'Este item nao esta mais disponivel para restauracao. Atualize a listagem.'
      : 'Este item nao esta mais disponivel para exclusao definitiva. Atualize a listagem.'
  }

  if (!mensagemGenericaNaoEncontrado) {
    return mensagemApi
  }

  return acao === 'restaurar'
    ? 'Nao foi possivel restaurar o item. Tente novamente.'
    : 'Nao foi possivel excluir definitivamente o item. Tente novamente.'
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração NuvemMais</p>
        <h1>Lixeira Global</h1>
        <p class="descricao">
          Centralize restauração e exclusão definitiva de registros removidos logicamente em toda a plataforma.
        </p>
        <p class="observacao-super-admin">
          Esta área é exclusiva para SUPER_ADMIN e consolida registros de todas as empresas.
        </p>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <section v-if="erroEmpresas" class="card feedback aviso">
      <p>{{ erroEmpresas }}</p>
    </section>

    <section class="card filtros">
      <div class="abas-entidade" role="tablist" aria-label="Entidades da lixeira">
        <button
          v-for="opcao in entidadesDisponiveis"
          :key="opcao.tipo"
          type="button"
          class="aba-entidade"
          :class="{ ativa: filtros.tipo === opcao.tipo }"
          @click="selecionarTipo(opcao.tipo)"
        >
          <span>{{ opcao.rotulo }}</span>
          <small>Clique para filtrar</small>
          <strong>{{ totalPorTipo(opcao.tipo) }}</strong>
        </button>
      </div>
      <p v-if="resumoIndisponivel" class="observacao-resumo">
        Resumo global temporariamente indisponível. Contadores exibem apenas a lista atual até a API voltar.
      </p>

      <div class="campos">
        <label>
          Entidade/Tipo
          <select v-model="filtros.tipo" :disabled="carregando" @change="aplicarFiltros">
            <option v-for="opcao in entidadesDisponiveis" :key="`filtro-${opcao.tipo}`" :value="opcao.tipo">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Empresa
          <select v-model="filtros.empresaId" :disabled="carregandoEmpresas">
            <option value="">Todas as empresas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || empresa.razaoSocial || 'Empresa sem nome' }}
            </option>
          </select>
        </label>

        <label>
          Busca textual
          <input v-model="filtros.busca" type="text" placeholder="Nome, e-mail, código, motivo..." />
        </label>

        <label>
          Data inicial
          <input v-model="filtros.dataInicial" type="date" />
        </label>

        <label>
          Data final
          <input v-model="filtros.dataFinal" type="date" />
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="aplicarFiltros">
          Filtrar
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </section>

    <section class="card cabecalho-lista">
      <div>
        <h2>Itens na lixeira</h2>
        <p>Use Restaurar para reativar o registro ou Excluir definitivamente para remoção irreversível.</p>
      </div>
      <span class="contador">{{ paginacao.totalElements }} registro(s)</span>
    </section>

    <section class="card lista">
      <p v-if="carregando" class="estado">Carregando registros da lixeira...</p>
      <p v-else-if="!itensLixeira.length" class="estado vazio">
        Nenhum registro encontrado na lixeira para os filtros atuais.
      </p>

      <div v-else class="cards-lixeira">
        <article v-for="item in itensLixeira" :key="`${obterTipoItemApi(item)}-${item.id}`" class="item-lixeira">
          <div class="topo-item">
            <div class="titulo-item">
              <h3>{{ obterNomePrincipal(item) }}</h3>
              <p>ID: {{ item.id }} - {{ obterTipoItemRotulo(item) }}</p>
            </div>

            <div class="acoes-item">
              <button
                class="botao principal"
                :disabled="estaProcessando('restaurar', item)"
                @click="restaurar(item)"
              >
                {{ estaProcessando('restaurar', item) ? 'Restaurando...' : 'Restaurar' }}
              </button>
              <button
                class="botao perigo"
                :disabled="estaProcessando('excluir', item)"
                @click="excluirDefinitivamente(item)"
              >
                {{ estaProcessando('excluir', item) ? 'Excluindo...' : 'Excluir definitivamente' }}
              </button>
            </div>
          </div>

          <dl>
            <div>
              <dt>Empresa vinculada</dt>
              <dd>{{ obterEmpresaNome(item) }}</dd>
            </div>
            <div>
              <dt>Status original</dt>
              <dd>{{ obterStatusOriginal(item) }}</dd>
            </div>
            <div>
              <dt>Data de exclusão</dt>
              <dd>{{ formatarDataHora(obterDataExclusao(item)) }}</dd>
            </div>
            <div>
              <dt>Usuario responsavel</dt>
              <dd>{{ obterUsuarioResponsavel(item) }}</dd>
            </div>
            <div class="item-largo">
              <dt>Motivo</dt>
              <dd>{{ obterMotivoExclusao(item) }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>

    <section v-if="!carregando" class="card paginacao">
      <p class="resumo-paginacao">
        {{ paginacao.totalElements }} registro(s) - Pagina {{ paginaAtualHumana }} de {{ paginacao.totalPages }}
      </p>
      <label class="tamanho-pagina">
        Registros por pagina
        <select v-model.number="paginacao.size" :disabled="carregando" @change="alterarTamanhoPagina">
          <option v-for="opcao in opcoesTamanhoPagina" :key="`lix-${opcao}`" :value="opcao">
            {{ opcao }}
          </option>
        </select>
      </label>
      <div class="botoes-paginacao">
        <button class="botao secundario" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
          Anterior
        </button>
        <button class="botao secundario" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
          Proxima
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 20px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
h3,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

h2 {
  font-size: 22px;
}

.descricao {
  margin-top: 6px;
  color: #64748b;
}

.observacao-super-admin {
  margin-top: 10px;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 700;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.feedback.aviso {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.filtros {
  display: grid;
  gap: 18px;
}

.abas-entidade {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.aba-entidade {
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  background: white;
  color: #334155;
  padding: 8px 12px;
  cursor: pointer;
  display: grid;
  gap: 3px;
  text-align: left;
  min-width: 120px;
}

.aba-entidade span {
  font-size: 13px;
  font-weight: 800;
}

.aba-entidade small {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.aba-entidade strong {
  font-size: 13px;
  color: #64748b;
}

.aba-entidade.ativa {
  background: #0f172a;
  border-color: #0f172a;
  color: white;
}

.aba-entidade.ativa strong {
  color: #cbd5e1;
}

.aba-entidade.ativa small {
  color: #cbd5e1;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input,
select {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.acoes,
.acoes-item,
.topo-item,
.cabecalho-lista,
.paginacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.cabecalho-lista p {
  color: #64748b;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 800;
  white-space: nowrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 14px;
  color: white;
  cursor: pointer;
  font-weight: 800;
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.perigo {
  background: #dc2626;
}

.lista {
  display: grid;
  gap: 12px;
}

.estado {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.vazio {
  padding: 2px 0;
}

.cards-lixeira {
  display: grid;
  gap: 14px;
}

.item-lixeira {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px;
  background: #f8fafc;
  display: grid;
  gap: 14px;
}

.titulo-item {
  display: grid;
  gap: 4px;
}

.titulo-item h3 {
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
  line-height: 1.15;
}

.titulo-item p {
  color: #475569;
  font-weight: 700;
}

dl {
  margin: 0;
  display: grid;
  grid-template-columns: repeat(4, minmax(140px, 1fr));
  gap: 12px;
}

dl div {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  padding: 12px;
  display: grid;
  gap: 4px;
}

.item-largo {
  grid-column: span 2;
}

dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 0;
  color: #0f172a;
  font-weight: 700;
  word-break: break-word;
}

.resumo-paginacao {
  margin: 0;
  color: #334155;
  font-weight: 700;
}

.tamanho-pagina {
  display: flex;
  align-items: center;
  gap: 8px;
}

.tamanho-pagina select {
  min-width: 84px;
}

.botoes-paginacao {
  display: flex;
  align-items: center;
  gap: 10px;
}

@media (max-width: 1024px) {
  .campos,
  dl {
    grid-template-columns: 1fr;
  }

  .item-largo {
    grid-column: auto;
  }

  .acoes-item {
    width: 100%;
    justify-content: flex-start;
  }
}

@media (max-width: 640px) {
  .card {
    padding: 16px;
  }

  h1 {
    font-size: 26px;
  }

  .aba-entidade {
    min-width: 104px;
  }
}
</style>
