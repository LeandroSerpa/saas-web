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

function obterDataAgendamento() {
  return String(agendamento.value.dataHoraInicio || '').slice(0, 10)
}

function obterHoraAgendamento() {
  const texto = String(agendamento.value.dataHoraInicio || '')
  const horario = texto.includes('T') ? texto.split('T')[1] : ''

  return horario.slice(0, 5)
}

function atualizarDataAgendamento(data) {
  agendamento.value.dataHoraInicio = montarDataHora(data, obterHoraAgendamento())
}

function atualizarHoraAgendamento(valor) {
  const hora = aplicarMascaraHora(valor)

  agendamento.value.dataHoraInicio = montarDataHora(obterDataAgendamento(), hora)
}

function montarDataHora(data, hora) {
  if (!data && !hora) {
    return ''
  }

  return `${data || ''}${data || hora ? 'T' : ''}${hora || ''}`
}

function aplicarMascaraHora(valor) {
  const numeros = String(valor || '').replace(/\D/g, '').slice(0, 4)

  return numeros.length > 2 ? `${numeros.slice(0, 2)}:${numeros.slice(2)}` : numeros
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
        Serviço *
        <select v-model="agendamento.servicoId">
          <option value="">Selecione um serviço</option>
          <option v-for="servico in servicos" :key="servico.id" :value="servico.id">
            {{ servico.nome }} - {{ formatarPreco(servico.preco) }}
          </option>
        </select>
      </label>

      <label>
        Funcionário *
        <select v-model="agendamento.funcionarioId">
          <option value="">{{ carregandoFuncionarios ? 'Carregando funcionários...' : 'Selecione um funcionário' }}</option>
          <option v-for="funcionario in funcionarios" :key="funcionario.id" :value="funcionario.id">
            {{ funcionario.nome }}
          </option>
        </select>
      </label>

      <label>
        Data *
        <input :value="obterDataAgendamento()" type="date" @input="atualizarDataAgendamento($event.target.value)" />
      </label>

      <label>
        Hora *
        <input
          :value="obterHoraAgendamento()"
          type="text"
          inputmode="numeric"
          maxlength="5"
          placeholder="HH:mm"
          @input="atualizarHoraAgendamento($event.target.value)"
        />
      </label>

      <div v-if="duracaoMinutos || terminoPrevisto" class="campo-grande previa-agendamento">
        <p v-if="duracaoMinutos">Duração: {{ duracaoMinutos }} minutos</p>
        <p v-if="terminoPrevisto">Término previsto: {{ terminoPrevisto }}</p>
      </div>

      <label class="campo-grande">
        Observação
        <input
          v-model="agendamento.observacao"
          type="text"
          placeholder="Ex: Cliente pediu preferência por horário pontual"
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
