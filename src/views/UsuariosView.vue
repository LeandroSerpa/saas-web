<script setup>
import { computed, onMounted, ref } from 'vue'
import UsuarioForm from '@/components/UsuarioForm.vue'
import {
  buscarUsuarios,
  buscarEmpresas,
  cadastrarUsuario,
  atualizarUsuario,
  atualizarAtivoUsuario,
  obterMensagemAmigavelErro,
} from '@/services/api'
import { OPCOES_TAMANHO_PAGINA, criarPaginacaoInicial, normalizarRespostaPaginada } from '@/utils/paginacao'
import { validarLoginCurto } from '@/utils/validacoes'

const usuarios = ref([])
const empresas = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoUsuario = ref('')
const mensagemSucessoStatus = ref('')
const atualizandoId = ref(null)
const usuarioEditandoId = ref(null)
const editandoUsuarioAtual = ref(false)
const perfilOriginalEdicao = ref('')
const paginacao = ref(criarPaginacaoInicial())
const opcoesTamanhoPagina = OPCOES_TAMANHO_PAGINA

const usuarioLogado = computed(() => obterUsuarioLogado())
const perfilLogado = computed(() => usuarioLogado.value?.perfil || '')
const superAdminLogado = computed(() => perfilLogado.value === 'SUPER_ADMIN')
const adminLogado = computed(() => perfilLogado.value === 'ADMIN')
const perfisPermitidos = computed(() =>
  superAdminLogado.value ? ['SUPER_ADMIN', 'ADMIN', 'USUARIO'] : ['USUARIO'],
)
const paginaAtualHumana = computed(() => paginacao.value.page + 1)
const podeIrParaAnterior = computed(() => !paginacao.value.first && paginacao.value.page > 0)
const podeIrParaProxima = computed(() => !paginacao.value.last && paginaAtualHumana.value < paginacao.value.totalPages)
const usuario = ref(criarUsuarioInicial())

function criarUsuarioInicial() {
  return {
    nome: '',
    email: '',
    login: '',
    senha: '',
    perfil: 'USUARIO',
    empresaId: superAdminLogado.value ? '' : obterEmpresaId(),
    ativo: true,
  }
}

function obterEmpresaId() {
  return obterUsuarioLogado()?.empresaId || 1
}

function obterUsuarioLogado() {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (!usuarioSalvo) {
    return null
  }

  try {
    return JSON.parse(usuarioSalvo)
  } catch (error) {
    console.error(error)
    return null
  }
}

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''

    let respostaUsuarios

    if (superAdminLogado.value) {
      const [usuariosApi, empresasApi] = await Promise.all([
        buscarUsuarios({
          page: paginacao.value.page,
          size: paginacao.value.size,
        }),
        buscarEmpresas(),
      ])
      respostaUsuarios = usuariosApi
      empresas.value = empresasApi
    } else {
      respostaUsuarios = await buscarUsuarios({
        page: paginacao.value.page,
        size: paginacao.value.size,
      })
    }

    const dadosPaginados = normalizarRespostaPaginada(respostaUsuarios, paginacao.value)
    usuarios.value = dadosPaginados.content
    paginacao.value = {
      page: dadosPaginados.page,
      size: dadosPaginados.size,
      totalElements: dadosPaginados.totalElements,
      totalPages: dadosPaginados.totalPages,
      first: dadosPaginados.first,
      last: dadosPaginados.last,
      numberOfElements: dadosPaginados.numberOfElements,
    }

    if (
      dadosPaginados.paginada &&
      dadosPaginados.page > 0 &&
      dadosPaginados.content.length === 0 &&
      dadosPaginados.totalElements > 0
    ) {
      const ultimaPaginaValida = Math.max(dadosPaginados.totalPages - 1, 0)

      if (ultimaPaginaValida !== dadosPaginados.page) {
        paginacao.value.page = ultimaPaginaValida
        await carregarDados()
      }
    }
  } catch (error) {
    erro.value = 'Não foi possível carregar os usuários.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarUsuario() {
  try {
    erro.value = ''
    mensagemSucessoUsuario.value = ''
    mensagemSucessoStatus.value = ''

    if (!usuario.value.nome.trim()) {
      erro.value = 'Informe o nome do usuário.'
      return
    }

    if (!usuario.value.email.trim()) {
      erro.value = 'Informe o e-mail do usuário.'
      return
    }

    const erroLogin = validarLoginCurto(usuario.value.login)

    if (erroLogin) {
      erro.value = erroLogin
      return
    }

    if (!usuarioEditandoId.value && !usuario.value.senha) {
      erro.value = 'Informe a senha do usuário.'
      return
    }

    if (usuarioEditandoId.value && !podeEditarUsuario({ id: usuarioEditandoId.value, perfil: perfilOriginalEdicao.value })) {
      erro.value = 'Você não tem permissão para editar este usuário.'
      return
    }

    if (!usuarioEditandoId.value && adminLogado.value && usuario.value.perfil !== 'USUARIO') {
      erro.value = 'Administradores podem cadastrar apenas usuários com perfil USUARIO.'
      return
    }

    if (superAdminLogado.value && !usuario.value.empresaId) {
      erro.value = 'Selecione a empresa do usuário.'
      return
    }

    const dadosUsuario = {
      empresaId: superAdminLogado.value ? Number(usuario.value.empresaId) : obterEmpresaId(),
      nome: usuario.value.nome,
      email: usuario.value.email,
      perfil: usuario.value.perfil,
      ativo: Boolean(usuario.value.ativo),
    }
    const loginNormalizado = String(usuario.value.login || '').trim()

    if (editandoUsuarioAtual.value) {
      dadosUsuario.perfil = perfilOriginalEdicao.value || perfilLogado.value
      dadosUsuario.ativo = true
    } else if (adminLogado.value) {
      dadosUsuario.perfil = 'USUARIO'
    }

    if (loginNormalizado) {
      dadosUsuario.login = loginNormalizado
    } else if (usuarioEditandoId.value) {
      dadosUsuario.login = null
    }

    if (usuario.value.senha) {
      dadosUsuario.senha = usuario.value.senha
    }

    if (usuarioEditandoId.value) {
      await atualizarUsuario(usuarioEditandoId.value, dadosUsuario)
      mensagemSucessoUsuario.value = 'Usuário atualizado com sucesso.'
    } else {
      await cadastrarUsuario(dadosUsuario)
      mensagemSucessoUsuario.value = 'Usuário cadastrado com sucesso.'
    }

    cancelarEdicaoUsuario(false)

    await carregarDados()
  } catch (error) {
    erro.value = obterMensagemErroUsuario(
      error,
      usuarioEditandoId.value ? 'Não foi possível atualizar o usuário.' : 'Não foi possível cadastrar o usuário.',
    )
    console.error(error)
  }
}

