import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

// Setores (perfis de acesso). mobile = usa celular em campo.
const SETORES = [
  { codigo: "gestao", nome: "Gestão / PCP", ordem: 1, mobile: false },
  { codigo: "vendas", nome: "Vendas / Pré-venda", ordem: 2, mobile: false },
  { codigo: "financeiro", nome: "Financeiro / Contrato", ordem: 3, mobile: false },
  { codigo: "almoxarifado", nome: "Almoxarifado", ordem: 4, mobile: true },
  { codigo: "compras", nome: "Compras", ordem: 5, mobile: false },
  { codigo: "producao", nome: "Produção", ordem: 6, mobile: false },
  { codigo: "instalacao", nome: "Instalação", ordem: 7, mobile: true },
];

// Mapa: área da planilha -> setor do app
const AREA_PARA_SETOR: Record<string, string> = {
  "Pré-venda": "vendas",
  Contrato: "financeiro",
  Almoxarifado: "almoxarifado",
  Compras: "compras",
  Produção: "producao",
  Instalação: "instalacao",
  "Pós-venda": "financeiro",
};

// As 33 etapas, extraídas de Alumy_Processos_PCP.xlsx
// [numero, codigo, nome, area, prazoMin, prazoMax, dependencias, isGargalo, observacoes]
const ETAPAS: [number, string, string, string, number, number, string, boolean, string][] = [
  [1, "lead_recebido", "Lead Recebido", "Pré-venda", 0, 0, "—", false, "Canal: Instagram, site ou indicação"],
  [2, "proposta_elaborada", "Proposta Elaborada no wVetro", "Pré-venda", 1, 2, "01", true, "Pessoa técnica lança no wVetro — gargalo de velocidade"],
  [3, "proposta_enviada", "Proposta Enviada ao Cliente", "Pré-venda", 0, 0, "02", false, "Envio por WhatsApp ou e-mail — sem apresentação formal (problema atual)"],
  [4, "negociacao", "Em Negociação", "Pré-venda", 3, 7, "03", true, "GARGALO: taxa de fechamento < 10% — sem follow-up estruturado"],
  [5, "contrato_assinado", "Contrato Assinado + Entrada", "Pré-venda", 1, 1, "04", false, "Vendedora emite contrato; Daiana gera a entrada"],
  [6, "contrato_enviado", "Contrato Enviado para Produção", "Contrato", 1, 1, "05", false, "Daiana fatura no wVetro e envia para área de obras"],
  [7, "boletos_agendados", "Boletos Agendados", "Contrato", 1, 1, "06", false, "Daiana gera boletos de todas as parcelas da obra"],
  [8, "proposta_aprovada", "Obra Aprovada — Liberada para Compras", "Contrato", 1, 1, "07", false, "Marco: a partir daqui compras e medição rodam em PARALELO"],
  [9, "separacao_perfis", "Separação de Perfis nos Cavaletes", "Almoxarifado", 3, 3, "08", false, "Separa perfis disponíveis em estoque por obra"],
  [10, "separacao_acessorios", "Separação de Acessórios", "Almoxarifado", 3, 3, "08", false, "Parafusos, silicone, borracha, roldanas, fechaduras, kremona, puxadores"],
  [11, "relacao_faltantes", "Levantamento de Itens Faltantes", "Almoxarifado", 2, 2, "09, 10", true, "GARGALO: depende de pessoa técnica para identificar e quantificar"],
  [12, "comprando_faltantes", "Comprando Itens Faltantes", "Compras", 3, 3, "11", true, "GARGALO: cotação manual com múltiplos fornecedores — processo lento"],
  [13, "aguardando_compra_perfis", "Aguardando Entrega de Perfis", "Compras", 15, 15, "12", true, "GARGALO CRÍTICO: lead time médio de fornecedores = 15 dias úteis"],
  [14, "aguardando_compra_acess", "Aguardando Entrega de Acessórios", "Compras", 10, 10, "12", false, "Lead time de acessórios geralmente menor que perfis"],
  [15, "enviado_pintura", "Perfis Enviados para Pintura", "Almoxarifado", 1, 1, "13", false, "Pintura é terceirizada — enviar assim que perfis chegarem"],
  [16, "recebido_pintura", "Retorno da Pintura — Conferência", "Almoxarifado", 7, 7, "15", true, "GARGALO: terceirizado, prazo médio 7 dias (variável, sem controle)"],
  [17, "liberado_producao_mat", "Materiais Liberados para Produção", "Almoxarifado", 1, 1, "14, 16", false, "Perfis pintados + acessórios completos = liberado para produção"],
  [18, "medicao_final", "Medição Final na Obra", "Instalação", 3, 3, "08", false, "PARALELO com compras — iniciar logo após aprovação da obra"],
  [19, "providenciando_vidros", "Pedido de Vidros Após Medição", "Compras", 7, 7, "18", true, "GARGALO CRÍTICO: vidro só pedido na montagem hoje — DEVE ser imediatamente após medição"],
  [20, "liberado_producao", "Obra Liberada para Produção", "Produção", 1, 1, "17, 18", false, "Nayla lança medidas finais no wVetro e imprime relatórios (corte, acessórios, montagem, vidro)"],
  [21, "corte_perfis", "Corte de Perfis", "Produção", 3, 3, "20", false, "Corte baseado no relatório de corte gerado pelo wVetro"],
  [22, "usinagem", "Usinagem (furos, encaixes, fechaduras)", "Produção", 2, 2, "21", false, "Usinagem realizada após corte dos perfis"],
  [23, "montagem_esquadrias", "Montagem das Esquadrias", "Produção", 5, 5, "22", false, "Prazo médio — varia por quantidade e complexidade do pedido"],
  [24, "colocacao_vidros", "Colocação de Vidros nas Esquadrias", "Produção", 1, 1, "19, 23", true, "GARGALO: depende do vidro ter chegado — se atrasar, trava a produção"],
  [25, "embalagem_armazenamento", "Embalagem e Armazenamento", "Almoxarifado", 1, 1, "24", false, "Embalar e armazenar até a data agendada de instalação"],
  [26, "liberado_instalacao", "Liberado para Instalação", "Instalação", 1, 1, "25", false, "Nayla libera a agenda de instalação da obra"],
  [27, "instalacao_agendada", "Instalação Agendada", "Instalação", 3, 3, "26", false, "PROBLEMA ATUAL: cliente avisado só no dia — mínimo 3 dias de antecedência"],
  [28, "instalacao_concluida", "Instalação Executada no Campo", "Instalação", 1, 1, "27", false, "Equipe instala, tira fotos, registra relato — hoje via grupo WhatsApp (sem controle)"],
  [29, "pendencias_resolvidas", "Pendências de Campo Resolvidas", "Instalação", 3, 7, "28", true, "GARGALO: 35 frentes/semana sem controle centralizado — Nayla sobrecarregada"],
  [30, "liberado_arquivo", "Liberado para Arquivo", "Pós-venda", 2, 2, "29", false, "Verificar pagamento final — vinculado à entrega da obra"],
  [31, "termo_entrega_assinado", "Termo de Entrega Assinado pelo Cliente", "Pós-venda", 1, 1, "28", false, "PROBLEMA ATUAL: entrega feita por telefone — sem documento assinado pelo cliente"],
  [32, "nps_enviado", "Pesquisa NPS Enviada ao Cliente", "Pós-venda", 7, 7, "31", false, 'Enviar 7 dias após entrega: "De 0 a 10, quanto indicaria a Alumy?"'],
  [33, "concluido", "Obra Concluída e Arquivada", "Pós-venda", 1, 1, "30, 32", false, "Arquivamento digital (Google Drive) + físico — obra encerrada no sistema"],
];

