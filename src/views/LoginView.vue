<script setup>
import { ref } from 'vue'
import { RouterLink, useRouter } from 'vue-router'
import PublicFooter from '@/components/publico/PublicFooter.vue'
import PublicHeader from '@/components/publico/PublicHeader.vue'
import { BRAND_NAME, BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'
import {
  erroIndicaCadastroPendente,
  login,
  MENSAGEM_CADASTRO_PENDENTE,
  obterMensagemAmigavelErro,
  salvarSessaoAutenticacao,
} from '@/services/api'

const router = useRouter()
const mensagemLogin = sessionStorage.getItem('mensagem-login') || ''

const email = ref('')
const senha = ref('')
const erro = ref(mensagemLogin)
const carregando = ref(false)
const mostrarSenha = ref(false)
const logoComErro = ref(false)

if (mensagemLogin) {
  sessionStorage.removeItem('mensagem-login')
}

async function entrar() {
  try {
    erro.value = ''

    if (!email.value.trim()) {
      erro.value = 'Informe o e-mail ou usuário.'
      return
    }

    if (!senha.value) {
      erro.value = 'Informe a senha.'
      return
    }

    carregando.value = true

    const resposta = await login(email.value, senha.value)
    const usuario = salvarSessaoAutenticacao(resposta)

    if (usuario.cadastroPendente) {
      sessionStorage.setItem('mensagem-cadastro-pendente', MENSAGEM_CADASTRO_PENDENTE)
      router.push('/cadastro-pendente')
      return
    }

    if (usuario.trocaSenhaObrigatoria) {
      router.push('/alterar-senha')
      return
    }

    router.push('/dashboard')
  } catch (error) {
    if (erroIndicaCadastroPendente(error)) {
      sessionStorage.setItem('mensagem-cadastro-pendente', MENSAGEM_CADASTRO_PENDENTE)
      router.push('/cadastro-pendente')
      return
    }

    erro.value = obterMensagemAmigavelErro(
      error,
      'Não foi possível fazer login. Confira e-mail e senha.',
    )
    console.error(error)
  } finally {
    carregando.value = false
  }
}

function usarFallbackLogo() {
  logoComErro.value = true
}
</script>

<template>
  <main class="pagina-login">
    <PublicHeader compacto />

    <section class="login-shell">
      <aside class="painel-login">
        <span class="selo">Produto profissional</span>
        <h1>Organize sua empresa em uma única plataforma.</h1>
        <p>
          Acesse agenda, clientes, equipe, estoque, relatórios e recursos administrativos com contexto de empresa e
          permissões por perfil.
        </p>

        <div class="mini-dashboard" aria-hidden="true">
          <div class="mini-topo">
            <span></span><span></span><span></span>
          </div>
          <div class="mini-corpo">
            <article><small>Hoje</small><strong>32</strong><p>atendimentos</p></article>
            <article><small>Equipe</small><strong>8</strong><p>disponíveis</p></article>
            <article class="largo"><small>Operação</small><strong>Agenda, catálogo e estoque no mesmo painel</strong></article>
          </div>
        </div>

        <div class="beneficios-login">
          <article>
            <strong>Multiempresa</strong>
            <span>Contexto certo para cada operação.</span>
          </article>
          <article>
            <strong>Permissões</strong>
            <span>Acesso conforme o perfil do usuário.</span>
          </article>
          <article>
            <strong>Rotina centralizada</strong>
            <span>Menos controles paralelos no dia a dia.</span>
          </article>
        </div>
      </aside>

      <section class="login-card">
        <div class="marca-login">
          <img
            v-if="!logoComErro"
            :src="brandAssets.logoHorizontal"
            :alt="BRAND_NAME"
            @error="usarFallbackLogo"
          />
          <div v-else class="marca-login-fallback">
            <img class="marca-login-fallback-icon" :src="brandAssets.logoFallbackSvg" alt="" aria-hidden="true" />
            <div>
              <strong>{{ BRAND_NAME }}</strong>
              <small>{{ BRAND_TAGLINE }}</small>
            </div>
          </div>
        </div>

        <div class="cabecalho-login">
          <p class="subtitulo">Acesso ao sistema</p>
          <h2>Entrar</h2>
          <p>Informe suas credenciais para acessar o painel da sua empresa.</p>
        </div>

        <section v-if="erro" class="erro">
          <p>{{ erro }}</p>
        </section>

        <form class="formulario-login" @submit.prevent="entrar">
          <label>
            E-mail ou usuário
            <input
              v-model="email"
              type="text"
              autocomplete="username"
              placeholder="Ex: usuario@empresa.com ou serpalhss"
            />
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

        <p class="nota-seguranca">
          Use apenas credenciais autorizadas. Se sua empresa ainda não tem acesso, envie uma solicitação de cadastro.
        </p>

        <RouterLink class="link-cadastro" to="/cadastro">Quero cadastrar minha empresa</RouterLink>

        <nav class="links-institucionais" aria-label="Páginas públicas">
          <RouterLink to="/sobre">Sobre</RouterLink>
          <RouterLink to="/termos">Termos</RouterLink>
          <RouterLink to="/privacidade">Privacidade</RouterLink>
        </nav>
      </section>
    </section>

    <PublicFooter />
  </main>
</template>

<style scoped>
.pagina-login {
  min-height: 100vh;
  background:
    linear-gradient(110deg, rgba(14, 165, 233, .12) 0 1px, transparent 1px 100%) 0 0 / 70px 70px,
    radial-gradient(circle at 10% 12%, rgba(37, 99, 235, .18), transparent 30%),
    radial-gradient(circle at 92% 18%, rgba(20, 184, 166, .18), transparent 28%),
    #f8fafc;
  color: #0f172a;
}

.login-shell {
  width: min(1120px, 100%);
  min-height: calc(100vh - 226px);
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(360px, 430px);
  gap: 28px;
  align-items: center;
  margin: 0 auto;
  padding: 42px 20px 58px;
}

.painel-login {
  position: relative;
  display: grid;
  gap: 18px;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 26px;
  background:
    linear-gradient(110deg, rgba(125, 211, 252, .12) 0 1px, transparent 1px 100%) 0 0 / 58px 58px,
    radial-gradient(circle at 84% 12%, rgba(20, 184, 166, .3), transparent 30%),
    linear-gradient(135deg, #1d4ed8 0%, #071124 100%);
  padding: 38px;
  color: white;
  overflow: hidden;
  box-shadow: 0 30px 80px rgba(15, 23, 42, .2);
}

.selo,
.subtitulo {
  margin: 0;
  color: #2563eb;
  font-size: 13px;
  font-weight: 900;
  text-transform: uppercase;
}

.painel-login .selo {
  color: #7dd3fc;
}

.painel-login h1,
.cabecalho-login h2,
.painel-login p,
.cabecalho-login p {
  margin: 0;
}

.painel-login h1 {
  max-width: 620px;
  font-size: clamp(34px, 5vw, 56px);
  line-height: 1.02;
  font-weight: 900;
}

.painel-login p {
  max-width: 620px;
  color: #dbeafe;
  font-size: 17px;
  line-height: 1.65;
}

.mini-dashboard {
  display: grid;
  gap: 0;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 20px;
  background: rgba(8, 15, 31, .5);
  overflow: hidden;
  backdrop-filter: blur(16px);
}

.mini-topo {
  display: flex;
  gap: 7px;
  border-bottom: 1px solid rgba(255, 255, 255, .12);
  padding: 13px 16px;
}

.mini-topo span {
  width: 9px;
  height: 9px;
  border-radius: 999px;
  background: rgba(255, 255, 255, .5);
}

.mini-corpo {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 12px;
  padding: 16px;
}

.mini-corpo article {
  display: grid;
  gap: 6px;
  border-radius: 14px;
  background: rgba(255, 255, 255, .09);
  padding: 14px;
}

.mini-corpo article.largo {
  grid-column: 1 / -1;
}

.mini-corpo small {
  color: #93c5fd;
  font-weight: 900;
  text-transform: uppercase;
}

.mini-corpo strong {
  font-size: 24px;
  line-height: 1.1;
}

.mini-corpo .largo strong {
  font-size: 17px;
}

.mini-corpo p {
  color: #cbd5e1;
  font-size: 13px;
}

.beneficios-login {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 12px;
}

.beneficios-login article {
  display: grid;
  gap: 6px;
  border: 1px solid rgba(255, 255, 255, .16);
  border-radius: 14px;
  background: rgba(255, 255, 255, .1);
  padding: 14px;
}

.beneficios-login strong {
  font-weight: 900;
}

.beneficios-login span {
  color: #dbeafe;
  font-size: 13px;
  line-height: 1.45;
}

.login-card {
  width: 100%;
  display: grid;
  gap: 22px;
  border: 1px solid rgba(148, 163, 184, .24);
  border-radius: 24px;
  background: rgba(255, 255, 255, .94);
  padding: 30px;
  box-shadow: 0 28px 70px rgba(15, 23, 42, .14);
  backdrop-filter: blur(16px);
}

.marca-login {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marca-login img {
  display: block;
  width: min(250px, 100%);
  max-width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 1;
  filter: none;
}

.marca-login-fallback {
  display: flex;
  align-items: center;
  gap: 12px;
}

.marca-login-fallback-icon {
  display: block;
  width: 46px;
  height: 46px;
  object-fit: contain;
}

.marca-login strong,
.marca-login small {
  display: none;
}

.marca-login strong {
  font-size: 17px;
  font-weight: 900;
}

.marca-login small,
.cabecalho-login p {
  color: #64748b;
}

.cabecalho-login {
  display: grid;
  gap: 6px;
}

.cabecalho-login h2 {
  font-size: 34px;
  font-weight: 900;
}

.formulario-login {
  display: grid;
  gap: 16px;
}

label {
  display: grid;
  gap: 8px;
  color: #374151;
  font-size: 14px;
  font-weight: 800;
}

input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 10px;
  background: white;
  box-sizing: border-box;
  padding: 13px 14px;
  font-size: 15px;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
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
  border-radius: 8px;
  background: transparent;
  color: #64748b;
  cursor: pointer;
  padding: 0;
  transform: translateY(-50%);
  transition: background .15s ease, color .15s ease;
}

.botao-olho:hover {
  background: #eff6ff;
  color: #1d4ed8;
}

.botao-olho:focus {
  outline: none;
  color: #1d4ed8;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, .12);
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
  min-height: 50px;
  border: none;
  border-radius: 8px;
  background: #2563eb;
  color: white;
  cursor: pointer;
  padding: 13px 16px;
  font-weight: 900;
  box-shadow: 0 18px 32px rgba(37, 99, 235, .24);
  transition: transform .15s ease, opacity .15s ease, background .15s ease;
}

.botao-login:hover {
  background: #1d4ed8;
  transform: translateY(-1px);
}

.botao-login:disabled {
  opacity: .6;
  cursor: not-allowed;
  transform: none;
}

.nota-seguranca {
  margin: 0;
  border: 1px solid #dbeafe;
  border-radius: 14px;
  background: #eff6ff;
  padding: 12px 14px;
  color: #1e3a8a;
  font-size: 13px;
  font-weight: 800;
  line-height: 1.5;
}

.link-cadastro {
  justify-self: center;
  color: #2563eb;
  font-weight: 900;
  text-decoration: none;
}

.link-cadastro:hover {
  color: #1d4ed8;
  text-decoration: underline;
}

.links-institucionais {
  display: flex;
  justify-content: center;
  gap: 12px;
  flex-wrap: wrap;
  padding-top: 4px;
}

.links-institucionais a {
  color: #64748b;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.links-institucionais a:hover {
  color: #2563eb;
  text-decoration: underline;
}

.erro {
  border: 1px solid #fecaca;
  border-radius: 10px;
  background: #fef2f2;
  color: #991b1b;
  padding: 14px 16px;
}

.erro p {
  margin: 0;
}

@media (max-width: 940px) {
  .login-shell {
    grid-template-columns: 1fr;
  }

  .painel-login {
    padding: 30px;
  }

  .beneficios-login {
    grid-template-columns: 1fr;
  }
}

@media (max-width: 560px) {
  .login-shell {
    padding: 26px 14px 40px;
  }

  .painel-login,
  .login-card {
    border-radius: 20px;
    padding: 22px;
  }

  .mini-corpo {
    grid-template-columns: 1fr;
  }

  .links-institucionais {
    justify-content: flex-start;
  }
}
</style>
