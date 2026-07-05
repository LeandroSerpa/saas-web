<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  APP_NAME,
  ambienteExibeSelo,
  buscarVersaoSistema,
  formatarRotuloAmbiente,
  obterInfoVersaoSistemaPadrao,
} from '@/services/api'
import { formatarDataPtBrSemFuso } from '@/utils/datas'
import { obterVersaoFrontendComPrefixo } from '@/utils/versaoAplicacao'

const props = defineProps({
  titulo: {
    type: String,
    default: 'Versão do sistema',
  },
  discreto: {
    type: Boolean,
    default: false,
  },
  novidadesPadrao: {
    type: Array,
    default: () => [],
  },
  mostrarNovidades: {
    type: Boolean,
    default: true,
  },
  usarInformacoesExternas: {
    type: Boolean,
    default: false,
  },
  informacoesBackend: {
    type: Object,
    default: null,
  },
  carregandoBackend: {
    type: Boolean,
    default: false,
  },
  erroBackend: {
    type: Boolean,
    default: false,
  },
})

const carregandoLocal = ref(true)
const erroLocal = ref(false)
const versaoBackendLocal = ref(null)

const usaInformacoesExternas = computed(() => props.usarInformacoesExternas === true)
const carregandoConsulta = computed(() => (usaInformacoesExternas.value ? props.carregandoBackend : carregandoLocal.value))
const erroConsulta = computed(() => (usaInformacoesExternas.value ? props.erroBackend : erroLocal.value))
const origemBackend = computed(() => normalizarObjeto(usaInformacoesExternas.value ? props.informacoesBackend : versaoBackendLocal.value))

const dadosVersao = computed(() => {
  const fallback = obterInfoVersaoSistemaPadrao()
  const origem = origemBackend.value
  const ambienteResposta = obterCampo(origem, 'ambiente', 'environment', 'perfil', 'stage')
  const versaoBackend = obterCampo(origem, 'versao', 'version', 'appVersion')
  const dataPublicacaoBackend = obterCampo(origem, 'dataPublicacao', 'publicadoEm', 'releaseDate', 'publishedAt')
  const novidadesApi = normalizarNovidades(
    origem.novidades ??
      origem.changelog ??
      origem.itens ??
      origem.items ??
      origem.alteracoes ??
      origem.changes,
  )
  const novidades = novidadesApi.length
    ? novidadesApi
    : props.novidadesPadrao.length
      ? props.novidadesPadrao
      : fallback.novidades
  const frontendVersao = obterVersaoFrontendComPrefixo()
  const backendVersao = erroConsulta.value
    ? 'Não foi possível consultar'
    : carregandoConsulta.value
      ? 'Consultando informações da API...'
      : String(versaoBackend || '').trim() || 'Não foi possível consultar'
  const ambiente = erroConsulta.value
    ? 'Não foi possível consultar'
    : carregandoConsulta.value
      ? 'Consultando informações da API...'
      : formatarRotuloAmbiente(ambienteResposta) || 'Não foi possível consultar'
  const dataPublicacao = erroConsulta.value
    ? 'Não foi possível consultar'
    : carregandoConsulta.value
      ? 'Consultando informações da API...'
      : formatarData(dataPublicacaoBackend) || 'Não foi possível consultar'
  const api = erroConsulta.value
    ? 'Não foi possível consultar'
    : carregandoConsulta.value
      ? 'Consultando informações da API...'
      : 'Online'

  return {
    nome: APP_NAME,
    frontend: frontendVersao,
    backend: backendVersao,
    ambiente,
    exibirAmbiente: !erroConsulta.value && !carregandoConsulta.value && ambienteExibeSelo(ambienteResposta),
    dataPublicacao,
    api,
    novidades,
  }
})

async function carregarVersao() {
  if (usaInformacoesExternas.value) {
    carregandoLocal.value = false
    return
  }

  try {
    versaoBackendLocal.value = await buscarVersaoSistema()
    erroLocal.value = false
  } catch (error) {
    versaoBackendLocal.value = null
    erroLocal.value = true
    console.error(error)
  } finally {
    carregandoLocal.value = false
  }
}

function normalizarObjeto(valor) {
  if (!valor || typeof valor !== 'object') {
    return {}
  }

  if (valor.data && typeof valor.data === 'object' && !Array.isArray(valor.data)) {
    return valor.data
  }

  return valor
}

function obterCampo(origem, ...campos) {
  for (const campo of campos) {
    const valor = origem?.[campo]

    if (valor !== null && valor !== undefined && String(valor).trim()) {
      return valor
    }
  }

  return ''
}

