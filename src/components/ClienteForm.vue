<script setup>
import { computed, reactive, ref } from 'vue'
import {
  OPCOES_FREQUENCIA_SEMANAL_BEACH_TENNIS,
  OPCOES_NIVEL_BEACH_TENNIS,
  OPCOES_PERFIL_BEACH_TENNIS,
  OPCOES_PLANO_BEACH_TENNIS,
} from '@/utils/beachTennis'
import {
  emailBasicoValido,
  limparEspacos,
  sanitizarTelefoneDoEvento,
  telefoneBasicoValido,
} from '@/utils/validacoes'

const cliente = defineModel({
  type: Object,
  required: true,
})

defineProps({
  mensagemSucesso: {
    type: String,
    default: '',
  },
  modoEdicao: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['salvar', 'cancelar'])
const erroValidacao = ref('')
const errosCampos = reactive({
  telefone: '',
  email: '',
})

const temDadosBeachTennis = computed(() =>
  Boolean(
    cliente.value?.dataNascimento ||
      cliente.value?.perfilBeachTennis ||
      cliente.value?.nivelBeachTennis ||
      cliente.value?.frequenciaSemanalBeachTennis ||
      cliente.value?.planoBeachTennis ||
      cliente.value?.observacaoBeachTennis,
  ),
)

function limparErroCampo(campo) {
  errosCampos[campo] = ''
  erroValidacao.value = ''
}

function aplicarTelefone(evento) {
  cliente.value.telefone = sanitizarTelefoneDoEvento(evento)
  limparErroCampo('telefone')
}

function aplicarEmail(valor) {
  cliente.value.email = limparEspacos(valor)
  limparErroCampo('email')
}

function validarTelefone() {
  if (cliente.value.telefone && !telefoneBasicoValido(cliente.value.telefone)) {
    const mensagem = 'Informe um telefone válido.'
    errosCampos.telefone = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.telefone = ''
  return true
}

function validarEmail() {
  if (cliente.value.email && !emailBasicoValido(cliente.value.email)) {
    const mensagem = 'Informe um e-mail válido.'
    errosCampos.email = mensagem
    erroValidacao.value = mensagem
    return false
  }

  errosCampos.email = ''
  return true
}

function solicitarSalvamento() {
  erroValidacao.value = ''
  const telefoneValido = validarTelefone()
  const emailValido = validarEmail()
  if (!telefoneValido || !emailValido) return
  emit('salvar')
}
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar cliente' : 'Novo cliente' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados do cliente selecionado.'
            : 'Cadastre um cliente para usar nos agendamentos.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="cliente.nome" type="text" placeholder="Ex: Maria Silva" />
      </label>

      <label>
        Telefone
        <input
          :value="cliente.telefone"
          type="text"
          inputmode="numeric"
          placeholder="Ex: (21) 99999-9999"
          @input="aplicarTelefone"
          @blur="validarTelefone"
          @paste.prevent="aplicarTelefone"
        />
        <span v-if="errosCampos.telefone" class="erro-texto">{{ errosCampos.telefone }}</span>
      </label>

      <label>
        E-mail
        <input
          :value="cliente.email"
          type="text"
          inputmode="email"
          placeholder="Ex: cliente@email.com"
          @input="aplicarEmail($event.target.value)"
          @blur="validarEmail"
        />
        <span v-if="errosCampos.email" class="erro-texto">{{ errosCampos.email }}</span>
      </label>

      <label class="campo-grande">
        Observação
        <input
          v-model="cliente.observacao"
          type="text"
          placeholder="Ex: Cliente prefere atendimento pela manhã"
        />
      </label>
    </div>

    <details class="bloco-beach-tennis" :open="temDadosBeachTennis">
      <summary>Dados do aluno - Beach Tennis</summary>
      <p class="ajuda-bloco">
        Se esta pessoa também participa das aulas ou dos plays, preencha só os campos que fizerem sentido.
      </p>

      <div class="campos">
        <label>
          Data de nascimento
          <input v-model="cliente.dataNascimento" type="date" />
        </label>

        <label>
          Perfil Beach Tennis
          <select v-model="cliente.perfilBeachTennis">
            <option value="">Selecione</option>
            <option v-for="opcao in OPCOES_PERFIL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Nível
          <select v-model="cliente.nivelBeachTennis">
            <option value="">Selecione</option>
            <option v-for="opcao in OPCOES_NIVEL_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Frequência semanal
          <select v-model="cliente.frequenciaSemanalBeachTennis">
            <option value="">Selecione</option>
            <option
              v-for="opcao in OPCOES_FREQUENCIA_SEMANAL_BEACH_TENNIS"
              :key="opcao.valor"
              :value="opcao.valor"
            >
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label>
          Plano Beach Tennis
          <select v-model="cliente.planoBeachTennis">
            <option value="">Selecione</option>
            <option v-for="opcao in OPCOES_PLANO_BEACH_TENNIS" :key="opcao.valor" :value="opcao.valor">
              {{ opcao.rotulo }}
            </option>
          </select>
        </label>

        <label class="campo-grande">
          Observações do aluno/participante
          <textarea
            v-model="cliente.observacaoBeachTennis"
            rows="3"
            placeholder="Ex: Prefere treinos noturnos, participa dos plays aos sábados..."
          ></textarea>
        </label>
      </div>
    </details>

    <p v-if="erroValidacao" class="erro-texto">{{ erroValidacao }}</p>

    <div class="rodape-formulario">
      <button class="botao principal" @click="solicitarSalvamento">
        Salvar
      </button>

      <button v-if="modoEdicao" class="botao secundario" @click="$emit('cancelar')">
        Cancelar
      </button>

      <p v-if="mensagemSucesso" class="sucesso-texto">
        {{ mensagemSucesso }}
      </p>
    </div>
  </section>
</template>
