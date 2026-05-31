<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import FuncionarioForm from '@/components/FuncionarioForm.vue'
import {
  EVENTO_EMPRESA_VISUALIZACAO,
  buscarFuncionarios,
  buscarStatusFinanceiroMinhaEmpresa,
  cadastrarFuncionario,
  modoVisualizacaoEmpresaAtivo,
  recalcularOnboarding,
  atualizarFuncionario,
  atualizarAtivoFuncionario,
  excluirFuncionario,
} from '@/services/api'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'

const funcionarios = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoFuncionario = ref('')
const mensagemSucessoStatus = ref('')
const atualizandoId = ref(null)
const funcionarioEditandoId = ref(null)
const statusFinanceiro = ref(null)
const modoVisualizacaoEmpresa = ref(modoVisualizacaoEmpresaAtivo())
const route = useRoute()
const router = useRouter()
const paginacao = ref(criarPaginacaoInicial())
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA
const filtros = ref({
  status: '',
  busca: '',
})

const funcionario = ref(criarFuncionarioInicial())
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(() => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages)

const funcionariosFiltrados = computed(() => {
  const termoBusca = normalizarTexto(filtros.value.busca)

  return funcionarios.value
    .filter((funcionarioItem) => {
      if (filtros.value.status === 'ativos' && !estaAtivo(funcionarioItem)) {
        return false
      }

      if (filtros.value.status === 'inativos' && estaAtivo(funcionarioItem)) {
        return false
      }

      if (termoBusca) {
        const nome = normalizarTexto(funcionarioItem.nome)
        const email = normalizarTexto(funcionarioItem.email)
        const telefone = normalizarTexto(funcionarioItem.telefone)
        const cargo = normalizarTexto(funcionarioItem.cargo)

        if (
          !nome.includes(termoBusca) &&
          !email.includes(termoBusca) &&
          !telefone.includes(termoBusca) &&
          !cargo.includes(termoBusca)
        ) {
          return false
        }
      }

      return true
    })
    .sort((funcionarioA, funcionarioB) =>
      String(funcionarioA.nome || '').localeCompare(String(funcionarioB.nome || ''), 'pt-BR'),
    )
})

function criarFuncionarioInicial() {
  return {
    empresaId: 1,
    nome: '',
    telefone: '',
    email: '',
    cargo: '',
    ativo: true,
    horaInicioAtendimento: '',
    horaFimAtendimento: '',
    atendeDominao: false,
    atendeSegunda: true,
    atendeTerca: true,
    atendeQuarta: true,
    atendeQuinta: true,
    atendeSexta: true,
    atendeSabado: true,
  }
}

