<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  buscarDashboardSaasResumo,
  buscarOpcoesDashboardSaas,
  buscarVisaoEmpresaDashboardSaas,
  obterMensagemAmigavelErro,
} from '@/services/api'

const router = useRouter()
const dados = ref(criarDashboardPadrao())
const opcoesEmpresas = ref([])
const empresaSelecionadaId = ref('')
const visaoEmpresa = ref(criarVisaoEmpresaPadrao())
const dadosCarregados = ref(false)
const carregando = ref(true)
const atualizando = ref(false)
const carregandoEmpresa = ref(false)
const erro = ref('')
const sucesso = ref('')
const erroEmpresa = ref('')

const cardsVisaoGeral = computed(() => [
  criarCard('Total de empresas', obterNumeroProfundo(dados.value, ['empresas', 'total'], ['resumo', 'empresasTotal'], ['totalEmpresas'])),
  criarCard('Empresas ativas', obterNumeroProfundo(dados.value, ['empresas', 'ativas'], ['resumo', 'empresasAtivas'], ['empresasAtivas'])),
  criarCard('Pendentes de aprovacao', obterNumeroProfundo(dados.value, ['empresas', 'pendentesAprovacao'], ['empresas', 'pendentes'], ['totalPendentesAprovacao'])),
  criarCard('Usuarios', obterNumeroProfundo(dados.value, ['usuarios', 'total'], ['resumo', 'usuariosTotal'], ['totalUsuarios'])),
  criarCard('Clientes', obterNumeroProfundo(dados.value, ['clientes', 'total'], ['resumo', 'clientesTotal'], ['totalClientes'])),
  criarCard('Servicos', obterNumeroProfundo(dados.value, ['servicos', 'total'], ['resumo', 'servicosTotal'], ['totalServicos'])),
  criarCard('Funcionarios', obterNumeroProfundo(dados.value, ['funcionarios', 'total'], ['resumo', 'funcionariosTotal'], ['totalFuncionarios'])),
  criarCard('Agendamentos hoje', obterNumeroProfundo(dados.value, ['agendamentos', 'hoje'], ['agenda', 'hoje'], ['agendamentosHoje'])),
  criarCard('Agendamentos da semana', obterNumeroProfundo(dados.value, ['agendamentos', 'semana'], ['agenda', 'semana'], ['agendamentosSemana'])),
  criarCard('Agendamentos do mes', obterNumeroProfundo(dados.value, ['agendamentos', 'mes'], ['agenda', 'mes'], ['agendamentosMes'])),
  criarCard('Receita prevista do mes', obterNumeroProfundo(dados.value, ['faturamento', 'receitaPrevistaMes'], ['financeiro', 'receitaPrevistaMes'], ['receitaPrevistaMes']), true),
  criarCard('Receita concluida do mes', obterNumeroProfundo(dados.value, ['faturamento', 'receitaConcluidaMes'], ['financeiro', 'receitaConcluidaMes'], ['valorPagoMes']), true),
  criarCard('Faturas pendentes', obterNumeroProfundo(dados.value, ['faturamento', 'pendentes'], ['financeiro', 'faturasPendentes'], ['faturasPendentes'])),
  criarCard('Faturas vencidas', obterNumeroProfundo(dados.value, ['faturamento', 'vencidas'], ['financeiro', 'faturasVencidas'], ['faturasVencidas'])),
])

