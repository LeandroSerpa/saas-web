<script setup>
import { computed } from 'vue'
import { RouterLink } from 'vue-router'
import { obterAtalhosRapidosUsuario } from '@/utils/atalhosUsuario'

const props = defineProps({
  limite: {
    type: Number,
    default: 3,
  },
  titulo: {
    type: String,
    default: 'Acoes rapidas',
  },
})

const atalhosRapidos = computed(() => obterAtalhosRapidosUsuario({ limite: props.limite }))
</script>

<template>
  <div class="atalhos-rapidos">
    <div class="atalhos-rapidos-topo">
      <h3>{{ titulo }}</h3>
      <span>{{ atalhosRapidos.length }}</span>
    </div>

    <p v-if="!atalhosRapidos.length" class="atalhos-rapidos-vazio">
      Fixe ou favorite atalhos para ver uma previa aqui.
    </p>

    <div v-else class="atalhos-rapidos-lista">
      <RouterLink v-for="atalho in atalhosRapidos" :key="atalho.chaveAtalho" class="atalho-rapido" :to="atalho.rota">
        <span aria-hidden="true">{{ atalho.icone || 'A' }}</span>
        <strong>{{ atalho.titulo }}</strong>
      </RouterLink>
    </div>
  </div>
</template>

<style scoped>
.atalhos-rapidos {
  display: grid;
  gap: 12px;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.atalhos-rapidos-topo {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.atalhos-rapidos h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 16px;
}

.atalhos-rapidos-topo span {
  display: inline-flex;
  min-width: 28px;
  height: 28px;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  background: var(--app-surface);
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 900;
}

.atalhos-rapidos-vazio {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.atalhos-rapidos-lista {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.atalho-rapido {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  min-height: 38px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 8px 10px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
}

.atalho-rapido:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.atalho-rapido span {
  display: inline-flex;
  width: 24px;
  min-width: 24px;
  height: 24px;
  align-items: center;
  justify-content: center;
  border-radius: 6px;
  background: var(--app-surface-soft);
  font-size: 11px;
  font-weight: 900;
}
</style>
