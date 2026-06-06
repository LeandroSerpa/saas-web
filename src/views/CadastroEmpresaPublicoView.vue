<script setup>
import { computed, nextTick, onMounted, ref, watch } from 'vue'
import { RouterLink, useRoute } from 'vue-router'
import {
  buscarPlanosCadastroPublico,
  buscarSegmentosCadastroPublico,
  cadastrarEmpresaInteressadaPublico,
} from '@/services/api'
import PublicidadeNuvemMais from '@/components/PublicidadeNuvemMais.vue'
import { debugLog } from '@/utils/devDebug'
import {
  criarManipuladorPasteNumerico,
  documentoBasicoValido,
  emailBasicoValido,
  limparEspacos,
  sanitizarDocumento,
  sanitizarTelefoneDoEvento,
  telefoneBasicoValido,
  validarLoginCurto,
} from '@/utils/validacoes'

const etapas = [{ titulo: 'Empresa' }, { titulo: 'Responsável' }, { titulo: 'Interesse' }, { titulo: 'Plano' }, { titulo: 'Revisão' }]
const ufs = ['AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA', 'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN', 'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO']
const aoColarDocumento = criarManipuladorPasteNumerico(sanitizarDocumento)
const route = useRoute()

const etapaAtual = ref(0)
const segmentos = ref([])
const planos = ref([])
const secaoPlanosRef = ref(null)
const carregando = ref(true)
const enviando = ref(false)
const erro = ref('')
const sucesso = ref('')
const protocolo = ref('')
const formulario = ref(criarFormularioInicial())
const errosCampos = ref(criarErrosCamposIniciais())

const segmentoSelecionado = computed(() => segmentos.value.find((segmento) => String(segmento.id) === String(formulario.value.segmentoNegocioId)) || null)
const planoSelecionado = computed(() => planos.value.find((plano) => String(plano.id) === String(formulario.value.planoId)) || null)
const planosVisiveis = computed(() => planos.value.slice(0, 4))
const possuiPlanosOcultos = computed(() => planos.value.length > planosVisiveis.value.length)
const destacarPlanos = computed(() => route.hash === '#planos')

const planosComerciais = [
  {
    nome: 'NuvemMais Vitrine',
    chamada: 'Para quem quer vender ou divulgar produtos pelo WhatsApp.',
    recursos: [
      'Catálogo/cardápio público',
      'Fotos, preços e disponibilidade',
      'Botão de pedido pelo WhatsApp',
      'Link público para divulgar',
      'Ideal para doces, artesanatos, comidas, produtos e pequenos negócios',
    ],
  },
  {
    nome: 'NuvemMais Agenda',
    chamada: 'Para quem trabalha com horários, serviços e atendimento.',
    recursos: [
      'Página pública de agendamento',
      'Cadastro de clientes, serviços e funcionários',
      'Agenda interna',
      'Organização de horários',
      'Ideal para barbearias, salões, estética, consultórios e atendimentos',
    ],
  },
  {
    nome: 'NuvemMais Completo',
    chamada: 'Para quem precisa de catálogo e agenda no mesmo sistema.',
    recursos: [
      'Tudo do NuvemMais Vitrine',
      'Tudo do NuvemMais Agenda',
      'Estoque do dia',
      'Catálogo/cardápio + agendamento',
      'Ideal para negócios que vendem produtos e também prestam serviços',
    ],
  },
]

watch(() => formulario.value.nomeEmpresa, (nome) => {
  formulario.value.slugDesejado = gerarSlug(nome)
})

watch(
  () => [route.hash, carregando.value],
  async () => {
    if (typeof window === 'undefined' || route.hash !== '#planos' || carregando.value) {
      return
    }

    await nextTick()
    secaoPlanosRef.value?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  },
  { immediate: true },
)

function criarFormularioInicial() {
  return {
    nomeEmpresa: '',
    slugDesejado: '',
    documento: '',
    telefoneEmpresa: '',
    emailEmpresa: '',
    endereco: '',
    cidade: '',
    estado: '',
    nomeResponsavel: '',
    emailResponsavel: '',
    loginResponsavel: '',
    telefoneResponsavel: '',
    cargoResponsavel: '',
    senhaResponsavel: '',
    confirmarSenhaResponsavel: '',
    segmentoNegocioId: '',
    interesse: '',
    planoId: '',
    aceiteTermos: false,
  }
}

function criarErrosCamposIniciais() {
  return {
    documento: '',
    telefoneEmpresa: '',
    emailEmpresa: '',
    estado: '',
    emailResponsavel: '',
    loginResponsavel: '',
    telefoneResponsavel: '',
    interesse: '',
  }
}

function limparErroCampo(campo) {
  if (campo in errosCampos.value) errosCampos.value[campo] = ''
  erro.value = ''
}

