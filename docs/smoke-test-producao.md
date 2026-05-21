# Smoke test manual de produção - Gestão SaaS

Roteiro de validação final do frontend antes do lançamento. Execute em ambiente apontando para as URLs configuradas por `VITE_API_URL` e `VITE_PUBLIC_APP_URL`, sem alterar domínio definitivo durante o teste.

## Pré-requisitos

- Credenciais válidas para `SUPER_ADMIN`, `ADMIN` de empresa aprovada e usuário com senha temporária.
- Pelo menos uma empresa aprovada com serviços, funcionários, disponibilidade e slug público configurados.
- Pelo menos um plano ativo, uma assinatura ativa e dados financeiros suficientes para validar faturas, recorrências e inadimplência.
- Navegador com cache limpo ou janela anônima para validar login, redirecionamentos e rotas negadas.

## Checklist

| # | Item | Perfil necessário | Rota | O que testar | Resultado esperado |
|---|---|---|---|---|---|
| 1 | Login SUPER_ADMIN | SUPER_ADMIN | `/login` | Entrar com credenciais de super administrador e navegar pelo menu Administração SaaS. | Login concluído, redirecionamento para área autenticada e menus SaaS visíveis. |
| 2 | Login ADMIN | ADMIN | `/login` | Entrar com credenciais de administrador de empresa aprovada. | Login concluído, menu da empresa visível e itens exclusivos de SUPER_ADMIN ocultos. |
| 3 | Login de usuário com senha temporária | Usuário com `trocaSenhaObrigatoria` | `/login` e `/alterar-senha` | Entrar com senha temporária, trocar a senha e tentar acessar o sistema. | Usuário é redirecionado para alteração de senha, consegue salvar nova senha e passa a acessar as rotas permitidas. |
| 4 | Cadastro público de empresa | Público | `/cadastro` | Preencher dados da empresa, responsável, segmento/plano quando disponíveis e enviar solicitação. | Solicitação enviada com mensagem de sucesso ou orientação de pendência, sem exigir autenticação. |
| 5 | Aprovação de solicitação pelo SUPER_ADMIN | SUPER_ADMIN | `/solicitacoes` ou `/admin/solicitacoes` | Abrir solicitação pendente, revisar detalhes, aprovar informando plano, admin e senha temporária quando necessário. | Empresa, assinatura e usuário admin são criados; dados de acesso ficam disponíveis para cópia quando retornados. |
| 6 | Novo cadastro guiado administrativo | SUPER_ADMIN | `/admin/empresas/onboarding` | Criar empresa diretamente pelo fluxo guiado, validar campos obrigatórios, slug, plano e dados do admin. | Empresa criada com sucesso, resumo exibido e link público montado com `VITE_PUBLIC_APP_URL`. |
| 7 | Empresas | SUPER_ADMIN | `/empresas` ou `/admin/empresas` | Listar, filtrar, editar dados básicos e ativar/desativar empresa. | Lista carrega, filtros funcionam e ações exibem feedback sem quebrar a tela. |
| 8 | Planos | SUPER_ADMIN | `/planos` ou `/admin/planos` | Criar/editar plano, validar limites, recursos e ativação/desativação. | Plano salvo e refletido na listagem com status correto. |
| 9 | Assinaturas | SUPER_ADMIN | `/assinaturas` ou `/admin/assinaturas` | Buscar empresas, visualizar assinatura e alterar plano/status quando aplicável. | Assinatura é carregada por empresa e alterações permitidas são persistidas. |
| 10 | Inadimplência | SUPER_ADMIN | `/admin/financeiro`, `/admin/inadimplencia` ou `/inadimplencia` | Consultar painel financeiro, filtros e ações de cobrança/status. | Indicadores e tabelas carregam; empresas inadimplentes aparecem conforme dados da API. |
| 11 | Faturas | ADMIN | `/faturas` | Listar faturas da empresa, filtrar e abrir detalhes/ações disponíveis. | Faturas da empresa logada aparecem; ações respeitam o status financeiro. |
| 12 | Faturas recorrentes | SUPER_ADMIN | `/faturas-recorrentes` ou `/admin/faturas-recorrentes` | Criar/editar recorrência, gerar fatura quando disponível e filtrar por empresa/status. | Recorrência salva e faturas geradas/visualizadas conforme regras existentes. |
| 13 | Configuração de pagamento | SUPER_ADMIN | `/configuracoes-pagamento` ou `/admin/config-pagamento` | Revisar dados de pagamento, chaves/instruções e salvar alterações permitidas. | Configurações carregam e salvam sem alterar endpoints ou domínio. |
| 14 | Auditoria | SUPER_ADMIN | `/auditoria` ou `/admin/auditoria` | Filtrar logs, abrir detalhes e validar dados de usuário/ação/data. | Eventos aparecem com filtros funcionais e detalhes legíveis. |
| 15 | Lixeira | SUPER_ADMIN | `/lixeira` ou `/admin/lixeira` | Listar agendamentos/notificações excluídos e restaurar item de teste, se houver. | Itens excluídos aparecem e restauração permitida retorna feedback de sucesso. |
| 16 | Minha empresa | ADMIN | `/minha-empresa` | Visualizar e editar dados da empresa, incluindo dados públicos quando exibidos. | Dados carregam, salvam e continuam coerentes após recarregar. |
| 17 | Serviços | ADMIN ou usuário permitido | `/servicos` | Criar/editar serviço, filtrar listagem, ativar/desativar e validar campos obrigatórios. | Serviço aparece na lista e fica disponível para vínculos/agendamento conforme status. |
| 18 | Funcionários | ADMIN ou usuário permitido | `/funcionarios` | Criar/editar funcionário, configurar disponibilidade básica e vínculos com serviços. | Funcionário salvo, status correto e vínculos refletidos nos fluxos dependentes. |
| 19 | Disponibilidade | ADMIN | `/disponibilidade` | Criar/editar indisponibilidade, filtrar por período/funcionário e excluir item de teste. | Bloqueios aparecem no calendário/listagem e afetam horários públicos quando aplicável. |
| 20 | Agendamento público | Público | `/agendar/:slug` | Abrir link público, escolher serviço, funcionário/data/horário e concluir agendamento. | Página carrega sem login, horários disponíveis aparecem e agendamento é criado com confirmação. |
| 21 | Primeiros passos | ADMIN | `/onboarding` | Validar cards/etapas de configuração inicial da empresa. | Etapas aparecem com progresso coerente e links levam às telas corretas. |
| 22 | Relatórios | ADMIN | `/relatorios` | Aplicar filtros, conferir indicadores, rankings, tabela detalhada e exportação CSV. | Dados carregam, filtros atualizam resultados e CSV é baixado quando permitido. |
| 23 | Notificações da empresa | ADMIN | `/minha-empresa/notificacoes` | Ativar/desativar preferências de notificações internas, lembretes e financeiras. | Preferências carregam e salvam mantendo estado após recarregar. |
| 24 | Notificações SaaS | SUPER_ADMIN | `/admin/notificacoes` | Listar notificações, marcar como lida, arquivar/restaurar e revisar templates/logs se disponíveis. | Ações exibem feedback e listas são atualizadas sem erro visual. |
| 25 | Automações | SUPER_ADMIN | `/admin/automacoes` | Consultar automações disponíveis, execuções e executar automação de teste quando seguro. | Resumo e histórico carregam; execução manual retorna status sem travar a interface. |
| 26 | Alterar senha | Usuário autenticado | `/alterar-senha` | Trocar senha usando senha atual válida e validar mensagens para erro/sucesso. | Senha alterada com sucesso; erros de validação aparecem de forma clara. |
| 27 | Rotas negadas/acesso sem permissão | ADMIN ou usuário sem permissão | Rotas SUPER_ADMIN, por exemplo `/admin/auditoria` | Acessar rota fora do perfil e tentar rota protegida sem token. | Usuário sem permissão vai para `/acesso-negado`; usuário sem token vai para `/login`. |
| 28 | Usuário pendente de aprovação | Usuário com empresa `PENDENTE` | `/cadastro-pendente` | Entrar com usuário de empresa pendente e tentar acessar rotas autenticadas. | Usuário é mantido na tela de pendência e não acessa áreas internas até aprovação. |

## Pendências esperadas do smoke manual

- Confirmar credenciais e massa de dados reais do ambiente de produção/homologação.
- Validar envio real de notificações e automações somente quando for seguro disparar mensagens.
- Conferir integrações financeiras com dados controlados para não gerar cobranças indevidas.
- Registrar evidências de aprovação, agendamento público e alteração de senha com data/hora do teste.
