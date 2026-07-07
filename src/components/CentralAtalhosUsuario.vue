<script setup>
import { computed, onMounted, ref } from 'vue'
import {
  atualizarAtalhoPersonalizadoUsuario,
  buscarAtalhosPersonalizadosUsuario,
  buscarMeusAtalhosUsuario,
  buscarOpcoesMeusAtalhosUsuario,
  criarAtalhoPersonalizadoUsuario,
  removerAtalhoPersonalizadoUsuario,
  reordenarAtalhosUsuario,
  resetarAtalhosUsuario,
  salvarPreferenciaAtalhoUsuario,
} from '@/services/api'
import {
  atalhosPersonalizadosUsuario,
  atalhosUsuario,
  atualizarAtalhoPersonalizadoUsuarioBackend,
  carregarAtalhosUsuarioBackend,
  criarAtalhoPersonalizadoUsuarioBackend,
  estadoSincronizacaoAtalhos,
  mensagemSincronizacaoAtalhos,
  montarResumoAtalhosUsuario,
  obterOpcoesAtalhosUsuarioFallback,
  obterResumoSincronizacaoAtalhos,
  opcoesAtalhosUsuario,
  origemAtalhosUsuario,
  origemOpcoesAtalhosUsuario,
  removerAtalhoPersonalizadoUsuarioBackend,
  reordenarAtalhosUsuarioBackend,
  resetarAtalhosUsuarioBackend,
  resumoAtalhosUsuario,
  salvarPreferenciaAtalhoUsuarioBackend,
} from '@/utils/atalhosUsuario'
import AtalhoUsuarioCard from './AtalhoUsuarioCard.vue'
import AtalhosRapidosUsuario from './AtalhosRapidosUsuario.vue'

const filtroModulo = ref('TODOS')
const filtroTipo = ref('TODOS')
const filtroStatus = ref('VISIVEIS')
const busca = ref('')
const mensagemFormulario = ref('')
const formularioPersonalizado = ref(criarFormularioPersonalizado())
const editandoPersonalizadoId = ref('')

const salvando = computed(() => ['carregando', 'salvando'].includes(estadoSincronizacaoAtalhos.value))
const resumoSincronizacao = computed(() => obterResumoSincronizacaoAtalhos())
const origemConfiguracao = computed(() => (origemAtalhosUsuario.value === 'backend' ? 'Backend' : 'localStorage'))
const origemOpcoes = computed(() => (origemOpcoesAtalhosUsuario.value === 'backend' ? 'Backend' : 'fallback local'))
const opcoesModulo = computed(() => {
  const modulos = opcoesAtalhosUsuario.value?.modulos?.length
    ? opcoesAtalhosUsuario.value.modulos
    : obterOpcoesAtalhosUsuarioFallback().modulos

  return [{ valor: 'TODOS', nome: 'Todos os modulos' }, ...modulos]
})
const opcoesTipo = computed(() => {
  const tipos = opcoesAtalhosUsuario.value?.tipos?.length
    ? opcoesAtalhosUsuario.value.tipos
    : obterOpcoesAtalhosUsuarioFallback().tipos

  return [{ valor: 'TODOS', nome: 'Todos os tipos' }, ...tipos]
})
const opcoesStatus = computed(() => [
  { valor: 'VISIVEIS', nome: 'Visiveis' },
  { valor: 'TODOS', nome: 'Todos' },
  { valor: 'FAVORITOS', nome: 'Favoritos' },
  { valor: 'FIXADOS', nome: 'Fixados' },
  { valor: 'OCULTOS', nome: 'Ocultos' },
])
const atalhosFiltrados = computed(() =>
  atalhosUsuario.value.filter((atalho) => {
    const moduloOk = filtroModulo.value === 'TODOS' || atalho.modulo === filtroModulo.value
    const tipoOk = filtroTipo.value === 'TODOS' || atalho.tipo === filtroTipo.value
    const statusOk =
      filtroStatus.value === 'TODOS' ||
      (filtroStatus.value === 'VISIVEIS' && !atalho.oculto) ||
      (filtroStatus.value === 'FAVORITOS' && atalho.favorito && !atalho.oculto) ||
      (filtroStatus.value === 'FIXADOS' && atalho.fixado && !atalho.oculto) ||
      (filtroStatus.value === 'OCULTOS' && atalho.oculto)
    const texto = normalizarTextoBusca(`${atalho.titulo} ${atalho.descricao} ${atalho.modulo} ${atalho.tipo}`)
    const buscaOk = !busca.value || texto.includes(normalizarTextoBusca(busca.value))

    return moduloOk && tipoOk && statusOk && buscaOk
  }),
)
const resumoFiltrado = computed(() => montarResumoAtalhosUsuario(atalhosFiltrados.value, []))
const editandoPersonalizado = computed(() => Boolean(editandoPersonalizadoId.value))

