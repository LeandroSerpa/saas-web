<script setup>
import { computed, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  buscarMinhaPersonalizacao,
  recalcularOnboarding,
  salvarMinhaPersonalizacao,
  uploadBannerEmpresa,
  uploadLogoEmpresa,
} from '@/services/api'
import { normalizarUrlImagemPublica } from '@/utils/imagens'
import {
  criarMapaVisualPublico,
  criarVariaveisCssPublicas,
  normalizarCorHex,
  normalizarTemaPublico,
  obterNomeTemaPublico,
  obterOpcoesTemasPublicos,
  obterTemaPublico,
} from '@/utils/temasPublicos'

const temas = obterOpcoesTemasPublicos()
const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const personalizacao = ref(criarPersonalizacaoInicial())
const logoPreviewComErro = ref(false)
const bannerPreviewComErro = ref(false)
const logoUploadInput = ref(null)
const bannerUploadInput = ref(null)
const enviandoLogo = ref(false)
const enviandoBanner = ref(false)
const mensagemUploadLogo = ref('')
const mensagemUploadBanner = ref('')
const route = useRoute()
const router = useRouter()
const TIPOS_IMAGEM_ACEITOS = ['image/jpeg', 'image/png', 'image/webp']
const TAMANHO_MAXIMO_IMAGEM = 5 * 1024 * 1024

const temaPreview = computed(() => normalizarTemaPublico(personalizacao.value.tema))
const temaPreviewConfig = computed(() => obterTemaPublico(temaPreview.value))
const mapaVisualPreview = computed(() =>
  criarMapaVisualPublico(corPrincipalPreview.value, corSecundariaPreview.value, temaPreview.value),
)
const estilosPreview = computed(() => ({
  ...criarVariaveisCssPublicas(mapaVisualPreview.value, '--preview-cor'),
  '--cor-principal': mapaVisualPreview.value.principal,
  '--cor-secundaria': mapaVisualPreview.value.secundaria,
}))

const classeTemaPreview = computed(() => `tema-${temaPreview.value.toLowerCase()}`)
const corPrincipalPreview = computed(() =>
  normalizarCorHex(personalizacao.value.corPrincipal, temaPreviewConfig.value.corPrincipal),
)
const corSecundariaPreview = computed(() =>
  normalizarCorHex(personalizacao.value.corSecundaria, temaPreviewConfig.value.corSecundaria),
)
const corPrincipalInvalida = computed(() => corHexDigitadaInvalida(personalizacao.value.corPrincipal))
const corSecundariaInvalida = computed(() => corHexDigitadaInvalida(personalizacao.value.corSecundaria))
const logoPreviewUrl = computed(() => normalizarUrlImagemPublica(personalizacao.value.logoUrl))
const bannerPreviewUrl = computed(() => normalizarUrlImagemPublica(personalizacao.value.bannerUrl))
const iniciaisPreview = computed(() =>
  extrairIniciais(personalizacao.value.tituloPagina || personalizacao.value.tituloCatalogo || 'NM'),
)

watch(
  () => personalizacao.value.logoUrl,
  () => {
    logoPreviewComErro.value = false
  },
)

watch(
  () => personalizacao.value.bannerUrl,
  () => {
    bannerPreviewComErro.value = false
  },
)

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

function limparMensagensUpload() {
  mensagemUploadLogo.value = ''
  mensagemUploadBanner.value = ''
}

