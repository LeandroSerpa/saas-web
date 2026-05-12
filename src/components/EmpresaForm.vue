<script setup>
const empresa = defineModel({
  type: Object,
  required: true,
})

const diasAtendimento = [
  { campo: 'atendeDominao', rotulo: 'Dominao' },
  { campo: 'atendeSegunda', rotulo: 'Segunda' },
  { campo: 'atendeTerca', rotulo: 'Terca' },
  { campo: 'atendeQuarta', rotulo: 'Quarta' },
  { campo: 'atendeQuinta', rotulo: 'Quinta' },
  { campo: 'atendeSexta', rotulo: 'Sexta' },
  { campo: 'atendeSabado', rotulo: 'Sabado' },
]
const intervalosAgenda = [15, 30, 60]

function obterSlugPublico() {
  return String(empresa.value.slugPublico || empresa.value.slug || '').trim()
}

function obterLinkPublico() {
  const slug = obterSlugPublico()

  return slug ? `${window.location.origin}/agendar/${slug}` : ''
}

defineProps({
  mensagemSucesso: {
    type: String,
    default: '',
  },
  modoEdicao: {
    type: Boolean,
    default: false,
  },
  segmentos: {
    type: Array,
    default: () => [],
  },
})

defineEmits(['salvar', 'cancelar'])
</script>

<template>
  <section class="card formulario">
    <div class="titulo-card">
      <h2>{{ modoEdicao ? 'Editar empresa' : 'Nova empresa' }}</h2>
      <p>
        {{
          modoEdicao
            ? 'Atualize os dados da empresa selecionada.'
            : 'Cadastre uma empresa para organizar os usuarios.'
        }}
      </p>
    </div>

    <div class="campos">
      <label>
        Nome *
        <input v-model="empresa.nome" type="text" placeholder="Ex: Clinica Central" />
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

      <label>
        Segmento de negócio
        <select v-model="empresa.segmentoNegocioId">
          <option value="">Sem segmento</option>
          <option v-for="segmento in segmentos" :key="segmento.id" :value="segmento.id">
            {{ segmento.nome }}
          </option>
        </select>
      </label>

      <label class="campo-checkbox">
        <input v-model="empresa.ativo" type="checkbox" />
        Ativa
      </label>
    </div>

    <div class="secao-horario">
      <div class="titulo-card">
        <h2>Horário de funcionamento</h2>
        <p>Configure os horários e dias de atendimento da empresa.</p>
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

        <label>
          Intervalo da agenda
          <select v-model.number="empresa.intervaloAgendaMinutos">
            <option v-for="intervalo in intervalosAgenda" :key="intervalo" :value="intervalo">
              {{ intervalo }} minutos
            </option>
          </select>
        </label>
      </div>

      <div class="dias-atendimento">
        <label v-for="dia in diasAtendimento" :key="dia.campo" class="campo-checkbox">
          <input v-model="empresa[dia.campo]" type="checkbox" />
          {{ dia.rotulo }}
        </label>
      </div>
    </div>

    <div class="secao-publica">
      <div class="titulo-card">
        <h2>Agendamento publico</h2>
        <p>Configure como os clientes acessam a agenda publica desta empresa.</p>
      </div>

      <div class="campos">
        <label>
          Slug publico
          <input v-model="empresa.slugPublico" type="text" placeholder="petshop-rodrigo" />
        </label>

        <label class="campo-checkbox">
          <input v-model="empresa.permitirAgendamentoPublico" type="checkbox" />
          Permitir agendamento publico
        </label>

        <label class="campo-grande">
          Mensagem publica
          <textarea
            v-model="empresa.mensagemPublica"
            rows="4"
            placeholder="Ex: Agende seu atendimento de forma rapida e simples."
          ></textarea>
        </label>
      </div>

      <div class="link-publico">
        <p v-if="obterLinkPublico()">
          <strong>Link publico:</strong>
          <span>{{ obterLinkPublico() }}</span>
        </p>
        <p v-else>Cadastre um slug publico para gerar o link de agendamento.</p>
      </div>
    </div>

    <div class="rodape-formulario">
      <button class="botao principal" @click="$emit('salvar')">
        {{ modoEdicao ? 'Salvar alteracoes' : 'Cadastrar empresa' }}
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
