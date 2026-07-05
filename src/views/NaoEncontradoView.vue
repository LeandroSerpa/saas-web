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
    radial-gradient(circle at 14% 18%, rgba(37, 99, 235, .16), transparent 30%),
    #f8fafc;
  color: #0f172a;
}

.card-feedback {
  width: min(100% - 28px, 620px);
  display: grid;
  gap: 16px;
  margin: 52px auto;
  border: 1px solid #e2e8f0;
  border-radius: 22px;
  background: white;
  padding: 32px;
  box-shadow: 0 24px 60px rgba(15, 23, 42, .1);
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
  font-size: 34px;
  line-height: 1.12;
  font-weight: 900;
}

p {
  color: #475569;
  line-height: 1.6;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 6px;
}

.botao {
  min-height: 46px;
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
