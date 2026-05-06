<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  buscarDisponibilidadePublica,
  buscarEmpresaPublica,
  buscarFuncionariosPublicos,
  buscarServicosPublicos,
  criarAgendamentoPublico,
} from '@/services/api'

const route = useRoute()
const slug = computed(() => String(route.params.slug || '').trim())

const empresa = ref(null)
const servicos = ref([])
const funcionarios = ref([])
const disponibilidade = ref(null)
const carregando = ref(true)
const carregandoDisponibilidade = ref(false)
const enviando = ref(false)
const indisponivel = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const agendamento = ref(criarAgendamentoInicial())

const servicoSelecionado = computed(() =>
  servicos.value.find((servico) => Number(servico.id) === Number(agendamento.value.servicoId)),
)

const funcionarioSelecionado = computed(() =>
  funcionarios.value.find(
    (funcionario) => Number(funcionario.id) === Number(agendamento.value.funcionarioId),
  ),
)

const duracaoMinutos = computed(() => obterDuracaoValida(servicoSelecionado.value))

const dataHoraFimSelecionada = computed(() => {
  if (!agendamento.value.dataHoraInicio || !duracaoMinutos.value) {
    return null
  }

  return calcularDataHoraFim(agendamento.value.dataHoraInicio, duracaoMinutos.value)
})

const terminoPrevisto = computed(() =>
  dataHoraFimSelecionada.value ? formatarDataHoraPreview(dataHoraFimSelecionada.value) : '',
)

const dataAtendimentoFormatada = computed(() =>
  agendamento.value.dataAtendimento ? formatarDataAtendimento(agendamento.value.dataAtendimento) : '',
)

const inicioSelecionado = computed(() => {
  const horario = String(agendamento.value.dataHoraInicio || '').slice(11, 16)

  return horario || ''
})

const horariosDisponiveis = computed(() =>
  normalizarListaHorarios(disponibilidade.value?.horariosDisponiveis).map((item) => ({
    valor: item.valor,
    label: item.label,
    ocupado: false,
  })),
)

const horariosOcupados = computed(() =>
  normalizarListaHorarios(disponibilidade.value?.horariosOcupados)
    .filter((item) => !horariosDisponiveis.value.some((horario) => horario.valor === item.valor))
    .map((item) => ({
      valor: item.valor,
      label: item.label,
      ocupado: true,
    })),
)

const mensagemDisponibilidade = computed(() => {
  if (!disponibilidade.value) {
    return ''
  }

  const mensagem = String(disponibilidade.value.mensagem || '').trim()

  if (disponibilidade.value.empresaAtendeNoDia === false) {
    return mensagem || `A empresa ${empresa.value?.nome || ''} não atende neste dia.`
  }

  if (disponibilidade.value.funcionarioAtendeNoDia === false) {
    return mensagem || `O funcionário ${funcionarioSelecionado.value?.nome || ''} não atende neste dia.`
  }

  if (horariosDisponiveis.value.length === 0) {
    return mensagem || 'Nenhum horário disponível para esta data. Escolha outro dia.'
  }

  return ''
})

const mensagemOrientacaoHorarios = computed(() => {
  if (!agendamento.value.servicoId) {
    return 'Escolha um serviço para consultar os horários.'
  }

  if (!agendamento.value.funcionarioId) {
    return 'Escolha um funcionário para consultar os horários.'
  }

  if (!agendamento.value.dataAtendimento) {
    return 'Escolha uma data para consultar os horários.'
  }

  if (carregandoDisponibilidade.value) {
    return 'Buscando horários disponíveis...'
  }

  if (mensagemDisponibilidade.value) {
    return mensagemDisponibilidade.value
  }

  if (horariosDisponiveis.value.length > 0) {
    return agendamento.value.dataHoraInicio
      ? 'Horário selecionado. Você já pode confirmar o agendamento.'
      : 'Escolha um dos horários disponíveis abaixo.'
  }

  return 'Nenhum horário disponível para esta data. Tente escolher outro dia.'
})

const resumoVisivel = computed(() =>
  Boolean(
    agendamento.value.servicoId ||
      agendamento.value.funcionarioId ||
      agendamento.value.dataAtendimento ||
      agendamento.value.dataHoraInicio,
  ),
)

const formularioCompleto = computed(() =>
  Boolean(
    agendamento.value.nomeCliente.trim() &&
      agendamento.value.telefoneCliente.trim() &&
      agendamento.value.servicoId &&
      agendamento.value.funcionarioId &&
      agendamento.value.dataAtendimento &&
      agendamento.value.dataHoraInicio,
  ),
)

watch(
  () => [
    agendamento.value.servicoId,
    agendamento.value.funcionarioId,
    agendamento.value.dataAtendimento,
  ],
  () => {
    agendamento.value.dataHoraInicio = ''
    carregarDisponibilidade()
  },
)

