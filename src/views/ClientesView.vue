<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import ClienteForm from '@/components/ClienteForm.vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarClientes,
  cadastrarCliente,
  atualizarCliente,
  excluirCliente,
  buscarStatusFinanceiroMinhaEmpresa,
  obterEmpresaIdOperacao,
  modoVisualizacaoEmpresaAtivo,
} from '@/services/api'
import {
  formatarDataBrasileira,
  rotuloFrequenciaSemanalBeachTennis,
  rotuloNivelBeachTennis,
  rotuloPerfilBeachTennis,
  rotuloPlanoBeachTennis,
} from '@/utils/beachTennis'
import { carregarContextoGestaoEsportiva, contextoGestaoEsportiva, recarregarContextoGestaoEsportiva } from '@/utils/gestaoEsportiva'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const clientes = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoCliente = ref('')
const clienteEditandoId = ref(null)
const statusFinanceiro = ref(null)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const paginacao = ref(criarPaginacaoInicial())
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA

const cliente = ref(criarClienteInicial())
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(() => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages)
const contextoEsportivo = computed(() => contextoGestaoEsportiva.value)
const moduloEsportivoAtivo = computed(() => contextoEsportivo.value?.ativo === true)
const tituloSecaoEsportiva = computed(() =>
  contextoEsportivo.value?.nomeModalidade === 'Beach Tennis'
    ? 'Dados de Beach Tennis'
    : `Dados esportivos - ${contextoEsportivo.value?.nomeModalidade || 'Esporte'}`,
)

function criarClienteInicial() {
  return {
    nome: '',
    telefone: '',
    email: '',
    observacao: '',
    dataNascimento: '',
    perfilBeachTennis: '',
    nivelBeachTennis: '',
    frequenciaSemanalBeachTennis: '',
    planoBeachTennis: '',
    observacaoBeachTennis: '',
  }
}

function normalizarClienteFormulario(clienteItem = {}) {
  return {
    nome: clienteItem.nome || '',
    telefone: clienteItem.telefone || '',
    email: clienteItem.email || '',
    observacao: clienteItem.observacao || '',
    dataNascimento: clienteItem.dataNascimento || clienteItem.nascimento || '',
    perfilBeachTennis: clienteItem.perfilBeachTennis || '',
    nivelBeachTennis: clienteItem.nivelBeachTennis || '',
    frequenciaSemanalBeachTennis: clienteItem.frequenciaSemanalBeachTennis || '',
    planoBeachTennis: clienteItem.planoBeachTennis || '',
    observacaoBeachTennis: clienteItem.observacaoBeachTennis || '',
  }
}

function montarPayloadCliente() {
  const payload = {
    empresaId: obterEmpresaIdOperacao() ? Number(obterEmpresaIdOperacao()) : '',
    nome: cliente.value.nome || '',
    telefone: cliente.value.telefone || '',
    email: cliente.value.email || '',
    observacao: cliente.value.observacao || '',
  }

  if (moduloEsportivoAtivo.value) {
    return {
      ...payload,
      dataNascimento: cliente.value.dataNascimento || '',
      perfilBeachTennis: cliente.value.perfilBeachTennis || '',
      nivelBeachTennis: cliente.value.nivelBeachTennis || '',
      frequenciaSemanalBeachTennis: cliente.value.frequenciaSemanalBeachTennis || '',
      planoBeachTennis: cliente.value.planoBeachTennis || '',
      observacaoBeachTennis: cliente.value.observacaoBeachTennis || '',
    }
  }

  return payload
}

function temDadosBeachTennis(clienteItem = {}) {
  if (!moduloEsportivoAtivo.value) {
    return false
  }

  return Boolean(
    clienteItem.dataNascimento ||
      clienteItem.nascimento ||
      clienteItem.perfilBeachTennis ||
      clienteItem.nivelBeachTennis ||
      clienteItem.frequenciaSemanalBeachTennis ||
      clienteItem.planoBeachTennis ||
      clienteItem.observacaoBeachTennis,
  )
}

