<script setup>
import { computed, onMounted } from 'vue'
import { ETAPAS_LOTE, TIPOS_LOTE, useAulasFrequenciaLote } from '@/composables/useAulasFrequenciaLote'
import { formatarDataBrasileira } from '@/utils/beachTennis'

const fluxo = useAulasFrequenciaLote()

const carregandoInicial = fluxo.carregandoInicial
const erroInicializacao = fluxo.erroInicial
const tipoRotaValido = fluxo.tipoRotaValido
const tipo = fluxo.tipo
const etapaAtual = fluxo.etapaAtual
const previewAtualizada = fluxo.previewAtualizada
const lote = fluxo.lote
const OPCOES_ESCOPO = fluxo.OPCOES_ESCOPO
const descricaoEscopo = fluxo.descricaoEscopo
const professoresSelecionaveis = fluxo.professoresSelecionaveis
const escopo = fluxo.escopo
const OPCOES_PERIODO = fluxo.OPCOES_PERIODO
const erroAulasEspecificas = fluxo.erroAulasEspecificas
const carregandoAulasEspecificas = fluxo.carregandoAulasEspecificas
const aulasSelecionaveis = fluxo.aulasSelecionaveis
const aulasEspecificasCarregadas = fluxo.aulasEspecificasCarregadas
const turmasSelecionaveis = fluxo.turmasSelecionaveis
const tituloPrevia = fluxo.tituloPrevia
const carregandoPrevia = fluxo.carregandoPrevia
const previsaoPendente = fluxo.previsaoPendente
const previa = fluxo.previa
const mensagemPreview = fluxo.mensagemPreview
const erro = fluxo.erro
const mensagemBloqueioConfirmacao = fluxo.mensagemBloqueioConfirmacao
const processando = fluxo.processando
const podeConfirmar = fluxo.podeConfirmar
const textoBotaoConfirmar = fluxo.textoBotaoConfirmar
const inicializarPagina = fluxo.inicializarPagina
const fechar = fluxo.fechar
const voltarAConfiguracao = fluxo.voltarAConfiguracao
const abrirPrevia = fluxo.abrirPrevia
const selecionarTodasAulas = fluxo.selecionarTodasAulas
const limparSelecaoAulas = fluxo.limparSelecaoAulas
const confirmar = fluxo.confirmar

const ehCancelamento = computed(() => tipo.value === TIPOS_LOTE.CANCELAMENTO)
const tituloPagina = computed(() =>
  !tipoRotaValido.value ? 'Aulas em lote' : ehCancelamento.value ? 'Cancelar aulas em lote' : 'Retomar aulas em lote',
)
const subtituloPagina = computed(() =>
  !tipoRotaValido.value ? 'Fluxo em lote' : ehCancelamento.value ? 'Cancelamento em lote' : 'Retomada em lote',
)
const descricaoPagina = computed(() =>
  !tipoRotaValido.value
    ? 'Use o botão Voltar para retornar à tela anterior.'
    : ehCancelamento.value
      ? 'Use esta página para revisar a prévia, informar o motivo e concluir o cancelamento em lote.'
      : 'Use esta página para revisar a prévia e concluir a retomada em lote.',
)

onMounted(() => {
  void inicializarPagina()
})
</script>

