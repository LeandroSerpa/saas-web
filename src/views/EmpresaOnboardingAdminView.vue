<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  buscarPlanos,
  buscarSegmentos,
  cadastrarEmpresaComOnboarding,
} from '@/services/api'

const etapas = [
  { titulo: 'Dados básicos' },
  { titulo: 'Segmento e agenda' },
  { titulo: 'Plano/assinatura' },
  { titulo: 'Revisão' },
]
const intervalosAgenda = [15, 30, 60]

const etapaAtual = ref(0)
const segmentos = ref([])
const planos = ref([])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const aviso = ref('')
const empresaCriada = ref(null)
const slugEditado = ref(false)
const empresa = ref(criarEmpresaInicial())
const assinatura = ref(criarAssinaturaInicial())

const planoSelecionado = computed(() =>
  planos.value.find((plano) => String(plano.id) === String(assinatura.value.planoId)) || null,
)
const segmentoSelecionado = computed(() =>
  segmentos.value.find((segmento) => String(segmento.id) === String(empresa.value.segmentoNegocioId)) || null,
)
const planoVisivelParaEmpresa = computed(() => planoSelecionado.value?.visivelParaEmpresa !== false)
const linkPublico = computed(() => {
  const slug = String(empresa.value.slugPublico || '').trim()
  return slug ? `${window.location.origin}/agendar/${slug}` : ''
})

watch(
  () => empresa.value.nome,
  (nome) => {
    if (!slugEditado.value) {
      empresa.value.slugPublico = gerarSlug(nome)
    }
  },
)

onMounted(carregarOpcoes)

function criarEmpresaInicial() {
  return {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    slugPublico: '',
    segmentoNegocioId: '',
    permitirAgendamentoPublico: true,
    intervaloAgendaMinutos: 30,
  }
}

function criarAssinaturaInicial() {
  const hoje = new Date()
  const vencimento = new Date(hoje)
  vencimento.setMonth(vencimento.getMonth() + 1)

  return {
    planoId: '',
    dataInicio: formatarDataInput(hoje),
    dataVencimento: formatarDataInput(vencimento),
    observacaoComercial: '',
  }
}

