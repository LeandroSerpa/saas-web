<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  buscarMinhasDicasUsuario,
  buscarOpcoesMinhasDicasUsuario,
  dispensarDicaUsuario,
  marcarDicaUsuarioVisualizada,
  reativarDicaUsuario,
  resetarMinhasDicasUsuario,
} from '@/services/api'
import {
  STATUS_DICA_DISPENSADA,
  STATUS_DICA_NAO_VISUALIZADA,
  STATUS_DICA_VISUALIZADA,
  carregarDicasUsuarioBackend,
  dicasUsuario,
  dispensarDicaUsuarioBackend,
  estadoSincronizacaoDicas,
  mensagemSincronizacaoDicas,
  montarResumoDicasUsuario,
  obterOpcoesDicasUsuarioFallback,
  obterResumoSincronizacaoDicas,
  opcoesDicasUsuario,
  origemDicasUsuario,
  origemOpcoesDicasUsuario,
  reativarDicaUsuarioBackend,
  resetarDicasUsuarioBackend,
  resumoDicasUsuario,
  marcarDicaUsuarioVisualizadaBackend,
} from '@/utils/dicasUsuario'
import { preferenciasOperacionais } from '@/utils/preferenciasOperacionais'
import DicaContextualCard from './DicaContextualCard.vue'

const filtroModulo = ref('TODOS')
const filtroStatus = ref('TODOS')

const salvando = computed(() => ['carregando', 'salvando'].includes(estadoSincronizacaoDicas.value))
const mostrarDicas = computed(() => preferenciasOperacionais.value.mostrarDicas !== false)
const resumoSincronizacao = computed(() => obterResumoSincronizacaoDicas())
const origemConfiguracao = computed(() => (origemDicasUsuario.value === 'backend' ? 'Backend' : 'localStorage'))
const origemOpcoes = computed(() => (origemOpcoesDicasUsuario.value === 'backend' ? 'Backend' : 'fallback local'))
const opcoesModulo = computed(() => {
  const modulos = opcoesDicasUsuario.value?.modulos?.length
    ? opcoesDicasUsuario.value.modulos
    : obterOpcoesDicasUsuarioFallback().modulos

  return [{ valor: 'TODOS', nome: 'Todos os módulos' }, ...modulos]
})
const opcoesStatus = computed(() => [
  { valor: 'TODOS', nome: 'Todos os status' },
  { valor: STATUS_DICA_NAO_VISUALIZADA, nome: 'Pendentes' },
  { valor: STATUS_DICA_VISUALIZADA, nome: 'Vistas' },
  { valor: STATUS_DICA_DISPENSADA, nome: 'Dispensadas' },
])
const dicasFiltradas = computed(() =>
  dicasUsuario.value.filter((dica) => {
    const moduloOk = filtroModulo.value === 'TODOS' || dica.modulo === filtroModulo.value
    const statusOk = filtroStatus.value === 'TODOS' || dica.status === filtroStatus.value

    return moduloOk && statusOk
  }),
)
const resumoFiltrado = computed(() => montarResumoDicasUsuario(dicasFiltradas.value))

onMounted(() => {
  sincronizarAgora()
})

function sincronizarAgora() {
  if (salvando.value) {
    return
  }

  void carregarDicasUsuarioBackend(buscarMinhasDicasUsuario, buscarOpcoesMinhasDicasUsuario)
}

function visualizarDica(chaveDica) {
  if (salvando.value) {
    return
  }

  void marcarDicaUsuarioVisualizadaBackend(chaveDica, marcarDicaUsuarioVisualizada)
}

function dispensarDica(chaveDica) {
  if (salvando.value) {
    return
  }

  void dispensarDicaUsuarioBackend(chaveDica, dispensarDicaUsuario)
}

function reativarDica(chaveDica) {
  if (salvando.value) {
    return
  }

  void reativarDicaUsuarioBackend(chaveDica, reativarDicaUsuario)
}

function resetarDicas() {
  if (salvando.value) {
    return
  }

  void resetarDicasUsuarioBackend(resetarMinhasDicasUsuario)
}
</script>

