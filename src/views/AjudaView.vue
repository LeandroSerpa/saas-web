<script setup>
import { computed, ref, watch } from 'vue'
import SystemVersionPanel from '@/components/SystemVersionPanel.vue'

const busca = ref('')
const topicoAtivoId = ref('comecando')

const roteiroRecomendado = [
  'Cadastre os serviços oferecidos.',
  'Cadastre os funcionários.',
  'Cadastre ou importe os clientes.',
  'Confira os horários e disponibilidades.',
  'Faça um agendamento interno de teste.',
  'Copie o link público e teste um agendamento como cliente.',
]

const perguntasFrequentes = [
  {
    pergunta: 'Como faço um novo agendamento?',
    resposta:
      'Abra a Agenda, clique para criar um novo agendamento e preencha cliente, serviço, funcionário, data e horário. Depois confirme para salvar.',
  },
  {
    pergunta: 'Como o cliente agenda pelo link público?',
    resposta:
      'Com o link público ativo, o cliente abre a página da sua empresa, escolhe o serviço, o horário disponível e conclui o agendamento sozinho.',
  },
  {
    pergunta: 'Onde vejo os agendamentos recebidos pelo link público?',
    resposta:
      'Os agendamentos recebidos pelo link público aparecem na Agenda e também podem gerar aviso nas Notificações para facilitar o acompanhamento.',
  },
  {
    pergunta: 'Como cadastro um novo serviço?',
    resposta:
      'Entre em Serviços, crie um novo cadastro e informe nome, preço, duração, descrição e se o serviço está ativo.',
  },
  {
    pergunta: 'Como cadastro um funcionário?',
    resposta:
      'Acesse Funcionários, faça o cadastro do profissional e depois organize dias, horários e serviços atendidos, quando esse vínculo estiver disponível.',
  },
  {
    pergunta: 'Como vejo minhas notificações?',
    resposta:
      'Clique no sino no topo do sistema ou entre na tela de Notificações para ver avisos recentes e acompanhar novidades importantes.',
  },
  {
    pergunta: 'Como altero minha senha?',
    resposta:
      'Entre em Alterar senha, informe a senha atual e a nova senha. Depois confirme para atualizar o acesso.',
  },
  {
    pergunta: 'Como controlo meu estoque?',
    resposta:
      'Entre em Estoque, cadastre seus produtos, informe a quantidade atual e o estoque mínimo. Depois use Entrada, Saída ou Ajuste para manter as quantidades atualizadas.',
  },
  {
    pergunta: 'Qual a diferença entre Desativar e Excluir?',
    resposta:
      'Desativar mantém o cadastro no sistema, mas tira o registro do uso operacional. Excluir envia o registro para a lixeira, onde ele pode ser restaurado por quem tem permissão.',
  },
  {
    pergunta: 'O que acontece ao excluir definitivamente um registro?',
    resposta:
      'Excluir definitivamente remove o registro da lixeira de forma irreversível, preservando auditoria e a integridade dos dados. Essa ação não pode ser desfeita.',
  },
  {
    pergunta: 'As ações de exclusão ficam registradas?',
    resposta:
      'Sim. Exclusões, restaurações e exclusões definitivas ficam registradas em auditoria/log para acompanhamento administrativo.',
  },
  {
    pergunta: 'Onde encontro o link público da minha empresa?',
    resposta:
      'O link público fica na área Minha empresa. Ali você pode consultar, copiar e usar o endereço que seus clientes acessam para agendar.',
  },
  {
    pergunta: 'Como acompanho as empresas da plataforma?',
    resposta:
      'Entre no Dashboard NuvemMais e use a seleção de empresa para visualizar os principais dados operacionais.',
  },
]

