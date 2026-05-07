<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarDashboardSaas } from '@/services/api'

const dados = ref({})
const carregando = ref(true)
const erro = ref('')

const cards = computed(() => [
  criarCard('Total de empresas', 'totalEmpresas'),
  criarCard('Empresas ativas', 'empresasAtivas'),
  criarCard('Empresas inativas', 'empresasInativas'),
  criarCard('Total de usuários', 'totalUsuarios'),
  criarCard('Total de clientes', 'totalClientes'),
  criarCard('Total de serviços', 'totalServicos'),
  criarCard('Total de funcionários', 'totalFuncionarios'),
  criarCard('Total de agendamentos', 'totalAgendamentos'),
  criarCard('Agendamentos do mês', 'agendamentosMes', 'agendamentosDoMes'),
  criarCard('Agendamentos hoje', 'agendamentosHoje'),
  criarCard('Total de planos', 'totalPlanos'),
  criarCard('Planos ativos', 'planosAtivos'),
  criarCard('Total de assinaturas', 'totalAssinaturas'),
  criarCard('Assinaturas ativas', 'assinaturasAtivas'),
  criarCard('Assinaturas em teste', 'assinaturasTeste'),
  criarCard('Assinaturas atrasadas', 'assinaturasAtrasadas'),
  criarCard('Assinaturas bloqueadas', 'assinaturasBloqueadas'),
  criarCard('Assinaturas canceladas', 'assinaturasCanceladas'),
  criarCard('Receita mensal prevista', 'receitaMensalPrevista', 'receitaPrevistaMensal', true),
  criarCard('Faturas abertas', 'faturasAbertas'),
  criarCard('Faturas pagas', 'faturasPagas'),
  criarCard('Faturas vencidas', 'faturasVencidas'),
  criarCard('Valor aberto', 'valorAberto', '', true),
  criarCard('Valor pago no mês', 'valorPagoMes', 'valorPagoNoMes', true),
  criarCard('Valor vencido', 'valorVencido', '', true),
])

const secoes = computed(() => [
  { titulo: 'Empresas por plano', itens: lista('empresasPorPlano') },
  { titulo: 'Empresas por status da assinatura', itens: lista('empresasPorStatusAssinatura') },
  { titulo: 'Agendamentos por status', itens: lista('agendamentosPorStatus') },
  { titulo: 'Top empresas por agendamentos', itens: lista('topEmpresasPorAgendamentos') },
  { titulo: 'Últimas empresas cadastradas', itens: lista('ultimasEmpresas') },
  { titulo: 'Últimas assinaturas', itens: lista('ultimasAssinaturas') },
  { titulo: 'Últimos logs de auditoria', itens: lista('ultimosLogsAuditoria') },
  { titulo: 'Alertas administrativos', itens: lista('alertasAdministrativos') },
])

async function carregarDashboard() {
  try {
    carregando.value = true
    erro.value = ''
    dados.value = await buscarDashboardSaas()
  } catch (error) {
    erro.value = 'Não foi possível carregar o Dashboard SaaS.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function criarCard(rotulo, campo, alternativo = '', dinheiro = false) {
  const valor = obterValor(dados.value, campo, alternativo)

  return {
    rotulo,
    valor: dinheiro ? formatarMoeda(valor) : exibirValor(valor),
  }
}

function obterValor(objeto, campo, alternativo = '') {
  return objeto?.[campo] ?? objeto?.[alternativo] ?? 0
}

function lista(campo) {
  const valor = dados.value?.[campo]

  if (Array.isArray(valor)) {
    return valor
  }

  if (valor && typeof valor === 'object') {
    return Object.entries(valor).map(([nome, total]) => ({ nome, total }))
  }

  return []
}

function tituloItem(item) {
  if (typeof item === 'string') {
    return item
  }

  return (
    item.nome ||
    item.planoNome ||
    item.empresaNome ||
    item.status ||
    item.acao ||
    item.titulo ||
    item.descricao ||
    '-'
  )
}

function detalheItem(item) {
  if (!item || typeof item === 'string') {
    return ''
  }

  const partes = [
    item.total ?? item.quantidade ?? item.valor,
    item.planoNome,
    item.statusAssinatura,
    item.dataCadastro || item.criadoEm || item.dataHora,
  ].filter((valor) => valor !== null && valor !== undefined && String(valor).trim())

  return partes.join(' · ')
}

function exibirValor(valor) {
  return valor === null || valor === undefined || valor === '' ? 0 : valor
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

onMounted(() => {
  carregarDashboard()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Dashboard SaaS</h1>
        <p class="descricao">Visão geral operacional, comercial e administrativa da plataforma.</p>
      </div>

      <button class="botao secundario" @click="carregarDashboard">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando Dashboard SaaS...</p>
    </section>

    <template v-else>
      <section class="cards">
        <article v-for="card in cards" :key="card.rotulo" class="card metrica">
          <span>{{ card.rotulo }}</span>
          <strong>{{ card.valor }}</strong>
        </article>
      </section>

      <section class="secoes">
        <article v-for="secao in secoes" :key="secao.titulo" class="card secao">
          <h2>{{ secao.titulo }}</h2>

          <p v-if="!secao.itens.length" class="vazio">Nenhum dado disponível.</p>

          <ul v-else>
            <li v-for="(item, indice) in secao.itens" :key="`${secao.titulo}-${indice}`">
              <span>{{ tituloItem(item) }}</span>
              <strong v-if="detalheItem(item)">{{ detalheItem(item) }}</strong>
            </li>
          </ul>
        </article>
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

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-weight: 800;
}

h1 {
  font-size: 32px;
}

.descricao {
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

.cards {
  display: grid;
  grid-template-columns: repeat(4, minmax(170px, 1fr));
  gap: 16px;
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
  color: #111827;
  font-size: 24px;
  font-weight: 800;
}

.secoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.secao {
  display: grid;
  gap: 14px;
}

ul {
  display: grid;
  gap: 10px;
  margin: 0;
  padding: 0;
  list-style: none;
}

li {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  border-bottom: 1px solid #e5e7eb;
  padding-bottom: 10px;
}

li span {
  color: #334155;
  font-weight: 800;
}

li strong {
  color: #2563eb;
  text-align: right;
}

.vazio {
  margin: 0;
  color: #64748b;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.secundario {
  background: #0f172a;
}

@media (max-width: 1100px) {
  .cards {
    grid-template-columns: repeat(2, minmax(170px, 1fr));
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina {
    align-items: flex-start;
    flex-direction: column;
  }

  .cards,
  .secoes {
    grid-template-columns: 1fr;
  }
}
</style>
