<script setup>
import { reactive, ref } from 'vue'
import {
  criarManipuladorPasteNumerico,
  decimalValido,
  inteiroPositivoValido,
  normalizarDecimalParaBackend,
  sanitizarDecimal,
  sanitizarInteiroPositivo,
} from '@/utils/validacoes'

const servico = defineModel({
  type: Object,
  required: true,
})

defineProps({
  mensagemSucesso: {
    type: String,
    default: '',
  },
  modoEdicao: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['salvar', 'cancelar'])
const erroValidacao = ref('')
const errosCampos = reactive({
  preco: '',
  duracaoMinutos: '',
})

const aoColarPreco = criarManipuladorPasteNumerico(sanitizarDecimal)
const aoColarDuracao = criarManipuladorPasteNumerico(sanitizarInteiroPositivo)

function limparErroCampo(campo) {
  errosCampos[campo] = ''
  erroValidacao.value = ''
}

function aplicarPreco(valor) {
  servico.value.preco = sanitizarDecimal(valor)
  limparErroCampo('preco')
}

function aplicarDuracao(valor) {
  servico.value.duracaoMinutos = sanitizarInteiroPositivo(valor)
  limparErroCampo('duracaoMinutos')
}

function validarPreco() {
  if (!decimalValido(servico.value.preco)) {
    const mensagem = 'Informe um preço válido.'
    errosCampos.preco = mensagem
    erroValidacao.value = mensagem
    return false
  }

  servico.value.preco = String(normalizarDecimalParaBackend(servico.value.preco) ?? '')
  errosCampos.preco = ''
  return true
}

function validarDuracao() {
  if (!inteiroPositivoValido(servico.value.duracaoMinutos)) {
    const mensagem = 'Informe a duração em minutos com números inteiros positivos.'
    errosCampos.duracaoMinutos = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.duracaoMinutos = ''
  return true
}

function solicitarSalvamento() {
  erroValidacao.value = ''
  const precoValido = validarPreco()
  const duracaoValida = validarDuracao()
  if (!precoValido || !duracaoValida) return
  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar serviço' : 'Novo serviço' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do serviço selecionado.'
            : 'Cadastre um serviço para disponibilizar nos agendamentos.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="servico.nome" type="text" placeholder="Ex: Consulta inicial" />
      </label>

      <label>
        Preço *
        <input
          :value="servico.preco"
          type="text"
          inputmode="decimal"
          placeholder="Ex: 120,00"
          @input="aplicarPreco($event.target.value)"
          @blur="validarPreco"
          @paste="aoColarPreco($event, (valor) => aplicarPreco(valor))"
        />
        <span v-if="errosCampos.preco" class="erro-texto">{{ errosCampos.preco }}</span>
      </label>

      <label>
        Duração em minutos *
        <input
          :value="servico.duracaoMinutos"
          type="text"
          inputmode="numeric"
          placeholder="Ex: 60"
          @input="aplicarDuracao($event.target.value)"
          @blur="validarDuracao"
          @paste="aoColarDuracao($event, (valor) => aplicarDuracao(valor))"
        />
        <span v-if="errosCampos.duracaoMinutos" class="erro-texto">{{ errosCampos.duracaoMinutos }}</span>
      </label>

      <label class="campo-checkbox">
        <input v-model="servico.ativo" type="checkbox" />
        Ativo
      </label>

      <label class="campo-grande">
        Descrição
        <input
          v-model="servico.descricao"
          type="text"
          placeholder="Ex: Atendimento completo com avaliação"
        />
      </label>
    </div>

    <p v-if="erroValidacao" class="erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar serviço' }}
      </button>

      <button v-if="modoEdicao" class="botao neutro" @click="$emit('cancelar')">
        Cancelar edição
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