async function carregarFuncionarios() {
  try {
    carregando.value = true
    erro.value = ''

    const resposta = await buscarFuncionarios({
      page: paginacao.value.page,
      size: paginacao.value.size,
    })
    const dadosPaginados = normalizarRespostaPaginada(resposta, paginacao.value)

    funcionarios.value = dadosPaginados.content
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
        await carregarFuncionarios()
      }
    }
  } catch (error) {
    erro.value = 'Não foi possível carregar os funcionários.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarFuncionario() {
  if (modoVisualizacaoEmpresa.value) {
    erro.value = 'Modo visualização ativo. Alterações estão bloqueadas.'
    return
  }

  try {
    erro.value = ''
    mensagemSucessoFuncionario.value = ''
    mensagemSucessoStatus.value = ''

    if (!funcionarioEditandoId.value && empresaBloqueadaFinanceiro()) {
      erro.value = 'Sua empresa está temporariamente bloqueada por pendência financeira. Acesse Faturas para regularizar.'
      return
    }

    if (!funcionario.value.nome.trim()) {
      erro.value = 'Informe o nome do funcionário.'
      return
    }

    if (!horarioValidoOuVazio(funcionario.value.horaInicioAtendimento)) {
      erro.value = 'Informe uma hora inicial de atendimento válida no formato HH:mm.'
      return
    }

    if (!horarioValidoOuVazio(funcionario.value.horaFimAtendimento)) {
      erro.value = 'Informe uma hora final de atendimento válida no formato HH:mm.'
      return
    }

    const dadosFuncionario = {
      empresaId: 1,
      nome: funcionario.value.nome,
      telefone: funcionario.value.telefone,
      email: funcionario.value.email,
      cargo: funcionario.value.cargo,
      ativo: Boolean(funcionario.value.ativo),
      horaInicioAtendimento: normalizarHoraFuncionario(funcionario.value.horaInicioAtendimento),
      horaFimAtendimento: normalizarHoraFuncionario(funcionario.value.horaFimAtendimento),
      atendeDominao: Boolean(funcionario.value.atendeDominao),
      atendeSegunda: Boolean(funcionario.value.atendeSegunda),
      atendeTerca: Boolean(funcionario.value.atendeTerca),
      atendeQuarta: Boolean(funcionario.value.atendeQuarta),
      atendeQuinta: Boolean(funcionario.value.atendeQuinta),
      atendeSexta: Boolean(funcionario.value.atendeSexta),
      atendeSabado: Boolean(funcionario.value.atendeSabado),
    }

    const criandoFuncionario = !funcionarioEditandoId.value

    if (funcionarioEditandoId.value) {
      await atualizarFuncionario(funcionarioEditandoId.value, dadosFuncionario)
      mensagemSucessoFuncionario.value = 'Funcionário atualizado com sucesso.'
    } else {
      await cadastrarFuncionario(dadosFuncionario)
      mensagemSucessoFuncionario.value = 'Funcionário cadastrado com sucesso.'
    }

    cancelarEdicaoFuncionario(false)

    await carregarFuncionarios()
    if (criandoFuncionario) {
      await retornarParaOnboardingSeNecessario('FUNCIONARIO')
    }
  } catch (error) {
    erro.value = obterMensagemErro(
      error,
      funcionarioEditandoId.value
        ? 'Não foi possível atualizar o funcionário.'
        : 'Não foi possível cadastrar o funcionário.',
    )
    console.error(error)
  }
}

async function carregarStatusFinanceiro() {
  try {
    statusFinanceiro.value = await buscarStatusFinanceiroMinhaEmpresa()
  } catch (error) {
    statusFinanceiro.value = null
    console.error(error)
  }
}

function empresaBloqueadaFinanceiro() {
  return String(statusFinanceiro.value?.statusFinanceiro || statusFinanceiro.value?.status || '')
    .trim()
    .toUpperCase() === 'BLOQUEADA_FINANCEIRO'
}

async function retornarParaOnboardingSeNecessario(etapaEsperada) {
  if (!veioDoOnboarding()) return

  await recalcularOnboarding().catch((error) => console.error(error))
  limparOrigemOnboarding()
  router.push({ path: '/onboarding', query: { atualizado: 'true' } })
}

function veioDoOnboarding() {
  return route.query.origem === 'onboarding' || sessionStorage.getItem('origemOnboarding') === 'true'
}

function limparOrigemOnboarding() {
  sessionStorage.removeItem('origemOnboarding')
  sessionStorage.removeItem('etapaOnboarding')
}

