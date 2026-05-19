<script setup>
import { reactive, ref } from 'vue'
import {
  criarManipuladorPasteNumerico,
  emailBasicoValido,
  limparEspacos,
  sanitizarTelefone,
  telefoneBasicoValido,
} from '@/utils/validacoes'

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
const errosCampos = reactive({
  telefone: '',
  email: '',
})

const aoColarTelefone = criarManipuladorPasteNumerico(sanitizarTelefone)

function limparErroCampo(campo) {
  errosCampos[campo] = ''
  erroValidacao.value = ''
}

function aplicarTelefone(valor) {
  cliente.value.telefone = sanitizarTelefone(valor)
  limparErroCampo('telefone')
}

function aplicarEmail(valor) {
  cliente.value.email = limparEspacos(valor)
  limparErroCampo('email')
}

function validarTelefone() {
  if (cliente.value.telefone && !telefoneBasicoValido(cliente.value.telefone)) {
    const mensagem = 'Informe um telefone válido.'
    errosCampos.telefone = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.telefone = ''
  return true
}

function validarEmail() {
  if (cliente.value.email && !emailBasicoValido(cliente.value.email)) {
    const mensagem = 'Informe um e-mail válido.'
    errosCampos.email = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.email = ''
  return true
}

function solicitarSalvamento() {
  erroValidacao.value = ''
  const telefoneValido = validarTelefone()
  const emailValido = validarEmail()
  if (!telefoneValido || !emailValido) return
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
          @blur="validarTelefone"
          @paste="aoColarTelefone($event, (valor) => aplicarTelefone(valor))"
        />
        <span v-if="errosCampos.telefone" class="erro-texto">{{ errosCampos.telefone }}</span>
      </label>

      <label>
        E-mail
        <input
          :value="cliente.email"
          type="text"
          inputmode="email"
          placeholder="Ex: cliente@email.com"
          @input="aplicarEmail($event.target.value)"
          @blur="validarEmail"
        />
        <span v-if="errosCampos.email" class="erro-texto">{{ errosCampos.email }}</span>
      </label>

      <label class="campo-grande">
        Observação
        <input
          v-model="cliente.observacao"
          type="text"
          placeholder="Ex: Cliente prefere atendimento pela manhã"
        />
      </label>
    </div>

    <p v-if="erroValidacao" class="erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar cliente' }}
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
