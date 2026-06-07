<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SystemVersionPanel from '@/components/SystemVersionPanel.vue'

const route = useRoute()
const router = useRouter()

const busca = ref('')
const topicoAtivoId = ref('comecando')
const abaAtiva = ref('tutoriais')
const modoDetalhe = ref('resumo')
const secaoNovidadesRef = ref(null)
const mostrarListaTopicos = ref(true)
const isViewportMobile = ref(false)
let mediaQueryTopicos = null

const ABA_TUTORIAIS = 'tutoriais'
const ABA_NOVIDADES = 'novidades-versao'
const HASH_VERSAO_NOVIDADES = 'versao-novidades'
const MODO_RESUMO = 'resumo'
const MODO_PASSO_A_PASSO = 'passo-a-passo'

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
    pergunta: 'Como alterno entre Modo Essencial e Modo Completo?',
    resposta:
      'Use o seletor de modo no topo da tela. O Modo Essencial deixa o menu mais simples. O Modo Completo libera todas as áreas permitidas para o seu perfil.',
  },
  {
    pergunta: 'Como troco o tema da tela?',
    resposta:
      'Use o seletor de tema no topo da tela e escolha Claro, Escuro ou NuvemMais. A mudança é rápida e ajuda a leitura no dia a dia.',
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
    pergunta: 'Como funciona o catalogo publico?',
    resposta:
      'O catálogo público e o cardápio funcionam como uma vitrine simples dos produtos da empresa. O cliente vê o que está disponível e fala com você pelo botão de WhatsApp, sem carrinho, pedido, checkout ou pagamento.',
  },
  {
    pergunta: 'Como funciona o estoque do dia?',
    resposta:
      'O estoque do dia foi pensado para doces, lanches, cupcakes, marmitas e produtos artesanais. A empresa prepara a quantidade do dia, atualiza esse saldo no Estoque do dia e o cliente acompanha a disponibilidade no catálogo público ou cardápio. Nesta fase, a venda continua pelo WhatsApp, sem pedido, carrinho ou pagamento online.',
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
    id: 'modo-temas',
    titulo: 'Modo Essencial e aparência',
    resumo: 'Como simplificar o menu e mudar o visual da tela.',
    palavrasChave: ['modo essencial', 'modo completo', 'tema', 'aparência', 'claro', 'escuro', 'nuvemmais'],
    introducao:
      'O Modo Essencial deixa a navegação mais simples, ideal para o uso do dia a dia. O Modo Completo libera todas as áreas permitidas para o seu perfil. No topo da tela, você também pode trocar o tema para deixar a leitura mais confortável.',
    pontos: [
      'Use o Modo Essencial quando quiser focar só no que é mais importante.',
      'Use o Modo Completo quando precisar acessar todos os recursos permitidos.',
      'Troque o tema entre Claro, Escuro e NuvemMais conforme a sua preferência.',
      'O visual muda sem alterar seus dados, permissões ou rotas públicas.',
    ],
    destaque: 'Bom para deixar o sistema mais leve para quem prefere poucos atalhos e leitura simples.',
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
      'Use a aba Estoque do dia para fazer atualizacoes rapidas de quantidade no celular quando os produtos do dia forem acabando.',
      'O recurso pode depender do plano contratado pela empresa.',
    ],
    destaque: 'Ideal para manter o controle dos produtos sem planilhas paralelas.',
    rota: '/estoque',
  },
  {
    id: 'estoque-do-dia',
    titulo: 'Estoque do dia',
    resumo: 'Atualizacao rapida diaria para produtos que mudam de disponibilidade ao longo do dia.',
    palavrasChave: ['estoque do dia', 'doces', 'lanches', 'cupcakes', 'marmitas', 'catalogo', 'whatsapp'],
    introducao:
      'O Estoque do dia foi criado para miniempresas que vendem produtos frescos ou limitados, como doces, lanches, cupcakes, marmitas e comidas tipicas.',
    pontos: [
      'Prepare a quantidade do dia antes de abrir as vendas e aplique em lote nos produtos selecionados.',
      'Use os botoes de +1, -1 e o campo de quantidade para atualizar rapidamente o saldo disponivel ao longo do dia.',
      'Quando a quantidade chega a zero, o item passa a aparecer como esgotado no catalogo publico.',
      'Nesta fase nao existe pedido, carrinho, checkout ou pagamento online. O atendimento continua pelo WhatsApp.',
    ],
    destaque: 'Bom para operacoes que precisam refletir disponibilidade em tempo real sem complicar o atendimento.',
    rota: '/estoque',
  },
  {
    id: 'catalogo-publico',
    titulo: 'Catalogo publico / vitrine de produtos',
    resumo: 'Mostre produtos do dia em um link publico e receba contatos pelo WhatsApp.',
    palavrasChave: ['catalogo', 'vitrine', 'whatsapp', 'estoque', 'link publico', 'cardapio'],
    introducao:
      'O Catalogo publico e a Fase 1 da vitrine de produtos do NuvemMais Gestao. Nesta etapa, o cliente acessa o link da sua empresa, visualiza os produtos publicados, entende o que esta disponivel no dia e entra em contato pelo WhatsApp.',
    pontos: [
      'No cadastro ou na edicao do produto, marque Exibir no catalogo publico e preencha imagem, descricao publica, categoria publica, destaque, ordem e texto do botao, se desejar.',
      'Atualize a quantidade no Estoque do dia para refletir em tempo real o que esta disponivel ou esgotado na vitrine.',
      'Na aba Catalogo publico do Estoque, copie o link da vitrine e abra a pagina para revisar a experiencia que o cliente vera no celular.',
      'Voce pode escolher se o cliente vai ver preco, quantidade disponivel e qual texto aparece no botao de WhatsApp.',
      'A Fase 1 nao possui carrinho, pedido, pagamento, checkout ou reserva automatica. Ela funciona como vitrine online com contato por WhatsApp.',
    ],
    destaque: 'Ideal para doces, lanches, marmitas e outros produtos do dia que mudam rapido.',
    rota: '/catalogo-publico',
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

const ALIAS_TOPICO_POR_QUERY = {
  'faturas-meu-plano': 'faturas-plano',
}

const conteudoDetalhadoPorTopico = {
  comecando: [
    '1. Entre no sistema com seu login e sua senha.',
    '2. Veja o menu lateral e escolha a tela que quer usar.',
    '3. Comece cadastrando clientes, serviços e funcionários.',
    '4. Depois confira a agenda, o estoque e o link público.',
    '5. Se errar, volte para a Ajuda e leia o tópico de novo com calma.',
  ],
  'modo-temas': [
    '1. Use o seletor de modo no topo da tela.',
    '2. Escolha Modo Essencial para ver menos opções e ficar mais simples.',
    '3. Escolha Modo Completo quando quiser ver todas as áreas permitidas.',
    '4. No mesmo topo, troque o tema entre Claro, Escuro e NuvemMais.',
    '5. Confira se a tela ficou mais fácil de ler para você.',
  ],
  dashboard: [
    '1. Entre no Dashboard logo ao abrir o sistema.',
    '2. Olhe os números principais para entender como está o dia.',
    '3. Veja os agendamentos e avisos mais importantes sem sair da tela.',
    '4. Use os blocos resumidos para achar o que precisa com rapidez.',
    '5. Se quiser se aprofundar, abra as telas específicas pela lateral.',
  ],
  agenda: [
    '1. Entre na Agenda para ver os horários marcados.',
    '2. Clique para criar um novo agendamento.',
    '3. Preencha cliente, serviço, funcionário, data e hora.',
    '4. Salve o agendamento e confira se ele apareceu na lista.',
    '5. Use os filtros para localizar marcações por status ou origem.',
  ],
  clientes: [
    '1. Entre em Clientes para ver o cadastro das pessoas atendidas.',
    '2. Clique em Novo cliente quando precisar incluir alguém.',
    '3. Preencha nome, contato e os dados que a empresa usa no dia a dia.',
    '4. Salve e confira se a pessoa apareceu na lista.',
    '5. Quando for marcar um horário, procure o cliente já cadastrado.',
  ],
  servicos: [
    '1. Entre em Serviços para cadastrar o que a empresa oferece.',
    '2. Clique em Novo serviço para abrir o formulário.',
    '3. Preencha nome, preço, duração e descrição simples.',
    '4. Marque o serviço como ativo para ele poder ser usado.',
    '5. Salve e confira se ele apareceu entre os serviços cadastrados.',
  ],
  funcionarios: [
    '1. Entre em Funcionários para organizar quem atende na empresa.',
    '2. Clique em Novo funcionário para iniciar o cadastro.',
    '3. Preencha nome, contato e as informações que a sua empresa usa.',
    '4. Ajuste dias e horários de atendimento quando essa opção estiver disponível.',
    '5. Salve e confira se o profissional apareceu na lista.',
  ],
  disponibilidade: [
    '1. Entre em Disponibilidade para bloquear horários que não podem ser usados.',
    '2. Clique em Novo bloqueio ou em uma ação parecida da tela.',
    '3. Escolha quem ou o que não poderá atender naquele período.',
    '4. Informe a data e o horário com cuidado.',
    '5. Salve e confira se o bloqueio apareceu na lista.',
  ],
  estoque: [
    '1. Entre em Estoque para ver seus produtos.',
    '2. Clique em Novo produto quando quiser cadastrar um item.',
    '3. Preencha nome, categoria, unidade, preço e quantidade inicial.',
    '4. Use Entrada, Saída ou Ajuste para mudar o saldo.',
    '5. Confira o alerta de baixo estoque para não faltar produto.',
  ],
  'estoque-do-dia': [
    '1. Entre na área de Estoque do dia quando quiser atualizar a quantidade disponível para hoje.',
    '2. Escolha os produtos que vão participar da venda do dia.',
    '3. Informe quantas unidades estão prontas para vender.',
    '4. Diminua o saldo quando os itens forem saindo.',
    '5. Confira se o catálogo público está mostrando o que ainda existe.',
  ],
  'catalogo-publico': [
    '1. Entre na área de catálogo ou vitrine da empresa.',
    '2. Marque os produtos que devem aparecer para o cliente.',
    '3. Ajuste imagem, descrição, preço e texto do botão, se quiser.',
    '4. Atualize o Estoque do dia para mostrar o que está disponível.',
    '5. Copie o link público e veja a tela como o cliente verá.',
  ],
  'dashboard-nuvemmais': [
    '1. Entre no Dashboard NuvemMais com perfil de administração.',
    '2. Escolha uma empresa para acompanhar os dados dela.',
    '3. Veja os números principais sem trocar de login.',
    '4. Use a visão geral para orientar suporte e conferência.',
    '5. Volte para a empresa seguinte quando terminar a análise.',
  ],
  'link-publico': [
    '1. Copie o link público de agendamento da empresa.',
    '2. Envie esse link para o cliente por mensagem, site ou rede social.',
    '3. Peça para a pessoa escolher o serviço e o horário livre.',
    '4. Confira se o agendamento entrou na agenda da empresa.',
    '5. Use o link sempre que quiser facilitar o autoatendimento.',
  ],
  notificacoes: [
    '1. Toque no sino no topo da tela quando aparecer um aviso.',
    '2. Abra a tela de Notificações para ler com calma.',
    '3. Veja os lembretes e os avisos de agendamentos novos.',
    '4. Marque como lido ou revise depois, conforme a tela permitir.',
    '5. Volte sempre que quiser conferir o que mudou no sistema.',
  ],
  relatorios: [
    '1. Entre em Relatórios para ver os resultados da empresa.',
    '2. Escolha o período que quer analisar.',
    '3. Confira os números de agendamentos, serviços e funcionários.',
    '4. Use os gráficos e as listas para entender melhor o movimento.',
    '5. Baixe ou copie os dados quando precisar mostrar para outra pessoa.',
  ],
  'minha-empresa': [
    '1. Entre em Minha empresa para rever os dados principais do negócio.',
    '2. Confira nome, contato, endereço e horário de funcionamento.',
    '3. Ajuste as informações que o cliente precisa enxergar com clareza.',
    '4. Salve as mudanças e confira se o link público continua correto.',
    '5. Volte aqui sempre que algum dado da empresa mudar.',
  ],
  personalizacao: [
    '1. Entre em Personalização para cuidar da página pública.',
    '2. Escolha cores, textos e orientações simples para o cliente.',
    '3. Preencha as mensagens importantes com palavras fáceis de entender.',
    '4. Salve e confira a prévia da página pública.',
    '5. Ajuste de novo se quiser deixar a apresentação mais bonita.',
  ],
  usuarios: [
    '1. Entre em Usuários para ver quem pode acessar o sistema.',
    '2. Clique em Novo usuário quando precisar liberar um acesso.',
    '3. Preencha nome, login e os dados pedidos pela tela.',
    '4. Salve e confira se a pessoa apareceu na lista de usuários.',
    '5. Revise os acessos quando alguém entrar ou sair da empresa.',
  ],
  'lixeira-global': [
    '1. Entre na Lixeira Global quando precisar recuperar um registro.',
    '2. Procure o item que foi enviado para a lixeira.',
    '3. Escolha Restaurar se o cadastro ainda for útil.',
    '4. Use exclusão definitiva só quando tiver certeza de que não precisa mais do dado.',
    '5. Confira a auditoria quando quiser saber o que foi feito.',
  ],
  'minha-conta': [
    '1. Entre em Minha conta para atualizar seus dados pessoais.',
    '2. Confira nome, e-mail e login.',
    '3. Ajuste o que estiver desatualizado com cuidado.',
    '4. Salve e teste o acesso novamente, se necessário.',
    '5. Volte aqui sempre que mudar seu contato ou seu nome de uso.',
  ],
  'alterar-senha': [
    '1. Entre em Alterar senha quando quiser trocar seu acesso.',
    '2. Digite a senha atual no primeiro campo.',
    '3. Escreva a nova senha nos campos seguintes.',
    '4. Confirme a troca e aguarde a mensagem de sucesso.',
    '5. Use a nova senha no próximo login.',
  ],
  'faturas-plano': [
    '1. Entre em Meu plano ou Faturas para ver a situação da assinatura.',
    '2. Confira o nome do plano e o que ele libera para a empresa.',
    '3. Veja se existe alguma fatura em aberto ou vencida.',
    '4. Faça a conferência antes de pedir ajuda para o financeiro.',
    '5. Use essa área para manter a assinatura em dia.',
  ],
  'perguntas-frequentes': [
    '1. Leia a pergunta que mais parece com a sua dúvida.',
    '2. Abra a resposta para ver a orientação completa.',
    '3. Use a busca da Ajuda se quiser achar um tema mais rápido.',
    '4. Volte para os tópicos quando precisar ver uma tela específica.',
    '5. Se ainda ficar em dúvida, siga o passo a passo do tópico relacionado.',
  ],
}

const historicoAtualizacoes = [
  {
    versao: '1.2.1-hml',
    dataPublicacao: '2026-06-06',
    itens: [
      'Planos comerciais NuvemMais Vitrine, Agenda e Completo.',
      'Bloco público “Quer ter uma página como esta?” com CTA para cadastro e planos em nova aba.',
      'Melhorias visuais no catálogo e cardápio público.',
      'Ajustes no Estoque, Estoque do dia e Catálogo público interno.',
      'Open Graph dinâmico para compartilhamento por cliente no WhatsApp.',
      'Fallback NuvemMais para links do site principal.',
    ],
  },
  {
    versao: '1.2.0-hml',
    dataPublicacao: '2026-06-04',
    itens: [
      'Modo Essencial para navegação simplificada.',
      'Modo Completo para acesso a todos os recursos.',
      'Temas Claro, Escuro e NuvemMais.',
      'Central de Ajuda com modo Resumo e passo a passo.',
      'Links "Ajuda desta tela" nas principais telas do sistema.',
      'Dashboard Essencial com ações rápidas.',
      'Catálogo público/Cardápio com vitrine de produtos.',
      'Estoque do dia integrado ao catálogo.',
      'Melhorias visuais no menu, topo, cards, botões e formulários.',
    ],
  },
  {
    versao: '1.1.1',
    dataPublicacao: '2026-05-31',
    itens: [
      'Lixeira Global integrada aos cadastros principais.',
      'Restauração de clientes, serviços, funcionários, usuários e produtos de estoque.',
      'Exclusão definitiva segura pela Lixeira Global.',
      'Cards/resumo da Lixeira Global corrigidos.',
      'Produtos de estoque integrados ao fluxo de lixeira.',
      'Auditoria/log nas ações de exclusão, restauração e exclusão definitiva.',
      'Versão do menu lateral sincronizada com Ajuda.',
    ],
  },
]

const estatisticas = computed(() => [
  { rotulo: 'Tópicos principais', valor: topicos.length - 1 },
  { rotulo: 'Perguntas frequentes', valor: perguntasFrequentes.length },
  { rotulo: 'Busca rápida', valor: 'Disponível' },
])

const topicoExibido = computed(() => topicosFiltrados.value.find((topico) => topico.id === topicoAtivoId.value) || null)
const modoAjudaAtual = computed(() => (modoDetalhe.value === MODO_PASSO_A_PASSO ? 'Passo a passo' : 'Resumo'))
const conteudoTopicoExibido = computed(() => {
  if (!topicoExibido.value) {
    return []
  }

  if (modoDetalhe.value === MODO_PASSO_A_PASSO) {
    return conteudoDetalhadoPorTopico[topicoExibido.value.id] || topicoExibido.value.pontos || []
  }

  return topicoExibido.value.pontos || []
})
const conteudoTopicoExibidoFormatado = computed(() =>
  conteudoTopicoExibido.value.map((passo) => removerNumeracaoInicial(passo)),
)

function normalizarHash(valor) {
  return String(valor || '').trim().replace(/^#/, '')
}

function normalizarTopico(valor) {
  return String(Array.isArray(valor) ? valor[0] : valor || '')
    .trim()
    .toLowerCase()
}

function resolverTopicoPorQuery(valor) {
  const topicoNormalizado = normalizarTopico(valor)
  if (!topicoNormalizado) {
    return ''
  }

  const topicoFinal = ALIAS_TOPICO_POR_QUERY[topicoNormalizado] || topicoNormalizado
  return topicos.some((topico) => topico.id === topicoFinal) ? topicoFinal : ''
}

function rolarParaTopicoAtivo() {
  if (typeof document === 'undefined') {
    return
  }

  const elemento = document.getElementById(`topico-${topicoAtivoId.value}`)
  elemento?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
}

function removerNumeracaoInicial(valor) {
  return String(valor || '').replace(/^\s*\d+[\.\)]\s+/, '')
}

function atualizarEstadoViewport(evento) {
  const ehMobile = typeof evento?.matches === 'boolean' ? evento.matches : mediaQueryTopicos?.matches || false
  isViewportMobile.value = ehMobile

  if (!ehMobile) {
    mostrarListaTopicos.value = true
  } else if (resolverTopicoPorQuery(route.query.topico)) {
    mostrarListaTopicos.value = false
  }
}

function recolherListaTopicosMobile() {
  if (isViewportMobile.value) {
    mostrarListaTopicos.value = false
  }
}

function abrirListaTopicos() {
  mostrarListaTopicos.value = true
}

async function sincronizarEstadoPelaRota() {
  const hashNormalizado = normalizarHash(route.hash)

  if (hashNormalizado === HASH_VERSAO_NOVIDADES) {
    abaAtiva.value = ABA_NOVIDADES
    return
  }

  abaAtiva.value = ABA_TUTORIAIS

  const topicoPorQuery = resolverTopicoPorQuery(route.query.topico)
  if (topicoPorQuery && topicoPorQuery !== topicoAtivoId.value) {
    topicoAtivoId.value = topicoPorQuery
  }

  if (topicoPorQuery && isViewportMobile.value) {
    mostrarListaTopicos.value = false
  }

  await nextTick()

  if (topicoPorQuery) {
    rolarParaTopicoAtivo()
  }
}

async function sincronizarAbaPelaHash(hash, rolar = false) {
  const hashNormalizado = normalizarHash(hash)
  const deveAbrirNovidades = hashNormalizado === HASH_VERSAO_NOVIDADES
  abaAtiva.value = deveAbrirNovidades ? ABA_NOVIDADES : ABA_TUTORIAIS

  if (deveAbrirNovidades && rolar) {
    await nextTick()
    secaoNovidadesRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }
}

async function selecionarAba(aba) {
  if (abaAtiva.value === aba) {
    return
  }

  abaAtiva.value = aba

  const hashDesejado = aba === ABA_NOVIDADES ? `#${HASH_VERSAO_NOVIDADES}` : ''
  const hashAtual = route.hash || ''

  if (hashAtual !== hashDesejado) {
    await router.replace({
      path: route.path,
      query: route.query,
      hash: hashDesejado,
    })
  }

  if (aba === ABA_NOVIDADES) {
    await nextTick()
    secaoNovidadesRef.value?.scrollIntoView?.({ behavior: 'smooth', block: 'start' })
  }
}

async function alternarModoAjuda(novoModo) {
  modoDetalhe.value = novoModo
  await nextTick()
}

async function selecionarTopico(topicoId) {
  topicoAtivoId.value = topicoId
  recolherListaTopicosMobile()
  await router.replace({
    path: route.path,
    query: {
      ...route.query,
      topico: topicoId,
    },
    hash: route.hash || '',
  })
  await nextTick()
  rolarParaTopicoAtivo()
}

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
const mostrarTopoResumo = computed(() => !isViewportMobile.value || mostrarListaTopicos.value || !topicoAtivo.value)

watch(busca, (termo) => {
  if (isViewportMobile.value && termo.trim()) {
    mostrarListaTopicos.value = true
  }
})

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

watch(
  () => [route.hash, route.query.topico],
  async () => {
    await sincronizarEstadoPelaRota()
  },
  { immediate: true },
)

function formatarDataAtualizacao(valor) {
  if (!valor) {
    return ''
  }

  const data = new Date(valor)

  if (Number.isNaN(data.getTime())) {
    return String(valor)
  }

  return data.toLocaleDateString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  })
}

