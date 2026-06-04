<script setup>
const props = defineProps({
  modo: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:modo'])

const opcoes = [
  {
    valor: 'essencial',
    titulo: 'Essencial',
  },
  {
    valor: 'completo',
    titulo: 'Completo',
  },
]
</script>

<template>
  <label class="seletor-compacto seletor-modo" for="modo-navegacao">
    <span class="seletor-rotulo">Modo:</span>
    <select id="modo-navegacao" :value="props.modo" @change="emit('update:modo', $event.target.value)">
      <option v-for="opcao in opcoes" :key="opcao.valor" :value="opcao.valor">
        {{ opcao.titulo }}
      </option>
    </select>
  </label>
</template>

<style scoped>
.seletor-compacto {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 8px;
  padding: 7px 10px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-soft);
  color: var(--app-text);
  box-shadow: none;
}

.seletor-rotulo {
  flex: 0 0 auto;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.seletor-compacto select {
  min-width: 118px;
  padding: 0 22px 0 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  cursor: pointer;
  appearance: none;
  box-shadow: none;
}

.seletor-compacto select:hover {
  color: var(--app-primary);
}

.seletor-compacto select:focus {
  outline: none;
  color: var(--app-primary);
  box-shadow: none;
}

.seletor-modo select {
  min-width: 128px;
}

@media (max-width: 480px) {
  .seletor-compacto {
    width: 100%;
    justify-content: space-between;
  }

  .seletor-compacto select {
    min-width: 0;
    width: auto;
  }
}
</style>
