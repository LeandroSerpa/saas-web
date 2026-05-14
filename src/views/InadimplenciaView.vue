<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  alterarBloqueioFinanceiroEmpresa,
  buscarEmpresasFinanceiro,
  buscarResumoFinanceiroSaas,
} from '@/services/api'

const resumo = ref({})
const empresas = ref([])
const filtros = ref({
  statusFinanceiro: '',
  busca: '',
  somenteBloqueadas: false,
  somenteEmAtraso: false,
})
const carregando = ref(true)
const processandoId = ref(null)
const erro = ref('')
const sucesso = ref('')

const filtrosApi = computed(() =>
  limparVazios({
    statusFinanceiro: filtros.value.statusFinanceiro,
    busca: filtros.value.busca,
    somenteBloqueadas: filtros.value.somenteBloqueadas ? true : '',
    somenteEmAtraso: filtros.value.somenteEmAtraso ? true : '',
  }),
)

const cards = computed(() => [
  { titulo: 'Total de empresas', valor: numeroResumo('totalEmpresas', 'total') },
  { titulo: 'Adimplentes', valor: numeroResumo('adimplentes', 'totalAdimplentes') },
  { titulo: 'Em atraso', valor: numeroResumo('emAtraso', 'totalEmAtraso') },
  { titulo: 'Bloqueadas', valor: numeroResumo('bloqueadas', 'totalBloqueadas') },
  { titulo: 'Faturas vencidas', valor: numeroResumo('faturasVencidas', 'totalFaturasVencidas') },
  { titulo: 'Valor vencido total', valor: formatarMoeda(obterCampo(resumo.value, 'valorVencidoTotal', 'valorVencido')) },
])

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const [resumoApi, empresasApi] = await Promise.all([
      buscarResumoFinanceiroSaas(),
      buscarEmpresasFinanceiro(filtrosApi.value),
    ])
    resumo.value = normalizarObjeto(resumoApi)
    empresas.value = normalizarLista(empresasApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar a inadimplência.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function bloquearEmpresa(item) {
  const motivo = window.prompt('Informe o motivo do bloqueio:')
  if (!motivo?.trim()) {
    erro.value = 'Informe o motivo do bloqueio.'
    return
  }
  await alterarBloqueio(item, { bloqueado: true, motivo: motivo.trim(), motivoBloqueio: motivo.trim() }, 'Empresa bloqueada com sucesso.')
}

async function desbloquearEmpresa(item) {
  if (!window.confirm('Tem certeza que deseja desbloquear esta empresa?')) return
  await alterarBloqueio(item, { bloqueado: false, motivo: '', motivoBloqueio: '' }, 'Empresa desbloqueada com sucesso.')
}

async function alterarBloqueio(item, payload, mensagem) {
  try {
    processandoId.value = item.empresaId || item.id
    erro.value = ''
    sucesso.value = ''
    await alterarBloqueioFinanceiroEmpresa(item.empresaId || item.id, payload)
    sucesso.value = mensagem
    await carregarDados()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível alterar o bloqueio financeiro.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function limparFiltros() {
  filtros.value = {
    statusFinanceiro: '',
    busca: '',
    somenteBloqueadas: false,
    somenteEmAtraso: false,
  }
  carregarDados()
}

function statusTexto(status) {
  const valor = normalizarStatus(status)
  return {
    ADIMPLENTE: 'Adimplente',
    EM_ATRASO: 'Em atraso',
    BLOQUEADA_FINANCEIRO: 'Bloqueada',
  }[valor] || valor || '-'
}

function normalizarStatus(status) {
  return String(status || 'ADIMPLENTE').trim().toUpperCase()
}

function estaBloqueada(item) {
  return Boolean(obterCampo(item, 'bloqueioManual', 'bloqueado', 'bloqueada')) || normalizarStatus(obterCampo(item, 'statusFinanceiro', 'status')) === 'BLOQUEADA_FINANCEIRO'
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  return dados.content || dados.data?.content || dados.data || dados.items || dados.itens || dados.resultado || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && !Array.isArray(dados.data) ? dados.data : dados
}

function limparVazios(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined))
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function numeroResumo(...campos) {
  return Number(obterCampo(resumo.value, ...campos) || 0).toLocaleString('pt-BR')
}

function formatarMoeda(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarData(valor) {
  if (!valor) return '-'
  const data = /^\d{4}-\d{2}-\d{2}$/.test(String(valor))
    ? new Date(...String(valor).split('-').map((parte, indice) => (indice === 1 ? Number(parte) - 1 : Number(parte))))
    : new Date(valor)
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleDateString('pt-BR')
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

onMounted(carregarDados)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Inadimplência</h1>
        <p class="descricao">Acompanhe empresas em atraso e bloqueios financeiros.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="grade-resumo">
      <article v-for="card in cards" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>Status financeiro
          <select v-model="filtros.statusFinanceiro">
            <option value="">Todos</option>
            <option value="ADIMPLENTE">Adimplente</option>
            <option value="EM_ATRASO">Em atraso</option>
            <option value="BLOQUEADA_FINANCEIRO">Bloqueada</option>
          </select>
        </label>
        <label>Busca
          <input v-model="filtros.busca" type="text" placeholder="Empresa, documento ou responsável" />
        </label>
        <label class="checkbox"><input v-model="filtros.somenteBloqueadas" type="checkbox" /> Somente bloqueadas</label>
        <label class="checkbox"><input v-model="filtros.somenteEmAtraso" type="checkbox" /> Somente em atraso</label>
      </div>
      <div class="acoes">
        <button class="botao principal" @click="carregarDados">Aplicar filtros</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <section v-if="carregando" class="card">Carregando empresas...</section>
    <section v-else-if="!empresas.length" class="card">Nenhuma empresa encontrada.</section>
    <section v-else class="card tabela-card">
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Empresa</th>
              <th>Status financeiro</th>
              <th>Faturas vencidas</th>
              <th>Valor vencido</th>
              <th>Maior atraso</th>
              <th>Próximo vencimento</th>
              <th>Bloqueio manual</th>
              <th>Motivo</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in empresas" :key="item.empresaId || item.id">
              <td>{{ obterCampo(item, 'empresaNome', 'nome', 'razaoSocial') || '-' }}</td>
              <td><span :class="['status', normalizarStatus(obterCampo(item, 'statusFinanceiro', 'status')).toLowerCase()]">{{ statusTexto(obterCampo(item, 'statusFinanceiro', 'status')) }}</span></td>
              <td>{{ obterCampo(item, 'faturasVencidas', 'quantidadeFaturasVencidas') || 0 }}</td>
              <td>{{ formatarMoeda(obterCampo(item, 'valorVencido', 'valorTotalVencido')) }}</td>
              <td>{{ obterCampo(item, 'diasMaiorAtraso', 'maiorAtrasoDias') || 0 }} dia(s)</td>
              <td>{{ formatarData(obterCampo(item, 'proximoVencimento', 'proximaFaturaVencimento')) }}</td>
              <td>{{ estaBloqueada(item) ? 'Sim' : 'Não' }}</td>
              <td>{{ obterCampo(item, 'motivoBloqueio', 'motivo') || '-' }}</td>
              <td>
                <div class="acoes-tabela">
                  <RouterLink class="botao compacto secundario" :to="{ path: '/faturas', query: { empresaId: item.empresaId || item.id } }">Ver faturas</RouterLink>
                  <button v-if="!estaBloqueada(item)" class="botao compacto perigo" :disabled="processandoId === (item.empresaId || item.id)" @click="bloquearEmpresa(item)">Bloquear</button>
                  <button v-else class="botao compacto sucesso-botao" :disabled="processandoId === (item.empresaId || item.id)" @click="desbloquearEmpresa(item)">Desbloquear</button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,.filtros{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,p{margin:0}h1{font-size:32px}.descricao{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.grade-resumo{display:grid;grid-template-columns:repeat(3,minmax(160px,1fr));gap:14px}.indicador{display:grid;gap:8px}.indicador span{color:#64748b;font-weight:800}.indicador strong{font-size:24px}.campos{display:grid;grid-template-columns:repeat(4,minmax(160px,1fr));gap:14px;align-items:end}label{display:grid;gap:7px;font-weight:800;color:#334155}.checkbox{display:flex;align-items:center;gap:8px}input,select{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.compacto{width:100%;padding:7px 8px;font-size:11px;line-height:1.2;white-space:normal}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.sucesso-botao{background:#15803d}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.tabela-card{padding:0;overflow:hidden}.tabela-container{overflow-x:visible}table{width:100%;min-width:0;border-collapse:collapse;table-layout:auto}th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:left;color:#374151;vertical-align:top;font-size:13px;line-height:1.35;white-space:normal;word-break:break-word}th{background:#f8fafc;color:#111827;font-size:11px;text-transform:uppercase}.acoes-tabela{display:flex;flex-direction:column;gap:6px;align-items:flex-start;min-width:120px}.status{display:inline-flex;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.status.adimplente{background:#dcfce7;color:#15803d}.status.em_atraso{background:#fef3c7;color:#92400e}.status.bloqueada_financeiro{background:#fee2e2;color:#b91c1c}@media(max-width:900px){.tabela-container{overflow-x:auto}table{min-width:980px}.cabecalho-pagina,.acoes{align-items:flex-start;flex-direction:column}.grade-resumo,.campos{grid-template-columns:1fr}}

th:last-child,
td:last-child{position:sticky;right:0;z-index:2;width:130px;min-width:130px;background:white;box-shadow:-8px 0 14px rgba(15,23,42,.06)}
th:last-child{z-index:3;background:#f8fafc}
</style>
