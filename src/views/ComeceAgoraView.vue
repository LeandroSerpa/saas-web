<script setup>
import { onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import {
  buscarPlanosCadastroPublico,
  buscarSegmentosCadastroPublico,
  criarSolicitacaoCadastroEmpresa,
} from '@/services/api'

const segmentos = ref([])
const planos = ref([])
const carregando = ref(true)
const enviando = ref(false)
const erro = ref('')
const confirmacao = ref(null)
const formulario = ref(criarFormularioInicial())

function criarFormularioInicial() {
  return {
    nomeEmpresa: '',
    documento: '',
    segmentoId: '',
    cidade: '',
    estado: '',
    responsavelNome: '',
    responsavelEmail: '',
    responsavelTelefone: '',
    planoId: '',
    observacao: '',
  }
}

async function carregarOpcoes() {
  try {
    carregando.value = true
    const [planosApi, segmentosApi] = await Promise.all([
      buscarPlanosCadastroPublico().catch(() => []),
      buscarSegmentosCadastroPublico().catch(() => []),
    ])
    planos.value = extrairLista(planosApi).filter((plano) => plano.publico !== false && plano.visivelPublico !== false)
    segmentos.value = extrairLista(segmentosApi)
  } finally {
    carregando.value = false
  }
}

async function enviarSolicitacao() {
  const erroValidacao = validarFormulario()

  if (erroValidacao) {
    erro.value = erroValidacao
    return
  }

  try {
    enviando.value = true
    erro.value = ''
    const resposta = await criarSolicitacaoCadastroEmpresa(montarPayload())
    confirmacao.value = {
      id: obterCampo(resposta, 'id', 'protocolo', 'numeroProtocolo'),
      nomeEmpresa: formulario.value.nomeEmpresa,
      email: formulario.value.responsavelEmail,
    }
    formulario.value = criarFormularioInicial()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível enviar a solicitação.')
    console.error(error)
  } finally {
    enviando.value = false
  }
}

function validarFormulario() {
  if (!formulario.value.nomeEmpresa.trim()) return 'Informe o nome da empresa.'
  if (!formulario.value.responsavelNome.trim()) return 'Informe o nome do responsável.'
  if (!formulario.value.responsavelEmail.trim()) return 'Informe o e-mail do responsável.'
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formulario.value.responsavelEmail.trim())) {
    return 'Informe um e-mail válido.'
  }
  if (!formulario.value.responsavelTelefone.trim()) return 'Informe o telefone/WhatsApp do responsável.'
  return ''
}

function montarPayload() {
  return limparVazios({
    nomeEmpresa: formulario.value.nomeEmpresa,
    documento: formulario.value.documento,
    segmentoId: idOuVazio(formulario.value.segmentoId),
    segmentoNegocioId: idOuVazio(formulario.value.segmentoId),
    cidade: formulario.value.cidade,
    estado: formulario.value.estado,
    responsavelNome: formulario.value.responsavelNome,
    nomeResponsavel: formulario.value.responsavelNome,
    responsavelEmail: formulario.value.responsavelEmail,
    emailResponsavel: formulario.value.responsavelEmail,
    responsavelTelefone: formulario.value.responsavelTelefone,
    telefoneResponsavel: formulario.value.responsavelTelefone,
    planoId: idOuVazio(formulario.value.planoId),
    planoSaasId: idOuVazio(formulario.value.planoId),
    observacao: formulario.value.observacao,
    mensagem: formulario.value.observacao,
  })
}

function novaSolicitacao() {
  confirmacao.value = null
  erro.value = ''
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()),
  )
}

