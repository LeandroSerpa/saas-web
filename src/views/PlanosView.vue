<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  ativarPlano,
  atualizarPlano,
  buscarPlanos,
  criarPlano,
  desativarPlano,
} from '@/services/api'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const tiposPlano = [
  { valor: 'COMERCIAL', rotulo: 'Comercial' },
  { valor: 'PARCERIA', rotulo: 'Parceria / Permuta' },
  { valor: 'INTERNO', rotulo: 'Interno / Cortesia' },
]
const planos = ref([])
const carregando = ref(true)
const salvando = ref(false)
const atualizandoId = ref(null)
const erro = ref('')
const mensagemSucesso = ref('')
const planoEditandoId = ref(null)
const plano = ref(criarPlanoInicial())
const paginacao = ref(criarPaginacaoInicial())
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(() => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages)

const planosOrdenados = computed(() =>
  [...planos.value].sort((planoA, planoB) =>
    String(planoA.nome || '').localeCompare(String(planoB.nome || ''), 'pt-BR'),
  ),
)

function criarPlanoInicial() {
  return {
    nome: '',
    descricao: '',
    tipoPlano: 'COMERCIAL',
    precoMensal: '',
    ativo: true,
    visivelParaEmpresa: true,
    exibirNoCadastroPublico: true,
    observacaoInterna: '',
    limiteUsuarios: '',
    limiteClientes: '',
    limiteFuncionarios: '',
    limiteServicos: '',
    limiteAgendamentosMes: '',
    permitePersonalizacao: false,
    permiteRelatorios: false,
    permiteAgendamentoPublico: false,
    permiteSuportePrioritario: false,
  }
}

