<script setup>
import { computed, onMounted, ref } from 'vue'
import PixCopyBox from '@/components/PixCopyBox.vue'
import PixPreviewMensagem from '@/components/PixPreviewMensagem.vue'
import {
  PLACEHOLDERS_PIX_PERMITIDOS,
  gerarTemplatePixPadrao,
  mascararChavePix,
  montarTemplatePixPorSelecao,
  normalizarConfiguracaoPix,
  validarConfiguracaoPix,
  validarPlaceholdersPix,
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
  mostrarAcoes: {
    type: Boolean,
    default: true,
  },
})

const emit = defineEmits(['update:modelValue', 'salvar', 'resetar', 'gerar-previsao-servidor'])

const configuracaoNormalizada = computed(() => normalizarConfiguracaoPix(props.modelValue))
const validacaoConfiguracao = computed(() => validarConfiguracaoPix(props.modelValue))
const validacaoTemplate = computed(() => validarPlaceholdersPix(configuracaoNormalizada.value.templateMensagem))
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
const templateAutomatico = computed(() => montarTemplatePixPorSelecao(opcoesMontagem.value))
const templateAtual = computed(() => String(configuracaoNormalizada.value.templateMensagem || '').trim())
const templatePrevia = computed(() =>
  templateAtual.value && validacaoTemplate.value.valido ? templateAtual.value : templateAutomatico.value,
)
const erroTemplate = computed(() => (validacaoTemplate.value.valido ? '' : validacaoTemplate.value.mensagem))
const podeSalvar = computed(() => validacaoConfiguracao.value.valido && validacaoTemplate.value.valido)
const ajudaTipo = computed(
  () => TIPOS_CHAVE_PIX.find((item) => item.valor === configuracaoNormalizada.value.tipoChavePix)?.ajuda || 'Escolha o tipo da chave.',
)

const templateTextarea = ref(null)
const editorAvancadoAberto = ref(false)
const opcoesMontagem = ref(criarOpcoesMontagemPadrao())

const TIPOS_CHAVE_PIX = [
  { valor: 'CPF', rotulo: 'CPF' },
  { valor: 'CNPJ', rotulo: 'CNPJ' },
  { valor: 'EMAIL', rotulo: 'E-mail' },
  { valor: 'TELEFONE', rotulo: 'Telefone' },
  { valor: 'ALEATORIA', rotulo: 'Chave aleatória' },
]

const OPCOES_MONTAGEM_PIX = [
  { campo: 'incluirNomeResponsavel', rotulo: 'Incluir nome do responsável', ativoPadrao: true },
  { campo: 'incluirCompetencia', rotulo: 'Incluir competência', ativoPadrao: true },
  { campo: 'incluirNomeAcordo', rotulo: 'Incluir nome do acordo', ativoPadrao: true },
  { campo: 'incluirValor', rotulo: 'Incluir valor', ativoPadrao: true },
  { campo: 'incluirVencimento', rotulo: 'Incluir vencimento', ativoPadrao: true },
  { campo: 'incluirChavePix', rotulo: 'Incluir chave PIX', ativoPadrao: true },
  { campo: 'incluirNomeRecebedorPix', rotulo: 'Incluir nome do recebedor', ativoPadrao: false },
  { campo: 'incluirEmpresa', rotulo: 'Incluir nome da empresa', ativoPadrao: false },
  { campo: 'incluirInstrucoesPix', rotulo: 'Incluir instruções PIX', ativoPadrao: true },
  { campo: 'incluirPedidoComprovante', rotulo: 'Incluir pedido de comprovante', ativoPadrao: true },
]

