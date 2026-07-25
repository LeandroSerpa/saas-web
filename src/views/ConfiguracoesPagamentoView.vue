<script setup>
import { computed, onMounted, ref } from 'vue'
import PixConfigForm from '@/components/PixConfigForm.vue'
import {
  buscarConfiguracaoPixEmpresa,
  buscarMetodosPagamentoAdmin,
  gerarPreviewMensagemPix,
  resetarConfiguracaoPixEmpresa,
  salvarConfiguracaoPixEmpresa,
} from '@/services/api'
import {
  gerarTemplatePixPadrao,
  montarPayloadPix,
  normalizarConfiguracaoPix,
  validarConfiguracaoPix,
  validarPlaceholdersPix,
} from '@/utils/pix'
import { METODOS_PAGAMENTO, normalizarListaMetodosPagamento } from '@/utils/metodosPagamento'

const metodosBase = METODOS_PAGAMENTO

const ativos = ref(['PIX'])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const carregandoPix = ref(true)
const salvandoPix = ref(false)
const erroPix = ref('')
const sucessoPix = ref('')
const previsaoServidorPix = ref('')
const carregandoPrevisaoServidorPix = ref(false)
const configuracaoPix = ref(criarConfiguracaoPixPadrao())

const pixDesmarcado = computed(() => !ativos.value.includes('PIX'))

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const dados = await buscarMetodosPagamentoAdmin()
    const selecionados = normalizarListaMetodosPagamento(dados)
    ativos.value = selecionados.length ? selecionados : ['PIX']
  } catch (error) {
    ativos.value = ['PIX']
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as configurações de pagamento.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function carregarConfiguracaoPix() {
  try {
    carregandoPix.value = true
    erroPix.value = ''
    sucessoPix.value = ''
    previsaoServidorPix.value = ''
    const dados = await buscarConfiguracaoPixEmpresa()
    configuracaoPix.value = normalizarConfiguracaoPix(dados)
  } catch (error) {
    configuracaoPix.value = criarConfiguracaoPixPadrao()
    erroPix.value = obterMensagemErro(error, 'Não foi possível carregar a configuração de PIX.')
    console.error(error)
  } finally {
    carregandoPix.value = false
  }
}

async function salvar() {
  if (!ativos.value.length) {
    erro.value = 'Selecione pelo menos um método de pagamento.'
    sucesso.value = ''
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''

    const metodosAtivos = metodosBase
      .map((metodo) => metodo.codigo)
      .filter((codigo) => ativos.value.includes(codigo))

    await salvarMetodosPagamentoAdmin({ metodosAtivos })
    ativos.value = metodosAtivos
    sucesso.value = 'Configurações de pagamento salvas com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar as configurações de pagamento.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function criarConfiguracaoPixPadrao() {
  return normalizarConfiguracaoPix({
    pixAtivo: false,
    tipoChavePix: '',
    chavePix: '',
    nomeRecebedor: '',
    instrucoesPix: '',
    templateMensagem: gerarTemplatePixPadrao(),
  })
}

async function salvarConfiguracaoPix(payload = {}) {
  const configuracaoParaSalvar = {
    ...configuracaoPix.value,
    ...payload,
  }
  const validacao = validarConfiguracaoPix(configuracaoParaSalvar)
  const validacaoTemplate = validarPlaceholdersPix(configuracaoParaSalvar.templateMensagem)

  if (!validacao.valido) {
    erroPix.value = validacao.mensagem
    sucessoPix.value = ''
    return
  }

  if (!validacaoTemplate.valido) {
    erroPix.value = validacaoTemplate.mensagem
    sucessoPix.value = ''
    return
  }

  try {
    salvandoPix.value = true
    erroPix.value = ''
    sucessoPix.value = ''
    configuracaoPix.value = normalizarConfiguracaoPix(configuracaoParaSalvar)
    await salvarConfiguracaoPixEmpresa(montarPayloadPix(configuracaoPix.value))
    await carregarConfiguracaoPix()
    sucessoPix.value = 'Configuração de PIX salva com sucesso.'
  } catch (error) {
    erroPix.value = obterMensagemErro(error, 'Não foi possível salvar a configuração de PIX.')
    console.error(error)
  } finally {
    salvandoPix.value = false
  }
}

async function resetarConfiguracaoPix() {
  if (typeof window !== 'undefined' && !window.confirm('Restaurar a configuração de PIX para o padrão?')) {
    return
  }

  try {
    salvandoPix.value = true
    erroPix.value = ''
    sucessoPix.value = ''
    await resetarConfiguracaoPixEmpresa()
    configuracaoPix.value = criarConfiguracaoPixPadrao()
    previsaoServidorPix.value = ''
    sucessoPix.value = 'Configuração de PIX restaurada com sucesso.'
  } catch (error) {
    erroPix.value = obterMensagemErro(error, 'Não foi possível restaurar a configuração de PIX.')
    console.error(error)
  } finally {
    salvandoPix.value = false
  }
}

async function gerarPreviaServidorPix(dadosTeste) {
  const configuracaoParaPrevia = {
    ...configuracaoPix.value,
    ...dadosTeste,
  }
  const validacao = validarConfiguracaoPix(configuracaoParaPrevia)
  const validacaoTemplate = validarPlaceholdersPix(configuracaoParaPrevia.templateMensagem)

  if (!validacao.valido) {
    erroPix.value = validacao.mensagem
    return
  }

  if (!validacaoTemplate.valido) {
    erroPix.value = validacaoTemplate.mensagem
    return
  }

  try {
    carregandoPrevisaoServidorPix.value = true
    erroPix.value = ''
    sucessoPix.value = ''

    const resposta = await gerarPreviewMensagemPix({
      ...montarPayloadPix(configuracaoParaPrevia),
      ...dadosTeste,
    })

    previsaoServidorPix.value =
      resposta?.mensagemPreview ||
      resposta?.mensagem ||
      resposta?.preview ||
      resposta?.textoMensagem ||
      resposta?.texto ||
      ''
  } catch (error) {
    previsaoServidorPix.value = ''
    erroPix.value = obterMensagemErro(error, 'Não foi possível gerar a prévia pelo servidor.')
    console.error(error)
  } finally {
    carregandoPrevisaoServidorPix.value = false
  }
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

onMounted(() => {
  carregarDados()
  carregarConfiguracaoPix()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração NuvemMais</p>
        <h1>Configurações de pagamento</h1>
        <p class="descricao">Escolha quais métodos aparecem ao criar faturas manualmente.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="card aviso-pix">
      <strong>O PIX é o método padrão das faturas recorrentes automáticas.</strong>
      <p v-if="pixDesmarcado">Atenção: faturas recorrentes usam PIX por padrão. Recomendamos manter PIX ativo.</p>
    </section>

    <section class="card pix-card">
      <PixConfigForm
        v-model="configuracaoPix"
        :carregando="carregandoPix"
        :erro="erroPix"
        :sucesso="sucessoPix"
        :salvando="salvandoPix"
        :carregando-previsao-servidor="carregandoPrevisaoServidorPix"
        :previsao-servidor="previsaoServidorPix"
        :previsao-servidor-disponivel="true"
        @salvar="salvarConfiguracaoPix"
        @resetar="resetarConfiguracaoPix"
        @gerar-previsao-servidor="gerarPreviaServidorPix"
      />
    </section>

    <section class="card painel">
      <div class="painel-conteudo">
        <h2>Métodos ativos</h2>
        <p>O Administrador NuvemMais pode marcar os métodos exibidos na criação manual de faturas.</p>

        <div class="lista-metodos">
          <label v-for="metodo in metodosBase" :key="metodo.codigo" class="metodo">
            <input v-model="ativos" type="checkbox" :value="metodo.codigo" />
            <span>{{ metodo.rotulo }}</span>
          </label>
        </div>

        <div class="acoes-painel">
          <button class="botao principal" :disabled="salvando || carregando" @click="salvar">
            {{ salvando ? 'Salvando...' : 'Salvar configurações' }}
          </button>
        </div>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
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
  font-size: 32px;
}

.descricao,
.painel p {
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.aviso-pix {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.aviso-pix p {
  margin-top: 8px;
  color: #92400e;
}

.pix-card {
  display: grid;
}

.painel {
  display: grid;
  gap: 18px;
}

.painel-conteudo {
  display: grid;
  gap: 16px;
}

.lista-metodos {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 12px;
}

.metodo {
  display: grid;
  grid-template-columns: 18px minmax(0, 1fr);
  align-items: center;
  gap: 12px;
  min-height: 56px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 12px 14px;
  font-weight: 800;
  line-height: 1.35;
}

.metodo input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #2563eb;
}

.metodo span {
  min-width: 0;
}

.acoes-painel {
  display: flex;
  justify-content: flex-start;
}

.botao {
  width: fit-content;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 760px) {
  .cabecalho-pagina {
    align-items: flex-start;
    flex-direction: column;
  }

  .lista-metodos {
    grid-template-columns: 1fr;
  }

  .acoes-painel,
  .botao {
    width: 100%;
  }
}
</style>
