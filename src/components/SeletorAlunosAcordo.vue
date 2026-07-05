<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PaginacaoCompacta from '@/components/PaginacaoCompacta.vue'
import { rotuloCompeticaoBeachTennis } from '@/utils/beachTennis'

const props = defineProps({
  aberto: {
    type: Boolean,
    default: false,
  },
  busca: {
    type: String,
    default: '',
  },
  carregando: {
    type: Boolean,
    default: false,
  },
  erro: {
    type: String,
    default: '',
  },
  pagina: {
    type: Object,
    default: () => ({}),
  },
  filtros: {
    type: Object,
    default: () => ({}),
  },
  alunos: {
    type: Array,
    default: () => [],
  },
  selecionados: {
    type: Array,
    default: () => [],
  },
  termoSingular: {
    type: String,
    default: 'Aluno',
  },
  termoPlural: {
    type: String,
    default: 'Alunos',
  },
})

const emit = defineEmits([
  'fechar',
  'confirmar',
  'update:busca',
  'update:filtros',
  'alternar',
  'remover-selecionado',
  'anterior',
  'proxima',
])

const buscaRef = ref(null)
let overflowAnterior = ''

const quantidadeSelecionados = computed(() => props.selecionados.length)
const textoConfirmacao = computed(() => `Confirmar ${quantidadeSelecionados.value} ${props.termoPlural.toLocaleLowerCase('pt-BR')}`)

function aplicarTravaBody(ativa) {
  if (typeof document === 'undefined') return

  if (ativa) {
    overflowAnterior = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return
  }

  document.body.style.overflow = overflowAnterior
}

function focarBusca() {
  window.requestAnimationFrame(() => {
    buscaRef.value?.focus()
  })
}

function aoTeclado(event) {
  if (event.key === 'Escape' && props.aberto) {
    emit('fechar')
  }
}

watch(
  () => props.aberto,
  (aberto) => {
    aplicarTravaBody(aberto)

    if (aberto) {
      focarBusca()
      window.addEventListener('keydown', aoTeclado)
      return
    }

    window.removeEventListener('keydown', aoTeclado)
  },
)

onBeforeUnmount(() => {
  aplicarTravaBody(false)
  window.removeEventListener('keydown', aoTeclado)
})

function atualizarFiltro(campo, valor) {
  emit('update:filtros', {
    ...props.filtros,
    [campo]: valor,
  })
}
</script>