// Equipe inicial (a Gestão pode editar/criar depois pelo painel admin).
const USUARIOS = [
  { username: "nayla", nome: "Nayla", isAdmin: true, setores: ["gestao", "vendas"] },
  { username: "bianca", nome: "Bianca", isAdmin: true, setores: ["gestao", "vendas"] },
  { username: "thais", nome: "Thais", isAdmin: false, setores: ["vendas"] },
  { username: "daiana", nome: "Daiana", isAdmin: false, setores: ["financeiro"] },
  { username: "eduardo", nome: "Eduardo", isAdmin: false, setores: ["almoxarifado"] },
  { username: "kauana", nome: "Kauana", isAdmin: false, setores: ["almoxarifado"] },
  { username: "taina", nome: "Taina", isAdmin: false, setores: ["compras"] },
  { username: "producao", nome: "Equipe de Produção", isAdmin: false, setores: ["producao"] },
  { username: "instalacao", nome: "Equipe de Instalação", isAdmin: false, setores: ["instalacao"] },
];

async function main() {
  console.log("🌱 Semeando banco do Alumy PCP...");

  // Setores
  const setorPorCodigo: Record<string, number> = {};
  for (const s of SETORES) {
    const setor = await prisma.setor.upsert({
      where: { codigo: s.codigo },
      update: { nome: s.nome, ordem: s.ordem, mobile: s.mobile },
      create: s,
    });
    setorPorCodigo[s.codigo] = setor.id;
  }
  console.log(`  ✅ ${SETORES.length} setores`);

  // Etapas (catálogo)
  for (const [numero, codigo, nome, area, prazoMin, prazoMax, deps, gargalo, obs] of ETAPAS) {
    const setorCodigo = AREA_PARA_SETOR[area];
    await prisma.etapaTemplate.upsert({
      where: { numero },
      update: {
        codigo, nome, areaOriginal: area, setorId: setorPorCodigo[setorCodigo],
        prazoMin, prazoMax, dependencias: deps, observacoes: obs, isGargalo: gargalo,
      },
      create: {
        numero, codigo, nome, areaOriginal: area, setorId: setorPorCodigo[setorCodigo],
        prazoMin, prazoMax, dependencias: deps, observacoes: obs, isGargalo: gargalo,
      },
    });
  }
  console.log(`  ✅ ${ETAPAS.length} etapas (catálogo)`);

  // Usuários iniciais
  const senhaPadrao = process.env.SEED_ADMIN_PASSWORD || "alumy123";
  const senhaHash = await bcrypt.hash(senhaPadrao, 10);
  for (const u of USUARIOS) {
    const usuario = await prisma.usuario.upsert({
      where: { username: u.username },
      update: { nome: u.nome, isAdmin: u.isAdmin },
      create: { username: u.username, nome: u.nome, isAdmin: u.isAdmin, senhaHash },
    });
    // (re)vincula setores
    await prisma.usuarioSetor.deleteMany({ where: { usuarioId: usuario.id } });
    for (const codigo of u.setores) {
      await prisma.usuarioSetor.create({
        data: { usuarioId: usuario.id, setorId: setorPorCodigo[codigo] },
      });
    }
  }
  console.log(`  ✅ ${USUARIOS.length} usuários (senha padrão: "${senhaPadrao}")`);
  console.log("✨ Seed concluído. Acesse com usuário 'nayla'.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
