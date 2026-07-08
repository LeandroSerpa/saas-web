<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { buscarPlanosPublicos } from '@/services/api'
import {
  formatarPrecoPlanoPublico,
  normalizarPlanosPublicos,
  obterPlanosPublicosFallback,
  resolverPlanoPublicoRecomendado,
} from '@/utils/planosPublicos'
import { obterRotaPublicaCadastroComPlanos } from '@/utils/navegacaoPublica'

const carregando = ref(true)
const planos = ref(obterPlanosPublicosFallback())

const planoDestaque = computed(() => resolverPlanoPublicoRecomendado(planos.value))

onMounted(() => {
  void carregarPlanos()
})

async function carregarPlanos() {
  try {
    const resposta = await buscarPlanosPublicos()
    const normalizados = normalizarPlanosPublicos(resposta)

    planos.value = normalizados.length ? normalizados : obterPlanosPublicosFallback()
  } catch (error) {
    planos.value = obterPlanosPublicosFallback()
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function planoEhRecomendado(plano) {
  return plano?.recomendado === true || plano?.chave === planoDestaque.value?.chave
}
</script>

<template>
  <section id="planos" class="planos-publicos" aria-labelledby="planos-publicos-titulo">
    <div class="planos-publicos-cabecalho">
      <span class="selo">Planos</span>
      <h2 id="planos-publicos-titulo">Planos para cada fase da sua empresa</h2>
      <p>Comece simples e evolua conforme sua operação cresce.</p>
    </div>

    <p v-if="carregando" class="planos-publicos-status">Atualizando os planos públicos...</p>

    <div class="planos-publicos-grid">
      <article
        v-for="plano in planos"
        :key="plano.id"
        class="plano-card"
        :class="{ destaque: planoEhRecomendado(plano) }"
      >
        <div class="plano-card-topo">
          <div class="plano-card-marcas">
            <span v-if="plano.selo" class="plano-card-selo">{{ plano.selo }}</span>
            <span v-if="planoEhRecomendado(plano)" class="plano-card-destaque">Recomendado</span>
          </div>

          <h3>{{ plano.nome }}</h3>
          <strong>{{ formatarPrecoPlanoPublico(plano) }}</strong>
        </div>

        <p class="plano-card-descricao">{{ plano.descricao }}</p>

        <ul class="plano-card-recursos">
          <li v-for="recurso in plano.recursos" :key="`${plano.id}-${recurso}`">{{ recurso }}</li>
        </ul>

        <div class="plano-card-rodape">
          <RouterLink class="botao plano-card-botao" :to="obterRotaPublicaCadastroComPlanos()">
            {{ plano.cta || 'Começar agora' }}
          </RouterLink>
          <small>{{ plano.destaque || 'Consulte condições' }}</small>
        </div>
      </article>
    </div>
  </section>
</template>

<style scoped>
.planos-publicos {
  width: min(1160px, 100%);
  margin: 0 auto;
  padding: 0 20px 84px;
}

.planos-publicos-cabecalho {
  display: grid;
  gap: 12px;
  max-width: 760px;
  margin-bottom: 28px;
}

.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.planos-publicos-cabecalho h2 {
  margin: 0;
  font-size: clamp(30px, 4vw, 48px);
  line-height: 1.05;
  font-weight: 900;
}

.planos-publicos-cabecalho p,
.plano-card-descricao,
.plano-card-rodape small,
.planos-publicos-status {
  margin: 0;
  color: #475569;
  font-size: 16px;
  line-height: 1.65;
}

.planos-publicos-status {
  margin-bottom: 18px;
  color: #1d4ed8;
  font-weight: 700;
}

.planos-publicos-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 18px;
}

.plano-card {
  display: grid;
  gap: 18px;
  align-content: start;
  border: 1px solid rgba(148, 163, 184, 0.24);
  border-radius: 24px;
  background: white;
  padding: 24px;
  box-shadow: 0 18px 44px rgba(15, 23, 42, 0.07);
}

.plano-card.destaque {
  border-color: rgba(37, 99, 235, 0.32);
  background:
    radial-gradient(circle at 88% 10%, rgba(37, 99, 235, 0.08), transparent 28%),
    linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 24px 50px rgba(37, 99, 235, 0.12);
}

.plano-card-topo {
  display: grid;
  gap: 12px;
}

.plano-card-marcas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.plano-card-selo,
.plano-card-destaque {
  display: inline-flex;
  align-items: center;
  min-height: 30px;
  border-radius: 999px;
  padding: 0 12px;
  font-size: 12px;
  font-weight: 900;
  text-transform: uppercase;
}

.plano-card-selo {
  background: #eff6ff;
  color: #1d4ed8;
}

.plano-card-destaque {
  background: #dbeafe;
  color: #1e40af;
}

.plano-card h3 {
  margin: 0;
  color: #0f172a;
  font-size: 24px;
  line-height: 1.1;
  font-weight: 900;
}

.plano-card strong {
  color: #0f172a;
  font-size: 30px;
  font-weight: 900;
}

.plano-card strong::after {
  content: '';
}

.plano-card-recursos {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

.plano-card-recursos li {
  display: grid;
  grid-template-columns: 14px minmax(0, 1fr);
  gap: 10px;
  color: #334155;
  font-size: 14px;
  line-height: 1.5;
}

.plano-card-recursos li::before {
  content: '';
  width: 14px;
  height: 14px;
  margin-top: 3px;
  border-radius: 999px;
  background: linear-gradient(135deg, #38bdf8 0%, #22c55e 100%);
}

.plano-card-rodape {
  display: grid;
  gap: 10px;
}

.plano-card-botao {
  width: 100%;
}

.botao {
  display: inline-flex;
  min-height: 48px;
  align-items: center;
  justify-content: center;
  border-radius: 12px;
  padding: 12px 18px;
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  color: white;
  font-weight: 900;
  text-align: center;
  text-decoration: none;
}

@media (max-width: 980px) {
  .planos-publicos-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

@media (max-width: 640px) {
  .planos-publicos {
    padding-right: 14px;
    padding-left: 14px;
    padding-bottom: 64px;
  }

  .planos-publicos-grid {
    grid-template-columns: 1fr;
  }

  .plano-card {
    padding: 20px;
  }
}
</style>
