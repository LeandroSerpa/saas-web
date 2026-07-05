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
      <div class="icone-status" aria-hidden="true">✓</div>
      <span class="selo">Cadastro pendente</span>
      <h1>Acesso em análise</h1>
      <p>{{ mensagem }}</p>
      <p>Nenhuma área interna ficará disponível enquanto a aprovação não for concluída.</p>
      <div class="linha-status">
        <span>Solicitação recebida</span>
        <span>Análise da equipe</span>
        <span>Liberação do acesso</span>
      </div>
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
    linear-gradient(110deg, rgba(14, 165, 233, .1) 0 1px, transparent 1px 100%) 0 0 / 70px 70px,
    radial-gradient(circle at 12% 18%, rgba(37, 99, 235, .18), transparent 30%),
    radial-gradient(circle at 88% 12%, rgba(20, 184, 166, .16), transparent 28%),
    #f8fafc;
  color: #0f172a;
}

.card-pendente {
  width: min(100% - 28px, 720px);
  display: grid;
  justify-items: start;
  gap: 18px;
  margin: 54px auto;
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 26px;
  background: rgba(255, 255, 255, .94);
  padding: 34px;
  box-shadow: 0 30px 80px rgba(15, 23, 42, .14);
}

.icone-status {
  display: grid;
  width: 54px;
  height: 54px;
  place-items: center;
  border-radius: 18px;
  background: linear-gradient(135deg, #2563eb, #14b8a6);
  color: white;
  font-size: 24px;
  font-weight: 900;
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
  font-size: 16px;
  line-height: 1.65;
}

.linha-status {
  width: 100%;
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.linha-status span {
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;
  padding: 12px;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 900;
  text-align: center;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  margin-top: 4px;
}

.botao {
  min-height: 48px;
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

  .linha-status {
    grid-template-columns: 1fr;
  }

  .acoes,
  .botao {
    width: 100%;
  }
}
</style>
