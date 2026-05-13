<script setup>
import { computed, onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  atualizarEtapaOnboarding,
  buscarOnboarding,
  marcarLinkPublicoVisualizado,
  recalcularOnboarding,
} from '@/services/api'

const ETAPAS = [
  {
    chave: 'DADOS_EMPRESA',
    titulo: 'Complete os dados da empresa',
    descricao: 'Informe telefone, endereço, horários e mensagem pública.',
    acao: 'Ir para Minha empresa',
    rota: '/minha-empresa',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'SERVICO',
    titulo: 'Cadastre seu primeiro serviço',
    descricao: 'Adicione os serviços que seus clientes poderão agendar.',
    acao: 'Cadastrar serviço',
    rota: '/servicos',
    permiteIgnorar: true,
  },
  {
    chave: 'FUNCIONARIO',
    titulo: 'Cadastre seu primeiro funcionário',
    descricao: 'Adicione quem realizará os atendimentos.',
    acao: 'Cadastrar funcionário',
    rota: '/funcionarios',
    permiteIgnorar: true,
  },
  {
    chave: 'HORARIOS',
    titulo: 'Configure os horários',
    descricao: 'Defina dias de funcionamento e horário de abertura e fechamento.',
    acao: 'Configurar horários',
    rota: '/minha-empresa',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'PERSONALIZACAO',
    titulo: 'Personalize sua página',
    descricao: 'Adicione cores, textos, redes sociais e identidade da empresa.',
    acao: 'Personalizar página',
    rota: '/personalizacao',
    permiteManual: true,
    permiteIgnorar: true,
  },
  {
    chave: 'LINK_PUBLICO',
    titulo: 'Copie seu link de agendamento',
    descricao: 'Compartilhe o link com seus clientes para receber agendamentos.',
    acao: 'Copiar link público',
    permiteIgnorar: true,
  },
  {
    chave: 'PRIMEIRO_AGENDAMENTO',
    titulo: 'Receba seu primeiro agendamento',
    descricao: 'Quando um cliente agendar, esta etapa será concluída automaticamente.',
    acao: 'Ver agenda',
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
const percentual = computed(() => {
  const valor = Number(obterCampo(onboarding.value, 'percentualConclusao', 'percentualConcluido', 'percentual', 'progresso'))
  if (Number.isFinite(valor)) return Math.max(0, Math.min(100, Math.round(valor)))

  const total = etapas.value.length || 1
  const concluidas = etapas.value.filter((etapa) => etapa.status === 'CONCLUIDO').length
  return Math.round((concluidas / total) * 100)
})
const concluido = computed(() =>
  percentual.value >= 100 || Boolean(obterCampo(onboarding.value, 'onboardingConcluido', 'concluido', 'finalizado')),
)
const linkPublico = computed(() => obterCampo(onboarding.value, 'linkPublicoAgendamento', 'linkPublico', 'urlAgendamento'))
const etapas = computed(() =>
  ETAPAS.map((configuracao, indice) => ({
    ...configuracao,
    numero: indice + 1,
    status: statusEtapa(configuracao.chave),
  })),
)

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
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os primeiros passos.')
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
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os primeiros passos.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function marcarEtapa(etapa, status) {
  try {
    processandoEtapa.value = etapa.chave
    erro.value = ''
    mensagemSucesso.value = ''
    await atualizarEtapaOnboarding(etapa.chave, {
      concluido: status === 'CONCLUIDO',
      ignorado: status === 'IGNORADO',
    })
    await carregarOnboarding()
    mensagemSucesso.value = status === 'CONCLUIDO' ? 'Etapa marcada como concluída.' : 'Etapa ignorada por enquanto.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar a etapa.')
    console.error(error)
  } finally {
    processandoEtapa.value = ''
  }
}

async function copiarLinkPublico() {
  const link = linkPublico.value

  if (!link) {
    erro.value = 'Link público ainda não disponível.'
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
    erro.value = obterMensagemErro(error, 'Não foi possível copiar o link público.')
    console.error(error)
  } finally {
    processandoEtapa.value = ''
  }
}

function statusEtapa(chave) {
  const etapaEncontrada = encontrarEtapa(chave)
  const bruto =
    obterCampo(onboarding.value, chave) ||
    obterCampo(onboarding.value?.etapas, chave) ||
    etapaEncontrada?.status ||
    etapaEncontrada?.situacao

  if (etapaEncontrada?.concluido === true || etapaEncontrada?.concluida === true) return 'CONCLUIDO'
  if (etapaEncontrada?.ignorado === true || etapaEncontrada?.ignorada === true) return 'IGNORADO'

  const valorStatus = typeof bruto === 'object' ? obterCampo(bruto, 'status', 'situacao') : bruto
  const status = String(valorStatus || 'PENDENTE').trim().toUpperCase()
  if (['CONCLUIDA', 'CONCLUIDO', 'FEITO', 'FINALIZADO'].includes(status)) return 'CONCLUIDO'
  if (['IGNORADA', 'IGNORADO'].includes(status)) return 'IGNORADO'
  return 'PENDENTE'
}

function encontrarEtapa(chave) {
  const lista = Array.isArray(onboarding.value?.etapas) ? onboarding.value.etapas : []
  return lista.find((item) => obterCampo(item, 'etapa', 'chave', 'codigo', 'nome') === chave)
}

function statusTexto(status) {
  return { CONCLUIDO: 'Concluído', IGNORADO: 'Ignorado', PENDENTE: 'Pendente' }[status] || status
}

function navegarParaEtapa(etapa) {
  sessionStorage.setItem('origemOnboarding', 'true')
  sessionStorage.setItem('etapaOnboarding', etapa.chave)
  router.push({
    path: etapa.rota,
    query: {
      origem: 'onboarding',
      etapa: etapa.chave,
    },
  })
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
    return 'Você não tem permissão para acessar este onboarding.'
  }
  return mensagem || fallback
}

