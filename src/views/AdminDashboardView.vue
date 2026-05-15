<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRouter } from 'vue-router'
import { buscarDashboardSaasResumo } from '@/services/api'

const router = useRouter()
const dados = ref(criarDashboardPadrao())
const dadosCarregados = ref(false)
const carregando = ref(true)
const atualizando = ref(false)
const erro = ref('')
const sucesso = ref('')

const cardsEmpresas = computed(() => [
  criarCard('Total de empresas', 'empresas', 'total'),
  criarCard('Empresas ativas', 'empresas', 'ativas'),
  criarCard('Empresas bloqueadas', 'empresas', 'bloqueadas'),
  criarCard('Agendamento público ativo', 'empresas', 'agendamentoPublicoAtivo'),
])

const cardsAssinaturas = computed(() => [
  criarCard('Assinaturas ativas', 'assinaturas', 'ativas'),
  criarCard('Assinaturas vencidas', 'assinaturas', 'vencidas'),
  criarCard('Vencendo em 7 dias', 'assinaturas', 'vencendoEm7Dias'),
  criarCard('Parceria / Permuta', 'assinaturas', 'parceriaPermuta'),
])

const cardsFaturamento = computed(() => [
  criarCard('Receita prevista do mês', 'faturamento', 'receitaPrevistaMes', true),
  criarCard('Valor pago no mês', 'faturamento', 'valorPagoMes', true),
  criarCard('Valor pendente', 'faturamento', 'valorPendente', true),
  criarCard('Valor vencido', 'faturamento', 'valorVencido', true),
])

const cardsAutomacoes = computed(() => [
  criarCard('Notificações novas', 'notificacoes', 'novas'),
  criarCard('Total de execuções', 'automacoes', 'totalExecucoes'),
  criarCard('Sucessos', 'automacoes', 'sucessos'),
  criarCard('Erros', 'automacoes', 'erros'),
])

const alertas = computed(() => lista('alertas', 'alertasPlataforma', 'alertasAdministrativos'))
const ultimasEmpresas = computed(() => lista('ultimasEmpresas', 'empresasRecentes'))
const ultimasFaturas = computed(() => lista('ultimasFaturas', 'faturasRecentes'))
const ultimasAutomacoes = computed(() => lista('ultimasAutomacoes', 'ultimasExecucoesAutomacoes', 'execucoesRecentes'))

async function carregarDashboard(mostrarSucesso = false) {
  try {
    carregando.value = !dadosCarregados.value
    atualizando.value = true
    erro.value = ''
    sucesso.value = ''
    dados.value = normalizarDashboard(await buscarDashboardSaasResumo())
    dadosCarregados.value = true

    if (mostrarSucesso) {
      sucesso.value = 'Dashboard SaaS atualizado com sucesso.'
    }
  } catch (error) {
    if (obterStatusErro(error) === 403) {
      router.push('/dashboard')
      return
    }

    erro.value = 'Não foi possível carregar o Dashboard SaaS no momento.'
    console.error(error)
  } finally {
    carregando.value = false
    atualizando.value = false
  }
}

function criarCard(rotulo, secao, campo, dinheiro = false) {
  const valor = obterCampo(dados.value?.[secao], campo)

  return {
    rotulo,
    valor: dinheiro ? formatarMoeda(valor) : formatarNumero(valor),
  }
}

function lista(...campos) {
  for (const campo of campos) {
    const valor = obterCampo(dados.value, campo)
    const itens = normalizarLista(valor)

    if (itens.length) return itens
  }

  return []
}

function tituloItem(item) {
  if (typeof item === 'string') return item

  return obterCampo(
    item,
    'titulo',
    'nome',
    'empresaNome',
    'clienteNome',
    'tipoAutomacao',
    'numero',
    'descricao',
  ) || '-'
}

function detalheEmpresa(item) {
  return juntarDetalhes([
    obterCampo(item, 'planoNome', 'plano'),
    obterCampo(item, 'status', 'statusAssinatura'),
    formatarData(obterCampo(item, 'criadoEm', 'dataCadastro')),
  ])
}

function detalheFatura(item) {
  return juntarDetalhes([
    obterCampo(item, 'empresaNome'),
    obterCampo(item, 'status'),
    formatarMoeda(obterCampo(item, 'valor', 'valorTotal')),
    formatarData(obterCampo(item, 'vencimento', 'dataVencimento')),
  ])
}

function detalheAutomacao(item) {
  return juntarDetalhes([
    obterCampo(item, 'status'),
    obterCampo(item, 'executadoPorUsuarioNome', 'executadoPor'),
    formatarDataHora(obterCampo(item, 'iniciadoEm', 'criadoEm')),
  ])
}

