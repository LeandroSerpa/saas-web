<script setup>
import { computed, onMounted, reactive, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  atualizarMinhaEmpresa,
  buscarMinhaEmpresa,
  montarLinkPublicoAgendamento,
  recalcularOnboarding,
} from '@/services/api'
import {
  criarManipuladorPasteNumerico,
  documentoBasicoValido,
  emailBasicoValido,
  inteiroPositivoValido,
  limparEspacos,
  sanitizarDocumento,
  sanitizarInteiroPositivo,
  sanitizarTelefone,
  sanitizarTelefoneDoEvento,
  telefoneBasicoValido,
} from '@/utils/validacoes'

const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const mensagemLinkCopiado = ref('')
const empresa = ref(criarEmpresaInicial())
const errosCampos = reactive({
  documento: '',
  telefone: '',
  email: '',
  intervaloAgendaMinutos: '',
})
const route = useRoute()
const router = useRouter()
const diasAtendimento = [
  { campo: 'atendeDominao', rotulo: 'Domingo' },
  { campo: 'atendeSegunda', rotulo: 'Segunda' },
  { campo: 'atendeTerca', rotulo: 'Terça' },
  { campo: 'atendeQuarta', rotulo: 'Quarta' },
  { campo: 'atendeQuinta', rotulo: 'Quinta' },
  { campo: 'atendeSexta', rotulo: 'Sexta' },
  { campo: 'atendeSabado', rotulo: 'Sábado' },
]
const intervalosAgenda = [15, 30, 60]
const aoColarIntervalo = criarManipuladorPasteNumerico(sanitizarInteiroPositivo)

