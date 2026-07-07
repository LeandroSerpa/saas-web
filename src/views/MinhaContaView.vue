<script setup>
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import TemaAparenciaSelector from '@/components/TemaAparenciaSelector.vue'
import {
  alterarSenhaMinhaConta,
  atualizarMinhaConta,
  buscarMinhasPreferenciasAparencia,
  buscarMinhasPreferenciasOperacionais,
  buscarMinhaConta,
  buscarOpcoesMinhasPreferenciasAparencia,
  buscarOpcoesMinhasPreferenciasOperacionais,
  resetarMinhasPreferenciasAparencia,
  resetarMinhasPreferenciasOperacionais,
  carregarUsuarioSessao,
  obterMensagemAmigavelErro,
  salvarSessaoAutenticacao,
  salvarMinhasPreferenciasAparencia,
  salvarMinhasPreferenciasOperacionais,
} from '@/services/api'
import {
  carregarPreferenciasAparenciaBackend,
  estadoSincronizacaoAparencia,
  mensagemSincronizacaoAparencia,
  obterResumoSincronizacaoAparencia,
  opcoesAparencia,
  origemOpcoesAparencia,
  origemPreferenciasAparencia,
  preferenciasAparencia,
  resetarPreferenciasAparenciaBackend,
  salvarPreferenciasAparenciaBackend,
} from '@/utils/aparencia'
import {
  carregarPreferenciasOperacionaisBackend,
  estadoSincronizacaoOperacionais,
  mensagemSincronizacaoOperacionais,
  obterResumoSincronizacaoOperacionais,
  opcoesPreferenciasOperacionais,
  origemOpcoesPreferenciasOperacionais,
  origemPreferenciasOperacionais,
  preferenciasOperacionais,
  resetarPreferenciasOperacionaisBackend,
  salvarPreferenciasOperacionaisBackend,
} from '@/utils/preferenciasOperacionais'
import { obterVersaoFrontendComPrefixo } from '@/utils/versaoAplicacao'
import { emailBasicoValido, validarLoginCurto } from '@/utils/validacoes'

const carregando = ref(true)
const salvandoDados = ref(false)
const alterandoSenha = ref(false)
const erroDados = ref('')
const erroSenha = ref('')
const sucessoDados = ref('')
const sucessoSenha = ref('')
const versaoPublica = obterVersaoFrontendComPrefixo()
const preferenciasAparenciaConta = computed(() => preferenciasAparencia.value)
const opcoesAparenciaConta = computed(() => opcoesAparencia.value)
const statusSincronizacaoAparencia = computed(() => estadoSincronizacaoAparencia.value)
const mensagemStatusSincronizacaoAparencia = computed(() => mensagemSincronizacaoAparencia.value)
const salvandoAparencia = computed(() =>
  ['carregando', 'salvando'].includes(statusSincronizacaoAparencia.value),
)
const resumoSincronizacaoAparencia = computed(() => obterResumoSincronizacaoAparencia())
const origemConfiguracaoAparencia = computed(() =>
  origemPreferenciasAparencia.value === 'backend' ? 'Backend' : 'localStorage',
)
const origemOpcoesAparenciaConta = computed(() =>
  origemOpcoesAparencia.value === 'backend' ? 'Backend' : 'fallback local',
)
const ultimaAtualizacaoAparencia = computed(() => formatarDataHoraConta(preferenciasAparenciaConta.value.atualizadoEm))
const opcoesModoNavegacaoAparencia = computed(() =>
  opcoesAparenciaConta.value.modosNavegacao.map((opcao) => ({
    valor: opcao.valor,
    titulo: opcao.nome,
  })),
)
const opcoesDensidadeInterface = computed(() =>
  opcoesAparenciaConta.value.densidadesInterface.map((opcao) => ({
    valor: opcao.valor,
    titulo: opcao.nome,
  })),
)
const exibeReducaoAnimacoes = computed(() => opcoesAparenciaConta.value.flags.reduzirAnimacoes === true)
const exibeAltoContraste = computed(() => opcoesAparenciaConta.value.flags.altoContraste === true)
const preferenciasUsoConta = computed(() => preferenciasOperacionais.value)
const opcoesPreferenciasUsoConta = computed(() => opcoesPreferenciasOperacionais.value)
const statusSincronizacaoUso = computed(() => estadoSincronizacaoOperacionais.value)
const mensagemStatusSincronizacaoUso = computed(() => mensagemSincronizacaoOperacionais.value)
const salvandoPreferenciasUso = computed(() =>
  ['carregando', 'salvando'].includes(statusSincronizacaoUso.value),
)
const resumoSincronizacaoUso = computed(() => obterResumoSincronizacaoOperacionais())
const origemConfiguracaoUso = computed(() =>
  origemPreferenciasOperacionais.value === 'backend' ? 'Backend' : 'localStorage',
)
const origemOpcoesUsoConta = computed(() =>
  origemOpcoesPreferenciasOperacionais.value === 'backend' ? 'Backend' : 'fallback local',
)
const ultimaAtualizacaoUso = computed(() => formatarDataHoraConta(preferenciasUsoConta.value.atualizadoEm))
const opcoesPaginaInicialUso = computed(() =>
  opcoesPreferenciasUsoConta.value.paginasIniciais.map((opcao) => ({
    valor: opcao.valor,
    titulo: opcao.nome,
  })),
)
const opcoesModuloPreferidoUso = computed(() =>
  opcoesPreferenciasUsoConta.value.modulosPreferidos.map((opcao) => ({
    valor: opcao.valor,
    titulo: opcao.nome,
  })),
)
const opcoesItensPorPaginaUso = computed(() =>
  opcoesPreferenciasUsoConta.value.itensPorPagina.map((opcao) => ({
    valor: opcao.valor,
    titulo: opcao.nome,
  })),
)
const dadosConta = ref({
  nome: '',
  email: '',
  login: '',
})
const senha = ref({
  atual: '',
  nova: '',
  confirmar: '',
})
onMounted(() => {
  void carregarConta()
  sincronizarPreferenciasUsoAgora()
})

