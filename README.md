# Alumy PCP — Acompanhamento de Obras

Aplicativo web (e mobile, pelo navegador do celular) para acompanhar o ciclo de vida das obras da **Alumy Esquadrias** — da chegada do lead ao arquivamento. Substitui a planilha de PCP e os grupos de WhatsApp por um sistema com login, dashboard por setor e atualização de status, **fotos** e **pendências** direto do campo.

> Construído a partir do mapeamento de processos da Alumy (33 etapas, 7 setores). Veja `BLUEPRINT.md` para o detalhamento das decisões.

## Funcionalidades (MVP)

- 🔐 **Login** por usuário e senha. A gestão cria os acessos e define o setor de cada pessoa.
- 🧭 **Painel por setor** — cada funcionário vê a fila de etapas que dependem dele; a gestão vê tudo.
- 🏗️ **Obras** — cada obra gera automaticamente as **33 etapas** do processo, com prazos, dependências e marcação de gargalos.
- 📱 **Atualização em campo** — mudar status, escrever comentário, **tirar/anexar fotos** e **registrar pendências** (otimizado para celular em Instalação e Almoxarifado).
- ⚠️ **Pendências** centralizadas por obra, com resolução.
- 👥 **Administração de usuários** (gestão): criar, definir setores, ativar/desativar.

## Setores

Gestão/PCP (admin) · Vendas · Financeiro · Almoxarifado · Compras · Produção · Instalação.

## Stack

- **Next.js 14** (App Router) + **TypeScript**
- **Prisma** + **SQLite** (MVP). Trocável para **PostgreSQL** em produção.
- Autenticação própria (bcrypt + JWT em cookie httpOnly)
- **Tailwind CSS** (design system "Painel da Tata": creme + navy + púrpura)

## Como rodar no seu computador (passo a passo)

> Funciona em **Windows**, Mac e Linux. Não precisa saber programar — é só seguir na ordem.

### Passo 0 — Instalar o Node (uma vez só)

Se ainda não tem, baixe e instale o **Node.js LTS** em <https://nodejs.org> (botão "LTS").
Depois feche e reabra o terminal.

- **Windows:** abra o **Prompt de Comando** ou **PowerShell** (menu Iniciar → digite "cmd").
- **Mac/Linux:** abra o **Terminal**.

Para conferir se instalou, digite e dê Enter:
```bash
node --version
```
Deve aparecer algo como `v20.x` ou `v22.x`.

### Passo 1 — Entrar na pasta do projeto

```bash
cd caminho/para/alumy
```
(no Windows, ex.: `cd "G:\Meu Drive\...\alumy"`)

### Passo 2 — Instalar e preparar (dois comandos)

```bash
npm install
npm run setup
```

- `npm install` baixa o que o app precisa (demora 1–2 min na primeira vez).
- `npm run setup` cria o arquivo de configuração, monta o banco de dados e cadastra
  os 7 setores, as 33 etapas e a equipe inicial — **tudo automático**.

### Passo 3 — Ligar o app

```bash
npm run dev
```
Depois abra o navegador em **<http://localhost:3000>** e entre com o usuário **`nayla`**.

> Para acessar **pelo celular** na mesma rede Wi-Fi: o terminal mostra um endereço
> "Network" (ex.: `http://192.168.0.10:3000`) — abra esse endereço no navegador do celular.
> Para parar o app, volte ao terminal e aperte `Ctrl + C`.

### Acessos iniciais (criados pelo seed)

Senha padrão de todos: **`alumy123`** (troque depois). Usuários: `nayla` e `bianca` (gestão/admin), `thais` (vendas), `daiana` (financeiro), `eduardo` e `kauana` (almoxarifado), `taina` (compras), `producao`, `instalacao`.

> Entre como **`nayla`** para criar obras e gerenciar usuários.

## Build de produção

```bash
npm run build
npm run start
```

## Trocar para PostgreSQL (produção)

1. Em `prisma/schema.prisma`, mude `provider = "sqlite"` para `provider = "postgresql"`.
2. No `.env`, aponte `DATABASE_URL` para o seu Postgres:
   `DATABASE_URL="postgresql://usuario:senha@host:5432/alumy_pcp"`
3. Rode `npm run db:push && npm run db:seed`.

Recomendado para multi-usuário/produção (SQLite não aguenta concorrência).

## Scripts

| Comando | O que faz |
|---|---|
| `npm run dev` | Servidor de desenvolvimento |
| `npm run build` | Build de produção (gera o cliente Prisma + Next) |
| `npm run start` | Sobe o build de produção |
| `npm run db:push` | Cria/atualiza as tabelas a partir do schema |
| `npm run db:seed` | Popula setores, 33 etapas e equipe inicial |
| `npm run db:reset` | Recria o banco do zero e popula |

## Estrutura

```
prisma/
  schema.prisma     # modelo de dados
  seed.ts           # setores + 33 etapas + equipe
src/
  lib/              # prisma, auth, sessão, setores, obras
  app/
    login/          # tela de login
    (app)/
      painel/       # dashboard por setor
      obras/        # lista, nova, detalhe (timeline) + atualização de etapa
      admin/        # gestão de usuários
scripts/
  smoke_test.ts     # teste da lógica (login, obra→33 etapas, foto, pendência)
```

## Próximos passos (fora do MVP)

Automações sugeridas no mapeamento (Fase 5 do BLUEPRINT): follow-up de propostas, aviso de instalação ao cliente com antecedência (WhatsApp/Evolution), termo de entrega assinado, NPS automático, alertas de gargalo (lead time de perfis/vidros). Deploy em VPS com domínio próprio.
