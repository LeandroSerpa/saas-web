<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarAgendamentosExcluidos, buscarEmpresas, restaurarAgendamento } from '@/services/api'

const filtrosIniciais = {
  empresaId: '',
  cliente: '',
  funcionario: '',
  servico: '',
  dataInicio: '',
  dataFim: '',
}

const filtros = ref({ ...filtrosIniciais })
const empresas = ref([])
const agendamentos = ref([])
const carregando = ref(false)
const carregandoEmpresas = ref(false)
const restaurandoId = ref(null)
const erro = ref('')
const erroEmpresas = ref('')
const mensagemSucesso = ref('')

const periodoAplicado = computed(() => {
  const dataInicio = formatarDataFiltro(filtros.value.dataInicio)
  const dataFim = formatarDataFiltro(filtros.value.dataFim)

  if (!dataInicio && !dataFim) {
    return 'Período aplicado: todos os agendamentos excluídos.'
  }

  if (dataInicio && !dataFim) {
    return `Período aplicado: agendamentos a partir de ${dataInicio}.`
  }

  if (!dataInicio && dataFim) {
    return `Período aplicado: agendamentos até ${dataFim}.`
  }

  return `Período aplicado: agendamentos de ${dataInicio} até ${dataFim}.`
})

onMounted(() => {
  carregarEmpresasFiltro()
  carregarLixeira()
})

async function carregarLixeira() {
  const filtrosApi = montarFiltrosApi()

  if (!datasValidas(filtrosApi)) {
    erro.value = 'A data inicial não pode ser maior que a data final.'
    return
  }

  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const resposta = await buscarAgendamentosExcluidos(filtrosApi)
    console.debug('Lixeira de agendamentos carregada:', resposta)
    agendamentos.value = extrairLista(resposta)
  } catch (error) {
    erro.value = obterMensagemErroLixeira(error)
    console.error('Erro ao carregar lixeira:', error)
  } finally {
    carregando.value = false
  }
}

async function carregarEmpresasFiltro() {
  try {
    carregandoEmpresas.value = true
    erroEmpresas.value = ''

    const resposta = await buscarEmpresas()
    empresas.value = extrairLista(resposta)
  } catch (error) {
    erroEmpresas.value = 'Não foi possível carregar a lista de empresas.'
    console.error('Erro ao carregar empresas para filtro da lixeira:', error)
  } finally {
    carregandoEmpresas.value = false
  }
}

function limparFiltros() {
  filtros.value = { ...filtrosIniciais }
  carregarLixeira()
}

async function restaurar(item) {
  if (!window.confirm('Deseja restaurar este agendamento?')) {
    return
  }

  try {
    restaurandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''

    await restaurarAgendamento(item.id)
    mensagemSucesso.value = 'Agendamento restaurado com sucesso.'
    agendamentos.value = agendamentos.value.filter((agendamento) => agendamento.id !== item.id)
  } catch (error) {
    erro.value = limparMensagemBackend(error?.message) || 'Não foi possível restaurar o agendamento.'
    console.error('Erro ao restaurar agendamento:', error)
  } finally {
    restaurandoId.value = null
  }
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.dados || resposta?.agendamentos || []
}

function obterMensagemErroLixeira(error) {
  return (
    obterMensagemErroPermissao(error) ||
    obterMensagemErroInterno(error, 'Não foi possível carregar a lixeira. Tente novamente após alguns instantes.') ||
    limparMensagemBackend(error?.message) ||
    'Não foi possível carregar a lixeira. Verifique os filtros ou tente novamente.'
  )
}

function obterMensagemErroPermissao(error) {
  const mensagem = String(error?.message || '').toLowerCase()

  return mensagem.includes('forbidden') ||
    mensagem.includes('permiss') ||
    mensagem.includes('403') ||
    mensagem.includes('unauthorized')
    ? 'Você não tem permissão para acessar a lixeira.'
    : ''
}

function obterMensagemErroInterno(error, mensagemPadrao) {
  const mensagem = String(error?.message || '').toLowerCase()

  return mensagem.includes('500') ||
    mensagem.includes('internal server error') ||
    mensagem.includes('erro interno')
    ? mensagemPadrao
    : ''
}

function limparMensagemBackend(mensagem) {
  const texto = String(mensagem || '').trim()

  if (!texto || mensagemTecnica(texto)) {
    return ''
  }

  return texto.length > 220 ? '' : texto
}

function mensagemTecnica(mensagem) {
  const texto = mensagem.toLowerCase()

  return (
    texto.length > 500 ||
    texto.includes('select ') ||
    texto.includes(' from ') ||
    texto.includes('jdbc') ||
    texto.includes('sql') ||
    texto.includes('stack trace') ||
    texto.includes('exception') ||
    texto.includes('org.hibernate') ||
    texto.includes('java.')
  )
}

