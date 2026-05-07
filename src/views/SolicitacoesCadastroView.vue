<script setup>
import { onMounted, ref } from 'vue'
import {
  aprovarSolicitacaoCadastro,
  buscarPlanos,
  buscarSegmentos,
  buscarSolicitacoesCadastro,
  marcarSolicitacaoEmAnalise,
  rejeitarSolicitacaoCadastro,
} from '@/services/api'

const statusOpcoes = ['', 'NOVA', 'EM_ANALISE', 'APROVADA', 'REJEITADA']
const solicitacoes = ref([])
const segmentos = ref([])
const planos = ref([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const aprovando = ref(null)
const filtros = ref({ status: '', segmentoId: '', planoId: '', texto: '' })
const aprovacao = ref(criarAprovacaoInicial())

function criarAprovacaoInicial() {
  return {
    planoId: '',
    statusAssinatura: 'ATIVA',
    dataVencimento: '',
    observacaoAssinatura: '',
    observacaoComercial: '',
    senhaInicialAdmin: '',
    criarEmpresa: true,
    criarUsuarioAdmin: true,
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const [solicitacoesApi, segmentosApi, planosApi] = await Promise.all([
      buscarSolicitacoesCadastro(limparFiltrosVazios(filtros.value)),
      buscarSegmentos().catch(() => []),
      buscarPlanos().catch(() => []),
    ])
    solicitacoes.value = extrairLista(solicitacoesApi)
    segmentos.value = extrairLista(segmentosApi)
    planos.value = extrairLista(planosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as solicitações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function marcarEmAnalise(item) {
  try {
    mensagemSucesso.value = ''
    await marcarSolicitacaoEmAnalise(item.id)
    mensagemSucesso.value = 'Solicitação marcada em análise.'
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar a solicitação.')
  }
}

async function rejeitar(item) {
  const observacao = window.prompt('Informe a observação da rejeição:')

  if (observacao === null) {
    return
  }

  try {
    mensagemSucesso.value = ''
    await rejeitarSolicitacaoCadastro(item.id, { observacao })
    mensagemSucesso.value = 'Solicitação rejeitada com sucesso.'
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível rejeitar a solicitação.')
  }
}

function abrirAprovacao(item) {
  aprovando.value = item
  aprovacao.value = {
    ...criarAprovacaoInicial(),
    planoId: item.planoId || item.planoDesejadoId || '',
  }
}

async function aprovar() {
  try {
    salvando.value = true
    mensagemSucesso.value = ''
    await aprovarSolicitacaoCadastro(aprovando.value.id, { ...aprovacao.value })
    mensagemSucesso.value = 'Solicitação aprovada com sucesso.'
    aprovando.value = null
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível aprovar a solicitação.')
  } finally {
    salvando.value = false
  }
}

function limparFiltros() {
  filtros.value = { status: '', segmentoId: '', planoId: '', texto: '' }
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

function nomeSegmento(item) {
  return item.segmentoNome || item.segmentoNegocioNome || item.segmento?.nome || '-'
}

function nomePlano(item) {
  return item.planoNome || item.planoDesejadoNome || item.plano?.nome || '-'
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Solicitações</h1>
        <p class="descricao">Analise pedidos públicos de cadastro e converta em empresas ativas.</p>
      </div>
      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso"><p>{{ mensagemSucesso }}</p></section>

    <section class="card filtros">
      <div class="campos">
        <label>Status <select v-model="filtros.status"><option v-for="status in statusOpcoes" :key="status" :value="status">{{ status || 'Todos' }}</option></select></label>
        <label>Segmento <select v-model="filtros.segmentoId"><option value="">Todos</option><option v-for="s in segmentos" :key="s.id" :value="s.id">{{ s.nome }}</option></select></label>
        <label>Plano <select v-model="filtros.planoId"><option value="">Todos</option><option v-for="p in planos" :key="p.id" :value="p.id">{{ p.nome }}</option></select></label>
        <label>Texto livre <input v-model="filtros.texto" type="text" /></label>
      </div>
      <div class="acoes">
        <button class="botao principal" @click="carregarDados">Filtrar</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <section v-if="carregando" class="card"><p>Carregando solicitações...</p></section>
    <section v-else-if="!solicitacoes.length" class="card"><p>Nenhuma solicitação encontrada.</p></section>

    <section v-else class="lista">
      <article v-for="item in solicitacoes" :key="item.id" class="card item-card">
        <div class="topo-card">
          <div>
            <h2>{{ item.nomeEmpresa || item.empresaNome }}</h2>
            <p>{{ item.responsavelNome || '-' }}</p>
          </div>
          <span class="badge">{{ item.status || 'NOVA' }}</span>
        </div>
        <div class="detalhes">
          <p><strong>Telefone:</strong> {{ item.telefoneEmpresa || item.responsavelTelefone || '-' }}</p>
          <p><strong>E-mail:</strong> {{ item.emailEmpresa || item.responsavelEmail || '-' }}</p>
          <p><strong>Segmento:</strong> {{ nomeSegmento(item) }}</p>
          <p><strong>Plano desejado:</strong> {{ nomePlano(item) }}</p>
          <p><strong>Data da solicitação:</strong> {{ item.dataSolicitacao || item.criadoEm || '-' }}</p>
          <p><strong>Mensagem:</strong> {{ item.mensagem || '-' }}</p>
        </div>
        <div class="acoes">
          <button class="botao secundario" @click="marcarEmAnalise(item)">Marcar em análise</button>
          <button class="botao perigo" @click="rejeitar(item)">Rejeitar</button>
          <button class="botao principal" @click="abrirAprovacao(item)">Aprovar</button>
        </div>
      </article>
    </section>

    <section v-if="aprovando" class="modal-fundo" @click.self="aprovando = null">
      <form class="card modal" @submit.prevent="aprovar">
        <div class="topo-card">
          <h2>Aprovar solicitação</h2>
          <button type="button" class="botao secundario" @click="aprovando = null">Fechar</button>
        </div>
        <div class="campos">
          <label>Plano <select v-model="aprovacao.planoId"><option value="">Selecione</option><option v-for="p in planos" :key="p.id" :value="p.id">{{ p.nome }}</option></select></label>
          <label>Status da assinatura <select v-model="aprovacao.statusAssinatura"><option>ATIVA</option><option>TESTE</option></select></label>
          <label>Data de vencimento <input v-model="aprovacao.dataVencimento" type="date" /></label>
          <label>Senha inicial do admin <input v-model="aprovacao.senhaInicialAdmin" type="text" /></label>
          <label class="campo-grande">Observação da assinatura <textarea v-model="aprovacao.observacaoAssinatura" rows="3"></textarea></label>
          <label class="campo-grande">Observação comercial <textarea v-model="aprovacao.observacaoComercial" rows="3"></textarea></label>
          <label class="checkbox"><input v-model="aprovacao.criarEmpresa" type="checkbox" /> Criar empresa</label>
          <label class="checkbox"><input v-model="aprovacao.criarUsuarioAdmin" type="checkbox" /> Criar usuário admin</label>
        </div>
        <button class="botao principal" :disabled="salvando">{{ salvando ? 'Aprovando...' : 'Aprovar solicitação' }}</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.pagina,.filtros,.item-card,.modal{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.topo-card,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px}.descricao,.topo-card p{color:#64748b;margin-top:6px}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.campos{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:16px}.campo-grande{grid-column:1/-1}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit;box-sizing:border-box}.checkbox{display:flex;align-items:center;gap:8px}.checkbox input{width:auto}.lista{display:grid;grid-template-columns:repeat(2,minmax(280px,1fr));gap:18px}.detalhes p{margin:7px 0;color:#374151}.badge{background:#dbeafe;color:#1d4ed8;border-radius:999px;padding:8px 12px;font-weight:800}.botao{border:none;color:white;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:800}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.modal-fundo{position:fixed;inset:0;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.42);z-index:20}.modal{width:min(100%,860px);max-height:86vh;overflow:auto}@media(max-width:900px){.cabecalho-pagina,.topo-card{align-items:flex-start;flex-direction:column}.campos,.lista{grid-template-columns:1fr}}
</style>