const topicos = [
  {
    id: 'comecando',
    titulo: 'Começando no NuvemMais Gestão',
    resumo: 'Uma visão geral do sistema e do que você consegue organizar no dia a dia.',
    palavrasChave: ['inicio', 'primeiros passos', 'clientes', 'serviços', 'agenda'],
    introducao:
      'O NuvemMais Gestão ajuda sua empresa a manter a operação organizada em um só lugar. Com ele, você acompanha clientes, serviços, funcionários, agenda, notificações, relatórios e o link público para agendamentos.',
    pontos: [
      'Use o menu lateral para acessar rapidamente cada área da empresa.',
      'Comece cadastrando serviços, funcionários e clientes para deixar a agenda pronta para uso.',
      'Depois ajuste dados da empresa, horários e página pública para facilitar o atendimento.',
    ],
    destaque: 'Bom ponto de partida para quem está começando a usar o sistema.',
    roteiro: roteiroRecomendado,
  },
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    resumo: 'Resumo rápido da empresa com números e movimentações importantes.',
    palavrasChave: ['indicadores', 'resumo', 'visão geral', 'agendamentos do dia'],
    introducao:
      'O Dashboard mostra uma visão geral da empresa. Ele reúne agendamentos do dia, próximos compromissos, notificações e indicadores que ajudam no acompanhamento da operação.',
    pontos: [
      'Veja rapidamente o movimento do dia e da semana.',
      'Acompanhe próximos agendamentos sem precisar abrir outras telas.',
      'Use essa área para ter uma leitura rápida da rotina da empresa.',
    ],
    destaque: 'Ideal para começar o dia e acompanhar o andamento da operação.',
    rota: '/dashboard',
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    resumo: 'Criação, acompanhamento e filtros dos agendamentos da empresa.',
    palavrasChave: ['agendamento', 'horário', 'cliente', 'status', 'origem'],
    introducao:
      'Na Agenda você cria agendamentos internos e acompanha tudo o que foi marcado. É aqui que a rotina diária costuma acontecer.',
    pontos: [
      'Crie um agendamento escolhendo cliente, serviço, funcionário, data e horário.',
      'Filtre a visualização por status, origem e outros critérios disponíveis na tela.',
      'Acompanhe também os agendamentos recebidos pelo link público da empresa.',
    ],
    destaque: 'É a área principal para organizar horários e acompanhar atendimentos.',
    rota: '/agenda',
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    resumo: 'Cadastro e gestão dos clientes atendidos pela empresa.',
    palavrasChave: ['cadastro', 'contato', 'histórico', 'cliente'],
    introducao:
      'A tela de Clientes serve para cadastrar e consultar as pessoas atendidas pela empresa. Manter esse cadastro em dia ajuda muito na organização.',
    pontos: [
      'Cadastre novos clientes com as informações necessárias para contato.',
      'Consulte clientes já registrados sempre que precisar localizar dados.',
      'Use essa base para facilitar a criação de novos agendamentos.',
    ],
    destaque: 'Um cadastro bem organizado deixa a agenda mais rápida e confiável.',
    rota: '/clientes',
  },
  {
    id: 'servicos',
    titulo: 'Serviços',
    resumo: 'Cadastro do que a empresa oferece e dos detalhes de cada atendimento.',
    palavrasChave: ['preço', 'duração', 'descrição', 'ativo', 'inativo'],
    introducao:
      'Na área de Serviços você registra o que a empresa oferece. Cada serviço pode ter seu próprio preço, duração, descrição e situação.',
    pontos: [
      'Cadastre os serviços com nome claro e fácil de identificar.',
      'Defina preço e duração para ajudar na organização da agenda.',
      'Use o status ativo ou inativo para controlar o que continua disponível.',
    ],
    destaque: 'Essa configuração ajuda o sistema a montar agendamentos com mais consistência.',
    rota: '/servicos',
  },
  {
    id: 'funcionarios',
    titulo: 'Funcionários',
    resumo: 'Organização dos profissionais e da rotina de atendimento.',
    palavrasChave: ['profissionais', 'dias', 'horários', 'serviços'],
    introducao:
      'A tela de Funcionários é usada para cadastrar os profissionais da empresa e organizar como cada um atende no dia a dia.',
    pontos: [
      'Cadastre os profissionais que atendem na empresa.',
      'Organize horários e dias de atendimento de cada pessoa.',
      'Quando existir esse vínculo, associe os serviços que cada profissional pode atender.',
    ],
    destaque: 'Muito útil para distribuir a agenda e evitar conflitos de atendimento.',
    rota: '/funcionarios',
  },
  {
    id: 'disponibilidade',
    titulo: 'Disponibilidade',
    resumo: 'Controle de bloqueios, folgas e períodos indisponíveis.',
    palavrasChave: ['bloqueio', 'folga', 'indisponibilidade', 'horários'],
    introducao:
      'A área de Disponibilidade ajuda a controlar quando a empresa, um funcionário ou um serviço não pode ser agendado.',
    pontos: [
      'Registre bloqueios de horário para evitar marcações indevidas.',
      'Organize folgas e períodos em que não haverá atendimento.',
      'Use essa área para manter a agenda alinhada com a realidade da operação.',
    ],
    destaque: 'Ajuda a reduzir conflitos e horários que não podem ser usados.',
    rota: '/disponibilidade',
  },
  {
    id: 'estoque',
    titulo: 'Estoque',
    resumo: 'Cadastro de produtos, controle de quantidades e alertas de reposição.',
    palavrasChave: ['estoque', 'produtos', 'entrada', 'saída', 'ajuste', 'baixo estoque'],
    introducao:
      'Na tela de Estoque você cadastra produtos, acompanha as quantidades disponíveis e registra cada movimentação para manter o saldo atualizado.',
    pontos: [
      'Cadastre produtos com nome, categoria, código, unidade, preços e estoque mínimo.',
      'Use Entrada para somar quantidade, Saída para registrar consumo ou venda e Ajuste para definir um novo saldo final.',
      'Acompanhe os alertas de baixo estoque para saber quando um produto precisa de reposição.',
      'O recurso pode depender do plano contratado pela empresa.',
    ],
    destaque: 'Ideal para manter o controle dos produtos sem planilhas paralelas.',
    rota: '/estoque',
  },
  {
    id: 'dashboard-nuvemmais',
    titulo: 'Dashboard NuvemMais',
    resumo: 'Acompanhamento administrativo das empresas da plataforma.',
    palavrasChave: ['super admin', 'dashboard nuvemmais', 'empresas da plataforma', 'visualizar empresa'],
    introducao:
      'O Dashboard NuvemMais ajuda o SUPER_ADMIN a acompanhar a saúde geral da plataforma e visualizar os principais dados operacionais de cada empresa sem trocar de login.',
    pontos: [
      'Use a visão geral para acompanhar empresas, usuários, agenda, receitas e alertas importantes.',
      'Na seleção de empresa, escolha uma empresa para visualizar os dados operacionais dela como acompanhamento administrativo.',
      'Essa visualização serve para consulta e apoio, sem ações perigosas em massa nesta primeira fase.',
    ],
    destaque: 'Muito útil para acompanhar o movimento das empresas de forma centralizada.',
    rota: '/admin-dashboard',
  },
  {
    id: 'link-publico',
    titulo: 'Link público de agendamento',
    resumo: 'Canal para o cliente final agendar sozinho pela página pública.',
    palavrasChave: ['link', 'agendamento público', 'cliente final', 'página pública'],
    introducao:
      'O link público permite que o cliente final marque um horário sozinho, sem precisar entrar em contato direto com a empresa para cada agendamento.',
    pontos: [
      'Compartilhe o link público com seus clientes em mensagens, redes sociais ou site.',
      'O cliente escolhe serviço e horário disponível na página da empresa.',
      'Os agendamentos recebidos passam a fazer parte da rotina de acompanhamento no sistema.',
    ],
    destaque: 'Ótimo para facilitar o autoatendimento e ganhar agilidade.',
  },
  {
    id: 'notificacoes',
    titulo: 'Notificações',
    resumo: 'Avisos importantes no sino e na tela de notificações.',
    palavrasChave: ['sino', 'avisos', 'novos agendamentos públicos'],
    introducao:
      'As Notificações ajudam você a acompanhar acontecimentos importantes dentro do sistema, como novos agendamentos públicos e outros avisos relevantes.',
    pontos: [
      'Veja alertas pelo sino no topo do sistema.',
      'Abra a tela de Notificações para consultar os avisos com mais calma.',
      'Acompanhe especialmente os novos agendamentos recebidos pelo link público.',
    ],
    destaque: 'Uma boa forma de não perder acontecimentos importantes da rotina.',
    rota: '/notificacoes',
  },
  {
    id: 'relatorios',
    titulo: 'Relatórios',
    resumo: 'Acompanhamento de agendamentos, receita, serviços e desempenho.',
    palavrasChave: ['receita', 'desempenho', 'acompanhamento', 'resultados'],
    introducao:
      'Na área de Relatórios você acompanha informações que ajudam a entender melhor o desempenho da empresa ao longo do tempo.',
    pontos: [
      'Consulte dados de agendamentos e movimentação da operação.',
      'Acompanhe receita e desempenho dos serviços.',
      'Use os relatórios para tomar decisões com mais clareza.',
    ],
    destaque: 'Ideal para analisar resultados e enxergar oportunidades de melhoria.',
    rota: '/relatorios',
  },
  {
    id: 'minha-empresa',
    titulo: 'Minha empresa',
    resumo: 'Configuração dos dados principais da empresa.',
    palavrasChave: ['dados da empresa', 'horários', 'endereço', 'telefone', 'link público'],
    introducao:
      'Em Minha empresa você ajusta as informações principais da empresa, incluindo dados de contato, horários e configurações importantes da operação.',
    pontos: [
      'Atualize nome, endereço, telefone e outras informações da empresa.',
      'Configure horários de funcionamento para apoiar a rotina de atendimento.',
      'Consulte e organize o link público da empresa nessa área.',
    ],
    destaque: 'Essa tela concentra dados essenciais para o funcionamento da empresa.',
    rota: '/minha-empresa',
  },
  {
    id: 'personalizacao',
    titulo: 'Personalização',
    resumo: 'Ajustes da página pública da empresa.',
    palavrasChave: ['cores', 'textos', 'política de cancelamento', 'página pública'],
    introducao:
      'A área de Personalização permite deixar a página pública da empresa com a sua identidade e com orientações importantes para o cliente.',
    pontos: [
      'Ajuste cores e textos da página pública.',
      'Inclua política de cancelamento e informações úteis para o cliente.',
      'Use essa área para deixar a experiência mais alinhada com a sua empresa.',
    ],
    destaque: 'Ajuda a apresentar a empresa com mais clareza para o cliente final.',
    rota: '/personalizacao',
  },
  {
    id: 'usuarios',
    titulo: 'Usuários',
    resumo: 'Gestão de acessos ao sistema.',
    palavrasChave: ['acessos', 'permissões', 'usuários do sistema'],
    introducao:
      'Na tela de Usuários você gerencia quem pode entrar no sistema e acompanhar a rotina da empresa.',
    pontos: [
      'Cadastre ou acompanhe os usuários com acesso liberado.',
      'Use essa área para organizar a gestão dos acessos.',
      'Mantenha os dados dos usuários atualizados para facilitar o uso diário.',
    ],
    destaque: 'Importante para controlar quem acessa o sistema da empresa.',
    rota: '/usuarios',
  },
  {
    id: 'lixeira-global',
    titulo: 'Lixeira Global',
    resumo: 'Restauração e exclusão definitiva de registros removidos logicamente.',
    palavrasChave: ['lixeira', 'excluir', 'restaurar', 'exclusão definitiva', 'auditoria', 'logs'],
    introducao:
      'A Lixeira Global reúne registros enviados para a lixeira nos cadastros principais, como clientes, serviços, funcionários, usuários e produtos de estoque.',
    pontos: [
      'Excluir envia o registro para a lixeira e permite restauração posterior por quem tem permissão.',
      'Desativar apenas bloqueia o uso operacional do cadastro, sem enviar o registro para a lixeira.',
      'Excluir definitivamente é irreversível e deve ser usado apenas quando não houver necessidade de recuperação, preservando auditoria e integridade dos dados.',
      'As ações de exclusão, restauração e exclusão definitiva ficam registradas em auditoria/log.',
    ],
    destaque: 'Use essa área para recuperar registros removidos por engano ou concluir exclusões permanentes com cuidado.',
    rota: '/lixeira',
  },
  {
    id: 'minha-conta',
    titulo: 'Minha conta',
    resumo: 'Atualização dos seus dados pessoais.',
    palavrasChave: ['nome', 'e-mail', 'login', 'dados pessoais'],
    introducao:
      'A área Minha conta foi criada para você manter seus dados pessoais atualizados dentro do sistema.',
    pontos: [
      'Altere nome, e-mail, usuário ou login quando necessário.',
      'Revise seus dados para manter o acesso organizado.',
      'Use essa área sempre que precisar atualizar suas informações pessoais.',
    ],
    destaque: 'É o lugar certo para cuidar dos seus dados de acesso.',
    rota: '/minha-conta',
  },
  {
    id: 'alterar-senha',
    titulo: 'Alterar senha',
    resumo: 'Troca de senha para manter o acesso seguro.',
    palavrasChave: ['senha', 'trocar senha', 'segurança'],
    introducao:
      'Na tela Alterar senha você pode atualizar sua senha de acesso sempre que precisar.',
    pontos: [
      'Informe a senha atual e a nova senha.',
      'Escolha uma senha fácil para você lembrar, mas difícil para outras pessoas adivinharem.',
      'Depois de confirmar, use a nova senha nos próximos acessos.',
    ],
    destaque: 'Recomendado sempre que você quiser reforçar a segurança do acesso.',
    rota: '/alterar-senha',
  },
  {
    id: 'faturas-plano',
    titulo: 'Faturas e Meu plano',
    resumo: 'Acompanhamento do plano, das cobranças e da situação financeira.',
    palavrasChave: ['financeiro', 'assinatura', 'cobranças', 'faturas', 'plano'],
    introducao:
      'As áreas Meu plano e Faturas ajudam a acompanhar a assinatura da empresa e a situação financeira relacionada ao uso do sistema.',
    pontos: [
      'Consulte detalhes do plano atual da empresa.',
      'Acompanhe faturas, pagamentos e pendências quando houver.',
      'Use essas informações para manter a assinatura em dia.',
    ],
    destaque: 'Essas telas ajudam no controle financeiro da assinatura da empresa.',
    rota: '/meu-plano',
  },
  {
    id: 'perguntas-frequentes',
    titulo: 'Perguntas frequentes',
    resumo: 'Respostas rápidas para dúvidas comuns do dia a dia.',
    palavrasChave: ['faq', 'dúvidas', 'perguntas', 'ajuda rápida'],
    introducao:
      'Aqui você encontra respostas simples para as dúvidas mais comuns no uso do sistema.',
    pontos: [
      'Use a busca para localizar uma dúvida específica.',
      'Abra as perguntas para ver respostas rápidas e diretas.',
      'Essa área é útil para consultas do dia a dia.',
    ],
    destaque: 'Boa opção para resolver dúvidas rápidas sem sair da tela de Ajuda.',
    perguntas: perguntasFrequentes,
  },
]