<template>
  <div class="central-dicas">
    <div class="central-dicas-sincronizacao" :class="`central-dicas-sincronizacao--${resumoSincronizacao.tipo}`">
      <div>
        <strong>{{ resumoSincronizacao.rotulo }}</strong>
        <p>{{ resumoSincronizacao.detalhe }}</p>
      </div>
      <dl>
        <div>
          <dt>Origem</dt>
          <dd>{{ origemConfiguracao }}</dd>
        </div>
        <div>
          <dt>Opções</dt>
          <dd>{{ origemOpcoes }}</dd>
        </div>
      </dl>
    </div>

    <p v-if="!mostrarDicas" class="central-dicas-aviso">
      Dicas ocultas nas telas, mas disponíveis aqui.
    </p>

    <div class="central-dicas-resumo" aria-label="Resumo das dicas">
      <div>
        <span>Total</span>
        <strong>{{ resumoDicasUsuario.total }}</strong>
      </div>
      <div>
        <span>Pendentes</span>
        <strong>{{ resumoDicasUsuario.naoVisualizadas }}</strong>
      </div>
      <div>
        <span>Vistas</span>
        <strong>{{ resumoDicasUsuario.visualizadas }}</strong>
      </div>
      <div>
        <span>Dispensadas</span>
        <strong>{{ resumoDicasUsuario.dispensadas }}</strong>
      </div>
    </div>

    <div class="central-dicas-filtros">
      <label>
        Módulo
        <select v-model="filtroModulo" :disabled="salvando">
          <option v-for="opcao in opcoesModulo" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.nome }}
          </option>
        </select>
      </label>

      <label>
        Status
        <select v-model="filtroStatus" :disabled="salvando">
          <option v-for="opcao in opcoesStatus" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.nome }}
          </option>
        </select>
      </label>
    </div>

    <div class="central-dicas-acoes">
      <p v-if="mensagemSincronizacaoDicas" class="central-dicas-status" :class="`central-dicas-status--${estadoSincronizacaoDicas}`">
        {{ mensagemSincronizacaoDicas }}
      </p>

      <button class="botao secundario" type="button" :disabled="salvando" @click="sincronizarAgora">
        Sincronizar agora
      </button>

      <button class="botao secundario" type="button" :disabled="salvando" @click="resetarDicas">
        Resetar dicas
      </button>
    </div>

    <p v-if="!dicasFiltradas.length" class="central-dicas-vazio">
      Nenhuma dica encontrada para os filtros selecionados.
    </p>

    <div v-else class="central-dicas-lista">
      <DicaContextualCard
        v-for="dica in dicasFiltradas"
        :key="dica.chaveDica"
        :dica="dica"
        :salvando="salvando"
        @visualizar="visualizarDica"
        @dispensar="dispensarDica"
        @reativar="reativarDica"
      />
    </div>

    <p v-if="dicasFiltradas.length" class="central-dicas-contagem">
      Exibindo {{ resumoFiltrado.total }} de {{ resumoDicasUsuario.total }} dicas.
    </p>
  </div>
</template>

<style scoped>
.central-dicas {
  display: grid;
  gap: 16px;
}

.central-dicas-sincronizacao {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-dicas-sincronizacao strong {
  display: block;
  color: var(--app-text);
  font-size: 14px;
}

.central-dicas-sincronizacao p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.central-dicas-sincronizacao dl {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin: 0;
}

.central-dicas-sincronizacao dt {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.central-dicas-sincronizacao dd {
  margin: 2px 0 0;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
}

.central-dicas-sincronizacao--erro {
  border-color: var(--app-warning);
}

.central-dicas-sincronizacao--sucesso {
  border-color: var(--app-success);
}

.central-dicas-aviso {
  margin: 0;
  border: 1px solid var(--app-warning);
  border-radius: 8px;
  padding: 10px 12px;
  color: var(--app-text);
  background: var(--app-warning-soft);
  font-size: 14px;
  font-weight: 700;
}

.central-dicas-resumo {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 10px;
}

.central-dicas-resumo div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-dicas-resumo span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.central-dicas-resumo strong {
  color: var(--app-text);
  font-size: 22px;
}

.central-dicas-filtros {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.central-dicas-filtros label {
  display: grid;
  gap: 6px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.central-dicas-filtros select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 11px 12px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 15px;
}

.central-dicas-filtros select:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.central-dicas-acoes {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.central-dicas-status,
.central-dicas-vazio,
.central-dicas-contagem {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 800;
}

.central-dicas-status--erro {
  color: var(--app-warning);
}

.central-dicas-status--salvo {
  color: var(--app-success);
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  font-weight: 800;
  cursor: pointer;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.secundario {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.secundario:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.central-dicas-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(260px, 1fr));
  gap: 12px;
}

@media (max-width: 760px) {
  .central-dicas-sincronizacao,
  .central-dicas-filtros,
  .central-dicas-resumo {
    grid-template-columns: 1fr;
  }

  .central-dicas-sincronizacao dl {
    justify-content: flex-start;
  }

  .central-dicas-acoes,
  .central-dicas-acoes .botao {
    width: 100%;
  }
}
</style>
