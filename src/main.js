import './assets/main.css'

import { createApp } from 'vue'
import App from './App.vue'
import router from './router'
import { sincronizarTemaAparencia } from './utils/aparencia'

sincronizarTemaAparencia()

const app = createApp(App)

app.use(router)

app.mount('#app')
