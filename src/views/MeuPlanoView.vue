<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarMinhaAssinatura, buscarUsoPlano } from '@/services/api'

const assinatura = ref(null)
const usoPlano = ref(null)
const carregando = ref(true)
const erro = ref('')

const plano = computed(() => assinatura.value?.plano || assinatura.value || {})
const status = computed(() => assinatura.value?.status || '-')
const nomePlanoAtual = computed(() => {
  if ((assinatura.value?.visivelParaEmpresa ?? plano.value?.visivelParaEmpresa) === false) {
    return 'Plano especial'
  }

  return plano.value.nome || assinatura.value?.planoNome || 'Plano especial'
})
const tipoPlano = computed(() =>
  normalizarTipoPlano(assinatura.value?.tipoPlano ?? plano.value?.tipoPlano ?? usoPlano.value?.tipoPlano),
)
const avisoTipoPlano = computed(() => {
  if (tipoPlano.value === 'PARCERIA') {
    return 'Voce está em um plano especial de parceria.'
  }

  if (tipoPlano.value === 'INTERNO') {
    return 'Voce está em um plano interno/cortesia.'
  }

  return ''
})
const alertaStatus = computed(() => {
  if (['BLOQUEADA', 'CANCELADA'].includes(status.value)) {
    return {
      tipo: 'vermelho',
      texto: 'Sua assinatura está bloqueada ou cancelada.',
    }
  }

  if (status.value === 'ATRASADA') {
    return {
      tipo: 'amarelo',
      texto: 'Sua assinatura está atrasada.',
    }
  }

  return null
})

const itensUso = computed(() => [
  criarItemUso('Usuarios', ['usuarios', 'usuariosAtivos', 'qtdUsuarios'], obterLimite('limiteUsuarios')),
  criarItemUso('Clientes', ['clientes', 'qtdClientes'], obterLimite('limiteClientes')),
  criarItemUso('Funcionarios', ['funcionarios', 'qtdFuncionarios'], obterLimite('limiteFuncionarios')),
  criarItemUso('Servicos', ['servicos', 'qtdServicos'], obterLimite('limiteServicos')),
  criarItemUso(
    'Agendamentos no mês',
    ['agendamentosMes', 'agendamentosNoMes', 'qtdAgendamentosMes'],
    obterLimite('limiteAgendamentosMes', 'limiteAgendamentos'),
  ),
])

const proximoDoLimite = computed(() =>
  itensUso.value.some((item) => item.limite !== null && item.percentual >= 80),
)