async function carregarOpcoes() {
  try {
    carregando.value = true
    erro.value = ''
    const [segmentosApi, planosApi] = await Promise.all([buscarSegmentosCadastroPublico(), buscarPlanosCadastroPublico()])

    segmentos.value = extrairLista(segmentosApi).filter((segmento) => segmento.ativo !== false)
    planos.value = extrairLista(planosApi).filter((plano) => plano?.ativo !== false)
    debugLog('cadastro-publico-planos', 'Planos recebidos para etapa Plano', {
      quantidade: planos.value.length,
    })
  } catch (errorAtual) {
    erro.value = obterMensagemErro(
      errorAtual,
      'Não foi possível carregar os planos agora. Verifique sua conexão e tente novamente em instantes.',
    )
    console.error(errorAtual)
  } finally {
    carregando.value = false
  }
}

function proximaEtapa() {
  if (!validarEtapaAtual()) return
  etapaAtual.value = Math.min(etapaAtual.value + 1, etapas.length - 1)
}

function etapaAnterior() {
  erro.value = ''
  errosCampos.value = criarErrosCamposIniciais()
  etapaAtual.value = Math.max(etapaAtual.value - 1, 0)
}

async function enviarCadastro() {
  if (!validarEtapaAtual()) return

  try {
    enviando.value = true
    erro.value = ''
    const resposta = await cadastrarEmpresaInteressadaPublico(montarPayload())
    protocolo.value = obterCampo(resposta, 'protocolo', 'numeroProtocolo', 'id')
    sucesso.value = 'Cadastro enviado com sucesso. Nossa equipe analisará sua solicitação.'
    formulario.value = criarFormularioInicial()
    errosCampos.value = criarErrosCamposIniciais()
    etapaAtual.value = 0
  } catch (errorAtual) {
    erro.value = obterMensagemErro(errorAtual, 'Não foi possível enviar o cadastro.')
    console.error(errorAtual)
  } finally {
    enviando.value = false
  }
}

function validarCampoDocumento() {
  if (!formulario.value.documento.trim()) return falharValidacao('Informe o documento da empresa.', 'documento')
  if (!documentoBasicoValido(formulario.value.documento)) return falharValidacao('Informe um CPF ou CNPJ válido, usando apenas números.', 'documento')
  errosCampos.value.documento = ''
  return true
}

function validarCampoTelefone(campo, obrigatorio = false) {
  const rotulo = campo === 'telefoneResponsavel' ? 'do responsável' : 'da empresa'
  if (obrigatorio && !formulario.value[campo].trim()) return falharValidacao(`Informe o telefone ${rotulo}.`, campo)
  if (formulario.value[campo] && !telefoneBasicoValido(formulario.value[campo])) return falharValidacao('Informe um telefone válido, usando apenas números com DDD.', campo)
  errosCampos.value[campo] = ''
  return true
}

function validarCampoEmail(campo) {
  if (!emailBasicoValido(formulario.value[campo])) return falharValidacao('Informe um e-mail válido.', campo)
  errosCampos.value[campo] = ''
  return true
}

function validarCampoLoginResponsavel() {
  const mensagem = validarLoginCurto(formulario.value.loginResponsavel)
  if (mensagem) return falharValidacao(mensagem, 'loginResponsavel')
  errosCampos.value.loginResponsavel = ''
  return true
}

function validarEtapaAtual() {
  erro.value = ''
  errosCampos.value = criarErrosCamposIniciais()

  if (etapaAtual.value === 0) {
    if (!formulario.value.nomeEmpresa.trim()) return falharValidacao('Informe o nome da empresa.')
    if (!validarCampoDocumento()) return false
    if (!validarCampoTelefone('telefoneEmpresa')) return false
    if (!validarCampoEmail('emailEmpresa')) return false
    if (!formulario.value.cidade.trim()) return falharValidacao('Informe a cidade da empresa.')
    if (!formulario.value.estado.trim()) return falharValidacao('Selecione a UF da empresa.', 'estado')
  }

  if (etapaAtual.value === 1) {
    if (!formulario.value.nomeResponsavel.trim()) return falharValidacao('Informe o nome do responsável.')
    if (!validarCampoEmail('emailResponsavel')) return false
    if (!validarCampoLoginResponsavel()) return false
    if (!validarCampoTelefone('telefoneResponsavel', true)) return false
    if (!formulario.value.senhaResponsavel) return falharValidacao('Informe a senha do responsável.')
    if (formulario.value.senhaResponsavel.length < 6) return falharValidacao('A senha deve ter no mínimo 6 caracteres.')
    if (formulario.value.confirmarSenhaResponsavel !== formulario.value.senhaResponsavel) return falharValidacao('A confirmação de senha deve ser igual à senha informada.')
  }

  if (etapaAtual.value === 2) {
    if (!formulario.value.segmentoNegocioId) return falharValidacao('Selecione o segmento.')
    if (!formulario.value.interesse.trim()) {
      return falharValidacao('Informe o principal objetivo da sua empresa ao usar o NuvemMais Gestão.', 'interesse')
    }
  }

  if (etapaAtual.value === 3 && !planos.value.length) {
    return falharValidacao('No momento não há planos disponíveis para cadastro público. Entre em contato com a equipe NuvemMais para receber orientação.')
  }
  if (etapaAtual.value === 3 && !formulario.value.planoId) return falharValidacao('Selecione o plano desejado.')
  if (etapaAtual.value === 4 && !formulario.value.aceiteTermos) return falharValidacao('Confirme a leitura dos Termos de Uso e da Política de Privacidade.')
  return true
}

