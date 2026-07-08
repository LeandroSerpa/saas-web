<script setup>
defineProps({
  id: {
    type: String,
    required: true,
  },
  titulo: {
    type: String,
    required: true,
  },
  descricao: {
    type: String,
    default: '',
  },
  aberta: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <details :id="id" class="minha-conta-secao" :open="aberta">
    <summary class="minha-conta-secao-resumo">
      <div>
        <p class="minha-conta-secao-rotulo">{{ titulo }}</p>
        <p v-if="descricao" class="minha-conta-secao-descricao">{{ descricao }}</p>
      </div>
      <span aria-hidden="true" class="minha-conta-secao-indicador">Abrir</span>
    </summary>

    <div class="minha-conta-secao-conteudo">
      <slot />
    </div>
  </details>
</template>

<style scoped>
.minha-conta-secao {
  display: grid;
  gap: 0;
  border: 1px solid var(--app-border);
  border-radius: 18px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
  overflow: hidden;
}

.minha-conta-secao[open] {
  border-color: rgba(37, 99, 235, 0.28);
}

.minha-conta-secao-resumo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 16px;
  padding: 18px 20px;
  cursor: pointer;
  list-style: none;
}

.minha-conta-secao-resumo::-webkit-details-marker {
  display: none;
}

.minha-conta-secao-rotulo {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
  font-weight: 800;
}

.minha-conta-secao-descricao {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 14px;
  line-height: 1.55;
}

.minha-conta-secao-indicador {
  flex: 0 0 auto;
  border-radius: 999px;
  padding: 8px 12px;
  background: var(--app-surface-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
}

.minha-conta-secao[open] .minha-conta-secao-indicador {
  background: var(--app-primary);
  color: white;
}

.minha-conta-secao-conteudo {
  display: grid;
  gap: 18px;
  padding: 0 20px 20px;
}

@media (max-width: 900px) {
  .minha-conta-secao-resumo {
    align-items: flex-start;
    flex-direction: column;
  }

  .minha-conta-secao-conteudo {
    padding-inline: 16px;
    padding-bottom: 16px;
  }
}
</style>