async function carregarConta() {
  try {
    carregando.value = true
    erroDados.value = ''
    const resposta = await buscarMinhaConta()
    const contaNormalizada = normalizarConta(resposta)

    dadosConta.value = {
      nome: contaNormalizada.nome,
      email: contaNormalizada.email,
      login: contaNormalizada.login,
    }
  } catch (error) {
    erroDados.value = obterMensagemAmigavelErro(error, 'Não foi possível carregar os dados da sua conta.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarDados() {
  if (salvandoDados.value) {
    return
  }

  erroDados.value = ''
  sucessoDados.value = ''

  const nome = String(dadosConta.value.nome || '').trim()
  const email = String(dadosConta.value.email || '').trim()
  const login = String(dadosConta.value.login || '').trim()

  if (!nome) {
    erroDados.value = 'Informe seu nome.'
    return
  }

  if (!email) {
    erroDados.value = 'Informe seu e-mail.'
    return
  }

  if (!emailBasicoValido(email)) {
    erroDados.value = 'Informe um e-mail válido.'
    return
  }

  const erroLogin = validarLoginCurto(login)

  if (erroLogin) {
    erroDados.value = erroLogin
    return
  }

  try {
    salvandoDados.value = true

    const payload = {
      nome,
      email,
      login: login || null,
    }

    const resposta = await atualizarMinhaConta(payload)
    const contaAtualizada = normalizarConta(resposta, payload)

    dadosConta.value = {
      nome: contaAtualizada.nome,
      email: contaAtualizada.email,
      login: contaAtualizada.login,
    }

    atualizarSessaoConta(contaAtualizada)
    sucessoDados.value = 'Dados atualizados com sucesso.'
  } catch (error) {
    erroDados.value = mapearErroConta(error, 'Não foi possível atualizar os dados da sua conta.')
    console.error(error)
  } finally {
    salvandoDados.value = false
  }
}

async function salvarSenha() {
  if (alterandoSenha.value) {
    return
  }

  erroSenha.value = ''
  sucessoSenha.value = ''

  if (!senha.value.atual) {
    erroSenha.value = 'Informe a senha atual.'
    return
  }

  if (!senha.value.nova) {
    erroSenha.value = 'Informe a nova senha.'
    return
  }

  if (senha.value.nova.length < 6) {
    erroSenha.value = 'A nova senha deve ter pelo menos 6 caracteres.'
    return
  }

  if (!senha.value.confirmar) {
    erroSenha.value = 'Confirme a nova senha.'
    return
  }

  if (senha.value.nova !== senha.value.confirmar) {
    erroSenha.value = 'A confirmação da senha deve ser igual à nova senha.'
    return
  }

  try {
    alterandoSenha.value = true
    const resposta = await alterarSenhaMinhaConta(senha.value.atual, senha.value.nova)
    atualizarSessaoSenha(resposta)
    senha.value = {
      atual: '',
      nova: '',
      confirmar: '',
    }
    sucessoSenha.value = 'Senha alterada com sucesso.'
  } catch (error) {
    erroSenha.value = obterMensagemAmigavelErro(error, 'Não foi possível alterar a senha. Confira a senha atual.')
    console.error(error)
  } finally {
    alterandoSenha.value = false
  }
}

async function salvarAparencia(alteracoes = {}) {
  await salvarPreferenciasAparenciaBackend(
    {
      ...preferenciasAparencia.value,
      ...alteracoes,
    },
    salvarMinhasPreferenciasAparencia,
  )
}

function alterarTemaAparenciaConta(temaInterno) {
  void salvarAparencia({ temaInterno })
}

function alterarCampoAparencia(campo, valor) {
  void salvarAparencia({ [campo]: valor })
}

function restaurarAparenciaPadrao() {
  void resetarPreferenciasAparenciaBackend(resetarMinhasPreferenciasAparencia)
}

function sincronizarAparenciaAgora() {
  if (salvandoAparencia.value) {
    return
  }

  void carregarPreferenciasAparenciaBackend(
    buscarMinhasPreferenciasAparencia,
    buscarOpcoesMinhasPreferenciasAparencia,
  )
}

async function salvarPreferenciasUso(alteracoes = {}) {
  await salvarPreferenciasOperacionaisBackend(
    {
      ...preferenciasOperacionais.value,
      ...alteracoes,
    },
    salvarMinhasPreferenciasOperacionais,
  )
}

function alterarCampoPreferenciasUso(campo, valor) {
  void salvarPreferenciasUso({ [campo]: valor })
}

function restaurarPreferenciasUsoPadrao() {
  void resetarPreferenciasOperacionaisBackend(resetarMinhasPreferenciasOperacionais)
}

function sincronizarPreferenciasUsoAgora() {
  if (salvandoPreferenciasUso.value) {
    return
  }

  void carregarPreferenciasOperacionaisBackend(
    buscarMinhasPreferenciasOperacionais,
    buscarOpcoesMinhasPreferenciasOperacionais,
  )
}

function atualizarSessaoConta(contaAtualizada) {
  const usuarioBase = carregarUsuarioSessao() || {}

  salvarSessaoAutenticacao(
    {
      ...usuarioBase,
      nome: contaAtualizada.nome,
      email: contaAtualizada.email,
      login: contaAtualizada.login,
    },
    usuarioBase,
  )
}

function atualizarSessaoSenha(resposta) {
  const usuarioBase = carregarUsuarioSessao() || {}
  const dadosResposta = resposta && typeof resposta === 'object' ? resposta : {}

  salvarSessaoAutenticacao(
    {
      ...usuarioBase,
      ...dadosResposta,
      trocaSenhaObrigatoria: false,
    },
    usuarioBase,
  )
}

function normalizarConta(resposta, fallback = {}) {
  const origem = resposta && typeof resposta === 'object' ? resposta : {}
  const data = origem.data && typeof origem.data === 'object' ? origem.data : {}
  const usuario = origem.usuario && typeof origem.usuario === 'object' ? origem.usuario : {}

  return {
    nome: textoNormalizado(origem.nome, data.nome, usuario.nome, fallback.nome),
    email: textoNormalizado(origem.email, data.email, usuario.email, fallback.email),
    login: textoNormalizado(
      origem.login,
      origem.usuarioLogin,
      data.login,
      data.usuarioLogin,
      usuario.login,
      usuario.usuarioLogin,
      fallback.login,
    ),
  }
}

function textoNormalizado(...valores) {
  for (const valor of valores) {
    if (valor === undefined || valor === null) {
      continue
    }

    const texto = String(valor).trim()
    if (texto) {
      return texto
    }
  }

  return ''
}

function mapearErroConta(error, fallback) {
  const mensagem = obterMensagemAmigavelErro(error, fallback)
  const texto = normalizarMensagem(mensagem)

  if (texto.includes('email') && (texto.includes('duplic') || texto.includes('ja existe'))) {
    return 'Este e-mail já está em uso por outra conta.'
  }

  if (texto.includes('login') && (texto.includes('duplic') || texto.includes('ja existe'))) {
    return 'Este usuário/login já está em uso por outra conta.'
  }

  return mensagem
}

function normalizarMensagem(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function formatarDataHoraConta(valor) {
  const texto = String(valor || '').trim()

  if (!texto) {
    return ''
  }

  const data = new Date(texto)

  if (Number.isNaN(data.getTime())) {
    return texto
  }

  return new Intl.DateTimeFormat('pt-BR', {
    dateStyle: 'short',
    timeStyle: 'short',
  }).format(data)
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Conta</p>
        <h1>Minha conta</h1>
        <p class="descricao">Atualize seus dados de acesso e senha.</p>
      </div>
    </header>

    <section v-if="carregando" class="card">
      <p>Carregando dados da conta...</p>
    </section>

    <template v-else>
      <section v-if="erroDados" class="card erro">
        <p>{{ erroDados }}</p>
      </section>

      <section v-if="sucessoDados" class="card sucesso">
        <p>{{ sucessoDados }}</p>
      </section>

      <form class="card formulario" @submit.prevent="salvarDados">
        <div class="titulo-card">
          <h2>Dados da conta</h2>
          <p>Você pode usar e-mail ou usuário/login para entrar no sistema.</p>
        </div>

        <div class="campos">
          <label>
            Nome
            <input v-model="dadosConta.nome" type="text" placeholder="Seu nome" />
          </label>

          <label>
            E-mail
            <input v-model="dadosConta.email" type="text" inputmode="email" placeholder="seuemail@empresa.com" />
          </label>

          <label>
            Usuário/Login
            <input v-model="dadosConta.login" type="text" placeholder="Ex: joao, maria.silva" />
          </label>
        </div>

        <div class="acoes">
          <button class="botao principal" type="submit" :disabled="salvandoDados">
            {{ salvandoDados ? 'Salvando...' : 'Salvar dados' }}
          </button>
        </div>
      </form>

      <section class="card formulario aparencia-card">
        <div class="titulo-card">
          <h2>Aparência</h2>
          <p>Quando sincronizada, sua preferência acompanha seu usuário em outros navegadores.</p>
        </div>

        <div class="aparencia-sincronizacao" :class="`aparencia-sincronizacao--${resumoSincronizacaoAparencia.tipo}`">
          <div>
            <strong>{{ resumoSincronizacaoAparencia.rotulo }}</strong>
            <p>{{ resumoSincronizacaoAparencia.detalhe }}</p>
          </div>
          <dl>
            <div>
              <dt>Origem</dt>
              <dd>{{ origemConfiguracaoAparencia }}</dd>
            </div>
            <div>
              <dt>Opções</dt>
              <dd>{{ origemOpcoesAparenciaConta }}</dd>
            </div>
            <div v-if="ultimaAtualizacaoAparencia">
              <dt>Última atualização</dt>
              <dd>{{ ultimaAtualizacaoAparencia }}</dd>
            </div>
          </dl>
        </div>

        <div class="campos aparencia-campos">
          <div class="campo-aparencia campo-aparencia-tema">
            <span class="campo-label">Tema interno</span>
            <TemaAparenciaSelector
              :tema="preferenciasAparenciaConta.temaInterno"
              :status-sincronizacao="statusSincronizacaoAparencia"
              :mensagem-sincronizacao="mensagemStatusSincronizacaoAparencia"
              @update:tema="alterarTemaAparenciaConta"
            />
          </div>

          <label>
            Modo de navegação
            <select
              :value="preferenciasAparenciaConta.modoNavegacao"
              :disabled="salvandoAparencia"
              @change="alterarCampoAparencia('modoNavegacao', $event.target.value)"
            >
              <option v-for="opcao in opcoesModoNavegacaoAparencia" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.titulo }}
              </option>
            </select>
          </label>

          <label>
            Densidade
            <select
              :value="preferenciasAparenciaConta.densidadeInterface"
              :disabled="salvandoAparencia"
              @change="alterarCampoAparencia('densidadeInterface', $event.target.value)"
            >
              <option v-for="opcao in opcoesDensidadeInterface" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.titulo }}
              </option>
            </select>
          </label>

          <label v-if="exibeReducaoAnimacoes" class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasAparenciaConta.reduzirAnimacoes"
              :disabled="salvandoAparencia"
              @change="alterarCampoAparencia('reduzirAnimacoes', $event.target.checked)"
            />
            <span>Reduzir animações</span>
          </label>

          <label v-if="exibeAltoContraste" class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasAparenciaConta.altoContraste"
              :disabled="salvandoAparencia"
              @change="alterarCampoAparencia('altoContraste', $event.target.checked)"
            />
            <span>Alto contraste</span>
          </label>
        </div>

        <div class="rodape-aparencia">
          <p
            v-if="mensagemStatusSincronizacaoAparencia"
            class="status-aparencia"
            :class="`status-aparencia--${statusSincronizacaoAparencia}`"
          >
            {{ mensagemStatusSincronizacaoAparencia }}
          </p>

          <button class="botao secundario" type="button" :disabled="salvandoAparencia" @click="sincronizarAparenciaAgora">
            Sincronizar agora
          </button>

          <button class="botao secundario" type="button" :disabled="salvandoAparencia" @click="restaurarAparenciaPadrao">
            Restaurar padrão
          </button>
        </div>
      </section>

      <section class="card formulario preferencias-uso-card">
        <div class="titulo-card">
          <h2>Preferências de uso</h2>
          <p>Essas escolhas ficam salvas para sua conta, sem alterar a navegação automaticamente nesta fase.</p>
        </div>

        <div class="aparencia-sincronizacao" :class="`aparencia-sincronizacao--${resumoSincronizacaoUso.tipo}`">
          <div>
            <strong>{{ resumoSincronizacaoUso.rotulo }}</strong>
            <p>{{ resumoSincronizacaoUso.detalhe }}</p>
          </div>
          <dl>
            <div>
              <dt>Origem</dt>
              <dd>{{ origemConfiguracaoUso }}</dd>
            </div>
            <div>
              <dt>Opções</dt>
              <dd>{{ origemOpcoesUsoConta }}</dd>
            </div>
            <div v-if="ultimaAtualizacaoUso">
              <dt>Última atualização</dt>
              <dd>{{ ultimaAtualizacaoUso }}</dd>
            </div>
          </dl>
        </div>

        <div class="campos aparencia-campos">
          <label>
            Página inicial preferida
            <select
              :value="preferenciasUsoConta.paginaInicial"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('paginaInicial', $event.target.value)"
            >
              <option v-for="opcao in opcoesPaginaInicialUso" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.titulo }}
              </option>
            </select>
          </label>

          <label>
            Módulo preferido
            <select
              :value="preferenciasUsoConta.moduloPreferido"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('moduloPreferido', $event.target.value)"
            >
              <option v-for="opcao in opcoesModuloPreferidoUso" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.titulo }}
              </option>
            </select>
          </label>

          <label>
            Itens por página
            <select
              :value="preferenciasUsoConta.itensPorPagina"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('itensPorPagina', Number($event.target.value))"
            >
              <option v-for="opcao in opcoesItensPorPaginaUso" :key="opcao.valor" :value="opcao.valor">
                {{ opcao.titulo }}
              </option>
            </select>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.mostrarResumoInicial"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('mostrarResumoInicial', $event.target.checked)"
            />
            <span>Mostrar resumo inicial</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.mostrarDicas"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('mostrarDicas', $event.target.checked)"
            />
            <span>Mostrar dicas de uso</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.confirmarAcoesCriticas"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('confirmarAcoesCriticas', $event.target.checked)"
            />
            <span>Confirmar ações críticas</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.notificacoesInternasAtivas"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('notificacoesInternasAtivas', $event.target.checked)"
            />
            <span>Notificações internas ativas</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.alertasAgendamento"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('alertasAgendamento', $event.target.checked)"
            />
            <span>Alertas de agendamento</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.alertasFinanceiro"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('alertasFinanceiro', $event.target.checked)"
            />
            <span>Alertas financeiros</span>
          </label>

          <label class="campo-checkbox">
            <input
              type="checkbox"
              :checked="preferenciasUsoConta.alertasSistema"
              :disabled="salvandoPreferenciasUso"
              @change="alterarCampoPreferenciasUso('alertasSistema', $event.target.checked)"
            />
            <span>Alertas do sistema</span>
          </label>
        </div>

        <div class="rodape-aparencia">
          <p
            v-if="mensagemStatusSincronizacaoUso"
            class="status-aparencia"
            :class="`status-aparencia--${statusSincronizacaoUso}`"
          >
            {{ mensagemStatusSincronizacaoUso }}
          </p>

          <button
            class="botao secundario"
            type="button"
            :disabled="salvandoPreferenciasUso"
            @click="sincronizarPreferenciasUsoAgora"
          >
            Sincronizar agora
          </button>

          <button
            class="botao secundario"
            type="button"
            :disabled="salvandoPreferenciasUso"
            @click="restaurarPreferenciasUsoPadrao"
          >
            Restaurar padrão
          </button>
        </div>
      </section>

      <section v-if="erroSenha" class="card erro">
        <p>{{ erroSenha }}</p>
      </section>

      <section v-if="sucessoSenha" class="card sucesso">
        <p>{{ sucessoSenha }}</p>
      </section>

      <form class="card formulario" @submit.prevent="salvarSenha">
        <div class="titulo-card">
          <h2>Alterar senha</h2>
          <p>Informe sua senha atual e defina uma nova senha de acesso.</p>
        </div>

        <div class="campos">
          <label>
            Senha atual
            <input v-model="senha.atual" type="password" autocomplete="current-password" />
          </label>

          <label>
            Nova senha
            <input v-model="senha.nova" type="password" autocomplete="new-password" />
          </label>

          <label>
            Confirmar nova senha
            <input v-model="senha.confirmar" type="password" autocomplete="new-password" />
          </label>
        </div>

        <div class="acoes">
          <button class="botao principal" type="submit" :disabled="alterandoSenha">
            {{ alterandoSenha ? 'Alterando...' : 'Alterar senha' }}
          </button>
        </div>
      </form>

      <section class="card versao-publica">
        <div class="titulo-card">
          <h2>Versão do sistema</h2>
          <p>Consulte a versão atual e o histórico de atualizações na Ajuda.</p>
        </div>

        <p class="versao-destaque">Versão {{ versaoPublica }}</p>

        <RouterLink class="link-versao-ajuda" to="/ajuda#versao-novidades">
          Ver novidades e histórico
        </RouterLink>
      </section>
    </template>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 18px;
  color: var(--app-text);
}