function listaResumoBeachTennis(clienteItem = {}) {
  const itens = []

  const perfil = rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)
  const nivel = rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)
  const frequencia = rotuloFrequenciaSemanalBeachTennis(clienteItem.frequenciaSemanalBeachTennis)
  const plano = rotuloPlanoBeachTennis(clienteItem.planoBeachTennis)
  const nascimento = formatarDataBrasileira(clienteItem.dataNascimento || clienteItem.nascimento)

  if (perfil) itens.push(`Perfil: ${perfil}`)
  if (nivel) itens.push(`Nível: ${nivel}`)
  if (frequencia) itens.push(`Frequência: ${frequencia}`)
  if (plano) itens.push(`Plano: ${plano}`)
  if (nascimento) itens.push(`Nascimento: ${nascimento}`)

  return itens
}

async function carregarClientes() {
  try {
    carregando.value = true
    erro.value = ''

    const resposta = await buscarClientes({
      page: paginacao.value.page,
      size: paginacao.value.size,
    })
    const dadosPaginados = normalizarRespostaPaginada(resposta, paginacao.value)

    clientes.value = dadosPaginados.content
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
        await carregarClientes()
      }
    }
  } catch (error) {
    erro.value = 'Não foi possível carregar os clientes.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarCliente() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Selecione uma empresa no seletor superior para operar esta tela.'
    return
  }

  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''

    if (!clienteEditandoId.value && empresaBloqueadaFinanceiro()) {
      erro.value = 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.'
      return
    }

    if (!cliente.value.nome.trim()) {
      erro.value = 'Informe o nome do cliente.'
      return
    }

    const dadosCliente = montarPayloadCliente()

    if (clienteEditandoId.value) {
      await atualizarCliente(clienteEditandoId.value, dadosCliente)
      mensagemSucessoCliente.value = 'Cliente atualizado com sucesso.'
    } else {
      await cadastrarCliente(dadosCliente)
      mensagemSucessoCliente.value = 'Cliente cadastrado com sucesso.'
    }

    cancelarEdicaoCliente(false)
    await carregarClientes()
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      clienteEditandoId.value
        ? 'Não foi possível atualizar o cliente.'
        : 'Não foi possível cadastrar o cliente.',
    )
    console.error(error)
  }
}

async function enviarClienteParaLixeira(clienteItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  const confirmou = window.confirm(`Deseja enviar o cliente "${clienteItem?.nome || ''}" para a lixeira?`)

  if (!confirmou) {
    return
  }

  const motivoInformado = window.prompt('Motivo da exclusão (opcional):', '')

  if (motivoInformado === null) {
    return
  }

  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''
    await excluirCliente(clienteItem.id, String(motivoInformado || '').trim())
    clientes.value = clientes.value.filter((item) => String(item.id) !== String(clienteItem.id))
    mensagemSucessoCliente.value = 'Registro enviado para a lixeira com sucesso.'

    if (clienteEditandoId.value && String(clienteEditandoId.value) === String(clienteItem.id)) {
      cancelarEdicaoCliente(false)
    }

    await carregarClientes()
  } catch (error) {
    erro.value = obterMensagemErroExclusao(error)
    console.error(error)
  }
}

async function carregarStatusFinanceiro() {
  try {
    statusFinanceiro.value = await buscarStatusFinanceiroMinhaEmpresa()
  } catch (error) {
    statusFinanceiro.value = null
    console.error(error)
  }
}

function empresaBloqueadaFinanceiro() {
  return String(statusFinanceiro.value?.statusFinanceiro || statusFinanceiro.value?.status || '')
    .trim()
    .toUpperCase() === 'BLOQUEADA_FINANCEIRO'
}

function editarCliente(clienteItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  erro.value = ''
  mensagemSucessoCliente.value = ''
  clienteEditandoId.value = clienteItem.id
  cliente.value = normalizarClienteFormulario(clienteItem)
}