async function carregarPersonalizacao() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    limparMensagensUpload()

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
    limparMensagensUpload()

    const corPrincipal = normalizarCorHex(personalizacao.value.corPrincipal, '')
    const corSecundaria = normalizarCorHex(personalizacao.value.corSecundaria, '')
    const logoUrl = normalizarUrlImagemPublica(personalizacao.value.logoUrl)
    const bannerUrl = normalizarUrlImagemPublica(personalizacao.value.bannerUrl)

    if (!corPrincipal || !corSecundaria) {
      erro.value = 'A cor deve estar no formato hexadecimal, exemplo #2563eb.'
      return
    }

    salvando.value = true
    personalizacao.value.corPrincipal = corPrincipal
    personalizacao.value.corSecundaria = corSecundaria
    personalizacao.value.logoUrl = logoUrl
    personalizacao.value.bannerUrl = bannerUrl
    await salvarMinhaPersonalizacao({
      ...personalizacao.value,
      corPrincipal,
      corSecundaria,
      logoUrl,
      bannerUrl,
    })
    await retornarParaOnboardingSeNecessario('PERSONALIZACAO')
    mensagemSucesso.value = 'Personalização salva com sucesso.'
  } catch (error) {
    erro.value = obterMensagemErro(error, 'Não foi possível salvar a personalização.')
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
    logoUrl: normalizarUrlImagemPublica(origem.logoUrl),
    bannerUrl: normalizarUrlImagemPublica(origem.bannerUrl),
    corPrincipal: normalizarCorHex(origem.corPrincipal, padrao.corPrincipal),
    corSecundaria: normalizarCorHex(origem.corSecundaria, padrao.corSecundaria),
    tema: normalizarTemaPublico(origem.tema || padrao.tema),
    mostrarPreco: origem.mostrarPreco !== false,
    mostrarFuncionario: origem.mostrarFuncionario !== false,
    mostrarEndereco: origem.mostrarEndereco !== false,
    mostrarTelefone: origem.mostrarTelefone !== false,
  }
}

function validarArquivoImagem(arquivo) {
  if (!arquivo) {
    return 'Selecione uma imagem para enviar.'
  }

  if (!TIPOS_IMAGEM_ACEITOS.includes(arquivo.type) || arquivo.size > TAMANHO_MAXIMO_IMAGEM) {
    return 'A imagem precisa ser JPG, PNG ou WEBP e ter ate 5 MB.'
  }

  return ''
}

function limparCampoArquivo(tipo) {
  if (tipo === 'logo' && logoUploadInput.value) {
    logoUploadInput.value.value = ''
  }

  if (tipo === 'banner' && bannerUploadInput.value) {
    bannerUploadInput.value.value = ''
  }
}

function obterMensagemErroUploadImagem(error) {
  const mensagem = String(error?.message || '').trim().toLowerCase()

  if (
    mensagem.includes('arquivo') ||
    mensagem.includes('imagem') ||
    mensagem.includes('formato') ||
    mensagem.includes('tipo') ||
    mensagem.includes('5 mb') ||
    mensagem.includes('tamanho') ||
    mensagem.includes('grande')
  ) {
    return 'A imagem precisa ser JPG, PNG ou WEBP e ter ate 5 MB.'
  }

  return 'Nao foi possivel enviar a imagem agora. Tente novamente com um arquivo valido.'
}

async function enviarImagemPersonalizacao(tipo, evento) {
  const arquivo = evento?.target?.files?.[0]
  const mensagemValidacao = validarArquivoImagem(arquivo)

  if (tipo === 'logo') {
    mensagemUploadLogo.value = ''
  } else {
    mensagemUploadBanner.value = ''
  }

  if (mensagemValidacao) {
    erro.value = mensagemValidacao
    limparCampoArquivo(tipo)
    return
  }

  try {
    erro.value = ''
    mensagemSucesso.value = ''

    if (tipo === 'logo') {
      enviandoLogo.value = true
      const resposta = await uploadLogoEmpresa(arquivo)
      personalizacao.value.logoUrl = normalizarUrlImagemPublica(resposta?.url)
      logoPreviewComErro.value = false
      mensagemUploadLogo.value = 'Imagem enviada com sucesso.'
    } else {
      enviandoBanner.value = true
      const resposta = await uploadBannerEmpresa(arquivo)
      personalizacao.value.bannerUrl = normalizarUrlImagemPublica(resposta?.url)
      bannerPreviewComErro.value = false
      mensagemUploadBanner.value = 'Imagem enviada com sucesso.'
    }
  } catch (error) {
    erro.value = obterMensagemErroUploadImagem(error)
    console.error(error)
  } finally {
    if (tipo === 'logo') {
      enviandoLogo.value = false
    } else {
      enviandoBanner.value = false
    }

    limparCampoArquivo(tipo)
  }
}

