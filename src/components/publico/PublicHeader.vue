<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BRAND_NAME, BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'

defineProps({
  compacto: {
    type: Boolean,
    default: false,
  },
})

const logoComErro = ref(false)

function usarFallbackLogo() {
  logoComErro.value = true
}
</script>

<template>
  <header :class="['public-header', { compacto }]">
    <RouterLink class="public-brand" to="/" aria-label="Ir para a página inicial">
      <img
        v-if="!logoComErro"
        class="public-brand-logo"
        :src="brandAssets.logoHorizontal"
        :alt="BRAND_NAME"
        @error="usarFallbackLogo"
      />
      <span v-else class="public-brand-fallback">
        <img class="public-brand-fallback-icon" :src="brandAssets.logoFallbackSvg" alt="" aria-hidden="true" />
        <span class="public-brand-fallback-copy">
          <strong>{{ BRAND_NAME }}</strong>
          <small>{{ BRAND_TAGLINE }}</small>
        </span>
      </span>
    </RouterLink>

    <nav class="public-nav" aria-label="Navegação pública">
      <RouterLink to="/sobre">Sobre</RouterLink>
      <RouterLink to="/cadastro#planos">Planos</RouterLink>
      <RouterLink class="public-nav-login" to="/login">Entrar</RouterLink>
      <RouterLink class="public-nav-cta" to="/cadastro">Começar agora</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.public-header {
  position: sticky;
  top: 0;
  z-index: 30;
  width: min(1160px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 16px 20px;
  color: #0f172a;
}

.public-header::before {
  content: '';
  position: absolute;
  inset: 8px 12px;
  z-index: -1;
  border: 1px solid rgba(148, 163, 184, .2);
  border-radius: 20px;
  background: rgba(255, 255, 255, .82);
  box-shadow: 0 20px 50px rgba(15, 23, 42, .08);
  backdrop-filter: blur(18px);
}

.public-header.compacto {
  padding-top: 14px;
  padding-bottom: 14px;
}

.public-brand,
.public-nav {
  display: flex;
  align-items: center;
}

.public-brand {
  min-width: 0;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.public-brand-logo,
.public-brand-fallback-icon {
  display: block;
  max-width: 100%;
  height: auto;
  object-fit: contain;
  opacity: 1;
  filter: none;
}

.public-brand-logo {
  width: min(244px, 48vw);
  height: 56px;
  flex: 0 0 auto;
}

.public-brand-fallback {
  display: flex;
  align-items: center;
  gap: 12px;
}

.public-brand-fallback-icon {
  width: 44px;
  flex: 0 0 auto;
}

.public-brand-fallback-copy {
  display: grid;
  gap: 2px;
  min-width: 0;
}

.public-brand strong {
  font-size: 16px;
  font-weight: 900;
}

.public-brand small {
  color: #64748b;
  font-size: 12px;
  font-weight: 800;
}

.public-nav {
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.public-nav a {
  min-height: 38px;
  display: inline-flex;
  align-items: center;
  border-radius: 8px;
  padding: 9px 12px;
  color: #334155;
  font-size: 14px;
  font-weight: 900;
  text-decoration: none;
  transition: background .18s ease, color .18s ease, transform .18s ease;
}

.public-nav a:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, .08);
  transform: translateY(-1px);
}

.public-nav .public-nav-login {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, .86);
  box-shadow: 0 10px 22px rgba(15, 23, 42, .07);
}

.public-nav .public-nav-cta {
  background: #0f172a;
  color: white;
  box-shadow: 0 14px 28px rgba(15, 23, 42, .18);
}

.public-nav .public-nav-cta:hover {
  background: #1d4ed8;
  color: white;
}

@media (max-width: 700px) {
  .public-header {
    position: relative;
    align-items: stretch;
    flex-direction: column;
    padding-right: 14px;
    padding-left: 14px;
  }

  .public-header::before {
    inset: 8px;
  }

  .public-nav {
    width: 100%;
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
  }

  .public-nav a {
    justify-content: center;
    padding-right: 10px;
    padding-left: 10px;
  }

  .public-brand-logo {
    width: min(224px, 72vw);
    height: 52px;
  }
}
</style>
