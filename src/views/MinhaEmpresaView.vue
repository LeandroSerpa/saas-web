<script setup>
import { onMounted, ref } from 'vue'
import { atualizarMinhaEmpresa, buscarMinhaEmpresa } from '@/services/api'

const carregando = ref(true)
const salvando = ref(false)
const erro = ref('')
const mensagemSucesso = ref('')
const empresa = ref(criarEmpresaInicial())

function criarEmpresaInicial() {
  return {
    nome: '',
    documento: '',
    telefone: '',
    email: '',
    endereco: '',
  }
}

async function carregarMinhaEmpresa() {
  try {
    carregando.value = true
    erro.value = ''
    mensagemSucesso.value = ''

    const empresaApi = await buscarMinhaEmpresa()

    empresa.value = {
      nome: empresaApi.nome || '',
      documento: empresaApi.documento || '',
      telefone: empresaApi.telefone || '',
      email: empresaApi.email || '',
      endereco: empresaApi.endereco || '',
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

      <div class="rodape-formulario">
        <button class="botao principal" :disabled="salvando" @click="salvarEmpresa">
          {{ salvando ? 'Salvando...' : 'Salvar alteracoes' }}
        </button>
      </div>
    </section>
  </main>
</template>

<style scoped>
.pagina,
.formulario {
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

input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 11px 12px;
  font-size: 15px;
  background: white;
  box-sizing: border-box;
}

input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.campo-grande {
  grid-column: 1 / -1;
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

@media (max-width: 900px) {
  .cabecalho-pagina {
    flex-direction: column;
    align-items: flex-start;
  }

  .campos {
    grid-template-columns: 1fr;
  }
}
</style>
