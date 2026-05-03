<script setup>
import { onMounted, ref } from 'vue'
import ServicoForm from '@/components/ServicoForm.vue'
import { buscarServicos, cadastrarServico } from '@/services/api'

const servicos = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoServico = ref('')

const servico = ref(criarServicoInicial())

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
    erro.value = 'Nao foi possivel carregar os servicos.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarServico() {
  try {
    erro.value = ''
    mensagemSucessoServico.value = ''

    if (!servico.value.nome.trim()) {
      erro.value = 'Informe o nome do servico.'
      return
    }

    if (servico.value.preco === '' || servico.value.preco === null) {
      erro.value = 'Informe o preco do servico.'
      return
    }

    if (!servico.value.duracaoMinutos) {
      erro.value = 'Informe a duracao do servico.'
      return
    }

    await cadastrarServico({
      empresaId: 1,
      nome: servico.value.nome,
      descricao: servico.value.descricao,
      preco: Number(servico.value.preco),
      duracaoMinutos: Number(servico.value.duracaoMinutos),
      ativo: Boolean(servico.value.ativo),
    })

    mensagemSucessoServico.value = 'Servico cadastrado com sucesso.'
    servico.value = criarServicoInicial()

    await carregarServicos()
  } catch (error) {
    erro.value = 'Nao foi possivel cadastrar o servico.'
    console.error(error)
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

onMounted(() => {
  carregarServicos()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Catalogo</p>
        <h1>Servicos</h1>
        <p class="descricao">Gerencie os servicos disponiveis para agendamento.</p>
      </div>

      <button class="botao secundario" @click="carregarServicos">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <ServicoForm
      v-model="servico"
      :mensagem-sucesso="mensagemSucessoServico"
      @salvar="salvarServico"
    />

    <section class="secao-servicos">
      <div class="cabecalho-lista">
        <div>
          <h2>Servicos cadastrados</h2>
          <p>Lista de servicos retornados pela API publicada.</p>
        </div>

        <span class="contador">{{ servicos.length }} servico(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando servicos...</p>
      </section>

      <section v-else-if="servicos.length === 0" class="card">
        <p>Nenhum servico encontrado.</p>
      </section>

      <section v-else class="lista-servicos">
        <article v-for="servicoItem in servicos" :key="servicoItem.id" class="card servico-card">
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
            <p><strong>Descricao:</strong> {{ exibirValor(servicoItem.descricao) }}</p>
            <p><strong>Preco:</strong> {{ formatarPreco(servicoItem.preco) }}</p>
            <p><strong>Duracao:</strong> {{ exibirValor(servicoItem.duracaoMinutos) }} minutos</p>
          </div>
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

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
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
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