function idOuVazio(valor) {
  return valor ? Number(valor) : ''
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.content)) return resposta.content
  if (Array.isArray(resposta?.data?.content)) return resposta.data.content
  if (Array.isArray(resposta?.data)) return resposta.data
  return resposta?.items || resposta?.itens || resposta?.resultado || []
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
        <span class="marca">Gestão SaaS</span>
        <h1>Comece agora com o Gestão SaaS</h1>
        <p>Preencha os dados da sua empresa para solicitar acesso à plataforma.</p>
      </header>

      <section v-if="confirmacao" class="card confirmacao">
        <span class="selo">Solicitação enviada</span>
        <h2>Solicitação enviada com sucesso!</h2>
        <p>Recebemos os dados da sua empresa. Nossa equipe analisará a solicitação e entrará em contato.</p>
        <div class="resumo-confirmacao">
          <p v-if="confirmacao.id"><strong>Protocolo:</strong> {{ confirmacao.id }}</p>
          <p><strong>Empresa:</strong> {{ confirmacao.nomeEmpresa }}</p>
          <p><strong>E-mail:</strong> {{ confirmacao.email }}</p>
        </div>
        <div class="acoes">
          <button class="botao principal" @click="novaSolicitacao">Enviar nova solicitação</button>
          <RouterLink class="botao secundario link-botao" to="/">Voltar para início</RouterLink>
        </div>
      </section>

      <form v-else class="card formulario" @submit.prevent="enviarSolicitacao">
        <section v-if="erro" class="feedback erro"><p>{{ erro }}</p></section>

        <section class="secao">
          <h2>Dados da empresa</h2>
          <div class="campos">
            <label>Nome da empresa <input v-model="formulario.nomeEmpresa" type="text" /></label>
            <label>Documento, opcional <input v-model="formulario.documento" type="text" /></label>
            <label>
              Segmento
              <select v-model="formulario.segmentoId" :disabled="carregando">
                <option value="">Selecione</option>
                <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">
                  {{ segmento.nome || segmento.descricao || `Segmento ${segmento.id}` }}
                </option>
              </select>
            </label>
            <label>Cidade <input v-model="formulario.cidade" type="text" /></label>
            <label>Estado <input v-model="formulario.estado" maxlength="2" type="text" /></label>
          </div>
        </section>

        <section class="secao">
          <h2>Dados do responsável</h2>
          <div class="campos">
            <label>Nome do responsável <input v-model="formulario.responsavelNome" type="text" /></label>
            <label>E-mail <input v-model="formulario.responsavelEmail" type="email" /></label>
            <label>Telefone/WhatsApp <input v-model="formulario.responsavelTelefone" type="tel" /></label>
          </div>
        </section>

        <section class="secao">
          <h2>Plano</h2>
          <label>
            Plano desejado, opcional
            <select v-model="formulario.planoId" :disabled="carregando">
              <option value="">Escolher depois</option>
              <option v-for="plano in planos" :key="plano.id" :value="plano.id">
                {{ plano.nome || plano.titulo || `Plano ${plano.id}` }}
              </option>
            </select>
          </label>
        </section>

        <section class="secao">
          <h2>Mensagem</h2>
          <label>
            Conte rapidamente como pretende usar o sistema.
            <textarea v-model="formulario.observacao" rows="4"></textarea>
          </label>
        </section>

        <button class="botao principal" :disabled="enviando">
          {{ enviando ? 'Enviando...' : 'Enviar solicitação' }}
        </button>
      </form>
    </section>
  </main>
</template>

<style scoped>
.pagina-publica{min-height:100vh;background:#eef2f7;color:#111827;padding:34px 18px}.conteudo{max-width:980px;margin:0 auto;display:grid;gap:20px}.cabecalho{display:grid;gap:8px}.marca,.selo{color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:38px;font-weight:800}h2{font-size:22px}.cabecalho p,.confirmacao>p{color:#475569;font-size:17px}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:24px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.formulario,.secao,.confirmacao{display:grid;gap:18px}.campos{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:16px}label{display:grid;gap:7px;color:#334155;font-weight:800}input,select,textarea{width:100%;border:1px solid #cbd5e1;border-radius:8px;padding:11px 12px;background:white;font:inherit;box-sizing:border-box}.acoes{display:flex;gap:12px;flex-wrap:wrap}.botao{border:none;border-radius:8px;padding:12px 18px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.principal{background:#2563eb}.secundario{background:#0f172a}.feedback{border-radius:8px;padding:14px 16px}.erro{border:1px solid #fecaca;background:#fef2f2;color:#991b1b}.resumo-confirmacao{display:grid;gap:8px;padding:16px;border-radius:8px;background:#f8fafc}.link-botao{display:inline-flex;align-items:center}@media(max-width:760px){.campos{grid-template-columns:1fr}h1{font-size:31px}}
</style>
