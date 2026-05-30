<script setup>
import { computed, ref, watch } from 'vue'
import SystemVersionPanel from '@/components/SystemVersionPanel.vue'

const busca = ref('')
const topicoAtivoId = ref('comecando')

const roteiroRecomendado = [
  'Cadastre os serviÃ§os oferecidos.',
  'Cadastre os funcionÃ¡rios.',
  'Cadastre ou importe os clientes.',
  'Confira os horÃ¡rios e disponibilidades.',
  'FaÃ§a um agendamento interno de teste.',
  'Copie o link pÃºblico e teste um agendamento como cliente.',
]

const perguntasFrequentes = [
  {
    pergunta: 'Como faÃ§o um novo agendamento?',
    resposta:
      'Abra a Agenda, clique para criar um novo agendamento e preencha cliente, serviÃ§o, funcionÃ¡rio, data e horÃ¡rio. Depois confirme para salvar.',
  },
  {
    pergunta: 'Como o cliente agenda pelo link pÃºblico?',
    resposta:
      'Com o link pÃºblico ativo, o cliente abre a pÃ¡gina da sua empresa, escolhe o serviÃ§o, o horÃ¡rio disponÃ­vel e conclui o agendamento sozinho.',
  },
  {
    pergunta: 'Onde vejo os agendamentos recebidos pelo link pÃºblico?',
    resposta:
      'Os agendamentos recebidos pelo link pÃºblico aparecem na Agenda e tambÃ©m podem gerar aviso nas NotificaÃ§Ãµes para facilitar o acompanhamento.',
  },
  {
    pergunta: 'Como cadastro um novo serviÃ§o?',
    resposta:
      'Entre em ServiÃ§os, crie um novo cadastro e informe nome, preÃ§o, duraÃ§Ã£o, descriÃ§Ã£o e se o serviÃ§o estÃ¡ ativo.',
  },
  {
    pergunta: 'Como cadastro um funcionÃ¡rio?',
    resposta:
      'Acesse FuncionÃ¡rios, faÃ§a o cadastro do profissional e depois organize dias, horÃ¡rios e serviÃ§os atendidos, quando esse vÃ­nculo estiver disponÃ­vel.',
  },
  {
    pergunta: 'Como vejo minhas notificaÃ§Ãµes?',
    resposta:
      'Clique no sino no topo do sistema ou entre na tela de NotificaÃ§Ãµes para ver avisos recentes e acompanhar novidades importantes.',
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
    titulo: 'ComeÃ§ando no NuvemMais GestÃ£o',
    resumo: 'Uma visÃ£o geral do sistema e do que vocÃª consegue organizar no dia a dia.',
    palavrasChave: ['inicio', 'primeiros passos', 'clientes', 'serviÃ§os', 'agenda'],
    introducao:
      'O NuvemMais GestÃ£o ajuda sua empresa a manter a operaÃ§Ã£o organizada em um sÃ³ lugar. Com ele, vocÃª acompanha clientes, serviÃ§os, funcionÃ¡rios, agenda, notificaÃ§Ãµes, relatÃ³rios e o link pÃºblico para agendamentos.',
    pontos: [
      'Use o menu lateral para acessar rapidamente cada Ã¡rea da empresa.',
      'Comece cadastrando serviÃ§os, funcionÃ¡rios e clientes para deixar a agenda pronta para uso.',
      'Depois ajuste dados da empresa, horÃ¡rios e pÃ¡gina pÃºblica para facilitar o atendimento.',
    ],
    destaque: 'Bom ponto de partida para quem estÃ¡ comeÃ§ando a usar o sistema.',
    roteiro: roteiroRecomendado,
  },
  {
    id: 'dashboard',
    titulo: 'Dashboard',
    resumo: 'Resumo rÃ¡pido da empresa com nÃºmeros e movimentaÃ§Ãµes importantes.',
    palavrasChave: ['indicadores', 'resumo', 'visÃ£o geral', 'agendamentos do dia'],
    introducao:
      'O Dashboard mostra uma visÃ£o geral da empresa. Ele reÃºne agendamentos do dia, prÃ³ximos compromissos, notificaÃ§Ãµes e indicadores que ajudam no acompanhamento da operaÃ§Ã£o.',
    pontos: [
      'Veja rapidamente o movimento do dia e da semana.',
      'Acompanhe prÃ³ximos agendamentos sem precisar abrir outras telas.',
      'Use essa Ã¡rea para ter uma leitura rÃ¡pida da rotina da empresa.',
    ],
    destaque: 'Ideal para comeÃ§ar o dia e acompanhar o andamento da operaÃ§Ã£o.',
    rota: '/dashboard',
  },
  {
    id: 'agenda',
    titulo: 'Agenda',
    resumo: 'CriaÃ§Ã£o, acompanhamento e filtros dos agendamentos da empresa.',
    palavrasChave: ['agendamento', 'horÃ¡rio', 'cliente', 'status', 'origem'],
    introducao:
      'Na Agenda vocÃª cria agendamentos internos e acompanha tudo o que foi marcado. Ã‰ aqui que a rotina diÃ¡ria costuma acontecer.',
    pontos: [
      'Crie um agendamento escolhendo cliente, serviÃ§o, funcionÃ¡rio, data e horÃ¡rio.',
      'Filtre a visualizaÃ§Ã£o por status, origem e outros critÃ©rios disponÃ­veis na tela.',
      'Acompanhe tambÃ©m os agendamentos recebidos pelo link pÃºblico da empresa.',
    ],
    destaque: 'Ã‰ a Ã¡rea principal para organizar horÃ¡rios e acompanhar atendimentos.',
    rota: '/agenda',
  },
  {
    id: 'clientes',
    titulo: 'Clientes',
    resumo: 'Cadastro e gestÃ£o dos clientes atendidos pela empresa.',
    palavrasChave: ['cadastro', 'contato', 'histÃ³rico', 'cliente'],
    introducao:
      'A tela de Clientes serve para cadastrar e consultar as pessoas atendidas pela empresa. Manter esse cadastro em dia ajuda muito na organizaÃ§Ã£o.',
    pontos: [
      'Cadastre novos clientes com as informaÃ§Ãµes necessÃ¡rias para contato.',
      'Consulte clientes jÃ¡ registrados sempre que precisar localizar dados.',
      'Use essa base para facilitar a criaÃ§Ã£o de novos agendamentos.',
    ],
    destaque: 'Um cadastro bem organizado deixa a agenda mais rÃ¡pida e confiÃ¡vel.',
    rota: '/clientes',
  },
  {
    id: 'servicos',
    titulo: 'ServiÃ§os',
    resumo: 'Cadastro do que a empresa oferece e dos detalhes de cada atendimento.',
    palavrasChave: ['preÃ§o', 'duraÃ§Ã£o', 'descriÃ§Ã£o', 'ativo', 'inativo'],
    introducao:
      'Na Ã¡rea de ServiÃ§os vocÃª registra o que a empresa oferece. Cada serviÃ§o pode ter seu prÃ³prio preÃ§o, duraÃ§Ã£o, descriÃ§Ã£o e situaÃ§Ã£o.',
    pontos: [
      'Cadastre os serviÃ§os com nome claro e fÃ¡cil de identificar.',
      'Defina preÃ§o e duraÃ§Ã£o para ajudar na organizaÃ§Ã£o da agenda.',
      'Use o status ativo ou inativo para controlar o que continua disponÃ­vel.',
    ],
    destaque: 'Essa configuraÃ§Ã£o ajuda o sistema a montar agendamentos com mais consistÃªncia.',
    rota: '/servicos',
  },
  {
    id: 'funcionarios',
    titulo: 'FuncionÃ¡rios',
    resumo: 'OrganizaÃ§Ã£o dos profissionais e da rotina de atendimento.',
    palavrasChave: ['profissionais', 'dias', 'horÃ¡rios', 'serviÃ§os'],
    introducao:
      'A tela de FuncionÃ¡rios Ã© usada para cadastrar os profissionais da empresa e organizar como cada um atende no dia a dia.',
    pontos: [
      'Cadastre os profissionais que atendem na empresa.',
      'Organize horÃ¡rios e dias de atendimento de cada pessoa.',
      'Quando existir esse vÃ­nculo, associe os serviÃ§os que cada profissional pode atender.',
    ],
    destaque: 'Muito Ãºtil para distribuir a agenda e evitar conflitos de atendimento.',
    rota: '/funcionarios',
  },
  {
    id: 'disponibilidade',
    titulo: 'Disponibilidade',
    resumo: 'Controle de bloqueios, folgas e perÃ­odos indisponÃ­veis.',
    palavrasChave: ['bloqueio', 'folga', 'indisponibilidade', 'horÃ¡rios'],
    introducao:
      'A Ã¡rea de Disponibilidade ajuda a controlar quando a empresa, um funcionÃ¡rio ou um serviÃ§o nÃ£o pode ser agendado.',
    pontos: [
      'Registre bloqueios de horÃ¡rio para evitar marcaÃ§Ãµes indevidas.',
      'Organize folgas e perÃ­odos em que nÃ£o haverÃ¡ atendimento.',
      'Use essa Ã¡rea para manter a agenda alinhada com a realidade da operaÃ§Ã£o.',
    ],
    destaque: 'Ajuda a reduzir conflitos e horÃ¡rios que nÃ£o podem ser usados.',
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
    titulo: 'NotificaÃ§Ãµes',
    resumo: 'Avisos importantes no sino e na tela de notificaÃ§Ãµes.',
    palavrasChave: ['sino', 'avisos', 'novos agendamentos pÃºblicos'],
    introducao:
      'As NotificaÃ§Ãµes ajudam vocÃª a acompanhar acontecimentos importantes dentro do sistema, como novos agendamentos pÃºblicos e outros avisos relevantes.',
    pontos: [
      'Veja alertas pelo sino no topo do sistema.',
      'Abra a tela de NotificaÃ§Ãµes para consultar os avisos com mais calma.',
      'Acompanhe especialmente os novos agendamentos recebidos pelo link pÃºblico.',
    ],
    destaque: 'Uma boa forma de nÃ£o perder acontecimentos importantes da rotina.',
    rota: '/notificacoes',
  },
  {
    id: 'relatorios',
    titulo: 'RelatÃ³rios',
    resumo: 'Acompanhamento de agendamentos, receita, serviÃ§os e desempenho.',
    palavrasChave: ['receita', 'desempenho', 'acompanhamento', 'resultados'],
    introducao:
      'Na Ã¡rea de RelatÃ³rios vocÃª acompanha informaÃ§Ãµes que ajudam a entender melhor o desempenho da empresa ao longo do tempo.',
    pontos: [
      'Consulte dados de agendamentos e movimentaÃ§Ã£o da operaÃ§Ã£o.',
      'Acompanhe receita e desempenho dos serviÃ§os.',
      'Use os relatÃ³rios para tomar decisÃµes com mais clareza.',
    ],
    destaque: 'Ideal para analisar resultados e enxergar oportunidades de melhoria.',
    rota: '/relatorios',
  },
  {
    id: 'minha-empresa',
    titulo: 'Minha empresa',
    resumo: 'ConfiguraÃ§Ã£o dos dados principais da empresa.',
    palavrasChave: ['dados da empresa', 'horÃ¡rios', 'endereÃ§o', 'telefone', 'link pÃºblico'],
    introducao:
      'Em Minha empresa vocÃª ajusta as informaÃ§Ãµes principais da empresa, incluindo dados de contato, horÃ¡rios e configuraÃ§Ãµes importantes da operaÃ§Ã£o.',
    pontos: [
      'Atualize nome, endereÃ§o, telefone e outras informaÃ§Ãµes da empresa.',
      'Configure horÃ¡rios de funcionamento para apoiar a rotina de atendimento.',
      'Consulte e organize o link pÃºblico da empresa nessa Ã¡rea.',
    ],
    destaque: 'Essa tela concentra dados essenciais para o funcionamento da empresa.',
    rota: '/minha-empresa',
  },
  {
    id: 'personalizacao',
    titulo: 'PersonalizaÃ§Ã£o',
    resumo: 'Ajustes da pÃ¡gina pÃºblica da empresa.',
    palavrasChave: ['cores', 'textos', 'polÃ­tica de cancelamento', 'pÃ¡gina pÃºblica'],
    introducao:
      'A Ã¡rea de PersonalizaÃ§Ã£o permite deixar a pÃ¡gina pÃºblica da empresa com a sua identidade e com orientaÃ§Ãµes importantes para o cliente.',
    pontos: [
      'Ajuste cores e textos da pÃ¡gina pÃºblica.',
      'Inclua polÃ­tica de cancelamento e informaÃ§Ãµes Ãºteis para o cliente.',
      'Use essa Ã¡rea para deixar a experiÃªncia mais alinhada com a sua empresa.',
    ],
    destaque: 'Ajuda a apresentar a empresa com mais clareza para o cliente final.',
    rota: '/personalizacao',
  },
  {
    id: 'usuarios',
    titulo: 'UsuÃ¡rios',
    resumo: 'GestÃ£o de acessos ao sistema.',
    palavrasChave: ['acessos', 'permissÃµes', 'usuÃ¡rios do sistema'],
    introducao:
      'Na tela de UsuÃ¡rios vocÃª gerencia quem pode entrar no sistema e acompanhar a rotina da empresa.',
    pontos: [
      'Cadastre ou acompanhe os usuÃ¡rios com acesso liberado.',
      'Use essa Ã¡rea para organizar a gestÃ£o dos acessos.',
      'Mantenha os dados dos usuÃ¡rios atualizados para facilitar o uso diÃ¡rio.',
    ],
    destaque: 'Importante para controlar quem acessa o sistema da empresa.',
    rota: '/usuarios',
  },
  {
    id: 'minha-conta',
    titulo: 'Minha conta',
    resumo: 'AtualizaÃ§Ã£o dos seus dados pessoais.',
    palavrasChave: ['nome', 'e-mail', 'login', 'dados pessoais'],
    introducao:
      'A Ã¡rea Minha conta foi criada para vocÃª manter seus dados pessoais atualizados dentro do sistema.',
    pontos: [
      'Altere nome, e-mail, usuÃ¡rio ou login quando necessÃ¡rio.',
      'Revise seus dados para manter o acesso organizado.',
      'Use essa Ã¡rea sempre que precisar atualizar suas informaÃ§Ãµes pessoais.',
    ],
    destaque: 'Ã‰ o lugar certo para cuidar dos seus dados de acesso.',
    rota: '/minha-conta',
  },
  {
    id: 'alterar-senha',
    titulo: 'Alterar senha',
    resumo: 'Troca de senha para manter o acesso seguro.',
    palavrasChave: ['senha', 'trocar senha', 'seguranÃ§a'],
    introducao:
      'Na tela Alterar senha vocÃª pode atualizar sua senha de acesso sempre que precisar.',
    pontos: [
      'Informe a senha atual e a nova senha.',
      'Escolha uma senha fÃ¡cil para vocÃª lembrar, mas difÃ­cil para outras pessoas adivinharem.',
      'Depois de confirmar, use a nova senha nos prÃ³ximos acessos.',
    ],
    destaque: 'Recomendado sempre que vocÃª quiser reforÃ§ar a seguranÃ§a do acesso.',
    rota: '/alterar-senha',
  },
  {
    id: 'faturas-plano',
    titulo: 'Faturas e Meu plano',
    resumo: 'Acompanhamento do plano, das cobranÃ§as e da situaÃ§Ã£o financeira.',
    palavrasChave: ['financeiro', 'assinatura', 'cobranÃ§as', 'faturas', 'plano'],
    introducao:
      'As Ã¡reas Meu plano e Faturas ajudam a acompanhar a assinatura da empresa e a situaÃ§Ã£o financeira relacionada ao uso do sistema.',
    pontos: [
      'Consulte detalhes do plano atual da empresa.',
      'Acompanhe faturas, pagamentos e pendÃªncias quando houver.',
      'Use essas informaÃ§Ãµes para manter a assinatura em dia.',
    ],
    destaque: 'Essas telas ajudam no controle financeiro da assinatura da empresa.',
    rota: '/meu-plano',
  },
  {
    id: 'perguntas-frequentes',
    titulo: 'Perguntas frequentes',
    resumo: 'Respostas rÃ¡pidas para dÃºvidas comuns do dia a dia.',
    palavrasChave: ['faq', 'dÃºvidas', 'perguntas', 'ajuda rÃ¡pida'],
    introducao:
      'Aqui vocÃª encontra respostas simples para as dÃºvidas mais comuns no uso do sistema.',
    pontos: [
      'Use a busca para localizar uma dÃºvida especÃ­fica.',
      'Abra as perguntas para ver respostas rÃ¡pidas e diretas.',
      'Essa Ã¡rea Ã© Ãºtil para consultas do dia a dia.',
    ],
    destaque: 'Boa opÃ§Ã£o para resolver dÃºvidas rÃ¡pidas sem sair da tela de Ajuda.',
    perguntas: perguntasFrequentes,
  },
]