function criarAgendamentoInicial() {
  return {
    nomeCliente: '',
    telefoneCliente: '',
    emailCliente: '',
    servicoId: '',
    funcionarioId: '',
    dataAtendimento: '',
    dataHoraInicio: '',
    observacao: '',
  }
}

async function carregarDadosPublicos() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    indisponivel.value = false

    const empresaApi = await buscarEmpresaPublica(slug.value)

    if (!empresaApi || empresaApi.agendamentoPublicoAtivo === false) {
      indisponivel.value = true
      return
    }

    empresa.value = empresaApi

    const [servicosApi, funcionariosApi] = await Promise.all([
      buscarServicosPublicos(slug.value),
      buscarFuncionariosPublicos(slug.value),
    ])

    servicos.value = Array.isArray(servicosApi) ? servicosApi : []
    funcionarios.value = Array.isArray(funcionariosApi) ? funcionariosApi : []
  } catch (error) {
    indisponivel.value = true
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarDisponibilidade() {
  disponibilidade.value = null

  if (
    !slug.value ||
    !agendamento.value.servicoId ||
    !agendamento.value.funcionarioId ||
    !agendamento.value.dataAtendimento
  ) {
    return
  }

  try {
    carregandoDisponibilidade.value = true
    erro.value = ''
    disponibilidade.value = await buscarDisponibilidadePublica(
      slug.value,
      agendamento.value.servicoId,
      agendamento.value.funcionarioId,
      agendamento.value.dataAtendimento,
    )
  } catch (error) {
    const mensagemApi = typeof error?.message === 'string' ? error.message.trim() : ''

    erro.value = mensagemApi || 'Não foi possível buscar os horários disponíveis.'
    console.error(error)
  } finally {
    carregandoDisponibilidade.value = false
  }
}

function selecionarHorario(horario) {
  if (horario.ocupado) {
    return
  }

  agendamento.value.dataHoraInicio = `${agendamento.value.dataAtendimento}T${horario.valor}:00`
  erro.value = ''
  mensagemSucesso.value = ''
}

async function enviarAgendamento() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!agendamento.value.nomeCliente.trim()) {
      erro.value = 'Informe o nome do cliente.'
      return
    }

    if (!agendamento.value.telefoneCliente.trim()) {
      erro.value = 'Informe o telefone do cliente.'
      return
    }

    if (!agendamento.value.servicoId) {
      erro.value = 'Selecione um serviço.'
      return
    }

    if (!agendamento.value.funcionarioId) {
      erro.value = 'Selecione um funcionário.'
      return
    }

    if (!agendamento.value.dataAtendimento) {
      erro.value = 'Selecione uma data.'
      return
    }

    if (!agendamento.value.dataHoraInicio) {
      erro.value = 'Selecione um horário disponível.'
      return
    }

    enviando.value = true

    await criarAgendamentoPublico(slug.value, {
      clienteNome: agendamento.value.nomeCliente.trim(),
      clienteTelefone: agendamento.value.telefoneCliente.trim(),
      clienteEmail: agendamento.value.emailCliente.trim(),
      servicoId: Number(agendamento.value.servicoId),
      funcionarioId: Number(agendamento.value.funcionarioId),
      dataHoraInicio: agendamento.value.dataHoraInicio,
      observacao: agendamento.value.observacao.trim(),
    })

    agendamento.value = criarAgendamentoInicial()
    disponibilidade.value = null
    mensagemSucesso.value = 'Agendamento solicitado com sucesso.'
    await carregarDisponibilidade()
  } catch (error) {
    const mensagemApi = typeof error?.message === 'string' ? error.message.trim() : ''

    erro.value = mensagemApi || 'Não foi possível realizar o agendamento.'
    console.error(error)
  } finally {
    enviando.value = false
  }
}

function obterDuracaoValida(servico) {
  const duracao = Number(servico?.duracaoMinutos)

  if (!Number.isFinite(duracao) || duracao <= 0) {
    return null
  }

  return duracao
}

function calcularDataHoraFim(dataHoraInicio, duracao) {
  const inicio = dataHoraInicio instanceof Date ? dataHoraInicio : new Date(dataHoraInicio)

  if (Number.isNaN(inicio.getTime())) {
    return null
  }

  return new Date(inicio.getTime() + duracao * 60000)
}

function normalizarListaHorarios(horarios) {
  return Array.isArray(horarios)
    ? horarios.map(normalizarHorarioDisponibilidade).filter((horario) => horario.valor)
    : []
}

function normalizarHorarioDisponibilidade(horario) {
  if (horario && typeof horario === 'object') {
    const valor = extrairHorario(
      horario.horario || horario.hora || horario.inicio || horario.dataHoraInicio || '',
    )

    return {
      valor,
      label: String(horario.label || horario.texto || valor),
    }
  }

  const valor = extrairHorario(horario)

  return {
    valor,
    label: valor,
  }
}