function linkAlerta(item) {
  return obterCampo(item, 'link', 'linkAcao', 'url', 'rota')
}

function textoAlerta(item) {
  return obterCampo(item, 'mensagem', 'descricao', 'texto') || ''
}

function severidadeAlerta(item) {
  return normalizar(obterCampo(item, 'severidade', 'prioridade', 'nivel') || 'BAIXA')
}

function classeSeveridade(item) {
  return severidadeAlerta(item).toLowerCase()
}

function textoSeveridade(item) {
  return severidadeAlerta(item).replace(/_/g, ' ')
}

function abrirAlerta(item) {
  const link = linkAlerta(item)
  if (!link) return

  if (/^https?:\/\//i.test(link)) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }

  router.push(link.startsWith('/') ? link : `/${link}`)
}

function juntarDetalhes(partes) {
  return partes.filter((valor) => valor !== null && valor !== undefined && String(valor).trim() && valor !== '-').join(' · ')
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR')
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function formatarData(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''

  return data.toLocaleDateString('pt-BR')
}

function formatarDataHora(valor) {
  if (!valor) return ''
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return ''

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''

  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') {
      return objeto[campo]
    }
  }

  return ''
}

function normalizarObjeto(valor) {
  if (!valor || typeof valor !== 'object') return {}
  return valor.data && !Array.isArray(valor.data) ? valor.data : valor
}

function criarDashboardPadrao() {
  return {
    periodo: {},
    empresas: {
      total: 0,
      ativas: 0,
      bloqueadas: 0,
      inativas: 0,
      agendamentoPublicoAtivo: 0,
    },
    assinaturas: {
      total: 0,
      ativas: 0,
      vencidas: 0,
      vencendoEm7Dias: 0,
      parceriaPermuta: 0,
    },
    faturamento: {
      totalFaturas: 0,
      pendentes: 0,
      pagas: 0,
      vencidas: 0,
      canceladas: 0,
      valorPendente: 0,
      valorPagoMes: 0,
      valorVencido: 0,
      receitaPrevistaMes: 0,
    },
    notificacoes: {
      total: 0,
      novas: 0,
      lidas: 0,
      arquivadas: 0,
      lixeira: 0,
    },
    automacoes: {
      totalExecucoes: 0,
      sucessos: 0,
      erros: 0,
      emExecucao: 0,
      ultimaExecucao: null,
    },
    alertas: [],
    ultimasEmpresas: [],
    ultimasFaturas: [],
    ultimasAutomacoes: [],
  }
}

