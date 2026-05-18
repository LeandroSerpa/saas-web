<script setup>
import { ref } from 'vue'
import { emailBasicoValido, sanitizarTelefone, telefoneBasicoValido } from '@/utils/validacoes'

const cliente = defineModel({
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

function aplicarTelefone(valor) {
  cliente.value.telefone = sanitizarTelefone(valor)
}

function aplicarEmail(valor) {
  cliente.value.email = String(valor || '').replace(/\s/g, '')
}

function solicitarSalvamento() {
  erroValidacao.value = ''

  if (cliente.value.telefone && !telefoneBasicoValido(cliente.value.telefone)) {
    erroValidacao.value = 'Informe um telefone valido.'
    return
  }

  if (cliente.value.email && !emailBasicoValido(cliente.value.email)) {
    erroValidacao.value = 'Informe um e-mail valido.'
    return
  }

  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar cliente' : 'Novo cliente' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do cliente selecionado.'
            : 'Cadastre um cliente para usar nos agendamentos.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="cliente.nome" type="text" placeholder="Ex: Maria Silva" />
      </label>

      <label>
        Telefone
        <input
          :value="cliente.telefone"
          type="text"
          inputmode="tel"
          placeholder="Ex: (21) 99999-9999"
          @input="aplicarTelefone($event.target.value)"
        />
      </label>

      <label>
        E-mail
        <input
          :value="cliente.email"
          type="email"
          inputmode="email"
          placeholder="Ex: cliente@email.com"
          @input="aplicarEmail($event.target.value)"
        />
      </label>

      <label class="campo-grande">
        Observacao
        <input
          v-model="cliente.observacao"
          type="text"
          placeholder="Ex: Cliente prefere atendimento pela manha"
        />
      </label>
    </div>

    <p v-if="erroValidacao" class="sucesso-texto erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar cliente' }}
      </button>

      <button v-if="modoEdicao" class="botao secundario" @click="$emit('cancelar')">
        Cancelar
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
