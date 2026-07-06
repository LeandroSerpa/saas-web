<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BRAND_NAME, BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'

const logoComErro = ref(false)

function usarFallbackLogo() {
  logoComErro.value = true
}
</script>

<template>
  <footer class="public-footer">
    <div class="public-footer-grid">
      <div class="public-footer-brand">
        <RouterLink class="public-footer-logo" to="/" aria-label="Ir para a página inicial">
          <img
            v-if="!logoComErro"
            :src="brandAssets.logoHorizontal"
            :alt="BRAND_NAME"
            @error="usarFallbackLogo"
          />
          <span v-else class="public-footer-fallback">
            <img class="public-footer-fallback-icon" :src="brandAssets.logoFallbackSvg" alt="" aria-hidden="true" />
            <span class="public-footer-fallback-copy">
              <strong>{{ BRAND_NAME }}</strong>
              <small>{{ BRAND_TAGLINE }}</small>
            </span>
          </span>
        </RouterLink>
        <p>
          Portal público para apresentar a plataforma, receber solicitações de cadastro e manter o acesso ao sistema com
          uma experiência profissional.
        </p>
      </div>

      <nav aria-label="Links públicos">
        <strong>Portal</strong>
        <RouterLink to="/cadastro">Começar agora</RouterLink>
        <RouterLink to="/login">Entrar</RouterLink>
        <RouterLink to="/sobre">Sobre</RouterLink>
      </nav>

      <nav aria-label="Links institucionais">
        <strong>Institucional</strong>
        <RouterLink to="/termos">Termos</RouterLink>
        <RouterLink to="/privacidade">Privacidade</RouterLink>
        <RouterLink to="/cadastro#planos">Planos</RouterLink>
      </nav>
    </div>
  </footer>
</template>

<style scoped>
.public-footer {
  width: min(1180px, 100%);
  margin: 0 auto;
  padding: 30px 20px 44px;
  color: #334155;
}

.public-footer-grid {
  position: relative;
  isolation: isolate;
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 30px;
  border: 1px solid rgba(148, 163, 184, .18);
  border-radius: 28px;
  background:
    radial-gradient(circle at 92% 0%, rgba(20, 184, 166, .14), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, .98), rgba(239, 246, 255, .92));
  padding: 30px;
  box-shadow: 0 26px 60px rgba(15, 23, 42, .08);
}

.public-footer-grid::before {
  content: '';
  position: absolute;
  inset: 0;
  z-index: -1;
  border-radius: inherit;
  background:
    radial-gradient(circle at 8% 18%, rgba(37, 99, 235, .08), transparent 30%),
    radial-gradient(circle at 76% 78%, rgba(14, 165, 233, .1), transparent 26%);
}

.public-footer-brand {
  display: grid;
  max-width: 540px;
  gap: 16px;
  padding: 22px;
  border: 1px solid rgba(148, 163, 184, .14);
  border-radius: 22px;
  background: rgba(255, 255, 255, .72);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, .5);
}

.public-footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.public-footer-logo img,
.public-footer-fallback-icon {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 1;
  filter: none;
}

.public-footer-logo img {
  width: clamp(196px, 22vw, 244px);
  height: clamp(48px, 5vw, 58px);
}

.public-footer-fallback {
  display: flex;
  align-items: center;
  gap: 12px;
}

.public-footer-fallback-icon {
  width: 44px;
  flex: 0 0 auto;
}

.public-footer-fallback-copy {
  display: grid;
  gap: 2px;
}

.public-footer strong {
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.public-footer small,
.public-footer p {
  color: #64748b;
}

.public-footer small {
  font-size: 12px;
  font-weight: 800;
}

.public-footer p {
  margin: 0;
  font-size: 14px;
  line-height: 1.6;
}

.public-footer nav {
  display: grid;
  align-content: start;
  gap: 12px;
  min-width: 148px;
  padding-top: 6px;
  padding-left: 24px;
  border-left: 1px solid rgba(148, 163, 184, .18);
}

.public-footer nav strong {
  font-size: 12px;
  letter-spacing: .08em;
  text-transform: uppercase;
}

.public-footer a {
  color: #475569;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
}

.public-footer a:hover {
  color: #2563eb;
  text-decoration: underline;
}

@media (max-width: 760px) {
  .public-footer {
    padding-right: 14px;
    padding-left: 14px;
  }

  .public-footer-grid {
    grid-template-columns: 1fr;
    gap: 22px;
    padding: 22px;
  }

  .public-footer-brand,
  .public-footer nav {
    padding-left: 0;
    border-left: none;
  }

  .public-footer nav {
    padding-top: 18px;
    border-top: 1px solid rgba(148, 163, 184, .18);
  }
}
</style>
