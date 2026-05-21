<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <main class="pagina-feedback">
    <section class="card-feedback erro">
      <span class="selo">Acesso negado</span>
      <h1>Você não tem permissão para acessar esta área.</h1>
      <p>Verifique se está usando o perfil correto ou volte para uma área disponível para sua conta.</p>
      <RouterLink class="botao" to="/dashboard">Ir para o dashboard</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.pagina-feedback {
  display: grid;
  place-items: center;
  min-height: 60vh;
  color: #111827;
}

.card-feedback {
  width: min(100%, 560px);
  display: grid;
  gap: 14px;
  background: white;
  border: 1px solid #fecaca;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.selo {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: 28px;
  font-weight: 800;
  letter-spacing: 0;
}

p {
  color: #475569;
  line-height: 1.5;
}

.botao {
  justify-self: start;
  border-radius: 8px;
  padding: 11px 16px;
  color: white;
  background: #2563eb;
  font-weight: 800;
  text-decoration: none;
}
</style>
