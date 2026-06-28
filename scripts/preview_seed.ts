// Cria uma obra de exemplo com andamento variado, para a prévia ter conteúdo real.
import { prisma } from "../src/lib/prisma";
import { criarObraComEtapas } from "../src/lib/obras";

async function main() {
  // remove obras de preview antigas
  await prisma.obra.deleteMany({ where: { clienteNome: { contains: "(Exemplo)" } } });

  const nayla = await prisma.usuario.findUnique({ where: { username: "nayla" } });
  const eduardo = await prisma.usuario.findUnique({ where: { username: "eduardo" } });
  if (!nayla) throw new Error("rode o seed antes");

  const obra = await criarObraComEtapas({
    clienteNome: "Maria Fernanda (Exemplo)",
    clienteContato: "(85) 98888-1234",
    endereco: "Av. Beira Mar, 1500 — Meireles, Fortaleza/CE",
    descricao: "4 janelas de correr + 1 porta de vidro temperado 8mm + 2 maxim-ar",
    criadoPorId: nayla.id,
  });

  const etapas = await prisma.etapaObra.findMany({
    where: { obraId: obra.id },
    include: { template: true },
    orderBy: { template: { numero: "asc" } },
  });

  // Conclui as etapas 1..12, deixa a 13 (aguardando perfis) travada,
  // e a 18 (medição) em andamento — para mostrar fluxo paralelo + gargalo.
  for (const e of etapas) {
    const n = e.template.numero;
    if (n <= 12) {
      await prisma.etapaObra.update({
        where: { id: e.id },
        data: { status: "concluida", iniciadoEm: new Date(Date.now() - n * 86400000), concluidoEm: new Date(Date.now() - (n - 1) * 86400000), responsavelId: nayla.id },
      });
    } else if (n === 13) {
      await prisma.etapaObra.update({ where: { id: e.id }, data: { status: "travada", iniciadoEm: new Date(), responsavelId: nayla.id } });
      await prisma.atualizacao.create({ data: { etapaObraId: e.id, usuarioId: nayla.id, tipo: "status", texto: "Status → Travada. Fornecedor atrasou os perfis — previsão +5 dias." } });
      await prisma.pendencia.create({ data: { obraId: obra.id, etapaObraId: e.id, descricao: "Cobrar fornecedor sobre lead time dos perfis (passou de 15 dias)", criadoPorId: nayla.id } });
    } else if (n === 18) {
      await prisma.etapaObra.update({ where: { id: e.id }, data: { status: "em_andamento", iniciadoEm: new Date(), responsavelId: eduardo?.id ?? nayla.id } });
      await prisma.atualizacao.create({ data: { etapaObraId: e.id, usuarioId: eduardo?.id ?? nayla.id, tipo: "comentario", texto: "Medição agendada com o cliente para amanhã 9h." } });
    }
  }

  console.log(`✅ Obra de exemplo criada: ${obra.codigo} (id ${obra.id})`);
  await prisma.$disconnect();
}

main().catch(async (e) => { console.error(e); await prisma.$disconnect(); process.exit(1); });