function editarFuncionario(funcionarioItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  erro.value = ''
  mensagemSucessoFuncionario.value = ''
  mensagemSucessoStatus.value = ''
  funcionarioEditandoId.value = funcionarioItem.id
  funcionario.value = {
    empresaId: funcionarioItem.empresaId || 1,
    nome: funcionarioItem.nome || '',
    telefone: funcionarioItem.telefone || '',
    email: funcionarioItem.email || '',
    cargo: funcionarioItem.cargo || '',
    ativo: estaAtivo(funcionarioItem),
    horaInicioAtendimento: formatarHoraInput(funcionarioItem.horaInicioAtendimento),
    horaFimAtendimento: formatarHoraInput(funcionarioItem.horaFimAtendimento),
    atendeDominao: obterDiaAtendimento(funcionarioItem.atendeDominao, false),
    atendeSegunda: obterDiaAtendimento(funcionarioItem.atendeSegunda, true),
    atendeTerca: obterDiaAtendimento(funcionarioItem.atendeTerca, true),
    atendeQuarta: obterDiaAtendimento(funcionarioItem.atendeQuarta, true),
    atendeQuinta: obterDiaAtendimento(funcionarioItem.atendeQuinta, true),
    atendeSexta: obterDiaAtendimento(funcionarioItem.atendeSexta, true),
    atendeSabado: obterDiaAtendimento(funcionarioItem.atendeSabado, true),
  }
}

function cancelarEdicaoFuncionario(limparMensagens = true) {
  funcionarioEditandoId.value = null
  funcionario.value = criarFuncionarioInicial()

  if (limparMensagens) {
    mensagemSucessoFuncionario.value = ''
  }
}

