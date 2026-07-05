<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'

const route = useRoute()
const motivoGestaoEsportiva = computed(() => route.query.motivo === 'gestao-esportiva')
const titulo = computed(() =>
  motivoGestaoEsportiva.value
    ? 'O módulo de Gestão Esportiva não está habilitado para esta empresa.'
    : 'Você não tem permissão para acessar esta área.',
)
const descricao = computed(() =>
  motivoGestaoEsportiva.value
    ? 'Selecione uma empresa com o módulo ativo ou volte para uma área disponível nesta operação.'
    : 'Verifique se está usando o perfil correto ou volte para uma área disponível para sua conta.',
)
</script>

<template>
  <main class="pagina-feedback">
    <section class="card-feedback erro">
      <span class="selo">Acesso negado</span>
      <h1>{{ titulo }}</h1>
      <p>{{ descricao }}</p>
      <RouterLink class="botao" to="/dashboard">Ir para o dashboard</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.pagina-feedback {
  display: grid;
  place-items: center;
  min-height: 60vh;
  color: #0f172a;
}

.card-feedback {
  width: min(100%, 620px);
  display: grid;
  gap: 16px;
  border: 1px solid #fecaca;
  border-radius: 18px;
  background:
    radial-gradient(circle at 94% 12%, rgba(248, 113, 113, .12), transparent 28%),
    white;
  padding: 30px;
  box-shadow: 0 18px 42px rgba(15, 23, 42, .08);
}

.selo {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: 30px;
  line-height: 1.15;
  font-weight: 900;
}

p {
  color: #475569;
  line-height: 1.6;
}

.botao {
  justify-self: start;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  padding: 12px 18px;
  font-weight: 900;
  text-decoration: none;
  box-shadow: 0 14px 26px rgba(37, 99, 235, .18);
}
</style>
