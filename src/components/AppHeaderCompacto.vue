<script setup>
import { ref } from 'vue'
import NotificacoesBell from '@/components/NotificacoesBell.vue'
import { BRAND_NAME, brandAssets } from '@/utils/brandAssets'

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
  mostrarNotificacoes: {
    type: Boolean,
    default: true,
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

const logoSrc = ref(brandAssets.logoSimbolo)

function usarFallbackLogo() {
  logoSrc.value = brandAssets.logoFallbackSvg
}
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

        <span class="app-topbar-brand-badge">
          <img class="app-topbar-logo" :src="logoSrc" :alt="BRAND_NAME" @error="usarFallbackLogo" />
        </span>

        <div class="app-topbar-titulo">
          <strong>{{ BRAND_NAME }}</strong>
          <small>{{ empresaLogada }}</small>
        </div>
      </div>

      <div class="app-topbar-preferencias">
        <slot name="preferencias"></slot>
      </div>

      <div class="app-user-actions">
        <NotificacoesBell v-if="mostrarNotificacoes" />

        <div class="app-account-card">
          <strong>{{ empresaLogada }}</strong>
          <span>Usuário: {{ nomeUsuario }}</span>
          <small>{{ identificacaoConta }}</small>
        </div>

        <slot name="acoes-secundarias"></slot>

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
  padding: 9px 12px;
  border-radius: 16px;
  background:
    radial-gradient(circle at 0 0, color-mix(in srgb, var(--app-primary) 10%, transparent), transparent 34%),
    linear-gradient(135deg, color-mix(in srgb, var(--app-surface) 94%, white), var(--app-surface));
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
  flex: 1 1 auto;
  justify-content: flex-end;
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

.app-topbar-brand-badge {
  width: 42px;
  height: 42px;
  display: inline-grid;
  flex: 0 0 auto;
  place-items: center;
  border-radius: 14px;
  padding: 4px;
  background: linear-gradient(135deg, var(--app-brand-end), var(--app-primary));
  border: 1px solid rgba(59, 130, 246, 0.28);
  box-shadow:
    0 14px 26px rgba(37, 99, 235, 0.18),
    inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.app-topbar-logo {
  display: block;
  width: 100%;
  height: 100%;
  flex: 0 0 auto;
  border-radius: 9px;
  object-fit: contain;
  opacity: 1;
  filter: none;
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
  padding: 7px 11px;
  border: 1px solid color-mix(in srgb, var(--app-primary) 14%, var(--app-border));
  border-radius: 14px;
  background: color-mix(in srgb, var(--app-surface-soft) 92%, white);
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
  filter: brightness(1.08);
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

  .app-topbar-identidade {
    order: 0;
  }

  .app-user-actions {
    order: 1;
  }

  .app-topbar-preferencias {
    order: 2;
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
    min-height: 50px;
    padding: 7px 8px;
  }

  .app-user-actions {
    display: grid;
    grid-template-columns: auto minmax(0, 1fr) auto;
    align-items: center;
    gap: 8px;
  }

  .app-account-card {
    min-width: 0;
    max-width: none;
    padding: 5px 8px;
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
    padding: 10px 12px;
  }
}

@media (max-width: 480px) {
  .app-topbar-titulo {
    display: none;
  }

  .app-topbar-brand-badge {
    width: 38px;
    height: 38px;
    padding: 4px;
  }

  .app-topbar {
    min-height: 46px;
    grid-template-columns: auto minmax(0, 1fr);
    gap: 8px;
  }

  .app-user-actions {
    grid-template-columns: auto minmax(0, 1fr);
    gap: 6px;
  }

  .app-topbar-preferencias {
    grid-template-columns: repeat(2, minmax(0, 1fr));
    display: grid;
    gap: 6px;
  }

  .app-account-card {
    padding: 4px 7px;
  }

  .app-account-card small {
    display: none;
  }

  .app-action-button {
    padding: 7px 10px;
    font-size: 11px;
  }

  .app-action-button.sair {
    grid-column: 1 / -1;
    width: 100%;
  }

  .app-page-heading {
    gap: 4px;
    padding: 10px 12px;
  }

  .app-page-title h1 {
    font-size: 22px;
  }

  .app-page-title p {
    font-size: 12px;
    -webkit-line-clamp: 1;
  }
}
</style>
