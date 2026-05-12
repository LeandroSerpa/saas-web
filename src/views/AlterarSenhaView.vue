<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { alterarSenha } from '@/services/api'

const router = useRouter()

const senhaAtual = ref('')
const novaSenha = ref('')
const confirmacaoNovaSenha = ref('')
const erro = ref('')
const mensagemSucesso = ref('')
const carregando = ref(false)
const mostrarSenhaAtual = ref(false)
const mostrarNovaSenha = ref(false)
const mostrarConfirmacaovaSenha = ref(false)

async function salvarSenha() {
  try {
    if (carregando.value) {
      return
    }

    erro.value = ''
    mensagemSucesso.value = ''

    if (!senhaAtual.value) {
      erro.value = 'Informe a senha atual.'
      return
    }

    if (!novaSenha.value) {
      erro.value = 'Informe a nova senha.'
      return
    }

    if (!confirmacaoNovaSenha.value) {
      erro.value = 'Confirme a nova senha.'
      return
    }

    if (novaSenha.value.length < 6) {
      erro.value = 'A nova senha deve ter pelo menos 6 caracteres.'
      return
    }

    if (novaSenha.value !== confirmacaoNovaSenha.value) {
      erro.value = 'A nova senha e a confirmacao precisam ser iguais.'
      return
    }

    carregando.value = true

    await alterarSenha(senhaAtual.value, novaSenha.value)

    mensagemSucesso.value = 'Senha alterada com sucesso. Faca login novamente.'
    senhaAtual.value = ''
    novaSenha.value = ''
    confirmacaoNovaSenha.value = ''

    localStorage.removeItem('token')
    localStorage.removeItem('usuario')

    setTimeout(() => {
      router.push('/login')
    }, 1000)
  } catch (error) {
    erro.value = 'Não foi possível alterar a senha. Confira a senha atual e tente novamente.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Seguranca</p>
        <h1>Alterar senha</h1>
        <p class="descricao">Atualize a senha do usuario logado.</p>
      </div>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section class="card sucesso-card" v-if="mensagemSucesso">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <form class="card formulario" @submit.prevent="salvarSenha">
      <div class="titulo-card">
        <h2>Nova senha</h2>
        <p>Informe a senha atual e defina uma nova senha de acesso.</p>
      </div>

      <div class="campos">
        <label>
          Senha atual *
          <span class="campo-senha">
            <input
              v-model="senhaAtual"
              :type="mostrarSenhaAtual ? 'text' : 'password'"
              autocomplete="current-password"
            />
            <button
              class="botao-olho"
              type="button"
              :aria-label="mostrarSenhaAtual ? 'Ocultar senha atual' : 'Mostrar senha atual'"
              @click="mostrarSenhaAtual = !mostrarSenhaAtual"
            >
              <svg v-if="!mostrarSenhaAtual" viewBox="0 0 24 24" aria-hidden="true">
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

        <label>
          Nova senha *
          <span class="campo-senha">
            <input
              v-model="novaSenha"
              :type="mostrarNovaSenha ? 'text' : 'password'"
              autocomplete="new-password"
            />
            <button
              class="botao-olho"
              type="button"
              :aria-label="mostrarNovaSenha ? 'Ocultar nova senha' : 'Mostrar nova senha'"
              @click="mostrarNovaSenha = !mostrarNovaSenha"
            >
              <svg v-if="!mostrarNovaSenha" viewBox="0 0 24 24" aria-hidden="true">
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

        <label>
          Confirmar nova senha *
          <span class="campo-senha">
            <input
              v-model="confirmacaoNovaSenha"
              :type="mostrarConfirmacaovaSenha ? 'text' : 'password'"
              autocomplete="new-password"
            />
            <button
              class="botao-olho"
              type="button"
              :aria-label="
                mostrarConfirmacaovaSenha
                  ? 'Ocultar confirmacao de senha'
                  : 'Mostrar confirmacao de senha'
              "
              @click="mostrarConfirmacaovaSenha = !mostrarConfirmacaovaSenha"
            >
              <svg v-if="!mostrarConfirmacaovaSenha" viewBox="0 0 24 24" aria-hidden="true">
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
      </div>

      <div class="rodape-formulario">
        <button
          class="botao principal"
          type="submit"
          :disabled="carregando || Boolean(mensagemSucesso)"
        >
          {{ carregando ? 'Alterando...' : 'Alterar senha' }}
        </button>
      </div>
    </form>
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
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

.formulario {
  display: grid;
  gap: 16px;
  max-width: 720px;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
  font-size: 14px;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
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

.rodape-formulario {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
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

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
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

.erro p,
.sucesso-card p {
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
