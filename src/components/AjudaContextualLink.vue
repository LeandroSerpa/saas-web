<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  topico: {
    type: String,
    required: true,
  },
  rotulo: {
    type: String,
    default: 'Ajuda desta tela',
  },
  ariaLabel: {
    type: String,
    default: '',
  },
})

const destino = computed(() => ({
  path: '/ajuda',
  query: { topico: props.topico },
}))

const rotuloAria = computed(() => props.ariaLabel || `Abrir ajuda da tela ${props.rotulo}`)
</script>

<template>
  <RouterLink class="ajuda-contextual" :to="destino" :aria-label="rotuloAria">
    <span class="ajuda-contextual-icone" aria-hidden="true">?</span>
    <span class="ajuda-contextual-texto">{{ rotulo }}</span>
  </RouterLink>
</template>

<style scoped>
.ajuda-contextual {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 8px 12px;
  border: 1px solid var(--app-border, #cbd5e1);
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-surface, #ffffff) 92%, var(--app-primary, #2563eb) 8%);
  color: var(--app-text, #0f172a);
  text-decoration: none;
  font-size: 12px;
  font-weight: 800;
  line-height: 1;
  white-space: nowrap;
  box-shadow: 0 1px 2px rgba(15, 23, 42, 0.05);
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease;
}

.ajuda-contextual:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-primary, #2563eb) 35%, var(--app-border, #cbd5e1));
  background: color-mix(in srgb, var(--app-primary, #2563eb) 10%, var(--app-surface, #ffffff));
}

.ajuda-contextual:focus-visible {
  outline: 3px solid color-mix(in srgb, var(--app-primary, #2563eb) 24%, white);
  outline-offset: 2px;
}

.ajuda-contextual-icone {
  display: inline-grid;
  place-items: center;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  background: color-mix(in srgb, var(--app-primary, #2563eb) 16%, var(--app-surface, #ffffff));
  color: var(--app-primary, #2563eb);
  font-size: 12px;
  flex: 0 0 auto;
}

.ajuda-contextual-texto {
  display: inline-block;
}

@media (max-width: 720px) {
  .ajuda-contextual {
    width: 100%;
    justify-content: center;
  }
}
</style>
