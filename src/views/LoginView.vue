<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import { login } from '@/services/api'

const router = useRouter()

const email = ref('')
const senha = ref('')
const erro = ref('')
const carregando = ref(false)
const mostrarSenha = ref(false)

async function entrar() {
  try {
    erro.value = ''

    if (!email.value.trim()) {
      erro.value = 'Informe o e-mail.'
      return
    }

    if (!senha.value) {
      erro.value = 'Informe a senha.'
      return
    }

    carregando.value = true

    const resposta = await login(email.value, senha.value)
    const usuario = {
      nome: resposta.nome,
      email: resposta.email,
      perfil: resposta.perfil,
      empresaId: resposta.empresaId,
      empresaNome: resposta.empresaNome,
    }

    localStorage.setItem('token', resposta.token)
    localStorage.setItem('usuario', JSON.stringify(usuario))

    router.push('/dashboard')
  } catch (error) {
    erro.value = 'Não foi possível fazer login. Confira e-mail e senha.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="pagina-login">
    <section class="login-card">
      <div class="marca-login">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>Gestao SaaS</strong>
          <small>MicroSaaS empresarial</small>
        </div>
      </div>

      <div class="cabecalho-login">
        <p class="subtitulo">Acesso administrativo</p>
        <h1>Entrar</h1>
        <p>Informe suas credenciais para acessar o painel.</p>
      </div>

      <section v-if="erro" class="erro">
        <p>{{ erro }}</p>
      </section>

      <form class="formulario-login" @submit.prevent="entrar">
        <label>
          E-mail
          <input v-model="email" type="email" autocomplete="email" placeholder="admin@saas.com" />
        </label>

        <label>
          Senha
          <span class="campo-senha">
            <input
              v-model="senha"
              :type="mostrarSenha ? 'text' : 'password'"
              autocomplete="current-password"
              placeholder="Digite sua senha"
            />
            <button
              class="botao-olho"
              type="button"
              :aria-label="mostrarSenha ? 'Ocultar senha' : 'Mostrar senha'"
              @click="mostrarSenha = !mostrarSenha"
            >
              <svg v-if="!mostrarSenha" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2.5 12s3.5-6 9.5-6 9.5 6 9.5 6-3.5 6-9.5 6-9.5-6-9.5-6Z"
                />
                <circle cx="12" cy="12" r="3" />
              </svg>

              <svg v-else viewBox="0 0 24 24" aria-hidden="true">
                <path
                  d="M2.5 12s3.5-6 9.5-6c2.1 0 3.9.7 5.3 1.6M21.5 12s-3.5 6-9.5 6c-2.1 0-3.9-.7-5.3-1.6"
                />
                <path d="M4 4l16 16" />
                <path d="M9.9 9.9a3 3 0 0 0 4.2 4.2" />
              </svg>
            </button>
          </span>
        </label>

        <button class="botao-login" type="submit" :disabled="carregando">
          {{ carregando ? 'Entrando...' : 'Entrar' }}
        </button>
      </form>

      <RouterLink class="link-cadastro" to="/cadastro">Quero cadastrar minha empresa</RouterLink>
    </section>
  </main>
</template>

<style scoped>
.pagina-login {
  min-height: 100vh;
  display: grid;
  place-items: center;
  padding: 24px;
  background: #eef2f7;
  color: #111827;
}

.login-card {
  width: 100%;
  max-width: 440px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 28px;
  box-shadow: 0 16px 36px rgba(15, 23, 42, 0.1);
  display: grid;
  gap: 24px;
}

.marca-login {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marca-simbolo {
  width: 44px;
  height: 44px;
  display: grid;
  place-items: center;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  font-weight: 800;
}

.marca-login strong,
.marca-login small {
  display: block;
}

.marca-login strong {
  font-size: 17px;
  font-weight: 800;
}

.marca-login small,
.cabecalho-login p {
  color: #64748b;
}

.cabecalho-login {
  display: grid;
  gap: 6px;
}

.subtitulo {
  margin: 0;
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

.cabecalho-login h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.cabecalho-login p {
  margin: 0;
}

.formulario-login {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
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

.campo-senha {
  position: relative;
  display: block;
}

.campo-senha input {
  padding-right: 46px;
}

.botao-olho {
  position: absolute;
  top: 50%;
  right: 6px;
  width: 34px;
  height: 34px;
  display: grid;
  place-items: center;
  border: none;
  color: #64748b;
  background: transparent;
  padding: 0;
  border-radius: 8px;
  cursor: pointer;
  transition:
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
  transform: translateY(-50%);
}

.botao-olho:hover {
  color: #1d4ed8;
  background: #eff6ff;
}

.botao-olho:focus {
  outline: none;
  color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.botao-olho svg {
  width: 20px;
  height: 20px;
  fill: none;
  stroke: currentColor;
  stroke-linecap: round;
  stroke-linejoin: round;
  stroke-width: 2;
}

.botao-login {
  border: none;
  color: white;
  background: #2563eb;
  padding: 12px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao-login:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.botao-login:disabled {
  opacity: 0.6;
  cursor: not-allowed;
  transform: none;
}

.link-cadastro {
  justify-self: center;
  color: #2563eb;
  font-weight: 800;
  text-decoration: none;
}

.link-cadastro:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.erro {
  border: 1px solid #fecaca;
  background: #fef2f2;
  color: #991b1b;
  border-radius: 8px;
  padding: 14px 16px;
}

.erro p {
  margin: 0;
}
</style>