function falharValidacao(mensagem, campo = '') {
  erro.value = mensagem
  if (campo) errosCampos.value[campo] = mensagem
  return false
}

function aplicarDocumento(valor) {
  formulario.value.documento = sanitizarDocumento(valor)
  limparErroCampo('documento')
}

function aplicarTelefone(campo, evento) {
  formulario.value[campo] = sanitizarTelefoneDoEvento(evento)
  limparErroCampo(campo)
}

function aplicarEmail(campo, valor) {
  formulario.value[campo] = limparEspacos(valor)
  limparErroCampo(campo)
}

function aplicarEstado(valor) {
  formulario.value.estado = String(valor || '').toUpperCase()
  limparErroCampo('estado')
}

function montarPayload() {
  return {
    empresa: limparVazios({
      nome: formulario.value.nomeEmpresa,
      nomeEmpresa: formulario.value.nomeEmpresa,
      documento: formulario.value.documento,
      telefone: formulario.value.telefoneEmpresa,
      telefoneEmpresa: formulario.value.telefoneEmpresa,
      email: formulario.value.emailEmpresa,
      emailEmpresa: formulario.value.emailEmpresa,
      endereco: formulario.value.endereco,
      cidade: formulario.value.cidade,
      estado: formulario.value.estado.toUpperCase(),
      slugDesejado: formulario.value.slugDesejado || gerarSlug(formulario.value.nomeEmpresa),
    }),
    responsavel: limparVazios({
      nome: formulario.value.nomeResponsavel,
      nomeResponsavel: formulario.value.nomeResponsavel,
      responsavelNome: formulario.value.nomeResponsavel,
      email: formulario.value.emailResponsavel,
      emailResponsavel: formulario.value.emailResponsavel,
      responsavelEmail: formulario.value.emailResponsavel,
      ...(String(formulario.value.loginResponsavel || '').trim()
        ? { login: formulario.value.loginResponsavel.trim() }
        : {}),
      telefone: formulario.value.telefoneResponsavel,
      telefoneResponsavel: formulario.value.telefoneResponsavel,
      responsavelTelefone: formulario.value.telefoneResponsavel,
      cargo: formulario.value.cargoResponsavel,
      cargoResponsavel: formulario.value.cargoResponsavel,
      senha: formulario.value.senhaResponsavel,
    }),
    segmento: limparVazios({
      segmentoId: idOuVazio(formulario.value.segmentoNegocioId),
      segmentoCodigo: segmentoSelecionado.value?.codigo || segmentoSelecionado.value?.sigla || '',
    }),
    plano: limparVazios({
      planoId: idOuVazio(formulario.value.planoId),
      planoDesejado: planoSelecionado.value?.nome || planoSelecionado.value?.titulo || '',
    }),
    observacoes: formulario.value.interesse.trim(),
  }
}

function limparVazios(objeto) {
  return Object.fromEntries(Object.entries(objeto).filter(([, valor]) => valor !== null && valor !== undefined && String(valor).trim()))
}

function idOuVazio(valor) {
  return valor ? Number(valor) : ''
}

function gerarSlug(valor) {
  return String(valor || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  if (Array.isArray(resposta?.content)) return resposta.content
  if (Array.isArray(resposta?.data?.content)) return resposta.data.content
  if (Array.isArray(resposta?.data)) return resposta.data
  if (Array.isArray(resposta?.items)) return resposta.items
  if (Array.isArray(resposta?.itens)) return resposta.itens
  if (Array.isArray(resposta?.resultado)) return resposta.resultado
  if (Array.isArray(resposta?.data?.items)) return resposta.data.items
  if (Array.isArray(resposta?.data?.itens)) return resposta.data.itens
  if (Array.isArray(resposta?.data?.resultado)) return resposta.data.resultado
  return []
}

function obterCampo(item, ...campos) {
  if (!item || typeof item !== 'object') return ''
  for (const campo of campos) {
    if (item[campo] !== null && item[campo] !== undefined && item[campo] !== '') return item[campo]
  }
  return ''
}

function obterMensagemErro(errorAtual, fallback) {
  return String(errorAtual?.message || '').trim() || fallback
}

function selecionarPlano(plano) {
  formulario.value.planoId = plano?.id || ''
  erro.value = ''
}

function formatarMoeda(valor) {
  const numero = Number(valor ?? 0)

  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL',
  }).format(Number.isFinite(numero) ? numero : 0)
}