onMounted(carregarOnboarding)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">CONFIGURAÇÃO INICIAL</p>
        <h1>Primeiros passos</h1>
        <p class="descricao">Configure sua empresa para começar a receber agendamentos.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="atualizarProgresso">
        {{ carregando ? 'Atualizando...' : 'Atualizar progresso' }}
      </button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso"><p>{{ mensagemSucesso }}</p></section>

    <section v-if="carregando" class="card"><p>Carregando primeiros passos...</p></section>

    <template v-else>
      <section class="card boas-vindas">
        <div>
          <span class="empresa">{{ empresaNome }}</span>
          <h2>{{ concluido ? 'Tudo pronto!' : 'Complete sua configuração' }}</h2>
          <p>
            {{
              concluido
                ? 'Sua empresa já está configurada para começar a receber agendamentos.'
                : 'Complete os passos abaixo para deixar sua empresa pronta para receber clientes.'
            }}
          </p>
        </div>
        <div class="progresso-box">
          <strong>{{ percentual }}%</strong>
          <div class="barra"><span :style="{ width: `${percentual}%` }"></span></div>
          <small>Percentual concluído</small>
        </div>
      </section>

      <section class="checklist">
        <article v-for="etapa in etapas" :key="etapa.chave" class="card etapa-card">
          <div class="numero">{{ etapa.numero }}</div>
          <div class="conteudo-etapa">
            <div class="topo-etapa">
              <div>
                <h2>{{ etapa.titulo }}</h2>
                <p>{{ etapa.descricao }}</p>
              </div>
              <span :class="['badge', etapa.status.toLowerCase()]">{{ statusTexto(etapa.status) }}</span>
            </div>

            <div class="acoes">
              <button
                v-if="etapa.chave === 'LINK_PUBLICO'"
                class="botao principal"
                :disabled="processandoEtapa === etapa.chave"
                @click="copiarLinkPublico"
              >
                {{ processandoEtapa === etapa.chave ? 'Copiando...' : etapa.acao }}
              </button>
              <button v-else class="botao principal" type="button" @click="navegarParaEtapa(etapa)">
                {{ etapa.acao }}
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
.pagina{display:grid;gap:22px;color:#111827}.cabecalho-pagina,.boas-vindas,.topo-etapa,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-size:14px;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px;font-weight:800}.descricao,.boas-vindas p,.topo-etapa p{margin-top:6px;color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.empresa{color:#2563eb;font-weight:800}.progresso-box{min-width:240px;display:grid;gap:8px}.progresso-box strong{font-size:30px}.progresso-box small{color:#64748b;font-weight:700}.barra{height:10px;border-radius:999px;background:#e5e7eb;overflow:hidden}.barra span{display:block;height:100%;border-radius:999px;background:#2563eb}.checklist{display:grid;gap:14px}.etapa-card{display:grid;grid-template-columns:44px minmax(0,1fr);gap:16px}.numero{width:44px;height:44px;display:grid;place-items:center;border-radius:999px;background:#dbeafe;color:#1d4ed8;font-weight:800}.conteudo-etapa{display:grid;gap:14px}.badge{padding:7px 11px;border-radius:999px;font-size:12px;font-weight:800;text-transform:uppercase}.badge.concluido{background:#dcfce7;color:#15803d}.badge.pendente{background:#fef3c7;color:#92400e}.badge.ignorado{background:#e5e7eb;color:#4b5563}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.botao:disabled{cursor:not-allowed;opacity:.55}.principal{background:#2563eb}.secundario{background:#0f172a}.discreto{background:#64748b}.link-botao{display:inline-flex;align-items:center}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}@media(max-width:760px){.cabecalho-pagina,.boas-vindas,.topo-etapa,.acoes{align-items:flex-start;flex-direction:column}.etapa-card{grid-template-columns:1fr}.progresso-box{width:100%;min-width:0}}
</style>
