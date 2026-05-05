<script setup>
import { computed, onMounted, ref } from 'vue'
import EmpresaForm from '@/components/EmpresaForm.vue'
import {
  buscarEmpresas,
  cadastrarEmpresa,
  atualizarEmpresa,
  atualizarAtivoEmpresa,
} from '@/services/api'

const empresas = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoEmpresa = ref('')
const mensagemSucessoStatus = ref('')
const atualizandoId = ref(null)
const empresaEditandoId = ref(null)
const filtros = ref({
  status: '',
  busca: '',
})

const empresa = ref(criarEmpresaInicial())

const empresasFiltradas = computed(() => {
  const termoBusca = normalizarTexto(filtros.value.busca)

  return empresas.value
    .filter((empresaItem) => {
      if (filtros.value.status === 'ativas' && !estaAtiva(empresaItem)) {
        return false
      }

      if (filtros.value.status === 'inativas' && estaAtiva(empresaItem)) {
        return false
      }

      if (termoBusca) {
        const nome = normalizarTexto(empresaItem.nome)
        const documento = normalizarTexto(empresaItem.documento)
        const email = normalizarTexto(empresaItem.email)

        if (!nome.includes(termoBusca) && !documento.includes(termoBusca) && !email.includes(termoBusca)) {
          return false
        }
      }

      return true
    })
    .sort((empresaA, empresaB) =>
      String(empresaA.nome || '').localeCompare(String(empresaB.nome || ''), 'pt-BR'),
    )
})

function criarEmpresaInicial() {
  return {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    ativo: true,
    horaAbertura: '',
    horaFechamento: '',
    atendeDomingo: false,
    atendeSegunda: true,
    atendeTerca: true,
    atendeQuarta: true,
    atendeQuinta: true,
    atendeSexta: true,
    atendeSabado: true,
  }
}

