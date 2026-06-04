<script setup>
const props = defineProps({
  tema: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:tema'])

const opcoes = [
  {
    valor: 'claro',
    titulo: 'Claro',
  },
  {
    valor: 'escuro',
    titulo: 'Escuro',
  },
  {
    valor: 'nuvemmais',
    titulo: 'NuvemMais',
  },
]
</script>

<template>
  <label class="seletor-compacto seletor-tema" for="tema-aparencia">
    <span>Tema</span>
    <select id="tema-aparencia" :value="props.tema" @change="emit('update:tema', $event.target.value)">
      <option v-for="opcao in opcoes" :key="opcao.valor" :value="opcao.valor">
        {{ opcao.titulo }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.seletor-compacto {
  min-width: 0;
  display: grid;
  gap: 4px;
}

.seletor-compacto span {
  color: var(--app-sidebar-muted, var(--app-text-muted));
  font-size: 10px;
  font-weight: 900;
  letter-spacing: 0.08em;
  text-transform: uppercase;
}

.seletor-compacto select {
  min-width: 142px;
  padding: 8px 34px 8px 12px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background:
    linear-gradient(180deg, color-mix(in srgb, var(--app-surface) 94%, white) 0%, var(--app-surface-soft) 100%);
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  cursor: pointer;
  appearance: none;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.04);
}

.seletor-compacto select:hover {
  border-color: var(--app-primary);
}

.seletor-compacto select:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.seletor-tema select {
  min-width: 164px;
}

@media (max-width: 480px) {
  .seletor-compacto select {
    min-width: 0;
    width: 100%;
  }
}
</style>
