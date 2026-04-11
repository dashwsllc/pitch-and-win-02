# PITCH-AND-WIN-02 — Contexto Completo do Sistema

> Use este documento para contextualizar qualquer IA que for trabalhar neste projeto.

---

## 1. O QUE É

Sistema interno de **gestão de performance e comissões para um time de vendas** (empresa WS LTDA). Web app React implantado no Vercel, backend 100% Supabase.

Dois perfis de acesso:
- **Vendedor** — visualiza e registra suas próprias vendas, abordagens, comissões e metas
- **Executivo** — visão gerencial completa do time, aprova saques, gerencia usuários e sessões

Produtos vendáveis com valores fixos: R$ 2.997 / R$ 500 / R$ 275 / R$ 250  
(Mentoria Jogador De Elite, Mentoria Jogador Milionário)

---

## 2. STACK

| Camada | Tecnologia |
|--------|-----------|
| Framework | React 18 + TypeScript 5.8 |
| Build | Vite 5 |
| Roteamento | React Router 6 |
| UI | shadcn/ui (Radix UI) + Tailwind CSS 3.4 |
| Data fetching | TanStack Query (React Query) v5 |
| Forms | React Hook Form + Zod |
| Gráficos | Recharts |
| Backend/DB | Supabase (PostgreSQL + Auth + Storage) |
| Deploy | Vercel (`vercel.json` com SPA rewrite) |

---

## 3. BANCO DE DADOS

### Tabelas

| Tabela | Propósito |
|--------|-----------|
| `profiles` | Perfil do usuário: `display_name`, `avatar_url` |
| `vendas` | Registros de venda: produto, valor, comprador (nome/email/whatsapp) |
| `abordagens` | Abordagens comerciais: nomes, dados, tempo médio (min), `mostrou_ia` (bool), visão geral |
| `assinaturas` | Assinaturas de clientes: produto, valor, dados do cliente, status (`ativa`/`inativa`) |
| `user_roles` | Roles: `seller`, `executive`, `super_admin` |
| `saques` | Pedidos de saque: valor, chave PIX, status (`pendente`/`aprovado`/`rejeitado`), quem processou |
| `saldos_disponiveis` | Saldo por usuário: total comissões, liberado para saque, já sacado |
| `password_reset_requests` | Fluxo de reset com aprovação executiva: status `pending`/`approved`/`rejected` |
| `documents` | Documentos compartilhados: título, descrição, link, categoria |
| `document_categories` | Categorias de documentos (Vendas, Regimento, Operacional) |

### RLS (Row-Level Security)
- Vendedor só lê/escreve os próprios registros
- Executivo acessa todos os dados via função `is_executive()` (SECURITY DEFINER)
- Super admin: bypass por email hardcoded na própria função

### Triggers e Funções
| Nome | O que faz |
|------|-----------|
| `handle_new_user()` | Cria `profiles` automaticamente no signup |
| `update_updated_at_column()` | Atualiza `updated_at` em todas as tabelas |
| `is_executive(user_id)` | Verifica role executive ou email de super admin |
| `process_withdrawal()` | Atualiza `saldos_disponiveis` ao aprovar saque |

---

## 4. AUTENTICAÇÃO E ROLES

- **Auth:** Supabase Auth (JWT, email + senha)
- **Roles:** `seller` (padrão no cadastro), `executive`, `super_admin`
- **Super admins hardcoded por email:** `fecass1507@icloud.com`, `bakersinclairc@gmail.com`
- **Comissão especial:** `bakersinclairc@gmail.com` → 100% de comissão (padrão = 10%)
- **Heartbeat:** hook `useAuth` atualiza `last_seen_at` a cada 5 min (controle de sessão executivo)
- **Reset de senha:** fluxo proprietário — vendedor solicita → executivo aprova na tabela `password_reset_requests`

---

## 5. ROTAS

| Rota | Acesso | Função |
|------|--------|--------|
| `/auth` | Público | Login / Cadastro |
| `/email-confirmation` | Público | Verificação de email pós-cadastro |
| `/reset-password` | Público | Redefinição de senha |
| `/` | Vendedor | Redireciona para `/dashboard` |
| `/dashboard` | Vendedor | Dashboard individual |
| `/executive` | Executivo | Dashboard gerencial |
| `/ranking` | Vendedor | Leaderboard do time |
| `/vendas` | Vendedor | Lista de vendas + total de receita |
| `/vendas/nova` | Vendedor | Formulário de registro de venda |
| `/abordagens` | Vendedor | Lista de abordagens |
| `/abordagens/nova` | Vendedor | Formulário de nova abordagem |
| `/clientes` | Vendedor | Gestão de assinaturas e clientes |
| `/documentos` | Vendedor | Biblioteca de documentos compartilhados |
| `/formularios` | Vendedor | Hub de navegação para formulários |
| `/workboard` | Vendedor | Metas semanais (5) e mensais (20) com progresso |
| `/perfil` | Vendedor | Atualizar nome, avatar, senha |
| `/configuracoes` | Vendedor | Tema (claro/escuro/sistema), logout |
| `/team-members` | Executivo | Gerenciar time, sessões, saques |
| `*` | Qualquer | 404 |

**Guards:**
- `<ProtectedRoute>` → redireciona não-autenticados para `/auth`
- `<ExecutiveProtectedRoute>` → checa `isExecutive || isSuperAdmin`, exibe "Acesso negado" se falso

---

## 6. HOOKS (LÓGICA DE DADOS)

