<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { RouterLink } from 'vue-router'
import {
  buscarOpcoesCadastroGuiadoAdmin,
  criarEmpresaCadastroGuiadoAdmin,
} from '@/services/api'
import {
  criarManipuladorPasteNumerico,
  documentoBasicoValido,
  emailBasicoValido,
  sanitizarDocumento,
  sanitizarTelefone,
  telefoneBasicoValido,
} from '@/utils/validacoes'

const ETAPAS = [
  { titulo: 'Empresa' },
  { titulo: 'Funcionamento' },
  { titulo: 'Plano' },
  { titulo: 'Usuário administrador' },
  { titulo: 'Revisão' },
]

const INTERVALOS_AGENDA = [15, 30, 60]
const DIAS_FUNCIONAMENTO = [
  { chave: 'domingo', rotulo: 'Domingo' },
  { chave: 'segunda', rotulo: 'Segunda' },
  { chave: 'terca', rotulo: 'Terça' },
  { chave: 'quarta', rotulo: 'Quarta' },
  { chave: 'quinta', rotulo: 'Quinta' },
  { chave: 'sexta', rotulo: 'Sexta' },
  { chave: 'sabado', rotulo: 'Sábado' },
]
const UFS = [
  'AC', 'AL', 'AP', 'AM', 'BA', 'CE', 'DF', 'ES', 'GO', 'MA',
  'MT', 'MS', 'MG', 'PA', 'PB', 'PR', 'PE', 'PI', 'RJ', 'RN',
  'RS', 'RO', 'RR', 'SC', 'SP', 'SE', 'TO',
]
const URL_PUBLICA_BASE = 'https://automacao-le-saas-web.1mweab.easypanel.host'

const etapaAtual = ref(0)
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')
const aviso = ref('')
const infoCopia = ref('')
const empresaCriada = ref(null)
const opcoes = ref({ planos: [] })
const errosCampos = ref({})
const emailEmpresaTocado = ref(false)
const emailAdminTocado = ref(false)
const slugEditado = ref(false)

const formulario = ref(criarFormularioInicial())

const planosDisponiveis = computed(() => extrairLista(opcoes.value.planos).filter((plano) => plano?.ativo !== false))
const planoSelecionado = computed(() =>
  planosDisponiveis.value.find((plano) => String(plano.id) === String(formulario.value.planoId)) || null,
)
const linkPublicoPrevisto = computed(() => montarLinkPublico(formulario.value.empresa.slugPublico))
const senhaTemporariaResultado = computed(() =>
  obterCampo(
    empresaCriada.value,
    'senhaTemporaria',
    'data.senhaTemporaria',
    'resultado.senhaTemporaria',
    'empresa.senhaTemporaria',
    'usuarioAdmin.senhaTemporaria',
    'senhaInicialAdmin',
    'adminSenhaTemporaria',
    'temporaryPassword',
    'data.senhaInicialAdmin',
    'data.adminSenhaTemporaria',
    'data.temporaryPassword',
    'resultado.senhaInicialAdmin',
    'resultado.adminSenhaTemporaria',
    'resultado.temporaryPassword',
    'empresa.senhaInicialAdmin',
    'empresa.adminSenhaTemporaria',
    'empresa.temporaryPassword',
    'usuarioAdmin.senhaTemporaria',
    'usuarioAdmin.temporaryPassword',
  ),
)
const senhaTemporariaResultadoTexto = computed(() =>
  senhaTemporariaResultado.value || 'Senha temporária não retornada pelo backend.',
)
const emailAdminResultado = computed(() =>
  obterCampo(
    empresaCriada.value,
    'adminEmail',
    'usuarioAdminEmail',
    'emailAdmin',
    'usuario.email',
    'usuarioAdmin.email',
  ) || formulario.value.admin.email,
)
const nomeEmpresaResultado = computed(() =>
  obterCampo(
    empresaCriada.value,
    'nomeEmpresa',
    'empresaNome',
    'nome',
    'empresa.nome',
  ) || formulario.value.empresa.nome,
)
const linkPublicoResultado = computed(() =>
  obterCampo(
    empresaCriada.value,
    'linkPublico',
    'urlPublica',
    'urlPublico',
    'publicLink',
    'empresa.linkPublico',
    'empresa.urlPublica',
    'empresa.publicLink',
  ) || linkPublicoPrevisto.value,
)

watch(
  () => formulario.value.empresa.nome,
  (nome) => {
    if (!slugEditado.value) {
      formulario.value.empresa.slugPublico = gerarSlug(nome)
    }
  },
)

onMounted(carregarOpcoes)