function obterCampo(item, ...campos) {
  return campos.map((campo) => item?.[campo]).find((valor) => valor !== null && valor !== undefined && String(valor).trim()) || ''
}

function montarFiltrosApi() {
  return limparVazios({
    empresaId: filtros.value.empresaId,
    cliente: filtros.value.cliente,
    funcionario: filtros.value.funcionario,
    servico: filtros.value.servico,
    dataInicio: normalizarDataFiltro(filtros.value.dataInicio),
    dataFim: normalizarDataFiltro(filtros.value.dataFim),
  })
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function datasValidas(filtrosApi = montarFiltrosApi()) {
  return !(filtrosApi.dataInicio && filtrosApi.dataFim && filtrosApi.dataInicio > filtrosApi.dataFim)
}

function normalizarDataFiltro(valor) {
  const data = String(valor || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : ''
}

function formatarDataFiltro(valor) {
  const dataNormalizada = normalizarDataFiltro(valor)

  if (!dataNormalizada) {
    return ''
  }

  const [ano, mes, dia] = dataNormalizada.split('-')

  return `${dia}/${mes}/${ano}`
}

function obterDataHoraAgendamento(item) {
  return obterCampo(item, 'dataHoraInicio', 'dataAtendimento', 'data')
}

function obterResumoAgendamento(item) {
  const data = formatarData(obterDataHoraAgendamento(item))
  const horario = formatarHorario(obterCampo(item, 'dataHoraInicio', 'horarioInicio', 'hora'))

  return `Agendamento: ${data} às ${horario}`
}

function formatarData(valor) {
  const data = criarData(valor)

  if (!data) {
    return valor || '-'
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarDataHora(valor) {
  const data = criarData(valor)

  if (!data) {
    return valor || '-'
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarHorario(valor) {
  const texto = String(valor || '')
  const parteHorario = texto.includes('T') ? texto.split('T')[1] : texto
  const horario = parteHorario.trim().match(/^(\d{2}):(\d{2})(?::\d{2})?/)

  if (horario) {
    return `${horario[1]}:${horario[2]}`
  }

  const data = criarData(valor)

  if (!data) {
    return '-'
  }

  return `${String(data.getHours()).padStart(2, '0')}:${String(data.getMinutes()).padStart(2, '0')}`
}

function criarData(valor) {
  if (!valor) {
    return null
  }

  const data = new Date(valor)

  return Number.isNaN(data.getTime()) ? null : data
}

function formatarPreco(valor) {
  if (valor === null || valor === undefined || valor === '') {
    return '-'
  }

  return Number(valor).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

function obterSituacao(item) {
  return item?.excluido === false ? 'Ativo' : 'Excluído'
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Super admin</p>
        <h1>Lixeira de agendamentos</h1>
        <p class="descricao">
          Agendamentos excluídos não são apagados definitivamente. O SUPER_ADMIN pode consultar e
          restaurar registros quando não houver conflito de horário.
        </p>
        <p class="observacao-super-admin">
          Como SUPER_ADMIN, você está visualizando agendamentos excluídos de todas as empresas.
          Use o filtro Empresa para visualizar uma empresa específica.
        </p>
      </div>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section v-if="erroEmpresas" class="card aviso-card">
      <p>{{ erroEmpresas }}</p>
    </section>

    <section class="card filtros">
      <div class="campos">
        <label>
          Empresa
          <select v-model="filtros.empresaId" :disabled="carregandoEmpresas">
            <option value="">Todas as empresas</option>
            <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
              {{ empresa.nome || 'Empresa sem nome' }}
            </option>
          </select>
        </label>
        <label>
          Cliente
          <input v-model="filtros.cliente" type="text" placeholder="Nome do cliente" />
        </label>
        <label>
          Funcionário
          <input v-model="filtros.funcionario" type="text" placeholder="Nome do funcionário" />
        </label>
        <label>
          Serviço
          <input v-model="filtros.servico" type="text" placeholder="Nome do serviço" />
        </label>
        <label>
          Data inicial do agendamento
          <input v-model="filtros.dataInicio" type="date" />
        </label>
        <label>
          Data final do agendamento
          <input v-model="filtros.dataFim" type="date" />
        </label>
      </div>

      <p class="periodo-aplicado">{{ periodoAplicado }}</p>

      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="carregarLixeira">
          Filtrar
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </section>

    <section class="card">
      <p v-if="carregando">Carregando agendamentos excluídos...</p>
      <p v-else-if="!agendamentos.length" class="vazio">Nenhum agendamento excluído encontrado.</p>

      <div v-else class="lista">
        <article v-for="item in agendamentos" :key="item.id" class="agendamento-card">
          <div class="card-topo">
            <div>
              <span>Código/ID</span>
              <strong>{{ item.id }}</strong>
              <p class="resumo-agendamento">{{ obterResumoAgendamento(item) }}</p>
            </div>
            <button
              class="botao principal"
              :disabled="restaurandoId === item.id"
              @click="restaurar(item)"
            >
              {{ restaurandoId === item.id ? 'Restaurando...' : 'Restaurar' }}
            </button>
          </div>

          <dl>
            <div>
              <dt>Empresa</dt>
              <dd>{{ obterCampo(item, 'empresaNome', 'empresa') || '-' }}</dd>
            </div>
            <div>
              <dt>Cliente</dt>
              <dd>{{ obterCampo(item, 'clienteNome', 'nomeCliente', 'cliente') || '-' }}</dd>
            </div>
            <div>
              <dt>Serviço</dt>
              <dd>{{ obterCampo(item, 'servicoNome', 'nomeServico', 'servico') || '-' }}</dd>
            </div>
            <div>
              <dt>Funcionário</dt>
              <dd>{{ obterCampo(item, 'funcionarioNome', 'nomeFuncionario', 'funcionario') || '-' }}</dd>
            </div>
            <div>
              <dt>Data do agendamento</dt>
              <dd>{{ formatarData(obterDataHoraAgendamento(item)) }}</dd>
            </div>
            <div>
              <dt>Horário do agendamento</dt>
              <dd>{{ formatarHorario(obterCampo(item, 'dataHoraInicio', 'horarioInicio', 'hora')) }}</dd>
            </div>
            <div>
              <dt>Status original</dt>
              <dd>{{ obterCampo(item, 'status') || '-' }}</dd>
            </div>
            <div>
              <dt>Situação</dt>
              <dd><span class="situacao-excluido">{{ obterSituacao(item) }}</span></dd>
            </div>
            <div>
              <dt>Preço</dt>
              <dd>{{ formatarPreco(obterCampo(item, 'preco', 'valor')) }}</dd>
            </div>
            <div class="item-largo">
              <dt>Observação</dt>
              <dd>{{ obterCampo(item, 'observacao') || '-' }}</dd>
            </div>
            <div>
              <dt>Data de exclusão</dt>
              <dd>{{ formatarDataHora(obterCampo(item, 'dataExclusao', 'excluidoEm', 'deletedAt')) }}</dd>
            </div>
            <div>
              <dt>Excluído por</dt>
              <dd>{{ obterCampo(item, 'excluidoPor', 'usuarioExclusao', 'usuarioExclusaoNome') || '-' }}</dd>
            </div>
            <div class="item-largo">
              <dt>Motivo da exclusão</dt>
              <dd>{{ obterCampo(item, 'motivoExclusao', 'motivo') || '-' }}</dd>
            </div>
          </dl>
        </article>
      </div>
    </section>
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
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
}

.descricao {
  margin: 6px 0 0;
  color: #64748b;
}

.observacao-super-admin {
  margin: 10px 0 0;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 800;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.filtros,
.lista {
  display: grid;
  gap: 16px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 14px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  box-sizing: border-box;
}

select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 10px 12px;
  background: white;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.acoes,
.card-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 800;
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.principal {
  background: #2563eb;
  color: white;
}

.secundario {
  background: #0f172a;
  color: white;
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

.aviso-card {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.periodo-aplicado {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
  color: #475569;
  font-weight: 800;
}

.vazio {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.agendamento-card {
  display: grid;
  gap: 16px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.card-topo span {
  display: block;
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.card-topo strong {
  display: block;
  margin-top: 3px;
  font-size: 20px;
}

.resumo-agendamento {
  margin: 6px 0 0;
  color: #1d4ed8;
  font-weight: 800;
}

dl {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 12px;
  margin: 0;
}

dl div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
}

.item-largo {
  grid-column: span 2;
}

dt {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

dd {
  margin: 0;
  color: #111827;
  font-weight: 800;
  word-break: break-word;
}

.situacao-excluido {
  display: inline-flex;
  width: fit-content;
  padding: 5px 9px;
  border-radius: 999px;
  background: #fee2e2;
  color: #b91c1c;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

@media (max-width: 1000px) {
  .campos,
  dl {
    grid-template-columns: 1fr;
  }

  .item-largo {
    grid-column: auto;
  }
}
</style>
