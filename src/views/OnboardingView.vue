<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  atualizarEtapaOnboarding,
  buscarOnboarding,
  marcarLinkPublicoVisualizado,
  recalcularOnboarding,
} from '@/services/api'

const ETAPAS_PADRAO = [
  {
    chave: 'DADOS_EMPRESA',
    titulo: 'Revise os dados da empresa',
    descricao: 'Confira telefone, endereco, horarios, mensagem publica e informacoes principais.',
    acao: 'Abrir Minha empresa',
    rota: '/minha-empresa',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'SERVICO',
    titulo: 'Cadastre os servicos',
    descricao: 'Adicione os servicos que seus clientes poderao agendar.',
    acao: 'Abrir Servicos',
    rota: '/servicos',
    permiteIgnorar: true,
  },
  {
    chave: 'FUNCIONARIO',
    titulo: 'Cadastre os funcionarios',
    descricao: 'Inclua quem realizara os atendimentos da empresa.',
    acao: 'Abrir Funcionarios',
    rota: '/funcionarios',
    permiteIgnorar: true,
  },
  {
    chave: 'HORARIOS',
    titulo: 'Configure a disponibilidade',
    descricao: 'Defina horarios, bloqueios e disponibilidade para organizar a agenda.',
    acao: 'Abrir Disponibilidade',
    rota: '/disponibilidade',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'PERSONALIZACAO',
    titulo: 'Personalize sua pagina',
    descricao: 'Ajuste identidade visual, textos e apresentacao publica da empresa.',
    acao: 'Abrir Personalizacao',
    rota: '/personalizacao',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'LINK_PUBLICO',
    titulo: 'Compartilhe o link publico',
    descricao: 'Copie o link de agendamento para divulgar aos clientes.',
    acao: 'Copiar link publico',
    rota: '/agenda',
    permiteIgnorar: true,
  },
  {
    chave: 'PRIMEIRO_AGENDAMENTO',
    titulo: 'Acompanhe a agenda',
    descricao: 'Veja a agenda ou valide o link publico para acompanhar seus primeiros agendamentos.',
    acao: 'Abrir Agenda',
    rota: '/agenda',
  },
]

const onboarding = ref({})
const carregando = ref(true)
const processandoEtapa = ref('')
const erro = ref('')
const mensagemSucesso = ref('')
const route = useRoute()
const router = useRouter()

const empresaNome = computed(() => obterCampo(onboarding.value, 'empresaNome', 'nomeEmpresa') || 'Sua empresa')
const linkPublico = computed(() => obterCampo(onboarding.value, 'linkPublicoAgendamento', 'linkPublico', 'urlAgendamento'))
const etapasBackend = computed(() => normalizarEtapasBackend(onboarding.value))
const usaEtapasBackend = computed(() => etapasBackend.value.length > 0)

const etapas = computed(() => {
  const listaBase = usaEtapasBackend.value
    ? mesclarEtapasComConfiguracao(etapasBackend.value)
    : ETAPAS_PADRAO.map((item) => ({ ...item }))

  return listaBase.map((etapa, indice) => ({
    ...etapa,
    numero: indice + 1,
    status: resolverStatusEtapa(etapa),
    titulo: etapa.titulo || 'Etapa de configuracao',
    descricao: etapa.descricao || 'Conclua esta configuracao para avancar no onboarding.',
    acao: etapa.acao || 'Continuar',
  }))
})

const percentual = computed(() => {
  const valor = Number(obterCampo(onboarding.value, 'percentualConclusao', 'percentualConcluido', 'percentual', 'progresso'))
  if (Number.isFinite(valor)) return limitarPercentual(valor)

  const total = etapas.value.length || 1
  const concluidas = etapas.value.filter((etapa) => etapa.status === 'CONCLUIDO').length
  return limitarPercentual((concluidas / total) * 100)
})

const concluido = computed(() =>
  percentual.value >= 100 || Boolean(obterCampo(onboarding.value, 'onboardingConcluido', 'concluido', 'finalizado')),
)

const resumoChecklist = computed(() => {
  const totais = {
    concluido: 0,
    pendente: 0,
    ignorado: 0,
  }

  etapas.value.forEach((etapa) => {
    if (etapa.status === 'CONCLUIDO') totais.concluido += 1
    else if (etapa.status === 'IGNORADO') totais.ignorado += 1
    else totais.pendente += 1
  })

  return totais
})

