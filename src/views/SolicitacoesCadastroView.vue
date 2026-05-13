<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  aprovarSolicitacaoCadastro,
  buscarPlanos,
  buscarResumoSolicitacoesCadastro,
  buscarSolicitacaoCadastroPorId,
  buscarSolicitacoesCadastro,
  rejeitarSolicitacaoCadastro,
} from '@/services/api'
import { ehSuperAdmin } from '@/utils/permissoes'

const LINK_ACESSO = 'https://automacao-le-saas-web.1mweab.easypanel.host'
const STATUS = [
  { valor: '', rotulo: 'Todos' },
  { valor: 'PENDENTE', rotulo: 'Pendente' },
  { valor: 'APROVADA', rotulo: 'Aprovada' },
  { valor: 'REJEITADA', rotulo: 'Rejeitada' },
  { valor: 'CANCELADA', rotulo: 'Cancelada' },
]

const usuarioLogado = ref(obterUsuarioLogado())
const superAdmin = computed(() => ehSuperAdmin(usuarioLogado.value))
const solicitacoes = ref([])
const resumo = ref({})
const planos = ref([])
const filtros = ref({ status: '', busca: '', dataInicial: '', dataFinal: '' })
const carregando = ref(true)
const processando = ref(false)
const processandoId = ref(null)
const erro = ref('')
const mensagemSucesso = ref('')
const detalhe = ref(null)
const aprovando = ref(null)
const rejeitando = ref(null)
const resultadoAprovacao = ref(null)
const aprovacao = ref(criarAprovacaoInicial())
const rejeicao = ref({ motivo: '', observacaoInterna: '' })

const cardsResumo = computed(() => [
  { titulo: 'Total', valor: formatarNumero(numeroResumo('total', 'totalSolicitacoes', 'totalSolicitacoesCadastro')) },
  { titulo: 'Pendentes', valor: formatarNumero(numeroResumo('pendentes', 'totalPendente', 'totalPendentes')) },
  { titulo: 'Aprovadas', valor: formatarNumero(numeroResumo('aprovadas', 'totalAprovada', 'totalAprovadas')) },
  { titulo: 'Rejeitadas', valor: formatarNumero(numeroResumo('rejeitadas', 'totalRejeitada', 'totalRejeitadas')) },
  { titulo: 'Canceladas', valor: formatarNumero(numeroResumo('canceladas', 'totalCancelada', 'totalCanceladas')) },
])

