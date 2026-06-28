# BLUEPRINT — App Alumy PCP

Memória viva do projeto. Cada fase aprovada é registrada aqui. É o contrato do que será construído.

## Visão geral

Aplicativo web (acessível pelo navegador e pelo celular) para acompanhar o ciclo de vida das obras da **Alumy Esquadrias** — da chegada do lead ao arquivamento. Substitui a planilha + grupos de WhatsApp por um sistema com login, dashboard por setor e atualização de status/fotos/pendências em campo.

Origem: `Alumy_Processos_PCP.xlsx` (33 etapas) + `Alumy_Esquadrias_Mapeamento_Processos.docx` (equipe, gargalos, plano de ação).

## Fase 2 — Processo (APROVADO)

**O que a planilha faz:** documenta as 33 etapas sequenciais de uma obra, em 7 áreas, com prazos, dependências e gargalos.

**Entidades:**
- **Obra** — entidade central (pedido de um cliente). Percorre as 33 etapas.
- **EtapaTemplate** — catálogo fixo das 33 etapas (nº, código, nome, área, prazo, dependências, observações, gargalo).
- **EtapaObra** — instância de uma etapa numa obra (status, responsável, datas, observação).
- **Cliente** — dados embutidos na obra (MVP).
- **Usuário** — colaborador da Alumy, com setor(es).
- **Atualização / Foto / Pendência** — registros de campo sobre uma etapa.

**Fluxo:** LEAD → PROPOSTA → NEGOCIAÇÃO → CONTRATO → (COMPRAS + MEDIÇÃO em paralelo) → MATERIAIS/PINTURA/VIDROS → PRODUÇÃO (corte→usinagem→montagem→vidração) → EMBALAGEM → INSTALAÇÃO → PENDÊNCIAS → NPS → ARQUIVO.

**Caminho crítico:** 68–90 dias (lead→arquivo); 35–45 dias (aprovação→entrega).

## Fase 4 — Usuários & Permissões (APROVADO)

**Perfil:** C (empresa com papéis / RBAC por setor).

**Cadastro:** a Gestão (admin) cria os usuários e define o(s) setor(es). Não há auto-cadastro.

**Autenticação:** usuário + senha (hash bcrypt), sessão por cookie httpOnly (JWT).

**Setores (perfis):**
| Código | Nome | Pessoas | Acesso |
|---|---|---|---|
| gestao | Gestão / PCP (admin) | Nayla, Bianca | Vê tudo, cria obras/usuários, agenda e pendências |
| vendas | Vendas / Pré-venda | Vendedora, Bianca, Thais | Leads, propostas, negociação, follow-up |
| financeiro | Financeiro / Contrato | Daiana | Contratos, boletos, faturamento, pós-venda |
| almoxarifado | Almoxarifado | Eduardo, Kauana | 📱 Separação, faltantes, pintura, embalagem |
| compras | Compras | Taina | Cotação, pedidos, lead times |
| producao | Produção | Equipe de produção | Corte, usinagem, montagem, vidração |
| instalacao | Instalação (campo) | 7 equipes | 📱 Status, fotos, pendências, termo de entrega |

- Usuário pode ter mais de um setor (ex.: Bianca em Gestão + Vendas).
- Admin (gestao) enxerga todos os setores.
- 📱 = setores que usam celular em campo (UI mobile-first).

**Mapa área da planilha → setor do app:**
Pré-venda→vendas · Contrato→financeiro · Almoxarifado→almoxarifado · Compras→compras · Produção→producao · Instalação→instalacao · Pós-venda→financeiro.

## Decisões de escopo (MVP)

1. **Foco do MVP:** login + dashboard por setor + acompanhamento de obras com atualização de status, **fotos** e **pendências** pelo celular (ênfase em Instalação e Almoxarifado).
2. **Entrega:** app completo no repositório GitHub, pronto para publicar depois. Deploy fica como passo seguinte.

## Fase 6 — Interface (em definição)

- **Design system:** Painel da Tata — paleta creme + navy + púrpura; tipografia Montserrat (UI) + Cormorant (títulos).
- **Mobile-first** nos fluxos de campo.
- **Telas:** Login · Dashboard por setor · Lista de obras · Detalhe da obra (timeline das 33 etapas) · Atualizar etapa (status + foto + pendência) · Admin (usuários + nova obra).

## Fase 7 — Stack & Arquitetura

| Camada | Escolha |
|---|---|
| Framework | Next.js 14 (App Router) + TypeScript |
| Banco | SQLite via Prisma (MVP). Trocável para PostgreSQL na produção. |
| Auth | Custom (bcryptjs + JWT em cookie httpOnly) |
| UI | Tailwind CSS (tokens Painel da Tata) |
| Fotos | Upload salvo em disco (`/public/uploads`), caminho no banco |

**Por que SQLite no MVP:** roda sem servidor de banco, fácil de subir e testar. Para produção multi-usuário, trocar `provider` do Prisma para `postgresql` (instruções no README).