const notasAtualizacaoAjuda = [
  'Lixeira Global integrada aos cadastros principais: clientes, serviços, funcionários, usuários e produtos de estoque.',
  'Restauração de registros da lixeira com atualização automática da listagem e dos contadores.',
  'Exclusão definitiva disponível na Lixeira Global para remoção irreversível.',
  'Produtos de estoque agora participam do fluxo completo da lixeira.',
  'Ações de exclusão, restauração e exclusão definitiva registradas em auditoria/log.',
]

const estatisticas = computed(() => [
  { rotulo: 'Tópicos principais', valor: topicos.length - 1 },
  { rotulo: 'Perguntas frequentes', valor: perguntasFrequentes.length },
  { rotulo: 'Busca rápida', valor: 'Disponível' },
])

const topicosFiltrados = computed(() => {
  const termo = busca.value.trim().toLowerCase()

  if (!termo) {
    return topicos
  }

  return topicos.filter((topico) => {
    const campos = [
      topico.titulo,
      topico.resumo,
      topico.introducao,
      topico.destaque,
      ...(topico.palavrasChave || []),
      ...(topico.pontos || []),
      ...((topico.perguntas || []).flatMap((item) => [item.pergunta, item.resposta])),
    ]

    return campos.some((campo) => String(campo || '').toLowerCase().includes(termo))
  })
})