async function carregarDados(opcoes = {}) {
  try {
    carregando.value = true
    if (!opcoes.manterMensagem) limparMensagens()
    const [listaApi, resumoApi, planosApi] = await Promise.all([
      buscarSolicitacoesCadastro(limparVazios(filtros.value)),
      buscarResumoSolicitacoesCadastro().catch(() => ({})),
      buscarPlanos().catch(() => []),
    ])
    solicitacoes.value = extrairLista(listaApi)
    resumo.value = normalizarObjeto(resumoApi)
    planos.value = extrairLista(planosApi)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as solicitações.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function verDetalhes(item) {
  try {
    processandoId.value = item.id
    erro.value = ''
    detalhe.value = normalizarObjeto(await buscarSolicitacaoCadastroPorId(item.id))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os detalhes da solicitação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function abrirAprovacao(item) {
  aprovando.value = item
  resultadoAprovacao.value = null
  aprovacao.value = {
    ...criarAprovacaoInicial(),
    nomeEmpresa: nomeEmpresa(item),
    slugEmpresa: gerarSlug(nomeEmpresa(item)),
    planoId: obterCampo(item, 'planoId', 'planoDesejadoId', 'planoSaasId') || '',
    adminNome: responsavelNome(item),
    adminEmail: responsavelEmail(item),
  }
}

async function aprovar() {
  if (!aprovando.value?.id) return

  try {
    processando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    const resposta = await aprovarSolicitacaoCadastro(aprovando.value.id, limparVazios({ ...aprovacao.value }))
    resultadoAprovacao.value = normalizarObjeto(resposta)
    mensagemSucesso.value = 'Solicitação aprovada com sucesso.'
    await carregarDados({ manterMensagem: true })
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível aprovar a solicitação.')
    console.error(error)
  } finally {
    processando.value = false
  }
}

function abrirRejeicao(item) {
  rejeitando.value = item
  rejeicao.value = { motivo: '', observacaoInterna: '' }
}

async function rejeitar() {
  if (!rejeitando.value?.id) return

  if (!rejeicao.value.motivo.trim()) {
    erro.value = 'Informe o motivo da rejeição.'
    return
  }

  try {
    processando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    await rejeitarSolicitacaoCadastro(rejeitando.value.id, limparVazios({ ...rejeicao.value }))
    rejeitando.value = null
    mensagemSucesso.value = 'Solicitação rejeitada com sucesso.'
    await carregarDados({ manterMensagem: true })
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível rejeitar a solicitação.')
    console.error(error)
  } finally {
    processando.value = false
  }
}

async function copiarDadosAcesso() {
  const texto = [
    `Empresa: ${obterCampo(resultadoAprovacao.value, 'empresaNome') || aprovacao.value.nomeEmpresa || '-'}`,
    `Usuário administrador: ${obterCampo(resultadoAprovacao.value, 'adminNome', 'usuarioAdminNome') || aprovacao.value.adminNome || '-'}`,
    `E-mail: ${obterCampo(resultadoAprovacao.value, 'adminEmail', 'usuarioAdminEmail') || aprovacao.value.adminEmail || '-'}`,
    `Senha temporária: ${obterCampo(resultadoAprovacao.value, 'senhaTemporaria', 'senhaInicialAdmin') || aprovacao.value.senhaTemporaria || '-'}`,
    `Link de acesso: ${LINK_ACESSO}`,
  ].join('\n')

  try {
    await navigator.clipboard.writeText(texto)
    mensagemSucesso.value = 'Dados de acesso copiados.'
  } catch (error) {
    erro.value = 'Não foi possível copiar os dados de acesso.'
    console.error(error)
  }
}

function criarAprovacaoInicial() {
  return {
    nomeEmpresa: '',
    slugEmpresa: '',
    planoId: '',
    adminNome: '',
    adminEmail: '',
    senhaTemporaria: '',
    ativarAgendamentoPublico: true,
    observacaoInterna: '',
  }
}

function podeDecidir(item) {
  return normalizarStatus(obterCampo(item, 'status')) === 'PENDENTE'
}

function aplicarFiltros() {
  carregarDados()
}

function limparFiltros() {
  filtros.value = { status: '', busca: '', dataInicial: '', dataFinal: '' }
  carregarDados()
}

function fecharAprovacao() {
  aprovando.value = null
  resultadoAprovacao.value = null
}

function limparMensagens() {
  erro.value = ''
  mensagemSucesso.value = ''
}

function nomeEmpresa(item) {
  return obterCampo(item, 'nomeEmpresa', 'empresaNome', 'razaoSocial') || '-'
}

function responsavelNome(item) {
  return obterCampo(item, 'responsavelNome', 'nomeResponsavel') || '-'
}

function responsavelEmail(item) {
  return obterCampo(item, 'responsavelEmail', 'emailResponsavel', 'email') || '-'
}

function responsavelTelefone(item) {
  return obterCampo(item, 'responsavelTelefone', 'telefoneResponsavel', 'telefone') || '-'
}

function nomeSegmento(item) {
  return obterCampo(item, 'segmentoNome', 'segmentoNegocioNome') || obterCampo(item.segmento, 'nome') || '-'
}

function nomePlano(item) {
  return obterCampo(item, 'planoNome', 'planoDesejadoNome') || obterCampo(item.plano, 'nome') || '-'
}

function normalizarStatus(status) {
  const valor = String(status || 'PENDENTE').trim().toUpperCase()
  const equivalencias = { NOVA: 'PENDENTE', EM_ANALISE: 'PENDENTE', APROVADO: 'APROVADA', REJEITADO: 'REJEITADA' }
  return equivalencias[valor] || valor
}

function statusTexto(status) {
  const valor = normalizarStatus(status)
  return STATUS.find((item) => item.valor === valor)?.rotulo || valor || '-'
}

function statusClasse(status) {
  return normalizarStatus(status).toLowerCase()
}

function formatarData(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? String(valor) : data.toLocaleDateString('pt-BR')
}

function formatarNumero(valor) {
  return Number(valor || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 })
}

function numeroResumo(...campos) {
  return Number(obterCampo(resumo.value, ...campos) || 0)
}

function gerarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.content)) return resposta.content
  if (Array.isArray(resposta?.data?.content)) return resposta.data.content
  if (Array.isArray(resposta?.data)) return resposta.data
  return resposta?.items || resposta?.itens || resposta?.resultado || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  if (dados.data && !Array.isArray(dados.data) && typeof dados.data === 'object') return dados.data
  return dados
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''
  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') return item[campo]
  }
  return ''
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

