<script setup>
import { RouterLink } from 'vue-router'
import logoMarca from '@/assets/brand/nuvemmais-marca.svg'

defineProps({
  compacto: {
    type: Boolean,
    default: false,
  },
})
</script>

<template>
  <header :class="['public-header', { compacto }]">
    <RouterLink class="public-brand" to="/" aria-label="Ir para a página inicial">
      <img class="public-brand-logo" :src="logoMarca" alt="" aria-hidden="true" />
      <span class="public-brand-text">
        <strong>NuvemMais Gestão</strong>
        <small>Gestão empresarial na nuvem</small>
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

.public-brand-logo {
  width: 44px;
  height: 44px;
  flex: 0 0 auto;
  border-radius: 14px;
  box-shadow: 0 14px 26px rgba(37, 99, 235, .22);
}

.public-brand-text {
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
    width: 40px;
    height: 40px;
  }
}
</style>
