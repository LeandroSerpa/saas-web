<script setup>
const props = defineProps({
  modelValue: {
    type: Object,
    required: true,
  },
  carregando: {
    type: Boolean,
    default: false,
  },
  salvando: {
    type: Boolean,
    default: false,
  },
  modoAdmin: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['update:modelValue', 'salvar', 'recarregar'])

function atualizar(campo, valor) {
  emit('update:modelValue', {
    ...props.modelValue,
    [campo]: valor,
  })
}
</script>

<template>
  <section class="configuracoes-form">
    <section v-if="modoAdmin && modelValue.empresaNome" class="card empresa-card">
      <div>
        <span>Empresa selecionada</span>
        <strong>{{ modelValue.empresaNome }}</strong>
      </div>
    </section>

    <section class="grade-configuracoes">
      <article class="card bloco">
        <div>
          <h2>Notificações internas no sistema</h2>
          <p>Quando ativado, o sistema exibirá notificações dentro da plataforma, no sino e na central de notificações.</p>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="modelValue.canalInternoAtivo"
            :disabled="carregando || salvando"
            @change="atualizar('canalInternoAtivo', $event.target.checked)"
          />
          <span>Canal interno ativo</span>
        </label>
      </article>

      <article class="card bloco">
        <div>
          <h2>Lembretes de agendamentos próximos</h2>
          <p>Controle os avisos internos enviados antes dos horários agendados.</p>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="modelValue.lembretesAgendamentoAtivo"
            :disabled="carregando || salvando"
            @change="atualizar('lembretesAgendamentoAtivo', $event.target.checked)"
          />
          <span>Ativar lembretes de agendamentos</span>
        </label>
        <div :class="['subopcoes', { desabilitada: !modelValue.lembretesAgendamentoAtivo }]">
          <label class="toggle">
            <input
              type="checkbox"
              :checked="modelValue.lembreteAgendamento24h"
              :disabled="carregando || salvando || !modelValue.lembretesAgendamentoAtivo"
              @change="atualizar('lembreteAgendamento24h', $event.target.checked)"
            />
            <span>Lembrar 24 horas antes</span>
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="modelValue.lembreteAgendamento2h"
              :disabled="carregando || salvando || !modelValue.lembretesAgendamentoAtivo"
              @change="atualizar('lembreteAgendamento2h', $event.target.checked)"
            />
            <span>Lembrar 2 horas antes</span>
          </label>
          <label class="toggle">
            <input
              type="checkbox"
              :checked="modelValue.lembreteAgendamento30min"
              :disabled="carregando || salvando || !modelValue.lembretesAgendamentoAtivo"
              @change="atualizar('lembreteAgendamento30min', $event.target.checked)"
            />
            <span>Lembrar 30 minutos antes</span>
          </label>
        </div>
      </article>

      <article class="card bloco">
        <div>
          <h2>Notificações financeiras</h2>
          <p>Controla avisos internos relacionados a faturas, vencimentos e situação financeira.</p>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="modelValue.notificacoesFinanceirasAtivo"
            :disabled="carregando || salvando"
            @change="atualizar('notificacoesFinanceirasAtivo', $event.target.checked)"
          />
          <span>Notificações financeiras ativas</span>
        </label>
      </article>

      <article class="card bloco">
        <div>
          <h2>Notificações do sistema</h2>
          <p>Controla avisos internos importantes sobre a plataforma.</p>
        </div>
        <label class="toggle">
          <input
            type="checkbox"
            :checked="modelValue.notificacoesSistemaAtivo"
            :disabled="carregando || salvando"
            @change="atualizar('notificacoesSistemaAtivo', $event.target.checked)"
          />
          <span>Notificações do sistema ativas</span>
        </label>
      </article>

      <article class="card bloco canais-futuros">
        <div>
          <h2>Canais futuros</h2>
          <p>E-mail e WhatsApp ainda não enviam mensagens automaticamente. Estes campos ficam preparados para uma próxima etapa.</p>
        </div>
        <label class="toggle futuro">
          <input type="checkbox" :checked="modelValue.canalEmailAtivo" disabled />
          <span>E-mail <small>em breve</small></span>
        </label>
        <label class="toggle futuro">
          <input type="checkbox" :checked="modelValue.canalWhatsappAtivo" disabled />
          <span>WhatsApp <small>em breve</small></span>
        </label>
      </article>
    </section>

    <div class="acoes">
      <button class="botao principal" :disabled="carregando || salvando" @click="$emit('salvar')">
        {{ salvando ? 'Salvando...' : 'Salvar configurações' }}
      </button>
      <button class="botao secundario" :disabled="carregando || salvando" @click="$emit('recarregar')">
        Recarregar
      </button>
    </div>
  </section>
</template>

<style scoped>
.configuracoes-form {
  display: grid;
  gap: 18px;
}

.grade-configuracoes {
  display: grid;
  grid-template-columns: repeat(2, minmax(260px, 1fr));
  gap: 18px;
}

.card {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 22px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.bloco {
  display: grid;
  align-content: start;
  gap: 16px;
}

.empresa-card span,
.bloco p,
.toggle small {
  color: #64748b;
}

.empresa-card strong,
.empresa-card span {
  display: block;
}

h2,
p {
  margin: 0;
}

h2 {
  font-size: 20px;
  font-weight: 800;
}

.toggle {
  display: flex;
  align-items: center;
  gap: 10px;
  color: #334155;
  font-weight: 800;
}

.toggle input {
  width: 18px;
  height: 18px;
  accent-color: #2563eb;
}

.subopcoes {
  display: grid;
  gap: 10px;
  padding: 14px;
  border-radius: 8px;
  background: #f8fafc;
}

.subopcoes.desabilitada {
  opacity: 0.55;
}

.canais-futuros {
  border-style: dashed;
}

.futuro small {
  margin-left: 6px;
  font-size: 12px;
  text-transform: uppercase;
}

.acoes {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.botao {
  border: none;
  border-radius: 8px;
  padding: 10px 16px;
  color: white;
  cursor: pointer;
  font-weight: 800;
}

.botao:disabled {
  opacity: 0.55;
  cursor: not-allowed;
}

.principal {
  background: #2563eb;
}

.secundario {
  background: #0f172a;
}

@media (max-width: 900px) {
  .grade-configuracoes {
    grid-template-columns: 1fr;
  }
}
</style>
