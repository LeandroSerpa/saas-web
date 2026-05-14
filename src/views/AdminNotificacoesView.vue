<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import {
  arquivarNotificacao,
  atualizarTemplateNotificacao,
  buscarEmpresas,
  buscarLogsNotificacao,
  buscarNotificacoesAdmin,
  buscarTemplatesNotificacao,
  desarquivarNotificacao,
  editarNotificacaoAdmin,
  enviarNotificacaoManual,
  executarLembretesFinanceiros,
  excluirNotificacao,
  listarNotificacoesLixeiraAdmin,
  marcarNotificacaoComoLida,
  restaurarNotificacao,
} from '@/services/api'

const abas = [
  { id: 'notificacoes', rotulo: 'Notificações' },
  { id: 'templates', rotulo: 'Templates' },
  { id: 'manual', rotulo: 'Envio manual' },
  { id: 'logs', rotulo: 'Logs' },
  { id: 'lembretes', rotulo: 'Lembretes financeiros' },
  { id: 'lixeira', rotulo: 'Lixeira' },
]

const router = useRouter()
const prioridades = ['BAIXA', 'NORMAL', 'ALTA', 'CRITICA']
const perfisDestino = ['ADMIN', 'SUPER_ADMIN']
const abaAtiva = ref('notificacoes')
const notificacoes = ref([])
const notificacoesLixeira = ref([])
const templates = ref([])
const logs = ref([])
const empresas = ref([])
const templateEditando = ref(null)
const notificacaoEditando = ref(null)
const whatsappUrl = ref('')
const resultadoLembretes = ref(null)
const filtrosNotificacoes = ref({ empresaId: '', status: '', tipo: '', busca: '', dataInicial: '', dataFinal: '' })
const filtrosLixeira = ref({ empresaId: '', tipo: '', busca: '', dataInicial: '', dataFinal: '' })
const filtrosLogs = ref({ tipo: '', canal: '', destino: '', dataInicial: '', dataFinal: '' })
const manual = ref(criarManualInicial())
const carregando = ref(false)
const processandoId = ref(null)
const erro = ref('')
const sucesso = ref('')

const empresasOptions = computed(() =>
  empresas.value.map((empresa) => ({
    id: obterCampo(empresa, 'id', 'empresaId'),
    nome: obterCampo(empresa, 'nome', 'empresaNome', 'razaoSocial') || `Empresa ${obterCampo(empresa, 'id', 'empresaId')}`,
  })),
)

async function carregarAba() {
  erro.value = ''
  sucesso.value = ''

  if (abaAtiva.value === 'notificacoes') await carregarNotificacoes()
  if (abaAtiva.value === 'templates') await carregarTemplates()
  if (abaAtiva.value === 'logs') await carregarLogs()
  if (abaAtiva.value === 'lixeira') await carregarLixeira()
}

async function carregarNotificacoes() {
  await executarComCarregamento(async () => {
    notificacoes.value = normalizarLista(await buscarNotificacoesAdmin(limparVazios(filtrosNotificacoes.value))).filter(
      (item) => statusValor(item) !== 'EXCLUIDA',
    )
  }, 'Não foi possível carregar as notificações administrativas.')
}

async function carregarLixeira() {
  await executarComCarregamento(async () => {
    notificacoesLixeira.value = normalizarLista(await listarNotificacoesLixeiraAdmin(limparVazios(filtrosLixeira.value))).map(
      (item) => ({ ...item, status: 'EXCLUIDA' }),
    )
  }, 'Não foi possível carregar a lixeira de notificações.')
}

async function carregarTemplates() {
  await executarComCarregamento(async () => {
    templates.value = normalizarLista(await buscarTemplatesNotificacao())
  }, 'Não foi possível carregar os templates.')
}

async function carregarLogs() {
  await executarComCarregamento(async () => {
    logs.value = normalizarLista(await buscarLogsNotificacao(limparVazios(filtrosLogs.value)))
  }, 'Não foi possível carregar os logs.')
}

async function carregarEmpresas() {
  try {
    empresas.value = normalizarLista(await buscarEmpresas())
  } catch (error) {
    empresas.value = []
    console.error(error)
  }
}