const topicoAtivo = computed(() => topicosFiltrados.value.find((topico) => topico.id === topicoAtivoId.value) || null)

watch(
  topicosFiltrados,
  (novosTopicos) => {
    if (!novosTopicos.length) {
      topicoAtivoId.value = ''
      return
    }

    const existeTopicoAtivo = novosTopicos.some((topico) => topico.id === topicoAtivoId.value)

    if (!existeTopicoAtivo) {
      topicoAtivoId.value = novosTopicos[0].id
    }
  },
  { immediate: true },
)

function selecionarTopico(topicoId) {
  topicoAtivoId.value = topicoId
}
</script>

<template>
  <main class="pagina ajuda-view">
    <header class="cabecalho-pagina">
      <div>
        <p class="subtitulo">Ajuda interna</p>
        <h1>Central de Ajuda</h1>
        <p class="descricao">Aprenda a usar as principais funcionalidades do NuvemMais Gestão.</p>
      </div>
    </header>

    <section class="resumo-ajuda" aria-label="Resumo da central de ajuda">
      <article v-for="item in estatisticas" :key="item.rotulo" class="resumo-item">
        <span>{{ item.rotulo }}</span>
        <strong>{{ item.valor }}</strong>
      </article>
    </section>

    <section class="ferramentas-ajuda" aria-label="Busca de ajuda">
      <label class="campo-busca">
        <span>Buscar tópico</span>
        <input
          v-model="busca"
          type="search"
          placeholder="Ex: agenda, clientes, senha, link público"
        />
      </label>

      <p class="resultado-busca">
        {{ topicosFiltrados.length }} tópico(s) encontrado(s)
      </p>
    </section>

    <section id="versao-novidades">
      <SystemVersionPanel titulo="Versão e novidades" :novidades-padrao="notasAtualizacaoAjuda" />
    </section>

    <section class="layout-ajuda">
      <aside class="lista-topicos" aria-label="Tópicos da central de ajuda">
        <div class="lista-topicos-conteudo">
          <button
            v-for="topico in topicosFiltrados"
            :key="topico.id"
            type="button"
            class="topico-item"
            :class="{ ativo: topico.id === topicoAtivoId }"
            @click="selecionarTopico(topico.id)"
          >
            <strong>{{ topico.titulo }}</strong>
            <span>{{ topico.resumo }}</span>
          </button>

          <p v-if="!topicosFiltrados.length" class="estado-vazio">
            Nenhum tópico encontrado. Tente buscar por outro termo.
          </p>
        </div>
      </aside>

      <section class="conteudo-topico" aria-live="polite">
        <article v-if="topicoAtivo" class="topico-detalhe">
          <header class="topico-cabecalho">
            <div>
              <p class="subtitulo">Tópico selecionado</p>
              <h2>{{ topicoAtivo.titulo }}</h2>
            </div>
            <div class="acoes-topico">
              <RouterLink v-if="topicoAtivo.rota" class="botao-tela" :to="topicoAtivo.rota">
                Ir para esta tela
              </RouterLink>
              <span class="selo-topico">Ajuda</span>
            </div>
          </header>

          <p class="texto-principal">{{ topicoAtivo.introducao }}</p>
          <p class="texto-destaque">{{ topicoAtivo.destaque }}</p>

          <section v-if="topicoAtivo.roteiro?.length" class="roteiro-recomendado">
            <h3>Roteiro recomendado</h3>
            <ol>
              <li v-for="passo in topicoAtivo.roteiro" :key="passo">{{ passo }}</li>
            </ol>
          </section>

          <section class="secao-texto">
            <h3>O que você encontra nessa área</h3>
            <ul>
              <li v-for="ponto in topicoAtivo.pontos" :key="ponto">{{ ponto }}</li>
            </ul>
          </section>

          <figure v-if="topicoAtivo.imagem?.src && topicoAtivo.id !== 'perguntas-frequentes'" class="imagem-topico">
            <img :src="topicoAtivo.imagem.src" :alt="topicoAtivo.imagem.alt || `Imagem da tela ${topicoAtivo.titulo}`" />
            <figcaption v-if="topicoAtivo.imagem.legenda">{{ topicoAtivo.imagem.legenda }}</figcaption>
          </figure>

          <section v-if="topicoAtivo.perguntas?.length" class="secao-texto faq-secao">
            <h3>Perguntas frequentes</h3>

            <details v-for="item in topicoAtivo.perguntas" :key="item.pergunta" class="faq-item">
              <summary>{{ item.pergunta }}</summary>
              <p>{{ item.resposta }}</p>
            </details>
          </section>
        </article>

        <article v-else class="topico-vazio">
          <h2>Nenhum tópico selecionado</h2>
          <p>Use a busca ou escolha um tópico na lista para visualizar as orientações.</p>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.ajuda-view {
  display: grid;
  gap: 20px;
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

.cabecalho-pagina h1,
.topico-cabecalho h2 {
  margin: 0;
  font-weight: 800;
  letter-spacing: 0;
}

.cabecalho-pagina h1 {
  font-size: 32px;
}

.descricao {
  margin: 6px 0 0;
  color: #64748b;
}

.resumo-ajuda {
  display: grid;
  grid-template-columns: repeat(3, minmax(160px, 1fr));
  gap: 14px;
}

.resumo-item,
.ferramentas-ajuda,
.lista-topicos,
.conteudo-topico {
  background: white;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  box-shadow: 0 8px 24px rgba(15, 23, 42, 0.06);
}

.resumo-item {
  display: grid;
  gap: 8px;
  padding: 18px;
  border-left: 4px solid #2563eb;
}

.resumo-item span {
  color: #64748b;
  font-size: 13px;
  font-weight: 700;
}

.resumo-item strong {
  color: #111827;
  font-size: 28px;
  font-weight: 800;
}

.ferramentas-ajuda {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  padding: 18px;
}

.campo-busca {
  flex: 1 1 auto;
  display: grid;
  gap: 8px;
  color: #334155;
  font-size: 14px;
  font-weight: 700;
}

.campo-busca input {
  width: 100%;
  min-width: 0;
  border: 1px solid #d1d5db;
  border-radius: 8px;
  padding: 12px 14px;
  background: white;
  color: #111827;
  font: inherit;
}

.campo-busca input:focus {
  outline: none;
  border-color: #2563eb;
  box-shadow: 0 0 0 3px rgba(37, 99, 235, 0.12);
}

.resultado-busca {
  margin: 0;
  color: #475569;
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.layout-ajuda {
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  gap: 18px;
  align-items: start;
}

.lista-topicos,
.conteudo-topico {
  min-width: 0;
}

.lista-topicos-conteudo,
.topico-detalhe,
.topico-vazio {
  display: grid;
  gap: 12px;
  padding: 18px;
}

.lista-topicos-conteudo {
  max-height: 70vh;
  overflow-y: auto;
}

.topico-item {
  width: 100%;
  display: grid;
  gap: 6px;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 14px;
  background: #f8fafc;
  color: #111827;
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.topico-item:hover {
  transform: translateY(-1px);
  border-color: #93c5fd;
}

.topico-item.ativo {
  border-color: #2563eb;
  background: #eff6ff;
}

.topico-item strong {
  font-size: 15px;
  font-weight: 800;
}

.topico-item span,
.estado-vazio,
.texto-principal,
.texto-destaque,
.imagem-topico figcaption,
.faq-item p,
.topico-vazio p {
  margin: 0;
  color: #475569;
  line-height: 1.6;
}

.topico-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.topico-cabecalho h2 {
  font-size: 28px;
}

.selo-topico {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  background: #dbeafe;
  color: #1d4ed8;
  font-size: 12px;
  font-weight: 800;
  text-transform: uppercase;
}

.acoes-topico {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
  justify-content: flex-end;
}

.botao-tela {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border: 1px solid #bfdbfe;
  border-radius: 999px;
  padding: 6px 12px;
  background: #ffffff;
  color: #1d4ed8;
  font-size: 13px;
  font-weight: 800;
  text-decoration: none;
  transition:
    background 0.15s ease,
    border-color 0.15s ease,
    transform 0.15s ease;
}

.botao-tela:hover {
  transform: translateY(-1px);
  border-color: #60a5fa;
  background: #eff6ff;
}

.texto-principal {
  font-size: 16px;
}

.texto-destaque {
  color: #1e293b;
  font-weight: 700;
}

.secao-texto {
  display: grid;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid #e5e7eb;
}

.secao-texto h3 {
  margin: 0;
  color: #111827;
  font-size: 20px;
  font-weight: 800;
}

.secao-texto ul {
  margin: 0;
  padding-left: 20px;
  color: #374151;
  display: grid;
  gap: 10px;
}

.roteiro-recomendado {
  display: grid;
  gap: 12px;
  padding: 18px;
  border: 1px solid #bfdbfe;
  border-radius: 12px;
  background: linear-gradient(135deg, #eff6ff 0%, #ffffff 100%);
}

.roteiro-recomendado h3 {
  margin: 0;
  color: #0f172a;
  font-size: 20px;
  font-weight: 800;
}

.roteiro-recomendado ol {
  margin: 0;
  padding-left: 22px;
  color: #334155;
  display: grid;
  gap: 9px;
}

.roteiro-recomendado li::marker {
  color: #2563eb;
  font-weight: 800;
}

.imagem-topico {
  margin: 0;
  display: grid;
  gap: 10px;
}

.imagem-topico img {
  width: 100%;
  max-height: 460px;
  object-fit: contain;
  border: 1px solid #e5e7eb;
  border-radius: 12px;
  background: #f8fafc;
  box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);
}

.faq-item {
  overflow: hidden;
  border: 1px solid #e5e7eb;
  border-radius: 10px;
  background: #ffffff;
  box-shadow: 0 6px 16px rgba(15, 23, 42, 0.04);
}

.faq-item:first-of-type {
  border-top: 1px solid #e5e7eb;
}

.faq-item summary {
  cursor: pointer;
  color: #111827;
  font-weight: 800;
  list-style: none;
  padding: 14px 16px;
}

.faq-item summary::after {
  content: '+';
  float: right;
  color: #2563eb;
  font-size: 18px;
  line-height: 1;
}

.faq-item[open] summary {
  background: #f8fafc;
}

.faq-item[open] summary::after {
  content: '-';
}

.faq-item summary::-webkit-details-marker {
  display: none;
}

.faq-item p {
  padding: 0 16px 16px;
}

.topico-vazio {
  min-height: 320px;
  align-content: center;
}

.topico-vazio h2 {
  margin: 0;
  font-size: 26px;
  font-weight: 800;
}

@media (max-width: 1024px) {
  .layout-ajuda {
    grid-template-columns: 1fr;
  }

  .lista-topicos-conteudo {
    max-height: none;
  }
}

@media (max-width: 900px) {
  .cabecalho-pagina,
  .ferramentas-ajuda,
  .topico-cabecalho {
    flex-direction: column;
    align-items: flex-start;
  }

  .acoes-topico {
    justify-content: flex-start;
  }

  .resumo-ajuda {
    grid-template-columns: 1fr;
  }

  .resultado-busca {
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .cabecalho-pagina h1 {
    font-size: 28px;
  }

  .topico-cabecalho h2 {
    font-size: 24px;
  }

  .botao-tela,
  .selo-topico {
    width: 100%;
  }
}
</style>
