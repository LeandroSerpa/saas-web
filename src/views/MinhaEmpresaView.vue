<script setup>
import { computed, onMounted, ref } from 'vue'
import { atualizarMinhaEmpresa, buscarMinhaEmpresa } from '@/services/api'

const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const mensagemLinkCopiado = ref('')
const empresa = ref(criarEmpresaInicial())
const diasAtendimento = [
  { campo: 'atendeDomingo', rotulo: 'Domingo' },
  { campo: 'atendeSegunda', rotulo: 'Segunda' },
  { campo: 'atendeTerca', rotulo: 'Terca' },
  { campo: 'atendeQuarta', rotulo: 'Quarta' },
  { campo: 'atendeQuinta', rotulo: 'Quinta' },
  { campo: 'atendeSexta', rotulo: 'Sexta' },
  { campo: 'atendeSabado', rotulo: 'Sabado' },
]
const linkPublico = computed(() => {
  const slug = String(empresa.value.slug || '').trim()

  return slug ? `http://localhost:5173/agendar/${slug}` : ''
})

function criarEmpresaInicial() {
  return {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
    horaAbertura: '',
    horaFechamento: '',
    atendeDomingo: false,
    atendeSegunda: true,
    atendeTerca: true,
    atendeQuarta: true,
    atendeQuinta: true,
    atendeSexta: true,
    atendeSabado: true,
    slug: '',
    agendamentoPublicoAtivo: false,
    mensagemPublica: '',
  }
}

async function carregarMinhaEmpresa() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''
    mensagemLinkCopiado.value = ''

    const empresaApi = await buscarMinhaEmpresa()

    empresa.value = {
      nome: empresaApi.nome || '',
      documento: empresaApi.documento || '',
      telefone: empresaApi.telefone || '',
      email: empresaApi.email || '',
      endereco: empresaApi.endereco || '',
      horaAbertura: empresaApi.horaAbertura || '',
      horaFechamento: empresaApi.horaFechamento || '',
      atendeDomingo: Boolean(empresaApi.atendeDomingo),
      atendeSegunda: empresaApi.atendeSegunda !== false,
      atendeTerca: empresaApi.atendeTerca !== false,
      atendeQuarta: empresaApi.atendeQuarta !== false,
      atendeQuinta: empresaApi.atendeQuinta !== false,
      atendeSexta: empresaApi.atendeSexta !== false,
      atendeSabado: empresaApi.atendeSabado !== false,
      slug: empresaApi.slug || '',
      agendamentoPublicoAtivo: Boolean(empresaApi.agendamentoPublicoAtivo),
      mensagemPublica: empresaApi.mensagemPublica || '',
    }
  } catch (error) {
    erro.value = 'Nao foi possivel carregar os dados da empresa.'
    console.error(error)
  } finally {
    carregando.value = false
  }
}

async function salvarEmpresa() {
  try {
    erro.value = ''
    mensagemSucesso.value = ''
    mensagemLinkCopiado.value = ''

    if (!empresa.value.nome.trim()) {
      erro.value = 'Informe o nome da empresa.'
      return
    }

    salvando.value = true

    const dadosEmpresa = {
      nome: empresa.value.nome,
      documento: empresa.value.documento,
      telefone: empresa.value.telefone,
      email: empresa.value.email,
      endereco: empresa.value.endereco,
      horaAbertura: empresa.value.horaAbertura,
      horaFechamento: empresa.value.horaFechamento,
      atendeDomingo: Boolean(empresa.value.atendeDomingo),
      atendeSegunda: Boolean(empresa.value.atendeSegunda),
      atendeTerca: Boolean(empresa.value.atendeTerca),
      atendeQuarta: Boolean(empresa.value.atendeQuarta),
      atendeQuinta: Boolean(empresa.value.atendeQuinta),
      atendeSexta: Boolean(empresa.value.atendeSexta),
      atendeSabado: Boolean(empresa.value.atendeSabado),
      slug: empresa.value.slug,
      agendamentoPublicoAtivo: Boolean(empresa.value.agendamentoPublicoAtivo),
      mensagemPublica: empresa.value.mensagemPublica,
    }

    const resposta = await atualizarMinhaEmpresa(dadosEmpresa)
    const nomeAtualizado = resposta?.nome || empresa.value.nome

    atualizarEmpresaNoUsuarioLogado(nomeAtualizado)
    mensagemSucesso.value = 'Empresa atualizada com sucesso.'
  } catch (error) {
    erro.value = 'Nao foi possivel atualizar a empresa.'
    console.error(error)
  } finally {
    salvando.value = false
  }
}

