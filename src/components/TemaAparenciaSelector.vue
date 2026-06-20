<script setup>
import { obterOpcoesTemasInternos } from '@/utils/temasInternos'

const props = defineProps({
  tema: {
    type: String,
    required: true,
  },
})

const emit = defineEmits(['update:tema'])

const opcoes = obterOpcoesTemasInternos().map((tema) => ({
  valor: tema.valor,
  titulo: tema.nome,
}))
</script>

<template>
  <label class="seletor-compacto seletor-tema" for="tema-aparencia">
    <span class="seletor-rotulo">Tema:</span>
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
  min-width: 112px;
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

.seletor-tema select {
  min-width: 112px;
}

@media (max-width: 480px) {
  .seletor-compacto {
    max-width: 100%;
    padding-inline: 9px;
  }

  .seletor-rotulo {
    display: none;
  }
}
</style>
