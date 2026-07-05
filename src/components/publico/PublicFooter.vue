<script setup>
import { RouterLink } from 'vue-router'
import { BRAND_TAGLINE, brandAssets } from '@/utils/brandAssets'
</script>

<template>
  <footer class="public-footer">
    <div class="public-footer-grid">
      <div class="public-footer-brand">
        <RouterLink class="public-footer-logo" to="/" aria-label="Ir para a página inicial">
          <img :src="brandAssets.logoHorizontal" alt="NuvemMais Gestão" />
          <span>
            <strong>NuvemMais Gestão</strong>
            <small>{{ BRAND_TAGLINE }}</small>
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
  width: min(1160px, 100%);
  margin: 0 auto;
  padding: 28px 20px 44px;
  color: #334155;
}

.public-footer-grid {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto auto;
  gap: 36px;
  border: 1px solid rgba(148, 163, 184, .22);
  border-radius: 24px;
  background:
    radial-gradient(circle at 92% 0%, rgba(20, 184, 166, .14), transparent 26%),
    linear-gradient(135deg, rgba(255, 255, 255, .96), rgba(239, 246, 255, .9));
  padding: 28px;
  box-shadow: 0 24px 58px rgba(15, 23, 42, .08);
}

.public-footer-brand {
  display: grid;
  max-width: 520px;
  gap: 14px;
}

.public-footer-logo {
  display: flex;
  align-items: center;
  gap: 12px;
  color: inherit;
  text-decoration: none;
}

.public-footer-logo img {
  width: min(238px, 100%);
  height: 54px;
  object-fit: contain;
}

.public-footer-logo span {
  display: none;
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
  gap: 10px;
  min-width: 136px;
}

.public-footer nav strong {
  font-size: 13px;
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
}
</style>