const PLACEHOLDER_BOTOES = [
  { chave: 'nomeResponsavel', rotulo: 'Nome do responsável', texto: '{nomeResponsavel}' },
  { chave: 'competencia', rotulo: 'Competência', texto: '{competencia}' },
  { chave: 'nomeAcordo', rotulo: 'Nome do acordo', texto: '{nomeAcordo}' },
  { chave: 'valor', rotulo: 'Valor', texto: '{valor}' },
  { chave: 'vencimento', rotulo: 'Vencimento', texto: '{vencimento}' },
  { chave: 'chavePix', rotulo: 'Chave PIX', texto: '{chavePix}' },
  { chave: 'nomeRecebedorPix', rotulo: 'Nome do recebedor', texto: '{nomeRecebedorPix}' },
  { chave: 'empresa', rotulo: 'Empresa', texto: '{empresa}' },
  { chave: 'instrucoesPix', rotulo: 'Instruções PIX', texto: '{instrucoesPix}' },
]

const PLACEHOLDER_ROTULOS = Object.freeze(
  PLACEHOLDERS_PIX_PERMITIDOS.reduce((mapa, placeholder) => {
    const rotulos = {
      nomeResponsavel: 'Nome do responsável',
      competencia: 'Competência',
      nomeAcordo: 'Nome do acordo',
      valor: 'Valor',
      vencimento: 'Vencimento',
      chavePix: 'Chave PIX',
      nomeRecebedorPix: 'Nome do recebedor',
      empresa: 'Empresa',
      instrucoesPix: 'Instruções PIX',
    }

    mapa[placeholder] = rotulos[placeholder] || placeholder
    return mapa
  }, {}),
)

function criarOpcoesMontagemPadrao() {
  return OPCOES_MONTAGEM_PIX.reduce((acc, item) => {
    acc[item.campo] = item.ativoPadrao
    return acc
  }, {})
}

function atualizarCampos(parcial) {
  emit('update:modelValue', {
    ...(props.modelValue || {}),
    ...parcial,
  })
}

function atualizarCampo(campo, valor) {
  atualizarCampos({ [campo]: valor })
}

function atualizarTexto(campo, valor) {
  const texto = String(valor ?? '')

  if (campo === 'templateMensagem') {
    atualizarCampos({
      templateMensagem: texto,
      mensagemCobrancaTemplate: texto,
    })
    return
  }

  atualizarCampo(campo, texto)
}

function atualizarBooleano(campo, valor) {
  atualizarCampo(campo, Boolean(valor))
}

function aplicarTemplateAutomatico() {
  const template = templateAutomatico.value
  atualizarCampos({
    templateMensagem: template,
    mensagemCobrancaTemplate: template,
  })
}

function restaurarPadrao() {
  opcoesMontagem.value = criarOpcoesMontagemPadrao()
  aplicarTemplateAutomatico()
}

function inserirPlaceholder(chave) {
  const placeholder = `{${chave}}`
  const textarea = templateTextarea.value
  const textoAtual = templateAtual.value || ''

  if (!textarea || typeof textarea.selectionStart !== 'number' || typeof textarea.selectionEnd !== 'number') {
    atualizarTexto('templateMensagem', `${textoAtual}${textoAtual ? ' ' : ''}${placeholder}`)
    return
  }

  const inicio = textarea.selectionStart
  const fim = textarea.selectionEnd
  const novoTexto = `${textoAtual.slice(0, inicio)}${placeholder}${textoAtual.slice(fim)}`
  atualizarTexto('templateMensagem', novoTexto)

  requestAnimationFrame(() => {
    textarea.focus()
    const novaPosicao = inicio + placeholder.length
    textarea.setSelectionRange(novaPosicao, novaPosicao)
  })
}

function atualizarOpcaoMontagem(campo, valor) {
  opcoesMontagem.value = {
    ...opcoesMontagem.value,
    [campo]: Boolean(valor),
  }

  aplicarTemplateAutomatico()
}

function gerarPreviaServidor(payload) {
  emit('gerar-previsao-servidor', payload)
}

function salvarConfiguracao() {
  atualizarCampos({
    templateMensagem: templatePrevia.value,
    mensagemCobrancaTemplate: templatePrevia.value,
  })
  emit('salvar')
}

