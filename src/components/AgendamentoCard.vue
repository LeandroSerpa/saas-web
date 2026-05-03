<script setup>
defineProps({
  agendamento: {
    type: Object,
    required: true,
  },
  atualizando: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['alterar-status'])

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
</script>

<template>
  <article class="card agendamento">
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
      <p><strong>Funcionario:</strong> {{ agendamento.funcionario }}</p>
      <p><strong>Data/Hora:</strong> {{ formatarDataHora(agendamento.dataHoraInicio) }}</p>
      <p><strong>Preco:</strong> {{ formatarPreco(agendamento.preco) }}</p>
      <p v-if="agendamento.observacao">
        <strong>Observacao:</strong> {{ agendamento.observacao }}
      </p>
    </div>

    <div class="acoes">
      <button
        class="botao sucesso"
        :disabled="atualizando || agendamento.status === 'concluido'"
        @click="$emit('alterar-status', agendamento.id, 'concluido')"
      >
        Concluir
      </button>

      <button
        class="botao perigo"
        :disabled="atualizando || agendamento.status === 'cancelado'"
        @click="$emit('alterar-status', agendamento.id, 'cancelado')"
      >
        Cancelar
      </button>

      <button
        class="botao alerta"
        :disabled="atualizando || agendamento.status === 'faltou'"
        @click="$emit('alterar-status', agendamento.id, 'faltou')"
      >
        Faltou
      </button>
    </div>

    <p v-if="atualizando" class="atualizando">Atualizando status...</p>
  </article>
</template>
