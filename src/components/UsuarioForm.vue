<script setup>
import { ref } from 'vue'
import { emailBasicoValido } from '@/utils/validacoes'

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

function normalizarEmail(valor) {
  usuario.value.email = String(valor || '').replace(/\s/g, '')
}

function solicitarSalvamento() {
  erroValidacao.value = ''

  if (!emailBasicoValido(usuario.value.email)) {
    erroValidacao.value = 'Informe um e-mail valido.'
    return
  }

  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar usuario' : 'Novo usuario' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do usuario selecionado.'
            : 'Cadastre um usuario para acessar o sistema.'
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
          type="email"
          inputmode="email"
          placeholder="Ex: usuario@empresa.com"
          @input="normalizarEmail($event.target.value)"
        />
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

    <p v-if="erroValidacao" class="sucesso-texto erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar usuario' }}
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
