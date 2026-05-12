<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import {
  atualizarIndisponibilidade,
  buscarFuncionarios,
  buscarFuncionariosVinculadosAoServico,
  buscarIndisponibilidades,
  buscarServicos,
  criarIndisponibilidade,
  excluirIndisponibilidade,
  salvarFuncionariosVinculadosAoServico,
} from '@/services/api'

const abas = [
  { chave: 'EMPRESA', rotulo: 'Indisponibilidade da empresa' },
  { chave: 'FUNCIONARIO', rotulo: 'Indisponibilidade de funcionario' },
  { chave: 'SERVICO', rotulo: 'Indisponibilidade de servico' },
  { chave: 'VINCULOS', rotulo: 'Funcionarios por servico' },
]

const abaAtiva = ref('EMPRESA')
const indisponibilidades = ref([])
const funcionarios = ref([])
const servicos = ref([])
const funcionariosSelecionados = ref([])
const servicoVinculoId = ref('')
const carregando = ref(true)
const carregandoVinculos = ref(false)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const indisponibilidadeEditandoId = ref(null)
const ignorarResetAba = ref(false)
const formulario = ref(criarFormularioInicial('EMPRESA'))

const indisponibilidadesDaAba = computed(() =>
  indisponibilidades.value
    .filter((item) => normalizarTipo(item.tipo) === abaAtiva.value)
    .sort((itemA, itemB) => {
      const dataA = criarData(itemA.inicio || itemA.dataHoraInicio)?.getTime() || 0
      const dataB = criarData(itemB.inicio || itemB.dataHoraInicio)?.getTime() || 0

      return dataB - dataA
    }),
)

const servicosAtivos = computed(() => servicos.value.filter((servico) => servico.ativo !== false))
const funcionariosAtivos = computed(() =>
  funcionarios.value.filter((funcionario) => funcionario.ativo !== false),
)

const servicoVinculoSelecionado = computed(() =>
  servicos.value.find((servico) => Number(servico.id) === Number(servicoVinculoId.value)),
)

watch(abaAtiva, (tipo) => {
  if (ignorarResetAba.value) {
    ignorarResetAba.value = false
    return
  }

  erro.value = ''
  mensagemSucesso.value = ''
  indisponibilidadeEditandoId.value = null
  formulario.value = criarFormularioInicial(tipo)
})

watch(servicoVinculoId, () => {
  carregarVinculosDoServico()
})