function obterUsuarioLogado() {
  try {
    return JSON.parse(localStorage.getItem('usuario') || 'null')
  } catch (error) {
    console.error(error)
    return null
  }
}

onMounted(carregarDados)
</script>

<template>
  <main class="pagina">
    <section v-if="!superAdmin" class="card erro">
      <p>Você não tem permissão para acessar solicitações de cadastro.</p>
    </section>

    <template v-else>
      <header class="cabecalho-pagina">
        <div>
          <p class="subtitulo">ADMINISTRAÇÃO SAAS</p>
          <h1>Solicitações de cadastro</h1>
          <p class="descricao">Analise empresas interessadas em usar a plataforma.</p>
        </div>
        <button class="botao secundario" :disabled="carregando" @click="carregarDados">
          {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
        </button>
      </header>

      <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
      <section v-if="mensagemSucesso" class="card sucesso"><p>{{ mensagemSucesso }}</p></section>

      <section class="grade-resumo">
        <article v-for="card in cardsResumo" :key="card.titulo" class="card indicador">
          <span>{{ card.titulo }}</span>
          <strong>{{ card.valor }}</strong>
        </article>
      </section>

      <section class="card filtros">
        <div class="campos">
          <label>Status <select v-model="filtros.status"><option v-for="status in STATUS" :key="status.valor" :value="status.valor">{{ status.rotulo }}</option></select></label>
          <label>Busca textual <input v-model="filtros.busca" placeholder="Empresa, responsável, e-mail, documento" type="text" /></label>
          <label>Data inicial <input v-model="filtros.dataInicial" type="date" /></label>
          <label>Data final <input v-model="filtros.dataFinal" type="date" /></label>
        </div>
        <div class="acoes">
          <button class="botao principal" :disabled="carregando" @click="aplicarFiltros">Aplicar filtros</button>
          <button class="botao secundario" :disabled="carregando" @click="limparFiltros">Limpar filtros</button>
        </div>
      </section>

      <section v-if="detalhe" class="card painel">
        <div class="cabecalho-card">
          <div><h2>Detalhes da solicitação</h2><p>{{ nomeEmpresa(detalhe) }}</p></div>
          <button class="botao secundario" @click="detalhe = null">Fechar</button>
        </div>
        <div class="detalhes-grid">
          <p><strong>Empresa:</strong> {{ nomeEmpresa(detalhe) }}</p>
          <p><strong>Documento:</strong> {{ obterCampo(detalhe, 'documento') || '-' }}</p>
          <p><strong>Cidade/UF:</strong> {{ obterCampo(detalhe, 'cidade') || '-' }} / {{ obterCampo(detalhe, 'estado') || '-' }}</p>
          <p><strong>Responsável:</strong> {{ responsavelNome(detalhe) }}</p>
          <p><strong>E-mail:</strong> {{ responsavelEmail(detalhe) }}</p>
          <p><strong>Telefone:</strong> {{ responsavelTelefone(detalhe) }}</p>
          <p><strong>Segmento:</strong> {{ nomeSegmento(detalhe) }}</p>
          <p><strong>Plano desejado:</strong> {{ nomePlano(detalhe) }}</p>
          <p><strong>Status:</strong> {{ statusTexto(obterCampo(detalhe, 'status')) }}</p>
          <p class="campo-grande"><strong>Mensagem:</strong> {{ obterCampo(detalhe, 'mensagem', 'observacao') || '-' }}</p>
          <p class="campo-grande"><strong>Observação interna:</strong> {{ obterCampo(detalhe, 'observacaoInterna', 'observacaoComercial') || '-' }}</p>
          <p class="campo-grande"><strong>Motivo rejeição:</strong> {{ obterCampo(detalhe, 'motivoRejeicao', 'motivo') || '-' }}</p>
          <p><strong>Empresa criada:</strong> {{ obterCampo(detalhe, 'empresaCriadaNome', 'empresaNome') || '-' }}</p>
          <p><strong>Criada em:</strong> {{ formatarData(obterCampo(detalhe, 'criadoEm', 'dataCriacao', 'dataSolicitacao')) }}</p>
          <p><strong>Decisão:</strong> {{ formatarData(obterCampo(detalhe, 'aprovadoEm', 'rejeitadoEm', 'dataAprovacao', 'dataRejeicao')) }}</p>
        </div>
      </section>

      <section v-if="carregando" class="card"><p>Carregando solicitações...</p></section>
      <section v-else-if="!solicitacoes.length" class="card"><p>Nenhuma solicitação encontrada.</p></section>

      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Empresa</th><th>Responsável</th><th>E-mail</th><th>Telefone</th><th>Segmento</th><th>Plano desejado</th><th>Status</th><th>Criada em</th><th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in solicitacoes" :key="item.id">
                <td>{{ nomeEmpresa(item) }}</td>
                <td>{{ responsavelNome(item) }}</td>
                <td>{{ responsavelEmail(item) }}</td>
                <td>{{ responsavelTelefone(item) }}</td>
                <td>{{ nomeSegmento(item) }}</td>
                <td>{{ nomePlano(item) }}</td>
                <td><span :class="['status', statusClasse(obterCampo(item, 'status'))]">{{ statusTexto(obterCampo(item, 'status')) }}</span></td>
                <td>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'dataSolicitacao')) }}</td>
                <td>
                  <div class="acoes-tabela">
                    <button class="botao compacto secundario" :disabled="processandoId === item.id" @click="verDetalhes(item)">Ver detalhes</button>
                    <button v-if="podeDecidir(item)" class="botao compacto principal" @click="abrirAprovacao(item)">Aprovar</button>
                    <button v-if="podeDecidir(item)" class="botao compacto perigo" @click="abrirRejeicao(item)">Rejeitar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <section v-if="aprovando" class="modal-fundo" @click.self="fecharAprovacao">
      <form class="card modal" @submit.prevent="aprovar">
        <div class="cabecalho-card">
          <div><h2>Aprovar solicitação</h2><p>{{ nomeEmpresa(aprovando) }}</p></div>
          <button type="button" class="botao secundario" @click="fecharAprovacao">Fechar</button>
        </div>
        <div class="campos">
          <label>Nome da empresa <input v-model="aprovacao.nomeEmpresa" type="text" /></label>
          <label>Slug da empresa <input v-model="aprovacao.slugEmpresa" type="text" /></label>
          <label>Plano <select v-model="aprovacao.planoId"><option value="">Selecione</option><option v-for="plano in planos" :key="plano.id" :value="plano.id">{{ plano.nome }}</option></select></label>
          <label>Nome do usuário admin <input v-model="aprovacao.adminNome" type="text" /></label>
          <label>E-mail do usuário admin <input v-model="aprovacao.adminEmail" type="email" /></label>
          <label>Senha temporária <input v-model="aprovacao.senhaTemporaria" type="text" placeholder="Backend gera se ficar vazio" /></label>
          <label class="checkbox"><input v-model="aprovacao.ativarAgendamentoPublico" type="checkbox" /> Ativar agendamento público</label>
          <label class="campo-grande">Observação interna <textarea v-model="aprovacao.observacaoInterna" rows="3"></textarea></label>
        </div>
        <button class="botao principal" :disabled="processando">{{ processando ? 'Aprovando...' : 'Aprovar e criar empresa' }}</button>

        <section v-if="resultadoAprovacao" class="alerta-acesso">
          <strong>Copie a senha temporária agora. Ela poderá não ser exibida novamente.</strong>
          <p>Empresa criada: {{ obterCampo(resultadoAprovacao, 'empresaNome') || aprovacao.nomeEmpresa }}</p>
          <p>Admin: {{ obterCampo(resultadoAprovacao, 'adminEmail', 'usuarioAdminEmail') || aprovacao.adminEmail }}</p>
          <p>Senha temporária: {{ obterCampo(resultadoAprovacao, 'senhaTemporaria', 'senhaInicialAdmin') || aprovacao.senhaTemporaria || '-' }}</p>
          <button type="button" class="botao sucesso-botao" @click="copiarDadosAcesso">Copiar dados de acesso</button>
        </section>
      </form>
    </section>

    <section v-if="rejeitando" class="modal-fundo" @click.self="rejeitando = null">
      <form class="card modal pequeno" @submit.prevent="rejeitar">
        <div class="cabecalho-card">
          <div><h2>Rejeitar solicitação</h2><p>{{ nomeEmpresa(rejeitando) }}</p></div>
          <button type="button" class="botao secundario" @click="rejeitando = null">Fechar</button>
        </div>
        <label>Motivo da rejeição <textarea v-model="rejeicao.motivo" rows="3"></textarea></label>
        <label>Observação interna, opcional <textarea v-model="rejeicao.observacaoInterna" rows="3"></textarea></label>
        <button class="botao perigo" :disabled="processando">{{ processando ? 'Rejeitando...' : 'Confirmar rejeição' }}</button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.pagina,.filtros,.painel,.modal{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.cabecalho-card,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:22px}.descricao,.cabecalho-card p{margin-top:6px;color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.grade-resumo{display:grid;grid-template-columns:repeat(5,minmax(130px,1fr));gap:14px}.indicador{display:grid;gap:8px}.indicador span{color:#64748b;font-size:14px;font-weight:800}.indicador strong{font-size:24px}.campos,.detalhes-grid{display:grid;grid-template-columns:repeat(3,minmax(190px,1fr));gap:16px}.campo-grande{grid-column:1/-1}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit;box-sizing:border-box;background:white}.checkbox{display:flex;align-items:center}.checkbox input{width:auto}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800}.botao:disabled{cursor:not-allowed;opacity:.55}.compacto{padding:8px 10px;font-size:12px}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.sucesso-botao{background:#15803d}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.tabela-card{padding:0;overflow:hidden}.tabela-container{overflow-x:auto}table{width:100%;min-width:1160px;border-collapse:collapse}th,td{padding:14px 16px;border-bottom:1px solid #e5e7eb;text-align:left;vertical-align:top;color:#374151}th{background:#f8fafc;color:#111827;font-size:12px;font-weight:800;text-transform:uppercase}.acoes-tabela{display:flex;flex-direction:column;align-items:flex-start;gap:8px}.status{display:inline-flex;padding:7px 11px;border-radius:999px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.status.pendente{background:#dbeafe;color:#1d4ed8}.status.aprovada{background:#dcfce7;color:#15803d}.status.rejeitada{background:#fee2e2;color:#b91c1c}.status.cancelada{background:#e5e7eb;color:#4b5563}.modal-fundo{position:fixed;inset:0;z-index:30;display:grid;place-items:center;padding:24px;background:rgba(15,23,42,.45)}.modal{width:min(100%,920px);max-height:88vh;overflow:auto}.pequeno{width:min(100%,620px)}.alerta-acesso{display:grid;gap:8px;border:1px solid #fde68a;background:#fffbeb;color:#92400e;border-radius:8px;padding:16px}@media(max-width:1000px){.grade-resumo{grid-template-columns:repeat(2,minmax(150px,1fr))}.campos,.detalhes-grid{grid-template-columns:1fr}.cabecalho-pagina,.cabecalho-card,.acoes{align-items:flex-start;flex-direction:column}}
</style>
