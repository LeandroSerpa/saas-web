<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarAcoesAuditoria,
  buscarAuditoria,
  buscarAuditoriaPorId,
  buscarEmpresas,
  buscarEntidadesAuditoria,
  buscarModulosAuditoria,
} from '@/services/api'

const filtrosIniciais = {
  empresaId: '',
  modulo: '',
  entidade: '',
  acao: '',
  usuario: '',
  dataInicial: '',
  dataFinal: '',
  texto: '',
}

const filtros = ref({ ...filtrosIniciais })
const opcoesTamanhoPagina = [10, 20, 50, 100, 200]
const empresas = ref([])
const acoesAuditoria = ref([])
const modulosAuditoria = ref([])
const entidadesAuditoria = ref([])
const usarSelectAcoes = ref(false)
const usarSelectModulos = ref(false)
const usarSelectEntidades = ref(false)
const logs = ref([])
const paginaAtual = ref(0)
const tamanhoPagina = ref(10)
const totalRegistros = ref(0)
const totalPaginas = ref(0)
const primeiraPagina = ref(true)
const ultimaPagina = ref(true)
const carregando = ref(false)
const carregandoEmpresas = ref(false)
const carregandoDetalhe = ref(false)
const erro = ref('')
const erroEmpresas = ref('')
const detalhe = ref(null)

const paginaHumana = computed(() => (totalPaginas.value ? paginaAtual.value + 1 : 0))
const inicioExibicao = computed(() => (totalRegistros.value && logs.value.length ? paginaAtual.value * tamanhoPagina.value + 1 : 0))
const fimExibicao = computed(() => Math.min(totalRegistros.value, paginaAtual.value * tamanhoPagina.value + logs.value.length))
const podeVoltar = computed(() => !carregando.value && !primeiraPagina.value)
const podeAvancar = computed(() => !carregando.value && !ultimaPagina.value)

onMounted(() => {
  carregarEmpresasFiltro()
  carregarOpcoesAuditoria()
  carregarAuditoria()
})

async function carregarAuditoria() {
  try {
    carregando.value = true
    erro.value = ''
    detalhe.value = null

    const resposta = await buscarAuditoria(montarParametrosAuditoria())
    aplicarRespostaPaginada(resposta)
  } catch (error) {
    erro.value = obterMensagemErroAuditoria(error)
    console.error('Erro ao carregar auditoria:', error)
  } finally {
    carregando.value = false
  }
}

function limparFiltros() {
  filtros.value = { ...filtrosIniciais }
  paginaAtual.value = 0
  tamanhoPagina.value = 10
  carregarAuditoria()
}

function aplicarFiltros() {
  paginaAtual.value = 0
  carregarAuditoria()
}

function alterarTamanhoPagina() {
  paginaAtual.value = 0
  carregarAuditoria()
}

function irParaPrimeiraPagina() {
  if (primeiraPagina.value) return
  paginaAtual.value = 0
  carregarAuditoria()
}

function irParaPaginaAnterior() {
  if (primeiraPagina.value) return
  paginaAtual.value = Math.max(0, paginaAtual.value - 1)
  carregarAuditoria()
}

function irParaProximaPagina() {
  if (ultimaPagina.value) return
  paginaAtual.value += 1
  carregarAuditoria()
}

function irParaUltimaPagina() {
  if (ultimaPagina.value) return
  paginaAtual.value = Math.max(0, totalPaginas.value - 1)
  carregarAuditoria()
}

async function carregarEmpresasFiltro() {
  try {
    carregandoEmpresas.value = true
    erroEmpresas.value = ''

    const resposta = await buscarEmpresas()
    empresas.value = extrairLista(resposta)
  } catch (error) {
    erroEmpresas.value = 'Não foi possível carregar a lista de empresas.'
    console.error('Erro ao carregar empresas para filtro da auditoria:', error)
  } finally {
    carregandoEmpresas.value = false
  }
}

