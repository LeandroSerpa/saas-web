<script setup>
import { onMounted, ref } from 'vue'
import FuncionarioForm from '@/components/FuncionarioForm.vue'
import { buscarFuncionarios, cadastrarFuncionario } from '@/services/api'

const funcionarios = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoFuncionario = ref('')

const funcionario = ref(criarFuncionarioInicial())

function criarFuncionarioInicial() {
  return {
    empresaId: 1,
    nome: '',
    telefone: '',
    email: '',
    cargo: '',
    ativo: true,
  }
}

async function carregarFuncionarios() {
  try {
    carregando.value = true
    erro.value = ''

    funcionarios.value = await buscarFuncionarios()
  } catch (error) {
    erro.value = 'Nao foi possivel carregar os funcionarios.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarFuncionario() {
  try {
    erro.value = ''
    mensagemSucessoFuncionario.value = ''

    if (!funcionario.value.nome.trim()) {
      erro.value = 'Informe o nome do funcionario.'
      return
    }

    await cadastrarFuncionario({
      empresaId: 1,
      nome: funcionario.value.nome,
      telefone: funcionario.value.telefone,
      email: funcionario.value.email,
      cargo: funcionario.value.cargo,
      ativo: Boolean(funcionario.value.ativo),
    })

    mensagemSucessoFuncionario.value = 'Funcionario cadastrado com sucesso.'
    funcionario.value = criarFuncionarioInicial()

    await carregarFuncionarios()
  } catch (error) {
    erro.value = 'Nao foi possivel cadastrar o funcionario.'
    console.error(error)
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function estaAtivo(funcionarioItem) {
  return funcionarioItem.ativo !== false
}

onMounted(() => {
  carregarFuncionarios()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Equipe</p>
        <h1>Funcionarios</h1>
        <p class="descricao">Gerencie os profissionais disponiveis para atendimento.</p>
      </div>

      <button class="botao secundario" @click="carregarFuncionarios">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <FuncionarioForm
      v-model="funcionario"
      :mensagem-sucesso="mensagemSucessoFuncionario"
      @salvar="salvarFuncionario"
    />

    <section class="secao-funcionarios">
      <div class="cabecalho-lista">
        <div>
          <h2>Funcionarios cadastrados</h2>
          <p>Lista de funcionarios retornados pela API publicada.</p>
        </div>

        <span class="contador">{{ funcionarios.length }} funcionario(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando funcionarios...</p>
      </section>

      <section v-else-if="funcionarios.length === 0" class="card">
        <p>Nenhum funcionario encontrado.</p>
      </section>

      <section v-else class="lista-funcionarios">
        <article
          v-for="funcionarioItem in funcionarios"
          :key="funcionarioItem.id"
          class="card funcionario-card"
        >
          <div class="topo-card">
            <div>
              <h3>{{ funcionarioItem.nome }}</h3>
              <p class="cargo">{{ exibirValor(funcionarioItem.cargo) }}</p>
            </div>

            <span :class="['status', estaAtivo(funcionarioItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(funcionarioItem) ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>Telefone:</strong> {{ exibirValor(funcionarioItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(funcionarioItem.email) }}</p>
            <p><strong>Cargo:</strong> {{ exibirValor(funcionarioItem.cargo) }}</p>
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

.secao-funcionarios {
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

.lista-funcionarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.funcionario-card {
  display: grid;
  gap: 14px;
}

.funcionario-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.cargo {
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

  .lista-funcionarios,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