async function retornarParaOnboardingSeNecessario(etapaEsperada) {
  if (!veioDoOnboarding()) return

  await recalcularOnboarding().catch((error) => console.error(error))
  limparOrigemOnboarding()
  router.push({ path: '/onboarding', query: { atualizado: 'true' } })
}

function veioDoOnboarding() {
  return route.query.origem === 'onboarding' || sessionStorage.getItem('origemOnboarding') === 'true'
}

function limparOrigemOnboarding() {
  sessionStorage.removeItem('origemOnboarding')
  sessionStorage.removeItem('etapaOnboarding')
}

function corHexValida(cor) {
  return /^#[0-9a-fA-F]{6}$/.test(String(cor || '').trim())
}

function corHexDigitadaInvalida(cor) {
  const texto = String(cor || '').trim()

  if (!texto) {
    return false
  }

  return !/^#?[0-9a-fA-F]{6}$/.test(texto)
}

function normalizarTema(tema) {
  return normalizarTemaPublico(tema)
}

function extrairIniciais(texto) {
  const palavras = String(texto || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)

  if (!palavras.length) {
    return 'NM'
  }

  return palavras.map((parte) => parte.charAt(0).toUpperCase()).join('')
}

function nomeTema(tema) {
  return obterNomeTemaPublico(tema)
}

function aplicarTemaSelecionado(valor) {
  const tema = normalizarTemaPublico(valor)
  const configuracao = obterTemaPublico(tema)

  personalizacao.value.tema = tema
  personalizacao.value.corPrincipal = configuracao.corPrincipal
  personalizacao.value.corSecundaria = configuracao.corSecundaria
}

