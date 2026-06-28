import { prisma } from "./prisma";

// Cria uma obra e instancia as 33 etapas (a partir do catálogo EtapaTemplate).
export async function criarObraComEtapas(dados: {
  clienteNome: string;
  clienteContato?: string;
  endereco?: string;
  descricao?: string;
  criadoPorId: number;
}) {
  // Próximo código sequencial OBRA-0001
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
      criadoPorId: dados.criadoPorId,
      etapas: {
        create: templates.map((t) => ({ templateId: t.id, status: "pendente" })),
      },
    },
  });

  return obra;
}
