<script setup>
defineProps({
  modo: {
    type: String,
    required: true,
  },
})

defineEmits(['update:modo'])

const opcoes = [
  {
    valor: 'essencial',
    titulo: 'Modo Essencial',
    apoio: 'Mostra apenas as funções principais',
  },
  {
    valor: 'completo',
    titulo: 'Modo Completo',
    apoio: 'Mostra todos os recursos',
  },
]
</script>

<template>
  <section class="modo-navegacao" aria-label="Preferência de navegação">
    <div class="modo-navegacao-texto">
      <strong>Modo de navegação</strong>
      <p>Use o Modo Essencial para ver só o que você usa no dia a dia.</p>
    </div>

    <div class="modo-navegacao-opcoes" role="group" aria-label="Alternar modo de navegação">
      <button
        v-for="opcao in opcoes"
        :key="opcao.valor"
        class="modo-navegacao-botao"
        :class="{ ativo: modo === opcao.valor }"
        type="button"
        :aria-pressed="modo === opcao.valor"
        @click="$emit('update:modo', opcao.valor)"
      >
        <span>{{ opcao.titulo }}</span>
        <small>{{ opcao.apoio }}</small>
      </button>
    </div>
  </section>
</template>

<style scoped>
.modo-navegacao {
  display: grid;
  gap: 8px;
  padding: 12px 14px;
  border: 1px solid #dbeafe;
  border-radius: 12px;
  background: linear-gradient(180deg, #f8fbff 0%, #eff6ff 100%);
  color: #1e3a8a;
}

.modo-navegacao-texto {
  display: grid;
  gap: 2px;
}

.modo-navegacao-texto strong {
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
  letter-spacing: 0.04em;
}

.modo-navegacao-texto p {
  margin: 0;
  color: #31517e;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.35;
}

.modo-navegacao-opcoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 8px;
}

.modo-navegacao-botao {
  border: 1px solid #bfdbfe;
  border-radius: 10px;
  padding: 10px 12px;
  background: white;
  color: #1e3a8a;
  cursor: pointer;
  display: grid;
  gap: 3px;
  text-align: left;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.modo-navegacao-botao:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
}

.modo-navegacao-botao.ativo {
  border-color: #2563eb;
  background: #dbeafe;
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.modo-navegacao-botao span {
  font-size: 13px;
  font-weight: 900;
}

.modo-navegacao-botao small {
  color: #516b8f;
  font-size: 11px;
  font-weight: 700;
  line-height: 1.3;
}

@media (max-width: 720px) {
  .modo-navegacao-opcoes {
    grid-template-columns: 1fr;
  }
}
</style>
