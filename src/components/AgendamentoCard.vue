<script setup>
const props = defineProps({
  agendamento: {
    type: Object,
    required: true,
  },
  atualizando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['alterar-status', 'editar', 'excluir', 'copiar-resumo'])

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

function formatarHorário(dataHora) {
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
  const inicio = formatarHorário(agendamento.dataHoraInicio)
  const fim = formatarHorário(agendamento.dataHoraFimVisual || agendamento.dataHoraFim)

  if (inicio === '-' && fim === '-') {
    return '-'
  }

  if (fim === '-') {
    return inicio
  }

  return `${inicio} as ${fim}`
}

function formatarPreço(preco) {
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

function origemTexto(agendamento) {
  return agendamento?.ehPublico ? 'Público' : 'Interno'
}

function origemClasse(agendamento) {
  return agendamento?.ehPublico ? 'origem-badge publico' : 'origem-badge interno'
}

function origemMensagem(agendamento) {
  return agendamento?.ehPublico ? 'Recebido pelo link público' : 'Criado internamente'
}

function formatarProtocolo(agendamento) {
  const protocolo = String(agendamento?.protocoloVisual || '')
    .trim()
    .replace(/^#/, '')

  return protocolo ? `#${protocolo}` : '-'
}

function montarResumoCopiavel(agendamento) {
  return [
    `Cliente: ${agendamento?.cliente || '-'}`,
    `Serviço: ${agendamento?.servico || '-'}`,
    `Funcionário: ${agendamento?.funcionario || '-'}`,
    `Data: ${formatarData(agendamento?.dataHoraInicio)}`,
    `Horário: ${formatarPeriodo(agendamento)}`,
    `Status: ${statusTexto(agendamento?.status)}`,
    `Protocolo: ${formatarProtocolo(agendamento)}`,
  ].join('\n')
}

async function copiarResumo(agendamento) {
  const texto = montarResumoCopiavel(agendamento)

  if (!navigator?.clipboard?.writeText) {
    emit('copiar-resumo', { sucesso: false })
    return
  }

  try {
    await navigator.clipboard.writeText(texto)
    emit('copiar-resumo', { sucesso: true })
  } catch (error) {
    console.error(error)
    emit('copiar-resumo', { sucesso: false })
  }
}
</script>

<template>
  <article :class="['card', 'agendamento', { 'origem-publica-card': props.agendamento.ehPublico }]">
    <div class="topo-card">
      <div>
        <h3>{{ props.agendamento.cliente }}</h3>
        <p class="servico">{{ props.agendamento.servico }}</p>
      </div>

      <div class="topo-status">
        <span :class="origemClasse(props.agendamento)">
          {{ origemTexto(props.agendamento) }}
        </span>
        <span :class="statusClasse(props.agendamento.status)">
          {{ statusTexto(props.agendamento.status) }}
        </span>
      </div>
    </div>

    <p class="origem-descricao">{{ origemMensagem(props.agendamento) }}</p>

    <div class="detalhes">
      <p><strong>Cliente:</strong> {{ props.agendamento.cliente }}</p>
      <p><strong>Serviço:</strong> {{ props.agendamento.servico }}</p>
      <p><strong>Funcionário:</strong> {{ props.agendamento.funcionario }}</p>
      <p><strong>Data:</strong> {{ formatarData(props.agendamento.dataHoraInicio) }}</p>
      <p><strong>Horário:</strong> {{ formatarPeriodo(props.agendamento) }}</p>
      <p v-if="props.agendamento.protocoloVisual">
        <strong>Protocolo:</strong> {{ formatarProtocolo(props.agendamento) }}
      </p>
      <p v-if="props.agendamento.duracaoMinutosVisual">
        <strong>Duração:</strong> {{ props.agendamento.duracaoMinutosVisual }} minutos
      </p>
      <p><strong>Preço:</strong> {{ formatarPreço(props.agendamento.preco) }}</p>
      <p><strong>Status:</strong> {{ statusTexto(props.agendamento.status) }}</p>
      <p v-if="props.agendamento.observacao">
        <strong>Observação:</strong> {{ props.agendamento.observacao }}
      </p>
    </div>

    <div class="acoes">
      <button class="botao secundario" @click="emit('editar', props.agendamento)">Editar</button>

      <button class="botao copiar" @click="copiarResumo(props.agendamento)">Copiar resumo</button>

      <button
        class="botao sucesso"
        :disabled="props.atualizando || props.agendamento.status === 'concluido'"
        @click="emit('alterar-status', props.agendamento.id, 'concluido')"
      >
        Concluir
      </button>

      <button
        class="botao perigo"
        :disabled="props.atualizando || props.agendamento.status === 'cancelado'"
        @click="emit('alterar-status', props.agendamento.id, 'cancelado')"
      >
        Cancelar
      </button>

      <button
        class="botao alerta"
        :disabled="props.atualizando || props.agendamento.status === 'faltou'"
        @click="emit('alterar-status', props.agendamento.id, 'faltou')"
      >
        Faltou
      </button>

      <button
        v-if="podeExcluir(props.agendamento.status)"
        class="botao excluir"
        :disabled="props.atualizando"
        @click="emit('excluir', props.agendamento.id)"
      >
        Excluir
      </button>
    </div>

    <p v-if="props.atualizando" class="atualizando">Atualizando status...</p>
  </article>
</template>

<style scoped>
.origem-publica-card {
  border-color: #bfdbfe;
  background: linear-gradient(180deg, #f8fcff 0%, #ffffff 42%);
}

.topo-status {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 8px;
}

.origem-badge {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.origem-badge.publico {
  background: #dcfce7;
  color: #15803d;
}

.origem-badge.interno {
  background: #e2e8f0;
  color: #334155;
}

.origem-descricao {
  margin: -2px 0 0;
  color: #475569;
  font-size: 13px;
  font-weight: 700;
}

.copiar {
  background: #1f2937;
}

.copiar:hover {
  background: #111827;
}

@media (max-width: 900px) {
  .topo-status {
    justify-content: flex-start;
  }
}
</style>