onMounted(() => {
  if (!templateAtual.value && !validacaoTemplate.value.valido) {
    return
  }

  if (!templateAtual.value) {
    aplicarTemplateAutomatico()
  }
})
</script>

<template>
  <section class="pix-formulario">
    <div class="cabecalho">
      <div>
        <p class="subtitulo">PIX</p>
        <h2>Configuração da chave PIX</h2>
        <p>
          Configure a chave, o recebedor e a mensagem usada nas cobranças. A montagem automática é o caminho padrão, e
          o texto avançado fica recolhido.
        </p>
      </div>

      <div v-if="props.mostrarAcoes" class="acoes-cabecalho">
        <button class="botao secundario" type="button" :disabled="props.salvando || props.carregando" @click="emit('resetar')">
          {{ props.salvando ? '...' : 'Resetar' }}
        </button>
        <button
          class="botao principal"
          type="button"
          :disabled="props.salvando || props.carregando || !podeSalvar"
          @click="salvarConfiguracao"
        >
          {{ props.salvando ? 'Salvando...' : 'Salvar PIX' }}
        </button>
      </div>
    </div>

    <section v-if="props.carregando" class="feedback carregando">Carregando configuração de PIX...</section>
    <section v-if="props.erro" class="feedback erro">{{ props.erro }}</section>
    <section v-else-if="props.sucesso" class="feedback sucesso">{{ props.sucesso }}</section>

    <section :class="['status-pix', { ativo: possuiPixPreenchido, incompleto: erroTemplate || !validacaoConfiguracao.valido }]">
      <strong>{{ possuiPixPreenchido ? 'Configuração em edição' : 'PIX desativado' }}</strong>
      <p v-if="erroTemplate">{{ erroTemplate }}</p>
      <p v-else-if="!validacaoConfiguracao.valido">{{ validacaoConfiguracao.mensagem }}</p>
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
    </div>

    <section class="card montagem-automatica">
      <div class="cabecalho-card">
        <div>
          <p class="subtitulo">Montagem automática da mensagem</p>
          <h3>Escolha quais dados entram no texto</h3>
          <p>Os valores reais são preenchidos pelo sistema na cobrança. Aqui você só decide o que exibir.</p>
        </div>

        <div class="acoes-painel">
          <button class="botao secundario" type="button" :disabled="props.carregando" @click="aplicarTemplateAutomatico">
            Usar modelo automático
          </button>
          <button class="botao secundario" type="button" :disabled="props.carregando" @click="restaurarPadrao">
            Restaurar padrão
          </button>
        </div>
      </div>

      <div class="lista-opcoes">
        <label v-for="opcao in OPCOES_MONTAGEM_PIX" :key="opcao.campo" class="item-opcao">
          <input
            :checked="opcoesMontagem[opcao.campo]"
            :disabled="props.carregando"
            type="checkbox"
            @change="atualizarOpcaoMontagem(opcao.campo, $event.target.checked)"
          />
          <span>{{ opcao.rotulo }}</span>
        </label>
      </div>
    </section>

    <details
      class="card secao-avancada"
      :open="editorAvancadoAberto"
      @toggle="editorAvancadoAberto = $event.target.open"
    >
      <summary class="secao-avancada-summary">
        <div>
          <p class="subtitulo">Editar texto avançado</p>
          <h3>Personalização manual da mensagem</h3>
          <p>Use esta área apenas se precisar ajustar a redação ou a ordem do texto.</p>
        </div>
        <span class="secao-avancada-acao">Abrir ou fechar</span>
      </summary>

      <div class="campos campos-avancados">
        <label class="campo-grande">
          Texto avançado
          <textarea
            ref="templateTextarea"
            :value="templateAtual"
            :disabled="props.carregando"
            rows="8"
            placeholder="Ajuste o texto se precisar. Os placeholders válidos podem ser inseridos pelos botões abaixo."
            @input="atualizarTexto('templateMensagem', $event.target.value)"
          ></textarea>
        </label>
      </div>

      <p v-if="erroTemplate" class="feedback-lista erro-inline aviso-pix">{{ erroTemplate }}</p>
      <p v-else class="ajuda-campo aviso-pix">
        Pressione um marcador para inserir o placeholder no texto. Você também pode voltar ao modelo automático a qualquer momento.
      </p>

      <div class="lista-placeholders">
        <button
          v-for="placeholder in PLACEHOLDER_BOTOES"
          :key="placeholder.chave"
          class="placeholder-item botao-placeholder"
          type="button"
          :disabled="props.carregando"
          @click="inserirPlaceholder(placeholder.chave)"
        >
          <code v-text="placeholder.texto"></code>
          <span>{{ placeholder.rotulo }}</span>
        </button>
      </div>

      <div class="acoes-avancadas">
        <button class="botao secundario" type="button" :disabled="props.carregando" @click="aplicarTemplateAutomatico">
          Usar modelo automático
        </button>
        <button class="botao secundario" type="button" :disabled="props.carregando" @click="restaurarPadrao">
          Restaurar padrão
        </button>
      </div>
    </details>

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
      :template-automatico="templateAutomatico"
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
.cabecalho h3,
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

