<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  atalho: {
    type: Object,
    required: true,
  },
  salvando: {
    type: Boolean,
    default: false,
  },
  podeSubir: {
    type: Boolean,
    default: false,
  },
  podeDescer: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['favorito', 'ocultar', 'fixar', 'restaurar', 'subir', 'descer'])

const possuiRota = computed(() => String(props.atalho.rota || '').trim().startsWith('/'))
const rotuloFavorito = computed(() => (props.atalho.favorito ? 'Remover favorito' : 'Favoritar'))
const rotuloFixado = computed(() => (props.atalho.fixado ? 'Desafixar' : 'Fixar'))

function alternarFavorito() {
  emit('favorito', props.atalho.chaveAtalho, !props.atalho.favorito)
}

function alternarFixado() {
  emit('fixar', props.atalho.chaveAtalho, !props.atalho.fixado)
}

function ocultar() {
  emit('ocultar', props.atalho.chaveAtalho)
}

function restaurar() {
  emit('restaurar', props.atalho.chaveAtalho)
}
</script>

<template>
  <article class="atalho-card" :class="{ 'atalho-card--oculto': atalho.oculto }">
    <div class="atalho-card-topo">
      <span class="atalho-icone" aria-hidden="true">{{ atalho.icone || 'A' }}</span>

      <div class="atalho-card-titulo">
        <p>{{ atalho.modulo }}</p>
        <h3>{{ atalho.titulo }}</h3>
      </div>
    </div>

    <p class="atalho-descricao">{{ atalho.descricao }}</p>

    <div class="atalho-badges" aria-label="Marcadores do atalho">
      <span v-if="atalho.favorito">Favorito</span>
      <span v-if="atalho.fixado">Fixado</span>
      <span v-if="atalho.oculto">Oculto</span>
      <span v-if="atalho.personalizado">Personalizado</span>
      <span>{{ atalho.tipo }}</span>
    </div>

    <div class="atalho-card-rodape">
      <RouterLink v-if="possuiRota && !atalho.oculto" class="atalho-link" :to="atalho.rota">
        Abrir
      </RouterLink>

      <button
        class="botao secundario"
        type="button"
        :disabled="salvando || atalho.oculto"
        @click="alternarFavorito"
      >
        {{ rotuloFavorito }}
      </button>

      <button class="botao secundario" type="button" :disabled="salvando || atalho.oculto" @click="alternarFixado">
        {{ rotuloFixado }}
      </button>

      <button v-if="!atalho.oculto" class="botao secundario" type="button" :disabled="salvando" @click="ocultar">
        Ocultar
      </button>

      <button v-else class="botao secundario" type="button" :disabled="salvando" @click="restaurar">
        Restaurar
      </button>

      <button class="botao icone" type="button" :disabled="salvando || !podeSubir" title="Subir" @click="$emit('subir', atalho.chaveAtalho)">
        ↑
      </button>

      <button class="botao icone" type="button" :disabled="salvando || !podeDescer" title="Descer" @click="$emit('descer', atalho.chaveAtalho)">
        ↓
      </button>
    </div>
  </article>
</template>

<style scoped>
.atalho-card {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface);
}

.atalho-card--oculto {
  background: var(--app-surface-soft);
}

.atalho-card-topo {
  display: flex;
  align-items: flex-start;
  gap: 12px;
}

.atalho-icone {
  display: inline-flex;
  width: 38px;
  min-width: 38px;
  height: 38px;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 900;
}

.atalho-card-titulo {
  min-width: 0;
}

.atalho-card-titulo p {
  margin: 0 0 4px;
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.atalho-card h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 17px;
}

.atalho-descricao {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1.45;
}

.atalho-badges,
.atalho-card-rodape {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.atalho-badges span {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 4px 8px;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
}

.botao,
.atalho-link {
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
.atalho-link,
.icone {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.atalho-link {
  display: inline-flex;
  align-items: center;
  text-decoration: none;
}

.icone {
  width: 38px;
  padding: 0;
}

.secundario:hover,
.atalho-link:hover,
.icone:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

@media (max-width: 680px) {
  .atalho-card-rodape .botao,
  .atalho-link {
    flex: 1 1 150px;
    justify-content: center;
  }

  .atalho-card-rodape .icone {
    flex: 0 0 38px;
  }
}
</style>