function cancelarEdicaoCliente(limparMensagens = true) {
  clienteEditandoId.value = null
  cliente.value = criarClienteInicial()

  if (limparMensagens) {
    mensagemSucessoCliente.value = ''
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

function obterMensagemErroExclusao(error) {
  if (error?.status === 403) {
    return 'Você não tem permissão para excluir este registro.'
  }

  if (error?.status === 404) {
    return 'Registro não encontrado ou já removido.'
  }

  return obterMensagemErro(error, 'Não foi possível enviar o registro para a lixeira. Tente novamente.')
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  paginacao.value.page = Math.max(paginacao.value.page - 1, 0)
  await carregarClientes()
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  paginacao.value.page += 1
  await carregarClientes()
}

async function alterarTamanhoPagina() {
  paginacao.value.page = 0
  await carregarClientes()
}

async function atualizarModoVisualizacao() {
  await recarregarContextoGestaoEsportiva()
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  cancelarEdicaoCliente(false)
  carregarClientes()
  carregarStatusFinanceiro()
}

onMounted(() => {
  carregarContextoGestaoEsportiva()
  carregarClientes()
  carregarStatusFinanceiro()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Relacionamento</p>
        <h1>Clientes</h1>
        <p class="descricao">Consulte a base de clientes e cadastre novos contatos.</p>
      </div>

      <button class="botao secundario" @click="carregarClientes">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso-visualizacao">
      <p>Selecione uma empresa no seletor superior para operar esta tela.</p>
    </section>

    <ClienteForm
      v-if="!modoVisualizacaoEmpresa"
      v-model="cliente"
      :contexto-esportivo="contextoEsportivo"
      :mensagem-sucesso="mensagemSucessoCliente"
      :modo-edicao="Boolean(clienteEditandoId)"
      @salvar="salvarCliente"
      @cancelar="cancelarEdicaoCliente"
    />

    <section class="secao-clientes">
      <div class="cabecalho-lista">
        <div>
          <h2>Clientes cadastrados</h2>
          <p>Consulte e gerencie os clientes cadastrados.</p>
        </div>

        <span class="contador">{{ paginacao.totalElements }} cliente(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando clientes...</p>
      </section>

      <section v-else-if="clientes.length === 0" class="card">
        <p>Nenhum cliente encontrado.</p>
      </section>

      <section v-else class="lista-clientes">
        <article v-for="clienteItem in clientes" :key="clienteItem.id" class="card cliente-card">
          <div class="cabecalho-cliente">
            <div>
              <h3>{{ clienteItem.nome }}</h3>
              <p class="email">{{ exibirValor(clienteItem.email) }}</p>
            </div>

            <div v-if="temDadosBeachTennis(clienteItem)" class="chips-beach">
              <span v-if="rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)" class="chip beach">
                {{ rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis) }}
              </span>
              <span v-if="rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)" class="chip beach sutileza">
                {{ rotuloNivelBeachTennis(clienteItem.nivelBeachTennis) }}
              </span>
            </div>
          </div>

          <div class="detalhes">
            <p><strong>Telefone:</strong> {{ exibirValor(clienteItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(clienteItem.email) }}</p>
            <p><strong>Observação:</strong> {{ exibirValor(clienteItem.observacao) }}</p>
          </div>

          <details v-if="temDadosBeachTennis(clienteItem)" class="beach-resumo">
            <summary>{{ tituloSecaoEsportiva }}</summary>
            <div class="beach-resumo-grid">
              <p><strong>Data de nascimento:</strong> {{ exibirValor(formatarDataBrasileira(clienteItem.dataNascimento || clienteItem.nascimento)) }}</p>
              <p><strong>Perfil:</strong> {{ exibirValor(rotuloPerfilBeachTennis(clienteItem.perfilBeachTennis)) }}</p>
              <p><strong>Nível:</strong> {{ exibirValor(rotuloNivelBeachTennis(clienteItem.nivelBeachTennis)) }}</p>
              <p><strong>Frequência:</strong> {{ exibirValor(rotuloFrequenciaSemanalBeachTennis(clienteItem.frequenciaSemanalBeachTennis)) }}</p>
              <p><strong>Plano:</strong> {{ exibirValor(rotuloPlanoBeachTennis(clienteItem.planoBeachTennis)) }}</p>
              <p><strong>Observações:</strong> {{ exibirValor(clienteItem.observacaoBeachTennis) }}</p>
            </div>
            <ul v-if="listaResumoBeachTennis(clienteItem).length" class="lista-resumo">
              <li v-for="item in listaResumoBeachTennis(clienteItem)" :key="item">{{ item }}</li>
            </ul>
          </details>

          <div v-if="!modoVisualizacaoEmpresa" class="acoes">
            <button class="botao secundario" @click="editarCliente(clienteItem)">Editar</button>
            <button class="botao perigo" @click="enviarClienteParaLixeira(clienteItem)">Excluir</button>
          </div>
        </article>
      </section>

      <section v-if="!carregando" class="card paginacao">
        <p class="resumo-paginacao">
          {{ paginacao.totalElements }} registro(s) - Página {{ paginaAtualHumana }} de {{ paginacao.totalPages }}
        </p>

        <label class="tamanho-pagina">
          Registros por página
          <select v-model.number="paginacao.size" :disabled="carregando" @change="alterarTamanhoPagina">
            <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
              {{ opcao }}
            </option>
          </select>
        </label>

        <div class="botoes-paginacao">
          <button class="botao secundario" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
            Anterior
          </button>
          <button class="botao secundario" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
            Próxima
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.descricao,
.cabecalho-lista p {
  margin: 6px 0 0;
  color: #64748b;
}

.secao-clientes {
  display: grid;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.lista-clientes {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.cliente-card {
  display: grid;
  gap: 14px;
}

.cabecalho-cliente {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.cliente-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.email {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
  word-break: break-word;
}

.chips-beach {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.chip {
  border-radius: 999px;
  padding: 6px 10px;
  font-size: 12px;
  font-weight: 800;
}

.chip.beach {
  background: #dbeafe;
  color: #1d4ed8;
}

.chip.sutileza {
  background: #ecfeff;
  color: #0f766e;
}

.detalhes p,
.beach-resumo-grid p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong,
.beach-resumo-grid strong {
  font-weight: 800;
}

.beach-resumo {
  display: grid;
  gap: 12px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 14px 16px;
  background: #f8fbff;
}

.beach-resumo summary {
  cursor: pointer;
  color: #1d4ed8;
  font-weight: 800;
}

.beach-resumo-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 6px 16px;
}

.lista-resumo {
  margin: 0;
  padding-left: 18px;
  color: #475569;
  display: grid;
  gap: 4px;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.paginacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resumo-paginacao {
  margin: 0;
  color: #475569;
  font-weight: 700;
}

.tamanho-pagina {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-weight: 700;
}

.tamanho-pagina select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: white;
}

.botoes-paginacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.botao,
:deep(.botao) {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover,
:deep(.botao:hover) {
  transform: translateY(-1px);
}

.botao:disabled,
:deep(.botao:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

:deep(.secundario) {
  background: #0f172a;
}

:deep(.secundario:hover) {
  background: #1e293b;
}

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

:deep(.formulario) {
  display: grid;
  gap: 16px;
}

:deep(.titulo-card h2) {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

:deep(.titulo-card p) {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.campos) {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

:deep(label) {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

:deep(input),
:deep(select),
:deep(textarea) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(textarea) {
  resize: vertical;
  min-height: 96px;
}

:deep(input:focus),
:deep(select:focus),
:deep(textarea:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

:deep(.campo-grande) {
  grid-column: 1 / -1;
}

:deep(.rodape-formulario) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.bloco-beach-tennis {
  border: 1px solid #dbeafe;
  border-radius: 12px;
  padding: 16px;
  background: #f8fbff;
}

.bloco-beach-tennis summary {
  cursor: pointer;
  color: #1d4ed8;
  font-weight: 800;
  font-size: 15px;
}

.ajuda-bloco {
  margin: 10px 0 0;
  color: #64748b;
  font-size: 13px;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

:deep(.sucesso-texto) {
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .cabecalho-cliente {
    flex-direction: column;
    align-items: flex-start;
  }

  .lista-clientes,
  :deep(.campos),
  .beach-resumo-grid {
    grid-template-columns: 1fr;
  }

  .chips-beach {
    justify-content: flex-start;
  }
}
</style>