| Hook | Dados / Responsabilidade |
|------|--------------------------|
| `useAuth` | Sessão, login/logout, heartbeat (`last_seen_at`) |
| `useRoles` | `isExecutive`, `isSuperAdmin` |
| `useDashboardData(period)` | KPIs individuais por período: vendas, ticket médio, abordagens, conversão %, top produtos, gráfico 6 meses |
| `useCommissionData` | Total ganho, disponível para saque, sacado, pendente; rate 10% ou 100% por email |
| `useExecutiveDashboard(period)` | KPIs do time: vendedores, receita, conversão, abordagens, assinaturas, top sellers, atividade recente |
| `useRankingDataWithMock` | Leaderboard: dados reais + 8 vendedores mock hardcoded, ordenados por total de vendas |
| `useProfile` | Perfil com cache em localStorage |
| `useDocuments` | CRUD de documentos e categorias |
| `useWithdrawData` | Histórico e estado dos saques |

---

## 7. DASHBOARD INDIVIDUAL vs EXECUTIVO

### Dashboard Individual (`/dashboard`)
- KPIs: total vendas, qtd, ticket médio, abordagens, conversão %, comissão disponível
- Filtros de período: hoje · ontem · 7d · 14d · 30d · 60d · 90d
- Gráfico: vendas + abordagens nos últimos 6 meses (2 séries, Recharts)
- Card de comissão com botão de saque → abre `WithdrawDialog`
- Atalhos rápidos (`QuickActions`): nova venda, nova abordagem, ranking, documentos

### Dashboard Executivo (`/executive`)
- KPIs do time: total vendedores, receita, conversão, abordagens, assinaturas (ativas/total)
- Filtros de período idênticos ao individual
- Gráfico: vendas por dia dos últimos 7 dias
- Seções dedicadas:
  - **Gestão de usuários** — adicionar membros, atribuir roles
  - **Controle de sessões** — ver `last_seen_at`, forçar logout
  - **Detalhes por vendedor** — drill-down individual
  - **Aprovação de saques** — revisar pendentes, aprovar ou rejeitar
  - **Atividade recente** — feed agregado: vendas, abordagens, assinaturas, saques

---

## 8. COMPONENTES NOTÁVEIS

| Componente | Função |
|-----------|--------|
| `DashboardLayout` + `AppSidebar` | Layout base com nav lateral (vendedor) |
| `ExecutiveAppSidebar` | Nav lateral do executivo |
| `MetricCard` | KPI com ícone, valor, tendência, gradient opcional |
| `FilterTabs` | Seletor de período reutilizável |
| `SalesChart` | Gráfico de tendência (Recharts, 2 séries) |
| `CommissionCard` | Exibe comissão + botão de saque |
| `WithdrawDialog` | Modal de solicitação de saque (valor + chave PIX) |
| `ExecutiveUserManagement` | CRUD de usuários e roles |
| `ExecutiveSessionControl` | Monitor de sessões + force logout |
| `ExecutiveWithdrawalManagement` | Fila de saques pendentes com aprovação |
| `ErrorBoundary` | Boundary global de erros React |

---

## 9. ESTADO ATUAL

### ✅ Funcionando
- CRUD: vendas, abordagens, assinaturas, clientes
- Auth: signup, login, logout, verificação de email
- Cálculo e rastreamento de comissões
- Fluxo completo de saque
- Supervisão executiva (usuários, sessões, saques)
- Ranking com dados reais
- Perfil: avatar (Supabase Storage bucket `avatars`), nome, senha
- Tema claro/escuro/sistema

### ⚠️ Parcial / Mock
| Feature | Situação |
|---------|----------|
| Ranking | 8 vendedores mock hardcoded misturados com dados reais |
| Documentos | Categorias existem; conteúdo é placeholder |
| WorkBoard | Metas fixas no código (5/sem, 20/mês); sem CRUD de metas |

### 🔴 Dívidas Técnicas
- Taxa de comissão hardcoded por email (deveria ser coluna em `user_roles` ou `profiles`)
- Super admin via email bypass na função SQL (deveria ser a role `super_admin` da tabela)
- Chave anon do Supabase hardcoded no cliente front-end
- Sem paginação nas listagens de vendas e abordagens
- Sem logging estruturado de erros (apenas `toast` genérico)
- Mock data do ranking misturado com real data (pode confundir métricas)

---

## 10. VARIÁVEIS DE AMBIENTE / CONFIGURAÇÃO

```
VITE_SUPABASE_URL=https://mbzwchnxtskysqplqiyy.supabase.co
VITE_SUPABASE_ANON_KEY=<key hardcoded em src/integrations/supabase/client.ts>
```

> ⚠️ A anon key está hardcoded no source — mover para `.env` é uma dívida pendente.

---

## 11. ESTRUTURA DE ARQUIVOS RELEVANTES

```
src/
├── pages/          # Uma page por rota
├── components/
│   ├── dashboard/  # Componentes do dashboard individual
│   ├── executive/  # Componentes do painel executivo
│   ├── documents/  # AddDocumentDialog, EditDocumentDialog
│   ├── team/       # TeamMembersPage
│   ├── layout/     # DashboardLayout, sidebars
│   └── ui/         # shadcn/ui components
├── hooks/          # Toda a lógica de dados (React Query)
├── contexts/       # ThemeContext
├── integrations/
│   └── supabase/   # client.ts + types gerados
└── lib/
    └── utils.ts    # cn() helper (clsx + tailwind-merge)

supabase/
├── migrations/     # 15+ migrations SQL incrementais
├── functions/      # Edge Functions: force-logout, reset-user-password, send-password-reset
└── seed_dino_historico.sql  # Seed de histórico para usuário "Dino"
```
