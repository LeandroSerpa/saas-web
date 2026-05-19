<script setup>
import { reactive, ref } from 'vue'
import { emailBasicoValido, limparEspacos } from '@/utils/validacoes'

const usuario = defineModel({
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
  bloquearPerfil: {
    type: Boolean,
    default: false,
  },
  bloquearAtivo: {
    type: Boolean,
    default: false,
  },
  perfis: {
    type: Array,
    default: () => ['ADMIN', 'USUARIO'],
  },
  empresas: {
    type: Array,
    default: () => [],
  },
  mostrarEmpresa: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['salvar', 'cancelar'])
const erroValidacao = ref('')
const errosCampos = reactive({
  email: '',
})

function normalizarEmail(valor) {
  usuario.value.email = limparEspacos(valor)
  errosCampos.email = ''
  erroValidacao.value = ''
}

function validarEmail() {
  if (!emailBasicoValido(usuario.value.email)) {
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
  if (!validarEmail()) return
  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar usuário' : 'Novo usuário' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do usuário selecionado.'
            : 'Cadastre um usuário para acessar o sistema.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="usuario.nome" type="text" placeholder="Ex: Ana Costa" />
      </label>

      <label>
        E-mail *
        <input
          :value="usuario.email"
          type="text"
          inputmode="email"
          placeholder="Ex: usuario@empresa.com"
          @input="normalizarEmail($event.target.value)"
          @blur="validarEmail"
        />
        <span v-if="errosCampos.email" class="erro-texto">{{ errosCampos.email }}</span>
      </label>

      <label>
        Senha {{ modoEdicao ? '' : '*' }}
        <input
          v-model="usuario.senha"
          type="password"
          autocomplete="new-password"
          :placeholder="modoEdicao ? 'Deixe em branco para manter a senha atual' : 'Digite a senha'"
        />
      </label>

      <label>
        Perfil *
        <input v-if="bloquearPerfil" v-model="usuario.perfil" type="text" disabled />
        <select v-else v-model="usuario.perfil">
          <option v-for="perfil in perfis" :key="perfil" :value="perfil">{{ perfil }}</option>
        </select>
      </label>

      <label v-if="mostrarEmpresa">
        Empresa *
        <select v-model="usuario.empresaId">
          <option value="">Selecione uma empresa</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.nome }}
          </option>
        </select>
      </label>

      <label class="campo-checkbox">
        <input v-model="usuario.ativo" type="checkbox" :disabled="bloquearAtivo" />
        Ativo
      </label>
    </div>

    <p v-if="erroValidacao" class="erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar usuário' }}
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
