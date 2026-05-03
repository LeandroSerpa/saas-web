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
    <header class="topo-sistema">
      <div>
        <p class="subtitulo">Plataforma de Gestão Empresarial</p>
        <h1>Gestão SaaS</h1>
        <p class="descricao">Gerencie clientes e agendamentos da empresa em um só lugar.</p>
      </div>

      <button class="botao botao-claro" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section class="grade-formularios">
      <section class="card formulario">
        <div class="titulo-card">
          <h2>Novo cliente</h2>
          <p>Cadastre um cliente para usar nos agendamentos.</p>
        </div>

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

        <div class="rodape-formulario">
          <button class="botao principal" @click="salvarCliente">Cadastrar cliente</button>

          <p v-if="mensagemSucessoCliente" class="sucesso-texto">
            {{ mensagemSucessoCliente }}
          </p>
        </div>
      </section>

      <section class="card formulario">
        <div class="titulo-card">
          <h2>Novo agendamento</h2>
          <p>Escolha cliente, serviço, funcionário e horário.</p>
        </div>

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

        <div class="rodape-formulario">
          <button class="botao principal" @click="salvarAgendamento">
            Cadastrar agendamento
          </button>

          <p v-if="mensagemSucessoAgendamento" class="sucesso-texto">
            {{ mensagemSucessoAgendamento }}
          </p>
        </div>
      </section>
    </section>

    <section class="secao-agenda">
      <div class="cabecalho-lista">
        <div>
          <h2>Agendamentos</h2>
          <p>Lista de horários cadastrados na API publicada no EasyPanel.</p>
        </div>

        <span class="contador">{{ agendamentos.length }} agendamento(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando agendamentos...</p>
      </section>

      <section v-else-if="agendamentos.length === 0" class="card">
        <p>Nenhum agendamento encontrado.</p>
      </section>

      <section v-else class="lista">
        <article v-for="agendamento in agendamentos" :key="agendamento.id" class="card agendamento">
          <div class="topo-card">
            <div>
              <h3>{{ agendamento.cliente }}</h3>
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
    </section>
  </main>
</template>

<style scoped>
.pagina {
  min-height: 100vh;
  background: #f3f4f6;
  padding: 32px;
  font-family: Arial, sans-serif;
  color: #111827;
}

.topo-sistema {
  max-width: 1180px;
  margin: 0 auto 24px;
  background: linear-gradient(135deg, #1d4ed8, #2563eb);
  color: white;
  border-radius: 18px;
  padding: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
  box-shadow: 0 10px 24px rgba(37, 99, 235, 0.18);
}

.subtitulo {
  margin: 0 0 6px;
  font-size: 14px;
  opacity: 0.9;
}

.topo-sistema h1 {
  margin: 0;
  font-size: 34px;
}

.descricao {
  margin: 8px 0 0;
  opacity: 0.95;
}

.grade-formularios {
  max-width: 1180px;
  margin: 0 auto 24px;
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.secao-agenda {
  max-width: 1180px;
  margin: 0 auto;
}

.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16px;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
}

.cabecalho-lista p {
  margin: 6px 0 0;
  color: #6b7280;
}

.contador {
  background: #e0e7ff;
  color: #3730a3;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: bold;
  font-size: 14px;
  white-space: nowrap;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 16px;
  padding: 22px;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.06);
}

.formulario {
  display: grid;
  gap: 16px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
}

.titulo-card p {
  margin: 6px 0 0;
  color: #6b7280;
  font-size: 14px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: bold;
  font-size: 14px;
}

input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.campo-grande {
  grid-column: 1 / -1;
}

.rodape-formulario {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
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

.agendamento h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
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
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: bold;
  text-transform: uppercase;
  white-space: nowrap;
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
  padding: 10px 16px;
  border-radius: 10px;
  cursor: pointer;
  font-weight: bold;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
}

.botao-claro {
  background: rgba(255, 255, 255, 0.16);
  color: white;
  min-width: 140px;
}

.botao-claro:hover {
  background: rgba(255, 255, 255, 0.24);
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
  max-width: 1180px;
  margin: 0 auto 20px;
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-texto {
  color: #15803d;
  font-weight: bold;
  margin: 0;
}

.atualizando {
  margin: 0;
  color: #6b7280;
  font-size: 14px;
}

@media (max-width: 900px) {
  .topo-sistema {
    flex-direction: column;
    align-items: flex-start;
  }

  .grade-formularios,
  .lista {
    grid-template-columns: 1fr;
  }

  .campos {
    grid-template-columns: 1fr;
  }

  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .pagina {
    padding: 18px;
  }
}
</style>