function editarUsuario(usuarioItem) {
  erro.value = ''
  mensagemSucessoUsuario.value = ''
  mensagemSucessoStatus.value = ''
  usuarioEditandoId.value = usuarioItem.id
  editandoUsuarioAtual.value = usuarioAtual(usuarioItem)
  perfilOriginalEdicao.value = usuarioItem.perfil || 'USUARIO'
  usuario.value = {
    nome: usuarioItem.nome || '',
    email: usuarioItem.email || '',
    login: usuarioItem.login || '',
    senha: '',
    perfil: usuarioItem.perfil || 'USUARIO',
    empresaId: usuarioItem.empresaId || buscarEmpresaIdPorNome(usuarioItem.empresaNome) || '',
    ativo: estaAtivo(usuarioItem),
  }
}

function cancelarEdicaoUsuario(limparMensagens = true) {
  usuarioEditandoId.value = null
  editandoUsuarioAtual.value = false
  perfilOriginalEdicao.value = ''
  usuario.value = criarUsuarioInicial()

  if (limparMensagens) {
    mensagemSucessoUsuario.value = ''
  }
}

async function alternarAtivoUsuario(usuarioItem) {
  try {
    if (usuarioAtual(usuarioItem)) {
      erro.value = 'O usuário atual não pode ser desativado.'
      return
    }

    if (!podeAlterarAtivoUsuario(usuarioItem)) {
      erro.value = 'Você não tem permissão para alterar o status deste usuário.'
      return
    }

    atualizandoId.value = usuarioItem.id
    erro.value = ''
    mensagemSucessoUsuario.value = ''
    mensagemSucessoStatus.value = ''

    await atualizarAtivoUsuario(usuarioItem.id, !estaAtivo(usuarioItem))
    await carregarDados()

    mensagemSucessoStatus.value = estaAtivo(usuarioItem)
      ? 'Usuário desativado com sucesso.'
      : 'Usuário ativado com sucesso.'
  } catch (error) {
    erro.value = 'Não foi possível atualizar o status do usuário.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function estaAtivo(usuarioItem) {
  return usuarioItem.ativo !== false
}

function podeEditarUsuario(usuarioItem) {
  if (superAdminLogado.value) {
    return true
  }

  if (adminLogado.value) {
    return usuarioAtual(usuarioItem) || usuarioItem.perfil === 'USUARIO'
  }

  return false
}

function podeAlterarAtivoUsuario(usuarioItem) {
  if (usuarioAtual(usuarioItem)) {
    return false
  }

  if (superAdminLogado.value) {
    return true
  }

  if (adminLogado.value) {
    return usuarioItem.perfil === 'USUARIO'
  }

  return false
}

function usuarioAtual(usuarioItem) {
  const usuarioLogado = obterUsuarioLogado()

  if (!usuarioLogado) {
    return false
  }

  if (usuarioLogado.id && usuarioItem.id) {
    return Number(usuarioLogado.id) === Number(usuarioItem.id)
  }

  return (
    (usuarioLogado.email && usuarioLogado.email === usuarioItem.email) ||
    (usuarioLogado.login && usuarioItem.login && usuarioLogado.login === usuarioItem.login)
  )
}

function exibirValor(valor) {
  return valor || '-'
}

function exibirIdentificacao(usuarioItem) {
  return usuarioItem.login ? `@${usuarioItem.login}` : exibirValor(usuarioItem.email)
}

function obterMensagemErroUsuario(error, fallback) {
  const mensagem = obterMensagemAmigavelErro(error, fallback)
  const mensagemNormalizada = normalizarMensagem(mensagem)

  if (
    mensagemNormalizada.includes('login') &&
    (mensagemNormalizada.includes('duplic') || mensagemNormalizada.includes('ja existe'))
  ) {
    return 'Este usuário/login já está em uso. Informe outro login.'
  }

  if (
    mensagemNormalizada.includes('email') &&
    (mensagemNormalizada.includes('duplic') || mensagemNormalizada.includes('ja existe'))
  ) {
    return 'Este e-mail já está em uso. Informe outro e-mail.'
  }

  return mensagem
}

function normalizarMensagem(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
}

function buscarEmpresaIdPorNome(nome) {
  const nomeNormalizado = normalizarTexto(nome)
  const empresa = empresas.value.find((empresaItem) => normalizarTexto(empresaItem.nome) === nomeNormalizado)

  return empresa?.id || ''
}

function normalizarTexto(valor) {
  return String(valor || '')
    .trim()
    .toLowerCase()
}

async function irParaPaginaAnterior() {
  if (!podeIrParaAnterior.value || carregando.value) {
    return
  }

  paginacao.value.page = Math.max(paginacao.value.page - 1, 0)
  await carregarDados()
}

async function irParaProximaPagina() {
  if (!podeIrParaProxima.value || carregando.value) {
    return
  }

  paginacao.value.page += 1
  await carregarDados()
}

async function alterarTamanhoPagina() {
  paginacao.value.page = 0
  await carregarDados()
}

onMounted(() => {
  carregarDados()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração</p>
        <h1>Usuários</h1>
        <p class="descricao">Gerencie usuários com acesso ao sistema.</p>
      </div>

      <button class="botao secundario" @click="carregarDados">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucessoStatus" class="card sucesso-card">
      <p>{{ mensagemSucessoStatus }}</p>
    </section>

    <UsuarioForm
      v-model="usuario"
      :mensagem-sucesso="mensagemSucessoUsuario"
      :modo-edicao="Boolean(usuarioEditandoId)"
      :bloquear-perfil="editandoUsuarioAtual"
      :bloquear-ativo="editandoUsuarioAtual"
      :perfis="perfisPermitidos"
      :empresas="empresas"
      :mostrar-empresa="superAdminLogado"
      @salvar="salvarUsuario"
      @cancelar="cancelarEdicaoUsuario"
    />

    <section class="secao-usuarios">
      <div class="cabecalho-lista">
        <div>
          <h2>Usuários cadastrados</h2>
          <p>Usuários cadastrados com acesso ao sistema.</p>
        </div>

        <span class="contador">{{ paginacao.totalElements }} usuário(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando usuários...</p>
      </section>

      <section v-else-if="usuarios.length === 0" class="card">
        <p>Nenhum usuário encontrado.</p>
      </section>

      <section v-else class="lista-usuarios">
        <article v-for="usuarioItem in usuarios" :key="usuarioItem.id" class="card usuario-card">
          <div class="topo-card">
            <div>
              <h3>{{ usuarioItem.nome }}</h3>
              <p class="email">{{ exibirIdentificacao(usuarioItem) }}</p>
            </div>

            <span :class="['status', estaAtivo(usuarioItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(usuarioItem) ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>E-mail:</strong> {{ exibirValor(usuarioItem.email) }}</p>
            <p><strong>Usuário/Login:</strong> {{ exibirValor(usuarioItem.login) }}</p>
            <p><strong>Perfil:</strong> {{ exibirValor(usuarioItem.perfil) }}</p>
            <p>
              <strong>Empresa:</strong>
              {{ exibirValor(usuarioItem.empresaNome) }}
            </p>
            <p v-if="usuarioAtual(usuarioItem)" class="usuario-atual">Usuário atual</p>
          </div>

          <div class="acoes">
            <button
              v-if="podeEditarUsuario(usuarioItem)"
              class="botao secundario"
              @click="editarUsuario(usuarioItem)"
            >
              Editar
            </button>

            <button
              v-if="podeAlterarAtivoUsuario(usuarioItem)"
              :class="['botao', estaAtivo(usuarioItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === usuarioItem.id"
              @click="alternarAtivoUsuario(usuarioItem)"
            >
              {{ estaAtivo(usuarioItem) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>

          <p v-if="atualizandoId === usuarioItem.id" class="atualizando">
            Atualizando usuário...
          </p>
        </article>
      </section>

      <section v-if="!carregando" class="card paginacao">
        <p class="resumo-paginacao">
          {{ paginacao.totalElements }} registro(s) - Página {{ paginaAtualHumana }} de {{ paginacao.totalPages }}
        </p>

        <label class="tamanho-pagina">
          Registros por página
          <select v-model.number="paginacao.size" :disabled="carregando" @change="alterarTamanhoPagina">
            <option v-for="opcao in opcoesTamanhoPagina" :key="opcao" :value="opcao">
              {{ opcao }}
            </option>
          </select>
        </label>

        <div class="botoes-paginacao">
          <button class="botao secundario" :disabled="!podeIrParaAnterior || carregando" @click="irParaPaginaAnterior">
            Anterior
          </button>
          <button class="botao secundario" :disabled="!podeIrParaProxima || carregando" @click="irParaProximaPagina">
            Próxima
          </button>
        </div>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.topo-card {
  align-items: flex-start;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.descricao,
.cabecalho-lista p {
  margin: 6px 0 0;
  color: #64748b;
}

.secao-usuarios {
  display: grid;
  gap: 16px;
}

.cabecalho-lista h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

.contador {
  background: #dbeafe;
  color: #1d4ed8;
  padding: 8px 12px;
  border-radius: 999px;
  font-weight: 800;
  font-size: 14px;
  white-space: nowrap;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.lista-usuarios {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.usuario-card {
  display: grid;
  gap: 14px;
}

.usuario-card h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.email {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
  word-break: break-word;
}

.detalhes p {
  margin: 6px 0;
  color: #374151;
  word-break: break-word;
}

.detalhes strong {
  font-weight: 800;
}

.usuario-atual {
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
}

.acoes {
  display: flex;
  gap: 10px;
  flex-wrap: wrap;
}

.paginacao {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.resumo-paginacao {
  margin: 0;
  color: #475569;
  font-weight: 700;
}

.tamanho-pagina {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #374151;
  font-weight: 700;
}

.tamanho-pagina select {
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 8px 10px;
  font-size: 14px;
  background: white;
}

.botoes-paginacao {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.status {
  padding: 7px 11px;
  border-radius: 999px;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  white-space: nowrap;
}

.status.ativo {
  background: #dcfce7;
  color: #15803d;
}

.status.inativo {
  background: #fee2e2;
  color: #b91c1c;
}

.botao,
:deep(.botao) {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover,
:deep(.botao:hover) {
  transform: translateY(-1px);
}

.botao:disabled,
:deep(.botao:disabled) {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.secundario,
:deep(.secundario) {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover,
:deep(.secundario:hover) {
  background: #1e293b;
}

:deep(.principal) {
  background: #2563eb;
}

:deep(.principal:hover) {
  background: #1d4ed8;
}

.sucesso {
  background: #16a34a;
}

.sucesso:hover {
  background: #15803d;
}

.perigo {
  background: #dc2626;
}

.perigo:hover {
  background: #b91c1c;
}

:deep(.formulario) {
  display: grid;
  gap: 16px;
}

:deep(.titulo-card h2) {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

:deep(.titulo-card p) {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.campos) {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

:deep(label) {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

:deep(input),
:deep(select) {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

:deep(input:focus),
:deep(select:focus) {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

:deep(input[type='checkbox']) {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

:deep(.campo-checkbox) {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

:deep(.rodape-formulario) {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.atualizando {
  margin: 0;
  color: #64748b;
  font-size: 14px;
}

:deep(.sucesso-texto) {
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista {
    flex-direction: column;
    align-items: flex-start;
  }

  .topo-card {
    align-items: flex-start;
  }

  .lista-usuarios,
  :deep(.campos) {
    grid-template-columns: 1fr;
  }
}
</style>
