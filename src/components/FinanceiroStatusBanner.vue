<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'

const props = defineProps({
  status: {
    type: Object,
    default: null,
  },
})

const statusNormalizado = computed(() =>
  String(obterCampo(props.status, 'statusFinanceiro', 'status', 'situacao') || 'ADIMPLENTE')
    .trim()
    .toUpperCase(),
)
const deveExibir = computed(() => ['EM_ATRASO', 'BLOQUEADA_FINANCEIRO'].includes(statusNormalizado.value))
const bloqueada = computed(() => statusNormalizado.value === 'BLOQUEADA_FINANCEIRO')
const mensagem = computed(() =>
  bloqueada.value
    ? 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.'
    : 'Atenção: existem faturas em atraso. Regularize para evitar bloqueio.',
)

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') {
      return objeto[campo]
    }
  }
  return ''
}

function formatarMoeda(valor) {
  const numero = Number(valor || 0)
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarNumero(valor) {
  const numero = Number(valor || 0)
  return Number.isFinite(numero) ? numero.toLocaleString('pt-BR') : '0'
}
</script>

<template>
  <section v-if="deveExibir" :class="['banner-financeiro', bloqueada ? 'bloqueado' : 'atraso']">
    <div>
      <strong>{{ mensagem }}</strong>
      <dl>
        <div>
          <dt>Faturas vencidas</dt>
          <dd>{{ formatarNumero(obterCampo(status, 'quantidadeFaturasVencidas', 'faturasVencidas', 'totalVencidas')) }}</dd>
        </div>
        <div>
          <dt>Valor vencido</dt>
          <dd>{{ formatarMoeda(obterCampo(status, 'valorVencido', 'valorTotalVencido', 'totalVencido')) }}</dd>
        </div>
        <div>
          <dt>Maior atraso</dt>
          <dd>{{ formatarNumero(obterCampo(status, 'diasMaiorAtraso', 'maiorAtrasoDias', 'diasAtraso')) }} dia(s)</dd>
        </div>
      </dl>
    </div>

    <RouterLink class="botao-banner" to="/faturas">Ver faturas</RouterLink>
  </section>
</template>

<style scoped>
.banner-financeiro {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  margin-bottom: 24px;
  border: 1px solid;
  border-radius: 8px;
  padding: 18px 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.banner-financeiro.atraso {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.banner-financeiro.bloqueado {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.banner-financeiro strong {
  display: block;
  margin-bottom: 10px;
  font-size: 15px;
}

dl {
  display: flex;
  gap: 16px;
  flex-wrap: wrap;
  margin: 0;
}

dt,
dd {
  margin: 0;
}

dt {
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin-top: 2px;
  font-weight: 800;
}

.botao-banner {
  flex: 0 0 auto;
  border-radius: 8px;
  padding: 10px 16px;
  background: #0f172a;
  color: white;
  font-weight: 800;
  text-decoration: none;
}

@media (max-width: 760px) {
  .banner-financeiro {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
