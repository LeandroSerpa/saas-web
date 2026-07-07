<script setup>
import { computed } from 'vue'

import { opcoesAparencia } from '@/utils/aparencia'

const props = defineProps({
  tema: {
    type: String,
    required: true,
  },
  statusSincronizacao: {
    type: String,
    default: '',
  },
  mensagemSincronizacao: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['update:tema'])

const opcoes = computed(() =>
  opcoesAparencia.value.temas.map((tema) => ({
    valor: tema.valor,
    titulo: tema.nome,
    descricao: tema.descricao,
    preview: tema.preview,
  })),
)

const temaSelecionado = computed(() => opcoes.value.find((opcao) => opcao.valor === props.tema) || opcoes.value[0])

const estilosPreview = computed(() => ({
  '--tema-preview-fundo': temaSelecionado.value.preview.fundo,
  '--tema-preview-superficie': temaSelecionado.value.preview.superficie,
  '--tema-preview-primario': temaSelecionado.value.preview.primario,
  '--tema-preview-secundario': temaSelecionado.value.preview.secundario,
  '--tema-preview-menu': temaSelecionado.value.preview.menu,
}))

const textoSincronizacao = computed(() => {
  if (props.statusSincronizacao === 'salvando' || props.statusSincronizacao === 'carregando') {
    return 'Salvando...'
  }

  if (props.statusSincronizacao === 'salvo') {
    return 'Salvo'
  }

  if (props.statusSincronizacao === 'erro') {
    return 'Não foi possível sincronizar'
  }

  return ''
})
</script>

<template>
  <span class="seletor-tema-wrapper">
    <label class="seletor-compacto seletor-tema" for="tema-aparencia">
      <span class="tema-preview" :style="estilosPreview" aria-hidden="true">
        <span class="tema-preview-menu"></span>
        <span class="tema-preview-conteudo">
          <span class="tema-preview-linha"></span>
          <span class="tema-preview-barra"></span>
        </span>
      </span>
      <span class="seletor-rotulo">Tema:</span>
      <select id="tema-aparencia" :value="props.tema" @change="emit('update:tema', $event.target.value)">
        <option v-for="opcao in opcoes" :key="opcao.valor" :value="opcao.valor">
          {{ opcao.titulo }}
        </option>
      </select>
    </label>
    <small
      v-if="temaSelecionado.descricao || textoSincronizacao"
      class="seletor-status"
      :class="`seletor-status--${props.statusSincronizacao}`"
      :title="props.mensagemSincronizacao || textoSincronizacao"
    >
      {{ textoSincronizacao || temaSelecionado.descricao }}
    </small>
  </span>
</template>

<style scoped>
.seletor-tema-wrapper {
  min-width: 0;
  display: inline-grid;
  gap: 3px;
}

.seletor-compacto {
  min-width: 0;
  display: inline-flex;
  align-items: center;
  gap: 9px;
  padding: 6px 10px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-soft);
  color: var(--app-text);
  box-shadow: none;
}

.tema-preview {
  flex: 0 0 auto;
  width: 38px;
  height: 28px;
  display: grid;
  grid-template-columns: 11px 1fr;
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 9px;
  background: var(--tema-preview-fundo);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.34);
}

.tema-preview-menu {
  background: var(--tema-preview-menu);
}

.tema-preview-conteudo {
  display: grid;
  align-content: center;
  gap: 4px;
  padding: 5px;
  background: var(--tema-preview-superficie);
}

.tema-preview-linha,
.tema-preview-barra {
  display: block;
  height: 5px;
  border-radius: 999px;
}

.tema-preview-linha {
  width: 100%;
  background: var(--tema-preview-primario);
}

.tema-preview-barra {
  width: 70%;
  background: var(--tema-preview-secundario);
}

.seletor-rotulo {
  flex: 0 0 auto;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 700;
  line-height: 1;
  white-space: nowrap;
}

.seletor-compacto select {
  min-width: 162px;
  max-width: 190px;
  padding: 0 22px 0 0;
  border: none;
  border-radius: 0;
  background: transparent;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
  line-height: 1.1;
  cursor: pointer;
  appearance: none;
  box-shadow: none;
}

.seletor-compacto select:hover {
  color: var(--app-primary);
}

.seletor-compacto select:focus {
  outline: none;
  color: var(--app-primary);
  box-shadow: none;
}

.seletor-tema select {
  min-width: 162px;
}

.seletor-status {
  min-height: 13px;
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 800;
  line-height: 1.15;
}

.seletor-status--erro {
  color: var(--app-warning);
}

.seletor-status--salvo {
  color: var(--app-success);
}

@media (max-width: 480px) {
  .seletor-tema-wrapper {
    width: 100%;
  }

  .seletor-compacto {
    max-width: 100%;
    padding-inline: 9px;
    gap: 7px;
  }

  .seletor-rotulo {
    display: none;
  }

  .tema-preview {
    width: 34px;
  }

  .seletor-compacto select,
  .seletor-tema select {
    min-width: 0;
    max-width: 100%;
    width: 100%;
  }
}
</style>