async function carregarOnboarding() {
  try {
    carregando.value = true
    erro.value = ''

    if (route.query.atualizado || route.query.recalcular) {
      const recalculado = await recalcularOnboarding()
      if (recalculado && typeof recalculado === 'object') {
        onboarding.value = normalizarObjeto(recalculado)
      }
      mensagemSucesso.value = 'Progresso atualizado com sucesso.'
    }

    onboarding.value = normalizarObjeto(await buscarOnboarding())
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar os primeiros passos.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function atualizarProgresso() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    await recalcularOnboarding()
    onboarding.value = normalizarObjeto(await buscarOnboarding())
    mensagemSucesso.value = 'Progresso atualizado com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel carregar os primeiros passos.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function marcarEtapa(etapa, status) {
  if (!etapa.chave) {
    return
  }

  try {
    processandoEtapa.value = etapa.chave
    erro.value = ''
    mensagemSucesso.value = ''
    await atualizarEtapaOnboarding(etapa.chave, {
      concluido: status === 'CONCLUIDO',
      ignorado: status === 'IGNORADO',
    })
    await carregarOnboarding()
    mensagemSucesso.value = status === 'CONCLUIDO' ? 'Etapa marcada como concluida.' : 'Etapa ignorada por enquanto.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel atualizar a etapa.')
    console.error(error)
  } finally {
    processandoEtapa.value = ''
  }
}

async function executarAcaoEtapa(etapa) {
  if (etapa.chave === 'LINK_PUBLICO') {
    await copiarLinkPublico()
    return
  }

  navegarParaEtapa(etapa)
}

async function copiarLinkPublico() {
  const link = linkPublico.value

  if (!link) {
    erro.value = 'Link publico ainda nao disponivel.'
    return
  }

  try {
    processandoEtapa.value = 'LINK_PUBLICO'
    erro.value = ''
    mensagemSucesso.value = ''
    await navigator.clipboard.writeText(link)
    await marcarLinkPublicoVisualizado()
    await carregarOnboarding()
    mensagemSucesso.value = 'Link copiado com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Nao foi possivel copiar o link publico.')
    console.error(error)
  } finally {
    processandoEtapa.value = ''
  }
}

function navegarParaEtapa(etapa) {
  if (!etapa.rota) {
    return
  }

  sessionStorage.setItem('origemOnboarding', 'true')
  if (etapa.chave) {
    sessionStorage.setItem('etapaOnboarding', etapa.chave)
  }

  router.push({
    path: etapa.rota,
    query: {
      origem: 'onboarding',
      etapa: etapa.chave || undefined,
    },
  })
}

function mesclarEtapasComConfiguracao(etapasApi) {
  return etapasApi.map((etapaApi, indice) => {
    const chave = normalizarChaveEtapa(etapaApi, indice)
    const configuracao = ETAPAS_PADRAO.find((item) => item.chave === chave)
    const tituloApi = obterCampo(etapaApi, 'titulo', 'nome', 'rotulo', 'descricaoCurta')
    const descricaoApi = obterCampo(etapaApi, 'descricao', 'texto', 'detalhe', 'orientacao')

    return {
      chave,
      titulo: tituloApi || configuracao?.titulo || `Etapa ${indice + 1}`,
      descricao: descricaoApi || configuracao?.descricao || '',
      acao: configuracao?.acao || acaoPadraoPorChave(chave),
      rota: configuracao?.rota || rotaPadraoPorChave(chave),
      permiteManual: configuracao?.permiteManual || false,
      permiteIgnorar: configuracao?.permiteIgnorar || false,
      backend: etapaApi,
    }
  })
}

function normalizarEtapasBackend(dados) {
  const lista = obterCampo(dados, 'etapas')
  if (Array.isArray(lista)) {
    return lista
  }

  const passos = obterCampo(dados, 'checklist', 'itens', 'items')
  return Array.isArray(passos) ? passos : []
}

function resolverStatusEtapa(etapa) {
  const etapaBackend = etapa.backend || encontrarEtapa(etapa.chave)
  const bruto =
    obterCampo(onboarding.value, etapa.chave) ||
    obterCampo(onboarding.value?.etapas, etapa.chave) ||
    obterCampo(etapaBackend, 'status', 'situacao')

  if (etapaBackend?.concluido === true || etapaBackend?.concluida === true) return 'CONCLUIDO'
  if (etapaBackend?.ignorado === true || etapaBackend?.ignorada === true) return 'IGNORADO'

  const valorStatus = typeof bruto === 'object' ? obterCampo(bruto, 'status', 'situacao') : bruto
  const status = String(valorStatus || 'PENDENTE').trim().toUpperCase()

  if (['CONCLUIDA', 'CONCLUIDO', 'FEITO', 'FINALIZADO'].includes(status)) return 'CONCLUIDO'
  if (['IGNORADA', 'IGNORADO'].includes(status)) return 'IGNORADO'
  return 'PENDENTE'
}

