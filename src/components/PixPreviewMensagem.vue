<script setup>
import { computed, ref } from 'vue'
import {
  aplicarTemplatePix,
  copiarTextoSeguro,
  gerarTemplatePixPadrao,
  normalizarConfiguracaoPix,
  validarPlaceholdersPix,
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
  templateAutomatico: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['gerar-servidor'])

const mensagemCopiada = ref('')
let temporizadorMensagem = null

const configuracaoNormalizada = computed(() => normalizarConfiguracaoPix(props.configuracao))

const dadosFicticios = computed(() => ({
  nomeResponsavel: 'Mariana Lima',
  competencia: '06/2026',
  nomeAcordo: 'Mensalidade Beach Tennis',
  valor: 150,
  vencimento: '10/07/2026',
  chavePix: configuracaoNormalizada.value.chavePix || 'chave-pix@exemplo.com',
  nomeRecebedorPix: configuracaoNormalizada.value.nomeRecebedor || 'Recebedor Exemplo',
  empresa: 'NuvemMais Gestão',
  instrucoesPix: configuracaoNormalizada.value.instrucoesPix || 'Após o pagamento, envie o comprovante.',
}))

const validacaoTemplate = computed(() => validarPlaceholdersPix(configuracaoNormalizada.value.templateMensagem))
const templateAutomatizado = computed(() => props.templateAutomatico || gerarTemplatePixPadrao())
const templatePrevia = computed(() => {
  const templateAtual = String(configuracaoNormalizada.value.templateMensagem || '').trim()

  if (templateAtual && validacaoTemplate.value.valido) {
    return templateAtual
  }

  return templateAutomatizado.value
})

const previsaoLocal = computed(() => aplicarTemplatePix(templatePrevia.value, dadosFicticios.value))
const avisoPrevia = computed(() =>
  validacaoTemplate.value.valido
    ? 'Esta prévia usa dados fictícios. Na cobrança real, os dados vêm automaticamente da mensalidade e do acordo.'
    : validacaoTemplate.value.mensagem,
)

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
    ...dadosFicticios.value,
    templateMensagem: templatePrevia.value,
    mensagemCobrancaTemplate: templatePrevia.value,
  })
}
</script>

<template>
  <section class="pix-preview">
    <div class="cabecalho">
      <div>
        <p class="subtitulo">Prévia da mensagem</p>
        <h3>Teste como a cobrança vai aparecer</h3>
        <p>O sistema preenche os dados automaticamente. A configuração nunca precisa de valores reais digitados aqui.</p>
      </div>
      <button class="botao secundario" type="button" :disabled="carregandoServidor" @click="copiarMensagem">
        {{ mensagemCopiada || 'Copiar mensagem' }}
      </button>
    </div>

    <p class="aviso-ficticio">{{ avisoPrevia }}</p>

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
.previsao-servidor,
.aviso-ficticio {
  margin: 0;
}

.cabecalho h3 {
  color: #0f172a;
  font-size: 18px;
}

.cabecalho p,
.previsao-servidor,
.aviso-ficticio {
  color: #64748b;
}

.aviso-ficticio {
  padding: 10px 12px;
  border-radius: 12px;
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
  font-weight: 700;
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

  .cabecalho .botao,
  .cabecalho-previsao .botao {
    width: 100%;
  }
}
</style>