const alertas = computed(() => normalizarLista(primeiroValor(dados.value.alertas, dados.value.alertasPlataforma, dados.value.alertasAdministrativos)))
const eventosRecentes = computed(() => normalizarLista(primeiroValor(dados.value.ultimosEventos, dados.value.eventosRecentes, dados.value.ultimasAuditorias, dados.value.auditoriaRecente)))
const empresasMaisMovimento = computed(() => normalizarLista(primeiroValor(dados.value.empresasMaisMovimento, dados.value.topEmpresas, dados.value.empresasDestaque)))
const proximosAgendamentosEmpresa = computed(() => normalizarLista(primeiroValor(visaoEmpresa.value.proximosAgendamentos, visaoEmpresa.value.agendamentosProximos)))
const agendamentosPublicosRecentes = computed(() => normalizarLista(primeiroValor(visaoEmpresa.value.agendamentosPublicosRecentes, visaoEmpresa.value.publicosRecentes)))
const notificacoesRecentesEmpresa = computed(() => normalizarLista(primeiroValor(visaoEmpresa.value.notificacoesRecentes, visaoEmpresa.value.notificacoes)))
const atividadesRecentesEmpresa = computed(() => normalizarLista(primeiroValor(visaoEmpresa.value.ultimasAtividades, visaoEmpresa.value.ultimasAuditorias, visaoEmpresa.value.auditoriaRecente)))
const produtosBaixoEstoqueEmpresa = computed(() => normalizarLista(primeiroValor(visaoEmpresa.value.produtosBaixoEstoque, visaoEmpresa.value.baixoEstoque, visaoEmpresa.value.estoque?.baixoEstoque)))

const cardsEmpresaSelecionada = computed(() => {
  const origem = visaoEmpresa.value
  return [
    criarCard('Clientes', obterNumeroProfundo(origem, ['clientes', 'total'], ['resumo', 'clientes'], ['totalClientes'])),
    criarCard('Servicos', obterNumeroProfundo(origem, ['servicos', 'total'], ['resumo', 'servicos'], ['totalServicos'])),
    criarCard('Funcionarios', obterNumeroProfundo(origem, ['funcionarios', 'total'], ['resumo', 'funcionarios'], ['totalFuncionarios'])),
    criarCard('Agendamentos hoje', obterNumeroProfundo(origem, ['agendamentos', 'hoje'], ['agenda', 'hoje'], ['agendamentosHoje'])),
    criarCard('Agendamentos semana', obterNumeroProfundo(origem, ['agendamentos', 'semana'], ['agenda', 'semana'], ['agendamentosSemana'])),
    criarCard('Agendamentos mes', obterNumeroProfundo(origem, ['agendamentos', 'mes'], ['agenda', 'mes'], ['agendamentosMes'])),
    criarCard('Receita prevista', obterNumeroProfundo(origem, ['financeiro', 'receitaPrevistaMes'], ['faturamento', 'receitaPrevistaMes'], ['receitaPrevistaMes']), true),
    criarCard('Receita concluida', obterNumeroProfundo(origem, ['financeiro', 'receitaConcluidaMes'], ['faturamento', 'receitaConcluidaMes'], ['receitaConcluidaMes']), true),
  ]
})

async function carregarDashboard(mostrarSucesso = false) {
  try {
    carregando.value = !dadosCarregados.value
    atualizando.value = true
    erro.value = ''
    sucesso.value = ''

    const [resumoApi, opcoesApi] = await Promise.all([
      buscarDashboardSaasResumo(),
      buscarOpcoesDashboardSaas().catch(() => []),
    ])

    dados.value = normalizarDashboard(resumoApi)
    opcoesEmpresas.value = normalizarLista(opcoesApi).sort((a, b) => nomeEmpresa(a).localeCompare(nomeEmpresa(b), 'pt-BR'))
    dadosCarregados.value = true

    if (empresaSelecionadaId.value && !opcoesEmpresas.value.some((empresa) => String(empresa.id) === String(empresaSelecionadaId.value))) {
      empresaSelecionadaId.value = ''
    }

    if (mostrarSucesso) {
      sucesso.value = 'Dashboard NuvemMais atualizado com sucesso.'
    }
  } catch (errorAtual) {
    if (obterStatusErro(errorAtual) === 403) {
      router.push('/dashboard')
      return
    }

    erro.value = obterMensagemAmigavelErro(errorAtual, 'Nao foi possivel carregar o Dashboard NuvemMais no momento.')
  } finally {
    carregando.value = false
    atualizando.value = false
  }
}

