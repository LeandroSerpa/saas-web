import { fileURLToPath, URL } from 'node:url'

import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import vueDevTools from 'vite-plugin-vue-devtools'

export default defineConfig({
  plugins: [vue(), vueDevTools()],
  preview: {
    host: '0.0.0.0',
    port: 4173,
    allowedHosts: [
      'automacao-le-saas-web.1mweab.easypanel.host',
      'automacao-le-saas-web-hml.1mweab.easypanel.host',
      'gestao-hml.nuvemmais.com.br',
      'gestao.nuvemmais.com.br',
      'www.gestao-hml.nuvemmais.com.br',
      'www.gestao.nuvemmais.com.br',
    ],
  },
  resolve: {
    alias: {
      '@': fileURLToPath(new URL('./src', import.meta.url)),
    },
  },
})