function extrairHorario(valor) {
  const texto = String(valor || '')
  const horario = texto.match(/\b\d{2}:\d{2}\b/)

  return horario ? horario[0] : ''
}

function horarioSelecionado(horario) {
  return String(agendamento.value.dataHoraInicio || '').slice(11, 16) === horario.valor
}

function formatarDataHoraPreview(data) {
  return data.toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function formatarDataAtendimento(data) {
  const [ano, mes, dia] = String(data || '').split('-').map(Number)

  if (!ano || !mes || !dia) {
    return ''
  }

  return new Date(ano, mes - 1, dia).toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

function formatarPreco(preco) {
  if (preco === null || preco === undefined) {
    return 'R$ 0,00'
  }

  return Number(preco).toLocaleString('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  })
}

onMounted(() => {
  carregarDadosPublicos()
})
</script>

<template>
  <main class="pagina-publica">
    <section v-if="carregando" class="card estado">
      <p>Carregando agendamento...</p>
    </section>

    <section v-else-if="indisponivel" class="card estado">
      <h1>Agendamento indisponível.</h1>
      <p>Entre em contato diretamente com a empresa.</p>
    </section>

    <section v-else class="conteudo-publico">
      <header class="cabecalho-publico card">
        <div>
          <p class="subtitulo">Agendamento online</p>
          <h1>{{ empresa?.nome || 'Agendamento' }}</h1>
          <p v-if="empresa?.mensagemPublica" class="mensagem-publica">
            {{ empresa.mensagemPublica }}
          </p>
        </div>

        <div class="dados-empresa">
          <p v-if="empresa?.telefone"><strong>Telefone:</strong> {{ empresa.telefone }}</p>
          <p v-if="empresa?.email"><strong>E-mail:</strong> {{ empresa.email }}</p>
          <p v-if="empresa?.endereco"><strong>Endereço:</strong> {{ empresa.endereco }}</p>
        </div>
      </header>

      <section v-if="erro" class="card erro">
        <p>{{ erro }}</p>
      </section>

      <section v-if="mensagemSucesso" class="card sucesso-card">
        <p>{{ mensagemSucesso }}</p>
      </section>

      <section class="card formulario">
        <div class="titulo-card">
          <h2>Dados do agendamento</h2>
          <p>Preencha os dados abaixo para solicitar seu atendimento.</p>
        </div>

        <div class="campos">
          <label>
            Nome do cliente *
            <input v-model="agendamento.nomeCliente" type="text" placeholder="Ex: Ana Costa" />
          </label>

          <label>
            Telefone *
            <input
              v-model="agendamento.telefoneCliente"
              type="text"
              placeholder="Ex: (21) 99999-9999"
            />
          </label>

          <label>
            E-mail
            <input
              v-model="agendamento.emailCliente"
              type="email"
              placeholder="Ex: cliente@email.com"
            />
          </label>

          <label>
            Serviço *
            <select v-model="agendamento.servicoId">
              <option value="">Selecione um serviço</option>
              <option v-for="servico in servicos" :key="servico.id" :value="servico.id">
                {{ servico.nome }} - {{ formatarPreco(servico.preco) }}
              </option>
            </select>
          </label>

          <label>
            Funcionário *
            <select v-model="agendamento.funcionarioId">
              <option value="">Selecione um funcionário</option>
              <option
                v-for="funcionario in funcionarios"
                :key="funcionario.id"
                :value="funcionario.id"
              >
                {{ funcionario.nome }}
              </option>
            </select>
          </label>

          <label>
            Data do atendimento *
            <input v-model="agendamento.dataAtendimento" type="date" />
          </label>

          <section class="campo-grande horarios">
            <div class="titulo-horarios">
              <h3>Horários disponíveis</h3>
              <p>{{ mensagemOrientacaoHorarios }}</p>
            </div>

            <div v-if="horariosDisponiveis.length" class="grade-horarios">
              <button
                v-for="horario in horariosDisponiveis"
                :key="horario.valor"
                type="button"
                class="horario"
                :class="{ selecionado: horarioSelecionado(horario) }"
                @click="selecionarHorario(horario)"
              >
                {{ horario.label }}
              </button>
            </div>

            <div
              v-else-if="
                agendamento.servicoId &&
                agendamento.funcionarioId &&
                agendamento.dataAtendimento &&
                !carregandoDisponibilidade
              "
              class="estado-horarios"
            >
              <strong>Nenhum horário livre nesta data.</strong>
              <span>Escolha outro dia ou outro funcionário para tentar novamente.</span>
            </div>

            <div v-if="horariosOcupados.length" class="legenda-horarios">
              <strong>Horários ocupados</strong>
              <div class="lista-ocupados" aria-label="Horários ocupados">
                <span v-for="horario in horariosOcupados" :key="horario.valor">
                  {{ horario.label }}
                </span>
              </div>
            </div>
          </section>

          <div v-if="resumoVisivel" class="campo-grande previa">
            <h3>Resumo do agendamento</h3>
            <p><strong>Serviço:</strong> {{ servicoSelecionado?.nome || 'A selecionar' }}</p>
            <p><strong>Funcionário:</strong> {{ funcionarioSelecionado?.nome || 'A selecionar' }}</p>
            <p><strong>Data:</strong> {{ dataAtendimentoFormatada || 'A selecionar' }}</p>
            <p><strong>Início:</strong> {{ inicioSelecionado || 'Selecione um horário' }}</p>
            <p><strong>Término previsto:</strong> {{ terminoPrevisto || 'Selecione um horário' }}</p>
            <p><strong>Preço:</strong> {{ formatarPreco(servicoSelecionado?.preco) }}</p>
          </div>

          <label class="campo-grande">
            Observação
            <textarea
              v-model="agendamento.observacao"
              rows="4"
              placeholder="Ex: Preferência por horário pontual"
            ></textarea>
          </label>
        </div>

        <div class="rodape-formulario">
          <button
            class="botao principal"
            :disabled="enviando || !formularioCompleto"
            @click="enviarAgendamento"
          >
            {{ enviando ? 'Enviando...' : 'Agendar' }}
          </button>
          <p v-if="!agendamento.dataHoraInicio" class="aviso-horario">
            Selecione um horário disponível para liberar o agendamento.
          </p>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina-publica {
  min-height: 100vh;
  display: grid;
  place-items: start center;
  padding: 32px 18px;
  background: #eef2f7;
  color: #111827;
}

.conteudo-publico {
  width: 100%;
  max-width: 980px;
  display: grid;
  gap: 18px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.estado {
  width: min(100%, 620px);
  text-align: center;
}

.estado h1 {
  margin: 0 0 8px;
  font-size: 28px;
  font-weight: 800;
}

.estado p {
  margin: 0;
  color: #64748b;
}

.cabecalho-publico {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 20px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.cabecalho-publico h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.mensagem-publica {
  margin: 8px 0 0;
  color: #475569;
}

.dados-empresa {
  display: grid;
  gap: 6px;
  min-width: 240px;
}

.dados-empresa p {
  margin: 0;
  color: #374151;
  word-break: break-word;
}

.dados-empresa strong {
  font-weight: 800;
}

.formulario {
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
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

textarea {
  min-height: 110px;
  resize: vertical;
  font-family: inherit;
}

input:focus,
select:focus,
textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.campo-grande {
  grid-column: 1 / -1;
}

.horarios {
  display: grid;
  gap: 14px;
  padding: 16px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f8fafc;
}

.titulo-horarios h3,
.titulo-horarios p {
  margin: 0;
}

.titulo-horarios h3 {
  font-size: 16px;
  font-weight: 800;
  color: #111827;
}

.titulo-horarios p {
  margin-top: 4px;
  color: #64748b;
  font-size: 14px;
}

.grade-horarios {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(128px, 1fr));
  gap: 12px;
}

.horario {
  min-height: 60px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: white;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 16px;
  font-weight: 800;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.horario:hover:not(:disabled) {
  transform: translateY(-1px);
  border-color: #2563eb;
  background: #eff6ff;
}

.horario.selecionado {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.estado-horarios {
  display: grid;
  gap: 4px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: white;
  color: #475569;
  font-size: 14px;
}

.estado-horarios strong {
  color: #111827;
}

.legenda-horarios {
  display: grid;
  gap: 8px;
  padding-top: 12px;
  border-top: 1px solid #e5e7eb;
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.legenda-horarios strong {
  color: #475569;
}

.lista-ocupados {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.lista-ocupados span {
  display: inline-flex;
  align-items: center;
  min-height: 32px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  background: #f1f5f9;
  color: #64748b;
  text-decoration: line-through;
}

.previa {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 10px 14px;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 14px;
}

.previa h3 {
  grid-column: 1 / -1;
  margin: 0;
  color: #1e3a8a;
  font-size: 16px;
  font-weight: 800;
}

.previa p {
  margin: 0;
}

.rodape-formulario {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.aviso-horario {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  font-weight: 700;
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

.botao:hover:not(:disabled) {
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

.principal:hover:not(:disabled) {
  background: #1d4ed8;
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

@media (max-width: 800px) {
  .cabecalho-publico {
    flex-direction: column;
  }

  .dados-empresa {
    min-width: 0;
  }

  .campos,
  .previa {
    grid-template-columns: 1fr;
  }
}
</style>
