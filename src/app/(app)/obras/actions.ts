"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { writeFile, mkdir } from "fs/promises";
import path from "path";
import { prisma } from "@/lib/prisma";
import { exigirSessao, exigirAdmin } from "@/lib/sessao";
import { podeVerSetor } from "@/lib/auth";
import { criarObraComEtapas } from "@/lib/obras";

// ----- Criar obra (admin) -----
export async function criarObraAction(_prev: unknown, formData: FormData) {
  const sessao = await exigirAdmin();
  const clienteNome = String(formData.get("clienteNome") || "").trim();
  if (!clienteNome) return { erro: "Informe o nome do cliente." };

  const obra = await criarObraComEtapas({
    clienteNome,
    clienteContato: String(formData.get("clienteContato") || "").trim(),
    endereco: String(formData.get("endereco") || "").trim(),
    descricao: String(formData.get("descricao") || "").trim(),
    criadoPorId: sessao.id,
  });

  revalidatePath("/obras");
  redirect(`/obras/${obra.id}`);
}

// ----- Atualizar uma etapa: status + comentário + foto + pendência -----
export async function atualizarEtapaAction(_prev: unknown, formData: FormData) {
  const sessao = await exigirSessao();
  const etapaObraId = Number(formData.get("etapaObraId"));
  if (!etapaObraId) return { erro: "Etapa inválida." };

  const etapa = await prisma.etapaObra.findUnique({
    where: { id: etapaObraId },
    include: { template: { include: { setor: true } } },
  });
  if (!etapa) return { erro: "Etapa não encontrada." };

  // Permissão: só admin ou quem é do setor da etapa.
  if (!podeVerSetor(sessao, etapa.template.setor.codigo)) {
    return { erro: "Você não tem acesso a este setor." };
  }

  const novoStatus = String(formData.get("status") || etapa.status);
  const comentario = String(formData.get("comentario") || "").trim();
  const pendenciaTexto = String(formData.get("pendencia") || "").trim();

  // Atualiza status + marca datas
  const data: {
    status: string;
    iniciadoEm?: Date;
    concluidoEm?: Date | null;
    responsavelId?: number;
  } = { status: novoStatus };
  if (novoStatus !== "pendente" && !etapa.iniciadoEm) data.iniciadoEm = new Date();
  if (novoStatus === "concluida") data.concluidoEm = new Date();
  if (novoStatus !== "concluida") data.concluidoEm = null;
  data.responsavelId = sessao.id;

  await prisma.etapaObra.update({ where: { id: etapaObraId }, data });

  // Registra atualização (timeline) se houve mudança de status ou comentário
  const houveStatus = novoStatus !== etapa.status;
  let atualizacaoId: number | null = null;
  if (houveStatus || comentario) {
    const texto =
      (houveStatus ? `Status → ${rotuloStatus(novoStatus)}. ` : "") + comentario;
    const at = await prisma.atualizacao.create({
      data: {
        etapaObraId,
        usuarioId: sessao.id,
        tipo: houveStatus ? "status" : "comentario",
        texto: texto.trim(),
      },
    });
    atualizacaoId = at.id;
  }

  // Upload de fotos (campo "fotos", múltiplas)
  const fotos = formData.getAll("fotos").filter((f): f is File => f instanceof File && f.size > 0);
  if (fotos.length) {
    const dir = path.join(process.cwd(), "public", "uploads");
    await mkdir(dir, { recursive: true });
    for (const file of fotos) {
      const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
      const nome = `obra${etapa.obraId}-et${etapaObraId}-${Date.now()}-${Math.random()
        .toString(36)
        .slice(2, 8)}.${ext}`;
      const bytes = Buffer.from(await file.arrayBuffer());
      await writeFile(path.join(dir, nome), bytes);
      await prisma.foto.create({
        data: {
          caminho: `/uploads/${nome}`,
          etapaObraId,
          atualizacaoId: atualizacaoId ?? undefined,
          usuarioId: sessao.id,
        },
      });
    }
  }

  // Registra pendência (opcional)
  if (pendenciaTexto) {
    await prisma.pendencia.create({
      data: {
        obraId: etapa.obraId,
        etapaObraId,
        descricao: pendenciaTexto,
        criadoPorId: sessao.id,
      },
    });
  }

  revalidatePath(`/obras/${etapa.obraId}`);
  revalidatePath("/painel");
  return { ok: true };
}

// ----- Resolver pendência -----
export async function resolverPendenciaAction(formData: FormData) {
  const sessao = await exigirSessao();
  const id = Number(formData.get("pendenciaId"));
  const obraId = Number(formData.get("obraId"));
  if (!id) return;
  await prisma.pendencia.update({
    where: { id },
    data: { status: "resolvida", resolvidoEm: new Date() },
  });
  revalidatePath(`/obras/${obraId}`);
  revalidatePath("/painel");
}

function rotuloStatus(s: string) {
  return (
    { pendente: "Pendente", em_andamento: "Em andamento", concluida: "Concluída", travada: "Travada" }[
      s
    ] ?? s
  );
}
