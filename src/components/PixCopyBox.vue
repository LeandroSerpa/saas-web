<script setup>
import { computed, ref } from 'vue'
import { copiarTextoSeguro } from '@/utils/pix'

const props = defineProps({
  titulo: {
    type: String,
    required: true,
  },
  ajuda: {
    type: String,
    default: '',
  },
  valor: {
    type: String,
    default: '',
  },
  texto: {
    type: String,
    default: '',
  },
  textoVazio: {
    type: String,
    default: 'Nada para copiar.',
  },
  botaoTexto: {
    type: String,
    default: 'Copiar',
  },
  desabilitado: {
    type: Boolean,
    default: false,
  },
})

const copiado = ref(false)
let temporizadorCopiado = null

const valorExibido = computed(() => String(props.texto || props.valor || '').trim())
const valorParaCopiar = computed(() => String(props.valor || '').trim())

async function copiar() {
  if (props.desabilitado || !valorParaCopiar.value) {
    return
  }

  const copiou = await copiarTextoSeguro(valorParaCopiar.value)
  if (!copiou) {
    return
  }

  copiado.value = true
  if (temporizadorCopiado) {
    clearTimeout(temporizadorCopiado)
  }
  temporizadorCopiado = window.setTimeout(() => {
    copiado.value = false
  }, 1600)
}
</script>

<template>
  <section class="pix-copy-box">
    <div class="cabecalho">
      <div>
        <h3>{{ props.titulo }}</h3>
        <p v-if="props.ajuda">{{ props.ajuda }}</p>
      </div>
      <button class="botao secundario" type="button" :disabled="props.desabilitado || !valorParaCopiar" @click="copiar">
        {{ copiado ? 'Copiado' : props.botaoTexto }}
      </button>
    </div>

    <p v-if="valorExibido" class="valor">{{ valorExibido }}</p>
    <p v-else class="valor vazio">{{ props.textoVazio }}</p>
  </section>
</template>

<style scoped>
.pix-copy-box {
  display: grid;
  gap: 10px;
  border: 1px solid #dbeafe;
  border-radius: 16px;
  padding: 14px;
  background: linear-gradient(180deg, #f8fbff 0%, #eef6ff 100%);
}

.cabecalho {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.cabecalho h3,
.cabecalho p,
.valor {
  margin: 0;
}

.cabecalho h3 {
  color: #0f172a;
  font-size: 15px;
}

.cabecalho p,
.valor.vazio {
  color: #64748b;
}

.valor {
  border-radius: 12px;
  padding: 12px 14px;
  background: white;
  color: #0f172a;
  border: 1px solid #e2e8f0;
  white-space: pre-wrap;
  word-break: break-word;
}

@media (max-width: 640px) {
  .cabecalho {
    flex-direction: column;
    align-items: stretch;
  }

  .cabecalho .botao {
    width: 100%;
  }
}
</style>
