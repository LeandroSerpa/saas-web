<script setup>
import { RouterLink, RouterView } from 'vue-router'
</script>

<template>
  <div class="app-shell">
    <aside class="barra-lateral">
      <div class="marca">
        <span class="marca-simbolo">LE</span>
        <div>
          <strong>Gestao SaaS</strong>
          <small>MicroSaaS empresarial</small>
        </div>
      </div>

      <nav class="menu-principal" aria-label="Navegacao principal">
        <RouterLink to="/">Agenda</RouterLink>
        <RouterLink to="/clientes">Clientes</RouterLink>
        <RouterLink to="/servicos">Servicos</RouterLink>
        <RouterLink to="/funcionarios">Funcionarios</RouterLink>
      </nav>
    </aside>

    <div class="area-principal">
      <header class="topo-app">
        <div>
          <span class="ambiente">API publicada</span>
          <p>https://automacao-le-saas-api.1mweab.easypanel.host</p>
        </div>
      </header>

      <RouterView />
    </div>
  </div>
</template>

<style scoped>
.app-shell {
  min-height: 100vh;
  display: grid;
  grid-template-columns: 260px minmax(0, 1fr);
  background: #eef2f7;
  color: #111827;
}

.barra-lateral {
  background: #0f172a;
  color: white;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 28px;
}

.marca {
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
  font-weight: 800;
}

.marca strong,
.marca small {
  display: block;
}

.marca strong {
  font-size: 17px;
  font-weight: 800;
}

.marca small {
  color: #cbd5e1;
  font-size: 13px;
}

.menu-principal {
  display: grid;
  gap: 8px;
}

.menu-principal a {
  color: #e2e8f0;
  text-decoration: none;
  border-radius: 8px;
  padding: 11px 12px;
  font-weight: 700;
}

.menu-principal a.router-link-active {
  background: rgba(37, 99, 235, 0.22);
  color: white;
}

.area-principal {
  min-width: 0;
  max-width: 1230px;
  width: 100%;
  padding: 24px;
}

.topo-app {
  margin: 0 0 24px;
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 16px 20px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.05);
}

.topo-app p {
  margin: 4px 0 0;
  color: #475569;
  word-break: break-word;
}

.ambiente {
  color: #2563eb;
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
}

@media (max-width: 900px) {
  .app-shell {
    grid-template-columns: 1fr;
  }

  .barra-lateral {
    padding: 18px;
  }

  .area-principal {
    padding: 18px;
  }
}
</style>