async function marcarComoLida(item) {
  await acaoNotificacao(item, () => marcarNotificacaoComoLida(item.id), 'Notificação marcada como lida.')
}

async function arquivar(item) {
  await acaoNotificacao(item, () => arquivarNotificacao(item.id), 'Notificação arquivada.')
}

async function desarquivar(item) {
  await acaoNotificacao(item, () => desarquivarNotificacao(item.id), 'Notificação desarquivada.')
}

async function excluir(item) {
  await acaoNotificacao(item, () => excluirNotificacao(item.id), 'Notificação movida para a lixeira.')
}

async function restaurar(item) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    sucesso.value = ''
    await restaurarNotificacao(item.id)
    sucesso.value = 'Notificação restaurada com sucesso.'
    notificacoesLixeira.value = notificacoesLixeira.value.filter((notificacao) => notificacao.id !== item.id)
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível restaurar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function acaoNotificacao(item, acao, mensagem) {
  if (!item?.id) return

  try {
    processandoId.value = item.id
    erro.value = ''
    sucesso.value = ''
    await acao()
    sucesso.value = mensagem
    await carregarNotificacoes()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível concluir a ação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

function editarTemplate(item) {
  templateEditando.value = {
    id: item.id,
    codigo: obterCampo(item, 'codigo'),
    tituloTemplate: obterCampo(item, 'tituloTemplate', 'titulo') || '',
    mensagemTemplate: obterCampo(item, 'mensagemTemplate', 'mensagem') || '',
    ativo: Boolean(obterCampo(item, 'ativo') !== false),
  }
}

function editarNotificacao(item) {
  notificacaoEditando.value = {
    id: item.id,
    empresaId: obterCampo(item, 'empresaId') || obterCampo(item.empresa, 'id') || '',
    perfilDestino: obterCampo(item, 'perfilDestino', 'perfil', 'destinoPerfil') || 'ADMIN',
    prioridade: normalizar(obterCampo(item, 'prioridade') || 'NORMAL'),
    titulo: obterCampo(item, 'titulo', 'title') || '',
    mensagem: obterCampo(item, 'mensagem', 'mensagemCurta', 'descricao') || '',
    linkAcao: obterCampo(item, 'linkAcao', 'link', 'url') || '',
    telefoneDestino: obterCampo(item, 'telefoneDestino', 'telefone', 'whatsappDestino') || '',
    gerarLinkWhatsapp: Boolean(obterCampo(item, 'gerarLinkWhatsapp', 'whatsappManual')),
  }
  erro.value = ''
  sucesso.value = ''
}

function cancelarEdicaoNotificacao() {
  notificacaoEditando.value = null
}

async function salvarNotificacao() {
  if (!notificacaoEditando.value?.id) return

  if (!notificacaoEditando.value.titulo.trim() || !notificacaoEditando.value.mensagem.trim()) {
    erro.value = 'Informe título e mensagem da notificação.'
    sucesso.value = ''
    return
  }

  const linkAcao = normalizarLinkAcao(notificacaoEditando.value.linkAcao)

  if (linkAcao && !ehLinkExterno(linkAcao) && !rotaInternaExiste(linkAcao)) {
    erro.value = 'Link de ação inválido ou indisponível.'
    sucesso.value = ''
    return
  }

  try {
    processandoId.value = notificacaoEditando.value.id
    erro.value = ''
    sucesso.value = ''
    await editarNotificacaoAdmin(notificacaoEditando.value.id, limparVazios({
      empresaId: notificacaoEditando.value.empresaId,
      perfilDestino: notificacaoEditando.value.perfilDestino,
      prioridade: notificacaoEditando.value.prioridade,
      titulo: notificacaoEditando.value.titulo,
      mensagem: notificacaoEditando.value.mensagem,
      linkAcao,
      telefoneDestino: notificacaoEditando.value.telefoneDestino,
      gerarLinkWhatsapp: notificacaoEditando.value.gerarLinkWhatsapp,
    }))
    notificacaoEditando.value = null
    sucesso.value = 'Notificação atualizada com sucesso.'
    await carregarNotificacoes()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar a notificação.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function salvarTemplate() {
  if (!templateEditando.value?.id) return

  try {
    processandoId.value = templateEditando.value.id
    erro.value = ''
    sucesso.value = ''
    await atualizarTemplateNotificacao(templateEditando.value.id, {
      tituloTemplate: templateEditando.value.tituloTemplate,
      mensagemTemplate: templateEditando.value.mensagemTemplate,
      ativo: templateEditando.value.ativo,
    })
    templateEditando.value = null
    sucesso.value = 'Template atualizado com sucesso.'
    await carregarTemplates()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar o template.')
    console.error(error)
  } finally {
    processandoId.value = null
  }
}

async function enviarManual() {
  if (!manual.value.titulo.trim() || !manual.value.mensagem.trim()) {
    erro.value = 'Informe título e mensagem da notificação.'
    sucesso.value = ''
    return
  }

  try {
    carregando.value = true
    erro.value = ''
    sucesso.value = ''
    whatsappUrl.value = ''
    manual.value.linkAcao = normalizarLinkAcao(manual.value.linkAcao)
    const resposta = normalizarObjeto(await enviarNotificacaoManual(limparVazios(manual.value)))
    whatsappUrl.value = obterCampo(resposta, 'whatsappUrl', 'urlWhatsapp', 'linkWhatsapp')
    sucesso.value = 'Notificação criada com sucesso.'
    manual.value = criarManualInicial()
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível criar a notificação.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function executarLembretes() {
  try {
    carregando.value = true
    erro.value = ''
    sucesso.value = ''
    resultadoLembretes.value = null
    resultadoLembretes.value = normalizarObjeto(await executarLembretesFinanceiros())
    sucesso.value = `${numeroCampo(resultadoLembretes.value, 'notificacoesCriadas', 'criadas', 'totalCriadas')} notificações criadas.`
    window.dispatchEvent(new Event('notificacoes-atualizadas'))
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível executar os lembretes financeiros.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function abrir(item) {
  const link = normalizarLinkAcao(obterCampo(item, 'linkAcao', 'link', 'url'))
  if (!link) return

  if (ehLinkExterno(link)) {
    window.open(link, '_blank', 'noopener,noreferrer')
    return
  }

  if (!rotaInternaExiste(link)) {
    erro.value = 'Link de ação inválido ou indisponível.'
    sucesso.value = ''
    return
  }

  router.push(link)
}

function abrirWhatsapp() {
  if (whatsappUrl.value) {
    window.open(whatsappUrl.value, '_blank', 'noopener,noreferrer')
  }
}

async function executarComCarregamento(acao, fallback) {
  try {
    carregando.value = true
    await acao()
  } catch (error) {
    erro.value = obterMensagemErro(error, fallback)
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function criarManualInicial() {
  return {
    empresaId: '',
    perfilDestino: 'ADMIN',
    titulo: '',
    mensagem: '',
    prioridade: 'NORMAL',
    linkAcao: '',
    telefoneDestino: '',
    gerarLinkWhatsapp: false,
  }
}

function limparFiltrosNotificacoes() {
  filtrosNotificacoes.value = { empresaId: '', status: '', tipo: '', busca: '', dataInicial: '', dataFinal: '' }
  carregarNotificacoes()
}

function limparFiltrosLixeira() {
  filtrosLixeira.value = { empresaId: '', tipo: '', busca: '', dataInicial: '', dataFinal: '' }
  carregarLixeira()
}

function limparFiltrosLogs() {
  filtrosLogs.value = { tipo: '', canal: '', destino: '', dataInicial: '', dataFinal: '' }
  carregarLogs()
}

function prioridadeClasse(valor) {
  return normalizar(valor || 'NORMAL').toLowerCase()
}

function statusTexto(item) {
  const status = normalizar(obterCampo(item, 'status', 'situacao') || (item.lida ? 'LIDA' : 'CRIADA'))
  return { CRIADA: 'Não lida', LIDA: 'Lida', ARQUIVADA: 'Arquivada' }[status] || status || '-'
}

function formatarData(valor) {
  if (!valor) return '-'
  const data = new Date(valor)
  return Number.isNaN(data.getTime()) ? '-' : data.toLocaleString('pt-BR')
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  return dados.content || dados.data?.content || dados.data || dados.items || dados.itens || dados.resultado || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && !Array.isArray(dados.data) ? dados.data : dados
}

function limparVazios(objeto) {
  return Object.fromEntries(
    Object.entries(objeto).filter(([, valor]) => valor !== '' && valor !== null && valor !== undefined),
  )
}

function obterCampo(objeto, ...campos) {
  if (!objeto || typeof objeto !== 'object') return ''
  for (const campo of campos) {
    if (objeto[campo] !== null && objeto[campo] !== undefined && objeto[campo] !== '') return objeto[campo]
  }
  return ''
}

function numeroCampo(objeto, ...campos) {
  return Number(obterCampo(objeto, ...campos) || 0)
}

function normalizar(valor) {
  return String(valor || '')
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toUpperCase()
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

function statusValor(item) {
  const status = normalizar(obterCampo(item, 'status', 'situacao') || (item.lida ? 'LIDA' : 'CRIADA'))
  if (status === 'NOVA' || status === 'NOVO' || status === 'NAO_LIDA') return 'CRIADA'
  return status || 'CRIADA'
}

function statusTextoFormatado(item) {
  return {
    CRIADA: 'NOVA',
    LIDA: 'LIDA',
    ARQUIVADA: 'ARQUIVADA',
    EXCLUIDA: 'LIXEIRA',
    ENVIADA: 'ENVIADA',
    FALHA: 'FALHA',
    CANCELADA: 'CANCELADA',
  }[statusValor(item)] || statusValor(item)
}

function statusClasse(item) {
  return statusValor(item).toLowerCase()
}

function podeMarcarComoLida(item) {
  return statusValor(item) === 'CRIADA'
}

function podeArquivar(item) {
  return !['ARQUIVADA', 'EXCLUIDA'].includes(statusValor(item))
}

function podeDesarquivar(item) {
  return statusValor(item) === 'ARQUIVADA'
}

function podeExcluir(item) {
  return statusValor(item) !== 'EXCLUIDA'
}

function normalizarLinkAcao(valor) {
  const link = String(valor || '').trim()
  if (!link) return ''
  if (/^https?:\/\//i.test(link)) return link
  if (/^wa\.me\//i.test(link)) return `https://${link}`

  const interno = link.startsWith('/') ? link : `/${link}`

  if (['/admin/fatura', '/admin/faturas'].includes(interno)) {
    return '/faturas'
  }

  return interno
}

function ehLinkExterno(link) {
  return /^https?:\/\//i.test(link)
}

function rotaInternaExiste(link) {
  return router.resolve(link).matched.length > 0
}

watch(abaAtiva, carregarAba)

onMounted(() => {
  carregarEmpresas()
  carregarAba()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Notificações SaaS</h1>
        <p class="descricao">Gerencie notificações, templates e lembretes financeiros.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarAba">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <nav class="abas">
      <button
        v-for="aba in abas"
        :key="aba.id"
        type="button"
        :class="{ ativa: abaAtiva === aba.id }"
        @click="abaAtiva = aba.id"
      >
        {{ aba.rotulo }}
      </button>
    </nav>

    <section v-if="abaAtiva === 'notificacoes'" class="secao">
      <section v-if="notificacaoEditando" class="card formulario">
        <div class="cabecalho-card">
          <div>
            <h2>Editar notificação</h2>
            <p>{{ notificacaoEditando.titulo || 'Notificação' }}</p>
          </div>
          <button class="botao secundario" @click="cancelarEdicaoNotificacao">Cancelar</button>
        </div>

        <div class="campos">
          <label>Empresa
            <select v-model="notificacaoEditando.empresaId">
              <option value="">Sem empresa específica</option>
              <option v-for="empresa in empresasOptions" :key="empresa.id" :value="empresa.id">{{ empresa.nome }}</option>
            </select>
          </label>
          <label>Perfil destino
            <select v-model="notificacaoEditando.perfilDestino">
              <option v-for="perfil in perfisDestino" :key="perfil" :value="perfil">{{ perfil }}</option>
            </select>
          </label>
          <label>Prioridade
            <select v-model="notificacaoEditando.prioridade">
              <option v-for="prioridade in prioridades" :key="prioridade" :value="prioridade">{{ prioridade }}</option>
            </select>
          </label>
          <label class="campo-grande">Título <input v-model="notificacaoEditando.titulo" type="text" /></label>
          <label class="campo-grande">Mensagem <textarea v-model="notificacaoEditando.mensagem" rows="4"></textarea></label>
          <label>Telefone destino <input v-model="notificacaoEditando.telefoneDestino" type="text" /></label>
          <label class="checkbox"><input v-model="notificacaoEditando.gerarLinkWhatsapp" type="checkbox" /> Gerar WhatsApp</label>
          <label class="campo-grande">Link de ação
            <input
              v-model="notificacaoEditando.linkAcao"
              type="text"
              placeholder="/faturas ou https://..."
              @blur="notificacaoEditando.linkAcao = normalizarLinkAcao(notificacaoEditando.linkAcao)"
            />
          </label>
        </div>

        <button class="botao principal" :disabled="processandoId === notificacaoEditando.id" @click="salvarNotificacao">
          Salvar notificação
        </button>
      </section>

      <section class="card filtros">
        <div class="campos">
          <label>Empresa
            <select v-model="filtrosNotificacoes.empresaId">
              <option value="">Todas</option>
              <option v-for="empresa in empresasOptions" :key="empresa.id" :value="empresa.id">{{ empresa.nome }}</option>
            </select>
          </label>
          <label>Status
            <select v-model="filtrosNotificacoes.status">
              <option value="">Todos</option>
              <option value="CRIADA">Novas</option>
              <option value="LIDA">Lidas</option>
              <option value="ARQUIVADA">Arquivadas</option>
            </select>
          </label>
          <label>Tipo <input v-model="filtrosNotificacoes.tipo" type="text" /></label>
          <label>Busca <input v-model="filtrosNotificacoes.busca" type="text" /></label>
          <label>Data inicial <input v-model="filtrosNotificacoes.dataInicial" type="date" /></label>
          <label>Data final <input v-model="filtrosNotificacoes.dataFinal" type="date" /></label>
        </div>
        <div class="acoes">
          <button class="botao principal" @click="carregarNotificacoes">Aplicar filtros</button>
          <button class="botao secundario" @click="limparFiltrosNotificacoes">Limpar</button>
        </div>
      </section>

      <section v-if="carregando" class="card">Carregando notificações...</section>
      <section v-else-if="!notificacoes.length" class="card">Nenhuma notificação encontrada.</section>
      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Data</th>
                <th>Empresa</th>
                <th>Destino</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Título</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in notificacoes" :key="item.id">
                <td>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</td>
                <td>{{ obterCampo(item, 'empresaNome', 'empresa', 'nomeEmpresa') || '-' }}</td>
                <td>{{ obterCampo(item, 'destino', 'usuarioDestino', 'perfilDestino', 'emailDestino') || '-' }}</td>
                <td>{{ obterCampo(item, 'tipo') || '-' }}</td>
                <td><span :class="['prioridade', prioridadeClasse(obterCampo(item, 'prioridade'))]">{{ obterCampo(item, 'prioridade') || 'NORMAL' }}</span></td>
                <td>{{ obterCampo(item, 'titulo', 'title') || '-' }}</td>
                <td><span :class="['status', statusClasse(item)]">{{ statusTextoFormatado(item) }}</span></td>
                <td>
                  <div class="acoes-tabela">
                    <button v-if="obterCampo(item, 'linkAcao', 'link', 'url')" class="botao compacto secundario" @click="abrir(item)">Abrir</button>
                    <button class="botao compacto principal" @click="editarNotificacao(item)">Editar</button>
                    <button v-if="podeMarcarComoLida(item)" class="botao compacto principal" :disabled="processandoId === item.id" @click="marcarComoLida(item)">Marcar como lida</button>
                    <button v-if="podeArquivar(item)" class="botao compacto perigo" :disabled="processandoId === item.id" @click="arquivar(item)">Arquivar</button>
                    <button v-if="podeDesarquivar(item)" class="botao compacto sucesso-botao" :disabled="processandoId === item.id" @click="desarquivar(item)">Desarquivar</button>
                    <button v-if="podeExcluir(item)" class="botao compacto perigo" :disabled="processandoId === item.id" @click="excluir(item)">Lixeira</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="abaAtiva === 'lixeira'" class="secao">
      <section class="card filtros">
        <div class="campos">
          <label>Empresa
            <select v-model="filtrosLixeira.empresaId">
              <option value="">Todas</option>
              <option v-for="empresa in empresasOptions" :key="empresa.id" :value="empresa.id">{{ empresa.nome }}</option>
            </select>
          </label>
          <label>Tipo <input v-model="filtrosLixeira.tipo" type="text" /></label>
          <label>Busca <input v-model="filtrosLixeira.busca" type="text" /></label>
          <label>Data inicial <input v-model="filtrosLixeira.dataInicial" type="date" /></label>
          <label>Data final <input v-model="filtrosLixeira.dataFinal" type="date" /></label>
        </div>
        <div class="acoes">
          <button class="botao principal" @click="carregarLixeira">Aplicar filtros</button>
          <button class="botao secundario" @click="limparFiltrosLixeira">Limpar</button>
        </div>
      </section>

      <section v-if="carregando" class="card">Carregando lixeira...</section>
      <section v-else-if="!notificacoesLixeira.length" class="card">Nenhuma notificação na lixeira.</section>
      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead>
              <tr>
                <th>Empresa</th>
                <th>Destino</th>
                <th>Tipo</th>
                <th>Prioridade</th>
                <th>Título</th>
                <th>Data</th>
                <th>Status</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="item in notificacoesLixeira" :key="item.id">
                <td>{{ obterCampo(item, 'empresaNome', 'empresa', 'nomeEmpresa') || '-' }}</td>
                <td>{{ obterCampo(item, 'destino', 'usuarioDestino', 'perfilDestino', 'emailDestino') || '-' }}</td>
                <td>{{ obterCampo(item, 'tipo') || '-' }}</td>
                <td><span :class="['prioridade', prioridadeClasse(obterCampo(item, 'prioridade'))]">{{ obterCampo(item, 'prioridade') || 'NORMAL' }}</span></td>
                <td>{{ obterCampo(item, 'titulo', 'title') || '-' }}</td>
                <td>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</td>
                <td><span :class="['status', statusClasse(item)]">{{ statusTextoFormatado(item) }}</span></td>
                <td>
                  <div class="acoes-tabela">
                    <button v-if="obterCampo(item, 'linkAcao', 'link', 'url')" class="botao compacto secundario" @click="abrir(item)">Abrir</button>
                    <button class="botao compacto sucesso-botao" :disabled="processandoId === item.id" @click="restaurar(item)">Restaurar</button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="abaAtiva === 'templates'" class="secao">
      <section v-if="templateEditando" class="card formulario">
        <div class="cabecalho-card">
          <div>
            <h2>Editar template</h2>
            <p>{{ templateEditando.codigo }}</p>
          </div>
          <button class="botao secundario" @click="templateEditando = null">Cancelar</button>
        </div>
        <div class="campos dois">
          <label>Título do template <input v-model="templateEditando.tituloTemplate" type="text" /></label>
          <label class="checkbox"><input v-model="templateEditando.ativo" type="checkbox" /> Ativo</label>
          <label class="campo-grande">Mensagem do template
            <textarea v-model="templateEditando.mensagemTemplate" rows="5"></textarea>
          </label>
        </div>
        <p class="ajuda" v-pre>Variáveis: {{empresaNome}}, {{faturaId}}, {{valor}}, {{vencimento}}, {{status}}, {{clienteNome}}, {{servicoNome}}, {{data}}, {{hora}}, {{link}}</p>
        <button class="botao principal" :disabled="processandoId === templateEditando.id" @click="salvarTemplate">Salvar template</button>
      </section>

      <section v-if="carregando" class="card">Carregando templates...</section>
      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead><tr><th>Código</th><th>Tipo</th><th>Canal</th><th>Nome</th><th>Ativo</th><th>Ações</th></tr></thead>
            <tbody>
              <tr v-for="item in templates" :key="item.id || item.codigo">
                <td>{{ obterCampo(item, 'codigo') || '-' }}</td>
                <td>{{ obterCampo(item, 'tipo') || '-' }}</td>
                <td>{{ obterCampo(item, 'canal') || '-' }}</td>
                <td>{{ obterCampo(item, 'nome', 'tituloTemplate') || '-' }}</td>
                <td>{{ obterCampo(item, 'ativo') === false ? 'Não' : 'Sim' }}</td>
                <td><button class="botao compacto principal" @click="editarTemplate(item)">Editar</button></td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="abaAtiva === 'manual'" class="card formulario">
      <div class="campos">
        <label>Empresa opcional
          <select v-model="manual.empresaId">
            <option value="">Todas/sem empresa específica</option>
            <option v-for="empresa in empresasOptions" :key="empresa.id" :value="empresa.id">{{ empresa.nome }}</option>
          </select>
        </label>
        <label>Perfil destino
          <select v-model="manual.perfilDestino">
            <option v-for="perfil in perfisDestino" :key="perfil" :value="perfil">{{ perfil }}</option>
          </select>
        </label>
        <label>Prioridade
          <select v-model="manual.prioridade">
            <option v-for="prioridade in prioridades" :key="prioridade" :value="prioridade">{{ prioridade }}</option>
          </select>
        </label>
        <label>Telefone destino opcional <input v-model="manual.telefoneDestino" type="text" /></label>
        <label class="campo-grande">Título <input v-model="manual.titulo" type="text" /></label>
        <label class="campo-grande">Mensagem <textarea v-model="manual.mensagem" rows="4"></textarea></label>
        <label class="campo-grande">Link de ação
          <input
            v-model="manual.linkAcao"
            type="text"
            placeholder="/faturas ou https://..."
            @blur="manual.linkAcao = normalizarLinkAcao(manual.linkAcao)"
          />
          <small class="ajuda">Exemplos: /faturas, /notificacoes, /dashboard, https://site.com. Se usar /admin/fatura, o sistema ajusta para /faturas.</small>
        </label>
        <label class="checkbox campo-grande"><input v-model="manual.gerarLinkWhatsapp" type="checkbox" /> Gerar link WhatsApp manual?</label>
      </div>
      <div class="acoes">
        <button class="botao principal" :disabled="carregando" @click="enviarManual">Enviar notificação</button>
        <button v-if="whatsappUrl" class="botao sucesso-botao" @click="abrirWhatsapp">Abrir WhatsApp</button>
      </div>
      <p v-if="whatsappUrl" class="ajuda">O envio pelo WhatsApp é manual nesta fase.</p>
    </section>

    <section v-if="abaAtiva === 'logs'" class="secao">
      <section class="card filtros">
        <div class="campos">
          <label>Tipo <input v-model="filtrosLogs.tipo" type="text" /></label>
          <label>Canal <input v-model="filtrosLogs.canal" type="text" /></label>
          <label>Destino <input v-model="filtrosLogs.destino" type="text" /></label>
          <label>Data inicial <input v-model="filtrosLogs.dataInicial" type="date" /></label>
          <label>Data final <input v-model="filtrosLogs.dataFinal" type="date" /></label>
        </div>
        <div class="acoes">
          <button class="botao principal" @click="carregarLogs">Aplicar filtros</button>
          <button class="botao secundario" @click="limparFiltrosLogs">Limpar</button>
        </div>
      </section>

      <section v-if="carregando" class="card">Carregando logs...</section>
      <section v-else class="card tabela-card">
        <div class="tabela-container">
          <table>
            <thead><tr><th>Data</th><th>Tipo</th><th>Canal</th><th>Destino</th><th>Sucesso</th><th>Erro</th></tr></thead>
            <tbody>
              <tr v-for="item in logs" :key="item.id || `${obterCampo(item, 'data', 'createdAt')}-${obterCampo(item, 'destino')}`">
                <td>{{ formatarData(obterCampo(item, 'criadoEm', 'dataCriacao', 'data', 'createdAt')) }}</td>
                <td>{{ obterCampo(item, 'tipo') || '-' }}</td>
                <td>{{ obterCampo(item, 'canal') || '-' }}</td>
                <td>{{ obterCampo(item, 'destino') || '-' }}</td>
                <td>{{ obterCampo(item, 'sucesso') === false ? 'Não' : 'Sim' }}</td>
                <td>{{ obterCampo(item, 'erro', 'mensagemErro') || '-' }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </section>

    <section v-if="abaAtiva === 'lembretes'" class="card lembretes">
      <div>
        <h2>Lembretes financeiros</h2>
        <p>Este processo gera notificações internas para faturas próximas do vencimento e faturas vencidas.</p>
      </div>
      <button class="botao principal" :disabled="carregando" @click="executarLembretes">
        Executar lembretes financeiros agora
      </button>
      <p v-if="resultadoLembretes" class="resultado">
        {{ numeroCampo(resultadoLembretes, 'notificacoesCriadas', 'criadas', 'totalCriadas') }} notificações criadas.
      </p>
    </section>
  </main>
</template>

<style scoped>
.pagina,.secao,.filtros,.formulario,.lembretes{display:grid;gap:18px;color:#111827}.cabecalho-pagina,.cabecalho-card,.acoes{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px;font-weight:800}h2{font-size:22px}.descricao,.cabecalho-card p,.ajuda{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}.abas{display:flex;gap:8px;flex-wrap:wrap}.abas button{border:1px solid #cbd5e1;border-radius:8px;background:white;color:#334155;padding:10px 14px;cursor:pointer;font-weight:800}.abas button.ativa{background:#0f172a;color:white;border-color:#0f172a}.campos{display:grid;grid-template-columns:repeat(3,minmax(180px,1fr));gap:14px}.campos.dois{grid-template-columns:1fr 180px}.campo-grande{grid-column:1/-1}label{display:grid;gap:7px;color:#334155;font-weight:800}.checkbox{display:flex;align-items:center;gap:8px}input,select,textarea{width:100%;min-width:0;box-sizing:border-box;border:1px solid #cbd5e1;border-radius:8px;padding:10px 12px;font:inherit}.botao{border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800;text-decoration:none}.botao:disabled{opacity:.55;cursor:not-allowed}.principal{background:#2563eb}.secundario{background:#0f172a}.perigo{background:#dc2626}.sucesso-botao{background:#15803d}.compacto{width:100%;padding:7px 8px;font-size:11px;line-height:1.2}.tabela-card{padding:0;overflow:hidden}.tabela-container{overflow-x:auto}table{width:100%;min-width:900px;border-collapse:collapse}th,td{padding:12px 10px;border-bottom:1px solid #e5e7eb;color:#374151;text-align:left;vertical-align:top;font-size:13px;word-break:break-word}th{background:#f8fafc;color:#111827;font-size:11px;font-weight:800;text-transform:uppercase}.acoes-tabela{display:flex;flex-direction:column;gap:6px;min-width:130px}.prioridade,.status{display:inline-flex;width:fit-content;border-radius:999px;padding:7px 11px;font-size:12px;font-weight:800;text-transform:uppercase;white-space:nowrap}.prioridade.critica{background:#fee2e2;color:#b91c1c}.prioridade.alta{background:#ffedd5;color:#c2410c}.prioridade.normal{background:#dbeafe;color:#1d4ed8}.prioridade.baixa{background:#e5e7eb;color:#4b5563}.status.criada{background:#fef3c7;color:#92400e}.status.lida,.status.enviada{background:#dbeafe;color:#1d4ed8}.status.arquivada{background:#e5e7eb;color:#374151}.status.falha,.status.cancelada,.status.excluida{background:#fee2e2;color:#b91c1c}.texto-acao{color:#64748b;font-weight:800}.resultado{color:#166534;font-weight:800}@media(max-width:900px){.cabecalho-pagina,.cabecalho-card,.acoes{align-items:flex-start;flex-direction:column}.campos,.campos.dois{grid-template-columns:1fr}}
</style>
