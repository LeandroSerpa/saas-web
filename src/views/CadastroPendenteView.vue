<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { limparSessaoAutenticacao, MENSAGEM_CADASTRO_PENDENTE } from '@/services/api'

const router = useRouter()
const mensagem = ref(sessionStorage.getItem('mensagem-cadastro-pendente') || MENSAGEM_CADASTRO_PENDENTE)

sessionStorage.removeItem('mensagem-cadastro-pendente')

function sair() {
  limparSessaoAutenticacao()
  router.push('/login')
}
</script>

<template>
  <main class="pagina-pendente">
    <section class="card-pendente">
      <span class="selo">Cadastro pendente</span>
      <h1>Acesso em análise</h1>
      <p>{{ mensagem }}</p>
      <p>Nenhuma área interna ficará disponível enquanto a aprovação não for concluída.</p>
      <div class="acoes">
        <RouterLink class="botao secundario" to="/cadastro">Cadastrar outra empresa</RouterLink>
        <button class="botao principal" type="button" @click="sair">Voltar para login</button>
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
