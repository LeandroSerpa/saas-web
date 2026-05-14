<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarMetodosPagamentoAdmin, salvarMetodosPagamentoAdmin } from '@/services/api'

const metodosBase = [
  { codigo: 'PIX', rotulo: 'Pix' },
  { codigo: 'BOLETO', rotulo: 'Boleto' },
  { codigo: 'CARTAO_CREDITO', rotulo: 'Cartão de crédito' },
  { codigo: 'CARTAO_DEBITO', rotulo: 'Cartão de débito' },
  { codigo: 'TRANSFERENCIA', rotulo: 'Transferência' },
  { codigo: 'DINHEIRO', rotulo: 'Dinheiro' },
  { codigo: 'LINK_MANUAL', rotulo: 'Link manual' },
  { codigo: 'OUTRO', rotulo: 'Outro' },
]

const ativos = ref(['PIX'])
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const sucesso = ref('')

const pixDesmarcado = computed(() => !ativos.value.includes('PIX'))

async function carregarDados() {
  try {
    carregando.value = true
    erro.value = ''
    const dados = await buscarMetodosPagamentoAdmin()
    const lista = normalizarLista(dados)
    const selecionados = lista
      .filter((item) => item.ativo !== false)
      .map((item) => String(item.codigo || item.nome || item.metodo || item).toUpperCase())
      .filter(Boolean)
    ativos.value = selecionados.length ? selecionados : ['PIX']
  } catch (error) {
    ativos.value = ['PIX']
    erro.value = obterMensagemErro(error, 'Não foi possível carregar as configurações de pagamento.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvar() {
  if (!ativos.value.length) {
    erro.value = 'Mantenha pelo menos um método de pagamento ativo.'
    sucesso.value = ''
    return
  }

  try {
    salvando.value = true
    erro.value = ''
    sucesso.value = ''
    const metodos = metodosBase.map((metodo) => ({
      codigo: metodo.codigo,
      nome: metodo.rotulo,
      ativo: ativos.value.includes(metodo.codigo),
    }))
    await salvarMetodosPagamentoAdmin({ metodos, metodosAtivos: ativos.value })
    sucesso.value = 'Configurações de pagamento salvas com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar as configurações de pagamento.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function normalizarLista(dados) {
  if (Array.isArray(dados)) return dados
  if (!dados || typeof dados !== 'object') return []
  return dados.metodos || dados.metodosAtivos || dados.content || dados.data?.content || dados.data || dados.items || dados.itens || []
}

function obterMensagemErro(error, fallback) {
  return String(error?.message || '').trim() || fallback
}

onMounted(carregarDados)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Configurações de pagamento</h1>
        <p class="descricao">Escolha quais métodos aparecem ao criar faturas manualmente.</p>
      </div>
      <button class="botao secundario" :disabled="carregando" @click="carregarDados">Atualizar</button>
    </header>

    <section v-if="erro" class="card feedback erro">{{ erro }}</section>
    <section v-if="sucesso" class="card feedback sucesso">{{ sucesso }}</section>

    <section class="card aviso-pix">
      <strong>O PIX é o método padrão das faturas recorrentes automáticas.</strong>
      <p v-if="pixDesmarcado">Atenção: faturas recorrentes usam PIX por padrão. Recomendamos manter PIX ativo.</p>
    </section>

    <section class="card painel">
      <h2>Métodos ativos</h2>
      <p>SUPER_ADMIN pode marcar os métodos exibidos na criação manual de faturas.</p>

      <div class="lista-metodos">
        <label v-for="metodo in metodosBase" :key="metodo.codigo" class="metodo">
          <input v-model="ativos" type="checkbox" :value="metodo.codigo" />
          <span>{{ metodo.rotulo }}</span>
        </label>
      </div>

      <button class="botao principal" :disabled="salvando || carregando" @click="salvar">
        {{ salvando ? 'Salvando...' : 'Salvar configurações' }}
      </button>
    </section>
  </main>
</template>

<style scoped>
.pagina,.painel{display:grid;gap:18px;color:#111827}.cabecalho-pagina{display:flex;justify-content:space-between;align-items:center;gap:16px;flex-wrap:wrap}.subtitulo{margin:0 0 4px;color:#2563eb;font-weight:800;text-transform:uppercase}h1,h2,p{margin:0}h1{font-size:32px}.descricao,.painel p{color:#64748b}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.aviso-pix{border-color:#bfdbfe;background:#eff6ff;color:#1d4ed8}.aviso-pix p{margin-top:8px;color:#92400e}.lista-metodos{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:12px}.metodo{display:flex;align-items:center;gap:10px;border:1px solid #e5e7eb;border-radius:8px;padding:12px;font-weight:800}.metodo input{width:18px;height:18px;accent-color:#2563eb}.botao{width:fit-content;border:none;border-radius:8px;padding:10px 16px;color:white;cursor:pointer;font-weight:800}.principal{background:#2563eb}.secundario{background:#0f172a}.feedback.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.feedback.sucesso{border-color:#bbf7d0;background:#f0fdf4;color:#166534}@media(max-width:760px){.cabecalho-pagina{align-items:flex-start;flex-direction:column}.lista-metodos{grid-template-columns:1fr}}
</style>