.cabecalho-pagina {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.subtitulo {
  margin: 0 0 4px;
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
}

.descricao {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.card {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 22px;
  box-shadow: var(--app-shadow);
}

.erro {
  border-color: var(--app-danger);
  background: var(--app-danger-soft);
  color: var(--app-danger);
}

.sucesso {
  border-color: var(--app-success);
  background: var(--app-success-soft);
  color: var(--app-success);
}

.formulario {
  display: grid;
  gap: 16px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
}

.titulo-card p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.campos label:last-child {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 6px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

input,
select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: var(--app-surface);
  color: var(--app-text);
  box-sizing: border-box;
}

input:focus,
select:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  font-weight: 800;
  cursor: pointer;
}

.botao:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.principal {
  background: var(--app-primary);
}

.principal:hover {
  background: var(--app-primary-strong);
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

.versao-publica {
  display: grid;
  gap: 12px;
}

.versao-destaque {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
  font-weight: 800;
}

.link-versao-ajuda {
  width: fit-content;
  color: var(--app-primary);
  font-size: 14px;
  font-weight: 800;
  text-decoration: none;
}

.link-versao-ajuda:hover {
  text-decoration: underline;
}

.aparencia-card {
  align-items: start;
}

.aparencia-campos {
  align-items: end;
}

.aparencia-sincronizacao {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.aparencia-sincronizacao strong {
  display: block;
  color: var(--app-text);
  font-size: 14px;
}

.aparencia-sincronizacao p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.aparencia-sincronizacao dl {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin: 0;
}

.aparencia-sincronizacao dt {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.aparencia-sincronizacao dd {
  margin: 2px 0 0;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
}

.aparencia-sincronizacao--erro {
  border-color: var(--app-warning);
}

.aparencia-sincronizacao--sucesso {
  border-color: var(--app-success);
}

.campo-aparencia {
  display: grid;
  gap: 6px;
}

.campo-aparencia-tema {
  grid-column: 1 / -1;
  justify-items: start;
}

.campo-label {
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.campo-checkbox {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  align-self: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.campo-checkbox input {
  width: 18px;
  height: 18px;
  min-width: 18px;
  padding: 0;
  accent-color: var(--app-primary);
}

.rodape-aparencia {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
}

.status-aparencia {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 800;
}

.status-aparencia--erro {
  color: var(--app-warning);
}

.status-aparencia--salvo {
  color: var(--app-success);
}

@media (max-width: 900px) {
  .campos {
    grid-template-columns: 1fr;
  }

  .campos label:last-child {
    grid-column: auto;
  }

  .botao {
    width: 100%;
  }

  .rodape-aparencia {
    align-items: stretch;
  }

  .aparencia-sincronizacao {
    grid-template-columns: 1fr;
  }

  .aparencia-sincronizacao dl {
    justify-content: flex-start;
  }

  .status-aparencia {
    width: 100%;
  }
}
</style>
