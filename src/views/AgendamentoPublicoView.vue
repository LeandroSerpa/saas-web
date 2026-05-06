<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import {
  buscarAgendamentosPublicos,
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
const agendamentosExistentes = ref([])
const carregando = ref(true)
const enviando = ref(false)
const indisponivel = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const agendamento = ref(criarAgendamentoInicial())

const diasSemana = [
  'domingo',
  'segunda',
  'terca',
  'quarta',
  'quinta',
  'sexta',
  'sabado',
]

const camposAtendimentoFuncionario = [
  'atendeDomingo',
  'atendeSegunda',
  'atendeTerca',
  'atendeQuarta',
  'atendeQuinta',
  'atendeSexta',
  'atendeSabado',
]

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

const mensagemDisponibilidade = computed(() => {
  if (!agendamento.value.dataAtendimento) {
    return ''
  }

  if (!empresaAtendeNaData(agendamento.value.dataAtendimento)) {
    return `A empresa ${empresa.value?.nome || ''} não atende neste dia.`
  }

  if (!funcionarioSelecionado.value || !servicoSelecionado.value) {
    return ''
  }

  if (!funcionarioAtendeNaData(funcionarioSelecionado.value, agendamento.value.dataAtendimento)) {
    return `O funcionário ${funcionarioSelecionado.value.nome} não atende neste dia.`
  }

  if (horariosDisponiveis.value.length === 0) {
    return 'Nenhum horário disponível para esta data.'
  }

  return ''
})

const horariosDisponiveis = computed(() => {
  if (
    !empresa.value ||
    !servicoSelecionado.value ||
    !funcionarioSelecionado.value ||
    !agendamento.value.dataAtendimento ||
    !duracaoMinutos.value ||
    !empresaAtendeNaData(agendamento.value.dataAtendimento) ||
    !funcionarioAtendeNaData(funcionarioSelecionado.value, agendamento.value.dataAtendimento)
  ) {
    return []
  }

  const data = agendamento.value.dataAtendimento
  const abertura = normalizarHorario(empresa.value.horaAbertura, '08:00')
  const fechamento = normalizarHorario(empresa.value.horaFechamento, '18:00')
  const inicioFuncionario = normalizarHorario(
    funcionarioSelecionado.value.horaInicioAtendimento,
    abertura,
  )
  const fimFuncionario = normalizarHorario(funcionarioSelecionado.value.horaFimAtendimento, fechamento)
  const inicioMinutos = Math.max(horarioParaMinutos(abertura), horarioParaMinutos(inicioFuncionario))
  const fimMinutos = Math.min(horarioParaMinutos(fechamento), horarioParaMinutos(fimFuncionario))
  const bloqueios = agendamentosDoFuncionarioNaData(data)

  if (fimMinutos <= inicioMinutos) {
    return []
  }

  const horarios = []

  for (let minutos = inicioMinutos; minutos + duracaoMinutos.value <= fimMinutos; minutos += 30) {
    const inicio = criarDataComMinutos(data, minutos)
    const fim = calcularDataHoraFim(inicio, duracaoMinutos.value)

    if (!conflitaComAgendamentos(inicio, fim, bloqueios)) {
      horarios.push({
        valor: formatarDataParaApi(inicio),
        label: minutosParaHorario(minutos),
      })
    }
  }

  return horarios
})

watch(
  () => [
    agendamento.value.servicoId,
    agendamento.value.funcionarioId,
    agendamento.value.dataAtendimento,
  ],
  () => {
    agendamento.value.dataHoraInicio = ''
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

    const [servicosApi, funcionariosApi, agendamentosApi] = await Promise.all([
      buscarServicosPublicos(slug.value),
      buscarFuncionariosPublicos(slug.value),
      buscarAgendamentosPublicos(slug.value),
    ])

    servicos.value = Array.isArray(servicosApi) ? servicosApi : []
    funcionarios.value = Array.isArray(funcionariosApi) ? funcionariosApi : []
    agendamentosExistentes.value = Array.isArray(agendamentosApi) ? agendamentosApi : []
  } catch (error) {
    indisponivel.value = true
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function recarregarAgendamentosPublicos() {
  const agendamentosApi = await buscarAgendamentosPublicos(slug.value)
  agendamentosExistentes.value = Array.isArray(agendamentosApi) ? agendamentosApi : []
}

function selecionarHorario(horario) {
  agendamento.value.dataHoraInicio = horario.valor
  erro.value = ''
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
    mensagemSucesso.value = 'Agendamento solicitado com sucesso.'
    await recarregarAgendamentosPublicos()
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

function agendamentosDoFuncionarioNaData(data) {
  return agendamentosExistentes.value
    .filter((item) => Number(item.funcionarioId) === Number(agendamento.value.funcionarioId))
    .filter((item) => String(item.status || '').toLowerCase() === 'agendado')
    .filter((item) => String(item.dataHoraInicio || '').startsWith(data))
    .map((item) => ({
      inicio: new Date(item.dataHoraInicio),
      fim: new Date(item.dataHoraFim),
    }))
    .filter((item) => !Number.isNaN(item.inicio.getTime()) && !Number.isNaN(item.fim.getTime()))
}

function conflitaComAgendamentos(inicio, fim, bloqueios) {
  return bloqueios.some((bloqueio) => inicio < bloqueio.fim && fim > bloqueio.inicio)
}

function empresaAtendeNaData(data) {
  const dia = obterDiaSemana(data)
  const diasFuncionamento = String(empresa.value?.diasFuncionamento || '')
    .split(',')
    .map((diaTexto) => normalizarDia(diaTexto))
    .filter(Boolean)

  if (diasFuncionamento.length === 0) {
    return dia !== 'domingo'
  }

  return diasFuncionamento.includes(dia)
}

function funcionarioAtendeNaData(funcionario, data) {
  const indiceDia = criarDataLocal(data).getDay()
  const campo = camposAtendimentoFuncionario[indiceDia]
  const valor = funcionario?.[campo]

  return valor === null || valor === undefined ? empresaAtendeNaData(data) : Boolean(valor)
}

function obterDiaSemana(data) {
  return diasSemana[criarDataLocal(data).getDay()]
}

function criarDataLocal(data) {
  const [ano, mes, dia] = String(data).split('-').map(Number)
  return new Date(ano, mes - 1, dia)
}

function criarDataComMinutos(data, minutos) {
  const dataLocal = criarDataLocal(data)
  dataLocal.setHours(Math.floor(minutos / 60), minutos % 60, 0, 0)
  return dataLocal
}

function normalizarDia(dia) {
  return String(dia || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
}

function normalizarHorario(horario, padrao) {
  const texto = String(horario || padrao || '').slice(0, 5)
  return /^\d{2}:\d{2}$/.test(texto) ? texto : padrao
}

function horarioParaMinutos(horario) {
  const [hora, minuto] = normalizarHorario(horario, '00:00').split(':').map(Number)
  return hora * 60 + minuto
}

function minutosParaHorario(minutos) {
  const hora = String(Math.floor(minutos / 60)).padStart(2, '0')
  const minuto = String(minutos % 60).padStart(2, '0')
  return `${hora}:${minuto}`
}

function formatarDataParaApi(data) {
  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')
  const hora = String(data.getHours()).padStart(2, '0')
  const minuto = String(data.getMinutes()).padStart(2, '0')

  return `${ano}-${mes}-${dia}T${hora}:${minuto}:00`
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
              <p v-if="!agendamento.dataAtendimento">Selecione uma data para ver os horários.</p>
              <p v-else-if="!servicoSelecionado || !funcionarioSelecionado">
                Selecione serviço e funcionário para ver os horários.
              </p>
              <p v-else-if="mensagemDisponibilidade">{{ mensagemDisponibilidade }}</p>
            </div>

            <div v-if="horariosDisponiveis.length" class="grade-horarios">
              <button
                v-for="horario in horariosDisponiveis"
                :key="horario.valor"
                type="button"
                class="horario"
                :class="{ selecionado: agendamento.dataHoraInicio === horario.valor }"
                @click="selecionarHorario(horario)"
              >
                {{ horario.label }}
              </button>
            </div>
          </section>

          <div v-if="agendamento.dataHoraInicio" class="campo-grande previa">
            <p>Duração: {{ duracaoMinutos }} minutos</p>
            <p>Término previsto: {{ terminoPrevisto }}</p>
            <p>Preço: {{ formatarPreco(servicoSelecionado?.preco) }}</p>
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
          <button class="botao principal" :disabled="enviando" @click="enviarAgendamento">
            {{ enviando ? 'Enviando...' : 'Agendar' }}
          </button>
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
  gap: 12px;
  padding: 14px;
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
  grid-template-columns: repeat(auto-fill, minmax(88px, 1fr));
  gap: 10px;
}

.horario {
  min-height: 42px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: white;
  color: #1d4ed8;
  cursor: pointer;
  font-size: 15px;
  font-weight: 800;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.horario:hover {
  transform: translateY(-1px);
  border-color: #2563eb;
  background: #eff6ff;
}

.horario.selecionado {
  background: #2563eb;
  border-color: #2563eb;
  color: white;
}

.previa {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-size: 14px;
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

  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