function criarFormularioInicial() {
  return {
    empresa: {
      nome: '',
      documento: '',
      telefone: '',
      email: '',
      endereco: '',
      cidade: '',
      estado: '',
      slugPublico: '',
      permitirAgendamentoPublico: true,
    },
    funcionamento: {
      horaAbertura: '',
      horaFechamento: '',
      intervaloAgendaMinutos: 30,
      diasFuncionamento: {
        domingo: false,
        segunda: true,
        terca: true,
        quarta: true,
        quinta: true,
        sexta: true,
        sabado: false,
      },
    },
    planoId: '',
    admin: {
      nome: '',
      email: '',
      telefone: '',
      cargo: '',
      senhaTemporaria: '',
    },
  }
}

async function carregarOpcoes() {
  try {
    carregando.value = true
    erro.value = ''
    opcoes.value = normalizarOpcoes(await buscarOpcoesCadastroGuiadoAdmin())
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as opções do cadastro guiado.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function normalizarOpcoes(resposta) {
  const dados = normalizarObjeto(resposta)
  return {
    planos: extrairLista(dados.planos ?? dados),
  }
}

function atualizarDocumento(evento) {
  formulario.value.empresa.documento = sanitizarDocumento(evento?.target?.value)
}

function colarDocumento(evento) {
  criarManipuladorPasteNumerico(sanitizarDocumento)(evento, (valor) => {
    formulario.value.empresa.documento = valor
  })
}

function atualizarTelefoneEmpresa(evento) {
  formulario.value.empresa.telefone = sanitizarTelefone(evento?.target?.value)
}

function colarTelefoneEmpresa(evento) {
  criarManipuladorPasteNumerico(sanitizarTelefone)(evento, (valor) => {
    formulario.value.empresa.telefone = valor
  })
}

function atualizarTelefoneAdmin(evento) {
  formulario.value.admin.telefone = sanitizarTelefone(evento?.target?.value)
}

function colarTelefoneAdmin(evento) {
  criarManipuladorPasteNumerico(sanitizarTelefone)(evento, (valor) => {
    formulario.value.admin.telefone = valor
  })
}

function atualizarSlug(valor) {
  slugEditado.value = true
  formulario.value.empresa.slugPublico = gerarSlug(valor)
}

function validarEmailEmpresaBlur() {
  emailEmpresaTocado.value = true
  validarCampoEmail('empresa')
}

function validarEmailAdminBlur() {
  emailAdminTocado.value = true
  validarCampoEmail('admin')
}

function validarCampoEmail(tipo) {
  if (tipo === 'empresa') {
    const valor = formulario.value.empresa.email
    definirErroCampo('empresa.email', valor && !emailBasicoValido(valor) ? 'Informe um e-mail válido.' : '')
    return
  }

  const valor = formulario.value.admin.email
  definirErroCampo('admin.email', valor && !emailBasicoValido(valor) ? 'Informe um e-mail válido.' : '')
}

function definirErroCampo(campo, mensagem) {
  errosCampos.value = {
    ...errosCampos.value,
    [campo]: mensagem,
  }
}

function limparMensagensGerais() {
  erro.value = ''
  sucesso.value = ''
  aviso.value = ''
  infoCopia.value = ''
}

function proximaEtapa() {
  if (!validarEtapaAtual()) return
  limparMensagensGerais()
  etapaAtual.value = Math.min(etapaAtual.value + 1, ETAPAS.length - 1)
}

function etapaAnterior() {
  if (salvando.value) return
  limparMensagensGerais()
  etapaAtual.value = Math.max(etapaAtual.value - 1, 0)
}

async function criarEmpresa() {
  if (salvando.value || !validarEtapaAtual()) return

  try {
    salvando.value = true
    limparMensagensGerais()
    const resposta = await criarEmpresaCadastroGuiadoAdmin(montarPayload())
    empresaCriada.value = normalizarRespostaCriacaoEmpresa(resposta)
    sucesso.value = `Empresa ${nomeEmpresaResultado.value} criada com sucesso.`
    aviso.value = extrairAvisoResposta(resposta)
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível criar a empresa.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function montarPayload() {
  return limparVazios({
    empresa: {
      nome: textoOuNulo(formulario.value.empresa.nome),
      documento: textoOuNulo(formulario.value.empresa.documento),
      telefone: textoOuNulo(formulario.value.empresa.telefone),
      email: textoOuNulo(formulario.value.empresa.email),
      endereco: textoOuNulo(formulario.value.empresa.endereco),
      cidade: textoOuNulo(formulario.value.empresa.cidade),
      estado: textoOuNulo(formulario.value.empresa.estado),
      uf: textoOuNulo(formulario.value.empresa.estado),
      slug: textoOuNulo(formulario.value.empresa.slugPublico),
      slugPublico: textoOuNulo(formulario.value.empresa.slugPublico),
      permitirAgendamentoPublico: Boolean(formulario.value.empresa.permitirAgendamentoPublico),
      agendamentoPublicoAtivo: Boolean(formulario.value.empresa.permitirAgendamentoPublico),
    },
    funcionamento: {
      horaAbertura: textoOuNulo(formulario.value.funcionamento.horaAbertura),
      horaFechamento: textoOuNulo(formulario.value.funcionamento.horaFechamento),
      intervaloAgendaMinutos: Number(formulario.value.funcionamento.intervaloAgendaMinutos),
      diasFuncionamento: { ...formulario.value.funcionamento.diasFuncionamento },
      atendeDomingo: formulario.value.funcionamento.diasFuncionamento.domingo,
      atendeSegunda: formulario.value.funcionamento.diasFuncionamento.segunda,
      atendeTerca: formulario.value.funcionamento.diasFuncionamento.terca,
      atendeQuarta: formulario.value.funcionamento.diasFuncionamento.quarta,
      atendeQuinta: formulario.value.funcionamento.diasFuncionamento.quinta,
      atendeSexta: formulario.value.funcionamento.diasFuncionamento.sexta,
      atendeSabado: formulario.value.funcionamento.diasFuncionamento.sabado,
    },
    planoId: formulario.value.planoId ? Number(formulario.value.planoId) : null,
    assinatura: formulario.value.planoId
      ? {
          planoId: Number(formulario.value.planoId),
          status: 'ATIVA',
        }
      : null,
    usuarioAdmin: {
      nome: textoOuNulo(formulario.value.admin.nome),
      email: textoOuNulo(formulario.value.admin.email),
      telefone: textoOuNulo(formulario.value.admin.telefone),
      cargo: textoOuNulo(formulario.value.admin.cargo),
      senhaTemporaria: textoOuNulo(formulario.value.admin.senhaTemporaria),
    },
  })
}

function validarEtapaAtual() {
  errosCampos.value = {}
  erro.value = ''

  if (etapaAtual.value === 0) {
    if (!formulario.value.empresa.nome.trim()) return falharCampo('empresa.nome', 'Informe o nome da empresa.')
    if (!formulario.value.empresa.documento.trim()) return falharCampo('empresa.documento', 'Informe o documento da empresa.')
    if (!documentoBasicoValido(formulario.value.empresa.documento)) {
      return falharCampo('empresa.documento', 'Informe um documento com 11 ou 14 dígitos.')
    }
    if (formulario.value.empresa.telefone && !telefoneBasicoValido(formulario.value.empresa.telefone)) {
      return falharCampo('empresa.telefone', 'Informe um telefone com 10 ou 11 dígitos.')
    }
    if (!formulario.value.empresa.email.trim()) return falharCampo('empresa.email', 'Informe o e-mail da empresa.')
    if (!emailBasicoValido(formulario.value.empresa.email)) {
      return falharCampo('empresa.email', 'Informe um e-mail válido.')
    }
    if (!formulario.value.empresa.cidade.trim()) return falharCampo('empresa.cidade', 'Informe a cidade.')
    if (!formulario.value.empresa.estado.trim()) return falharCampo('empresa.estado', 'Informe a UF.')
    if (!formulario.value.empresa.endereco.trim()) return falharCampo('empresa.endereco', 'Informe o endereço.')
    if (!formulario.value.empresa.slugPublico.trim()) return falharCampo('empresa.slugPublico', 'Informe o slug público.')
    if (formulario.value.empresa.slugPublico !== gerarSlug(formulario.value.empresa.slugPublico)) {
      return falharCampo('empresa.slugPublico', 'Use apenas minúsculas, números e hífens no slug.')
    }
  }

  if (etapaAtual.value === 1) {
    if (!formulario.value.funcionamento.horaAbertura) {
      return falharCampo('funcionamento.horaAbertura', 'Informe a hora de abertura.')
    }
    if (!formulario.value.funcionamento.horaFechamento) {
      return falharCampo('funcionamento.horaFechamento', 'Informe a hora de fechamento.')
    }
    if (formulario.value.funcionamento.horaAbertura >= formulario.value.funcionamento.horaFechamento) {
      return falharCampo('funcionamento.horaFechamento', 'A hora de fechamento deve ser maior que a abertura.')
    }
    if (!INTERVALOS_AGENDA.includes(Number(formulario.value.funcionamento.intervaloAgendaMinutos))) {
      return falharCampo('funcionamento.intervaloAgendaMinutos', 'Selecione um intervalo da agenda válido.')
    }
    if (!Object.values(formulario.value.funcionamento.diasFuncionamento).some(Boolean)) {
      return falharCampo('funcionamento.diasFuncionamento', 'Selecione pelo menos um dia de funcionamento.')
    }
  }

  if (etapaAtual.value === 2) {
    if (!formulario.value.planoId) return falharCampo('planoId', 'Selecione um plano ativo.')
  }

  if (etapaAtual.value === 3) {
    if (!formulario.value.admin.nome.trim()) return falharCampo('admin.nome', 'Informe o nome do usuário administrador.')
    if (!formulario.value.admin.email.trim()) return falharCampo('admin.email', 'Informe o e-mail do usuário administrador.')
    if (!emailBasicoValido(formulario.value.admin.email)) return falharCampo('admin.email', 'Informe um e-mail válido.')
    if (formulario.value.admin.telefone && !telefoneBasicoValido(formulario.value.admin.telefone)) {
      return falharCampo('admin.telefone', 'Informe um telefone com 10 ou 11 dígitos.')
    }
  }

  return true
}

function falharCampo(campo, mensagem) {
  definirErroCampo(campo, mensagem)
  erro.value = mensagem
  return false
}

async function copiarLinkPublico() {
  await copiarTexto(
    linkPublicoResultado.value,
    'Link público copiado com sucesso.',
    'Não foi possível copiar o link público.',
  )
}

async function copiarSenhaTemporaria() {
  if (!senhaTemporariaResultado.value) return
  await copiarTexto(
    senhaTemporariaResultado.value,
    'Senha temporária copiada com sucesso.',
    'Não foi possível copiar a senha temporária.',
  )
}

async function copiarTexto(valor, mensagemSucesso, mensagemErro) {
  if (!valor) return

  try {
    if (!navigator?.clipboard?.writeText) {
      throw new Error('Clipboard indisponível')
    }
    await navigator.clipboard.writeText(valor)
    infoCopia.value = mensagemSucesso
    erro.value = ''
  } catch (error) {
    infoCopia.value = ''
    erro.value = mensagemErro
  }
}

function criarOutraEmpresa() {
  formulario.value = criarFormularioInicial()
  etapaAtual.value = 0
  empresaCriada.value = null
  slugEditado.value = false
  emailEmpresaTocado.value = false
  emailAdminTocado.value = false
  errosCampos.value = {}
  limparMensagensGerais()
}

function montarLinkPublico(slug) {
  const slugNormalizado = gerarSlug(slug)
  return slugNormalizado ? `${URL_PUBLICA_BASE}/agendar/${slugNormalizado}` : ''
}

function formatarMoeda(valor) {
  const numero = Number(valor)
  if (Number.isNaN(numero)) return 'Não aplicável'
  return numero.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function descricaoPlano(plano) {
  if (!plano) return []
  const itens = []
  if (plano.valor !== undefined && plano.valor !== null) itens.push(`Valor: ${formatarMoeda(plano.valor)}`)
  if (plano.descricao) itens.push(`Descrição: ${plano.descricao}`)
  const limites = [
    ['maxUsuarios', 'Usuários'],
    ['maxFuncionarios', 'Funcionários'],
    ['maxServicos', 'Serviços'],
    ['maxClientes', 'Clientes'],
    ['maxAgendamentosMes', 'Agendamentos/mês'],
  ]
  limites.forEach(([campo, rotulo]) => {
    const valor = plano?.[campo]
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      itens.push(`${rotulo}: ${valor}`)
    }
  })
  return itens
}

function gerarSlug(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) return resposta
  return resposta?.content || resposta?.items || resposta?.data || resposta?.planos || []
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && typeof dados.data === 'object' ? dados.data : dados
}

function normalizarRespostaCriacaoEmpresa(resposta) {
  const respostaNormalizada = normalizarObjeto(resposta)
  const dataNormalizada = normalizarObjeto(respostaNormalizada.data || respostaNormalizada)
  const resultadoNormalizado = normalizarObjeto(dataNormalizada.resultado)
  const empresaNormalizada = normalizarObjeto(dataNormalizada.empresa)
  const usuarioAdminNormalizado = normalizarObjeto(
    dataNormalizada.usuarioAdmin || dataNormalizada.admin || resultadoNormalizado.usuarioAdmin || empresaNormalizada.usuarioAdmin,
  )

  const respostaMesclada = {
    ...respostaNormalizada,
    ...dataNormalizada,
    ...resultadoNormalizado,
    ...empresaNormalizada,
    resultado: Object.keys(resultadoNormalizado).length ? resultadoNormalizado : dataNormalizada.resultado || null,
    empresa: Object.keys(empresaNormalizada).length ? empresaNormalizada : dataNormalizada.empresa || null,
    usuarioAdmin: Object.keys(usuarioAdminNormalizado).length
      ? usuarioAdminNormalizado
      : dataNormalizada.usuarioAdmin || dataNormalizada.admin || null,
  }

  const senhaDetectada = obterCampo(
    respostaMesclada,
    'senhaTemporaria',
    'data.senhaTemporaria',
    'resultado.senhaTemporaria',
    'empresa.senhaTemporaria',
    'usuarioAdmin.senhaTemporaria',
    'senhaInicialAdmin',
    'adminSenhaTemporaria',
    'temporaryPassword',
    'data.senhaInicialAdmin',
    'data.adminSenhaTemporaria',
    'data.temporaryPassword',
    'resultado.senhaInicialAdmin',
    'resultado.adminSenhaTemporaria',
    'resultado.temporaryPassword',
    'empresa.senhaInicialAdmin',
    'empresa.adminSenhaTemporaria',
    'empresa.temporaryPassword',
    'usuarioAdmin.temporaryPassword',
  )

  if (senhaDetectada) {
    respostaMesclada.senhaTemporaria = respostaMesclada.senhaTemporaria || senhaDetectada
    if (respostaMesclada.usuarioAdmin && !respostaMesclada.usuarioAdmin.senhaTemporaria) {
      respostaMesclada.usuarioAdmin.senhaTemporaria = senhaDetectada
    }
  } else {
    const chavesDisponiveis = Object.keys(respostaMesclada).sort().join(', ')
    console.warn('Senha temporaria nao encontrada na resposta do onboarding administrativo.', {
      chavesDisponiveis,
      possuiData: Boolean(respostaNormalizada.data),
      possuiResultado: Boolean(respostaMesclada.resultado),
      possuiEmpresa: Boolean(respostaMesclada.empresa),
      possuiUsuarioAdmin: Boolean(respostaMesclada.usuarioAdmin),
    })
  }

  return respostaMesclada
}

function extrairAvisoResposta(resposta) {
  const candidatos = [resposta, resposta?.data].filter(Boolean)
  const campos = ['aviso', 'warning', 'alerta', 'mensagemAviso']

  for (const item of candidatos) {
    for (const campo of campos) {
      const valor = item?.[campo]
      if (typeof valor === 'string' && valor.trim()) return valor.trim()
    }
  }

  return ''
}

function obterMensagemErro(error, fallback) {
  const mensagem = String(error?.message || '').trim()
  const mensagemNormalizada = mensagem
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()

  if (mensagemNormalizada.includes('slug') && (mensagemNormalizada.includes('duplic') || mensagemNormalizada.includes('ja existe'))) {
    return 'Já existe empresa com este slug público.'
  }

  if (
    mensagemNormalizada.includes('email') &&
    mensagemNormalizada.includes('admin') &&
    (mensagemNormalizada.includes('duplic') || mensagemNormalizada.includes('ja existe'))
  ) {
    return 'Já existe usuário com este e-mail de login.'
  }

  return mensagem || fallback
}

function limparVazios(objeto) {
  if (Array.isArray(objeto)) {
    return objeto.map(limparVazios)
  }

  if (!objeto || typeof objeto !== 'object') {
    return objeto
  }

  return Object.fromEntries(
    Object.entries(objeto)
      .filter(([, valor]) => valor !== undefined)
      .map(([chave, valor]) => [chave, valor && typeof valor === 'object' ? limparVazios(valor) : valor]),
  )
}

function textoOuNulo(valor) {
  const texto = String(valor || '').trim()
  return texto || null
}

function obterCampo(objeto, ...caminhos) {
  for (const caminho of caminhos) {
    const valor = obterCampoProfundo(objeto, caminho)
    if (valor !== undefined && valor !== null && String(valor).trim() !== '') {
      return valor
    }
  }
  return ''
}

function obterCampoProfundo(objeto, caminho) {
  return String(caminho || '')
    .split('.')
    .reduce((acumulado, chave) => (acumulado && acumulado[chave] !== undefined ? acumulado[chave] : undefined), objeto)
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">ADMINISTRAÇÃO SAAS</p>
        <h1>Novo cadastro guiado</h1>
        <p class="descricao">Crie uma empresa pelo SUPER_ADMIN em um fluxo claro, validado e seguro.</p>
      </div>
      <RouterLink class="botao secundario" to="/empresas">Voltar para Empresas</RouterLink>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="infoCopia" class="card sucesso"><p>{{ infoCopia }}</p></section>

    <section class="etapas">
      <button
        v-for="(etapa, indice) in ETAPAS"
        :key="etapa.titulo"
        class="etapa"
        :class="{ ativa: etapaAtual === indice, concluida: etapaAtual > indice }"
        type="button"
        :disabled="indice > etapaAtual || salvando"
        @click="indice <= etapaAtual && !salvando && (etapaAtual = indice)"
      >
        <span>{{ indice + 1 }}</span>
        {{ etapa.titulo }}
      </button>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando opções do cadastro...</p>
    </section>

    <section v-else-if="sucesso" class="card sucesso-card">
      <div class="sucesso-topo">
        <div>
          <h2>Empresa criada com sucesso</h2>
          <p>{{ sucesso }}</p>
          <p v-if="aviso" class="texto-aviso">{{ aviso }}</p>
        </div>
      </div>

      <div class="sucesso-grid">
        <article>
          <h3>Empresa</h3>
          <p><strong>Nome da empresa:</strong> {{ nomeEmpresaResultado }}</p>
          <p><strong>E-mail do usuário admin:</strong> {{ emailAdminResultado }}</p>
          <p class="credencial-destaque">
            <strong>Senha temporária:</strong>
            <span>{{ senhaTemporariaResultadoTexto }}</span>
          </p>
          <button
            v-if="senhaTemporariaResultado"
            class="botao neutro botao-inline"
            type="button"
            @click="copiarSenhaTemporaria"
          >
            Copiar senha temporária
          </button>
        </article>
        <article>
          <h3>Página pública</h3>
          <p class="credencial-destaque">
            <strong>Link público completo:</strong>
            <span>{{ linkPublicoResultado || 'Não disponível.' }}</span>
          </p>
        </article>
      </div>

      <div class="acoes">
        <button class="botao principal" type="button" @click="copiarLinkPublico">Copiar link público</button>
        <RouterLink class="botao secundario" to="/empresas">Ir para Empresas</RouterLink>
        <button class="botao neutro" type="button" @click="criarOutraEmpresa">Criar outra empresa</button>
      </div>
    </section>

    <section v-else class="card formulario">
      <div v-if="etapaAtual === 0" class="campos">
        <label>
          Nome da empresa *
          <input v-model="formulario.empresa.nome" type="text" placeholder="Barbearia Exemplo" />
          <small v-if="errosCampos['empresa.nome']" class="mensagem-erro">{{ errosCampos['empresa.nome'] }}</small>
        </label>

        <label>
          Documento (CPF/CNPJ) *
          <input
            :value="formulario.empresa.documento"
            type="text"
            inputmode="numeric"
            placeholder="Somente números"
            @input="atualizarDocumento"
            @paste="colarDocumento"
          />
          <small v-if="errosCampos['empresa.documento']" class="mensagem-erro">{{ errosCampos['empresa.documento'] }}</small>
        </label>

        <label>
          Telefone
          <input
            :value="formulario.empresa.telefone"
            type="text"
            inputmode="numeric"
            placeholder="Somente números"
            @input="atualizarTelefoneEmpresa"
            @paste="colarTelefoneEmpresa"
          />
          <small v-if="errosCampos['empresa.telefone']" class="mensagem-erro">{{ errosCampos['empresa.telefone'] }}</small>
        </label>

        <label>
          E-mail da empresa *
          <input v-model="formulario.empresa.email" type="email" placeholder="contato@empresa.com" @blur="validarEmailEmpresaBlur" />
          <small v-if="errosCampos['empresa.email']" class="mensagem-erro">{{ errosCampos['empresa.email'] }}</small>
        </label>

        <label>
          Cidade *
          <input v-model="formulario.empresa.cidade" type="text" placeholder="São Paulo" />
          <small v-if="errosCampos['empresa.cidade']" class="mensagem-erro">{{ errosCampos['empresa.cidade'] }}</small>
        </label>

        <label>
          UF *
          <select v-model="formulario.empresa.estado">
            <option value="">Selecione</option>
            <option v-for="uf in UFS" :key="uf" :value="uf">{{ uf }}</option>
          </select>
          <small v-if="errosCampos['empresa.estado']" class="mensagem-erro">{{ errosCampos['empresa.estado'] }}</small>
        </label>

        <label class="campo-grande">
          Endereço *
          <input v-model="formulario.empresa.endereco" type="text" placeholder="Rua Principal, 100" />
          <small v-if="errosCampos['empresa.endereco']" class="mensagem-erro">{{ errosCampos['empresa.endereco'] }}</small>
        </label>

        <label>
          Slug público *
          <input
            :value="formulario.empresa.slugPublico"
            type="text"
            placeholder="barbearia-exemplo"
            @input="atualizarSlug($event.target.value)"
          />
          <small v-if="errosCampos['empresa.slugPublico']" class="mensagem-erro">{{ errosCampos['empresa.slugPublico'] }}</small>
        </label>

        <label class="checkbox campo-grande">
          <input v-model="formulario.empresa.permitirAgendamentoPublico" type="checkbox" />
          Permitir agendamento público
        </label>

        <p v-if="linkPublicoPrevisto" class="link-publico">
          Link público previsto: {{ linkPublicoPrevisto }}
        </p>
      </div>

      <div v-else-if="etapaAtual === 1" class="campos">
        <label>
          Hora de abertura *
          <input v-model="formulario.funcionamento.horaAbertura" type="time" />
          <small v-if="errosCampos['funcionamento.horaAbertura']" class="mensagem-erro">{{ errosCampos['funcionamento.horaAbertura'] }}</small>
        </label>

        <label>
          Hora de fechamento *
          <input v-model="formulario.funcionamento.horaFechamento" type="time" />
          <small v-if="errosCampos['funcionamento.horaFechamento']" class="mensagem-erro">{{ errosCampos['funcionamento.horaFechamento'] }}</small>
        </label>

        <label>
          Intervalo da agenda *
          <select v-model.number="formulario.funcionamento.intervaloAgendaMinutos">
            <option v-for="intervalo in INTERVALOS_AGENDA" :key="intervalo" :value="intervalo">{{ intervalo }} minutos</option>
          </select>
          <small v-if="errosCampos['funcionamento.intervaloAgendaMinutos']" class="mensagem-erro">{{ errosCampos['funcionamento.intervaloAgendaMinutos'] }}</small>
        </label>

        <div class="campo-grande dias-card">
          <div class="dias-topo">
            <strong>Dias de funcionamento</strong>
            <small v-if="errosCampos['funcionamento.diasFuncionamento']" class="mensagem-erro">
              {{ errosCampos['funcionamento.diasFuncionamento'] }}
            </small>
          </div>
          <div class="dias-grid">
            <label v-for="dia in DIAS_FUNCIONAMENTO" :key="dia.chave" class="checkbox">
              <input v-model="formulario.funcionamento.diasFuncionamento[dia.chave]" type="checkbox" />
              {{ dia.rotulo }}
            </label>
          </div>
        </div>
      </div>

      <div v-else-if="etapaAtual === 2" class="campos">
        <label class="campo-grande">
          Plano ativo *
          <select v-model="formulario.planoId">
            <option value="">Selecione</option>
            <option v-for="plano in planosDisponiveis" :key="plano.id" :value="plano.id">
              {{ plano.nome || 'Plano sem nome' }}
            </option>
          </select>
          <small v-if="errosCampos.planoId" class="mensagem-erro">{{ errosCampos.planoId }}</small>
        </label>

        <article v-if="planoSelecionado" class="resumo-plano campo-grande">
          <h3>{{ planoSelecionado.nome || 'Plano selecionado' }}</h3>
          <p v-for="item in descricaoPlano(planoSelecionado)" :key="item">{{ item }}</p>
        </article>

        <article v-else class="resumo-plano vazio campo-grande">
          <p>{{ planosDisponiveis.length ? 'Selecione um plano para visualizar os detalhes.' : 'Não há plano ativo disponível no momento.' }}</p>
        </article>
      </div>

      <div v-else-if="etapaAtual === 3" class="campos">
        <label>
          Nome do usuário administrador *
          <input v-model="formulario.admin.nome" type="text" placeholder="Responsável principal" />
          <small v-if="errosCampos['admin.nome']" class="mensagem-erro">{{ errosCampos['admin.nome'] }}</small>
        </label>

        <label>
          E-mail do usuário administrador *
          <input v-model="formulario.admin.email" type="email" placeholder="admin@empresa.com" @blur="validarEmailAdminBlur" />
          <small v-if="errosCampos['admin.email']" class="mensagem-erro">{{ errosCampos['admin.email'] }}</small>
        </label>

        <label>
          Telefone
          <input
            :value="formulario.admin.telefone"
            type="text"
            inputmode="numeric"
            placeholder="Somente números"
            @input="atualizarTelefoneAdmin"
            @paste="colarTelefoneAdmin"
          />
          <small v-if="errosCampos['admin.telefone']" class="mensagem-erro">{{ errosCampos['admin.telefone'] }}</small>
        </label>

        <label>
          Cargo
          <input v-model="formulario.admin.cargo" type="text" placeholder="Administrador" />
        </label>

        <label class="campo-grande">
          Senha temporária
          <input v-model="formulario.admin.senhaTemporaria" type="text" placeholder="Se ficar vazio, o backend gera a senha temporária" />
        </label>

        <p class="dica campo-grande">Se deixar vazio, o backend gera uma senha temporária.</p>
      </div>

      <div v-else class="revisao">
        <article>
          <h2>Empresa</h2>
          <p><strong>Nome:</strong> {{ formulario.empresa.nome }}</p>
          <p><strong>Documento:</strong> {{ formulario.empresa.documento || 'Não aplicável' }}</p>
          <p><strong>Telefone:</strong> {{ formulario.empresa.telefone || 'Não aplicável' }}</p>
          <p><strong>E-mail:</strong> {{ formulario.empresa.email || 'Não aplicável' }}</p>
          <p><strong>Agendamento público:</strong> {{ formulario.empresa.permitirAgendamentoPublico ? 'Sim' : 'Não' }}</p>
        </article>

        <article>
          <h2>Localização</h2>
          <p><strong>Endereço:</strong> {{ formulario.empresa.endereco || 'Não aplicável' }}</p>
          <p><strong>Cidade:</strong> {{ formulario.empresa.cidade || 'Não aplicável' }}</p>
          <p><strong>UF:</strong> {{ formulario.empresa.estado || 'Não aplicável' }}</p>
          <p><strong>Link da página pública:</strong> {{ linkPublicoPrevisto || 'Não aplicável' }}</p>
        </article>

        <article>
          <h2>Funcionamento</h2>
          <p><strong>Abertura:</strong> {{ formulario.funcionamento.horaAbertura }}</p>
          <p><strong>Fechamento:</strong> {{ formulario.funcionamento.horaFechamento }}</p>
          <p><strong>Intervalo:</strong> {{ formulario.funcionamento.intervaloAgendaMinutos }} minutos</p>
          <p>
            <strong>Dias:</strong>
            {{
              DIAS_FUNCIONAMENTO.filter((dia) => formulario.funcionamento.diasFuncionamento[dia.chave])
                .map((dia) => dia.rotulo)
                .join(', ')
            }}
          </p>
        </article>

        <article>
          <h2>Plano</h2>
          <p><strong>Plano ativo:</strong> {{ planoSelecionado?.nome || 'Não aplicável' }}</p>
          <p v-for="item in descricaoPlano(planoSelecionado)" :key="item">{{ item }}</p>
        </article>

        <article>
          <h2>Usuário administrador</h2>
          <p><strong>Nome:</strong> {{ formulario.admin.nome }}</p>
          <p><strong>E-mail:</strong> {{ formulario.admin.email }}</p>
          <p><strong>Telefone:</strong> {{ formulario.admin.telefone || 'Não aplicável' }}</p>
          <p><strong>Cargo:</strong> {{ formulario.admin.cargo || 'Não aplicável' }}</p>
        </article>
      </div>

      <div class="acoes">
        <button v-if="etapaAtual > 0" class="botao secundario" type="button" :disabled="salvando" @click="etapaAnterior">Voltar</button>
        <button v-if="etapaAtual < ETAPAS.length - 1" class="botao principal" type="button" :disabled="salvando" @click="proximaEtapa">Avançar</button>
        <button v-else class="botao principal" type="button" :disabled="salvando" @click="criarEmpresa">
          {{ salvando ? 'Criando empresa...' : 'Criar empresa' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.revisao {
  display: grid;
  gap: 18px;
  color: #111827;
}

.pagina {
  gap: 24px;
}

.cabecalho-pagina,
.acoes,
.sucesso-topo {
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
h3,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

h2 {
  font-size: 20px;
  font-weight: 800;
}

h3 {
  font-size: 18px;
  font-weight: 800;
}

.descricao {
  margin-top: 6px;
  color: #64748b;
}

.card,
.etapa,
.revisao article,
.sucesso-grid article,
.resumo-plano,
.dias-card {
  background: #fff;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.etapas {
  display: grid;
  grid-template-columns: repeat(5, minmax(140px, 1fr));
  gap: 12px;
}

.etapa {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #475569;
  cursor: pointer;
  font: inherit;
  font-weight: 800;
  text-align: left;
}

.etapa:disabled {
  cursor: default;
  opacity: 1;
}

.etapa span {
  display: grid;
  place-items: center;
  width: 28px;
  height: 28px;
  border-radius: 999px;
  background: #e5e7eb;
  color: #0f172a;
}

.etapa.ativa {
  border-color: #bfdbfe;
  background: #eff6ff;
  color: #1d4ed8;
}

.etapa.ativa span,
.etapa.concluida span {
  background: #2563eb;
  color: #fff;
}

.campos,
.sucesso-grid {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 7px;
  color: #334155;
  font-weight: 800;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
  background: #fff;
}

input:focus,
select:focus,
textarea:focus {
  outline: 2px solid #bfdbfe;
  border-color: #2563eb;
}

.checkbox {
  align-content: center;
  grid-template-columns: auto 1fr;
}

.checkbox input {
  width: auto;
}

.mensagem-erro {
  color: #b91c1c;
  font-size: 0.92rem;
  font-weight: 700;
}

.texto-aviso {
  color: #854d0e;
  font-weight: 700;
}

.dica {
  color: #475569;
  font-weight: 700;
}

.link-publico {
  align-self: end;
  padding: 11px 12px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
  color: #1e3a8a;
  font-weight: 800;
  word-break: break-word;
}

.dias-card,
.resumo-plano,
.sucesso-grid article {
  display: grid;
  gap: 10px;
  box-shadow: none;
}

.credencial-destaque {
  display: grid;
  gap: 6px;
  padding: 12px;
  border: 1px solid #bbf7d0;
  border-radius: 8px;
  background: rgba(255, 255, 255, 0.7);
}

.credencial-destaque span {
  font-family: 'Courier New', monospace;
  font-size: 1rem;
  font-weight: 700;
  color: #14532d;
  word-break: break-word;
}

.botao-inline {
  justify-self: start;
}

.dias-topo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.dias-grid {
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  gap: 12px;
}

.revisao {
  grid-template-columns: repeat(3, minmax(0, 1fr));
}

.revisao article {
  display: grid;
  gap: 9px;
  box-shadow: none;
}

.botao {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: #fff;
  cursor: pointer;
  font-weight: 800;
  text-decoration: none;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.65;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.neutro {
  background: #475569;
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

.sucesso-card {
  display: grid;
  gap: 18px;
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.vazio {
  color: #64748b;
}

@media (max-width: 1000px) {
  .etapas,
  .campos,
  .revisao,
  .sucesso-grid,
  .dias-grid {
    grid-template-columns: 1fr;
  }

  .campo-grande {
    grid-column: auto;
  }
}
</style>