const estatisticas = computed(() => [
  { rotulo: 'TÃ³picos principais', valor: topicos.length - 1 },
  { rotulo: 'Perguntas frequentes', valor: perguntasFrequentes.length },
  { rotulo: 'Busca rÃ¡pida', valor: 'DisponÃ­vel' },
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
        <p class="descricao">Aprenda a usar as principais funcionalidades do NuvemMais GestÃ£o.</p>
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
        <span>Buscar tÃ³pico</span>
        <input
          v-model="busca"
          type="search"
          placeholder="Ex: agenda, clientes, senha, link pÃºblico"
        />
      </label>

      <p class="resultado-busca">
        {{ topicosFiltrados.length }} tÃ³pico(s) encontrado(s)
      </p>
    </section>

    <SystemVersionPanel titulo="Versão e novidades" />

    <section class="layout-ajuda">
      <aside class="lista-topicos" aria-label="TÃ³picos da central de ajuda">
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
            Nenhum tÃ³pico encontrado. Tente buscar por outro termo.
          </p>
        </div>
      </aside>

      <section class="conteudo-topico" aria-live="polite">
        <article v-if="topicoAtivo" class="topico-detalhe">
          <header class="topico-cabecalho">
            <div>
              <p class="subtitulo">TÃ³pico selecionado</p>
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
            <h3>O que vocÃª encontra nessa Ã¡rea</h3>
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
          <h2>Nenhum tÃ³pico selecionado</h2>
          <p>Use a busca ou escolha um tÃ³pico na lista para visualizar as orientaÃ§Ãµes.</p>
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