async function carregarOpcoesAuditoria() {
  await Promise.all([
    carregarOpcaoFiltro(buscarAcoesAuditoria, acoesAuditoria, usarSelectAcoes, 'ações'),
    carregarOpcaoFiltro(buscarModulosAuditoria, modulosAuditoria, usarSelectModulos, 'módulos'),
    carregarOpcaoFiltro(buscarEntidadesAuditoria, entidadesAuditoria, usarSelectEntidades, 'entidades'),
  ])
}

async function carregarOpcaoFiltro(funcaoBusca, destino, usarSelect, nome) {
  try {
    const resposta = await funcaoBusca()
    const opcoes = extrairLista(resposta)
      .map(normalizarOpcaoFiltro)
      .filter(Boolean)

    destino.value = opcoes
    usarSelect.value = opcoes.length > 0
  } catch (error) {
    destino.value = []
    usarSelect.value = false
    console.error(`Erro ao carregar ${nome} da auditoria:`, error)
  }
}

async function abrirDetalhes(log) {
  try {
    carregandoDetalhe.value = true
    erro.value = ''

    detalhe.value = await buscarAuditoriaPorId(log.id)
  } catch (error) {
    erro.value =
      obterMensagemErroPermissao(error) || limparMensagemBackend(error?.message) || 'Não foi possível carregar os detalhes do log.'
    console.error('Erro ao carregar detalhes da auditoria:', error)
  } finally {
    carregandoDetalhe.value = false
  }
}

function fecharDetalhes() {
  detalhe.value = null
}

function montarParametrosAuditoria() {
  return limparVazios({
    page: paginaAtual.value,
    size: tamanhoPagina.value,
    empresaId: filtros.value.empresaId,
    modulo: filtros.value.modulo,
    entidade: filtros.value.entidade,
    acao: filtros.value.acao,
    usuario: filtros.value.usuario,
    dataInicial: normalizarDataFiltro(filtros.value.dataInicial),
    dataFinal: normalizarDataFiltro(filtros.value.dataFinal),
    texto: filtros.value.texto,
  })
}

function normalizarDataFiltro(valor) {
  const data = String(valor || '').trim()
  return /^\d{4}-\d{2}-\d{2}$/.test(data) ? data : ''
}

function aplicarRespostaPaginada(resposta) {
  if (resposta && typeof resposta === 'object' && Array.isArray(resposta.content)) {
    const tamanhoResposta = Number(resposta.size ?? tamanhoPagina.value) || tamanhoPagina.value

    logs.value = resposta.content
    totalRegistros.value = Number(resposta.totalElements ?? resposta.total ?? resposta.content.length) || 0
    totalPaginas.value = Number(resposta.totalPages) || calcularTotalPaginas(totalRegistros.value, tamanhoResposta)
    paginaAtual.value = Number(resposta.number ?? resposta.page ?? paginaAtual.value) || 0
    primeiraPagina.value = Boolean(resposta.first ?? paginaAtual.value <= 0)
    ultimaPagina.value = Boolean(resposta.last ?? paginaAtual.value >= totalPaginas.value - 1)
    return
  }

  const lista = extrairLista(resposta)
  totalRegistros.value = lista.length
  totalPaginas.value = calcularTotalPaginas(totalRegistros.value, tamanhoPagina.value)
  primeiraPagina.value = paginaAtual.value <= 0
  ultimaPagina.value = totalPaginas.value === 0 || paginaAtual.value >= totalPaginas.value - 1
  logs.value = lista.slice(paginaAtual.value * tamanhoPagina.value, (paginaAtual.value + 1) * tamanhoPagina.value)
}

function calcularTotalPaginas(total, tamanho) {
  return total ? Math.ceil(total / tamanho) : 0
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.data || resposta?.dados || resposta?.registros || []
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto || {}).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function normalizarOpcaoFiltro(item) {
  if (typeof item === 'string') {
    return item
  }

  return item?.valor || item?.nome || item?.codigo || item?.label || item?.descricao || ''
}