function obterMensagemErro(error, fallback) {
  const mensagem = typeof error?.message === 'string' ? error.message.trim() : ''

  return mensagem || fallback
}
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Agendamento público</p>
        <h1>Personalização da página pública</h1>
        <p class="descricao">
          Configure a aparência e os textos exibidos no agendamento público e também no
          catálogo/cardápio da sua empresa.
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
            <p>Defina imagens, cores e tema das páginas públicas da sua empresa.</p>
          </div>

          <div class="campos">
            <label>
              URL do logo
              <input v-model="personalizacao.logoUrl" type="text" placeholder="https://..." />
            </label>
            <label>
              URL do banner
              <input v-model="personalizacao.bannerUrl" type="text" placeholder="https://..." />
              <small class="ajuda-campo neutro">Recomendado: imagem horizontal, por exemplo 1600x450 ou 1800x500. O recorte se ajusta automaticamente.</small>
            </label>
            <div class="campo-grande uploads-personalizacao">
              <article class="upload-card">
                <div class="upload-card-topo">
                  <div>
                    <strong>Logo da empresa</strong>
                    <small>Envie uma imagem ou mantenha a URL externa, se preferir.</small>
                  </div>
                </div>
                <div v-if="logoPreviewUrl" class="preview-upload-imagem">
                  <img v-if="!logoPreviewComErro" :src="logoPreviewUrl" alt="Preview do logo" @error="logoPreviewComErro = true" />
                  <div v-else class="preview-upload-fallback">
                    <strong>Preview indisponivel</strong>
                    <small>O link atual nao carregou, mas continua salvo.</small>
                  </div>
                </div>
                <div v-else class="preview-upload-fallback preview-upload-vazio">
                  <strong>Sem logo enviado</strong>
                  <small>Voce pode usar upload ou colar uma URL externa.</small>
                </div>
                <div class="upload-acoes">
                  <input
                    ref="logoUploadInput"
                    class="input-arquivo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="enviandoLogo"
                    @change="enviarImagemPersonalizacao('logo', $event)"
                  />
                  <button class="botao secundario" type="button" :disabled="enviandoLogo" @click="logoUploadInput?.click()">
                    {{ enviandoLogo ? 'Enviando logo...' : 'Enviar logo' }}
                  </button>
                </div>
                <p v-if="mensagemUploadLogo" class="sucesso-texto">{{ mensagemUploadLogo }}</p>
                <small class="ajuda-campo neutro">A imagem precisa ser JPG, PNG ou WEBP e ter ate 5 MB.</small>
              </article>

              <article class="upload-card">
                <div class="upload-card-topo">
                  <div>
                    <strong>Banner da empresa</strong>
                    <small>Envie uma imagem ou mantenha a URL externa, se preferir.</small>
                  </div>
                </div>
                <div v-if="bannerPreviewUrl" class="preview-upload-imagem">
                  <img v-if="!bannerPreviewComErro" :src="bannerPreviewUrl" alt="Preview do banner" @error="bannerPreviewComErro = true" />
                  <div v-else class="preview-upload-fallback">
                    <strong>Preview indisponivel</strong>
                    <small>O link atual nao carregou, mas continua salvo.</small>
                  </div>
                </div>
                <div v-else class="preview-upload-fallback preview-upload-vazio">
                  <strong>Sem banner enviado</strong>
                  <small>Voce pode usar upload ou colar uma URL externa.</small>
                </div>
                <div class="upload-acoes">
                  <input
                    ref="bannerUploadInput"
                    class="input-arquivo"
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    :disabled="enviandoBanner"
                    @change="enviarImagemPersonalizacao('banner', $event)"
                  />
                  <button class="botao secundario" type="button" :disabled="enviandoBanner" @click="bannerUploadInput?.click()">
                    {{ enviandoBanner ? 'Enviando banner...' : 'Enviar banner' }}
                  </button>
                </div>
                <p v-if="mensagemUploadBanner" class="sucesso-texto">{{ mensagemUploadBanner }}</p>
                <small class="ajuda-campo neutro">A imagem precisa ser JPG, PNG ou WEBP e ter ate 5 MB.</small>
              </article>
            </div>
            <small class="dica campo-grande">
              Você pode colar um link direto de imagem ou um link público do Google Drive. No Google Drive,
              deixe o arquivo como "Qualquer pessoa com o link pode ver".
            </small>
            <label class="campo-cor">
              <span>Cor principal</span>
              <div class="campo-cor-controles">
                <input
                  :value="corPrincipalPreview"
                  class="seletor-cor"
                  type="color"
                  aria-label="Selecionar cor principal"
                  @input="personalizacao.corPrincipal = normalizarCorHex($event.target.value, '#2563eb')"
                />
                <span class="amostra-cor" :style="{ backgroundColor: corPrincipalPreview }" aria-hidden="true"></span>
                <input
                  v-model="personalizacao.corPrincipal"
                  :class="{ invalido: corPrincipalInvalida }"
                  class="campo-cor-texto"
                  type="text"
                  placeholder="#2563eb"
                  @blur="personalizacao.corPrincipal = normalizarCorHex(personalizacao.corPrincipal, '#2563eb')"
                />
              </div>
              <small class="ajuda-campo">Clique no quadrado para escolher uma cor. O código hexadecimal será preenchido automaticamente.</small>
              <small v-if="corPrincipalInvalida" class="ajuda-campo aviso">Use o formato #000000.</small>
              <small class="ajuda-campo neutro">Use a cor principal para botões, destaques, agendamento e catálogo.</small>
            </label>
            <label class="campo-cor">
              <span>Cor secundária</span>
              <div class="campo-cor-controles">
                <input
                  :value="corSecundariaPreview"
                  class="seletor-cor"
                  type="color"
                  aria-label="Selecionar cor secundária"
                  @input="personalizacao.corSecundaria = normalizarCorHex($event.target.value, '#0f172a')"
                />
                <span class="amostra-cor" :style="{ backgroundColor: corSecundariaPreview }" aria-hidden="true"></span>
                <input
                  v-model="personalizacao.corSecundaria"
                  :class="{ invalido: corSecundariaInvalida }"
                  class="campo-cor-texto"
                  type="text"
                  placeholder="#0f172a"
                  @blur="personalizacao.corSecundaria = normalizarCorHex(personalizacao.corSecundaria, '#0f172a')"
                />
              </div>
              <small class="ajuda-campo">Clique no quadrado para escolher uma cor. O código hexadecimal será preenchido automaticamente.</small>
              <small v-if="corSecundariaInvalida" class="ajuda-campo aviso">Use o formato #000000.</small>
              <small class="ajuda-campo neutro">Use a cor secundária para detalhes, contraste e elementos de apoio.</small>
            </label>
            <label>
              Tema
              <select :value="personalizacao.tema" @change="aplicarTemaSelecionado($event.target.value)">
                <option v-for="tema in temas" :key="tema.valor" :value="tema.valor">{{ tema.nome }}</option>
              </select>
              <small class="ajuda-campo neutro">O tema afeta a página pública de agendamento e também o catálogo/cardápio.</small>
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

      <aside class="card preview" :class="classeTemaPreview" :style="estilosPreview">
        <div class="preview-legenda">
          <span>Preview unificado</span>
          <small>As mesmas cores aparecem no agendamento e na vitrine pública.</small>
        </div>
        <div v-if="bannerPreviewUrl && !bannerPreviewComErro" class="preview-banner">
          <img :src="bannerPreviewUrl" alt="" @error="bannerPreviewComErro = true" />
        </div>
        <div v-else class="preview-banner preview-banner-placeholder" aria-hidden="true">
          <strong>{{ personalizacao.tituloPagina || 'Banner da empresa' }}</strong>
        </div>
        <div class="preview-topo">
          <img
            v-if="logoPreviewUrl && !logoPreviewComErro"
            :src="logoPreviewUrl"
            alt=""
            @error="logoPreviewComErro = true"
          />
          <div v-else class="preview-logo-fallback" aria-hidden="true">{{ iniciaisPreview }}</div>
          <div>
            <span>{{ nomeTema(normalizarTema(personalizacao.tema)) }}</span>
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
        <section class="preview-catalogo">
          <div class="preview-catalogo-topo">
            <div>
              <span>Exemplo de catálogo</span>
              <strong>{{ personalizacao.tituloPagina || 'Sua vitrine pública' }}</strong>
            </div>
            <b class="preview-badge">Disponível</b>
          </div>
          <article class="preview-produto">
            <div class="preview-produto-capa">
              <span>{{ (personalizacao.tituloPagina || 'NM').slice(0, 2).toUpperCase() }}</span>
            </div>
            <div class="preview-produto-corpo">
              <strong>Produto exemplo</strong>
              <small>{{ personalizacao.subtituloPagina || 'Ideal para destacar a sua marca no catálogo.' }}</small>
              <div class="preview-produto-rodape">
                <span>R$ 49,90</span>
                <button type="button">WhatsApp</button>
              </div>
            </div>
          </article>
        </section>
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
.preview,
.uploads-personalizacao,
.upload-card {
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

.uploads-personalizacao {
  grid-template-columns: repeat(2, minmax(0, 1fr));
}

.upload-card {
  padding: 16px;
  border: 1px solid #dbe4f0;
  border-radius: 12px;
  background: #f8fafc;
}

.upload-card-topo {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  gap: 12px;
}

.preview-upload-imagem,
.preview-upload-fallback {
  min-height: 180px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  overflow: hidden;
}

.preview-upload-imagem img {
  width: 100%;
  height: 180px;
  object-fit: cover;
  display: block;
}

.preview-upload-fallback {
  display: grid;
  place-items: center;
  gap: 6px;
  padding: 18px;
  text-align: center;
  background:
    radial-gradient(circle at top left, rgba(37, 99, 235, 0.12), transparent 34%),
    linear-gradient(135deg, #eff6ff, #f8fafc);
  color: #1d4ed8;
}

.preview-upload-vazio {
  color: #475569;
}

.upload-acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.input-arquivo {
  position: absolute;
  width: 1px;
  height: 1px;
  opacity: 0;
  pointer-events: none;
}

.campo-cor {
  align-content: start;
}

.campo-cor-controles {
  display: grid;
  grid-template-columns: auto auto minmax(0, 1fr);
  gap: 10px;
  align-items: center;
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

input[type='color'] {
  width: 48px;
  height: 48px;
  padding: 4px;
  cursor: pointer;
}

input[type='color']::-webkit-color-swatch-wrapper {
  padding: 0;
}

input[type='color']::-webkit-color-swatch {
  border: 0;
  border-radius: 10px;
}

.seletor-cor {
  border: 1px solid #d1d5db;
  border-radius: 12px;
  background: white;
}

.amostra-cor {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  border: 1px solid rgba(15, 23, 42, 0.12);
  box-shadow: inset 0 0 0 1px rgba(255, 255, 255, 0.55);
}

.campo-cor-texto {
  min-width: 0;
}

.ajuda-campo {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.35;
}

.ajuda-campo.aviso {
  color: #b45309;
}

.ajuda-campo.neutro {
  color: #475569;
}

.dica {
  margin: 0;
  color: #64748b;
  font-size: 12px;
  font-weight: 600;
  line-height: 1.45;
}

.invalido {
  border-color: #f59e0b;
  box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.12);
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
  align-items: start;
  min-width: 0;
  line-height: 1.35;
  white-space: normal;
  overflow-wrap: break-word;
}

input[type='checkbox'] {
  flex: 0 0 auto;
  width: 18px;
  height: 18px;
  margin-top: 1px;
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

.sucesso-texto {
  margin: 0;
  color: #15803d;
  font-weight: 800;
}

.preview {
  position: sticky;
  top: 18px;
  background: var(--preview-cor-card);
  border-color: var(--preview-cor-borda);
  color: var(--preview-cor-texto);
  overflow: hidden;
  transition:
    background 0.2s ease,
    border-color 0.2s ease,
    box-shadow 0.2s ease;
}

.preview.tema-padrao {
  background: var(--preview-cor-card);
  border-color: var(--preview-cor-borda);
}

.preview.tema-moderno {
  border-radius: 18px;
  border-color: var(--preview-cor-borda);
  background: var(--preview-cor-card);
  box-shadow: 0 22px 52px rgba(15, 23, 42, 0.18);
}

.preview.tema-escuro,
.preview.tema-preto_elegante {
  border-color: rgba(148, 163, 184, 0.24);
  background: var(--preview-cor-card);
  color: var(--preview-cor-texto);
  box-shadow: 0 22px 54px rgba(2, 6, 23, 0.34);
}

.preview.tema-suave {
  border-color: var(--preview-cor-borda);
  background: var(--preview-cor-card);
  box-shadow: 0 10px 28px rgba(37, 99, 235, 0.08);
}

.preview-legenda {
  display: grid;
  gap: 4px;
}

.preview-legenda span {
  color: var(--cor-principal);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.06em;
}

.preview-legenda small {
  color: var(--preview-cor-texto-suave);
  font-weight: 600;
}

.preview-banner {
  min-height: 132px;
  height: clamp(132px, 24vw, 190px);
  max-height: 210px;
  overflow: hidden;
  border-radius: 8px;
  background: color-mix(in srgb, var(--preview-cor-fundo-secundario), white 72%);
  padding: 8px;
}

.tema-moderno .preview-banner {
  border-radius: 16px;
}

.preview-banner img {
  width: 100%;
  height: 100%;
  display: block;
  object-fit: contain;
  object-position: center;
  border-radius: 6px;
  background: #ffffff;
}

.preview-banner-placeholder {
  display: grid;
  place-items: center;
  gap: 6px;
  background: var(--preview-cor-hero);
  color: var(--cor-secundaria);
  text-align: center;
  padding: 18px;
}

.preview-banner-placeholder strong {
  font-size: 16px;
  font-weight: 800;
}

.preview-topo {
  display: flex;
  gap: 12px;
  align-items: center;
  min-width: 0;
}

.preview-topo img {
  width: 58px;
  height: 58px;
  flex: 0 0 58px;
  border-radius: 8px;
  object-fit: contain;
  background: #ffffff;
  border: 1px solid var(--preview-cor-borda);
}

.preview-logo-fallback {
  width: 58px;
  height: 58px;
  border-radius: 8px;
  display: grid;
  place-items: center;
  background: linear-gradient(145deg, var(--cor-principal), var(--cor-secundaria));
  color: white;
  font-size: 20px;
  font-weight: 800;
  flex: 0 0 auto;
}

.preview-topo span {
  color: var(--cor-principal);
  font-size: 12px;
  font-weight: 800;
}

.preview-topo h2 {
  color: var(--preview-cor-texto);
  overflow-wrap: anywhere;
}

.tema-escuro .preview-topo h2,
.tema-escuro .preview-legenda small,
.tema-escuro .preview-texto,
.tema-escuro .preview-instrucoes,
.tema-escuro .preview-servico small,
.tema-escuro .preview-produto small,
.tema-preto_elegante .preview-topo h2,
.tema-preto_elegante .preview-legenda small,
.tema-preto_elegante .preview-texto,
.tema-preto_elegante .preview-instrucoes,
.tema-preto_elegante .preview-servico small,
.tema-preto_elegante .preview-produto small {
  color: #e5e7eb;
}

.preview-texto,
.preview-instrucoes {
  margin: 0;
  color: var(--preview-cor-texto-suave);
  line-height: 1.5;
  overflow-wrap: anywhere;
}

.preview-instrucoes {
  padding: 12px;
  border-left: 4px solid var(--cor-principal);
  background: var(--preview-cor-fundo-secundario);
}

.tema-moderno .preview-instrucoes {
  border-radius: 14px;
  border-left: none;
  background: rgba(255, 255, 255, 0.72);
  box-shadow: inset 0 0 0 1px rgba(37, 99, 235, 0.12);
}

.tema-escuro .preview-instrucoes,
.tema-preto_elegante .preview-instrucoes {
  background: #1f2937;
  border-left-color: var(--cor-principal);
}

.tema-suave .preview-instrucoes {
  background: #eef6ff;
  border-left-color: color-mix(in srgb, var(--cor-principal), white 30%);
}

.preview-servico {
  display: grid;
  gap: 8px;
  padding: 14px;
  border: 1px solid var(--preview-cor-borda);
  border-radius: 8px;
  background: #ffffff;
  color: #111827;
}

.tema-moderno .preview-servico {
  border-radius: 16px;
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow: 0 14px 34px rgba(37, 99, 235, 0.16);
}

.tema-escuro .preview-servico,
.tema-preto_elegante .preview-servico {
  border-color: rgba(148, 163, 184, 0.22);
  background: #1f2937;
}

.tema-suave .preview-servico {
  border-color: #dbeafe;
  background: #ffffff;
  box-shadow: 0 8px 18px rgba(37, 99, 235, 0.06);
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

.tema-moderno .preview-servico button {
  border-radius: 999px;
  padding: 12px 16px;
  box-shadow: 0 12px 22px rgba(37, 99, 235, 0.24);
}

.tema-suave .preview-servico button {
  color: var(--cor-secundaria);
  background: color-mix(in srgb, var(--cor-principal), white 76%);
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

.tema-moderno .preview-links a {
  border-radius: 999px;
}

.tema-escuro .preview-links a,
.tema-preto_elegante .preview-links a {
  background: #374151;
}

.tema-suave .preview-links a {
  color: var(--cor-secundaria);
  background: #e0f2fe;
}

.preview-confirmacao {
  margin: 0;
  padding: 12px;
  border-radius: 8px;
  background: #f0fdf4;
  color: #15803d;
  font-weight: 800;
}

.preview-catalogo {
  display: grid;
  gap: 12px;
  padding: 14px;
  border-radius: 14px;
  border: 1px solid var(--preview-cor-borda);
  background: #ffffff;
  color: #111827;
}

.preview-catalogo-topo {
  display: flex;
  justify-content: space-between;
  gap: 12px;
  align-items: flex-start;
  min-width: 0;
}

.preview-catalogo-topo span {
  display: block;
  color: var(--cor-secundaria);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.preview-catalogo-topo strong {
  display: block;
  margin-top: 4px;
  overflow-wrap: anywhere;
}

.preview-badge {
  display: inline-flex;
  align-items: center;
  border-radius: 999px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--cor-principal), white 84%);
  color: var(--cor-principal);
  font-size: 11px;
  font-weight: 800;
  white-space: nowrap;
}

.preview-produto {
  display: grid;
  grid-template-columns: 80px minmax(0, 1fr);
  gap: 12px;
  align-items: center;
}

.preview-produto-capa {
  width: 80px;
  height: 80px;
  border-radius: 18px;
  display: grid;
  place-items: center;
  background: linear-gradient(135deg, var(--cor-principal), var(--cor-secundaria));
  color: white;
  font-size: 24px;
  font-weight: 900;
}

.preview-produto-corpo {
  display: grid;
  gap: 6px;
  min-width: 0;
}

.preview-produto-corpo strong,
.preview-produto-corpo small {
  overflow-wrap: anywhere;
}

.preview-produto-corpo small {
  color: #475569;
  line-height: 1.4;
}

.preview-produto-rodape {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 10px;
}

.preview-produto-rodape span {
  color: var(--cor-principal);
  font-weight: 800;
}

.preview-produto-rodape button {
  border: none;
  border-radius: 999px;
  padding: 9px 14px;
  color: white;
  background: var(--cor-principal);
  font-weight: 800;
  white-space: nowrap;
}

.tema-moderno .preview-catalogo {
  border-radius: 20px;
  border-color: rgba(37, 99, 235, 0.16);
  box-shadow: 0 16px 34px rgba(37, 99, 235, 0.12);
}

.tema-escuro .preview-catalogo,
.tema-preto_elegante .preview-catalogo {
  border-color: rgba(148, 163, 184, 0.22);
  background: #0f172a;
}

.tema-escuro .preview-catalogo-topo span,
.tema-escuro .preview-catalogo-topo strong,
.tema-preto_elegante .preview-catalogo-topo span,
.tema-preto_elegante .preview-catalogo-topo strong {
  color: #f8fafc;
}

.tema-suave .preview-catalogo {
  border-color: #dbeafe;
  background: linear-gradient(135deg, #ffffff, #f0f7ff);
}

@media (max-width: 1050px) {
  .grade,
  .campos,
  .uploads-personalizacao,
  .opcoes {
    grid-template-columns: 1fr;
  }

  .preview {
    position: static;
  }
}

@media (max-width: 560px) {
  .preview-banner {
    min-height: 118px;
    height: clamp(118px, 44vw, 176px);
    max-height: 176px;
  }

  .preview-produto {
    grid-template-columns: 64px minmax(0, 1fr);
  }

  .preview-produto-capa {
    width: 64px;
    height: 64px;
    border-radius: 14px;
    font-size: 20px;
  }

  .preview-produto-rodape {
    align-items: flex-start;
    flex-direction: column;
  }
}
</style>
