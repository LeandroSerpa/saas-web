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

defineEmits(['alterar-status', 'editar', 'excluir'])

function criarData(dataHora) {
  if (!dataHora) {
    return null
  }

  const data = new Date(dataHora)

  if (Number.isNaN(data.getTime())) {
    return null
  }

  return data
}

function formatarData(dataHora) {
  const data = criarData(dataHora)

  if (!data) {
    return '-'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarHorario(dataHora) {
  const data = criarData(dataHora)

  if (!data) {
    return '-'
  }

  return data.toLocaleTimeString('pt-BR', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarPeriodo(agendamento) {
  const inicio = formatarHorario(agendamento.dataHoraInicio)
  const fim = formatarHorario(agendamento.dataHoraFimVisual || agendamento.dataHoraFim)

  if (inicio === '-' && fim === '-') {
    return '-'
  }

  if (fim === '-') {
    return inicio
  }

  return `${inicio} as ${fim}`
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

function statusTexto(status) {
  const statusFormatados = {
    agendado: 'Agendado',
    concluido: 'Concluido',
    cancelado: 'Cancelado',
    faltou: 'Faltou',
  }

  return statusFormatados[status] || status || 'Agendado'
}

function podeExcluir(status) {
  return status !== 'concluido'
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
        {{ statusTexto(agendamento.status) }}
      </span>
    </div>

    <div class="detalhes">
      <p><strong>Cliente:</strong> {{ agendamento.cliente }}</p>
      <p><strong>Servico:</strong> {{ agendamento.servico }}</p>
      <p><strong>Funcionario:</strong> {{ agendamento.funcionario }}</p>
      <p><strong>Data:</strong> {{ formatarData(agendamento.dataHoraInicio) }}</p>
      <p><strong>Horario:</strong> {{ formatarPeriodo(agendamento) }}</p>
      <p v-if="agendamento.duracaoMinutosVisual">
        <strong>Duracao:</strong> {{ agendamento.duracaoMinutosVisual }} minutos
      </p>
      <p><strong>Preco:</strong> {{ formatarPreco(agendamento.preco) }}</p>
      <p><strong>Status:</strong> {{ statusTexto(agendamento.status) }}</p>
      <p v-if="agendamento.observacao">
        <strong>Observacao:</strong> {{ agendamento.observacao }}
      </p>
    </div>

    <div class="acoes">
      <button class="botao secundario" @click="$emit('editar', agendamento)">Editar</button>

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

      <button
        v-if="podeExcluir(agendamento.status)"
        class="botao excluir"
        :disabled="atualizando"
        @click="$emit('excluir', agendamento.id)"
      >
        Excluir
      </button>
    </div>

    <p v-if="atualizando" class="atualizando">Atualizando status...</p>
  </article>
</template>
