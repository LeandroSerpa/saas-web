<script setup>
import { onMounted, ref } from 'vue'
import ClienteForm from '@/components/ClienteForm.vue'
import { buscarClientes, cadastrarCliente } from '@/services/api'

const clientes = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoCliente = ref('')

const cliente = ref({
  nome: '',
  telefone: '',
  email: '',
  observacao: '',
})

async function carregarClientes() {
  try {
    carregando.value = true
    erro.value = ''

    clientes.value = await buscarClientes()
  } catch (error) {
    erro.value = 'Nao foi possivel carregar os clientes.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarCliente() {
  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''

    if (!cliente.value.nome.trim()) {
      erro.value = 'Informe o nome do cliente.'
      return
    }

    await cadastrarCliente(cliente.value)

    mensagemSucessoCliente.value = 'Cliente cadastrado com sucesso.'

    cliente.value = {
      nome: '',
      telefone: '',
      email: '',
      observacao: '',
    }

    await carregarClientes()
  } catch (error) {
    erro.value = 'Nao foi possivel cadastrar o cliente.'
    console.error(error)
  }
}

function exibirValor(valor) {
  return valor || '-'
}

onMounted(() => {
  carregarClientes()
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

    <ClienteForm
      v-model="cliente"
      :mensagem-sucesso="mensagemSucessoCliente"
      @salvar="salvarCliente"
    />

    <section class="secao-clientes">
      <div class="cabecalho-lista">
        <div>
          <h2>Clientes cadastrados</h2>
          <p>Lista de clientes retornados pela API publicada.</p>
        </div>

        <span class="contador">{{ clientes.length }} cliente(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando clientes...</p>
      </section>

      <section v-else-if="clientes.length === 0" class="card">
        <p>Nenhum cliente encontrado.</p>
      </section>

      <section v-else class="lista-clientes">
        <article v-for="clienteItem in clientes" :key="clienteItem.id" class="card cliente-card">
          <div>
            <h3>{{ clienteItem.nome }}</h3>
            <p class="email">{{ exibirValor(clienteItem.email) }}</p>
          </div>

          <div class="detalhes">
            <p><strong>Telefone:</strong> {{ exibirValor(clienteItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(clienteItem.email) }}</p>
            <p><strong>Observacao:</strong> {{ exibirValor(clienteItem.observacao) }}</p>
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

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
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

  .lista-clientes,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