watch(
  () => route.hash,
  (hash) => {
    void sincronizarAbaPelaHash(hash, true)
  },
  { immediate: true },
)

onMounted(() => {
  if (typeof window !== 'undefined' && typeof window.matchMedia === 'function') {
    mediaQueryTopicos = window.matchMedia('(max-width: 900px)')
    atualizarEstadoViewport(mediaQueryTopicos)

    if (typeof mediaQueryTopicos.addEventListener === 'function') {
      mediaQueryTopicos.addEventListener('change', atualizarEstadoViewport)
    } else if (typeof mediaQueryTopicos.addListener === 'function') {
      mediaQueryTopicos.addListener(atualizarEstadoViewport)
    }
  }

  void sincronizarAbaPelaHash(route.hash, false)
})

onBeforeUnmount(() => {
  if (!mediaQueryTopicos) {
    return
  }

  if (typeof mediaQueryTopicos.removeEventListener === 'function') {
    mediaQueryTopicos.removeEventListener('change', atualizarEstadoViewport)
  } else if (typeof mediaQueryTopicos.removeListener === 'function') {
    mediaQueryTopicos.removeListener(atualizarEstadoViewport)
  }
})
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

    <nav class="abas-ajuda" role="tablist" aria-label="Navegação interna da Ajuda">
      <button
      type="button"
      id="ajuda-tutoriais-tab"
      class="aba-ajuda"
      role="tab"
      aria-controls="ajuda-tutoriais"
      :aria-selected="abaAtiva === ABA_TUTORIAIS"
        :tabindex="abaAtiva === ABA_TUTORIAIS ? 0 : -1"
        :class="{ ativa: abaAtiva === ABA_TUTORIAIS }"
        @click="selecionarAba(ABA_TUTORIAIS)"
      >
        Tutoriais
      </button>
      <button
      type="button"
      id="ajuda-novidades-tab"
      class="aba-ajuda"
      role="tab"
      aria-controls="versao-novidades"
      :aria-selected="abaAtiva === ABA_NOVIDADES"
        :tabindex="abaAtiva === ABA_NOVIDADES ? 0 : -1"
        :class="{ ativa: abaAtiva === ABA_NOVIDADES }"
        @click="selecionarAba(ABA_NOVIDADES)"
      >
        Novidades / Versão
      </button>
    </nav>

    <section
      v-show="abaAtiva === ABA_TUTORIAIS"
      id="ajuda-tutoriais"
      class="painel-ajuda"
      role="tabpanel"
      :aria-hidden="abaAtiva !== ABA_TUTORIAIS"
      aria-labelledby="ajuda-tutoriais-tab"
    >
      <section v-if="mostrarTopoResumo" class="resumo-ajuda" aria-label="Resumo da central de ajuda">
        <article v-for="item in estatisticas" :key="item.rotulo" class="resumo-item">
          <span>{{ item.rotulo }}</span>
          <strong>{{ item.valor }}</strong>
        </article>
      </section>

      <section v-if="mostrarTopoResumo" class="ferramentas-ajuda" aria-label="Busca de ajuda">
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

      <section class="layout-ajuda">
        <aside v-show="!isViewportMobile || mostrarListaTopicos" id="lista-topicos-ajuda" class="lista-topicos" aria-label="Tópicos da central de ajuda">
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
          <article v-if="topicoAtivo" :id="`topico-${topicoAtivo.id}`" class="topico-detalhe">
            <header class="topico-cabecalho">
              <div>
                <p class="subtitulo">Tópico selecionado</p>
                <h2>{{ topicoAtivo.titulo }}</h2>
              </div>
              <div class="acoes-topico">
                <button
                  v-if="isViewportMobile && !mostrarListaTopicos"
                  type="button"
                  class="botao-voltar-topicos"
                  aria-controls="lista-topicos-ajuda"
                  @click="abrirListaTopicos"
                >
                  Voltar aos tópicos
                </button>
                <RouterLink v-if="topicoAtivo.rota" class="botao-tela" :to="topicoAtivo.rota">
                  Ir para esta tela
                </RouterLink>
                <span class="selo-topico">Ajuda</span>
              </div>
            </header>

            <p class="texto-principal">{{ topicoAtivo.introducao }}</p>
            <p class="texto-destaque">{{ topicoAtivo.destaque }}</p>

            <section class="modo-detalhe">
              <span>Modo de ajuda</span>
              <div class="modo-detalhe-botoes" role="tablist" aria-label="Nível de detalhe da ajuda">
                <button
                  type="button"
                  class="modo-detalhe-botao"
                  :class="{ ativa: modoDetalhe === MODO_RESUMO }"
                  :aria-pressed="modoDetalhe === MODO_RESUMO"
                  @click="alternarModoAjuda(MODO_RESUMO)"
                >
                  Resumo
                </button>
                <button
                  type="button"
                  class="modo-detalhe-botao"
                  :class="{ ativa: modoDetalhe === MODO_PASSO_A_PASSO }"
                  :aria-pressed="modoDetalhe === MODO_PASSO_A_PASSO"
                  @click="alternarModoAjuda(MODO_PASSO_A_PASSO)"
                >
                  Passo a passo
                </button>
              </div>
            </section>

            <section v-if="modoDetalhe === MODO_RESUMO && topicoAtivo.roteiro?.length" class="roteiro-recomendado">
              <h3>Roteiro recomendado</h3>
              <ol>
                <li v-for="passo in topicoAtivo.roteiro" :key="passo">{{ passo }}</li>
              </ol>
            </section>

            <section class="secao-texto">
              <h3>{{ modoAjudaAtual }}</h3>
              <p class="texto-ajuda-secundario">
                {{ modoDetalhe === MODO_PASSO_A_PASSO ? 'Siga na ordem para não se perder.' : 'Leia primeiro o resumo e use o passo a passo quando precisar de mais ajuda.' }}
              </p>
              <ol v-if="modoDetalhe === MODO_PASSO_A_PASSO" class="lista-passos">
                <li v-for="passo in conteudoTopicoExibidoFormatado" :key="passo">{{ passo }}</li>
              </ol>
              <ul v-else class="lista-resumo">
                <li v-for="ponto in conteudoTopicoExibido" :key="ponto">{{ ponto }}</li>
              </ul>
            </section>

            <figure
              v-if="topicoAtivo.imagem?.src && topicoAtivo.id !== 'perguntas-frequentes'"
              class="imagem-topico"
            >
              <img
                :src="topicoAtivo.imagem.src"
                :alt="topicoAtivo.imagem.alt || `Imagem da tela ${topicoAtivo.titulo}`"
              />
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
            <button
              v-if="isViewportMobile && !mostrarListaTopicos"
              type="button"
              class="botao-voltar-topicos botao-voltar-topicos-vazio"
              aria-controls="lista-topicos-ajuda"
              @click="abrirListaTopicos"
            >
              Ver outros tópicos
            </button>
          </article>
        </section>
      </section>
    </section>

    <section
      v-show="abaAtiva === ABA_NOVIDADES"
      id="versao-novidades"
      ref="secaoNovidadesRef"
      class="painel-ajuda painel-novidades"
      role="tabpanel"
      :aria-hidden="abaAtiva !== ABA_NOVIDADES"
      aria-labelledby="ajuda-novidades-tab"
    >
      <section class="novidades-cabecalho">
        <div>
          <p class="subtitulo">Versão e mudanças</p>
          <h2>Novidades / Versão</h2>
          <p class="descricao-secao">
            Aqui ficam a versão atual, o histórico de atualizações e os principais lançamentos da plataforma.
          </p>
        </div>
      </section>

      <SystemVersionPanel
        titulo="Versão do sistema"
        discreto
        :novidades-padrao="[]"
        :mostrar-novidades="false"
      />

      <section class="historico-atualizacoes" aria-label="Histórico de atualizações">
        <header class="historico-cabecalho">
          <h3>Histórico de atualizações</h3>
          <p>Novas versões podem ser adicionadas aqui sem remover o histórico anterior.</p>
        </header>

        <article v-for="versao in historicoAtualizacoes" :key="versao.versao" class="historico-item">
          <div class="historico-topo">
            <strong>{{ versao.versao }}</strong>
            <span v-if="versao.dataPublicacao">{{ formatarDataAtualizacao(versao.dataPublicacao) }}</span>
          </div>

          <ul>
            <li v-for="item in versao.itens" :key="item">{{ item }}</li>
          </ul>
        </article>
      </section>
    </section>
  </main>
