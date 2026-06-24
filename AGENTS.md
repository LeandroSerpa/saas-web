# AGENTS.md

Regras permanentes para o Codex neste repositório frontend NuvemMais Gestão / MicroSaaS.

## 1. Regras gerais

- Trabalhar por padrão na branch `homolog`.
- Nunca fazer `commit` ou `push` sem autorização explícita.
- Nunca alterar produção diretamente.
- Preservar a separação entre local, HML e produção por variáveis de ambiente.
- Não fixar versão, ambiente, URLs, credenciais ou datas no código quando esses dados puderem vir de configuração, variável de ambiente ou API.
- Não expor senhas, tokens, credenciais ou dados sensíveis em código, logs, comentários ou respostas.
- Não alterar o arquivo `.env`, `.env.local` ou equivalentes sem solicitação explícita.
- Não adicionar arquivos de ambiente ao Git.
- Antes de editar, examinar a implementação existente e reutilizar padrões, componentes, serviços e utilitários já adotados pelo projeto.
- Fazer a menor alteração necessária para atender à tarefa.
- Não realizar refatorações amplas, renomeações em massa ou mudanças fora do escopo.
- Não alterar arquivos sem relação direta com a tarefa.
- Não adicionar bibliotecas ou dependências sem necessidade real.
- Caso uma nova dependência pareça necessária, relatar antes de instalá-la.
- Não modificar o backend a partir deste repositório.
- Quando houver dependência real do backend, parar e relatar claramente o que é necessário.
- Não editar este `AGENTS.md` sem solicitação explícita.

## 2. Tecnologias e estrutura

- Projeto frontend em Vue 3.
- Build realizado com Vite.
- Linguagem principal: JavaScript.
- Navegação com Vue Router.
- Integração com backend por serviço de API centralizado.
- Estilos próprios do projeto devem ser preservados.
- Reutilizar componentes existentes antes de criar novos componentes.
- Evitar duplicação de lógica entre telas.
- Preservar o padrão visual e responsivo existente.

## 3. Rotas públicas

Sempre preservar as rotas públicas sem login:

- `/agendar/:slug`
- `/cadastro`
- `/catalogo/:slug`
- `/cardapio/:slug`

Regras:

- Catálogo público deve funcionar sem autenticação.
- Cardápio público deve funcionar sem autenticação.
- Agendamento público deve funcionar sem autenticação.
- Cadastro público deve funcionar sem autenticação.
- Não aplicar guardas de autenticação às rotas públicas previstas.
- Não expor telas administrativas como rotas públicas.
- Não quebrar carregamento por acesso direto ou atualização do navegador nas rotas públicas.

## 4. Área logada e navegação

Não quebrar:

- Login
- Dashboard
- Agenda
- Clientes
- Serviços
- Funcionários
- Usuários
- Estoque
- Produtos
- Catálogo Público
- Estoque do Dia
- Lixeira Global
- Auditoria
- Ajuda
- Menu
- Versionamento
- Minha conta
- Minha empresa
- Meu plano
- Administração SaaS
- Gestão Esportiva

Regras:

- O menu mobile deve continuar funcionando como drawer.
- O menu desktop deve continuar funcionando normalmente.
- ADMIN comum não deve ver Administração SaaS.
- SUPER_ADMIN deve ver Administração SaaS.
- Rotas protegidas devem continuar usando o mecanismo de autenticação e autorização existente.
- Não considerar um menu oculto como proteção suficiente.
- A autorização efetiva também deve existir no backend.
- Não alterar o comportamento do SUPER_ADMIN sem solicitação explícita.
- Preservar o contexto de empresa usado pelo SUPER_ADMIN quando aplicável.
- Ao criar uma rota contextual, preservar a rota original enquanto ela ainda for utilizada por outros módulos.
- Evitar itens de menu duplicados quando a empresa possui combinação de módulos.
- Não implementar toda a arquitetura modular durante uma tarefa pequena, salvo solicitação explícita.

## 5. Arquitetura modular

O sistema deve suportar os módulos principais:

- Gestão Esportiva
- Agendamento
- Estoque

A navegação deve considerar:

1. módulos ativos da empresa;
2. recursos complementares ativos;
3. permissões do usuário;
4. contexto da empresa;
5. terminologia aplicável ao segmento.

Regras:

- Uma empresa deve visualizar somente os módulos e recursos contratados ou ativados.
- Ocultar menus não substitui autorização do backend.
- Combinações de módulos devem funcionar sem duplicação desnecessária.
- Preservar compatibilidade com empresas que ainda utilizam a navegação atual.
- Não fixar listas de módulos em vários arquivos quando elas puderem ser centralizadas.
- Novos itens de navegação devem ser compatíveis com um futuro registro central de menus.
- Recursos complementares, como catálogo público, personalização, relatórios ou notificações, devem aparecer apenas quando aplicáveis.
- Meu plano deve permanecer em Conta e sistema, e não dentro do Financeiro.
- Configurações comuns não devem ser duplicadas entre módulos.

## 6. Nomenclaturas contextuais

As entidades internas podem ser reaproveitadas, mas a apresentação deve respeitar o contexto.

### Funcionários, professores e profissionais

- Somente Gestão Esportiva: `Professores`.
- Somente Agendamento: `Funcionários` ou `Profissionais`.
- Gestão Esportiva com Agendamento: `Profissionais`.
- Reutilizar a entidade e APIs de Funcionários para professores.
- Não criar cadastro ou entidade duplicada de Professor.
- Quando uma tela for aberta no contexto esportivo, adaptar título, textos, estados vazios, botões e orientações.
- Preservar os textos genéricos de Funcionários quando a tela for aberta no contexto de Agendamento.