function precoPlano(plano) {
  return plano?.precoMensal ?? plano?.preco ?? plano?.valor ?? plano?.valorMensal ?? 0
}

function descricaoPlano(plano) {
  return plano?.descricao || plano?.resumo || 'Uma opção para organizar sua operação com mais clareza, controle e previsibilidade.'
}

function exibirLimite(valor) {
  if (valor === null || valor === undefined || valor === '') return 'Ilimitado'
  const numero = Number(valor)
  if (!Number.isFinite(numero) || numero <= 0) return 'Ilimitado'
  return new Intl.NumberFormat('pt-BR').format(numero)
}

function obterLimitePlano(plano, ...campos) {
  for (const campo of campos) {
    if (plano?.[campo] !== null && plano?.[campo] !== undefined && plano?.[campo] !== '') {
      return plano[campo]
    }
  }

  return null
}

function recursoDisponivel(valor) {
  return valor === true ? 'Sim' : 'Não'
}

function estoqueIncluido(plano) {
  return plano?.permiteEstoque === true
}

function limiteProdutosPlano(plano) {
  return exibirLimite(obterLimitePlano(plano, 'limiteProdutos'))
}

function recursosPrincipaisPlano(plano, limite = 4) {
  if (!plano) return []

  return [
    { ativo: plano.permitePersonalizacao, rotulo: 'Personalização' },
    { ativo: plano.permiteRelatorios, rotulo: 'Relatórios' },
    { ativo: plano.permiteAgendamentoPublico, rotulo: 'Agendamento público' },
    { ativo: plano.permiteEstoque, rotulo: `Estoque (${limiteProdutosPlano(plano)} produtos)` },
    { ativo: plano.permiteSuportePrioritario, rotulo: 'Suporte prioritário' },
  ]
    .filter((recurso) => recurso.ativo === true)
    .slice(0, limite)
    .map((recurso) => recurso.rotulo)
}

onMounted(carregarOpcoes)
</script>

