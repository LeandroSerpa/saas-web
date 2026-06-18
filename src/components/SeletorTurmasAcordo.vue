<script setup>
import { computed, onBeforeUnmount, ref, watch } from 'vue'
import PaginacaoCompacta from '@/components/PaginacaoCompacta.vue'

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
  turmas: {
    type: Array,
    default: () => [],
  },
  selecionados: {
    type: Array,
    default: () => [],
  },
  professores: {
    type: Array,
    default: () => [],
  },
  termoSingular: {
    type: String,
    default: 'Turma',
  },
  termoPlural: {
    type: String,
    default: 'Turmas',
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
    <section v-if="props.aberto" class="modal-fundo" role="dialog" aria-modal="true" aria-labelledby="titulo-seletor-turmas">
      <section class="painel">
        <header class="cabecalho">
          <div>
            <h2 id="titulo-seletor-turmas">{{ `Gerenciar ${props.termoPlural.toLocaleLowerCase('pt-BR')}` }}</h2>
            <p>{{ `${quantidadeSelecionados} ${props.termoPlural.toLocaleLowerCase('pt-BR')} vinculada(s)` }}</p>
          </div>
          <button class="botao-fechar" type="button" aria-label="Fechar seletor de turmas" @click="emit('fechar')">
            ×
          </button>
        </header>

        <div class="conteudo">
          <div class="painel-selecionados">
            <div class="secao-titulo">
              <h3>Selecionadas</h3>
              <span>{{ quantidadeSelecionados }}</span>
            </div>

            <p v-if="!props.selecionados.length" class="mensagem-suave">
              {{ `Nenhuma ${props.termoSingular.toLocaleLowerCase('pt-BR')} selecionada ainda.` }}
            </p>

            <div v-else class="lista-selecionados">
              <article v-for="turma in props.selecionados" :key="turma.id" class="card-selecionado">
                <div>
                  <strong>{{ turma.nome }}</strong>
                  <small>{{ [turma.professorNome, turma.diasSemanaFormatados, turma.horarioFormatado].filter(Boolean).join(' · ') }}</small>
                </div>
                <button class="botao secundario compacto" type="button" @click="emit('remover-selecionado', turma.id)">
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
                placeholder="Nome da turma ou professor"
                @input="emit('update:busca', $event.target.value)"
              />
            </label>

            <details class="filtros" open>
              <summary>Filtros</summary>

              <div class="grade-filtros">
                <label>
                  Dia da semana
                  <select :value="props.filtros.diaSemana || ''" @change="atualizarFiltro('diaSemana', $event.target.value)">
                    <option value="">Todos</option>
                    <option value="SEGUNDA">Segunda</option>
                    <option value="TERCA">Terça</option>
                    <option value="QUARTA">Quarta</option>
                    <option value="QUINTA">Quinta</option>
                    <option value="SEXTA">Sexta</option>
                    <option value="SABADO">Sábado</option>
                    <option value="DOMINGO">Domingo</option>
                  </select>
                </label>

                <label>
                  Professor
                  <select :value="props.filtros.funcionarioId || ''" @change="atualizarFiltro('funcionarioId', $event.target.value)">
                    <option value="">Todos</option>
                    <option v-for="professor in props.professores" :key="professor.id" :value="String(professor.id)">
                      {{ professor.nome }}
                    </option>
                  </select>
                </label>

                <label>
                  Nível
                  <select :value="props.filtros.nivel || ''" @change="atualizarFiltro('nivel', $event.target.value)">
                    <option value="">Todos</option>
                    <option value="INICIANTE">Iniciante</option>
                    <option value="INTERMEDIARIO">Intermediário</option>
                    <option value="AVANCADO">Avançado</option>
                    <option value="COMPETICAO">Competição</option>
                  </select>
                </label>

                <label>
                  Horário de
                  <input
                    :value="props.filtros.horarioInicioDe || ''"
                    type="time"
                    @input="atualizarFiltro('horarioInicioDe', $event.target.value)"
                  />
                </label>

                <label>
                  Horário até
                  <input
                    :value="props.filtros.horarioInicioAte || ''"
                    type="time"
                    @input="atualizarFiltro('horarioInicioAte', $event.target.value)"
                  />
                </label>

                <label class="checkbox">
                  <input
                    :checked="props.filtros.somenteAtivas !== false"
                    type="checkbox"
                    @change="atualizarFiltro('somenteAtivas', $event.target.checked)"
                  />
                  <span>Somente ativas</span>
                </label>
              </div>
            </details>

            <div class="secao-titulo">
              <h3>Resultados</h3>
              <span>{{ Number(props.pagina.totalElements || 0).toLocaleString('pt-BR') }}</span>
            </div>

            <p v-if="props.erro" class="erro">{{ props.erro }}</p>
            <p v-else-if="props.carregando" class="mensagem-suave">Carregando opções...</p>
            <p v-else-if="!props.turmas.length" class="mensagem-suave">Nenhuma turma encontrada para os filtros atuais.</p>

            <div v-else class="lista-resultados">
              <button
                v-for="turma in props.turmas"
                :key="turma.id"
                type="button"
                class="card-resultado"
                :class="{ selecionado: turma.selecionado }"
                :aria-pressed="turma.selecionado === true"
                @click="emit('alternar', turma.id)"
              >
                <div class="marcador">
                  <span class="indicador"></span>
                </div>
                <div class="conteudo-resultado">
                  <strong>{{ turma.nome }}</strong>
                  <small>{{ [turma.professorNome, turma.diasSemanaFormatados, turma.horarioFormatado].filter(Boolean).join(' · ') }}</small>
                  <small>{{ [turma.nivelRotulo, turma.ocupacaoTexto].filter(Boolean).join(' · ') }}</small>
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
  background: rgba(15, 23, 42, 0.56);
}