</template>

<style scoped>
.ajuda-view {
  display: grid;
  gap: 20px;
  color: var(--app-text);
}

.abas-ajuda {
  display: flex;
  gap: 10px;
  padding: 6px;
  border: 1px solid var(--app-border);
  border-radius: calc(var(--app-radius) + 4px);
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.aba-ajuda {
  flex: 1 1 0;
  min-height: 44px;
  border: 1px solid transparent;
  border-radius: calc(var(--app-radius) - 2px);
  padding: 10px 16px;
  background: transparent;
  color: var(--app-text-muted);
  font-size: 14px;
  font-weight: 800;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease,
    transform 0.15s ease;
}

.aba-ajuda:hover {
  transform: translateY(-1px);
  color: var(--app-text);
}

.aba-ajuda.ativa {
  border-color: color-mix(in srgb, var(--app-primary) 32%, var(--app-border));
  background: color-mix(in srgb, var(--app-primary-soft) 44%, var(--app-surface));
  color: var(--app-text);
}

.painel-ajuda {
  display: grid;
  gap: 20px;
}

.descricao-secao {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.cabecalho-pagina {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 16px;
}

.subtitulo {
  margin: 0 0 4px;
  color: var(--app-primary);
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
  font-size: clamp(26px, 3vw, 32px);
}

.descricao {
  margin: 6px 0 0;
  color: var(--app-text-muted);
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
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow);
}

.resumo-item {
  display: grid;
  gap: 8px;
  padding: 16px;
  border-left: 4px solid var(--app-primary);
  background: color-mix(in srgb, var(--app-primary-soft) 32%, var(--app-surface));
}

.resumo-item span {
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 700;
}

.resumo-item strong {
  color: var(--app-text);
  font-size: clamp(22px, 3vw, 28px);
  font-weight: 800;
}

.ferramentas-ajuda {
  display: flex;
  justify-content: space-between;
  align-items: end;
  gap: 16px;
  padding: 16px;
}

.campo-busca {
  flex: 1 1 auto;
  display: grid;
  gap: 8px;
  color: var(--app-text);
  font-size: 14px;
  font-weight: 700;
}

.campo-busca input {
  width: 100%;
  min-width: 0;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 12px 14px;
  background: var(--app-surface);
  color: var(--app-text);
  font: inherit;
  box-sizing: border-box;
}

.campo-busca input:focus {
  outline: none;
  border-color: var(--app-primary);
  box-shadow: 0 0 0 3px var(--app-focus-ring);
}

.resultado-busca {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 14px;
  font-weight: 700;
  white-space: nowrap;
}

.historico-atualizacoes,
.historico-item {
  display: grid;
  gap: 12px;
}

.historico-atualizacoes {
  background: var(--app-surface);
  border: 1px solid var(--app-border);
  border-radius: var(--app-radius);
  box-shadow: var(--app-shadow);
  padding: 16px;
}

.historico-cabecalho h2 {
  margin: 0;
  font-size: clamp(20px, 2.4vw, 24px);
  font-weight: 800;
  color: var(--app-text);
}

.historico-cabecalho h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 800;
  color: var(--app-text);
}