<template>
  <main class="pagina-publica">
    <section class="conteudo">
      <header class="cabecalho">
        <RouterLink class="link-login" to="/login">Já tenho acesso</RouterLink>
        <span class="marca">NuvemMais Gestão</span>
        <h1>Cadastre sua empresa</h1>
        <p>Responda algumas perguntas para nossa equipe avaliar sua solicitação de entrada na plataforma.</p>
      </header>

      <section v-if="sucesso" class="card confirmacao">
        <span class="selo">Solicitação pendente</span>
        <h2>{{ sucesso }}</h2>
        <p v-if="protocolo"><strong>Protocolo:</strong> {{ protocolo }}</p>
        <p>O responsável já pode tentar acessar com e-mail/usuário e senha cadastrados, mas a empresa ficará pendente até aprovação.</p>
        <div class="acoes"><RouterLink class="botao principal" to="/login">Voltar para login</RouterLink></div>
      </section>

      <template v-else>
        <section class="etapas">
          <button v-for="(etapa, indice) in etapas" :key="etapa.titulo" :class="['etapa', { ativa: etapaAtual === indice, concluida: etapaAtual > indice }]" type="button" @click="indice < etapaAtual && (etapaAtual = indice)">
            <span>{{ indice + 1 }}</span>{{ etapa.titulo }}
          </button>
        </section>

        <section v-if="erro" class="feedback erro"><p>{{ erro }}</p></section>
        <section v-if="carregando" class="card"><p>Carregando opções do cadastro...</p></section>

        <form v-else class="card formulario" @submit.prevent="etapaAtual === etapas.length - 1 ? enviarCadastro() : proximaEtapa()">
          <div v-if="etapaAtual === 0" class="campos">
            <label>Nome da empresa *<input v-model="formulario.nomeEmpresa" type="text" /></label>
            <label>
              Documento (CPF/CNPJ) *
              <input :value="formulario.documento" type="text" inputmode="numeric" @input="aplicarDocumento($event.target.value)" @blur="validarCampoDocumento" @paste="aoColarDocumento($event, (valor) => aplicarDocumento(valor))" />
              <small v-if="errosCampos.documento" class="erro-campo">{{ errosCampos.documento }}</small>
            </label>
            <label>
              Telefone
              <input :value="formulario.telefoneEmpresa" type="text" inputmode="numeric" @input="aplicarTelefone('telefoneEmpresa', $event)" @blur="validarCampoTelefone('telefoneEmpresa')" @paste.prevent="aplicarTelefone('telefoneEmpresa', $event)" />
              <small v-if="errosCampos.telefoneEmpresa" class="erro-campo">{{ errosCampos.telefoneEmpresa }}</small>
            </label>
            <label>
              E-mail da empresa *
              <input :value="formulario.emailEmpresa" type="text" inputmode="email" @input="aplicarEmail('emailEmpresa', $event.target.value)" @blur="validarCampoEmail('emailEmpresa')" />
              <small v-if="errosCampos.emailEmpresa" class="erro-campo">{{ errosCampos.emailEmpresa }}</small>
            </label>
            <label class="campo-grande">Endereço<input v-model="formulario.endereco" type="text" /></label>
            <label>Cidade *<input v-model="formulario.cidade" type="text" /></label>
            <label>
              UF *
              <select :value="formulario.estado" @change="aplicarEstado($event.target.value)">
                <option value="">Selecione</option>
                <option v-for="uf in ufs" :key="uf" :value="uf">{{ uf }}</option>
              </select>
              <small v-if="errosCampos.estado" class="erro-campo">{{ errosCampos.estado }}</small>
            </label>
          </div>

          <div v-else-if="etapaAtual === 1" class="campos">
            <label>Nome do responsável *<input v-model="formulario.nomeResponsavel" type="text" /></label>
            <label>
              E-mail do responsável *
              <input :value="formulario.emailResponsavel" type="text" inputmode="email" @input="aplicarEmail('emailResponsavel', $event.target.value)" @blur="validarCampoEmail('emailResponsavel')" />
              <small v-if="errosCampos.emailResponsavel" class="erro-campo">{{ errosCampos.emailResponsavel }}</small>
            </label>
            <label>
              Usuário/Login
              <input v-model="formulario.loginResponsavel" type="text" placeholder="Ex: responsavel.empresa" @blur="validarCampoLoginResponsavel" />
              <small>Você poderá usar este usuário para entrar no sistema no lugar do e-mail.</small>
              <small v-if="errosCampos.loginResponsavel" class="erro-campo">{{ errosCampos.loginResponsavel }}</small>
            </label>
            <label>
              Telefone *
              <input :value="formulario.telefoneResponsavel" type="text" inputmode="numeric" @input="aplicarTelefone('telefoneResponsavel', $event)" @blur="validarCampoTelefone('telefoneResponsavel', true)" @paste.prevent="aplicarTelefone('telefoneResponsavel', $event)" />
              <small v-if="errosCampos.telefoneResponsavel" class="erro-campo">{{ errosCampos.telefoneResponsavel }}</small>
            </label>
            <label>Cargo<input v-model="formulario.cargoResponsavel" type="text" /></label>
            <label>Senha *<input v-model="formulario.senhaResponsavel" type="password" autocomplete="new-password" /></label>
            <label>Confirmar senha *<input v-model="formulario.confirmarSenhaResponsavel" type="password" autocomplete="new-password" /></label>
          </div>

          <div v-else-if="etapaAtual === 2" class="campos">
            <label>
              Segmento *
              <select v-model="formulario.segmentoNegocioId">
                <option value="">Selecione</option>
                <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">{{ segmento.nome || segmento.descricao || 'Segmento sem nome' }}</option>
              </select>
              <small v-if="!segmentos.length">Nenhum segmento disponível no momento. Nossa equipe poderá orientar você após o envio.</small>
            </label>
            <label class="campo-grande">
              Qual é o principal objetivo da sua empresa ao usar o NuvemMais Gestão? *
              <textarea
                v-model="formulario.interesse"
                rows="4"
                placeholder="Ex: organizar agenda, controlar clientes, acompanhar serviços, receber agendamentos pelo link público..."
              ></textarea>
              <small v-if="errosCampos.interesse" class="erro-campo">{{ errosCampos.interesse }}</small>
            </label>
          </div>

          <div
            v-else-if="etapaAtual === 3"
            id="planos"
            ref="secaoPlanosRef"
            :class="['campo-grande', 'etapa-planos', { destaque: destacarPlanos }]"
          >
            <div class="cabecalho-planos">
              <span class="selo">Escolha seu plano</span>
              <h2>Compare as opções disponíveis</h2>
              <p>Selecione o plano que combina melhor com o momento da sua empresa. Você poderá confirmar a escolha na revisão.</p>
            </div>

            <section class="planos-comerciais" aria-label="Apresentação comercial dos planos NuvemMais">
              <article v-for="planoComercial in planosComerciais" :key="planoComercial.nome" class="plano-comercial">
                <div class="plano-comercial-topo">
                  <span class="selo">Plano comercial</span>
                  <h3>{{ planoComercial.nome }}</h3>
                  <p class="plano-comercial-chamada">{{ planoComercial.chamada }}</p>
                </div>

                <ul class="plano-comercial-recursos">
                  <li v-for="recurso in planoComercial.recursos" :key="recurso">{{ recurso }}</li>
                </ul>
              </article>
            </section>

            <p class="aviso-planos aviso-planos-comerciais">
              Os planos selecionáveis abaixo continuam vindo da sua base atual e podem variar conforme a configuração da plataforma.
            </p>

            <section v-if="!planos.length" class="sem-planos">
              <h3>Nenhum plano disponível agora</h3>
              <p>Entre em contato com a equipe NuvemMais para receber orientação sobre a melhor opção para sua empresa.</p>
            </section>

            <template v-else>
              <p v-if="possuiPlanosOcultos" class="aviso-planos">
                Mostrando os principais planos disponíveis. Nossa equipe poderá ajustar a melhor opção após a análise.
              </p>

              <section class="grade-planos" aria-label="Planos disponíveis">
                <article
                  v-for="plano in planosVisiveis"
                  :key="plano.id"
                  :class="['plano-card', { selecionado: String(formulario.planoId) === String(plano.id) }]"
                >
                  <div class="plano-topo">
                    <h3>{{ plano.nome || plano.titulo || 'Plano sem nome' }}</h3>
                    <strong>{{ formatarMoeda(precoPlano(plano)) }}<span>/mês</span></strong>
                  </div>

                  <p class="plano-descricao">{{ descricaoPlano(plano) }}</p>

                  <dl class="lista-limites">
                    <div><dt>Usuários</dt><dd>{{ exibirLimite(obterLimitePlano(plano, 'limiteUsuarios')) }}</dd></div>
                    <div><dt>Clientes</dt><dd>{{ exibirLimite(obterLimitePlano(plano, 'limiteClientes')) }}</dd></div>
                    <div><dt>Funcionários</dt><dd>{{ exibirLimite(obterLimitePlano(plano, 'limiteFuncionarios')) }}</dd></div>
                    <div><dt>Serviços</dt><dd>{{ exibirLimite(obterLimitePlano(plano, 'limiteServicos')) }}</dd></div>
                    <div><dt>Agendamentos/mês</dt><dd>{{ exibirLimite(obterLimitePlano(plano, 'limiteAgendamentosMes', 'limiteAgendamentos')) }}</dd></div>
                    <div><dt>Produtos no estoque</dt><dd>{{ estoqueIncluido(plano) ? limiteProdutosPlano(plano) : 'Não incluso' }}</dd></div>
                  </dl>

                  <ul class="recursos-plano">
                    <li><span>Personalização</span><strong>{{ recursoDisponivel(plano.permitePersonalizacao) }}</strong></li>
                    <li><span>Relatórios</span><strong>{{ recursoDisponivel(plano.permiteRelatorios) }}</strong></li>
                    <li><span>Agendamento público</span><strong>{{ recursoDisponivel(plano.permiteAgendamentoPublico) }}</strong></li>
                    <li><span>Estoque</span><strong>{{ estoqueIncluido(plano) ? 'Sim' : 'Não' }}</strong></li>
                    <li><span>Suporte prioritário</span><strong>{{ recursoDisponivel(plano.permiteSuportePrioritario) }}</strong></li>
                  </ul>

                  <button class="botao-plano" type="button" @click="selecionarPlano(plano)">
                    {{ String(formulario.planoId) === String(plano.id) ? 'Plano selecionado' : 'Escolher plano' }}
                  </button>
                </article>
              </section>
            </template>
          </div>

          <div v-else class="revisao">
            <article><h2>Empresa</h2><p><strong>Nome:</strong> {{ formulario.nomeEmpresa }}</p><p><strong>Documento (CPF/CNPJ):</strong> {{ formulario.documento }}</p><p><strong>E-mail:</strong> {{ formulario.emailEmpresa }}</p><p><strong>Telefone:</strong> {{ formulario.telefoneEmpresa || '-' }}</p><p><strong>Endereço:</strong> {{ formulario.endereco || '-' }}</p></article>
            <article><h2>Responsável</h2><p><strong>Nome:</strong> {{ formulario.nomeResponsavel }}</p><p><strong>E-mail:</strong> {{ formulario.emailResponsavel }}</p><p><strong>Usuário/Login:</strong> {{ formulario.loginResponsavel || '-' }}</p><p><strong>Telefone:</strong> {{ formulario.telefoneResponsavel }}</p><p><strong>Cargo:</strong> {{ formulario.cargoResponsavel || '-' }}</p></article>
            <article><h2>Localização</h2><p><strong>Cidade:</strong> {{ formulario.cidade || '-' }}</p><p><strong>UF:</strong> {{ formulario.estado || '-' }}</p></article>
            <article><h2>Interesse</h2><p><strong>Segmento:</strong> {{ segmentoSelecionado?.nome || segmentoSelecionado?.descricao || '-' }}</p><p><strong>Mensagem:</strong> {{ formulario.interesse }}</p></article>
            <article>
              <h2>Plano escolhido</h2>
              <p><strong>Plano:</strong> {{ planoSelecionado?.nome || planoSelecionado?.titulo || '-' }}</p>
              <p><strong>Preço mensal:</strong> {{ planoSelecionado ? formatarMoeda(precoPlano(planoSelecionado)) : '-' }}</p>
              <p><strong>Resumo:</strong> {{ planoSelecionado ? descricaoPlano(planoSelecionado) : '-' }}</p>
              <p><strong>Estoque:</strong> {{ planoSelecionado ? (estoqueIncluido(planoSelecionado) ? 'Incluido' : 'Nao incluso') : '-' }}</p>
              <p><strong>Produtos no estoque:</strong> {{ planoSelecionado ? (estoqueIncluido(planoSelecionado) ? limiteProdutosPlano(planoSelecionado) : 'Nao incluso') : '-' }}</p>
              <ul v-if="recursosPrincipaisPlano(planoSelecionado).length" class="recursos-revisao">
                <li v-for="recurso in recursosPrincipaisPlano(planoSelecionado)" :key="recurso">{{ recurso }}</li>
              </ul>
            </article>
            <label class="aceite-termos"><input v-model="formulario.aceiteTermos" type="checkbox" /> <span>Li e aceito os <RouterLink to="/termos" target="_blank">Termos de Uso</RouterLink> e a <RouterLink to="/privacidade" target="_blank">Política de Privacidade</RouterLink>.</span></label>
          </div>

          <div class="acoes">
            <button v-if="etapaAtual > 0" class="botao secundario" type="button" @click="etapaAnterior">Voltar</button>
            <button v-if="etapaAtual < etapas.length - 1" class="botao principal" type="submit">Avançar</button>
            <button v-else class="botao principal" type="submit" :disabled="enviando">{{ enviando ? 'Enviando...' : 'Enviar cadastro' }}</button>
          </div>
        </form>
      </template>

      <nav class="links-institucionais" aria-label="Páginas públicas">
        <RouterLink to="/sobre">Sobre</RouterLink>
        <RouterLink to="/termos">Termos de Uso</RouterLink>
        <RouterLink to="/privacidade">Política de Privacidade</RouterLink>
      </nav>
    </section>
  </main>
