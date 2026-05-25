<script setup>
import { onMounted, ref } from 'vue'
import {
  alterarSenhaMinhaConta,
  atualizarMinhaConta,
  buscarMinhaConta,
  carregarUsuarioSessao,
  obterMensagemAmigavelErro,
  salvarSessaoAutenticacao,
} from '@/services/api'
import { emailBasicoValido, validarLoginCurto } from '@/utils/validacoes'

const carregando = ref(true)
const salvandoDados = ref(false)
const alterandoSenha = ref(false)
const erroDados = ref('')
const erroSenha = ref('')
const sucessoDados = ref('')
const sucessoSenha = ref('')
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

onMounted(carregarConta)

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
    </template>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
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
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
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
  color: #64748b;
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
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
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
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
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
}
</style>