const linkPublico = computed(() => {
  const slug = String(empresa.value.slug || '').trim()
  return montarLinkPublicoAgendamento(slug)
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
    intervaloAgendaMinutos: 30,
    atendeDominao: false,
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

function limparMensagens() {
  erro.value = ''
  mensagemSucesso.value = ''
  mensagemLinkCopiado.value = ''
}

function limparErroCampo(campo) {
  errosCampos[campo] = ''
  erro.value = ''
}

async function carregarMinhaEmpresa() {
  try {
    carregando.value = true
    limparMensagens()

    const empresaApi = await buscarMinhaEmpresa()
    empresa.value = {
      nome: empresaApi.nome || '',
      documento: sanitizarDocumento(empresaApi.documento || ''),
      telefone: sanitizarTelefone(empresaApi.telefone || ''),
      email: limparEspacos(empresaApi.email || ''),
      endereco: empresaApi.endereco || '',
      horaAbertura: empresaApi.horaAbertura || '',
      horaFechamento: empresaApi.horaFechamento || '',
      intervaloAgendaMinutos: normalizarIntervaloAgenda(empresaApi.intervaloAgendaMinutos),
      atendeDominao: Boolean(empresaApi.atendeDominao),
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
  } catch (errorAtual) {
    erro.value = 'Não foi possível carregar os dados da empresa.'
    console.error(errorAtual)
  } finally {
    carregando.value = false
  }
}

function validarDocumento() {
  if (empresa.value.documento && !documentoBasicoValido(empresa.value.documento)) {
    const mensagem = 'Informe um CPF ou CNPJ válido, usando apenas números.'
    errosCampos.documento = mensagem
    erro.value = mensagem
    return false
  }
  errosCampos.documento = ''
  return true
}

function validarTelefone() {
  if (empresa.value.telefone && !telefoneBasicoValido(empresa.value.telefone)) {
    const mensagem = 'Informe um telefone válido.'
    errosCampos.telefone = mensagem
    erro.value = mensagem
    return false
  }
  errosCampos.telefone = ''
  return true
}

function validarEmail() {
  if (empresa.value.email && !emailBasicoValido(empresa.value.email)) {
    const mensagem = 'Informe um e-mail válido.'
    errosCampos.email = mensagem
    erro.value = mensagem
    return false
  }
  errosCampos.email = ''
  return true
}

function validarIntervaloAgenda() {
  if (!inteiroPositivoValido(empresa.value.intervaloAgendaMinutos)) {
    const mensagem = 'Informe um intervalo de agenda válido.'
    errosCampos.intervaloAgendaMinutos = mensagem
    erro.value = mensagem
    return false
  }

  const intervaloAgendaMinutos = Number(empresa.value.intervaloAgendaMinutos)
  if (!intervalosAgenda.includes(intervaloAgendaMinutos)) {
    const mensagem = 'Selecione um intervalo da agenda válido.'
    errosCampos.intervaloAgendaMinutos = mensagem
    erro.value = mensagem
    return false
  }

  errosCampos.intervaloAgendaMinutos = ''
  return true
}

async function salvarEmpresa() {
  try {
    limparMensagens()

    if (!empresa.value.nome.trim()) {
      erro.value = 'Informe o nome da empresa.'
      return
    }

    const documentoValido = validarDocumento()
    const telefoneValido = validarTelefone()
    const emailValido = validarEmail()
    const intervaloValido = validarIntervaloAgenda()
    if (!documentoValido || !telefoneValido || !emailValido || !intervaloValido) return

    salvando.value = true
    const intervaloAgendaMinutos = Number(empresa.value.intervaloAgendaMinutos)

    const dadosEmpresa = {
      nome: empresa.value.nome,
      documento: empresa.value.documento,
      telefone: empresa.value.telefone,
      email: empresa.value.email,
      endereco: empresa.value.endereco,
      horaAbertura: empresa.value.horaAbertura,
      horaFechamento: empresa.value.horaFechamento,
      intervaloAgendaMinutos,
      atendeDominao: Boolean(empresa.value.atendeDominao),
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
    atualizarEmpresaNoUsuarioLogado(resposta?.nome || empresa.value.nome)
    mensagemSucesso.value = 'Dados da empresa salvos com sucesso.'
    await retornarParaOnboardingSeNecessario()
  } catch (errorAtual) {
    erro.value = 'Não foi possível atualizar a empresa.'
    console.error(errorAtual)
  } finally {
    salvando.value = false
  }
}

async function retornarParaOnboardingSeNecessario() {
  if (!veioDoOnboarding()) return
  await recalcularOnboarding().catch((errorAtual) => console.error(errorAtual))
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

function normalizarIntervaloAgenda(valor) {
  const texto = sanitizarInteiroPositivo(valor)
  const intervalo = Number(texto || 30)
  return intervalosAgenda.includes(intervalo) ? intervalo : 30
}

async function copiarLinkPublico() {
  if (!linkPublico.value) return

  try {
    await navigator.clipboard.writeText(linkPublico.value)
    mensagemLinkCopiado.value = 'Link público copiado com sucesso.'
  } catch (errorAtual) {
    erro.value = 'Não foi possível copiar o link público.'
    console.error(errorAtual)
  }
}

function aplicarDocumento(evento) {
  const valorOriginal =
    evento?.type === 'paste'
      ? evento?.clipboardData?.getData('text') ?? ''
      : evento?.target?.value
  const valorLimpo = sanitizarDocumento(valorOriginal)

  if (evento?.target) {
    evento.target.value = valorLimpo
  }

  empresa.value.documento = valorLimpo
  limparErroCampo('documento')
}

function aplicarTelefone(evento) {
  empresa.value.telefone = sanitizarTelefoneDoEvento(evento)
  limparErroCampo('telefone')
}

function aplicarEmail(valor) {
  empresa.value.email = limparEspacos(valor)
  limparErroCampo('email')
}

function aplicarIntervaloAgenda(valor) {
  empresa.value.intervaloAgendaMinutos = sanitizarInteiroPositivo(valor)
  limparErroCampo('intervaloAgendaMinutos')
}

function atualizarEmpresaNoUsuarioLogado(nomeEmpresa) {
  const usuarioSalvo = localStorage.getItem('usuario')
  if (!usuarioSalvo || !nomeEmpresa) return

  try {
    const usuario = JSON.parse(usuarioSalvo)
    usuario.empresaNome = nomeEmpresa
    localStorage.setItem('usuario', JSON.stringify(usuario))
    window.dispatchEvent(new Event('usuario-atualizado'))
  } catch (errorAtual) {
    console.error(errorAtual)
  }
}

onMounted(carregarMinhaEmpresa)
</script>

<template>
  <main class="pagina">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Administração</p>
        <h1>Minha empresa</h1>
        <p class="descricao">Atualize os dados cadastrais da empresa logada.</p>
      </div>
      <button class="botao secundario" @click="carregarMinhaEmpresa">Atualizar dados</button>
    </header>

    <section v-if="erro" class="card erro"><p>{{ erro }}</p></section>
    <section v-if="mensagemSucesso" class="card sucesso-card"><p>{{ mensagemSucesso }}</p></section>
    <section v-if="carregando" class="card"><p>Carregando empresa...</p></section>

    <section v-else class="card formulario">
      <div class="titulo-card">
        <h2>Dados da empresa</h2>
        <p>Edite as informações que identificam sua empresa no sistema.</p>
      </div>

      <div class="campos">
        <label>Nome *<input v-model="empresa.nome" type="text" placeholder="Ex: Barbearia Teste" /></label>
        <label>
          Documento (CPF/CNPJ)
          <input
            :value="empresa.documento"
            type="text"
            inputmode="numeric"
            placeholder="Ex: 00.000.000/0001-00"
            @input="aplicarDocumento"
            @blur="validarDocumento"
            @paste.prevent="aplicarDocumento"
          />
          <small v-if="errosCampos.documento" class="erro-texto">{{ errosCampos.documento }}</small>
        </label>
        <label>
          Telefone
          <input
            :value="empresa.telefone"
            type="text"
            inputmode="numeric"
            placeholder="Ex: (21) 99999-9999"
            @input="aplicarTelefone"
            @blur="validarTelefone"
            @paste.prevent="aplicarTelefone"
          />
          <small v-if="errosCampos.telefone" class="erro-texto">{{ errosCampos.telefone }}</small>
        </label>
        <label>
          E-mail
          <input
            :value="empresa.email"
            type="text"
            inputmode="email"
            placeholder="Ex: contato@empresa.com"
            @input="aplicarEmail($event.target.value)"
            @blur="validarEmail"
          />
          <small v-if="errosCampos.email" class="erro-texto">{{ errosCampos.email }}</small>
        </label>
        <label class="campo-grande">Endereço<input v-model="empresa.endereco" type="text" placeholder="Ex: Rua Principal, 100" /></label>
      </div>

      <div class="secao-horario">
        <div class="titulo-card">
          <h2>Horário de funcionamento</h2>
          <p>Configure os horários e dias de atendimento da empresa.</p>
        </div>
        <div class="campos">
          <label>Hora de abertura<input v-model="empresa.horaAbertura" type="time" /></label>
          <label>Hora de fechamento<input v-model="empresa.horaFechamento" type="time" /></label>
          <label>
            Intervalo da agenda
            <input
              :value="empresa.intervaloAgendaMinutos"
              type="text"
              inputmode="numeric"
              placeholder="15, 30 ou 60"
              @input="aplicarIntervaloAgenda($event.target.value)"
              @blur="validarIntervaloAgenda"
              @paste="aoColarIntervalo($event, (valor) => aplicarIntervaloAgenda(valor))"
            />
            <small v-if="errosCampos.intervaloAgendaMinutos" class="erro-texto">{{ errosCampos.intervaloAgendaMinutos }}</small>
          </label>
        </div>
        <div class="dias-atendimento">
          <label v-for="dia in diasAtendimento" :key="dia.campo" class="campo-checkbox">
            <input v-model="empresa[dia.campo]" type="checkbox" />{{ dia.rotulo }}
          </label>
        </div>
      </div>

      <div class="secao-agendamento-publico">
        <div class="titulo-card">
          <h2>Agendamento público</h2>
          <p>Configure o link público para clientes realizarem agendamentos sem precisar acessar o sistema.</p>
        </div>

        <div class="campos">
          <label>Slug público<input v-model="empresa.slug" type="text" placeholder="petshop-rodrigo" /></label>
          <label class="campo-checkbox"><input v-model="empresa.agendamentoPublicoAtivo" type="checkbox" />Permitir agendamento público</label>
          <label class="campo-grande">
            Mensagem pública
            <textarea v-model="empresa.mensagemPublica" placeholder="Ex: Agende seu atendimento de forma rápida e simples." rows="4"></textarea>
          </label>
        </div>

        <div class="link-publico">
          <p v-if="linkPublico"><strong>Link público:</strong><span>{{ linkPublico }}</span></p>
          <p v-else>Preencha o slug para gerar o link público.</p>
          <button class="botao secundario" :disabled="!linkPublico" @click="copiarLinkPublico">Copiar link público</button>
        </div>

        <p v-if="mensagemLinkCopiado" class="sucesso-texto">{{ mensagemLinkCopiado }}</p>
        <p v-if="!empresa.agendamentoPublicoAtivo" class="aviso-publico">O agendamento público está desativado.</p>
      </div>

      <div class="rodape-formulario">
        <button class="botao principal" :disabled="salvando" @click="salvarEmpresa">Salvar</button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,.formulario,.secao-horario,.secao-agendamento-publico{display:grid;gap:16px}.pagina{gap:24px;color:#111827}.cabecalho-pagina{display:flex;justify-content:space-between;align-items:center;gap:16px}.subtitulo{margin:0 0 4px;color:#2563eb;font-size:14px;font-weight:700;text-transform:uppercase}.cabecalho-pagina h1{margin:0;font-size:32px;font-weight:800;letter-spacing:0}.descricao,.titulo-card p{margin:6px 0 0;color:#64748b}.titulo-card h2{margin:0;font-size:22px;color:#111827;font-weight:800}.titulo-card p{font-size:14px}.card{background:white;border:1px solid #e5e7eb;border-radius:8px;padding:22px;box-shadow:0 8px 24px rgba(15,23,42,.06)}.campos{display:grid;grid-template-columns:repeat(2,minmax(220px,1fr));gap:16px}label{display:grid;gap:6px;color:#374151;font-weight:700;font-size:14px}input,select,textarea{width:100%;min-width:0;border:1px solid #d1d5db;border-radius:8px;padding:11px 12px;font-size:15px;background:white;box-sizing:border-box}textarea{resize:vertical;min-height:110px;font-family:inherit}input:focus,select:focus,textarea:focus{outline:none;border-color:#2563eb;box-shadow:0 0 0 3px rgba(37,99,235,.12)}.campo-grande{grid-column:1 / -1}.dias-atendimento{display:grid;grid-template-columns:repeat(4,minmax(120px,1fr));gap:12px}.campo-checkbox{align-content:center;grid-template-columns:auto 1fr;gap:10px}input[type='checkbox']{width:18px;height:18px;accent-color:#2563eb}.link-publico{display:flex;align-items:center;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:14px;border:1px solid #bfdbfe;border-radius:8px;background:#eff6ff}.link-publico p{margin:0;color:#1e3a8a;font-weight:700;word-break:break-word}.link-publico strong{font-weight:800}.link-publico span{margin-left:6px}.aviso-publico{margin:0;color:#92400e;font-weight:800}.rodape-formulario{display:flex;align-items:center;gap:10px;flex-wrap:wrap}.botao{border:none;color:white;padding:10px 16px;border-radius:8px;cursor:pointer;font-weight:800;transition:transform .15s ease,opacity .15s ease,background .15s ease}.botao:hover{transform:translateY(-1px)}.botao:disabled{opacity:.5;cursor:not-allowed;transform:none}.principal{background:#2563eb}.principal:hover{background:#1d4ed8}.secundario{background:#0f172a;min-width:140px}.secundario:hover{background:#1e293b}.erro{border-color:#fecaca;background:#fef2f2;color:#991b1b}.sucesso-card{border-color:#bbf7d0;background:#f0fdf4;color:#15803d}.sucesso-texto{color:#15803d;font-weight:800;margin:0}.erro-texto{color:#b91c1c;font-weight:700}@media (max-width:900px){.cabecalho-pagina{flex-direction:column;align-items:flex-start}.campos{grid-template-columns:1fr}.dias-atendimento{grid-template-columns:repeat(2,minmax(120px,1fr))}}
</style>