### Clientes e alunos

- Somente Gestão Esportiva: `Alunos`.
- Somente Agendamento: `Clientes`.
- Gestão Esportiva com Agendamento: `Clientes e alunos`.
- Não duplicar entidades sem necessidade técnica comprovada.

### Turmas e aulas

- Turma é uma configuração recorrente.
- Aula é uma ocorrência concreta em determinada data.
- Não apresentar os dois conceitos como se fossem a mesma coisa.

## 7. Gestão Esportiva

- Reutilizar estruturas existentes sempre que possível.
- Usar nomes técnicos genéricos para permitir outras modalidades esportivas no futuro.
- Não limitar nomes internos ao Beach Tennis quando a regra puder atender outras modalidades.
- Preservar a separação entre nível técnico e competição.
- Níveis técnicos:
  - Iniciante
  - Intermediário
  - Avançado

- Competição é uma característica independente do nível.
- Professor deve reutilizar Funcionário.
- Aluno deve manter seu histórico ao sair de uma turma.
- Frequência, ausência, justificativa, cancelamento e reposição devem estar ligados a uma aula concreta quando essa fase for implementada.
- Não implementar fases futuras durante uma tarefa atual sem solicitação explícita.

## 8. UX e conteúdo

- Não criar carrinho, pedido, pagamento ou checkout sem solicitação explícita.
- Manter textos em português claro, amigável e consistente.
- Antes de encerrar a tarefa, revisar:
  - ortografia;
  - acentuação;
  - concordância;
  - nomes de botões;
  - estados vazios;
  - mensagens de sucesso;
  - mensagens de erro;
  - títulos;
  - textos de ajuda.

- Evitar IDs técnicos visíveis quando houver nome ou descrição.
- Não exibir termos técnicos de backend ao usuário.
- Não exibir `null`, `undefined`, códigos internos ou mensagens brutas de exceção.
- Manter mensagens de erro compreensíveis.
- Preservar responsividade em desktop e mobile.
- Preservar acessibilidade básica:
  - labels associados aos campos;
  - botões identificáveis;
  - foco utilizável;
  - contraste legível;
  - ações não dependentes apenas de cor.

- Configurações avançadas devem ficar organizadas sem poluir a experiência principal.
- Não esconder campos importantes sem alternativa clara de acesso.
- Não alterar identidade visual global sem solicitação explícita.

## 9. Serviços e contratos de API

- Reutilizar o serviço de API centralizado.
- Não criar chamadas `fetch` isoladas se já existir abstração no projeto.
- Preservar contratos de API existentes.
- Não renomear campos recebidos do backend sem tratar compatibilidade.
- Não simular no frontend uma autorização que precisa existir no backend.
- Não inserir dados falsos ou mocks permanentes.
- Tratar carregamento, sucesso, vazio e erro de forma consistente.
- Não disparar chamadas duplicadas desnecessárias.
- Evitar recarregar listas completas quando uma atualização local segura for suficiente.
- Não armazenar dados sensíveis além do mecanismo já utilizado pelo projeto.

## 10. Eficiência e economia de contexto

- Ler primeiro o `AGENTS.md`.
- Examinar somente os arquivos relevantes para a tarefa antes de ampliar a busca.
- Usar busca por nomes de componentes, rotas, métodos ou textos relacionados ao pedido.
- Evitar ler ou reescrever o projeto inteiro sem necessidade.
- Não repetir análises já confirmadas pelo código.
- Fazer alterações pequenas e focadas.
- Não gerar documentação extensa sem solicitação.
- Não copiar grandes arquivos para a resposta final.
- Relatar somente o necessário para validar a tarefa.
- Quando encontrar algo fora do escopo, registrar como observação sem implementá-lo.
- Parar e pedir orientação somente quando houver risco real, ambiguidade relevante ou dependência externa.

## 11. Validação

- Sempre executar:

```powershell
npm.cmd run build
```

- Warning de chunk grande do Vite não bloqueia a tarefa se o build passar.
- Erros de compilação, importação, rota ou template devem ser corrigidos antes do encerramento.
- Quando a tarefa afetar navegação, verificar:
  - menu desktop;
  - menu mobile;
  - acesso direto à rota;
  - atualização do navegador;
  - ADMIN;
  - SUPER_ADMIN;
  - empresa com módulo;
  - empresa sem módulo, quando aplicável.

- Quando a tarefa afetar formulários, verificar:
  - criação;
  - edição;
  - cancelamento;
  - mensagens;
  - validações;
  - persistência após recarregar.

- Não declarar que algo foi testado manualmente se apenas o build foi executado.

## 12. Git

- Nunca fazer `commit` ou `push` sem autorização explícita.
- Não trocar de branch sem necessidade.
- Não alterar histórico do Git.
- Não executar `reset --hard`, `clean -fd`, `rebase`, `force push` ou comandos destrutivos.
- Não descartar alterações preexistentes do usuário.
- Ao encontrar alterações que não pertencem à tarefa, preservá-las.
- Não adicionar `.env`, `.env.local`, credenciais, arquivos temporários ou artefatos de build ao Git.

## 13. Encerramento das tarefas

Ao final de qualquer tarefa, informar de forma objetiva:

- resumo do que foi implementado;
- arquivos alterados;
- rotas criadas ou alteradas;
- telas afetadas;
- APIs consumidas ou alteradas;
- build executado;
- resultado do build;
- testes automáticos executados;
- testes manuais necessários;
- riscos ou pontos de atenção;
- dependência de backend, se existir;
- se está pronto para HML;
- se exige alguma configuração adicional.

Não fazer `commit` nem `push`.
