<script setup>
import NotificacoesBell from '@/components/NotificacoesBell.vue'

defineProps({
  cabecalho: {
    type: Object,
    required: true,
  },
  empresaLogada: {
    type: String,
    required: true,
  },
  nomeUsuario: {
    type: String,
    required: true,
  },
  identificacaoConta: {
    type: String,
    required: true,
  },
  acaoRotulo: {
    type: String,
    default: '',
  },
  acaoDisponivel: {
    type: Boolean,
    default: false,
  },
  acaoDesabilitada: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['abrir-menu', 'executar-acao', 'sair'])
</script>

<template>
  <header class="app-header-compacto">
    <section class="app-topbar" aria-label="Barra superior da aplicação">
      <div class="app-topbar-identidade">
        <button class="app-menu-button" type="button" aria-label="Abrir menu" @click="$emit('abrir-menu')">
          <span></span>
          <span></span>
          <span></span>
        </button>

        <div class="app-topbar-titulo">
          <strong>NuvemMais Gestão</strong>
          <small>{{ empresaLogada }}</small>
        </div>
      </div>

      <div class="app-user-actions">
        <NotificacoesBell />

        <div class="app-account-card">
          <strong>{{ empresaLogada }}</strong>
          <span>Usuário: {{ nomeUsuario }}</span>
          <small>{{ identificacaoConta }}</small>
        </div>

        <button
          v-if="acaoDisponivel"
          class="app-action-button primaria"
          type="button"
          :disabled="acaoDesabilitada"
          @click="$emit('executar-acao')"
        >
          {{ acaoRotulo }}
        </button>

        <button class="app-action-button sair" type="button" @click="$emit('sair')">Sair</button>
      </div>
    </section>

    <section class="app-page-heading" aria-label="Cabeçalho da página">
      <span v-if="cabecalho.subtitulo" class="app-page-kicker">{{ cabecalho.subtitulo }}</span>
      <div class="app-page-title">
        <h1>{{ cabecalho.titulo }}</h1>
        <p v-if="cabecalho.descricao">{{ cabecalho.descricao }}</p>
      </div>
    </section>
  </header>
</template>

<style scoped>
.app-header-compacto {
  display: grid;
  gap: 8px;
  min-width: 0;
}

.app-topbar,
.app-page-heading {
  min-height: 0;
  height: auto;
  border: 1px solid #e2e8f0;
  background: white;
  box-shadow: 0 4px 14px rgba(15, 23, 42, 0.04);
}

.app-topbar {
  min-height: 50px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
}

.app-topbar-identidade,
.app-user-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-topbar-identidade {
  flex: 1 1 auto;
}

.app-user-actions {
  flex: 0 1 auto;
  justify-content: flex-end;
}

.app-menu-button {
  display: none;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 9px;
  background: #0f172a;
  color: white;
  place-content: center;
  gap: 4px;
  cursor: pointer;
}

.app-menu-button span {
  width: 18px;
  height: 2px;
  border-radius: 999px;
  background: currentColor;
}

.app-topbar-titulo {
  min-width: 0;
  display: grid;
  gap: 1px;
}

.app-topbar-titulo strong,
.app-topbar-titulo small,
.app-account-card strong,
.app-account-card span,
.app-account-card small {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.app-topbar-titulo strong {
  color: #0f172a;
  font-size: 13px;
  font-weight: 900;
}

.app-topbar-titulo small {
  color: #64748b;
  font-size: 11px;
  font-weight: 700;
}

.app-account-card {
  min-width: 190px;
  max-width: 320px;
  display: grid;
  gap: 1px;
  padding: 6px 10px;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #f8fafc;
}

.app-account-card strong {
  color: #0f172a;
  font-size: 12px;
  font-weight: 900;
}

.app-account-card span {
  color: #334155;
  font-size: 11px;
  font-weight: 800;
}

.app-account-card small {
  color: #64748b;
  font-size: 11px;
}

.app-action-button {
  flex: 0 0 auto;
  border: none;
  border-radius: 9px;
  padding: 8px 12px;
  color: white;
  cursor: pointer;
  font-size: 12px;
  font-weight: 900;
  line-height: 1.15;
  transition:
    transform 0.15s ease,
    background 0.15s ease,
    opacity 0.15s ease;
}

.app-action-button:hover {
  transform: translateY(-1px);
}

.app-action-button:disabled {
  cursor: not-allowed;
  opacity: 0.55;
  transform: none;
}

.app-action-button.primaria {
  background: #2563eb;
}

.app-action-button.primaria:hover {
  background: #1d4ed8;
}

.app-action-button.sair {
  background: #0f172a;
}

.app-action-button.sair:hover {
  background: #1e293b;
}

.app-page-heading {
  display: grid;
  align-content: center;
  gap: 5px;
  padding: 12px 18px;
  border-radius: 14px;
}

.app-page-kicker {
  width: fit-content;
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 4px 8px;
  background: rgba(37, 99, 235, 0.1);
  color: #1d4ed8;
  font-size: 11px;
  font-weight: 900;
  letter-spacing: 0.08em;
  line-height: 1;
  text-transform: uppercase;
}

.app-page-title {
  min-width: 0;
  display: grid;
  gap: 3px;
}

.app-page-title h1 {
  margin: 0;
  color: #0f172a;
  font-size: clamp(22px, 2.1vw, 28px);
  font-weight: 900;
  line-height: 1.08;
}

.app-page-title p {
  max-width: 74ch;
  margin: 0;
  color: #475569;
  display: -webkit-box;
  overflow: hidden;
  font-size: 13px;
  line-height: 1.3;
  -webkit-box-orient: vertical;
  -webkit-line-clamp: 2;
}

@media (max-width: 900px) {
  .app-menu-button {
    display: grid;
  }
}

@media (max-width: 720px) {
  .app-topbar {
    align-items: stretch;
    flex-direction: column;
    padding: 8px;
  }

  .app-user-actions {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
  }

  .app-account-card {
    min-width: 0;
    max-width: none;
  }

  .app-action-button.primaria {
    grid-column: 1 / -1;
    width: 100%;
  }

  .app-action-button.sair {
    width: auto;
  }

  .app-page-heading {
    padding: 12px 14px;
  }
}

@media (max-width: 480px) {
  .app-topbar-titulo {
    display: none;
  }

  .app-user-actions {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .app-action-button.sair {
    grid-column: 1 / -1;
    width: 100%;
  }

  .app-page-title h1 {
    font-size: 23px;
  }
}
</style>
