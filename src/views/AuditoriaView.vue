<script setup>
import { onMounted, ref } from 'vue'
import { buscarAuditoria, buscarAuditoriaPorId } from '@/services/api'

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
const logs = ref([])
const carregando = ref(false)
const carregandoDetalhe = ref(false)
const erro = ref('')
const detalhe = ref(null)

onMounted(() => {
  carregarAuditoria()
})

async function carregarAuditoria() {
  try {
    carregando.value = true
    erro.value = ''
    detalhe.value = null

    const resposta = await buscarAuditoria(filtros.value)
    logs.value = extrairLista(resposta)
  } catch (error) {
    erro.value = mensagemErroPermissao(error) || 'Nao foi possivel carregar a auditoria.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function limparFiltros() {
  filtros.value = { ...filtrosIniciais }
  carregarAuditoria()
}

async function abrirDetalhes(log) {
  try {
    carregandoDetalhe.value = true
    erro.value = ''

    detalhe.value = await buscarAuditoriaPorId(log.id)
  } catch (error) {
    erro.value = mensagemErroPermissao(error) || 'Nao foi possivel carregar os detalhes do log.'
    console.error(error)
  } finally {
    carregandoDetalhe.value = false
  }
}

function fecharDetalhes() {
  detalhe.value = null
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.dados || resposta?.registros || []
}

function mensagemErroPermissao(error) {
  const mensagem = String(error?.message || '').toLowerCase()

  return mensagem.includes('forbidden') ||
    mensagem.includes('permiss') ||
    mensagem.includes('403') ||
    mensagem.includes('unauthorized')
    ? 'Voce nao tem permissao para acessar a auditoria.'
    : ''
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

    <section class="card filtros">
      <div class="campos">
        <label>
          Empresa ID
          <input v-model="filtros.empresaId" type="text" placeholder="Ex: 1" />
        </label>
        <label>
          Módulo
          <input v-model="filtros.modulo" type="text" placeholder="Ex: agenda" />
        </label>
        <label>
          Entidade
          <input v-model="filtros.entidade" type="text" placeholder="Ex: Agendamento" />
        </label>
        <label>
          Ação
          <input v-model="filtros.acao" type="text" placeholder="Ex: EXCLUIR" />
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
        <button class="botao principal" :disabled="carregando" @click="carregarAuditoria">
          Filtrar
        </button>
        <button class="botao secundario" :disabled="carregando" @click="limparFiltros">
          Limpar filtros
        </button>
      </div>
    </section>

    <section class="card">
      <p v-if="carregando">Carregando logs...</p>
      <p v-else-if="!logs.length" class="vazio">Nenhum log encontrado para os filtros informados.</p>

      <div v-else class="tabela-container">
        <table>
          <thead>
            <tr>
              <th>Data/hora</th>
              <th>Empresa</th>
              <th>Usuário</th>
              <th>Perfil</th>
              <th>Módulo</th>
              <th>Entidade</th>
              <th>Ação</th>
              <th>Descrição</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="log in logs" :key="log.id || `${log.dataHora}-${log.descricao}`">
              <td>{{ formatarDataHora(obterCampo(log, 'dataHora', 'criadoEm', 'createdAt')) }}</td>
              <td>{{ obterCampo(log, 'empresaNome', 'empresaId', 'empresa') }}</td>
              <td>{{ obterCampo(log, 'usuarioNome', 'usuarioEmail', 'usuario') }}</td>
              <td>{{ obterCampo(log, 'perfil', 'usuarioPerfil') }}</td>
              <td>{{ obterCampo(log, 'modulo') }}</td>
              <td>{{ obterCampo(log, 'entidade', 'tipoEntidade') }}</td>
              <td>{{ obterCampo(log, 'acao') }}</td>
              <td>{{ obterCampo(log, 'descricao') }}</td>
              <td>
                <button class="botao pequeno" :disabled="carregandoDetalhe" @click="abrirDetalhes(log)">
                  Detalhes
                </button>
              </td>
            </tr>
          </tbody>
        </table>
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
          <p><strong>Empresa:</strong> {{ obterCampo(detalhe, 'empresaNome', 'empresaId', 'empresa') }}</p>
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

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.vazio {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.tabela-container {
  overflow-x: auto;
}

table {
  width: 100%;
  border-collapse: collapse;
  min-width: 980px;
}

th,
td {
  border-bottom: 1px solid #e5e7eb;
  padding: 12px 10px;
  text-align: left;
  vertical-align: top;
}

th {
  color: #475569;
  font-size: 12px;
  text-transform: uppercase;
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
  .campos,
  .detalhes-grid,
  .blocos-json {
    grid-template-columns: 1fr;
  }
}
</style>