<template>
  <Teleport to="body">
    <section v-if="props.aberto" class="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="titulo-seletor-alunos">
      <section class="painel">
        <header class="cabecalho">
          <div>
            <h2 id="titulo-seletor-alunos">{{ `Gerenciar ${props.termoPlural.toLocaleLowerCase('pt-BR')}` }}</h2>
            <p>{{ `${quantidadeSelecionados} ${props.termoPlural.toLocaleLowerCase('pt-BR')} selecionado(s)` }}</p>
          </div>
          <button class="botao-fechar" type="button" aria-label="Fechar seletor de alunos" @click="emit('fechar')">
            &times;
          </button>
        </header>

        <div class="conteudo">
          <div class="painel-selecionados">
            <div class="secao-titulo">
              <h3>Selecionados</h3>
              <span>{{ quantidadeSelecionados }}</span>
            </div>

            <p v-if="!props.selecionados.length" class="mensagem-suave">
              {{ `Nenhum ${props.termoSingular.toLocaleLowerCase('pt-BR')} selecionado ainda.` }}
            </p>

            <div v-else class="lista-selecionados">
              <article v-for="aluno in props.selecionados" :key="aluno.id" class="card-selecionado">
                <div>
                  <strong>{{ aluno.nome }}</strong>
                  <small>
                    <span v-if="aluno.telefone">{{ aluno.telefone }}</span>
                    <span v-if="aluno.email">{{ aluno.telefone ? ' · ' : '' }}{{ aluno.email }}</span>
                  </small>
                  <small>
                    {{ [aluno.nivelRotulo, aluno.perfilRotulo, aluno.participaCompeticaoBeachTennis === true ? rotuloCompeticaoBeachTennis(true) : ''].filter(Boolean).join(' · ') || 'Sem classificação' }}
                  </small>
                </div>
                <button class="botao secundario compacto" type="button" @click="emit('remover-selecionado', aluno.id)">
                  Remover
                </button>
              </article>
            </div>
          </div>

          <div class="painel-lista">
            <label class="campo-grande">
              {{ `Buscar ${props.termoSingular.toLocaleLowerCase('pt-BR')}` }}
              <input
                ref="buscaRef"
                :value="props.busca"
                type="search"
                placeholder="Nome, telefone ou e-mail"
                @input="emit('update:busca', $event.target.value)"
              />
            </label>

            <details class="filtros" open>
              <summary>Filtros</summary>

              <div class="grade-filtros">
                <label>
                  Nível
                  <select :value="props.filtros.nivel || ''" @change="atualizarFiltro('nivel', $event.target.value)">
                    <option value="">Todos</option>
                    <option value="INICIANTE">Iniciante</option>
                    <option value="INTERMEDIARIO">Intermediário</option>
                    <option value="AVANCADO">Avançado</option>
                  </select>
                </label>

                <label>
                  Perfil
                  <select :value="props.filtros.perfil || ''" @change="atualizarFiltro('perfil', $event.target.value)">
                    <option value="">Todos</option>
                    <option value="ALUNO_AULA">Aluno de aula</option>
                    <option value="PARTICIPANTE_PLAY">Participante de play</option>
                    <option value="ALUNO_E_PLAY">Aluno e play</option>
                  </select>
                </label>

                <label class="checkbox">
                  <input
                    :checked="props.filtros.somenteAtivos !== false"
                    type="checkbox"
                    @change="atualizarFiltro('somenteAtivos', $event.target.checked)"
                  />
                  <span>Somente ativos</span>
                </label>
              </div>
            </details>

            <div class="secao-titulo">
              <h3>Resultados</h3>
              <span>{{ Number(props.pagina.totalElements || 0).toLocaleString('pt-BR') }}</span>
            </div>

            <p v-if="props.erro" class="erro">{{ props.erro }}</p>
            <p v-else-if="props.carregando" class="mensagem-suave">Carregando opções...</p>
            <p v-else-if="!props.alunos.length" class="mensagem-suave">Nenhum aluno encontrado para os filtros atuais.</p>

            <div v-else class="lista-resultados">
              <button
                v-for="aluno in props.alunos"
                :key="aluno.id"
                type="button"
                class="card-resultado"
                :class="{ selecionado: aluno.selecionado, inelegivel: aluno.elegivel === false }"
                :disabled="aluno.elegivel === false"
                :aria-pressed="aluno.selecionado === true"
                @click="emit('alternar', aluno.id)"
              >
                <div class="marcador">
                  <span class="indicador"></span>
                </div>
                <div class="conteudo-resultado">
                  <strong>{{ aluno.nome }}</strong>
                  <small>
                    <span v-if="aluno.telefone">{{ aluno.telefone }}</span>
                    <span v-if="aluno.email">{{ aluno.telefone ? ' · ' : '' }}{{ aluno.email }}</span>
                  </small>
                  <small>
                    {{ [aluno.nivelRotulo, aluno.perfilRotulo, aluno.participaCompeticaoBeachTennis === true ? rotuloCompeticaoBeachTennis(true) : ''].filter(Boolean).join(' · ') || 'Sem classificação' }}
                  </small>
                  <small v-if="aluno.elegivel === false">{{ aluno.motivoIndisponibilidade || 'Indisponível no momento.' }}</small>
                </div>
              </button>
            </div>

            <PaginacaoCompacta
              :pagina="Number(props.pagina.page || 0)"
              :total-pages="Number(props.pagina.totalPages || 0)"
              :total-elements="Number(props.pagina.totalElements || 0)"
              :disabled="props.carregando"
              @anterior="emit('anterior')"
              @proxima="emit('proxima')"
            />
          </div>
        </div>

        <footer class="rodape">
          <button class="botao secundario" type="button" @click="emit('fechar')">Cancelar</button>
          <button class="botao principal" type="button" @click="emit('confirmar')">
            {{ textoConfirmacao }}
          </button>
        </footer>
      </section>
    </section>
  </Teleport>
