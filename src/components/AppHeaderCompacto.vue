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

      <div class="app-topbar-preferencias">
        <slot name="preferencias"></slot>
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

    <slot name="visualizacao"></slot>

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
  border: 1px solid var(--app-border);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.app-topbar {
  min-height: 56px;
  display: grid;
  grid-template-columns: minmax(0, 1fr) minmax(0, auto) auto;
  align-items: center;
  gap: 12px;
  padding: 8px 12px;
  border-radius: 12px;
}

.app-topbar-identidade,
.app-topbar-preferencias,
.app-user-actions {
  min-width: 0;
  display: flex;
  align-items: center;
  gap: 10px;
}

.app-topbar-identidade {
  justify-self: start;
}

.app-topbar-preferencias {
  justify-content: center;
  flex-wrap: wrap;
}

.app-user-actions {
  justify-self: end;
  justify-content: flex-end;
}

.app-menu-button {
  display: none;
  flex: 0 0 auto;
  width: 38px;
  height: 38px;
  border: none;
  border-radius: 9px;
  background: var(--app-sidebar-bg);
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
  color: var(--app-text);
  font-size: 13px;
  font-weight: 900;
}

.app-topbar-titulo small {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 700;
}

.app-account-card {
  min-width: 160px;
  max-width: 280px;
  display: grid;
  gap: 1px;
  padding: 6px 10px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
}

.app-account-card strong {
  color: var(--app-text);
  font-size: 12px;
  font-weight: 900;
}

.app-account-card span {
  color: var(--app-text);
  font-size: 11px;
  font-weight: 800;
}

.app-account-card small {
  color: var(--app-text-muted);
  font-size: 11px;
}

.app-action-button {
  flex: 0 0 auto;
  border: none;
  border-radius: 12px;
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
  background: var(--app-primary);
}

.app-action-button.primaria:hover {
  background: var(--app-primary-strong);
}

.app-action-button.sair {
  background: var(--app-sidebar-bg);
}

.app-action-button.sair:hover {
  background: color-mix(in srgb, var(--app-sidebar-bg) 88%, white);
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
  background: var(--app-primary-soft);
  color: var(--app-primary);
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
  color: var(--app-text);
  font-size: clamp(22px, 2.1vw, 28px);
  font-weight: 900;
  line-height: 1.08;
}

.app-page-title p {
  max-width: 74ch;
  margin: 0;
  color: var(--app-text-muted);
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

  .app-topbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .app-topbar-preferencias {
    grid-column: 1 / -1;
    justify-content: flex-start;
  }

  .app-user-actions {
    grid-column: 1 / -1;
    justify-self: stretch;
  }
}

@media (max-width: 720px) {
  .app-topbar {
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

  .app-topbar-preferencias {
    gap: 8px;
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

  .app-topbar {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .app-user-actions {
    grid-template-columns: auto minmax(0, 1fr);
  }

  .app-topbar-preferencias {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    display: grid;
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
