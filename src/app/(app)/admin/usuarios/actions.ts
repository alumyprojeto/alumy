"use server";

import { revalidatePath } from "next/cache";
import { prisma } from "@/lib/prisma";
import { exigirAdmin } from "@/lib/sessao";
import { hashSenha } from "@/lib/auth";

export async function criarUsuarioAction(_prev: unknown, formData: FormData) {
  await exigirAdmin();

  const nome = String(formData.get("nome") || "").trim();
  const username = String(formData.get("username") || "").trim().toLowerCase();
  const senha = String(formData.get("senha") || "");
  const isAdmin = formData.get("isAdmin") === "on";
  const setores = formData.getAll("setores").map(String);

  if (!nome || !username || !senha) {
    return { erro: "Preencha nome, usuário e senha." };
  }
  if (senha.length < 4) {
    return { erro: "A senha precisa ter ao menos 4 caracteres." };
  }
  if (!/^[a-z0-9._-]+$/.test(username)) {
    return { erro: "Usuário só pode ter letras minúsculas, números, ponto, hífen e underline." };
  }

  const existe = await prisma.usuario.findUnique({ where: { username } });
  if (existe) return { erro: "Já existe um usuário com esse nome de acesso." };

  const setoresDb = await prisma.setor.findMany({ where: { codigo: { in: setores } } });

  await prisma.usuario.create({
    data: {
      nome,
      username,
      senhaHash: await hashSenha(senha),
      isAdmin,
      setores: { create: setoresDb.map((s) => ({ setorId: s.id })) },
    },
  });

  revalidatePath("/admin/usuarios");
  return { ok: true };
}

export async function atualizarSetoresAction(formData: FormData) {
  await exigirAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const isAdmin = formData.get("isAdmin") === "on";
  const setores = formData.getAll("setores").map(String);
  if (!usuarioId) return;

  const setoresDb = await prisma.setor.findMany({ where: { codigo: { in: setores } } });
  await prisma.usuarioSetor.deleteMany({ where: { usuarioId } });
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: {
      isAdmin,
      setores: { create: setoresDb.map((s) => ({ setorId: s.id })) },
    },
  });
  revalidatePath("/admin/usuarios");
}

export async function alternarAtivoAction(formData: FormData) {
  await exigirAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const ativo = formData.get("ativo") === "true";
  if (!usuarioId) return;
  await prisma.usuario.update({ where: { id: usuarioId }, data: { ativo: !ativo } });
  revalidatePath("/admin/usuarios");
}

export async function redefinirSenhaAction(formData: FormData) {
  await exigirAdmin();
  const usuarioId = Number(formData.get("usuarioId"));
  const senha = String(formData.get("senha") || "");
  if (!usuarioId || senha.length < 4) return;
  await prisma.usuario.update({
    where: { id: usuarioId },
    data: { senhaHash: await hashSenha(senha) },
  });
  revalidatePath("/admin/usuarios");
}
