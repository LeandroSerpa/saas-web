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
    apoio: 'Padrão moderno',
  },
  {
    valor: 'escuro',
    titulo: 'Escuro',
    apoio: 'Alto contraste',
  },
  {
    valor: 'nuvemmais',
    titulo: 'NuvemMais',
    apoio: 'Visual da marca',
  },
]
</script>

<template>
  <section class="tema-aparencia" aria-label="Preferência de aparência">
    <div class="tema-aparencia-texto">
      <strong>Aparência</strong>
      <p>Escolha o visual do sistema.</p>
    </div>

    <div class="tema-aparencia-opcoes" role="group" aria-label="Alternar tema">
      <button
        v-for="opcao in opcoes"
        :key="opcao.valor"
        class="tema-aparencia-botao"
        :class="{ ativo: props.tema === opcao.valor }"
        type="button"
        :aria-pressed="props.tema === opcao.valor"
        @click="emit('update:tema', opcao.valor)"
      >
        <span>{{ opcao.titulo }}</span>
        <small>{{ props.tema === opcao.valor ? 'Ativo' : opcao.apoio }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.tema-aparencia {
  display: grid;
  gap: 8px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  color: var(--app-text);
  box-shadow: var(--app-shadow);
}

.tema-aparencia-texto {
  display: grid;
  gap: 2px;
}

.tema-aparencia-texto strong {
  font-size: 11px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.08em;
}

.tema-aparencia-texto p {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 700;
  line-height: 1.3;
}

.tema-aparencia-opcoes {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 8px;
}

.tema-aparencia-botao {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 10px 10px 9px;
  background: var(--app-surface);
  color: var(--app-text);
  cursor: pointer;
  display: grid;
  gap: 2px;
  text-align: center;
  transition:
    border-color 0.16s ease,
    transform 0.16s ease,
    box-shadow 0.16s ease,
    background 0.16s ease;
}

.tema-aparencia-botao:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-primary) 34%, var(--app-border));
}

.tema-aparencia-botao.ativo {
  border-color: color-mix(in srgb, var(--app-primary) 72%, white);
  background: var(--app-primary-soft);
  box-shadow: inset 0 0 0 1px color-mix(in srgb, var(--app-primary) 12%, transparent);
}

.tema-aparencia-botao span {
  font-size: 12px;
  font-weight: 900;
}

.tema-aparencia-botao small {
  color: var(--app-text-muted);
  font-size: 10px;
  font-weight: 700;
  line-height: 1.2;
}

@media (max-width: 900px) {
  .tema-aparencia-opcoes {
    grid-template-columns: 1fr;
  }
}
</style>