function normalizarDashboard(resposta) {
  const origem = normalizarObjeto(resposta)
  const padrao = criarDashboardPadrao()

  return {
    ...padrao,
    ...origem,
    periodo: { ...padrao.periodo, ...(origem.periodo || {}) },
    empresas: { ...padrao.empresas, ...(origem.empresas || {}) },
    assinaturas: { ...padrao.assinaturas, ...(origem.assinaturas || {}) },
    faturamento: { ...padrao.faturamento, ...(origem.faturamento || {}) },
    notificacoes: { ...padrao.notificacoes, ...(origem.notificacoes || {}) },
    automacoes: { ...padrao.automacoes, ...(origem.automacoes || {}) },
    alertas: normalizarLista(origem.alertas),
    ultimasEmpresas: normalizarLista(origem.ultimasEmpresas),
    ultimasFaturas: normalizarLista(origem.ultimasFaturas),
    ultimasAutomacoes: normalizarLista(origem.ultimasAutomacoes),
  }
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []
  return valor.content || valor.data?.content || valor.data || valor.items || valor.itens || valor.resultado || []
}

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function obterStatusErro(error) {
  return Number(error?.status || error?.response?.status || error?.detalhes?.status || 0)
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
        <p class="descricao">Acompanhe a saúde geral da plataforma.</p>
      </div>

      <button class="botao secundario" :disabled="atualizando" @click="carregarDashboard(true)">
        {{ atualizando ? 'Atualizando...' : 'Atualizar dados' }}
      </button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>
    <section v-if="carregando" class="card">Carregando Dashboard SaaS...</section>

    <template v-else>
      <section class="grupo">
        <h2>Empresas</h2>
        <div class="cards">
          <article v-for="card in cardsEmpresas" :key="card.rotulo" class="card metrica">
            <span>{{ card.rotulo }}</span>
            <strong>{{ card.valor }}</strong>
          </article>
        </div>
      </section>

      <section class="grupo">
        <h2>Assinaturas</h2>
        <div class="cards">
          <article v-for="card in cardsAssinaturas" :key="card.rotulo" class="card metrica">
            <span>{{ card.rotulo }}</span>
            <strong>{{ card.valor }}</strong>
          </article>
        </div>
      </section>

      <section class="grupo">
        <h2>Faturamento</h2>
        <div class="cards">
          <article v-for="card in cardsFaturamento" :key="card.rotulo" class="card metrica">
            <span>{{ card.rotulo }}</span>
            <strong>{{ card.valor }}</strong>
          </article>
        </div>
      </section>

      <section class="grupo">
        <h2>Notificações e automações</h2>
        <div class="cards">
          <article v-for="card in cardsAutomacoes" :key="card.rotulo" class="card metrica">
            <span>{{ card.rotulo }}</span>
            <strong>{{ card.valor }}</strong>
          </article>
        </div>
      </section>

      <section class="card alertas">
        <div class="cabecalho-card">
          <h2>Alertas da plataforma</h2>
        </div>

        <p v-if="!alertas.length" class="vazio">Não há alertas importantes no momento.</p>

        <div v-else class="lista-alertas">
          <article v-for="(alerta, indice) in alertas" :key="alerta.id || indice" class="alerta">
            <span :class="['badge', classeSeveridade(alerta)]">{{ textoSeveridade(alerta) }}</span>
            <div>
              <h3>{{ tituloItem(alerta) }}</h3>
              <p>{{ textoAlerta(alerta) }}</p>
            </div>
            <button v-if="linkAlerta(alerta)" class="botao compacto secundario" @click="abrirAlerta(alerta)">Abrir</button>
          </article>
        </div>
      </section>

      <section class="listas">
        <article class="card lista">
          <h2>Últimas empresas</h2>
          <p v-if="!ultimasEmpresas.length" class="vazio">Nenhuma empresa recente.</p>
          <ul v-else>
            <li v-for="(item, indice) in ultimasEmpresas" :key="item.id || indice">
              <span>{{ tituloItem(item) }}</span>
              <strong>{{ detalheEmpresa(item) || '-' }}</strong>
            </li>
          </ul>
        </article>

        <article class="card lista">
          <h2>Últimas faturas</h2>
          <p v-if="!ultimasFaturas.length" class="vazio">Nenhuma fatura recente.</p>
          <ul v-else>
            <li v-for="(item, indice) in ultimasFaturas" :key="item.id || indice">
              <span>{{ tituloItem(item) }}</span>
              <strong>{{ detalheFatura(item) || '-' }}</strong>
            </li>
          </ul>
        </article>

        <article class="card lista">
          <h2>Últimas automações</h2>
          <p v-if="!ultimasAutomacoes.length" class="vazio">Nenhuma automação executada recentemente.</p>
          <ul v-else>
            <li v-for="(item, indice) in ultimasAutomacoes" :key="item.id || indice">
              <span>{{ tituloItem(item) }}</span>
              <strong>{{ detalheAutomacao(item) || '-' }}</strong>
            </li>
          </ul>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.pagina,.grupo{display:grid;gap:22px;color:#111827}.cabecalho-pagina,.cabecalho-card{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-size:14px;font-weight:800;text-transform:uppercase}h1,h2,h3,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:22px;font-weight:800}h3{font-size:16px;font-weight:800}.descricao,.vazio,.alerta p{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.cards{display:grid;grid-template-columns:repeat(4,minmax(170px,1fr));gap:16px}.metrica{display:grid;gap:8px}.metrica span{color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.metrica strong{color:#111827;font-size:24px;font-weight:800}.alertas,.lista{display:grid;gap:14px}.lista-alertas{display:grid;gap:12px}.alerta{display:grid;grid-template-columns:auto 1fr auto;align-items:center;gap:14px;border:1px solid #e5e7eb;border-radius:8px;padding:14px;background:#f8fafc}.badge{display:inline-flex;width:fit-content;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.badge.alta{background:#ffedd5;color:#c2410c}.badge.media{background:#fef3c7;color:#92400e}.badge.baixa{background:#dbeafe;color:#1d4ed8}.listas{display:grid;grid-template-columns:repeat(3,minmax(240px,1fr));gap:18px}ul{display:grid;gap:10px;margin:0;padding:0;list-style:none}li{display:grid;gap:4px;border-bottom:1px solid #e5e7eb;padding-bottom:10px}li span{color:#334155;font-weight:800}li strong{color:#2563eb;font-size:13px}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.botao:disabled{opacity:.55;cursor:not-allowed}.secundario{background:#0f172a}.compacto{padding:8px 12px;font-size:12px}@media(max-width:1100px){.cards{grid-template-columns:repeat(2,minmax(170px,1fr))}.listas{grid-template-columns:1fr}}@media(max-width:900px){.cabecalho-pagina,.cabecalho-card{align-items:flex-start;flex-direction:column}.cards{grid-template-columns:1fr}.alerta{grid-template-columns:1fr}}
</style>