</template>

<style scoped>
.modal-fundo {
  position: fixed;
  inset: 0;
  z-index: 80;
  display: grid;
  place-items: center;
  padding: 18px;
  background: var(--app-overlay);
}

.painel {
  width: min(1100px, 100%);
  max-height: min(92vh, 92dvh);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border-radius: 20px;
  background: var(--app-surface);
  color: var(--app-text);
}

.cabecalho,
.rodape {
  position: sticky;
  z-index: 1;
  display: flex;
  justify-content: space-between;
  gap: 14px;
  align-items: center;
  padding: 18px 20px;
  background: var(--app-surface);
}

.botao-fechar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.botao-fechar:hover {
  background: var(--app-surface-soft);
}

.cabecalho {
  top: 0;
  border-bottom: 1px solid var(--app-border);
}

.rodape {
  bottom: 0;
  border-top: 1px solid var(--app-border);
}

.cabecalho h2,
.cabecalho p,
.secao-titulo h3,
.mensagem-suave,
.erro {
  margin: 0;
}

.cabecalho p,
.mensagem-suave {
  color: var(--app-text-muted);
}

.conteudo {
  min-height: 0;
  overflow: auto;
  overscroll-behavior: contain;
  display: grid;
  grid-template-columns: minmax(260px, 320px) minmax(0, 1fr);
}

.painel-selecionados,
.painel-lista {
  display: grid;
  gap: 14px;
  padding: 20px;
  min-width: 0;
}

.painel-selecionados {
  border-right: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  align-content: start;
}

.secao-titulo {
  display: flex;
  justify-content: space-between;
  gap: 10px;
  align-items: center;
}

.secao-titulo span {
  display: inline-flex;
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
}

.filtros {
  border: 1px solid var(--app-border);
  border-radius: 14px;
  padding: 12px 14px;
  background: var(--app-surface-soft);
}

.filtros summary {
  cursor: pointer;
  font-weight: 800;
  color: var(--app-text);
}

.grade-filtros {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
  margin-top: 12px;
}

.checkbox {
  display: flex;
  align-items: center;
  gap: 10px;
}

.lista-selecionados,
.lista-resultados {
  display: grid;
  gap: 10px;
}

.card-selecionado,
.card-resultado {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  min-height: 48px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface);
}

.card-resultado {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.card-resultado.selecionado {
  border-color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary-soft) 72%, var(--app-surface));
}

.card-resultado.inelegivel {
  opacity: 0.65;
  cursor: not-allowed;
  background: var(--app-surface-soft);
}

.marcador {
  padding-top: 3px;
}

.indicador {
  display: inline-flex;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid var(--app-input-disabled-border);
  background: var(--app-surface);
}

.card-resultado.selecionado .indicador {
  border-color: var(--app-primary);
  background: radial-gradient(circle at center, var(--app-primary) 0, var(--app-primary) 45%, transparent 46%);
}

.conteudo-resultado,
.card-selecionado > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.conteudo-resultado strong,
.card-selecionado strong {
  color: var(--app-text);
}

.conteudo-resultado small,
.card-selecionado small {
  color: var(--app-text-muted);
}

.erro {
  color: var(--app-danger);
  font-weight: 700;
}

@media (max-width: 920px) {
  .conteudo {
    grid-template-columns: 1fr;
  }

  .painel-selecionados {
    border-right: none;
    border-bottom: 1px solid var(--app-border);
  }

  .grade-filtros {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 760px) {
  .modal-fundo {
    padding: 0;
  }

  .painel {
    width: 100%;
    max-height: 100vh;
    max-height: 100dvh;
    height: 100vh;
    height: 100dvh;
    border-radius: 0;
  }

  .cabecalho,
  .rodape {
    align-items: stretch;
    flex-direction: column;
  }

  .cabecalho {
    padding-top: calc(18px + env(safe-area-inset-top, 0px));
  }

  .rodape {
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  }

  .rodape .botao {
    width: 100%;
  }
}
</style>
