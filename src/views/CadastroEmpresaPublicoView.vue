<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  buscarPlanosCadastroPublico,
  buscarSegmentosCadastroPublico,
  cadastrarEmpresaInteressadaPublico,
} from '@/services/api'

const etapas = [
  { titulo: 'Empresa' },
  { titulo: 'Responsável' },
  { titulo: 'Localização e interesse' },
  { titulo: 'Plano' },
  { titulo: 'Revisão' },
]

const etapaAtual = ref(0)
const segmentos = ref([])
const planos = ref([])
const carregando = ref(true)
const enviando = ref(false)
const erro = ref('')
const sucesso = ref('')
const protocolo = ref('')
const formulario = ref(criarFormularioInicial())

const segmentoSelecionado = computed(() =>
  segmentos.value.find((segmento) => String(segmento.id) === String(formulario.value.segmentoNegocioId)) || null,
)
const planoSelecionado = computed(() =>
  planos.value.find((plano) => String(plano.id) === String(formulario.value.planoId)) || null,
)

watch(
  () => formulario.value.nomeEmpresa,
  (nome) => {
    formulario.value.slugDesejado = gerarSlug(nome)
  },
)

function criarFormularioInicial() {
  return {
    nomeEmpresa: '',
    slugDesejado: '',
    documento: '',
    telefoneEmpresa: '',
    emailEmpresa: '',
    endereco: '',
    nomeResponsavel: '',
    emailResponsavel: '',
    telefoneResponsavel: '',
    cargoResponsavel: '',
    segmentoNegocioId: '',
    cidade: '',
    estado: '',
    interesse: '',
    planoId: '',
  }
}

async function carregarOpcoes() {
  try {
    carregando.value = true
    erro.value = ''
    const [segmentosApi, planosApi] = await Promise.all([
      buscarSegmentosCadastroPublico().catch(() => []),
      buscarPlanosCadastroPublico().catch(() => []),
    ])

    segmentos.value = extrairLista(segmentosApi).filter((segmento) => segmento.ativo !== false)
    planos.value = extrairLista(planosApi).filter((plano) => plano.publico !== false && plano.visivelPublico !== false)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as opções do cadastro.')
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

async function enviarCadastro() {
  if (!validarEtapaAtual()) return

  try {
    enviando.value = true
    erro.value = ''
    const resposta = await cadastrarEmpresaInteressadaPublico(montarPayload())
    protocolo.value = obterCampo(resposta, 'protocolo', 'numeroProtocolo', 'id')
    sucesso.value = 'Cadastro enviado com sucesso. Nossa equipe analisará sua solicitação.'
    formulario.value = criarFormularioInicial()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível enviar o cadastro.')
    console.error(error)
  } finally {
    enviando.value = false
  }
}

function validarEtapaAtual() {
  erro.value = ''

  if (etapaAtual.value === 0) {
    if (!formulario.value.nomeEmpresa.trim()) return falharValidacao('Informe o nome da empresa.')
    if (!formulario.value.documento.trim()) return falharValidacao('Informe o documento da empresa.')
    if (!emailValido(formulario.value.emailEmpresa)) return falharValidacao('Informe um e-mail válido da empresa.')
  }

  if (etapaAtual.value === 1) {
    if (!formulario.value.nomeResponsavel.trim()) return falharValidacao('Informe o nome do responsável.')
    if (!emailValido(formulario.value.emailResponsavel)) return falharValidacao('Informe um e-mail válido do responsável.')
    if (!formulario.value.telefoneResponsavel.trim()) return falharValidacao('Informe o telefone do responsável.')
  }

  if (etapaAtual.value === 2) {
    if (!formulario.value.segmentoNegocioId) return falharValidacao('Selecione o segmento.')
    if (!formulario.value.interesse.trim()) return falharValidacao('Conte brevemente seu interesse.')
  }

  if (etapaAtual.value === 3 && !formulario.value.planoId) {
    return falharValidacao('Selecione o plano desejado.')
  }

  return true
}

function falharValidacao(mensagem) {
  erro.value = mensagem
  return false
}

function montarPayload() {
  return {
    empresa: limparVazios({
      nome: formulario.value.nomeEmpresa,
      nomeEmpresa: formulario.value.nomeEmpresa,
      documento: formulario.value.documento,
      telefone: formulario.value.telefoneEmpresa,
      telefoneEmpresa: formulario.value.telefoneEmpresa,
      email: formulario.value.emailEmpresa,
      emailEmpresa: formulario.value.emailEmpresa,
      endereco: formulario.value.endereco,
      slugDesejado: formulario.value.slugDesejado || gerarSlug(formulario.value.nomeEmpresa),
    }),
    responsavel: limparVazios({
      nome: formulario.value.nomeResponsavel,
      nomeResponsavel: formulario.value.nomeResponsavel,
      responsavelNome: formulario.value.nomeResponsavel,
      email: formulario.value.emailResponsavel,
      emailResponsavel: formulario.value.emailResponsavel,
      responsavelEmail: formulario.value.emailResponsavel,
      telefone: formulario.value.telefoneResponsavel,
      telefoneResponsavel: formulario.value.telefoneResponsavel,
      responsavelTelefone: formulario.value.telefoneResponsavel,
      cargo: formulario.value.cargoResponsavel,
      cargoResponsavel: formulario.value.cargoResponsavel,
    }),
    segmento: limparVazios({
      id: idOuVazio(formulario.value.segmentoNegocioId),
      segmentoId: idOuVazio(formulario.value.segmentoNegocioId),
      segmentoNegocioId: idOuVazio(formulario.value.segmentoNegocioId),
      cidade: formulario.value.cidade,
      estado: formulario.value.estado.toUpperCase(),
    }),
    plano: limparVazios({
      id: idOuVazio(formulario.value.planoId),
      planoId: idOuVazio(formulario.value.planoId),
      planoSaasId: idOuVazio(formulario.value.planoId),
    }),
    observacoes: formulario.value.interesse.trim(),
  }
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function idOuVazio(valor) {
  return valor ? Number(valor) : ''
}

function emailValido(valor) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(valor || '').trim())
}

function gerarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.content)) return resposta.content
  if (Array.isArray(resposta?.data?.content)) return resposta.data.content
  if (Array.isArray(resposta?.data)) return resposta.data
  if (Array.isArray(resposta?.items)) return resposta.items
  if (Array.isArray(resposta?.itens)) return resposta.itens
  if (Array.isArray(resposta?.resultado)) return resposta.resultado
  if (Array.isArray(resposta?.data?.items)) return resposta.data.items
  if (Array.isArray(resposta?.data?.itens)) return resposta.data.itens
  if (Array.isArray(resposta?.data?.resultado)) return resposta.data.resultado
  return []
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''
  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') return item[campo]
  }
  return ''
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

