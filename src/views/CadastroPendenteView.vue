<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
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
    <PublicHeader compacto />

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

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-pendente {
  min-height: 100vh;
  background:
    radial-gradient(circle at 12% 18%, rgba(37, 99, 235, .16), transparent 30%),
    radial-gradient(circle at 88% 12%, rgba(20, 184, 166, .14), transparent 28%),
    #f8fafc;
  color: #0f172a;
}

.card-pendente {
  width: min(100% - 28px, 620px);
  display: grid;
  gap: 18px;
  margin: 52px auto;
  border: 1px solid #dbeafe;
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
  font-size: 16px;
  line-height: 1.6;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.botao {
  min-height: 46px;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  padding: 12px 18px;
  color: white;
  cursor: pointer;
  font-weight: 900;
  text-decoration: none;
}

.principal {
  background: #2563eb;
  box-shadow: 0 14px 26px rgba(37, 99, 235, .22);
}

.secundario {
  background: #0f172a;
}

@media (max-width: 560px) {
  .card-pendente {
    padding: 22px;
  }

  .acoes,
  .botao {
    width: 100%;
  }
}
</style>
