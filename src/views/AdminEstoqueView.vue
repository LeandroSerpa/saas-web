<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ativarUnidadeEstoqueAdmin,
  atualizarUnidadeEstoqueAdmin,
  buscarUnidadesEstoqueAdmin,
  criarUnidadeEstoqueAdmin,
  desativarUnidadeEstoqueAdmin,
  notificarUnidadesEstoqueAtualizadas,
  obterMensagemAmigavelErro,
} from '@/services/api'

const unidades = ref([])
const carregando = ref(true)
const salvando = ref(false)
const atualizandoId = ref(null)
const erro = ref('')
const sucesso = ref('')
const unidadeEditandoId = ref(null)
const filtros = ref(criarFiltrosIniciais())
const formulario = ref(criarFormularioInicial())

const unidadesFiltradas = computed(() => {
  const termo = normalizarTexto(filtros.value.busca)

  return unidades.value.filter((unidade) => {
    const statusAtende =
      !filtros.value.status ||
      (filtros.value.status === 'ATIVO' && unidade.ativo !== false) ||
      (filtros.value.status === 'INATIVO' && unidade.ativo === false)
    const buscaAtende =
      !termo ||
      [unidade.codigo, unidade.nome, unidade.descricao].some((campo) =>
        normalizarTexto(campo).includes(termo),
      )

    return statusAtende && buscaAtende
  })
})

function criarFiltrosIniciais() {
  return {
    busca: '',
    status: '',
  }
}

function criarFormularioInicial() {
  return {
    codigo: '',
    nome: '',
    descricao: '',
    ordem: 0,
    ativo: true,
  }
}

async function carregarUnidades() {
  try {
    carregando.value = true
    erro.value = ''

    const resposta = await buscarUnidadesEstoqueAdmin(montarFiltrosApi())
    unidades.value = normalizarLista(resposta).map(normalizarUnidade).sort(ordenarUnidades)
  } catch (errorAtual) {
    erro.value = obterMensagemErroUnidade(errorAtual, 'Não foi possível carregar as unidades de estoque.')
  } finally {
    carregando.value = false
  }
}

function montarFiltrosApi() {
  return Object.fromEntries(
    Object.entries({
      busca: filtros.value.busca,
      ativo: filtros.value.status ? filtros.value.status === 'ATIVO' : '',
    }).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim() !== ''),
  )
}

function normalizarLista(valor) {
  if (Array.isArray(valor)) return valor
  if (!valor || typeof valor !== 'object') return []

  return (
    valor.content ||
    valor.items ||
    valor.itens ||
    valor.data?.content ||
    valor.data?.items ||
    valor.data?.itens ||
    valor.data ||
    valor.resultado ||
    valor.unidades ||
    []
  )
}

function normalizarUnidade(item) {
  const status = String(item?.status || '').toUpperCase()
  const ativo = item?.ativo
  const statusInativo = ['INATIVO', 'INATIVA', 'INACTIVE', 'DESATIVADO', 'DESATIVADA'].includes(status)

  return {
    id: item?.id || item?.unidadeId || item?.codigo,
    codigo: String(item?.codigo || item?.valor || item?.sigla || '').trim().toUpperCase(),
    nome: String(item?.nome || item?.descricao || '').trim(),
    descricao: String(item?.descricao || item?.detalhes || '').trim(),
    ordem: Number(item?.ordem ?? item?.posicao ?? 0),
    ativo: ativo === false || String(ativo).toLowerCase() === 'false' ? false : !statusInativo,
  }
}

function ordenarUnidades(a, b) {
  return (Number(a.ordem) || 0) - (Number(b.ordem) || 0) || a.nome.localeCompare(b.nome, 'pt-BR')
}