async function carregarPlanos() {
  try {
    carregando.value = true
    erro.value = ''
    const resposta = await buscarPlanos({
      page: paginacao.value.page,
      size: paginacao.value.size,
    })
    const dadosPaginados = normalizarRespostaPaginada(resposta, paginacao.value)

    planos.value = dadosPaginados.content
    paginacao.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }

    if (
      dadosPaginados.paginada &&
      dadosPaginados.page > 0 &&
      dadosPaginados.content.length === 0 &&
      dadosPaginados.totalElements > 0
    ) {
      const ultimaPaginaValida = Math.max(dadosPaginados.totalPages - 1, 0)

      if (ultimaPaginaValida !== dadosPaginados.page) {
        paginacao.value.page = ultimaPaginaValida
        await carregarPlanos()
      }
    }
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os planos.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarPlano() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!plano.value.nome.trim()) {
      erro.value = 'Informe o nome do plano.'
      return
    }

    salvando.value = true
    const dados = montarPayloadPlano()

    if (planoEditandoId.value) {
      await atualizarPlano(planoEditandoId.value, dados)
      mensagemSucesso.value = 'Plano atualizado com sucesso.'
    } else {
      await criarPlano(dados)
      mensagemSucesso.value = 'Plano criado com sucesso.'
    }

    cancelarEdicao(false)
    await carregarPlanos()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar o plano.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function alternarAtivo(planoItem) {
  try {
    erro.value = ''
    mensagemSucesso.value = ''
    atualizandoId.value = planoItem.id

    if (estaAtivo(planoItem)) {
      await desativarPlano(planoItem.id)
      mensagemSucesso.value = 'Plano desativado com sucesso.'
    } else {
      await ativarPlano(planoItem.id)
      mensagemSucesso.value = 'Plano ativado com sucesso.'
    }

    await carregarPlanos()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar o status do plano.')
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function editarPlano(planoItem) {
  erro.value = ''
  mensagemSucesso.value = ''
  planoEditandoId.value = planoItem.id
  plano.value = {
    nome: planoItem.nome || '',
    descricao: planoItem.descricao || '',
    tipoPlano: normalizarTipoPlano(planoItem.tipoPlano),
    precoMensal: planoItem.precoMensal ?? planoItem.preco ?? '',
    ativo: estaAtivo(planoItem),
    visivelParaEmpresa: planoItem.visivelParaEmpresa ?? true,
    exibirNoCadastroPublico: planoItem.exibirNoCadastroPublico ?? false,
    observacaoInterna: planoItem.observacaoInterna || '',
    limiteUsuarios: obterLimite(planoItem, 'limiteUsuarios'),
    limiteClientes: obterLimite(planoItem, 'limiteClientes'),
    limiteFuncionarios: obterLimite(planoItem, 'limiteFuncionarios'),
    limiteServicos: obterLimite(planoItem, 'limiteServicos'),
    limiteAgendamentosMes: obterLimite(planoItem, 'limiteAgendamentosMes', 'limiteAgendamentos'),
    permitePersonalizacao: Boolean(planoItem.permitePersonalizacao),
    permiteRelatorios: Boolean(planoItem.permiteRelatorios),
    permiteAgendamentoPublico: Boolean(planoItem.permiteAgendamentoPublico),
    permiteSuportePrioritario: Boolean(planoItem.permiteSuportePrioritario),
  }
}

function cancelarEdicao(limparMensagens = true) {
  planoEditandoId.value = null
  plano.value = criarPlanoInicial()

  if (limparMensagens) {
    mensagemSucesso.value = ''
  }
}

function montarPayloadPlano() {
  return {
    nome: plano.value.nome,
    descricao: plano.value.descricao,
    tipoPlano: normalizarTipoPlano(plano.value.tipoPlano),
    precoMensal: numeroOuZero(plano.value.precoMensal),
    ativo: Boolean(plano.value.ativo),
    visivelParaEmpresa: plano.value.visivelParaEmpresa !== false,
    exibirNoCadastroPublico: Boolean(plano.value.exibirNoCadastroPublico),
    observacaoInterna: plano.value.observacaoInterna,
    limiteUsuarios: limiteOuNulo(plano.value.limiteUsuarios),
    limiteClientes: limiteOuNulo(plano.value.limiteClientes),
    limiteFuncionarios: limiteOuNulo(plano.value.limiteFuncionarios),
    limiteServicos: limiteOuNulo(plano.value.limiteServicos),
    limiteAgendamentosMes: limiteOuNulo(plano.value.limiteAgendamentosMes),
    permitePersonalizacao: Boolean(plano.value.permitePersonalizacao),
    permiteRelatorios: Boolean(plano.value.permiteRelatorios),
    permiteAgendamentoPublico: Boolean(plano.value.permiteAgendamentoPublico),
    permiteSuportePrioritario: Boolean(plano.value.permiteSuportePrioritario),
  }
}

function limiteOuNulo(valor) {
  return valor === '' || valor === null || valor === undefined ? null : Number(valor)
}

function numeroOuZero(valor) {
  return valor === '' || valor === null || valor === undefined ? 0 : Number(valor)
}

function obterLimite(objeto, campo, alternativo = '') {
  const valor = objeto?.[campo] ?? objeto?.[alternativo]

  return valor === null || valor === undefined ? '' : valor
}

function estaAtivo(planoItem) {
  return planoItem.ativo !== false
}

function normalizarTipoPlano(tipoPlano) {
  return ['COMERCIAL', 'PARCERIA', 'INTERNO'].includes(tipoPlano) ? tipoPlano : 'COMERCIAL'
}

function rotuloTipoPlano(tipoPlano) {
  return tiposPlano.find((tipo) => tipo.valor === normalizarTipoPlano(tipoPlano))?.rotulo || 'Comercial'
}

function planoVisivelParaEmpresa(planoItem) {
  return planoItem.visivelParaEmpresa !== false
}

function planoExibidoNoCadastroPublico(planoItem) {
  return planoItem.exibirNoCadastroPublico === true
}

function formatarPreco(preco) {
  return Number(preco || 0).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function exibirLimite(valor) {
  return valor === null || valor === undefined || valor === '' ? 'Ilimitado' : valor
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  paginacao.value.page = Math.max(paginacao.value.page - 1, 0)
  await carregarPlanos()
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  paginacao.value.page += 1
  await carregarPlanos()
}

async function alterarTamanhoPagina() {
  paginacao.value.page = 0
  await carregarPlanos()
}

onMounted(() => {
  carregarPlanos()
})

watch(
  () => plano.value.tipoPlano,
  (tipoPlano) => {
    if (!planoEditandoId.value) {
      plano.value.exibirNoCadastroPublico = normalizarTipoPlano(tipoPlano) === 'COMERCIAL'
    }
  },
)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">ADMINISTRAÇÃO NUVEMMAIS</p>
        <h1>Planos</h1>
        <p class="descricao">Gerencie planos comerciais, parcerias, cortesias e limites de uso das empresas.</p>
      </div>

      <button class="botao secundario" @click="carregarPlanos">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
      <small>Fale com o administrador para alterar seu plano.</small>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <form class="card formulario" @submit.prevent="salvarPlano">
      <div class="titulo-card">
        <h2>{{ planoEditandoId ? 'Editar plano' : 'Novo plano' }}</h2>
        <p>Limites vazios serão tratados como ilimitados.</p>
      </div>

      <div class="campos">
        <label>
          Nome *
          <input v-model="plano.nome" type="text" />
        </label>
        <label>
          Preço mensal
          <input v-model="plano.precoMensal" type="number" min="0" step="0.01" />
        </label>
        <label>
          Tipo do plano
          <select v-model="plano.tipoPlano">
            <option v-for="tipo in tiposPlano" :key="tipo.valor" :value="tipo.valor">
              {{ tipo.rotulo }}
            </option>
          </select>
          <small>Use Parceria para empresas que recebem o sistema por permuta, troca de serviços ou acordo especial.</small>
        </label>
        <label class="campo-grande">
          Descrição
          <textarea v-model="plano.descricao" rows="3"></textarea>
        </label>
        <label class="campo-grande">
          Observação interna
          <textarea
            v-model="plano.observacaoInterna"
            rows="3"
            placeholder="Ex: Permuta por banho e tosa mensal."
          ></textarea>
          <small>Visível apenas para o Administrador NuvemMais. Use para registrar detalhes comerciais, permutas ou acordos internos.</small>
        </label>
        <label>
          Limite de usuários
          <input v-model="plano.limiteUsuarios" type="number" min="0" placeholder="Ilimitado" />
        </label>
        <label>
          Limite de clientes
          <input v-model="plano.limiteClientes" type="number" min="0" placeholder="Ilimitado" />
        </label>
        <label>
          Limite de funcionários
          <input v-model="plano.limiteFuncionarios" type="number" min="0" placeholder="Ilimitado" />
        </label>
        <label>
          Limite de serviços
          <input v-model="plano.limiteServicos" type="number" min="0" placeholder="Ilimitado" />
        </label>
        <label>
          Limite de agendamentos/mês
          <input v-model="plano.limiteAgendamentosMes" type="number" min="0" placeholder="Ilimitado" />
        </label>
      </div>

      <div class="opcoes">
        <label class="campo-checkbox">
          <input v-model="plano.ativo" type="checkbox" />
          Ativo
        </label>
        <label class="campo-checkbox ajuda-checkbox">
          <input v-model="plano.visivelParaEmpresa" type="checkbox" />
          Visível para a empresa
          <small>Quando desmarcado, a empresa verá o nome Plano especial na tela Meu plano.</small>
        </label>
        <label class="campo-checkbox ajuda-checkbox">
          <input v-model="plano.exibirNoCadastroPublico" type="checkbox" />
          Exibir no cadastro público
          <small>Quando marcado, este plano aparece para empresas externas na página Comece agora.</small>
        </label>
        <label class="campo-checkbox">
          <input v-model="plano.permitePersonalizacao" type="checkbox" />
          Permite personalizacao
        </label>
        <label class="campo-checkbox">
          <input v-model="plano.permiteRelatorios" type="checkbox" />
          Permite relatorios
        </label>
        <label class="campo-checkbox">
          <input v-model="plano.permiteAgendamentoPublico" type="checkbox" />
          Permite agendamento público
        </label>
        <label class="campo-checkbox">
          <input v-model="plano.permiteSuportePrioritario" type="checkbox" />
          Permite suporte prioritário
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="salvando">
          {{ salvando ? 'Salvando...' : 'Salvar plano' }}
        </button>
        <button v-if="planoEditandoId" type="button" class="botao secundario" @click="cancelarEdicao">
          Cancelar edição
        </button>
      </div>
    </form>

    <section class="secao-lista">
      <div class="cabecalho-lista">
        <div>
          <h2>Planos cadastrados</h2>
          <p>Planos cadastrados na plataforma.</p>
        </div>

        <span class="contador">{{ paginacao.totalElements }} plano(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando planos...</p>
      </section>

      <section v-else-if="planosOrdenados.length === 0" class="card">
        <p>Nenhum plano encontrado.</p>
      </section>

      <section v-else class="lista">
        <article v-for="planoItem in planosOrdenados" :key="planoItem.id" class="card item-card">
          <div class="topo-card">
            <div>
              <h3>{{ planoItem.nome }}</h3>
              <p class="preco">{{ formatarPreco(planoItem.precoMensal ?? planoItem.preco) }}</p>
            </div>
            <span :class="['status', estaAtivo(planoItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(planoItem) ? 'Ativo' : 'Inativo' }}
            </span>
            <span :class="['tipo-plano', normalizarTipoPlano(planoItem.tipoPlano).toLowerCase()]">
              {{ rotuloTipoPlano(planoItem.tipoPlano) }}
            </span>
          </div>

          <p class="texto">{{ planoItem.descricao || '-' }}</p>
          <p v-if="planoItem.observacaoInterna" class="observacao-interna">
            <strong>Observação interna:</strong> {{ planoItem.observacaoInterna }}
          </p>

          <div class="limites">
            <span>Usuários: {{ exibirLimite(planoItem.limiteUsuarios) }}</span>
            <span>Clientes: {{ exibirLimite(planoItem.limiteClientes) }}</span>
            <span>Funcionários: {{ exibirLimite(planoItem.limiteFuncionarios) }}</span>
            <span>Serviços: {{ exibirLimite(planoItem.limiteServicos) }}</span>
            <span>Agendamentos/mês: {{ exibirLimite(planoItem.limiteAgendamentosMes ?? planoItem.limiteAgendamentos) }}</span>
          </div>

          <div class="permissoes">
            <span :class="{ ligado: planoItem.permitePersonalizacao }">Personalização</span>
            <span :class="{ ligado: planoItem.permiteRelatorios }">Relatórios</span>
            <span :class="{ ligado: planoItem.permiteAgendamentoPublico }">Agendamento público</span>
            <span :class="{ ligado: planoItem.permiteSuportePrioritario }">Suporte prioritário</span>
            <span :class="{ ligado: planoVisivelParaEmpresa(planoItem) }">
              Visível para empresa: {{ planoVisivelParaEmpresa(planoItem) ? 'Sim' : 'Não' }}
            </span>
            <span :class="{ ligado: planoExibidoNoCadastroPublico(planoItem) }">
              Cadastro público: {{ planoExibidoNoCadastroPublico(planoItem) ? 'Sim' : 'Não' }}
            </span>
          </div>

          <div class="acoes">
            <button class="botao neutro" @click="editarPlano(planoItem)">Editar</button>
            <button
              :class="['botao', estaAtivo(planoItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === planoItem.id"
              @click="alternarAtivo(planoItem)"
            >
              {{ estaAtivo(planoItem) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>
        </article>
      </section>

      <section v-if="!carregando" class="card paginacao">
        <p class="resumo-paginacao">
          {{ paginacao.totalElements }} registro(s) - Página {{ paginaAtualHumana }} de {{ paginacao.totalPages }}
        </p>

        <label class="tamanho-pagina">
          Registros por página
          <select v-model.number="paginacao.size" :disabled="carregando" @change="alterarTamanhoPagina">
            <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
              {{ opcao }}
            </option>
          </select>
        </label>

        <div class="botoes-paginacao">
          <button class="botao secundario" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
            Anterior
          </button>
          <button class="botao secundario" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
            Próxima
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.secao-lista,
.item-card {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card,
.acoes {
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
h2,
h3 {
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

h3 {
  font-size: 20px;
}

.descricao,
.cabecalho-lista p,
.titulo-card p,
.texto {
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

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  color: #111827;
  font: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #bfdbfe;
  border-color: #2563eb;
}

.opcoes,
.limites,
.permissoes {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.campo-checkbox.ajuda-checkbox {
  align-items: flex-start;
  flex-direction: column;
}

.campo-checkbox input {
  width: auto;
}

label small {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
  line-height: 1.4;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.contador,
.status,
.tipo-plano,
.limites span,
.permissoes span {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 800;
}

.contador,
.limites span {
  background: #dbeafe;
  color: #1d4ed8;
}

.status.ativo,
.permissoes .ligado {
  background: #dcfce7;
  color: #166534;
}

.status.inativo,
.permissoes span {
  background: #fee2e2;
  color: #991b1b;
}

.tipo-plano.comercial {
  background: #dbeafe;
  color: #1d4ed8;
}

.tipo-plano.parceria {
  background: #dcfce7;
  color: #166534;
}

.tipo-plano.interno {
  background: #ede9fe;
  color: #5b21b6;
}

.observacao-interna {
  margin: 0;
  border-left: 4px solid #2563eb;
  background: #f8fafc;
  border-radius: 8px;
  padding: 10px 12px;
  color: #334155;
}

.observacao-interna strong {
  font-weight: 800;
}

.preco {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.paginacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resumo-paginacao {
  margin: 0;
  color: #475569;
  font-weight: 700;
}

.tamanho-pagina {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-weight: 700;
}

.tamanho-pagina select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: white;
}

.botoes-paginacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.principal {
  background: #2563eb;
}

.secundario,
.neutro {
  background: #0f172a;
}

.perigo {
  background: #dc2626;
}

.sucesso {
  background: #16a34a;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.erro p,
.sucesso-card p {
  margin: 0;
  font-weight: 800;
}

.erro small {
  display: block;
  margin-top: 6px;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .topo-card,
  .acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .campos,
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
