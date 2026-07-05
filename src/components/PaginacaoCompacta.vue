<script setup>
import { computed } from 'vue'

const props = defineProps({
  pagina: {
    type: Number,
    default: 0,
  },
  totalPages: {
    type: Number,
    default: 0,
  },
  totalElements: {
    type: Number,
    default: 0,
  },
  disabled: {
    type: Boolean,
    default: false,
  },
  anteriorLabel: {
    type: String,
    default: 'Anterior',
  },
  proximaLabel: {
    type: String,
    default: 'Próxima',
  },
})

const emit = defineEmits(['anterior', 'proxima'])

const totalPaginas = computed(() => Math.max(Number(props.totalPages || 0), 0))
const paginaAtual = computed(() =>
  totalPaginas.value > 0 ? Math.min(Math.max(Number(props.pagina || 0) + 1, 1), totalPaginas.value) : 0,
)
const textoResumo = computed(() =>
  totalPaginas.value > 0 ? `Página ${paginaAtual.value} de ${totalPaginas.value}` : 'Nenhum resultado',
)
</script>

<template>
  <div class="paginacao">
    <div class="resumo">
      <strong>{{ textoResumo }}</strong>
      <span>{{ `${Number(props.totalElements || 0).toLocaleString('pt-BR')} encontrado(s)` }}</span>
    </div>

    <div class="acoes">
      <button
        class="botao secundario"
        type="button"
        :disabled="props.disabled || paginaAtual <= 1"
        @click="emit('anterior')"
      >
        {{ props.anteriorLabel }}
      </button>

      <button
        class="botao principal"
        type="button"
        :disabled="props.disabled || totalPaginas === 0 || paginaAtual >= totalPaginas"
        @click="emit('proxima')"
      >
        {{ props.proximaLabel }}
      </button>
    </div>
  </div>
</template>

<style scoped>
.paginacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
}

.resumo {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.resumo strong {
  color: #0f172a;
  font-size: 14px;
}

.resumo span {
  color: #64748b;
  font-size: 13px;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

@media (max-width: 520px) {
  .paginacao,
  .acoes {
    width: 100%;
  }

  .acoes .botao {
    flex: 1 1 0;
  }
}
</style>
