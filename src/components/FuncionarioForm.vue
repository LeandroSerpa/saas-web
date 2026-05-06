<script setup>
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

defineEmits(['salvar', 'cancelar'])
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar funcionário' : 'Novo funcionário' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do funcionário selecionado.'
            : 'Cadastre um funcionário para atender os agendamentos.'
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
        <input v-model="funcionario.telefone" type="text" placeholder="Ex: (21) 99999-9999" />
      </label>

      <label>
        E-mail
        <input v-model="funcionario.email" type="email" placeholder="Ex: funcionario@email.com" />
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
            <input v-model="funcionario.horaInicioAtendimento" type="time" />
          </label>

          <label>
            Hora final de atendimento
            <input v-model="funcionario.horaFimAtendimento" type="time" />
          </label>
        </div>

        <div class="dias-semana">
          <label class="campo-checkbox">
            <input v-model="funcionario.atendeDomingo" type="checkbox" />
            Domingo
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeSegunda" type="checkbox" />
            Segunda
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeTerca" type="checkbox" />
            Terca
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeQuarta" type="checkbox" />
            Quarta
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeQuinta" type="checkbox" />
            Quinta
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeSexta" type="checkbox" />
            Sexta
          </label>

          <label class="campo-checkbox">
            <input v-model="funcionario.atendeSabado" type="checkbox" />
            Sabado
          </label>
        </div>
      </div>
    </div>

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
        {{ modoEdicao ? 'Salvar alterações' : 'Cadastrar funcionário' }}
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
