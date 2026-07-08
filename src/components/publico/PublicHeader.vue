<script setup>
import { ref } from 'vue'
import { RouterLink } from 'vue-router'
import { BRAND_NAME, BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'
import { LINKS_ACAO_PUBLICA, LINKS_MENU_PUBLICO } from '@/utils/navegacaoPublica'

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
      <span class="public-brand-mark">
        <img
          v-if="!logoComErro"
          class="public-brand-logo"
          :src="brandAssets.logoApp"
          :alt="BRAND_NAME"
          @error="usarFallbackLogo"
        />
        <span v-else class="public-brand-fallback">
          <img class="public-brand-fallback-icon" :src="brandAssets.logoFallbackSvg" alt="" aria-hidden="true" />
        </span>
      </span>

      <span class="public-brand-copy">
        <strong>{{ BRAND_NAME }}</strong>
        <small>{{ BRAND_TAGLINE }}</small>
      </span>
    </RouterLink>

    <nav class="public-nav" aria-label="Navegação pública">
      <RouterLink v-for="link in LINKS_MENU_PUBLICO" :key="link.chave" :to="link.to">
        {{ link.rotulo }}
      </RouterLink>
      <RouterLink
        v-for="link in LINKS_ACAO_PUBLICA"
        :key="link.chave"
        :class="link.classe"
        :to="link.to"
      >
        {{ link.rotulo }}
      </RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.public-header {
  position: sticky;
  top: 0;
  z-index: 30;
  width: min(1180px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 24px;
  padding: 18px 20px;
  color: #0f172a;
}

.public-header::before {
  content: '';
  position: absolute;
  inset: 6px 10px;
  z-index: -1;
  border: 1px solid rgba(148, 163, 184, 0.18);
  border-radius: 24px;
  background:
    linear-gradient(135deg, rgba(255, 255, 255, 0.94), rgba(248, 250, 252, 0.84));
  box-shadow: 0 24px 60px rgba(15, 23, 42, 0.08);
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
  flex: 1 1 auto;
  min-width: 0;
  gap: 14px;
  padding: 8px 12px 8px 8px;
  border-radius: 20px;
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.34), rgba(239, 246, 255, 0.62));
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.52);
  color: inherit;
  text-decoration: none;
}

.public-brand-mark {
  width: 48px;
  height: 48px;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 16px;
  padding: 5px;
  background: linear-gradient(135deg, #071124, #123b78);
  box-shadow:
    0 14px 26px rgba(37, 99, 235, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.12);
}

.public-brand-logo,
.public-brand-fallback-icon {
  display: block;
  width: 100%;
  height: 100%;
  object-fit: contain;
  opacity: 1;
  filter: none;
}

.public-brand-fallback {
  width: 100%;
  height: 100%;
  display: grid;
  place-items: center;
}

.public-brand-copy {
  min-width: 0;
  display: grid;
  align-content: center;
  gap: 2px;
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
  gap: 8px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.public-nav a {
  min-height: 40px;
  display: inline-flex;
  align-items: center;
  border-radius: 12px;
  padding: 10px 14px;
  color: #334155;
  font-size: 13px;
  font-weight: 900;
  text-decoration: none;
  transition: background 0.18s ease, color 0.18s ease, transform 0.18s ease;
}

.public-nav a:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, 0.08);
  transform: translateY(-1px);
}

.public-nav .public-nav-login {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, 0.92);
  box-shadow: 0 10px 22px rgba(15, 23, 42, 0.07);
}

.public-nav .public-nav-cta {
  background: linear-gradient(135deg, #0f172a, #1d4ed8);
  color: white;
  box-shadow: 0 16px 32px rgba(15, 23, 42, 0.18);
}

.public-nav .public-nav-cta:hover {
  background: linear-gradient(135deg, #1d4ed8, #0ea5e9);
  color: white;
}

@media (max-width: 700px) {
  .public-header {
    position: relative;
    align-items: stretch;
    flex-direction: column;
    gap: 12px;
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

  .public-brand {
    justify-content: flex-start;
    padding: 10px 12px;
  }

  .public-nav a {
    justify-content: center;
    padding-right: 10px;
    padding-left: 10px;
  }

  .public-brand-mark {
    width: 44px;
    height: 44px;
  }
}

@media (max-width: 460px) {
  .public-nav {
    grid-template-columns: 1fr;
  }
}
</style>