onMounted(carregarOpcoes)
</script>

<template>
  <main class="pagina-publica">
    <section class="conteudo">
      <header class="cabecalho">
        <RouterLink class="link-login" to="/login">Já tenho acesso</RouterLink>
        <span class="marca">Gestão Empresarial</span>
        <h1>Cadastre sua empresa</h1>
        <p>Responda algumas perguntas para nossa equipe avaliar sua solicitação de entrada na plataforma.</p>
      </header>

      <section v-if="sucesso" class="card confirmacao">
        <span class="selo">Solicitação pendente</span>
        <h2>{{ sucesso }}</h2>
        <p v-if="protocolo"><strong>Protocolo:</strong> {{ protocolo }}</p>
        <div class="acoes">
          <RouterLink class="botao principal" to="/login">Voltar para login</RouterLink>
        </div>
      </section>

      <template v-else>
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

        <section v-if="erro" class="feedback erro"><p>{{ erro }}</p></section>
        <section v-if="carregando" class="card"><p>Carregando opções do cadastro...</p></section>

        <form v-else class="card formulario" @submit.prevent="etapaAtual === etapas.length - 1 ? enviarCadastro() : proximaEtapa()">
          <div v-if="etapaAtual === 0" class="campos">
            <label>Nome da empresa *<input v-model="formulario.nomeEmpresa" type="text" /></label>
            <label>Documento *<input v-model="formulario.documento" type="text" /></label>
            <label>Telefone<input v-model="formulario.telefoneEmpresa" type="tel" /></label>
            <label>E-mail da empresa *<input v-model="formulario.emailEmpresa" type="email" /></label>
            <label class="campo-grande">Endereço<input v-model="formulario.endereco" type="text" /></label>
          </div>

          <div v-else-if="etapaAtual === 1" class="campos">
            <label>Nome do responsável *<input v-model="formulario.nomeResponsavel" type="text" /></label>
            <label>E-mail do responsável *<input v-model="formulario.emailResponsavel" type="email" /></label>
            <label>Telefone/WhatsApp *<input v-model="formulario.telefoneResponsavel" type="tel" /></label>
            <label>Cargo<input v-model="formulario.cargoResponsavel" type="text" /></label>
          </div>

          <div v-else-if="etapaAtual === 2" class="campos">
            <label>
              Segmento *
              <select v-model="formulario.segmentoNegocioId">
                <option value="">Selecione</option>
                <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">
                  {{ segmento.nome || segmento.descricao || 'Segmento sem nome' }}
                </option>
              </select>
              <small v-if="!segmentos.length">Nenhum segmento disponível no momento. Nossa equipe poderá orientar você após o envio.</small>
            </label>
            <label>Cidade<input v-model="formulario.cidade" type="text" /></label>
            <label>Estado<input v-model="formulario.estado" maxlength="2" type="text" /></label>
            <label class="campo-grande">
              O que você deseja melhorar na gestão da sua empresa? *
              <textarea v-model="formulario.interesse" rows="4"></textarea>
            </label>
          </div>

          <div v-else-if="etapaAtual === 3" class="campos">
            <label class="campo-grande">
              Plano desejado *
              <select v-model="formulario.planoId">
                <option value="">Selecione</option>
                <option v-for="plano in planos" :key="plano.id" :value="plano.id">
                  {{ plano.nome || plano.titulo || 'Plano sem nome' }}
                </option>
              </select>
              <small v-if="!planos.length">Nenhum plano público disponível no momento.</small>
            </label>
          </div>

          <div v-else class="revisao">
            <article>
              <h2>Empresa</h2>
              <p><strong>Nome:</strong> {{ formulario.nomeEmpresa }}</p>
              <p><strong>Documento:</strong> {{ formulario.documento }}</p>
              <p><strong>E-mail:</strong> {{ formulario.emailEmpresa }}</p>
              <p><strong>Telefone:</strong> {{ formulario.telefoneEmpresa || '-' }}</p>
            </article>
            <article>
              <h2>Responsável</h2>
              <p><strong>Nome:</strong> {{ formulario.nomeResponsavel }}</p>
              <p><strong>E-mail:</strong> {{ formulario.emailResponsavel }}</p>
              <p><strong>Telefone:</strong> {{ formulario.telefoneResponsavel }}</p>
            </article>
            <article>
              <h2>Localização e interesse</h2>
              <p><strong>Segmento:</strong> {{ segmentoSelecionado?.nome || segmentoSelecionado?.descricao || '-' }}</p>
              <p><strong>Cidade:</strong> {{ formulario.cidade || '-' }}</p>
              <p><strong>Estado:</strong> {{ formulario.estado || '-' }}</p>
              <p><strong>Mensagem:</strong> {{ formulario.interesse }}</p>
            </article>
            <article>
              <h2>Plano escolhido</h2>
              <p><strong>Plano:</strong> {{ planoSelecionado?.nome || planoSelecionado?.titulo || '-' }}</p>
            </article>
          </div>

          <div class="acoes">
            <button v-if="etapaAtual > 0" class="botao secundario" type="button" @click="etapaAnterior">Voltar</button>
            <button v-if="etapaAtual < etapas.length - 1" class="botao principal" type="submit">Avançar</button>
            <button v-else class="botao principal" type="submit" :disabled="enviando">
              {{ enviando ? 'Enviando...' : 'Enviar cadastro' }}
            </button>
          </div>
        </form>
      </template>
    </section>
  </main>