onMounted(() => {
  sincronizarAgora()
})

function criarFormularioPersonalizado() {
  return {
    titulo: '',
    descricao: '',
    rota: '',
    modulo: 'GERAL',
    tipo: 'TELA',
    icone: 'P',
    favorito: true,
    fixado: false,
  }
}

function normalizarTextoBusca(valor) {
  return String(valor || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toLowerCase()
}

function sincronizarAgora() {
  if (salvando.value) {
    return
  }

  void carregarAtalhosUsuarioBackend(
    buscarMeusAtalhosUsuario,
    buscarOpcoesMeusAtalhosUsuario,
    buscarAtalhosPersonalizadosUsuario,
  )
}

function alterarFavorito(chaveAtalho, favorito) {
  if (salvando.value) {
    return
  }

  void salvarPreferenciaAtalhoUsuarioBackend(chaveAtalho, { favorito }, salvarPreferenciaAtalhoUsuario)
}

function ocultarAtalho(chaveAtalho) {
  if (salvando.value) {
    return
  }

  void salvarPreferenciaAtalhoUsuarioBackend(chaveAtalho, { oculto: true, favorito: false, fixado: false }, salvarPreferenciaAtalhoUsuario)
}

function restaurarAtalho(chaveAtalho) {
  if (salvando.value) {
    return
  }

  void salvarPreferenciaAtalhoUsuarioBackend(chaveAtalho, { oculto: false }, salvarPreferenciaAtalhoUsuario)
}

function fixarAtalho(chaveAtalho, fixado) {
  if (salvando.value) {
    return
  }

  void salvarPreferenciaAtalhoUsuarioBackend(
    chaveAtalho,
    fixado ? { fixado: true, favorito: true } : { fixado: false },
    salvarPreferenciaAtalhoUsuario,
  )
}

function moverAtalho(chaveAtalho, direcao) {
  if (salvando.value) {
    return
  }

  const lista = [...atalhosUsuario.value]
  const indice = lista.findIndex((atalho) => atalho.chaveAtalho === chaveAtalho)
  const novoIndice = indice + direcao

  if (indice < 0 || novoIndice < 0 || novoIndice >= lista.length) {
    return
  }

  const [atalho] = lista.splice(indice, 1)
  lista.splice(novoIndice, 0, atalho)

  void reordenarAtalhosUsuarioBackend(
    lista.map((item) => item.chaveAtalho),
    reordenarAtalhosUsuario,
  )
}

function resetarTudo() {
  if (salvando.value) {
    return
  }

  mensagemFormulario.value = ''
  editandoPersonalizadoId.value = ''
  formularioPersonalizado.value = criarFormularioPersonalizado()
  void resetarAtalhosUsuarioBackend(resetarAtalhosUsuario)
}

async function salvarPersonalizado() {
  if (salvando.value) {
    return
  }

  mensagemFormulario.value = ''
  const acao = editandoPersonalizado.value
    ? atualizarAtalhoPersonalizadoUsuarioBackend(
        editandoPersonalizadoId.value,
        formularioPersonalizado.value,
        atualizarAtalhoPersonalizadoUsuario,
      )
    : criarAtalhoPersonalizadoUsuarioBackend(formularioPersonalizado.value, criarAtalhoPersonalizadoUsuario)
  const resultado = await acao

  if (!resultado?.valido) {
    mensagemFormulario.value = resultado?.erros?.join(' ') || 'Nao foi possivel salvar o atalho personalizado.'
    return
  }

  mensagemFormulario.value = editandoPersonalizado.value ? 'Atalho personalizado atualizado.' : 'Atalho personalizado criado.'
  editandoPersonalizadoId.value = ''
  formularioPersonalizado.value = criarFormularioPersonalizado()
}

function editarPersonalizado(atalho) {
  editandoPersonalizadoId.value = atalho.id
  formularioPersonalizado.value = {
    titulo: atalho.titulo,
    descricao: atalho.descricao,
    rota: atalho.rota,
    modulo: atalho.modulo,
    tipo: atalho.tipo,
    icone: atalho.icone,
    favorito: atalho.favorito,
    fixado: atalho.fixado,
  }
  mensagemFormulario.value = ''
}

function cancelarEdicaoPersonalizado() {
  editandoPersonalizadoId.value = ''
  formularioPersonalizado.value = criarFormularioPersonalizado()
  mensagemFormulario.value = ''
}

function removerPersonalizado(id) {
  if (salvando.value) {
    return
  }

  void removerAtalhoPersonalizadoUsuarioBackend(id, removerAtalhoPersonalizadoUsuario)
}
</script>

<template>
  <div class="central-atalhos">
    <div class="central-atalhos-sincronizacao" :class="`central-atalhos-sincronizacao--${resumoSincronizacao.tipo}`">
      <div>
        <strong>{{ resumoSincronizacao.rotulo }}</strong>
        <p>{{ resumoSincronizacao.detalhe }}</p>
      </div>
      <dl>
        <div>
          <dt>Origem</dt>
          <dd>{{ origemConfiguracao }}</dd>
        </div>
        <div>
          <dt>Opcoes</dt>
          <dd>{{ origemOpcoes }}</dd>
        </div>
      </dl>
    </div>

    <div class="central-atalhos-resumo" aria-label="Resumo dos atalhos">
      <div>
        <span>Total</span>
        <strong>{{ resumoAtalhosUsuario.total }}</strong>
      </div>
      <div>
        <span>Favoritos</span>
        <strong>{{ resumoAtalhosUsuario.favoritos }}</strong>
      </div>
      <div>
        <span>Fixados</span>
        <strong>{{ resumoAtalhosUsuario.fixados }}</strong>
      </div>
      <div>
        <span>Ocultos</span>
        <strong>{{ resumoAtalhosUsuario.ocultos }}</strong>
      </div>
      <div>
        <span>Personalizados</span>
        <strong>{{ resumoAtalhosUsuario.personalizados }}</strong>
      </div>
    </div>

    <AtalhosRapidosUsuario titulo="Previa de acoes rapidas" />

    <div class="central-atalhos-filtros">
      <label>
        Busca
        <input v-model="busca" type="search" placeholder="Buscar por titulo, modulo ou descricao" :disabled="salvando" />
      </label>

      <label>
        Modulo
        <select v-model="filtroModulo" :disabled="salvando">
          <option v-for="opcao in opcoesModulo" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.nome }}
          </option>
        </select>
      </label>

      <label>
        Tipo
        <select v-model="filtroTipo" :disabled="salvando">
          <option v-for="opcao in opcoesTipo" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.nome }}
          </option>
        </select>
      </label>

      <label>
        Status
        <select v-model="filtroStatus" :disabled="salvando">
          <option v-for="opcao in opcoesStatus" :key="opcao.valor" :value="opcao.valor">
            {{ opcao.nome }}
          </option>
        </select>
      </label>
    </div>

    <div class="central-atalhos-acoes">
      <p
        v-if="mensagemSincronizacaoAtalhos"
        class="central-atalhos-status"
        :class="`central-atalhos-status--${estadoSincronizacaoAtalhos}`"
      >
        {{ mensagemSincronizacaoAtalhos }}
      </p>

      <button class="botao secundario" type="button" :disabled="salvando" @click="sincronizarAgora">
        Sincronizar agora
      </button>

      <button class="botao secundario" type="button" :disabled="salvando" @click="resetarTudo">
        Resetar atalhos
      </button>
    </div>

    <p v-if="!atalhosFiltrados.length" class="central-atalhos-vazio">
      Nenhum atalho encontrado para os filtros selecionados.
    </p>

    <div v-else class="central-atalhos-lista">
      <AtalhoUsuarioCard
        v-for="(atalho, indice) in atalhosFiltrados"
        :key="atalho.chaveAtalho"
        :atalho="atalho"
        :salvando="salvando"
        :pode-subir="indice > 0"
        :pode-descer="indice < atalhosFiltrados.length - 1"
        @favorito="alterarFavorito"
        @ocultar="ocultarAtalho"
        @fixar="fixarAtalho"
        @restaurar="restaurarAtalho"
        @subir="moverAtalho($event, -1)"
        @descer="moverAtalho($event, 1)"
      />
    </div>

    <p v-if="atalhosFiltrados.length" class="central-atalhos-contagem">
      Exibindo {{ resumoFiltrado.total }} de {{ resumoAtalhosUsuario.total - resumoAtalhosUsuario.personalizados }} atalhos do catalogo.
    </p>

    <section class="central-atalhos-personalizados">
      <div class="central-atalhos-subtitulo">
        <h3>Atalhos personalizados</h3>
        <p>Crie links internos para telas que voce usa com frequencia.</p>
      </div>

      <form class="central-atalhos-formulario" @submit.prevent="salvarPersonalizado">
        <label>
          Titulo
          <input v-model="formularioPersonalizado.titulo" type="text" maxlength="80" :disabled="salvando" />
        </label>

        <label>
          Rota interna
          <input v-model="formularioPersonalizado.rota" type="text" placeholder="/clientes" :disabled="salvando" />
        </label>

        <label>
          Descricao
          <input v-model="formularioPersonalizado.descricao" type="text" maxlength="180" :disabled="salvando" />
        </label>

        <label>
          Modulo
          <select v-model="formularioPersonalizado.modulo" :disabled="salvando">
            <option v-for="opcao in opcoesModulo.filter((opcao) => opcao.valor !== 'TODOS')" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.nome }}
            </option>
          </select>
        </label>

        <label>
          Tipo
          <select v-model="formularioPersonalizado.tipo" :disabled="salvando">
            <option v-for="opcao in opcoesTipo.filter((opcao) => opcao.valor !== 'TODOS')" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.nome }}
            </option>
          </select>
        </label>

        <label>
          Icone textual
          <input v-model="formularioPersonalizado.icone" type="text" maxlength="4" :disabled="salvando" />
        </label>

        <label class="central-atalhos-checkbox">
          <input v-model="formularioPersonalizado.favorito" type="checkbox" :disabled="salvando" />
          <span>Favorito</span>
        </label>

        <label class="central-atalhos-checkbox">
          <input v-model="formularioPersonalizado.fixado" type="checkbox" :disabled="salvando" />
          <span>Fixado</span>
        </label>

        <div class="central-atalhos-formulario-acoes">
          <p v-if="mensagemFormulario" class="central-atalhos-status">{{ mensagemFormulario }}</p>

          <button class="botao principal" type="submit" :disabled="salvando">
            {{ editandoPersonalizado ? 'Salvar personalizado' : 'Criar personalizado' }}
          </button>

          <button v-if="editandoPersonalizado" class="botao secundario" type="button" :disabled="salvando" @click="cancelarEdicaoPersonalizado">
            Cancelar
          </button>
        </div>
      </form>

      <p v-if="!atalhosPersonalizadosUsuario.length" class="central-atalhos-vazio">
        Nenhum atalho personalizado criado.
      </p>

      <div v-else class="central-atalhos-personalizados-lista">
        <article v-for="atalho in atalhosPersonalizadosUsuario" :key="atalho.id || atalho.chaveAtalho" class="central-atalhos-personalizado">
          <div>
            <p>{{ atalho.modulo }}</p>
            <h4>{{ atalho.titulo }}</h4>
            <span>{{ atalho.rota }}</span>
          </div>

          <div class="central-atalhos-personalizado-acoes">
            <button class="botao secundario" type="button" :disabled="salvando" @click="editarPersonalizado(atalho)">
              Editar
            </button>

            <button class="botao secundario" type="button" :disabled="salvando" @click="removerPersonalizado(atalho.id)">
              Remover
            </button>
          </div>
        </article>
      </div>
    </section>
  </div>
