<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { emailBasicoValido, limparEspacos, validarLoginCurto } from '@/utils/validacoes'

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
  login: '',
})
const empresaObrigatoria = computed(() => usuario.value?.perfil !== 'SUPER_ADMIN')

watch(
  () => usuario.value?.perfil,
  (perfil) => {
    if (perfil === 'SUPER_ADMIN') {
      usuario.value.empresaId = null
    }
  },
)

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

function normalizarLogin(valor) {
  usuario.value.login = String(valor || '')
  errosCampos.login = ''
  erroValidacao.value = ''
}

function validarLogin() {
  const mensagem = validarLoginCurto(usuario.value.login)

  if (mensagem) {
    errosCampos.login = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.login = ''
  return true
}

function rotuloPerfil(perfil) {
  if (perfil === 'SUPER_ADMIN') return 'Administrador NuvemMais'
  if (perfil === 'ADMIN') return 'Administrador'
  if (perfil === 'USUARIO') return 'Usuário'
  return perfil
}

function solicitarSalvamento() {
  erroValidacao.value = ''
  if (!validarEmail()) return
  if (!validarLogin()) return
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
        Usuário/Login
        <input
          :value="usuario.login"
          type="text"
          placeholder="Ex: joao, maria.silva"
          @input="normalizarLogin($event.target.value)"
          @blur="validarLogin"
        />
        <small>Pode ser usado para entrar no sistema no lugar do e-mail.</small>
        <span v-if="errosCampos.login" class="erro-texto">{{ errosCampos.login }}</span>
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
        <input v-if="bloquearPerfil" :value="rotuloPerfil(usuario.perfil)" type="text" disabled />
        <select v-else v-model="usuario.perfil">
          <option v-for="perfil in perfis" :key="perfil" :value="perfil">{{ rotuloPerfil(perfil) }}</option>
        </select>
      </label>

      <label v-if="mostrarEmpresa">
        Empresa {{ empresaObrigatoria ? '*' : '(opcional)' }}
        <select v-model="usuario.empresaId" :disabled="!empresaObrigatoria">
          <option value="">{{ empresaObrigatoria ? 'Selecione uma empresa' : 'Sem empresa vinculada' }}</option>
          <option v-for="empresa in empresas" :key="empresa.id" :value="empresa.id">
            {{ empresa.nome }}
          </option>
        </select>
        <small v-if="usuario.perfil === 'SUPER_ADMIN'">
          SUPER_ADMIN administra a plataforma e não precisa estar vinculado a uma empresa.
        </small>
      </label>

      <label class="campo-checkbox">
        <input v-model="usuario.ativo" type="checkbox" :disabled="bloquearAtivo" />
        Ativo
      </label>
    </div>

    <p v-if="erroValidacao" class="erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        Salvar
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
