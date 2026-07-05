<script setup>
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'
import {
  buscarEmpresas,
  carregarUsuarioSessao,
  definirEmpresaVisualizacao,
  EVENTO_EMPRESA_VISUALIZACAO,
  limparEmpresaVisualizacao,
  obterEmpresaVisualizacao,
} from '@/services/api'
import { ehSuperAdmin } from '@/utils/permissoes'

const empresas = ref([])
const empresaSelecionada = ref(obterEmpresaVisualizacao())
const empresaSelecionadaId = ref(empresaSelecionada.value?.id || '')
const carregando = ref(false)

const usuario = computed(() => carregarUsuarioSessao())
const podeVisualizarEmpresas = computed(() => ehSuperAdmin(usuario.value))
const modoVisualizacaoAtivo = computed(() => Boolean(empresaSelecionada.value?.id))

function sincronizarSelecao() {
  empresaSelecionada.value = obterEmpresaVisualizacao()
  empresaSelecionadaId.value = empresaSelecionada.value?.id || ''
}

async function carregarEmpresas() {
  if (!podeVisualizarEmpresas.value || empresas.value.length || carregando.value) {
    return
  }

  try {
    carregando.value = true
    empresas.value = await buscarEmpresas().catch(() => [])
  } finally {
    carregando.value = false
  }
}

async function selecionarEmpresa() {
  if (!podeVisualizarEmpresas.value) {
    return
  }

  if (!empresas.value.length) {
    await carregarEmpresas()
  }

  const empresa = empresas.value.find((item) => String(item.id) === String(empresaSelecionadaId.value))

  if (!empresa) {
    sairDaVisualizacao()
    return
  }

  empresaSelecionada.value = definirEmpresaVisualizacao(empresa)
  window.dispatchEvent(new Event('usuario-atualizado'))
}

function sairDaVisualizacao() {
  limparEmpresaVisualizacao()
  sincronizarSelecao()
  window.dispatchEvent(new Event('usuario-atualizado'))
}

onMounted(() => {
  window.addEventListener(EVENTO_EMPRESA_VISUALIZACAO, sincronizarSelecao)
  carregarEmpresas()
})

onBeforeUnmount(() => {
  window.removeEventListener(EVENTO_EMPRESA_VISUALIZACAO, sincronizarSelecao)
})
</script>

<template>
  <section v-if="podeVisualizarEmpresas" class="visualizacao-empresa">
    <div>
      <strong>Operar como empresa</strong>
      <p v-if="modoVisualizacaoAtivo">
        Modo operação: você está atuando na empresa {{ empresaSelecionada.nome }} como SUPER_ADMIN. Alterações estão liberadas e serão registradas em auditoria.
      </p>
      <p v-else>Selecione uma empresa para atuar com suporte operacional.</p>
    </div>

    <div class="visualizacao-controles">
      <select
        v-model="empresaSelecionadaId"
        :disabled="carregando"
        @focus="carregarEmpresas"
        @change="selecionarEmpresa"
      >
        <option value="">Visão global</option>
        <option v-for="empresa in empresas" :key="empresa.id" :value="String(empresa.id)">
          {{ empresa.nome }}
        </option>
      </select>

      <button
        v-if="modoVisualizacaoAtivo"
        class="botao-sair-visualizacao"
        type="button"
        @click="sairDaVisualizacao"
      >
        Sair da operação
      </button>
    </div>
  </section>
</template>

<style scoped>
.visualizacao-empresa {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  padding: 12px 14px;
  background: linear-gradient(180deg, var(--app-surface) 0%, var(--app-surface-soft) 100%);
  color: var(--app-text);
  box-shadow: var(--app-shadow);
}

.visualizacao-empresa strong,
.visualizacao-empresa p {
  margin: 0;
}

.visualizacao-empresa p {
  margin-top: 4px;
  color: var(--app-text-muted);
  font-size: 14px;
  font-weight: 700;
}

.visualizacao-controles {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.visualizacao-controles select {
  min-width: min(100vw - 48px, 280px);
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 9px 10px;
  background: var(--app-surface);
  color: var(--app-text);
  font: inherit;
}

.botao-sair-visualizacao {
  border: none;
  border-radius: 12px;
  padding: 10px 12px;
  background: var(--app-primary);
  color: white;
  font-weight: 800;
  cursor: pointer;
}

@media (max-width: 900px) {
  .visualizacao-empresa {
    align-items: stretch;
    flex-direction: column;
  }

  .visualizacao-controles select,
  .botao-sair-visualizacao {
    width: 100%;
  }
}
</style>
