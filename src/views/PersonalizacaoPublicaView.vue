<script setup>
import { computed, onMounted, ref } from 'vue'
import { buscarMinhaPersonalizacao, salvarMinhaPersonalizacao } from '@/services/api'

const temas = ['PADRAO', 'MODERNO', 'ESCURO', 'SUAVE']
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const personalizacao = ref(criarPersonalizacaoInicial())

const estilosPreview = computed(() => ({
  '--cor-principal': personalizacao.value.corPrincipal || '#2563eb',
  '--cor-secundaria': personalizacao.value.corSecundaria || '#0f172a',
}))

onMounted(() => {
  carregarPersonalizacao()
})

function criarPersonalizacaoInicial() {
  return {
    logoUrl: '',
    bannerUrl: '',
    corPrincipal: '#2563eb',
    corSecundaria: '#0f172a',
    tituloPagina: '',
    subtituloPagina: '',
    textoSobre: '',
    textoInstrucoes: '',
    politicaCancelamento: '',
    mensagemConfirmacao: '',
    whatsapp: '',
    instagram: '',
    site: '',
    tema: 'PADRAO',
    mostrarPreco: true,
    mostrarFuncionario: true,
    mostrarEndereco: true,
    mostrarTelefone: true,
  }
}

async function carregarPersonalizacao() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const dados = await buscarMinhaPersonalizacao()
    personalizacao.value = normalizarPersonalizacao(dados)
  } catch (error) {
    erro.value = 'Não foi possível carregar a personalização.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarPersonalizacao() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (!corHexValida(personalizacao.value.corPrincipal) || !corHexValida(personalizacao.value.corSecundaria)) {
      erro.value = 'A cor deve estar no formato hexadecimal, exemplo #2563eb.'
      return
    }

    salvando.value = true
    await salvarMinhaPersonalizacao({ ...personalizacao.value })
    mensagemSucesso.value = 'Personalização salva com sucesso.'
  } catch (error) {
    erro.value = 'Não foi possível salvar a personalização.'
    console.error(error)
  } finally {
    salvando.value = false
  }
}

function normalizarPersonalizacao(dados) {
  const padrao = criarPersonalizacaoInicial()
  const origem = dados && typeof dados === 'object' ? dados : {}

  return {
    ...padrao,
    ...origem,
    corPrincipal: origem.corPrincipal || padrao.corPrincipal,
    corSecundaria: origem.corSecundaria || padrao.corSecundaria,
    tema: temas.includes(origem.tema) ? origem.tema : padrao.tema,
    mostrarPreco: origem.mostrarPreco !== false,
    mostrarFuncionario: origem.mostrarFuncionario !== false,
    mostrarEndereco: origem.mostrarEndereco !== false,
    mostrarTelefone: origem.mostrarTelefone !== false,
  }
}