<template>
  <main class="pagina lote-pagina">
    <header class="cabecalho-lote">
      <button type="button" class="botao secundario botao-voltar-lote" @click="fechar">
        <span aria-hidden="true">←</span>
        <span>Voltar</span>
      </button>

      <div class="cabecalho-lote-texto">
        <p class="subtitulo-mini">{{ subtituloPagina }}</p>
        <h1>{{ tituloPagina }}</h1>
        <p class="descricao">{{ descricaoPagina }}</p>
      </div>
    </header>

    <section v-if="carregandoInicial" class="card lote-estado">
      <p>Carregando dados da página...</p>
    </section>

    <section v-else-if="erroInicializacao" class="card lote-estado erro">
      <p>{{ erroInicializacao || 'Não foi possível carregar os dados necessários. Tente novamente.' }}</p>
      <div class="acoes-erro">
        <button type="button" class="botao principal" @click="inicializarPagina">
          Tentar novamente
        </button>
      </div>
    </section>

    <template v-else>
      <nav class="etapas-lote" aria-label="Etapas do fluxo em lote">
          <button
            type="button"
            class="etapa-lote"
            :class="{ ativa: etapaAtual === ETAPAS_LOTE.CONFIGURACAO }"
            :aria-selected="etapaAtual === ETAPAS_LOTE.CONFIGURACAO"
            @click="voltarAConfiguracao"
          >
            Configuração
          </button>
          <button
            type="button"
            class="etapa-lote"
            :class="{ ativa: etapaAtual === ETAPAS_LOTE.PREVIA }"
            :aria-selected="etapaAtual === ETAPAS_LOTE.PREVIA"
            :disabled="!previewAtualizada"
            @click="abrirPrevia"
          >
            Prévia
          </button>
        </nav>

      <section class="conteudo-lote">
        <section v-if="etapaAtual === ETAPAS_LOTE.CONFIGURACAO" class="card painel-lote">
          <div class="lote-bloco">
            <div class="lote-linha-campos">
              <label class="lote-campo">
                <span class="lote-rotulo">Escopo</span>
                <select v-model="lote.escopo">
                  <option v-for="opcao in OPCOES_ESCOPO" :key="opcao.valor" :value="opcao.valor">
                    {{ opcao.rotulo }}
                  </option>
                </select>
                <small class="ajuda-campo">{{ descricaoEscopo }}</small>
              </label>

              <label class="lote-campo">
                <span class="lote-rotulo">Data</span>
                <input v-model="lote.data" type="date" />
              </label>
            </div>

            <div class="lote-linha-campos">
              <label class="lote-campo">
                <span class="lote-rotulo">Professor, opcional</span>
                <select v-model="lote.professorId">
                  <option value="">Todos os professores</option>
                  <option v-for="professor in professoresSelecionaveis" :key="professor.id" :value="String(professor.id)">
                    {{ professor.nome }}
                  </option>
                </select>
              </label>

              <label v-if="escopo === 'PERIODO_DA_DATA'" class="lote-campo">
                <span class="lote-rotulo">Período</span>
                <select v-model="lote.periodo">
                  <option v-for="opcao in OPCOES_PERIODO" :key="opcao.valor" :value="opcao.valor">
                    {{ opcao.rotulo }}
                  </option>
                </select>
                <small class="ajuda-campo">Manhã: antes de 12h. Tarde: de 12h até 17h59. Noite: a partir de 18h.</small>
              </label>
            </div>

            <section v-if="ehCancelamento" class="lote-bloco-interno">
              <label class="lote-campo lote-campo-total">
                <span class="lote-rotulo">Motivo do cancelamento</span>
                <textarea
                  v-model="lote.motivo"
                  rows="4"
                  placeholder="Ex.: Chuva intensa durante a manhã"
                  :data-scroll-margin="true"
                ></textarea>
                <small class="ajuda-campo">O motivo é obrigatório na confirmação final.</small>
              </label>
            </section>

            <section v-if="escopo === 'AULAS_ESPECIFICAS'" class="lote-bloco-interno">
              <div class="lote-cabecalho-bloco">
                <div>
                  <h2>Aulas específicas</h2>
                  <p>Carregue as aulas da data e selecione uma ou mais opções.</p>
                </div>
                <div class="acoes-mini">
                  <button type="button" class="botao secundario compacto" @click="selecionarTodasAulas">Selecionar todas</button>
                  <button type="button" class="botao secundario compacto" @click="limparSelecaoAulas">Limpar</button>
                </div>
              </div>

              <p v-if="erroAulasEspecificas" class="estado-erro">{{ erroAulasEspecificas }}</p>

              <div v-if="carregandoAulasEspecificas" class="estado-vazio">
                <p>Carregando aulas da data...</p>
              </div>

              <div v-else-if="!aulasSelecionaveis.length && aulasEspecificasCarregadas" class="estado-vazio">
                <p>Nenhuma aula foi encontrada para a data selecionada.</p>
              </div>

              <div v-else-if="!aulasSelecionaveis.length" class="estado-vazio">
                <p>Selecione uma data para carregar as aulas.</p>
              </div>

              <div v-else class="lista-selecao">
                <label v-for="aula in aulasSelecionaveis" :key="aula.id" class="card-selecao">
                  <input v-model="lote.aulaIds" type="checkbox" :value="aula.id" />
                  <div>
                    <strong>{{ formatarDataBrasileira(aula.dataAula) || 'Data não informada' }}</strong>
                    <p>{{ aula.horarioInicio || 'Horário não informado' }} · {{ aula.turmaNome || `Aula ${aula.id}` }}</p>
                    <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                    <span class="chip situacao">{{ aula.situacao || 'Sem situação' }}</span>
                  </div>
                </label>
              </div>
            </section>

            <section v-if="escopo === 'TURMAS_NA_DATA' || escopo === 'PERIODO_DA_DATA'" class="lote-bloco-interno">
              <div class="lote-cabecalho-bloco">
                <div>
                  <h2>Turmas</h2>
                  <p>{{ escopo === 'TURMAS_NA_DATA' ? 'Selecione as turmas da data.' : 'As turmas são opcionais neste escopo.' }}</p>
                </div>
              </div>

              <div v-if="!turmasSelecionaveis.length" class="estado-vazio">
                <p>Nenhuma turma encontrada.</p>
              </div>

              <div v-else class="lista-selecao">
                <label v-for="turma in turmasSelecionaveis" :key="turma.id" class="card-selecao">
                  <input v-model="lote.turmaIds" type="checkbox" :value="turma.id" />
                  <div>
                    <strong>{{ turma.nome }}</strong>
                    <p>{{ turma.nivel || 'Turma sem classificação' }}</p>
                  </div>
                </label>
              </div>
            </section>
          </div>
        </section>

        <section v-else class="card painel-lote painel-previa">
          <div class="lote-previa-cabecalho">
            <div>
              <h2>Prévia obrigatória</h2>
              <p>{{ tituloPrevia }}</p>
              <small class="ajuda-campo">{{ descricaoEscopo }}</small>
            </div>
            <span class="contador">
              {{
                carregandoPrevia || previsaoPendente
                  ? 'Atualizando...'
                  : previewAtualizada
                    ? 'Prévia pronta'
                    : 'Aguardando'
              }}
            </span>
          </div>

          <p class="ajuda-campo">{{ mensagemPreview }}</p>
          <p v-if="erro" class="estado-erro">{{ erro }}</p>

          <div v-if="carregandoPrevia" class="estado-vazio">
            <p>Consultando prévia...</p>
          </div>

          <template v-else-if="previa">
            <div class="grade-resumo">
              <article class="mini-card">
                <span>Encontradas</span>
                <strong>{{ previa.quantidadeEncontrada }}</strong>
              </article>
              <article class="mini-card">
                <span>{{ ehCancelamento ? 'Canceláveis' : 'Reversíveis' }}</span>
                <strong>{{ ehCancelamento ? previa.quantidadeCancelavel : previa.quantidadeReversivel }}</strong>
              </article>
              <article class="mini-card">
                <span>{{ ehCancelamento ? 'Já canceladas' : 'Já ativas' }}</span>
                <strong>{{ ehCancelamento ? previa.quantidadeJaCancelada : previa.quantidadeJaAtiva }}</strong>
              </article>
              <article class="mini-card">
                <span>Bloqueadas</span>
                <strong>{{ previa.quantidadeBloqueada }}</strong>
              </article>
            </div>

            <div v-if="!previa.aulas.length" class="estado-vazio">
              <p>Nenhuma aula retornou na prévia.</p>
            </div>

            <div v-else class="lista-previa">
              <article v-for="aula in previa.aulas" :key="aula.aulaId" class="card-previa">
                <div class="card-previa-topo">
                  <div>
                    <strong>{{ formatarDataBrasileira(aula.data) || 'Data não informada' }}</strong>
                    <p>{{ aula.horario || 'Horário não informado' }} · {{ aula.turmaNome || `Aula ${aula.aulaId}` }}</p>
                  </div>
                  <span class="chip previa-status">{{ ehCancelamento ? (aula.cancelavel ? 'Cancelável' : aula.jaCancelada ? 'Já cancelada' : 'Bloqueada') : (aula.bloqueada ? 'Bloqueada' : aula.reversivel ? 'Reversível' : 'Já ativa') }}</span>
                </div>

                <p><strong>Professor:</strong> {{ aula.professorNome || 'Professor não informado' }}</p>
                <p><strong>Situação:</strong> {{ aula.situacao || '-' }}</p>
                <p v-if="aula.motivoBloqueio"><strong>Bloqueio:</strong> {{ aula.motivoBloqueio }}</p>
              </article>
            </div>
          </template>

          <div v-else class="estado-vazio">
            <p>Gere a prévia para visualizar os contadores e a lista de aulas encontradas.</p>
          </div>
        </section>
      </section>

      <footer class="barra-acoes-lote">
        <p v-if="mensagemBloqueioConfirmacao" class="ajuda-campo ajuda-bloqueio-confirmacao">
          {{ mensagemBloqueioConfirmacao }}
        </p>

        <div class="acoes-lote-botoes">
          <button
            type="button"
            class="botao secundario"
            @click="etapaAtual === ETAPAS_LOTE.CONFIGURACAO ? fechar() : voltarAConfiguracao()"
          >
            {{ etapaAtual === ETAPAS_LOTE.CONFIGURACAO ? 'Voltar' : 'Voltar à configuração' }}
          </button>
          <button
            v-if="etapaAtual === ETAPAS_LOTE.CONFIGURACAO"
            type="button"
            class="botao principal"
            :disabled="!previewAtualizada"
            @click="abrirPrevia"
          >
            {{ previewAtualizada ? 'Ver prévia' : 'Aguardando prévia' }}
          </button>
          <button
            v-else
            type="button"
            class="botao principal"
            :disabled="!podeConfirmar"
            @click="confirmar"
          >
            {{ processando ? 'Processando...' : textoBotaoConfirmar }}
          </button>
        </div>

        <p v-if="etapaAtual === ETAPAS_LOTE.CONFIGURACAO && !previewAtualizada" class="ajuda-campo">
          A prévia é gerada automaticamente quando os dados estiverem completos.
        </p>
      </footer>
    </template>
  </main>
