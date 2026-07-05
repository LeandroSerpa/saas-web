<script setup>
import { RouterLink } from 'vue-router'
</script>

<template>
  <footer class="public-footer">
    <div class="public-footer-brand">
      <strong>NuvemMais Gestão</strong>
      <p>Portal público preparado para apresentar a plataforma, orientar novos cadastros e manter o acesso ao sistema.</p>
    </div>

    <nav aria-label="Links públicos">
      <RouterLink to="/login">Login</RouterLink>
      <RouterLink to="/cadastro">Comece agora</RouterLink>
      <RouterLink to="/sobre">Sobre</RouterLink>
      <RouterLink to="/termos">Termos</RouterLink>
      <RouterLink to="/privacidade">Privacidade</RouterLink>
    </nav>
  </footer>
</template>

<style scoped>
.public-footer {
  width: min(1160px, 100%);
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  gap: 24px;
  padding: 34px 20px 44px;
  color: #334155;
}

.public-footer-brand {
  display: grid;
  max-width: 440px;
  gap: 6px;
}

.public-footer strong {
  color: #0f172a;
  font-size: 16px;
  font-weight: 900;
}

.public-footer p {
  margin: 0;
  color: #64748b;
  font-size: 14px;
  line-height: 1.55;
}

.public-footer nav {
  display: flex;
  align-items: flex-start;
  justify-content: flex-end;
  gap: 14px;
  flex-wrap: wrap;
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

@media (max-width: 700px) {
  .public-footer {
    align-items: flex-start;
    flex-direction: column;
    padding-right: 14px;
    padding-left: 14px;
  }

  .public-footer nav {
    justify-content: flex-start;
  }
}
</style>
