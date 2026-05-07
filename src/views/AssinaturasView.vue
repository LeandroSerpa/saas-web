<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarAssinaturas,
  buscarEmpresas,
  buscarPlanos,
  salvarAssinaturaEmpresa,
} from '@/services/api'

const statusAssinatura = ['ATIVA', 'TESTE', 'ATRASADA', 'BLOQUEADA', 'CANCELADA']
const assinaturas = ref([])
const empresas = ref([])
const planos = ref([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const empresaEditandoId = ref(null)
const filtros = ref({
  empresaId: '',
  planoId: '',
  status: '',
})
const assinatura = ref(criarAssinaturaInicial())

const assinaturasOrdenadas = computed(() =>
  [...assinaturas.value].sort((assinaturaA, assinaturaB) =>
    nomeEmpresa(assinaturaA).localeCompare(nomeEmpresa(assinaturaB), 'pt-BR'),
  ),
)

function criarAssinaturaInicial() {
  return {
    empresaId: '',
    planoId: '',
    status: 'ATIVA',
    dataInicio: '',
    dataFim: '',
    dataVencimento: '',
    observacao: '',
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    const [assinaturasApi, empresasApi, planosApi] = await Promise.all([
      buscarAssinaturas(limparFiltrosVazios(filtros.value)),
      buscarEmpresas(),
      buscarPlanos(),
    ])

    assinaturas.value = extrairLista(assinaturasApi)
    empresas.value = extrairLista(empresasApi)
    planos.value = extrairLista(planosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar as assinaturas.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarAssinatura() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!assinatura.value.empresaId) {
      erro.value = 'Selecione a empresa.'
      return
    }

    if (!assinatura.value.planoId) {
      erro.value = 'Selecione o plano.'
      return
    }

    salvando.value = true
    await salvarAssinaturaEmpresa(assinatura.value.empresaId, montarPayloadAssinatura())
    mensagemSucesso.value = 'Assinatura salva com sucesso.'
    cancelarEdicao(false)
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel salvar a assinatura.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function editarAssinatura(item) {
  erro.value = ''
  mensagemSucesso.value = ''
  empresaEditandoId.value = item.empresaId || item.empresa?.id
  assinatura.value = {
    empresaId: item.empresaId || item.empresa?.id || '',
    planoId: item.planoId || item.plano?.id || '',
    status: item.status || 'ATIVA',
    dataInicio: formatarDataInput(item.dataInicio),
    dataFim: formatarDataInput(item.dataFim),
    dataVencimento: formatarDataInput(item.dataVencimento),
    observacao: item.observacao || '',
  }
}

function cancelarEdicao(limparMensagens = true) {
  empresaEditandoId.value = null
  assinatura.value = criarAssinaturaInicial()

  if (limparMensagens) {
    mensagemSucesso.value = ''
  }
}

function montarPayloadAssinatura() {
  return {
    planoId: Number(assinatura.value.planoId),
    status: assinatura.value.status,
    dataInicio: dataOuNulo(assinatura.value.dataInicio),
    dataFim: dataOuNulo(assinatura.value.dataFim),
    dataVencimento: dataOuNulo(assinatura.value.dataVencimento),
    observacao: assinatura.value.observacao,
  }
}

function limparFiltrosVazios(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => String(valor || '').trim()))
}

function aplicarFiltros() {
  carregarDados()
}

function limparFiltros() {
  filtros.value = {
    empresaId: '',
    planoId: '',
    status: '',
  }
  carregarDados()
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.data || []
}

function dataOuNulo(valor) {
  return valor || null
}

function formatarDataInput(valor) {
  return valor ? String(valor).slice(0, 10) : ''
}

function formatarData(valor) {
  return valor ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '-'
}

function formatarPreco(preco) {
  return Number(preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function nomeEmpresa(item) {
  return item.empresaNome || item.nomeEmpresa || item.empresa?.nome || buscarEmpresaPorId(item.empresaId)?.nome || '-'
}

function nomePlano(item) {
  return item.planoNome || item.nomePlano || item.plano?.nome || buscarPlanoPorId(item.planoId)?.nome || '-'
}

function precoPlano(item) {
  return item.precoMensal ?? item.planoPrecoMensal ?? item.plano?.precoMensal ?? buscarPlanoPorId(item.planoId)?.precoMensal
}

function buscarEmpresaPorId(id) {
  return empresas.value.find((empresa) => String(empresa.id) === String(id))
}

function buscarPlanoPorId(id) {
  return planos.value.find((plano) => String(plano.id) === String(id))
}

function exibirLimite(valor) {
  return valor === null || valor === undefined || valor === '' ? 'Ilimitado' : valor
}

function limitesResumo(item) {
  const plano = item.plano || buscarPlanoPorId(item.planoId) || {}

  return [
    `Usuarios: ${exibirLimite(plano.limiteUsuarios ?? item.limiteUsuarios)}`,
    `Clientes: ${exibirLimite(plano.limiteClientes ?? item.limiteClientes)}`,
    `Servicos: ${exibirLimite(plano.limiteServicos ?? item.limiteServicos)}`,
    `Agend.: ${exibirLimite(plano.limiteAgendamentosMes ?? item.limiteAgendamentosMes)}`,
  ].join(' | ')
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administracao SaaS</p>
        <h1>Assinaturas</h1>
        <p class="descricao">Vincule empresas aos planos e acompanhe status comerciais.</p>
      </div>

      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section class="card filtros">
      <div class="titulo-card">
        <h2>Filtros</h2>
        <p>Filtre por empresa, plano ou status.</p>
      </div>

      <div class="campos">
        <label>
          Empresa
          <select v-model="filtros.empresaId">
            <option value="">Todas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome }}
            </option>
          </select>
        </label>
        <label>
          Plano
          <select v-model="filtros.planoId">
            <option value="">Todos</option>
            <option v-for="planoItem in planos" :key="planoItem.id" :value="planoItem.id">
              {{ planoItem.nome }}
            </option>
          </select>
        </label>
        <label>
          Status
          <select v-model="filtros.status">
            <option value="">Todos</option>
            <option v-for="status in statusAssinatura" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" @click="aplicarFiltros">Filtrar</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <form class="card formulario" @submit.prevent="salvarAssinatura">
      <div class="titulo-card">
        <h2>{{ empresaEditandoId ? 'Editar assinatura' : 'Assinatura da empresa' }}</h2>
        <p>Selecione uma empresa e defina o plano contratado.</p>
      </div>

      <div class="campos">
        <label>
          Empresa *
          <select v-model="assinatura.empresaId">
            <option value="">Selecione</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome }}
            </option>
          </select>
        </label>
        <label>
          Plano *
          <select v-model="assinatura.planoId">
            <option value="">Selecione</option>
            <option v-for="planoItem in planos" :key="planoItem.id" :value="planoItem.id">
              {{ planoItem.nome }}
            </option>
          </select>
        </label>
        <label>
          Status
          <select v-model="assinatura.status">
            <option v-for="status in statusAssinatura" :key="status" :value="status">
              {{ status }}
            </option>
          </select>
        </label>
        <label>
          Data inicio
          <input v-model="assinatura.dataInicio" type="date" />
        </label>
        <label>
          Data fim
          <input v-model="assinatura.dataFim" type="date" />
        </label>
        <label>
          Data vencimento
          <input v-model="assinatura.dataVencimento" type="date" />
        </label>
        <label class="campo-grande">
          Observacao
          <textarea v-model="assinatura.observacao" rows="3"></textarea>
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar assinatura' }}
        </button>
        <button v-if="empresaEditandoId" type="button" class="botao secundario" @click="cancelarEdicao">
          Cancelar edicao
        </button>
      </div>
    </form>

    <section class="secao-lista">
      <div class="cabecalho-lista">
        <div>
          <h2>Assinaturas das empresas</h2>
          <p>Cards com plano, vencimento, limites e observacoes.</p>
        </div>
        <span class="contador">{{ assinaturasOrdenadas.length }} assinatura(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando assinaturas...</p>
      </section>

      <section v-else-if="assinaturasOrdenadas.length === 0" class="card">
        <p>Nenhuma assinatura encontrada.</p>
      </section>

      <section v-else class="lista">
        <article v-for="item in assinaturasOrdenadas" :key="item.id || item.empresaId" class="card item-card">
          <div class="topo-card">
            <div>
              <h3>{{ nomeEmpresa(item) }}</h3>
              <p class="preco">{{ nomePlano(item) }} - {{ formatarPreco(precoPlano(item)) }}</p>
            </div>
            <span :class="['status', String(item.status || '').toLowerCase()]">{{ item.status || '-' }}</span>
          </div>

          <div class="detalhes">
            <p><strong>Data inicio:</strong> {{ formatarData(item.dataInicio) }}</p>
            <p><strong>Data vencimento:</strong> {{ formatarData(item.dataVencimento) }}</p>
            <p><strong>Limites:</strong> {{ limitesResumo(item) }}</p>
            <p><strong>Observacao:</strong> {{ item.observacao || '-' }}</p>
          </div>

          <div class="acoes">
            <button class="botao neutro" @click="editarAssinatura(item)">Editar</button>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.filtros,
.secao-lista,
.item-card {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card,
.acoes {
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

h1,
h2,
h3 {
  margin: 0;
  font-weight: 800;
  letter-spacing: 0;
}

h1 {
  font-size: 32px;
}

h2 {
  font-size: 24px;
}

h3 {
  font-size: 20px;
}

.descricao,
.cabecalho-lista p,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111827;
  font: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #bfdbfe;
  border-color: #2563eb;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.contador,
.status {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 800;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
}

.status {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.atrasada {
  background: #fef3c7;
  color: #92400e;
}

.status.bloqueada,
.status.cancelada {
  background: #fee2e2;
  color: #991b1b;
}

.status.ativa,
.status.teste {
  background: #dcfce7;
  color: #166534;
}

.preco {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

.detalhes p {
  margin: 7px 0;
  color: #374151;
}

.detalhes strong {
  font-weight: 800;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.principal {
  background: #2563eb;
}

.secundario,
.neutro {
  background: #0f172a;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.erro p,
.sucesso-card p {
  margin: 0;
  font-weight: 800;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .topo-card,
  .acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .campos,
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
