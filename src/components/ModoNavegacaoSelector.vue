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
    titulo: 'Modo Essencial',
    apoio: 'Mais simples',
  },
  {
    valor: 'completo',
    titulo: 'Modo Completo',
    apoio: 'Mais recursos',
  },
]
</script>

<template>
  <section class="modo-navegacao" aria-label="Preferência de navegação">
    <div class="modo-navegacao-texto">
      <strong>Modo de navegação</strong>
      <p>Mostra só o que você usa no dia a dia.</p>
    </div>

    <div class="modo-navegacao-opcoes" role="group" aria-label="Alternar modo de navegação">
      <button
        v-for="opcao in opcoes"
        :key="opcao.valor"
        class="modo-navegacao-botao"
        :class="{ ativo: props.modo === opcao.valor }"
        type="button"
        :aria-pressed="props.modo === opcao.valor"
        @click="emit('update:modo', opcao.valor)"
      >
        <span>{{ opcao.titulo }}</span>
        <small>{{ props.modo === opcao.valor ? 'Ativo' : opcao.apoio }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.modo-navegacao {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  color: var(--app-text);
  box-shadow: var(--app-shadow);
}

.modo-navegacao-texto {
  display: grid;
  gap: 2px;
}

.modo-navegacao-texto strong {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.modo-navegacao-texto p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.modo-navegacao-opcoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.modo-navegacao-botao {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 8px 10px;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  gap: 1px;
  text-align: center;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.modo-navegacao-botao:hover {
  transform: translateY(-1px);
  border-color: var(--app-primary);
}

.modo-navegacao-botao.ativo {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.1);
}

.modo-navegacao-botao span {
  font-size: 12px;
  font-weight: 900;
}

.modo-navegacao-botao small {
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 720px) {
  .modo-navegacao-botao {
    padding: 10px 12px;
  }
}
</style>
