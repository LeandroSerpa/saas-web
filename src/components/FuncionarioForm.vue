<script setup>
import { computed, ref } from 'vue'
import { emailBasicoValido, sanitizarTelefone, telefoneBasicoValido } from '@/utils/validacoes'

const funcionario = defineModel({
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

const horarioInicioInvalido = computed(() => horarioPreenchidoInvalido(funcionario.value.horaInicioAtendimento))
const horarioFimInvalido = computed(() => horarioPreenchidoInvalido(funcionario.value.horaFimAtendimento))

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

function aplicarTelefone(valor) {
  funcionario.value.telefone = sanitizarTelefone(valor)
}

function aplicarEmail(valor) {
  funcionario.value.email = String(valor || '').replace(/\s/g, '')
}

function solicitarSalvamento() {
  erroValidacao.value = ''

  if (funcionario.value.telefone && !telefoneBasicoValido(funcionario.value.telefone)) {
    erroValidacao.value = 'Informe um telefone valido.'
    return
  }

  if (funcionario.value.email && !emailBasicoValido(funcionario.value.email)) {
    erroValidacao.value = 'Informe um e-mail valido.'
    return
  }

  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar funcionario' : 'Novo funcionario' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do funcionario selecionado.'
            : 'Cadastre um funcionario para atender os agendamentos.'
        }}
      </p>
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
          inputmode="tel"
          placeholder="Ex: (21) 99999-9999"
          @input="aplicarTelefone($event.target.value)"
        />
      </label>

      <label>
        E-mail
        <input
          :value="funcionario.email"
          type="email"
          inputmode="email"
          placeholder="Ex: funcionario@empresa.com"
          @input="aplicarEmail($event.target.value)"
        />
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
          <h3>Disponibilidade do funcionario</h3>
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
              Informe um horario valido entre 00:00 e 23:59.
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
              Informe um horario valido entre 00:00 e 23:59.
            </span>
          </label>
        </div>

        <div class="dias-semana">
          <label class="campo-checkbox"><input v-model="funcionario.atendeDominao" type="checkbox" />Domingo</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSegunda" type="checkbox" />Segunda</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeTerca" type="checkbox" />Terca</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeQuarta" type="checkbox" />Quarta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeQuinta" type="checkbox" />Quinta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSexta" type="checkbox" />Sexta</label>
          <label class="campo-checkbox"><input v-model="funcionario.atendeSabado" type="checkbox" />Sabado</label>
        </div>
      </div>
    </div>

    <p v-if="erroValidacao" class="mensagem-campo">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar funcionario' }}
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
