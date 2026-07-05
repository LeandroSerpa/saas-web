<script setup>
import { computed } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'

const route = useRoute()
const rotaAdmin = computed(() => route.path.startsWith('/admin'))
</script>

<template>
  <main class="pagina-feedback-publica">
    <PublicHeader v-if="!rotaAdmin" compacto />

    <section class="card-feedback">
      <span class="codigo">404</span>
      <span class="selo">Rota inexistente</span>
      <h1>Esta página não foi encontrada.</h1>
      <p>O endereço acessado não existe ou não está disponível para navegação direta.</p>
      <div class="acoes">
        <RouterLink class="botao principal" :to="rotaAdmin ? '/dashboard' : '/'">
          {{ rotaAdmin ? 'Ir para o dashboard' : 'Ir para a página inicial' }}
        </RouterLink>
        <RouterLink v-if="!rotaAdmin" class="botao secundario" to="/login">Entrar no sistema</RouterLink>
      </div>
    </section>

    <PublicFooter v-if="!rotaAdmin" />
  </main>
</template>

<style scoped>
.pagina-feedback-publica {
  min-height: 100vh;
  background:
    linear-gradient(110deg, rgba(14, 165, 233, .1) 0 1px, transparent 1px 100%) 0 0 / 70px 70px,
    radial-gradient(circle at 14% 18%, rgba(37, 99, 235, .18), transparent 30%),
    radial-gradient(circle at 86% 18%, rgba(20, 184, 166, .14), transparent 28%),
    #f8fafc;
  color: #0f172a;
}

.card-feedback {
  width: min(100% - 28px, 680px);
  display: grid;
  justify-items: start;
  gap: 16px;
  margin: 54px auto;
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 26px;
  background: rgba(255, 255, 255, .94);
  padding: 34px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, .14);
}

.codigo {
  display: inline-flex;
  border-radius: 16px;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  padding: 10px 14px;
  color: white;
  font-size: 28px;
  font-weight: 900;
  line-height: 1;
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: clamp(34px, 5vw, 52px);
  line-height: 1.06;
  font-weight: 900;
}

p {
  color: #475569;
  line-height: 1.65;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.botao {
  min-height: 48px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;
  padding: 12px 18px;
  font-weight: 900;
  text-decoration: none;
}

.principal {
  background: #2563eb;
  color: white;
  box-shadow: 0 14px 26px rgba(37, 99, 235, .22);
}

.secundario {
  border: 1px solid #cbd5e1;
  background: white;
  color: #0f172a;
}

@media (max-width: 560px) {
  .card-feedback {
    padding: 22px;
  }

  .acoes,
  .botao {
    width: 100%;
  }
}
</style>
