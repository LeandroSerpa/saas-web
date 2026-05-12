<script setup>
const agendamento = defineModel({
  type: Object,
  required: true,
})

defineProps({
  clientes: {
    type: Array,
    default: () => [],
  },
  servicos: {
    type: Array,
    default: () => [],
  },
  funcionarios: {
    type: Array,
    default: () => [],
  },
  mensagemSucesso: {
    type: String,
    default: '',
  },
  modoEdicao: {
    type: Boolean,
    default: false,
  },
  duracaoMinutos: {
    type: Number,
    default: null,
  },
  terminoPrevisto: {
    type: String,
    default: '',
  },
  carregandoFuncionarios: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['salvar', 'cancelar'])

function formatarPreco(preco) {
  if (preco === null || preco === undefined) {
    return 'R$ 0,00'
  }

  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar agendamento' : 'Novo agendamento' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize cliente, serviço, funcionário e horário.'
            : 'Escolha cliente, serviço, funcionário e horário.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Cliente *
        <select v-model="agendamento.clienteId">
          <option value="">Selecione um cliente</option>
          <option v-for="cliente in clientes" :key="cliente.id" :value="cliente.id">
            {{ cliente.nome }}
          </option>
        </select>
      </label>

      <label>
        Servico *
        <select v-model="agendamento.servicoId">
          <option value="">Selecione um servico</option>
          <option v-for="servico in servicos" :key="servico.id" :value="servico.id">
            {{ servico.nome }} - {{ formatarPreco(servico.preco) }}
          </option>
        </select>
      </label>

      <label>
        Funcionario *
        <select v-model="agendamento.funcionarioId">
          <option value="">{{ carregandoFuncionarios ? 'Carregando funcionarios...' : 'Selecione um funcionario' }}</option>
          <option v-for="funcionario in funcionarios" :key="funcionario.id" :value="funcionario.id">
            {{ funcionario.nome }}
          </option>
        </select>
      </label>

      <label>
        Data e hora *
        <input v-model="agendamento.dataHoraInicio" type="datetime-local" />
      </label>

      <div v-if="duracaoMinutos || terminoPrevisto" class="campo-grande previa-agendamento">
        <p v-if="duracaoMinutos">Duração: {{ duracaoMinutos }} minutos</p>
        <p v-if="terminoPrevisto">Término previsto: {{ terminoPrevisto }}</p>
      </div>

      <label class="campo-grande">
        Observacao
        <input
          v-model="agendamento.observacao"
          type="text"
          placeholder="Ex: Cliente pediu preferencia por horario pontual"
        />
      </label>
    </div>

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
        {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar agendamento' }}
      </button>

      <button v-if="modoEdicao" class="botao secundario" @click="$emit('cancelar')">
        Cancelar
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
