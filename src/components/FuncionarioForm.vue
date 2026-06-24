<script setup>
import { computed, reactive, ref } from 'vue'
import {
  emailBasicoValido,
  limparEspacos,
  sanitizarTelefoneDoEvento,
  telefoneBasicoValido,
} from '@/utils/validacoes'

const funcionario = defineModel({
  type: Object,
  required: true,
})

const props = defineProps({
  mensagemSucesso: {
    type: String,
    default: '',
  },
  modoEdicao: {
    type: Boolean,
    default: false,
  },
  contextoProfessor: {
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

const contextoProfessor = computed(() => props.contextoProfessor === true)
const rotuloEntidadeSingular = computed(() => (contextoProfessor.value ? 'professor' : 'funcionário'))
const tituloFormulario = computed(() =>
  props.modoEdicao ? `Editar ${rotuloEntidadeSingular.value}` : `Novo ${rotuloEntidadeSingular.value}`,
)
const descricaoFormulario = computed(() =>
  props.modoEdicao
    ? `Atualize os dados do ${rotuloEntidadeSingular.value} selecionado.`
    : contextoProfessor.value
      ? 'Cadastre um professor para atender os agendamentos.'
      : 'Cadastre um funcionário para atender os agendamentos.',
)
const tituloDisponibilidade = computed(() => `Disponibilidade do ${rotuloEntidadeSingular.value}`)
const placeholderEmail = computed(() =>
  contextoProfessor.value ? 'Ex: professor@empresa.com' : 'Ex: funcionario@empresa.com',
)
const rotuloBotaoSalvar = computed(() => `Salvar ${rotuloEntidadeSingular.value}`)

const horarioInicioInvalido = computed(() => horarioPreenchidoInvalido(funcionario.value.horaInicioAtendimento))
const horarioFimInvalido = computed(() => horarioPreenchidoInvalido(funcionario.value.horaFimAtendimento))
function limparErroCampo(campo) {
  errosCampos[campo] = ''
  erroValidacao.value = ''
}

function aplicarMascaraHorario(campo, valor) {
  const digitos = String(valor || '')
    .replace(/\D/g, '')
    .slice(0, 4)

  funcionario.value[campo] =
    digitos.length > 2 ? `${digitos.slice(0, 2)}:${digitos.slice(2)}` : digitos
}

function horarioPreenchidoInvalido(valor) {
  const texto = String(valor || '').trim()
  return Boolean(texto) && !/^([01]\d|2[0-3]):[0-5]\d$/.test(texto)
}

function aplicarTelefone(evento) {
  funcionario.value.telefone = sanitizarTelefoneDoEvento(evento)
  limparErroCampo('telefone')
}

function aplicarEmail(valor) {
  funcionario.value.email = limparEspacos(valor)
  limparErroCampo('email')
}

function validarTelefone() {
  if (funcionario.value.telefone && !telefoneBasicoValido(funcionario.value.telefone)) {
    const mensagem = 'Informe um telefone válido.'
    errosCampos.telefone = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.telefone = ''
  return true
}

function validarEmail() {
  if (funcionario.value.email && !emailBasicoValido(funcionario.value.email)) {
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
      <h2>{{ tituloFormulario }}</h2>
      <p>{{ descricaoFormulario }}</p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="funcionario.nome" type="text" placeholder="Ex: Ana Costa" />
      </label>

      <label>
        Telefone
        <input
          :value="funcionario.telefone"
          type="text"
          inputmode="numeric"
          placeholder="Ex: (21) 99999-9999"
          @input="aplicarTelefone"
          @blur="validarTelefone"
          @paste.prevent="aplicarTelefone"
        />
        <span v-if="errosCampos.telefone" class="mensagem-campo">{{ errosCampos.telefone }}</span>
      </label>

      <label>
        E-mail
        <input
          :value="funcionario.email"
          type="text"
          inputmode="email"
          :placeholder="placeholderEmail"
          @input="aplicarEmail($event.target.value)"
          @blur="validarEmail"
        />
        <span v-if="errosCampos.email" class="mensagem-campo">{{ errosCampos.email }}</span>
      </label>

      <label>
        Cargo
        <input v-model="funcionario.cargo" type="text" placeholder="Ex: Consultor" />
      </label>

      <label class="campo-checkbox">
        <input v-model="funcionario.ativo" type="checkbox" />
        Ativo
      </label>

      <div class="secao-disponibilidade">
        <div class="titulo-card">
          <h3>{{ tituloDisponibilidade }}</h3>
        </div>

        <div class="campos-disponibilidade">
          <label>
            Hora inicial de atendimento
            <input
              :value="funcionario.horaInicioAtendimento"
              type="text"
              inputmode="numeric"
              maxlength="5"
              placeholder="HH:mm"
              @input="aplicarMascaraHorario('horaInicioAtendimento', $event.target.value)"
            />
            <span v-if="horarioInicioInvalido" class="mensagem-campo">
              Informe um horário válido entre 00:00 e 23:59.
            </span>
          </label>

          <label>
            Hora final de atendimento
            <input
              :value="funcionario.horaFimAtendimento"
              type="text"
              inputmode="numeric"
              maxlength="5"
              placeholder="HH:mm"
              @input="aplicarMascaraHorario('horaFimAtendimento', $event.target.value)"
            />
            <span v-if="horarioFimInvalido" class="mensagem-campo">
              Informe um horário válido entre 00:00 e 23:59.
            </span>
          </label>
        </div>

        <div class="dias-semana">
          <label class="campo-checkbox"><input v-model="funcionario.atendeDomingo" type="checkbox" />Domingo</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSegunda" type="checkbox" />Segunda</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeTerca" type="checkbox" />Terça</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeQuarta" type="checkbox" />Quarta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeQuinta" type="checkbox" />Quinta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSexta" type="checkbox" />Sexta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSabado" type="checkbox" />Sábado</label>
        </div>
      </div>
    </div>

    <p v-if="erroValidacao" class="mensagem-campo">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ rotuloBotaoSalvar }}
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
