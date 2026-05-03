<script setup>
import { onMounted, ref } from 'vue'
import UsuarioForm from '@/components/UsuarioForm.vue'
import {
  buscarUsuarios,
  cadastrarUsuario,
  atualizarUsuario,
  atualizarAtivoUsuario,
} from '@/services/api'

const usuarios = ref([])
const carregando = ref(true)
const erro = ref('')
const mensagemSucessoUsuario = ref('')
const mensagemSucessoStatus = ref('')
const atualizandoId = ref(null)
const usuarioEditandoId = ref(null)

const usuario = ref(criarUsuarioInicial())

function criarUsuarioInicial() {
  return {
    nome: '',
    email: '',
    senha: '',
    perfil: 'USUARIO',
    ativo: true,
  }
}

function obterEmpresaId() {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (!usuarioSalvo) {
    return 1
  }

  try {
    return JSON.parse(usuarioSalvo).empresaId || 1
  } catch (error) {
    console.error(error)
    return 1
  }
}

async function carregarUsuarios() {
  try {
    carregando.value = true
    erro.value = ''

    usuarios.value = await buscarUsuarios()
  } catch (error) {
    erro.value = 'Nao foi possivel carregar os usuarios.'
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
      erro.value = 'Informe o nome do usuario.'
      return
    }

    if (!usuario.value.email.trim()) {
      erro.value = 'Informe o e-mail do usuario.'
      return
    }

    if (!usuarioEditandoId.value && !usuario.value.senha) {
      erro.value = 'Informe a senha do usuario.'
      return
    }

    const dadosUsuario = {
      empresaId: obterEmpresaId(),
      nome: usuario.value.nome,
      email: usuario.value.email,
      perfil: usuario.value.perfil,
      ativo: Boolean(usuario.value.ativo),
    }

    if (usuario.value.senha) {
      dadosUsuario.senha = usuario.value.senha
    }

    if (usuarioEditandoId.value) {
      await atualizarUsuario(usuarioEditandoId.value, dadosUsuario)
      mensagemSucessoUsuario.value = 'Usuario atualizado com sucesso.'
    } else {
      await cadastrarUsuario(dadosUsuario)
      mensagemSucessoUsuario.value = 'Usuario cadastrado com sucesso.'
    }

    cancelarEdicaoUsuario(false)

    await carregarUsuarios()
  } catch (error) {
    erro.value = usuarioEditandoId.value
      ? 'Nao foi possivel atualizar o usuario.'
      : 'Nao foi possivel cadastrar o usuario.'
    console.error(error)
  }
}

function editarUsuario(usuarioItem) {
  erro.value = ''
  mensagemSucessoUsuario.value = ''
  mensagemSucessoStatus.value = ''
  usuarioEditandoId.value = usuarioItem.id
  usuario.value = {
    nome: usuarioItem.nome || '',
    email: usuarioItem.email || '',
    senha: '',
    perfil: usuarioItem.perfil || 'USUARIO',
    ativo: estaAtivo(usuarioItem),
  }
}

function cancelarEdicaoUsuario(limparMensagens = true) {
  usuarioEditandoId.value = null
  usuario.value = criarUsuarioInicial()

  if (limparMensagens) {
    mensagemSucessoUsuario.value = ''
  }
}

async function alternarAtivoUsuario(usuarioItem) {
  try {
    atualizandoId.value = usuarioItem.id
    erro.value = ''
    mensagemSucessoUsuario.value = ''
    mensagemSucessoStatus.value = ''

    await atualizarAtivoUsuario(usuarioItem.id, !estaAtivo(usuarioItem))
    await carregarUsuarios()

    mensagemSucessoStatus.value = estaAtivo(usuarioItem)
      ? 'Usuario desativado com sucesso.'
      : 'Usuario ativado com sucesso.'
  } catch (error) {
    erro.value = 'Nao foi possivel atualizar o status do usuario.'
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function estaAtivo(usuarioItem) {
  return usuarioItem.ativo !== false
}

function exibirValor(valor) {
  return valor || '-'
}

onMounted(() => {
  carregarUsuarios()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administracao</p>
        <h1>Usuarios</h1>
        <p class="descricao">Gerencie usuarios com acesso ao sistema.</p>
      </div>

      <button class="botao secundario" @click="carregarUsuarios">Atualizar dados</button>
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
      @salvar="salvarUsuario"
      @cancelar="cancelarEdicaoUsuario"
    />

    <section class="secao-usuarios">
      <div class="cabecalho-lista">
        <div>
          <h2>Usuarios cadastrados</h2>
          <p>Lista de usuarios administrativos retornados pela API.</p>
        </div>

        <span class="contador">{{ usuarios.length }} usuario(s)</span>
      </div>

      <section v-if="carregando" class="card">
        <p>Carregando usuarios...</p>
      </section>

      <section v-else-if="usuarios.length === 0" class="card">
        <p>Nenhum usuario encontrado.</p>
      </section>

      <section v-else class="lista-usuarios">
        <article v-for="usuarioItem in usuarios" :key="usuarioItem.id" class="card usuario-card">
          <div class="topo-card">
            <div>
              <h3>{{ usuarioItem.nome }}</h3>
              <p class="email">{{ exibirValor(usuarioItem.email) }}</p>
            </div>

            <span :class="['status', estaAtivo(usuarioItem) ? 'ativo' : 'inativo']">
              {{ estaAtivo(usuarioItem) ? 'Ativo' : 'Inativo' }}
            </span>
          </div>

          <div class="detalhes">
            <p><strong>E-mail:</strong> {{ exibirValor(usuarioItem.email) }}</p>
            <p><strong>Perfil:</strong> {{ exibirValor(usuarioItem.perfil) }}</p>
          </div>

          <div class="acoes">
            <button class="botao secundario" @click="editarUsuario(usuarioItem)">Editar</button>

            <button
              :class="['botao', estaAtivo(usuarioItem) ? 'perigo' : 'sucesso']"
              :disabled="atualizandoId === usuarioItem.id"
              @click="alternarAtivoUsuario(usuarioItem)"
            >
              {{ estaAtivo(usuarioItem) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>

          <p v-if="atualizandoId === usuarioItem.id" class="atualizando">
            Atualizando usuario...
          </p>
        </article>
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

.acoes {
  display: flex;
  gap: 10px;
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
