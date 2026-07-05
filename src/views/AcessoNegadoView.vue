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
  min-height: 70vh;
  padding: 28px 14px;
  background:
    linear-gradient(110deg, rgba(14, 165, 233, .1) 0 1px, transparent 1px 100%) 0 0 / 70px 70px,
    radial-gradient(circle at 18% 16%, rgba(37, 99, 235, .14), transparent 30%),
    #f8fafc;
  color: #0f172a;
}

.card-feedback {
  width: min(100%, 680px);
  display: grid;
  gap: 16px;
  border: 1px solid #fecaca;
  border-radius: 26px;
  background:
    radial-gradient(circle at 94% 12%, rgba(248, 113, 113, .12), transparent 28%),
    rgba(255, 255, 255, .96);
  padding: 34px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, .12);
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
  font-size: clamp(30px, 5vw, 46px);
  line-height: 1.08;
  font-weight: 900;
}

p {
  color: #475569;
  line-height: 1.65;
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

@media (max-width: 560px) {
  .card-feedback {
    padding: 22px;
  }

  .botao {
    width: 100%;
    text-align: center;
  }
}
</style>
