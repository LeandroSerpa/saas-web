<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import {
  STATUS_DICA_DISPENSADA,
  STATUS_DICA_VISUALIZADA,
} from '@/utils/dicasUsuario'

const props = defineProps({
  dica: {
    type: Object,
    required: true,
  },
  salvando: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['visualizar', 'dispensar', 'reativar'])

const statusRotulo = computed(() => {
  if (props.dica.status === STATUS_DICA_VISUALIZADA) {
    return 'Vista'
  }

  if (props.dica.status === STATUS_DICA_DISPENSADA) {
    return 'Dispensada'
  }

  return 'Pendente'
})

const statusClasse = computed(() => {
  if (props.dica.status === STATUS_DICA_VISUALIZADA) {
    return 'dica-status--vista'
  }

  if (props.dica.status === STATUS_DICA_DISPENSADA) {
    return 'dica-status--dispensada'
  }

  return 'dica-status--pendente'
})

const podeVisualizar = computed(() => props.dica.status !== STATUS_DICA_VISUALIZADA)
const podeDispensar = computed(() => props.dica.status !== STATUS_DICA_DISPENSADA)
const podeReativar = computed(() => props.dica.status === STATUS_DICA_DISPENSADA)
const possuiRota = computed(() => String(props.dica.acaoRota || '').trim().startsWith('/'))

function visualizar() {
  emit('visualizar', props.dica.chaveDica)
}

function dispensar() {
  emit('dispensar', props.dica.chaveDica)
}

function reativar() {
  emit('reativar', props.dica.chaveDica)
}
</script>

<template>
  <article class="dica-card" :class="{ 'dica-card--dispensada': dica.status === STATUS_DICA_DISPENSADA }">
    <div class="dica-card-topo">
      <div>
        <p class="dica-modulo">{{ dica.modulo }}</p>
        <h3>{{ dica.titulo }}</h3>
      </div>

      <span class="dica-status" :class="statusClasse">{{ statusRotulo }}</span>
    </div>

    <p class="dica-descricao">{{ dica.descricao }}</p>

    <div class="dica-card-rodape">
      <RouterLink v-if="possuiRota" class="dica-link" :to="dica.acaoRota" @click="visualizar">
        {{ dica.acaoLabel || 'Ver dica' }}
      </RouterLink>

      <button v-else class="botao secundario" type="button" :disabled="salvando" @click="visualizar">
        {{ dica.acaoLabel || 'Marcar como vista' }}
      </button>

      <button v-if="podeVisualizar" class="botao secundario" type="button" :disabled="salvando" @click="visualizar">
        Marcar como vista
      </button>

      <button v-if="podeDispensar" class="botao secundario" type="button" :disabled="salvando" @click="dispensar">
        Dispensar
      </button>

      <button v-if="podeReativar" class="botao secundario" type="button" :disabled="salvando" @click="reativar">
        Reativar
      </button>
    </div>
  </article>
</template>

<style scoped>
.dica-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.dica-card--dispensada {
  background: var(--app-surface-soft);
}

.dica-card-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.dica-modulo {
  margin: 0 0 4px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.dica-card h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 17px;
}

.dica-descricao {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.dica-status {
  flex: 0 0 auto;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 5px 9px;
  font-size: 12px;
  font-weight: 800;
}

.dica-status--pendente {
  border-color: var(--app-warning);
  color: var(--app-warning);
}

.dica-status--vista {
  border-color: var(--app-success);
  color: var(--app-success);
}

.dica-status--dispensada {
  color: var(--app-text-muted);
}

.dica-card-rodape {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.botao,
.dica-link {
  min-height: 38px;
  border-radius: 8px;
  padding: 9px 13px;
  font-size: 14px;
  font-weight: 800;
}

.botao {
  border: none;
  cursor: pointer;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.secundario,
.dica-link {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.dica-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.secundario:hover,
.dica-link:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

@media (max-width: 680px) {
  .dica-card-topo {
    display: grid;
  }

  .dica-status {
    width: fit-content;
  }

  .botao,
  .dica-link {
    width: 100%;
    justify-content: center;
  }
}
</style>
