<script setup>
import { computed } from 'vue'

const props = defineProps({
  titulo: {
    type: String,
    required: true,
  },
  ajuda: {
    type: String,
    default: '',
  },
  quantidadeTexto: {
    type: String,
    required: true,
  },
  selecionados: {
    type: Array,
    default: () => [],
  },
  limiteChips: {
    type: Number,
    default: 4,
  },
  vazioTexto: {
    type: String,
    default: 'Nenhum item selecionado.',
  },
  botaoGerenciarTexto: {
    type: String,
    default: 'Gerenciar',
  },
  botaoLimparTexto: {
    type: String,
    default: 'Limpar seleção',
  },
  desabilitado: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['gerenciar', 'limpar'])

const chipsVisiveis = computed(() => props.selecionados.slice(0, props.limiteChips))
const chipsExtras = computed(() => Math.max(props.selecionados.length - chipsVisiveis.value.length, 0))

function rotuloSelecionado(item = {}) {
  const candidatos = [
    item?.nome,
    item?.clienteNome,
    item?.turmaNome,
  ]
    .map((valor) => String(valor || '').trim())
    .filter(Boolean)
  const idsTecnicos = new Set(
    [item?.id, item?.clienteId, item?.turmaId].map((valor) => String(valor || '').trim()).filter(Boolean),
  )
  const nomeVisivel = candidatos.find((valor) => !idsTecnicos.has(valor))

  return nomeVisivel || candidatos[0] || 'Selecionado'
}
</script>

<template>
  <section class="resumo-card">
    <div class="cabecalho">
      <div>
        <h3>{{ props.titulo }}</h3>
        <p v-if="props.ajuda">{{ props.ajuda }}</p>
      </div>
      <span class="contador">{{ props.quantidadeTexto }}</span>
    </div>

    <div v-if="props.selecionados.length" class="chips" :aria-label="props.titulo">
      <span v-for="item in chipsVisiveis" :key="item.id || item.clienteId || item.turmaId || item.nome" class="chip">
        {{ rotuloSelecionado(item) }}
      </span>
      <span v-if="chipsExtras > 0" class="chip chip-sutil">
        {{ `+ ${chipsExtras}` }}
      </span>
    </div>

    <p v-else class="estado-vazio">{{ props.vazioTexto }}</p>

    <div class="acoes">
      <button class="botao principal" type="button" :disabled="props.desabilitado" @click="emit('gerenciar', $event)">
        {{ props.botaoGerenciarTexto }}
      </button>
      <button
        v-if="props.selecionados.length"
        class="botao secundario"
        type="button"
        :disabled="props.desabilitado"
        @click="emit('limpar')"
      >
        {{ props.botaoLimparTexto }}
      </button>
    </div>
  </section>
</template>

<style scoped>
.resumo-card {
  display: grid;
  gap: 14px;
  min-width: 0;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.cabecalho h3,
.cabecalho p,
.estado-vazio {
  margin: 0;
}

.cabecalho h3 {
  color: #0f172a;
}

.cabecalho p,
.estado-vazio {
  color: #64748b;
}

.contador {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  white-space: nowrap;
}

.chips {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.chip {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 7px 11px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 700;
}

.chip-sutil {
  background: #e2e8f0;
  color: #334155;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 760px) {
  .cabecalho,
  .acoes {
    flex-direction: column;
    align-items: stretch;
  }
}
</style>
