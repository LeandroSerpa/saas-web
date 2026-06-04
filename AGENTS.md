# AGENTS.md

Regras permanentes para o Codex neste repositório frontend NuvemMais Gestão / MicroSaaS.

## Regras gerais

- Nunca fazer `commit` ou `push` sem autorização explícita.
- Nunca alterar produção diretamente.
- Preservar a separação entre local, HML e produção por variáveis de ambiente.
- Não fixar versão, ambiente, URLs ou datas no código se isso puder vir de configuração ou API.
- Trabalhar por padrão na branch `homolog`.

## Rotas públicas

- Sempre preservar as rotas públicas sem login:
  - `/agendar/:slug`
  - `/cadastro`
  - `/catalogo/:slug`
  - `/cardapio/:slug`
- Catálogo público deve funcionar sem autenticação.

## Área logada e navegação

- Não quebrar Login, Dashboard, Agenda, Clientes, Serviços, Funcionários, Usuários, Estoque, Catálogo Público, Estoque do Dia, Lixeira Global, Ajuda, Menu e Versionamento.
- Menu mobile deve continuar funcionando como drawer.
- ADMIN comum não deve ver Administração SaaS.
- SUPER_ADMIN deve ver Administração SaaS.

## UX e conteúdo

- Não criar carrinho, pedido, pagamento ou checkout sem solicitação explícita.
- Manter textos em português claro e amigável.
- Evitar IDs técnicos visíveis ao usuário quando houver nome ou descrição.

## Validação

- Sempre rodar `npm.cmd run build`.
- Warning de chunk grande do Vite não bloqueia se o build passar.

## Encerramento de tarefas

- Ao final de qualquer tarefa, relatar arquivos alterados, telas afetadas, build executado e riscos de teste.
- Não fazer `commit` nem `push`.