async function carregarOpcoes() {
  try {
    carregando.value = true
    erro.value = ''
    const [segmentosApi, planosApi] = await Promise.all([
      buscarSegmentos().catch(() => []),
      buscarPlanos().catch(() => []),
    ])

    segmentos.value = extrairLista(segmentosApi).filter((segmento) => segmento.ativo !== false)
    planos.value = extrairLista(planosApi).filter((plano) => plano.ativo !== false)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os dados para o cadastro guiado.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function proximaEtapa() {
  if (!validarEtapaAtual()) return
  etapaAtual.value = Math.min(etapaAtual.value + 1, etapas.length - 1)
}

function etapaAnterior() {
  erro.value = ''
  etapaAtual.value = Math.max(etapaAtual.value - 1, 0)
}

async function criarEmpresaGuiada() {
  if (!validarEtapaAtual()) return

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    aviso.value = ''
    const resposta = await cadastrarEmpresaComOnboarding({
      empresa: montarPayloadEmpresa(),
      assinatura: montarPayloadAssinatura(),
    })

    const dadosResposta = normalizarObjeto(resposta)
    empresaCriada.value = normalizarObjeto(resposta?.empresa || dadosResposta?.empresa || dadosResposta)
    aviso.value = extrairAvisoResposta(resposta)
    sucesso.value = `Empresa ${empresa.value.nome} cadastrada com sucesso.`
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível criar a empresa.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function validarEtapaAtual() {
  erro.value = ''

  if (etapaAtual.value === 0) {
    if (!empresa.value.nome.trim()) return falharValidacao('Informe o nome da empresa.')
    if (!empresa.value.documento.trim()) return falharValidacao('Informe o documento da empresa.')
    if (!emailValido(empresa.value.email)) return falharValidacao('Informe um e-mail válido.')
    if (!empresa.value.slugPublico.trim()) return falharValidacao('Informe o slug público.')
  }

  if (etapaAtual.value === 1) {
    if (!empresa.value.segmentoNegocioId) return falharValidacao('Selecione o segmento.')
    if (!intervalosAgenda.includes(Number(empresa.value.intervaloAgendaMinutos))) {
      return falharValidacao('Selecione um intervalo de agenda válido.')
    }
  }

  if (etapaAtual.value === 2) {
    if (!assinatura.value.planoId) return falharValidacao('Selecione o plano.')
    if (!dataValida(assinatura.value.dataInicio)) return falharValidacao('Informe a data de início.')
    if (!dataValida(assinatura.value.dataVencimento)) return falharValidacao('Informe a data de vencimento.')
    if (assinatura.value.dataInicio > assinatura.value.dataVencimento) {
      return falharValidacao('A data de início não pode ser maior que a data de vencimento.')
    }
  }

  return true
}

function falharValidacao(mensagem) {
  erro.value = mensagem
  return false
}

function montarPayloadEmpresa() {
  const intervaloAgendaMinutos = Number(empresa.value.intervaloAgendaMinutos)

  return {
    nome: textoOuNulo(empresa.value.nome),
    documento: textoOuNulo(empresa.value.documento),
    telefone: textoOuNulo(empresa.value.telefone),
    email: textoOuNulo(empresa.value.email),
    endereco: textoOuNulo(empresa.value.endereco),
    ativo: true,
    segmentoNegocioId: Number(empresa.value.segmentoNegocioId),
    slug: textoOuNulo(empresa.value.slugPublico),
    slugPublico: textoOuNulo(empresa.value.slugPublico),
    agendamentoPublicoAtivo: Boolean(empresa.value.permitirAgendamentoPublico),
    permitirAgendamentoPublico: Boolean(empresa.value.permitirAgendamentoPublico),
    intervaloAgendaMinutos,
    atendeDomingo: false,
    atendeSegunda: true,
    atendeTerca: true,
    atendeQuarta: true,
    atendeQuinta: true,
    atendeSexta: true,
    atendeSabado: true,
  }
}

function montarPayloadAssinatura() {
  return {
    planoId: Number(assinatura.value.planoId),
    status: 'ATIVA',
    dataInicio: assinatura.value.dataInicio,
    dataFim: null,
    dataVencimento: assinatura.value.dataVencimento,
    observacao: '',
    observacaoComercial: textoOuNulo(assinatura.value.observacaoComercial),
  }
}

function marcarSlugEditado(valor) {
  slugEditado.value = true
  empresa.value.slugPublico = gerarSlug(valor)
}

function gerarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function textoOuNulo(valor) {
  const texto = String(valor || '').trim()
  return texto || null
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim())
}

function dataValida(valor) {
  return /^\d{4}-\d{2}-\d{2}$/.test(String(valor || ''))
}

function formatarDataInput(data) {
  return data.toISOString().slice(0, 10)
}

function formatarData(valor) {
  return valor ? new Date(`${String(valor).slice(0, 10)}T00:00:00`).toLocaleDateString('pt-BR') : '-'
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  return resposta?.content || resposta?.items || resposta?.data || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && typeof dados.data === 'object' ? dados.data : dados
}

function extrairAvisoResposta(resposta) {
  const candidatos = [resposta, resposta?.data].filter(Boolean)
  const camposAviso = ['aviso', 'warning', 'alerta', 'mensagemAviso', 'avisoAssinatura']

  for (const item of candidatos) {
    for (const campo of camposAviso) {
      const valor = item?.[campo]
      if (Array.isArray(valor)) return valor.filter(Boolean).join(' ')
      if (typeof valor === 'string' && valor.trim()) return valor.trim()
    }
  }

  return ''
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">ADMINISTRAÇÃO SAAS</p>
        <h1>Novo cadastro guiado</h1>
        <p class="descricao">Crie a empresa e deixe a assinatura inicial configurada em poucos passos.</p>
      </div>
      <RouterLink class="botao secundario" to="/empresas">Voltar para empresas</RouterLink>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>

    <section v-if="sucesso" class="card sucesso">
      <div>
        <p>{{ sucesso }}</p>
        <p v-if="aviso" class="aviso-onboarding">{{ aviso }}</p>
      </div>
      <RouterLink class="botao principal" to="/empresas">Ir para Empresas</RouterLink>
    </section>

    <section class="etapas">
      <button
        v-for="(etapa, indice) in etapas"
        :key="etapa.titulo"
        :class="['etapa', { ativa: etapaAtual === indice, concluida: etapaAtual > indice }]"
        type="button"
        @click="indice < etapaAtual && (etapaAtual = indice)"
      >
        <span>{{ indice + 1 }}</span>
        {{ etapa.titulo }}
      </button>
    </section>

    <section v-if="carregando" class="card"><p>Carregando opções do cadastro...</p></section>

    <section v-else-if="!sucesso" class="card formulario">
      <div v-if="etapaAtual === 0" class="campos">
        <label>Nome *<input v-model="empresa.nome" type="text" placeholder="Barbearia Teste" /></label>
        <label>Documento *<input v-model="empresa.documento" type="text" placeholder="00.000.000/0001-00" /></label>
        <label>Telefone<input v-model="empresa.telefone" type="text" placeholder="(11) 99999-9999" /></label>
        <label>E-mail *<input v-model="empresa.email" type="email" placeholder="contato@empresa.com" /></label>
        <label class="campo-grande">Endereço<input v-model="empresa.endereco" type="text" placeholder="Rua Principal, 100" /></label>
        <label>Slug/link público *<input :value="empresa.slugPublico" type="text" placeholder="barbearia-teste" @input="marcarSlugEditado($event.target.value)" /></label>
        <p v-if="linkPublico" class="link-publico">{{ linkPublico }}</p>
      </div>

      <div v-else-if="etapaAtual === 1" class="campos">
        <label>
          Segmento *
          <select v-model="empresa.segmentoNegocioId">
            <option value="">Selecione</option>
            <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">
              {{ segmento.nome || segmento.descricao || 'Segmento sem nome' }}
            </option>
          </select>
        </label>
        <label>
          Intervalo da agenda *
          <select v-model.number="empresa.intervaloAgendaMinutos">
            <option v-for="intervalo in intervalosAgenda" :key="intervalo" :value="intervalo">
              {{ intervalo }} minutos
            </option>
          </select>
        </label>
        <label class="checkbox"><input v-model="empresa.permitirAgendamentoPublico" type="checkbox" /> Agendamento público ativo</label>
      </div>

      <div v-else-if="etapaAtual === 2" class="campos">
        <label>
          Plano *
          <select v-model="assinatura.planoId">
            <option value="">Selecione</option>
            <option v-for="plano in planos" :key="plano.id" :value="plano.id">
              {{ plano.nome || 'Plano sem nome' }}
            </option>
          </select>
        </label>
        <label>Data início *<input v-model="assinatura.dataInicio" type="date" /></label>
        <label>Data vencimento *<input v-model="assinatura.dataVencimento" type="date" /></label>
        <label class="checkbox"><input :checked="planoVisivelParaEmpresa" type="checkbox" disabled /> Visível para empresa</label>
        <label class="campo-grande">Observação comercial<textarea v-model="assinatura.observacaoComercial" rows="4"></textarea></label>
      </div>

      <div v-else class="revisao">
        <article>
          <h2>Dados básicos</h2>
          <p><strong>Nome:</strong> {{ empresa.nome }}</p>
          <p><strong>Documento:</strong> {{ empresa.documento }}</p>
          <p><strong>Telefone:</strong> {{ empresa.telefone || '-' }}</p>
          <p><strong>E-mail:</strong> {{ empresa.email }}</p>
          <p><strong>Endereço:</strong> {{ empresa.endereco || '-' }}</p>
          <p><strong>Link público:</strong> {{ linkPublico || '-' }}</p>
        </article>
        <article>
          <h2>Segmento e agenda</h2>
          <p><strong>Segmento:</strong> {{ segmentoSelecionado?.nome || '-' }}</p>
          <p><strong>Agendamento público:</strong> {{ empresa.permitirAgendamentoPublico ? 'Ativo' : 'Inativo' }}</p>
          <p><strong>Intervalo:</strong> {{ empresa.intervaloAgendaMinutos }} minutos</p>
        </article>
        <article>
          <h2>Plano/assinatura</h2>
          <p><strong>Plano:</strong> {{ planoSelecionado?.nome || '-' }}</p>
          <p><strong>Data início:</strong> {{ formatarData(assinatura.dataInicio) }}</p>
          <p><strong>Data vencimento:</strong> {{ formatarData(assinatura.dataVencimento) }}</p>
          <p><strong>Visível para empresa:</strong> {{ planoVisivelParaEmpresa ? 'Sim' : 'Não' }}</p>
          <p><strong>Observação comercial:</strong> {{ assinatura.observacaoComercial || '-' }}</p>
        </article>
      </div>

      <div class="acoes">
        <button v-if="etapaAtual > 0" class="botao secundario" type="button" @click="etapaAnterior">Voltar</button>
        <button v-if="etapaAtual < etapas.length - 1" class="botao principal" type="button" @click="proximaEtapa">Avançar</button>
        <button v-else class="botao principal" type="button" :disabled="salvando" @click="criarEmpresaGuiada">
          {{ salvando ? 'Criando empresa...' : 'Criar empresa' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.revisao {
  display: grid;
  gap: 18px;
  color: #111827;
}

.pagina {
  gap: 24px;
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
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

h2 {
  font-size: 20px;
  font-weight: 800;
}

.descricao {
  margin-top: 6px;
  color: #64748b;
}

.card,
.etapa,
.revisao article {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.etapas {
  display: grid;
  grid-template-columns: repeat(4, minmax(150px, 1fr));
  gap: 12px;
}

.etapa {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  cursor: default;
  font: inherit;
  font-weight: 800;
  text-align: left;
}

.etapa.concluida {
  cursor: pointer;
}

.etapa span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #0f172a;
}

.etapa.ativa {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.etapa.ativa span,
.etapa.concluida span {
  background: #2563eb;
  color: white;
}

.campos {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

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
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
  background: white;
}

textarea {
  resize: vertical;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #bfdbfe;
  border-color: #2563eb;
}

.checkbox {
  align-content: center;
  grid-template-columns: auto 1fr;
}

.checkbox input {
  width: auto;
}

.link-publico {
  align-self: end;
  padding: 11px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 800;
  word-break: break-word;
}

.revisao {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.revisao article {
  display: grid;
  gap: 9px;
  box-shadow: none;
}

.revisao p {
  color: #374151;
}

.revisao strong {
  font-weight: 800;
}

.botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.erro p,
.sucesso p {
  font-weight: 800;
}

.sucesso .aviso-onboarding {
  margin-top: 6px;
  color: #854d0e;
  font-size: 0.92rem;
  font-weight: 700;
}

@media (max-width: 1000px) {
  .etapas,
  .campos,
  .revisao {
    grid-template-columns: 1fr;
  }

  .campo-grande {
    grid-column: auto;
  }
}
</style>