async function carregarMeuPlano() {
  try {
    carregando.value = true
    erro.value = ''

    const [assinaturaApi, usoApi] = await Promise.all([buscarMinhaAssinatura(), buscarUsoPlano()])
    assinatura.value = assinaturaApi || null
    usoPlano.value = usoApi || null
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar os dados do plano.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function criarItemUso(rotulo, camposUso, limite) {
  const uso = obterPrimeiroNumero(usoPlano.value, camposUso)
  const percentual = limite === null ? 0 : Math.min(100, Math.round((uso / Math.max(limite, 1)) * 100))

  return {
    rotulo,
    uso,
    limite,
    percentual,
    alerta: limite !== null && percentual >= 80,
  }
}

function obterPrimeiroNumero(objeto, campos) {
  for (const campo of campos) {
    const valor = objeto?.[campo]

    if (valor !== null && valor !== undefined && valor !== '') {
      return Number(valor)
    }
  }

  return 0
}

function obterLimite(campo, alternativo = '') {
  const valor =
    usoPlano.value?.[campo] ??
    usoPlano.value?.limites?.[campo] ??
    plano.value?.[campo] ??
    plano.value?.[alternativo]

  return valor === null || valor === undefined || valor === '' ? null : Number(valor)
}

function permissaoLigada(campo) {
  return Boolean(plano.value?.[campo] ?? usoPlano.value?.[campo])
}

function normalizarTipoPlano(tipo) {
  return ['COMERCIAL', 'PARCERIA', 'INTERNO'].includes(tipo) ? tipo : 'COMERCIAL'
}

function rotuloTipoPlano(tipo) {
  const rotulos = {
    COMERCIAL: 'Comercial',
    PARCERIA: 'Parceria / Permuta',
    INTERNO: 'Interno / Cortesia',
  }

  return rotulos[normalizarTipoPlano(tipo)] || rotulos.COMERCIAL
}

function exibirLimite(limite) {
  return limite === null ? 'Ilimitado' : limite
}

function formatarPreco(preco) {
  return Number(preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarData(valor) {
  return valor ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '-'
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

onMounted(() => {
  carregarMeuPlano()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Assinatura</p>
        <h1>Meu plano</h1>
        <p class="descricao">Acompanhe o plano atual, permissoes e limites de uso da empresa.</p>
      </div>

      <button class="botao secundario" @click="carregarMeuPlano">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
      <small>Fale com o administrador para alterar seu plano.</small>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando plano...</p>
    </section>

    <template v-else>
      <section v-if="alertaStatus" :class="['card', 'alerta', alertaStatus.tipo]">
        <p>{{ alertaStatus.texto }}</p>
        <small>Fale com o administrador para regularizar ou alterar seu plano.</small>
      </section>

      <section v-if="proximoDoLimite" class="card alerta amarelo">
        <p>Voce está próximo do limite do seu plano.</p>
        <small>Fale com o administrador para alterar seu plano.</small>
      </section>

      <section v-if="avisoTipoPlano" class="card alerta informativo">
        <p>{{ avisoTipoPlano }}</p>
      </section>

      <section class="grade-resumo">
        <article class="card destaque">
          <p class="subtitulo">Plano atual</p>
          <h2>{{ nomePlanoAtual }}</h2>
          <p>{{ plano.descricao || '-' }}</p>
        </article>

        <article class="card metrica">
          <span>Status da assinatura</span>
          <strong>{{ status }}</strong>
        </article>

        <article class="card metrica">
          <span>Tipo</span>
          <strong>{{ rotuloTipoPlano(tipoPlano) }}</strong>
        </article>

        <article class="card metrica">
          <span>Data de vencimento</span>
          <strong>{{ formatarData(assinatura?.dataVencimento) }}</strong>
        </article>

        <article class="card metrica">
          <span>Preco mensal</span>
          <strong>{{ formatarPreco(plano.precoMensal ?? assinatura?.precoMensal) }}</strong>
        </article>
      </section>

      <section class="card">
        <div class="titulo-card">
          <h2>Permissões</h2>
        </div>

        <div class="permissoes">
          <span :class="{ ligado: permissaoLigada('permitePersonalizacao') }">Personalizacao</span>
          <span :class="{ ligado: permissaoLigada('permiteRelatorios') }">Relatorios</span>
          <span :class="{ ligado: permissaoLigada('permiteAgendamentoPublico') }">Agendamento publico</span>
          <span :class="{ ligado: permissaoLigada('permiteSuportePrioritario') }">Suporte prioritário</span>
        </div>
      </section>

      <section class="card">
        <div class="titulo-card">
          <h2>Uso do plano</h2>
        </div>

        <div class="lista-uso">
          <article v-for="item in itensUso" :key="item.rotulo" :class="['uso-item', { alerta: item.alerta }]">
            <div class="uso-topo">
              <strong>{{ item.rotulo }}</strong>
              <span>{{ item.uso }} / {{ exibirLimite(item.limite) }}</span>
            </div>

            <div class="barra">
              <span :style="{ width: `${item.percentual}%` }"></span>
            </div>
          </article>
        </div>
      </section>
    </template>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina,
.grade-resumo,
.uso-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-weight: 800;
  letter-spacing: 0;
}

h1 {
  font-size: 32px;
}

h2 {
  font-size: 24px;
}

.descricao,
.titulo-card p,
.destaque p {
  margin: 6px 0 0;
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.grade-resumo {
  align-items: stretch;
  display: grid;
  grid-template-columns: minmax(280px, 1.4fr) repeat(4, minmax(160px, 1fr));
}

.metrica {
  display: grid;
  gap: 8px;
}

.metrica span {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.metrica strong {
  font-size: 20px;
  font-weight: 800;
}

.permissoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin-top: 16px;
}

.permissoes span {
  border-radius: 999px;
  padding: 8px 12px;
  background: #fee2e2;
  color: #991b1b;
  font-size: 13px;
  font-weight: 800;
}

.permissoes .ligado {
  background: #dcfce7;
  color: #166534;
}

.lista-uso {
  display: grid;
  gap: 16px;
  margin-top: 16px;
}

.uso-item {
  display: grid;
  gap: 10px;
}

.uso-topo strong,
.uso-topo span {
  font-weight: 800;
}

.uso-topo span {
  color: #475569;
}

.barra {
  height: 12px;
  overflow: hidden;
  background: #e2e8f0;
  border-radius: 999px;
}

.barra span {
  display: block;
  height: 100%;
  background: #2563eb;
  border-radius: 999px;
}

.uso-item.alerta .barra span {
  background: #f59e0b;
}

.botao {
  border: none;
  color: white;
  background: #0f172a;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.erro,
.alerta.vermelho {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.alerta.amarelo {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.alerta.informativo {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.erro p,
.alerta p {
  margin: 0;
  font-weight: 800;
}

.erro small,
.alerta small {
  display: block;
  margin-top: 6px;
}

@media (max-width: 1100px) {
  .grade-resumo {
    grid-template-columns: repeat(2, minmax(220px, 1fr));
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .uso-topo {
    align-items: flex-start;
    flex-direction: column;
  }

  .grade-resumo {
    grid-template-columns: 1fr;
  }
}
</style>
