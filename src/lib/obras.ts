import { prisma } from "./prisma";

export async function criarObraComEtapas(dados: {
  clienteNome: string;
  clienteContato?: string;
  endereco?: string;
  descricao?: string;
  dataInstalacao?: Date;
  criadoPorId: number;
}) {
  const ultima = await prisma.obra.findFirst({ orderBy: { id: "desc" } });
  const proximo = (ultima?.id ?? 0) + 1;
  const codigo = `OBRA-${String(proximo).padStart(4, "0")}`;

  const templates = await prisma.etapaTemplate.findMany({ orderBy: { numero: "asc" } });

  const obra = await prisma.obra.create({
    data: {
      codigo,
      clienteNome: dados.clienteNome,
      clienteContato: dados.clienteContato ?? "",
      endereco: dados.endereco ?? "",
      descricao: dados.descricao ?? "",
      dataInstalacao: dados.dataInstalacao ?? null,
      criadoPorId: dados.criadoPorId,
      etapas: {
        create: templates.map((t) => ({ templateId: t.id, status: "pendente" })),
      },
    },
  });

  return obra;
}