function encontrarEtapa(chave) {
  const lista = etapasBackend.value
  return lista.find((item, indice) => normalizarChaveEtapa(item, indice) === chave)
}

function normalizarChaveEtapa(item, indice = 0) {
  const chave = obterCampo(item, 'etapa', 'chave', 'codigo', 'nome', 'tipo')
  const texto = String(chave || '').trim().toUpperCase()

  if (texto) {
    if (texto.includes('EMPRESA')) return 'DADOS_EMPRESA'
    if (texto.includes('SERV')) return 'SERVICO'
    if (texto.includes('FUNC')) return 'FUNCIONARIO'
    if (texto.includes('HOR') || texto.includes('DISPON')) return 'HORARIOS'
    if (texto.includes('PERSON')) return 'PERSONALIZACAO'
    if (texto.includes('LINK')) return 'LINK_PUBLICO'
    if (texto.includes('AGENDA') || texto.includes('AGEND')) return 'PRIMEIRO_AGENDAMENTO'

    return texto
  }

  return `ETAPA_${indice + 1}`
}

function rotaPadraoPorChave(chave) {
  return {
    DADOS_EMPRESA: '/minha-empresa',
    SERVICO: '/servicos',
    FUNCIONARIO: '/funcionarios',
    HORARIOS: '/disponibilidade',
    PERSONALIZACAO: '/personalizacao',
    LINK_PUBLICO: '/agenda',
    PRIMEIRO_AGENDAMENTO: '/agenda',
  }[chave] || '/agenda'
}

function acaoPadraoPorChave(chave) {
  return {
    DADOS_EMPRESA: 'Abrir Minha empresa',
    SERVICO: 'Abrir Servicos',
    FUNCIONARIO: 'Abrir Funcionarios',
    HORARIOS: 'Abrir Disponibilidade',
    PERSONALIZACAO: 'Abrir Personalizacao',
    LINK_PUBLICO: 'Copiar link publico',
    PRIMEIRO_AGENDAMENTO: 'Abrir Agenda',
  }[chave] || 'Continuar'
}

function statusTexto(status) {
  return { CONCLUIDO: 'Concluido', IGNORADO: 'Ignorado', PENDENTE: 'Pendente' }[status] || status
}

function classeStatus(status) {
  return {
    CONCLUIDO: 'concluido',
    IGNORADO: 'ignorado',
    PENDENTE: 'pendente',
  }[status] || 'pendente'
}

function limitarPercentual(valor) {
  return Math.max(0, Math.min(100, Math.round(Number(valor) || 0)))
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  if (dados.data && !Array.isArray(dados.data) && typeof dados.data === 'object') return dados.data
  return dados
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''
  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') return item[campo]
  }
  return ''
}

function obterMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  const normalizada = mensagem.toLowerCase()
  if (normalizada === 'forbidden' || normalizada.includes('403') || normalizada.includes('permiss')) {
    return 'Voce nao tem permissao para acessar este onboarding.'
  }
  return mensagem || fallback
}