.historico-cabecalho p {
  margin: 6px 0 0;
  color: var(--app-text-muted);
}

.historico-item {
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  background: var(--app-surface-soft);
}

.historico-topo {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.historico-topo strong {
  color: var(--app-text);
  font-size: 16px;
  overflow-wrap: anywhere;
}

.historico-topo span {
  color: var(--app-primary);
  font-size: 13px;
  font-weight: 700;
}

.historico-item ul {
  margin: 0;
  padding-left: 18px;
  color: var(--app-text);
  display: grid;
  gap: 8px;
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
  border: 1px solid var(--app-border);
  border-radius: 12px;
  padding: 14px;
  background: var(--app-surface-soft);
  color: var(--app-text);
  text-align: left;
  cursor: pointer;
  transition:
    border-color 0.15s ease,
    background 0.15s ease,
    transform 0.15s ease;
}

.topico-item:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-primary) 40%, var(--app-border));
}

.topico-item.ativo {
  border-color: var(--app-primary);
  background: color-mix(in srgb, var(--app-primary-soft) 40%, var(--app-surface));
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
  color: var(--app-text-muted);
  line-height: 1.6;
}

.topico-cabecalho {
  display: flex;
  justify-content: space-between;
  align-items: start;
  gap: 12px;
}

.topico-cabecalho h2 {
  font-size: clamp(22px, 2.6vw, 28px);
}

