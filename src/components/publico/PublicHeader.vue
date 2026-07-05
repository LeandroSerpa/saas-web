<script setup>
import { RouterLink } from 'vue-router'

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
      <span class="public-brand-logo" aria-hidden="true">NM</span>
      <span class="public-brand-text">
        <strong>NuvemMais Gestão</strong>
        <small>Gestão empresarial na nuvem</small>
      </span>
    </RouterLink>

    <nav class="public-nav" aria-label="Navegação pública">
      <RouterLink to="/sobre">Sobre</RouterLink>
      <RouterLink to="/cadastro">Comece agora</RouterLink>
      <RouterLink class="public-nav-login" to="/login">Entrar</RouterLink>
    </nav>
  </header>
</template>

<style scoped>
.public-header {
  width: min(1160px, 100%);
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 20px;
  padding: 22px 20px;
  color: #0f172a;
}

.public-header.compacto {
  padding-top: 18px;
  padding-bottom: 18px;
}

.public-brand,
.public-nav {
  display: flex;
  align-items: center;
}

.public-brand {
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.public-brand-logo {
  display: inline-grid;
  width: 44px;
  height: 44px;
  place-items: center;
  border-radius: 14px;
  background:
    linear-gradient(135deg, #2563eb 0%, #14b8a6 100%);
  color: white;
  font-size: 13px;
  font-weight: 900;
  letter-spacing: .04em;
  box-shadow: 0 14px 26px rgba(37, 99, 235, .22);
}

.public-brand-text {
  display: grid;
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
  gap: 12px;
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
}

.public-nav a:hover {
  color: #2563eb;
  background: rgba(37, 99, 235, .08);
}

.public-nav .public-nav-login {
  border: 1px solid #cbd5e1;
  background: rgba(255, 255, 255, .86);
  box-shadow: 0 10px 22px rgba(15, 23, 42, .07);
}

@media (max-width: 700px) {
  .public-header {
    align-items: flex-start;
    flex-direction: column;
    padding-right: 14px;
    padding-left: 14px;
  }

  .public-nav {
    width: 100%;
    justify-content: flex-start;
  }

  .public-brand-logo {
    width: 40px;
    height: 40px;
  }
}
</style>
