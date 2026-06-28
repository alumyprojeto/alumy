"use server";

import { redirect } from "next/navigation";
import { verificarCredenciais, criarSessao } from "@/lib/auth";

export async function loginAction(_prev: unknown, formData: FormData) {
  const username = String(formData.get("username") || "");
  const senha = String(formData.get("senha") || "");

  if (!username || !senha) {
    return { erro: "Preencha usuário e senha." };
  }

  const usuario = await verificarCredenciais(username, senha);
  if (!usuario) {
    return { erro: "Usuário ou senha incorretos." };
  }

  await criarSessao({
    id: usuario.id,
    username: usuario.username,
    nome: usuario.nome,
    isAdmin: usuario.isAdmin,
    setores: usuario.setores.map((s) => s.setor.codigo),
  });

  redirect("/painel");
}