.painel {
  width: min(1100px, 100%);
  max-height: min(92vh, 92dvh);
  display: grid;
  grid-template-rows: auto 1fr auto;
  overflow: hidden;
  border-radius: 20px;
  background: #ffffff;
  color: #0f172a;
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
  background: #ffffff;
}

.botao-fechar {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 42px;
  height: 42px;
  border: 1px solid #cbd5e1;
  border-radius: 999px;
  background: #ffffff;
  color: #0f172a;
  font-size: 24px;
  line-height: 1;
  cursor: pointer;
}

.botao-fechar:hover {
  background: #f8fafc;
}

.cabecalho {
  top: 0;
  border-bottom: 1px solid #e2e8f0;
}

.rodape {
  bottom: 0;
  border-top: 1px solid #e2e8f0;
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
  color: #64748b;
}

.conteudo {
  min-height: 0;
  overflow: auto;
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
  border-right: 1px solid #e2e8f0;
  background: #f8fafc;
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
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
}

.filtros {
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 14px;
  background: #f8fafc;
}

.filtros summary {
  cursor: pointer;
  font-weight: 800;
  color: #0f172a;
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
  border: 1px solid #dbe3ef;
  border-radius: 14px;
  background: #ffffff;
}

.card-resultado {
  width: 100%;
  text-align: left;
  cursor: pointer;
}

.card-resultado.selecionado {
  border-color: #2563eb;
  background: #eff6ff;
}

.marcador {
  padding-top: 3px;
}

.indicador {
  display: inline-flex;
  width: 18px;
  height: 18px;
  border-radius: 999px;
  border: 2px solid #94a3b8;
  background: #ffffff;
}

.card-resultado.selecionado .indicador {
  border-color: #2563eb;
  background: radial-gradient(circle at center, #2563eb 0, #2563eb 45%, transparent 46%);
}

.conteudo-resultado,
.card-selecionado > div {
  display: grid;
  gap: 4px;
  min-width: 0;
}

.conteudo-resultado strong,
.card-selecionado strong {
  color: #0f172a;
}

.conteudo-resultado small,
.card-selecionado small {
  color: #64748b;
}

.erro {
  color: #b91c1c;
  font-weight: 700;
}

@media (max-width: 920px) {
  .conteudo {
    grid-template-columns: 1fr;
  }

  .painel-selecionados {
    border-right: none;
    border-bottom: 1px solid #e2e8f0;
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

  .rodape {
    padding-bottom: calc(18px + env(safe-area-inset-bottom, 0px));
  }

  .rodape .botao {
    width: 100%;
  }
}
</style>