async function carregarVisaoEmpresa() {
  if (!empresaSelecionadaId.value) {
    visaoEmpresa.value = criarVisaoEmpresaPadrao()
    erroEmpresa.value = ''
    return
  }

  try {
    carregandoEmpresa.value = true
    erroEmpresa.value = ''
    visaoEmpresa.value = normalizarVisaoEmpresa(await buscarVisaoEmpresaDashboardSaas(empresaSelecionadaId.value))
  } catch (errorAtual) {
    visaoEmpresa.value = criarVisaoEmpresaPadrao()
    erroEmpresa.value = obterMensagemAmigavelErro(errorAtual, 'Nao foi possivel carregar os dados da empresa selecionada.')
  } finally {
    carregandoEmpresa.value = false
  }
}

function criarCard(rotulo, valor, dinheiro = false) {
  return {
    rotulo,
    valor: dinheiro ? formatarMoeda(valor) : formatarNumero(valor),
  }
}

function criarDashboardPadrao() {
  return {
    empresas: {},
    usuarios: {},
    clientes: {},
    servicos: {},
    funcionarios: {},
    agendamentos: {},
    faturamento: {},
    financeiro: {},
    alertas: [],
    ultimosEventos: [],
    empresasMaisMovimento: [],
  }
}

function criarVisaoEmpresaPadrao() {
  return {
    empresa: {},
    plano: {},
    assinatura: {},
    financeiro: {},
    clientes: {},
    servicos: {},
    funcionarios: {},
    agendamentos: {},
    proximosAgendamentos: [],
    agendamentosPublicosRecentes: [],
    notificacoesRecentes: [],
    ultimasAtividades: [],
    produtosBaixoEstoque: [],
    estoque: {},
  }
}

function normalizarDashboard(valor) {
  const origem = normalizarObjeto(valor)
  return {
    ...criarDashboardPadrao(),
    ...origem,
  }
}

function normalizarVisaoEmpresa(valor) {
  const origem = normalizarObjeto(valor)
  return {
    ...criarVisaoEmpresaPadrao(),
    ...origem,
  }
}

function normalizarObjeto(valor) {
  if (!valor || typeof valor !== 'object') return {}
  if (valor.data && !Array.isArray(valor.data)) return valor.data
  return valor
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []
  return valor.content || valor.items || valor.itens || valor.data?.content || valor.data?.items || valor.data || valor.resultado || valor.value || []
}

function primeiroValor(...valores) {
  return valores.find((valor) => valor !== null && valor !== undefined && valor !== '')
}

function obterProfundo(objeto, caminho = []) {
  return caminho.reduce((atual, chave) => atual?.[chave], objeto)
}

function obterNumeroProfundo(objeto, ...caminhos) {
  for (const caminho of caminhos) {
    const numero = Number(obterProfundo(objeto, caminho))
    if (Number.isFinite(numero)) return numero
  }
  return 0
}

function obterTextoProfundo(objeto, ...caminhos) {
  for (const caminho of caminhos) {
    const valor = obterProfundo(objeto, caminho)
    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return String(valor)
    }
  }
  return '-'
}

function nomeEmpresa(item) {
  return obterTextoProfundo(item, ['nome'], ['empresaNome'], ['razaoSocial'])
}

function tituloLista(item) {
  if (typeof item === 'string') return item
  return obterTextoProfundo(item, ['titulo'], ['nome'], ['empresaNome'], ['descricao'], ['mensagem'])
}

function detalheEvento(item) {
  if (typeof item === 'string') return ''
  return [
    obterTextoProfundo(item, ['modulo'], ['tipo'], ['acao']),
    obterTextoProfundo(item, ['usuarioNome'], ['usuario'], ['responsavelNome']),
    formatarDataHora(primeiroValor(item?.dataHora, item?.criadoEm, item?.dataEvento)),
  ].filter((valor) => valor && valor !== '-').join(' · ')
}

function detalheMovimentoEmpresa(item) {
  if (typeof item === 'string') return ''
  return [
    obterTextoProfundo(item, ['cidade'], ['planoNome'], ['status']),
    formatarNumero(primeiroValor(item?.agendamentosMes, item?.movimentoMes, item?.totalAgendamentos)),
  ].filter((valor) => valor && valor !== '0').join(' · ')
}

function severidadeAlerta(item) {
  const valor = obterTextoProfundo(item, ['severidade'], ['prioridade'], ['nivel'])
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (valor.includes('alta') || valor.includes('crit')) return 'alta'
  if (valor.includes('media')) return 'media'
  return 'baixa'
}