</template>

<style scoped>
.pagina-publica {
  min-height: 100vh;
  background: #eef2f7;
  color: #111827;
  padding: 34px 18px;
}

.conteudo {
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  gap: 20px;
}

.cabecalho {
  display: grid;
  gap: 8px;
}

.marca,
.selo {
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.link-login {
  justify-self: end;
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 38px;
  font-weight: 800;
}

h2 {
  font-size: 20px;
}

.cabecalho p,
.confirmacao > p {
  color: #475569;
  font-size: 17px;
}

.card,
.feedback {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.formulario,
.confirmacao,
.revisao {
  display: grid;
  gap: 18px;
}

.etapas,
.campos,
.revisao {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 14px;
}

.etapas {
  grid-template-columns: repeat(5, minmax(120px, 1fr));
}

.etapa {
  min-height: 58px;
  border: 1px solid #dbe4f0;
  border-radius: 8px;
  background: white;
  color: #475569;
  cursor: default;
  font-weight: 800;
}

.etapa span {
  display: inline-grid;
  width: 24px;
  height: 24px;
  margin-right: 7px;
  place-items: center;
  border-radius: 999px;
  background: #e2e8f0;
}

.etapa.ativa,
.etapa.concluida {
  border-color: #2563eb;
  color: #1d4ed8;
}

.etapa.concluida {
  cursor: pointer;
}

.etapa.ativa span,
.etapa.concluida span {
  background: #2563eb;
  color: white;
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

label small {
  color: #64748b;
  font-size: 13px;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 11px 12px;
  background: white;
  font: inherit;
  box-sizing: border-box;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 12px 18px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.confirmacao {
  border-color: #bbf7d0;
  background: #f0fdf4;
}

@media (max-width: 900px) {
  .etapas,
  .campos,
  .revisao {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 31px;
  }
}
</style>