</template>

<style scoped>
.central-atalhos {
  display: grid;
  gap: 16px;
}

.central-atalhos-sincronizacao {
  display: grid;
  grid-template-columns: minmax(0, 1fr) auto;
  gap: 16px;
  align-items: start;
  padding: 14px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-atalhos-sincronizacao strong {
  display: block;
  color: var(--app-text);
  font-size: 14px;
}

.central-atalhos-sincronizacao p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.central-atalhos-sincronizacao dl {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
  justify-content: flex-end;
  margin: 0;
}

.central-atalhos-sincronizacao dt {
  color: var(--app-text-muted);
  font-size: 11px;
  font-weight: 800;
  text-transform: uppercase;
}

.central-atalhos-sincronizacao dd {
  margin: 2px 0 0;
  color: var(--app-text);
  font-size: 13px;
  font-weight: 800;
}

.central-atalhos-sincronizacao--erro {
  border-color: var(--app-warning);
}

.central-atalhos-sincronizacao--sucesso {
  border-color: var(--app-success);
}

.central-atalhos-resumo {
  display: grid;
  grid-template-columns: repeat(5, minmax(110px, 1fr));
  gap: 10px;
}

.central-atalhos-resumo div {
  display: grid;
  gap: 4px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-atalhos-resumo span {
  color: var(--app-text-muted);
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.central-atalhos-resumo strong {
  color: var(--app-text);
  font-size: 22px;
}

.central-atalhos-filtros,
.central-atalhos-formulario {
  display: grid;
  grid-template-columns: repeat(3, minmax(180px, 1fr));
  gap: 16px;
}

.central-atalhos-filtros label,
.central-atalhos-formulario label {
  display: grid;
  gap: 6px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.central-atalhos-filtros label:first-child,
.central-atalhos-formulario label:nth-child(3),
.central-atalhos-formulario-acoes {
  grid-column: 1 / -1;
}

.central-atalhos-filtros input,
.central-atalhos-filtros select,
.central-atalhos-formulario input,
.central-atalhos-formulario select {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  padding: 11px 12px;
  background: var(--app-surface);
  color: var(--app-text);
  font-size: 15px;
  box-sizing: border-box;
}

.central-atalhos-filtros input:focus,
.central-atalhos-filtros select:focus,
.central-atalhos-formulario input:focus,
.central-atalhos-formulario select:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.central-atalhos-acoes,
.central-atalhos-formulario-acoes,
.central-atalhos-personalizado-acoes {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.central-atalhos-acoes {
  justify-content: space-between;
}

.central-atalhos-status,
.central-atalhos-vazio,
.central-atalhos-contagem {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 800;
}

.central-atalhos-status--erro {
  color: var(--app-warning);
}

.central-atalhos-status--salvo {
  color: var(--app-success);
}

.botao {
  min-height: 38px;
  border: none;
  border-radius: 8px;
  padding: 9px 13px;
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
}

.botao:disabled {
  cursor: not-allowed;
  opacity: 0.6;
}

.principal {
  background: var(--app-primary);
  color: white;
}

.secundario {
  border: 1px solid var(--app-border);
  background: var(--app-surface-soft);
  color: var(--app-text);
}

.secundario:hover {
  border-color: var(--app-primary);
  color: var(--app-primary);
}

.central-atalhos-lista {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
  gap: 12px;
}

.central-atalhos-personalizados {
  display: grid;
  gap: 14px;
  padding-top: 4px;
}

.central-atalhos-subtitulo h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 18px;
}

.central-atalhos-subtitulo p {
  margin: 4px 0 0;
  color: var(--app-text-muted);
  font-size: 14px;
}

.central-atalhos-checkbox {
  grid-template-columns: auto minmax(0, 1fr);
  align-items: center;
  gap: 10px;
  padding: 11px 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-atalhos-checkbox input {
  width: 18px;
  height: 18px;
  padding: 0;
  accent-color: var(--app-primary);
}

.central-atalhos-personalizados-lista {
  display: grid;
  gap: 10px;
}

.central-atalhos-personalizado {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  padding: 12px;
  border: 1px solid var(--app-border);
  border-radius: 8px;
  background: var(--app-surface-soft);
}

.central-atalhos-personalizado p,
.central-atalhos-personalizado h4 {
  margin: 0;
}

.central-atalhos-personalizado p {
  color: var(--app-primary);
  font-size: 12px;
  font-weight: 800;
}

.central-atalhos-personalizado h4 {
  color: var(--app-text);
  font-size: 15px;
}

.central-atalhos-personalizado span {
  color: var(--app-text-muted);
  font-size: 13px;
}

@media (max-width: 900px) {
  .central-atalhos-sincronizacao,
  .central-atalhos-resumo,
  .central-atalhos-filtros,
  .central-atalhos-formulario {
    grid-template-columns: 1fr;
  }

  .central-atalhos-sincronizacao dl {
    justify-content: flex-start;
  }

  .central-atalhos-filtros label:first-child,
  .central-atalhos-formulario label:nth-child(3),
  .central-atalhos-formulario-acoes {
    grid-column: auto;
  }

  .central-atalhos-acoes,
  .central-atalhos-acoes .botao,
  .central-atalhos-formulario-acoes .botao {
    width: 100%;
  }

  .central-atalhos-personalizado {
    display: grid;
  }
}
</style>
