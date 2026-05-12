<script setup>
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

defineEmits(['salvar', 'cancelar'])
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
        <input v-model="cliente.telefone" type="text" placeholder="Ex: (21) 99999-9999" />
      </label>

      <label>
        E-mail
        <input v-model="cliente.email" type="email" placeholder="Ex: cliente@email.com" />
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

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
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