async function alternarAtivoFuncionario(funcionarioItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  try {
    atualizandoId.value = funcionarioItem.id
    erro.value = ''
    mensagemSucessoFuncionario.value = ''
    mensagemSucessoStatus.value = ''

    await atualizarAtivoFuncionario(funcionarioItem.id, !funcionarioItem.ativo)
    await carregarFuncionarios()

    mensagemSucessoStatus.value = estaAtivo(funcionarioItem)
      ? 'Funcionário desativado com sucesso.'
      : 'Funcionário ativado com sucesso.'
  } catch (error) {
    erro.value = 'Não foi possível atualizar o status do funcionário.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

async function enviarFuncionarioParaLixeira(funcionarioItem) {
  if (modoVisualizacaoEmpresa.value) {
    return
  }

  const confirmou = window.confirm(`Deseja enviar o funcionario "${funcionarioItem?.nome || ''}" para a lixeira?`)

  if (!confirmou) {
    return
  }

  const motivoInformado = window.prompt('Motivo da exclusao (opcional):', '')

  if (motivoInformado === null) {
    return
  }

  try {
    atualizandoId.value = funcionarioItem.id
    erro.value = ''
    mensagemSucessoFuncionario.value = ''
    mensagemSucessoStatus.value = ''
    await excluirFuncionario(funcionarioItem.id, String(motivoInformado || '').trim())
    mensagemSucessoStatus.value = 'Funcionario enviado para a lixeira com sucesso.'
    await carregarFuncionarios()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel enviar o funcionario para a lixeira.')
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function formatarHoraInput(hora) {
  return hora ? String(hora).slice(0, 5) : ''
}

function horarioValidoOuVazio(hora) {
  const texto = String(hora || '').trim()

  return !texto || /^([01]\d|2[0-3]):[0-5]\d$/.test(texto)
}

function normalizarHoraFuncionario(hora) {
  const texto = String(hora || '').trim()

  return texto || null
}

function obterDiaAtendimento(valor, padrao) {
  return valor === undefined || valor === null ? padrao : Boolean(valor)
}

function exibirDisponibilidade(funcionarioItem) {
  const horaInicio = formatarHoraInput(funcionarioItem.horaInicioAtendimento)
  const horaFim = formatarHoraInput(funcionarioItem.horaFimAtendimento)

  if (!horaInicio || !horaFim) {
    return 'Usa horário da empresa'
  }

  return `${horaInicio} às ${horaFim}`
}

function exibirDiasAtendimento(funcionarioItem) {
  const dias = [
    { campo: 'atendeDominao', rotulo: 'Domingo', padrao: false },
    { campo: 'atendeSegunda', rotulo: 'Seg', padrao: true },
    { campo: 'atendeTerca', rotulo: 'Terça', padrao: true },
    { campo: 'atendeQuarta', rotulo: 'Qua', padrao: true },
    { campo: 'atendeQuinta', rotulo: 'Qui', padrao: true },
    { campo: 'atendeSexta', rotulo: 'Sex', padrao: true },
    { campo: 'atendeSabado', rotulo: 'Sábado', padrao: true },
  ]
    .filter((dia) => obterDiaAtendimento(funcionarioItem[dia.campo], dia.padrao))
    .map((dia) => dia.rotulo)

  return dias.length ? dias.join(', ') : '-'
}

function estaAtivo(funcionarioItem) {
  return funcionarioItem.ativo !== false
}

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

function limparFiltros() {
  paginacao.value.page = 0
  paginacao.value.size = 10
  filtros.value = {
    status: '',
    busca: '',
  }
  carregarFuncionarios()
}

function aplicarFiltros() {
  paginacao.value.page = 0
  carregarFuncionarios()
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  paginacao.value.page = Math.max(paginacao.value.page - 1, 0)
  await carregarFuncionarios()
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  paginacao.value.page += 1
  await carregarFuncionarios()
}

async function alterarTamanhoPagina() {
  paginacao.value.page = 0
  await carregarFuncionarios()
}

onMounted(() => {
  carregarFuncionarios()
  carregarStatusFinanceiro()
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, atualizarModoVisualizacao)
})

function atualizarModoVisualizacao() {
  modoVisualizacaoEmpresa.value = modoVisualizacaoEmpresaAtivo()
  carregarFuncionarios()
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Equipe</p>
        <h1>Funcionários</h1>
        <p class="descricao">Gerencie os profissionais disponíveis para atendimento.</p>
      </div>

      <button class="botao secundario" @click="carregarFuncionarios">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucessoStatus" class="card sucesso-card">
      <p>{{ mensagemSucessoStatus }}</p>
    </section>

    <section v-if="modoVisualizacaoEmpresa" class="card aviso-visualizacao">
      <p>Modo visualização: alterações estão bloqueadas.</p>
    </section>

    <FuncionarioForm
      v-if="!modoVisualizacaoEmpresa"
      v-model="funcionario"
      :mensagem-sucesso="mensagemSucessoFuncionario"
      :modo-edicao="Boolean(funcionarioEditandoId)"
      @salvar="salvarFuncionario"
      @cancelar="cancelarEdicaoFuncionario"
    />

    <section class="secao-funcionarios">
      <section class="card filtros-funcionarios">
        <div class="titulo-card">
          <h2>Filtros</h2>
          <p>Refine a lista de funcionários cadastrados.</p>
        </div>

        <div class="campos-filtros">
          <label>
            Status
            <select v-model="filtros.status" @change="aplicarFiltros">
              <option value="">Todos</option>
              <option value="ativos">Ativos</option>
              <option value="inativos">Inativos</option>
            </select>
          </label>

          <label class="campo-busca">
            Buscar
            <input
              v-model="filtros.busca"
              type="text"
              placeholder="Busque por nome, e-mail, telefone ou cargo"
              @input="aplicarFiltros"
            />
          </label>

          <div class="acoes-filtros">
            <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
          </div>
        </div>
      </section>

      <div class="cabecalho-lista">
        <div>
          <h2>Funcionários cadastrados</h2>
          <p>Consulte e gerencie os profissionais disponíveis para atendimento.</p>
        </div>

        <span class="contador">{{ paginacao.totalElements }} funcionário(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando funcionários...</p>
      </section>

      <section v-else-if="funcionarios.length === 0" class="card">
        <p>Nenhum funcionário encontrado.</p>
      </section>

      <section v-else-if="funcionariosFiltrados.length === 0" class="card">
        <p>Nenhum funcionário encontrado para os filtros selecionados.</p>
      </section>

      <section v-else class="lista-funcionarios">
        <article
          v-for="funcionarioItem in funcionariosFiltrados"
          :key="funcionarioItem.id"
          class="card funcionario-card"
        >
          <div class="topo-card">
            <div>
              <h3>{{ funcionarioItem.nome }}</h3>
              <p class="cargo">{{ exibirValor(funcionarioItem.cargo) }}</p>
            </div>

            <span :class="['status', estaAtivo(funcionarioItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(funcionarioItem) ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>Telefone:</strong> {{ exibirValor(funcionarioItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(funcionarioItem.email) }}</p>
            <p><strong>Cargo:</strong> {{ exibirValor(funcionarioItem.cargo) }}</p>
            <p>
              <strong>Disponibilidade:</strong> {{ exibirDisponibilidade(funcionarioItem) }}
            </p>
            <p><strong>Dias:</strong> {{ exibirDiasAtendimento(funcionarioItem) }}</p>
          </div>

          <div v-if="!modoVisualizacaoEmpresa" class="acoes">
            <button class="botao secundario" @click="editarFuncionario(funcionarioItem)">
              Editar
            </button>

            <button
              :class="['botao', estaAtivo(funcionarioItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === funcionarioItem.id"
              @click="alternarAtivoFuncionario(funcionarioItem)"
            >
              {{ estaAtivo(funcionarioItem) ? 'Desativar' : 'Ativar' }}
            </button>
            <button
              class="botao perigo"
              :disabled="atualizandoId === funcionarioItem.id"
              @click="enviarFuncionarioParaLixeira(funcionarioItem)"
            >
              Excluir
            </button>
          </div>

          <p v-if="atualizandoId === funcionarioItem.id" class="atualizando">
            Atualizando funcionário...
          </p>
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
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topo-card {
  align-items: flex-start;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.descricao,
.cabecalho-lista p {
  margin: 6px 0 0;
  color: #64748b;
}

.secao-funcionarios {
  display: grid;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.filtros-funcionarios {
  display: grid;
  gap: 16px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.campos-filtros {
  display: grid;
  grid-template-columns: minmax(160px, 220px) minmax(260px, 1fr) auto;
  gap: 16px;
  align-items: end;
}

.campos-filtros label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.campos-filtros input,
.campos-filtros select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

.campos-filtros input:focus,
.campos-filtros select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.acoes-filtros {
  display: flex;
  align-items: end;
}

.lista-funcionarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.funcionario-card {
  display: grid;
  gap: 14px;
}

.funcionario-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.cargo {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
  word-break: break-word;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
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

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.ativo {
  background: #dcfce7;
  color: #15803d;
}

.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.botao,
:deep(.botao) {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover,
:deep(.botao:hover) {
  transform: translateY(-1px);
}

.botao:disabled,
:deep(.botao:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
}

:deep(.secundario) {
  background: #0f172a;
}

:deep(.secundario:hover) {
  background: #1e293b;
}

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

.sucesso {
  background: #16a34a;
}

.sucesso:hover {
  background: #15803d;
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

:deep(.formulario) {
  display: grid;
  gap: 16px;
}

:deep(.titulo-card h2) {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

:deep(.titulo-card p) {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.campos) {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

:deep(.secao-disponibilidade) {
  grid-column: 1 / -1;
  display: grid;
  gap: 14px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

:deep(.secao-disponibilidade h3) {
  margin: 0;
  color: #111827;
  font-size: 18px;
  font-weight: 800;
}

:deep(.campos-disponibilidade) {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 16px;
}

:deep(.dias-semana) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(130px, 1fr));
  gap: 10px 14px;
}

:deep(label) {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

:deep(input) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(input:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

:deep(.mensagem-campo) {
  color: #b91c1c;
  font-size: 13px;
  font-weight: 700;
}

:deep(input[type='checkbox']) {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

:deep(.campo-checkbox) {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

:deep(.rodape-formulario) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.atualizando {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.sucesso-texto) {
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

:deep(.erro-texto) {
  color: #b91c1c;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .topo-card {
    align-items: flex-start;
  }

  .lista-funcionarios,
  .campos-filtros,
  :deep(.campos-disponibilidade),
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
