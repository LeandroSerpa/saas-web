<script setup>
import { onMounted, ref } from 'vue'
import {
  buscarPlanosPublicos,
  buscarSegmentosPublicos,
  enviarSolicitacaoCadastro,
} from '@/services/api'

const segmentos = ref([])
const planos = ref([])
const carregando = ref(true)
const enviando = ref(false)
const erro = ref('')
const sucesso = ref('')
const aceiteContato = ref(false)
const formulario = ref({
  nomeEmpresa: '',
  documento: '',
  telefoneEmpresa: '',
  emailEmpresa: '',
  endereco: '',
  segmentoNegocioId: '',
  planoId: '',
  responsavelNome: '',
  responsavelEmail: '',
  responsavelTelefone: '',
  mensagem: '',
})

async function carregarOpcoes() {
  try {
    carregando.value = true
    const [segmentosApi, planosApi] = await Promise.all([
      buscarSegmentosPublicos().catch(() => []),
      buscarPlanosPublicos().catch(() => []),
    ])
    segmentos.value = extrairLista(segmentosApi)
    planos.value = extrairLista(planosApi)
  } finally {
    carregando.value = false
  }
}

async function enviarSolicitacao() {
  try {
    erro.value = ''
    sucesso.value = ''

    if (!formulario.value.nomeEmpresa.trim() || !formulario.value.emailEmpresa.trim()) {
      erro.value = 'Informe ao menos o nome e o e-mail da empresa.'
      return
    }

    if (!formulario.value.responsavelNome.trim() || !formulario.value.responsavelEmail.trim()) {
      erro.value = 'Informe o nome e o e-mail do responsável.'
      return
    }

    if (!aceiteContato.value) {
      erro.value = 'Aceite ser contatado para enviar a solicitação.'
      return
    }

    enviando.value = true
    await enviarSolicitacaoCadastro({ ...formulario.value, aceiteContato: true })
    sucesso.value = 'Solicitação enviada com sucesso. Em breve entraremos em contato.'
    limparFormulario()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível enviar a solicitação.')
    console.error(error)
  } finally {
    enviando.value = false
  }
}

function limparFormulario() {
  formulario.value = {
    nomeEmpresa: '',
    documento: '',
    telefoneEmpresa: '',
    emailEmpresa: '',
    endereco: '',
    segmentoNegocioId: '',
    planoId: '',
    responsavelNome: '',
    responsavelEmail: '',
    responsavelTelefone: '',
    mensagem: '',
  }
  aceiteContato.value = false
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.data || []
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

onMounted(() => {
  carregarOpcoes()
})
</script>

<template>
  <main class="pagina-publica">
    <section class="conteudo">
      <header class="cabecalho">
        <span class="marca">Gestão SaaS</span>
        <h1>Comece a usar o Gestão SaaS</h1>
        <p>
          Preencha os dados abaixo para solicitar o cadastro da sua empresa. Nossa equipe irá
          analisar e entrar em contato.
        </p>
      </header>

      <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
      <section v-if="sucesso" class="card sucesso"><p>{{ sucesso }}</p></section>

      <form class="card formulario" @submit.prevent="enviarSolicitacao">
        <section class="secao">
          <h2>Dados da empresa</h2>
          <div class="campos">
            <label>Nome da empresa <input v-model="formulario.nomeEmpresa" type="text" /></label>
            <label>Documento <input v-model="formulario.documento" type="text" /></label>
            <label>Telefone <input v-model="formulario.telefoneEmpresa" type="text" /></label>
            <label>E-mail da empresa <input v-model="formulario.emailEmpresa" type="email" /></label>
            <label class="campo-grande">Endereço <input v-model="formulario.endereco" type="text" /></label>
            <label>
              Segmento de negócio
              <select v-model="formulario.segmentoNegocioId" :disabled="carregando">
                <option value="">Selecione</option>
                <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">
                  {{ segmento.nome }}
                </option>
              </select>
            </label>
            <label>
              Plano desejado
              <select v-model="formulario.planoId" :disabled="carregando">
                <option value="">Selecione</option>
                <option v-for="plano in planos" :key="plano.id" :value="plano.id">
                  {{ plano.nome }}
                </option>
              </select>
            </label>
          </div>
        </section>

        <section class="secao">
          <h2>Responsável</h2>
          <div class="campos">
            <label>Nome do responsável <input v-model="formulario.responsavelNome" type="text" /></label>
            <label>E-mail do responsável <input v-model="formulario.responsavelEmail" type="email" /></label>
            <label>Telefone do responsável <input v-model="formulario.responsavelTelefone" type="text" /></label>
          </div>
        </section>

        <section class="secao">
          <h2>Mensagem</h2>
          <label class="campo-grande">
            Conte rapidamente o que você precisa
            <textarea v-model="formulario.mensagem" rows="4"></textarea>
          </label>
          <label class="checkbox">
            <input v-model="aceiteContato" type="checkbox" />
            Aceito ser contatado sobre minha solicitação
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
.pagina-publica {
  min-height: 100vh;
  background: #eef2f7;
  padding: 32px 18px;
  color: #111827;
}

.conteudo {
  max-width: 980px;
  margin: 0 auto;
  display: grid;
  gap: 18px;
}

.cabecalho {
  display: grid;
  gap: 8px;
}

.marca {
  color: #2563eb;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 36px;
  font-weight: 800;
}

.cabecalho p {
  color: #475569;
  font-size: 17px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.formulario,
.secao {
  display: grid;
  gap: 18px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
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
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 11px 12px;
  font: inherit;
  box-sizing: border-box;
  background: white;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.checkbox input {
  width: auto;
}

.botao {
  border: none;
  color: white;
  padding: 12px 18px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.principal {
  background: #2563eb;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 760px) {
  .campos {
    grid-template-columns: 1fr;
  }

  h1 {
    font-size: 30px;
  }
}
</style>