function normalizarTexto(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function obterMensagemErroUnidade(errorAtual, fallback) {
  const mensagem = obterMensagemAmigavelErro(errorAtual, fallback)
  const texto = normalizarTexto(mensagem)

  if (texto.includes('duplic') || texto.includes('ja existe') || texto.includes('já existe')) {
    return 'Já existe uma unidade cadastrada com este código ou nome.'
  }

  if (texto.includes('codigo') || texto.includes('código')) {
    return 'Código inválido. Use uma sigla curta, sem espaços ou caracteres especiais.'
  }

  if (texto.includes('nao encontrada') || texto.includes('não encontrada') || errorAtual?.status === 404) {
    return 'Unidade não encontrada. Atualize a lista e tente novamente.'
  }

  if (texto.includes('permiss') || errorAtual?.status === 403) {
    return 'Permissão negada para alterar unidades de estoque.'
  }

  if (texto.includes('plano') || texto.includes('modulo') || texto.includes('módulo')) {
    return 'O módulo de estoque não está disponível no plano atual.'
  }

  return mensagem
}

async function aplicarFiltros() {
  await carregarUnidades()
}

async function limparFiltros() {
  filtros.value = criarFiltrosIniciais()
  await carregarUnidades()
}

async function salvarUnidade() {
  try {
    erro.value = ''
    sucesso.value = ''

    if (!formulario.value.codigo.trim()) {
      erro.value = 'Informe o código da unidade.'
      return
    }

    if (!formulario.value.nome.trim()) {
      erro.value = 'Informe o nome da unidade.'
      return
    }

    salvando.value = true
    const payload = {
      codigo: formulario.value.codigo.trim().toUpperCase(),
      nome: formulario.value.nome.trim(),
      descricao: formulario.value.descricao.trim(),
      ordem: Number(formulario.value.ordem) || 0,
      ativo: formulario.value.ativo !== false,
    }

    if (unidadeEditandoId.value) {
      await atualizarUnidadeEstoqueAdmin(unidadeEditandoId.value, payload)
      sucesso.value = 'Unidade atualizada com sucesso.'
    } else {
      await criarUnidadeEstoqueAdmin(payload)
      sucesso.value = 'Unidade cadastrada com sucesso.'
    }

    cancelarEdicao(false)
    notificarUnidadesEstoqueAtualizadas()
    await carregarUnidades()
  } catch (errorAtual) {
    erro.value = obterMensagemErroUnidade(
      errorAtual,
      unidadeEditandoId.value ? 'Não foi possível atualizar a unidade.' : 'Não foi possível cadastrar a unidade.',
    )
  } finally {
    salvando.value = false
  }
}

function editarUnidade(unidade) {
  unidadeEditandoId.value = unidade.id
  erro.value = ''
  sucesso.value = ''
  formulario.value = {
    codigo: unidade.codigo,
    nome: unidade.nome,
    descricao: unidade.descricao,
    ordem: unidade.ordem,
    ativo: unidade.ativo !== false,
  }
}

function cancelarEdicao(limparMensagem = true) {
  unidadeEditandoId.value = null
  formulario.value = criarFormularioInicial()

  if (limparMensagem) {
    sucesso.value = ''
  }
}

async function alternarStatus(unidade) {
  try {
    erro.value = ''
    sucesso.value = ''
    atualizandoId.value = unidade.id

    if (unidade.ativo !== false) {
      await desativarUnidadeEstoqueAdmin(unidade.id)
      sucesso.value = 'Unidade inativada com sucesso.'
    } else {
      await ativarUnidadeEstoqueAdmin(unidade.id)
      sucesso.value = 'Unidade ativada com sucesso.'
    }

    notificarUnidadesEstoqueAtualizadas()
    await carregarUnidades()
  } catch (errorAtual) {
    erro.value = obterMensagemErroUnidade(errorAtual, 'Não foi possível alterar o status da unidade.')
  } finally {
    atualizandoId.value = null
  }
}

onMounted(() => {
  carregarUnidades()
})
</script>

<template>
  <main class="pagina admin-estoque-view">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração NuvemMais</p>
        <h1>Administração de Estoque</h1>
        <p class="descricao">Gerencie configurações globais do módulo Estoque.</p>
      </div>

      <button class="botao secundario" :disabled="carregando" @click="carregarUnidades">
        {{ carregando ? 'Atualizando...' : 'Atualizar dados' }}
      </button>
    </header>

    <section v-if="erro" class="card feedback erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="sucesso" class="card feedback sucesso">
      <p>{{ sucesso }}</p>
    </section>

    <form class="card formulario" @submit.prevent="salvarUnidade">
      <div class="titulo-card">
        <h2>{{ unidadeEditandoId ? 'Editar unidade' : 'Nova unidade' }}</h2>
        <p>Unidades cadastradas aqui ficam disponíveis para os produtos das empresas.</p>
      </div>

      <div class="campos">
        <label>
          Código *
          <input v-model="formulario.codigo" type="text" maxlength="12" placeholder="UN, CX, KG" />
        </label>
        <label>
          Nome *
          <input v-model="formulario.nome" type="text" placeholder="Unidade, Caixa, Quilograma" />
        </label>
        <label class="campo-grande">
          Descrição
          <textarea v-model="formulario.descricao" rows="3" placeholder="Descrição opcional"></textarea>
        </label>
        <label>
          Ordem
          <input v-model="formulario.ordem" type="number" step="1" />
          <small>Define a posição da unidade na lista e nos combos. Menores números aparecem primeiro.</small>
        </label>
        <label class="campo-checkbox">
          <input v-model="formulario.ativo" type="checkbox" />
          Ativo
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="salvando">
          {{ salvando ? 'Salvando...' : unidadeEditandoId ? 'Salvar alterações' : 'Cadastrar unidade' }}
        </button>
        <button v-if="unidadeEditandoId" type="button" class="botao secundario" @click="cancelarEdicao">
          Cancelar edição
        </button>
      </div>
    </form>

    <form class="card filtros" @submit.prevent="aplicarFiltros">
      <div class="titulo-card">
        <h2>Unidades de Estoque</h2>
        <p>Filtre e mantenha os tipos globais usados no cadastro de produtos.</p>
      </div>

      <div class="campos filtros-campos">
        <label>
          Busca
          <input v-model="filtros.busca" type="search" placeholder="Código, nome ou descrição" />
        </label>
        <label>
          Status
          <select v-model="filtros.status">
            <option value="">Todos</option>
            <option value="ATIVO">Ativos</option>
            <option value="INATIVO">Inativos</option>
          </select>
        </label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="carregando">
          {{ carregando ? 'Filtrando...' : 'Aplicar filtros' }}
        </button>
        <button type="button" class="botao secundario" @click="limparFiltros">Limpar filtros</button>
      </div>
    </form>

    <section v-if="carregando" class="card estado">
      <p>Carregando unidades...</p>
    </section>

    <section v-else-if="!unidadesFiltradas.length" class="card estado">
      <p>Nenhuma unidade encontrada.</p>
    </section>

    <section v-else class="card tabela-card">
      <div class="tabela-scroll">
        <table>
          <thead>
            <tr>
              <th>Código</th>
              <th>Nome</th>
              <th>Descrição</th>
              <th>Ordem</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="unidade in unidadesFiltradas" :key="unidade.id || unidade.codigo">
              <td><strong>{{ unidade.codigo }}</strong></td>
              <td>{{ unidade.nome }}</td>
              <td>{{ unidade.descricao || '-' }}</td>
              <td>{{ unidade.ordem }}</td>
              <td>
                <span :class="['status', unidade.ativo !== false ? 'ativo' : 'inativo']">
                  {{ unidade.ativo !== false ? 'Ativa' : 'Inativa' }}
                </span>
              </td>
              <td>
                <div class="acoes-tabela">
                  <button class="botao secundario" type="button" @click="editarUnidade(unidade)">Editar</button>
                  <button
                    :class="['botao', unidade.ativo !== false ? 'perigo' : 'sucesso-botao']"
                    type="button"
                    :disabled="atualizandoId === unidade.id"
                    @click="alternarStatus(unidade)"
                  >
                    {{ unidade.ativo !== false ? 'Inativar' : 'Ativar' }}
                  </button>
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
.admin-estoque-view,
.formulario,
.filtros {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.acoes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 { font-size: 32px; font-weight: 800; }
h2 { font-size: 24px; font-weight: 800; }

.descricao,
.titulo-card p { color: #64748b; }

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.feedback.erro { border-color: #fecaca; background: #fef2f2; color: #991b1b; }
.feedback.sucesso { border-color: #bbf7d0; background: #f0fdf4; color: #166534; }
.estado { color: #64748b; font-weight: 700; }

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(180px, 1fr));
  gap: 14px;
}

.filtros-campos { grid-template-columns: repeat(2, minmax(180px, 1fr)); }
.campo-grande { grid-column: 1 / -1; }

label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  box-sizing: border-box;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  background: white;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 12px 14px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: #f8fafc;
}

.campo-checkbox input { width: auto; }

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.botao:disabled { opacity: 0.6; cursor: not-allowed; }
.principal { background: #2563eb; }
.secundario { background: #0f172a; }
.perigo { background: #dc2626; }
.sucesso-botao { background: #15803d; }

.tabela-card { padding: 0; overflow: hidden; }
.tabela-scroll { overflow-x: auto; }
table { width: 100%; min-width: 760px; border-collapse: collapse; }
th,
td { padding: 14px 16px; border-bottom: 1px solid #e5e7eb; text-align: left; vertical-align: top; }
th { color: #475569; font-size: 12px; text-transform: uppercase; }
tbody tr:last-child td { border-bottom: none; }

.status {
  display: inline-flex;
  width: fit-content;
  border-radius: 999px;
  padding: 7px 11px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.ativo { background: #dcfce7; color: #166534; }
.status.inativo { background: #fee2e2; color: #b91c1c; }
.acoes-tabela { display: flex; gap: 8px; flex-wrap: wrap; }

@media (max-width: 900px) {
  .cabecalho-pagina,
  .acoes {
    align-items: flex-start;
    flex-direction: column;
  }

  .campos,
  .filtros-campos {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .card { padding: 18px; }
  .acoes { display: grid; grid-template-columns: 1fr; width: 100%; }
  .botao { width: 100%; }
}
</style>
