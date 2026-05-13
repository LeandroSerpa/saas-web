<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import ServicoForm from '@/components/ServicoForm.vue'
import {
  atualizarEtapaOnboarding,
  buscarServicos,
  cadastrarServico,
  recalcularOnboarding,
  atualizarServico,
  atualizarAtivoServico,
} from '@/services/api'

const servicos = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoServico = ref('')
const mensagemSucessoStatus = ref('')
const atualizandoId = ref(null)
const servicoEmEdicaoId = ref(null)
const route = useRoute()
const router = useRouter()
const filtros = ref({
  status: '',
  busca: '',
})

const servico = ref(criarServicoInicial())

const servicosFiltrados = computed(() => {
  const termoBusca = normalizarTexto(filtros.value.busca)

  return servicos.value
    .filter((servicoItem) => {
      if (filtros.value.status === 'ativos' && !estaAtivo(servicoItem)) {
        return false
      }

      if (filtros.value.status === 'inativos' && estaAtivo(servicoItem)) {
        return false
      }

      if (termoBusca) {
        const nome = normalizarTexto(servicoItem.nome)
        const descricao = normalizarTexto(servicoItem.descricao)

        if (!nome.includes(termoBusca) && !descricao.includes(termoBusca)) {
          return false
        }
      }

      return true
    })
    .sort((servicoA, servicoB) =>
      String(servicoA.nome || '').localeCompare(String(servicoB.nome || ''), 'pt-BR'),
    )
})

function criarServicoInicial() {
  return {
    empresaId: 1,
    nome: '',
    descricao: '',
    preco: '',
    duracaoMinutos: '',
    ativo: true,
  }
}

async function carregarServicos() {
  try {
    carregando.value = true
    erro.value = ''

    servicos.value = await buscarServicos()
  } catch (error) {
    erro.value = 'Não foi possível carregar os serviços.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarServico() {
  try {
    erro.value = ''
    mensagemSucessoServico.value = ''
    mensagemSucessoStatus.value = ''

    if (!servico.value.nome.trim()) {
      erro.value = 'Informe o nome do serviço.'
      return
    }

    if (servico.value.preco === '' || servico.value.preco === null) {
      erro.value = 'Informe o preço do serviço.'
      return
    }

    if (!servico.value.duracaoMinutos) {
      erro.value = 'Informe a duração do serviço.'
      return
    }

    const dadosServico = montarPayloadServico()
    const criandoServico = !servicoEmEdicaoId.value

    if (servicoEmEdicaoId.value) {
      await atualizarServico(servicoEmEdicaoId.value, dadosServico)
      mensagemSucessoServico.value = 'Serviço atualizado com sucesso.'
    } else {
      await cadastrarServico(dadosServico)
      mensagemSucessoServico.value = 'Serviço cadastrado com sucesso.'
    }

    limparFormulario()
    await carregarServicos()
    if (criandoServico) {
      await retornarParaOnboardingSeNecessario('SERVICO')
    }
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      servicoEmEdicaoId.value
        ? 'Não foi possível atualizar o serviço.'
        : 'Não foi possível cadastrar o serviço.',
    )
    console.error(error)
  }
}

async function retornarParaOnboardingSeNecessario(etapaEsperada) {
  if (route.query.origem !== 'onboarding') return

  const etapa = String(route.query.etapa || etapaEsperada)
  await recalcularOnboarding().catch((error) => console.error(error))
  await atualizarEtapaOnboarding(etapa, { concluido: true, ignorado: false }).catch((error) => console.error(error))
  router.push({ path: '/onboarding', query: { atualizado: '1' } })
}