.selo-topico {
  flex: 0 0 auto;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  border-radius: 999px;
  padding: 6px 10px;
  background: var(--app-primary-soft);
  color: var(--app-primary);
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
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 6px 12px;
  background: var(--app-surface);
  color: var(--app-primary);
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
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
}

.botao-voltar-topicos {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  min-height: 32px;
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 6px 10px;
  background: color-mix(in srgb, var(--app-surface) 92%, var(--app-primary-soft) 8%);
  color: var(--app-text);
  font-size: 12px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.botao-voltar-topicos:hover {
  transform: translateY(-1px);
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.texto-principal {
  font-size: 16px;
}

.texto-destaque {
  color: var(--app-text);
  font-weight: 700;
}

.modo-detalhe {
  display: grid;
  gap: 10px;
  padding: 14px 16px;
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
}

.modo-detalhe > span {
  color: var(--app-text-muted);
  font-size: 13px;
  font-weight: 800;
  text-transform: uppercase;
  letter-spacing: 0.03em;
}

.modo-detalhe-botoes {
  display: inline-flex;
  gap: 8px;
  flex-wrap: wrap;
}

.modo-detalhe-botao {
  border: 1px solid var(--app-border);
  border-radius: 999px;
  padding: 9px 12px;
  background: var(--app-surface);
  color: var(--app-text-muted);
  font: inherit;
  font-size: 13px;
  font-weight: 800;
  cursor: pointer;
  transition:
    transform 0.15s ease,
    border-color 0.15s ease,
    background 0.15s ease,
    color 0.15s ease;
}

.modo-detalhe-botao:hover {
  transform: translateY(-1px);
  border-color: color-mix(in srgb, var(--app-primary) 30%, var(--app-border));
}

.modo-detalhe-botao.ativa {
  border-color: var(--app-primary);
  background: var(--app-primary-soft);
  color: var(--app-primary);
}

.texto-ajuda-secundario {
  margin: 0;
  color: var(--app-text-muted);
  font-size: 13px;
}

.secao-texto {
  display: grid;
  gap: 12px;
  padding-top: 8px;
  border-top: 1px solid var(--app-border);
}

.secao-texto h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 20px;
  font-weight: 800;
}

.secao-texto ul,
.secao-texto ol {
  margin: 0;
  padding-left: 20px;
  color: var(--app-text);
  display: grid;
  gap: 10px;
}

.secao-texto ul {
  list-style: disc;
}

.secao-texto ol {
  list-style: decimal;
}

.lista-resumo li::marker,
.lista-passos li::marker {
  color: var(--app-primary);
  font-weight: 800;
}

.roteiro-recomendado {
  display: grid;
  gap: 12px;
  padding: 16px;
  border: 1px solid color-mix(in srgb, var(--app-primary) 30%, var(--app-border));
  border-radius: 12px;
  background: linear-gradient(
    135deg,
    color-mix(in srgb, var(--app-primary-soft) 70%, var(--app-surface)) 0%,
    var(--app-surface) 100%
  );
}

.roteiro-recomendado h3 {
  margin: 0;
  color: var(--app-text);
  font-size: 20px;
  font-weight: 800;
}

.roteiro-recomendado ol {
  margin: 0;
  padding-left: 22px;
  color: var(--app-text);
  display: grid;
  gap: 9px;
}

.roteiro-recomendado li::marker {
  color: var(--app-primary);
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
  border: 1px solid var(--app-border);
  border-radius: 12px;
  background: var(--app-surface-soft);
  box-shadow: var(--app-shadow);
}

.faq-item {
  overflow: hidden;
  border: 1px solid var(--app-border);
  border-radius: 10px;
  background: var(--app-surface);
  box-shadow: var(--app-shadow);
}

.faq-item:first-of-type {
  border-top: 1px solid var(--app-border);
}

.faq-item summary {
  cursor: pointer;
  color: var(--app-text);
  font-weight: 800;
  list-style: none;
  padding: 14px 16px;
}

.faq-item summary::after {
  content: '+';
  float: right;
  color: var(--app-primary);
  font-size: 18px;
  line-height: 1;
}

.faq-item[open] summary {
  background: var(--app-surface-soft);
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
  color: var(--app-text);
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

  .abas-ajuda {
    gap: 8px;
  }

  .resultado-busca {
    white-space: normal;
  }
}

@media (max-width: 480px) {
  .abas-ajuda {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 8px;
    padding: 5px;
  }

  .aba-ajuda {
    min-height: 46px;
    padding: 10px 12px;
    font-size: 13px;
    line-height: 1.2;
  }

  .cabecalho-pagina h1 {
    font-size: 24px;
    line-height: 1.12;
  }

  .topico-cabecalho h2 {
    font-size: 21px;
    line-height: 1.15;
  }

  .ferramentas-ajuda,
  .historico-atualizacoes,
  .topico-detalhe,
  .novidades-cabecalho {
    padding: 14px;
  }

  .resumo-item {
    padding: 14px;
  }

  .resumo-item strong {
    font-size: 24px;
  }

  .topico-item {
    padding: 12px;
  }

  .topico-item strong {
    font-size: 14px;
  }

  .botao-tela,
  .selo-topico {
    width: auto;
    max-width: 100%;
  }

  .topico-cabecalho {
    gap: 10px;
  }

  .acoes-topico {
    width: 100%;
  }

  .botao-voltar-topicos {
    width: auto;
    align-self: flex-start;
  }

  .botao-voltar-topicos-vazio {
    justify-self: start;
    width: auto;
  }
}
</style>
