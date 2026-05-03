<script setup>
import { onMounted, ref } from 'vue'
import {
  buscarAgendamentos,
  buscarClientes,
  buscarFuncionarios,
  buscarServicos,
  atualizarStatusAgendamento,
  cadastrarCliente,
  cadastrarAgendamento,
} from '@/services/api'

const agendamentos = ref([])
const clientes = ref([])
const servicos = ref([])
const funcionarios = ref([])

const carregando = ref(true)
const erro = ref('')
const atualizandoId = ref(null)
const mensagemSucessoCliente = ref('')
const mensagemSucessoAgendamento = ref('')

const cliente = ref({
  nome: '',
  telefone: '',
  email: '',
  observacao: '',
})

const novoAgendamento = ref({
  clienteId: '',
  servicoId: '',
  funcionarioId: '',
  dataHoraInicio: '',
  observacao: '',
})

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    const [agendamentosApi, clientesApi, servicosApi, funcionariosApi] = await Promise.all([
      buscarAgendamentos(),
      buscarClientes(),
      buscarServicos(),
      buscarFuncionarios(),
    ])

    agendamentos.value = agendamentosApi
    clientes.value = clientesApi
    servicos.value = servicosApi
    funcionarios.value = funcionariosApi
  } catch (error) {
    erro.value = 'Não foi possível carregar os dados.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarAgendamentos() {
  try {
    carregando.value = true
    erro.value = ''

    agendamentos.value = await buscarAgendamentos()
  } catch (error) {
    erro.value = 'Não foi possível carregar os agendamentos.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function alterarStatus(id, status) {
  try {
    atualizandoId.value = id
    erro.value = ''
    mensagemSucessoCliente.value = ''
    mensagemSucessoAgendamento.value = ''

    await atualizarStatusAgendamento(id, status)
    await carregarAgendamentos()

    mensagemSucessoAgendamento.value = 'Status atualizado com sucesso.'
  } catch (error) {
    erro.value = 'Não foi possível atualizar o status do agendamento.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

async function salvarCliente() {
  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''
    mensagemSucessoAgendamento.value = ''

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

    clientes.value = await buscarClientes()
  } catch (error) {
    erro.value = 'Não foi possível cadastrar o cliente.'
    console.error(error)
  }
}

async function salvarAgendamento() {
  try {
    erro.value = ''
    mensagemSucessoCliente.value = ''
    mensagemSucessoAgendamento.value = ''

    if (!novoAgendamento.value.clienteId) {
      erro.value = 'Selecione um cliente.'
      return
    }

    if (!novoAgendamento.value.servicoId) {
      erro.value = 'Selecione um serviço.'
      return
    }

    if (!novoAgendamento.value.funcionarioId) {
      erro.value = 'Selecione um funcionário.'
      return
    }

    if (!novoAgendamento.value.dataHoraInicio) {
      erro.value = 'Informe a data e hora do agendamento.'
      return
    }

    const servicoSelecionado = servicos.value.find(
      (servico) => Number(servico.id) === Number(novoAgendamento.value.servicoId),
    )

    const duracaoMinutos = servicoSelecionado?.duracaoMinutos || 30

    const inicio = new Date(novoAgendamento.value.dataHoraInicio)
    const fim = new Date(inicio.getTime() + duracaoMinutos * 60000)

    const agendamento = {
      empresaId: 1,
      clienteId: Number(novoAgendamento.value.clienteId),
      funcionarioId: Number(novoAgendamento.value.funcionarioId),
      servicoId: Number(novoAgendamento.value.servicoId),
      dataHoraInicio: formatarDataParaApi(inicio),
      dataHoraFim: formatarDataParaApi(fim),
      status: 'agendado',
      observacao: novoAgendamento.value.observacao,
    }

    await cadastrarAgendamento(agendamento)

    mensagemSucessoAgendamento.value = 'Agendamento cadastrado com sucesso.'

    novoAgendamento.value = {
      clienteId: '',
      servicoId: '',
      funcionarioId: '',
      dataHoraInicio: '',
      observacao: '',
    }

    await carregarAgendamentos()
  } catch (error) {
    erro.value = 'Não foi possível cadastrar o agendamento.'
    console.error(error)
  }
}

function formatarDataParaApi(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')
  const segundo = '00'

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:${segundo}`
}

function formatarDataHora(dataHora) {
  if (!dataHora) {
    return '-'
  }

  return new Date(dataHora).toLocaleString('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  })
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

function statusClasse(status) {
  if (status === 'concluido') {
    return 'status concluido'
  }

  if (status === 'cancelado') {
    return 'status cancelado'
  }

  if (status === 'faltou') {
    return 'status faltou'
  }

  return 'status agendado'
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <section class="cabecalho">
      <div>
        <h1>Agenda do SaaS</h1>
        <p>Agendamentos cadastrados na API publicada no EasyPanel.</p>
      </div>

      <button class="botao principal" @click="carregarAgendamentos">Atualizar</button>
    </section>

    <section class="card formulario">
      <h2>Novo cliente</h2>

      <div class="campos">
        <label>
          Nome *
          <input v-model="cliente.nome" type="text" placeholder="Ex: Maria Silva" />
        </label>

        <label>
          Telefone
          <input v-model="cliente.telefone" type="text" placeholder="Ex: (21) 99999-9999" />
        </label>

        <label>
          E-mail
          <input v-model="cliente.email" type="email" placeholder="Ex: cliente@email.com" />
        </label>

        <label class="campo-grande">
          Observação
          <input
            v-model="cliente.observacao"
            type="text"
            placeholder="Ex: Cliente prefere atendimento pela manhã"
          />
        </label>
      </div>

      <button class="botao principal" @click="salvarCliente">Cadastrar cliente</button>

      <p v-if="mensagemSucessoCliente" class="sucesso-texto">
        {{ mensagemSucessoCliente }}
      </p>
    </section>

    <section class="card formulario">
      <h2>Novo agendamento</h2>

      <div class="campos">
        <label>
          Cliente *
          <select v-model="novoAgendamento.clienteId">
            <option value="">Selecione um cliente</option>
            <option v-for="clienteItem in clientes" :key="clienteItem.id" :value="clienteItem.id">
              {{ clienteItem.nome }}
            </option>
          </select>
        </label>

        <label>
          Serviço *
          <select v-model="novoAgendamento.servicoId">
            <option value="">Selecione um serviço</option>
            <option v-for="servico in servicos" :key="servico.id" :value="servico.id">
              {{ servico.nome }} - {{ formatarPreco(servico.preco) }}
            </option>
          </select>
        </label>

        <label>
          Funcionário *
          <select v-model="novoAgendamento.funcionarioId">
            <option value="">Selecione um funcionário</option>
            <option
              v-for="funcionario in funcionarios"
              :key="funcionario.id"
              :value="funcionario.id"
            >
              {{ funcionario.nome }}
            </option>
          </select>
        </label>

        <label>
          Data e hora *
          <input v-model="novoAgendamento.dataHoraInicio" type="datetime-local" />
        </label>

        <label class="campo-grande">
          Observação
          <input
            v-model="novoAgendamento.observacao"
            type="text"
            placeholder="Ex: Cliente pediu preferência por horário pontual"
          />
        </label>
      </div>

      <button class="botao principal" @click="salvarAgendamento">Cadastrar agendamento</button>

      <p v-if="mensagemSucessoAgendamento" class="sucesso-texto">
        {{ mensagemSucessoAgendamento }}
      </p>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando agendamentos...</p>
    </section>

    <section v-else-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-else-if="agendamentos.length === 0" class="card">
      <p>Nenhum agendamento encontrado.</p>
    </section>

    <section v-else class="lista">
      <article v-for="agendamento in agendamentos" :key="agendamento.id" class="card agendamento">
        <div class="topo-card">
          <div>
            <h2>{{ agendamento.cliente }}</h2>
            <p class="servico">{{ agendamento.servico }}</p>
          </div>

          <span :class="statusClasse(agendamento.status)">
            {{ agendamento.status }}
          </span>
        </div>

        <div class="detalhes">
          <p><strong>Funcionário:</strong> {{ agendamento.funcionario }}</p>
          <p><strong>Data/Hora:</strong> {{ formatarDataHora(agendamento.dataHoraInicio) }}</p>
          <p><strong>Preço:</strong> {{ formatarPreco(agendamento.preco) }}</p>
          <p v-if="agendamento.observacao">
            <strong>Observação:</strong> {{ agendamento.observacao }}
          </p>
        </div>

        <div class="acoes">
          <button
            class="botao sucesso"
            :disabled="atualizandoId === agendamento.id || agendamento.status === 'concluido'"
            @click="alterarStatus(agendamento.id, 'concluido')"
          >
            Concluir
          </button>

          <button
            class="botao perigo"
            :disabled="atualizandoId === agendamento.id || agendamento.status === 'cancelado'"
            @click="alterarStatus(agendamento.id, 'cancelado')"
          >
            Cancelar
          </button>

          <button
            class="botao alerta"
            :disabled="atualizandoId === agendamento.id || agendamento.status === 'faltou'"
            @click="alterarStatus(agendamento.id, 'faltou')"
          >
            Faltou
          </button>
        </div>

        <p v-if="atualizandoId === agendamento.id" class="atualizando">Atualizando status...</p>
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  max-width: 1100px;
  margin: 0 auto;
  padding: 32px;
  font-family: Arial, sans-serif;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
}

.cabecalho h1 {
  margin: 0;
  font-size: 32px;
  color: #1f2937;
}

.cabecalho p {
  margin: 8px 0 0;
  color: #6b7280;
}

.lista {
  display: grid;
  gap: 16px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
}

.agendamento {
  display: grid;
  gap: 14px;
}

.topo-card {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

.agendamento h2 {
  margin: 0;
  color: #111827;
}

.servico {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: bold;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
}

.status {
  padding: 6px 10px;
  border-radius: 999px;
  font-size: 13px;
  font-weight: bold;
  text-transform: uppercase;
}

.status.agendado {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.concluido {
  background: #dcfce7;
  color: #15803d;
}

.status.cancelado {
  background: #fee2e2;
  color: #b91c1c;
}

.status.faltou {
  background: #fef3c7;
  color: #92400e;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  color: white;
  padding: 10px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: bold;
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.principal {
  background: #2563eb;
}

.principal:hover {
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

.alerta {
  background: #d97706;
}

.alerta:hover {
  background: #b45309;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.atualizando {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

.formulario {
  margin-bottom: 24px;
}

.formulario h2 {
  margin-top: 0;
  color: #111827;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 16px;
  margin-bottom: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: bold;
}

input {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px;
  font-size: 15px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
}

.campo-grande {
  grid-column: 1 / -1;
}

.sucesso-texto {
  color: #15803d;
  font-weight: bold;
}

select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px;
  font-size: 15px;
  background: white;
}

select:focus {
  outline: none;
  border-color: #2563eb;
}
</style>
