<script setup>
import { onMounted, ref } from 'vue'
import {
  buscarEmpresas,
  buscarFaturas,
  buscarPlanos,
  cancelarFatura,
  criarFatura,
  marcarFaturaPaga,
} from '@/services/api'

const formasPagamento = ['BOLETO', 'PIX', 'CARTAO', 'TRANSFERENCIA', 'DINHEIRO', 'PERMUTA']
const gateways = ['MANUAL', 'ASAAS', 'MERCADO_PAGO', 'STRIPE']
const statusOpcoes = ['', 'ABERTA', 'PAGA', 'VENCIDA', 'CANCELADA']
const faturas = ref([])
const empresas = ref([])
const planos = ref([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const filtros = ref({ empresaId: '', planoId: '', status: '', formaPagamento: '', dataInicial: '', dataFinal: '' })
const fatura = ref(criarFaturaInicial())

function criarFaturaInicial() {
  return {
    empresaId: '',
    assinaturaId: '',
    planoId: '',
    valor: '',
    dataVencimento: '',
    formaPagamento: 'PIX',
    gateway: 'MANUAL',
    linkPagamento: '',
    observacao: '',
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const [faturasApi, empresasApi, planosApi] = await Promise.all([
      buscarFaturas(limparFiltrosVazios(filtros.value)),
      buscarEmpresas().catch(() => []),
      buscarPlanos().catch(() => []),
    ])
    faturas.value = extrairLista(faturasApi)
    empresas.value = extrairLista(empresasApi)
    planos.value = extrairLista(planosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as faturas.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarFatura() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!fatura.value.empresaId || !fatura.value.dataVencimento) {
      erro.value = 'Informe empresa e data de vencimento.'
      return
    }

    const valor = Number(fatura.value.valor || 0)

    if (valor < 0 || (valor === 0 && fatura.value.formaPagamento !== 'PERMUTA')) {
      erro.value = 'Valor zero é permitido apenas para forma de pagamento PERMUTA.'
      return
    }

    salvando.value = true
    await criarFatura({ ...fatura.value, valor, status: 'ABERTA' })
    mensagemSucesso.value = 'Fatura criada com sucesso.'
    fatura.value = criarFaturaInicial()
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível criar a fatura.')
  } finally {
    salvando.value = false
  }
}

async function marcarPaga(item) {
  try {
    await marcarFaturaPaga(item.id, { dataPagamento: new Date().toISOString().slice(0, 10) })
    mensagemSucesso.value = 'Fatura marcada como paga.'
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível marcar a fatura como paga.')
  }
}

async function cancelar(item) {
  const observacao = window.prompt('Informe a observacao do cancelamento:') || ''
  try {
    await cancelarFatura(item.id, { observacao })
    mensagemSucesso.value = 'Fatura cancelada com sucesso.'
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível cancelar a fatura.')
  }
}

function limparFiltros() {
  filtros.value = { empresaId: '', planoId: '', status: '', formaPagamento: '', dataInicial: '', dataFinal: '' }
  carregarDados()
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  return resposta?.content || resposta?.items || resposta?.data || []
}

function limparFiltrosVazios(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => String(valor || '').trim()))
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''
  return mensagem || fallback
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function nomeEmpresa(item) {
  return item.empresaNome || item.empresa?.nome || empresas.value.find((e) => String(e.id) === String(item.empresaId))?.nome || '-'
}

function nomePlano(item) {
  return item.planoNome || item.plano?.nome || planos.value.find((p) => String(p.id) === String(item.planoId))?.nome || '-'
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">ADMINISTRAÇÃO SAAS</p>
        <h1>Faturas</h1>
        <p class="descricao">Controle cobranças manuais e prepare a operação para Asaas, Mercado Pago ou Stripe.</p>
      </div>
      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso"><p>{{ mensagemSucesso }}</p></section>

    <section class="card filtros">
      <div class="campos">
        <label>Empresa <select v-model="filtros.empresaId"><option value="">Todas</option><option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nome }}</option></select></label>
        <label>Plano <select v-model="filtros.planoId"><option value="">Todos</option><option v-for="p in planos" :key="p.id" :value="p.id">{{ p.nome }}</option></select></label>
        <label>Status <select v-model="filtros.status"><option v-for="s in statusOpcoes" :key="s" :value="s">{{ s || 'Todos' }}</option></select></label>
        <label>Forma de pagamento <select v-model="filtros.formaPagamento"><option value="">Todas</option><option v-for="forma in formasPagamento" :key="forma">{{ forma }}</option></select></label>
        <label>Data inicial <input v-model="filtros.dataInicial" type="date" /></label>
        <label>Data final <input v-model="filtros.dataFinal" type="date" /></label>
      </div>
      <div class="acoes"><button class="botao principal" @click="carregarDados">Filtrar</button><button class="botao secundario" @click="limparFiltros">Limpar filtros</button></div>
    </section>

    <form class="card formulario" @submit.prevent="salvarFatura">
      <h2>Criar fatura manual</h2>
      <div class="campos">
        <label>Empresa <select v-model="fatura.empresaId"><option value="">Selecione</option><option v-for="e in empresas" :key="e.id" :value="e.id">{{ e.nome }}</option></select></label>
        <label>Assinatura <input v-model="fatura.assinaturaId" type="text" placeholder="Opcional" /></label>
        <label>Plano <select v-model="fatura.planoId"><option value="">Selecione</option><option v-for="p in planos" :key="p.id" :value="p.id">{{ p.nome }}</option></select></label>
        <label>Valor <input v-model="fatura.valor" type="number" min="0" step="0.01" /></label>
        <label>Data de vencimento <input v-model="fatura.dataVencimento" type="date" /></label>
        <label>Forma de pagamento <select v-model="fatura.formaPagamento"><option v-for="forma in formasPagamento" :key="forma">{{ forma }}</option></select></label>
        <label>Gateway <select v-model="fatura.gateway"><option v-for="gateway in gateways" :key="gateway">{{ gateway }}</option></select></label>
        <label>Link de pagamento <input v-model="fatura.linkPagamento" type="text" /></label>
        <label class="campo-grande">Observação <textarea v-model="fatura.observacao" rows="3"></textarea></label>
      </div>
      <button class="botao principal" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Criar fatura' }}</button>
    </form>

    <section v-if="carregando" class="card"><p>Carregando faturas...</p></section>
    <section v-else-if="!faturas.length" class="card"><p>Nenhuma fatura enaontrada.</p></section>
    <section v-else class="lista">
      <article v-for="item in faturas" :key="item.id" class="card item-card">
        <div class="topo-card"><div><h2>{{ nomeEmpresa(item) }}</h2><p>{{ nomePlano(item) }}</p></div><span class="badge">{{ item.status || 'ABERTA' }}</span></div>
        <div class="detalhes">
          <p><strong>Valor:</strong> {{ formatarMoeda(item.valor) }}</p>
          <p><strong>Forma de pagamento:</strong> {{ item.formaPagamento || '-' }}</p>
          <p><strong>Gateway:</strong> {{ item.gateway || 'MANUAL' }}</p>
          <p><strong>Vencimento:</strong> {{ item.dataVencimento || '-' }}</p>
          <p><strong>Pagamento:</strong> {{ item.dataPagamento || '-' }}</p>
          <p><strong>Link de pagamento:</strong> <a v-if="item.linkPagamento" :href="item.linkPagamento" target="_blank" rel="noreferrer">Abrir link</a><span v-else>-</span></p>
          <p><strong>Observação:</strong> {{ item.observacao || '-' }}</p>
        </div>
        <div class="acoes"><button class="botao sucesso-botao" @click="marcarPaga(item)">Marcar como paga</button><button class="botao perigo" @click="cancelar(item)">Cancelar</button></div>
      </article>
    </section>
  </main>
</template>

<style scoped>
.pagina,.filtros,.formulario,.item-card{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.topo-card,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px}.descricao,.topo-card p{color:#64748b;margin-top:6px}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.campos{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:16px}.campo-grande{grid-column:1/-1}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit;box-sizing:border-box}.lista{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:18px}.detalhes p{margin:7px 0;color:#374151}.badge{background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:800}.botao{border:none;color:white;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:800}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.sucesso-botao{background:#16a34a}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}@media(max-width:900px){.cabecalho-pagina,.topo-card{align-items:flex-start;flex-direction:column}.campos,.lista{grid-template-columns:1fr}}
</style>
