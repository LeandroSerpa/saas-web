<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  ativarSegmento,
  atualizarSegmento,
  buscarSegmentos,
  criarSegmento,
  desativarSegmento,
} from '@/services/api'

const segmentos = ref([])
const segmentoEditandoId = ref(null)
const carregando = ref(true)
const salvando = ref(false)
const atualizandoId = ref(null)
const erro = ref('')
const mensagemSucesso = ref('')
const segmento = ref(criarSegmentoInicial())

const segmentosOrdenados = computed(() =>
  [...segmentos.value].sort((a, b) => String(a.nome || '').localeCompare(String(b.nome || ''), 'pt-BR')),
)

function criarSegmentoInicial() {
  return {
    nome: '',
    codigo: '',
    descricao: '',
    icone: '',
    cor: '#2563eb',
    permiteCamposEspecificos: false,
    ativo: true,
  }
}

async function carregarSegmentos() {
  try {
    carregando.value = true
    erro.value = ''
    segmentos.value = extrairLista(await buscarSegmentos())
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível carregar os segmentos.')
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarSegmento() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!segmento.value.nome.trim()) {
      erro.value = 'Informe o nome do segmento.'
      return
    }

    if (!segmento.value.codigo.trim()) {
      erro.value = 'Informe o código do segmento.'
      return
    }

    if (!corHexValidaOuVazia(segmento.value.cor)) {
      erro.value = 'A cor deve estar no formato hexadecimal, exemplo #2563eb.'
      return
    }

    salvando.value = true
    const payload = {
      nome: segmento.value.nome,
      codigo: segmento.value.codigo,
      descricao: segmento.value.descricao,
      icone: segmento.value.icone,
      cor: segmento.value.cor || '#2563eb',
      permiteCamposEspecificos: Boolean(segmento.value.permiteCamposEspecificos),
      ativo: Boolean(segmento.value.ativo),
    }

    if (segmentoEditandoId.value) {
      await atualizarSegmento(segmentoEditandoId.value, payload)
      mensagemSucesso.value = 'Segmento atualizado com sucesso.'
    } else {
      await criarSegmento(payload)
      mensagemSucesso.value = 'Segmento criado com sucesso.'
    }

    cancelarEdicao(false)
    await carregarSegmentos()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar o segmento.')
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function alternarAtivo(item) {
  try {
    atualizandoId.value = item.id
    erro.value = ''
    mensagemSucesso.value = ''

    if (estaAtivo(item)) {
      await desativarSegmento(item.id)
      mensagemSucesso.value = 'Segmento desativado com sucesso.'
    } else {
      await ativarSegmento(item.id)
      mensagemSucesso.value = 'Segmento ativado com sucesso.'
    }

    await carregarSegmentos()
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível atualizar o status do segmento.')
    console.error(error)
  } finally {
    atualizandoId.value = null
  }
}

function editarSegmento(item) {
  segmentoEditandoId.value = item.id
  erro.value = ''
  mensagemSucesso.value = ''
  segmento.value = {
    nome: item.nome || '',
    codigo: item.codigo || '',
    descricao: item.descricao || '',
    icone: item.icone || '',
    cor: item.cor || '#2563eb',
    permiteCamposEspecificos: Boolean(item.permiteCamposEspecificos),
    ativo: estaAtivo(item),
  }
}

function cancelarEdicao(limparMensagens = true) {
  segmentoEditandoId.value = null
  segmento.value = criarSegmentoInicial()

  if (limparMensagens) {
    mensagemSucesso.value = ''
  }
}

function extrairLista(resposta) {
  if (Array.isArray(resposta)) {
    return resposta
  }

  return resposta?.content || resposta?.items || resposta?.data || []
}

function estaAtivo(item) {
  return item.ativo !== false
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}

function corHexValidaOuVazia(cor) {
  const texto = String(cor || '').trim()

  return !texto || /^#[0-9a-fA-F]{6}$/.test(texto)
}

function corVisual() {
  return corHexValidaOuVazia(segmento.value.cor) && segmento.value.cor ? segmento.value.cor : '#2563eb'
}

function atualizarCorVisual(event) {
  segmento.value.cor = event.target.value
}

function usarCorPadrao() {
  segmento.value.cor = '#2563eb'
  erro.value = ''
}

onMounted(() => {
  carregarSegmentos()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração SaaS</p>
        <h1>Segmentos/Módulos</h1>
        <p class="descricao">
          Segmentos permitem adaptar o SaaS para nichos diferentes, como Barbearia, PetShop,
          Condomínio, Clínica e outros.
        </p>
      </div>

      <button class="botao secundario" @click="carregarSegmentos">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso-card"><p>{{ mensagemSucesso }}</p></section>

    <form class="card formulario" @submit.prevent="salvarSegmento">
      <div class="titulo-card">
        <h2>{{ segmentoEditandoId ? 'Editar segmento' : 'Novo segmento' }}</h2>
        <p>Exemplos: Barbearia, PetShop, Condomínio, Salão de Beleza, Clínica, Cursos, Oficina Mecânica, Lava Jato, Personal Trainer e Psicologia/Terapia.</p>
      </div>

      <div class="campos">
        <label>Nome <input v-model="segmento.nome" type="text" placeholder="PetShop" /></label>
        <label>Código <input v-model="segmento.codigo" type="text" placeholder="PETSHOP" /></label>
        <label>Ícone <input v-model="segmento.icone" type="text" placeholder="tesoura, pata, casa..." /></label>
        <div class="campo-cor">
          <label>Cor <input :value="corVisual()" type="color" @input="atualizarCorVisual" /></label>
          <label>Código da cor <input v-model="segmento.cor" type="text" placeholder="#2563eb" /></label>
          <button type="button" class="botao secundario" @click="usarCorPadrao">Usar cor padrão</button>
        </div>
        <label class="campo-grande">Descrição <textarea v-model="segmento.descricao" rows="3"></textarea></label>
      </div>

      <div class="opcoes">
        <label class="campo-checkbox"><input v-model="segmento.permiteCamposEspecificos" type="checkbox" /> Permite campos específicos</label>
        <label class="campo-checkbox"><input v-model="segmento.ativo" type="checkbox" /> Ativo</label>
      </div>

      <div class="acoes">
        <button class="botao principal" :disabled="salvando">{{ salvando ? 'Salvando...' : 'Salvar segmento' }}</button>
        <button v-if="segmentoEditandoId" type="button" class="botao secundario" @click="cancelarEdicao">Cancelar edição</button>
      </div>
    </form>

    <section class="secao-lista">
      <div class="cabecalho-lista">
        <div>
          <h2>Segmentos cadastrados</h2>
          <p>Lista de segmentos de negócio disponíveis para empresas.</p>
        </div>
        <span class="contador">{{ segmentosOrdenados.length }} segmento(s)</span>
      </div>

      <section v-if="carregando" class="card"><p>Carregando segmentos...</p></section>
      <section v-else-if="!segmentosOrdenados.length" class="card"><p>Nenhum segmento encontrado.</p></section>

      <section v-else class="lista">
        <article v-for="item in segmentosOrdenados" :key="item.id" class="card item-card">
          <div class="topo-card">
            <div>
              <h3>{{ item.nome }}</h3>
              <p class="codigo">{{ item.codigo }}</p>
            </div>
            <span :class="['status', estaAtivo(item) ? 'ativo' : 'inativo']">{{ estaAtivo(item) ? 'Ativo' : 'Inativo' }}</span>
          </div>

          <p class="texto">{{ item.descricao || '-' }}</p>
          <div class="detalhes">
            <p><strong>Ícone:</strong> {{ item.icone || '-' }}</p>
            <p><strong>Cor:</strong> <span class="amostra" :style="{ background: item.cor || '#2563eb' }"></span> {{ item.cor || '-' }}</p>
            <p><strong>Permite campos específicos:</strong> {{ item.permiteCamposEspecificos ? 'Sim' : 'Não' }}</p>
          </div>

          <div class="acoes">
            <button class="botao neutro" @click="editarSegmento(item)">Editar</button>
            <button :class="['botao', estaAtivo(item) ? 'perigo' : 'sucesso']" :disabled="atualizandoId === item.id" @click="alternarAtivo(item)">
              {{ estaAtivo(item) ? 'Desativar' : 'Ativar' }}
            </button>
          </div>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.secao-lista,
.item-card {
  display: grid;
  gap: 18px;
  color: #111827;
}

.cabecalho-pagina,
.cabecalho-lista,
.topo-card,
.acoes,
.opcoes {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
  flex-wrap: wrap;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 800;
  text-transform: uppercase;
}

h1,
h2,
h3 {
  margin: 0;
  font-weight: 800;
}

h1 {
  font-size: 32px;
}

.descricao,
.titulo-card p,
.cabecalho-lista p,
.texto {
  margin: 6px 0 0;
  color: #64748b;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

.campo-grande {
  grid-column: 1 / -1;
}

.campo-cor {
  display: grid;
  grid-template-columns: 90px minmax(160px, 1fr);
  gap: 10px;
  align-items: end;
}

.campo-cor .botao {
  grid-column: 1 / -1;
}

label {
  display: grid;
  gap: 8px;
  color: #334155;
  font-weight: 800;
}

input,
textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 8px;
  padding: 10px 12px;
  font: inherit;
  box-sizing: border-box;
}

input[type='color'] {
  height: 42px;
  padding: 4px;
}

.campo-checkbox {
  display: flex;
  align-items: center;
  gap: 8px;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  border-radius: 8px;
  padding: 10px 12px;
}

.campo-checkbox input {
  width: auto;
}

.lista {
  display: grid;
  grid-template-columns: repeat(2, minmax(280px, 1fr));
  gap: 18px;
}

.contador,
.status {
  border-radius: 999px;
  padding: 8px 12px;
  font-size: 13px;
  font-weight: 800;
}

.contador,
.status.ativo {
  background: #dcfce7;
  color: #166534;
}

.status.inativo {
  background: #fee2e2;
  color: #991b1b;
}

.codigo {
  margin: 6px 0 0;
  color: #2563eb;
  font-weight: 800;
}

.detalhes p {
  margin: 7px 0;
  color: #374151;
}

.amostra {
  display: inline-block;
  width: 14px;
  height: 14px;
  border-radius: 4px;
  vertical-align: middle;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.principal { background: #2563eb; }
.secundario,
.neutro { background: #0f172a; }
.perigo { background: #dc2626; }
.sucesso { background: #16a34a; }

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #166534;
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .cabecalho-lista,
  .topo-card {
    align-items: flex-start;
    flex-direction: column;
  }

  .campos,
  .lista {
    grid-template-columns: 1fr;
  }
}
</style>
