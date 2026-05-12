<script setup>
const servico = defineModel({
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
      <h2>{{ modoEdicao ? 'Editar servico' : 'Novo servico' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do servico selecionado.'
            : 'Cadastre um servico para disponibilizar nos agendamentos.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="servico.nome" type="text" placeholder="Ex: Consulta inicial" />
      </label>

      <label>
        Preço *
        <input v-model="servico.preco" type="number" min="0" step="0.01" placeholder="Ex: 120.00" />
      </label>

      <label>
        Duração em minutos *
        <input v-model="servico.duracaoMinutos" type="number" min="1" step="1" placeholder="Ex: 60" />
      </label>

      <label class="campo-checkbox">
        <input v-model="servico.ativo" type="checkbox" />
        Ativo
      </label>

      <label class="campo-grande">
        Descrição
        <input
          v-model="servico.descricao"
          type="text"
          placeholder="Ex: Atendimento completo com avaliação"
        />
      </label>
    </div>

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar servico' }}
      </button>

      <button v-if="modoEdicao" class="botao neutro" @click="$emit('cancelar')">
        Cancelar edicao
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
