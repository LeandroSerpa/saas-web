<script setup>
import { computed, ref } from 'vue'
import {
  aplicarTemplatePix,
  copiarTextoSeguro,
  gerarMensagemPixFallback,
  normalizarConfiguracaoPix,
} from '@/utils/pix'

const props = defineProps({
  configuracao: {
    type: Object,
    default: () => ({}),
  },
  previsaoServidor: {
    type: String,
    default: '',
  },
  carregandoServidor: {
    type: Boolean,
    default: false,
  },
  mostrarServidor: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['gerar-servidor'])

const cliente = ref('Mariana Lima')
const valor = ref('150,00')
const descricao = ref('Mensalidade')
const vencimento = ref(criarVencimentoPadrao())
const mensagemCopiada = ref('')
let temporizadorMensagem = null

const configuracaoNormalizada = computed(() => normalizarConfiguracaoPix(props.configuracao))

const dadosPrevia = computed(() => ({
  cliente: cliente.value,
  nomeResponsavel: cliente.value,
  valor: valor.value,
  descricao: descricao.value,
  nomeAcordo: descricao.value,
  vencimento: vencimento.value,
  chavePix: configuracaoNormalizada.value.chavePix,
  nomeRecebedorPix: configuracaoNormalizada.value.nomeRecebedor,
  nomeRecebedor: configuracaoNormalizada.value.nomeRecebedor,
}))

const previsaoLocal = computed(() => {
  const template = configuracaoNormalizada.value.templateMensagem

  return template ? aplicarTemplatePix(template, dadosPrevia.value) : gerarMensagemPixFallback(dadosPrevia.value)
})

async function copiarMensagem() {
  const valorTexto = previsaoLocal.value
  if (!valorTexto) {
    return
  }

  const copiou = await copiarTextoSeguro(valorTexto)
  if (!copiou) {
    return
  }

  mensagemCopiada.value = 'Mensagem copiada'
  if (temporizadorMensagem) {
    clearTimeout(temporizadorMensagem)
  }
  temporizadorMensagem = window.setTimeout(() => {
    mensagemCopiada.value = ''
  }, 1600)
}

function solicitarPreviaServidor() {
  emit('gerar-servidor', {
    cliente: cliente.value,
    valor: valor.value,
    descricao: descricao.value,
    vencimento: vencimento.value,
  })
}

function criarVencimentoPadrao() {
  const data = new Date()
  data.setDate(data.getDate() + 7)

  const ano = data.getFullYear()
  const mes = String(data.getMonth() + 1).padStart(2, '0')
  const dia = String(data.getDate()).padStart(2, '0')

  return `${ano}-${mes}-${dia}`
}
</script>

<template>
  <section class="pix-preview">
    <div class="cabecalho">
      <div>
        <p class="subtitulo">Prévia da mensagem</p>
        <h3>Teste como a cobrança vai aparecer</h3>
        <p>Preencha os dados abaixo para simular a mensagem localmente antes de salvar.</p>
      </div>
      <button class="botao secundario" type="button" :disabled="carregandoServidor" @click="copiarMensagem">
        {{ mensagemCopiada || 'Copiar mensagem' }}
      </button>
    </div>

    <div class="campos-teste">
      <label>
        Cliente
        <input v-model="cliente" type="text" placeholder="Nome do cliente" />
      </label>

      <label>
        Valor
        <input v-model="valor" type="text" inputmode="decimal" placeholder="150,00" />
      </label>

      <label class="campo-grande">
        Descrição
        <input v-model="descricao" type="text" placeholder="Mensalidade" />
      </label>

      <label>
        Vencimento
        <input v-model="vencimento" type="date" />
      </label>
    </div>

    <section class="bloco-previsao">
      <div class="cabecalho-previsao">
        <strong>Prévia local</strong>
        <button
          v-if="props.mostrarServidor"
          class="botao secundario"
          type="button"
          :disabled="carregandoServidor"
          @click="solicitarPreviaServidor"
        >
          {{ carregandoServidor ? 'Gerando...' : 'Gerar prévia pelo servidor' }}
        </button>
      </div>

      <pre class="previsualizacao">{{ previsaoLocal }}</pre>

      <p v-if="props.previsaoServidor" class="previsao-servidor">
        <strong>Prévia do servidor</strong>
        <span>{{ props.previsaoServidor }}</span>
      </p>
    </section>
  </section>
</template>

<style scoped>
.pix-preview {
  display: grid;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.cabecalho h3,
.cabecalho p,
.previsao-servidor {
  margin: 0;
}

.cabecalho h3 {
  color: #0f172a;
  font-size: 18px;
}

.cabecalho p,
.previsao-servidor {
  color: #64748b;
}

.campos-teste {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.campos-teste label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-weight: 700;
}

.campo-grande {
  grid-column: 1 / -1;
}

.bloco-previsao {
  display: grid;
  gap: 12px;
}

.cabecalho-previsao {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: center;
}

.previsualizacao {
  margin: 0;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #eff6ff;
  color: #0f172a;
  white-space: pre-wrap;
  word-break: break-word;
}

.previsao-servidor {
  display: grid;
  gap: 6px;
  padding: 12px 14px;
  border-radius: 14px;
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
}

@media (max-width: 760px) {
  .cabecalho,
  .cabecalho-previsao {
    flex-direction: column;
    align-items: stretch;
  }

  .campos-teste {
    grid-template-columns: 1fr;
  }

  .cabecalho .botao,
  .cabecalho-previsao .botao {
    width: 100%;
  }
}
</style>
