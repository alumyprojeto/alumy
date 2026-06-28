// Teste de fumaça da lógica do app contra o banco real.
import { prisma } from "../src/lib/prisma";
import { verificarCredenciais } from "../src/lib/auth";
import { criarObraComEtapas } from "../src/lib/obras";

async function main() {
  let falhas = 0;
  const ok = (cond: boolean, msg: string) => {
    console.log(`${cond ? "✅" : "❌"} ${msg}`);
    if (!cond) falhas++;
  };

  // 1. Login correto e incorreto
  const loginOk = await verificarCredenciais("nayla", process.env.SEED_ADMIN_PASSWORD || "alumy123");
  ok(!!loginOk && loginOk.isAdmin, "Login da Nayla (admin) funciona");
  const loginBad = await verificarCredenciais("nayla", "senha-errada");
  ok(loginBad === null, "Login com senha errada é rejeitado");

  const eduardo = await verificarCredenciais("eduardo", "alumy123");
  ok(
    !!eduardo && !eduardo.isAdmin && eduardo.setores.some((s) => s.setor.codigo === "almoxarifado"),
    "Eduardo entra como Almoxarifado (não-admin)"
  );

  // 2. Criar obra gera 33 etapas
  const obra = await criarObraComEtapas({
    clienteNome: "Cliente Teste Smoke",
    clienteContato: "(11) 99999-0000",
    endereco: "Rua de Teste, 123",
    criadoPorId: loginOk!.id,
  });
  const etapas = await prisma.etapaObra.findMany({
    where: { obraId: obra.id },
    include: { template: { include: { setor: true } } },
    orderBy: { template: { numero: "asc" } },
  });
  ok(etapas.length === 33, `Obra ${obra.codigo} criada com 33 etapas (got ${etapas.length})`);
  ok(etapas[0].template.setor.codigo === "vendas", "Etapa 1 (Lead) é do setor Vendas");
  ok(
    etapas.some((e) => e.template.setor.codigo === "instalacao" && e.template.isGargalo),
    "Existe etapa de Instalação marcada como gargalo"
  );

  // 3. Atualizar uma etapa de instalação: status + atualização + foto + pendência
  const etapaInst = etapas.find((e) => e.template.codigo === "instalacao_concluida")!;
  await prisma.etapaObra.update({
    where: { id: etapaInst.id },
    data: { status: "em_andamento", iniciadoEm: new Date(), responsavelId: loginOk!.id },
  });
  await prisma.atualizacao.create({
    data: { etapaObraId: etapaInst.id, usuarioId: loginOk!.id, tipo: "status", texto: "Status → Em andamento. Equipe na obra." },
  });
  await prisma.foto.create({
    data: { dados: "data:image/png;base64,iVBORw0KGgo=", etapaObraId: etapaInst.id, usuarioId: loginOk!.id },
  });
  const pend = await prisma.pendencia.create({
    data: { obraId: obra.id, etapaObraId: etapaInst.id, descricao: "Faltou 1 vidro temperado 8mm", criadoPorId: loginOk!.id },
  });
  const recarregada = await prisma.etapaObra.findUnique({
    where: { id: etapaInst.id },
    include: { atualizacoes: true, fotos: true, pendencias: true },
  });
  ok(recarregada?.status === "em_andamento", "Status da etapa atualizado para em_andamento");
  ok((recarregada?.atualizacoes.length ?? 0) >= 1, "Atualização registrada na timeline");
  ok((recarregada?.fotos.length ?? 0) >= 1, "Foto vinculada à etapa");
  ok((recarregada?.pendencias.length ?? 0) >= 1, "Pendência registrada");

  // 4. Resolver pendência
  await prisma.pendencia.update({ where: { id: pend.id }, data: { status: "resolvida", resolvidoEm: new Date() } });
  const pendResolvida = await prisma.pendencia.findUnique({ where: { id: pend.id } });
  ok(pendResolvida?.status === "resolvida", "Pendência marcada como resolvida");

  // 5. Limpeza do teste
  await prisma.obra.delete({ where: { id: obra.id } });
  const sumiu = await prisma.obra.findUnique({ where: { id: obra.id } });
  ok(sumiu === null, "Obra de teste removida (cascata de etapas/fotos/pendências)");

  console.log(falhas === 0 ? "\n🎉 Todos os testes passaram!" : `\n⚠️ ${falhas} teste(s) falharam.`);
  await prisma.$disconnect();
  process.exit(falhas === 0 ? 0 : 1);
}

main().catch(async (e) => {
  console.error(e);
  await prisma.$disconnect();
  process.exit(1);
});