function obterMensagemErroAuditoria(error) {
  return (
    obterMensagemErroPermissao(error) ||
    obterMensagemErroInterno(error, 'Não foi possível carregar a auditoria. Tente novamente após alguns instantes.') ||
    limparMensagemBackend(error?.message) ||
    'Não foi possível carregar a auditoria. Tente novamente após alguns instantes.'
  )
}

function obterMensagemErroPermissao(error) {
  const mensagem = String(error?.message || '').toLowerCase()

  return mensagem.includes('forbidden') ||
    mensagem.includes('permiss') ||
    mensagem.includes('403') ||
    mensagem.includes('unauthorized')
    ? 'Você não tem permissão para acessar a auditoria.'
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

  return texto.length > 220 ? `${texto.slice(0, 220).trim()}...` : texto
}

function mensagemTecnica(mensagem) {
  const texto = mensagem.toLowerCase()

  return (
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

function formatarDataHora(valor) {
  if (!valor) {
    return '-'
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return String(valor)
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function obterCampo(item, ...campos) {
  return campos.map((campo) => item?.[campo]).find((valor) => valor !== null && valor !== undefined && String(valor).trim()) || '-'
}

function formatarJson(valor) {
  if (!valor) {
    return 'Sem dados.'
  }

  if (typeof valor === 'string') {
    try {
      return JSON.stringify(JSON.parse(valor), null, 2)
    } catch (error) {
      return valor
    }
  }

  return JSON.stringify(valor, null, 2)
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Super admin</p>
        <h1>Auditoria do sistema</h1>
        <p class="descricao">Acompanhe ações realizadas por usuários, empresas e clientes públicos.</p>
      </div>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="erroEmpresas" class="card aviso-card">
      <p>{{ erroEmpresas }}</p>
    </section>

    <section class="card filtros">
      <p class="observacao-super-admin">
        Como SUPER_ADMIN, você pode consultar logs de todas as empresas ou filtrar uma empresa
        específica.
      </p>

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
          Módulo
          <select v-if="usarSelectModulos" v-model="filtros.modulo">
            <option value="">Todos os módulos</option>
            <option v-for="modulo in modulosAuditoria" :key="modulo" :value="modulo">
              {{ modulo }}
            </option>
          </select>
          <input v-else v-model="filtros.modulo" type="text" placeholder="Ex: agenda" />
        </label>
        <label>
          Entidade
          <select v-if="usarSelectEntidades" v-model="filtros.entidade">
            <option value="">Todas as entidades</option>
            <option v-for="entidade in entidadesAuditoria" :key="entidade" :value="entidade">
              {{ entidade }}
            </option>
          </select>
          <input v-else v-model="filtros.entidade" type="text" placeholder="Ex: Agendamento" />
        </label>
        <label>
          Ação
          <select v-if="usarSelectAcoes" v-model="filtros.acao">
            <option value="">Todas as ações</option>
            <option v-for="acao in acoesAuditoria" :key="acao" :value="acao">
              {{ acao }}
            </option>
          </select>
          <input v-else v-model="filtros.acao" type="text" placeholder="Ex: EXCLUIR" />
        </label>
        <label>
          Usuário
          <input v-model="filtros.usuario" type="text" placeholder="Nome, e-mail ou ID" />
        </label>
        <label>
          Data inicial
          <input v-model="filtros.dataInicial" type="date" />
        </label>
        <label>
          Data final
          <input v-model="filtros.dataFinal" type="date" />
        </label>
        <label>
          Texto livre
          <input v-model="filtros.texto" type="text" placeholder="Buscar na descrição" />
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="aplicarFiltros">
          Filtrar
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </section>

    <section class="card">
      <p v-if="carregando">Carregando logs...</p>
      <p v-else-if="!logs.length" class="vazio">Nenhum registro de auditoria encontrado.</p>

      <div v-else class="auditoria-table-wrapper">
        <table class="auditoria-table">
          <thead>
            <tr>
              <th class="col-data">Data/hora</th>
              <th class="col-empresa">Empresa</th>
              <th class="col-usuario">Usuário</th>
              <th class="col-perfil">Perfil</th>
              <th class="col-modulo">Módulo</th>
              <th class="col-media">Entidade</th>
              <th class="col-acao">Ação</th>
              <th class="col-descricao">Descrição</th>
              <th class="col-detalhes"></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id || `${log.dataHora}-${log.descricao}`">
              <td class="col-data texto-nowrap">{{ formatarDataHora(obterCampo(log, 'dataHora', 'criadoEm', 'createdAt')) }}</td>
              <td class="col-empresa">{{ obterCampo(log, 'empresaNome', 'empresa') }}</td>
              <td class="col-usuario">{{ obterCampo(log, 'usuarioNome', 'usuarioEmail', 'usuario') }}</td>
              <td class="col-perfil texto-nowrap">{{ obterCampo(log, 'perfil', 'usuarioPerfil') }}</td>
              <td class="col-modulo texto-nowrap">{{ obterCampo(log, 'modulo') }}</td>
              <td class="col-media texto-nowrap">{{ obterCampo(log, 'entidade', 'tipoEntidade') }}</td>
              <td class="col-acao">{{ obterCampo(log, 'acao') }}</td>
              <td class="col-descricao">{{ obterCampo(log, 'descricao') }}</td>
              <td class="col-detalhes">
                <button class="botao pequeno" :disabled="carregandoDetalhe" @click="abrirDetalhes(log)">
                  Detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <div v-if="!carregando && logs.length" class="paginacao">
        <p class="resumo-paginacao">
          Mostrando {{ inicioExibicao }} a {{ fimExibicao }} de {{ totalRegistros }} registros
          <span v-if="totalPaginas"> - Página {{ paginaHumana }} de {{ totalPaginas }}</span>
        </p>

        <label class="tamanho-pagina">
          Registros por página
          <select v-model.number="tamanhoPagina" :disabled="carregando" @change="alterarTamanhoPagina">
            <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
              {{ opcao }}
            </option>
          </select>
        </label>

        <div class="botoes-paginacao">
          <button class="botao secundario" :disabled="!podeVoltar" @click="irParaPrimeiraPagina">
            Primeira
          </button>
          <button class="botao secundario" :disabled="!podeVoltar" @click="irParaPaginaAnterior">
            Anterior
          </button>
          <button class="botao secundario" :disabled="!podeAvancar" @click="irParaProximaPagina">
            Próxima
          </button>
          <button class="botao secundario" :disabled="!podeAvancar" @click="irParaUltimaPagina">
            Última
          </button>
        </div>
      </div>
    </section>

    <section v-if="detalhe" class="modal-fundo" @click.self="fecharDetalhes">
      <div class="modal card">
        <div class="modal-topo">
          <h2>Detalhes do log</h2>
          <button class="botao secundario" @click="fecharDetalhes">Fechar</button>
        </div>

        <div class="detalhes-grid">
          <p><strong>ID:</strong> {{ detalhe.id || '-' }}</p>
          <p><strong>Data/hora:</strong> {{ formatarDataHora(obterCampo(detalhe, 'dataHora', 'criadoEm', 'createdAt')) }}</p>
          <p><strong>Empresa:</strong> {{ obterCampo(detalhe, 'empresaNome', 'empresa') }}</p>
          <p><strong>Usuário:</strong> {{ obterCampo(detalhe, 'usuarioNome', 'usuarioEmail', 'usuario') }}</p>
          <p><strong>Perfil:</strong> {{ obterCampo(detalhe, 'perfil', 'usuarioPerfil') }}</p>
          <p><strong>Módulo:</strong> {{ obterCampo(detalhe, 'modulo') }}</p>
          <p><strong>Entidade:</strong> {{ obterCampo(detalhe, 'entidade', 'tipoEntidade') }}</p>
          <p><strong>Ação:</strong> {{ obterCampo(detalhe, 'acao') }}</p>
          <p class="campo-largo"><strong>Descrição:</strong> {{ obterCampo(detalhe, 'descricao') }}</p>
          <p><strong>IP:</strong> {{ obterCampo(detalhe, 'ip') }}</p>
          <p class="campo-largo"><strong>User agent:</strong> {{ obterCampo(detalhe, 'userAgent') }}</p>
        </div>

        <div class="blocos-json">
          <div>
            <h3>Dados antes</h3>
            <pre>{{ formatarJson(detalhe.dadosAntes) }}</pre>
          </div>
          <div>
            <h3>Dados depois</h3>
            <pre>{{ formatarJson(detalhe.dadosDepois) }}</pre>
          </div>
        </div>
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

h1,
h2,
h3 {
  margin: 0;
  font-weight: 800;
}

h1 {
  font-size: 32px;
}

.descricao {
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

.filtros {
  display: grid;
  gap: 16px;
}

.campos,
.detalhes-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
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

.observacao-super-admin {
  margin: 0;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 800;
}

.acoes,
.modal-topo {
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

.secundario,
.pequeno {
  background: #0f172a;
  color: white;
}

.pequeno {
  padding: 8px 10px;
  font-size: 13px;
  white-space: nowrap;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.aviso-card {
  border-color: #fde68a;
  background: #fffbeb;
  color: #92400e;
}

.vazio {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.paginacao {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  flex-wrap: wrap;
  margin-top: 16px;
  padding-top: 16px;
  border-top: 1px solid #e5e7eb;
}

.resumo-paginacao {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 800;
}

.tamanho-pagina {
  width: 190px;
}

.botoes-paginacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.auditoria-table-wrapper {
  overflow-x: auto;
  width: 100%;
}

.auditoria-table {
  width: 100%;
  border-collapse: collapse;
  min-width: 1400px;
  table-layout: fixed;
}

.auditoria-table th,
.auditoria-table td {
  border-bottom: 1px solid #e5e7eb;
  padding: 10px 8px;
  text-align: left;
  vertical-align: top;
  font-size: 13px;
  line-height: 1.35;
  white-space: normal;
  word-break: normal;
  overflow-wrap: normal;
}

.auditoria-table th {
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
}

.texto-nowrap,
.col-detalhes {
  white-space: nowrap;
}

.col-data {
  width: 135px;
}

.col-empresa {
  width: 180px;
}

.col-usuario {
  width: 180px;
}

.col-perfil {
  width: 120px;
}

.col-modulo {
  width: 140px;
}

.col-media {
  width: 160px;
}

.col-acao {
  width: 240px;
  white-space: normal;
  word-break: break-word;
  overflow-wrap: anywhere;
}

.col-descricao {
  width: auto;
  overflow-wrap: anywhere;
}

.col-detalhes {
  width: 115px;
  text-align: right;
}

.modal-fundo {
  position: fixed;
  inset: 0;
  display: grid;
  place-items: center;
  padding: 24px;
  background: rgba(15, 23, 42, 0.42);
  z-index: 20;
}

.modal {
  width: min(100%, 980px);
  max-height: 86vh;
  overflow: auto;
  display: grid;
  gap: 18px;
}

.campo-largo {
  grid-column: 1 / -1;
}

.detalhes-grid p {
  margin: 0;
  color: #374151;
}

.blocos-json {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 14px;
}

pre {
  max-height: 280px;
  overflow: auto;
  margin: 8px 0 0;
  padding: 14px;
  border-radius: 8px;
  background: #0f172a;
  color: #e2e8f0;
  white-space: pre-wrap;
}

@media (max-width: 900px) {
  .auditoria-table {
    min-width: 1400px;
  }

  .campos,
  .detalhes-grid,
  .blocos-json {
    grid-template-columns: 1fr;
  }

  .paginacao,
  .botoes-paginacao {
    align-items: stretch;
    flex-direction: column;
  }

  .tamanho-pagina {
    width: 100%;
  }
}
</style>