</template>

<style scoped>
.lote-pagina {
  min-height: 100vh;
  min-height: 100dvh;
  overflow-x: hidden;
  padding: 16px;
  display: grid;
  gap: 16px;
}

.cabecalho-lote {
  display: flex;
  align-items: flex-start;
  gap: 16px;
  justify-content: space-between;
  padding: 20px;
  border-radius: 20px;
  border: 1px solid var(--app-border);
  background:
    radial-gradient(circle at top right, color-mix(in srgb, var(--app-primary) 12%, transparent), transparent 30%),
    var(--app-surface);
  box-shadow: var(--app-shadow);
}

.cabecalho-lote-texto h1 {
  margin: 0;
}

.lote-estado {
  min-height: 160px;
  display: grid;
  place-items: center;
  text-align: center;
  gap: 12px;
}

.lote-estado.erro {
  place-items: start;
  text-align: left;
}

.acoes-erro {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.botao-voltar-lote {
  flex: 0 0 auto;
  display: inline-flex;
  gap: 8px;
  align-items: center;
}

.etapas-lote {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
}

.etapa-lote {
  min-height: 44px;
  border-radius: 14px;
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  font-weight: 700;
}

.etapa-lote.ativa {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.conteudo-lote {
  display: grid;
  gap: 16px;
}

.painel-lote {
  padding: 20px;
  display: grid;
  gap: 20px;
}

.lote-bloco {
  display: grid;
  gap: 20px;
}

.lote-linha-campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 20px;
  align-items: start;
}

.lote-campo {
  display: grid;
  gap: 8px;
}

.lote-campo-total {
  grid-column: 1 / -1;
}

.lote-rotulo {
  font-weight: 700;
}

select,
input,
textarea {
  width: 100%;
  scroll-margin-bottom: 120px;
}

.lote-bloco-interno {
  display: grid;
  gap: 16px;
}

.lote-cabecalho-bloco,
.lote-previa-cabecalho {
  display: flex;
  gap: 12px;
  justify-content: space-between;
  align-items: flex-start;
}

.lista-selecao,
.lista-previa,
.grade-resumo {
  display: grid;
  gap: 12px;
}

.card-selecao,
.card-previa,
.mini-card {
  border: 1px solid var(--app-border);
  border-radius: 16px;
  background: var(--app-surface);
}

.card-selecao {
  display: grid;
  grid-template-columns: auto 1fr;
  gap: 12px;
  padding: 14px;
}

.card-previa {
  padding: 14px;
  display: grid;
  gap: 10px;
}

.card-previa-topo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
}

.grade-resumo {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.mini-card {
  padding: 12px;
  display: grid;
  gap: 6px;
}

.barra-acoes-lote {
  position: sticky;
  bottom: 0;
  z-index: 10;
  display: grid;
  gap: 10px;
  padding: 12px 16px calc(12px + env(safe-area-inset-bottom));
  border-top: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: 0 -10px 24px rgba(0, 0, 0, 0.06);
}

.acoes-lote-botoes {
  display: grid;
  gap: 10px;
  grid-template-columns: 1fr 1fr;
}

.acoes-lote-botoes .botao {
  min-height: 44px;
}

@media (max-width: 520px) {
  .lote-pagina {
    padding: 12px;
  }

  .cabecalho-lote {
    padding: 16px;
    flex-direction: column;
  }

  .lote-linha-campos,
  .grade-resumo,
  .acoes-lote-botoes {
    grid-template-columns: 1fr;
  }

  .card-previa-topo,
  .lote-cabecalho-bloco,
  .lote-previa-cabecalho {
    flex-direction: column;
  }
}
</style>
