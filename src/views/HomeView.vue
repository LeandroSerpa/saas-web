<script setup>
import { computed, onMounted, ref } from 'vue'
import AgendamentoCard from '@/components/AgendamentoCard.vue'
import AgendamentoForm from '@/components/AgendamentoForm.vue'
import {
  buscarAgendamentos,
  buscarClientes,
  buscarFuncionarios,
  buscarServicos,
  atualizarStatusAgendamento,
  cadastrarAgendamento,
} from '@/services/api'

const agendamentos = ref([])
const clientes = ref([])
const servicos = ref([])
const funcionarios = ref([])

const carregando = ref(true)
const erro = ref('')
const atualizandoId = ref(null)
const mensagemSucessoAgendamento = ref('')

const novoAgendamento = ref({
  clienteId: '',
  servicoId: '',
  funcionarioId: '',
  dataHoraInicio: '',
  observacao: '',
})

const servicosAtivos = computed(() => servicos.value.filter((servico) => servico.ativo === true))
const funcionariosAtivos = computed(() =>
  funcionarios.value.filter((funcionario) => funcionario.ativo === true),
)

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
    erro.value = 'Nao foi possivel carregar os dados.'
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
    erro.value = 'Nao foi possivel carregar os agendamentos.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function alterarStatus(id, status) {
  try {
    atualizandoId.value = id
    erro.value = ''
    mensagemSucessoAgendamento.value = ''

    await atualizarStatusAgendamento(id, status)
    await carregarAgendamentos()

    mensagemSucessoAgendamento.value = 'Status atualizado com sucesso.'
  } catch (error) {
    erro.value = 'Nao foi possivel atualizar o status do agendamento.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

async function salvarAgendamento() {
  try {
    erro.value = ''
    mensagemSucessoAgendamento.value = ''

    if (!novoAgendamento.value.clienteId) {
      erro.value = 'Selecione um cliente.'
      return
    }

    if (!novoAgendamento.value.servicoId) {
      erro.value = 'Selecione um servico.'
      return
    }

    if (!novoAgendamento.value.funcionarioId) {
      erro.value = 'Selecione um funcionario.'
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
    erro.value = 'Nao foi possivel cadastrar o agendamento.'
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

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Operacao diaria</p>
        <h1>Agenda</h1>
        <p class="descricao">Cadastre e acompanhe os agendamentos da empresa.</p>
      </div>

      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section class="grade-formularios">
      <AgendamentoForm
        v-model="novoAgendamento"
        :clientes="clientes"
        :servicos="servicosAtivos"
        :funcionarios="funcionariosAtivos"
        :mensagem-sucesso="mensagemSucessoAgendamento"
        @salvar="salvarAgendamento"
      />
    </section>

    <section class="secao-agenda">
      <div class="cabecalho-lista">
        <div>
          <h2>Agendamentos</h2>
          <p>Lista de horarios cadastrados na API publicada no EasyPanel.</p>
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
        <AgendamentoCard
          v-for="agendamento in agendamentos"
          :key="agendamento.id"
          :agendamento="agendamento"
          :atualizando="atualizandoId === agendamento.id"
          @alterar-status="alterarStatus"
        />
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

.cabecalho-pagina {
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

.descricao {
  margin: 6px 0 0;
  color: #64748b;
}

.grade-formularios {
  display: grid;
  grid-template-columns: 1fr;
  gap: 20px;
}

.secao-agenda {
  display: grid;
  gap: 16px;
}

.cabecalho-lista {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.cabecalho-lista p {
  margin: 6px 0 0;
  color: #64748b;
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
:deep(select) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(input:focus),
:deep(select:focus) {
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

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

:deep(.agendamento) {
  display: grid;
  gap: 14px;
}

:deep(.topo-card) {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 12px;
}

:deep(.agendamento h3) {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

:deep(.servico) {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

:deep(.detalhes p) {
  margin: 6px 0;
  color: #374151;
}

:deep(.detalhes strong) {
  font-weight: 800;
}

:deep(.status) {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

:deep(.status.agendado) {
  background: #dbeafe;
  color: #1d4ed8;
}

:deep(.status.concluido) {
  background: #dcfce7;
  color: #15803d;
}

:deep(.status.cancelado) {
  background: #fee2e2;
  color: #b91c1c;
}

:deep(.status.faltou) {
  background: #fef3c7;
  color: #92400e;
}

:deep(.acoes) {
  display: flex;
  gap: 10px;
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

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
}

:deep(.sucesso) {
  background: #16a34a;
}

:deep(.sucesso:hover) {
  background: #15803d;
}

:deep(.perigo) {
  background: #dc2626;
}

:deep(.perigo:hover) {
  background: #b91c1c;
}

:deep(.alerta) {
  background: #d97706;
}

:deep(.alerta:hover) {
  background: #b45309;
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

:deep(.atualizando) {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .grade-formularios,
  .lista,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