function criarFormularioInicial(tipo) {
  return {
    tipo,
    funcionarioId: '',
    servicoId: '',
    inicio: '',
    fim: '',
    diaInteiro: false,
    motivo: '',
    ativo: true,
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    const [indisponibilidadesApi, funcionariosApi, servicosApi] = await Promise.all([
      buscarIndisponibilidades(),
      buscarFuncionarios(),
      buscarServicos(),
    ])

    indisponibilidades.value = Array.isArray(indisponibilidadesApi) ? indisponibilidadesApi : []
    funcionarios.value = Array.isArray(funcionariosApi) ? funcionariosApi : []
    servicos.value = Array.isArray(servicosApi) ? servicosApi : []
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar os dados de disponibilidade.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarIndisponibilidades() {
  try {
    erro.value = ''
    const dados = await buscarIndisponibilidades()
    indisponibilidades.value = Array.isArray(dados) ? dados : []
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar as indisponibilidades.')
    console.error(error)
  }
}

async function salvarIndisponibilidade() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    const mensagemValidacao = validarFormulario()

    if (mensagemValidacao) {
      erro.value = mensagemValidacao
      return
    }

    salvando.value = true
    const dados = montarPayloadIndisponibilidade()

    if (indisponibilidadeEditandoId.value) {
      await atualizarIndisponibilidade(indisponibilidadeEditandoId.value, dados)
      mensagemSucesso.value = 'Indisponibilidade atualizada com sucesso.'
    } else {
      await criarIndisponibilidade(dados)
      mensagemSucesso.value = 'Indisponibilidade salva com sucesso.'
    }

    cancelarEdicao(false)
    await carregarIndisponibilidades()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel salvar a indisponibilidade.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function excluirIndisponibilidadeSelecionada(item) {
  if (!window.confirm('Deseja excluir esta indisponibilidade?')) {
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''
    await excluirIndisponibilidade(item.id)
    mensagemSucesso.value = 'Indisponibilidade excluida com sucesso.'
    await carregarIndisponibilidades()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel excluir a indisponibilidade.')
    console.error(error)
  }
}

function editarIndisponibilidade(item) {
  const tipo = normalizarTipo(item.tipo)

  if (abaAtiva.value !== tipo) {
    ignorarResetAba.value = true
  }

  abaAtiva.value = tipo
  erro.value = ''
  mensagemSucesso.value = ''
  indisponibilidadeEditandoId.value = item.id
  formulario.value = {
    tipo,
    funcionarioId: item.funcionarioId || item.funcionario?.id || '',
    servicoId: item.servicoId || item.servico?.id || '',
    inicio: formatarParaInput(item.inicio || item.dataHoraInicio),
    fim: formatarParaInput(item.fim || item.dataHoraFim),
    diaInteiro: Boolean(item.diaInteiro),
    motivo: item.motivo || '',
    ativo: item.ativo !== false,
  }
}

function cancelarEdicao(limparMensagem = true) {
  indisponibilidadeEditandoId.value = null
  formulario.value = criarFormularioInicial(abaAtiva.value)

  if (limparMensagem) {
    mensagemSucesso.value = ''
  }
}

function validarFormulario() {
  if (abaAtiva.value === 'FUNCIONARIO' && !formulario.value.funcionarioId) {
    return 'Selecione um funcionario.'
  }

  if (abaAtiva.value === 'SERVICO' && !formulario.value.servicoId) {
    return 'Selecione um servico.'
  }

  if (!formulario.value.inicio) {
    return 'Informe a data inicial.'
  }

  if (!formulario.value.fim) {
    return 'Informe a data final.'
  }

  const inicio = criarData(obterInicioFormulario())
  const fim = criarData(obterFimFormulario())

  if (!inicio || !fim || fim <= inicio) {
    return 'A data final deve ser maior que a data inicial.'
  }

  return ''
}

function montarPayloadIndisponibilidade() {
  const tipo = abaAtiva.value

  return {
    tipo,
    funcionarioId: tipo === 'FUNCIONARIO' ? Number(formulario.value.funcionarioId) : null,
    servicoId: tipo === 'SERVICO' ? Number(formulario.value.servicoId) : null,
    inicio: obterInicioFormulario(),
    fim: obterFimFormulario(),
    diaInteiro: Boolean(formulario.value.diaInteiro),
    motivo: formulario.value.motivo.trim(),
    ativo: Boolean(formulario.value.ativo),
  }
}

function obterInicioFormulario() {
  if (!formulario.value.diaInteiro) {
    return formatarDataHoraApi(formulario.value.inicio)
  }

  return `${String(formulario.value.inicio).slice(0, 10)}T00:00:00`
}

function obterFimFormulario() {
  if (!formulario.value.diaInteiro) {
    return formatarDataHoraApi(formulario.value.fim)
  }

  return `${String(formulario.value.fim).slice(0, 10)}T23:59:00`
}

async function carregarVinculosDoServico() {
  funcionariosSelecionados.value = []

  if (!servicoVinculoId.value) {
    return
  }

  try {
    carregandoVinculos.value = true
    erro.value = ''
    const dados = await buscarFuncionariosVinculadosAoServico(servicoVinculoId.value)
    funcionariosSelecionados.value = normalizarIds(dados)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar os vinculos do servico.')
    console.error(error)
  } finally {
    carregandoVinculos.value = false
  }
}

async function salvarVinculos() {
  if (!servicoVinculoId.value) {
    erro.value = 'Selecione um servico.'
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''
    salvando.value = true
    await salvarFuncionariosVinculadosAoServico(
      servicoVinculoId.value,
      funcionariosSelecionados.value.map(Number),
    )
    mensagemSucesso.value = 'Vinculos salvos com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel salvar os vinculos.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function normalizarIds(dados) {
  const lista = Array.isArray(dados)
    ? dados
    : dados?.funcionarioIds || dados?.funcionarios || dados?.itens || []

  return lista
    .map((item) => Number(typeof item === 'object' ? item.id || item.funcionarioId : item))
    .filter((id) => Number.isFinite(id))
}

function alternarFuncionario(funcionarioId) {
  const id = Number(funcionarioId)

  if (funcionariosSelecionados.value.includes(id)) {
    funcionariosSelecionados.value = funcionariosSelecionados.value.filter((item) => item !== id)
    return
  }

  funcionariosSelecionados.value = [...funcionariosSelecionados.value, id]
}

function normalizarTipo(tipo) {
  const texto = String(tipo || 'EMPRESA').trim().toUpperCase()

  return ['EMPRESA', 'FUNCIONARIO', 'SERVICO'].includes(texto) ? texto : 'EMPRESA'
}

function obterNomeFuncionario(item) {
  const id = item.funcionarioId || item.funcionario?.id
  const funcionario = funcionarios.value.find((funcionarioItem) => Number(funcionarioItem.id) === Number(id))

  return item.funcionarioNome || item.funcionario?.nome || funcionario?.nome || '-'
}

function obterNomeServico(item) {
  const id = item.servicoId || item.servico?.id
  const servico = servicos.value.find((servicoItem) => Number(servicoItem.id) === Number(id))

  return item.servicoNome || item.servico?.nome || servico?.nome || '-'
}

function formatarPeriodo(item) {
  return `${formatarDataHora(item.inicio || item.dataHoraInicio)} ate ${formatarDataHora(
    item.fim || item.dataHoraFim,
  )}`
}

function formatarDataHora(valor) {
  const data = criarData(valor)

  if (!data) {
    return '-'
  }

  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function criarData(valor) {
  if (!valor) {
    return null
  }

  const data = new Date(valor)

  return Number.isNaN(data.getTime()) ? null : data
}

function formatarParaInput(valor) {
  return valor ? String(valor).slice(0, 16) : ''
}

function formatarDataHoraApi(valor) {
  const texto = String(valor || '').trim()

  return texto.length === 16 ? `${texto}:00` : texto
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Operacao</p>
        <h1>Disponibilidade</h1>
        <p class="descricao">
          Gerencie periodos de indisponibilidade e vinculos entre funcionarios e servicos.
        </p>
      </div>

      <button class="botao secundario" type="button" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <nav class="abas" aria-label="Secoes de disponibilidade">
      <button
        v-for="aba in abas"
        :key="aba.chave"
        type="button"
        :class="{ ativa: abaAtiva === aba.chave }"
        @click="abaAtiva = aba.chave"
      >
        {{ aba.rotulo }}
      </button>
    </nav>

    <section v-if="carregando" class="card">
      <p>Carregando disponibilidade...</p>
    </section>

    <template v-else>
      <section v-if="abaAtiva !== 'VINCULOS'" class="grade-conteudo">
        <section class="card formulario">
          <div class="titulo-card">
            <h2>{{ indisponibilidadeEditandoId ? 'Editar indisponibilidade' : 'Nova indisponibilidade' }}</h2>
            <p>Defina o periodo e mantenha a agenda protegida.</p>
          </div>

          <div class="campos">
            <label v-if="abaAtiva === 'FUNCIONARIO'">
              Funcionario *
              <select v-model="formulario.funcionarioId">
                <option value="">Selecione um funcionario</option>
                <option v-for="funcionario in funcionariosAtivos" :key="funcionario.id" :value="funcionario.id">
                  {{ funcionario.nome }}
                </option>
              </select>
            </label>

            <label v-if="abaAtiva === 'SERVICO'">
              Servico *
              <select v-model="formulario.servicoId">
                <option value="">Selecione um servico</option>
                <option v-for="servico in servicosAtivos" :key="servico.id" :value="servico.id">
                  {{ servico.nome }}
                </option>
              </select>
            </label>

            <label>
              Data/hora inicial *
              <input
                v-model="formulario.inicio"
                :type="formulario.diaInteiro ? 'date' : 'datetime-local'"
              />
            </label>

            <label>
              Data/hora final *
              <input
                v-model="formulario.fim"
                :type="formulario.diaInteiro ? 'date' : 'datetime-local'"
              />
            </label>

            <label class="campo-checkbox">
              <input v-model="formulario.diaInteiro" type="checkbox" />
              Dia inteiro
            </label>

            <label class="campo-checkbox">
              <input v-model="formulario.ativo" type="checkbox" />
              Ativo
            </label>

            <label class="campo-grande">
              Motivo
              <input v-model="formulario.motivo" type="text" placeholder="Ex: feriado, manutencao ou treinamento" />
            </label>
          </div>

          <div class="acoes">
            <button class="botao principal" type="button" :disabled="salvando" @click="salvarIndisponibilidade">
              {{ salvando ? 'Salvando...' : 'Salvar indisponibilidade' }}
            </button>
            <button
              v-if="indisponibilidadeEditandoId"
              class="botao secundario"
              type="button"
              @click="cancelarEdicao"
            >
              Cancelar
            </button>
          </div>
        </section>

        <section class="lista-wrapper">
          <div class="cabecalho-lista">
            <div>
              <h2>Indisponibilidades</h2>
              <p>Periodos cadastrados para a secao selecionada.</p>
            </div>

            <span class="contador">{{ indisponibilidadesDaAba.length }} registro(s)</span>
          </div>

          <section v-if="indisponibilidadesDaAba.length === 0" class="card">
            <p>Nenhuma indisponibilidade cadastrada.</p>
          </section>

          <section v-else class="lista">
            <article v-for="item in indisponibilidadesDaAba" :key="item.id" class="card item-card">
              <div class="topo-card">
                <div>
                  <span :class="['badge', normalizarTipo(item.tipo).toLowerCase()]">
                    {{ normalizarTipo(item.tipo) === 'EMPRESA' ? 'Empresa' : normalizarTipo(item.tipo) === 'FUNCIONARIO' ? 'Funcionario' : 'Servico' }}
                  </span>
                  <h3 v-if="normalizarTipo(item.tipo) === 'EMPRESA'">Tipo: Empresa</h3>
                  <h3 v-else-if="normalizarTipo(item.tipo) === 'FUNCIONARIO'">
                    {{ obterNomeFuncionario(item) }}
                  </h3>
                  <h3 v-else>{{ obterNomeServico(item) }}</h3>
                </div>

                <span :class="['status', item.ativo !== false ? 'ativo' : 'inativo']">
                  {{ item.ativo !== false ? 'Ativo' : 'Inativo' }}
                </span>
              </div>

              <div class="detalhes">
                <p><strong>Periodo:</strong> {{ formatarPeriodo(item) }}</p>
                <p><strong>Motivo:</strong> {{ item.motivo || '-' }}</p>
                <p><strong>Situacao:</strong> {{ item.ativo !== false ? 'Ativo' : 'Inativo' }}</p>
              </div>

              <div class="acoes">
                <button class="botao secundario" type="button" @click="editarIndisponibilidade(item)">
                  Editar
                </button>
                <button class="botao perigo" type="button" @click="excluirIndisponibilidadeSelecionada(item)">
                  Excluir
                </button>
              </div>
            </article>
          </section>
        </section>
      </section>

      <section v-else class="card vinculos-card">
        <div class="titulo-card">
          <h2>Funcionarios por servico</h2>
          <p>
            Se nenhum funcionario for vinculado a este servico, todos os funcionarios ativos poderao
            executa-lo. Quando houver pelo menos um vinculo, somente os funcionarios selecionados
            poderao atender este servico.
          </p>
        </div>

        <label class="servico-vinculo">
          Servico
          <select v-model="servicoVinculoId">
            <option value="">Selecione um servico</option>
            <option v-for="servico in servicosAtivos" :key="servico.id" :value="servico.id">
              {{ servico.nome }}
            </option>
          </select>
        </label>

        <section v-if="servicoVinculoId" class="lista-funcionarios">
          <div class="cabecalho-lista">
            <div>
              <h2>{{ servicoVinculoSelecionado?.nome || 'Servico selecionado' }}</h2>
              <p>{{ carregandoVinculos ? 'Carregando vinculos...' : 'Marque quem pode executar este servico.' }}</p>
            </div>
          </div>

          <label
            v-for="funcionario in funcionariosAtivos"
            :key="funcionario.id"
            class="funcionario-checkbox"
          >
            <input
              type="checkbox"
              :checked="funcionariosSelecionados.includes(Number(funcionario.id))"
              @change="alternarFuncionario(funcionario.id)"
            />
            <span>{{ funcionario.nome }}</span>
          </label>
        </section>

        <div class="acoes">
          <button class="botao principal" type="button" :disabled="salvando" @click="salvarVinculos">
            {{ salvando ? 'Salvando...' : 'Salvar vinculos' }}
          </button>
        </div>
      </section>
    </template>
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
.cabecalho-lista p,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.abas {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.abas button {
  border: 1px solid #dbe3ef;
  background: white;
  color: #334155;
  border-radius: 8px;
  padding: 10px 12px;
  cursor: pointer;
  font-weight: 800;
}

.abas button.ativa {
  border-color: #2563eb;
  background: #dbeafe;
  color: #1d4ed8;
}

.grade-conteudo {
  display: grid;
  gap: 20px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.formulario,
.vinculos-card,
.lista-wrapper {
  display: grid;
  gap: 16px;
}

.titulo-card h2,
.cabecalho-lista h2 {
  margin: 0;
  color: #111827;
  font-weight: 800;
}

.titulo-card h2 {
  font-size: 22px;
}

.cabecalho-lista h2 {
  font-size: 26px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.campo-checkbox {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

.campo-grande {
  grid-column: 1 / -1;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.item-card {
  display: grid;
  gap: 14px;
}

.item-card h3 {
  margin: 8px 0 0;
  font-size: 20px;
  font-weight: 800;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
}

.badge,
.status,
.contador {
  display: inline-flex;
  align-items: center;
  width: fit-content;
  white-space: nowrap;
  font-weight: 800;
}

.badge,
.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  text-transform: uppercase;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-size: 14px;
}

.badge.empresa {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.funcionario {
  background: #fef3c7;
  color: #92400e;
}

.badge.servico {
  background: #ede9fe;
  color: #6d28d9;
}

.status.ativo {
  background: #dcfce7;
  color: #15803d;
}

.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.botao {
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

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
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

.servico-vinculo {
  max-width: 460px;
}

.lista-funcionarios {
  display: grid;
  gap: 12px;
}

.funcionario-checkbox {
  grid-template-columns: auto 1fr;
  align-items: center;
  gap: 10px;
  padding: 12px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .topo-card {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos,
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
