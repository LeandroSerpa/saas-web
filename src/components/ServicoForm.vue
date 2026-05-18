<script setup>
import { ref } from 'vue'
import {
  decimalValido,
  inteiroPositivoValido,
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

function aplicarPreco(valor) {
  servico.value.preco = sanitizarDecimal(valor)
}

function aplicarDuracao(valor) {
  servico.value.duracaoMinutos = sanitizarInteiroPositivo(valor)
}

function solicitarSalvamento() {
  erroValidacao.value = ''

  if (!decimalValido(servico.value.preco)) {
    erroValidacao.value = 'Informe um preco valido.'
    return
  }

  if (!inteiroPositivoValido(servico.value.duracaoMinutos)) {
    erroValidacao.value = 'Informe a duracao em minutos com numeros inteiros positivos.'
    return
  }

  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar servico' : 'Novo servico' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do servico selecionado.'
            : 'Cadastre um servico para disponibilizar nos agendamentos.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="servico.nome" type="text" placeholder="Ex: Consulta inicial" />
      </label>

      <label>
        Preco *
        <input
          :value="servico.preco"
          type="text"
          inputmode="decimal"
          placeholder="Ex: 120.00"
          @input="aplicarPreco($event.target.value)"
        />
      </label>

      <label>
        Duracao em minutos *
        <input
          :value="servico.duracaoMinutos"
          type="text"
          inputmode="numeric"
          placeholder="Ex: 60"
          @input="aplicarDuracao($event.target.value)"
        />
      </label>

      <label class="campo-checkbox">
        <input v-model="servico.ativo" type="checkbox" />
        Ativo
      </label>

      <label class="campo-grande">
        Descricao
        <input
          v-model="servico.descricao"
          type="text"
          placeholder="Ex: Atendimento completo com avaliacao"
        />
      </label>
    </div>

    <p v-if="erroValidacao" class="sucesso-texto erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar servico' }}
      </button>

      <button v-if="modoEdicao" class="botao neutro" @click="$emit('cancelar')">
        Cancelar edicao
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
