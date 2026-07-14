<script setup>
import { computed } from 'vue'
import PixCopyBox from '@/components/PixCopyBox.vue'
import PixPreviewMensagem from '@/components/PixPreviewMensagem.vue'
import {
  TIPOS_CHAVE_PIX,
  mascararChavePix,
  normalizarConfiguracaoPix,
  validarConfiguracaoPix,
} from '@/utils/pix'

const props = defineProps({
  modelValue: {
    type: Object,
    default: () => ({}),
  },
  carregando: {
    type: Boolean,
    default: false,
  },
  salvando: {
    type: Boolean,
    default: false,
  },
  erro: {
    type: String,
    default: '',
  },
  sucesso: {
    type: String,
    default: '',
  },
  previsaoServidor: {
    type: String,
    default: '',
  },
  carregandoPrevisaoServidor: {
    type: Boolean,
    default: false,
  },
  previsaoServidorDisponivel: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'salvar', 'resetar', 'gerar-previsao-servidor'])

const configuracaoNormalizada = computed(() => normalizarConfiguracaoPix(props.modelValue))

const validacao = computed(() => validarConfiguracaoPix(props.modelValue))
const ajudaTipo = computed(
  () => TIPOS_CHAVE_PIX.find((item) => item.valor === configuracaoNormalizada.value.tipoChavePix)?.ajuda || 'Escolha o tipo da chave.',
)
const chaveMascarada = computed(() =>
  mascararChavePix(configuracaoNormalizada.value.chavePix, configuracaoNormalizada.value.tipoChavePix),
)
const possuiPixPreenchido = computed(() =>
  Boolean(
    configuracaoNormalizada.value.pixAtivo ||
      configuracaoNormalizada.value.tipoChavePix ||
      configuracaoNormalizada.value.chavePix ||
      configuracaoNormalizada.value.nomeRecebedor ||
      configuracaoNormalizada.value.instrucoesPix ||
      configuracaoNormalizada.value.templateMensagem,
  ),
)

function atualizarCampo(campo, valor) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    [campo]: valor,
  })
}

function atualizarBooleano(campo, valor) {
  atualizarCampo(campo, Boolean(valor))
}

function atualizarTexto(campo, valor) {
  atualizarCampo(campo, String(valor ?? ''))
}

function gerarPreviaServidor(payload) {
  emit('gerar-previsao-servidor', payload)
}
</script>