function descricaoEmpresaSelecionada() {
  const empresa = primeiroValor(visaoEmpresa.value.empresa, visaoEmpresa.value)
  return [
    obterTextoProfundo(empresa, ['nome'], ['razaoSocial']),
    obterTextoProfundo(empresa, ['cidade']),
    obterTextoProfundo(empresa, ['status'], ['situacao']),
  ].filter((valor) => valor && valor !== '-').join(' · ')
}

function resumoFinanceiroEmpresa() {
  return [
    `Receita prevista: ${formatarMoeda(obterNumeroProfundo(visaoEmpresa.value, ['financeiro', 'receitaPrevistaMes'], ['faturamento', 'receitaPrevistaMes']))}`,
    `Receita concluida: ${formatarMoeda(obterNumeroProfundo(visaoEmpresa.value, ['financeiro', 'receitaConcluidaMes'], ['faturamento', 'receitaConcluidaMes']))}`,
    `Faturas pendentes: ${formatarNumero(obterNumeroProfundo(visaoEmpresa.value, ['financeiro', 'faturasPendentes'], ['faturamento', 'pendentes']))}`,
  ].join(' · ')
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

function formatarDataHora(valor) {
  if (!valor || valor === '-') return '-'
  const data = new Date(valor)
  if (Number.isNaN(data.getTime())) return String(valor)
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function obterStatusErro(errorAtual) {
  return Number(errorAtual?.status || errorAtual?.response?.status || 0)
}

watch(empresaSelecionadaId, () => {
  carregarVisaoEmpresa()
})

onMounted(() => {
  carregarDashboard()
})
</script>

<template>
  <main class="pagina admin-dashboard-view">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administracao NuvemMais</p>
        <h1>Dashboard NuvemMais</h1>
        <p class="descricao">Acompanhe a saude geral da plataforma e visualize as operacoes das empresas sem trocar de login.</p>
      </div>

      <button class="botao secundario" :disabled="atualizando" @click="carregarDashboard(true)">
        {{ atualizando ? 'Atualizando...' : 'Atualizar dados' }}
      </button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>
    <section v-if="carregando" class="card estado">Carregando Dashboard NuvemMais...</section>

    <template v-else>
      <section class="cards-grid">
        <article v-for="card in cardsVisaoGeral" :key="card.rotulo" class="card metrica-card">
          <span>{{ card.rotulo }}</span>
          <strong>{{ card.valor }}</strong>
        </article>
      </section>

      <section class="painel-selecao card">
        <div>
          <p class="subtitulo">Ver empresa</p>
          <h2>Acompanhamento operacional</h2>
          <p class="descricao">Selecione uma empresa para visualizar os principais dados dela como SUPER_ADMIN.</p>
        </div>

        <label class="campo-selecao">
          <span>Empresa</span>
          <select v-model="empresaSelecionadaId">
            <option value="">Selecione uma empresa</option>
            <option v-for="empresa in opcoesEmpresas" :key="empresa.id" :value="empresa.id">{{ nomeEmpresa(empresa) }}</option>
          </select>
        </label>
      </section>

      <section class="listas-grid">
        <article class="card bloco-lista">
          <h2>Alertas importantes</h2>
          <p v-if="!alertas.length" class="estado-inline">Nao ha alertas importantes no momento.</p>
          <div v-else class="lista-simples">
            <article v-for="(item, indice) in alertas" :key="item.id || indice" class="linha-alerta">
              <span :class="['badge', severidadeAlerta(item)]">{{ obterTextoProfundo(item, ['severidade'], ['prioridade'], ['nivel']) }}</span>
              <div>
                <strong>{{ tituloLista(item) }}</strong>
                <p>{{ obterTextoProfundo(item, ['mensagem'], ['descricao'], ['texto']) }}</p>
              </div>
            </article>
          </div>
        </article>

        <article class="card bloco-lista">
          <h2>Ultimos eventos e auditorias</h2>
          <p v-if="!eventosRecentes.length" class="estado-inline">Nenhum evento recente encontrado.</p>
          <ul v-else>
            <li v-for="(item, indice) in eventosRecentes" :key="item.id || indice">
              <span>{{ tituloLista(item) }}</span>
              <strong>{{ detalheEvento(item) || '-' }}</strong>
            </li>
          </ul>
        </article>

        <article class="card bloco-lista">
          <h2>Empresas com mais movimento</h2>
          <p v-if="!empresasMaisMovimento.length" class="estado-inline">Ainda nao ha destaque de movimento para exibir.</p>
          <ul v-else>
            <li v-for="(item, indice) in empresasMaisMovimento" :key="item.id || indice">
              <span>{{ tituloLista(item) }}</span>
              <strong>{{ detalheMovimentoEmpresa(item) || '-' }}</strong>
            </li>
          </ul>
        </article>
      </section>

      <section class="card painel-empresa">
        <div class="cabecalho-empresa">
          <div>
            <p class="subtitulo">Visualizacao administrativa</p>
            <h2>{{ empresaSelecionadaId ? nomeEmpresa(opcoesEmpresas.find((item) => String(item.id) === String(empresaSelecionadaId)) || {}) : 'Selecione uma empresa' }}</h2>
            <p class="descricao">Voce esta visualizando dados da empresa selecionada como SUPER_ADMIN.</p>
          </div>
        </div>

        <section v-if="!empresaSelecionadaId" class="estado-inline">
          Escolha uma empresa acima para abrir o painel de acompanhamento operacional.
        </section>

        <section v-else-if="carregandoEmpresa" class="estado-inline">
          Carregando dados da empresa selecionada...
        </section>

        <section v-else-if="erroEmpresa" class="feedback erro card-interno">
          {{ erroEmpresa }}
        </section>

        <template v-else>
          <div class="grade-informacoes">
            <article class="mini-card">
              <span>Dados basicos</span>
              <strong>{{ descricaoEmpresaSelecionada() || '-' }}</strong>
            </article>
            <article class="mini-card">
              <span>Plano / assinatura</span>
              <strong>{{ obterTextoProfundo(visaoEmpresa.value, ['plano', 'nome'], ['assinatura', 'planoNome'], ['planoNome']) }}</strong>
            </article>
            <article class="mini-card">
              <span>Situacao financeira</span>
              <strong>{{ resumoFinanceiroEmpresa() }}</strong>
            </article>
          </div>

          <section class="cards-grid empresa-cards">
            <article v-for="card in cardsEmpresaSelecionada" :key="card.rotulo" class="card metrica-card interna">
              <span>{{ card.rotulo }}</span>
              <strong>{{ card.valor }}</strong>
            </article>
          </section>

          <section class="listas-grid empresa-listas">
            <article class="card bloco-lista">
              <h3>Proximos agendamentos</h3>
              <p v-if="!proximosAgendamentosEmpresa.length" class="estado-inline">Nenhum agendamento proximo encontrado.</p>
              <ul v-else>
                <li v-for="(item, indice) in proximosAgendamentosEmpresa" :key="item.id || indice">
                  <span>{{ tituloLista(item) }}</span>
                  <strong>{{ detalheEvento(item) || formatarDataHora(primeiroValor(item?.dataHora, item?.inicio, item?.data)) }}</strong>
                </li>
              </ul>
            </article>

            <article class="card bloco-lista">
              <h3>Agendamentos publicos recentes</h3>
              <p v-if="!agendamentosPublicosRecentes.length" class="estado-inline">Nenhum agendamento publico recente.</p>
              <ul v-else>
                <li v-for="(item, indice) in agendamentosPublicosRecentes" :key="item.id || indice">
                  <span>{{ tituloLista(item) }}</span>
                  <strong>{{ detalheEvento(item) || formatarDataHora(primeiroValor(item?.dataHora, item?.inicio, item?.data)) }}</strong>
                </li>
              </ul>
            </article>

            <article class="card bloco-lista">
              <h3>Notificacoes recentes</h3>
              <p v-if="!notificacoesRecentesEmpresa.length" class="estado-inline">Nenhuma notificacao recente.</p>
              <ul v-else>
                <li v-for="(item, indice) in notificacoesRecentesEmpresa" :key="item.id || indice">
                  <span>{{ tituloLista(item) }}</span>
                  <strong>{{ detalheEvento(item) || formatarDataHora(primeiroValor(item?.dataHora, item?.criadoEm)) }}</strong>
                </li>
              </ul>
            </article>

            <article class="card bloco-lista">
              <h3>Ultimas atividades</h3>
              <p v-if="!atividadesRecentesEmpresa.length" class="estado-inline">Nenhuma atividade recente encontrada.</p>
              <ul v-else>
                <li v-for="(item, indice) in atividadesRecentesEmpresa" :key="item.id || indice">
                  <span>{{ tituloLista(item) }}</span>
                  <strong>{{ detalheEvento(item) || '-' }}</strong>
                </li>
              </ul>
            </article>

            <article class="card bloco-lista">
              <h3>Produtos com baixo estoque</h3>
              <p v-if="!produtosBaixoEstoqueEmpresa.length" class="estado-inline">Nenhum alerta de estoque para esta empresa.</p>
              <ul v-else>
                <li v-for="(item, indice) in produtosBaixoEstoqueEmpresa" :key="item.id || indice">
                  <span>{{ tituloLista(item) }}</span>
                  <strong>{{ obterTextoProfundo(item, ['categoria'], ['codigoSku'], ['sku']) }}</strong>
                </li>
              </ul>
            </article>
          </section>
        </template>
      </section>
    </template>
  </main>
</template>

<style scoped>
.admin-dashboard-view,.painel-empresa{display:grid;gap:20px;color:#111827}.cabecalho-pagina,.painel-selecao,.cabecalho-empresa{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase;letter-spacing:.04em}h1,h2,h3,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:24px;font-weight:800}h3{font-size:20px;font-weight:800}.descricao,.estado-inline,.linha-alerta p{color:#64748b}.card,.card-interno{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.cards-grid{display:grid;grid-template-columns:repeat(4,minmax(170px,1fr));gap:16px}.metrica-card{display:grid;gap:10px}.metrica-card span{color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.metrica-card strong{font-size:24px;font-weight:800}.painel-selecao{align-items:end}.campo-selecao{display:grid;gap:8px;color:#334155;font-weight:800;min-width:min(100%,320px)}select{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit;background:white}.listas-grid{display:grid;grid-template-columns:repeat(3,minmax(240px,1fr));gap:18px}.bloco-lista{display:grid;gap:14px}.lista-simples{display:grid;gap:12px}.linha-alerta{display:grid;grid-template-columns:auto 1fr;gap:12px;padding:12px;border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc}.badge{display:inline-flex;align-items:center;justify-content:center;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.badge.alta{background:#fee2e2;color:#b91c1c}.badge.media{background:#fef3c7;color:#92400e}.badge.baixa{background:#dbeafe;color:#1d4ed8}ul{display:grid;gap:10px;margin:0;padding:0;list-style:none}li{display:grid;gap:4px;border-bottom:1px solid #e5e7eb;padding-bottom:10px}li:last-child{border-bottom:none;padding-bottom:0}li span{color:#334155;font-weight:800}li strong{color:#475569;font-size:13px}.grade-informacoes{display:grid;grid-template-columns:repeat(3,minmax(220px,1fr));gap:16px}.mini-card{border:1px solid #e5e7eb;border-radius:8px;background:#f8fafc;padding:16px;display:grid;gap:8px}.mini-card span{color:#64748b;font-size:13px;font-weight:800;text-transform:uppercase}.mini-card strong{font-size:16px;font-weight:800;color:#111827}.empresa-cards .interna{box-shadow:none}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800}.botao:disabled{opacity:.6;cursor:not-allowed}.secundario{background:#0f172a}@media(max-width:1200px){.cards-grid,.listas-grid,.grade-informacoes{grid-template-columns:repeat(2,minmax(220px,1fr))}}@media(max-width:900px){.cabecalho-pagina,.painel-selecao,.cabecalho-empresa{align-items:flex-start;flex-direction:column}.cards-grid,.listas-grid,.grade-informacoes{grid-template-columns:1fr}} 
</style>