async function copiarLinkPublico() {
  if (!linkPublico.value) {
    return
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(linkPublico.value)
    } else {
      const campoTemporario = document.createElement('textarea')
      campoTemporario.value = linkPublico.value
      campoTemporario.setAttribute('readonly', '')
      campoTemporario.style.position = 'absolute'
      campoTemporario.style.left = '-9999px'
      document.body.appendChild(campoTemporario)
      campoTemporario.select()
      document.execCommand('copy')
      document.body.removeChild(campoTemporario)
    }

    mensagemLinkCopiado.value = 'Link copiado com sucesso.'
  } catch (error) {
    erro.value = 'Nao foi possivel copiar o link publico.'
    console.error(error)
  }
}

function atualizarEmpresaNoUsuarioLogado(nomeEmpresa) {
  const usuarioSalvo = localStorage.getItem('usuario')

  if (!usuarioSalvo || !nomeEmpresa) {
    return
  }

  try {
    const usuario = JSON.parse(usuarioSalvo)
    usuario.empresaNome = nomeEmpresa
    localStorage.setItem('usuario', JSON.stringify(usuario))
    window.dispatchEvent(new Event('usuario-atualizado'))
  } catch (error) {
    console.error(error)
  }
}

onMounted(() => {
  carregarMinhaEmpresa()
})
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administracao</p>
        <h1>Minha empresa</h1>
        <p class="descricao">Atualize os dados cadastrais da empresa logada.</p>
      </div>

      <button class="botao secundario" @click="carregarMinhaEmpresa">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro">
      <p>{{ erro }}</p>
    </section>

    <section v-if="mensagemSucesso" class="card sucesso-card">
      <p>{{ mensagemSucesso }}</p>
    </section>

    <section v-if="carregando" class="card">
      <p>Carregando empresa...</p>
    </section>

    <section v-else class="card formulario">
      <div class="titulo-card">
        <h2>Dados da empresa</h2>
        <p>Edite as informacoes que identificam sua empresa no sistema.</p>
      </div>

      <div class="campos">
        <label>
          Nome *
          <input v-model="empresa.nome" type="text" placeholder="Ex: Barbearia Teste" />
        </label>

        <label>
          Documento
          <input v-model="empresa.documento" type="text" placeholder="Ex: 00.000.000/0001-00" />
        </label>

        <label>
          Telefone
          <input v-model="empresa.telefone" type="text" placeholder="Ex: (21) 99999-9999" />
        </label>

        <label>
          E-mail
          <input v-model="empresa.email" type="email" placeholder="Ex: contato@empresa.com" />
        </label>

        <label class="campo-grande">
          Endereco
          <input v-model="empresa.endereco" type="text" placeholder="Ex: Rua Principal, 100" />
        </label>
      </div>

      <div class="secao-horario">
        <div class="titulo-card">
          <h2>Horario de funcionamento</h2>
          <p>Configure os horarios e dias de atendimento da empresa.</p>
        </div>

        <div class="campos">
          <label>
            Hora de abertura
            <input v-model="empresa.horaAbertura" type="time" />
          </label>

          <label>
            Hora de fechamento
            <input v-model="empresa.horaFechamento" type="time" />
          </label>
        </div>

        <div class="dias-atendimento">
          <label v-for="dia in diasAtendimento" :key="dia.campo" class="campo-checkbox">
            <input v-model="empresa[dia.campo]" type="checkbox" />
            {{ dia.rotulo }}
          </label>
        </div>
      </div>

      <div class="secao-agendamento-publico">
        <div class="titulo-card">
          <h2>Agendamento público</h2>
          <p>
            Configure o link público para clientes realizarem agendamentos sem precisar acessar o
            sistema.
          </p>
        </div>

        <div class="campos">
          <label>
            Slug público
            <input v-model="empresa.slug" type="text" placeholder="petshop-rodrigo" />
          </label>

          <label class="campo-checkbox">
            <input v-model="empresa.agendamentoPublicoAtivo" type="checkbox" />
            Permitir agendamento público
          </label>

          <label class="campo-grande">
            Mensagem pública
            <textarea
              v-model="empresa.mensagemPublica"
              placeholder="Ex: Agende seu atendimento de forma rápida e simples."
              rows="4"
            ></textarea>
          </label>
        </div>

        <div class="link-publico">
          <p v-if="linkPublico">
            <strong>Link público:</strong>
            <span>{{ linkPublico }}</span>
          </p>

          <p v-else>Preencha o slug para gerar o link público.</p>

          <button class="botao secundario" :disabled="!linkPublico" @click="copiarLinkPublico">
            Copiar link
          </button>
        </div>

        <p v-if="mensagemLinkCopiado" class="sucesso-texto">{{ mensagemLinkCopiado }}</p>

        <p v-if="!empresa.agendamentoPublicoAtivo" class="aviso-publico">
          O agendamento público está desativado.
        </p>
      </div>

      <div class="rodape-formulario">
        <button class="botao principal" :disabled="salvando" @click="salvarEmpresa">
          Salvar
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario,
.secao-horario,
.secao-agendamento-publico {
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

.cabecalho-pagina h1 {
  margin: 0;
  font-size: 32px;
  font-weight: 800;
  letter-spacing: 0;
}

.descricao,
.titulo-card p {
  margin: 6px 0 0;
  color: #64748b;
}

.titulo-card h2 {
  margin: 0;
  font-size: 22px;
  color: #111827;
  font-weight: 800;
}

.titulo-card p {
  font-size: 14px;
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

label {
  display: grid;
  gap: 6px;
  color: #374151;
  font-weight: 700;
  font-size: 14px;
}

input,
textarea {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

textarea {
  resize: vertical;
  min-height: 110px;
  font-family: inherit;
}

input:focus,
textarea:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.campo-grande {
  grid-column: 1 / -1;
}

.dias-atendimento {
  display: grid;
  grid-template-columns: repeat(4, minmax(120px, 1fr));
  gap: 12px;
}

.campo-checkbox {
  align-content: center;
  grid-template-columns: auto 1fr;
  gap: 10px;
}

input[type='checkbox'] {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.link-publico {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
  flex-wrap: wrap;
  padding: 14px;
  border: 1px solid #bfdbfe;
  border-radius: 8px;
  background: #eff6ff;
}

.link-publico p {
  margin: 0;
  color: #1e3a8a;
  font-weight: 700;
  word-break: break-word;
}

.link-publico strong {
  font-weight: 800;
}

.link-publico span {
  margin-left: 6px;
}

.aviso-publico {
  margin: 0;
  color: #92400e;
  font-weight: 800;
}

.rodape-formulario {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  color: white;
  padding: 10px 16px;
  border-radius: 8px;
  cursor: pointer;
  font-weight: 800;
  transition:
    transform 0.15s ease,
    opacity 0.15s ease,
    background 0.15s ease;
}

.botao:hover {
  transform: translateY(-1px);
}

.botao:disabled {
  opacity: 0.5;
  cursor: not-allowed;
  transform: none;
}

.principal {
  background: #2563eb;
}

.principal:hover {
  background: #1d4ed8;
}

.secundario {
  background: #0f172a;
  min-width: 140px;
}

.secundario:hover {
  background: #1e293b;
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
  color: #15803d;
  font-weight: 800;
  margin: 0;
}

@media (max-width: 900px) {
  .cabecalho-pagina {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos {
    grid-template-columns: 1fr;
  }

  .dias-atendimento {
    grid-template-columns: repeat(2, minmax(120px, 1fr));
  }
}
</style>
