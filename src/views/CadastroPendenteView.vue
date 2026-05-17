<script setup>
import { RouterLink, useRouter } from 'vue-router'

const router = useRouter()

function sair() {
  localStorage.removeItem('token')
  localStorage.removeItem('usuario')
  router.push('/login')
}
</script>

<template>
  <main class="pagina-pendente">
    <section class="card-pendente">
      <span class="selo">Cadastro pendente</span>
      <h1>Acesso em análise</h1>
      <p>Sua empresa está com cadastro pendente de aprovação. Assim que nossa equipe aprovar, seu acesso completo será liberado.</p>
      <div class="acoes">
        <RouterLink class="botao secundario" to="/login">Voltar para login</RouterLink>
        <button class="botao principal" type="button" @click="sair">Sair</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina-pendente {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #eef2f7;
  color: #111827;
}

.card-pendente {
  width: 100%;
  max-width: 560px;
  display: grid;
  gap: 18px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.08);
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: 30px;
  font-weight: 800;
}

p {
  color: #475569;
  font-size: 16px;
  line-height: 1.5;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 12px 18px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}
</style>