async function alternarAtivoServico(servicoItem) {
  try {
    atualizandoId.value = servicoItem.id
    erro.value = ''
    mensagemSucessoServico.value = ''
    mensagemSucessoStatus.value = ''

    await atualizarAtivoServico(servicoItem.id, !estaAtivo(servicoItem))
    await carregarServicos()

    mensagemSucessoStatus.value = estaAtivo(servicoItem)
      ? 'Serviço desativado com sucesso.'
      : 'Serviço ativado com sucesso.'
  } catch (error) {
    erro.value = 'Não foi possível atualizar o status do serviço.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function editarServico(servicoItem) {
  erro.value = ''
  mensagemSucessoServico.value = ''
  mensagemSucessoStatus.value = ''
  servicoEmEdicaoId.value = servicoItem.id
  servico.value = {
    empresaId: servicoItem.empresaId || 1,
    nome: servicoItem.nome || '',
    descricao: servicoItem.descricao || '',
    preco: servicoItem.preco ?? '',
    duracaoMinutos: servicoItem.duracaoMinutos ?? '',
    ativo: estaAtivo(servicoItem),
  }
}

function cancelarEdicao() {
  limparFormulario()
}

function limparFormulario() {
  servicoEmEdicaoId.value = null
  servico.value = criarServicoInicial()
}

function montarPayloadServico() {
  return {
    empresaId: 1,
    nome: servico.value.nome,
    descricao: servico.value.descricao,
    preco: Number(servico.value.preco),
    duracaoMinutos: Number(servico.value.duracaoMinutos),
    ativo: Boolean(servico.value.ativo),
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function formatarPreco(preco) {
  if (preco === null || preco === undefined) {
    return 'R$ 0,00'
  }

  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function estaAtivo(servicoItem) {
  return servicoItem.ativo !== false
}

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

function limparFiltros() {
  filtros.value = {
    status: '',
    busca: '',
  }
}

onMounted(() => {
  carregarServicos()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Catálogo</p>
        <h1>Serviços</h1>
        <p class="descricao">Gerencie os serviços disponíveis para agendamento.</p>
      </div>

      <button class="botao secundario" @click="carregarServicos">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucessoStatus" class="card sucesso-card">
      <p>{{ mensagemSucessoStatus }}</p>
    </section>

    <ServicoForm
      v-model="servico"
      :mensagem-sucesso="mensagemSucessoServico"
      :modo-edicao="Boolean(servicoEmEdicaoId)"
      @salvar="salvarServico"
      @cancelar="cancelarEdicao"
    />

    <section class="secao-servicos">
      <section class="card filtros-servicos">
        <div class="titulo-card">
          <h2>Filtros</h2>
          <p>Refine a lista de serviços cadastrados.</p>
        </div>

        <div class="campos-filtros">
          <label>
            Status
            <select v-model="filtros.status">
              <option value="">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>

          <label class="campo-busca">
            Buscar
            <input
              v-model="filtros.busca"
              type="text"
              placeholder="Busque por nome ou descrição"
            />
          </label>

          <div class="acoes-filtros">
            <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
          </div>
        </div>
      </section>

      <div class="cabecalho-lista">
        <div>
          <h2>Serviços cadastrados</h2>
          <p>Lista de serviços retornados pela API publicada.</p>
        </div>

        <span class="contador">{{ servicosFiltrados.length }} serviço(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando serviços...</p>
      </section>

      <section v-else-if="servicos.length === 0" class="card">
        <p>Nenhum serviço encontrado.</p>
      </section>

      <section v-else-if="servicosFiltrados.length === 0" class="card">
        <p>Nenhum serviço encontrado para os filtros selecionados.</p>
      </section>

      <section v-else class="lista-servicos">
        <article
          v-for="servicoItem in servicosFiltrados"
          :key="servicoItem.id"
          class="card servico-card"
        >
          <div class="topo-card">
            <div>
              <h3>{{ servicoItem.nome }}</h3>
              <p class="preco">{{ formatarPreco(servicoItem.preco) }}</p>
            </div>

            <span :class="['status', estaAtivo(servicoItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(servicoItem) ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>Descrição:</strong> {{ exibirValor(servicoItem.descricao) }}</p>
            <p><strong>Preço:</strong> {{ formatarPreco(servicoItem.preco) }}</p>
            <p><strong>Duração:</strong> {{ exibirValor(servicoItem.duracaoMinutos) }} minutos</p>
          </div>

          <div class="acoes">
            <button
              class="botao neutro"
              :disabled="atualizandoId === servicoItem.id"
              @click="editarServico(servicoItem)"
            >
              Editar
            </button>

            <button
              :class="['botao', estaAtivo(servicoItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === servicoItem.id"
              @click="alternarAtivoServico(servicoItem)"
            >
              {{ estaAtivo(servicoItem) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>

          <p v-if="atualizandoId === servicoItem.id" class="atualizando">
            Atualizando serviço...
          </p>
        </article>
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
.cabecalho-lista,
.topo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topo-card {
  align-items: flex-start;
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

.secao-servicos {
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

.filtros-servicos {
  display: grid;
  gap: 16px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.campos-filtros {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(260px, 1fr) auto;
  gap: 16px;
  align-items: end;
}

.campos-filtros label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.campos-filtros input,
.campos-filtros select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

.campos-filtros input:focus,
.campos-filtros select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.acoes-filtros {
  display: flex;
  align-items: end;
}

.lista-servicos {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.servico-card {
  display: grid;
  gap: 14px;
}

.servico-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.preco {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.ativo {
  background: #dcfce7;
  color: #15803d;
}

.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
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

.neutro,
:deep(.neutro) {
  background: #475569;
}

.neutro:hover,
:deep(.neutro:hover) {
  background: #334155;
}

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

.sucesso {
  background: #16a34a;
}

.sucesso:hover {
  background: #15803d;
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
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

:deep(input) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(input:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

:deep(input[type='checkbox']) {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

:deep(.campo-checkbox) {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
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

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.atualizando {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.sucesso-texto) {
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .topo-card {
    align-items: flex-start;
  }

  .lista-servicos,
  .campos-filtros,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
