# Smoke Test Frontend (Pré-lançamento)

## Objetivo
Validar os fluxos essenciais do frontend antes do lançamento, com foco em autenticação, proteção de rotas e mensagens amigáveis.

## Pré-requisitos
- Backend disponível e configurado em `VITE_API_URL`
- Build local sem erros
- Usuários de teste:
  - `ADMIN` comum
  - `SUPER_ADMIN`
  - usuário pendente de aprovação

## Cenários

### 1. Login válido
1. Acessar `/login`
2. Informar credenciais válidas
3. Confirmar redirecionamento para `/dashboard`

Resultado esperado:
- Login concluído sem erro técnico
- Dashboard carregado

### 2. Login inválido
1. Acessar `/login`
2. Informar senha inválida
3. Enviar formulário

Resultado esperado:
- Mensagem amigável de falha de login
- Sem stacktrace/erro cru na tela

### 3. Cadastro público
1. Acessar `/cadastro`
2. Preencher dados obrigatórios
3. Concluir envio

Resultado esperado:
- Fluxo finaliza sem quebra visual
- Mensagens de validação amigáveis quando houver erro de preenchimento

### 4. Aceite de termos
1. Acessar `/cadastro`
2. Tentar enviar sem aceitar Termos/Privacidade
3. Aceitar e reenviar

Resultado esperado:
- Sem aceite: bloqueia envio com mensagem clara
- Com aceite: envio permitido

### 5. Login pendente
1. Fazer login com usuário de empresa pendente

Resultado esperado:
- Redirecionamento para `/cadastro-pendente`
- Usuário pendente não acessa dashboard direto
- Opção de sair disponível

### 6. Acesso ADMIN comum
1. Login com `ADMIN` comum
2. Navegar no menu
3. Tentar abrir rota de superadmin diretamente (ex.: `/admin-dashboard`)

Resultado esperado:
- Não exibe seção Administração SaaS no menu
- Acesso direto bloqueado com tela amigável (`/acesso-negado`)

### 7. Acesso SUPER_ADMIN
1. Login com `SUPER_ADMIN`
2. Acessar áreas administrativas

Resultado esperado:
- Menu de Administração SaaS visível
- Rotas administrativas carregam normalmente

### 8. Rota inexistente
1. Acessar uma URL inválida (ex.: `/rota-que-nao-existe`)

Resultado esperado:
- Exibe tela amigável de rota inexistente
- Sem tela branca

### 9. Acesso negado
1. Com usuário sem permissão, acessar rota protegida de nível superior

Resultado esperado:
- Exibe mensagem amigável de acesso negado
- Sem detalhes técnicos

### 10. Link público de agendamento
1. Acessar `/agendar/:slug` válido
2. Validar carregamento da página pública
3. Simular indisponibilidade de horários/data

Resultado esperado:
- Página pública acessível sem login
- Mensagens amigáveis para indisponibilidade e validações

## Mensagens esperadas (padrão amigável)
- Sessão expirada: "Sessão expirada. Faça login novamente."
- Acesso negado: "Acesso negado. Você não tem permissão para acessar esta área."
- Rota inexistente: tela de página não encontrada
- Rede/API fora do ar: mensagem de conexão indisponível
- Erro inesperado de carregamento: mensagem genérica amigável sem detalhes técnicos
- Validação de formulário: mensagens objetivas por campo