</template>

<style scoped>
.pagina-publica{min-height:100vh;background:#eef2f7;color:#111827;padding:34px 18px}.conteudo{max-width:1080px;margin:0 auto;display:grid;gap:20px}.cabecalho{display:grid;gap:8px}.marca,.selo{color:#2563eb;font-size:13px;font-weight:800;text-transform:uppercase}.link-login{justify-self:end;color:#2563eb;font-weight:800;text-decoration:none}h1,h2,p{margin:0}h1{font-size:38px;font-weight:800}h2{font-size:20px}.cabecalho p,.confirmacao>p{color:#475569;font-size:17px}.card,.feedback{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.formulario,.confirmacao,.revisao{display:grid;gap:18px}.etapas,.campos,.revisao{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:14px}.etapas{grid-template-columns:repeat(5,minmax(120px,1fr))}.etapa{min-height:58px;border:1px solid #dbe4f0;border-radius:8px;background:white;color:#475569;cursor:default;font-weight:800}.etapa span{display:inline-grid;width:24px;height:24px;margin-right:7px;place-items:center;border-radius:999px;background:#e2e8f0}.etapa.ativa,.etapa.concluida{border-color:#2563eb;color:#1d4ed8}.etapa.concluida{cursor:pointer}.etapa.ativa span,.etapa.concluida span{background:#2563eb;color:white}.campo-grande{grid-column:1 / -1}label{display:grid;gap:7px;color:#334155;font-weight:800}label small{color:#64748b;font-size:13px}input,select,textarea{width:100%;min-width:0;border:1px solid #cbd5e1;border-radius:8px;padding:11px 12px;background:white;font:inherit;box-sizing:border-box}.aceite-termos{grid-column:1 / -1;display:flex;align-items:flex-start;gap:10px;padding:14px;border:1px solid #dbe4f0;border-radius:8px;background:#f8fafc}.aceite-termos input{width:auto;margin-top:3px}.aceite-termos a{color:#2563eb}.acoes{display:flex;gap:12px;flex-wrap:wrap}.botao{border:none;border-radius:8px;padding:12px 18px;color:white;cursor:pointer;font-weight:800;text-align:center;text-decoration:none}.principal{background:#2563eb}.secundario{background:#0f172a}.botao:disabled{cursor:not-allowed;opacity:.65}.links-institucionais{display:flex;justify-content:center;gap:14px;flex-wrap:wrap}.links-institucionais a{color:#64748b;font-size:13px;font-weight:700;text-decoration:none}.links-institucionais a:hover{color:#2563eb;text-decoration:underline}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.confirmacao{border-color:#bbf7d0;background:#f0fdf4}.erro-campo{color:#b91c1c;font-weight:700}.etapa-planos{display:grid;gap:18px}.cabecalho-planos{display:grid;gap:7px}.cabecalho-planos p{color:#64748b}.aviso-planos{padding:12px 14px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff;color:#1e3a8a;font-weight:700;line-height:1.45}.grade-planos{display:grid;grid-template-columns:repeat(auto-fit,minmax(230px,1fr));gap:16px}.plano-card{display:grid;grid-template-rows:auto auto 1fr auto auto;gap:16px;min-width:0;padding:18px;border:1px solid #dbe4f0;border-radius:8px;background:white;box-shadow:0 14px 30px rgba(15,23,42,.08);transition:border-color .18s ease,box-shadow .18s ease,transform .18s ease}.plano-card.selecionado{border-color:#2563eb;box-shadow:0 20px 42px rgba(37,99,235,.2);transform:translateY(-2px)}.plano-topo{display:grid;gap:10px}.plano-topo h3{margin:0;font-size:22px;line-height:1.15;overflow-wrap:anywhere}.plano-topo strong{color:#0f172a;font-size:26px;line-height:1}.plano-topo strong span{color:#64748b;font-size:14px;font-weight:800}.plano-descricao{color:#475569;line-height:1.5}.lista-limites{display:grid;gap:8px;margin:0}.lista-limites div,.recursos-plano li{display:flex;justify-content:space-between;gap:12px;align-items:center}.lista-limites dt,.recursos-plano span{color:#64748b;font-weight:800}.lista-limites dd{margin:0;color:#0f172a;font-weight:900;text-align:right}.recursos-plano{display:grid;gap:8px;margin:0;padding:14px 0 0;border-top:1px solid #e2e8f0;list-style:none}.recursos-plano strong{color:#0f766e}.botao-plano{width:100%;min-height:46px;border:1px solid #2563eb;border-radius:8px;padding:12px 14px;background:#2563eb;color:white;cursor:pointer;font-weight:900}.plano-card.selecionado .botao-plano{background:#0f172a;border-color:#0f172a}.sem-planos{display:grid;gap:8px;padding:20px;border:1px dashed #93c5fd;border-radius:8px;background:#eff6ff;color:#1e3a8a}.sem-planos h3{margin:0}.sem-planos p{color:#334155}.recursos-revisao{display:grid;gap:6px;margin:10px 0 0;padding-left:20px;color:#334155}.recursos-revisao li{line-height:1.35}@media (max-width:900px){.etapas,.campos,.revisao{grid-template-columns:1fr}h1{font-size:31px}.grade-planos{grid-template-columns:1fr}.plano-topo strong{font-size:24px}}@media (max-width:560px){.pagina-publica{padding:22px 12px}.card,.feedback{padding:18px}.etapas{grid-template-columns:1fr}.acoes{display:grid;grid-template-columns:1fr}.botao,.botao-plano{width:100%}.lista-limites div,.recursos-plano li{align-items:flex-start}.plano-card{padding:16px}}
</style>

<style scoped>
.etapa-planos {
  scroll-margin-top: 18px;
}

.etapa-planos.destaque {
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: 16px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 18px 36px rgba(37, 99, 235, 0.08);
}

.planos-comerciais {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(240px, 1fr));
  gap: 14px;
}

.plano-comercial {
  display: grid;
  gap: 14px;
  padding: 18px;
  border: 1px solid #dbe4f0;
  border-radius: 14px;
  background: linear-gradient(180deg, #ffffff 0%, #f8fbff 100%);
  box-shadow: 0 12px 26px rgba(15, 23, 42, 0.06);
}

.plano-comercial-topo {
  display: grid;
  gap: 8px;
}

.plano-comercial h3 {
  margin: 0;
  font-size: 22px;
  line-height: 1.18;
  overflow-wrap: anywhere;
}

.plano-comercial-chamada {
  margin: 0;
  color: #334155;
  line-height: 1.5;
  font-weight: 700;
}

.plano-comercial-recursos {
  display: grid;
  gap: 8px;
  margin: 0;
  padding-left: 18px;
  color: #0f172a;
}

.plano-comercial-recursos li {
  line-height: 1.45;
}

.aviso-planos-comerciais {
  margin-top: -2px;
}

@media (max-width: 900px) {
  .planos-comerciais {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .plano-comercial {
    padding: 16px;
  }
}
</style>
