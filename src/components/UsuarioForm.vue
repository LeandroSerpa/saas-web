<script setup>
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

defineEmits(['salvar', 'cancelar'])
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
        <input v-model="usuario.email" type="email" placeholder="Ex: usuario@email.com" />
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

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
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