function normalizarNovidades(valor) {
  if (Array.isArray(valor)) {
    return valor
      .map((item) => {
        if (typeof item === 'string') {
          return item.trim()
        }

        if (item && typeof item === 'object') {
          return (
            item.titulo ||
            item.descricao ||
            item.texto ||
            item.label ||
            item.nome ||
            ''
          ).trim()
        }

        return ''
      })
      .filter(Boolean)
  }

  if (typeof valor === 'string' && valor.trim()) {
    return valor
      .split(/\r?\n|;/)
      .map((item) => item.replace(/^[-*]\s*/, '').trim())
      .filter(Boolean)
  }

  return []
}

function formatarData(valor) {
  return formatarDataPtBrSemFuso(valor)
}

onMounted(carregarVersao)
</script>

<template>
  <section class="version-panel" :class="{ discreto }" aria-label="Informações da versão do sistema">
    <div class="topo">
      <div>
        <p class="kicker">{{ titulo }}</p>
        <h2>{{ dadosVersao.nome }}</h2>
      </div>
      <span v-if="dadosVersao.exibirAmbiente" class="ambiente">
        {{ formatarRotuloAmbiente(dadosVersao.ambiente) }}
      </span>
    </div>

    <dl class="metadados">
      <div>
        <dt>Frontend</dt>
        <dd>{{ dadosVersao.frontend }}</dd>
      </div>
      <div>
        <dt>Backend</dt>
        <dd>{{ dadosVersao.backend }}</dd>
      </div>
      <div>
        <dt>Ambiente</dt>
        <dd>{{ dadosVersao.ambiente }}</dd>
      </div>
      <div>
        <dt>Publicação</dt>
        <dd>{{ dadosVersao.dataPublicacao }}</dd>
      </div>
      <div>
        <dt>API</dt>
        <dd>{{ dadosVersao.api }}</dd>
      </div>
    </dl>

    <p v-if="carregandoConsulta" class="estado estado-consulta">Consultando informações da API...</p>
    <p v-else-if="erroConsulta" class="estado estado-consulta erro">Não foi possível consultar a versão do backend.</p>

    <div v-if="mostrarNovidades" class="novidades">
      <strong>Novidades</strong>
      <p v-if="carregandoConsulta && !erroConsulta" class="estado">Carregando informações da versão...</p>
      <ul v-else-if="dadosVersao.novidades.length">
        <li v-for="item in dadosVersao.novidades" :key="item">{{ item }}</li>
      </ul>
      <p v-else class="estado">Novidades serão exibidas aqui nas próximas publicações.</p>
    </div>
  </section>
</template>

<style scoped>
.version-panel {
  display: grid;
  gap: 14px;
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  padding: 18px;
  box-shadow: var(--app-shadow);
  color: var(--app-text);
}

.version-panel.discreto {
  gap: 12px;
  padding: 16px;
}

.topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.kicker,
.metadados dt,
.ambiente {
  margin: 0;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.kicker,
.metadados dt {
  color: var(--app-text-muted);
}

.topo h2,
.novidades p,
.novidades strong,
.metadados dd {
  margin: 0;
}

.topo h2 {
  font-size: 20px;
  font-weight: 800;
}

.ambiente {
  border-radius: 999px;
  padding: 7px 10px;
  background: color-mix(in srgb, var(--app-warning) 18%, var(--app-surface));
  color: color-mix(in srgb, var(--app-warning) 74%, black);
}

.metadados {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
  gap: 12px;
  margin: 0;
}

.metadados div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 14px;
  background: var(--app-surface-soft);
}

.metadados dd {
  color: var(--app-text);
  font-size: 15px;
  font-weight: 800;
  overflow-wrap: anywhere;
}

.novidades {
  display: grid;
  gap: 8px;
}

.novidades strong {
  font-size: 14px;
}

.novidades ul {
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
  display: grid;
  gap: 8px;
}

.estado {
  color: var(--app-text-muted);
  line-height: 1.5;
}

.estado-consulta {
  margin: 0;
}

.estado-consulta.erro {
  color: var(--app-danger);
}

@media (max-width: 640px) {
  .version-panel {
    padding: 14px;
    gap: 12px;
  }

  .version-panel.discreto {
    padding: 12px;
  }

  .topo {
    flex-direction: column;
    gap: 8px;
  }

  .topo h2 {
    font-size: 18px;
  }

  .metadados {
    grid-template-columns: 1fr;
  }

  .metadados div {
    padding: 10px 12px;
  }

  .novidades strong {
    font-size: 13px;
  }

  .novidades ul {
    padding-left: 16px;
  }
}
</style>
