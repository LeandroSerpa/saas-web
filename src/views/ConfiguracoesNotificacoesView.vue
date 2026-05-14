<script setup>
import { onMounted, ref } from 'vue'
import ConfiguracoesNotificacoesForm from '@/components/ConfiguracoesNotificacoesForm.vue'
import {
  buscarMinhasConfiguracoesNotificacoes,
  salvarMinhasConfiguracoesNotificacoes,
} from '@/services/api'

const configuracao = ref(criarConfiguracaoPadrao())
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')

async function carregarConfiguracoes() {
  try {
    carregando.value = true
    erro.value = ''
    sucesso.value = ''
    configuracao.value = normalizarConfiguracao(await buscarMinhasConfiguracoesNotificacoes())
  } catch (error) {
    erro.value = 'Não foi possível carregar as configurações de notificações agora.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarConfiguracoes() {
  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    configuracao.value = normalizarConfiguracao(
      await salvarMinhasConfiguracoesNotificacoes(montarPayload(configuracao.value)),
    )
    sucesso.value = 'Configurações de notificações salvas com sucesso.'
  } catch (error) {
    erro.value =
      obterStatusErro(error) === 403
        ? 'Você não tem permissão para alterar estas configurações.'
        : 'Não foi possível salvar as configurações de notificações agora.'
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function criarConfiguracaoPadrao() {
  return {
    id: null,
    empresaId: null,
    empresaNome: '',
    lembretesAgendamentoAtivo: true,
    lembreteAgendamento24h: true,
    lembreteAgendamento2h: true,
    lembreteAgendamento30min: true,
    notificacoesFinanceirasAtivo: true,
    notificacoesSistemaAtivo: true,
    canalInternoAtivo: true,
    canalEmailAtivo: false,
    canalWhatsappAtivo: false,
  }
}

function normalizarConfiguracao(dados) {
  const origem = normalizarObjeto(dados)
  const padrao = criarConfiguracaoPadrao()

  return {
    ...padrao,
    ...origem,
    lembretesAgendamentoAtivo: booleanoComPadrao(origem.lembretesAgendamentoAtivo, true),
    lembreteAgendamento24h: booleanoComPadrao(origem.lembreteAgendamento24h, true),
    lembreteAgendamento2h: booleanoComPadrao(origem.lembreteAgendamento2h, true),
    lembreteAgendamento30min: booleanoComPadrao(origem.lembreteAgendamento30min, true),
    notificacoesFinanceirasAtivo: booleanoComPadrao(origem.notificacoesFinanceirasAtivo, true),
    notificacoesSistemaAtivo: booleanoComPadrao(origem.notificacoesSistemaAtivo, true),
    canalInternoAtivo: booleanoComPadrao(origem.canalInternoAtivo, true),
    canalEmailAtivo: booleanoComPadrao(origem.canalEmailAtivo, false),
    canalWhatsappAtivo: booleanoComPadrao(origem.canalWhatsappAtivo, false),
  }
}

function montarPayload(dados) {
  return {
    lembretesAgendamentoAtivo: dados.lembretesAgendamentoAtivo,
    lembreteAgendamento24h: dados.lembreteAgendamento24h,
    lembreteAgendamento2h: dados.lembreteAgendamento2h,
    lembreteAgendamento30min: dados.lembreteAgendamento30min,
    notificacoesFinanceirasAtivo: dados.notificacoesFinanceirasAtivo,
    notificacoesSistemaAtivo: dados.notificacoesSistemaAtivo,
    canalInternoAtivo: dados.canalInternoAtivo,
    canalEmailAtivo: dados.canalEmailAtivo,
    canalWhatsappAtivo: dados.canalWhatsappAtivo,
  }
}

function booleanoComPadrao(valor, padrao) {
  return valor === null || valor === undefined ? padrao : Boolean(valor)
}

function normalizarObjeto(dados) {
  if (!dados || typeof dados !== 'object') return {}
  return dados.data && !Array.isArray(dados.data) ? dados.data : dados
}

function obterStatusErro(error) {
  return Number(error?.status || error?.response?.status || error?.detalhes?.status || 0)
}

onMounted(carregarConfiguracoes)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Minha empresa</p>
        <h1>Configurações de notificações</h1>
        <p class="descricao">Defina quais notificações internas sua empresa deseja receber dentro do sistema.</p>
      </div>
      <button class="botao secundario" :disabled="carregando || salvando" @click="carregarConfiguracoes">Recarregar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>
    <section v-if="carregando" class="card">Carregando configurações...</section>

    <ConfiguracoesNotificacoesForm
      v-else
      v-model="configuracao"
      :carregando="carregando"
      :salvando="salvando"
      @salvar="salvarConfiguracoes"
      @recarregar="carregarConfiguracoes"
    />
  </main>
</template>

<style scoped>
.pagina {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
p {
  margin: 0;
}

h1 {
  font-size: 32px;
  font-weight: 800;
}

.descricao {
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.feedback.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.feedback.sucesso {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.secundario {
  background: #0f172a;
}

@media (max-width: 900px) {
  .cabecalho-pagina {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
