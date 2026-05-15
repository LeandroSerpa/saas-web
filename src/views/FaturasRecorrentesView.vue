<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ativarFaturaRecorrente,
  atualizarFaturaRecorrente,
  buscarEmpresas,
  buscarFaturasRecorrentes,
  criarFaturaRecorrente,
  desativarFaturaRecorrente,
  gerarFaturasRecorrentes,
  gerarProximaFaturaRecorrente,
} from '@/services/api'

const recorrencias = ref([])
const empresas = ref([])
const filtros = ref({ empresaId: '', status: '', busca: '' })
const formulario = ref(criarFormulario())
const editandoId = ref(null)
const mostrarFormulario = ref(false)
const carregando = ref(true)
const salvando = ref(false)
const processandoId = ref(null)
const erro = ref('')
const sucesso = ref('')
const resumoGeracao = ref(null)

const recorrenciasFiltradas = computed(() =>
  recorrencias.value.filter((item) => {
    if (filtros.value.status === 'ATIVA') return estaAtiva(item)
    if (filtros.value.status === 'INATIVA') return !estaAtiva(item)
    return true
  }),
)
const cards = computed(() => {
  const total = recorrencias.value.length
  const ativas = recorrencias.value.filter((item) => estaAtiva(item)).length
  const valorMensal = recorrencias.value
    .filter((item) => estaAtiva(item))
    .reduce((totalValor, item) => totalValor + numero(obterCampo(item, 'valor')), 0)
  return [
    { titulo: 'Total de recorrências', valor: total },
    { titulo: 'Ativas', valor: ativas },
    { titulo: 'Inativas', valor: total - ativas },
    { titulo: 'Valor mensal previsto', valor: formatarMoeda(valorMensal) },
    { titulo: 'Próxima competência', valor: obterProximaCompetencia() },
  ]
})

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const [recorrenciasApi, empresasApi] = await Promise.all([
      buscarFaturasRecorrentes(montarFiltrosApi()),
      buscarEmpresas(),
    ])
    recorrencias.value = normalizarLista(recorrenciasApi)
    empresas.value = normalizarLista(empresasApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as faturas recorrentes.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function montarFiltrosApi() {
  const status = String(filtros.value.status || '').trim().toUpperCase()

  return limparVazios({
    empresaId: filtros.value.empresaId,
    busca: filtros.value.busca,
    status,
    ativo: status === 'ATIVA' ? true : status === 'INATIVA' ? false : '',
  })
}

function limparFiltros() {
  filtros.value = { empresaId: '', status: '', busca: '' }
  carregarDados()
}

function abrirNova() {
  editandoId.value = null
  formulario.value = criarFormulario()
  mostrarFormulario.value = true
  erro.value = ''
  sucesso.value = ''
}

function editar(item) {
  editandoId.value = item.id
  formulario.value = {
    empresaId: obterCampo(item, 'empresaId') || obterCampo(item.empresa, 'id') || '',
    descricao: obterCampo(item, 'descricao') || '',
    valor: formatarValorFormulario(obterCampo(item, 'valor')),
    diaVencimento: obterCampo(item, 'diaVencimento') || '',
    competenciaInicio: obterCampo(item, 'competenciaInicio') || '',
    competenciaFim: obterCampo(item, 'competenciaFim') || '',
    observacao: obterCampo(item, 'observacao') || '',
    metodoPagamentoPadrao: 'PIX',
  }
  mostrarFormulario.value = true
}

async function salvar() {
  const validacao = validar()
  if (validacao) {
    erro.value = validacao
    sucesso.value = ''
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    const payload = montarPayload()
    if (editandoId.value) {
      await atualizarFaturaRecorrente(editandoId.value, payload)
      sucesso.value = 'Recorrência atualizada com sucesso.'
    } else {
      await criarFaturaRecorrente(payload)
      sucesso.value = 'Recorrência criada com sucesso.'
    }
    fecharFormulario()
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar a recorrência.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function alternarAtivo(item) {
  try {
    processandoId.value = item.id
    erro.value = ''
    sucesso.value = ''
    if (estaAtiva(item)) {
      await desativarFaturaRecorrente(item.id)
      sucesso.value = 'Recorrência desativada com sucesso.'
    } else {
      await ativarFaturaRecorrente(item.id)
      sucesso.value = 'Recorrência ativada com sucesso.'
    }
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível alterar a recorrência.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function gerarProxima(item) {
  if (!window.confirm('Gerar a próxima fatura desta recorrência?')) return
  try {
    processandoId.value = item.id
    erro.value = ''
    sucesso.value = ''
    await gerarProximaFaturaRecorrente(item.id)
    sucesso.value = 'Próxima fatura gerada com sucesso.'
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível gerar a próxima fatura.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function gerarMes() {
  const competencia = window.prompt('Informe a competência no formato YYYY-MM:')
  if (!competencia?.trim()) return
  if (!/^\d{4}-\d{2}$/.test(competencia.trim())) {
    erro.value = 'Informe a competência no formato YYYY-MM.'
    return
  }

  try {
    erro.value = ''
    sucesso.value = ''
    resumoGeracao.value = null
    const resposta = await gerarFaturasRecorrentes({ competencia: competencia.trim(), metodoPagamento: 'PIX' })
    resumoGeracao.value = normalizarObjeto(resposta)
    const criadas = obterCampo(resumoGeracao.value, 'criadas', 'faturasCriadas', 'totalCriadas') || 0
    const ignoradas = obterCampo(resumoGeracao.value, 'ignoradas', 'faturasIgnoradas', 'totalIgnoradas') || 0
    sucesso.value = `Geração concluída. ${criadas} faturas criadas, ${ignoradas} ignoradas.`
    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível gerar as faturas recorrentes.')
    console.error(error)
  }
}

function fecharFormulario() {
  mostrarFormulario.value = false
  editandoId.value = null
  formulario.value = criarFormulario()
}

function criarFormulario() {
  return {
    empresaId: '',
    descricao: 'Mensalidade Gestão SaaS',
    valor: '',
    diaVencimento: '10',
    competenciaInicio: new Date().toISOString().slice(0, 7),
    competenciaFim: '',
    observacao: '',
    metodoPagamentoPadrao: 'PIX',
  }
}

function validar() {
  if (!formulario.value.empresaId) return 'Selecione a empresa.'
  if (!String(formulario.value.descricao || '').trim()) return 'Informe a descrição.'
  if (!Number.isFinite(converterValor(formulario.value.valor))) return 'Informe um valor válido.'
  const dia = Number(formulario.value.diaVencimento)
  if (!Number.isInteger(dia) || dia < 1 || dia > 31) return 'Informe um dia de vencimento entre 1 e 31.'
  if (!formulario.value.competenciaInicio) return 'Informe a competência inicial.'
  return ''
}

function montarPayload() {
  return limparVazios({
    ...formulario.value,
    empresaId: Number(formulario.value.empresaId),
    valor: converterValor(formulario.value.valor),
    diaVencimento: Number(formulario.value.diaVencimento),
    metodoPagamentoPadrao: 'PIX',
  })
}

function estaAtiva(item) {
  const ativo = obterCampo(item, 'ativo', 'ativa')
  if (ativo !== '') return ativo !== false && String(ativo).toLowerCase() !== 'false'

  const status = normalizarStatusRecorrencia(obterCampo(item, 'status', 'situacao'))
  if (status) return status === 'ATIVA'

  return true
}

function normalizarStatusRecorrencia(status) {
  const valor = String(status || '').trim().toUpperCase()
  if (['ATIVA', 'ATIVAS', 'ATIVO', 'ATIVOS'].includes(valor)) return 'ATIVA'
  if (['INATIVA', 'INATIVAS', 'INATIVO', 'INATIVOS'].includes(valor)) return 'INATIVA'
  return valor
}

function nomeEmpresa(item) {
  return (
    obterCampo(item, 'empresaNome', 'nomeEmpresa') ||
    obterCampo(item.empresa, 'nome', 'razaoSocial') ||
    empresas.value.find((empresa) => String(empresa.id) === String(obterCampo(item, 'empresaId')))?.nome ||
    '-'
  )
}

function obterProximaCompetencia() {
  const valores = recorrencias.value.map((item) => obterCampo(item, 'proximaCompetencia')).filter(Boolean).sort()
  return valores[0] ? formatarCompetencia(valores[0]) : '-'
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
  return Object.fromEntries(Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()))
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function numero(valor) {
  const n = Number(valor)
  return Number.isFinite(n) ? n : 0
}

function converterValor(valor) {
  const texto = String(valor ?? '').trim().replace(/\s/g, '')
  if (!texto) return NaN
  const ultimaVirgula = texto.lastIndexOf(',')
  const ultimoPonto = texto.lastIndexOf('.')
  if (ultimaVirgula >= 0 && ultimoPonto >= 0) {
    const idx = Math.max(ultimaVirgula, ultimoPonto)
    return Number(`${texto.slice(0, idx).replace(/[.,]/g, '')}.${texto.slice(idx + 1).replace(/[.,]/g, '')}`)
  }
  return Number(texto.replace(/\./g, '').replace(',', '.'))
}

function formatarValorFormulario(valor) {
  const n = numero(valor)
  return n.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function formatarMoeda(valor) {
  return numero(valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function formatarCompetencia(valor) {
  const match = String(valor || '').match(/^(\d{4})-(\d{2})/)
  return match ? `${match[2]}/${match[1]}` : valor || '-'
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
        <h1>Faturas recorrentes</h1>
        <p class="descricao">Configure cobranças mensais automáticas para empresas ativas.</p>
      </div>
      <div class="acoes">
        <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
        <button class="botao sucesso-botao" @click="gerarMes">Gerar faturas do mês</button>
        <button class="botao principal" @click="abrirNova">Nova recorrência</button>
      </div>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="grade-resumo">
      <article v-for="card in cards" :key="card.titulo" class="card indicador">
        <span>{{ card.titulo }}</span>
        <strong>{{ card.valor }}</strong>
      </article>
    </section>

    <section class="card aviso-pix">
      Faturas recorrentes geradas automaticamente usam PIX por padrão. O método pode ser alterado depois em uma fatura específica, se necessário.
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>Empresa
          <select v-model="filtros.empresaId">
            <option value="">Todas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">{{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}</option>
          </select>
        </label>
        <label>Status
          <select v-model="filtros.status">
            <option value="">Todas</option>
            <option value="ATIVA">Ativas</option>
            <option value="INATIVA">Inativas</option>
          </select>
        </label>
        <label>Busca
          <input v-model="filtros.busca" type="text" placeholder="Empresa ou descrição" />
        </label>
      </div>
      <div class="acoes">
        <button class="botao principal" @click="carregarDados">Aplicar filtros</button>
        <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </section>

    <form v-if="mostrarFormulario" class="card formulario" @submit.prevent="salvar">
      <div class="cabecalho-card">
        <div>
          <h2>{{ editandoId ? 'Editar recorrência' : 'Nova recorrência' }}</h2>
          <p>Faturas automáticas usam PIX por padrão.</p>
        </div>
        <button type="button" class="botao secundario" @click="fecharFormulario">Fechar</button>
      </div>
      <div class="campos">
        <label>Empresa
          <select v-model="formulario.empresaId">
            <option value="">Selecione</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">{{ empresa.nome || empresa.razaoSocial || `Empresa ${empresa.id}` }}</option>
          </select>
        </label>
        <label>Valor <input v-model="formulario.valor" type="text" inputmode="decimal" /></label>
        <label>Dia de vencimento <input v-model="formulario.diaVencimento" type="number" min="1" max="31" /></label>
        <label>Competência início <input v-model="formulario.competenciaInicio" type="month" /></label>
        <label>Competência fim opcional <input v-model="formulario.competenciaFim" type="month" /></label>
        <label>Método padrão <input value="PIX — padrão para faturas automáticas" disabled /></label>
        <label class="campo-grande">Descrição <input v-model="formulario.descricao" type="text" /></label>
        <label class="campo-grande">Observação <textarea v-model="formulario.observacao" rows="3"></textarea></label>
      </div>
      <div class="acoes">
        <button class="botao principal" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar recorrência' }}</button>
        <button type="button" class="botao secundario" @click="fecharFormulario">Cancelar</button>
      </div>
    </form>

    <section v-if="carregando" class="card">Carregando recorrências...</section>
    <section v-else-if="!recorrenciasFiltradas.length" class="card">Nenhuma recorrência encontrada.</section>
    <section v-else class="card tabela-card">
      <div class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Empresa</th><th>Descrição</th><th>Valor</th><th>Dia vencimento</th><th>Competência início</th><th>Competência fim</th><th>Método padrão</th><th>Última gerada</th><th>Próxima</th><th>Status</th><th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="item in recorrenciasFiltradas" :key="item.id">
              <td>{{ nomeEmpresa(item) }}</td>
              <td>{{ obterCampo(item, 'descricao') || '-' }}</td>
              <td>{{ formatarMoeda(obterCampo(item, 'valor')) }}</td>
              <td>{{ obterCampo(item, 'diaVencimento') || '-' }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'competenciaInicio')) }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'competenciaFim')) }}</td>
              <td>PIX</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'ultimaCompetenciaGerada')) }}</td>
              <td>{{ formatarCompetencia(obterCampo(item, 'proximaCompetencia')) }}</td>
              <td><span :class="['status', estaAtiva(item) ? 'ativa' : 'inativa']">{{ estaAtiva(item) ? 'Ativa' : 'Inativa' }}</span></td>
              <td>
                <div class="acoes-tabela">
                  <button class="botao compacto secundario" @click="editar(item)">Editar</button>
                  <button class="botao compacto" :class="estaAtiva(item) ? 'perigo' : 'sucesso-botao'" :disabled="processandoId === item.id" @click="alternarAtivo(item)">{{ estaAtiva(item) ? 'Desativar' : 'Ativar' }}</button>
                  <button class="botao compacto sucesso-botao" :disabled="processandoId === item.id" @click="gerarProxima(item)">Gerar próxima</button>
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
.pagina,.filtros,.formulario{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.cabecalho-card,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px}.descricao,.cabecalho-card p{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.grade-resumo{display:grid;grid-template-columns:repeat(5,minmax(150px,1fr));gap:14px}.indicador{display:grid;gap:8px}.indicador span{color:#64748b;font-weight:800}.indicador strong{font-size:22px}.aviso-pix{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8;font-weight:800}.campos{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:14px}label{display:grid;gap:7px;font-weight:800;color:#334155}.campo-grande{grid-column:1/-1}input,select,textarea{border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800}.compacto{width:100%;padding:7px 8px;font-size:11px;line-height:1.2;white-space:normal}.principal{background:#2563eb}.secundario{background:#0f172a}.sucesso-botao{background:#15803d}.perigo{background:#dc2626}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.tabela-card{padding:0;overflow:hidden}.tabela-container{overflow-x:visible}table{width:100%;min-width:0;border-collapse:collapse;table-layout:auto}th,td{padding:10px 8px;border-bottom:1px solid #e5e7eb;text-align:left;color:#374151;vertical-align:top;font-size:13px;line-height:1.35;white-space:normal;word-break:break-word}th{background:#f8fafc;color:#111827;font-size:11px;text-transform:uppercase}.status{display:inline-flex;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.status.ativa{background:#dcfce7;color:#15803d}.status.inativa{background:#e5e7eb;color:#4b5563}.acoes-tabela{display:flex;flex-direction:column;gap:6px;align-items:flex-start;min-width:130px}@media(max-width:1100px){.tabela-container{overflow-x:auto}table{min-width:1180px}.grade-resumo,.campos{grid-template-columns:repeat(2,minmax(160px,1fr))}}@media(max-width:760px){.cabecalho-pagina,.cabecalho-card,.acoes{align-items:flex-start;flex-direction:column}.grade-resumo,.campos{grid-template-columns:1fr}}

th:last-child,
td:last-child{position:sticky;right:0;z-index:2;width:140px;min-width:140px;background:white;box-shadow:-8px 0 14px rgba(15,23,42,.06)}
th:last-child{z-index:3;background:#f8fafc}
</style>