<template>
  <section class="pix-formulario">
    <div class="cabecalho">
      <div>
        <p class="subtitulo">PIX</p>
        <h2>Configuração da chave PIX</h2>
        <p>
          Configure a chave, o recebedor e a mensagem usada nas cobranças. Se o PIX estiver desativado, deixe os campos em branco.
        </p>
      </div>

      <div class="acoes-cabecalho">
        <button class="botao secundario" type="button" :disabled="props.salvando || props.carregando" @click="emit('resetar')">
          {{ props.salvando ? '...' : 'Resetar' }}
        </button>
        <button class="botao principal" type="button" :disabled="props.salvando || props.carregando" @click="emit('salvar')">
          {{ props.salvando ? 'Salvando...' : 'Salvar PIX' }}
        </button>
      </div>
    </div>

    <section v-if="props.carregando" class="feedback carregando">Carregando configuração de PIX...</section>
    <section v-if="props.erro" class="feedback erro">{{ props.erro }}</section>
    <section v-else-if="props.sucesso" class="feedback sucesso">{{ props.sucesso }}</section>

    <section :class="['status-pix', { ativo: possuiPixPreenchido, incompleto: validacao.mensagem }]">
      <strong>{{ possuiPixPreenchido ? 'Configuração em edição' : 'PIX desativado' }}</strong>
      <p v-if="validacao.mensagem">{{ validacao.mensagem }}</p>
      <p v-else-if="possuiPixPreenchido">A configuração está pronta para ser salva.</p>
      <p v-else>Deixe os campos vazios se a empresa não utilizar PIX.</p>
    </section>

    <div class="campos">
      <label class="checkbox-pix">
        <input
          :checked="configuracaoNormalizada.pixAtivo"
          :disabled="props.carregando"
          type="checkbox"
          @change="atualizarBooleano('pixAtivo', $event.target.checked)"
        />
        <span>PIX ativo</span>
      </label>

      <label>
        Tipo da chave PIX
        <select
          :disabled="props.carregando"
          :value="configuracaoNormalizada.tipoChavePix"
          @change="atualizarTexto('tipoChavePix', $event.target.value)"
        >
          <option value="">Selecione</option>
          <option v-for="tipo in TIPOS_CHAVE_PIX" :key="tipo.valor" :value="tipo.valor">
            {{ tipo.rotulo }}
          </option>
        </select>
        <small>{{ ajudaTipo }}</small>
      </label>

      <label class="campo-grande">
        Chave PIX
        <input
          :value="props.modelValue.chavePix || ''"
          :disabled="props.carregando"
          type="text"
          :placeholder="configuracaoNormalizada.tipoChavePix === 'EMAIL' ? 'exemplo@dominio.com' : 'Digite a chave PIX'"
          @input="atualizarTexto('chavePix', $event.target.value)"
        />
      </label>

      <label>
        Nome do recebedor
        <input
          :value="props.modelValue.nomeRecebedor || props.modelValue.nomeRecebedorPix || ''"
          :disabled="props.carregando"
          type="text"
          placeholder="Nome que aparece na cobrança"
          @input="atualizarTexto('nomeRecebedor', $event.target.value)"
        />
      </label>

      <label class="campo-grande">
        Instruções PIX
        <textarea
          :value="props.modelValue.instrucoesPix || ''"
          :disabled="props.carregando"
          rows="4"
          placeholder="Ex: Envie o comprovante após o pagamento."
          @input="atualizarTexto('instrucoesPix', $event.target.value)"
        ></textarea>
      </label>

      <label class="campo-grande">
        Template da mensagem
        <textarea
          :value="props.modelValue.templateMensagem || props.modelValue.mensagemCobrancaTemplate || ''"
          :disabled="props.carregando"
          rows="6"
          placeholder="Use {cliente}, {valor}, {descricao}, {vencimento} e {chavePix}"
          @input="atualizarTexto('templateMensagem', $event.target.value)"
        ></textarea>
      </label>
    </div>

    <div class="cartoes-rapidos">
      <PixCopyBox
        titulo="Chave PIX configurada"
        ajuda="Copie a chave para conferir ou compartilhar com a equipe."
        :valor="props.modelValue.chavePix || ''"
        :texto="chaveMascarada"
        texto-vazio="Nenhuma chave configurada."
        botao-texto="Copiar chave"
        :desabilitado="props.carregando"
      />
    </div>

    <PixPreviewMensagem
      :configuracao="props.modelValue"
      :carregando-servidor="props.carregandoPrevisaoServidor"
      :mostrar-servidor="props.previsaoServidorDisponivel"
      :previsao-servidor="props.previsaoServidor"
      @gerar-servidor="gerarPreviaServidor"
    />
  </section>
</template>

<style scoped>
.pix-formulario {
  display: grid;
  gap: 16px;
}

.cabecalho {
  display: flex;
  justify-content: space-between;
  gap: 16px;
  align-items: flex-start;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.cabecalho h2,
.cabecalho p {
  margin: 0;
}

.cabecalho h2 {
  color: #0f172a;
  font-size: 24px;
}

.cabecalho p {
  color: #64748b;
}

.acoes-cabecalho {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.feedback,
.status-pix {
  border-radius: 14px;
  padding: 14px 16px;
}

.feedback.erro {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.carregando {
  border: 1px solid #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.feedback.sucesso {
  border: 1px solid #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.status-pix {
  border: 1px solid #e2e8f0;
  background: #f8fafc;
  color: #334155;
  display: grid;
  gap: 4px;
}

.status-pix.ativo {
  border-color: #bfdbfe;
  background: #eff6ff;
}

.status-pix.incompleto {
  border-color: #fcd34d;
  background: #fffbeb;
}

.status-pix strong,
.status-pix p {
  margin: 0;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.campos label {
  display: grid;
  gap: 6px;
  color: #334155;
  font-weight: 700;
}

.campos small {
  color: #64748b;
  font-weight: 600;
}

.campo-grande {
  grid-column: 1 / -1;
}

.checkbox-pix {
  display: inline-flex !important;
  flex-direction: row !important;
  align-items: center;
  gap: 10px;
  padding: 14px 16px;
  border-radius: 14px;
  border: 1px solid #dbeafe;
  background: #f8fbff;
}

.checkbox-pix input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #2563eb;
}

.cartoes-rapidos {
  display: grid;
  gap: 12px;
}

@media (max-width: 760px) {
  .cabecalho,
  .acoes-cabecalho {
    flex-direction: column;
    align-items: stretch;
  }

  .acoes-cabecalho .botao {
    width: 100%;
  }

  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