onMounted(carregarOnboarding)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Configuracao inicial</p>
        <h1>Primeiros passos</h1>
        <p class="descricao">Acompanhe o checklist inicial da empresa e conclua o que falta para operar.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="atualizarProgresso">
        {{ carregando ? 'Atualizando...' : 'Atualizar progresso' }}
      </button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso"><p>{{ mensagemSucesso }}</p></section>

    <section v-if="carregando" class="card"><p>Carregando primeiros passos...</p></section>

    <template v-else>
      <section class="card hero">
        <div class="hero-conteudo">
          <span class="empresa">{{ empresaNome }}</span>
          <h2>{{ concluido ? 'Sua empresa esta pronta para comecar.' : 'Checklist inicial da empresa' }}</h2>
          <p>
            {{
              concluido
                ? 'Os principais pontos do onboarding foram finalizados.'
                : 'Use este checklist para concluir a configuracao inicial sem perder nenhuma etapa importante.'
            }}
          </p>
        </div>

        <div class="progresso-box">
          <div class="progresso-topo">
            <strong>{{ percentual }}%</strong>
            <span>{{ resumoChecklist.concluido }}/{{ etapas.length }} concluidos</span>
          </div>
          <div class="barra" aria-hidden="true"><span :style="{ width: `${percentual}%` }"></span></div>
          <div class="resumo-grid">
            <article class="resumo-item">
              <small>Concluidos</small>
              <strong>{{ resumoChecklist.concluido }}</strong>
            </article>
            <article class="resumo-item">
              <small>Pendentes</small>
              <strong>{{ resumoChecklist.pendente }}</strong>
            </article>
            <article class="resumo-item">
              <small>Ignorados</small>
              <strong>{{ resumoChecklist.ignorado }}</strong>
            </article>
          </div>
        </div>
      </section>

      <section class="checklist">
        <article v-for="etapa in etapas" :key="etapa.chave" class="card etapa-card">
          <div :class="['numero', classeStatus(etapa.status)]">{{ etapa.numero }}</div>

          <div class="conteudo-etapa">
            <div class="topo-etapa">
              <div class="texto-etapa">
                <div class="linha-titulo">
                  <h2>{{ etapa.titulo }}</h2>
                  <span :class="['badge', classeStatus(etapa.status)]">{{ statusTexto(etapa.status) }}</span>
                </div>
                <p>{{ etapa.descricao }}</p>
              </div>
            </div>

            <div class="acoes">
              <button
                class="botao principal"
                type="button"
                :disabled="processandoEtapa === etapa.chave"
                @click="executarAcaoEtapa(etapa)"
              >
                {{ processandoEtapa === etapa.chave ? 'Processando...' : etapa.acao }}
              </button>

              <button
                v-if="etapa.permiteManual && etapa.status !== 'CONCLUIDO'"
                class="botao secundario"
                :disabled="processandoEtapa === etapa.chave"
                @click="marcarEtapa(etapa, 'CONCLUIDO')"
              >
                Marcar como feito
              </button>

              <button
                v-if="etapa.permiteIgnorar && etapa.status === 'PENDENTE'"
                class="botao discreto"
                :disabled="processandoEtapa === etapa.chave"
                @click="marcarEtapa(etapa, 'IGNORADO')"
              >
                Ignorar por enquanto
              </button>
            </div>
          </div>
        </article>
      </section>
    </template>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 22px;
  color: #111827;
}

.cabecalho-pagina,
.hero,
.topo-etapa,
.acoes,
.linha-titulo,
.progresso-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

.descricao,
.hero p,
.texto-etapa p {
  margin-top: 6px;
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.hero {
  align-items: stretch;
  border-left: 5px solid #2563eb;
}

.hero-conteudo {
  display: grid;
  gap: 10px;
  align-content: start;
}

.empresa {
  color: #2563eb;
  font-weight: 800;
}

.progresso-box {
  min-width: 320px;
  display: grid;
  gap: 12px;
}

.progresso-topo strong {
  font-size: 32px;
}

.progresso-topo span,
.resumo-item small {
  color: #64748b;
  font-weight: 700;
}

.barra {
  height: 12px;
  border-radius: 999px;
  background: #e5e7eb;
  overflow: hidden;
}

.barra span {
  display: block;
  height: 100%;
  border-radius: 999px;
  background: #2563eb;
}

.resumo-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.resumo-item {
  display: grid;
  gap: 4px;
  padding: 12px;
  border-radius: 8px;
  background: #f8fafc;
}

.resumo-item strong {
  font-size: 20px;
}

.checklist {
  display: grid;
  gap: 14px;
}

.etapa-card {
  display: grid;
  grid-template-columns: 52px minmax(0, 1fr);
  gap: 16px;
}

.numero {
  width: 52px;
  height: 52px;
  display: grid;
  place-items: center;
  border-radius: 999px;
  font-weight: 800;
  background: #e5e7eb;
  color: #334155;
}

.numero.concluido {
  background: #dcfce7;
  color: #15803d;
}

.numero.pendente {
  background: #dbeafe;
  color: #1d4ed8;
}

.numero.ignorado {
  background: #e5e7eb;
  color: #4b5563;
}

.conteudo-etapa {
  display: grid;
  gap: 14px;
}

.texto-etapa {
  display: grid;
  gap: 4px;
}

.texto-etapa h2 {
  font-size: 22px;
}

.badge {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.badge.concluido {
  background: #dcfce7;
  color: #15803d;
}

.badge.pendente {
  background: #dbeafe;
  color: #1d4ed8;
}

.badge.ignorado {
  background: #e5e7eb;
  color: #4b5563;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.55;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.discreto {
  background: #64748b;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 820px) {
  .cabecalho-pagina,
  .hero,
  .topo-etapa,
  .acoes,
  .linha-titulo,
  .progresso-topo {
    align-items: flex-start;
    flex-direction: column;
  }

  .etapa-card {
    grid-template-columns: 1fr;
  }

  .progresso-box {
    width: 100%;
    min-width: 0;
  }

  .resumo-grid {
    grid-template-columns: 1fr;
  }
}
</style>
