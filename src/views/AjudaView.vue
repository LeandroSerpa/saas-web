<script setup>
import { computed, nextTick, onBeforeUnmount, onMounted, ref, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import SystemVersionPanel from '@/components/SystemVersionPanel.vue'
import { formatarDataPtBrSemFuso } from '@/utils/datas'

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
    pergunta: 'Como alterno entre Modo Essencial e Modo Completo?',
    resposta:
      'Use o seletor de modo no topo da tela. O Modo Essencial deixa o menu mais simples. O Modo Completo libera todas as Ã¡reas permitidas para o seu perfil.',
  },
  {
    pergunta: 'Como troco o tema da tela?',
    resposta:
      'Use o seletor de tema no topo da tela e escolha Claro, Escuro ou NuvemMais. A mudanÃ§a Ã© rÃ¡pida e ajuda a leitura no dia a dia.',
  },
  {
    pergunta: 'Como altero minha senha?',
    resposta:
      'Entre em Alterar senha, informe a senha atual e a nova senha. Depois confirme para atualizar o acesso.',
  },
  {
    pergunta: 'Como controlo meu estoque?',
    resposta:
      'Entre em Estoque, cadastre seus produtos, informe a quantidade atual e o estoque mÃ­nimo. Depois use Entrada, SaÃ­da ou Ajuste para manter as quantidades atualizadas.',
  },
  {
    pergunta: 'Como funciona o catalogo publico?',
    resposta:
      'O catÃ¡logo pÃºblico e o cardÃ¡pio funcionam como uma vitrine simples dos produtos da empresa. O cliente vÃª o que estÃ¡ disponÃ­vel e fala com vocÃª pelo botÃ£o de WhatsApp, sem carrinho, pedido, checkout ou pagamento.',
  },
  {
    pergunta: 'Como funciona o estoque do dia?',
    resposta:
      'O estoque do dia foi pensado para doces, lanches, cupcakes, marmitas e produtos artesanais. A empresa prepara a quantidade do dia, atualiza esse saldo no Estoque do dia e o cliente acompanha a disponibilidade no catÃ¡logo pÃºblico ou cardÃ¡pio. Nesta fase, a venda continua pelo WhatsApp, sem pedido, carrinho ou pagamento online.',
  },
  {
    pergunta: 'Qual a diferenÃ§a entre Desativar e Excluir?',
    resposta:
      'Desativar mantÃ©m o cadastro no sistema, mas tira o registro do uso operacional. Excluir envia o registro para a lixeira, onde ele pode ser restaurado por quem tem permissÃ£o.',
  },
  {
    pergunta: 'O que acontece ao excluir definitivamente um registro?',
    resposta:
      'Excluir definitivamente remove o registro da lixeira de forma irreversÃ­vel, preservando auditoria e a integridade dos dados. Essa aÃ§Ã£o nÃ£o pode ser desfeita.',
  },
  {
    pergunta: 'As aÃ§Ãµes de exclusÃ£o ficam registradas?',
    resposta:
      'Sim. ExclusÃµes, restauraÃ§Ãµes e exclusÃµes definitivas ficam registradas em auditoria/log para acompanhamento administrativo.',
  },
  {
    pergunta: 'Onde encontro o link pÃºblico da minha empresa?',
    resposta:
      'O link pÃºblico fica na Ã¡rea Minha empresa. Ali vocÃª pode consultar, copiar e usar o endereÃ§o que seus clientes acessam para agendar.',
  },
  {
    pergunta: 'Como acompanho as empresas da plataforma?',
    resposta:
      'Entre no Dashboard NuvemMais e use a seleÃ§Ã£o de empresa para visualizar os principais dados operacionais.',
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
    id: 'modo-temas',
    titulo: 'Modo Essencial e aparÃªncia',
    resumo: 'Como simplificar o menu e mudar o visual da tela.',
    palavrasChave: ['modo essencial', 'modo completo', 'tema', 'aparÃªncia', 'claro', 'escuro', 'nuvemmais'],
    introducao:
      'O Modo Essencial deixa a navegaÃ§Ã£o mais simples, ideal para o uso do dia a dia. O Modo Completo libera todas as Ã¡reas permitidas para o seu perfil. No topo da tela, vocÃª tambÃ©m pode trocar o tema para deixar a leitura mais confortÃ¡vel.',
    pontos: [
      'Use o Modo Essencial quando quiser focar sÃ³ no que Ã© mais importante.',
      'Use o Modo Completo quando precisar acessar todos os recursos permitidos.',
      'Troque o tema entre Claro, Escuro e NuvemMais conforme a sua preferÃªncia.',
      'O visual muda sem alterar seus dados, permissÃµes ou rotas pÃºblicas.',
    ],
    destaque: 'Bom para deixar o sistema mais leve para quem prefere poucos atalhos e leitura simples.',
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
    resumo: 'Cadastro de produtos, controle de quantidades e alertas de reposiÃ§Ã£o.',
    palavrasChave: ['estoque', 'produtos', 'entrada', 'saÃ­da', 'ajuste', 'baixo estoque'],
    introducao:
      'Na tela de Estoque vocÃª cadastra produtos, acompanha as quantidades disponÃ­veis e registra cada movimentaÃ§Ã£o para manter o saldo atualizado.',
    pontos: [
      'Cadastre produtos com nome, categoria, cÃ³digo, unidade, preÃ§os e estoque mÃ­nimo.',
      'Use Entrada para somar quantidade, SaÃ­da para registrar consumo ou venda e Ajuste para definir um novo saldo final.',
      'Acompanhe os alertas de baixo estoque para saber quando um produto precisa de reposiÃ§Ã£o.',
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
      'O Dashboard NuvemMais ajuda o SUPER_ADMIN a acompanhar a saÃºde geral da plataforma e visualizar os principais dados operacionais de cada empresa sem trocar de login.',
    pontos: [
      'Use a visÃ£o geral para acompanhar empresas, usuÃ¡rios, agenda, receitas e alertas importantes.',
      'Na seleÃ§Ã£o de empresa, escolha uma empresa para visualizar os dados operacionais dela como acompanhamento administrativo.',
      'Essa visualizaÃ§Ã£o serve para consulta e apoio, sem aÃ§Ãµes perigosas em massa nesta primeira fase.',
    ],
    destaque: 'Muito Ãºtil para acompanhar o movimento das empresas de forma centralizada.',
    rota: '/admin-dashboard',
  },
  {
    id: 'link-publico',
    titulo: 'Link pÃºblico de agendamento',
    resumo: 'Canal para o cliente final agendar sozinho pela pÃ¡gina pÃºblica.',
    palavrasChave: ['link', 'agendamento pÃºblico', 'cliente final', 'pÃ¡gina pÃºblica'],
    introducao:
      'O link pÃºblico permite que o cliente final marque um horÃ¡rio sozinho, sem precisar entrar em contato direto com a empresa para cada agendamento.',
    pontos: [
      'Compartilhe o link pÃºblico com seus clientes em mensagens, redes sociais ou site.',
      'O cliente escolhe serviÃ§o e horÃ¡rio disponÃ­vel na pÃ¡gina da empresa.',
      'Os agendamentos recebidos passam a fazer parte da rotina de acompanhamento no sistema.',
    ],
    destaque: 'Ã“timo para facilitar o autoatendimento e ganhar agilidade.',
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
    id: 'lixeira-global',
    titulo: 'Lixeira Global',
    resumo: 'RestauraÃ§Ã£o e exclusÃ£o definitiva de registros removidos logicamente.',
    palavrasChave: ['lixeira', 'excluir', 'restaurar', 'exclusÃ£o definitiva', 'auditoria', 'logs'],
    introducao:
      'A Lixeira Global reÃºne registros enviados para a lixeira nos cadastros principais, como clientes, serviÃ§os, funcionÃ¡rios, usuÃ¡rios e produtos de estoque.',
    pontos: [
      'Excluir envia o registro para a lixeira e permite restauraÃ§Ã£o posterior por quem tem permissÃ£o.',
      'Desativar apenas bloqueia o uso operacional do cadastro, sem enviar o registro para a lixeira.',
      'Excluir definitivamente Ã© irreversÃ­vel e deve ser usado apenas quando nÃ£o houver necessidade de recuperaÃ§Ã£o, preservando auditoria e integridade dos dados.',
      'As aÃ§Ãµes de exclusÃ£o, restauraÃ§Ã£o e exclusÃ£o definitiva ficam registradas em auditoria/log.',
    ],
    destaque: 'Use essa Ã¡rea para recuperar registros removidos por engano ou concluir exclusÃµes permanentes com cuidado.',
    rota: '/lixeira',
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

const ALIAS_TOPICO_POR_QUERY = {
  'faturas-meu-plano': 'faturas-plano',
}

const conteudoDetalhadoPorTopico = {
  comecando: [
    '1. Entre no sistema com seu login e sua senha.',
    '2. Veja o menu lateral e escolha a tela que quer usar.',
    '3. Comece cadastrando clientes, serviÃ§os e funcionÃ¡rios.',
    '4. Depois confira a agenda, o estoque e o link pÃºblico.',
    '5. Se errar, volte para a Ajuda e leia o tÃ³pico de novo com calma.',
  ],
  'modo-temas': [
    '1. Use o seletor de modo no topo da tela.',
    '2. Escolha Modo Essencial para ver menos opÃ§Ãµes e ficar mais simples.',
    '3. Escolha Modo Completo quando quiser ver todas as Ã¡reas permitidas.',
    '4. No mesmo topo, troque o tema entre Claro, Escuro e NuvemMais.',
    '5. Confira se a tela ficou mais fÃ¡cil de ler para vocÃª.',
  ],
  dashboard: [
    '1. Entre no Dashboard logo ao abrir o sistema.',
    '2. Olhe os nÃºmeros principais para entender como estÃ¡ o dia.',
    '3. Veja os agendamentos e avisos mais importantes sem sair da tela.',
    '4. Use os blocos resumidos para achar o que precisa com rapidez.',
    '5. Se quiser se aprofundar, abra as telas especÃ­ficas pela lateral.',
  ],
  agenda: [
    '1. Entre na Agenda para ver os horÃ¡rios marcados.',
    '2. Clique para criar um novo agendamento.',
    '3. Preencha cliente, serviÃ§o, funcionÃ¡rio, data e hora.',
    '4. Salve o agendamento e confira se ele apareceu na lista.',
    '5. Use os filtros para localizar marcaÃ§Ãµes por status ou origem.',
  ],
  clientes: [
    '1. Entre em Clientes para ver o cadastro das pessoas atendidas.',
    '2. Clique em Novo cliente quando precisar incluir alguÃ©m.',
    '3. Preencha nome, contato e os dados que a empresa usa no dia a dia.',
    '4. Salve e confira se a pessoa apareceu na lista.',
    '5. Quando for marcar um horÃ¡rio, procure o cliente jÃ¡ cadastrado.',
  ],
  servicos: [
    '1. Entre em ServiÃ§os para cadastrar o que a empresa oferece.',
    '2. Clique em Novo serviÃ§o para abrir o formulÃ¡rio.',
    '3. Preencha nome, preÃ§o, duraÃ§Ã£o e descriÃ§Ã£o simples.',
    '4. Marque o serviÃ§o como ativo para ele poder ser usado.',
    '5. Salve e confira se ele apareceu entre os serviÃ§os cadastrados.',
  ],
  funcionarios: [
    '1. Entre em FuncionÃ¡rios para organizar quem atende na empresa.',
    '2. Clique em Novo funcionÃ¡rio para iniciar o cadastro.',
    '3. Preencha nome, contato e as informaÃ§Ãµes que a sua empresa usa.',
    '4. Ajuste dias e horÃ¡rios de atendimento quando essa opÃ§Ã£o estiver disponÃ­vel.',
    '5. Salve e confira se o profissional apareceu na lista.',
  ],
  disponibilidade: [
    '1. Entre em Disponibilidade para bloquear horÃ¡rios que nÃ£o podem ser usados.',
    '2. Clique em Novo bloqueio ou em uma aÃ§Ã£o parecida da tela.',
    '3. Escolha quem ou o que nÃ£o poderÃ¡ atender naquele perÃ­odo.',
    '4. Informe a data e o horÃ¡rio com cuidado.',
    '5. Salve e confira se o bloqueio apareceu na lista.',
  ],
  estoque: [
    '1. Entre em Estoque para ver seus produtos.',
    '2. Clique em Novo produto quando quiser cadastrar um item.',
    '3. Preencha nome, categoria, unidade, preÃ§o e quantidade inicial.',
    '4. Use Entrada, SaÃ­da ou Ajuste para mudar o saldo.',
    '5. Confira o alerta de baixo estoque para nÃ£o faltar produto.',
  ],
  'estoque-do-dia': [
    '1. Entre na Ã¡rea de Estoque do dia quando quiser atualizar a quantidade disponÃ­vel para hoje.',
    '2. Escolha os produtos que vÃ£o participar da venda do dia.',
    '3. Informe quantas unidades estÃ£o prontas para vender.',
    '4. Diminua o saldo quando os itens forem saindo.',
    '5. Confira se o catÃ¡logo pÃºblico estÃ¡ mostrando o que ainda existe.',
  ],
  'catalogo-publico': [
    '1. Entre na Ã¡rea de catÃ¡logo ou vitrine da empresa.',
    '2. Marque os produtos que devem aparecer para o cliente.',
    '3. Ajuste imagem, descriÃ§Ã£o, preÃ§o e texto do botÃ£o, se quiser.',
    '4. Atualize o Estoque do dia para mostrar o que estÃ¡ disponÃ­vel.',
    '5. Copie o link pÃºblico e veja a tela como o cliente verÃ¡.',
  ],
  'dashboard-nuvemmais': [
    '1. Entre no Dashboard NuvemMais com perfil de administraÃ§Ã£o.',
    '2. Escolha uma empresa para acompanhar os dados dela.',
    '3. Veja os nÃºmeros principais sem trocar de login.',
    '4. Use a visÃ£o geral para orientar suporte e conferÃªncia.',
    '5. Volte para a empresa seguinte quando terminar a anÃ¡lise.',
  ],
  'link-publico': [
    '1. Copie o link pÃºblico de agendamento da empresa.',
    '2. Envie esse link para o cliente por mensagem, site ou rede social.',
    '3. PeÃ§a para a pessoa escolher o serviÃ§o e o horÃ¡rio livre.',
    '4. Confira se o agendamento entrou na agenda da empresa.',
    '5. Use o link sempre que quiser facilitar o autoatendimento.',
  ],
  notificacoes: [
    '1. Toque no sino no topo da tela quando aparecer um aviso.',
    '2. Abra a tela de NotificaÃ§Ãµes para ler com calma.',
    '3. Veja os lembretes e os avisos de agendamentos novos.',
    '4. Marque como lido ou revise depois, conforme a tela permitir.',
    '5. Volte sempre que quiser conferir o que mudou no sistema.',
  ],
  relatorios: [
    '1. Entre em RelatÃ³rios para ver os resultados da empresa.',
    '2. Escolha o perÃ­odo que quer analisar.',
    '3. Confira os nÃºmeros de agendamentos, serviÃ§os e funcionÃ¡rios.',
    '4. Use os grÃ¡ficos e as listas para entender melhor o movimento.',
    '5. Baixe ou copie os dados quando precisar mostrar para outra pessoa.',
  ],
  'minha-empresa': [
    '1. Entre em Minha empresa para rever os dados principais do negÃ³cio.',
    '2. Confira nome, contato, endereÃ§o e horÃ¡rio de funcionamento.',
    '3. Ajuste as informaÃ§Ãµes que o cliente precisa enxergar com clareza.',
    '4. Salve as mudanÃ§as e confira se o link pÃºblico continua correto.',
    '5. Volte aqui sempre que algum dado da empresa mudar.',
  ],
  personalizacao: [
    '1. Entre em PersonalizaÃ§Ã£o para cuidar da pÃ¡gina pÃºblica.',
    '2. Escolha cores, textos e orientaÃ§Ãµes simples para o cliente.',
    '3. Preencha as mensagens importantes com palavras fÃ¡ceis de entender.',
    '4. Salve e confira a prÃ©via da pÃ¡gina pÃºblica.',
    '5. Ajuste de novo se quiser deixar a apresentaÃ§Ã£o mais bonita.',
  ],
  usuarios: [
    '1. Entre em UsuÃ¡rios para ver quem pode acessar o sistema.',
    '2. Clique em Novo usuÃ¡rio quando precisar liberar um acesso.',
    '3. Preencha nome, login e os dados pedidos pela tela.',
    '4. Salve e confira se a pessoa apareceu na lista de usuÃ¡rios.',
    '5. Revise os acessos quando alguÃ©m entrar ou sair da empresa.',
  ],
  'lixeira-global': [
    '1. Entre na Lixeira Global quando precisar recuperar um registro.',
    '2. Procure o item que foi enviado para a lixeira.',
    '3. Escolha Restaurar se o cadastro ainda for Ãºtil.',
    '4. Use exclusÃ£o definitiva sÃ³ quando tiver certeza de que nÃ£o precisa mais do dado.',
    '5. Confira a auditoria quando quiser saber o que foi feito.',
  ],
  'minha-conta': [
    '1. Entre em Minha conta para atualizar seus dados pessoais.',
    '2. Confira nome, e-mail e login.',
    '3. Ajuste o que estiver desatualizado com cuidado.',
    '4. Salve e teste o acesso novamente, se necessÃ¡rio.',
    '5. Volte aqui sempre que mudar seu contato ou seu nome de uso.',
  ],
  'alterar-senha': [
    '1. Entre em Alterar senha quando quiser trocar seu acesso.',
    '2. Digite a senha atual no primeiro campo.',
    '3. Escreva a nova senha nos campos seguintes.',
    '4. Confirme a troca e aguarde a mensagem de sucesso.',
    '5. Use a nova senha no prÃ³ximo login.',
  ],
  'faturas-plano': [
    '1. Entre em Meu plano ou Faturas para ver a situaÃ§Ã£o da assinatura.',
    '2. Confira o nome do plano e o que ele libera para a empresa.',
    '3. Veja se existe alguma fatura em aberto ou vencida.',
    '4. FaÃ§a a conferÃªncia antes de pedir ajuda para o financeiro.',
    '5. Use essa Ã¡rea para manter a assinatura em dia.',
  ],
  'perguntas-frequentes': [
    '1. Leia a pergunta que mais parece com a sua dÃºvida.',
    '2. Abra a resposta para ver a orientaÃ§Ã£o completa.',
    '3. Use a busca da Ajuda se quiser achar um tema mais rÃ¡pido.',
    '4. Volte para os tÃ³picos quando precisar ver uma tela especÃ­fica.',
    '5. Se ainda ficar em dÃºvida, siga o passo a passo do tÃ³pico relacionado.',
  ],
}

const historicoAtualizacoes = [
  {
    versao: '1.3.0',
    dataPublicacao: '2026-06-14',
    itens: [
      'Gestão Esportiva para diferentes modalidades.',
      'Turmas, profissionais, participantes e mensalidades.',
      'Planos apresentados de forma mais clara.',
      'Melhorias no modo operacional do SUPER_ADMIN.',
      'Correções no uso do plano por empresa.',
      'Melhorias visuais e mensagens de validação.',
    ],
  },
  {
    versao: '1.2.1',
    dataPublicacao: '2026-06-06',
    itens: [
      'Planos comerciais NuvemMais Vitrine, Agenda e Completo.',
      'Bloco pÃºblico â€œQuer ter uma pÃ¡gina como esta?â€ com CTA para cadastro e planos em nova aba.',
      'Melhorias visuais no catÃ¡logo e cardÃ¡pio pÃºblico.',
      'Ajustes no Estoque, Estoque do dia e CatÃ¡logo pÃºblico interno.',
      'Open Graph dinÃ¢mico para compartilhamento por cliente no WhatsApp.',
      'Fallback NuvemMais para links do site principal.',
    ],
  },
  {
    versao: '1.2.0-hml',
    dataPublicacao: '2026-06-04',
    itens: [
      'Modo Essencial para navegaÃ§Ã£o simplificada.',
      'Modo Completo para acesso a todos os recursos.',
      'Temas Claro, Escuro e NuvemMais.',
      'Central de Ajuda com modo Resumo e passo a passo.',
      'Links "Ajuda desta tela" nas principais telas do sistema.',
      'Dashboard Essencial com aÃ§Ãµes rÃ¡pidas.',
      'CatÃ¡logo pÃºblico/CardÃ¡pio com vitrine de produtos.',
      'Estoque do dia integrado ao catÃ¡logo.',
      'Melhorias visuais no menu, topo, cards, botÃµes e formulÃ¡rios.',
    ],
  },
  {
    versao: '1.1.1',
    dataPublicacao: '2026-05-31',
    itens: [
      'Lixeira Global integrada aos cadastros principais.',
      'RestauraÃ§Ã£o de clientes, serviÃ§os, funcionÃ¡rios, usuÃ¡rios e produtos de estoque.',
      'ExclusÃ£o definitiva segura pela Lixeira Global.',
      'Cards/resumo da Lixeira Global corrigidos.',
      'Produtos de estoque integrados ao fluxo de lixeira.',
      'Auditoria/log nas aÃ§Ãµes de exclusÃ£o, restauraÃ§Ã£o e exclusÃ£o definitiva.',
      'VersÃ£o do menu lateral sincronizada com Ajuda.',
    ],
  },
]

const estatisticas = computed(() => [
  { rotulo: 'TÃ³picos principais', valor: topicos.length - 1 },
  { rotulo: 'Perguntas frequentes', valor: perguntasFrequentes.length },
  { rotulo: 'Busca rÃ¡pida', valor: 'DisponÃ­vel' },
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
  return formatarDataPtBrSemFuso(valor)
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
        <p class="descricao">Aprenda a usar as principais funcionalidades do NuvemMais GestÃ£o.</p>
      </div>
    </header>

    <nav class="abas-ajuda" role="tablist" aria-label="NavegaÃ§Ã£o interna da Ajuda">
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
        Novidades / VersÃ£o
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

      <section class="layout-ajuda">
        <aside v-show="!isViewportMobile || mostrarListaTopicos" id="lista-topicos-ajuda" class="lista-topicos" aria-label="TÃ³picos da central de ajuda">
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
          <article v-if="topicoAtivo" :id="`topico-${topicoAtivo.id}`" class="topico-detalhe">
            <header class="topico-cabecalho">
              <div>
                <p class="subtitulo">TÃ³pico selecionado</p>
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
                  Voltar aos tÃ³picos
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
              <div class="modo-detalhe-botoes" role="tablist" aria-label="NÃ­vel de detalhe da ajuda">
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
                {{ modoDetalhe === MODO_PASSO_A_PASSO ? 'Siga na ordem para nÃ£o se perder.' : 'Leia primeiro o resumo e use o passo a passo quando precisar de mais ajuda.' }}
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
            <h2>Nenhum tÃ³pico selecionado</h2>
            <p>Use a busca ou escolha um tÃ³pico na lista para visualizar as orientaÃ§Ãµes.</p>
            <button
              v-if="isViewportMobile && !mostrarListaTopicos"
              type="button"
              class="botao-voltar-topicos botao-voltar-topicos-vazio"
              aria-controls="lista-topicos-ajuda"
              @click="abrirListaTopicos"
            >
              Ver outros tÃ³picos
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
          <p class="subtitulo">VersÃ£o e mudanÃ§as</p>
          <h2>Novidades / VersÃ£o</h2>
          <p class="descricao-secao">
            Aqui ficam a versÃ£o atual, o histÃ³rico de atualizaÃ§Ãµes e os principais lanÃ§amentos da plataforma.
          </p>
        </div>
      </section>

      <SystemVersionPanel
        titulo="VersÃ£o do sistema"
        discreto
        :novidades-padrao="[]"
        :mostrar-novidades="false"
      />

      <section class="historico-atualizacoes" aria-label="HistÃ³rico de atualizaÃ§Ãµes">
        <header class="historico-cabecalho">
          <h3>HistÃ³rico de atualizaÃ§Ãµes</h3>
          <p>Novas versÃµes podem ser adicionadas aqui sem remover o histÃ³rico anterior.</p>
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