function corHexValida(cor) {
  return /^#[0-9a-fA-F]{6}$/.test(String(cor || '').trim())
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Agendamento público</p>
        <h1>Personalização da página pública</h1>
        <p class="descricao">
          Configure a aparência e os textos exibidos na página pública de agendamento da sua
          empresa.
        </p>
      </div>

      <button class="botao secundario" @click="carregarPersonalizacao">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando personalização...</p>
    </section>

    <section v-else class="grade">
      <form class="card formulario" @submit.prevent="salvarPersonalizacao">
        <section class="secao">
          <div class="titulo-card">
            <h2>Identidade visual</h2>
            <p>Defina imagens, cores e tema da página pública.</p>
          </div>

          <div class="campos">
            <label>
              URL do logo
              <input v-model="personalizacao.logoUrl" type="text" placeholder="https://..." />
            </label>
            <label>
              URL do banner
              <input v-model="personalizacao.bannerUrl" type="text" placeholder="https://..." />
            </label>
            <label>
              Cor principal
              <input v-model="personalizacao.corPrincipal" type="text" placeholder="#2563eb" />
            </label>
            <label>
              Cor secundária
              <input v-model="personalizacao.corSecundaria" type="text" placeholder="#0f172a" />
            </label>
            <label>
              Tema
              <select v-model="personalizacao.tema">
                <option v-for="tema in temas" :key="tema" :value="tema">{{ tema }}</option>
              </select>
            </label>
          </div>
        </section>

        <section class="secao">
          <div class="titulo-card">
            <h2>Textos da página</h2>
            <p>Personalize o conteúdo exibido aos clientes.</p>
          </div>

          <div class="campos">
            <label>
              Título da página
              <input v-model="personalizacao.tituloPagina" type="text" />
            </label>
            <label>
              Subtítulo da página
              <input v-model="personalizacao.subtituloPagina" type="text" />
            </label>
            <label class="campo-grande">
              Texto sobre a empresa
              <textarea v-model="personalizacao.textoSobre" rows="4"></textarea>
            </label>
            <label class="campo-grande">
              Instruções para o cliente
              <textarea v-model="personalizacao.textoInstrucoes" rows="4"></textarea>
            </label>
            <label class="campo-grande">
              Política de cancelamento
              <textarea v-model="personalizacao.politicaCancelamento" rows="4"></textarea>
            </label>
            <label class="campo-grande">
              Mensagem após agendamento
              <textarea v-model="personalizacao.mensagemConfirmacao" rows="4"></textarea>
            </label>
          </div>
        </section>

        <section class="secao">
          <div class="titulo-card">
            <h2>Contatos e redes</h2>
            <p>Informe links e canais de contato exibidos publicamente.</p>
          </div>

          <div class="campos">
            <label>
              WhatsApp
              <input v-model="personalizacao.whatsapp" type="text" placeholder="https://wa.me/..." />
            </label>
            <label>
              Instagram
              <input v-model="personalizacao.instagram" type="text" placeholder="https://instagram.com/..." />
            </label>
            <label>
              Site
              <input v-model="personalizacao.site" type="text" placeholder="https://..." />
            </label>
          </div>
        </section>

        <section class="secao">
          <div class="titulo-card">
            <h2>Exibição na página pública</h2>
          </div>

          <div class="opcoes">
            <label class="campo-checkbox">
              <input v-model="personalizacao.mostrarPreco" type="checkbox" />
              Mostrar preço
            </label>
            <label class="campo-checkbox">
              <input v-model="personalizacao.mostrarFuncionario" type="checkbox" />
              Mostrar funcionário
            </label>
            <label class="campo-checkbox">
              <input v-model="personalizacao.mostrarEndereco" type="checkbox" />
              Mostrar endereço
            </label>
            <label class="campo-checkbox">
              <input v-model="personalizacao.mostrarTelefone" type="checkbox" />
              Mostrar telefone
            </label>
          </div>
        </section>

        <div class="rodape-formulario">
          <button class="botao principal" :disabled="salvando">
            {{ salvando ? 'Salvando...' : 'Salvar personalização' }}
          </button>
        </div>
      </form>

      <aside class="card preview" :style="estilosPreview">
        <div v-if="personalizacao.bannerUrl" class="preview-banner">
          <img :src="personalizacao.bannerUrl" alt="" />
        </div>
        <div class="preview-topo">
          <img v-if="personalizacao.logoUrl" :src="personalizacao.logoUrl" alt="" />
          <div>
            <span>{{ personalizacao.tema }}</span>
            <h2>{{ personalizacao.tituloPagina || 'Sua empresa' }}</h2>
            <p>{{ personalizacao.subtituloPagina || 'Agende seu atendimento online.' }}</p>
          </div>
        </div>
        <p v-if="personalizacao.textoSobre" class="preview-texto">{{ personalizacao.textoSobre }}</p>
        <p v-if="personalizacao.textoInstrucoes" class="preview-instrucoes">
          {{ personalizacao.textoInstrucoes }}
        </p>
        <article class="preview-servico">
          <strong>Serviço exemplo</strong>
          <span v-if="personalizacao.mostrarPreco">R$ 120,00</span>
          <small v-if="personalizacao.mostrarFuncionario">Atendimento com profissional selecionado</small>
          <button type="button">Agendar</button>
        </article>
        <div class="preview-links">
          <a v-if="personalizacao.whatsapp">WhatsApp</a>
          <a v-if="personalizacao.instagram">Instagram</a>
          <a v-if="personalizacao.site">Site</a>
        </div>
        <p v-if="personalizacao.politicaCancelamento" class="preview-texto">
          {{ personalizacao.politicaCancelamento }}
        </p>
        <p v-if="personalizacao.mensagemConfirmacao" class="preview-confirmacao">
          {{ personalizacao.mensagemConfirmacao }}
        </p>
      </aside>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.secao,
.preview {
  display: grid;
  gap: 16px;
}

.pagina {
  gap: 24px;
  color: #111827;
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: #2563eb;
  font-size: 14px;
  font-weight: 700;
  text-transform: uppercase;
}

h1,
h2 {
  margin: 0;
  font-weight: 800;
}

h1 {
  font-size: 32px;
}

.descricao,
.titulo-card p {
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

.grade {
  display: grid;
  grid-template-columns: minmax(0, 1fr) 380px;
  gap: 18px;
  align-items: start;
}

.campos {
  display: grid;
  grid-template-columns: repeat(2, minmax(220px, 1fr));
  gap: 16px;
}

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-size: 14px;
  font-weight: 700;
}

input,
select,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  font-family: inherit;
}

.campo-grande {
  grid-column: 1 / -1;
}

.opcoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(160px, 1fr));
  gap: 12px;
}

.campo-checkbox {
  grid-template-columns: auto 1fr;
  align-items: center;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

.erro {
  border-color: #fecaca;
  background: #fef2f2;
  color: #991b1b;
}

.sucesso-card {
  border-color: #bbf7d0;
  background: #f0fdf4;
  color: #15803d;
}

.preview {
  position: sticky;
  top: 18px;
}

.preview-banner {
  height: 150px;
  overflow: hidden;
  border-radius: 8px;
}

.preview-banner img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.preview-topo {
  display: flex;
  gap: 12px;
  align-items: center;
}

.preview-topo img {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  object-fit: cover;
}

.preview-topo span {
  color: var(--cor-principal);
  font-size: 12px;
  font-weight: 800;
}

.preview-topo h2 {
  color: var(--cor-secundaria);
}

.preview-texto,
.preview-instrucoes {
  margin: 0;
  color: #475569;
}

.preview-instrucoes {
  padding: 12px;
  border-left: 4px solid var(--cor-principal);
  background: #f8fafc;
}

.preview-servico {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
}

.preview-servico span {
  color: var(--cor-principal);
  font-weight: 800;
}

.preview-servico button {
  border: none;
  border-radius: 8px;
  padding: 10px 12px;
  color: white;
  background: var(--cor-principal);
  font-weight: 800;
}

.preview-links {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.preview-links a {
  padding: 8px 10px;
  border-radius: 8px;
  color: white;
  background: var(--cor-secundaria);
  font-weight: 800;
}

.preview-confirmacao {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f0fdf4;
  color: #15803d;
  font-weight: 800;
}

@media (max-width: 1050px) {
  .grade,
  .campos,
  .opcoes {
    grid-template-columns: 1fr;
  }

  .preview {
    position: static;
  }
}
</style>