async function carregarEmpresas() {
  try {
    carregando.value = true
    erro.value = ''

    empresas.value = await buscarEmpresas()
  } catch (error) {
    erro.value = 'Nao foi possivel carregar as empresas.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarEmpresa() {
  try {
    erro.value = ''
    mensagemSucessoEmpresa.value = ''
    mensagemSucessoStatus.value = ''

    if (!empresa.value.nome.trim()) {
      erro.value = 'Informe o nome da empresa.'
      return
    }

    const dadosEmpresa = {
      nome: empresa.value.nome,
      documento: empresa.value.documento,
      telefone: empresa.value.telefone,
      email: empresa.value.email,
      endereco: empresa.value.endereco,
      ativo: Boolean(empresa.value.ativo),
      horaAbertura: empresa.value.horaAbertura,
      horaFechamento: empresa.value.horaFechamento,
      atendeDomingo: Boolean(empresa.value.atendeDomingo),
      atendeSegunda: Boolean(empresa.value.atendeSegunda),
      atendeTerca: Boolean(empresa.value.atendeTerca),
      atendeQuarta: Boolean(empresa.value.atendeQuarta),
      atendeQuinta: Boolean(empresa.value.atendeQuinta),
      atendeSexta: Boolean(empresa.value.atendeSexta),
      atendeSabado: Boolean(empresa.value.atendeSabado),
    }

    if (empresaEditandoId.value) {
      await atualizarEmpresa(empresaEditandoId.value, dadosEmpresa)
      mensagemSucessoEmpresa.value = 'Empresa atualizada com sucesso.'
    } else {
      await cadastrarEmpresa(dadosEmpresa)
      mensagemSucessoEmpresa.value = 'Empresa cadastrada com sucesso.'
    }

    cancelarEdicaoEmpresa(false)
    await carregarEmpresas()
  } catch (error) {
    erro.value = empresaEditandoId.value
      ? 'Nao foi possivel atualizar a empresa.'
      : 'Nao foi possivel cadastrar a empresa.'
    console.error(error)
  }
}

function editarEmpresa(empresaItem) {
  erro.value = ''
  mensagemSucessoEmpresa.value = ''
  mensagemSucessoStatus.value = ''
  empresaEditandoId.value = empresaItem.id
  empresa.value = {
    nome: empresaItem.nome || '',
    documento: empresaItem.documento || '',
    telefone: empresaItem.telefone || '',
    email: empresaItem.email || '',
    endereco: empresaItem.endereco || '',
    ativo: estaAtiva(empresaItem),
    horaAbertura: empresaItem.horaAbertura || '',
    horaFechamento: empresaItem.horaFechamento || '',
    atendeDomingo: Boolean(empresaItem.atendeDomingo),
    atendeSegunda: empresaItem.atendeSegunda !== false,
    atendeTerca: empresaItem.atendeTerca !== false,
    atendeQuarta: empresaItem.atendeQuarta !== false,
    atendeQuinta: empresaItem.atendeQuinta !== false,
    atendeSexta: empresaItem.atendeSexta !== false,
    atendeSabado: empresaItem.atendeSabado !== false,
  }
}

function cancelarEdicaoEmpresa(limparMensagens = true) {
  empresaEditandoId.value = null
  empresa.value = criarEmpresaInicial()

  if (limparMensagens) {
    mensagemSucessoEmpresa.value = ''
  }
}

async function alternarAtivoEmpresa(empresaItem) {
  try {
    atualizandoId.value = empresaItem.id
    erro.value = ''
    mensagemSucessoEmpresa.value = ''
    mensagemSucessoStatus.value = ''

    await atualizarAtivoEmpresa(empresaItem.id, !estaAtiva(empresaItem))
    await carregarEmpresas()

    mensagemSucessoStatus.value = estaAtiva(empresaItem)
      ? 'Empresa desativada com sucesso.'
      : 'Empresa ativada com sucesso.'
  } catch (error) {
    erro.value = 'Nao foi possivel atualizar o status da empresa.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function estaAtiva(empresaItem) {
  return empresaItem.ativo !== false
}

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
}

function limparFiltros() {
  filtros.value = {
    status: '',
    busca: '',
  }
}

function exibirValor(valor) {
  return valor || '-'
}

function exibirHorario(empresaItem) {
  if (!empresaItem.horaAbertura && !empresaItem.horaFechamento) {
    return '-'
  }

  return `${empresaItem.horaAbertura || '--:--'} as ${empresaItem.horaFechamento || '--:--'}`
}

function exibirDiasAtendimento(empresaItem) {
  const dias = [
    { campo: 'atendeDomingo', rotulo: 'Dom' },
    { campo: 'atendeSegunda', rotulo: 'Seg' },
    { campo: 'atendeTerca', rotulo: 'Ter' },
    { campo: 'atendeQuarta', rotulo: 'Qua' },
    { campo: 'atendeQuinta', rotulo: 'Qui' },
    { campo: 'atendeSexta', rotulo: 'Sex' },
    { campo: 'atendeSabado', rotulo: 'Sab' },
  ]
    .filter((dia) => empresaItem[dia.campo])
    .map((dia) => dia.rotulo)

  return dias.length ? dias.join(', ') : '-'
}

onMounted(() => {
  carregarEmpresas()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administracao</p>
        <h1>Empresas</h1>
        <p class="descricao">Gerencie as empresas disponiveis na plataforma.</p>
      </div>

      <button class="botao secundario" @click="carregarEmpresas">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucessoStatus" class="card sucesso-card">
      <p>{{ mensagemSucessoStatus }}</p>
    </section>

    <EmpresaForm
      v-model="empresa"
      :mensagem-sucesso="mensagemSucessoEmpresa"
      :modo-edicao="Boolean(empresaEditandoId)"
      @salvar="salvarEmpresa"
      @cancelar="cancelarEdicaoEmpresa"
    />

    <section class="secao-empresas">
      <section class="card filtros-empresas">
        <div class="titulo-card">
          <h2>Filtros</h2>
          <p>Refine a lista de empresas cadastradas.</p>
        </div>

        <div class="campos-filtros">
          <label>
            Status
            <select v-model="filtros.status">
              <option value="">Todas</option>
              <option value="ativas">Ativas</option>
              <option value="inativas">Inativas</option>
            </select>
          </label>

          <label>
            Buscar
            <input v-model="filtros.busca" type="text" placeholder="Busque por nome, documento ou email" />
          </label>

          <div class="acoes-filtros">
            <button class="botao secundario" @click="limparFiltros">Limpar filtros</button>
          </div>
        </div>
      </section>

      <div class="cabecalho-lista">
        <div>
          <h2>Empresas cadastradas</h2>
          <p>Lista de empresas retornadas pela API.</p>
        </div>

        <span class="contador">{{ empresasFiltradas.length }} empresa(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando empresas...</p>
      </section>

      <section v-else-if="empresas.length === 0" class="card">
        <p>Nenhuma empresa encontrada.</p>
      </section>

      <section v-else-if="empresasFiltradas.length === 0" class="card">
        <p>Nenhuma empresa encontrada para os filtros selecionados.</p>
      </section>

      <section v-else class="lista-empresas">
        <article v-for="empresaItem in empresasFiltradas" :key="empresaItem.id" class="card empresa-card">
          <div class="topo-card">
            <div>
              <h3>{{ empresaItem.nome }}</h3>
              <p class="documento">{{ exibirValor(empresaItem.documento) }}</p>
            </div>

            <span :class="['status', estaAtiva(empresaItem) ? 'ativo' : 'inativo']">
              {{ estaAtiva(empresaItem) ? 'Ativa' : 'Inativa' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>Documento:</strong> {{ exibirValor(empresaItem.documento) }}</p>
            <p><strong>Telefone:</strong> {{ exibirValor(empresaItem.telefone) }}</p>
            <p><strong>E-mail:</strong> {{ exibirValor(empresaItem.email) }}</p>
            <p><strong>Endereco:</strong> {{ exibirValor(empresaItem.endereco) }}</p>
            <p><strong>Horario:</strong> {{ exibirHorario(empresaItem) }}</p>
            <p><strong>Dias:</strong> {{ exibirDiasAtendimento(empresaItem) }}</p>
          </div>

          <div class="acoes">
            <button class="botao secundario" @click="editarEmpresa(empresaItem)">Editar</button>

            <button
              :class="['botao', estaAtiva(empresaItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === empresaItem.id"
              @click="alternarAtivoEmpresa(empresaItem)"
            >
              {{ estaAtiva(empresaItem) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>

          <p v-if="atualizandoId === empresaItem.id" class="atualizando">
            Atualizando empresa...
          </p>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.secao-empresas,
.filtros-empresas,
.empresa-card,
:deep(.formulario) {
  display: grid;
  gap: 16px;
}

.pagina {
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
.cabecalho-lista p,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.titulo-card h2,
:deep(.titulo-card h2) {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p,
:deep(.titulo-card p) {
  font-size: 14px;
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

.campos-filtros,
:deep(.campos) {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.campos-filtros {
  grid-template-columns: minmax(160px, 220px) minmax(260px, 1fr) auto;
  align-items: end;
}

.campos-filtros label,
:deep(label) {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

.campos-filtros input,
.campos-filtros select,
:deep(input),
:deep(select) {
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
.campos-filtros select:focus,
:deep(input:focus),
:deep(select:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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

:deep(.campo-grande) {
  grid-column: 1 / -1;
}

:deep(.secao-horario) {
  display: grid;
  gap: 16px;
}

:deep(.dias-atendimento) {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
}

.acoes-filtros,
.acoes,
:deep(.rodape-formulario) {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.acoes-filtros {
  align-items: end;
}

.lista-empresas {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.empresa-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.documento {
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

.secundario,
:deep(.secundario) {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover,
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

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .lista-empresas,
  .campos-filtros,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }

  :deep(.dias-atendimento) {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