.acoes-cabecalho,
.acoes-painel,
.acoes-avancadas {
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

.montagem-automatica {
  display: grid;
  gap: 14px;
  border: 1px solid #e2e8f0;
  border-radius: 16px;
  padding: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
}

.montagem-automatica h3,
.montagem-automatica p {
  margin: 0;
}

.lista-opcoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
}

.item-opcao {
  display: flex;
  gap: 10px;
  align-items: center;
  padding: 12px 14px;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #ffffff;
  color: #0f172a;
  font-weight: 700;
}

.item-opcao input {
  width: 18px;
  height: 18px;
  margin: 0;
  accent-color: #2563eb;
}

.secao-avancada {
  display: grid;
  gap: 16px;
}

.secao-avancada summary {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  cursor: pointer;
  list-style: none;
}

.secao-avancada summary::-webkit-details-marker {
  display: none;
}

.secao-avancada-acao {
  display: inline-flex;
  align-items: center;
  flex: 0 0 auto;
  white-space: nowrap;
}

.campos-avancados {
  padding-top: 4px;
}

.lista-placeholders {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 10px;
}

.placeholder-item {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 12px 14px;
  display: grid;
  gap: 6px;
  background: var(--app-surface-strong);
}

.botao-placeholder {
  text-align: left;
  cursor: pointer;
}

.placeholder-item code {
  font-weight: 900;
  color: #2563eb;
  white-space: nowrap;
}

.placeholder-item span {
  color: #475569;
  font-weight: 700;
}

.cartoes-rapidos {
  display: grid;
  gap: 12px;
}

.feedback-lista {
  margin: 0;
  color: #64748b;
  font-weight: 700;
}

.erro-inline {
  color: #dc2626;
}

.aviso-pix,
.aviso-whatsapp {
  margin: 12px 0 0;
}

.aviso-whatsapp {
  color: #475569;
}

.ajuda-campo {
  color: #475569;
  font-weight: 700;
}

.botao {
  border: 1px solid transparent;
  border-radius: 14px;
  padding: 10px 16px;
  cursor: pointer;
  font-weight: 800;
  transition: transform 0.15s ease, opacity 0.15s ease, background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
  color: white;
}

.secundario {
  background: #ffffff;
  color: #0f172a;
  border-color: #dbeafe;
}

@media (max-width: 760px) {
  .cabecalho,
  .acoes-cabecalho,
  .secao-avancada summary,
  .lista-opcoes,
  .lista-placeholders {
    grid-template-columns: 1fr;
  }

  .cabecalho,
  .secao-avancada summary {
    flex-direction: column;
    align-items: stretch;
  }

  .campos {
    grid-template-columns: 1fr;
  }

  .acoes-cabecalho .botao,
  .acoes-painel .botao,
  .acoes-avancadas .botao {
    width: 100%;
  }
}
</style>
